/**
 * PhD Betting Type Definitions
 * Centralized JSDoc types for the betting system.
 */

/**
 * @typedef {Object} OddsData
 * @property {number} [homeWin] - Decimal odds for home victory.
 * @property {number} [draw] - Decimal odds for a draw.
 * @property {number} [awayWin] - Decimal odds for away victory.
 * @property {number} [homeML] - Moneyline/1X2 Home odds.
 * @property {number} [awayML] - Moneyline/1X2 Away odds.
 * @property {number} [totalOver] - Over odds for the main line.
 * @property {number} [totalUnder] - Under odds for the main line.
 * @property {number} [totalLine] - The numeric value of the total line (e.g., 2.5).
 * @property {number} [homeSpread] - Odds for home team spread.
 * @property {number} [awaySpread] - Odds for away team spread.
 * @property {number} [spreadLine] - The numeric value of the spread (e.g., -5.5).
 * @property {boolean} [oddsMissing] - Flag if primary odds were not detected.
 */

/**
 * @typedef {Object} MatchData
 * @property {string} matchId - Unique identifier for the match.
 * @property {string} matchLabel - Human readable label (e.g., "Team A vs Team B").
 * @property {string} team_1 - Name of the first team.
 * @property {string} team_2 - Name of the second team.
 * @property {string} sport - Normalized sport name (e.g., "FOOTBALL").
 * @property {OddsData} odds - Extracted and normalized odds.
 * @property {string} [kickoff_time] - Optional kickoff time.
 * @property {string} [kickoff_date] - Optional kickoff date.
 * @property {string} [tournament] - Tournament or league name.
 * @property {string} [match_analysis_note] - Expert notes from vision.
 */

/**
 * @typedef {Object} EvidenceEntry
 * @property {string} round - The analysis round (e.g., "VISION_OCR", "RESEARCH_1").
 * @property {string} query - The search query used.
 * @property {string} answer - The structured or raw text finding.
 */

export { };
