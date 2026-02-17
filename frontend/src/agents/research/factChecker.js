/**
 * Fact Checker Agent
 * 
 * Perplexity-based agent for fetching match data and statistics.
 * Enhanced with full match data and PhD-level research.
 * 
 * @module agents/research/factChecker
 */

import axios from 'axios';
import { tryParseJson, safeStringify, isAbortError, retryAsync } from '../common/helpers.js';
import { getPerplexityPrompt } from '../common/prompts/perplexity.js';

// ============================================================================
// GEMINI SEARCH HELPERS
// ============================================================================

/**
 * Normalizes Gemini Grounding response
 */
const normalizeGeminiResponse = (res, query) => {
  // Gemini 2.0 returns candidates[0].content.parts[0].text
  // Grounding metadata is in candidates[0].groundingMetadata
  const candidate = res?.data?.candidates?.[0];
  if (!candidate) return { raw_content: "Gemini Error: No candidates returned.", data_gaps: ["No response"] };

  const textPart = candidate.content?.parts?.find(p => p.text)?.text || "";
  const grounding = candidate.groundingMetadata;

  // Extract chunks or web search results if available
  const chunks = grounding?.groundingChunks?.map(c => c.web?.uri ? `[${c.web.title}](${c.web.uri})` : null).filter(Boolean) || [];

  // Attempt to parse JSON if the text part contains json block
  const jsonMatch = textPart.match(/```json\n([\s\S]*?)\n```/) || [null, textPart];
  const parsed = tryParseJson(jsonMatch[1] || textPart);

  if (parsed && typeof parsed === 'object') {
    return {
      ...parsed,
      ppx_citations: chunks, // Map to same field for compatibility
      raw_content: textPart,
      source_engine: "GEMINI_SEARCH"
    };
  }

  return {
    raw_content: textPart,
    ppx_citations: chunks,
    quality_warning: "Gemini response was unstructured.",
    data_gaps: ["Unstructured response"],
    source_engine: "GEMINI_SEARCH"
  };
};

/**
 * Runs Gemini with Google Search Grounding
 */
const runGeminiResearch = async (config, query, signal) => {
  const apiKey = typeof config === 'string' ? config : config?.key;
  const model = typeof config === 'string' ? 'gemini-2.0-flash' : (config?.model || 'gemini-2.0-flash');

  console.log(`[Fact Checker] Fetching data with Gemini Grounding (${model})...`);

  const payload = {
    contents: [{ parts: [{ text: query }] }],
    tools: [{ google_search_retrieval: { dynamic_retrieval_config: { mode: "MODE_DYNAMIC", dynamic_threshold: 0.3 } } }],
    generationConfig: { response_mime_type: "application/json" } // Force JSON
  };

  return await retryAsync(async () => {
    // Direct call to Netlify proxy which handles the googleapis.com routing
    const res = await axios.post(`/api/gemini/models/${model}:generateContent?key=${apiKey}`, payload, {
      headers: { 'Content-Type': 'application/json' },
      signal
    });
    return normalizeGeminiResponse(res, query);
  }, [], 2);
};

// ============================================================================
// PROMPTS
// ============================================================================

/**
 * Player props specific prompt
 * @param {string} sport - Sport type
 * @param {Object} matchData - Match data
 * @returns {string} Player props prompt
 */
const getPlayerPropsPrompt = (sport, matchData) => `
ROLE: PLAYER STATS SPECIALIST (${sport}) — FACTS-ONLY, NO ODDS-BASED PREDICTIONS
TARGET MATCH: ${matchData.team_1} vs ${matchData.team_2}
DETECTED PROPS: ${safeStringify(matchData.extracted_props || matchData.odds?.player_props || [])}

TASK:
- Identify each player in DETECTED PROPS (resolve full name + team).
- Fetch the MOST RELEVANT stats that map to the prop type (goals/shots/points/assists/rebounds, etc.).
- Provide split stats: season, last 5, last 10 (if available), vs opponent (if sample exists), and role/usage.
- Provide minutes expectation using the most recent lineup/rotation info.

STRICT RULES:
- NO betting picks, NO "value", NO "should bet".
- If a stat is unavailable, use null (do not fabricate).
- If you rely on a source, mention it briefly inside "sources_used" (URLs not needed).

OUTPUT JSON ONLY:
{
  "player_analysis": [
    {
      "name": "Player Name",
      "team": "Team",
      "prop": { "market": "Shots", "line": 2.5, "side": "OVER/UNDER/null" },
      "season_avg": <float|null>,
      "last_5_games_avg": <float|null>,
      "last_10_games_avg": <float|null>,
      "vs_opponent_avg": <float|null>,
      "minutes_expected": <int|null>,
      "role_note": "e.g., starter, usage spike due to injuries",
      "injury_status": "Fit/Questionable/Out/Unknown",
      "sources_used": ["source name 1", "source name 2"]
    }
  ]
}
`.trim();

/**
 * List/bulk mode prompt
 * @param {string} sport - Sport type
 * @param {Object} matchData - Match data
 * @returns {string} List mode prompt
 */
const getListModePrompt = (sport, matchData) => `
ROLE: BULK FACT SCRAPER (${sport}) — NO PREDICTIONS
TARGETS: ${safeStringify(matchData.matches)}
TASK:
- For EACH listed match, fetch: standings position/points (if league), recent form (W/D/L last 5), key injuries/suspensions,
  and at least one advanced metric if available for that sport (xG/ELO/DVOA/EPA/pace, etc.).
- If an advanced metric is unavailable, set it to null and explain in "data_gaps".

OUTPUT JSON ONLY:
{
  "matches_data": [
    {
      "match": { "team_1": "", "team_2": "", "kickoff": "", "tournament": "" },
      "standings": { "home_pos": <int|null>, "away_pos": <int|null>, "home_points": <int|null>, "away_points": <int|null> },
      "form_guide": { "home_last_5": ["W","D","L","W","W"], "away_last_5": ["W","W","D","L","W"] },
      "injuries": { "home_team": [], "away_team": [] },
      "advanced_metrics": { "primary_metric_name": "", "home": <float|null>, "away": <float|null> },
      "sources_used": ["..."],
      "data_gaps": ["..."]
    }
  ]
}
`.trim();

/**
 * Single match deep research prompt
 * @param {string} sport - Sport type
 * @param {Object} matchData - Match data
 * @returns {string} Single match prompt
 */
const getSingleMatchPrompt = (sport, matchData) => {
  const sportPrompt = getPerplexityPrompt(sport, matchData);
  const kickoffTime = matchData.time || matchData.kickoff_time || matchData.kickoff_time?.raw || 'Unknown';
  const kickoffDate = matchData.date || matchData.kickoff_date || matchData.kickoff_date?.iso || matchData.kickoff_date?.raw || 'Unknown';
  const tournament = matchData.tournament || matchData.tournament?.raw || 'Unknown';

  const visionQueries = matchData.perplexity_search_instructions?.fact_checker_queries || [];
  const mathQueries = matchData.perplexity_search_instructions?.mathematical_data_queries || [];
  const criticalData = matchData.perplexity_search_instructions?.critical_data_needed || [];

  const visionSection = visionQueries.length > 0 ? `
══════════════════════════════════════════════════════════════════════════════
🔬 VISION SCRAPER GENERATED QUERIES (EXECUTE THESE FIRST):
══════════════════════════════════════════════════════════════════════════════
${visionQueries.map((q, i) => `${i + 1}. ${q}`).join('\n')}

MATHEMATICAL DATA FOR PhD MODELING (MANDATORY):
${mathQueries.map(q => `• ${q}`).join('\n')}

CRITICAL DATA NEEDED FOR PROBABILITY CALCULATION:
${criticalData.map(d => `• ${d}`).join('\n')}
` : '';

  return `
${sportPrompt}

══════════════════════════════════════════════════════════════════════════════
EVENT-SPECIFIC CONTEXT (EXTRACTED FROM BETTING SCREENSHOT)
══════════════════════════════════════════════════════════════════════════════
- MATCH: ${matchData.team_1 || matchData.matches?.[0]?.team_1 || 'Unknown'} vs ${matchData.team_2 || matchData.matches?.[0]?.team_2 || 'Unknown'}
- KICKOFF: ${kickoffTime} on ${kickoffDate}
- TOURNAMENT: ${tournament}
- DETECTED ODDS: ${safeStringify(matchData.odds || {})}
- DETECTED MARKETS: ${Object.keys(matchData.odds || {}).join(', ') || 'Unknown'}

══════════════════════════════════════════════════════════════════════════════
PhD-LEVEL DEEP RESEARCH MANDATE
══════════════════════════════════════════════════════════════════════════════
${visionSection}
YOU MUST search for MAXIMUM DEPTH data on this SPECIFIC event:

1) FORM ANALYSIS (MANDATORY):
   - Last 5 results with exact scores (not just W/D/L)
   - Home/Away splits separately (last 5 each)
   - Goals scored/conceded trend

2) ADVANCED METRICS (SEARCH HARD):
   - xG (Expected Goals) for last 5 matches if football/soccer
   - xGA (Expected Goals Against) if available
   - If no xG found, explicitly state: "xG data unavailable"

3) HEAD-TO-HEAD (LAST 5 MEETINGS):
   - Date, venue, score, notable events (red cards, penalties)

4) INJURY/SUSPENSION REPORT (CRITICAL):
   - Search team official sources + beat writers
   - List EVERY known absent player with reason
   - Doubtful/Questionable status players

5) TACTICAL/STYLE INSIGHT:
   - Formation typical for each team
   - Playing style (possession%, PPDA, pressing intensity)
   - Set-piece conversion rates if available

6) REFEREE ANALYSIS (if assigned):
   - Cards per game average
   - Penalty rate
   - Known tendencies

7) MOTIVATION CONTEXT:
   - League position implications
   - Cup qualification/relegation stakes
   - Rivalry history

DO NOT GUESS. If data is unavailable, use null and add to "data_gaps".

OUTPUT JSON ONLY:
{
  "match_context": { "stadium": <string|null>, "referee_name": <string|null>, "referee_stats": { "cards_per_game": <float|null>, "penalty_rate": <float|null> }, "weather_forecast": <string|null> },
  "standings": { "home_pos": <int|null>, "away_pos": <int|null>, "home_points": <int|null>, "away_points": <int|null>, "home_goal_diff": <int|null>, "away_goal_diff": <int|null> },
  "form_guide": { 
    "home_last_5": ["W 2-1", "D 1-1", "L 0-2", "W 3-0", "W 1-0"], 
    "away_last_5": [...],
    "home_home_last_5": [...],
    "away_away_last_5": [...]
  },
  "head_to_head_last_5": [ { "date": "YYYY-MM-DD", "venue": "Home/Away/Neutral", "score": "H-A", "notable": "red card/penalty/etc" } ],
  "injuries": { 
    "home_team": [{ "player": "...", "status": "Out/Doubtful", "reason": "..." }], 
    "away_team": [...] 
  },
  "advanced_metrics": { 
    "home_xg_last_5": <float|null>, "away_xg_last_5": <float|null>,
    "home_xga_last_5": <float|null>, "away_xga_last_5": <float|null>,
    "home_possession_avg": <float|null>, "away_possession_avg": <float|null>,
    "home_ppda": <float|null>, "away_ppda": <float|null>
  },
  "tactical_profile": {
    "home_formation": <string|null>, "away_formation": <string|null>,
    "home_style": <string|null>, "away_style": <string|null>
  },
  "motivation_context": <string|null>,
  "sources_used": ["..."],
  "data_gaps": ["..."]
}
`.trim();
};

// ============================================================================
// RESPONSE NORMALIZATION
// ============================================================================

/**
 * Normalizes Perplexity response, keeping citations
 * @param {Object} res - Axios response
 * @returns {Object} Normalized response
 */
const normalizePerplexityResponse = (res) => {
  const content = res?.data?.choices?.[0]?.message?.content ?? '';
  const citations = res?.data?.citations || [];
  const parsed = tryParseJson(content);

  if (parsed && typeof parsed === 'object') {
    return {
      ...parsed,
      ppx_citations: citations,
      raw_content: content
    };
  }

  return {
    raw_content: content,
    ppx_citations: citations,
    quality_warning: "Perplexity response was unstructured or not valid JSON.",
    data_gaps: ["Unstructured response; could not parse JSON reliably."]
  };
};

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Runs the Fact Checker agent
 * @param {Object|string} config - Config object with key/model or API key string
 * @param {Object} matchData - Match data from Vision agent
 * @param {AbortSignal} signal - Abort signal for cancellation
 * @returns {Promise<Object>} Fact check results
 */
export const runFactChecker = async (config, matchData, signal) => {
  const apiKey = typeof config === 'string' ? config : config?.key;
  const provider = config?.provider || 'perplexity'; // Default to perplexity
  const model = typeof config === 'string' ? 'sonar-pro' : (config?.model || 'sonar-pro');

  if (!apiKey) throw new Error(`${provider.toUpperCase()} API Key is missing.`);

  const sport = matchData.sport || 'FOOTBALL';
  const isList = matchData.mode === 'LIST';
  const isPlayerProps = matchData.market_type === 'PLAYER_PROPS';

  // Build query based on mode
  let query;
  if (isPlayerProps) {
    query = getPlayerPropsPrompt(sport, matchData);
  } else if (isList) {
    query = getListModePrompt(sport, matchData);
  } else {
    query = getSingleMatchPrompt(sport, matchData);
  }

  // --- GEMINI BRANCH ---
  if (provider === 'gemini') {
    try {
      return await runGeminiResearch(config, query, signal);
    } catch (e) {
      if (isAbortError(e, signal)) throw new DOMException('Aborted', 'AbortError');
      throw new Error(`Gemini Research Failed: ${e.message}`);
    }
  }

  // --- PERPLEXITY BRANCH (Legacy) ---
  console.log(`[Fact Checker] Fetching data with Perplexity ${model}...`);

  const payload = { model: model, messages: [{ role: "user", content: query }] };

  try {
    return await retryAsync(async () => {
      const res = await axios.post('/api/perplexity/chat/completions', payload, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal
      });
      return normalizePerplexityResponse(res);
    }, [], 2);

  } catch (e) {
    if (isAbortError(e, signal)) {
      throw new DOMException('Aborted', 'AbortError');
    }

    // AUTO-HEALING: If request failed and we weren't already using sonar-pro, try fallback
    if (model !== 'sonar-pro') {
      console.warn(`[Fact Checker] Model ${model} failed. Auto-healing with sonar-pro...`);
      try {
        const fallbackPayload = { ...payload, model: 'sonar-pro' };
        const res = await axios.post('/api/perplexity/chat/completions', fallbackPayload, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          signal
        });

        return normalizePerplexityResponse(res);
      } catch (retryError) {
        throw new Error(`Fact Checker Failed (Auto-heal attempt failed): ${retryError.message}`);
      }
    }

    throw new Error(`Fact Checker Failed: ${e.message}`);
  }
};
