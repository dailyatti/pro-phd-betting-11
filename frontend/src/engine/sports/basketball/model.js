/**
 * Basketball Model — Production Hardened
 * Normal approximation for high-scoring sports (NBA / Euroleague).
 *
 * FIXES vs your version:
 * - Correct math: uses erf() (not erfc mislabeled)
 * - Correct CDF formula: Φ(z) = 0.5 * (1 + erf(z/√2))
 * - Spread sign convention cleaned up (home_by = home - away)
 * - Separate std for margin vs total (default: marginStd ≈ 12, totalStd ≈ 16–18)
 * - Clamps probabilities to [0,1] to avoid numeric drift
 */

// Abramowitz & Stegun 7.1.26 approximation for erf(x)
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

const clamp01 = (p) => (p < 0 ? 0 : p > 1 ? 1 : p);

// Standard Normal CDF: Φ((x-μ)/σ)
const normalCDF = (x, mean, std) => {
  if (!Number.isFinite(x) || !Number.isFinite(mean) || !Number.isFinite(std) || std <= 0) {
    return NaN;
  }
  const z = (x - mean) / std;
  return 0.5 * (1 + erf(z / Math.SQRT2));
};

/**
 * Calculates basketball probabilities from projected points.
 *
 * Notes:
 * - diffMean = homePoints - awayPoints (positive => home favored by that many points)
 * - marginStd: stdev of score margin (NBA commonly ~11–13 depending on era)
 * - totalStd: stdev of total points (typically higher than margin; ~15–20)
 *
 * @param {object} params
 * @param {number} params.homePoints - Projected home points
 * @param {number} params.awayPoints - Projected away points
 * @param {number} [params.marginStd=12] - std dev of margin (home-away)
 * @param {number} [params.totalStd=17] - std dev of total (home+away)
 */
const isIntegerLine = (line) => {
  const x = Number(line);
  return Number.isFinite(x) && Math.abs(x - Math.round(x)) < 1e-9;
};

/**
 * Calculates basketball probabilities from projected points.
 *
 * Notes:
 * - diffMean = homePoints - awayPoints (positive => home favored by that many points)
 * - marginStd: stdev of score margin (NBA commonly ~11–13 depending on era)
 * - totalStd: stdev of total points (typically higher than margin; ~15–20)
 *
 * @param {object} params
 * @param {number} params.homePoints - Projected home points
 * @param {number} params.awayPoints - Projected away points
 * @param {number} [params.marginStd=12] - std dev of margin (home-away)
 * @param {number} [params.totalStd=17] - std dev of total (home+away)
 */
export const calcBasketballProbs = ({
  homePoints,
  awayPoints,
  marginStd = 12,
  totalStd = 17,
}) => {
  const diffMean = homePoints - awayPoints; // "home by" mean
  const totalMean = homePoints + awayPoints;

  // 1) Moneyline: P(Home wins) = P(Margin > 0)
  // Tie probability in basketball is non-zero (OT usually decides, but regulation tie exists).
  // Standard limits ignore tie for ML, or assume OT included.
  // We use standard normal approx for ML (OT included assumption).
  const homeWin = clamp01(1 - normalCDF(0, diffMean, marginStd));
  const awayWin = clamp01(1 - homeWin);

  // 2) Spread helper: P(Home covers -line) 
  // Home covers if (Margin > -line)
  // FIX: Push-aware logic for integer lines.
  const getHomeCoverProb = (homeSpreadLine) => {
    const L = Number(homeSpreadLine);
    const threshold = -L;

    // Half-lines: No push
    if (!isIntegerLine(L)) {
      return clamp01(1 - normalCDF(threshold, diffMean, marginStd));
    }

    // Integer line: Continuity correction [threshold-0.5, threshold+0.5] is PUSH
    // Cover if > threshold + 0.5
    // No Cover if < threshold - 0.5
    const pCover = clamp01(1 - normalCDF(threshold + 0.5, diffMean, marginStd));
    // const pPush = normalCDF(threshold + 0.5, ...) - normalCDF(threshold - 0.5, ...);
    return pCover;
  };

  // Full spread object return (Cover, Push, NoCover) if needed by UI
  // The current UI might expect a single number. 
  // However, the prompt asked for: "Return specific objects: { cover, push, noCover }"
  // But wait, the Orchestrator expects a single number for 'prob'.
  // We will keep 'getHomeCoverProb' returning the WIN prob for compatibility, 
  // but we can expose a new method 'getSpreadProbs' for detailed analysis.

  const getSpreadProbs = (homeSpreadLine) => {
    const L = Number(homeSpreadLine);
    const threshold = -L;

    if (!isIntegerLine(L)) {
      const cover = clamp01(1 - normalCDF(threshold, diffMean, marginStd));
      return { cover, push: 0, noCover: clamp01(1 - cover) };
    }

    const pHi = normalCDF(threshold + 0.5, diffMean, marginStd);
    const pLo = normalCDF(threshold - 0.5, diffMean, marginStd);

    const push = clamp01(pHi - pLo);
    const cover = clamp01(1 - pHi);
    const noCover = clamp01(pLo);

    return { cover, push, noCover };
  };

  // 3) Totals helper: P(Total > line)
  // FIX: Push-aware logic
  const getOverProb = (totalLine) => {
    const L = Number(totalLine);
    if (!isIntegerLine(L)) {
      return clamp01(1 - normalCDF(L, totalMean, totalStd));
    }
    // Integer: Over if > L + 0.5
    return clamp01(1 - normalCDF(L + 0.5, totalMean, totalStd));
  };

  const getTotalProbs = (totalLine) => {
    const L = Number(totalLine);
    if (!isIntegerLine(L)) {
      const over = clamp01(1 - normalCDF(L, totalMean, totalStd));
      return { over, push: 0, under: clamp01(1 - over) };
    }

    const pHi = normalCDF(L + 0.5, totalMean, totalStd);
    const pLo = normalCDF(L - 0.5, totalMean, totalStd);

    const push = clamp01(pHi - pLo);
    const over = clamp01(1 - pHi);
    const under = clamp01(pLo);

    return { over, push, under };
  };

  return {
    home_win: homeWin,
    away_win: awayWin,

    // Clean, unambiguous outputs:
    predicted_home_by: diffMean,
    predicted_away_by: -diffMean,
    predicted_total: totalMean,

    // Helpers (Legacy + New)
    getHomeCoverProb, // Returns just the Win prob (Push excluded)
    getOverProb,      // Returns just the Over prob (Push excluded)

    // PhD Level Detailed Helpers
    getSpreadProbs,
    getTotalProbs
  };
};