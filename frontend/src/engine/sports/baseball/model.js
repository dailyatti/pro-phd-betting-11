/**
 * Baseball (MLB) Model — Production Hardened (v2)
 * - Moneyline: Pythagorean expectation (runs-based)
 * - Totals: Normal approximation with overdispersion + proper half-line logic
 * - Runline: Normal margin approximation with push-aware handling for integer lines
 *
 * Fixes / upgrades vs your version:
 * 1) Your getOverProb comment said continuity correction but code didn't apply it.
 *    Now: for totals, we implement push-aware probs (over/push/under) using continuity correction.
 *    For half-lines (8.5) push=0 automatically.
 * 2) getRunlineProb sign/threshold clarified + push-aware version (cover/push/noCover).
 * 3) Safer parameter guards (finite checks, floors).
 * 4) Consistent naming across sports models.
 */

const clamp01 = (p) => (p < 0 ? 0 : p > 1 ? 1 : p);

// A&S 7.1.26 approximation for erf(x)
const erf = (x) => {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * x);
  const y =
    1 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) *
      Math.exp(-x * x);

  return sign * y;
};

const normalCDF = (x, mean, std) => {
  const xx = Number(x);
  const m = Number(mean);
  const s = Number(std);
  if (!Number.isFinite(xx) || !Number.isFinite(m) || !Number.isFinite(s) || s <= 0) return NaN;
  const z = (xx - m) / s;
  return 0.5 * (1 + erf(z / Math.SQRT2));
};

const normalSF = (x, mean, std) => {
  const c = normalCDF(x, mean, std);
  return Number.isFinite(c) ? 1 - c : NaN;
};

const isIntegerLine = (line) => {
  const x = Number(line);
  return Number.isFinite(x) && Math.abs(x - Math.round(x)) < 1e-9;
};

/**
 * Push-aware totals probabilities for MLB totals.
 * - For half-lines (8.5): push=0, over = P(T > 8.5)
 * - For integer lines (8): approximate push using continuity window [7.5, 8.5]
 */
const totalProbs = (line, mean, std) => {
  const L = Number(line);
  if (!Number.isFinite(L)) return { over: NaN, push: NaN, under: NaN };

  // Half-lines: no push
  if (!isIntegerLine(L)) {
    const over = clamp01(normalSF(L, mean, std));
    return { over, push: 0, under: clamp01(1 - over) };
  }

  // Integer line: continuity correction push bucket
  const lo = L - 0.5;
  const hi = L + 0.5;

  const pLo = normalCDF(lo, mean, std);
  const pHi = normalCDF(hi, mean, std);

  const push = clamp01(pHi - pLo);
  const over = clamp01(normalSF(hi, mean, std)); // > L + 0.5
  const under = clamp01(1 - over - push);

  return { over, push, under };
};

/**
 * Push-aware runline probabilities.
 * Convention:
 * - margin = homeRuns - awayRuns
 * - homeLine is the book line for HOME: e.g. -1.5, +1.5, -1, +2
 * - Home covers if (margin + homeLine) > 0
 * - Push if (margin + homeLine) == 0 (only integer lines like -1, +2)
 */
const runlineProbs = (homeLine, marginMean, marginStd) => {
  const L = Number(homeLine);
  if (!Number.isFinite(L)) return { cover: NaN, push: NaN, noCover: NaN };

  // Home covers if margin > -L
  const threshold = -L;

  // Half-lines: no push
  if (!isIntegerLine(L)) {
    const cover = clamp01(normalSF(threshold, marginMean, marginStd));
    return { cover, push: 0, noCover: clamp01(1 - cover) };
  }

  // Integer line: continuity correction around threshold
  const lo = threshold - 0.5;
  const hi = threshold + 0.5;

  const pLo = normalCDF(lo, marginMean, marginStd);
  const pHi = normalCDF(hi, marginMean, marginStd);

  const push = clamp01(pHi - pLo);
  const cover = clamp01(normalSF(hi, marginMean, marginStd));
  const noCover = clamp01(1 - cover - push);

  return { cover, push, noCover };
};

/**
 * Calculates MLB probabilities.
 *
 * @param {object} params
 * @param {number} params.homeRuns - projected runs (mean)
 * @param {number} params.awayRuns - projected runs (mean)
 * @param {number} [params.exponent=1.83] - pythagorean exponent
 * @param {number} [params.totalOverdispersion=1.35] - std multiplier for totals
 * @param {number} [params.marginStd=2.8] - std dev for run margin (normal approx)
 */
export const calcBaseballProbs = ({
  homeRuns,
  awayRuns,
  exponent = 1.83,
  totalOverdispersion = 1.35,
  marginStd = 2.8
} = {}) => {
  const h0 = Number(homeRuns);
  const a0 = Number(awayRuns);

  if (!Number.isFinite(h0) || !Number.isFinite(a0)) {
    return {
      home_win: NaN,
      away_win: NaN,
      predicted_total: NaN,
      predicted_home_by: NaN,
      getTotalProbs: () => ({ over: NaN, push: NaN, under: NaN }),
      getRunlineProbs: () => ({ cover: NaN, push: NaN, noCover: NaN })
    };
  }

  const h = Math.max(0.1, h0);
  const a = Math.max(0.1, a0);

  // 1) Moneyline — Pythagorean (runs-based)
  const exp = Number.isFinite(exponent) && exponent > 0 ? exponent : 1.83;
  const hPow = Math.pow(h, exp);
  const aPow = Math.pow(a, exp);
  const denom = hPow + aPow;

  const pHome = denom > 0 ? (hPow / denom) : 0.5;
  const pAway = 1 - pHome;

  // 2) Totals — Normal approx with overdispersion
  const muTotal = h + a;
  const od = Number.isFinite(totalOverdispersion) && totalOverdispersion > 0 ? totalOverdispersion : 1.35;
  const stdTotal = Math.sqrt(muTotal) * od;

  // 3) Run margin — Normal approx (crude but practical)
  const diffMean = h - a;
  const mStd = Number.isFinite(marginStd) && marginStd > 0 ? marginStd : 2.8;

  return {
    home_win: clamp01(pHome),
    away_win: clamp01(pAway),

    predicted_total: muTotal,
    predicted_home_by: diffMean,

    // Totals
    getTotalProbs: (totalLine) => totalProbs(totalLine, muTotal, stdTotal),

    // Runline (home line, e.g. -1.5 / +1.5)
    getRunlineProbs: (homeLine) => runlineProbs(homeLine, diffMean, mStd)
  };
};