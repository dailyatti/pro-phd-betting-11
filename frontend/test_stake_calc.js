
import { phdStakeRecommendation, optimizeStakeCVaR, checkPosteriorCalibration } from './src/utils/phdStakeOptimizer.js';

// User scenario
const modelProb = 0.288;
const odds = 3.80;
const bankroll = 10000;
const options = {
    gamma: 0.5,
    friction: 0.02,
    alpha: 0.05,
    maxStake: 0.10, // 10% cap
    step: 0.001
};

console.log("=== STAKE CALCULATION DEBUG ===");
console.log(`Input: P=${modelProb}, Odds=${odds}, Limits=${JSON.stringify(options)}`);

const calibration = checkPosteriorCalibration(modelProb, odds);
console.log("\nCalibration Check:");
console.log(JSON.stringify(calibration, null, 2));

const optimization = optimizeStakeCVaR(modelProb, odds, options);
console.log("\nOptimization Result:");
console.log(JSON.stringify(optimization, null, 2));

const finalRec = phdStakeRecommendation(modelProb, odds, bankroll, options);
console.log("\nFinal Recommendation:");
console.log(JSON.stringify(finalRec, null, 2));
