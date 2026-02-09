/**
 * @typedef {import('../types').MatchInputNormalized} MatchInputNormalized
 * @typedef {import('../types').EngineConfig} EngineConfig
 * @typedef {import('../types').EngineResult} EngineResult
 */

import { calculateFairEV } from '../../../utils/bettingMath.js';
import { eloWinProbability } from '../../../utils/wagerBrain.js';
import { phdStakeRecommendation, checkPosteriorCalibration } from '../../../utils/phdStakeOptimizer.js';
import { removeVig } from '../../math/vig.js';
import { poissonPmf, dixonColesTau, negBinPmf } from '../math/distributions.js';

// ============================================================================
// FOOTBALL ENGINE — PhD / Production-Grade
// xG → (Dixon–Coles) Poisson score matrix → 1X2, O/U, BTTS, props, corners
// ============================================================================

const DEFAULTS = Object.freeze({
    xg: { home: 1.5, away: 1.2 },
    rho: -0.03,                 // Dixon–Coles typical low-score correlation
    maxGoals: 10,               // hard cap safety
    tailMassTarget: 0.9995,     // ensure truncation keeps ≥ 99.95% mass per team
    bankroll: 1000,
    staking: { gamma: 0.5, friction: 0.02, alpha: 0.05 },
    useDixonColes: 'auto',      // true/false/'auto'
    eloBlend: { enabled: true, weight: 0.30 }, // 30% ELO, 70% xG by default
    corners: {
        enabled: true,
        k: 2.2,                   // NegBin dispersion (bigger = less variance)
        defaultHome: 5.5,
        defaultAway: 4.5,
    },
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

/** Find kMax s.t. cumulative mass ≥ target, capped */
function adaptiveKMax(lambda, targetMass, hardCap) {
    const lam = Math.max(0, lambda);
    let kMax = Math.min(6, hardCap);
    while (kMax < hardCap) {
        // We use the centralized pmf, which generates array [0..kMax]
        // This is safe to call repeatedly for small k
        const pmf = poissonPmf(lam, kMax);
        const cdf = pmf.reduce((a, b) => a + b, 0);
        if (cdf >= targetMass) return kMax;
        kMax += 1;
    }
    return hardCap;
}

/**
 * Build score probability matrix P(H=h, A=a)
 * using independent Poisson pmfs with optional Dixon–Coles correction.
 */
function buildScoreMatrix({ muH, muA, rho, useDC, tailMassTarget, hardCap }) {
    const hMax = adaptiveKMax(muH, tailMassTarget, hardCap);
    const aMax = adaptiveKMax(muA, tailMassTarget, hardCap);

    const pH = poissonPmf(muH, hMax);
    const pA = poissonPmf(muA, aMax);

    const M = Array.from({ length: hMax + 1 }, () => new Array(aMax + 1).fill(0));

    let sum = 0;
    for (let h = 0; h <= hMax; h++) {
        for (let a = 0; a <= aMax; a++) {
            let p = pH[h] * pA[a];
            if (useDC) p *= dixonColesTau(h, a, muH, muA, rho);
            // avoid negative tiny artifacts if rho extreme
            p = Math.max(0, p);
            M[h][a] = p;
            sum += p;
        }
    }

    // Normalize to 1 (handles truncation + DC scaling)
    if (sum > 0) {
        for (let h = 0; h <= hMax; h++) {
            for (let a = 0; a <= aMax; a++) M[h][a] /= sum;
        }
    }

    return { M, hMax, aMax };
}

/**
 * Aggregate markets from score matrix
 * @param {number[][]} M - The score probability matrix P(H=h, A=a)
 * @returns {import('../types').AggregatedProbs}
 */
function aggregateFromMatrix(M) {
    let homeWin = 0, draw = 0, awayWin = 0;
    let over25 = 0, btts = 0;

    const hMax = M.length - 1;
    const aMax = M[0].length - 1;

    for (let h = 0; h <= hMax; h++) {
        for (let a = 0; a <= aMax; a++) {
            const p = M[h][a];
            if (h > a) homeWin += p;
            else if (h === a) draw += p;
            else awayWin += p;

            if (h + a >= 3) over25 += p;   // >2.5 == >=3
            if (h > 0 && a > 0) btts += p;
        }
    }

    // Clamp & renorm defensively
    const total = homeWin + draw + awayWin;
    if (total > 0) {
        homeWin /= total; draw /= total; awayWin /= total;
    }

    return {
        homeWin: clampProb(homeWin),
        draw: clampProb(draw),
        awayWin: clampProb(awayWin),
        over25: clampProb(over25),
        under25: clampProb(1 - over25),
        bttsYes: clampProb(btts),
        bttsNo: clampProb(1 - btts),
    };
}

/**
 * Calculates ELO blending weight based on research data volume.
 */
function calculateEloWeight(researchData, baseWeight) {
    const evidenceCount = Array.isArray(researchData) ? researchData.length : 0;
    const N = 5; // Threshold for "sufficient" data

    // w = 1 - min(1, evidenceCount / N) * (1 - baseWeight)
    // Simplified: If 0 evidence, weight = 0.8 (heavy ELO). If 5+ evidence, weight = baseWeight (30%).
    const trustFactor = Math.min(1, evidenceCount / N);
    const heavyEloWeight = 0.8;
    return heavyEloWeight - (trustFactor * (heavyEloWeight - baseWeight));
}

/**
 * Proper ELO blend for 1X2
 */
function blendWithElo({ pHome, pDraw, pAway, eloHomeWin, w }) {
    const xw = 1 - w;

    const home = (pHome * xw) + (eloHomeWin * w);
    const away = (pAway * xw) + ((1 - eloHomeWin) * w);
    const draw = pDraw; // keep DC/Poisson draw structure (best baseline)

    const s = home + draw + away;
    if (s <= 0) return { pHome, pDraw, pAway };

    return {
        pHome: clampProb(home / s),
        pDraw: clampProb(draw / s),
        pAway: clampProb(away / s),
    };
}

function probOverFromPmf(pmf, line) {
    const L = Number(line);
    if (!Number.isFinite(L)) return null;
    const floor = Math.floor(L);
    // Over 9.5 => X >= 10 => under is sum 0..9
    let under = 0;
    for (let x = 0; x <= floor; x++) under += pmf[x] || 0;
    return clampProb(1 - under);
}

/**
 * Evaluate market using your PhD staking + calibration.
 * Also computes a vig-free implied probability if possible (for debugging/citations).
 */
function evaluateMarket({
    recs,
    formulaUsed,
    marketName,
    selection,
    odds,
    trueProb,
    bankroll,
    staking,
    marketImpliedProb, // optional (vig-free)
}) {
    const o = Number(odds);
    const p = clampProb(trueProb);
    const hasOdds = validOdds(o);

    if (!hasOdds) {
        // PhD Standalone Analysis (No Odds)
        recs.push({
            market: marketName,
            selection,
            odds: 0,
            probability: p,
            recommendation_level: 'INFO',
            reasoning: `[PROJECTION] ${formulaUsed} Model Depth: ${(p * 100).toFixed(1)}% implied probability derived from xG metrics. Market liquidity insufficient for EV calculation.`,
            math_proof: {
                implied_prob_raw: 0,
                own_prob: p,
                edge: 0,
                ev: 0,
                kelly_pct: 0,
                formula: formulaUsed,
            }
        });
        return;
    }

    const impliedRaw = 1 / o;
    const ev = calculateFairEV(p, o);
    const edge = p - impliedRaw;

    const phd = phdStakeRecommendation(p, o, bankroll, {
        gamma: 0.05,
        friction: 0, // FORCE ZERO FRICTION to prevent under-staking
        alpha: staking.alpha,
        kellyFraction: staking.gamma,
        applyKellyFraction: 1
    });

    const cal = checkPosteriorCalibration(p, o);

    let level = 'AVOID';
    if (ev > 0.05 && !cal.isOverconfident) level = 'DIAMOND';
    else if (ev > 0.05) level = 'GOLD';
    else if (ev > 0.02) level = 'GOOD';
    else if (ev > 0) level = 'LEAN';

    if (ev <= 0) level = 'AVOID';
    if (String(cal.warning || '').includes('DANGER')) level = 'AVOID';

    const stakePct = num(phd?.recommendation?.stakePct, 0);

    recs.push({
        market: marketName,
        selection,
        odds: o,
        probability: p,
        ev,
        edge,
        stake_size: stakePct > 0 ? `${stakePct.toFixed(1)}%` : '0%',
        recommendation_level: level,
        reasoning: [
            `${formulaUsed}: True ${(p * 100).toFixed(1)}% vs Implied ${(impliedRaw * 100).toFixed(1)}%`,
            marketImpliedProb != null ? `Vig-free Implied ${(marketImpliedProb * 100).toFixed(1)}%` : '',
            `Edge ${(edge * 100).toFixed(2)}% | PhD Stake ${stakePct.toFixed(1)}%`,
            cal.warning || '',
        ].filter(Boolean).join(' | '),
        math_proof: {
            implied_prob_raw: impliedRaw,
            implied_prob_vigfree: marketImpliedProb ?? null,
            own_prob: p,
            edge,
            ev,
            kelly_pct: stakePct / 100,
            cvar_penalty: phd?.riskMetrics?.cvarPenalty,
            friction_cost: phd?.riskMetrics?.frictionCost,
            kl_divergence: cal.klDivergence,
            formula: 'PHD_KELLY_CVAR_L1',
        },
        calibration_warning: cal.warning || null,
    });
}

/**
 * @param {MatchInputNormalized} match
 * @param {EngineConfig} config
 * @returns {EngineResult}
 */
export const computeEngine = (match, config) => {
    const warnings = Array.isArray(match?.warnings) ? [...match.warnings] : [];
    const explanations = [];
    const recs = [];

    // --- Source extraction ---
    const research = match?.researchData || match?.extractedParameters || {};
    const adv = match?.advancedMetrics || {};

    // --- Config merge ---
    const bankroll = num(config?.bankroll, DEFAULTS.bankroll);
    const staking = {
        gamma: num(config?.staking?.gamma, DEFAULTS.staking.gamma),
        friction: num(config?.staking?.friction, DEFAULTS.staking.friction),
        alpha: num(config?.staking?.alpha, DEFAULTS.staking.alpha),
    };

    // DEBUG: Log incoming match data
    console.log('[Football Engine] Received match:', {
        team_1: match?.team_1,
        team_2: match?.team_2,
        odds: match?.odds,
        homeOdds: match?.homeOdds,
        drawOdds: match?.drawOdds,
        awayOdds: match?.awayOdds
    });

    const researchParams = match?.extractedParameters || {};
    const rho = num(researchParams.rho, num(config?.rho, DEFAULTS.rho));
    const hardCap = Math.min(num(config?.maxGoals, DEFAULTS.maxGoals), DEFAULTS.maxGoals);
    const tailMassTarget = num(config?.tailMassTarget, DEFAULTS.tailMassTarget);

    // xG (priority: extractedParameters > researchData keys > advancedMetrics > config defaults > hard defaults)
    const homeXG = num(researchParams.homeXG, num(research.homeXG, num(adv.homeXG, num(config?.defaultHomeXG, DEFAULTS.xg.home))));
    const awayXG = num(researchParams.awayXG, num(research.awayXG, num(adv.awayXG, num(config?.defaultAwayXG, DEFAULTS.xg.away))));

    // Data source label
    const dataSource = Number.isFinite(Number(researchParams.homeXG)) || Number.isFinite(Number(research.homeXG))
        ? 'Perplexity Research'
        : (Number.isFinite(Number(adv.homeXG)) || Number.isFinite(Number(adv.awayXG)))
            ? 'Advanced Metrics'
            : 'Defaults';

    if (dataSource === 'Defaults') warnings.push('Football Engine: using default xG values (research/advancedMetrics missing).');

    // Decide Dixon–Coles usage
    const dcCfg = config?.useDixonColes ?? DEFAULTS.useDixonColes;
    const useDixonColes =
        dcCfg === true ? true :
            dcCfg === false ? false :
                (homeXG < 1.35 && awayXG < 1.35); // auto

    const formulaUsed = useDixonColes ? 'DIXON_COLES' : 'POISSON';

    // --- Build matrix + aggregate ---
    const { M, hMax, aMax } = buildScoreMatrix({
        muH: homeXG,
        muA: awayXG,
        rho,
        useDC: useDixonColes,
        tailMassTarget,
        hardCap,
    });

    const agg = aggregateFromMatrix(M);

    explanations.push(`Formula: ${formulaUsed} | Data: ${dataSource}`);
    explanations.push(`Params: xG(H)=${homeXG.toFixed(2)} xG(A)=${awayXG.toFixed(2)}${useDixonColes ? `, ρ=${rho}` : ''} | grid 0..${hMax} x 0..${aMax}`);
    explanations.push(`1X2 (xG): H ${(agg.homeWin * 100).toFixed(1)}% | D ${(agg.draw * 100).toFixed(1)}% | A ${(agg.awayWin * 100).toFixed(1)}%`);
    explanations.push(`O2.5 ${(agg.over25 * 100).toFixed(1)}% | BTTS ${(agg.bttsYes * 100).toFixed(1)}%`);

    // --- ELO hybridization (optional) ---
    let pHome = agg.homeWin, pDraw = agg.draw, pAway = agg.awayWin;

    const eloEnabled = config?.eloBlend?.enabled ?? DEFAULTS.eloBlend.enabled;
    const baseEloW = num(config?.eloBlend?.weight, DEFAULTS.eloBlend.weight);

    // PhD Enhancement: Scale ELO weight by data sufficiency
    const eloW = calculateEloWeight(match?.researchData, baseEloW);

    const homeELO = num(researchParams.homeELO, num(adv.homeELO, null));
    const awayELO = num(researchParams.awayELO, num(adv.awayELO, null));

    if (eloEnabled && homeELO != null && awayELO != null && eloW > 0) {
        const eloHomeWin = clampProb(eloWinProbability(homeELO, awayELO));
        const blended = blendWithElo({ pHome, pDraw, pAway, eloHomeWin, w: Math.min(0.9, Math.max(0, eloW)) });
        pHome = blended.pHome; pDraw = blended.pDraw; pAway = blended.pAway;

        explanations.push(`ELO Blend: H ${homeELO} vs A ${awayELO} | w=${eloW.toFixed(2)} (${eloW > baseEloW ? 'Regularized' : 'Standard'})`);
        explanations.push(`Final 1X2: H ${(pHome * 100).toFixed(1)}% | D ${(pDraw * 100).toFixed(1)}% | A ${(pAway * 100).toFixed(1)}%`);
    }

    // --- Market Evaluation ---
    const homeName = match.team_1 || match.homeTeam || 'Home';
    const awayName = match.team_2 || match.awayTeam || 'Away';

    // 1X2 using vig removal if possible
    const odds1x2 = [match?.odds?.homeWin, match?.odds?.draw, match?.odds?.awayWin].filter(Boolean).map(Number);
    const vigFree = (odds1x2.length === 3) ? removeVig(odds1x2, 'AUTO') : null;

    evaluateMarket({ recs, formulaUsed, marketName: '1X2', selection: homeName, odds: match?.odds?.homeWin, trueProb: pHome, bankroll, staking, marketImpliedProb: vigFree?.fairProbs?.[0] });
    evaluateMarket({ recs, formulaUsed, marketName: '1X2', selection: 'Draw', odds: match?.odds?.draw, trueProb: pDraw, bankroll, staking, marketImpliedProb: vigFree?.fairProbs?.[1] });
    evaluateMarket({ recs, formulaUsed, marketName: '1X2', selection: awayName, odds: match?.odds?.awayWin, trueProb: pAway, bankroll, staking, marketImpliedProb: vigFree?.fairProbs?.[2] });

    // O/U 2.5
    evaluateMarket({ recs, formulaUsed, marketName: 'Over/Under 2.5', selection: 'Over 2.5', odds: match?.odds?.over25, trueProb: agg.over25, bankroll, staking });
    evaluateMarket({ recs, formulaUsed, marketName: 'Over/Under 2.5', selection: 'Under 2.5', odds: match?.odds?.under25, trueProb: agg.under25, bankroll, staking });

    // BTTS
    evaluateMarket({ recs, formulaUsed, marketName: 'BTTS', selection: 'BTTS Yes', odds: match?.odds?.bttsYes, trueProb: agg.bttsYes, bankroll, staking });
    evaluateMarket({ recs, formulaUsed, marketName: 'BTTS', selection: 'BTTS No', odds: match?.odds?.bttsNo, trueProb: agg.bttsNo, bankroll, staking });

    // Team Totals (Mandatory for Orchestrator Schema)
    // P(Team > 1.5) = 1 - (P(0) + P(1))
    const pH0 = Math.exp(-homeXG);
    const pH1 = pH0 * homeXG;
    const pHomeOver15 = clampProb(1 - (pH0 + pH1));

    const pA0 = Math.exp(-awayXG);
    const pA1 = pA0 * awayXG;
    const pAwayOver15 = clampProb(1 - (pA0 + pA1));

    evaluateMarket({ recs, formulaUsed, marketName: 'Team Totals', selection: 'Home Over 1.5', odds: match?.odds?.homeOver15, trueProb: pHomeOver15, bankroll, staking });
    evaluateMarket({ recs, formulaUsed, marketName: 'Team Totals', selection: 'Home Under 1.5', odds: match?.odds?.homeUnder15, trueProb: 1 - pHomeOver15, bankroll, staking });
    evaluateMarket({ recs, formulaUsed, marketName: 'Team Totals', selection: 'Away Over 1.5', odds: match?.odds?.awayOver15, trueProb: pAwayOver15, bankroll, staking });
    evaluateMarket({ recs, formulaUsed, marketName: 'Team Totals', selection: 'Away Under 1.5', odds: match?.odds?.awayUnder15, trueProb: 1 - pAwayOver15, bankroll, staking });

    // Corners & Props (kept inline for brevity but could be further extracted)
    evaluateCornersMarkets(recs, match, researchParams, config, bankroll, staking, formulaUsed, explanations, warnings);
    evaluatePlayerPropsMarkets(recs, match, researchParams, research, bankroll, staking, formulaUsed, explanations);

    return {
        matchId: match?.id,
        recommendations: recs.sort((a, b) => {
            // Sort by EV (Desc) -> Probability (Desc) -> Odds (Asc)
            const evDiff = num(b.ev, -999) - num(a.ev, -999);
            if (Math.abs(evDiff) > 0.0001) return evDiff;

            const probDiff = num(b.probability, 0) - num(a.probability, 0);
            if (Math.abs(probDiff) > 0.0001) return probDiff;

            return num(a.odds, 999) - num(b.odds, 999);
        }),
        explanations,
        warnings,
        formulaUsed,
        computedStats: { dataSource, homeXG, awayXG, useDixonColes, rho, grid: { hMax, aMax }, probs: { homeWin: pHome, draw: pDraw, awayWin: pAway, over25: agg.over25, bttsYes: agg.bttsYes } },
    };
};

/** Helper for corners market evaluation */
function evaluateCornersMarkets(recs, match, researchParams, config, bankroll, staking, formulaUsed, explanations, warnings) {
    const cornersEnabled = config?.corners?.enabled ?? DEFAULTS.corners.enabled;
    if (!cornersEnabled) return;

    const avgHome = num(researchParams.avgCornersHome, num(config?.corners?.defaultHome, DEFAULTS.corners.defaultHome));
    const avgAway = num(researchParams.avgCornersAway, num(config?.corners?.defaultAway, DEFAULTS.corners.defaultAway));
    const muCorners = Math.max(0.1, avgHome + avgAway);
    const kCorners = num(config?.corners?.k, DEFAULTS.corners.k);

    explanations.push(`Corners: μ=${muCorners.toFixed(2)} (H ${avgHome.toFixed(2)} + A ${avgAway.toFixed(2)}), NegBin k=${kCorners}`);

    const cm = match?.odds?.corners;
    if (cm && Number.isFinite(Number(cm.line))) {
        const line = Number(cm.line);
        const maxX = 40;
        const pmf = negBinPmf(muCorners, kCorners, maxX); // centralized
        const pOver = probOverFromPmf(pmf, line);
        if (pOver != null) {
            evaluateMarket({ recs, formulaUsed, marketName: 'Corners', selection: `Over ${line}`, odds: cm.over, trueProb: pOver, bankroll, staking });
            evaluateMarket({ recs, formulaUsed, marketName: 'Corners', selection: `Under ${line}`, odds: cm.under, trueProb: 1 - pOver, bankroll, staking });
        }
    }
}

/** Helper for player props evaluation */
function evaluatePlayerPropsMarkets(recs, match, researchParams, research, bankroll, staking, formulaUsed, explanations) {
    const playerProps = Array.isArray(match?.odds?.player_props) ? match.odds.player_props : [];
    const playerStats = Array.isArray(researchParams.player_analysis || research.player_analysis) ? (researchParams.player_analysis || research.player_analysis) : [];

    if (!playerProps.length || !playerStats.length) return;

    for (const prop of playerProps) {
        const player = String(prop?.player || '').trim();
        const market = String(prop?.market || '').toLowerCase();
        if (!player || !market) continue;

        const stat = playerStats.find(p => {
            const n = String(p?.name || '').toLowerCase();
            const q = player.toLowerCase();
            return n && q && (n.includes(q) || q.includes(n));
        });
        if (!stat) continue;

        const avg = num(stat.vs_opponent_avg, num(stat.season_avg, num(stat.last_5_games_avg, 0)));
        if (avg <= 0) continue;

        if (market.includes('goal') && (prop?.yes || prop?.over)) {
            const pScore = clampProb(1 - Math.exp(-avg));
            evaluateMarket({ recs, formulaUsed, marketName: 'Player Props', selection: `${player} Anytime Goal`, odds: prop.yes ?? prop.over, trueProb: pScore, bankroll, staking });
        } else if ((market.includes('shot') || market.includes('sot')) && Number.isFinite(Number(prop?.line))) {
            const line = Number(prop.line);
            const pmf = poissonPmf(avg, 12); // centralized
            let under = 0;
            for (let k = 0; k <= Math.floor(line); k++) under += pmf[k] || 0;
            evaluateMarket({ recs, formulaUsed, marketName: 'Player Props', selection: `${player} Over ${line}`, odds: prop.over, trueProb: 1 - under, bankroll, staking });
            evaluateMarket({ recs, formulaUsed, marketName: 'Player Props', selection: `${player} Under ${line}`, odds: prop.under, trueProb: under, bankroll, staking });
        }
    }
}
