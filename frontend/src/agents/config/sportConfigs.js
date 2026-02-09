/**
 * Sport & Market Configurations
 * Defines mandatory markets and sport-specific logic.
 */

/**
 * @typedef {Object} MarketSchema
 * @property {string} FOOTBALL
 * @property {string} BASKETBALL
 * @property {string} TENNIS
 * @property {string} NFL
 * @property {string} HOCKEY
 * @property {string} BASEBALL
 */

export const SPORT_MARKET_SCHEMAS = {
    FOOTBALL: `
MANDATORY MARKETS (FOOTBALL/SOCCER):
1) 1X2: Home / Draw / Away
2) Over/Under 2.5: Over / Under
3) BTTS: Yes / No
4) Team Totals: Home O/U 1.5, Away O/U 1.5
`,
    BASKETBALL: `
MANDATORY MARKETS (BASKETBALL):
1) Moneyline: Home / Away
2) Spread: main handicap line (e.g. -5.5)
3) Total: Over / Under (e.g. 220.5)
FORBIDDEN: 1X2/Draw/BTTS/Soccer-style team totals
`,
    TENNIS: `
MANDATORY MARKETS (TENNIS):
1) Match Winner: P1 / P2
2) Set Betting: 2-0 / 2-1
3) Total Games: Over / Under
`,
    NFL: `
MANDATORY MARKETS (NFL):
1) Moneyline: Home / Away
2) Spread: main line
3) Total Points: Over / Under
4) Team Totals: Home / Away
`,
    HOCKEY: `
MANDATORY MARKETS (HOCKEY):
1) 3-Way Regulation: Home / Draw / Away
2) Puck Line: -1.5 / +1.5
3) Total Goals: Over / Under
4) Team Totals: Home / Away
`,
    BASEBALL: `
MANDATORY MARKETS (BASEBALL):
1) Moneyline: Home / Away
2) Run Line: -1.5 / +1.5
3) Total Runs: Over / Under
4) Team Totals: Home / Away
`,
    OTHER: `
MANDATORY MARKETS (GENERIC):
1) Winner / Moneyline
2) Handicap / Spread (if applicable)
3) Total Points / Goals (if applicable)
CRITICAL: If a market is not standard for this sport, ignore it. Focus on the primary Winner market.
`,
};

/**
 * Returns the mandatory markets for a given sport.
 * @param {string} sport 
 * @returns {string}
 */
export const getMandatoryMarkets = (sport) => {
    const s = String(sport || "FOOTBALL").toUpperCase();
    if (s.includes("BASKET") || s.includes("NBA")) return SPORT_MARKET_SCHEMAS.BASKETBALL;
    if (s.includes("TENNIS") || s.includes("ATP") || s.includes("WTA")) return SPORT_MARKET_SCHEMAS.TENNIS;
    if (s.includes("NFL") || s.includes("AMERICAN")) return SPORT_MARKET_SCHEMAS.NFL;
    if (s.includes("HOCKEY") || s.includes("NHL")) return SPORT_MARKET_SCHEMAS.HOCKEY;
    if (s.includes("BASEBALL") || s.includes("MLB")) return SPORT_MARKET_SCHEMAS.BASEBALL;

    // Explicitly handle "OTHER" (Handball, Volleyball, MMA, etc.)
    if (s === "OTHER" || s.includes("VOLLEY") || s.includes("HANDBALL") || s.includes("FIGHT") || s.includes("MMA") || s.includes("BOXING") || s.includes("DART") || s.includes("SNOOKER")) {
        return SPORT_MARKET_SCHEMAS.OTHER;
    }

    return SPORT_MARKET_SCHEMAS.FOOTBALL;
};
