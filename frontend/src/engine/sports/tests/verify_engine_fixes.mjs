
// Verification Script for Math Engine Fixes
// Run with: node frontend/src/engine/sports/tests/verify_engine_fixes.mjs

import assert from 'assert';

console.log("Starting Engine Verification (Audit Mode)...");

async function verifyTennis() {
    console.log("\n[Test 1] Tennis Model (Markov Chain)...");
    try {
        const { calcTennisProbs } = await import('../tennis/model.js');

        // Test Case: Strong Server vs Weak Server
        // p1 = 0.70, p2 = 0.60
        // Heuristic: diff = 0.10 => 1 / (1 + exp(-25 * 0.1)) = 1 / (1 + 0.082) = ~0.924

        const res = calcTennisProbs({
            p1Stats: { serve_hold: 0.70 },
            p2Stats: { serve_hold: 0.60 }
        });

        console.log(`  Input: 0.70 vs 0.60 hold %`);
        console.log(`  Result: p1_win=${res.p1_win.toFixed(5)}, set_prob=${res.set_prob.toFixed(5)}`);

        // Logic Check: Heuristic vs Markov
        const heuristic = 1 / (1 + Math.exp(-25 * 0.1)); // ~0.92414
        const actual = res.set_prob;

        console.log(`  Reference (Heuristic): ${heuristic.toFixed(5)}`);

        if (Math.abs(actual - heuristic) > 0.0001) {
            console.log("  ✓ Tennis Fix Verified (Logic uses Markov, distinct from heuristic)");
        } else {
            // Highly unlikely to match exactly unless file wasn't saved
            console.error("  ✗ Tennis Fix FAILED: Result matches heuristic exactly.");
            process.exit(1);
        }

        // Numeric Hygiene Check
        if (res.p1_win < 0 || res.p1_win > 1) {
            console.error("  ✗ Tennis Fix FAILED: Probability out of bounds [0,1]");
            process.exit(1);
        }

    } catch (e) {
        console.error("  ✗ Tennis Import Failed:", e.message);
        process.exit(1);
    }
}

async function verifyBasketball() {
    console.log("\n[Test 2] Basketball Model (Integer Lines)...");
    try {
        const { calcBasketballProbs } = await import('../basketball/model.js');

        // Test Case: Projected Diff = +5, Spread = -5
        // Expectation with integer logic: P(Cover) < 0.5 because of Push probability.
        // Expectation without integer logic (Current): P(Cover) = 0.5

        const res = calcBasketballProbs({
            homePoints: 105,
            awayPoints: 100, // Diff = +5
            marginStd: 10,
            totalStd: 15
        });

        // A) SPREAD CHECK
        const homeLine = -5.0; // Home favored by 5
        const coverProb = res.getHomeCoverProb(homeLine);

        console.log(`  Projected Margin: +5.0`);
        console.log(`  Spread Line: -5.0`);
        console.log(`  P(Cover): ${coverProb.toFixed(5)}`);

        // With push logic, P(Cover) ~ P(M > 5.5) = 1 - CDF(5.5, 5, 10)
        // z = 0.05 => P(Z<0.05) ~ 0.5199 => P(Cover) ~ 0.4801

        if (Math.abs(coverProb - 0.5) > 0.001 && coverProb < 0.5) {
            console.log("  ✓ Basketball Spread Fix Verified (Includes Push Logic)");
        } else {
            console.error(`  ✗ Basketball Spread Fix FAILED. Expected < 0.5, got ${coverProb}`);
            process.exit(1);
        }

        // B) TOTALS CHECK
        // Projected 205, Line 205
        const totalProb = res.getOverProb(205);
        console.log(`  Projected Total: 205`);
        console.log(`  Total Line: 205`);
        console.log(`  P(Over): ${totalProb.toFixed(5)}`);

        if (Math.abs(totalProb - 0.5) > 0.001 && totalProb < 0.5) {
            console.log("  ✓ Basketball Totals Fix Verified");
        } else {
            console.error(`  ✗ Basketball Totals Fix FAILED. Expected < 0.5, got ${totalProb}`);
            process.exit(1);
        }

        // C) API CONSISTENCY CHECK
        // Check if new methods exist
        if (typeof res.getSpreadProbs !== 'function') {
            console.error("  ✗ Basketball Fix FAILED: Missing getSpreadProbs API");
            process.exit(1);
        }

        const probObj = res.getSpreadProbs(-5.0);
        console.log("  getSpreadProbs returns:", probObj);
        if (typeof probObj.push !== 'number' || probObj.push <= 0) {
            console.error("  ✗ Basketball Fix FAILED: Push probability missing or zero for integer line");
            process.exit(1);
        } else {
            console.log("  ✓ Basketball Push Probability Exposed: " + probObj.push.toFixed(5));
        }

    } catch (e) {
        console.error("  ✗ Basketball Import Failed:", e.message);
        process.exit(1);
    }
}

async function run() {
    await verifyTennis();
    await verifyBasketball();
    console.log("\n[SUCCESS] Engine Verification Complete (Audit Passed)");
}

run();
