/**
 * PhD Betting Engine - Kelly Criterion Module (Production Hardened)
 * - Log-utility based sizing
 * - Fractional Kelly (default 0.25)
 * - Hard caps (e.g. max 10% of bankroll)
 */

const EPS = 1e-12;

const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const clamp01 = (p) => (p < 0 ? 0 : p > 1 ? 1 : p);

const safeProb = (p) => {
  const x = Number(p);
  if (!Number.isFinite(x)) return NaN;
  return clamp01(x);
};

const safeOdds = (o) => {
  const x = Number(o);
  if (!Number.isFinite(x) || x <= 1) return NaN; // decimal odds must be > 1
  return x;
};

const safeNonNeg = (v, fallback) => {
  const x = Number(v);
  if (!Number.isFinite(x) || x < 0) return fallback;
  return x;
};

/**
 * Calculates the full Kelly fraction.
 * f* = (p * odds - 1) / (odds - 1)
 *
 * @param {number} p - Probability of winning (0-1)
 * @param {number} odds - Decimal odds (>1)
 * @returns {number} Optimal fraction (0-1), or 0 if negative EV / invalid inputs
 */
export const calcFullKelly = (p, odds) => {
  const pp = safeProb(p);
  const oo = safeOdds(odds);
  if (!isNum(pp) || !isNum(oo)) return 0;

  const b = oo - 1;
  if (b <= EPS) return 0;

  // full kelly
  const f = (pp * oo - 1) / b;

  // no negative stakes
  return f > 0 ? f : 0;
};

/**
 * Applies fractional multiplier and hard cap.
 *
 * @param {number} fullKelly - (0-1)
 * @param {object} options
 * @param {number} [options.fraction=0.25] - multiplier (>=0)
 * @param {number} [options.cap=0.10] - cap (>=0)
 * @returns {number} Recommended fraction of bankroll (0-1)
 */
export const calcFractionalKelly = (
  fullKelly,
  { fraction = 0.25, cap = 0.10 } = {}
) => {
  const fk = safeNonNeg(fullKelly, 0);
  const fr = safeNonNeg(fraction, 0.25);
  const cp = safeNonNeg(cap, 0.10);

  const raw = fk * fr;
  const capped = Math.min(raw, cp);

  // Keep it sane
  return capped < 0 ? 0 : capped;
};

/**
 * Stake amount from bankroll.
 *
 * @param {number} stakePct - fraction (0-1)
 * @param {number} bankroll - >= 0
 * @returns {number}
 */
export const calcStakeAmount = (stakePct, bankroll) => {
  const s = safeNonNeg(stakePct, 0);
  const b = Number(bankroll);
  if (!Number.isFinite(b) || b <= 0) return 0;
  return b * s;
};

export default {
  calcFullKelly,
  calcFractionalKelly,
  calcStakeAmount,
};