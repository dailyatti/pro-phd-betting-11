import { computeEngine as computeFootball } from '../formulas/football.js';
import { validateEngineResult } from '../utils/validateEngineResult.js';

console.log('--- STARTING MISSING ODDS TESTS ---');

let passed = 0;
let failed = 0;

const assert = (desc, fn) => {
    try {
        const result = fn();
        if (result) {
            console.log(`[PASS] ${desc}`);
            passed++;
        } else {
            console.error(`[FAIL] ${desc}`);
            failed++;
        }
    } catch (err) {
        console.error(`[ERROR] ${desc} CRASHED:`, err);
        failed++;
    }
};

try {
    // Case 1: Completely missing odds
    const matchNoOdds = {
        id: 'test_missing_1',
        odds: {}
    };

    console.log('Testing match with empty odds object...');
    const result1 = computeFootball(matchNoOdds, { bankroll: 1000 });

    assert('Returns valid structure even with missing odds', () => result1 && result1.matchId === 'test_missing_1');
    assert('Contains warnings about missing odds', () => result1.warnings && result1.warnings.some(w => w.includes('Missing or invalid odds')));
    assert('Recommendations are empty', () => result1.recommendations.length === 0);

    // Case 2: Partial odds (missing one leg of 1X2)
    const matchPartial = {
        id: 'test_missing_2',
        odds: { homeWin: 1.5, draw: 3.5 } // Missing awayWin
    };

    console.log('Testing match with partial odds...');
    const result2 = computeFootball(matchPartial, { bankroll: 1000 });
    assert('Handled partial odds gracefully', () => result2 && result2.recommendations.length === 0);
    assert('Warns about insufficient data', () => result2.warnings.length > 0);

    // Case 3: Invalid odds (e.g. 0 or 1.0)
    // Note: normalizeMatchInput usually filters these, but let's see if engine handles if they slip through or are manually passed
    const matchInvalid = {
        id: 'test_invalid_3',
        odds: { homeWin: 1.5, draw: 3.5, awayWin: 1.0 } // 1.0 is invalid for betting
    };
    // The engine check `if (!has1X2)` relies on falsy check. 1.0 is truthy. 
    // But logic `1/1.0` is 100%, causing sumProb > 1. 
    // We added detailed validation earlier? No, we added validation to normalizeMatchInput. 
    // Let's rely on normalizeMatchInput being the gatekeeper, but engine should be safe.

    // Actually, checking engine behavior if bad odds get in:
    const result3 = computeFootball(matchInvalid, { bankroll: 1000 });
    // It should compute, but stats might be weird.
    // Ideally we want to see if it crashes.
    assert('Did not crash on 1.0 odds', () => result3 && result3.computedStats);

} catch (err) {
    console.error('GLOBAL CRASH:', err);
    failed++;
}

console.log(`\nMissing Odds Tests Complete. Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
