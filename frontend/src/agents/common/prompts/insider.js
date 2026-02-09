/**
 * Insider Intel Prompts
 * 
 * Sport-specific prompts for the Insider Detective agent.
 * Focuses on social media, forums, and insider information.
 * 
 * @module agents/common/prompts/insider
 */

import { extractTeams } from '../teamExtractor.js';

// ============================================================================
// OUTPUT FORMAT
// ============================================================================

/**
 * Standard JSON output format for insider intel
 */
const OUTPUT_FORMAT = `OUTPUT JSON ONLY:
{
  "rumors": [
    {
      "content": "RUMOR: [Specific claim with concrete detail: WHO/WHAT/WHEN/WHERE]",
      "source": "[Direct link or handle + platform, e.g. '@beatwriter' on X, 'r/nfl thread', 'team forum']",
      "timestamp_utc": "YYYY-MM-DDTHH:MM:SSZ",
      "credibility": "High/Medium/Low",
      "credibility_basis": [
        "[Why: e.g. 'verified beat reporter', 'multiple independent mentions', 'photo evidence', 'anonymous ITK only']"
      ],
      "cross_checks": {
        "independent_mentions": <int>,
        "contradictions_found": <bool>,
        "official_status": "[Confirmed/Denied/Unaddressed]"
      }
    }
  ],
  "sentiment": {
    "home": {
      "mood": "[confident/nervous/angry/hopeful]",
      "key_topics": ["[injury fear]", "[coach out?]", "[lineup leak]", "[travel fatigue]"],
      "intensity_0_100": <int>
    },
    "away": {
      "mood": "[confident/nervous/angry/hopeful]",
      "key_topics": ["[injury fear]", "[rotation]", "[motivation]", "[internal drama]"],
      "intensity_0_100": <int>
    }
  },
  "weather_insider": {
    "summary": "[Local observer notes if any]",
    "details": { "wind_note": "[...]", "precip_note": "[...]", "pitch_surface_note": "[...]" },
    "evidence": ["[who said it + where]"]
  },
  "referee_note": {
    "assigned_referee": "[name if known]",
    "strictness_profile": "[lenient/average/strict]",
    "controversy_history": "[any prior flashpoints relevant to these teams]",
    "evidence": ["[who said it + where]"]
  },
  "key_insights": [
    "[Psychological edge: e.g. 'fans expect rotation after midweek']",
    "[Tactical leak: e.g. 'likely switch to 3-5-2 per local journos']"
  ],
  "risk_flags": [
    "[High-impact unverified rumor]",
    "[Coordinated misinformation pattern]",
    "[Old news being recycled]"
  ],
  "ev_impact_guidance": "LOW_WEIGHT (Context Only) - Do NOT shift odds significantly based on this unless 'official_status' is Confirmed."
}`;

// ============================================================================
// SPORT-SPECIFIC PROMPTS
// ============================================================================

/**
 * NFL insider intel prompt
 * @param {string} targetLine - Target match line
 * @returns {string} NFL insider prompt
 */
const getNFLInsiderPrompt = (targetLine) => `ROLE: NFL INSIDER INTEL COLLECTOR (NO ANALYSIS, EVIDENCE-FIRST)
${targetLine}
TASK: Mine *credible* social + local reporting for pre-game hidden info.

PRIMARY SOURCES TO CHECK (PRIORITIZE IN ORDER):
1) Verified beat writers + credentialed reporters covering each team (practice reports, travel, presser quotes)
2) Official injury reports + practice participation notes (DNP/LP/FP) — look for inconsistencies vs chatter
3) r/nfl + team subreddits (use ONLY if they reference real links/screenshots)
4) Team forums/Discord leaks (tag as LOW unless independently verified)

LOOK FOR HIGH-LEVERAGE SIGNALS ("GOSSIP" BUT WITH EVIDENCE):
- Hidden injuries: player limited in practice despite "not listed" or "questionable" downplayed
- Snap/role changes: RB committee pivot, WR target share shift, TE usage leak
- QB confidence / OC friction: reported "players-only meeting", sideline arguments, audible changes
- OL/DL shuffles: new starter at LT/CB, emergency elevations, practice squad call-ups
- Travel + schedule fatigue: short week, cross-country, late arrival, illness reports
- Weather micro-effects: stadium-specific wind patterns, gusts, precipitation intensity at kickoff
- "Starter confirmation": inactive hints, warmup limitations, pitch count for returning QB

CITE SOURCES *FOR EACH RUMOR* (handles, thread, timestamp). If no credible citation, still list it but mark credibility LOW.
${OUTPUT_FORMAT}`;

/**
 * Basketball insider intel prompt
 * @param {string} targetLine - Target match line
 * @returns {string} Basketball insider prompt
 */
const getBasketballInsiderPrompt = (targetLine) => `ROLE: BASKETBALL INSIDER INTEL COLLECTOR (NO ANALYSIS, SIGNAL EXTRACTION)
${targetLine}
TASK: Find high-impact availability + motivation information *before* it hits mainstream recaps.

PRIMARY SOURCES:
- Beat writers, team reporters, official shootaround notes, injury report updates
- Verified lineup aggregators + reputable insiders (timestamp everything)
- r/nba / Euroleague communities ONLY when linking to credible sources

LOOK FOR HIGH-LEVERAGE SIGNALS:
- Load management reality: "probable" but actually minutes-capped; "available" but "won't start"
- Back-to-back and travel fatigue: late flights, short rest, altitude, time zone effects
- Locker-room dynamics: coach-player tension, public criticism, closed-door meetings
- Rotation leaks: starting five changes, bench unit reshuffle, stagger patterns for stars
- Trade rumors: distraction indicators, "DNP—trade pending" hints, agent chatter
- Off-court distractions: nightlife rumors only if supported by multiple independent mentions (otherwise LOW)

REQUIRE: For each rumor, provide timestamp + source and state whether it's corroborated by at least 2 independent credible mentions.
${OUTPUT_FORMAT}`;

/**
 * Tennis insider intel prompt
 * @param {string} targetLine - Target match line
 * @returns {string} Tennis insider prompt
 */
const getTennisInsiderPrompt = (targetLine) => `ROLE: TENNIS INSIDER INTEL COLLECTOR (NO ANALYSIS, EVIDENCE-BASED)
${targetLine}
TASK: Scrape tennis social + forums for *fresh* health/conditioning + environment signals.

PRIMARY SOURCES:
- Credentialed tennis journos, official tournament accounts, pressers, practice-court observers
- Reputable fan accounts that post photos/videos from practice (evidence elevates credibility)
- Forums (e.g., Menstennisforums) ONLY as leads; must cross-check elsewhere

LOOK FOR HIGH-LEVERAGE SIGNALS:
- Injury reality vs PR: taped joints, limited serve motion, reduced sprinting, physio visits
- MTO context: tactical vs genuine (look for repeated patterns + post-match comments)
- Practice demeanor: visible limping, shortened sessions, frustration/tilt, coach talk intensity
- Equipment/environment: ball type complaints, court speed rumors, wind swirl notes
- Schedule + fatigue: late finishes, long 3-setters, heat/humidity stress, recovery timelines

STRICT RULE: If a claim lacks evidence (photo/video/verified report), tag credibility LOW and state why.
${OUTPUT_FORMAT}`;

/**
 * Baseball insider intel prompt
 * @param {string} targetLine - Target match line
 * @returns {string} Baseball insider prompt
 */
const getBaseballInsiderPrompt = (targetLine) => `ROLE: MLB CLUBHOUSE INTEL COLLECTOR (NO ANALYSIS, REAL-TIME AVAILABILITY)
${targetLine}
TASK: Capture late scratches, bullpen usage constraints, and pitcher health whispers.

PRIMARY SOURCES:
- Beat writers, lineup cards, pregame pressers, official team updates
- Pitching reporters + Statcast-focused accounts (velocity/watchlist)
- r/baseball only when linking to verified sources

LOOK FOR HIGH-LEVERAGE SIGNALS:
- Lineup: late scratch, "rest day" that's actually discomfort, platoon surprise
- Bullpen availability: who pitched last 2 days, who is "definitely down", closer usage
- Starter health: velo drop, command issues, "dead arm", skipped bullpen sessions
- Catcher situation: personal catcher preference, defensive catcher inserted (pitch-calling signal)
- Schedule traps: day game after night game, travel + time-zone, getaway day motivation
- Clubhouse quotes: manager frustration, "we need length from starter" hints

REQUIRE: Attach timestamped citation for each claim; if none, list as LOW credibility lead only.
${OUTPUT_FORMAT}`;

/**
 * Hockey insider intel prompt
 * @param {string} targetLine - Target match line
 * @returns {string} Hockey insider prompt
 */
const getHockeyInsiderPrompt = (targetLine) => `ROLE: NHL INSIDER INTEL COLLECTOR (NO ANALYSIS, STARTER CONFIRMATION FOCUS)
${targetLine}
TASK: Get goalie starter/line-combo info ahead of official confirmation.

PRIMARY SOURCES:
- Beat writers, morning skate notes, warmup confirmations, team PR accounts
- Reputable goalie-tracker accounts (must include timestamps)
- Team forums only as leads (LOW unless verified)

LOOK FOR HIGH-LEVERAGE SIGNALS:
- Starting goalie: confirmed starter vs "expected"; any late swaps during warmup
- Morning skate absences: illness/maintenance days, "upper-body" hints
- Flu/bug reports: multiple players "questionable", reduced minutes last game
- Line changes: top-line winger moved, defensive pairings swapped, PP unit change
- "Bad blood" carryover: prior fights, coach quotes about "response", physicality intent

Rule: Separate "confirmed" vs "expected" vs "rumor" in credibility_basis.
NOTE: This is 'Juicy News' context. Unless a starter is CONFIRMED out, this has LOW predictive weight.
${OUTPUT_FORMAT}`;

/**
 * Football (Soccer) insider intel prompt - default
 * @param {string} targetLine - Target match line
 * @param {string} sport - Sport type
 * @returns {string} Football insider prompt
 */
const getFootballInsiderPrompt = (targetLine, sport) => `ROLE: ELITE FOOTBALL INVESTIGATIVE INTEL COLLECTOR (NO PREDICTIONS)
${targetLine}
SPORT: ${sport}
TASK: Scrape X (Twitter), Reddit (r/soccer + team subs), and fan forums to extract *verifiable* pre-match intel.

PRIORITIZE SOURCES (TIERED):
- Tier 1: Verified journalists/club beat reporters, official club comms, press conference clips
- Tier 2: Reliable "ITK" accounts with proven hit-rate (must note track record + cross-check)
- Tier 3: Fan forums/Reddit speculation (LOW unless linked to evidence)

FIND HIGH-LEVERAGE INTEL ("DIRTY LAUNDRY" BUT EVIDENCE-FIRST):
- Dressing room issues: manager fallout, leadership conflict, "players-only meeting"
- Leaked XI / formation: credible ITKs, lineup aggregator hints, training-ground photos
- Training signals: who didn't train, who trained separately, rehab timeline contradictions
- Fan actions: protests, walkouts, boycotts, stadium disruptions (time/place specifics)
- Tactical leak: deep block/"bus parking", press trigger changes, set-piece focus
- Pitch conditions: waterlogged/frozen/long grass, complaints, drainage notes
- Referee assignment reaction: fear of strictness, past controversies, VAR chatter
- Travel + fatigue: late arrival, schedule congestion, rotation expectations

CITE SOURCES for everything (handle/thread/forum + timestamp).
IMPORTANT: This role is to find "DIRTY LAUNDRY" (plecskák/szaftos hírek).
- If it's just a tactical tweak, ignore it.
- If it's a manager sacking, a fight, a scandal, or a "leaked" crisis -> REPORT IT.
- MARK EV IMPACT AS LOW (Flavor/Context only) unless it is a confirmed key player absence.
${OUTPUT_FORMAT}`;

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Generates sport-specific insider intel prompt
 * @param {string} sport - Sport type (NFL, BASKETBALL, TENNIS, BASEBALL, HOCKEY, FOOTBALL)
 * @param {Object} matchData - Match data object containing team information
 * @returns {string} Complete prompt for insider intel collection
 */
export const getInsiderPrompt = (sport, matchData) => {
    const { team1, team2, parse_confidence, parse_note } = extractTeams(matchData);
    const targetLine = `TARGET: ${team1} vs ${team2}${parse_confidence < 0.7 && parse_note ? ` (NOTE: ${parse_note})` : ''}`;

    switch (sport) {
        case 'NFL':
            return getNFLInsiderPrompt(targetLine);
        case 'BASKETBALL':
            return getBasketballInsiderPrompt(targetLine);
        case 'TENNIS':
            return getTennisInsiderPrompt(targetLine);
        case 'BASEBALL':
            return getBaseballInsiderPrompt(targetLine);
        case 'HOCKEY':
            return getHockeyInsiderPrompt(targetLine);
        case 'FOOTBALL':
        default:
            return getFootballInsiderPrompt(targetLine, sport);
    }
};
