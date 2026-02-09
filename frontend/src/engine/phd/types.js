/**
 * @typedef {'FOOTBALL' | 'BASKETBALL' | 'TENNIS' | 'NFL' | 'HOCKEY' | 'BASEBALL'} SportType
 */

/**
 * @typedef {'1X2' | 'MONEYLINE' | 'SPREAD' | 'TOTAL' | 'BTS' | 'DOUBLE_CHANCE'} MarketType
 */

/**
 * @typedef {Object} OddsMap
 * @property {number} [homeWin] - Decimal odds for Home Win
 * @property {number} [draw] - Decimal odds for Draw
 * @property {number} [awayWin] - Decimal odds for Away Win
 * @property {number} [totalOver] - Decimal odds for Total Over
 * @property {number} [totalUnder] - Decimal odds for Total Under
 */

/**
 * @typedef {Object} MatchInputNormalized
 * @property {string} id - Unique match ID
 * @property {SportType} sport - Normalized sport enum
 * @property {string} league - League name
 * @property {string} homeTeam - Home team name
 * @property {string} awayTeam - Away team name
 * @property {string} date - Match date/time ISO string
 * @property {OddsMap} odds - Normalized odds map
 * @property {Object} [meta] - Extra metadata (e.g., extracted text, vision confidence)
 * @property {string[]} [warnings] - Collection of non-critical issues found during normalization
 */

/**
 * @typedef {Object} EngineConfig
 * @property {number} bankroll - Total bankroll
 * @property {number} kellyFraction - Kelly criterion fraction (e.g., 0.25 for quarter kelly)
 * @property {boolean} aggressive - Whether to take higher variance bets
 */

/**
 * @typedef {Object} BetRecommendation
 * @property {string} market - The market (e.g., '1X2', 'Total Over 2.5')
 * @property {string} selection - The specific selection (e.g., 'Home', 'Over')
 * @property {number} odds - Decimal odds
 * @property {number} probability - Calculated probability (0-1)
 * @property {number} [pushProbability] - Probability of a push (for spreads/totals)
 * @property {number} ev - Expected Value (e.g., 0.05 for 5% edge)
 * @property {number} kellyStake - Recommended stake percentage (0-1)
 * @property {number} suggestedStake - Actual currency stake
 * @property {string} confidence - 'LOW' | 'MEDIUM' | 'HIGH'
 * @property {string} rationale - Short explanation form the engine
 */

/**
 * @typedef {Object} EngineResult
 * @property {string} matchId
 * @property {BetRecommendation[]} recommendations
 * @property {string[]} explanations - Technical explanations of the calculations
 * @property {string[]} warnings - Any non-critical warnings (e.g., "High vig detected")
 * @property {Object} computedStats - Raw computed stats (e.g., { homeXG: 1.5, awayXG: 1.2 })
 * @property {Object[]} [parameterDerivations] - Explanation of how parameters were derived (Source -> Value)
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} ok - Whether validation passed
 * @property {string[]} errors - Critical errors that block betting
 * @property {string[]} warnings - Non-critical warnings
 */

export const TYPES = {};
