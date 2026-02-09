import { normalizeSport } from './utils/normalizeSport.js';
import { FORMULA_CATALOG } from './formulaRegistry.js';

// Import all engines
import * as footballEngine from './formulas/football.js';
import * as basketballEngine from './formulas/basketball.js';
import * as tennisEngine from './formulas/tennis.js';
import * as hockeyEngine from './formulas/hockey.js';
import * as baseballEngine from './formulas/baseball.js';
import * as nflEngine from './formulas/nfl.js';

const ENGINES = {
    'FOOTBALL': footballEngine,
    'BASKETBALL': basketballEngine,
    'TENNIS': tennisEngine,
    'HOCKEY': hockeyEngine,
    'BASEBALL': baseballEngine,
    'NFL': nflEngine
};

/**
 * Gets the correct math engine for a specific sport.
 * @param {string} rawSport 
 * @returns {object} The engine module (must have computeEngine)
 */
export const getSportEngine = (rawSport) => {
    const sport = normalizeSport(rawSport);
    const engine = ENGINES[sport];

    if (!engine) {
        console.warn(`[EngineRegistry] No specific engine for ${sport}, using Football (Generic) fallback.`);
        return footballEngine;
    }
    return engine;
};

/**
 * NEW: Dynamic Dispatcher for Architect Agent
 * Executes a specific formula ID by routing to the correct engine module.
 * 
 * @param {string} formulaId - e.g. "FOOTBALL_POISSON", "TENNIS_HDD"
 * @param {object} inputData - Match data + Extracted Parameters
 * @param {object} config - User config (bankroll, staking)
 */
export const getFormula = (formulaId) => {
    // 1. Look up formula definition
    // FORMULA_CATALOG is an object, not an array. Use direct lookup.
    const def = FORMULA_CATALOG[formulaId];
    if (!def) {
        console.warn(`[Registry] Formula ID '${formulaId}' not found in Catalog.`);
        return null;
    }

    // 2. Resolve Engine
    // We assume the formula ID prefix or metadata tells us the sport, 
    // OR we just use the inputData.sport if provided.
    // Actually, the catalog *should* link to the implementation.
    // For now, we map manually based on ID prefix or sport.

    // Quick Map:
    let engine = null;
    if (formulaId.startsWith('FOOTBALL')) engine = footballEngine;
    else if (formulaId.startsWith('BASKETBALL')) engine = basketballEngine;
    else if (formulaId.startsWith('TENNIS')) engine = tennisEngine;
    else if (formulaId.startsWith('HOCKEY')) engine = hockeyEngine;
    else if (formulaId.startsWith('BASEBALL')) engine = baseballEngine;
    else if (formulaId.startsWith('NFL')) engine = nflEngine;
    else {
        // Fallback or generic
        return null;
    }

    return {
        id: formulaId,
        execute: (data, cfg) => {
            // We call the standard computeEngine but we prioritize the extracted parameters
            // The engines are already built to look for 'extractedParameters'
            return engine.computeEngine(data, cfg);
        }
    };
};
