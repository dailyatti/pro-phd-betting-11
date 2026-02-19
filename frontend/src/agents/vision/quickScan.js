/**
 * Quick Match Scan Agent — HARDENED (PhD-level robust)
 *
 * Netlify-compatible BYOK version:
 * - Calls /.netlify/functions/llm (single proxy endpoint)
 * - Sends user key via header (X-User-Api-Key)
 * - Provider/model/payload via body
 *
 * @module agents/vision/quickScan
 */

import axios from "axios";
import { tryParseJson, isAbortError, normalizeImageToVisionUrl, callLlmProxy } from "../common/helpers.js";

/**
 * @typedef {Object} QuickScanMatch
 * @property {string} sport - Sport type
 * @property {string|null} team_1 - First team/player name
 * @property {string|null} team_2 - Second team/player name
 * @property {string|null} tournament - Tournament name
 * @property {string|null} kickoff_time - "HH:MM" if visible
 * @property {string|null} kickoff_date - "YYYY-MM-DD" if visible
 * @property {boolean} [is_live] - True if in-play
 * @property {string|null} [live_score] - "2-1" or similar if visible
 * @property {string|number|null} [live_minute] - minute/period if visible
 * @property {string} matchId - Generated unique match ID
 * @property {string} matchLabel - Human-readable match label
 * @property {string} [error] - Error message if scan failed
 */

const QUICK_SCAN_PROMPT = `ACT AS: Fast Vision Pre-Scanner (Senior Sports Data Engineer).
Task: Identify ALL matches visible in this betting screenshot quickly.
Detect if it's a SINGLE match page or a LIST of matches.
Extract ONLY what is clearly visible. No guessing.

Rules:
- If team/player names are unreadable -> use null.
- Prefer exact names as shown.
- Identify sport type strictly (FOOTBALL, BASKETBALL, TENNIS, NFL, NHL, MLB, ESPORTS, OTHER).
- **UNIVERSAL TRANSLATION**: You are a Polyglot. Detect the language (English, Hungarian, Chinese, etc.) and AUTOMATICALLY map headers to standard English keys:
  - "Hazai"/"Home"/"1" -> home
  - "Döntetlen"/"Draw"/"X" -> draw
  - "Vendég"/"Away"/"2" -> away
- **FORMAT NORMALIZATION**: Convert ALL odds to DECIMAL format (e.g., "1,70" -> 1.70, "+150" -> 2.50).
- If tournament/league is visible, include it, otherwise null.
- If date/time is visible, include kickoff_date (YYYY-MM-DD) and kickoff_time (HH:MM).
- DETECT ODDS: You MUST scan the row HORIZONTALLY. Do NOT stop after the first block.
  - **CRITICAL**: Capture ALL visible market blocks (1X2, Spreads, Totals).
  - Return them in a "preview_odds" object:
    - **1X2 / Moneyline**: "home", "draw", "away" (or "homeML", "awayML" for US sports where no draw).
    - **Over/Under (Totals)**: "totalOver", "totalUnder", "totalLine" (Look for "Gólszám", "Pontszám", "O/U").
    - **BTTS**: "bttsYes", "bttsNo" (Look for "Mindkét csapat...", "Both Teams...").
    - **Handicap / Spread**: "homeSpread", "awaySpread", "spreadLine" (Look for "+/-" values like -5.5).
  - Convert commas to dots (1,50 -> 1.5).
- If match is live/in-play, set is_live=true.
- Return ONLY valid JSON. No markdown.

JSON SCHEMA:
{
  "matches": [
    {
      "sport": "FOOTBALL" | "BASKETBALL" | "TENNIS" | "NFL" | "NHL" | "MLB" | "ESPORTS" | "OTHER",
      "team_1": "string|null",
      "team_2": "string|null",
      "tournament": "string|null",
      "kickoff_time": "string|null",
      "kickoff_date": "string|null",
      "preview_odds": {
        "home": "number|null",
        "draw": "number|null",
        "away": "number|null"
      },
      "is_live": true|false,
      "live_score": "string|null",
      "live_minute": "string|number|null"
    }
  ]
}`;

// --------------------------------------------
// Helpers
// --------------------------------------------

const cleanName = (s) =>
  String(s ?? "")
    .trim()
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 120);

const slug = (s) =>
  String(s ?? "")
    .toLowerCase()
    .trim()
    .replace(/\uFEFF/g, "")
    .replace(/[\s._]+/g, "")
    .replace(/[^a-z0-9\-]/g, "");

const safeStringOrNull = (v) => {
  if (v === null || v === undefined) return null;
  const s = cleanName(v);
  return s.length ? s : null;
};

const safeBool = (v, fallback = false) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    if (t === "true") return true;
    if (t === "false") return false;
  }
  return fallback;
};

const normalizeSport = (s) => {
  const t = String(s ?? "").trim().toUpperCase();
  if (!t) return "OTHER";

  if (t === "SOCCER") return "FOOTBALL";
  if (t === "HOCKEY") return "NHL";
  if (t === "BASEBALL") return "MLB";

  const allowed = new Set(["FOOTBALL", "BASKETBALL", "TENNIS", "NFL", "NHL", "MLB", "ESPORTS", "OTHER"]);
  return allowed.has(t) ? t : "OTHER";
};

const looksLikeScore = (s) => /^\s*\d+\s*[-:]\s*\d+\s*$/.test(String(s ?? ""));

const nowEntropy = () => {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${Date.now()}-${rnd}`;
};

const makeMatchId = (m) => {
  const t1 = slug(m.team_1);
  const t2 = slug(m.team_2);
  const tour = slug(m.tournament);
  const date = slug(m.kickoff_date);
  const time = slug(m.kickoff_time);

  const baseParts = [t1, t2].filter(Boolean).sort().join("-vs-");
  const meta = [tour, date, time].filter(Boolean).join("-");
  const base = [baseParts, meta].filter(Boolean).join("--");

  return base ? base : `unknown-${nowEntropy()}`;
};

const normalizeMatch = (raw) => {
  const obj = raw && typeof raw === "object" ? raw : {};

  const team_1 = safeStringOrNull(obj.team_1);
  const team_2 = safeStringOrNull(obj.team_2);
  const tournament = safeStringOrNull(obj.tournament);

  const kickoff_time = safeStringOrNull(obj.kickoff_time);
  const kickoff_date = safeStringOrNull(obj.kickoff_date);

  const is_live = safeBool(obj.is_live, false);

  let live_score = safeStringOrNull(obj.live_score);
  if (live_score && !looksLikeScore(live_score)) live_score = null;

  const live_minute =
    obj.live_minute === null || obj.live_minute === undefined
      ? null
      : typeof obj.live_minute === "number"
        ? (Number.isFinite(obj.live_minute) ? obj.live_minute : null)
        : safeStringOrNull(obj.live_minute);

  const sport = normalizeSport(obj.sport);

  const matchLabel = `${team_1 || "Team 1"} vs ${team_2 || "Team 2"}`;
  const matchId = makeMatchId({ team_1, team_2, tournament, kickoff_date, kickoff_time });

  return {
    sport,
    team_1,
    team_2,
    tournament,
    kickoff_time,
    kickoff_date,
    is_live,
    live_score: is_live ? live_score : null,
    live_minute: is_live ? live_minute : null,
    preview_odds: obj.preview_odds || null,
    matchId,
    matchLabel,
  };
};

const ensureNonEmptyResult = (arr, errorMessage = null) => {
  const list = Array.isArray(arr) ? arr.filter(Boolean) : [];
  if (list.length > 0) return list;

  if (errorMessage) {
    console.warn("[Quick Scan] Returning empty result due to:", errorMessage);
  }
  return [];
};

// --------------------------------------------
// Netlify BYOK Proxy Call Helper
// --------------------------------------------

// --------------------------------------------
// Netlify BYOK Proxy Call Helper
// --------------------------------------------

// callLlmProxy is imported from ../common/helpers.js

// --------------------------------------------
// Main
// --------------------------------------------

/**
 * Runs a quick scan on an image to identify matches
 * @param {Object|string} config - Config object with key/model/provider OR API key string
 * @param {string} imageBase64 - Base64 encoded image (data URL)
 * @param {AbortSignal} signal - Abort signal for cancellation
 * @returns {Promise<QuickScanMatch[]>} Array of identified matches
 */
export const runQuickMatchScan = async (config, imageBase64, signal) => {
  // 1) Determine provider/key/model
  let provider = "openai";
  let apiKey = "";
  let model = "";

  if (typeof config === "string") {
    apiKey = config.trim();
    model = "gpt-5.2";
  } else {
    if (config?.provider === "gemini") {
      provider = "gemini";
      apiKey = String(config?.key || "").trim();
      model = config?.model || "gemini-2.0-flash";
    } else {
      provider = "openai";
      apiKey = String(config?.key || "").trim();
      model = config?.model || "gpt-5.2";
    }
  }

  if (!apiKey || apiKey.length < 5) {
    throw new Error(`${provider.toUpperCase()} API Key is missing or invalid.`);
  }

  const finalImage = normalizeImageToVisionUrl(imageBase64);
  if (!finalImage) {
    return ensureNonEmptyResult([], "Image base64 is missing or invalid.");
  }

  console.log(`[Quick Scan] Identifying matches via ${provider.toUpperCase()} (Netlify BYOK proxy)...`);

  try {
    let content = "";

    if (provider === "openai") {
      const openaiPayload = {
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: QUICK_SCAN_PROMPT },
              { type: "image_url", image_url: { url: finalImage, detail: "high" } },
            ],
          },
        ],
        max_completion_tokens: 900,
        response_format: { type: "json_object" },
      };

      const data = await callLlmProxy({
        provider: "openai",
        apiKey,
        model,
        payload: openaiPayload,
        signal,
      });

      // Proxy should return OpenAI-like response for openai provider
      content = data?.choices?.[0]?.message?.content || "";

    } else if (provider === "gemini") {
      const base64Data = finalImage.split(",")[1];
      const mimeType = finalImage.split(";")[0].split(":")[1] || "image/jpeg";

      const geminiPayload = {
        model,
        contents: [
          {
            parts: [
              { text: QUICK_SCAN_PROMPT + "\n\nReturn JSON ONLY." },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
        },
      };

      const data = await callLlmProxy({
        provider: "gemini",
        apiKey,
        model,
        payload: geminiPayload,
        signal,
      });

      // Proxy should return Gemini-like response for gemini provider
      content = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    if (!content) throw new Error(`Empty response from ${provider}.`);

    // Defensive parse
    const parsed = tryParseJson(content);

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid or empty JSON response from Quick Scan.");
    }

    const rawMatches = Array.isArray(parsed.matches)
      ? parsed.matches
      : (parsed.team_1 || parsed.team_2 ? [parsed] : []);

    if (!rawMatches.length) {
      throw new Error("No matches identified.");
    }

    const normalized = rawMatches.map(normalizeMatch);

    // De-duplicate by matchId
    const uniq = [];
    const seen = new Set();
    for (const m of normalized) {
      if (m?.matchId && !seen.has(m.matchId)) {
        seen.add(m.matchId);
        uniq.push(m);
      }
    }

    console.log(`[Quick Scan] Identified ${uniq.length} match(es).`);

    return ensureNonEmptyResult(uniq);

  } catch (e) {
    if (isAbortError(e, signal)) {
      throw new DOMException("Aborted", "AbortError");
    }

    const status = e?.response?.status;

    // 401 should bubble for UI alerts
    if (status === 401 || String(e?.message || "").includes("401")) {
      console.error(`[Quick Scan] 401 Unauthorized (${provider}). Propagating error...`);
      throw e;
    }

    // Avoid dumping sensitive configs
    const safeMsg =
      status
        ? `Status: ${status} - ${JSON.stringify(e?.response?.data || {})}`
        : (e?.message || "Quick scan failed.");

    console.error(`[Quick Scan] Failed (${provider}): ${safeMsg}`);

    return ensureNonEmptyResult([], safeMsg);
  }
};

export default runQuickMatchScan;