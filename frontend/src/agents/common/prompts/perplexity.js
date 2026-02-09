/**
 * Perplexity Research Prompts
 * 
 * Sport-specific prompts for the Perplexity Fact Checker agent.
 * Each sport has tailored data requirements and JSON schemas.
 * 
 * @module agents/common/prompts/perplexity
 */

import { extractTeams } from '../teamExtractor.js';

// ============================================================================
// COMMON REQUIREMENTS
// ============================================================================

/**
 * Standard requirements appended to every sport prompt
 * @returns {string} Common requirements text
 */
const getCommonPerplexityRequirements = () => `
OUTPUT FORMAT: JSON ONLY (no markdown, no prose outside JSON).
STRICT RULES:
- Facts only. NO betting picks, NO EV, NO "should bet".
- If unavailable/uncertain → use null. Do NOT guess.
- Always include these keys, even if values are null:
  - match_context: { stadium, referee_name, weather_forecast }
  - form_guide: { home_last_5, away_last_5, home_home_last_5, away_away_last_5 }
  - head_to_head_last_5
  - injuries: { home_team, away_team }
  - sources_used (array of short source names)
  - data_gaps (array)

FORM GUIDE SPEC:
- Each *_last_5 must be an array of 5 strings with exact scores if known (e.g. "W 2-1", "D 0-0") or "W"/"D"/"L" if not.
- home_home_last_5 / away_away_last_5 follow the same rule (home-only / away-only results).
`.trim();

// ============================================================================
// SPORT-SPECIFIC PROMPTS
// ============================================================================

/**
 * NFL data mining prompt
 * @param {string} targetLine - Target match line
 * @param {string} common - Common requirements
 * @returns {string} NFL prompt
 */
const getNFLPrompt = (targetLine, common) => `
ROLE: NFL DATA MINER (FACTS ONLY, NO ANALYSIS)
${targetLine}
TASK: Fetch advanced NFL stats + context for this matchup.

RETURN JSON WITH THESE FIELDS:
{
  "match_context": { "stadium": <string|null>, "referee_name": <string|null>, "weather_forecast": <string|null> },
  "form_guide": { "home_last_5": <array|null>, "away_last_5": <array|null>, "home_home_last_5": <array|null>, "away_away_last_5": <array|null> },
  "head_to_head_last_5": [ { "date":"YYYY-MM-DD", "score":"H-A", "winner":"Home/Away/Draw" } ],
  "team_stats": {
    "home_dvoa_rank": <int|null>, "away_dvoa_rank": <int|null>,
    "home_epa_per_play": <float|null>, "away_epa_per_play": <float|null>,
    "turnover_margin": <int|null>
  },
  "qb_matchup": {
    "home_qb": { "name": <string|null>, "qbr_last_3_games": <float|null>, "sack_rate": <float|null> },
    "away_qb": { "name": <string|null>, "qbr_last_3_games": <float|null>, "sack_rate": <float|null> }
  },
  "trench_warfare": {
    "home_oline_rank": <int|null>, "away_dline_rank": <int|null>,
    "key_lineman_injuries": <array>
  },
  "situational_splits": {
    "home_third_down_pct": <float|null>, "away_third_down_pct": <float|null>,
    "home_redzone_td_pct": <float|null>, "away_redzone_td_pct": <float|null>,
    "home_pace_seconds_per_play": <float|null>, "away_pace_seconds_per_play": <float|null>
  },
  "explosiveness_and_success": {
    "home_success_rate": <float|null>, "away_success_rate": <float|null>,
    "home_explosive_play_rate": <float|null>, "away_explosive_play_rate": <float|null>
  },
  "defense_profile": {
    "home_pressure_rate": <float|null>, "away_pressure_rate": <float|null>,
    "home_man_zone_rate": { "man_pct": <float|null>, "zone_pct": <float|null> },
    "away_man_zone_rate": { "man_pct": <float|null>, "zone_pct": <float|null> }
  },
  "injuries": { "home_team": <array>, "away_team": <array> },
  "injuries_depth": {
    "key_skill_position_injuries": <array>,
    "secondary_injuries": <array>,
    "qb_status_notes": <string|null>
  },
  "market_sanity_checks": {
    "opening_line": <string|null>,
    "current_line": <string|null>,
    "notable_line_movement": <string|null>
  },
  "sources_used": <array>,
  "data_gaps": <array>
}

${common}
`.trim();

/**
 * Basketball data mining prompt
 * @param {string} targetLine - Target match line
 * @param {string} common - Common requirements
 * @returns {string} Basketball prompt
 */
const getBasketballPrompt = (targetLine, common) => `
ROLE: BASKETBALL STATS MINER (FACTS ONLY, NO ANALYSIS)
${targetLine}
TASK: Fetch Four Factors, pace, roster availability, and context.

RETURN JSON WITH THESE FIELDS:
{
  "match_context": { "stadium": <string|null>, "referee_name": <string|null>, "weather_forecast": <string|null> },
  "form_guide": { "home_last_5": <array|null>, "away_last_5": <array|null>, "home_home_last_5": <array|null>, "away_away_last_5": <array|null> },
  "head_to_head_last_5": [ { "date":"YYYY-MM-DD", "score":"H-A", "winner":"Home/Away/Draw" } ],
  "advanced_metrics": {
    "pace_factor": <float|null>,
    "offensive_rating_home": <float|null>, "defensive_rating_home": <float|null>,
    "offensive_rating_away": <float|null>, "defensive_rating_away": <float|null>,
    "effective_fg_percent_home": <float|null>, "effective_fg_percent_away": <float|null>
  },
  "four_factors": {
    "home_eFG": <float|null>, "away_eFG": <float|null>,
    "home_tov_pct": <float|null>, "away_tov_pct": <float|null>,
    "home_orb_pct": <float|null>, "away_orb_pct": <float|null>,
    "home_ft_rate": <float|null>, "away_ft_rate": <float|null>
  },
  "shot_profile": {
    "home_3pa_rate": <float|null>, "away_3pa_rate": <float|null>,
    "home_rim_rate": <float|null>, "away_rim_rate": <float|null>,
    "home_midrange_rate": <float|null>, "away_midrange_rate": <float|null>
  },
  "matchup_edges": {
    "home_reb_edge": <float|null>, "away_reb_edge": <float|null>,
    "home_turnover_forcing_rate": <float|null>, "away_turnover_forcing_rate": <float|null>
  },
  "roster_impact": {
    "home_rest_days": <int|null>, "away_rest_days": <int|null>,
    "key_missing_players_usage_rate": <float|null>
  },
  "availability_context": {
    "back_to_back_home": <bool|null>, "back_to_back_away": <bool|null>,
    "travel_distance_km": <int|null>,
    "altitude_game": <bool|null>
  },
  "officiating_free_throw_context": {
    "home_ft_attempt_rate": <float|null>, "away_ft_attempt_rate": <float|null>,
    "referee_crew_foul_rate": <float|null>
  },
  "injuries": { "home_team": <array>, "away_team": <array> },
  "sources_used": <array>,
  "data_gaps": <array>
}

${common}
`.trim();

/**
 * Tennis data mining prompt
 * @param {string} targetLine - Target match line
 * @param {string} common - Common requirements
 * @returns {string} Tennis prompt
 */
const getTennisPrompt = (targetLine, common) => `
ROLE: TENNIS DATA MINER (FACTS ONLY, NO ANALYSIS)
${targetLine}
TASK: Fetch surface-specific serve/return + form + context.

RETURN JSON WITH THESE FIELDS:
{
  "match_context": { "stadium": <string|null>, "referee_name": <string|null>, "weather_forecast": <string|null> },
  "form_guide": { "home_last_5": <array|null>, "away_last_5": <array|null>, "home_home_last_5": <array|null>, "away_away_last_5": <array|null> },
  "head_to_head_last_5": [ { "date":"YYYY-MM-DD", "score":"H-A", "winner":"Home/Away/Draw" } ],
  "surface_stats": {
    "surface_type": <string|null>,
    "player_1_win_rate_on_surface": <float|null>,
    "player_2_win_rate_on_surface": <float|null>
  },
  "serve_return": {
    "p1_first_serve_won": <float|null>, "p1_return_games_won": <float|null>,
    "p2_first_serve_won": <float|null>, "p2_return_games_won": <float|null>
  },
  "serve_quality": {
    "p1_ace_rate": <float|null>, "p2_ace_rate": <float|null>,
    "p1_double_fault_rate": <float|null>, "p2_double_fault_rate": <float|null>,
    "p1_first_serve_in_pct": <float|null>, "p2_first_serve_in_pct": <float|null>
  },
  "break_point_profile": {
    "p1_bp_saved_pct": <float|null>, "p2_bp_saved_pct": <float|null>,
    "p1_bp_converted_pct": <float|null>, "p2_bp_converted_pct": <float|null>
  },
  "rally_and_style": {
    "p1_avg_rally_length": <float|null>, "p2_avg_rally_length": <float|null>,
    "p1_winner_unforced_ratio": <float|null>, "p2_winner_unforced_ratio": <float|null>,
    "p1_aggression_index": <float|null>, "p2_aggression_index": <float|null>
  },
  "recent_form_context": {
    "p1_last_10_record": <string|null>, "p2_last_10_record": <string|null>,
    "fatigue_indicator": { "p1_minutes_last_7_days": <int|null>, "p2_minutes_last_7_days": <int|null> }
  },
  "injuries": { "home_team": <array>, "away_team": <array> },
  "sources_used": <array>,
  "data_gaps": <array>
}

${common}
`.trim();

/**
 * Baseball data mining prompt
 * @param {string} targetLine - Target match line
 * @param {string} common - Common requirements
 * @returns {string} Baseball prompt
 */
const getBaseballPrompt = (targetLine, common) => `
ROLE: MLB SABERMETRICS MINER (FACTS ONLY, NO ANALYSIS)
${targetLine}
TASK: Fetch starter + bullpen + park factors + lineup context.

RETURN JSON WITH THESE FIELDS:
{
  "match_context": { "stadium": <string|null>, "referee_name": <string|null>, "weather_forecast": <string|null> },
  "form_guide": { "home_last_5": <array|null>, "away_last_5": <array|null>, "home_home_last_5": <array|null>, "away_away_last_5": <array|null> },
  "head_to_head_last_5": [ { "date":"YYYY-MM-DD", "score":"H-A", "winner":"Home/Away/Draw" } ],
  "starting_pitchers": {
    "home_pitcher": { "name": <string|null>, "era": <float|null>, "whip": <float|null>, "k_per_9": <float|null>, "xfip": <float|null> },
    "away_pitcher": { "name": <string|null>, "era": <float|null>, "whip": <float|null>, "k_per_9": <float|null>, "xfip": <float|null> }
  },
  "bullpen_stats": { "home_bullpen_era": <float|null>, "away_bullpen_era": <float|null> },
  "park_factors": { "runs_factor": <float|null>, "homeruns_factor": <float|null> },
  "offense_quality": {
    "home_wrc_plus": <int|null>, "away_wrc_plus": <int|null>,
    "home_iso": <float|null>, "away_iso": <float|null>,
    "home_bb_rate": <float|null>, "away_bb_rate": <float|null>
  },
  "defense_and_fielding": {
    "home_def_runs_saved": <int|null>, "away_def_runs_saved": <int|null>,
    "home_errors_per_game": <float|null>, "away_errors_per_game": <float|null>
  },
  "lineup_context": {
    "expected_lineup_confirmed": <bool|null>,
    "key_bat_injuries": <array>,
    "platoon_advantage_notes": <string|null>
  },
  "rest_and_usage": {
    "bullpen_last_3_days_innings": { "home": <float|null>, "away": <float|null> },
    "travel_context": <string|null>
  },
  "injuries": { "home_team": <array>, "away_team": <array> },
  "sources_used": <array>,
  "data_gaps": <array>
}

${common}
`.trim();

/**
 * Hockey data mining prompt
 * @param {string} targetLine - Target match line
 * @param {string} common - Common requirements
 * @returns {string} Hockey prompt
 */
const getHockeyPrompt = (targetLine, common) => `
ROLE: NHL DATA MINER (FACTS ONLY, NO ANALYSIS)
${targetLine}
TASK: Fetch goalie, possession, shot-quality, and fatigue context.

RETURN JSON WITH THESE FIELDS:
{
  "match_context": { "stadium": <string|null>, "referee_name": <string|null>, "weather_forecast": <string|null> },
  "form_guide": { "home_last_5": <array|null>, "away_last_5": <array|null>, "home_home_last_5": <array|null>, "away_away_last_5": <array|null> },
  "head_to_head_last_5": [ { "date":"YYYY-MM-DD", "score":"H-A", "winner":"Home/Away/Draw" } ],
  "goalie_matchup": {
    "home_goalie": { "name": <string|null>, "save_percent_vs_expected": <float|null>, "gsaa": <float|null> },
    "away_goalie": { "name": <string|null>, "save_percent_vs_expected": <float|null>, "gsaa": <float|null> }
  },
  "possession_metrics": {
    "home_corsi_for_percent": <float|null>, "away_corsi_for_percent": <float|null>,
    "special_teams_efficiency_diff": <float|null>
  },
  "shot_quality": {
    "home_xg_for_pct_5v5": <float|null>, "away_xg_for_pct_5v5": <float|null>,
    "home_high_danger_chances_for": <float|null>, "away_high_danger_chances_for": <float|null>,
    "home_high_danger_chances_against": <float|null>, "away_high_danger_chances_against": <float|null>
  },
  "special_teams_detail": {
    "home_pp_percent": <float|null>, "away_pp_percent": <float|null>,
    "home_pk_percent": <float|null>, "away_pk_percent": <float|null>,
    "penalty_differential": <float|null>
  },
  "schedule_fatigue": {
    "home_rest_days": <int|null>, "away_rest_days": <int|null>,
    "back_to_back_home": <bool|null>, "back_to_back_away": <bool|null>,
    "travel_distance_km": <int|null>
  },
  "injuries_and_lines": {
    "top6_forwards_out": <array>, "top4_defense_out": <array>,
    "line_combo_changes_last_3_games": <string|null>
  },
  "injuries": { "home_team": <array>, "away_team": <array> },
  "sources_used": <array>,
  "data_gaps": <array>
}

${common}
`.trim();

/**
 * Football (Soccer) data mining prompt - default
 * @param {string} targetLine - Target match line
 * @param {string} common - Common requirements
 * @returns {string} Football prompt
 */
const getFootballPrompt = (targetLine, common) => `
ROLE: ELITE FOOTBALL DATA MINER (FACTS ONLY, NO PREDICTIONS)
${targetLine}
TASK: Fetch deep football data: standings, form, injuries, xG if available, referee, and context.

RETURN JSON WITH THESE FIELDS:
{
  "match_context": {
    "stadium": <string|null>,
    "referee_name": <string|null>,
    "weather_forecast": <string|null>
  },
  "standings": { "home_pos": <int|null>, "away_pos": <int|null>, "home_points": <int|null>, "away_points": <int|null> },

  "form_guide": {
    "home_last_5": <array|null>,
    "away_last_5": <array|null>,
    "home_home_last_5": <array|null>,
    "away_away_last_5": <array|null>
  },

  "advanced_metrics": {
    "home_xg_last_5_avg": <float|null>,
    "away_xg_last_5_avg": <float|null>,
    "home_defensive_errors_leading_to_shots": <int|null>,
    "avg_goals_scored_home": <float|null>, "avg_goals_conceded_home": <float|null>,
    "avg_goals_scored_away": <float|null>, "avg_goals_conceded_away": <float|null>
  },

  "tactical_profile": {
    "home_style": { "possession_pct": <float|null>, "ppda": <float|null>, "build_up_directness": <float|null> },
    "away_style": { "possession_pct": <float|null>, "ppda": <float|null>, "build_up_directness": <float|null> },
    "set_piece_xg_for_home": <float|null>,
    "set_piece_xg_for_away": <float|null>
  },

  "chance_quality_detail": {
    "home_big_chances_for_last_5": <float|null>, "away_big_chances_for_last_5": <float|null>,
    "home_big_chances_against_last_5": <float|null>, "away_big_chances_against_last_5": <float|null>,
    "shot_volume_last_5": { "home": <float|null>, "away": <float|null> },
    "shots_on_target_last_5": { "home": <float|null>, "away": <float|null> }
  },

  "head_to_head_last_5": [ { "date": "YYYY-MM-DD", "score": "H-A", "winner": "Home/Away/Draw" } ],

  "injuries": {
    "home_team": [ { "name": <string>, "status": "Questionable/Out/Unknown" } ],
    "away_team": [ { "name": <string>, "status": "Questionable/Out/Unknown" } ]
  },

  "sources_used": <array>,
  "data_gaps": <array>
}

${common}
`.trim();

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Generates sport-specific Perplexity prompt for data mining
 * @param {string} sport - Sport type (NFL, BASKETBALL, TENNIS, BASEBALL, HOCKEY, FOOTBALL)
 * @param {Object} matchData - Match data object containing team information
 * @returns {string} Complete prompt for Perplexity API
 */
export const getPerplexityPrompt = (sport, matchData) => {
    const { team1, team2, parse_confidence, parse_note } = extractTeams(matchData);
    const common = getCommonPerplexityRequirements();

    // Include context note if parsing was weak (helps search quality)
    const targetLine = `TARGET: ${team1} vs ${team2}${parse_confidence < 0.7 && parse_note ? ` (NOTE: ${parse_note})` : ''}`;

    switch (sport) {
        case 'NFL':
            return getNFLPrompt(targetLine, common);
        case 'BASKETBALL':
            return getBasketballPrompt(targetLine, common);
        case 'TENNIS':
            return getTennisPrompt(targetLine, common);
        case 'BASEBALL':
            return getBaseballPrompt(targetLine, common);
        case 'HOCKEY':
            return getHockeyPrompt(targetLine, common);
        case 'FOOTBALL':
        default:
            return getFootballPrompt(targetLine, common);
    }
};
