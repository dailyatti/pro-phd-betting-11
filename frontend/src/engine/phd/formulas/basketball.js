/**
 * @typedef {import('../types').MatchInputNormalized} MatchInputNormalized
 * @typedef {import('../types').EngineConfig} EngineConfig
 * @typedef {import('../types').EngineResult} EngineResult
 */

import { phdStakeRecommendation } from '../../../utils/phdStakeOptimizer.js';
import { normalCdf } from '../math/distributions.js';

// ============================================================================
// BASKETBALL ENGINE — PhD / Production-Grade
// Feature: Continuity Correction for Integer Spreads (Push Probability)
// Feature: Efficiency-based possessions model
// ============================================================================

const DEFAULTS = Object.freeze({
    league: {
        pace: 100,        // possessions per 48 min
        ortg: 114,        // efficiency (pts/100)
        marginSigma: 12.5, // Standard deviation of margin
        totalSigma: 18.0,  // Standard deviation of total score
    },
    bankroll: 1000,
    staking: { gamma: 0.5, friction: 0.02, alpha: 0.05 },
});

function num(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function validOdds(o) {
    return Number.isFinite(o) && o > 1.000001;
}

function clampProb(p) {
    return Math.max(0.000001, Math.min(0.999999, p));
}

// --------------------------------------------------------
// CONTINUITY CORRECTION (PUSH-AWARE)
// --------------------------------------------------------

/**
 * Calculates { win, push, loss } for a spread or total.
 * 
 * Logic:
 * Real scores are discrete integers. Modeled as continuous Normal.
 * A line of "-5.0" means:
 * - Cover (Win): Margin > 5.0 (Discrete: >= 6) -> Continuous: > 5.5
 * - Push: Margin == 5.0 (Discrete: 5) -> Continuous: 4.5 < X < 5.5
 * - Loss: Margin < 5.0 (Discrete: <= 4) -> Continuous: < 4.5
 * 
 * If line is "-5.5", push is impossible (width 0 for range X=5.5).
 */
function getOutcomeProbs(mu, sigma, line) {
    const isInteger = Math.abs(line % 1) < 0.1;

    if (!isInteger) {
        // Half-point line (e.g., -5.5). No push possible.
        // Cover if X > line
        const z = (line - mu) / sigma;
        const pLoss = normalCdf(z); // P(X < line)
        const pWin = 1 - pLoss;
        return { pWin, pPush: 0, pLoss };
    } else {
        // Integer line (e.g., -5.0). Push possible.
        // Push range: [line - 0.5, line + 0.5]
        const zLower = (line - 0.5 - mu) / sigma;
        const zUpper = (line + 0.5 - mu) / sigma;

        const cdfLower = normalCdf(zLower);
        const cdfUpper = normalCdf(zUpper);

        const pPush = cdfUpper - cdfLower;
        const pLoss = cdfLower; // X < line - 0.5
        const pWin = 1 - cdfUpper; // X > line + 0.5

        return { pWin, pPush, pLoss };
    }
}

function evaluateMarket({ recs, selection, market, odds, probResults, bankroll, staking, reason }) {
    const o = Number(odds);
    // Adjusted Win Probability: We ignore pushes for EV? 
    // Usually: Win / (Win + Loss) effectively, OR treat Push as money back (EV = 0).
    // Simple EV = (P(Win) * (Odds - 1)) - P(Loss) * 1  + P(Push) * 0
    // => P(Win)*Odds - P(Win) - P(Loss)
    // => P(Win)*Odds - (1 - P(Push))

    const { pWin, pPush, pLoss } = probResults;

    // Effective Win Rate (excluding pushes) for Kelly?
    const pEffective = pWin + pPush; // Conservative: count push as 'not loss'? No.
    // Correct EV formula with Push = refund:
    const ev = (pWin * (o - 1)) - pLoss;

    if (!validOdds(o)) {
        recs.push({
            market, selection, odds: 0, probability: pWin,
            recommendation_level: 'INFO',
            reasoning: `Proj: ${(pWin * 100).toFixed(1)}% (Push ${(pPush * 100).toFixed(1)}%). Odds unavailable.`,
            math_proof: { implied_prob: 0, own_prob: pWin, push_prob: pPush, edge: 0, kelly: 0 }
        });
        return;
    }

    const startBank = num(bankroll, 1000);
    // For Kelly, we treat "Push" as reduced effective odds or adjust p
    // Standard approx: Use p = pWin / (pWin + pLoss) and odds = odds. 
    // This assumes bets are voided on push.
    const pDecisive = pWin / (pWin + pLoss);
    const optim = phdStakeRecommendation(pDecisive, o, startBank, staking);
    const stakePct = num(optim?.recommendation?.stakePct, 0);

    const implied = 1 / o;
    const edge = pDecisive - implied;

    let level = 'AVOID';
    if (!optim.calibration.isOverconfident && ev > 0 && stakePct > 0) level = 'SILVER';
    if (!optim.calibration.isOverconfident && ev >= 0.03 && stakePct >= 1.0) level = 'GOLD';
    if (!optim.calibration.isOverconfident && ev >= 0.05 && stakePct >= 2.0) level = 'DIAMOND';

    // Correction for display: Show raw pWin, but note Push
    recs.push({
        market, selection,
        odds: o, probability: pWin, implied_prob: implied,
        ev, edge,
        stake_size: stakePct > 0 ? `${stakePct.toFixed(1)}%` : '0%',
        recommendation_level: level,
        reasoning: `${reason} | Win ${(pWin * 100).toFixed(1)}% Push ${(pPush * 100).toFixed(1)}% | Adj Edge ${(edge * 100).toFixed(2)}%`,
        math_proof: {
            implied_prob: implied,
            own_prob: pWin,
            push_prob: pPush,
            decisive_prob: pDecisive,
            edge,
            ev,
            kelly_pct: stakePct,
            formula: "Normal (Continuity Corrected)"
        }
    });
}


// --------------------------------------------------------
// MAIN EXPORT
// --------------------------------------------------------

export const computeEngine = (match, config) => {
    const recs = [];
    const explanations = [];
    const warnings = [];

    const research = match?.researchData || match?.extractedParameters || {};
    const team1 = match.team_1 || 'Home';
    const team2 = match.team_2 || 'Away';

    const bankroll = num(config?.bankroll, DEFAULTS.bankroll);
    const staking = {
        gamma: num(config?.staking?.gamma, DEFAULTS.staking.gamma),
        friction: num(config?.staking?.friction, DEFAULTS.staking.friction),
        alpha: num(config?.staking?.alpha, DEFAULTS.staking.alpha),
    };

    // 1. STATS (Pace & Efficiency)
    const pace = num(research.pace, DEFAULTS.league.pace);
    const hOrtg = num(research.homeOrtg, DEFAULTS.league.ortg);
    const hDrtg = num(research.homeDrtg, DEFAULTS.league.drtg);
    const aOrtg = num(research.awayOrtg, DEFAULTS.league.ortg);
    const aDrtg = num(research.awayDrtg, DEFAULTS.league.drtg);

    // 2. SCORE PROJECTION
    // Expected Pts = (Pace/100) * Efficiency
    // H_Eff = (hOrtg + aDrtg) / 2
    // A_Eff = (aOrtg + hDrtg) / 2
    const hEff = (hOrtg + aDrtg) / 2;
    const aEff = (aOrtg + hDrtg) / 2;

    const expHome = (pace / 100) * hEff;
    const expAway = (pace / 100) * aEff;
    const muTotal = expHome + expAway;
    const muMargin = expHome - expAway; // Home - Away

    explanations.push(`Score Proj: ${team1} ${expHome.toFixed(1)} - ${expAway.toFixed(1)} ${team2} | Margin ${muMargin.toFixed(1)}`);

    // 3. MARKETS

    // Spread: "Home -X" => Home wins by > X.
    // Line in odds usually: "spread": { "line": -5.5, "home": 1.9, "away": 1.9 }
    // If line is POSITIVE (Home +3.5), it means Home Covers if Margin > -3.5.
    // General rule: "Home Covers" condition is Margin > -1 * (HomeSpreadLine)
    // Wait standard convention: "Home -3.5" -> line = -3.5. Need to win by 3.5. Margin > 3.5.
    // "Home +3.5" -> line = +3.5. Can lose by 3. Margin > -3.5.
    // So target > -1 * line.
    // Let's verify: line -3.5 (Fav). Target > 3.5. (-(-3.5) = 3.5). Correct.
    // Line +3.5 (Dog). Target > -3.5. (-3.5). Correct.

    // Vision Agent returns flat keys (homeWin, totalOver, etc.) OR nested (match.odds.*)
    // We need to handle both. Priority: flat, then nested.
    const odds = match?.odds || {};
    const flatHomeWin = num(match?.homeWin, null) || num(odds?.homeWin, null);
    const flatAwayWin = num(match?.awayWin, null) || num(odds?.awayWin, null);
    const flatTotalOver = num(match?.totalOver, null) || num(odds?.totalOver, null) || num(odds?.over, null);
    const flatTotalUnder = num(match?.totalUnder, null) || num(odds?.totalUnder, null) || num(odds?.under, null);
    const flatTotalLine = num(match?.totalLine, null) || num(odds?.totalLine, null) || num(odds?.line, null);
    const flatSpreadLine = num(match?.spreadLine, null) || num(odds?.spreadLine, null);
    const flatHomeSpread = num(match?.homeSpread, null) || num(odds?.homeSpread, null);
    const flatAwaySpread = num(match?.awaySpread, null) || num(odds?.awaySpread, null);

    // SPREAD
    const spreadObj = (flatSpreadLine !== null && flatHomeSpread !== null)
        ? { line: flatSpreadLine, home: flatHomeSpread, away: flatAwaySpread }
        : (odds?.spread ? { line: num(odds.spread.line, null), home: num(odds.spread.home, null), away: num(odds.spread.away, null) } : null);

    if (spreadObj && Number.isFinite(Number(spreadObj.line))) {
        const line = Number(spreadObj.line); // relative to home
        const targetMargin = -1 * line;

        // Home Cover Prob
        // P(Margin > targetMargin)
        const sigma = DEFAULTS.league.marginSigma;
        const homeRes = getOutcomeProbs(muMargin, sigma, targetMargin);

        evaluateMarket({
            recs, selection: `${team1} ${line > 0 ? '+' : ''}${line}`,
            market: 'Spread', odds: spreadObj.home,
            probResults: homeRes, bankroll, staking, reason: `Normal(margin)`
        });

        // Away Cover Prob
        // Away covers if Home FAILS to cover (and no push)
        // P(Away Cover) = P(Loss for Home) (from home perspective)
        const awayRes = {
            pWin: homeRes.pLoss,
            pPush: homeRes.pPush,
            pLoss: homeRes.pWin
        };
        evaluateMarket({
            recs, selection: `${team2} ${-line > 0 ? '+' : ''}${-line}`,
            market: 'Spread', odds: spreadObj.away,
            probResults: awayRes, bankroll, staking, reason: `Normal(margin)`
        });
    }

    // Totals
    const totalLine = flatTotalLine;

    if (Number.isFinite(totalLine)) {
        const sigma = DEFAULTS.league.totalSigma;
        // Over: P(Total > line)
        const overRes = getOutcomeProbs(muTotal, sigma, totalLine);

        evaluateMarket({
            recs, selection: `Over ${totalLine}`,
            market: 'Total Points', odds: flatTotalOver || odds?.total?.over,
            probResults: overRes, bankroll, staking, reason: `Normal(total)`
        });

        // Under
        const underRes = {
            pWin: overRes.pLoss,
            pPush: overRes.pPush,
            pLoss: overRes.pWin
        };
        evaluateMarket({
            recs, selection: `Under ${totalLine}`,
            market: 'Total Points', odds: flatTotalUnder || odds?.total?.under,
            probResults: underRes, bankroll, staking, reason: `Normal(total)`
        });
    }

    // Moneyline (Derived from margin distribution P(Margin > 0))
    const sigmaM = DEFAULTS.league.marginSigma;
    const mlRes = getOutcomeProbs(muMargin, sigmaM, 0); // Margin > 0

    evaluateMarket({
        recs, selection: team1, market: 'Moneyline',
        odds: flatHomeWin || odds?.homeML,
        probResults: mlRes, bankroll, staking, reason: 'Derived from Margin'
    });

    const mlResAway = { pWin: mlRes.pLoss, pPush: mlRes.pPush, pLoss: mlRes.pWin };
    evaluateMarket({
        recs, selection: team2, market: 'Moneyline',
        odds: flatAwayWin || odds?.awayML,
        probResults: mlResAway, bankroll, staking, reason: 'Derived from Margin'
    });

    return {
        matchId: match.id,
        recommendations: recs.sort((a, b) => b.ev - a.ev),
        explanations,
        warnings,
        computedStats: {
            pace, hEff, aEff,
            expHome, expAway, muMargin, muTotal
        }
    };
};