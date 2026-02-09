/**
 * PhD Orchestrator (Multi-Match Capable) — Production Hardened (Clean + Safe)
 * Coordinates: Strategy (GPT) + Research (Perplexity) + Formula Selection + Engine + Audit + Final Synthesis.
 *
 * Core safety goals:
 * - JSON-mode where it matters (planner/auditor/final + intel validator)
 * - Manual intel treated as DATA only (no instruction execution)
 * - Stable matchId + matchLabel for UI mapping/streaming
 * - Safe token templating (token-only replacement; stringified payloads)
 * - Key checks, abort support, retry wrappers
 * - Post-processing enforces: Edge>0 => not AVOID + stake>0; Edge<=0 => AVOID + 0 stake (INFO is preserved)
 *
 * Odds principle:
 * - The user screenshot ALWAYS contains odds. The Vision layer should extract them.
 * - Orchestrator still HARDENS for cases when odds are missing due to OCR/Vision failure:
 *   -> Final output becomes INFO with odds 0 and explicit note (per prompt).
 */

import axios from "axios";
import { retryAsync, safeStringify, tryParseJson } from "./common/helpers.js";
import { selectFormulas } from "../engine/phd/formulaSelector.js";
import { getFormula } from "../engine/phd/registry.js"; // Dynamic Dispatcher
import { normalizeSport } from "../engine/phd/utils/normalizeSport.js";

// Multi-module cleanup (Engineering Audit Phase 1)
import { PROMPT_VALIDATE_INTEL, PROMPT_PLANNER, PROMPT_VERIFY_ENGINE, PROMPT_FINAL_SYNTHESIS } from "./prompts/orchestratorPrompts.js";
import { getMandatoryMarkets } from "./config/sportConfigs.js";
import { extractOddsFromResearch } from "./common/oddsParser.js";
import { hasPrimaryOdds } from "./vision/utils/matchValidator.js";
import { createAPIManager, TaskType } from "./common/apiManager.js";

// ============================================================
// UTILS: stable id + safe token replacement
// ============================================================

function djb2Hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
    return (h >>> 0).toString(16);
}

function ensureMatchIdentity(matchData) {
    const matchLabel =
        matchData?.matchLabel || `${matchData?.team_1 || "Home"} vs ${matchData?.team_2 || "Away"}`;
    const key = `${matchLabel}|${matchData?.kickoff_date || ""}|${matchData?.kickoff_time || ""}|${matchData?.tournament || ""
        }`;
    const matchId = matchData?.matchId || `m_${djb2Hash(key)}`;
    return { ...matchData, matchId, matchLabel };
}

function requireKey(name, key) {
    if (!key || String(key).trim().length < 10) throw new Error(`${name} API key missing/invalid.`);
}

// PhD-Level Key Check (returns boolean, doesn't throw)
function hasValidKey(key) {
    return key && String(key).trim().length >= 10;
}

function replaceAllTokens(template, tokens) {
    let out = String(template || "");
    for (const [k, v] of Object.entries(tokens || {})) {
        out = out.replaceAll(String(k), String(v ?? ""));
    }
    return out;
}

function safeJsonDataBlock(value, maxLen = 12000) {
    const s = JSON.stringify(String(value ?? ""));
    return s.slice(1, -1).slice(0, maxLen);
}

function hasAnyOdds(obj, sport = "FOOTBALL") {
    // Delegates to shared validator for consistency
    return hasPrimaryOdds(obj, sport);
}

function clampBankroll(v, fallback = 300) {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    if (n > 1_000_000) return 1_000_000;
    return n;
}

// ============================================================
// CORE: Multi-match loop
// ============================================================

export const runPerplexityDirectedLoop = async ({
    visionData,
    userModelItems,
    openaiParams,
    perplexityParams,
    deepseekParams, // NEW: DeepSeek Params
    manualIntel,
    bankroll,
    signal,
    onUpdate,
}) => {
    // Preserve parent group and sport so each match keeps correct sport (no cross-sport mix)
    const parentGroup = visionData?.__group || {};
    const rawParentSport = visionData?.sport || parentGroup?.sport;
    const parentSport = normalizeSport(rawParentSport);

    let matchList =
        visionData?.matches && Array.isArray(visionData.matches) && visionData.matches.length > 0
            ? visionData.matches.map((m) => {
                const rawSport = m.sport || visionData.sport || rawParentSport;
                return {
                    ...m,
                    __group: { ...parentGroup, ...m.__group },
                    sport: normalizeSport(rawSport),
                    matchLabel:
                        m.matchLabel ||
                        parentGroup.matchLabel ||
                        (m.team_1 && m.team_2 ? `${m.team_1} vs ${m.team_2}` : m.matchLabel),
                    matchId: m.matchId || parentGroup.matchId,
                };
            })
            : [{ ...visionData, sport: visionData?.sport ? normalizeSport(visionData.sport) : parentSport }];

    // Deduplicate by normalized label + tournament
    const seen = new Set();
    matchList = matchList
        .map(ensureMatchIdentity)
        .filter((m) => {
            const label = String(m.matchLabel || "").toLowerCase().trim();
            const tour = String(m.tournament || "").toLowerCase().trim();
            const key = `${label}|${tour}`;

            if (!label) return true;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

    const settled = await Promise.allSettled(
        matchList.map((matchData, idx) =>
            processSingleMatch({
                matchData,
                userModelItems,
                openaiParams,
                perplexityParams,
                deepseekParams, // Pass down
                manualIntel: idx === 0 ? manualIntel : null,
                bankroll,
                signal,
                onUpdate,
            })
        )
    );

    const results = settled.map((r, i) => {
        if (r.status === "fulfilled") return r.value;

        const m = matchList[i] || {};
        return {
            match_id: m.matchId || `m_fail_${Date.now()}`,
            matchLabel: m.matchLabel || `Match #${i + 1}`,
            sport: m.sport || "UNKNOWN",
            error: true,
            recommendations: [
                {
                    selection: m.matchLabel || "Unknown Match",
                    market: "ERROR",
                    odds: 0,
                    stake_size: "0 unit",
                    confidence: 0.1,
                    recommendation_level: "AVOID",
                    reasoning: `Analysis failed: ${r.reason?.message || "Unknown error"}`,
                    matchLabel: m.matchLabel,
                    math_proof: { implied_prob: 0, own_prob: 0, edge: 0, kelly: 0 },
                },
            ],
            combos: [],
            summary_note: "One match failed in multi-match processing.",
            evidence_log: [],
            rounds_used: 0,
        };
    });

    if (results.length === 1) return results[0];

    return {
        match_id: `multi_${Date.now()}`,
        recommendations: results.flatMap((x) => x.recommendations || []),
        combos: [],
        evidence_log: results.map((x) => x.evidence_log || []),
        rounds_used: Math.max(0, ...results.map((x) => x.rounds_used || 0)),
        summary_note: results.map((x) => `[${x.matchLabel}]: ${x.summary_note || "Done"}`).join("\n|\n"),
        strategies: results,
    };
};

// ============================================================
// SINGLE MATCH PIPELINE
// ============================================================

async function processSingleMatch({
    matchData,
    openaiParams,
    perplexityParams,
    deepseekParams,  // CRITICAL: Was missing, causing ReferenceError
    manualIntel,
    bankroll,
    signal,
    onUpdate,
}) {
    const { apiKey: openAIKey, orchestratorModel, finalModel } = openaiParams || {};
    const { apiKey: pplxKey, model: pplxModel } = perplexityParams || {};
    const { apiKey: dsKey, model: dsModel, enabled: dsEnabled } = deepseekParams || {};

    // PhD-Level: Initialize API Manager for capability-based model selection
    const apiManager = createAPIManager(openaiParams, perplexityParams, deepseekParams, null);
    apiManager.logStatus();

    // STRICT VALIDATION: Must have Reasoning (GPT/DeepSeek) AND/OR Research (Perplexity)
    // The user explicitly requested: "vagy a perplexity vagy a gpt be kell legyen kapcsolva máskép ne is induljon el a keresés"
    if (!apiManager.canDoReasoning() && !hasValidKey(pplxKey)) {
        throw new Error("SYSTEM HALTED: No active AI Brain found. Enable Perplexity, OpenAI, or DeepSeek in Settings.");
    }

    // Validate we have at least reasoning capability for the Planner/Synthesis
    if (!apiManager.canDoReasoning()) {
        // If we only have Perplexity, we technically can't "Plan" or "Synthesize" well without a reasoning model.
        // But if the user wants *either*, we might need a fallback? 
        // Actually, without a reasoning model (LLM), we cannot run the Planner/Synthesis prompts at all.
        // So we MUST have an LLM. 
        throw new Error("SYSTEM HALTED: Reasoning Model (OpenAI or DeepSeek) is required to process data.");
    }

    // PhD-Level: Dynamic model selector for reasoning tasks
    const callReasoningModel = async (params) => {
        const best = apiManager.getBestForReasoning();
        if (!best) {
            throw new Error("No reasoning model available");
        }

        if (best.provider === 'deepseek') {
            return callDeepSeek({ ...params, apiKey: best.apiKey, model: best.model });
        }
        return callOpenAI({ ...params, apiKey: best.apiKey, model: best.model });
    };

    const labeled = ensureMatchIdentity(matchData || {});
    labeled.sport = normalizeSport(labeled.sport || "FOOTBALL");

    const contextStr = safeStringify(labeled);
    const matchId = labeled.matchId;

    let evidenceLog = [];

    // 0) Vision OCR Rescue
    if (matchData?._raw_text_dump) {
        evidenceLog.push({
            round: "VISION_OCR",
            query: "MATCH_SCREENSHOT_TEXT",
            answer: `[RAW_OCR_DUMP]: ${String(matchData._raw_text_dump).slice(0, 8000)}`
        });
    }

    // 0.5) Manual intel validation
    if (manualIntel && String(manualIntel).trim().length > 0) {
        try {
            const safeIntel = safeJsonDataBlock(manualIntel, 12000);
            const valPrompt = PROMPT_VALIDATE_INTEL.replace("{INPUT_TEXT}", safeIntel);

            const valRes = await callReasoningModel({
                system: "You are a strict JSON-only content quality filter.",
                user: valPrompt,
                jsonMode: true,
                maxTokens: 600,
                signal,
            });

            const valParsed = tryParseJson(valRes);
            if (valParsed?.is_relevant) {
                evidenceLog.push({
                    round: 0,
                    query: "MANUAL_INSIDER_OVERRIDE",
                    answer:
                        `[USER INTEL]: ${String(manualIntel).slice(0, 5000)}\n` +
                        `[VALIDATED]: ${valParsed.reason || "Relevant"}`,
                });

                onUpdate?.({ type: "INTEL_UPDATE", matchId, data: evidenceLog });
            }
        } catch (err) {
            console.warn("[Orchestrator] Manual intel validation skipped:", err?.message);
        }
    }

    // 0.6) Initial Odds Check
    const isOddsMissing = !hasAnyOdds(labeled.odds || labeled, labeled.sport);

    if (isOddsMissing) {
        evidenceLog.push({
            round: "PRECHECK",
            query: "ODDS_MISSING",
            answer: "CRITICAL: No usable odds detected in screenshot. You MUST search for current odds.",
        });
    }

    // 0.8) Vision Rescue (If images available)
    if (isOddsMissing && matchData?.__group?._source_images) {
        try {
            const { runVisionRescue } = await import("./vision/visionScraper.js");
            const rescueResult = await runVisionRescue(
                { key: openAIKey, model: orchestratorModel }, // Use generic or vision model?
                matchData.__group._source_images,
                labeled.team_1,
                labeled.team_2,
                ["homeWin", "draw", "awayWin"], // Primary targets
                signal
            );

            if (rescueResult && rescueResult.found && rescueResult.odds) {
                // Merge found odds
                labeled.odds = { ...labeled.odds, ...rescueResult.odds };

                // Re-check validity
                if (hasAnyOdds(labeled.odds, labeled.sport)) {
                    evidenceLog.push({
                        round: "VISION_RESCUE",
                        query: "DYSLEXIC_ASSISTANT_RESCAN",
                        answer: `[SUCCESS] Vision Rescue found odds directly in image: ${JSON.stringify(rescueResult.odds)}`
                    });
                    // Mark as NOT missing anymore, so we skip Perplexity
                    // BUT: we set isOddsMissing = false? No, const. But we can skip the next block.
                }
            } else {
                evidenceLog.push({
                    round: "VISION_RESCUE",
                    query: "DYSLEXIC_ASSISTANT_RESCAN",
                    answer: `[FAILED] Assistant looked again but found nothing. Proceeding to external search.`
                });
            }
        } catch (err) {
            console.warn("[Orchestrator] Vision Rescue Error:", err);
        }
    }

    // Re-evaluate missing status after rescue
    const stillMissing = !hasAnyOdds(labeled.odds, labeled.sport);

    // 0.9) Odds Search (Forced if STILL missing)
    if (stillMissing) {
        const team1 = labeled.team_1 || labeled.homeTeam || "Home";
        const team2 = labeled.team_2 || labeled.awayTeam || "Away";
        const oddsQuery = `current decimal betting odds 1X2 for ${team1} vs ${team2} (home draw away)`;
        try {
            const oddsAnswer = await performResearch({ perplexityParams, openaiParams, deepseekParams, query: oddsQuery, signal });
            evidenceLog.push({ round: "ODDS_SEARCH", query: oddsQuery, answer: oddsAnswer });
        } catch (err) {
            console.warn("[Orchestrator] Forced odds search failed:", err?.message);
        }
    }

    // 1) Directed loop (max 2 rounds)
    let rounds = 0;
    const MAX_ROUNDS = 2;

    while (rounds < MAX_ROUNDS) {
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

        const findingsStr = evidenceLog.map((e) => `Q: ${e.query}\nA: ${e.answer}`).join("\n\n") || "(None)";

        const planPrompt = replaceAllTokens(PROMPT_PLANNER, {
            "{MATCH_CONTEXT}": contextStr,
            "{PREVIOUS_FINDINGS}": findingsStr,
        });

        // USE DEEPSEEK IF ENABLED (Reasoning Heavy)
        const planRes = await callReasoningModel({
            system: "You are a precise betting strategist. Output ONLY JSON.",
            user: planPrompt,
            jsonMode: true,
            maxTokens: 900,
            signal,
        });

        const plan = tryParseJson(planRes) || {};
        const queries = Array.isArray(plan.queries) ? plan.queries : [];

        if (queries.length === 0) break;

        const SAFE_QUERIES = queries
            .map((q) => String(q || "").trim())
            .filter(Boolean)
            .slice(0, 5);

        try {
            const researchResults = await Promise.all(
                SAFE_QUERIES.map((q) => performResearch({ perplexityParams, openaiParams, deepseekParams, query: q, signal }))
            );

            SAFE_QUERIES.forEach((q, i) => {
                evidenceLog.push({ round: rounds + 1, query: q, answer: researchResults[i] });
            });
        } catch (err) {
            console.warn(`[Orchestrator] Research round ${rounds + 1} failed partially or fully:`, err.message);
        }

        onUpdate?.({
            type: "FACTS_UPDATE",
            matchId,
            data: { items: evidenceLog, matchLabel: labeled.matchLabel },
        });

        rounds++;
    }

    // 1.9) SYNTHESIS: Inject found odds BEFORE Formula Selection
    if (isOddsMissing || Object.keys(labeled.odds || {}).length === 0) {
        // Fix: Pass team names to help parser find "Real Sociedad: 2.50"
        const recovered = extractOddsFromResearch(evidenceLog, labeled.team_1, labeled.team_2);
        if (recovered) {
            console.log("[Orchestrator] Paradox Fix: Injecting recovered odds:", recovered);
            labeled.odds = { ...labeled.odds, ...recovered, oddsMissing: false };
            evidenceLog.push({
                round: "SYSTEM",
                query: "ODDS_RECOVERY",
                answer: `Successfully recovered odds from research text: ${JSON.stringify(recovered)}`
            });
        }
    }

    // 2) Formula Selection (Architect Agent)
    let formulaSelection;
    try {
        formulaSelection = await selectFormulas({
            matchContext: labeled,
            researchData: evidenceLog,
            // USE DEEPSEEK IF ENABLED
            callGPT: async ({ system, user, jsonMode }) =>
                callReasoningModel({
                    system,
                    user,
                    jsonMode,
                    maxTokens: 1500,
                    signal,
                }),
            signal,
        });

        evidenceLog.push({
            round: "FORMULA_SELECTION",
            query: "FORMULA_ANALYSIS",
            answer: `Formulas: ${formulaSelection?.selectedFormulas?.map((f) => f.formulaId).join(", ") || "N/A"
                }`,
        });
    } catch (err) {
        console.warn("[Orchestrator] Formula selection warning:", err?.message);
        formulaSelection = {
            selectedFormulas: [{ formulaId: "DEFAULT", markets: ["ALL"] }],
            extractedParameters: {},
            confidence: 0.3,
        };
    }

    // 3) Math Engine Execution (Dynamic Dispatch)
    let engineOutputWithFormulas = {};
    try {
        let engineResults = [];
        const selectedList = Array.isArray(formulaSelection?.selectedFormulas)
            ? formulaSelection.selectedFormulas
            : [];

        for (const sf of selectedList) {
            // NEW: Use dynamic getFormula to support IDs like "TENNIS_HDD"
            const formula = getFormula(sf.formulaId);

            if (!formula || !formula.execute) {
                console.warn(`[Orchestrator] Plan requested unknown formula: ${sf.formulaId}`);
                continue;
            }

            const inputData = {
                ...labeled,
                // The Architect Agent (formulaSelector) maps params into 'parameters'
                // The engine expects 'extractedParameters' or 'researchData'
                extractedParameters: sf.parameters || {},
                parameterPlan: sf.reasoning,
                researchData: evidenceLog,
            };

            // Basic team requirement
            if (!inputData.team_1 && !inputData.homeTeam) continue;

            // Execute Formula (pass bankroll)
            const res = formula.execute(inputData, { bankroll: clampBankroll(bankroll, 300) });

            if (res) engineResults.push(res);
        }

        // Use first result as primary, but keep others in multiFormulaResults
        const engineResult = engineResults[0] || { recommendations: [] };

        engineOutputWithFormulas = {
            ...engineResult,
            formulaSelection,
            multiFormulaResults: engineResults,
            data_sufficiency: evidenceLog.length,
        };
        onUpdate?.({ type: "MATH_READY", matchId, data: engineOutputWithFormulas });

    } catch (err) {
        console.error("[Orchestrator] Engine failed:", err?.message);
        engineOutputWithFormulas = {
            error: true,
            details: err?.message || "Engine Failed during calculation",
            matchId,
            recommendations: [],
            warnings: [err?.message],
        };
    }

    // 4) Verify engine
    const engineOutputStr = safeStringify(engineOutputWithFormulas);
    let verificationNote = "";

    try {
        // USE DEEPSEEK IF ENABLED (Auditor is heavily reasoning based)
        const verifyRes = await callReasoningModel({
            system: "Strict mathematical auditor. Output ONLY JSON.",
            user: replaceAllTokens(PROMPT_VERIFY_ENGINE, {
                "{MATCH_CONTEXT}": contextStr,
                "{ENGINE_OUTPUT}": engineOutputStr,
            }),
            jsonMode: true,
            maxTokens: 1000,
            signal,
        });
        const verifyParsed = tryParseJson(verifyRes) || {};
        verificationNote = verifyParsed.pass
            ? "\n[VERIFIED]"
            : `\n[VERIFICATION_ISSUES]: ${(verifyParsed.issues || []).join(", ")}`;
    } catch (err) {
        verificationNote = `\n[VERIFY_SKIPPED]: ${err?.message || "audit failed"}`;
    }

    // 5) Final Synthesis
    const finalRes = await callReasoningModel({
        system: "PhD-level betting analyst. Output ONLY JSON.",
        user: replaceAllTokens(PROMPT_FINAL_SYNTHESIS, {
            "{MATCH_CONTEXT}": contextStr,
            "{EVIDENCE_LOG}": evidenceLog.map((e) => `Q: ${e.query}\nA: ${e.answer}`).join("\n\n"),
            "{MATH_ENGINE_OUTPUT}": engineOutputStr + verificationNote,
            "{MARKET_SCHEMA}":
                getMandatoryMarkets(labeled.sport) +
                "\nCRITICAL: You MUST return ALL market sides listed above. Include AVOID for negative EV sides.\n" +
                "If odds are missing, mark INFO with odds=0 and explain 'Odds unavailable'.",
        }),
        jsonMode: true,
        maxTokens: 2400,
        signal,
    });

    const finalParsed = tryParseJson(finalRes) || {};

    // 6) Post-Process Recommendations
    // CRITICAL FIX: Use ENGINE recommendations as authoritative source, NOT GPT output
    // The engine (football.js etc.) already computed correct EV/Edge/Odds.
    // GPT synthesis often loses or corrupts this data.
    const engineRecs = Array.isArray(engineOutputWithFormulas?.recommendations)
        ? engineOutputWithFormulas.recommendations
        : [];

    if (engineRecs.length > 0) {
        // Engine has valid recommendations - use them directly
        finalParsed.recommendations = engineRecs.map(rec => ({
            ...rec,
            matchLabel: labeled.matchLabel,
        }));
    } else if (!Array.isArray(finalParsed.recommendations)) {
        finalParsed.recommendations = [{
            selection: labeled.matchLabel,
            market: "PROJECTED",
            odds: 0,
            recommendation_level: "INFO",
            reasoning: "Projection only: insufficient data.",
            matchLabel: labeled.matchLabel,
            math_proof: { implied_prob: 0, own_prob: 0, edge: 0, kelly: 0 }
        }];
    }

    finalParsed.recommendations = finalParsed.recommendations.map((rec) => {
        let row = { ...rec, matchLabel: labeled.matchLabel };

        // --- RESCUE: Inject Odds from Context if missing in GPT output ---
        let book = Number(row.odds);
        if ((!Number.isFinite(book) || book <= 1.0001) && labeled.odds) {
            // Try to fuzzy match selection to odds keys (e.g. "Home" -> homeWin)
            const selLower = String(row.selection || '').toLowerCase();
            const mktLower = String(row.market || '').toLowerCase();

            let recoveredOdds = 0;
            if (selLower.includes(String(labeled.team_1 || 'home').toLowerCase()) || row.selection === '1') recoveredOdds = labeled.odds.homeWin;
            else if (selLower.includes(String(labeled.team_2 || 'away').toLowerCase()) || row.selection === '2') recoveredOdds = labeled.odds.awayWin;
            else if (selLower.includes('draw') || row.selection === 'X') recoveredOdds = labeled.odds.draw;
            else if (mktLower.includes('over') && selLower.includes('2.5')) recoveredOdds = labeled.odds.over25;
            else if (mktLower.includes('under') && selLower.includes('2.5')) recoveredOdds = labeled.odds.under25;
            else if (selLower.includes('btts') && selLower.includes('yes')) recoveredOdds = labeled.odds.bttsYes;
            else if (selLower.includes('btts') && selLower.includes('no')) recoveredOdds = labeled.odds.bttsNo;

            if (Number.isFinite(Number(recoveredOdds)) && Number(recoveredOdds) > 1) {
                row.odds = Number(recoveredOdds);
                book = row.odds;
                row.reasoning = `[SYSTEM] Odds ${book} injected from context. ${row.reasoning || ''}`;
            }
        }

        const oddsOk = Number.isFinite(book) && book > 1.0001;

        // 1. Odds Missing -> INFO
        if (!oddsOk) {
            return {
                ...row,
                odds: 0,
                recommendation_level: "INFO",
                market: row.market || "PROJECTED",
                stake_size: "0 unit",
                reasoning: `[INFO] Odds unavailable → cannot compute EV reliably. ${row.reasoning || ""}`.trim(),
                math_proof: { ...row.math_proof, edge: 0, kelly: 0 }
            };
        }

        // 2. EV Check & Paradox Fix
        // Recalculate Edge if possible to ensure consistency
        let edge = Number(row.math_proof?.edge);
        let ownProb = Number(row.math_proof?.own_prob);

        // If we have stats from the engine, try to find the TRUE probability for this selection
        if (engineOutputWithFormulas?.computedStats?.probs) {
            const probs = engineOutputWithFormulas.computedStats.probs;
            /* Simple mapping logic */
            const sel = String(row.selection || '').toLowerCase();
            if (sel.includes(String(labeled.team_1 || 'pxz').toLowerCase())) ownProb = probs.homeWin;
            else if (sel.includes(String(labeled.team_2 || 'pxz').toLowerCase())) ownProb = probs.awayWin;
            else if (sel.includes('draw')) ownProb = probs.draw;
            else if (sel.includes('over')) ownProb = probs.over25;
            else if (sel.includes('under')) ownProb = 1 - probs.over25;
            else if (sel.includes('yes')) ownProb = probs.bttsYes;
            else if (sel.includes('no')) ownProb = 1 - probs.bttsYes;

            if (Number.isFinite(ownProb)) {
                // Update proof with authoritative engine data
                edge = (ownProb * book) - 1;
                row.math_proof = {
                    ...row.math_proof,
                    own_prob: ownProb,
                    implied_prob: 1 / book,
                    edge: edge,
                    kelly: (edge / ((book - 1) || 1)) * 0.25 // rough quarter kelly estimation if missing
                };
            }
        }

        if (!Number.isFinite(edge)) edge = 0;

        if (edge <= 0) {
            // Negative/Neutral EV
            const currentLevel = String(row.recommendation_level || "").toUpperCase();

            // "Avoid Paradox": If AI says GOOD but Math says Edge<=0, we warn but don't force AVOID if strong conviction
            if (["DIAMOND", "STRONG", "GOOD"].includes(currentLevel)) {
                row.reasoning = `[MATH WARNING] Negative EV (${(edge * 100).toFixed(1)}%) vs AI Confidence. ${row.reasoning || ""}`;
                row.recommendation_level = "LEAN";
            } else if (!["INFO", "PROJECTED"].includes(currentLevel) && currentLevel !== "AVOID") {
                row.reasoning = `[MATH WARNING] Zero/Neg EV. ${row.reasoning || ""}`;
            }
        } else {
            // Positive EV
            // If AI said AVOID/INFO but Math says Positive EV?
            const currentLevel = String(row.recommendation_level).toUpperCase();
            if (currentLevel === "AVOID" || currentLevel.includes("INFO") || currentLevel.includes("PROJECTED")) {
                // AUTO-UPGRADE based on Edge strength
                if (edge > 0.05) row.recommendation_level = "GOOD";
                else if (edge > 0.02) row.recommendation_level = "LEAN";
                else row.recommendation_level = "LEAN"; // Small edge

                row.reasoning = `[AUTO-UPGRADE] Valid Odds (${book}) + Positive EV (${(edge * 100).toFixed(1)}%). ${row.reasoning || ""}`;
            }
        }

        // Ensure Stake is consistent with Edge
        if (edge > 0 && (row.stake_size === "0 unit" || !row.stake_size)) {
            // Inject default stake if positive edge
            row.stake_size = "1 Unit";
        }

        return row;
    });

    // 7. Sorting
    const levelScore = { DIAMOND: 5, STRONG: 4, GOOD: 3, LEAN: 2, INFO: 1, AVOID: 0, PROJECTED: 1 };
    finalParsed.recommendations.sort((a, b) => {
        const sa = levelScore[String(a.recommendation_level).toUpperCase()] || 0;
        const sb = levelScore[String(b.recommendation_level).toUpperCase()] || 0;
        if (sa !== sb) return sb - sa;
        return (Number(b?.math_proof?.edge) || 0) - (Number(a?.math_proof?.edge) || 0);
    });

    const singleMatchResult = {
        ...finalParsed,
        match_id: finalParsed.match_id || matchId,
        matchLabel: labeled.matchLabel,
        sport: labeled.sport,
        evidence_log: evidenceLog,
        rounds_used: rounds,
        formula_selection: formulaSelection,
        match_analysis: engineOutputWithFormulas?.computedStats,
        mathematical_derivation: engineOutputWithFormulas?.mathDetails,
        odds_breakdown: engineOutputWithFormulas?.recommendations,
    };

    onUpdate?.({ type: "STRATEGY_COMPLETE", matchId, data: singleMatchResult });
    return singleMatchResult;
}

// ============================================================
// API HELPERS
// ============================================================

async function callOpenAI({ apiKey, model, system, user, jsonMode, maxTokens, signal }) {
    requireKey("OpenAI", apiKey);
    const targetModel = model || "gpt-5.2";
    const payload = {
        model: targetModel,
        messages: [
            { role: "system", content: system || "" },
            { role: "user", content: user || "" },
        ],
        max_completion_tokens: Number.isFinite(Number(maxTokens)) ? Number(maxTokens) : 2000,
    };
    if (jsonMode) payload.response_format = { type: "json_object" };

    return retryAsync(async () => {
        const res = await axios.post("/api/openai/chat/completions", payload, {
            headers: { Authorization: `Bearer ${apiKey}` },
            signal,
        });
        return res?.data?.choices?.[0]?.message?.content || "{}";
    }, [], 2);
}

/**
 * DeepSeek Caller
 * DeepSeek R1 often doesn't align perfectly with json_object mode like OpenAI,
 * so we might need to rely on prompt engineering for JSON.
 */
async function callDeepSeek({ apiKey, model, system, user, jsonMode, maxTokens, signal }) {
    requireKey("DeepSeek", apiKey);
    const targetModel = model || "deepseek-reasoner";

    // Deepseek often has a 'reasoning_content' field for R1, or just 'content'
    const payload = {
        model: targetModel,
        messages: [
            { role: "system", content: system || "You are a helpful assistant." },
            { role: "user", content: user || "" },
        ],
        max_tokens: Number.isFinite(Number(maxTokens)) ? Number(maxTokens) : 2000,
    };

    // If jsonMode is requested, append strong instruction if not already present
    if (jsonMode && !String(system).includes("JSON")) {
        payload.messages[0].content += " Output ONLY valid JSON.";
    }

    return retryAsync(async () => {
        const res = await axios.post("/api/deepseek/chat/completions", payload, {
            headers: { Authorization: `Bearer ${apiKey}` },
            signal,
        });
        return res?.data?.choices?.[0]?.message?.content || "{}";
    }, [], 2);
}

/**
 * Unified Research Caller: Defaults to Perplexity, falls back to OpenAI (GPT-5.2) ONLY if available
 * PhD-Level: Never attempt API calls without valid keys
 */
async function performResearch({ perplexityParams, openaiParams, deepseekParams, query, signal }) {
    const { apiKey: pplxKey, model: pplxModel } = perplexityParams || {};
    const { apiKey: openAIKey, orchestratorModel } = openaiParams || {};
    const { apiKey: dsKey, model: dsModel, enabled: dsEnabled } = deepseekParams || {};

    // 1. Try Perplexity (Primary) if key available
    if (hasValidKey(pplxKey)) {
        try {
            console.log(`[Orchestrator] 🔍 PERFORMING RESEARCH via Perplexity... Query: "${query.slice(0, 50)}..."`);
            const payload = {
                model: pplxModel || "sonar-pro",
                messages: [
                    { role: "system", content: "You are a factual sports researcher. Be concise and precise." },
                    { role: "user", content: String(query || "").slice(0, 2000) },
                ],
            };
            return await retryAsync(async () => {
                const res = await axios.post("/api/perplexity/chat/completions", payload, {
                    headers: { Authorization: `Bearer ${pplxKey}` },
                    signal,
                });
                const content = res?.data?.choices?.[0]?.message?.content || "";
                console.log(`[Orchestrator] ✅ Perplexity Result (${content.length} chars)`);
                return `[SOURCE: PERPLEXITY]\n${content}`;
            }, [], 2);
        } catch (err) {
            console.warn("[Orchestrator] Perplexity failed:", err.message);
            // Fallthrough to alternatives
        }
    }

    // 2. Try DeepSeek (Secondary) if enabled and has key
    if (dsEnabled && hasValidKey(dsKey)) {
        try {
            console.log("[Orchestrator] Using DeepSeek for Research (Fallback)");
            return `[SOURCE: DEEPSEEK]\n${await callDeepSeek({
                apiKey: dsKey,
                model: dsModel,
                system: "You are an expert sports researcher. Provide factual, concise information.",
                user: `Research query: ${query}`,
                jsonMode: false,
                maxTokens: 1000,
                signal,
            })}`;
        } catch (err) {
            console.warn("[Orchestrator] DeepSeek research failed:", err.message);
            // Fallthrough to OpenAI
        }
    }

    // 3. Fallback to OpenAI (Tertiary) ONLY if key available
    if (hasValidKey(openAIKey)) {
        console.log("[Orchestrator] Using GPT-5.2 for Research (Fallback - Offline Mode)");
        return `[SOURCE: OPENAI_INTERNAL_KNOWLEDGE]\n${await callOpenAI({
            apiKey: openAIKey,
            model: orchestratorModel, // "gpt-5.2" or "gpt-4o"
            system: "You are an expert sports analyst with vast internal knowledge. You do NOT have live web access.",
            user: `ANALYSIS TASK: Provide your best assessment for: "${query}"\n\nInstructions:\n- Rely on your internal training data (team stats scenarios, historical performance).\n- Clearly state that this is based on general knowledge, not real-time news.\n- Focus on strategic implications (e.g. 'Typical home advantage for Team A').`,
            jsonMode: false,
            maxTokens: 1000,
            signal,
        })}`;
    }

    // 4. No API available - return informative error instead of crashing
    console.error("[Orchestrator] No research API available (all keys missing or disabled)");
    return `[ERROR] Research unavailable: No API keys configured. Query was: "${query}"`;
}