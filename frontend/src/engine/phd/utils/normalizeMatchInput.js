import { normalizeSport } from './normalizeSport.js';
import { parseOdds } from '../parsers/oddsParser.js';

/**
 * @typedef {import('../types').MatchInputNormalized} MatchInputNormalized
 */

/**
 * Normalizes the raw input from the Vision Agent/App into a strict MatchInput for the engine.
 * @param {object} rawData - The raw match object from App.jsx/Vision.
 * @returns {MatchInputNormalized}
 */
export const normalizeMatchInput = (rawData) => {
    const warnings = [];
    // 1. Basic Metadata
    const sport = normalizeSport(rawData.sport || rawData.__group?.sport);
    const id = rawData.id || rawData.matchId || `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 2. Teams
    // Vision might return 'team_1'/'team_2' (Vision Scraper format), 'home'/'away', or 'home_team'/'away_team', or teams array
    let homeTeam = "Home Team";
    let awayTeam = "Away Team";

    if (rawData.teams && Array.isArray(rawData.teams)) {
        homeTeam = rawData.teams[0] || homeTeam;
        awayTeam = rawData.teams[1] || awayTeam;
    } else {
        // Priority: Vision Scraper format (team_1, team_2) > legacy formats
        homeTeam = rawData.team_1 || rawData.home || rawData.home_team || rawData.homeTeam || homeTeam;
        awayTeam = rawData.team_2 || rawData.away || rawData.away_team || rawData.awayTeam || awayTeam;
    }

    // 3. Normalize Odds
    const odds = parseOdds(rawData, warnings);

    // 4. Normalize Date/Time
    // Vision Scraper returns kickoff_date and kickoff_time, but we need a single date field
    let matchDate = rawData.kickoff_date || rawData.date || rawData.time || null;
    if (matchDate && rawData.kickoff_time) {
        // Combine date and time if both are available
        try {
            const dateStr = matchDate.includes('T') ? matchDate : `${matchDate}T${rawData.kickoff_time}`;
            matchDate = new Date(dateStr).toISOString();
        } catch (e) {
            // If parsing fails, use date as-is
            matchDate = matchDate;
        }
    } else if (!matchDate) {
        // Fallback to current date if nothing found
        matchDate = new Date().toISOString();
    }

    return {
        id,
        sport,
        league: rawData.league || rawData.tournament || "Unknown League",
        homeTeam,
        awayTeam,
        date: matchDate,
        odds, // e.g. { homeWin: 1.85, draw: 3.4, awayWin: 4.2 }
        meta: {
            originalText: rawData.text || "",
            confidence: rawData.confidence,
            kickoff_date: rawData.kickoff_date,
            kickoff_time: rawData.kickoff_time
        },
        warnings
    };
};

