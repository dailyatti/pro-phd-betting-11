/**
 * PhD Betting Engine - Expected Value (EV) Module (Production Hardened)
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

/**
 * Edge = P_model - P_implied
 */
export const calcEdge = (pModel, pImplied) => {
  const pm = safeProb(pModel);
  const pi = safeProb(pImplied);
  if (!isNum(pm) || !isNum(pi)) return 0;
  return pm - pi;
};

/**
 * EV = (p * odds) - 1
 * Stake assumed 1 unit.
 */
export const calcEV = (p, odds) => {
  const pp = safeProb(p);
  const oo = safeOdds(odds);
  if (!isNum(pp) || !isNum(oo)) return 0;

  // If p=0 => EV=-1 (lose stake always). If p=1 => EV=odds-1.
  return (pp * oo) - 1;
};

/**
 * Utility: implied probability from decimal odds
 */
export const impliedProb = (odds) => {
  const oo = safeOdds(odds);
  if (!isNum(oo)) return 0;
  return 1 / oo;
};

/**
 * EV% string for UI.
 */
export const formatEV = (ev) => {
  const x = Number(ev);
  if (!Number.isFinite(x)) return "0.0%";
  const pct = x * 100;
  return `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
};

/**
 * Optional: fair odds from probability
 */
export const fairOdds = (p) => {
  const pp = safeProb(p);
  if (!isNum(pp) || pp <= EPS) return 0;
  return 1 / pp;
};

export default {
  calcEdge,
  calcEV,
  impliedProb,
  fairOdds,
  formatEV,
};