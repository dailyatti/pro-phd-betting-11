/**
 * Vision Scraper Agent - PhD Level Enhanced (HARDENED)
 *
 * Goal: Extract ALL betting markets + odds from user screenshots.
 *
 * Supports: OpenAI GPT-4o / GPT-5.2 (vision) JSON-only output.
 *
 * @module agents/vision/visionScraper
 */

import axios from "axios";
import {
    isAbortError,
    normalizeImageToVisionUrl,
    isDataImageUrl,
    estimateBase64Bytes
} from "../common/helpers.js";

// Multi-module cleanup (Engineering Audit Phase 2)
import { validateMatchData, hasPrimaryOdds } from "./utils/matchValidator.js";

// ============================================================================
// COMPREHENSIVE VISION PROMPT - PH.D LEVEL (JSON ONLY)
// ============================================================================

/**
 * Generates the specific prompt for the Vision model.
 * @param {string|null} contextHint - Optional match label to focus on.
 * @returns {string} The full prompt string.
 */
const getVisionPrompt = (contextHint) => {
    const focusContext = contextHint
        ? `\nPRIORITY: Prefer the match "${contextHint}" if multiple appear in the image.`
        : "";

    return (
        `You are a Ph.D. Level Vision Analyst specialized in betting interfaces and UNIVERSAL TRANSLATION.
        
YOUR CORE MISSION: Extract EVERY single visible odd from the image and NORMALIZE IT TO ENGLISH.
You must understand ANY language (Hungarian, Spanish, German, etc.) and map it to standard English JSON keys.

INSTRUCTIONS:
1. **RAW SCAN**: First, dump EVERYTHING you see into "_raw_text_dump".
2. **UNIVERSAL TRANSLATION (POLYGLOT MODE)**:
   - **DETECT LANGUAGE**: Identify the language of the interface (e.g., Hungarian "Gólszám", German "Tore").
   - **TRANSLATE TO ENGLISH CONCEPT**:
     - "Hazai" / "Heim" -> **Home**
     - "Vendég" / "Gast" -> **Away**
     - "Döntetlen" / "Unentschieden" / "X" -> **Draw**
     - "Gólszám" / "Pontszám" -> **Total (Over/Under)**
     - "Mindkét csapat szerez gólt" -> **BTTS (Both Teams To Score)**
     - "Igen" -> **Yes**, "Nem" -> **No**
   - **OUTPUT STANDARDIZED JSON**: Regardless of the input language, your JSON output MUST use English keys and values (e.g., team names should be transliterated if needed, but standard betting terms must be standardized).

3. **SPATIAL REASONING**:
   - **Capture ALL Columns**: Betting sites often show 1X2, then Over/Under, then BTTS in a row. CAPTURE THEM ALL.
   - If you see a number in a box/cell next to a team name, it is almost certainly the odds for that team.
   - **HEURISTIC MAPPING**: If a number is positioned where a Draw would be (usually between Home and Away doboxes), map it to 'draw' (1X2).
   
4. **DECIMAL CONVERSION**: Convert American (+150), Fractional (5/2), or Comma (1,8) to clean Decimals (2.50, 3.50, 1.80). Always use DOT for decimals in JSON.

**NO-SKIP POLICY**: 
- If you see a number (~1.20 to ~500.0) near a team or market, you MUST include it in the 'odds' object. 
- **MANDATORY**: If ANY market is visible (Gólszám, BTTS, etc.), you MUST extract and normalize it.

` + focusContext + `

Return ONLY valid JSON in this exact shape:
{
  "_raw_text_dump": "...",
  "_sport_reasoning": "...",
  "matches": [
    {
      "sport": "...",
      "team_1": "Name in English/Latin characters",
      "team_2": "Name in English/Latin characters",
      "match_analysis_note": "Expert observation on visual layout and language detected...",
      "odds": {
        "homeWin": null, "draw": null, "awayWin": null,
        "homeML": null, "awayML": null,
        "totalLine": 2.5, "totalOver": null, "totalUnder": null,
        "bttsYes": null, "bttsNo": null,
        "homeSpread": null, "awaySpread": null, "spreadLine": null
    }
  ]
}`);
};

// ============================================================================
// PARSING & FLATTENING (HYBRID PARSER FIX)
// ============================================================================

/**
 * Hybrid Parser: Flattens odds from potentially nested OR flat structures.
 * Handles:
 * - odds.moneyline[0] (Array style)
 * - odds.homeWin (Flat style)
 * - American odds conversion
 * - Comma replacement
 */
/**
 * Hybrid Parser: Flattens odds from potentially nested OR flat structures.
 * Handles:
 * - odds.moneyline[0] (Array style)
 * - odds.homeWin (Flat style)
 * - American odds conversion
 * - Comma replacement
 * - Number-only fields for totals/spreads
 */
function flattenOdds(oddsObj) {
    const flat = {};
    if (!oddsObj || typeof oddsObj !== 'object') return flat;

    // Helper: Clean Value
    const clean = (v) => {
        if (v == null) return null;
        let s = String(v).replace(',', '.').trim();
        const n = Number(s);
        return Number.isFinite(n) ? n : null;
    };

    // 1. Primary Markets (Moneyline / 1X2)
    const ml = oddsObj.moneyline || oddsObj.h2h || [];
    const isArrayML = Array.isArray(ml) && ml.length >= 2;

    // Check flat keys first (GPT often prefers these)
    // MASTER PROMPT FIX: Check flat keys explicitly
    let home = clean(oddsObj.homeWin || oddsObj.homeML || oddsObj.home_win || (isArrayML ? ml[0] : null));
    let draw = clean(oddsObj.draw || oddsObj.drawML || oddsObj.draw_win || (isArrayML && ml.length === 3 ? ml[1] : null));
    let away = clean(oddsObj.awayWin || oddsObj.awayML || oddsObj.away_win || (isArrayML ? (ml.length === 3 ? ml[2] : ml[1]) : null));

    if (home) flat.homeWin = home;
    if (draw) flat.draw = draw;
    if (away) flat.awayWin = away;

    // 2. Totals
    // often returned as odds.over (number) or odds.total.over
    const t = oddsObj.total || {};
    let tLine = clean(oddsObj.totalLine || oddsObj.line || oddsObj.total_line || t.line);
    let tOver = clean(oddsObj.over || oddsObj.totalOver || oddsObj.total_over || t.over);
    let tUnder = clean(oddsObj.under || oddsObj.totalUnder || oddsObj.total_under || t.under);

    if (tLine !== null) flat.totalLine = tLine;
    if (tOver) flat.totalOver = tOver;
    if (tUnder) flat.totalUnder = tUnder;

    // Flattened structure for Engine
    if (tLine !== null && (tOver || tUnder)) {
        flat.total = { line: tLine, over: tOver, under: tUnder };
    }

    // 3. Spreads
    const s = oddsObj.spread || {};
    let sLine = clean(oddsObj.spreadLine || oddsObj.spread_line || s.line);
    let sHome = clean(oddsObj.homeSpread || oddsObj.home_spread || s.home);
    let sAway = clean(oddsObj.awaySpread || oddsObj.away_spread || s.away);

    if (sLine !== null) flat.spreadLine = sLine;
    if (sHome) flat.homeSpread = sHome;
    if (sAway) flat.awaySpread = sAway;

    if (sLine !== null && (sHome || sAway)) {
        flat.spread = { line: sLine, home: sHome, away: sAway };
    }

    // 4. BTTS
    let bYes = clean(oddsObj.bttsYes || oddsObj.yes || oddsObj.btts_yes);
    let bNo = clean(oddsObj.bttsNo || oddsObj.no || oddsObj.btts_no);

    if (bYes) flat.bttsYes = bYes;
    if (bNo) flat.bttsNo = bNo;

    return flat;
}


// ============================================================================
// NORMALIZATION
// ============================================================================

/**
 * Normalizes the raw vision output into structured match objects.
 * @param {Object} parsed - Raw JSON from GPT.
 * @returns {Object} Normalized output.
 */
const normalizeVisionOutput = (parsed) => {
    if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid vision output: not an object");
    }

    let matches = [];
    if (Array.isArray(parsed.matches)) {
        matches = parsed.matches;
    } else if (parsed.team_1 || parsed.team_2) {
        matches = [parsed];
    }

    if (!matches.length) {
        throw new Error("Vision output contains no matches.");
    }

    const outMatches = matches.map((match, idx) => {
        validateMatchData(match, idx);

        const sport = match.sport || "OTHER";
        // Call our Hybrid Parser
        const oddsFlat = flattenOdds(match.odds);

        // SOFT FAIL: If odds are missing, mark for Orchestrator to find them
        if (!hasPrimaryOdds(oddsFlat)) {
            console.warn(`Vision: No primary odds detected for match ${idx}. Marking for fallback.`);
            oddsFlat.oddsMissing = true;
        }

        return {
            ...match,
            sport,
            team_1: String(match.team_1 || "").trim(),
            team_2: String(match.team_2 || "").trim(),
            odds: oddsFlat,
            // Keep raw nested for debugging if needed
            odds_nested: match.odds || {},
            _raw_text_dump: parsed._raw_text_dump || ""
        };
    });

    return {
        ...parsed,
        matches: outMatches,
    };
};

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Main entry point for Vision Logic.
 * @param {object|string} config - Configuration object or API key string.
 * @param {string|string[]} imageBase64 - Base64 image string(s).
 * @param {AbortSignal} [signal] - Abort signal.
 * @param {string|null} [contextHint] - Optional context.
 * @returns {Promise<object>} Normalized match data.
 */
export const runVisionScraper = async (config, imageBase64, signal, contextHint = null) => {
    // 1. Determine Provider
    let provider = 'openai';
    let apiKey = '';
    let model = '';

    if (typeof config === "string") {
        apiKey = config;
        model = "gpt-4o";
    } else {
        if (config.provider === 'gemini') {
            provider = 'gemini';
            apiKey = (config.key || "").trim();
            model = config.model || "gemini-2.0-flash";
        } else {
            provider = 'openai';
            apiKey = (config.key || "").trim();
            model = config.model || "gpt-4o";
        }
    }

    if (!apiKey || apiKey.length < 5) throw new Error(`${provider.toUpperCase()} API Key is missing. Please check Settings.`);

    const visionPrompt = getVisionPrompt(contextHint);
    const images = Array.isArray(imageBase64) ? imageBase64 : [imageBase64];

    // Filter valid images
    const validImages = images.filter(Boolean);
    if (!validImages.length) throw new Error("No valid images provided for vision analysis.");

    try {
        let content = "";

        if (provider === 'openai') {
            const messageContent = [
                { type: "text", text: visionPrompt },
                ...validImages.map((img, idx) => {
                    const url = normalizeImageToVisionUrl(img, idx);
                    if (isDataImageUrl(url)) {
                        const b64 = url.split(",")[1] || "";
                        const bytes = estimateBase64Bytes(b64);
                        if (bytes < 50_000) {
                            console.warn(`[Vision WARNING] Image ${idx} seems very small (${bytes} bytes).`);
                        }
                    }
                    return {
                        type: "image_url",
                        image_url: { url, detail: "high" },
                    };
                }),
            ];
            const systemMessage = "You are a Ph.D. level sports betting analyst. Extract data exactly as requested.";

            const payload = {
                model,
                messages: [
                    { role: "system", content: systemMessage },
                    { role: "user", content: messageContent },
                ],
                max_completion_tokens: 4000,
                response_format: { type: "json_object" },
            };

            const res = await axios.post("/api/openai/chat/completions", payload, {
                headers: { Authorization: `Bearer ${apiKey}` },
                signal,
            });
            content = res.data?.choices?.[0]?.message?.content;

        } else if (provider === 'gemini') {
            // Google Gemini Logic
            // Construct multipart content with multiple images
            const imageParts = validImages.map(img => {
                const url = normalizeImageToVisionUrl(img);
                const base64Data = url.split(',')[1];
                const mimeType = url.split(';')[0].split(':')[1] || 'image/jpeg';
                return {
                    inline_data: {
                        mime_type: mimeType,
                        data: base64Data
                    }
                };
            });

            const geminiPayload = {
                model: model,
                contents: [{
                    parts: [
                        { text: visionPrompt + "\n\nRETURN JSON ONLY." },
                        ...imageParts
                    ]
                }],
                generationConfig: {
                    response_mime_type: "application/json"
                }
            };

            const res = await axios.post("/api/gemini/models/" + model + ":generateContent", geminiPayload, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                params: { key: apiKey },
                signal,
            });
            content = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        }

        if (!content) throw new Error(`Empty response from ${provider} Vision.`);

        // Clean markdown fences if any (Gemini loves ```json ... ```)
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanContent);

        return normalizeVisionOutput(parsed);

    } catch (e) {
        if (isAbortError(e, signal)) {
            throw new DOMException("Aborted", "AbortError");
        }
        console.error(`[VisionScraper] Failed (${provider}):`, e);
        throw new Error(`Vision Agent Failed (${provider}): ${e.message}`);
    }
};

/**
 * Vision Rescue: Re-scans image specifically for missing odds (User Request: "Dyslexic Assistant").
 * acts as a second pair of eyes.
 */
export const runVisionRescue = async (config, images, team1, team2, missingMarkets, signal) => {
    const openaiKey = typeof config === "string" ? config : config?.key;
    const openaiModel = typeof config === "object" && config.model ? config.model : "gpt-4o";
    if (!openaiKey) return null;

    const targetList = missingMarkets.join(", ");
    const rescuePrompt = `
    Hey buddy, I need your help. I'm having trouble reading the odds for this specific match:
    Match: "${team1}" vs "${team2}"
    
    I specifically can't find these numbers: [${targetList}].
    
    Can you look closely at the image again? They might be small, or in a different format (like American odds +150, or fractional 5/2).
    Please extract them for me.
    
    Return ONLY JSON:
    {
      "found": true/false,
      "odds": {
        "homeWin": 1.23, "draw": 4.50, "awayWin": 6.70
        // ... include only what you find
      },
      "note": "Where you found them or why they are missing"
    }
    `;

    const messageContent = [
        { type: "text", text: rescuePrompt },
        ...images.filter(Boolean).map((img, idx) => ({
            type: "image_url",
            image_url: { url: normalizeImageToVisionUrl(img, idx), detail: "high" }
        }))
    ];

    try {
        const res = await axios.post("/api/openai/chat/completions", {
            model: openaiModel,
            messages: [
                { role: "system", content: "You are a helpful assistant helping a user find specific numbers on a screen." },
                { role: "user", content: messageContent }
            ],
            response_format: { type: "json_object" },
            max_completion_tokens: 1000
        }, {
            headers: { Authorization: `Bearer ${openaiKey}` },
            signal
        });

        const content = res.data?.choices?.[0]?.message?.content;
        return content ? JSON.parse(content) : null;
    } catch (err) {
        console.warn("[VisionRescue] Failed:", err.message);
        return null;
    }
};

export default runVisionScraper;