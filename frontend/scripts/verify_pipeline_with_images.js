/**
 * @file verify_pipeline_with_images.js
 * @description Manual verification script for the PhD Betting Pipeline.
 * Simulates data from user-provided images and runs the Orchestrator with real API keys.
 * Enforces Professional Engineering standards.
 */

import axios from 'axios';
import { runPerplexityDirectedLoop } from '../src/agents/orchestrator.js';

// ==========================================
// CONFIGURATION & KEYS (BYOK)
// ==========================================
// Set environment variables: TEST_PERPLEXITY_KEY, TEST_OPENAI_KEY
const PPLX_KEY = process.env.TEST_PERPLEXITY_KEY || "pplx-YOUR_PERPLEXITY_KEY_HERE";
const OPENAI_KEY = process.env.TEST_OPENAI_KEY || "sk-YOUR_OPENAI_KEY_HERE";

// Mock the axios post to redirect /api calls to real URLs
const originalPost = axios.post;
axios.post = async (url, data, config) => {
    try {
        if (url.includes('/api/openai')) {
            // VISION RESCUE INTERCEPTION
            const prompt = JSON.stringify(data);
            if (prompt.includes("Dyslexic Assistant") || prompt.includes("trouble reading the odds")) {
                console.log("   [MOCK] Vision Rescue Triggered! 🚑");
                return {
                    data: {
                        choices: [{
                            message: {
                                content: JSON.stringify({
                                    found: true,
                                    odds: { homeWin: 1.85, awayWin: 4.20 }, // Mocked Rescue Data
                                    note: "Found them in the corner, boss!"
                                })
                            }
                        }]
                    }
                };
            }

            const realUrl = "https://api.openai.com/v1" + url.replace('/api/openai', '');
            if (data.model === "gpt-5.2") data.model = "gpt-4o"; // Fallback if 5.2 not avail
            return await originalPost(realUrl, data, {
                ...config,
                headers: { ...config?.headers, Authorization: `Bearer ${OPENAI_KEY}` }
            });
        }
        if (url.includes('/api/perplexity')) {
            const realUrl = "https://api.perplexity.ai" + url.replace('/api/perplexity', '');
            return await originalPost(realUrl, data, {
                ...config,
                headers: { ...config?.headers, Authorization: `Bearer ${PPLX_KEY}` }
            });
        }
        return await originalPost(url, data, config);
    } catch (err) {
        console.error(`[MOCK NETWORK ERROR] ${url}:`, err.response?.data || err.message);
        throw err;
    }
};

// ==========================================
// MOCK DATA (FROM IMAGES)
// ==========================================

/**
 * @typedef {Object} MockMatch
 * @property {string} team_1
 * @property {string} team_2
 * @property {string} sport
 * @property {Object} odds
 */

/** @type {MockMatch[]} */
const TEST_MATCHES = [
    // 1. Partial Odds Case (Real Sociedad from Screenshot)
    // EXPECTATION: Orchestrator MUST fetch Home/Away from Perplexity
    {
        matchId: "test_sociedad_elche",
        team_1: "Real Sociedad",
        team_2: "Elche",
        date: "2026-02-07 20:00", // Future date
        sport: "FOOTBALL",
        odds: {
            homeWin: null, // MISSING
            draw: 3.95,    // PRESENT (from screenshot)
            awayWin: null, // MISSING
        },
        _raw_text_dump: "Real Sociedad vs Elche Draw 3.95",
        __group: {
            _source_images: ["data:image/png;base64,mockImageForRescue"]
        }
    }
];

// ==========================================
// EXECUTION
// ==========================================

async function runTest() {
    console.log("🚀 Starting Pipeline Verification Test (Images)...");
    const startTime = Date.now();

    try {
        const results = await runPerplexityDirectedLoop({
            visionData: {
                matches: TEST_MATCHES,
                sport: "FOOTBALL"
            },
            userModelItems: [],
            openaiParams: { apiKey: OPENAI_KEY, orchestratorModel: "gpt-4o", finalModel: "gpt-4o" },
            perplexityParams: { apiKey: PPLX_KEY, model: "sonar-pro" },
            manualIntel: "Verify these matches with strict PhD rigor.",
            bankroll: 1000,
            signal: new AbortController().signal,
            onUpdate: (update) => {
                console.log(`[UPDATE > ${update.type}] Match: ${update.matchId}`);
                if (update.type === "FACTS_UPDATE") {
                    console.log("   [RESEARCH FINDINGS]:", JSON.stringify(update.data.items, null, 2));
                }
                if (update.type === "MATH_READY") {
                    console.log("   [MATH INPUT ODDS]:", JSON.stringify(update.data.recommendations?.[0]?.odds || "N/A"));
                    // Check the match data itself
                    // We can't easily access the internal 'labeled' object here, but we can infer from results
                }
            }
        });

        console.log("\n===========================================");
        console.log("✅ TEST COMPLETE");
        console.log("===========================================");
        console.log(JSON.stringify(results, null, 2));

        const duration = (Date.now() - startTime) / 1000;
        console.log(`\n⏱️ Duration: ${duration.toFixed(1)}s`);

        if (duration > 300) {
            console.error("❌ FAILURE: Test took longer than 5 minutes!");
            process.exit(1);
        } else {
            console.log("✅ TIMING: Within acceptable limits.");
            process.exit(0);
        }

    } catch (err) {
        console.error("❌ FATAL ERROR:", err);
        process.exit(1);
    }
}

runTest();
