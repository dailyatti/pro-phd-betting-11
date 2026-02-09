/**
 * @typedef {import('../types').OddsMap} OddsMap
 */

/**
 * Strategy interface for parsing odds.
 * @callback OddsParserStrategy
 * @param {object} rawOdds - The raw odds object from Vision/Input
 * @param {string[]} warnings - Mutable warnings array
 * @returns {Partial<OddsMap>}
 */

/**
 * Validates a single odd value.
 * @param {any} val - Value to check
 * @param {string} key - key name for warning context
 * @param {string[]} warnings - warnings array
 * @returns {number|null} - Valid decimal odd or null
 */
const parseAndValidateOdd = (val, key, warnings) => {
    const p = parseFloat(val);
    if (typeof p === 'number' && !isNaN(p) && p > 1) {
        return p;
    }
    // Only warn if value was present but invalid (not just undefined)
    if (val !== undefined && val !== null) {
        warnings.push(`Invalid odds value for ${key}: ${val}`);
    }
    return null;
};

/**
 * Strategy: Standard 1X2 / Moneyline
 * Handles: { homeWin, draw, awayWin } or { 1, X, 2 } or { moneyline... }
 */
const parse1X2Strategy = (rawOdds, warnings) => {
    const result = {};

    // 1. Check for nested structure first (e.g. moneyline, h2h, 1x2)
    const ml = rawOdds.moneyline || rawOdds.h2h || rawOdds['1x2'];

    if (ml) {
        if (ml['1'] || ml.home) result.homeWin = parseAndValidateOdd(ml['1'] || ml.home, 'homeWin', warnings);
        if (ml['2'] || ml.away) result.awayWin = parseAndValidateOdd(ml['2'] || ml.away, 'awayWin', warnings);
        if (ml['X'] || ml.draw) result.draw = parseAndValidateOdd(ml['X'] || ml.draw, 'draw', warnings);
    } else {
        // 2. Fallback to flat structure
        if (rawOdds.home_win || rawOdds['1']) result.homeWin = parseAndValidateOdd(rawOdds.home_win || rawOdds['1'], 'homeWin', warnings);
        if (rawOdds.away_win || rawOdds['2']) result.awayWin = parseAndValidateOdd(rawOdds.away_win || rawOdds['2'], 'awayWin', warnings);
        if (rawOdds.draw || rawOdds.x) result.draw = parseAndValidateOdd(rawOdds.draw || rawOdds.x, 'draw', warnings);

        // Also check camelCase if coming from internal re-feed
        if (rawOdds.homeWin) result.homeWin = parseAndValidateOdd(rawOdds.homeWin, 'homeWin', warnings);
        if (rawOdds.awayWin) result.awayWin = parseAndValidateOdd(rawOdds.awayWin, 'awayWin', warnings);
    }

    return result;
};

/**
 * Strategy: Totals (Over/Under)
 */
/**
 * Strategy: Totals (Over/Under)
 * Handles both API object format and GPT Array format: [{ line: "2.5", over: 1.8, under: 2.0 }]
 */
const parseTotalsStrategy = (rawOdds, warnings) => {
    const result = {};
    let totals = rawOdds.totals || rawOdds.over_under;

    // Handle GPT Array Format
    if (Array.isArray(totals)) {
        // Priority: Find line "2.5", otherwise take the first available
        const preferred = totals.find(t => t.line == 2.5 || t.line === '2.5');
        totals = preferred || totals[0];
    }

    if (totals) {
        if (totals.over) result.totalOver = parseAndValidateOdd(totals.over, 'totalOver', warnings);
        if (totals.under) result.totalUnder = parseAndValidateOdd(totals.under, 'totalUnder', warnings);
    } else {
        // Flat fallback
        if (rawOdds.totalOver) result.totalOver = parseAndValidateOdd(rawOdds.totalOver, 'totalOver', warnings);
        if (rawOdds.totalUnder) result.totalUnder = parseAndValidateOdd(rawOdds.totalUnder, 'totalUnder', warnings);
    }

    return result;
};

/**
 * Main Parser Facade
 * @param {object} rawData - The raw match input
 * @param {string[]} warnings - Mutable array to collect warnings
 * @returns {OddsMap}
 */
export const parseOdds = (rawData, warnings) => {
    const rawOdds = rawData.odds || {};
    const oddsMap = {};

    // Apply strategies
    Object.assign(oddsMap, parse1X2Strategy(rawOdds, warnings));
    Object.assign(oddsMap, parseTotalsStrategy(rawOdds, warnings));

    return oddsMap;
};
