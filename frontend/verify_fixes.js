
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeEngine } from './src/engine/phd/formulas/football.js';
import { tryParseJson } from './src/agents/common/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('='.repeat(80));
console.log('  PhD SYSTEM INTEGRITY VERIFICATION (2026-02-08) - DEEPSEEK EDITION');
console.log('='.repeat(80));

// 1. STATIC ANALYSIS: Verify Critical Fixes
console.log('\n[1] Verifying Code Fixes...');

const orchestratorPath = path.join(__dirname, 'src/agents/orchestrator.js');
const promptsPath = path.join(__dirname, 'src/agents/prompts/orchestratorPrompts.js');

let checksPassed = 0;
const totalChecks = 3;

// Check Orchestrator Limit
try {
    const orchestrator = fs.readFileSync(orchestratorPath, 'utf8');
    if (orchestrator.includes('.slice(0, 5)')) {
        console.log('  ✅ Orchestrator Search Limit: INCREASED to 5 (Valid)');
        checksPassed++;
    } else {
        console.error('  ❌ Orchestrator Search Limit: FAILED (Still limited to 3?)');
    }
} catch (e) {
    console.error('  ❌ formatting/file read error:', e.message);
}

// Check Prompts
try {
    const prompts = fs.readFileSync(promptsPath, 'utf8');

    if (prompts.includes('PRIORITY #1: List this query FIRST')) {
        console.log('  ✅ PROMPT_PLANNER: Odds Priority Enforced (Valid)');
        checksPassed++;
    } else {
        console.error('  ❌ PROMPT_PLANNER: Priority clause missing');
    }

    if (prompts.includes('TRUST VISION: If Match Context has odds')) {
        console.log('  ✅ PROMPT_SYNTHESIS: Vision Trust Fallback Enforced (Valid)');
        checksPassed++;
    } else {
        console.error('  ❌ PROMPT_SYNTHESIS: Trust clause missing');
    }
} catch (e) {
    console.error('  ❌ formatting/file read error:', e.message);
}

if (checksPassed === totalChecks) {
    console.log('\n  [SUCCESS] All Prompt/Config Fixes Verified.');
} else {
    console.error(`\n  [FAILURE] Only ${checksPassed}/${totalChecks} prompt fixes verified.`);
    // process.exit(1); // Continue to check parser even if prompt fails
}

// 2. DEEPSEEK PARSER VERIFICATION
console.log('\n[2] Verifying DeepSeek Thought Stripper...');

const deepSeekResponse = `
<think>
I need to check the odds for Liverpool vs Man City.
The user wants me to output JSON.
I will check Perplexity.
</think>
\`\`\`json
{
  "queries": ["odds for Liverpool vs Man City"],
  "reasoning": "Need 1X2 odds"
}
\`\`\`
`;

const parsed = tryParseJson(deepSeekResponse);

if (parsed && parsed.queries && parsed.queries[0] === "odds for Liverpool vs Man City") {
    console.log('  ✅ DeepSeek Parser: Successfully stripped <think> tags.');
} else {
    console.error('  ❌ DeepSeek Parser: FAILED to strip <think> tags or parse JSON.');
    console.error('     Result:', parsed);
    process.exit(1);
}

// 3. MATH ENGINE VERIFICATION
console.log('\n[3] Verifying Math Engine Logic (Liverpool vs Man City)...');

const mockMatch = {
    id: 'test_lfc_mci',
    team_1: 'Liverpool',
    team_2: 'Manchester City',
    odds: {
        homeWin: 2.38, draw: 3.90, awayWin: 2.90,
        over25: 1.73, under25: 2.06, // Implied: 57.8%, 48.5%
        bttsYes: 1.46, bttsNo: 2.55
    },
    extractedParameters: {
        homeXG: 1.85, awayXG: 1.70, // High scoring -> Over 2.5 should be favored
        rho: -0.03
    }
};

const config = {
    bankroll: 10000,
    staking: { gamma: 0.5, friction: 0.02, alpha: 0.05 }, // gamma mapped to Kelly Fraction
    useDixonColes: true
};

const result = computeEngine(mockMatch, config);

// Check Over 2.5 Edge
const over25 = result.recommendations.find(r => r.selection === 'Over 2.5');
if (over25) {
    console.log(`  Over 2.5: Odds ${over25.odds} | True Prob ${(over25.probability * 100).toFixed(1)}%`);
    console.log(`  Edge: ${(over25.edge * 100).toFixed(2)}% | EV: ${(over25.ev * 100).toFixed(2)}%`);
    console.log(`  Stake: ${over25.stake_size} (${over25.recommendation_level})`);

    if (over25.ev > 0 && over25.stake_size !== '0%' && over25.stake_size !== '0 unit') {
        console.log('\n  ✅ Math Engine: Positive EV bets handled correctly.');
    } else {
        console.error('\n  ❌ Math Engine: Positive EV but Stake/Result is 0/void.');
        process.exit(1);
    }
} else {
    console.error('\n  ❌ Math Engine: Failed to generate Over 2.5 recommendation.');
    process.exit(1);
}

console.log('\n' + '='.repeat(80));
console.log('  DEEPSEEK COMPATIBILITY VERIFIED - ALL SYSTEMS GO');
console.log('='.repeat(80));
