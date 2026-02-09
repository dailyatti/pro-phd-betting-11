/**
 * WagerBrain — PhD-Level Betting Mathematics (JS, production hardened)
 *
 * Implements:
 * 1) ELO win probability (538 logistic)
 * 2) Arbitrage detection + equal-payout stake splits
 * 3) Power vig removal (delegates to centralized math/vig module)
 * 4) Parlay odds + parlay probability
 * 5) Odds conversion utils
 *
 * Notes:
 * - Strict input coercion (numeric strings OK)
 * - Defensive guards (NaN/Inf -> null/empty outputs)
 * - Side-effect free / pure helpers
 */

import { removeVigPower } from "../engine/math/vig.js";

// --------------------
// CONSTANTS + HELPERS
// --------------------
const DEFAULT_ELO_K = 400;
const EPS = 1e-12;

const isFiniteNum = (x) => typeof x === "number" && Number.isFinite(x);

const toNum = (x) => {
    const n = typeof x === "string" ? Number(x.trim()) : Number(x);
    return Number.isFinite(n) ? n : NaN;
};

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

const clamp01 = (p) => clamp(p, 0, 1);

const safeDecimalOdds = (o, min = 1.0000001) => {
    const x = toNum(o);
    if (!Number.isFinite(x) || x <= min) return NaN;
    return x;
};

const sanitizeOddsArray = (oddsArray, { maxOutcomes = 60, minOdds = 1.0000001 } = {}) => {
    if (!Array.isArray(oddsArray)) return [];
    const cleaned = oddsArray
        .map((o) => safeDecimalOdds(o, minOdds))
        .filter((o) => Number.isFinite(o));
    return cleaned.slice(0, maxOutcomes);
};

// --------------------
// 1) ELO WIN PROBABILITY
// --------------------
/**
 * 538-style logistic:
 * P(A) = 1 / (1 + 10^((ELO_B - ELO_A)/K))
 */
export const eloWinProbability = (eloA, eloB, kFactor = DEFAULT_ELO_K) => {
    const a = toNum(eloA);
    const b = toNum(eloB);
    const k = toNum(kFactor);

    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(k) || k <= 0) return null;

    const exponent = (b - a) / k;
    const p = 1 / (1 + Math.pow(10, exponent));
    return clamp01(p);
};

// --------------------
// 2) ARBITRAGE DETECTION
// --------------------
/**
 * Arbitrage exists if Σ(1/odds_i) < 1
 * Equal payout stakes:
 * - implied_i = 1/odds_i
 * - stake_i = implied_i / Σ implied
 *
 * Outputs:
 * - profitPct: theoretical ROI on total stake for equal payout strategy
 * - stakesPct: percentages of total stake per outcome
 */
export const detectArbitrage = (oddsArray, opts = {}) => {
    const odds = sanitizeOddsArray(oddsArray, opts);
    if (odds.length < 2) {
        return { isArbitrage: false, totalImplied: 0, profitPct: 0, stakesPct: [] };
    }

    const implied = odds.map((o) => 1 / o);
    const totalImplied = implied.reduce((s, p) => s + p, 0);

    if (!Number.isFinite(totalImplied) || totalImplied <= EPS) {
        return { isArbitrage: false, totalImplied: 0, profitPct: 0, stakesPct: [] };
    }

    const isArbitrage = totalImplied < 1 - 1e-9;
    const profitPct = isArbitrage ? (1 / totalImplied - 1) * 100 : 0;

    const stakesPct = isArbitrage ? implied.map((p) => (p / totalImplied) * 100) : [];

    return {
        isArbitrage,
        totalImplied: Number(totalImplied.toFixed(6)),
        profitPct: Number(profitPct.toFixed(2)),
        stakesPct: stakesPct.map((x) => Number(x.toFixed(2))),
    };
};

/**
 * Optional helper: compute currency stakes given a total stake amount.
 * Keeps equal payout distribution.
 */
export const arbitrageStakes = (oddsArray, totalStake, opts = {}) => {
    const t = toNum(totalStake);
    if (!Number.isFinite(t) || t <= 0) return null;

    const arb = detectArbitrage(oddsArray, opts);
    if (!arb.isArbitrage) return null;

    const stakes = arb.stakesPct.map((pct) => (pct / 100) * t);
    return {
        ...arb,
        totalStake: Number(t.toFixed(2)),
        stakes: stakes.map((s) => Number(s.toFixed(2))),
    };
};

// --------------------
// 3) POWER VIG REMOVAL (delegated)
// --------------------
/**
 * Backward-compatible wrapper around centralized removeVigPower().
 *
 * Central module returns:
 * { fairProbs, fairOdds, margin, alpha, converged, iterations, method, ... }
 */
export const powerVig = (oddsArray, options = {}) => {
    const result = removeVigPower(oddsArray, options);
    if (!result) return null;

    return {
        fairOdds: (result.fairOdds || []).map((x) => Number(toNum(x).toFixed(3))),
        fairProbs: (result.fairProbs || []).map((x) => Number(toNum(x).toFixed(6))),
        marginPct: Number((toNum(result.margin) * 100).toFixed(3)),
        powerFactor: Number(toNum(result.alpha).toFixed(6)),
        converged: !!result.converged,
        iterations: Number.isFinite(result.iterations) ? result.iterations : null,
        method: result.method || "power",
    };
};

// --------------------
// 4) PARLAY HELPERS
// --------------------
export const parlayOdds = (oddsArray, opts = {}) => {
    const odds = sanitizeOddsArray(oddsArray, opts);
    if (odds.length === 0) return 1;

    // Multiply; if any invalid were filtered out already
    const prod = odds.reduce((acc, o) => acc * o, 1);
    return Number.isFinite(prod) ? prod : 1;
};

export const parlayProbability = (probsArray) => {
    if (!Array.isArray(probsArray) || probsArray.length === 0) return 0;

    const probs = probsArray
        .map((p) => clamp01(toNum(p)))
        .filter((p) => Number.isFinite(p));

    if (probs.length === 0) return 0;

    const prod = probs.reduce((acc, p) => acc * p, 1);
    return clamp01(Number.isFinite(prod) ? prod : 0);
};

/**
 * Convenience: parlay implied probability from odds (no-vig not applied).
 */
export const parlayImpliedProb = (oddsArray, opts = {}) => {
    const o = parlayOdds(oddsArray, opts);
    if (!Number.isFinite(o) || o <= 1) return null;
    return 1 / o;
};

// --------------------
// 5) ODDS CONVERSION
// --------------------
export const oddsConvert = {
    /** American -> Decimal */
    americanToDecimal: (american) => {
        const a = toNum(american);
        if (!Number.isFinite(a) || a === 0) return null;

        if (a >= 100) return a / 100 + 1;
        if (a <= -100) return 100 / Math.abs(a) + 1;

        // Some books allow weird small values; treat as invalid to stay strict.
        return null;
    },

    /** Decimal -> American */
    decimalToAmerican: (decimal) => {
        const d = safeDecimalOdds(decimal);
        if (!Number.isFinite(d)) return null;

        if (d >= 2) return Math.round((d - 1) * 100);
        // 1 < d < 2
        return Math.round(-100 / (d - 1));
    },

    /** Fractional -> Decimal */
    fractionalToDecimal: (numerator, denominator) => {
        const n = toNum(numerator);
        const d = toNum(denominator);
        if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;
        const dec = n / d + 1;
        return Number.isFinite(dec) && dec > 1 ? dec : null;
    },
};

export default {
    eloWinProbability,
    detectArbitrage,
    arbitrageStakes,
    powerVig,
    parlayOdds,
    parlayProbability,
    parlayImpliedProb,
    oddsConvert,
};