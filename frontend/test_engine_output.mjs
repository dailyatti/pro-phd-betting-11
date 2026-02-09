/**
 * Quick verification test for football.js engine output
 * Run with: node --experimental-vm-modules test_engine_output.mjs
 */
import { execute as executeFootball } from './src/engine/phd/formulas/football.js';

const testMatch = {
    team_1: "Liverpool",
    team_2: "Manchester City",
    odds: {
        home: 2.38,
        draw: 3.45,
        away: 2.90,
        over25: 1.73,
        under25: 2.15,
        bttsYes: 1.46,
        bttsNo: 2.65
    }
};

const config = { bankroll: 10000 };

console.log("=== Testing Football Engine Output ===");
console.log("Input:", JSON.stringify(testMatch, null, 2));

const result = executeFootball(testMatch, config);

console.log("\n=== Engine Result ===");
console.log("Recommendations count:", result?.recommendations?.length || 0);

if (result?.recommendations?.length > 0) {
    console.log("\n=== First Recommendation ===");
    const rec = result.recommendations[0];
    console.log("Selection:", rec.selection);
    console.log("Market:", rec.market);
    console.log("Odds:", rec.odds);
    console.log("Level:", rec.recommendation_level);
    console.log("math_proof.edge:", rec.math_proof?.edge, "(type:", typeof rec.math_proof?.edge, ")");
    console.log("math_proof.ev:", rec.math_proof?.ev, "(type:", typeof rec.math_proof?.ev, ")");
    console.log("math_proof.own_prob:", rec.math_proof?.own_prob);

    console.log("\n=== All Positive EV Recommendations ===");
    result.recommendations.filter(r => r.math_proof?.edge > 0).forEach(r => {
        console.log(`  ${r.selection}: edge=${(r.math_proof.edge * 100).toFixed(2)}%, odds=${r.odds}`);
    });
}
