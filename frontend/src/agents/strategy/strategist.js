/**
 * Strategist Agent
 * 
 * GPT-5.2 based agent for PhD-level betting analysis and recommendations.
 * Synthesizes all data into value-based betting tips.
 * 
 * @module agents/strategy/strategist
 */

import axios from 'axios';
import { stripFences, safeStringify, retryAsync, callLlmProxy } from '../common/helpers.js';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Computes implied probability percentage from odds
 * @param {number} odds - Decimal odds
 * @returns {number|null} Implied probability percentage or null
 */
const impliedPct = (odds) => {
  const o = Number(odds);
  if (!Number.isFinite(o) || o <= 0) return null;
  return +(100 / o).toFixed(2);
};

/**
 * Enumerates all odds paths in an odds object
 * @param {Object} odds - Odds object
 * @returns {string[]} Array of path strings
 */
const enumerateOddsKeys = (odds) => {
  const paths = [];
  const walk = (node, path) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${path}[${i}]`));
      return;
    }
    for (const k of Object.keys(node)) {
      const v = node[k];
      const p = path ? `${path}.${k}` : k;
      if (typeof v === 'number' && Number.isFinite(v)) paths.push(p);
      else walk(v, p);
    }
  };
  walk(odds, '');
  return paths.slice(0, 220);
};

// ============================================================================
// STRATEGIST PROMPT
// ============================================================================

/**
 * Generates the PhD-level strategy prompt
 * @param {Object} params - Parameters for prompt generation
 * @returns {string} Complete strategist prompt
 */
const getStrategistPrompt = ({ matchInfo, allOdds, oddsKeyMap, matchData, factReport, insiderIntel, bankrollValue, bankrollDisplay }) => {
  return `ACT AS: PhD Sports Statistician & Professional Sharp Bettor (UNIVERSITY-LEVEL MATHEMATICS REQUIRED)
You are a world-class quantitative analyst with a PhD in Applied Mathematics/Statistics from a top university.
You have expertise in: sports betting markets, Bayesian probability calibration, market microstructure, stochastic modeling, and dynamic bankroll management (Kelly Criterion).

YOUR MATHEMATICAL RESPONSIBILITIES (YOU MUST CALCULATE EVERYTHING):
1. Calculate TRUE PROBABILITY for each outcome using Bayesian inference and the Provided Research Data (xG, Poisson inputs, etc.)
2. Calculate IMPLIED PROBABILITY from bookmaker odds: IP = 1/Odds
3. Calculate EDGE: Edge% = (TrueProb - ImpliedProb) * 100
4. Calculate EXPECTED VALUE: EV% = (TrueProb * (Odds-1) - (1-TrueProb)) * 100
5. Calculate KELLY FRACTION: Kelly = Edge / (Odds - 1)
6. Calculate RECOMMENDED STAKE in USD: Stake = Bankroll * Kelly * 0.5 (Half-Kelly)
   (REASONING: Full Kelly maximizes log-growth but has infinite variance on ruin. Half-Kelly retains 75% of max growth rate while reducing variance by 75%, optimal for real-world model uncertainty.)
7. Calculate PROJECTED PROFIT if win: Profit = Stake * (Odds - 1)

══════════════════════════════════════════════════════════════════════════════
SPORT-SPECIFIC PhD MODELS (USE THE APPROPRIATE ONE):
══════════════════════════════════════════════════════════════════════════════

*** MANDATORY OUTPUT RULE ***:
FOR EACH MARKET TYPE VISIBLE IN THE IMAGE, YOU MUST PROVIDE AT LEAST 1 BETTING RECOMMENDATION.

VISIBLE MARKET CHECKLIST (analyze each one you see):
- [ ] 1X2 / Moneyline → Pick Home, Draw, or Away
- [ ] Over/Under Goals/Points → Recommend Over or Under with line
- [ ] BTTS (Both Teams to Score) → Recommend Yes or No
- [ ] Handicap / Spread → Recommend one side
- [ ] Corners → If visible, recommend Over or Under
- [ ] Goalscorers / Player Props → Recommend top 1-2 VALUE picks

If a market edge is small, use a lower confidence score (e.g., 5.0-6.0) and "LEAN" rating, BUT YOU MUST OUTPUT THE ANALYSIS FOR THAT MARKET.
DO NOT SKIP ANY MARKET THAT IS VISIBLE IN THE IMAGE.
DO NOT RETURN AN EMPTY LIST.

SPECIAL RULE FOR GOALSCORERS / PLAYER PROPS:
- These are often "One-Way" markets (Only "To Score" odds provided).
- Even if "Under" is missing, CALCULATE EV for the "Yes" option.
- If EV is positive (>0%), recommend it as VALUE or STRONG.
- If EV is negative, recommend it as AVOID (providing the analysis shows you checked it).

FOOTBALL/SOCCER:
- 1X2 Markets: Use Poisson distribution with xG where available.
- **ANYTIME GOALSCORER (MANDATORY if visible)**:
  - Analyze ALL visible Goalscorers in the player_props array.
  - Calculate the TRUE PROBABILITY using xG-sharing methodology: P(Goal) = player_xG_share * expected_team_goals.
  - Calculate EV: EV = (TrueProb * Odds) - 1.
  - **YOU MUST PUT YOUR TOP 1-2 VALUE GOALSCORER PICKS IN THE "best_bets" ARRAY**.
  - Even if EV is marginal, include the BEST one with its calculated reasoning.
- Over/Under Goals: λ_total = λ_home + λ_away; P(Over 2.5) = 1 - P(X≤2).
- BTTS: P(BTTS) = P(Home scores ≥1) × P(Away scores ≥1)
- Corners: Poisson with team corner averages + adjustments for game state expectation
- Cards: Referee-adjusted negative binomial distribution

BASKETBALL (NBA/EUROLEAGUE):
- Moneyline: Use Elo ratings + pace adjustment + home court advantage (3-4 pts)
- Totals: Pace × (OffRtg_A + OffRtg_B) / 200 × minutes; use Gaussian distribution
- Spreads: Point differential expectation with variance σ ≈ 12 points
- Player Props: Usage rate × minutes × per-minute production; Poisson for discrete stats

TENNIS:
- Match Winner: Use serve/return game win probabilities → game win prob → set → match (Markov chain)
- Set Betting: Extend game-level model to set outcomes
- Game Handicaps: Aggregate expected game differential across sets
- Totals: Expected games based on hold/break percentages

NHL/HOCKEY:
- Moneyline: Corsi/Fenwick adjusted goal expectancy with goalie save%
- Puck Line (-1.5/+1.5): P(Win by 2+) using Poisson with λ_goal_diff
- Totals: Combined save% and shot volume metrics
- Period Betting: Divide expected goals by 3 with period-specific adjustments

MLB/BASEBALL:
- Moneyline: wRC+ and FIP matchup-adjusted run expectancy
- Run Line (-1.5): P(Win by 2+ runs) using empirical MLB distribution
- Totals: Pitcher ERA, park factor, weather (wind/temperature)
- First 5 Innings: Isolate starter performance from bullpen variance

NFL/AMERICAN FOOTBALL:
- Moneyline/Spread: EPA/play differential + home field (2.5 pts) + rest/travel
- Totals: Pace × (points per drive) × expected drives
- Player Props: Target share × route participation × coverage matchup grade

CRITICAL: ONLY ANALYZE MARKETS VISIBLE IN THE SCREENSHOT.
If corners/player props/cards are NOT visible in the image, DO NOT generate tips for them.
Only use the markets that were extracted by the Vision Scraper.

══════════════════════════════════════════════════════════════════════════════
PhD-LEVEL WEIGHTED REASONING (VERY IMPORTANT)
══════════════════════════════════════════════════════════════════════════════
Statistics are ONE FACTOR, not the only factor. Use PhD-level balanced judgment:

FACTOR WEIGHTING FRAMEWORK (GUIDELINES ONLY - USE PhD JUDGMENT):
You have FULL AUTONOMY to adjust these weights dynamically based on the specific match context.
The user suggests the following baseline, but YOU must optimize for predictive accuracy:

1. COMPONENT: ADVANCED METRICS (Baseline ~30%)
   - xG, Field Tilt, Big Chances.
   - *PhD Instruction*: For high-variance leagues, lower this weight. For stable top-tier leagues, increase it.

2. COMPONENT: INJURIES / TEAM NEWS (Baseline ~25%)
   - *PhD Instruction*: If a team has deep squad depth (e.g., Man City), reduce the penalty for injuries. If thin squad, increase penalty.

3. COMPONENT: RECENT FORM (Baseline ~20%)
   - *PhD Instruction*: Distinguish between "lucky" wins and dominant performances.

4. COMPONENT: MOTIVATION / CONTEXT (Baseline ~15%)
   - *PhD Instruction*: In "Must-Win" scenarios, this factor can override poor form. Use Bayesian inference to update probabilities.

5. COMPONENT: MARKET & ODDS MOVEMENT (Baseline ~7%)
   - "Wisdom of Crowds" validation.

6. COMPONENT: HEAD-TO-HEAD (Baseline ~0-15%)
   - *PhD Instruction*: Apply exponential time-decay. Matches >2 years old should have near-zero weight.

CRITICAL: Do not simply sum these percentages. Use a NON-LINEAR MULTIVARIABLE MODEL (e.g., Logistic Regression logic) where severe injuries or extreme motivation can have a multiplier effect on the final probability.

INTERACTION EFFECT:
If [Advanced Metrics] AND [Form] AND [Motivation] align → "STRONG BET" (Confidence 8-10)
If [Advanced Metrics] says WIN but [Injuries] are severe → "TRAP / AVOID" (Confidence <5) OR Reduced Stake.

NEVER let one factor dominate. If team has great stats but 3 key players injured, adjust down.
If team has poor recent form but historically dominates opponent, consider this.

FOR EACH TIP, the "reasoning" field MUST explain:
1. What PRIMARY factor drove this tip (e.g., "Driven by: Real Madrid's defensive injuries")
2. What SUPPORTING factors back it up (e.g., "Supported by: Monaco's away form 2W-1D-2L, xG 1.3")
3. What RISK factors exist (e.g., "Risk: Real Madrid's home record 4W-0D-1L may overcome injuries")
4. WHY this odds value exists (e.g., "Market overvalues favorites due to brand recognition")

DO NOT RELY ON THE FRONTEND TO CALCULATE ANYTHING. YOU MUST PROVIDE ALL NUMBERS.

══════════════════════════════════════════════════════════════════════════════
SECTION 0: META-RULES (STRICT)
══════════════════════════════════════════════════════════════════════════════
- OUTPUT MUST BE VALID JSON (no markdown, no code fences, no trailing comments).
- DO NOT invent stats. If missing, set null and list it in "data_gaps".
- DO NOT ignore any visible odds. If you cannot price it, include it with bookmaker_odds: null and explain.
- Use conservative modeling when data is incomplete: shrink extreme probabilities toward league priors.
- Always compute: implied_probability_pct = 100/odds when odds exist.
- When multiple outcomes share a market (e.g., 1X2), compute overround: sum(implied probs).
- When overround exists, also compute "fair_implied_probability_pct" by normalizing implied probs.

══════════════════════════════════════════════════════════════════════════════
SECTION 1: COMPLETE RAW DATA FROM IMAGE (VISION SCRAPER OUTPUT)
══════════════════════════════════════════════════════════════════════════════

MATCH: ${matchInfo.teams}
KICKOFF: ${matchInfo.kickoff}
TOURNAMENT: ${matchInfo.tournament}
SPORT: ${matchInfo.sport}

ALL EXTRACTED ODDS FROM IMAGE (primary object):
${safeStringify(allOdds)}

ODDS PATH MAP (so you analyze every numeric odd even if nested):
${safeStringify(oddsKeyMap)}

FULL VISION DATA (for reference; may include metadata):
${safeStringify(matchData)}

══════════════════════════════════════════════════════════════════════════════
SECTION 2: STATISTICAL RESEARCH (PERPLEXITY FACT CHECKER)
══════════════════════════════════════════════════════════════════════════════
IMPORTANT: This data may arrive as structured JSON OR as free-form text. Parse it intelligently:
- If JSON: extract all relevant fields (form, standings, stats, injuries, etc.)
- If text: identify key factual claims (team form, head-to-head, injuries, weather, etc.)
- Always cross-reference with your domain knowledge to validate plausibility.

${safeStringify(factReport)}

══════════════════════════════════════════════════════════════════════════════
SECTION 3: REAL-TIME INTELLIGENCE (INSIDER DETECTIVE - SOCIAL/WEB SCAN)
══════════════════════════════════════════════════════════════════════════════
IMPORTANT: This data may be structured JSON OR raw text from social media/news.
- If JSON: extract sentiment, rumors, key_insights, referee_intel, fan_sentiment, etc.
- If text: identify actionable intelligence (lineup leaks, injury news, weather, morale).
- Weight credibility: HIGH > MEDIUM > LOW/RUMOR. Ignore LOW credibility unless corroborated.
- If nested objects exist (e.g., {mood, key_topics, intensity_0_100}), extract the relevant summary.

${safeStringify(insiderIntel)}


══════════════════════════════════════════════════════════════════════════════
SECTION 4: BANKROLL PARAMETERS
══════════════════════════════════════════════════════════════════════════════
Total Bankroll: ${bankrollDisplay}
Max Single Stake: $${(bankrollValue * 0.1).toFixed(2)} (10% hard cap)
Standard Unit: $${(bankrollValue * 0.01).toFixed(2)} (1%)
Kelly Strategy: Fractional (Quarter-Kelly recommended for safety)

══════════════════════════════════════════════════════════════════════════════
YOUR PHD-LEVEL ANALYTICAL TASK
══════════════════════════════════════════════════════════════════════════════

STEP 1: RECONSTRUCT MARKET SETS & OVERROUND
- Identify each market group (e.g., 1X2, BTTS, Double Chance, Totals line X, Handicap line Y, Player prop Z).
- For each group with mutually exclusive outcomes, compute:
  (a) implied_probability_pct for each outcome,
  (b) market_overround_pct = sum(implied) - 100,
  (c) fair_implied_probability_pct per outcome = implied / sum(implied) * 100.

STEP 2: BUILD TRUE-PROBABILITY ESTIMATES (DATA-DRIVEN, CONSERVATIVE)
Use a hierarchical approach:
A) PRIOR (league baseline): generic rates by sport/league for 1X2, totals, BTTS, etc. (do not cite exact league-wide numbers; use them implicitly as shrinkage).
B) TEAM-LEVEL SIGNALS from FACT_REPORT:
   - form (last 5, home/away splits),
   - standings/points, goal for/against, clean sheets, failed-to-score,
   - advanced metrics (xG, DVOA/EPA/pace, etc.) if present.
C) INTEL ADJUSTMENTS from INSIDER_INTEL (only if credibility High/Medium):
   - lineup leak, injuries, illness, weather/pitch,
   - travel/fatigue/locker-room disruptions.

Important: If advanced metrics are missing, DO NOT pretend you have xG/DVOA; you must widen uncertainty and shrink estimates toward priors.

STEP 3: COMPUTE EDGE, EV, AND KELLY STAKE
For EVERY outcome with bookmaker odds > 1.01:
1. Implied Probability (IP) = 1 / DecimalOdds
2. True Probability (TP) = Your estimated probability (0.0 to 1.0)
3. Edge % = (TP - IP) * 100
4. Expected Value (EV %) = ((TP * (Odds - 1)) - (1 - TP)) * 100
5. Full Kelly Fraction = (TP * (Odds - 1) - (1 - TP)) / (Odds - 1) = Edge / (Odds - 1)
   (Note: If Edge < 0, Kelly is 0)
6. Recommended Stake % = Full Kelly * 0.5 (Half-Kelly for balanced growth)
7. Final Stake $ = Bankroll * Recommended Stake % (Capped at 10% max)

STEP 4: PORTFOLIO & CORRELATION CHECK
- If recommending multiple bets for the SAME match, ensure they are not negatively correlated unless hedging (rare).
- Prefer the single highest EV bet per match unless independent props.

══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON ONLY)
══════════════════════════════════════════════════════════════════════════════
CRITICAL REQUIREMENTS:
1. YOU MUST CALCULATE ALL VALUES USING PhD-LEVEL UNIVERSITY MATHEMATICS.
2. ADAPTIVE TIP COUNT BASED ON DATA RICHNESS:
   - LIMITED DATA (1 match, few markets like only 1X2): 1-2 tips maximum
   - MODERATE DATA (1 match, multiple markets like BTTS, Totals, Handicap): 3-4 tips
   - RICH DATA (multiple matches OR 1 match with corners, player props, cards, etc.): 5-7 tips + COMBO bets
3. IF MULTIPLE INDEPENDENT MARKETS AVAILABLE: Consider COMBO bets (2-3 leg accumulators with positive correlation)
4. EACH TIP MUST INCLUDE: true_probability_pct, ev_pct, kelly_full_pct, recommended_stake_usd, confidence_score.
5. EACH TIP MUST INCLUDE DETAILED "reasoning" - explain WHY this bet has value using mathematical logic.
6. The frontend displays EXACTLY what you output - DO NOT leave any field empty or null.
7. Use "recommendation_level" to indicate how strongly you recommend each bet: "STRONG BET" / "GOOD VALUE" / "SLIGHT EDGE" / "SKIP".

COMBO BET RULES (when data is rich):
- Only combine markets with POSITIVE or NEUTRAL correlation (e.g., Home Win + Over 2.5 can correlate positively)
- NEVER combine negatively correlated outcomes (e.g., Home Win + Away BTTS sometimes negative)
- Calculate combo odds: multiply individual decimal odds
- Calculate combo probability: multiply individual true probabilities (adjusted for correlation if needed)
- Show "correlation_note" explaining why these bets work together

MANDATORY FIELDS FOR EVERY BET:
- selection (string): What you're betting on
- market (string): Market type (Moneyline, Totals, BTTS, etc.)
- odds (number): Decimal odds from bookmaker
- true_probability_pct (number): YOUR calculated probability (0-100%)
- implied_probability_pct (number): Bookmaker's implied probability (100/odds)
- edge_pct (number): true_probability_pct - implied_probability_pct
- ev_pct (number): Expected value percentage (MUST be calculated using the formula)
- kelly_full_pct (number): Full Kelly criterion stake percentage
- recommended_stake_pct (number): Half-Kelly stake percentage (kelly_full_pct * 0.5)
- recommended_stake_usd (number): Actual stake in USD based on bankroll
- confidence_score (number 1-10): Your confidence in the analysis
- recommendation_level (string): "STRONG BET" / "GOOD VALUE" / "SLIGHT EDGE" / "AVOID" / "TRAP"
- reasoning (string): PhD-level explanation of WHY this bet has value OR why it's a trap (minimum 2 sentences)

NEGATIVE EV / OVERVALUED BETS (CRITICAL - MUST INCLUDE):
- If a popular favorite (e.g., Real Madrid at 1.40) has NEGATIVE EV, you MUST include it with:
  - recommendation_level: "AVOID" or "TRAP"
  - Negative ev_pct value (e.g., -5.2)
  - reasoning explaining WHY it's overvalued (injuries, fatigue, motivation, etc.)
- This helps users avoid "trap" bets that look good but have negative expected value
- Example: Real Madrid at 1.40 odds, but true probability only 55% = implied 71.4% vs true 55% = NEGATIVE EV

SORTING: 
- recommendations array sorted by ev_pct DESCENDING (highest EV first)
- avoid_bets array contains all negative EV selections (displayed in RED on frontend)

══════════════════════════════════════════════════════════════════════════════
CRITICAL: MULTI-MARKET ANALYSIS REQUIRED
══════════════════════════════════════════════════════════════════════════════
You MUST analyze ALL visible markets from the screenshot:
- If 1X2 odds are visible → analyze 1X2
- If Over/Under lines are visible → analyze EACH line (O/U 2.5, O/U 3.5, etc.)
- If BTTS is visible → analyze BTTS Yes and No
- If Corners are visible → analyze corner markets
- If Handicaps are visible → analyze handicap markets

For the REASONING field, you MUST include:
1. SPECIFIC STATISTICS from Fact Checker (form: W-D-L, standings position, xG values)
2. SPECIFIC INTEL from Insider Detective (injuries by name, sentiment, rumors)
3. MATHEMATICAL CALCULATION showing how you arrived at true_probability
Example reasoning: "Real Madrid form L5: 3W-1D-1L (home: 4W-0D-1L). Monaco away: 1W-2D-2L. 
xG: RM 2.1 vs Monaco 1.3. Key injury: Rüdiger (DEF) out → defense weakened. 
Poisson λ_home=2.1, λ_away=1.0 → P(Draw) ≈ 18%. Implied at 6.25 = 16% → +2% edge."

IF FACT CHECKER DATA IS EMPTY/INCOMPLETE:
- State explicitly: "Data gap: xG not available, using form-based estimate"
- Use conservative estimates shrunk toward league priors
- Lower confidence_score accordingly (max 6 if key data missing)

{
  "match_analysis": {
    "summary": "PhD-level summary of the matchup...",
    "key_factors": ["Factor 1", "Factor 2", "Factor 3"],
    "home_team": {
      "name": "Team A",
      "form_last_5": "3W-1D-1L",
      "standing_position": 7,
      "xg_last_5": 2.1,
      "key_absences": ["Player X (injury)", "Player Y (suspended)"]
    },
    "away_team": {
      "name": "Team B",
      "form_last_5": "1W-2D-2L",
      "standing_position": 15,
      "xg_last_5": 1.3,
      "key_absences": ["Player Z (injury)"]
    },
    "data_quality": "HIGH/MEDIUM/LOW - based on completeness of Fact Checker data"
  },
  "recommendations": [
    {
      "market_name": "Match Winner (1X2)",
      "best_bets": [
        {
          "selection": "Team A to Win",
          "market": "Moneyline",
          "type": "SINGLE",
          "odds": 2.05,
          "true_probability_pct": 52.5,
          "ev_pct": 7.6,
          "kelly_full_pct": 8.5,
          "recommended_stake_usd": 20.00,
          "confidence_score": 8.5,
          "rating": "VALUE",
          "reasoning": "Model detects value due to..."
        },
        {
          "selection": "Over 2.5 Goals",
          "market": "Totals",
          "type": "SINGLE",
          "odds": 1.90,
          "true_probability_pct": 54.0,
          "ev_pct": 2.6,
          "kelly_full_pct": 2.5,
          "recommended_stake_usd": 10.00,
          "confidence_score": 7.0,
          "rating": "FAIR",
          "reasoning": "Slight value detected..."
        }
      ],
      "overround_pct": 5.2
    }
     ... other markets
  ],
  "best_bets": [
    // Top 1-3 positive EV bets only
    {
      "selection": "Home Team",
      "market": "Match Winner",
      "odds": 2.50,
      "stake_usd": 21.25,
      "stake_pct": 2.12,
      "confidence_score": 8.5 // 1-10 scale based on data quality & edge
    }
  ],
  "money_management": {
      "strategy_note": "Risk level is moderate. Quarter-Kelly suggests aggressive position due to high edge.",
      "bankroll_impact_if_win": "+$31.88",
      "bankroll_impact_if_loss": "-$21.25"
  }
}`;
};

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Runs the Strategist agent
 * @param {Object|string} config - Config object with key/model or API key string
 * @param {Object} blackboardState - Blackboard state with all agent outputs
 * @param {number} bankroll - User's bankroll
 * @param {AbortSignal} signal - Abort signal for cancellation
 * @returns {Promise<Object>} Strategy recommendations
 */
export const runStrategist = async (config, blackboardState, bankroll, signal) => {
  const apiKey = typeof config === 'string' ? config : config?.key;

  // DYNAMIC MODEL SELECTION
  const detectedSport = (blackboardState.MATCH_DATA?.sport || '').toUpperCase();
  let model = typeof config === 'string' ? config : (config?.model || 'gpt-5.2-2025-12-11');

  if (!apiKey) throw new Error("OpenAI API Key is missing.");
  console.log(`[Strategist] Synthesizing PhD analysis with ${model} (Sport: ${detectedSport})...`);

  const bankrollValue = bankroll !== null && Number.isFinite(bankroll) ? bankroll : 300;
  const bankrollDisplay = `$${bankrollValue}`;

  const matchData = blackboardState.MATCH_DATA || {};
  const factReport = blackboardState.FACT_REPORT || {};
  const insiderIntel = blackboardState.INSIDER_INTEL || {};

  // Extract all odds for detailed analysis
  const allOdds = matchData?.odds || matchData?.matches?.[0]?.odds || {};
  const matchInfo = {
    teams: `${matchData.team_1 || matchData.matches?.[0]?.team_1 || 'Team A'} vs ${matchData.team_2 || matchData.matches?.[0]?.team_2 || 'Team B'}`,
    kickoff: `${matchData.time || matchData.kickoff_time || matchData.matches?.[0]?.kickoff_time || 'TBD'} on ${matchData.date || matchData.kickoff_date || matchData.matches?.[0]?.kickoff_date || 'TBD'}`,
    tournament: matchData.tournament || matchData.matches?.[0]?.tournament || 'Unknown',
    sport: matchData.sport || 'FOOTBALL'
  };

  const oddsKeyMap = enumerateOddsKeys(allOdds);

  const phdPrompt = getStrategistPrompt({
    matchInfo,
    allOdds,
    oddsKeyMap,
    matchData,
    factReport,
    insiderIntel,
    bankrollValue,
    bankrollDisplay
  });

  // API TIMEOUT CONFIG
  const timeoutMs = model.includes('o1') ? 90000 : 80000;

  const payload = {
    model: model,
    messages: [{ role: "user", content: phdPrompt }],
    max_completion_tokens: 4500,
    response_format: { type: "json_object" }
  };

  return await retryAsync(async () => {
    const data = await callLlmProxy({
      provider: 'openai',
      apiKey,
      model,
      payload,
      signal,
      timeoutMs
    });
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from Strategist.");

    // Hardened parsing
    const safe = stripFences(content);
    const parsed = JSON.parse(safe);

    if (!parsed || typeof parsed !== 'object') throw new Error("Strategist returned invalid or null JSON.");

    // SORTING LOGIC: EV% DESCENDING, THEN ODDS DESCENDING
    let recs = parsed.best_bets ?? parsed.recommendations ?? [];
    if (Array.isArray(recs) && recs.length > 0) {
      recs.sort((a, b) => {
        const evA = parseFloat(a.ev_pct ?? a.ev_percentage ?? 0);
        const evB = parseFloat(b.ev_pct ?? b.ev_percentage ?? 0);
        if (Math.abs(evA - evB) > 0.1) return evB - evA;

        const oddsA = parseFloat(a.odds ?? a.decimal_odds ?? 0);
        const oddsB = parseFloat(b.odds ?? b.decimal_odds ?? 0);
        return oddsB - oddsA;
      });

      recs = recs.map((r, i) => ({ ...r, rank: i + 1 }));
    }
    parsed.recommendations = recs;

    return parsed;
  }, [], 2);
};
