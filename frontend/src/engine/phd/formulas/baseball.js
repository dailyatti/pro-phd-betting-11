/**
 * @typedef {import('../types').MatchInputNormalized} MatchInputNormalized
 * @typedef {import('../types').EngineConfig} EngineConfig
 * @typedef {import('../types').EngineResult} EngineResult
 */

import { phdStakeRecommendation } from '../../../utils/phdStakeOptimizer.js';
import { negBinPmf } from '../math/distributions.js';

// ============================================================================
// MLB ENGINE — PhD / Production-Grade
// Baseline: Pitching-based Runs Projection
// Totals: Negative Binomial (Overdispersed Runs)
// Win Prob: Pythagorean Expectation (Season-Dependent Exponent)
// ============================================================================

const DEFAULTS = Object.freeze({
    inningsSP: 5.5,
    inningsBP: 3.5,
    pythExponent: 1.83,
    leagueRunsPerGame: 4.5,      // per team
    parkFactor: 1.0,
    bankroll: 1000,
    staking: { gamma: 0.5, friction: 0.02, alpha: 0.05 },
    pitching: {
        homeSP_FIP: 4.00, homeBullpen_ERA: 4.00,
        awaySP_FIP: 4.10, awayBullpen_ERA: 4.10,
    },
    negBinK: 4.0 // dispersion parameter for runs (k=infinity -> poisson)
});

function num(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function clampProb(p) {
    if (!Number.isFinite(p)) return 0.5;
    return Math.min(0.999999, Math.max(0.000001, p));
}

function validOdds(o) {
    return Number.isFinite(o) && o > 1.000001;
}

/**
 * Blended RA9 (Runs Allowed per 9) from SP FIP + BP ERA
 */
function blendedRA9(spFip, bpEra, inningsSP, inningsBP) {
    const wSP = inningsSP / 9;
    const wBP = inningsBP / 9;
    return (spFip * wSP) + (bpEra * wBP);
}

/**
 * Pythagorean Win Prob
 * P(A) = A^exp / (A^exp + B^exp)
 * Using Runs Allowed (RA) as inverse of scoring strength:
 * If Home RA=3, Away RA=5 => Home is stronger.
 * P(Home) = AwayRA^exp / (HomeRA^exp + AwayRA^exp)
 */
function winProbFromRA(homeRA9, awayRA9, exponent) {
    const h = Math.pow(homeRA9, exponent);
    const a = Math.pow(awayRA9, exponent);
    const pHome = a / (a + h); // Lower RA is better
    return clampProb(pHome);
}

/**
 * Project Expected Runs
 * expRunsHome = LeagueAvg * (AwayRA / LeagueAvg) * ParkFactor
 */
function projectedRuns(leagueRunsPerTeam, homeRA9, awayRA9, parkFactor) {
    const pf = num(parkFactor, 1.0);
    const leagueAvgRA9 = Math.max(0.5, leagueRunsPerTeam);

    // If Opponent (Away) has high RA, Home scores more.
    const homeRuns = leagueRunsPerTeam * (awayRA9 / leagueAvgRA9) * pf;
    const awayRuns = leagueRunsPerTeam * (homeRA9 / leagueAvgRA9) * pf;

    return { homeRuns, awayRuns, total: homeRuns + awayRuns, parkFactor: pf };
}

/**
 * Probability of Total > Line using Negative Binomial Convolution
 * Exact convolution is slow; we approximate Sum ~ NegBin(mean_sum, k_pooled)
 * or simply evaluate P(Over) using a single NegBin if we assume correlation is handled by k.
 * 
 * We will use NegBin(totalMean, k_effective) for the Total.
 */
function probOverTotalNegBin(muTotal, line, k) {
    // P(X > line) = 1 - P(X <= line)
    // Sum P(X=i) for i=0 to floor(line)
    const limit = Math.floor(line);
    const maxCalc = Math.max(30, limit + 15);
    const pmf = negBinPmf(muTotal, k, maxCalc);

    let pUnder = 0;
    for (let i = 0; i <= limit; i++) {
        pUnder += pmf[i] || 0; // if i > maxCalc, pmf is 0 (truncated tail)
    }
    return clampProb(1 - pUnder);
}

function evaluateMarket({ recs, selection, market, odds, trueProb, bankroll, staking, reason }) {
    const o = Number(odds);
    const p = clampProb(trueProb);

    if (!validOdds(o)) {
        recs.push({
            market, selection, odds: 0, probability: p, recommendation_level: 'INFO',
            reasoning: `P(${selection})=${(p * 100).toFixed(1)}%. Odds unavailable.`,
            math_proof: { implied_prob: 0, own_prob: p, edge_prob: 0, ev: 0, kelly_pct: 0 }
        });
        return;
    }

    const optim = phdStakeRecommendation(p, o, bankroll, staking);
    const stakePct = num(optim?.recommendation?.stakePct, 0);
    const ev = (p * o) - 1;
    const implied = 1 / o;

    let level = 'AVOID';
    if (!optim.calibration.isOverconfident && ev > 0 && stakePct > 0) level = 'SILVER';
    if (!optim.calibration.isOverconfident && ev >= 0.03 && stakePct >= 1.0) level = 'GOLD';
    if (!optim.calibration.isOverconfident && ev >= 0.05 && stakePct >= 2.0) level = 'DIAMOND';

    recs.push({
        market, selection, odds: o, probability: p, implied_prob: implied, ev, edge: p - implied,
        stake_size: stakePct > 0 ? `${stakePct.toFixed(1)}%` : '0%',
        recommendation_level: level,
        reasoning: [reason, `OwnP ${(p * 100).toFixed(1)}%`, optim.warnings?.join(' ')].join(' | '),
        math_proof: { implied_prob: implied, own_prob: p, edge_prob: p - implied, ev, kelly_pct: stakePct }
    });
}

export const computeEngine = (match, config) => {
    const recs = [];
    const explanations = [];
    const warnings = [];

    const research = match?.researchData || match?.extractedParameters || {};
    const team1 = match.team1 || match.team_1 || 'Home';
    const team2 = match.team2 || match.team_2 || 'Away';

    // Config
    const bankroll = num(config?.bankroll, DEFAULTS.bankroll);
    const staking = {
        gamma: num(config?.staking?.gamma, DEFAULTS.staking.gamma),
        friction: num(config?.staking?.friction, DEFAULTS.staking.friction),
        alpha: num(config?.staking?.alpha, DEFAULTS.staking.alpha),
    };

    const cMlb = { ...DEFAULTS, ...(config?.mlb || {}) };

    // Inputs
    const iSP = num(config?.mlb?.inningsSP, cMlb.inningsSP);
    const iBP = num(config?.mlb?.inningsBP, cMlb.inningsBP);
    const parkFactor = num(research.parkFactor, cMlb.parkFactor);

    // Pitching Stats
    const homeSP_FIP = num(research.homeSP_FIP, DEFAULTS.pitching.homeSP_FIP);
    const homeBP_ERA = num(research.homeBullpen_ERA, DEFAULTS.pitching.homeBullpen_ERA);
    const awaySP_FIP = num(research.awaySP_FIP, DEFAULTS.pitching.awaySP_FIP);
    const awayBP_ERA = num(research.awayBullpen_ERA, DEFAULTS.pitching.awayBullpen_ERA);

    // Calc RA9
    const homeRA9 = blendedRA9(homeSP_FIP, homeBP_ERA, iSP, iBP);
    const awayRA9 = blendedRA9(awaySP_FIP, awayBP_ERA, iSP, iBP);

    explanations.push(`Pitching (RA9): Home ${homeRA9.toFixed(2)} | Away ${awayRA9.toFixed(2)} (Splits: ${iSP}/${iBP})`);

    // Win Prob (Pyth)
    const pHome = winProbFromRA(homeRA9, awayRA9, cMlb.pythExponent);
    const pAway = 1 - pHome;

    explanations.push(`WinProb (Pyth^${cMlb.pythExponent}): Home ${(pHome * 100).toFixed(1)}% | Away ${(pAway * 100).toFixed(1)}%`);

    evaluateMarket({
        recs, selection: team1, market: 'Moneyline', odds: match?.odds?.homeWin,
        trueProb: pHome, bankroll, staking, reason: 'Pitching-based Pyth Expectation'
    });
    evaluateMarket({
        recs, selection: team2, market: 'Moneyline', odds: match?.odds?.awayWin,
        trueProb: pAway, bankroll, staking, reason: 'Pitching-based Pyth Expectation'
    });

    // Totals (Negative Binomial)
    const runs = projectedRuns(cMlb.leagueRunsPerGame, homeRA9, awayRA9, parkFactor);
    explanations.push(`Runs: Home ${runs.homeRuns.toFixed(2)} + Away ${runs.awayRuns.toFixed(2)} = ${runs.total.toFixed(2)} (PF ${parkFactor})`);

    const total = match?.odds?.total;
    if (total && Number.isFinite(Number(total.line))) {
        const line = Number(total.line);
        // Using NegBin for overdispersion
        const k = num(cMlb.negBinK, 4.0);
        const pOver = probOverTotalNegBin(runs.total, line, k);
        const pUnder = 1 - pOver;

        explanations.push(`Total (NegBin k=${k}): P(Over ${line}) = ${(pOver * 100).toFixed(1)}%`);

        evaluateMarket({
            recs, selection: `Over ${line}`, market: 'Total', odds: total?.over,
            trueProb: pOver, bankroll, staking, reason: `NegBin(μ=${runs.total.toFixed(1)}, k=${k})`
        });
        evaluateMarket({
            recs, selection: `Under ${line}`, market: 'Total', odds: total?.under,
            trueProb: pUnder, bankroll, staking, reason: `NegBin(μ=${runs.total.toFixed(1)}, k=${k})`
        });
    }

    return {
        matchId: match.id,
        recommendations: recs.sort((a, b) => b.ev - a.ev),
        explanations,
        warnings,
        computedStats: { homeRA9, awayRA9, pHome, pAway, runs }
    };
};