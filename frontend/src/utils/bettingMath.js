/**
 * PhD Betting Intelligence - Mathematical Core (hardened)
 *
 * Implements:
 * 1) Implied probability
 * 2) Vig removal (proportional + optional power method)
 * 3) Fair EV
 * 4) Kelly sizing (fractional + cap + clamps + input guards)
 */

// --------------------
// CONSTANTS (tunable)
// --------------------
const DEFAULT_MAX_KELLY = 0.05;        // cap single bet at 5% bankroll
const DEFAULT_KELLY_FRACTION = 0.25;   // quarter Kelly
const EPS = 1e-12;

// --------------------
// TINY HELPERS
// --------------------
const isNum = (x) => Number.isFinite(x);
const clamp01 = (p) => (p < 0 ? 0 : p > 1 ? 1 : p);

const toNum = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : NaN;
};

const safeDecimalOdds = (odds) => {
  const o = toNum(odds);
  // Decimal odds must be > 1.0
  if (!Number.isFinite(o) || o <= 1) return NaN;
  return o;
};

// --------------------
// 1) IMPLIED PROB
// --------------------
/**
 * Calculates implied probability from Decimal Odds.
 * @param {number} decimalOdds
 * @returns {number} Probability in [0,1]
 */
export const calculateImpliedProb = (decimalOdds) => {
  const o = safeDecimalOdds(decimalOdds);
  if (!Number.isFinite(o)) return 0;
  const p = 1 / o;
  return clamp01(p);
};

// --------------------
// 2) VIG REMOVAL
// --------------------
/**
 * Proportional (aka "multiplicative") vig removal:
 *   raw_i = 1/odds_i
 *   fair_i = raw_i / sum(raw)
 *
 * @param {Object<string, number>} oddsMap
 * @returns {{ fairProbs: Object<string, number>, margin: number, sumImplied: number } | null}
 */
export const removeVigProportional = (oddsMap) => {
  if (!oddsMap || typeof oddsMap !== "object") return null;

  const keys = Object.keys(oddsMap).filter((k) => k != null && k !== "");
  if (keys.length < 2) return null;

  const raw = {};
  let sum = 0;

  for (const k of keys) {
    const o = safeDecimalOdds(oddsMap[k]);
    if (!Number.isFinite(o)) return null;
    const p = 1 / o;
    raw[k] = p;
    sum += p;
  }

  if (!Number.isFinite(sum) || sum <= EPS) return null;

  const fairProbs = {};
  for (const k of keys) {
    fairProbs[k] = clamp01(raw[k] / sum);
  }

  return {
    fairProbs,
    sumImplied: sum,
    margin: sum - 1,
  };
};

/**
 * Power method vig removal (optional).
 * Often used when you suspect favorite/longshot bias or want a different de-vig shape.
 *
 * Finds alpha such that:
 *   sum( raw_i^alpha ) = 1
 * Then:
 *   fair_i = raw_i^alpha
 *
 * This is a common, practical implementation:
 * - Solve alpha by binary search.
 *
 * @param {Object<string, number>} oddsMap
 * @param {Object} [options]
 * @param {number} [options.alphaMin=0.01]
 * @param {number} [options.alphaMax=5]
 * @param {number} [options.iters=60]
 * @returns {{ fairProbs: Object<string, number>, alpha: number, margin: number, sumImplied: number } | null}
 */
export const removeVigPower = (oddsMap, options = {}) => {
  if (!oddsMap || typeof oddsMap !== "object") return null;

  const keys = Object.keys(oddsMap).filter((k) => k != null && k !== "");
  if (keys.length < 2) return null;

  const raw = {};
  let sumImplied = 0;

  for (const k of keys) {
    const o = safeDecimalOdds(oddsMap[k]);
    if (!Number.isFinite(o)) return null;
    const p = 1 / o;
    raw[k] = p;
    sumImplied += p;
  }

  if (!Number.isFinite(sumImplied) || sumImplied <= EPS) return null;

  const alphaMin = isNum(options.alphaMin) ? options.alphaMin : 0.01;
  const alphaMax = isNum(options.alphaMax) ? options.alphaMax : 5;
  const iters = isNum(options.iters) ? Math.floor(options.iters) : 60;

  // helper: S(alpha) = sum(raw^alpha)
  const S = (a) => {
    let s = 0;
    for (const k of keys) s += Math.pow(raw[k], a);
    return s;
  };

  // If sumImplied already ~1, alpha ~1
  if (Math.abs(sumImplied - 1) < 1e-6) {
    const fairProbs = {};
    for (const k of keys) fairProbs[k] = clamp01(raw[k]);
    // Normalize tiny numeric drift
    const norm = Object.values(fairProbs).reduce((x, y) => x + y, 0) || 1;
    for (const k of keys) fairProbs[k] = fairProbs[k] / norm;

    return { fairProbs, alpha: 1, margin: sumImplied - 1, sumImplied };
  }

  // Binary search alpha so that S(alpha)=1
  let lo = alphaMin;
  let hi = alphaMax;

  // Ensure bracket covers 1: if not, expand a bit (safe)
  let slo = S(lo);
  let shi = S(hi);
  // S(alpha) decreases as alpha increases (since raw<1), typically monotone.
  // We want S(alpha)=1. Usually:
  // - If sumImplied>1, alpha>1 brings S down toward 1.
  // - If sumImplied<1, alpha<1 brings S up toward 1.
  // We'll just proceed with a robust bracket attempt.
  for (let i = 0; i < 10 && !(slo >= 1 && shi <= 1); i++) {
    if (slo < 1) lo *= 0.5, slo = S(lo);
    if (shi > 1) hi *= 1.5, shi = S(hi);
  }
  // If still not bracketed, fall back to proportional
  if (!(slo >= 1 && shi <= 1)) {
    const prop = removeVigProportional(oddsMap);
    return prop
      ? { fairProbs: prop.fairProbs, alpha: 1, margin: prop.margin, sumImplied: prop.sumImplied }
      : null;
  }

  for (let i = 0; i < iters; i++) {
    const mid = (lo + hi) / 2;
    const smid = S(mid);
    if (smid > 1) lo = mid;
    else hi = mid;
  }

  const alpha = (lo + hi) / 2;

  const fairProbs = {};
  for (const k of keys) fairProbs[k] = Math.pow(raw[k], alpha);

  // Ensure sums to 1 (tiny normalization)
  const norm = Object.values(fairProbs).reduce((x, y) => x + y, 0) || 1;
  for (const k of keys) fairProbs[k] = clamp01(fairProbs[k] / norm);

  return {
    fairProbs,
    alpha,
    sumImplied,
    margin: sumImplied - 1,
  };
};

/**
 * Convenience wrapper. Default: proportional (stable).
 * @param {Object<string, number>} oddsMap
 * @param {Object} [options]
 * @param {"proportional"|"power"} [options.method="proportional"]
 * @param {Object} [options.powerOptions]
 */
export const removeVig = (oddsMap, options = {}) => {
  const method = String(options.method || "proportional").toLowerCase();
  if (method === "power") return removeVigPower(oddsMap, options.powerOptions || {});
  return removeVigProportional(oddsMap);
};

// --------------------
// 3) FAIR EV
// --------------------
/**
 * EV (decimal odds) = p * odds - 1
 * @param {number} fairProb 0..1
 * @param {number} offeredOdds decimal odds
 * @returns {number} EV (e.g. 0.05 = +5%)
 */
export const calculateFairEV = (fairProb, offeredOdds) => {
  const p = toNum(fairProb);
  const o = safeDecimalOdds(offeredOdds);
  if (!Number.isFinite(p) || !Number.isFinite(o)) return 0;
  if (p <= 0) return -1;
  return (p * o) - 1;
};

// --------------------
// 4) KELLY
// --------------------
/**
 * Kelly fraction:
 *  f* = (b p - q)/b
 *  where b = odds - 1, q = 1-p
 *
 * @param {number} fairProb
 * @param {number} offeredOdds
 * @param {number} bankroll
 * @param {Object} [options]
 * @param {number} [options.fraction=DEFAULT_KELLY_FRACTION] fractional Kelly (0..1)
 * @param {number} [options.maxCap=DEFAULT_MAX_KELLY] cap as bankroll fraction (0..1)
 * @returns {{ stake: number, percentage: number, kelly: number, ev: number, reason: string }}
 */
export const calculateKellyStake = (fairProb, offeredOdds, bankroll, options = {}) => {
  const p = toNum(fairProb);
  const o = safeDecimalOdds(offeredOdds);
  const br = toNum(bankroll);

  if (!Number.isFinite(p) || !Number.isFinite(o) || !Number.isFinite(br) || br <= 0) {
    return { stake: 0, percentage: 0, kelly: 0, ev: 0, reason: "Invalid input" };
  }

  const pClamped = clamp01(p);
  const b = o - 1;
  const q = 1 - pClamped;

  const ev = (pClamped * o) - 1;
  // If negative or zero EV -> no bet
  if (ev <= 0) {
    return { stake: 0, percentage: 0, kelly: 0, ev, reason: "Negative EV" };
  }

  // Raw Kelly fraction
  let kelly = (b * pClamped - q) / b;

  // Guard: numeric issues
  if (!Number.isFinite(kelly) || kelly <= 0) {
    return { stake: 0, percentage: 0, kelly: 0, ev, reason: "Non-positive Kelly" };
  }

  // Fractional Kelly + cap
  const fraction = isNum(options.fraction) ? options.fraction : DEFAULT_KELLY_FRACTION;
  const maxCap = isNum(options.maxCap) ? options.maxCap : DEFAULT_MAX_KELLY;

  const frac = clamp(fraction, 0, 1);
  const cap = clamp(maxCap, 0, 1);

  let recommended = kelly * frac;
  let reason = "Kelly Optimal";

  if (recommended > cap) {
    recommended = cap;
    reason = "Capped at Max";
  }

  // Final stake
  const stake = br * recommended;

  return {
    stake: Number(stake.toFixed(2)),
    percentage: Number((recommended * 100).toFixed(2)),
    kelly: Number(kelly.toFixed(4)),
    ev: Number(ev.toFixed(4)),
    reason,
  };
};