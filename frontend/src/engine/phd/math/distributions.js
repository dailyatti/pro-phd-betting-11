/**
 * PhD Core Distributions & Stochastic Models
 * Centralized math library for rigorous probability calculations.
 */

// ============================================================
// 1. POISSON & DIXON-COLES (Football, Hockey)
// ============================================================

/**
 * Standard Poisson PMF: P(X=k) = e^-λ * λ^k / k!
 * Implemented via recurrence for numerical stability.
 * @param {number} lambda - Expected value (rate)
 * @param {number} kMax - Truncation limit
 */
export const poissonPmf = (lambda, kMax = 15) => {
    const lam = Math.max(0, lambda);
    const pmf = new Array(kMax + 1).fill(0);
    pmf[0] = Math.exp(-lam);
    for (let k = 1; k <= kMax; k++) {
        pmf[k] = pmf[k - 1] * (lam / k);
    }
    return pmf;
};

/**
 * Dixon-Coles Adjustment Factor tau(x, y)
 * Adjusts low-score probabilities to account for correlation.
 * @param {number} x - Home goals
 * @param {number} y - Away goals
 * @param {number} lambdaHome - Home expected goals
 * @param {number} lambdaAway - Away expected goals
 * @param {number} rho - Correlation parameter
 */
export const dixonColesTau = (x, y, lambdaHome, lambdaAway, rho) => {
    if (x === 0 && y === 0) return 1 - (lambdaHome * lambdaAway * rho);
    if (x === 0 && y === 1) return 1 + (lambdaHome * rho);
    if (x === 1 && y === 0) return 1 + (lambdaAway * rho);
    if (x === 1 && y === 1) return 1 - rho;
    return 1;
};

/**
 * Dixon-Coles Bivariate Score Matrix
 */
export const dixonColesMatrix = (lambdaHome, lambdaAway, rho, maxGoals = 10) => {
    const H = poissonPmf(lambdaHome, maxGoals);
    const A = poissonPmf(lambdaAway, maxGoals);
    const matrix = [];

    let sum = 0;
    for (let h = 0; h <= maxGoals; h++) {
        const row = [];
        for (let a = 0; a <= maxGoals; a++) {
            let p = H[h] * A[a] * dixonColesTau(h, a, lambdaHome, lambdaAway, rho);
            p = Math.max(0, p); // Clamp negative probs from extreme rho
            row.push(p);
            sum += p;
        }
        matrix.push(row);
    }

    // Renormalize
    if (sum > 0) {
        for (let h = 0; h <= maxGoals; h++) {
            for (let a = 0; a <= maxGoals; a++) {
                matrix[h][a] /= sum;
            }
        }
    }
    return matrix;
};

// ============================================================
// 2. NEGATIVE BINOMIAL (Corners, Baseball Runs)
// ============================================================

/**
 * Negative Binomial PMF (Mean/Dispersion parameterization)
 * Useful for over-dispersed count data (Corners, Cards, Runs).
 * @param {number} mu - Mean expected count
 * @param {number} k - Dispersion parameter (1/alpha). Higher k = closer to Poisson.
 * @param {number} maxVal - Truncation limit
 */
export const negBinPmf = (mu, k, maxVal = 20) => {
    const mean = Math.max(0.01, mu);
    const disp = Math.max(0.01, k);

    const p = disp / (disp + mean); // Success prob
    const r = disp;                 // Number of failures

    const pmf = new Array(maxVal + 1).fill(0);

    // P(X=0) = p^r
    pmf[0] = Math.pow(p, r);

    // Recurrence: P(x) = P(x-1) * (x + r - 1)/x * (1-p)
    const q = 1 - p;
    for (let x = 1; x <= maxVal; x++) {
        pmf[x] = pmf[x - 1] * q * (x + r - 1) / x;
    }
    return pmf;
};

// ============================================================
// 3. NORMAL / GAUSSIAN (Basketball Spread, Modeling Errors)
// ============================================================

/**
 * Cumulative Density Function (CDF) of Standard Normal
 * Approximation by Abramowitz and Stegun (prob < 7e-5 error)
 */
export const normalCdf = (z) => {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
};

/**
 * Probability of Outcome > Line given Normal(mu, sigma)
 */
export const probNormalOver = (mu, sigma, line) => {
    if (sigma <= 0) return mu > line ? 1 : 0;
    const z = (mu - line) / sigma;
    return normalCdf(z);
};

// ============================================================
// 4. LOGISTIC / ELO (Tennis, General Win Prob)
// ============================================================

/**
 * Win Probability from standard logistic function (ELO-like)
 * P(A wins) = 1 / (1 + 10^((Rb - Ra)/400))
 * @param {number} ratingA - Home/Player A Rating
 * @param {number} ratingB - Away/Player B Rating
 * @param {number} scale - Scale factor (default 400 for standard ELO)
 */
export const logisticWinProb = (ratingA, ratingB, scale = 400) => {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / scale));
};

// ============================================================
// 5. GEOMETRIC SERIES (Tennis Deuce)
// ============================================================

/**
 * Probability of Server winning a game from Deuce
 * P(Win) = p^2 / (p^2 + (1-p)^2)
 * @param {number} pServe - Probability of winning a point on serve
 */
export const probWinGameFromDeuce = (pServe) => {
    const p2 = pServe * pServe;
    const q2 = (1 - pServe) * (1 - pServe);
    return p2 / (p2 + q2);
};
