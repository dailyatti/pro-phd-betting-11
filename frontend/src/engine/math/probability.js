/**
 * PhD Betting Engine - Probability Module
 * 
 * Provides rigorous mathematical utilities for handling betting probabilities,
 * including overround removal, implied probability calculation, and robust parsing
 * of heterogeneous probability representations.
 */

const EPS = 1e-12;

const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const clamp01 = (p) => (p < 0 ? 0 : p > 1 ? 1 : p);

/**
 * Calculates implied probability from decimal odds.
 * @param {number|string} odds - Decimal odds (e.g., 2.50)
 * @returns {number|null} Implied probability (0-1) or null if invalid
 */
export const calcImpliedProb = (odds) => {
  const o = Number(odds);
  if (!Number.isFinite(o) || o <= 1) return null;
  return 1 / o;
};

/**
 * Normalizes an array of probabilities so they sum to 1.0 (Unit Simplex).
 * 
 * This is frequently used for "overround removal" in betting markets, 
 * mapping bookmaker implied probabilities back to a true theoretical probability 
 * distribution where \sum P_i = 1.
 * 
 * @param {Array<number|string>} probs - Array of raw probabilities or implied percentages.
 * @returns {number[]} Normalized probabilities summing to 1.0. Returns zeros if the sum is below EPS.
 */
export const normalizeProbs = (probs) => {
  const arr = Array.isArray(probs) ? probs : [];
  const cleaned = arr.map((p) => {
    const x = Number(p);
    if (!Number.isFinite(x)) return 0;
    return x < 0 ? 0 : x;
  });

  const sum = cleaned.reduce((a, b) => a + b, 0);
  if (!(sum > EPS)) return cleaned.map(() => 0);

  return cleaned.map((p) => p / sum);
};

/**
 * Converts percentage/decimal representations to probability (0-1).
 *
 * Accepted inputs:
 * - number: 0.55 -> 0.55, 55 -> 0.55
 * - string:
 *    "55%" -> 0.55
 *    "0.55" -> 0.55
 *    ".55" -> 0.55
 *    "55" -> 0.55   (rule: numeric strings > 1 are treated as percent)
 *
 * @param {string|number} val
 * @returns {number} Probability in [0,1]
 */
export const parseProb = (val) => {
  if (val == null) return 0;

  // number input
  if (typeof val === "number") {
    if (!Number.isFinite(val)) return 0;
    return clamp01(val > 1 ? val / 100 : val);
  }

  // string input
  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return 0;

    const hasPercent = s.includes("%");
    const cleaned = s.replace("%", "").trim();

    // allow ".55"
    const x = Number(cleaned);
    if (!Number.isFinite(x)) return 0;

    if (hasPercent) return clamp01(x / 100);

    // If user typed "0.55" => treat as decimal
    // If user typed "55" => treat as percent
    return clamp01(x > 1 ? x / 100 : x);
  }

  return 0;
};

export default {
  calcImpliedProb,
  normalizeProbs,
  parseProb,
};