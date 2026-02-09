/**
 * PhD Formula Registry (The Catalog)
 * This file serves as the "tool box" for the AI Architect.
 * It describes all available mathematical models, their inputs, and execution logic.
 * 
 * UPGRADED to Specific PhD Models (Bayesian/Stochastic/Optimization)
 */

import * as football from './formulas/football.js';
import * as basketball from './formulas/basketball.js';
import * as tennis from './formulas/tennis.js';
import * as hockey from './formulas/hockey.js';
import * as baseball from './formulas/baseball.js';
import * as nfl from './formulas/nfl.js';
import optimization from '../../utils/phdStakeOptimizer.js';

export const FORMULA_CATALOG = {
    // ============================================================
    // 1. FOOTBALL (SOCCER)
    // ============================================================
    FOOTBALL_POISSON: {
        id: 'FOOTBALL_POISSON',
        name: 'PhD Football: Dixon-Coles / Poisson',
        description: 'Bayesian-calibrated Poisson model with Dixon-Coles adjustment for low-scoring correlation. Handles 1X2, O/U, BTTS.',
        sport: 'FOOTBALL',
        inputs: {
            homeXG: 'Home Expected Goals (lambda_H)',
            awayXG: 'Away Expected Goals (lambda_A)',
            rho: 'Dixon-Coles Correlation (rho, default -0.03)',
            homeTeam: 'Home Team Name (metadata)',
            awayTeam: 'Away Team Name (metadata)'
        },
        execute: (data, config) => football.computeEngine(data, { ...config, useDixonColes: true })
    },

    // ============================================================
    // 2. BASKETBALL (NBA)
    // ============================================================
    BASKETBALL_POSSESSION: {
        id: 'BASKETBALL_POSSESSION',
        name: 'PhD Basketball: Possession Decomposition',
        description: 'Decomposes scoring into Pace (Possessions) * Efficiency (Pts/Poss). Uses Normal Approximation for Spreads.',
        sport: 'BASKETBALL',
        inputs: {
            pace: 'Projected Pace (possessions/game)',
            homeOrtg: 'Home Offensive Rating (Pts/100 poss)',
            homeDrtg: 'Home Defensive Rating (Pts/100 poss)',
            awayOrtg: 'Away Offensive Rating (Pts/100 poss)',
            awayDrtg: 'Away Defensive Rating (Pts/100 poss)'
        },
        execute: (data, config) => basketball.computeEngine(data, config)
    },

    // ============================================================
    // 3. TENNIS
    // ============================================================
    TENNIS_HDD: {
        id: 'TENNIS_HDD',
        name: 'PhD Tennis: HDD (Hold/Deuce) + Logistic',
        description: 'Point-level iid model for Service Games combined with Surface-Aware Logistic Regression for Match Win.',
        sport: 'TENNIS',
        inputs: {
            homeHold: 'Home Serve Hold % (0-1)',
            homeBreak: 'Home Return Break % (0-1)',
            awayHold: 'Away Serve Hold % (0-1)',
            awayBreak: 'Away Return Break % (0-1)',
            surface: 'Surface (HARD, CLAY, GRASS)',
            homeElo: 'Home Surface-Adjusted ELO',
            awayElo: 'Away Surface-Adjusted ELO'
        },
        execute: (data, config) => tennis.computeEngine(data, config)
    },

    // ============================================================
    // 4. HOCKEY (NHL)
    // ============================================================
    HOCKEY_POISSON_GSAX: {
        id: 'HOCKEY_POISSON_GSAX',
        name: 'PhD Hockey: Poisson Intensity + GSAx',
        description: 'Goal counts modeled as Poisson with intensity derived from xG and Goalie Saves Above Expected (GSAx).',
        sport: 'HOCKEY',
        inputs: {
            homeXG: 'Home Expected Goals (xG)',
            awayXG: 'Away Expected Goals (xG)',
            homeGSAx: 'Home Goalie GSAx (Goals Saved Above Expected)',
            awayGSAx: 'Away Goalie GSAx'
        },
        execute: (data, config) => hockey.computeEngine(data, config)
    },

    // ============================================================
    // 5. BASEBALL (MLB)
    // ============================================================
    BASEBALL_NEGBIN_PYTH: {
        id: 'BASEBALL_NEGBIN_PYTH',
        name: 'PhD Baseball: NegBin Runs + Pythagorean',
        description: 'Runs modeled as Negative Binomial (Overdispersed). Win prob via Season-Dependent Pythagorean Expectation.',
        sport: 'BASEBALL',
        inputs: {
            homeRuns: 'Projected Home Runs',
            awayRuns: 'Projected Away Runs',
            homeK: 'Home Dispersion (k factor, optional)',
            awayK: 'Away Dispersion (k factor, optional)',
            parkFactor: 'Park Factor (default 1.0)'
        },
        execute: (data, config) => baseball.computeEngine(data, config)
    },

    // ============================================================
    // 6. NFL
    // ============================================================
    NFL_COMPOUND_DRIVE: {
        id: 'NFL_COMPOUND_DRIVE',
        name: 'PhD NFL: Compound Drive Process',
        description: 'Scoring modeled as Drives * Points/Drive. Linked to EPA/Play efficiency features.',
        sport: 'NFL',
        inputs: {
            homeOffEPA: 'Home Offensive EPA/Play',
            homeDefEPA: 'Home Defensive EPA/Play',
            awayOffEPA: 'Away Offensive EPA/Play',
            awayDefEPA: 'Away Defensive EPA/Play',
            gameTempo: 'Projected Plays/Game (tempo)'
        },
        execute: (data, config) => nfl.computeEngine(data, config)
    },

    // ============================================================
    // 7. CORE OPTIMIZATION (Universal)
    // ============================================================
    POSTERIOR_CALIBRATION: {
        id: 'POSTERIOR_CALIBRATION',
        name: 'Posterior Calibration (KL-Divergence)',
        description: 'Measures information loss (KL) between Model Posterior and Market-Implied Prior. Regularizes overconfidence.',
        sport: 'UNIVERSAL',
        inputs: {
            modelProb: 'Model Probability (0-1)',
            marketOdds: 'Market Decimal Odds (>1)',
            lambda: 'Regularization Strength (default 0.1)'
        },
        execute: (data, config) => {
            return optimization.checkPosteriorCalibration(data.modelProb, data.marketOdds, { lambda: data.lambda });
        }
    },
    STAKE_OPTIMIZATION: {
        id: 'STAKE_OPTIMIZATION',
        name: 'Stake Optimization (Kelly + CVaR + Friction)',
        description: 'Solves the convex optimization problem: argmax E[log] - gamma*CVaR - c*|s|',
        sport: 'UNIVERSAL',
        inputs: {
            prob: 'Win Probability (0-1)',
            odds: 'Decimal Odds (>1)',
            bankroll: 'Bankroll ($)',
            gamma: 'CVaR Penalty Weight (default 0.5)',
            alpha: 'CVaR Tail Level (default 0.05)',
            friction: 'Transaction Cost/Friction (default 0.02)'
        },
        execute: (data, config) => {
            return optimization.optimizeStakeCVaR(data.prob, data.odds, {
                gamma: data.gamma,
                alpha: data.alpha,
                friction: data.friction
            });
        }
    }
};

/**
 * Gets a formula from the catalog by ID.
 * @param {string} id 
 * @returns {object|null}
 */
export const getFormula = (id) => FORMULA_CATALOG[id] || null;

/**
 * Lists all formulas for a given sport (or all if sport is null).
 * @param {string} [sport] 
 * @returns {object[]}
 */
export const listCatalog = (sport = null) => {
    return Object.values(FORMULA_CATALOG).filter(f => !sport || f.sport === sport || !f.sport);
};
