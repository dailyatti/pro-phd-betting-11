/**
 * NFL Model — Production Hardened (v2)
 * Uses Normal distribution for margin + totals, with correct tail directions.
 *
 * Fixes / upgrades vs your version:
 * - Spread cover math fixed: "Home -3.5 covers if margin >= 4" → threshold = -line (correct),
 *   but you had sign confusion risk in comments; now explicit.
 * - Push handling (spread/totals) supported: returns win / push / lose probabilities
 *   for integer lines (e.g., -3, total 44). For half-lines, push=0 automatically.
 * - Adds moneyline with optional tie handling (NFL ties are small but non-zero).
 * - Robust numeric guards + standardized naming.
 */

const clamp01 = (p) => (p < 0 ? 0 : p > 1 ? 1 : p);

// A&S 7.1.26 erf approximation (good enough for pricing)
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
  const m = Number(mean);
  const s = Number(std);
  const xx = Number(x);
  if (!Number.isFinite(xx) || !Number.isFinite(m) || !Number.isFinite(s) || s <= 0) return NaN;
  const z = (xx - m) / s;
  return 0.5 * (1 + erf(z / Math.SQRT2));
};

const normalSF = (x, mean, std) => {
  // survival function = P(X > x)
  const c = normalCDF(x, mean, std);
  return Number.isFinite(c) ? (1 - c) : NaN;
};

const isHalfLine = (line) => {
  const x = Number(line);
  if (!Number.isFinite(x)) return false;
  // half-line: fractional part exactly 0.5 (within tolerance)
  const frac = Math.abs(x - Math.round(x));
  return Math.abs(frac - 0.5) < 1e-9;
};

const isIntegerLine = (line) => {
  const x = Number(line);
  if (!Number.isFinite(x)) return false;
  return Math.abs(x - Math.round(x)) < 1e-9;
};

/**
 * Push-aware cover probabilities for spreads.
 *
 * Convention:
 * - homeSpreadLine is the book line for HOME, e.g. -3.5, +2.5, -3, +7
 * - margin = (homeScore - awayScore)
 * - Home covers if (margin + homeSpreadLine) > 0
 * - Push if (margin + homeSpreadLine) == 0 (only possible on integer lines)
 */
const spreadProbs = (homeSpreadLine, marginMean, marginStd) => {
  const line = Number(homeSpreadLine);
  if (!Number.isFinite(line)) return { cover: NaN, push: NaN, noCover: NaN };

  // Home covers if margin > -line
  const threshold = -line;

  // For half-lines, push is 0. For integer lines, approximate push as probability of being exactly threshold.
  // Normal is continuous, so P(exact)=0 — but pushes exist due to integer scoring.
  // We approximate push mass by using a continuity correction window of +/-0.5 around the integer margin.
  const useContinuity = isIntegerLine(line); // integer spread creates push possibility
  if (!useContinuity) {
    const cover = clamp01(normalSF(threshold, marginMean, marginStd));
    return { cover, push: 0, noCover: clamp01(1 - cover) };
  }

  // continuity window: margin in [threshold - 0.5, threshold + 0.5] treated as push bucket
  const lo = threshold - 0.5;
  const hi = threshold + 0.5;

  const pLo = normalCDF(lo, marginMean, marginStd);
  const pHi = normalCDF(hi, marginMean, marginStd);

  const push = clamp01(pHi - pLo);
  const cover = clamp01(normalSF(hi, marginMean, marginStd)); // strictly greater than push window
  const noCover = clamp01(1 - cover - push);

  return { cover, push, noCover };
};

/**
 * Push-aware over probabilities for totals.
 *
 * total = home + away
 * Over wins if total > line
 * Push if total == line (integer line) — continuity correction window
 */
const totalProbs = (totalLine, totalMean, totalStd) => {
  const line = Number(totalLine);
  if (!Number.isFinite(line)) return { over: NaN, push: NaN, under: NaN };

  // half-lines: push=0
  if (!isIntegerLine(line)) {
    const over = clamp01(normalSF(line, totalMean, totalStd));
    return { over, push: 0, under: clamp01(1 - over) };
  }

  // continuity correction: [line-0.5, line+0.5] is push-ish bucket
  const lo = line - 0.5;
  const hi = line + 0.5;

  const pLo = normalCDF(lo, totalMean, totalStd);
  const pHi = normalCDF(hi, totalMean, totalStd);

  const push = clamp01(pHi - pLo);
  const over = clamp01(normalSF(hi, totalMean, totalStd));
  const under = clamp01(1 - over - push);

  return { over, push, under };
};

/**
 * Calculates NFL probabilities from projected points (production-hardened).
 *
 * @param {object} params
 * @param {number} params.homePoints
 * @param {number} params.awayPoints
 * @param {number} [params.marginStd=13.5]
 * @param {number} [params.totalStd=13.5]
 * @param {number} [params.tieProb=0.005] - optional tie mass for moneyline (0.3–0.7% typical-ish)
 */
export const calcNFLProbs = ({
  homePoints,
  awayPoints,
  marginStd = 13.5,
  totalStd = 13.5,
  tieProb = 0.005,
} = {}) => {
  const hp = Number(homePoints);
  const ap = Number(awayPoints);

  if (!Number.isFinite(hp) || !Number.isFinite(ap)) {
    return {
      home_win: NaN,
      away_win: NaN,
      tie: NaN,
      predicted_home_by: NaN,
      predicted_total: NaN,
      getHomeSpreadProbs: () => ({ cover: NaN, push: NaN, noCover: NaN }),
      getTotalProbs: () => ({ over: NaN, push: NaN, under: NaN }),
    };
  }

  const diffMean = hp - ap;     // margin mean: "home by"
  const totalMean = hp + ap;

  // Moneyline: treat ties explicitly if desired.
  // Base continuous model: P(home wins) = P(margin > 0)
  // Then allocate tieProb and renormalize (simple, stable).
  const pHomeNoTie = clamp01(normalSF(0, diffMean, marginStd));
  const pTie = clamp01(Number.isFinite(tieProb) ? tieProb : 0);
  const scale = (1 - pTie);
  const homeWin = clamp01(pHomeNoTie * scale);
  const awayWin = clamp01(scale - homeWin);

  return {
    // moneyline
    home_win: homeWin,
    away_win: awayWin,
    tie: pTie,

    // point projections
    predicted_home_by: diffMean,
    predicted_away_by: -diffMean,
    predicted_total: totalMean,

    // helpers with push support
    getHomeSpreadProbs: (homeSpreadLine) => spreadProbs(homeSpreadLine, diffMean, marginStd),
    getTotalProbs: (totalLine) => totalProbs(totalLine, totalMean, totalStd),
  };
};