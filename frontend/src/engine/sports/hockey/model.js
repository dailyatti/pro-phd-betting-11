/**
 * Hockey (NHL) Model — Production Hardened (v2)
 * Poisson score matrix for regulation + disciplined OT/SO conversion.
 *
 * What’s improved vs your version:
 * - Hard caps + guards on MAX (prevents huge loops / NaNs).
 * - Tracks massCovered and normalizes consistently.
 * - Totals: computes P(total > line) correctly for any .5 line using normalized mass.
 * - OT/SO handling: configurable split of regulation draws (not always 50/50).
 *   - Option A (default): 50/50 split
 *   - Option B: split by “OT strength proxy” (xG share), if you want.
 * - Returns diagnostics (mode score, massCovered, draw handling).
 */

const clamp01 = (p) => (p < 0 ? 0 : p > 1 ? 1 : p);

const safeLambda = (v, fallback) => {
  const x = Number(v);
  if (!Number.isFinite(x) || x <= 0) return fallback;
  return x;
};

// Poisson recursion: p(0)=e^-λ, p(k)=p(k-1)*λ/k
function poissonSeries(lambda, maxK) {
  const p = new Array(maxK + 1);
  p[0] = Math.exp(-lambda);
  for (let k = 1; k <= maxK; k++) p[k] = (p[k - 1] * lambda) / k;
  return p;
}

/**
 * Calculates hockey probabilities.
 *
 * @param {object} params
 * @param {number} params.homeXG - expected goals (or exp goals after goalie adj)
 * @param {number} params.awayXG
 * @param {number} [params.maxGoals=12] - truncation limit per team
 * @param {object} [params.otModel]
 * @param {'SPLIT_50_50'|'SPLIT_XG_SHARE'} [params.otModel.mode='SPLIT_50_50']
 * @param {number} [params.otModel.homeShareOverride] - override OT share (0..1)
 * @param {boolean} [params.returnMatrix=false]
 *
 * @returns {object}
 */
export const calcHockeyProbs = ({
  homeXG,
  awayXG,
  maxGoals = 12,
  otModel = { mode: "SPLIT_50_50" },
  returnMatrix = false,
} = {}) => {
  // Safety: cap MAX to keep runtime predictable
  const MAX = Math.max(0, Math.min(20, Math.floor(Number(maxGoals) || 12)));

  const lx = safeLambda(homeXG, 2.9);
  const ly = safeLambda(awayXG, 2.7);

  const px = poissonSeries(lx, MAX);
  const py = poissonSeries(ly, MAX);

  let pHomeReg = 0,
    pDrawReg = 0,
    pAwayReg = 0;
  let pOver = 0;
  let mass = 0;

  // mode diagnostics
  let bestP = -1;
  let bestScore = { home: 0, away: 0 };

  const matrix = returnMatrix
    ? Array.from({ length: MAX + 1 }, () => new Array(MAX + 1).fill(0))
    : null;

  // Main matrix accumulation
  for (let x = 0; x <= MAX; x++) {
    const px_x = px[x];
    for (let y = 0; y <= MAX; y++) {
      const p = px_x * py[y];
      mass += p;

      if (returnMatrix) matrix[x][y] = p;

      if (p > bestP) {
        bestP = p;
        bestScore = { home: x, away: y };
      }

      if (x > y) pHomeReg += p;
      else if (x === y) pDrawReg += p;
      else pAwayReg += p;
    }
  }

  // Normalize truncation
  const massCovered = mass;
  const norm = mass > 0 ? 1 / mass : 1;

  pHomeReg *= norm;
  pDrawReg *= norm;
  pAwayReg *= norm;

  // --- OT/SO conversion for moneyline ---
  // If regulation draw happens, allocate win prob by model.
  let homeOTShare = 0.5;
  if (typeof otModel?.homeShareOverride === "number") {
    homeOTShare = clamp01(otModel.homeShareOverride);
  } else if (otModel?.mode === "SPLIT_XG_SHARE") {
    // simple proxy: higher expected scoring share → slightly higher OT win share
    // (keeps it bounded; doesn’t explode)
    const share = lx / (lx + ly);
    homeOTShare = clamp01(0.5 + (share - 0.5) * 0.6); // shrink towards 0.5
  }

  const pHomeMl = clamp01(pHomeReg + homeOTShare * pDrawReg);
  const pAwayMl = clamp01(pAwayReg + (1 - homeOTShare) * pDrawReg);

  // Totals helper using normalized matrix:
  // P(total > line) = 1 - P(total <= floor(line))
  const getOverProb = (line) => {
    const L = Number(line);
    if (!Number.isFinite(L)) return NaN;

    const limit = Math.floor(L); // 5.5 -> 5
    let underMass = 0;

    for (let x = 0; x <= MAX; x++) {
      const px_x = px[x];
      for (let y = 0; y <= MAX; y++) {
        if (x + y <= limit) underMass += px_x * py[y];
      }
    }

    const pUnder = underMass * norm;
    return clamp01(1 - pUnder);
  };

  return {
    // lambdas
    lambda_home: lx,
    lambda_away: ly,

    // regulation (3-way)
    home_win_reg: clamp01(pHomeReg),
    draw_reg: clamp01(pDrawReg),
    away_win_reg: clamp01(pAwayReg),

    // moneyline incl OT/SO
    home_win_ot: pHomeMl,
    away_win_ot: pAwayMl,
    ot_home_share_used: homeOTShare,

    // totals
    predicted_total: lx + ly,
    getOverProb,

    // diagnostics
    diagnostics: {
      maxGoals: MAX,
      massCovered,
      mostLikelyScore: bestScore,
      note:
        massCovered < 0.995
          ? "massCovered low -> increase maxGoals (e.g., 14-16) for better accuracy"
          : "ok",
    },

    ...(returnMatrix ? { scoreMatrix: matrix } : {}),
  };
};