/**
 * @typedef {import('../types').MatchInputNormalized} MatchInputNormalized
 * @typedef {import('../types').EngineConfig} EngineConfig
 * @typedef {import('../types').EngineResult} EngineResult
 */

import { phdStakeRecommendation } from '../../../utils/phdStakeOptimizer.js';
import { poissonPmf } from '../math/distributions.js';

// ============================================================================
// NHL ENGINE — PhD / Production-Grade
// Model: μ goals via xG + possession + goalie adj; Score matrix (Poisson) for
// regulation 3-way, totals, and derived win probabilities.
// ============================================================================

const DEFAULTS = Object.freeze({
    league: {
        goalsFor: 3.1,           // per team per game baseline (approx)
        xg: 3.0,                 // fallback xG per team
        gsaX: 0.0,               // goalie GSAx baseline
        possessionShare: 0.50,   // Corsi/Fenwick share baseline
    },
    model: {
        tailMassTarget: 0.9995, // truncation control
        maxGoals: 10,
        possessionScale: 2.0,
        goalieScale: 1.0,
        minLambda: 0.05,
    },
    bankroll: 1000,
    staking: { gamma: 0.5, friction: 0.02, alpha: 0.05 },
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

/** Score matrix for regulation using centralized Poisson */
function buildScoreMatrix(muH, muA, tailMassTarget, hardCap) {
    // Determine kMax based on tail mass or hardCap
    // Simple heuristic: mu + 4*sqrt(mu) usually catches >99.9%
    // We'll use the kMax from passed args or dynamic
    const hCap = Math.min(15, Math.ceil(muH + 5 * Math.sqrt(muH)));
    const aCap = Math.min(15, Math.ceil(muA + 5 * Math.sqrt(muA)));

    const hMax = Math.min(hardCap, hCap);
    const aMax = Math.min(hardCap, aCap);

    const pH = poissonPmf(muH, hMax);
    const pA = poissonPmf(muA, aMax);

    const M = Array.from({ length: hMax + 1 }, () => new Array(aMax + 1).fill(0));
    let sum = 0;

    for (let h = 0; h <= hMax; h++) {
        for (let a = 0; a <= aMax; a++) {
            const p = pH[h] * pA[a];
            M[h][a] = p;
            sum += p;
        }
    }

    // normalize
    if (sum > 0) {
        for (let h = 0; h <= hMax; h++) {
            for (let a = 0; a <= aMax; a++) M[h][a] /= sum;
        }
    }

    return { M, hMax, aMax };
}

function aggregateFromMatrix(M) {
    let homeWinReg = 0, drawReg = 0, awayWinReg = 0;
    let btts = 0;

    const hMax = M.length - 1;
    const aMax = M[0].length - 1;

    for (let h = 0; h <= hMax; h++) {
        for (let a = 0; a <= aMax; a++) {
            const p = M[h][a];
            if (h > a) homeWinReg += p;
            else if (h === a) drawReg += p;
            else awayWinReg += p;

            if (h > 0 && a > 0) btts += p;
        }
    }

    return {
        homeWinReg: clampProb(homeWinReg),
        drawReg: clampProb(drawReg),
        awayWinReg: clampProb(awayWinReg),
        bttsYes: clampProb(btts),
        bttsNo: clampProb(1 - btts),
    };
}

/** Total goals in regulation: H+A ~ Poisson(muTotal) */
function probOverTotalPoisson(muTotal, line) {
    const mu = Math.max(0.01, muTotal);
    const L = Number(line);
    if (!Number.isFinite(L)) return null;

    const floor = Math.floor(L);
    // Over 6.5 => X>=7 => under = sum_{0..6} P
    const kMax = Math.min(30, Math.max(12, floor + 12));
    const pmf = poissonPmf(mu, kMax);

    let under = 0;
    for (let k = 0; k <= floor; k++) under += pmf[k] || 0;
    return clampProb(1 - under);
}

/**
 * Convert regulation outcomes to "moneyline incl OT" approximation.
 * Minimal model: 50/50 in OT.
 */
function moneylineInclOT(homeWinReg, drawReg) {
    const pHome = homeWinReg + 0.5 * drawReg;
    return { home: clampProb(pHome), away: clampProb(1 - pHome) };
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
    if (!optim.calibration.isOverconfident && ev >= 0.03 && stakePct >= 1.2) level = 'GOLD';
    if (!optim.calibration.isOverconfident && ev >= 0.05 && stakePct >= 2.5) level = 'DIAMOND';

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

    const bankroll = num(config?.bankroll, DEFAULTS.bankroll);
    const staking = {
        gamma: num(config?.staking?.gamma, DEFAULTS.staking.gamma),
        friction: num(config?.staking?.friction, DEFAULTS.staking.friction),
        alpha: num(config?.staking?.alpha, DEFAULTS.staking.alpha),
    };

    // Config
    const goalsFor = DEFAULTS.league.goalsFor;
    const tailMassTarget = num(config?.nhl?.tailMassTarget, DEFAULTS.model.tailMassTarget);
    const hardCap = Math.min(num(config?.nhl?.maxGoals, DEFAULTS.model.maxGoals), 15);
    const possessionScale = num(config?.nhl?.possessionScale, DEFAULTS.model.possessionScale);
    const goalieScale = num(config?.nhl?.goalieScale, DEFAULTS.model.goalieScale);
    const minLambda = DEFAULTS.model.minLambda;

    // Inputs
    const homeXG = num(research.homeXG, DEFAULTS.league.xg);
    const awayXG = num(research.awayXG, DEFAULTS.league.xg - 0.2);
    const homeGSAx = num(research.homeGSAx, DEFAULTS.league.gsaX);
    const awayGSAx = num(research.awayGSAx, DEFAULTS.league.gsaX);

    // Possession share (0..1)
    const homeShare = num(research.homeCorsiShare, num(research.homeFenwickShare, num(research.homeXGShare, 0.5)));

    // μ calculation
    const share = Math.min(0.65, Math.max(0.35, homeShare));
    const possMultHome = 1 + possessionScale * (share - 0.5);
    const possMultAway = 1 - possessionScale * (share - 0.5);

    let muH = (homeXG * possMultHome) - (goalieScale * awayGSAx);
    let muA = (awayXG * possMultAway) - (goalieScale * homeGSAx);
    muH = Math.max(minLambda, muH);
    muA = Math.max(minLambda, muA);

    explanations.push(`Inputs: xG(H)=${homeXG.toFixed(2)}, xG(A)=${awayXG.toFixed(2)}, share(H)=${share.toFixed(3)}, GSAx(H)=${homeGSAx.toFixed(2)}, GSAx(A)=${awayGSAx.toFixed(2)}`);
    explanations.push(`μ goals: Home=${muH.toFixed(2)} | Away=${muA.toFixed(2)}`);

    // Matrix
    const { M, hMax, aMax } = buildScoreMatrix(muH, muA, tailMassTarget, hardCap);
    const agg = aggregateFromMatrix(M);
    const ml = moneylineInclOT(agg.homeWinReg, agg.drawReg);

    explanations.push(`Regulation: H ${(agg.homeWinReg * 100).toFixed(1)}% | D ${(agg.drawReg * 100).toFixed(1)}% | A ${(agg.awayWinReg * 100).toFixed(1)}%`);
    explanations.push(`Moneyline (incl OT): H ${(ml.home * 100).toFixed(1)}% | A ${(ml.away * 100).toFixed(1)}%`);

    // Markets
    evaluateMarket({
        recs, selection: team1, market: 'Moneyline (incl OT)', odds: match?.odds?.moneylineHome,
        trueProb: ml.home, bankroll, staking, reason: 'Poisson(μ) + OT coinflip'
    });
    evaluateMarket({
        recs, selection: team2, market: 'Moneyline (incl OT)', odds: match?.odds?.moneylineAway,
        trueProb: ml.away, bankroll, staking, reason: 'Poisson(μ) + OT coinflip'
    });

    // Total
    const total = match?.odds?.total;
    if (total && Number.isFinite(Number(total.line))) {
        const line = Number(total.line);
        const muTotal = muH + muA;
        const pOver = probOverTotalPoisson(muTotal, line);
        if (pOver != null) {
            evaluateMarket({
                recs, selection: `Over ${line}`, market: 'Total', odds: total?.over,
                trueProb: pOver, bankroll, staking, reason: 'Poisson Total'
            });
            evaluateMarket({
                recs, selection: `Under ${line}`, market: 'Total', odds: total?.under,
                trueProb: 1 - pOver, bankroll, staking, reason: 'Poisson Total'
            });
        }
    }

    return {
        matchId: match.id,
        recommendations: recs.sort((a, b) => b.ev - a.ev),
        explanations,
        warnings,
        computedStats: { muHome: muH, muAway: muA, regulation: agg, moneyline: ml }
    };
};