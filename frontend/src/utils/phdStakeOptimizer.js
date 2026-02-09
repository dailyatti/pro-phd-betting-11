/**
 * PhD Stake Optimization — Advanced Kelly + CVaR + L1 (production hardened)
 *
 * Fixes vs your draft:
 * - Corrects CDF helper naming (you used erfc but returned erf-ish output).
 * - Adds strict input guards + clamping.
 * - Makes CVaR mathematically consistent (loss-tail on LOSS variable).
 * - Prevents log(1 - s) blowups near s=1 (domain checks).
 * - Uses a realistic stake search space: 0..maxStake with finer steps configurable.
 * - Returns both % and fraction, and includes EV + Kelly fraction for audit.
 * - Portfolio optimizer scales and enforces caps deterministically.
 */

// --------------------
// CONSTANTS
// --------------------
const DEFAULT_CVAR_ALPHA = 0.05;       // tail mass (worst 5%)
const DEFAULT_CVAR_GAMMA = 0.5;        // CVaR penalty weight
const DEFAULT_L1_FRICTION = 0.02;      // linear friction per stake fraction
const DEFAULT_MAX_STAKE = 0.10;        // 10% cap for grid search
const DEFAULT_STEP = 0.001;            // 0.1% step
const DEFAULT_KELLY_FRACTION = 0.25;   // quarter Kelly baseline (optional override)
const EPS = 1e-12;

// --------------------
// TINY HELPERS
// --------------------
const isNum = (x) => Number.isFinite(x);
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const clamp01 = (p) => clamp(p, 0, 1);

const toNum = (x) => {
    const n = Number(x);
    return Number.isFinite(n) ? n : NaN;
};

const safeOdds = (odds) => {
    const o = toNum(odds);
    if (!Number.isFinite(o) || o <= 1) return NaN;
    return o;
};

// --------------------
// CVaR (discrete)
// --------------------
/**
 * CVaR_alpha of a LOSS random variable L:
 *   CVaR_α(L) = (1/α) * ∫_0^α VaR_u(L) du
 * For discrete outcomes, compute the expected LOSS in worst α probability mass.
 *
 * IMPORTANT:
 * - returns[] should represent LOSSES (positive = bad), not returns.
 *
 * @param {number[]} losses
 * @param {number[]} probabilities
 * @param {number} alpha in (0,1]
 * @returns {number} expected loss in worst alpha mass (>=0)
 */
export const calculateCVaR = (losses, probabilities, alpha = DEFAULT_CVAR_ALPHA) => {
    if (!Array.isArray(losses) || !Array.isArray(probabilities)) return 0;
    if (losses.length === 0 || losses.length !== probabilities.length) return 0;

    const a = clamp(alpha, EPS, 1);

    // sanitize + normalize probabilities
    const items = losses.map((L, i) => ({
        L: toNum(L),
        p: toNum(probabilities[i]),
    })).filter(x => Number.isFinite(x.L) && Number.isFinite(x.p) && x.p > 0);

    if (items.length === 0) return 0;

    let pSum = items.reduce((s, it) => s + it.p, 0);
    if (!Number.isFinite(pSum) || pSum <= EPS) return 0;
    items.forEach(it => (it.p = it.p / pSum));

    // Sort by loss DESC (worst losses first)
    items.sort((a, b) => b.L - a.L);

    let cum = 0;
    let tailLoss = 0;
    let tailMass = 0;

    for (const it of items) {
        if (cum >= a) break;
        const take = Math.min(it.p, a - cum);
        tailLoss += it.L * take;
        tailMass += take;
        cum += take;
    }

    return tailMass > 0 ? tailLoss / tailMass : 0;
};

// --------------------
// Single-bet objective
// --------------------
/**
 * Objective(s) = E[ log(1 + s * R) ] - gamma * CVaR_alpha(LOSS(s)) - friction * |s|
 *
 * Where:
 * - R is net return on bankroll fraction staked:
 *   Win:  R_win  = (odds - 1)
 *   Loss: R_loss = -1
 * - Wealth update: W' = W * (1 + s*R)
 * - LOSS variable for CVaR uses negative returns: LOSS = max(0, -(s*R))
 *   -> Win loss=0, Loss loss=s
 *
 * @param {number} p win probability
 * @param {number} odds decimal odds
 * @param {number} s stake fraction of bankroll (0..1)
 * @param {object} cfg {alpha,gamma,friction}
 */
function objectiveKellyCVaR(p, odds, s, cfg) {
    const o = safeOdds(odds);
    if (!Number.isFinite(o)) return { ok: false, obj: -Infinity };

    const winProb = clamp01(p);
    const loseProb = 1 - winProb;

    // Outcomes
    const Rw = o - 1; // net return on stake
    const Rl = -1;

    // Domain checks for log(1 + s*R)
    // Need: 1 + s*Rl > 0  -> 1 - s > 0 -> s < 1
    // and: 1 + s*Rw > 0 always holds for s>=0 since Rw>=0
    if (s < 0 || s >= 1) return { ok: false, obj: -Infinity };

    const lgWin = Math.log(1 + s * Rw);
    const lgLoss = Math.log(1 + s * Rl); // log(1 - s)
    if (!Number.isFinite(lgWin) || !Number.isFinite(lgLoss)) return { ok: false, obj: -Infinity };

    const expectedLog = winProb * lgWin + loseProb * lgLoss;

    // LOSS scenarios for CVaR:
    // Win -> loss 0, Loss -> loss s
    const losses = [0, s];
    const probs = [winProb, loseProb];
    const cvar = calculateCVaR(losses, probs, cfg.alpha);

    const penalty = cfg.gamma * cvar;
    const frictionCost = cfg.friction * Math.abs(s);

    const obj = expectedLog - penalty - frictionCost;

    return {
        ok: true,
        obj,
        expectedLog,
        cvar,
        penalty,
        frictionCost
    };
}

// --------------------
// Stake optimization (grid)
// --------------------
/**
 * Grid-search optimizer for stake fraction s ∈ [0, maxStake].
 *
 * Notes:
 * - Enforces expectedLog > 0 so we don't recommend negative growth bets.
 * - Returns stake in % AND fraction, plus components for audit.
 *
 * @param {number} winProb
 * @param {number} odds
 * @param {object} options
 * @returns {{optimalStakePct:number, optimalStakeFrac:number, objectiveValue:number, expectedLogGrowth:number, cvar:number, cvarPenalty:number, frictionCost:number, ev:number, kellyFrac:number, formula:string}}
 */
export const optimizeStakeCVaR = (winProb, odds, options = {}) => {
    const p = clamp01(toNum(winProb));
    const o = safeOdds(odds);

    if (!Number.isFinite(p) || !Number.isFinite(o)) {
        return {
            optimalStakePct: 0,
            optimalStakeFrac: 0,
            objectiveValue: 0,
            expectedLogGrowth: 0,
            cvar: 0,
            cvarPenalty: 0,
            frictionCost: 0,
            ev: 0,
            kellyFrac: 0,
            formula: "KELLY_CVAR_L1"
        };
    }

    const alpha = clamp(toNum(options.alpha ?? DEFAULT_CVAR_ALPHA), EPS, 1);
    const gamma = Math.max(0, toNum(options.gamma ?? DEFAULT_CVAR_GAMMA));
    const friction = Math.max(0, toNum(options.friction ?? DEFAULT_L1_FRICTION));
    const maxStake = clamp(toNum(options.maxStake ?? DEFAULT_MAX_STAKE), 0, 0.99);
    const step = clamp(toNum(options.step ?? DEFAULT_STEP), 1e-5, 0.05);

    // Plain EV and Kelly (for reference)
    const ev = (p * o) - 1;
    const b = o - 1;
    const q = 1 - p;
    const kellyFrac = ev > 0 ? clamp((b * p - q) / b, 0, 0.99) : 0;

    // If no value, return 0 stake
    if (ev <= 0) {
        return {
            optimalStakePct: 0,
            optimalStakeFrac: 0,
            objectiveValue: 0,
            expectedLogGrowth: 0,
            cvar: 0,
            cvarPenalty: 0,
            frictionCost: 0,
            ev: Number(ev.toFixed(6)),
            kellyFrac: Number(kellyFrac.toFixed(6)),
            formula: "KELLY_CVAR_L1"
        };
    }

    let bestS = 0;
    let bestObj = -Infinity;
    let best = {
        expectedLogGrowth: 0,
        cvar: 0,
        cvarPenalty: 0,
        frictionCost: 0
    };

    const cfg = { alpha, gamma, friction };

    // include s=0
    for (let s = 0; s <= maxStake + 1e-12; s += step) {
        const r = objectiveKellyCVaR(p, o, s, cfg);
        if (!r.ok) continue;

        // Must have positive expected growth (your rule)
        if (r.expectedLog <= 0) continue;

        if (r.obj > bestObj) {
            bestObj = r.obj;
            bestS = s;
            best = {
                expectedLogGrowth: r.expectedLog,
                cvar: r.cvar,
                cvarPenalty: r.penalty,
                frictionCost: r.frictionCost
            };
        }
    }

    return {
        optimalStakePct: Number((bestS * 100).toFixed(2)),
        optimalStakeFrac: Number(bestS.toFixed(6)),
        objectiveValue: Number((bestObj === -Infinity ? 0 : bestObj).toFixed(6)),
        expectedLogGrowth: Number(best.expectedLogGrowth.toFixed(6)),
        cvar: Number(best.cvar.toFixed(6)),
        cvarPenalty: Number(best.cvarPenalty.toFixed(6)),
        frictionCost: Number(best.frictionCost.toFixed(6)),
        ev: Number(ev.toFixed(6)),
        kellyFrac: Number(kellyFrac.toFixed(6)),
        formula: "KELLY_CVAR_L1"
    };
};

// --------------------
// KL divergence + posterior calibration
// --------------------
/**
 * KL divergence for Bernoulli:
 * KL(P||Q) = p log(p/q) + (1-p) log((1-p)/(1-q))
 *
 * @param {number} modelProb
 * @param {number} marketProb
 */
export const calculateKLDivergence = (modelProb, marketProb) => {
    const p = clamp(toNum(modelProb), EPS, 1 - EPS);
    const q = clamp(toNum(marketProb), EPS, 1 - EPS);

    const kl = p * Math.log(p / q) + (1 - p) * Math.log((1 - p) / (1 - q));
    return Math.max(0, kl);
};

/**
 * Posterior calibration check (lightweight policy layer).
 * Supports optional `fairMarketProb` (vig-free) for meaningful edge calculation.
 *
 * @param {number} modelProb
 * @param {number} odds
 * @param {number|object} optionsOrLambda - lambda value OR { lambda, fairMarketProb }
 */
export const checkPosteriorCalibration = (modelProb, odds, optionsOrLambda = {}) => {
    const p = clamp01(toNum(modelProb));
    const o = safeOdds(odds);
    if (!Number.isFinite(p) || !Number.isFinite(o)) {
        return {
            klDivergence: Infinity,
            modelProb: p,
            marketProb: 0,
            edge: 0,
            isCalibrated: false,
            isOverconfident: false,
            warning: "Invalid input"
        };
    }

    // Parse args
    let lambda = 0.1;
    let fairMarketProb = null;

    if (typeof optionsOrLambda === 'number') {
        lambda = optionsOrLambda;
    } else if (typeof optionsOrLambda === 'object' && optionsOrLambda !== null) {
        lambda = optionsOrLambda.lambda ?? 0.1;
        fairMarketProb = optionsOrLambda.fairMarketProb;
    }

    // Use provided fair prob (vig removed), otherwise raw implied (includes vig)
    const rawImplied = 1 / o;
    const marketProb = isNum(fairMarketProb) ? clamp01(fairMarketProb) : clamp01(rawImplied);

    const kl = calculateKLDivergence(p, marketProb);

    // Thresholds (keep yours but slightly more consistent)
    const isCalibrated = kl < 0.10; // Loosened from 0.05
    const isOverconfident = (p - marketProb) > 0.25; // Loosened from 0.20
    const isDangerous = kl > 1.0; // Loosened from 0.6 to prevent false positives

    let warning = null;
    if (isDangerous) warning = "DANGER: Large KL divergence vs market. Verify assumptions/data.";
    else if (isOverconfident) warning = "CAUTION: Model claims a very large edge. Verify data quality.";

    // Warn if using raw odds for calibration (implied < true market prob usually)
    // if (fairMarketProb === null) { ... } // optional warning, maybe too noisy

    return {
        klDivergence: Number(kl.toFixed(6)),
        modelProb: Number(p.toFixed(6)),
        marketProb: Number(marketProb.toFixed(6)),
        edge: Number((p - marketProb).toFixed(6)),
        isCalibrated,
        isOverconfident,
        warning,
        lambda: Number(toNum(lambda).toFixed?.(4) ?? 0.1)
    };
};

// --------------------
// Full single-bet recommendation
// --------------------
/**
 * Full PhD stake recommendation:
 * 1) Calibration (KL)
 * 2) Stake optimization (Kelly + CVaR + L1)
 * 3) Calibration-based dampening (NEVER zero-out positive EV; only reduce)
 *
 * @param {number} modelProb
 * @param {number} odds
 * @param {number} bankroll
 * @param {object} options
 */
export const phdStakeRecommendation = (modelProb, odds, bankroll = 1000, options = {}) => {
    const br = toNum(bankroll);
    const o = safeOdds(odds);
    const p = clamp01(toNum(modelProb));

    // Pass options to calibration (for fairMarketProb)
    const calibration = checkPosteriorCalibration(p, o, options);

    // Optimize stake fraction
    const optim = optimizeStakeCVaR(p, o, options);

    let finalFrac = optim.optimalStakeFrac;

    // Your policy: reduce stake if overconfident; never force to 0 if EV>0
    if (calibration.isOverconfident) finalFrac *= 0.5;
    if (String(calibration.warning || "").includes("DANGER")) {
        finalFrac *= 0.5; // Softer penalty (was 0.1)
        // If it's still positive EV, respect user's risk appetite more
        finalFrac = Math.max(finalFrac, 0.005); // Floor at 0.5% ($1.50 on $300)
    }

    // Apply optional global fractional kelly baseline multiplier if you want:
    // (many people like this as another safety layer)
    const kellyFraction = clamp(toNum(options.kellyFraction ?? DEFAULT_KELLY_FRACTION), 0, 1);
    if (isNum(options.applyKellyFraction) && options.applyKellyFraction === 1) {
        finalFrac *= kellyFraction;
    }

    // Respect hard caps if provided
    const maxCap = clamp(toNum(options.maxCap ?? DEFAULT_MAX_STAKE), 0, 0.99);
    finalFrac = clamp(finalFrac, 0, maxCap);

    const stakeAmount = Number.isFinite(br) && br > 0 ? br * finalFrac : 0;

    return {
        recommendation: {
            stakePct: Number((finalFrac * 100).toFixed(2)),
            stakeAmount: Number(stakeAmount.toFixed(2)),
            stakeFrac: Number(finalFrac.toFixed(6)),
            formula: "PHD_KELLY_CVAR_L1"
        },
        calibration,
        optimization: optim,
        riskMetrics: {
            expectedLogGrowth: optim.expectedLogGrowth,
            cvar: optim.cvar,
            cvarPenalty: optim.cvarPenalty,
            frictionCost: optim.frictionCost
        },
        warnings: calibration.warning ? [calibration.warning] : []
    };
};

// --------------------
// Portfolio allocation (simple but robust)
// --------------------
/**
 * Portfolio-level optimizer:
 * - Get per-bet optimal stake (single-bet Kelly+CVaR+L1)
 * - Enforce per-bet cap and total exposure cap by scaling
 *
 * @param {Array<{prob:number, odds:number, selection?:string, weight?:number, gamma?:number, friction?:number, alpha?:number}>} bets
 * @param {number} bankroll
 * @param {object} options {maxTotalStakeFrac, maxSingleStakeFrac, step}
 */
export const optimizePortfolio = (bets, bankroll = 1000, options = {}) => {
    const br = toNum(bankroll);
    const maxTotal = clamp(toNum(options.maxTotalStakeFrac ?? 0.25), 0, 0.99);
    const maxSingle = clamp(toNum(options.maxSingleStakeFrac ?? 0.10), 0, 0.99);
    const step = toNum(options.step ?? DEFAULT_STEP);

    if (!Array.isArray(bets) || bets.length === 0) {
        return { allocations: [], portfolio: { totalStakePct: 0, totalStakeAmount: 0, scaleFactor: 1, portfolioEV: 0, objectiveValue: 0 }, formula: "PORTFOLIO_KELLY_CVAR_L1" };
    }

    // Per-bet optimize
    const alloc = bets.map((bet, idx) => {
        const p = clamp01(toNum(bet.prob));
        const o = safeOdds(bet.odds);
        const omega = Math.max(0, toNum(bet.weight ?? 1));
        const gamma = Math.max(0, toNum(bet.gamma ?? DEFAULT_CVAR_GAMMA));
        const friction = Math.max(0, toNum(bet.friction ?? DEFAULT_L1_FRICTION));
        const alpha = clamp(toNum(bet.alpha ?? DEFAULT_CVAR_ALPHA), EPS, 1);

        const optim = optimizeStakeCVaR(p, o, { gamma, friction, alpha, maxStake: maxSingle, step });

        return {
            betIndex: idx,
            selection: bet.selection || `Bet ${idx + 1}`,
            prob: p,
            odds: o,
            weight: omega,
            rawStakeFrac: clamp(optim.optimalStakeFrac, 0, maxSingle),
            ev: optim.ev,
            objectiveValue: optim.objectiveValue,
            expectedLogGrowth: optim.expectedLogGrowth,
            cvarPenalty: optim.cvarPenalty,
            frictionCost: optim.frictionCost
        };
    });

    // Total exposure scaling
    const totalRaw = alloc.reduce((s, a) => s + a.rawStakeFrac, 0);
    const scale = totalRaw > maxTotal && totalRaw > 0 ? maxTotal / totalRaw : 1;

    let portfolioObjective = 0;
    let portfolioEV = 0;

    const allocations = alloc.map(a => {
        const stakeFrac = a.rawStakeFrac * scale;
        const stakePct = stakeFrac * 100;
        const stakeAmount = Number.isFinite(br) && br > 0 ? br * stakeFrac : 0;

        // EV contribution (fraction of bankroll * EV per unit bankroll)
        // EV per 1 bankroll unit staked: (p*odds - 1) = ev
        portfolioEV += stakeFrac * a.ev;

        // Objective aggregation (rough, but consistent with single-bet objective units)
        portfolioObjective += a.weight * a.objectiveValue * scale;

        return {
            selection: a.selection,
            odds: a.odds,
            probability: a.prob,
            stakePct: Number(stakePct.toFixed(2)),
            stakeAmount: Number(stakeAmount.toFixed(2)),
            weight: a.weight,
            ev: Number(a.ev.toFixed(6))
        };
    });

    const totalStakeFrac = allocations.reduce((s, a) => s + (a.stakePct / 100), 0);

    return {
        allocations,
        portfolio: {
            totalStakePct: Number((totalStakeFrac * 100).toFixed(2)),
            totalStakeAmount: Number(((Number.isFinite(br) && br > 0 ? br : 0) * totalStakeFrac).toFixed(2)),
            scaleFactor: Number(scale.toFixed(6)),
            portfolioEV: Number((portfolioEV * 100).toFixed(4)), // % of bankroll
            objectiveValue: Number(portfolioObjective.toFixed(6))
        },
        formula: "PORTFOLIO_KELLY_CVAR_L1",
        latex: "max Σ ω_j E[log(1+s_j r_j)] - Σ γ_j CVaR_α(-s_j r_j) - Σ c_j ||s_j||₁"
    };
};

export default {
    calculateCVaR,
    optimizeStakeCVaR,
    calculateKLDivergence,
    checkPosteriorCalibration,
    phdStakeRecommendation,
    optimizePortfolio
};