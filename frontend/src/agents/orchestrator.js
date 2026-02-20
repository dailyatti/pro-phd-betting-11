/**
 * PhD Orchestrator (Multi-Match Capable) — Production Hardened (Clean + Safe)
 * Coordinates: Strategy (GPT) + Research (Perplexity/Gemini) + Formula Selection + Engine + Audit + Final Synthesis.
 *
 * Netlify BYOK version:
 * - ALL providers go through: /.netlify/functions/llm
 * - User supplies API keys; we send them via X-User-Api-Key header
 * - Body: { provider, model, payload }
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

import { retryAsync, safeStringify, tryParseJson, callLlmProxy } from "./common/helpers.js";
import logger from "../utils/logger.js";
import { selectFormulas } from "../engine/phd/formulaSelector.js";
import { getFormula } from "../engine/phd/registry.js";
import { normalizeSport } from "../engine/phd/utils/normalizeSport.js";

import {
    PROMPT_VALIDATE_INTEL,
    PROMPT_PLANNER,
    PROMPT_VERIFY_ENGINE,
    PROMPT_FINAL_SYNTHESIS,
} from "./prompts/orchestratorPrompts.js";

import { getMandatoryMarkets } from "./config/sportConfigs.js";
import { extractOddsFromResearch } from "./common/oddsParser.js";
import { hasPrimaryOdds } from "./vision/utils/matchValidator.js";

// ============================================================
// Netlify BYOK Proxy Call Helper
// ============================================================

// ============================================================
// Netlify BYOK Proxy Call Helper
// ============================================================

// Imported from ./common/helpers.js

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
    geminiParams,
    manualIntel,
    bankroll,
    signal,
    onUpdate,
}) => {
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
                geminiParams,
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
    geminiParams,
    manualIntel,
    bankroll,
    signal,
    onUpdate,
}) {
    const { apiKey: openAIKey, orchestratorModel, model: openaiModel } = openaiParams || {};
    const { apiKey: geminiKey } = geminiParams || {};

    // Require ONE valid LLM/Research key (OpenAI or Gemini)
    if (!hasValidKey(openAIKey) && !hasValidKey(geminiKey)) {
        throw new Error("SYSTEM HALTED: No valid API keys found (OpenAI or Gemini required).");
    }

    const resolvedModel = orchestratorModel || openaiModel || "gpt-5.2-2025-12-11";

    const labeled = ensureMatchIdentity(matchData || {});
    labeled.sport = normalizeSport(labeled.sport || "FOOTBALL");

    const contextStr = safeStringify(labeled);
    const matchId = labeled.matchId;

    let evidenceLog = [];

    // 0) Vision OCR dump
    if (matchData?._raw_text_dump) {
        evidenceLog.push({
            round: "VISION_OCR",
            query: "MATCH_SCREENSHOT_TEXT",
            answer: `[RAW_OCR_DUMP]: ${String(matchData._raw_text_dump).slice(0, 8000)}`,
        });
    }

    // 0.5) Manual intel validation
    if (manualIntel && String(manualIntel).trim().length > 0) {
        try {
            const safeIntel = safeJsonDataBlock(manualIntel, 12000);
            const valPrompt = PROMPT_VALIDATE_INTEL.replace("{INPUT_TEXT}", safeIntel);

            const valRes = await callAgentLlm({
                openaiParams,
                geminiParams,
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

    // 0.6) Initial odds check
    const isOddsMissing = !hasAnyOdds(labeled.odds || labeled, labeled.sport);

    if (isOddsMissing) {
        evidenceLog.push({
            round: "PRECHECK",
            query: "ODDS_MISSING",
            answer: "CRITICAL: No usable odds detected in screenshot. You MUST search for current odds.",
        });
    }

    // 0.8) Vision Rescue (if images exist)
    if (isOddsMissing && matchData?.__group?._source_images?.length > 0) {
        try {
            const { runVisionRescue } = await import("./vision/visionScraper.js");
            const rescueResult = await runVisionRescue(
                { key: openAIKey, model: orchestratorModel },
                matchData.__group._source_images,
                labeled.team_1,
                labeled.team_2,
                ["homeWin", "draw", "awayWin"],
                signal
            );

            if (rescueResult && rescueResult.found && rescueResult.odds) {
                labeled.odds = { ...labeled.odds, ...rescueResult.odds };

                if (hasAnyOdds(labeled.odds, labeled.sport)) {
                    evidenceLog.push({
                        round: "VISION_RESCUE",
                        query: "DYSLEXIC_ASSISTANT_RESCAN",
                        answer: `[SUCCESS] Vision Rescue found odds directly in image: ${JSON.stringify(rescueResult.odds)}`,
                    });
                }
            } else {
                evidenceLog.push({
                    round: "VISION_RESCUE",
                    query: "DYSLEXIC_ASSISTANT_RESCAN",
                    answer: `[FAILED] Assistant looked again but found nothing. Proceeding to external research.`,
                });
            }
        } catch (err) {
            console.warn("[Orchestrator] Vision Rescue Error:", err?.message || err);
        }
    }

    // Re-evaluate missing status after rescue
    const stillMissing = !hasAnyOdds(labeled.odds, labeled.sport);

    // 0.9) Odds research forced if still missing
    if (stillMissing) {
        const team1 = labeled.team_1 || labeled.homeTeam || "Home";
        const team2 = labeled.team_2 || labeled.awayTeam || "Away";
        const oddsQuery = `current decimal betting odds 1X2 for ${team1} vs ${team2} (home draw away)`;

        try {
            const oddsAnswer = await performResearch({
                perplexityParams,
                openaiParams,
                geminiParams,
                query: oddsQuery,
                matchContext: labeled,
                signal,
            });

            evidenceLog.push({ round: "ODDS_SEARCH", query: oddsQuery, answer: oddsAnswer });
        } catch (err) {
            console.warn("[Orchestrator] Forced odds search failed:", err?.message || err);
        }
    }

    // 1) Directed loop (max 2 rounds)
    let rounds = 0;
    const MAX_ROUNDS = 2;

    logger.debug(`[Orchestrator] Starting directed research loop for ${labeled.matchLabel} (max ${MAX_ROUNDS} rounds)`);

    while (rounds < MAX_ROUNDS) {
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

        const findingsStr =
            evidenceLog.map((e) => `Q: ${e.query}\nA: ${e.answer}`).join("\n\n") || "(None)";

        const planPrompt = replaceAllTokens(PROMPT_PLANNER, {
            "{MATCH_CONTEXT}": contextStr,
            "{PREVIOUS_FINDINGS}": findingsStr,
        });

        logger.debug(`[Orchestrator] Round ${rounds + 1}/${MAX_ROUNDS}: Calling Planner...`);

        const planRes = await callAgentLlm({
            openaiParams,
            geminiParams,
            system: "You are a precise betting strategist. Output ONLY JSON.",
            user: planPrompt,
            jsonMode: true,
            maxTokens: 900,
            signal,
        });

        const plan = tryParseJson(planRes) || {};
        let queries = Array.isArray(plan.queries) ? plan.queries : [];

        // FAILSAFE queries if planner returns none on round 0
        if (queries.length === 0 && rounds === 0) {
            const team1 = labeled.team_1 || labeled.homeTeam || "Home";
            const team2 = labeled.team_2 || labeled.awayTeam || "Away";
            const sport = labeled.sport || "FOOTBALL";
            const tournament = labeled.tournament || "";

            console.warn(`[Orchestrator] Planner returned 0 queries — generating failsafe queries for ${team1} vs ${team2}`);
            queries = [
                `${team1} vs ${team2} ${tournament} latest team news injuries confirmed lineups ${sport}`,
                `${team1} vs ${team2} current betting odds 1X2 over under line movement sharp money`,
                `${team1} vs ${team2} recent form last 5 matches head to head stats`,
            ];
        }

        if (queries.length === 0) break;

        const SAFE_QUERIES = queries
            .map((q) => String(q || "").trim())
            .filter(Boolean)
            .slice(0, 5);

        logger.debug(`[Orchestrator] Round ${rounds + 1}: ${SAFE_QUERIES.length} queries generated`);

        try {
            const researchResults = await Promise.all(
                SAFE_QUERIES.map((q) =>
                    performResearch({ perplexityParams, openaiParams, geminiParams, query: q, matchContext: labeled, signal })
                )
            );

            SAFE_QUERIES.forEach((q, i) => {
                evidenceLog.push({ round: rounds + 1, query: q, answer: researchResults[i] });
            });
        } catch (err) {
            console.warn(`[Orchestrator] Research round ${rounds + 1} failed partially or fully:`, err?.message || err);
        }

        onUpdate?.({
            type: "FACTS_UPDATE",
            matchId,
            data: { items: evidenceLog, matchLabel: labeled.matchLabel },
        });

        rounds++;
    }

    // 1.9) Odds recovery from research
    if (isOddsMissing || Object.keys(labeled.odds || {}).length === 0) {
        const recovered = extractOddsFromResearch(evidenceLog, labeled.team_1, labeled.team_2);
        if (recovered) {
            logger.debug("[Orchestrator] Injecting recovered odds");
            labeled.odds = { ...labeled.odds, ...recovered, oddsMissing: false };
            evidenceLog.push({
                round: "SYSTEM",
                query: "ODDS_RECOVERY",
                answer: `Successfully recovered odds from research text: ${JSON.stringify(recovered)}`,
            });
        }
    }

    // 2) Formula selection
    logger.debug(`[Orchestrator] Research complete (${rounds} rounds, ${evidenceLog.length} items). Formula Selection...`);

    let formulaSelection;
    try {
        formulaSelection = await selectFormulas({
            matchContext: labeled,
            researchData: evidenceLog,
            callGPT: async ({ system, user, jsonMode }) =>
                callAgentLlm({
                    openaiParams,
                    geminiParams,
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

    // 3) Math engine execution
    let engineOutputWithFormulas = {};
    try {
        let engineResults = [];
        const selectedList = Array.isArray(formulaSelection?.selectedFormulas)
            ? formulaSelection.selectedFormulas
            : [];

        for (const sf of selectedList) {
            const formula = getFormula(sf.formulaId);

            if (!formula || !formula.execute) {
                console.warn(`[Orchestrator] Plan requested unknown formula: ${sf.formulaId}`);
                continue;
            }

            const inputData = {
                ...labeled,
                extractedParameters: sf.parameters || {},
                parameterPlan: sf.reasoning,
                researchData: evidenceLog,
            };

            if (!inputData.team_1 && !inputData.homeTeam) continue;

            const res = formula.execute(inputData, { bankroll: clampBankroll(bankroll, 300) });
            if (res) engineResults.push(res);
        }

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
        const verifyRes = await callAgentLlm({
            openaiParams,
            geminiParams,
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

    // 5) Final synthesis
    logger.debug(`[Orchestrator] Final Synthesis for ${labeled.matchLabel}...`);

    const finalRes = await callAgentLlm({
        openaiParams,
        geminiParams,
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

    // 6) Post-process recommendations
    // Priority: Engine recs (with real math) > GPT Final Synthesis recs > fallback
    const engineRecs = Array.isArray(engineOutputWithFormulas?.recommendations)
        ? engineOutputWithFormulas.recommendations.filter(r => r && (r.selection || r.market))
        : [];
    const gptRecs = Array.isArray(finalParsed.recommendations)
        ? finalParsed.recommendations.filter(r => r && (r.selection || r.market))
        : [];

    if (engineRecs.length > 0) {
        // Engine produced real math-backed recommendations — use those as base
        finalParsed.recommendations = engineRecs.map((rec) => ({
            ...rec,
            matchLabel: labeled.matchLabel,
        }));
    } else if (gptRecs.length > 0) {
        // Engine failed/empty but GPT Final Synthesis produced recommendations — use those
        finalParsed.recommendations = gptRecs.map((rec) => ({
            ...rec,
            matchLabel: labeled.matchLabel,
        }));
    } else {
        // Both empty — create fallback INFO recommendation
        finalParsed.recommendations = [
            {
                selection: labeled.matchLabel,
                market: "PROJECTED",
                odds: 0,
                recommendation_level: "INFO",
                reasoning: "Projection only: insufficient data from both math engine and AI synthesis.",
                matchLabel: labeled.matchLabel,
                math_proof: { implied_prob: 0, own_prob: 0, edge: 0, kelly: 0 },
            },
        ];
    }

    finalParsed.recommendations = finalParsed.recommendations.map((rec) => {
        let row = { ...rec, matchLabel: labeled.matchLabel };

        // --- RESCUE: Inject Odds from Context if missing in GPT output ---
        let book = Number(row.odds);
        if ((!Number.isFinite(book) || book <= 1.0001) && labeled.odds) {
            const selLower = String(row.selection || "").toLowerCase();
            const mktLower = String(row.market || "").toLowerCase();

            let recoveredOdds = 0;
            if (selLower.includes(String(labeled.team_1 || "home").toLowerCase()) || row.selection === "1")
                recoveredOdds = labeled.odds.homeWin;
            else if (selLower.includes(String(labeled.team_2 || "away").toLowerCase()) || row.selection === "2")
                recoveredOdds = labeled.odds.awayWin;
            else if (selLower.includes("draw") || row.selection === "X") recoveredOdds = labeled.odds.draw;
            else if (mktLower.includes("over") && selLower.includes("2.5")) recoveredOdds = labeled.odds.over25;
            else if (mktLower.includes("under") && selLower.includes("2.5")) recoveredOdds = labeled.odds.under25;
            else if (selLower.includes("btts") && selLower.includes("yes")) recoveredOdds = labeled.odds.bttsYes;
            else if (selLower.includes("btts") && selLower.includes("no")) recoveredOdds = labeled.odds.bttsNo;

            if (Number.isFinite(Number(recoveredOdds)) && Number(recoveredOdds) > 1) {
                row.odds = Number(recoveredOdds);
                book = row.odds;
                row.reasoning = `[SYSTEM] Odds ${book} injected from context. ${row.reasoning || ""}`;
            }
        }

        const oddsOk = Number.isFinite(book) && book > 1.0001;

        if (!oddsOk) {
            return {
                ...row,
                odds: 0,
                recommendation_level: "INFO",
                market: row.market || "PROJECTED",
                stake_size: "0 unit",
                reasoning: `[INFO] Odds unavailable → cannot compute EV reliably. ${row.reasoning || ""}`.trim(),
                math_proof: { ...row.math_proof, edge: 0, kelly: 0 },
            };
        }

        let edge = Number(row.math_proof?.edge);
        let ownProb = Number(row.math_proof?.own_prob);

        if (engineOutputWithFormulas?.computedStats?.probs) {
            const probs = engineOutputWithFormulas.computedStats.probs;
            const sel = String(row.selection || "").toLowerCase();

            if (sel.includes(String(labeled.team_1 || "pxz").toLowerCase())) ownProb = probs.homeWin;
            else if (sel.includes(String(labeled.team_2 || "pxz").toLowerCase())) ownProb = probs.awayWin;
            else if (sel.includes("draw")) ownProb = probs.draw;
            else if (sel.includes("over")) ownProb = probs.over25;
            else if (sel.includes("under")) ownProb = 1 - probs.over25;
            else if (sel.includes("yes")) ownProb = probs.bttsYes;
            else if (sel.includes("no")) ownProb = 1 - probs.bttsYes;

            if (Number.isFinite(ownProb)) {
                edge = ownProb * book - 1;
                row.math_proof = {
                    ...row.math_proof,
                    own_prob: ownProb,
                    implied_prob: 1 / book,
                    edge: edge,
                    kelly: (edge / ((book - 1) || 1)) * 0.25,
                };
            }
        }

        if (!Number.isFinite(edge)) edge = 0;

        if (edge <= 0) {
            const currentLevel = String(row.recommendation_level || "").toUpperCase();
            if (["DIAMOND", "STRONG", "GOOD"].includes(currentLevel)) {
                row.reasoning = `[MATH WARNING] Negative EV (${(edge * 100).toFixed(1)}%) vs AI Confidence. ${row.reasoning || ""
                    }`;
                row.recommendation_level = "LEAN";
            } else if (!["INFO", "PROJECTED"].includes(currentLevel) && currentLevel !== "AVOID") {
                row.reasoning = `[MATH WARNING] Zero/Neg EV. ${row.reasoning || ""}`;
            }
        } else {
            const currentLevel = String(row.recommendation_level).toUpperCase();
            if (currentLevel === "AVOID" || currentLevel.includes("INFO") || currentLevel.includes("PROJECTED")) {
                if (edge > 0.05) row.recommendation_level = "GOOD";
                else if (edge > 0.02) row.recommendation_level = "LEAN";
                else row.recommendation_level = "LEAN";

                row.reasoning = `[AUTO-UPGRADE] Valid Odds (${book}) + Positive EV (${(edge * 100).toFixed(1)}%). ${row.reasoning || ""
                    }`;
            }
        }

        if (edge > 0 && (row.stake_size === "0 unit" || !row.stake_size)) {
            row.stake_size = "1 Unit";
        }

        return row;
    });

    // 7) Sorting
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

async function callAgentLlm({ openaiParams, geminiParams, system, user, jsonMode, maxTokens, signal }) {
    const { apiKey: openAIKey, orchestratorModel, model: openaiModel } = openaiParams || {};
    const { apiKey: geminiKey, model: geminiModel } = geminiParams || {};

    let lastError = null;

    if (hasValidKey(openAIKey)) {
        try {
            const targetModel = orchestratorModel || openaiModel || "gpt-5.2-2025-12-11";
            const payload = {
                model: targetModel,
                messages: [
                    { role: "system", content: system || "" },
                    { role: "user", content: user || "" },
                ],
                max_completion_tokens: Number.isFinite(Number(maxTokens)) ? Number(maxTokens) : 2000,
            };

            if (jsonMode) payload.response_format = { type: "json_object" };

            return await retryAsync(async () => {
                // ✅ Netlify BYOK proxy call
                const data = await callLlmProxy({
                    provider: "openai",
                    apiKey: openAIKey,
                    model: targetModel,
                    payload,
                    signal,
                    timeoutMs: 90000,
                });

                return data?.choices?.[0]?.message?.content || "{}";
            }, [], 4);
        } catch (e) {
            console.warn(`[Orchestrator] OpenAI failed during agent call:`, e?.message || e);
            lastError = e;
        }
    }

    if (hasValidKey(geminiKey)) {
        try {
            if (lastError) console.info(`[Orchestrator] Attempting Gemini fallback for agent call...`);

            const targetModel = geminiModel || "gemini-2.0-flash";
            const prompt = `System Instructions:\n${system}\n\nUser Input:\n${user}`;
            const payload = {
                model: targetModel,
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: Number.isFinite(Number(maxTokens)) ? Number(maxTokens) : 2000,
                }
            };

            if (jsonMode) payload.generationConfig.response_mime_type = "application/json";

            return await retryAsync(async () => {
                const data = await callLlmProxy({
                    provider: "gemini",
                    apiKey: geminiKey,
                    model: targetModel,
                    payload,
                    signal,
                    timeoutMs: 90000,
                });
                return data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            }, [], 4);
        } catch (e) {
            console.warn(`[Orchestrator] Gemini agent call failed:`, e?.message || e);
            lastError = e || lastError;
        }
    }

    if (lastError) throw lastError;
    throw new Error("No valid LLM configuration found for agent call.");
}

/**
 * Unified Research Caller:
 * - Perplexity (primary) via proxy
 * - Gemini (secondary) via proxy (text-only; grounding/citations depends on your Netlify function support)
 * - OpenAI fallback (offline-style) via proxy
 */
async function performResearch({ perplexityParams, openaiParams, geminiParams, query, matchContext, signal }) {
    const { apiKey: pplxKey, model: pplxModel } = perplexityParams || {};
    const { apiKey: openAIKey, orchestratorModel, model: openaiModelAlt } = openaiParams || {};
    const { apiKey: geminiKey, model: geminiModel, enabled: geminiEnabled } = geminiParams || {};

    const resolvedOpenAIModel = orchestratorModel || openaiModelAlt || "gpt-5.2-2025-12-11";

    const matchInfo = matchContext
        ? `Context: ${matchContext.team_1 || matchContext.homeTeam || ""} vs ${matchContext.team_2 || matchContext.awayTeam || ""} | Sport: ${matchContext.sport || "FOOTBALL"} | Tournament: ${matchContext.tournament || "Unknown"} | Odds: ${JSON.stringify(matchContext.odds || {})}`
        : "";

    // 1) Perplexity primary
    if (hasValidKey(pplxKey)) {
        try {
            logger.debug(`[Orchestrator] Research via Perplexity...`);

            const systemContent = matchInfo
                ? `You are a factual sports researcher. Be concise, precise, and data-driven. ${matchInfo}`
                : "You are a factual sports researcher. Be concise and precise.";

            const payload = {
                model: pplxModel || "sonar-pro",
                messages: [
                    { role: "system", content: systemContent },
                    { role: "user", content: String(query || "").slice(0, 2000) },
                ],
            };

            return await retryAsync(async () => {
                const data = await callLlmProxy({
                    provider: "perplexity",
                    apiKey: pplxKey,
                    model: payload.model,
                    payload,
                    signal,
                    timeoutMs: 45000,
                });

                const content = data?.choices?.[0]?.message?.content || "";
                logger.debug(`[Orchestrator] Perplexity result: ${content.length} chars`);
                return `[SOURCE: PERPLEXITY]\n${content}`;
            }, [], 4);
        } catch (err) {
            console.warn("[Orchestrator] Perplexity FAILED:", err?.message || err);
            // fallthrough
        }
    }

    // 2) Gemini secondary (text answer; “search/grounding” = Netlify function responsibility)
    if (geminiEnabled && hasValidKey(geminiKey)) {
        try {
            logger.debug(`[Orchestrator] Research via Gemini...`);

            const prompt =
                (matchInfo ? `${matchInfo}\n\n` : "") +
                `TASK: Answer the user query with concise, data-driven bullets.\n` +
                `Query: ${String(query || "").slice(0, 2000)}\n\n` +
                `Rules:\n- Prefer concrete facts.\n- If uncertain, say so.\n- Keep it short.\n`;

            // Gemini generateContent payload (with google search tool)
            const payload = {
                model: geminiModel || "gemini-2.0-flash",
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2 },
                tools: [{ googleSearch: {} }],
            };

            const data = await callLlmProxy({
                provider: "gemini",
                apiKey: geminiKey,
                model: payload.model,
                payload,
                signal,
                timeoutMs: 45000,
            });

            const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (!content) throw new Error("Empty Gemini response");

            return `[SOURCE: GEMINI]\n${content}`;
        } catch (err) {
            console.warn("[Orchestrator] Gemini FAILED:", err?.message || err);
            // fallthrough
        }
    }

    // 3) OpenAI fallback
    if (hasValidKey(openAIKey) || hasValidKey(geminiKey)) {
        logger.debug("[Orchestrator] Using LLM for Research (Fallback)");
        const content = await callAgentLlm({
            openaiParams,
            geminiParams,
            system: "You are an expert sports analyst with vast internal knowledge. You do NOT have live web access.",
            user:
                `ANALYSIS TASK: Provide your best assessment for: "${query}"\n\n` +
                `Instructions:\n- Rely on your internal training data.\n- Clearly state this is not real-time.\n- Focus on strategic implications.`,
            jsonMode: false,
            maxTokens: 1000,
            signal,
        });

        return `[SOURCE: OPENAI_INTERNAL_KNOWLEDGE]\n${content}`;
    }

    console.error("[Orchestrator] No research API available (all keys missing)");
    return `[ERROR] Research unavailable: No API keys configured. Query was: "${query}"`;
}