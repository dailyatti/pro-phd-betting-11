import { normalizeSport } from '../utils/normalizeSport.js';
import { computeEngine as computeFootball } from '../formulas/football.js';
import { validateEngineResult } from '../utils/validateEngineResult.js';

console.log('--- STARTING PhD ENGINE TESTS (DEBUG METHOD) ---');

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
    // 1. TEST NORMALIZATION
    assert('FOCI -> FOOTBALL', () => normalizeSport('FOCI') === 'FOOTBALL');
    assert('Unknown -> FOOTBALL', () => normalizeSport('Curling') === 'FOOTBALL');

    // 2. TEST FOOTBALL ENGINE
    const mockMatch = {
        id: 'test_1',
        odds: { homeWin: 2.0, draw: 3.5, awayWin: 4.0 }
    };

    console.log('Running computeFootball...');
    const processed = computeFootball(mockMatch, { bankroll: 1000, kellyFraction: 0.25 });
    console.log('Processed:', JSON.stringify(processed));

    assert('Calculated Home Probability > 0', () => processed.computedStats.homeProb > 0);
    assert('Recommendations generated', () => processed.recommendations.length > 0);

    const homeRec = processed.recommendations.find(r => r.selection === 'Home Win');
    assert('Home Win EV Check', () => Math.abs(homeRec.ev) < 0.1);

    // 3. TEST VALIDATION
    assert('Validation Check', () => {
        const val = validateEngineResult(processed, { bankroll: 1000 });
        if (!val.ok) console.error('Validation Errors:', val.errors);
        return val.ok === true;
    });

} catch (globalErr) {
    console.error('GLOBAL TEST SCRIPT CRASH:', globalErr);
}

console.log(`\nTests Complete. Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
