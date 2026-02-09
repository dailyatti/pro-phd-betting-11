/**
 * DeepSeek-Powered Text Parser for Manual Match Input
 * 
 * Uses DeepSeek AI to parse ANY text format containing match data
 * and converts it to the standard MatchData[] structure.
 * 
 * @module agents/textParser
 */

/**
 * Call DeepSeek API to parse unstructured text into match JSON.
 * 
 * @param {string} text - Raw user-pasted text in any format
 * @param {string} apiKey - DeepSeek API key
 * @param {string} model - DeepSeek model to use (default: deepseek-v3.2)
 * @returns {Promise<Array>} - Array of parsed MatchData objects
 */
export async function parseWithDeepSeek(text, apiKey, model = 'deepseek-v3.2') {
    if (!text || typeof text !== 'string' || !apiKey) {
        console.warn('[TextParser] Missing text or API key for DeepSeek parsing');
        return [];
    }

    const systemPrompt = `You are a betting data extraction AI. Your task is to parse raw text containing sports match data and extract structured information.

OUTPUT FORMAT (strict JSON array):
[
  {
    "team1": "Home Team Name",
    "team2": "Away Team Name", 
    "competition": "League/Tournament Name",
    "time": "HH:MM or TBD",
    "sport": "soccer|basketball|tennis|hockey|american_football|other",
    "homeOdds": 2.50,
    "drawOdds": 3.40,
    "awayOdds": 2.80,
    "overOdds": 1.73,
    "underOdds": 2.06,
    "overUnderLine": 2.5,
    "bttsYes": 1.46,
    "bttsNo": 2.55
  }
]

RULES:
1. Extract ALL matches found in the text
2. Parse odds as decimal numbers (e.g., 2.38, not "2.38")
3. Use null for missing/unknown odds
4. Recognize odds in any language (Hungarian: Hazai=Home, Döntetlen=Draw, Vendég=Away, Mindkét csapat gól=BTTS)
5. Default sport to "soccer" if unclear
6. Output ONLY valid JSON array, no explanations`;

    const userPrompt = `Parse this text and extract ALL match data as JSON:

${text}`;

    try {
        const response = await fetch('/api/deepseek/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.1,
                max_tokens: 4000,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            console.error('[TextParser] DeepSeek API error:', response.status);
            // Fallback to regex parser
            return parseManualTextInput(text);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Parse the JSON response
        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch {
            // Try to extract JSON from text
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                console.warn('[TextParser] Could not parse DeepSeek response, falling back to regex');
                return parseManualTextInput(text);
            }
        }

        // Handle both array and object with array property
        const matches = Array.isArray(parsed) ? parsed : (parsed.matches || []);

        // Normalize to expected format
        return matches.map((match, idx) => ({
            id: `deepseek-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
            team1: match.team1 || 'Unknown',
            team2: match.team2 || 'Unknown',
            homeTeam: match.team1 || match.homeTeam || 'Unknown',
            awayTeam: match.team2 || match.awayTeam || 'Unknown',
            competition: match.competition || match.league || 'Unknown',
            time: match.time || 'TBD',
            sport: match.sport || 'soccer',
            source: 'deepseek_parser',
            homeOdds: parseFloat(match.homeOdds) || null,
            drawOdds: parseFloat(match.drawOdds) || null,
            awayOdds: parseFloat(match.awayOdds) || null,
            overOdds: parseFloat(match.overOdds) || null,
            underOdds: parseFloat(match.underOdds) || null,
            overUnderLine: parseFloat(match.overUnderLine) || 2.5,
            bttsYes: parseFloat(match.bttsYes) || null,
            bttsNo: parseFloat(match.bttsNo) || null,
            markets: {
                moneyline: {
                    home: parseFloat(match.homeOdds) || null,
                    draw: parseFloat(match.drawOdds) || null,
                    away: parseFloat(match.awayOdds) || null
                },
                overUnder: {
                    line: parseFloat(match.overUnderLine) || 2.5,
                    over: parseFloat(match.overOdds) || null,
                    under: parseFloat(match.underOdds) || null
                },
                btts: {
                    yes: parseFloat(match.bttsYes) || null,
                    no: parseFloat(match.bttsNo) || null
                }
            },
            // ENGINE COMPATIBILITY: football.js expects odds.home, odds.draw, etc.
            odds: {
                home: parseFloat(match.homeOdds) || null,
                draw: parseFloat(match.drawOdds) || null,
                away: parseFloat(match.awayOdds) || null,
                over25: parseFloat(match.overOdds) || null,
                under25: parseFloat(match.underOdds) || null,
                bttsYes: parseFloat(match.bttsYes) || null,
                bttsNo: parseFloat(match.bttsNo) || null
            },
            isManualInput: true
        }));

    } catch (err) {
        console.error('[TextParser] DeepSeek parsing failed:', err);
        // Fallback to regex parser
        return parseManualTextInput(text);
    }
}

// ============== REGEX FALLBACK PARSER ==============

/**
 * Parse a single match block from the user's text format (regex fallback).
 */
function parseMatchBlock(block) {
    try {
        // Extract header: ### 1. **Liverpool - Manchester City** (Premier Liga, 17:30)
        const headerMatch = block.match(/###\s*\d+\.\s*\*\*(.+?)\s*-\s*(.+?)\*\*\s*\(([^,]+),?\s*(\d{1,2}:\d{2})?\)/i);
        if (!headerMatch) return null;

        const [, team1, team2, competition, time] = headerMatch;

        // Extract 1X2 odds
        const moneylineMatch = block.match(/1X2.*?Hazai\s*\*\*([\d.,]+)\*\*.*?Döntetlen\s*\*\*([\d.,]+)\*\*.*?Vendég\s*\*\*([\d.,]+)\*\*/i)
            || block.match(/1X2.*?Home\s*\*\*([\d.,]+)\*\*.*?Draw\s*\*\*([\d.,]+)\*\*.*?Away\s*\*\*([\d.,]+)\*\*/i);

        // Extract Over/Under 2.5 odds
        const ouMatch = block.match(/Over\/Under\s*2\.5.*?Over[^*]*\*\*([\d.,]+)\*\*.*?Under[^*]*\*\*([\d.,]+)\*\*/i);

        // Extract BTTS
        const bttsMatch = block.match(/Mindkét csapat gól.*?Igen\s*\*\*([\d.,]+)\*\*.*?Nem\s*\*\*([\d.,]+)\*\*/i)
            || block.match(/BTTS.*?Yes\s*\*\*([\d.,]+)\*\*.*?No\s*\*\*([\d.,]+)\*\*/i);

        const parseOdds = (str) => str ? parseFloat(String(str).replace(',', '.')) : null;

        const matchData = {
            id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            team1: team1.trim(),
            team2: team2.trim(),
            homeTeam: team1.trim(),
            awayTeam: team2.trim(),
            competition: competition.trim(),
            time: time || 'TBD',
            sport: 'soccer',
            source: 'manual_text_input',
            homeOdds: moneylineMatch ? parseOdds(moneylineMatch[1]) : null,
            drawOdds: moneylineMatch ? parseOdds(moneylineMatch[2]) : null,
            awayOdds: moneylineMatch ? parseOdds(moneylineMatch[3]) : null,
            overOdds: ouMatch ? parseOdds(ouMatch[1]) : null,
            underOdds: ouMatch ? parseOdds(ouMatch[2]) : null,
            overUnderLine: 2.5,
            bttsYes: bttsMatch ? parseOdds(bttsMatch[1]) : null,
            bttsNo: bttsMatch ? parseOdds(bttsMatch[2]) : null,
            markets: {},
            isManualInput: true
        };

        if (moneylineMatch) {
            matchData.markets.moneyline = {
                home: parseOdds(moneylineMatch[1]),
                draw: parseOdds(moneylineMatch[2]),
                away: parseOdds(moneylineMatch[3])
            };
        }
        if (ouMatch) {
            matchData.markets.overUnder = { line: 2.5, over: parseOdds(ouMatch[1]), under: parseOdds(ouMatch[2]) };
        }
        if (bttsMatch) {
            matchData.markets.btts = { yes: parseOdds(bttsMatch[1]), no: parseOdds(bttsMatch[2]) };
        }

        // ENGINE COMPATIBILITY: football.js expects odds.home, odds.draw, etc.
        matchData.odds = {
            home: matchData.homeOdds,
            draw: matchData.drawOdds,
            away: matchData.awayOdds,
            over25: matchData.overOdds,
            under25: matchData.underOdds,
            bttsYes: matchData.bttsYes,
            bttsNo: matchData.bttsNo
        };

        if (Object.keys(matchData.markets).length === 0) {
            console.warn(`[TextParser] No markets found for ${team1} vs ${team2}`);
            return null;
        }

        return matchData;
    } catch (err) {
        console.error('[TextParser] Error parsing match block:', err);
        return null;
    }
}

/**
 * Parse full text input using regex (fallback when DeepSeek unavailable).
 */
export function parseManualTextInput(text) {
    if (!text || typeof text !== 'string') {
        return [];
    }

    const blocks = text.split(/(?=###\s*\d+\.)/);
    const matches = [];

    for (const block of blocks) {
        if (!block.trim()) continue;
        const parsed = parseMatchBlock(block);
        if (parsed) {
            matches.push(parsed);
        }
    }

    console.log(`[TextParser] Regex parsed ${matches.length} matches from manual input`);
    return matches;
}

/**
 * Normalize parsed matches for pipeline (compatibility layer).
 */
export function normalizeForPipeline(parsedMatches) {
    return parsedMatches.map(match => ({
        id: match.id,
        team1: match.team1,
        team2: match.team2,
        homeTeam: match.team1,
        awayTeam: match.team2,
        competition: match.competition,
        time: match.time,
        sport: match.sport,
        source: match.source,
        homeOdds: match.homeOdds || match.markets?.moneyline?.home || null,
        drawOdds: match.drawOdds || match.markets?.moneyline?.draw || null,
        awayOdds: match.awayOdds || match.markets?.moneyline?.away || null,
        overOdds: match.overOdds || match.markets?.overUnder?.over || null,
        underOdds: match.underOdds || match.markets?.overUnder?.under || null,
        overUnderLine: match.overUnderLine || match.markets?.overUnder?.line || 2.5,
        bttsYes: match.bttsYes || match.markets?.btts?.yes || null,
        bttsNo: match.bttsNo || match.markets?.btts?.no || null,
        markets: match.markets,
        // ENGINE COMPATIBILITY: football.js expects odds.home, odds.draw, etc.
        odds: match.odds || {
            home: match.homeOdds || match.markets?.moneyline?.home || null,
            draw: match.drawOdds || match.markets?.moneyline?.draw || null,
            away: match.awayOdds || match.markets?.moneyline?.away || null,
            over25: match.overOdds || match.markets?.overUnder?.over || null,
            under25: match.underOdds || match.markets?.overUnder?.under || null,
            bttsYes: match.bttsYes || match.markets?.btts?.yes || null,
            bttsNo: match.bttsNo || match.markets?.btts?.no || null
        },
        isManualInput: true
    }));
}

export default {
    parseWithDeepSeek,
    parseManualTextInput,
    normalizeForPipeline
};
