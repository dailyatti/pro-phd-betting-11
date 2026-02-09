/**
 * Match Validation Utilities
 * Validates extracted match data and odds presence.
 */

/**
 * Checks if a match has enough odds to be usable by the engine.
 * PhD Logic: A market is only usable if ALL outcomes are present (e.g. 1, X, and 2 for Soccer).
 * @param {Object} obj - Flat odds object
 * @param {string} sport - Normalized sport
 * @returns {boolean}
 */
export const hasPrimaryOdds = (obj, sport = "FOOTBALL") => {
    if (!obj || typeof obj !== "object") return false;

    const s = String(sport || "FOOTBALL").toUpperCase();

    // Market-specific completeness checks
    // 1X2 (Soccer/Hockey)
    if (s.includes("FOOTBALL") || s.includes("SOCCER") || s.includes("HOCKEY") || s.includes("NHL")) {
        const has1X2 = (Number(obj.homeWin) > 1.01 || Number(obj.homeML) > 1.01) &&
            Number(obj.draw) > 1.01 &&
            (Number(obj.awayWin) > 1.01 || Number(obj.awayML) > 1.01);
        if (has1X2) return true;
    }

    // Moneyline (NBA/Tennis/NFL)
    if (s.includes("BASKET") || s.includes("NBA") || s.includes("TENNIS") || s.includes("NFL") || s.includes("MLB") || s.includes("BASEBALL")) {
        const hasML = (Number(obj.homeML) > 1.01 || Number(obj.homeWin) > 1.01) &&
            (Number(obj.awayML) > 1.01 || Number(obj.awayWin) > 1.01);
        if (hasML) return true;
    }

    // Totals fallback
    if (Number(obj.totalOver) > 1.01 && Number(obj.totalUnder) > 1.01) return true;

    // BTTS fallback
    if (Number(obj.bttsYes) > 1.01 && Number(obj.bttsNo) > 1.01) return true;

    return false;
};

export const validateMatchData = (match, index = 0) => {
    const warnings = [];
    const errors = [];

    if (!match?.team_1 && !match?.team_2) {
        errors.push(`Match ${index}: Missing team names (team_1/team_2)`);
    }

    if (!match?.odds || typeof match.odds !== "object") {
        errors.push(`Match ${index}: Missing odds object`);
    }

    if (warnings.length) {
        console.warn(`[Vision Agent] Match ${index} warnings:`, warnings.join(" | "));
    }
    if (errors.length) {
        console.error(`[Vision Agent] Match ${index} errors:`, errors.join(" | "));
        console.warn(`[Vision Agent] Match ${index} Soft Validation Errors:`, errors.join(" | "));
    }
};
