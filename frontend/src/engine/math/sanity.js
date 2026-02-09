/**
 * PhD Betting Engine - Sanity/Validation Module (Production Hardened)
 * Enforces strict mathematical bounds on all inputs/outputs.
 */

const EPS = 1e-12;

const isFiniteNum = (x) => typeof x === "number" && Number.isFinite(x);

export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
export const clamp01 = (p) => clamp(p, 0, 1);

/**
 * Coerce unknown input into a finite number (or NaN).
 * @param {any} x
 * @returns {number}
 */
export const toNumber = (x) => {
  const n = typeof x === "string" ? Number(x.trim()) : Number(x);
  return Number.isFinite(n) ? n : NaN;
};

/**
 * Asserts that a probability is within valid range [0, 1].
 * Accepts number OR numeric string (optional convenience).
 * @param {number|string} p
 * @returns {boolean}
 */
export const isValidProb = (p) => {
  const x = toNumber(p);
  return isFiniteNum(x) && x >= 0 - EPS && x <= 1 + EPS;
};

/**
 * Asserts that odds are valid decimal odds (> 1.0).
 * Accepts number OR numeric string.
 * @param {number|string} odds
 * @param {object} [opts]
 * @param {number} [opts.min=1.01] - minimum realistic decimal odds
 * @returns {boolean}
 */
export const isValidOdds = (odds, opts = {}) => {
  const min = Number.isFinite(opts.min) ? opts.min : 1.01;
  const x = toNumber(odds);
  return isFiniteNum(x) && x >= min;
};

/**
 * Validate a bet candidate.
 * @param {object} bet - { odds, p }
 * @returns {object} { valid: boolean, reason?: string, normalized?: { odds:number, p:number } }
 */
export const validateBet = (bet) => {
  if (!bet || typeof bet !== "object") {
    return { valid: false, reason: "Bet is missing or not an object." };
  }

  const oddsN = toNumber(bet.odds);
  const pN = toNumber(bet.p);

  if (!Number.isFinite(oddsN)) return { valid: false, reason: `Invalid odds (NaN/Inf): ${bet.odds}` };
  if (!Number.isFinite(pN)) return { valid: false, reason: `Invalid probability (NaN/Inf): ${bet.p}` };

  if (!isValidOdds(oddsN)) return { valid: false, reason: `Invalid odds (must be >= 1.01): ${oddsN}` };
  if (!isValidProb(pN)) return { valid: false, reason: `Invalid probability (must be in [0,1]): ${pN}` };

  // Normalize tiny floating errors like 1.0000000002
  const pClamped = clamp01(pN);

  return {
    valid: true,
    normalized: { odds: oddsN, p: pClamped },
  };
};

export default {
  clamp,
  clamp01,
  toNumber,
  isValidProb,
  isValidOdds,
  validateBet,
};