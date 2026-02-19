/**
 * Custom hook to manage the analysis pipeline.
 * Orchestrates Vision, Research, and Strategy agents.
 * 
 * @module hooks/useAnalysis
 */

import { useState, useRef, useCallback } from 'react';
import { runVisionScraper, runVisionRescue } from '../agents';
import { runPerplexityDirectedLoop } from '../agents/orchestrator.js';
import { hasPrimaryOdds } from '../agents/vision/utils/matchValidator.js';

/**
 * Manages the full analysis workflow: Vision -> Explosion -> Orchestration -> Result.
 * 
 * @param {Object} config
 * @param {Object} config.apiKeys - { openai, perplexity }
 * @param {Object} config.modelSettings - { openai, perplexity }
 * @param {Function} config.updateBlackboard - Callback to update global state
 * @param {boolean} config.isMountedRef - Ref to ensure no updates on unmount
 * @returns {Object} Analysis state and start/stop handlers
 */
export const useAnalysis = ({ apiKeys, modelSettings, updateBlackboard, isMountedRef, onComplete = null }) => {
    const [status, setStatus] = useState('IDLE'); // IDLE, VISION, FACTS, STRATEGY, ERROR, COMPLETE
    const [error, setError] = useState(null);

    // Abort controller for cancellation
    const abortRef = useRef(null);
    const runIdRef = useRef(0);

    // Check against stale closures for callbacks
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete; // Always update to latest

    /**
     * @returns {void}
     */
    const stopAnalysis = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort();
        }
        runIdRef.current++; // Invalidate current run
        setStatus('IDLE');
    }, []);


    /**
     * Starts the analysis pipeline.
     * @param {Array} imageGroups - Groups of images to analyze OR manual text groups
     * @param {string} manualIntel - Optional manual insider text
     * @param {number|string} bankroll - Optional bankroll amount
     */
    const startAnalysis = useCallback(async (imageGroups, manualIntel = '', bankroll = '') => {
        console.log('[Analysis Debug] startAnalysis called with groups:', imageGroups);
        // 1. Validation
        if (status !== 'IDLE' && status !== 'ERROR' && status !== 'COMPLETE') return;

        // Check if we have valid input: either images OR manual text data (isManualInput)
        const hasImages = imageGroups.length > 0 && imageGroups.some(g => g?.images?.length > 0);
        const hasManualData = imageGroups.length > 0 && imageGroups.some(g => g?.isManualInput);

        if (!hasImages && !hasManualData) {
            setError('Please upload at least one image or paste match text.');
            return;
        }

        // SIMULATION MODE CHECK
        // Simulation if no keys at all, but here checks openai specifically. 
        // We should allow simulation if explicit simulation mode, otherwise try to use available keys.
        // For now, assume if NO keys provided, it's simulation.
        const isSimulation = !apiKeys.openai;
        console.log(isSimulation ? '--- SIMULATION MODE ACTIVE ---' : '--- LIVE AGENT MODE ---');

        const bankrollValue = (bankroll === '' || bankroll === null || bankroll === undefined) ? 300 : Number(bankroll);
        if (Number.isNaN(bankrollValue)) {
            // Fallback if parsing failed somehow despite check
            console.warn("Invalid bankroll, defaulting to 300");
        }

        // 2. Initialization
        abortRef.current = new AbortController();
        const currentRunId = ++runIdRef.current;
        const signal = abortRef.current.signal;

        setError(null);
        updateBlackboard(() => ({
            MATCH_DATA: [],
            FACT_REPORT: [],
            INSIDER_INTEL: [],
            STRATEGY_REPORT: null,
            runId: currentRunId
        }));

        try {
            if (!isMountedRef.current) return;

            // -------------------------
            // STEP 1: VISION (ALL GROUPS)
            // -------------------------
            setStatus('VISION');
            const rawVisionResults = [];

            if (isSimulation) {
                // MOCK VISION
                await new Promise(r => setTimeout(r, 2000)); // Simulate delay
                imageGroups.forEach((group, idx) => {
                    rawVisionResults.push({
                        matchLabel: group.matchLabel || `Match ${idx + 1}`,
                        scanResults: group.scanResults || [],
                        sport: 'FOOTBALL',
                        matches: [{
                            team_1: 'Simulation Team A',
                            team_2: 'Simulation Team B',
                            odds_1: 2.10,
                            odds_draw: 3.40,
                            odds_2: 3.10,
                            event_time: new Date(Date.now() + 86400000).toISOString()
                        }],
                        __group: {
                            id: group.id,
                            matchId: group.matchId,
                            matchLabel: group.matchLabel || `Sim Match ${idx + 1}`,
                            sport: group.sport || 'FOOTBALL',
                            tournament: group.tournament
                        }
                    });
                });
            } else {
                // REAL VISION & MANUAL INPUT HANDLING

                // 1. Handle Manual Input Groups (Text Mode) -> Skip Vision
                const manualGroups = imageGroups.filter(g => g.isManualInput);
                manualGroups.forEach(g => {
                    // Normalize text parser output to Vision-compatible format
                    const normalizedMatches = (g.scanResults || []).map(sr => {
                        // Extract O/U line (default 2.5)
                        const ouLine = sr.overUnderLine || sr.markets?.overUnder?.line || 2.5;

                        return {
                            // Core identifiers (Vision format)
                            team_1: sr.team1 || sr.homeTeam || 'Team 1',
                            team_2: sr.team2 || sr.awayTeam || 'Team 2',
                            homeTeam: sr.team1 || sr.homeTeam || 'Team 1',
                            awayTeam: sr.team2 || sr.awayTeam || 'Team 2',
                            sport: (sr.sport || g.sport || 'FOOTBALL').toUpperCase(),
                            tournament: sr.competition || sr.league || 'Unknown',
                            kickoff_time: sr.time || 'TBD',
                            matchLabel: sr.matchLabel || `${sr.team1 || 'Home'} vs ${sr.team2 || 'Away'}`,
                            // Odds in Vision format (nested object) - MUST match engine expectations
                            odds: {
                                // 1X2 Market
                                homeWin: Number(sr.homeOdds || sr.markets?.moneyline?.home) || null,
                                draw: Number(sr.drawOdds || sr.markets?.moneyline?.draw) || null,
                                awayWin: Number(sr.awayOdds || sr.markets?.moneyline?.away) || null,
                                // Over/Under 2.5 Market (engine expects over25/under25)
                                over25: Number(sr.overOdds || sr.markets?.overUnder?.over) || null,
                                under25: Number(sr.underOdds || sr.markets?.overUnder?.under) || null,
                                // Also keep generic over/under for fallback
                                over: Number(sr.overOdds || sr.markets?.overUnder?.over) || null,
                                under: Number(sr.underOdds || sr.markets?.overUnder?.under) || null,
                                overUnderLine: ouLine,
                                // BTTS Market
                                bttsYes: Number(sr.bttsYes || sr.markets?.btts?.yes) || null,
                                bttsNo: Number(sr.bttsNo || sr.markets?.btts?.no) || null,
                            },
                            // Also keep flat odds for compatibility
                            homeOdds: Number(sr.homeOdds || sr.markets?.moneyline?.home) || null,
                            drawOdds: Number(sr.drawOdds || sr.markets?.moneyline?.draw) || null,
                            awayOdds: Number(sr.awayOdds || sr.markets?.moneyline?.away) || null,
                            overOdds: Number(sr.overOdds || sr.markets?.overUnder?.over) || null,
                            underOdds: Number(sr.underOdds || sr.markets?.overUnder?.under) || null,
                            // Original markets structure
                            markets: sr.markets,
                            isManualInput: true,
                        };
                    });

                    rawVisionResults.push({
                        matchLabel: g.matchLabel,
                        scanResults: normalizedMatches,
                        sport: (g.sport || 'FOOTBALL').toUpperCase(),
                        matches: normalizedMatches,
                        __group: {
                            id: g.id,
                            matchId: g.id,
                            matchLabel: g.matchLabel,
                            sport: (g.sport || 'FOOTBALL').toUpperCase(),
                            isManualInput: true,
                            _source_images: []
                        }
                    });
                });

                // 2. Handle Image Groups -> Run Vision Scraper
                const visionGroups = imageGroups.filter(g => !g.isManualInput && g?.images?.length > 0);

                for (const group of visionGroups) {
                    if (signal.aborted) break;

                    const allImagesRaw = group.images.map((img) => img.raw);
                    console.log(`[Analysis Debug] Processing group ${group.matchLabel}. Images:`, allImagesRaw.map(r => ({ length: r?.length, prefix: String(r).slice(0, 30) })));

                    // Run Vision Scraper
                    // Vision depends on OpenAI.
                    const visionModel = modelSettings?.openai || 'gpt-5.2';
                    console.log(`[useAnalysis] Running Vision Scraper with model: ${visionModel}`);

                    const matchData = await runVisionScraper(
                        { key: apiKeys.openai, model: visionModel },
                        allImagesRaw,
                        signal,
                        group.matchLabel
                    );

                    if (!matchData || typeof matchData !== 'object') {
                        console.error(`Vision returned invalid data for group "${group.matchLabel}"`);
                        continue;
                    }

                    // VISION RESCUE (IMMEDIATE)
                    if (matchData.matches && Array.isArray(matchData.matches) && apiKeys.openai) {
                        for (const subMatch of matchData.matches) {
                            const oddsFlat = subMatch.odds || {};
                            if (!hasPrimaryOdds(oddsFlat, matchData.sport)) {
                                console.log(`[Vision Rescue] Triggering immediate rescue for ${subMatch.team_1} vs ${subMatch.team_2}`);
                                const missing = [];
                                if (!oddsFlat.homeWin) missing.push("homeWin");
                                if (!oddsFlat.draw && matchData.sport === 'FOOTBALL') missing.push("draw");
                                if (!oddsFlat.awayWin) missing.push("awayWin");

                                try {
                                    const rescueRes = await runVisionRescue(
                                        { key: apiKeys.openai, model: visionModel },
                                        allImagesRaw,
                                        subMatch.team_1,
                                        subMatch.team_2,
                                        missing,
                                        signal
                                    );

                                    if (rescueRes && rescueRes.found && rescueRes.odds) {
                                        console.log(`[Vision Rescue] Success for ${subMatch.team_1}! Merging odds:`, rescueRes.odds);
                                        subMatch.odds = { ...subMatch.odds, ...rescueRes.odds, oddsMissing: false };
                                    }
                                } catch (err) {
                                    console.warn("[Vision Rescue] Failed during initial scan for match:", subMatch.team_1, err);
                                }
                            }
                        }
                    }

                    // Attach Meta
                    matchData.sport = matchData.sport || group.sport;
                    matchData.__group = {
                        id: group.id,
                        matchId: group.matchId,
                        matchLabel: group.matchLabel,
                        sport: group.sport,
                        tournament: group.tournament,
                        _source_images: allImagesRaw
                    };

                    rawVisionResults.push(matchData);
                }
            }

            if (!rawVisionResults.length) {
                // If it was just text input and parsing failed invisibly, or vision failed
                throw new Error('No match data could be extracted.');
            }

            // -------------------------
            // STEP 2: FLATTEN / EXPLODE MATCHES
            // -------------------------
            const explodedMatchList = [];

            rawVisionResults.forEach(visionData => {
                if (visionData.matches && Array.isArray(visionData.matches) && visionData.matches.length > 0) {
                    visionData.matches.forEach((subMatch, idx) => {
                        const finalMatch = {
                            ...visionData,
                            ...subMatch,
                            __group: {
                                ...visionData.__group,
                                matchLabel: `${subMatch.team_1 || 'Team 1'} vs ${subMatch.team_2 || 'Team 2'}`,
                                matchId: `${visionData.__group.matchId}_${idx}`
                            },
                            matches: [subMatch]
                        };
                        finalMatch.sport = finalMatch.sport || subMatch.sport || visionData.sport || visionData.__group?.sport || 'UNKNOWN';
                        explodedMatchList.push(finalMatch);
                    });
                } else {
                    explodedMatchList.push(visionData);
                }
            });

            updateBlackboard(prev => ({ ...prev, MATCH_DATA: [...explodedMatchList] }));

            // -------------------------
            // STEP 3: ORCHESTRATION (FACTS)
            // -------------------------
            console.log('[Analysis Debug] Starting STEP 3: FACTS phase');
            setStatus('FACTS');

            const strategies = [];
            const factReports = [];
            const insiderReports = [];

            // Buffer for Strategies (ATOMIC RELEASE PATTERN) - Use Map for O(1) deduplication
            const bufferedStrategies = new Map();

            // Callback for streaming updates
            const handleStreamingUpdate = ({ type, matchId, data }) => {
                if (!isMountedRef.current) return;

                // Special handling for STRATEGY -> Buffer it, don't show yet
                if (type === 'STRATEGY_COMPLETE') {
                    // Use matchId as primary key, fallback to normalized label for deduplication
                    const strategyKey = data?.matchId || (data?.matchLabel || '').toLowerCase().trim();
                    bufferedStrategies.set(strategyKey, data);
                    // DO NOT UPDATE BLACKBOARD YET
                    return;
                }

                updateBlackboard(prev => {
                    const newState = { ...prev };

                    // Find match label from existing data if possible, OR use data.matchLabel (preferred provided by orchestrator)
                    const matchEntry = prev.MATCH_DATA?.find(m => m.matchId === matchId || m.__group?.matchId === matchId);
                    const label = data?.matchLabel || matchEntry?.matchLabel || matchEntry?.__group?.matchLabel || `Match ${matchId}`;

                    if (type === 'INTEL_UPDATE') {
                        const existingIdx = newState.INSIDER_INTEL?.findIndex(r => r.matchLabel === label);
                        const reportItem = {
                            matchLabel: label,
                            rounds: 0,
                            notes: 'Processing Insider Intel...',
                            raw_content: data[data.length - 1]?.answer // Latest Intel
                        };

                        const currentArr = newState.INSIDER_INTEL || [];
                        if (existingIdx >= 0) {
                            currentArr[existingIdx] = { ...currentArr[existingIdx], ...reportItem };
                        } else {
                            currentArr.push(reportItem);
                        }
                        newState.INSIDER_INTEL = currentArr;
                    }
                    else if (type === 'FACTS_UPDATE') {
                        const evidenceItems = Array.isArray(data) ? data : (data.items || []);
                        const existingIdx = newState.FACT_REPORT?.findIndex(r => r.matchLabel === label);
                        const reportItem = {
                            matchLabel: label,
                            evidence: evidenceItems
                        };

                        const currentArr = newState.FACT_REPORT || [];
                        if (existingIdx >= 0) {
                            currentArr[existingIdx] = { ...currentArr[existingIdx], ...reportItem };
                        } else {
                            currentArr.push(reportItem);
                        }
                        newState.FACT_REPORT = currentArr;
                    }

                    return newState;
                });
            };

            // Helper: Analyze Single Match
            const analyzeMatch = async (md) => {
                if (runIdRef.current !== currentRunId || !isMountedRef.current) return null;
                const sport = md.sport || md.__group?.sport || 'UNKNOWN';
                const groupLabel = md?.__group?.matchLabel;

                if (isSimulation) {
                    await new Promise(r => setTimeout(r, 1500));
                    return { matchLabel: groupLabel, sport, recommendations: [], explanation: 'Simulated' };
                }

                try {
                    console.log(`[Analysis Debug] Calling runPerplexityDirectedLoop for ${groupLabel}`);

                    const orchestratorResult = await runPerplexityDirectedLoop({
                        visionData: md,
                        userModelItems: {},
                        openaiParams: {
                            apiKey: apiKeys.openai,
                            model: modelSettings.openai || 'gpt-5.2',
                        },
                        perplexityParams: apiKeys.perplexity ? {
                            apiKey: apiKeys.perplexity,
                            model: modelSettings.perplexity
                        } : null,
                        geminiParams: apiKeys.gemini ? {
                            apiKey: apiKeys.gemini,
                            model: modelSettings.gemini,
                            enabled: true // Explicitly enable if key is present
                        } : null,
                        manualIntel: manualIntel,
                        bankroll: bankrollValue,
                        signal,
                        onUpdate: (partialResult) => {
                            if (runIdRef.current === currentRunId && isMountedRef.current) {
                                handleStreamingUpdate({
                                    type: partialResult.type,
                                    matchId: md.matchId || md.__group?.matchId,
                                    data: partialResult.data
                                });
                            }
                        }
                    });

                    return {
                        matchLabel: groupLabel,
                        sport: sport,
                        model_used: modelSettings.openai || 'gpt-5.2',
                        evidence: orchestratorResult.evidence_log,
                        rounds: orchestratorResult.rounds_used,
                        ...orchestratorResult
                    };
                } catch (err) {
                    console.error(`[Analysis] Failed for ${groupLabel}:`, err);
                    return { matchLabel: groupLabel, error: 'FAILED', details: err.message };
                }
            };

            // 3. Batch Execution
            const BATCH_SIZE = 3;
            const allResults = [];
            for (let i = 0; i < explodedMatchList.length; i += BATCH_SIZE) {
                if (signal.aborted || runIdRef.current !== currentRunId) break;
                const batch = explodedMatchList.slice(i, i + BATCH_SIZE);
                // analyzeMatch calls handleStreamingUpdate -> which now buffers Strategy
                const batchResults = await Promise.all(batch.map(md => analyzeMatch(md)));
                allResults.push(...batchResults);
            }

            const validResults = allResults.filter(Boolean);

            // -------------------------
            // STEP 4: STRATEGY & FINAL UPDATE
            // -------------------------
            setStatus('STRATEGY');

            const validationError = validResults.find(r => r?.error === 'ENGINE_VALIDATION_FAILED');
            if (validationError) {
                setError(`Engine validation failed on: ${validationError.matchLabel}`);
                setStatus('ERROR');
                return;
            }

            for (const result of validResults) {
                factReports.push({
                    matchLabel: result.matchLabel,
                    evidence: result.evidence_log ?? result.evidence
                });
                insiderReports.push({
                    matchLabel: result.matchLabel,
                    rounds: result.rounds_used ?? result.rounds,
                    notes: `PhD Analysis (${result.model_used})`,
                    raw_content: manualIntel ? `Manual Note included.` : null
                });

                // Ensure result is also in buffer if streaming missed it (redundancy)
                if (result.recommendations) {
                    const strategyKey = result.matchId || (result.matchLabel || '').toLowerCase().trim();
                    if (!bufferedStrategies.has(strategyKey)) {
                        bufferedStrategies.set(strategyKey, result);
                    }
                }
            }

            // ATOMIC UPDATE: Release everything at once
            updateBlackboard(prev => ({
                ...prev,
                FACT_REPORT: [...factReports],
                INSIDER_INTEL: [...insiderReports],
                STRATEGY_REPORT: { strategies: Array.from(bufferedStrategies.values()) }, // ATOMIC RELEASE
                runId: currentRunId
            }));

            // Notify completion with results (for History)
            console.log("[useAnalysis] Calling onCompleteRef with results:", validResults);

            if (validResults && validResults.length > 0) {
                if (onCompleteRef.current) {
                    try {
                        onCompleteRef.current(validResults);
                    } catch (e) {
                        console.error("[useAnalysis] Error in onComplete callback:", e);
                    }
                } else {
                    console.warn("[useAnalysis] onComplete callback is missing/null!");
                }
            } else {
                console.warn("[useAnalysis] No valid results to save to history.");
            }

            setStatus('COMPLETE');
        } catch (err) {
            if (err.name === 'AbortError') {
                setStatus('IDLE');
                return;
            }
            console.error('[Analysis] Pipeline Error:', err);
            setError(err.message || 'Analysis failed unexpectedly.');
            setStatus('ERROR');
        }
    }, [apiKeys, modelSettings, updateBlackboard, isMountedRef, status /* onComplete removed from dependency to avoid re-creation loop, though harmless with ref */]);

    return {
        status,
        setStatus,
        error,
        setError,
        startAnalysis,
        stopAnalysis
    };
};
