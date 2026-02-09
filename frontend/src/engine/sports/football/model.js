/**
 * Football / Soccer — Poisson Scoreline Model (Production Hardened, PhD-grade hygiene)
 *
 * What this fixes/improves:
 * - No recursive factorial (stack risk). Uses stable Poisson recursion.
 * - Normalizes truncated matrix mass so probs sum to 1 (finite MAX_GOALS).
 * - Guards inputs (NaN / negative xG).
 * - Returns extra diagnostics: massCovered, mostLikelyScore, scoreMatrix (optional).
 * - BTTS computed both via matrix + independent identity (consistency check).
 * - Over/Under generalized (not only 2.5) via helper.
 *
 * Assumptions:
 * - Goals are independent Poisson with lambdas (possibly weather-adjusted).
 */

import { adjustForWeather } from "./weather.js";

// ---------- numeric helpers ----------
const clamp01 = (p) => (p < 0 ? 0 : p > 1 ? 1 : p);

const safeLambda = (v, fallback = 1.2) => {
  const x = Number(v);
  if (!Number.isFinite(x) || x <= 0) return fallback;
  return x;
};

// Poisson PMF computed via recursion: p(k) from p(k-1)
// p(0)=exp(-λ), p(k)=p(k-1)*λ/k
function poissonSeries(lambda, maxK) {
  const p = new Array(maxK + 1);
  p[0] = Math.exp(-lambda);
  for (let k = 1; k <= maxK; k++) p[k] = (p[k - 1] * lambda) / k;
  return p;
}

// ---------- core model ----------
/**
 * Calculates probabilities for 1X2, Totals, BTTS using Poisson score matrix.
 *
 * @param {object} params
 * @param {number} params.homeXG
 * @param {number} params.awayXG
 * @param {object} [params.weather]
 * @param {number} [params.maxGoals=10] - truncation limit for each team
 * @param {boolean} [params.returnMatrix=false] - return score matrix (can be heavy)
 * @returns {object}
 */
export const calcFootballProbs = ({
  homeXG,
  awayXG,
  weather,
  maxGoals = 10,
  returnMatrix = false,
} = {}) => {
  const MAX = Math.max(0, Math.min(20, Math.floor(maxGoals))); // hard safety cap

  // 1) Weather / context adjustment
  const baseHome = safeLambda(homeXG, 1.5);
  const baseAway = safeLambda(awayXG, 1.2);

  const lx = safeLambda(adjustForWeather(baseHome, weather), baseHome);
  const ly = safeLambda(adjustForWeather(baseAway, weather), baseAway);

  // 2) Precompute Poisson pmf arrays (stable)
  const px = poissonSeries(lx, MAX);
  const py = poissonSeries(ly, MAX);

  // 3) Score matrix iteration + probability mass accounting
  let pHome = 0,
    pDraw = 0,
    pAway = 0;
  let pBTTS = 0;
  let mass = 0;

  // totals helpers (we’ll compute 2.5 but also expose generic)
  let pOver25 = 0;

  // Most likely exact score (mode of joint)
  let bestP = -1;
  let bestScore = { home: 0, away: 0 };

  const matrix = returnMatrix ? Array.from({ length: MAX + 1 }, () => new Array(MAX + 1).fill(0)) : null;

  for (let x = 0; x <= MAX; x++) {
    for (let y = 0; y <= MAX; y++) {
      const pMatch = px[x] * py[y];
      mass += pMatch;

      if (returnMatrix) matrix[x][y] = pMatch;

      if (pMatch > bestP) {
        bestP = pMatch;
        bestScore = { home: x, away: y };
      }

      // 1X2
      if (x > y) pHome += pMatch;
      else if (x === y) pDraw += pMatch;
      else pAway += pMatch;

      // O/U 2.5
      if (x + y > 2.5) pOver25 += pMatch;

      // BTTS
      if (x > 0 && y > 0) pBTTS += pMatch;
    }
  }

  // 4) Normalize for truncation (finite MAX). This makes sums consistent.
  // If MAX is too low, mass could be noticeably < 1.
  const massCovered = mass; // diagnostic
  const norm = mass > 0 ? 1 / mass : 1;

  pHome *= norm;
  pDraw *= norm;
  pAway *= norm;
  pOver25 *= norm;
  pBTTS *= norm;

  // 5) Consistency BTTS identity under independence:
  // P(BTTS) = 1 - P(H=0) - P(A=0) + P(H=0,A=0)
  // We can compute this from px[0], py[0]. (Also subject to truncation, but stable.)
  const pBTTS_identity = clamp01(1 - px[0] - py[0] + px[0] * py[0]);

  // 6) Generic totals: P(Total > line) from matrix (normalized)
  const getOverProb = (line) => {
    const L = Number(line);
    if (!Number.isFinite(L)) return NaN;
    let s = 0;
    for (let x = 0; x <= MAX; x++) {
      for (let y = 0; y <= MAX; y++) {
        if (x + y > L) s += px[x] * py[y];
      }
    }
    return clamp01((s / massCovered) || 0);
  };

  // 7) Output
  return {
    // lambdas used (after weather)
    lambda_home: lx,
    lambda_away: ly,

    // primary markets
    home_win: clamp01(pHome),
    draw: clamp01(pDraw),
    away_win: clamp01(pAway),

    over_2_5: clamp01(pOver25),
    under_2_5: clamp01(1 - pOver25),

    btts_yes: clamp01(pBTTS),
    btts_no: clamp01(1 - pBTTS),

    // diagnostics (PhD-grade transparency)
    diagnostics: {
      maxGoals: MAX,
      massCovered: massCovered, // if ~0.999+ you’re good; if 0.97 you need higher MAX
      mostLikelyScore: bestScore,
      btts_identity: pBTTS_identity,
      btts_matrix: pBTTS,
      btts_gap: pBTTS - pBTTS_identity, // should be tiny; big gap => truncation too low or adjustment altered independence
    },

    // helpers
    getOverProb, // line -> P(total > line), uses the same normalized matrix

    // optionally heavy
    ...(returnMatrix ? { scoreMatrix: matrix } : {}),
  };
};