/**
 * PhD Engine Test Script
 * Tests the mathematical engine with real odds data from the test image
 * 
 * Test Image Data (Hungarian NBI Football):
 * - Match 1: Puskás Akadémia vs ZTE (02.08. 15:00)
 * - Match 2: Nyíregyháza vs MTK (02.08. 17:15)
 */

import { computeEngine } from './src/engine/phd/formulas/football.js';
import { phdStakeRecommendation, checkPosteriorCalibration, optimizeStakeCVaR } from './src/utils/phdStakeOptimizer.js';
import { poissonPmf, dixonColesTau } from './src/engine/phd/math/distributions.js';

console.log('═══════════════════════════════════════════════════════════════════');
console.log('                   PhD BETTING ENGINE TEST');
console.log('         Testing with Real Hungarian NBI Match Data');
console.log('═══════════════════════════════════════════════════════════════════\n');

// ============================================================================
// TEST 1: Puskás Akadémia vs ZTE
// ============================================================================
const match1 = {
    id: 'puskas_vs_zte',
    team_1: 'Puskás Akadémia',
    team_2: 'ZTE',
    sport: 'FOOTBALL',
    odds: {
        homeWin: 1.95,
        draw: 3.60,
        awayWin: 3.75,
        over25: 1.83,
        under25: 1.94,
        bttsYes: 1.71,
        bttsNo: 2.04
    },
    // Simulated research data (in real app, this would come from Perplexity)
    extractedParameters: {
        homeXG: 1.65,  // Puskás Akadémia typical xG at home
        awayXG: 1.15,  // ZTE typical xG away
        homeELO: 1520,
        awayELO: 1380,
        rho: -0.03     // Dixon-Coles correlation
    }
};

const match2 = {
    id: 'nyiregyhaza_vs_mtk',
    team_1: 'Nyíregyháza',
    team_2: 'MTK',
    sport: 'FOOTBALL',
    odds: {
        homeWin: 2.07,
        draw: 3.60,
        awayWin: 3.45,
        over25: 1.76,
        under25: 2.02,
        bttsYes: 1.64,
        bttsNo: 2.14
    },
    extractedParameters: {
        homeXG: 1.45,
        awayXG: 1.30,
        homeELO: 1410,
        awayELO: 1480,
        rho: -0.03
    }
};

const config = {
    bankroll: 10000,  // $10,000 bankroll for testing
    staking: {
        gamma: 0.5,     // CVaR penalty weight
        friction: 0.02, // L1 regularization (2% friction)
        alpha: 0.05     // 5% tail for CVaR
    },
    useDixonColes: true,
    eloBlend: {
        enabled: true,
        weight: 0.30
    }
};

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  MATCH 1: Puskás Akadémia vs ZTE                               ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const result1 = computeEngine(match1, config);

console.log('📊 Model Parameters:');
console.log(`   Home xG (λH): ${result1.computedStats.homeXG.toFixed(2)}`);
console.log(`   Away xG (λA): ${result1.computedStats.awayXG.toFixed(2)}`);
console.log(`   Dixon-Coles ρ: ${result1.computedStats.rho}`);
console.log(`   Formula: ${result1.formulaUsed}`);
console.log(`   Data Source: ${result1.computedStats.dataSource}\n`);

console.log('📈 PhD Probability Analysis:');
console.log(`   Home Win: ${(result1.computedStats.probs.homeWin * 100).toFixed(2)}%`);
console.log(`   Draw:     ${(result1.computedStats.probs.draw * 100).toFixed(2)}%`);
console.log(`   Away Win: ${(result1.computedStats.probs.awayWin * 100).toFixed(2)}%`);
console.log(`   Over 2.5: ${(result1.computedStats.probs.over25 * 100).toFixed(2)}%`);
console.log(`   BTTS Yes: ${(result1.computedStats.probs.bttsYes * 100).toFixed(2)}%\n`);

console.log('💎 BETTING RECOMMENDATIONS (Sorted by EV):');
console.log('─────────────────────────────────────────────────────────────────');

result1.recommendations.forEach((rec, i) => {
    const evStr = rec.ev !== undefined ? `${(rec.ev * 100).toFixed(2)}%` : 'N/A';
    const edgeStr = rec.edge !== undefined ? `${(rec.edge * 100).toFixed(2)}%` : 'N/A';
    const level = rec.recommendation_level;
    const emoji = level === 'DIAMOND' ? '💎' : level === 'GOLD' ? '🥇' : level === 'GOOD' ? '✅' : level === 'LEAN' ? '🔶' : level === 'INFO' ? 'ℹ️' : '❌';

    console.log(`\n${emoji} [${level}] ${rec.market}: ${rec.selection}`);
    console.log(`   Odds: ${rec.odds || 'N/A'} | True Prob: ${(rec.probability * 100).toFixed(1)}%`);
    console.log(`   Edge: ${edgeStr} | EV: ${evStr}`);
    console.log(`   PhD Stake: ${rec.stake_size || '0%'}`);
    if (rec.reasoning) console.log(`   📝 ${rec.reasoning}`);
});

console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
console.log('║  MATCH 2: Nyíregyháza vs MTK                                   ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const result2 = computeEngine(match2, config);

console.log('📊 Model Parameters:');
console.log(`   Home xG (λH): ${result2.computedStats.homeXG.toFixed(2)}`);
console.log(`   Away xG (λA): ${result2.computedStats.awayXG.toFixed(2)}`);
console.log(`   Dixon-Coles ρ: ${result2.computedStats.rho}`);
console.log(`   Formula: ${result2.formulaUsed}`);
console.log(`   Data Source: ${result2.computedStats.dataSource}\n`);

console.log('📈 PhD Probability Analysis:');
console.log(`   Home Win: ${(result2.computedStats.probs.homeWin * 100).toFixed(2)}%`);
console.log(`   Draw:     ${(result2.computedStats.probs.draw * 100).toFixed(2)}%`);
console.log(`   Away Win: ${(result2.computedStats.probs.awayWin * 100).toFixed(2)}%`);
console.log(`   Over 2.5: ${(result2.computedStats.probs.over25 * 100).toFixed(2)}%`);
console.log(`   BTTS Yes: ${(result2.computedStats.probs.bttsYes * 100).toFixed(2)}%\n`);

console.log('💎 BETTING RECOMMENDATIONS (Sorted by EV):');
console.log('─────────────────────────────────────────────────────────────────');

result2.recommendations.forEach((rec, i) => {
    const evStr = rec.ev !== undefined ? `${(rec.ev * 100).toFixed(2)}%` : 'N/A';
    const edgeStr = rec.edge !== undefined ? `${(rec.edge * 100).toFixed(2)}%` : 'N/A';
    const level = rec.recommendation_level;
    const emoji = level === 'DIAMOND' ? '💎' : level === 'GOLD' ? '🥇' : level === 'GOOD' ? '✅' : level === 'LEAN' ? '🔶' : level === 'INFO' ? 'ℹ️' : '❌';

    console.log(`\n${emoji} [${level}] ${rec.market}: ${rec.selection}`);
    console.log(`   Odds: ${rec.odds || 'N/A'} | True Prob: ${(rec.probability * 100).toFixed(1)}%`);
    console.log(`   Edge: ${edgeStr} | EV: ${evStr}`);
    console.log(`   PhD Stake: ${rec.stake_size || '0%'}`);
    if (rec.reasoning) console.log(`   📝 ${rec.reasoning}`);
});

// ============================================================================
// TEST 3: PhD Math Verification - Direct Formula Tests
// ============================================================================
console.log('\n\n═══════════════════════════════════════════════════════════════════');
console.log('        PhD MATHEMATICAL VERIFICATION TESTS');
console.log('═══════════════════════════════════════════════════════════════════\n');

// Test 1: Kelly + CVaR + L1 Optimization
console.log('🧮 TEST: Kelly + CVaR + L1 Stake Optimization');
console.log('   Scenario: Win prob = 55%, Odds = 2.00 (implied 50%)');
const optResult = optimizeStakeCVaR(0.55, 2.00, { gamma: 0.5, friction: 0.02, alpha: 0.05 });
console.log(`   ✅ Optimal Stake: ${optResult.optimalStakePct}% of bankroll`);
console.log(`   ✅ EV: ${(optResult.ev * 100).toFixed(2)}%`);
console.log(`   ✅ Kelly Fraction: ${(optResult.kellyFrac * 100).toFixed(2)}%`);
console.log(`   ✅ CVaR Penalty: ${optResult.cvarPenalty.toFixed(6)}`);
console.log(`   ✅ Friction Cost: ${optResult.frictionCost.toFixed(6)}`);
console.log(`   ✅ Formula: ${optResult.formula}\n`);

// Test 2: KL Divergence Calibration
console.log('🧮 TEST: KL-Divergence Posterior Calibration');
console.log('   Scenario: Model says 60%, Market implies 50%');
const calResult = checkPosteriorCalibration(0.60, 2.00);
console.log(`   ✅ KL Divergence: ${calResult.klDivergence.toFixed(6)} nats`);
console.log(`   ✅ Model Prob: ${(calResult.modelProb * 100).toFixed(1)}%`);
console.log(`   ✅ Market Prob: ${(calResult.marketProb * 100).toFixed(1)}%`);
console.log(`   ✅ Edge: ${(calResult.edge * 100).toFixed(1)}%`);
console.log(`   ✅ Is Calibrated: ${calResult.isCalibrated}`);
console.log(`   ✅ Is Overconfident: ${calResult.isOverconfident}`);
if (calResult.warning) console.log(`   ⚠️ Warning: ${calResult.warning}`);
console.log();

// Test 3: Full PhD Stake Recommendation
console.log('🧮 TEST: Full PhD Stake Recommendation');
console.log('   Scenario: 55% prob, odds 2.00, $10,000 bankroll');
const phdResult = phdStakeRecommendation(0.55, 2.00, 10000, { gamma: 0.5, friction: 0.02, alpha: 0.05 });
console.log(`   ✅ Recommended Stake: ${phdResult.recommendation.stakePct}% ($${phdResult.recommendation.stakeAmount})`);
console.log(`   ✅ Formula: ${phdResult.recommendation.formula}`);
console.log(`   ✅ Expected Log Growth: ${phdResult.riskMetrics.expectedLogGrowth.toFixed(6)}`);
console.log(`   ✅ CVaR: ${phdResult.riskMetrics.cvar.toFixed(6)}`);
if (phdResult.warnings.length > 0) console.log(`   ⚠️ Warnings: ${phdResult.warnings.join(', ')}`);
console.log();

// Test 4: Poisson PMF
console.log('🧮 TEST: Poisson Probability Mass Function');
console.log('   Scenario: λ = 1.5 (expected goals)');
const pmf = poissonPmf(1.5, 5);
console.log(`   ✅ P(0 goals) = ${(pmf[0] * 100).toFixed(2)}%`);
console.log(`   ✅ P(1 goal)  = ${(pmf[1] * 100).toFixed(2)}%`);
console.log(`   ✅ P(2 goals) = ${(pmf[2] * 100).toFixed(2)}%`);
console.log(`   ✅ P(3 goals) = ${(pmf[3] * 100).toFixed(2)}%`);
console.log(`   ✅ Sum sanity check: ${(pmf.reduce((a, b) => a + b, 0) * 100).toFixed(2)}%\n`);

// Test 5: Dixon-Coles Tau Adjustment
console.log('🧮 TEST: Dixon-Coles Tau Correction');
console.log('   Scenario: Low score correlation adjustment (ρ = -0.03)');
const tau00 = dixonColesTau(0, 0, 1.5, 1.2, -0.03);
const tau01 = dixonColesTau(0, 1, 1.5, 1.2, -0.03);
const tau10 = dixonColesTau(1, 0, 1.5, 1.2, -0.03);
const tau11 = dixonColesTau(1, 1, 1.5, 1.2, -0.03);
const tau22 = dixonColesTau(2, 2, 1.5, 1.2, -0.03);
console.log(`   ✅ τ(0,0) = ${tau00.toFixed(6)} (0-0 draws adjusted)`);
console.log(`   ✅ τ(0,1) = ${tau01.toFixed(6)} (0-1 scoreline)`);
console.log(`   ✅ τ(1,0) = ${tau10.toFixed(6)} (1-0 scoreline)`);
console.log(`   ✅ τ(1,1) = ${tau11.toFixed(6)} (1-1 draws adjusted)`);
console.log(`   ✅ τ(2,2) = ${tau22.toFixed(6)} (2-2, no DC adjustment needed)\n`);

console.log('═══════════════════════════════════════════════════════════════════');
console.log('                    TEST COMPLETE');
console.log('═══════════════════════════════════════════════════════════════════');
