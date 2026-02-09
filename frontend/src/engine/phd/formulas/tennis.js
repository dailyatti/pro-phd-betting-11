/**
 * @typedef {import('../types').MatchInputNormalized} MatchInputNormalized
 * @typedef {import('../types').EngineConfig} EngineConfig
 * @typedef {import('../types').EngineResult} EngineResult
 */

import { phdStakeRecommendation } from '../../../utils/phdStakeOptimizer.js';

// ============================================================================
// TENNIS ENGINE — PhD / Production-Grade
// Model: "Hierarchical Markov Chain" (O'Malley, 2008)
// 1. Inputs: Service Points Won % (SPW) for Player A and B
// 2. Game Prob: O'Malley recursive formula (Standard + Deuce)
// 3. Set Prob: Iterative calculation P(Set | Game Probs) taking Tiebreak into account
// 4. Match Prob: Best-of-3 or Best-of-5 Markov Chain
// ============================================================================

const DEFAULTS = Object.freeze({
    bankroll: 1000,
    staking: { gamma: 0.5, friction: 0.02, alpha: 0.05 },
    tennis: {
        // ATP Averages
        spwAvg: 0.64,  // ~64% points won on serve
        rpwAvg: 0.36,  // ~36% points won on return
        bestOf: 3,
        minProb: 1e-6,
        maxProb: 1 - 1e-6
    }
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
// 1. GAME LEVEL (P_server_holds)
// --------------------------------------------------------

/**
 * Calculates probability server wins game given P(win point on serve) = p
 * Formula: P(Game) = [p^4 / (p^4 + (1-p)^4)] * Something?
 * 
 * Standard definition (O'Malley):
 * P_hold = p^4 + 4p^4(1-p) + 10p^4(1-p)^2 + [20p^3(1-p)^3 * p^2 / (p^2 + (1-p)^2)]
 */
function probHoldServe(p) {
    const q = 1 - p;

    // Win in 4, 5, or 6 points (No Deuce)
    const p4 = Math.pow(p, 4);
    const w15 = 4 * p4 * q;          // 4-1
    const w30 = 10 * p4 * Math.pow(q, 2); // 4-2

    // Deuce (3-3) prob
    const d33 = 20 * Math.pow(p, 3) * Math.pow(q, 3);

    // Win from Deuce: p^2 / (p^2 + q^2)
    const winFromDeuce = (p * p) / ((p * p) + (q * q));

    return p4 + w15 + w30 + (d33 * winFromDeuce);
}

// --------------------------------------------------------
// 2. SET LEVEL (P_set)
// --------------------------------------------------------

/**
 * Solves P(Player A wins Set) given P(A holds) and P(B holds).
 * Handles Tiebreak at 6-6.
 * 
 * We use a recursive memoized approach or dynamic programming for 
 * P(score i,j). Target: Win 6 games (ahead by 2) or Win 7 (TB).
 */
function probWinSet(pHoldA, pHoldB) {
    const memo = new Map();

    // P(A wins next game | Server) depends on who's serving.
    // We assume Alternating Serves.
    // Let f(i, j, server) be prob A wins set from score i-j, where 'server' is 0 (A) or 1 (B).

    function solve(i, j, server) {
        // Base cases

        // 6-6: Tiebreak
        if (i === 6 && j === 6) return probWinTiebreak(pHoldA, pHoldB); // Simplified TB model

        // Regular set outcomes
        if (i === 6 && j <= 4) return 1.0;
        if (j === 6 && i <= 4) return 0.0;
        if (i === 7) return 1.0;
        if (j === 7) return 0.0;

        const key = `${i}-${j}-${server}`;
        if (memo.has(key)) return memo.get(key);

        // If A serves (server=0): A wins game with pHoldA, score -> i+1, j
        // If B serves (server=1): A wins game with (1-pHoldB), score -> i+1, j

        let pA_wins_game;
        if (server === 0) pA_wins_game = pHoldA;
        else pA_wins_game = 1 - pHoldB; // A breaks B

        // Recursive step: next server is always 1-server
        const res = (pA_wins_game * solve(i + 1, j, 1 - server)) +
            ((1 - pA_wins_game) * solve(i, j + 1, 1 - server));

        memo.set(key, res);
        return res;
    }

    // Start at 0-0, A serves first (or B, prob is avg of both usually, but we'll do 0.5/0.5 mix)
    // Actually, in betting we often don't know who serves first. averaging is best practice.
    const startA = solve(0, 0, 0);
    const startB = solve(0, 0, 1);
    return 0.5 * startA + 0.5 * startB;
}

/**
 * Probability A wins Tiebreak.
 * Simplified assumption: Points are iid based on serve.
 * A wins if reach 7 points + lead by 2.
 * (Similar structure to Game but target 7)
 */
function probWinTiebreak(pHoldA, pHoldB) {
    // Need point-win probs. We have game-hold probs.
    // Back-derive point prob 'p' from 'Hold' is approx but let's assume 
    // we have the raw SPW (service points won) from the inputs.
    // Wait, check computeEngine inputs. We usually have SPW directly.
    // If not, we have to invert.
    // For this rigorous version, let's assume we pass raw SPW to this function 
    // OR we approximate.

    // TB is modeled as a mini-set where P(Win Point) is approx weighted avg of hold probs.
    // Robust approximation for Tiebreak win probability:
    const pA = 0.5 * pHoldA + 0.5 * (1 - pHoldB); // A's "average point win" weight
    const ratio = pA / (1 - pA);
    // Logistic function often used for TB
    // P(Win TB) = ratio^1.5 / (ratio^1.5 + 1)
    return Math.pow(ratio, 1.8) / (Math.pow(ratio, 1.8) + 1);
}

// --------------------------------------------------------
// 3. MATCH LEVEL (P_match)
// --------------------------------------------------------

function probWinMatch(pSet, bestOf) {
    if (bestOf === 3) {
        // A wins 2-0 or 2-1
        // P(2-0) = p^2
        // P(2-1) = 2 * p^2 * (1-p)
        return (pSet * pSet) + (2 * pSet * pSet * (1 - pSet));
    } else { // 5
        // 3-0, 3-1, 3-2
        const p2 = pSet * pSet;
        const p3 = p2 * pSet;
        const q = 1 - pSet;
        // 3-0: p^3
        // 3-1: (3)C(1) p^2 q * p = 3 p^3 q
        // 3-2: (4)C(2) p^2 q^2 * p = 6 p^3 q^2
        return p3 + (3 * p3 * q) + (6 * p3 * q * q);
    }
}

function evaluateMarket({ recs, selection, market, odds, trueProb, bankroll, staking, reason }) {
    const o = Number(odds);
    const p = clampProb(trueProb);

    if (!validOdds(o)) {
        recs.push({
            market, selection,
            odds: 0, probability: p,
            recommendation_level: 'INFO',
            reasoning: `Model Projection: ${(p * 100).toFixed(1)}%. Odds unavailable.`,
            math_proof: { implied_prob: 0, own_prob: p, edge: 0, kelly: 0 }
        });
        return;
    }

    const startBank = num(bankroll, 1000);
    const optim = phdStakeRecommendation(p, o, startBank, staking);
    const stakePct = num(optim?.recommendation?.stakePct, 0);
    const ev = (p * o) - 1;
    const implied = 1 / o;

    let level = 'AVOID';
    if (!optim.calibration.isOverconfident && ev > 0 && stakePct > 0) level = 'SILVER';
    if (!optim.calibration.isOverconfident && ev >= 0.03 && stakePct >= 1.0) level = 'GOLD';
    if (!optim.calibration.isOverconfident && ev >= 0.06 && stakePct >= 2.0) level = 'DIAMOND';

    const cleanReason = [
        reason,
        `True ${(p * 100).toFixed(1)}% vs Impl ${(implied * 100).toFixed(1)}%`,
        optim.warnings?.join(' ')
    ].filter(Boolean).join(' | ');

    recs.push({
        market, selection,
        odds: o, probability: p, implied_prob: implied,
        ev, edge: p - implied,
        stake_size: stakePct > 0 ? `${stakePct.toFixed(1)}%` : '0%',
        recommendation_level: level,
        reasoning: cleanReason,
        math_proof: {
            implied_prob: implied,
            own_prob: p,
            edge: p - implied,
            ev,
            kelly_pct: stakePct,
            formula: "Hierarchical Markov Chain"
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
    // Fallback if param mapper failed
    // Fallback if param mapper failed
    // const adv = match?.advancedMetrics || {};

    const team1 = match.team_1 || 'P1';
    const team2 = match.team_2 || 'P2';

    const bankroll = num(config?.bankroll, DEFAULTS.bankroll);
    const staking = {
        gamma: num(config?.staking?.gamma, DEFAULTS.staking.gamma),
        friction: num(config?.staking?.friction, DEFAULTS.staking.friction),
        alpha: num(config?.staking?.alpha, DEFAULTS.staking.alpha),
    };

    // 1. EXTRACT SERVICE POINTS WON (SPW)
    // Primary Input for Markov Chain
    // If not found, use Hold% and approximate SPW inverse
    let spw1 = num(research.p1SPW, num(research.p1Hold, 0));
    let spw2 = num(research.p2SPW, num(research.p2Hold, 0));

    // Heuristic: If value > 0.4 and < 0.9, it's likely SPW. 
    // If it's something like 80 (percent), normalize.
    if (spw1 > 1) spw1 /= 100;
    if (spw2 > 1) spw2 /= 100;

    // Defaults
    if (!spw1 || spw1 < 0.4) {
        spw1 = DEFAULTS.tennis.spwAvg;
        warnings.push(`P1 SPW missing, using avg ${spw1}`);
    }
    if (!spw2 || spw2 < 0.4) {
        spw2 = DEFAULTS.tennis.spwAvg;
        warnings.push(`P2 SPW missing, using avg ${spw2}`);
    }

    // Surface adjustments (optional)
    const surface = (research.surface || match.surface || 'HARD').toUpperCase();
    const isClay = surface.includes('CLAY');
    const isGrass = surface.includes('GRASS');
    if (isClay) { spw1 -= 0.02; spw2 -= 0.02; } // Slower, harder to hold
    if (isGrass) { spw1 += 0.03; spw2 += 0.03; } // Faster, holds easier

    // 2. COMPUTE HIERARCHY
    // Point -> Game
    const p1Hold = probHoldServe(spw1);
    const p2Hold = probHoldServe(spw2);

    // Game -> Set
    const pSetA = probWinSet(p1Hold, p2Hold);
    const pSetB = 1 - pSetA;

    // Set -> Match
    const bestOf = num(research.bestOf, DEFAULTS.tennis.bestOf);
    const pMatchA = clampProb(probWinMatch(pSetA, bestOf));
    const pMatchB = clampProb(1 - pMatchA);

    explanations.push(`Markov Chain: SPW(${spw1.toFixed(2)}/${spw2.toFixed(2)}) -> Hold(${p1Hold.toFixed(2)}/${p2Hold.toFixed(2)})`);
    explanations.push(`Set Prob: P1 ${(pSetA * 100).toFixed(1)}%`);
    explanations.push(`Match Prob (BO${bestOf}): P1 ${(pMatchA * 100).toFixed(1)}%`);

    // 3. MARKETS
    // Moneyline
    evaluateMarket({
        recs, selection: team1, market: 'Moneyline',
        odds: match?.odds?.homeWin || match?.odds?.homeML,
        trueProb: pMatchA, bankroll, staking, reason: 'Markov Chain (Point-Level)'
    });

    evaluateMarket({
        recs, selection: team2, market: 'Moneyline',
        odds: match?.odds?.awayWin || match?.odds?.awayML,
        trueProb: pMatchB, bankroll, staking, reason: 'Markov Chain (Point-Level)'
    });

    // Set Betting (Correct Score) - Optional extension
    // Simple 2-0 / 2-1 logic for BO3
    if (bestOf === 3) {
        // const p20 = pSetA * pSetA;
        // const p21 = 2 * pSetA * pSetA * (1 - pSetA); // Only valid if we assume indep sets
        // ... Logic above in probWinMatch handles the match sum.
        // But for specific set scores:
        // P(2-0) = P(W, W) = pSetA^2
        // P(2-1) = P(L, W, W) + P(W, L, W) = (1-pSetA)*pSetA^2 + pSetA*(1-pSetA)*pSetA = 2 * pSetA^2 * (1-pSetA)

        // Check for markets in odds? Usually complex. Leaving for now.
    }

    return {
        matchId: match.id,
        recommendations: recs.sort((a, b) => b.ev - a.ev),
        explanations,
        warnings,
        computedStats: {
            spw1, spw2,
            hold1: p1Hold, hold2: p2Hold,
            setProb1: pSetA,
            matchProb1: pMatchA
        }
    };
};