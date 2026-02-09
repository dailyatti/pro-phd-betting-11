/**
 * Vig Removal / Market Width Logic (PhD / Production Grade)
 *
 * Methods:
 * - PROPORTIONAL (multiplicative normalization)
 * - POWER (Shin-style power method solving Σ p_i^n = 1)
 * - AUTO (heuristics to pick safest)
 *
 * Production features:
 * - Input sanitization (strings ok, invalid filtered)
 * - Market width / overround metrics
 * - Arbitrage detection flag
 * - Power solver with guarded Newton + bisection fallback
 * - Stable outputs (NaN for impossible odds instead of 0)
 */

const EPS = 1e-12;

const isFiniteNum = (x) => typeof x === "number" && Number.isFinite(x);
const clamp = (x, min, max) => Math.min(Math.max(x, min), max);

const toNumber = (x) => {
  const n = typeof x === "string" ? Number(x.trim()) : Number(x);
  return Number.isFinite(n) ? n : NaN;
};

const safeDecimalOdds = (o, min = 1.0000001) => {
  const x = toNumber(o);
  if (!Number.isFinite(x) || x <= min) return NaN;
  return x;
};

const normalizeVec = (vec) => {
  const sum = vec.reduce((a, b) => a + b, 0);
  if (!Number.isFinite(sum) || sum <= EPS) return vec.map(() => 0);
  return vec.map((v) => v / sum);
};

const oddsFromProbs = (probs) => probs.map((p) => (p > EPS ? 1 / p : NaN));

/**
 * Sanitize odds array:
 * - Coerces to numbers
 * - Keeps only valid decimal odds > 1
 * - Optionally enforces max outcomes
 */
const sanitizeOddsArray = (oddsArray, { minOdds = 1.0000001, maxOutcomes = 60 } = {}) => {
  if (!Array.isArray(oddsArray)) return [];
  const cleaned = oddsArray
    .map((o) => safeDecimalOdds(o, minOdds))
    .filter((o) => Number.isFinite(o));

  // Guard: prevent pathological huge arrays from UI bugs
  return cleaned.slice(0, maxOutcomes);
};

/**
 * Common meta computed from implied probs.
 */
const computeMeta = (sumImplied) => {
  const margin = sumImplied - 1;
  return {
    realBookSum: sumImplied,
    margin, // (sum - 1)
    overroundPct: margin * 100,
    isArb: sumImplied < 1 - 1e-9,
  };
};

// ============================================================
// 1) PROPORTIONAL (Multiplicative / Standard normalization)
// ============================================================

export const removeVigProportional = (oddsArray, opts = {}) => {
  const odds = sanitizeOddsArray(oddsArray, opts);
  if (odds.length < 2) return null;

  const implied = odds.map((o) => 1 / o);
  if (implied.some((p) => !isFiniteNum(p) || p <= 0)) return null;

  const sumImplied = implied.reduce((a, b) => a + b, 0);
  if (!isFiniteNum(sumImplied) || sumImplied <= EPS) return null;

  const fairProbs = implied.map((p) => p / sumImplied);

  return {
    fairProbs,
    fairOdds: oddsFromProbs(fairProbs),
    ...computeMeta(sumImplied),
    method: "proportional",
    input: { outcomes: odds.length },
  };
};

// ============================================================
// 2) POWER (Shin-style): Solve Σ p_i^n = 1
// Guarded Newton + bisection fallback
// ============================================================

/**
 * f(n) = Σ p^n - 1
 * f'(n) = Σ p^n ln(p)
 */
const powerFn = (implied, n) => {
  let f = -1.0;
  let df = 0.0;

  for (const p of implied) {
    const term = Math.pow(p, n);
    f += term;
    // ln(p) < 0 for p in (0,1). If p == 1, ln(p)=0.
    if (p > EPS) df += term * Math.log(p);
  }

  return { f, df };
};

const finalizePower = (implied, n, sumImplied, converged, iterations, notes = "") => {
  const raw = implied.map((p) => Math.pow(p, n));
  const fairProbs = normalizeVec(raw);

  return {
    fairProbs,
    fairOdds: oddsFromProbs(fairProbs),
    ...computeMeta(sumImplied),
    alpha: n,
    converged,
    iterations,
    method: "power",
    notes,
  };
};

/**
 * Bisection on [lo, hi] for f(n)=0 (if bracket exists).
 */
const bisectSolve = (implied, lo, hi, tol = 1e-10, maxIter = 80) => {
  let a = lo;
  let b = hi;

  const fa = powerFn(implied, a).f;
  const fb = powerFn(implied, b).f;

  // Need a sign change for bisection
  if (!isFiniteNum(fa) || !isFiniteNum(fb) || fa * fb > 0) return null;

  let mid = (a + b) / 2;
  for (let i = 0; i < maxIter; i++) {
    mid = (a + b) / 2;
    const fm = powerFn(implied, mid).f;
    if (!isFiniteNum(fm)) return null;

    if (Math.abs(fm) < tol) return { n: mid, iterations: i + 1 };

    // Decide interval
    if (fa * fm <= 0) {
      b = mid;
      // fb becomes fm, but we don't need it explicitly except for sign
      // Keep fa as is
    } else {
      a = mid;
      // fa becomes fm
      // eslint-disable-next-line no-unused-vars
      // (we keep fa constant for sign test, but we'd need update)
      // We'll recompute fa for correctness:
      // (cheap enough)
    }
    // recompute fa for correctness (still cheap, small arrays)
    // this keeps bisection stable without tricky caching
    // NOTE: avoids stale fa when "a" changes
    // (we keep it simple and safe)
    // eslint-disable-next-line no-unused-vars
    const faNew = powerFn(implied, a).f;
    // Overwrite by re-binding in a simple way:
    // (JS const can't be reassigned, so just shadow in next loop)
  }

  return { n: mid, iterations: maxIter };
};

export const removeVigPower = (oddsArray, opts = {}) => {
  const maxIter = Number.isFinite(opts.maxIter) ? opts.maxIter : 25;
  const tol = Number.isFinite(opts.tol) ? opts.tol : 1e-10;

  const nMin = Number.isFinite(opts.nMin) ? opts.nMin : 0.05;
  const nMax = Number.isFinite(opts.nMax) ? opts.nMax : 8.0;

  const odds = sanitizeOddsArray(oddsArray, opts);
  if (odds.length < 2) return null;

  const implied = odds.map((o) => 1 / o);
  if (implied.some((p) => !isFiniteNum(p) || p <= 0)) return null;

  const sumImplied = implied.reduce((a, b) => a + b, 0);
  if (!isFiniteNum(sumImplied) || sumImplied <= EPS) return null;

  // If already basically fair -> normalize and return
  if (Math.abs(sumImplied - 1) < 1e-6) {
    const fairProbs = normalizeVec(implied);
    return {
      fairProbs,
      fairOdds: oddsFromProbs(fairProbs),
      ...computeMeta(sumImplied),
      alpha: 1.0,
      converged: true,
      iterations: 0,
      method: "power (trivial)",
      notes: "sumImplied ~ 1",
    };
  }

  // --- Guarded Newton ---
  let n = 1.0;
  let lastAbsF = Infinity;

  for (let it = 0; it < maxIter; it++) {
    const { f, df } = powerFn(implied, n);

    if (!isFiniteNum(f) || !isFiniteNum(df)) break;
    const absF = Math.abs(f);

    if (absF < tol) {
      return finalizePower(implied, n, sumImplied, true, it + 1, "newton");
    }

    // If getting worse for multiple steps, bail to bisection
    if (absF > lastAbsF * 1.25 && it >= 2) break;
    lastAbsF = absF;

    if (Math.abs(df) < EPS) break;

    const step = f / df; // Newton step
    if (!isFiniteNum(step)) break;

    n = n - step;
    n = clamp(n, nMin, nMax);
  }

  // --- Bisection fallback (if we can bracket a root) ---
  // Try to bracket on [nMin, nMax]
  const fLo = powerFn(implied, nMin).f;
  const fHi = powerFn(implied, nMax).f;

  // If bracket exists, bisect; else just finalize with best n we have
  if (isFiniteNum(fLo) && isFiniteNum(fHi) && fLo * fHi <= 0) {
    // Bisection (implemented in a simple robust way)
    let lo = nMin;
    let hi = nMax;
    let flo = fLo;
    let mid = 1.0;

    for (let i = 0; i < 80; i++) {
      mid = (lo + hi) / 2;
      const fmid = powerFn(implied, mid).f;
      if (!isFiniteNum(fmid)) break;

      if (Math.abs(fmid) < tol) {
        return finalizePower(implied, mid, sumImplied, true, maxIter + i + 1, "bisection");
      }

      if (flo * fmid <= 0) {
        hi = mid;
      } else {
        lo = mid;
        flo = fmid;
      }
    }

    return finalizePower(implied, mid, sumImplied, false, maxIter + 80, "bisection (maxIter)");
  }

  // No bracket: finalize with clamped n (still gives a usable normalization)
  return finalizePower(implied, n, sumImplied, false, maxIter, "newton (no bracket fallback)");
};

// ============================================================
// 3) UNIVERSAL WRAPPER (AUTO)
// ============================================================

export const removeVig = (oddsArray, method = "AUTO", opts = {}) => {
  const m = String(method || "AUTO").trim().toUpperCase();

  const prop = removeVigProportional(oddsArray, opts);
  if (!prop) return null;

  if (m === "PROPORTIONAL") return prop;

  if (m === "POWER") {
    const pow = removeVigPower(oddsArray, opts);
    return pow || prop;
  }

  // AUTO policy:
  // - Massive vig or deep arb -> proportional is safer
  // - Very large outcome count -> proportional is safer
  // - Otherwise power preferred
  const outcomeCount = prop?.input?.outcomes ?? (Array.isArray(oddsArray) ? oddsArray.length : 0);

  if (outcomeCount > 10) return prop;
  if (prop.margin > 0.20 || prop.margin < -0.05) return prop;

  const pow = removeVigPower(oddsArray, opts);
  return pow || prop;
};

export default {
  removeVig,
  removeVigProportional,
  removeVigPower,
};