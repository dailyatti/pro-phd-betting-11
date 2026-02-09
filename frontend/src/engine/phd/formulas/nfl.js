/**
 * @typedef {import('../types').MatchInputNormalized} MatchInputNormalized
 * @typedef {import('../types').EngineConfig} EngineConfig
 * @typedef {import('../types').EngineResult} EngineResult
 */

import { phdStakeRecommendation } from '../../../utils/phdStakeOptimizer.js';
import { normalCdf } from '../math/distributions.js';

// ============================================================================
// NFL ENGINE — PhD / Production-Grade
// Core: margin model from (EPA + SuccessRate) * plays + HFA + matchup adj
// Markets: Moneyline, Spread (push-aware), Total (if given)
// ============================================================================

const DEFAULTS = Object.freeze({
    bankroll: 1000,
    staking: { gamma: 0.5, friction: 0.02, alpha: 0.05 },

    nfl: {
        // Typical per-team offensive plays in NFL games varies ~55-70.
        playsPerTeam: 62,
        // Home field advantage in points (era-dependent; let config override)
        hfa: 1.8,

        // Convert per-play efficiency advantage to points:
        // points ≈ netEPA * plays
        epaToPointsScale: 1.0,

        // Success rate weight (blended with EPA to reduce noise)
        srWeight: 0.35,    // 35% SR, 65% EPA by default
        epaWeight: 0.65,

        // Margin distribution stdev (covers typical NFL variance)
        // Market often implies ~13-14 points SD for margin.
        marginSigma: 13.5,

        // Push handling: use "half point" rule around integer spreads,
        // but if your line is integer, compute P(push) explicitly.
        pushEps: 1e-9,

        // Injury/weather adjustment caps (to prevent insane corrections)
        maxAdjPoints: 6.0,
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

// normalCdf imported

/**
 * Win prob from projected margin using Normal(margin, sigma).
 * P(Home wins) = P(Margin > 0) = 1 - CDF(0)
 */
function winProbFromMargin(muMargin, sigma) {
    const p = 1 - normalCdf(0, muMargin, sigma);
    return clampProb(p);
}

/**
 * Spread cover probability (push-aware).
 * If betting Home -s (home favored), cover occurs if Margin > s.
 * If betting Away +s, cover if Margin < s (for home margin definition).
 *
 * We'll use:
 * - For line = -3.5 (home -3.5): cover if margin > 3.5
 * - For line = +3.5 (home +3.5): cover if margin > -3.5
 */
function coverProbForHomeSpread(muMargin, sigma, homeSpreadLine) {
    // cover if margin > -line? careful:
    // If line is "Home -3.5" it is represented as -3.5.
    // Home covers when margin + line > 0  => margin > -line.
    const threshold = -homeSpreadLine;
    const pCover = 1 - normalCdf(threshold, muMargin, sigma);
    return clampProb(pCover);
}

/** Push probability for integer lines (margin == threshold) approximated as ~0 under continuous normal.
 *  If you want discrete scoring push mass, you'd need a discrete margin model.
 *  We'll keep continuous => push ~ 0; still safe.
 */
function pushProbApprox() {
    return 0;
}

/** Evaluate market with PhD staking */
function evaluateMarket({ recs, selection, market, odds, trueProb, bankroll, staking, reason }) {
    const o = Number(odds);
    const p = clampProb(trueProb);

    if (!validOdds(o)) {
        recs.push({
            market: market,
            selection: selection,
            odds: 0,
            probability: p,
            recommendation_level: 'INFO',
            reasoning: `Model Projection: P(${selection}) = ${(p * 100).toFixed(1)}%. Odds unavailable for EV calculation.`,
            math_proof: {
                implied_prob: 0,
                own_prob: p,
                edge_prob: 0,
                ev: 0,
                kelly_pct: 0,
            }
        });
        return;
    }

    const implied = 1 / o;
    const ev = (p * o) - 1;
    const edge = p - implied;

    const optim = phdStakeRecommendation(p, o, bankroll, {
        gamma: staking.gamma,
        friction: staking.friction,
        alpha: staking.alpha,
    });

    const stakePct = num(optim?.recommendation?.stakePct, 0);
    const overconf = !!optim?.calibration?.isOverconfident;
    const warningsTxt = Array.isArray(optim?.warnings) ? optim.warnings.filter(Boolean).join(' ') : '';

    let level = 'AVOID';
    if (!overconf && ev > 0 && stakePct > 0) level = 'SILVER';
    if (!overconf && ev >= 0.03 && stakePct >= 1.2) level = 'GOLD';
    if (!overconf && ev >= 0.05 && stakePct >= 2.5) level = 'DIAMOND';
    if (ev <= 0) level = 'AVOID';
    if (overconf) level = 'AVOID';

    recs.push({
        market,
        selection,
        odds: o,
        probability: p,
        implied_prob: implied,
        ev,
        edge,
        stake_size: stakePct > 0 ? `${stakePct.toFixed(1)}%` : '0%',
        recommendation_level: level,
        reasoning: [reason || '', `OwnP ${(p * 100).toFixed(1)}% vs Implied ${(implied * 100).toFixed(1)}%`, warningsTxt]
            .map(s => String(s).trim()).filter(Boolean).join(' | '),
        math_proof: {
            implied_prob: implied,
            own_prob: p,
            edge_prob: edge,
            ev,
            kelly_pct: stakePct,
            kelly_component: optim?.optimization?.kellyComponent,
        },
    });
}

/**
 * Build a robust projected margin from EPA + Success Rate.
 * We compute:
 * netEPA = (homeOffEPA - awayDefEPA) - (awayOffEPA - homeDefEPA)
 * netSR  = (homeOffSR  - awayDefSR ) - (awayOffSR  - homeDefSR )
 * blended = wEPA*netEPA + wSR*netSR*srToEpaScale
 * margin ≈ blended * plays * epaToPointsScale + HFA + adjPoints
 */
function projectMargin({ inputs, cfg }) {
    const {
        homeOffEPA, homeDefEPA, awayOffEPA, awayDefEPA,
        homeOffSR, homeDefSR, awayOffSR, awayDefSR,
        playsPerTeam, hfa, adjPoints,
    } = inputs;

    const wEPA = cfg.epaWeight;
    const wSR = cfg.srWeight;

    // Defensive EPA: by convention, lower (more negative) is better defense.
    // We treat "awayDefEPA" as EPA allowed; if your input is already "defensive EPA per play",
    // this formula is consistent as long as it matches sign conventions.
    const homeNetEPA = (homeOffEPA - awayDefEPA);
    const awayNetEPA = (awayOffEPA - homeDefEPA);
    const netEPA = homeNetEPA - awayNetEPA;

    // Success Rate: 0..1. Typical around 0.45. Differences are small (0.02 matters).
    // Convert SR diff to "EPA-like" scale: ~0.25 EPA per 0.10 SR diff (heuristic).
    const srToEpaScale = 2.5; // 0.04 SR diff => 0.10 EPA-ish
    const homeNetSR = (homeOffSR - awayDefSR);
    const awayNetSR = (awayOffSR - homeDefSR);
    const netSR = homeNetSR - awayNetSR;

    const blendedPerPlay = (wEPA * netEPA) + (wSR * (netSR * srToEpaScale));

    const rawMargin = blendedPerPlay * playsPerTeam * cfg.epaToPointsScale;
    const muMargin = rawMargin + hfa + adjPoints;

    return {
        muMargin,
        components: { homeNetEPA, awayNetEPA, netEPA, homeNetSR, awayNetSR, netSR, blendedPerPlay, rawMargin, hfa, adjPoints },
    };
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

    const research = match?.researchData || match?.extractedParameters || {};
    const team1 = match.team1 || match.team_1 || 'Home';
    const team2 = match.team2 || match.team_2 || 'Away';

    // Config merge
    const bankroll = num(config?.bankroll, DEFAULTS.bankroll);
    const staking = {
        gamma: num(config?.staking?.gamma, DEFAULTS.staking.gamma),
        friction: num(config?.staking?.friction, DEFAULTS.staking.friction),
        alpha: num(config?.staking?.alpha, DEFAULTS.staking.alpha),
    };
    const cfg = {
        ...DEFAULTS.nfl,
        ...(config?.nfl || {}),
    };

    // Inputs with fallbacks
    const homeOffEPA = num(research.homeOffEPA, 0.03);
    const homeDefEPA = num(research.homeDefEPA, 0.00);
    const awayOffEPA = num(research.awayOffEPA, 0.02);
    const awayDefEPA = num(research.awayDefEPA, 0.00);

    // Success Rate (0..1). If missing, use league-ish baseline 0.45
    const homeOffSR = num(research.homeOffSR, 0.45);
    const homeDefSR = num(research.homeDefSR, 0.45);
    const awayOffSR = num(research.awayOffSR, 0.45);
    const awayDefSR = num(research.awayDefSR, 0.45);

    const playsPerTeam = num(research.playsPerTeam, num(config?.nfl?.playsPerTeam, cfg.playsPerTeam));
    const hfa = num(research.hfa, num(config?.nfl?.hfa, cfg.hfa));

    // Optional adjustments from research (QB out, OL injuries, weather)
    // Expect: qbAdjPoints, injuryAdjPoints, weatherAdjPoints or a combined adjPoints.
    let adjPoints =
        num(research.adjPoints, NaN) ||
        (num(research.qbAdjPoints, 0) + num(research.injuryAdjPoints, 0) + num(research.weatherAdjPoints, 0));

    if (!Number.isFinite(adjPoints)) adjPoints = 0;
    const cap = cfg.maxAdjPoints;
    if (Math.abs(adjPoints) > cap) {
        warnings.push(`AdjPoints capped from ${adjPoints.toFixed(2)} to ${Math.sign(adjPoints) * cap}.`);
        adjPoints = Math.sign(adjPoints) * cap;
    }

    // Source transparency
    const usedResearch = Number.isFinite(Number(research.homeOffEPA)) || Number.isFinite(Number(research.homeOffSR));
    if (!usedResearch) warnings.push('NFL Engine: using league-average baselines (research EPA/SR missing).');

    // 1) Project margin
    const { muMargin, components } = projectMargin({
        inputs: {
            homeOffEPA, homeDefEPA, awayOffEPA, awayDefEPA,
            homeOffSR, homeDefSR, awayOffSR, awayDefSR,
            playsPerTeam, hfa, adjPoints,
        },
        cfg,
    });

    const sigma = num(config?.nfl?.marginSigma, cfg.marginSigma);

    explanations.push(`EPA/SR Model: plays=${playsPerTeam}, HFA=${hfa.toFixed(1)}, adj=${adjPoints.toFixed(1)}, σ=${sigma.toFixed(1)}`);
    explanations.push(
        `Per-play blended=${components.blendedPerPlay.toFixed(3)} | rawMargin=${components.rawMargin.toFixed(2)} | μMargin=${muMargin.toFixed(2)} (Home +)`
    );

    // 2) Win probabilities (Moneyline)
    const pHomeWin = winProbFromMargin(muMargin, sigma);
    const pAwayWin = clampProb(1 - pHomeWin);

    explanations.push(`Win%: Home ${(pHomeWin * 100).toFixed(1)}% | Away ${(pAwayWin * 100).toFixed(1)}%`);

    // 3) Spread market if line+odds present
    // Expect shapes:
    // match.odds.spread = { line: -3.5, home: 1.91, away: 1.91 } where line is "home line"
    // OR match.odds.homeSpread / awaySpread etc — adjust as needed.
    const spread = match?.odds?.spread;
    if (spread && Number.isFinite(Number(spread.line))) {
        const line = Number(spread.line); // home line
        const pHomeCover = coverProbForHomeSpread(muMargin, sigma, line);
        const pAwayCover = clampProb(1 - pHomeCover - pushProbApprox());

        explanations.push(`Spread: homeLine=${line} | P(HomeCover) ${(pHomeCover * 100).toFixed(1)}%`);

        evaluateMarket({
            recs,
            selection: `${team1} ${line}`,
            market: 'Spread',
            odds: spread?.home,
            trueProb: pHomeCover,
            bankroll,
            staking,
            reason: `Cover prob from Normal(μMargin,σ).`,
        });

        evaluateMarket({
            recs,
            selection: `${team2} ${line > 0 ? '' : '+'}${Math.abs(line)}`,
            market: 'Spread',
            odds: spread?.away,
            trueProb: pAwayCover,
            bankroll,
            staking,
            reason: `Opposite side cover prob.`,
        });
    } else {
        explanations.push('Spread line not provided → skipping spread EV.');
    }

    // 4) Moneyline EV
    evaluateMarket({
        recs,
        selection: team1,
        market: 'Moneyline',
        odds: match?.odds?.homeWin,
        trueProb: pHomeWin,
        bankroll,
        staking,
        reason: `Win prob from Normal margin model (μ=${muMargin.toFixed(1)}, σ=${sigma.toFixed(1)}).`,
    });

    evaluateMarket({
        recs,
        selection: team2,
        market: 'Moneyline',
        odds: match?.odds?.awayWin,
        trueProb: pAwayWin,
        bankroll,
        staking,
        reason: `Win prob from Normal margin model.`,
    });

    // 5) Total market (optional): if research provides total projection or you have total line
    // Without an offensive pace/efficiency model, we treat totals as INFO unless research.totalMean exists.
    const total = match?.odds?.total; // { line, over, under }
    const totalMean = num(research.totalMeanPoints, NaN);
    const totalSigma = num(research.totalSigmaPoints, 13.0); // loose default

    if (total && Number.isFinite(Number(total.line)) && Number.isFinite(totalMean)) {
        const line = Number(total.line);
        // P(Over) = 1 - CDF(line)
        const pOver = clampProb(1 - normalCdf(line, totalMean, totalSigma));
        const pUnder = clampProb(1 - pOver);

        explanations.push(`Total: μ=${totalMean.toFixed(1)}, σ=${totalSigma.toFixed(1)}, line=${line} | P(Over) ${(pOver * 100).toFixed(1)}%`);

        evaluateMarket({
            recs,
            selection: `Over ${line}`,
            market: 'Total',
            odds: total?.over,
            trueProb: pOver,
            bankroll,
            staking,
            reason: 'Total prob from Normal(totalMean,totalSigma) using research-provided mean.',
        });

        evaluateMarket({
            recs,
            selection: `Under ${line}`,
            market: 'Total',
            odds: total?.under,
            trueProb: pUnder,
            bankroll,
            staking,
            reason: 'Total prob from Normal(totalMean,totalSigma).',
        });
    } else if (total && Number.isFinite(Number(total.line)) && !Number.isFinite(totalMean)) {
        recs.push({
            market: 'Total',
            selection: 'INFO',
            recommendation_level: 'INFO',
            reasoning: `Total line=${Number(total.line)} present, but missing research.totalMeanPoints → totals EV skipped.`,
        });
    }

    return {
        matchId: match?.id,
        recommendations: recs.slice().sort((a, b) => (num(b.ev, -999) - num(a.ev, -999))),
        explanations,
        warnings,
        computedStats: {
            usedResearch,
            muMargin,
            sigma,
            winProbHome: pHomeWin,
            components,
            inputs: {
                homeOffEPA, homeDefEPA, awayOffEPA, awayDefEPA,
                homeOffSR, homeDefSR, awayOffSR, awayDefSR,
                playsPerTeam, hfa, adjPoints,
            },
        },
    };
};