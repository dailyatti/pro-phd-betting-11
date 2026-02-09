/**
 * Team Extraction Utility
 * 
 * Robustly extracts team names from various match data formats.
 * Handles multiple separator formats and provides confidence scoring.
 * 
 * @module agents/common/teamExtractor
 */

/**
 * @typedef {Object} TeamExtractionResult
 * @property {string} team1 - First team name
 * @property {string} team2 - Second team name
 * @property {number} parse_confidence - Confidence score (0-1)
 * @property {string|null} parse_note - Note about parsing quality
 */

/**
 * Extracts team names from match data with confidence scoring
 * @param {Object} matchData - Match data object from vision or API
 * @returns {TeamExtractionResult} Extracted teams with confidence
 */
export const extractTeams = (matchData) => {
    const matchInfo = matchData?.matches?.[0] || matchData || {};
    const direct1 = typeof matchInfo.team_1 === 'string' ? matchInfo.team_1.trim() : '';
    const direct2 = typeof matchInfo.team_2 === 'string' ? matchInfo.team_2.trim() : '';

    if (direct1 && direct2) {
        return { team1: direct1, team2: direct2, parse_confidence: 1.0, parse_note: null };
    }

    const raw =
        (typeof matchInfo.teams === 'string' && matchInfo.teams) ||
        (typeof matchInfo.match === 'string' && matchInfo.match) ||
        (typeof matchInfo.title === 'string' && matchInfo.title) ||
        '';

    const s = String(raw).trim();
    if (!s) {
        return { team1: 'Team 1', team2: 'Team 2', parse_confidence: 0.0, parse_note: 'No teams string found.' };
    }

    // Common separators seen across betting sites
    const seps = [' vs ', ' vs. ', ' v ', ' - ', ' – ', ' — ', ' @ ', ' at '];

    for (const sep of seps) {
        if (s.includes(sep)) {
            const parts = s.split(sep).map((p) => p.trim()).filter(Boolean);
            if (parts.length >= 2) {
                const t1 = parts[0];
                const t2 = parts[1];
                const conf = (t1 && t2) ? 0.75 : 0.4;
                return {
                    team1: t1 || 'Team 1',
                    team2: t2 || 'Team 2',
                    parse_confidence: conf,
                    parse_note: conf < 0.7 ? `Teams parsed from "${sep.trim()}" with low confidence.` : null
                };
            }
        }
    }

    // Fallback: try conservative split on punctuation patterns
    const loose = s.split(/[|·•]+/).map((p) => p.trim()).filter(Boolean);
    if (loose.length >= 2) {
        return {
            team1: loose[0] || 'Team 1',
            team2: loose[1] || 'Team 2',
            parse_confidence: 0.5,
            parse_note: 'Teams parsed using a loose delimiter; verify names.'
        };
    }

    return {
        team1: direct1 || 'Team 1',
        team2: direct2 || 'Team 2',
        parse_confidence: 0.25,
        parse_note: 'Could not reliably parse teams; using fallbacks.'
    };
};
