/**
 * GPT-Powered Text Parser for Manual Match Input
 *
 * Uses OpenAI GPT to parse ANY text format containing match data
 * and converts it to the standard MatchData[] structure.
 *
 * Handles free-form text like:
 *   "real vs barca over 1.5 corner 2.20"
 *   "Liverpool - Man City 1X2: 2.10 3.40 3.50"
 *   "PSG Monaco hazai 1.80 döntetlen 3.50 vendég 4.20"
 *
 * @module agents/textParser
 */

/**
 * Call OpenAI GPT API to parse unstructured text into match JSON.
 *
 * @param {string} text - Raw user-pasted text in any format
 * @param {string} apiKey - OpenAI API key
 * @param {string} model - OpenAI model to use
 * @returns {Promise<Array>} - Array of parsed MatchData objects
 */
export async function parseWithGPT(text, apiKey, model = 'gpt-4.1-mini') {
    if (!text || typeof text !== 'string' || !apiKey) {
        console.warn('[TextParser] Missing text or API key for GPT parsing');
        return [];
    }

    const systemPrompt = `You are a UNIVERSAL sports betting data extraction AI, expert in Hungarian ("mérkőzések" = matches) and all world languages. Your ONLY job: find matches and odds in the user's text, no matter how messy, abbreviated, or informal it is.

ZERO ASSUMPTIONS ABOUT FORMAT. The user may write:
- Sloppy shorthand: "real barca o1.5 corner 2.20"
- Full sentence: "I want to bet on Real Madrid vs Barcelona, the over 1.5 corners is at 2.20"
- Mixed language: "Bayern München ellen Dortmund, hazai 1.80 dönt 3.50 vendég 4.20"
- Just names and numbers: "liverpool city 2.10 3.40 3.50"
- With separators: "psg - monaco 1.90/3.60/4.00"
- Markdown: "### 1. **Arsenal vs Chelsea** (PL) Home 2.38"
- Tabular: "Team1  Team2  1  X  2\\nBarca  Real  1.55  4.20  6.00"
- Hungarian mérkőzések (matches): "Fradi Újpest hazai 1.30 döntetlen 5.50 vendég 9.00 gólok over 2.5 1.85"
- Hungarian betting terms: "szöglet" (corners), "gól" (goals), "mérkőzés" (match), "tétek" (bets)
- German: "Bayern gegen Dortmund Sieg 1.50 Unentschieden 4.00 Niederlage 6.00"
- Spanish: "Madrid vs Barça victoria local 1.80 empate 3.50 victoria visitante 4.20"
- Turkish: "Galatasaray Fenerbahçe ev sahibi 1.90 berabere 3.40 deplasman 3.80"
- Russian, Chinese, Arabic, Portuguese, Italian, Polish, Czech, Romanian — ANY language
- OCR garbage with typos: "Lverpool - Mancehster Cty 2.10 3.40 3.50"
- Single bet only: "over 2.5 goals psg monaco 1.85"
- Just odds: "1.55 4.20 6.00" after team names mentioned earlier
- Comma decimals: "2,10 3,40 3,50" (European format)
- American odds: "+150 -110"
- Fractional odds: "5/2 7/4"

UNIVERSAL LANGUAGE DICTIONARY (comprehensive for Hungarian & ALL languages):
Home/Win/1: Hazai, Heim, Local, Casa, Ev sahibi, Domácí, Gazda, Dom, Hemmslag, Koti
Draw/X: Döntetlen, Unentschieden, Empate, Berabere, Remíza, Egal, Oavgjort
Away/2: Vendég, Gast, Visitante, Deplasman, Hosté, Oaspete, Borta
Over: Több, Über, Más, Üst, Nad, Peste, Över
Under: Kevesebb, Unter, Menos, Alt, Pod, Sub, Under
BTTS: Mindkét csapat gól, Mindkét csapat gólt szerez, MKCSG, Beide Teams treffen, Ambos marcan, GG/NG
Goals: Gól, Gólszám, Tore, Goles, Goller, Góly
Corners: Szöglet, Sarok, Ecken, Esquinas, Köşe, Rohy, Cornere
Cards: Lap, Karte, Tarjeta, Kart
Handicap: Hátrány, Handicap, Hándicap, AH
Half Time: Félidő, Halbzeit, Primer tiempo, İlk yarı, HT
Full Time: Végeredmény, Endergebnis, Resultado final, FT
Match/Game: Mérkőzés, Spiel, Partido, Maç, Zápas, Hra

HUNGARIAN SPORTS BETTING CONTEXTUAL KNOWLEDGE:
- "mérkőzések" = matches (plural)
- "mérkőzés" = match (singular)
- "hazai" = home team
- "vendég" = away team
- "döntetlen" = draw
- "szöglet" = corner
- "gól" = goal(s)
- "félidő" = half-time
- "végeredmény" = final result
- "tét/tétek" = bet/bets
- "fogadás" = betting
- "bukméker" = bookmaker
- "odds/szorzó" = odds/multiplier

TEAM NAME INTELLIGENCE — resolve abbreviations and nicknames:
- "real" / "rm" / "madrid" → Real Madrid
- "barca" / "fcb" / "barcelona" → FC Barcelona
- "city" / "mancity" / "mcfc" → Manchester City
- "utd" / "manutd" / "united" → Manchester United
- "pool" / "lfc" / "liverpool" → Liverpool FC
- "arsenal" / "ars" / "gunners" → Arsenal FC
- "chelsea" / "cfc" / "blues" → Chelsea FC
- "bayern" / "fcb" / "münchen" → Bayern München
- "bvb" / "dortmund" → Borussia Dortmund
- "psg" / "paris" → Paris Saint-Germain
- "juve" / "juventus" → Juventus FC
- "inter" / "internazionale" → Inter Milan
- "milan" / "acm" / "rossoneri" → AC Milan
- "fradi" / "ftc" / "ferencváros" → Ferencváros TC
- "újpest" / "ujpest" / "ute" → Újpest FC
- "lakers" / "lal" → LA Lakers
- "celtics" / "bos" → Boston Celtics
- ANY other abbreviation or nickname — use your world knowledge to resolve it

SMART INFERENCE:
1. Two entity names near each other + numbers between 1.01-100 → that's a match with odds
2. Three consecutive numbers (e.g. 2.10 3.40 3.50) near team names → 1X2 (Home/Draw/Away)
3. Two consecutive numbers near team names → Moneyline (Home/Away, no draw)
4. "over"/"o" + line number + odds number → Over market
5. "under"/"u" + line number + odds number → Under market
6. "corner"/"szöglet"/"ecken" near odds → Corner market (put in extraMarkets)
7. "card"/"lap"/"karte" near odds → Card market (put in extraMarkets)
8. "btts"/"gg"/"mindkét csapat" near odds → BTTS market
9. Even if the text is a SINGLE LINE with minimal info, extract what you can
10. If you see a number like 2.5, 1.5, 3.5 followed by an odds number → that's a line + odds
11. Default sport = "soccer" unless basketball/tennis/hockey/NFL keywords are present
12. Multiple matches separated by newlines, semicolons, ";" , numbers "1." "2.", or paragraphs
13. Hungarian mérkőzések text: if text contains mérkőzés, döntetlen, hazai, vendég, szöglet → treat as sports betting data even if format is unusual

OUTPUT — strict JSON only, no other text:
{
  "matches": [
    {
      "team1": "Full Home Team Name",
      "team2": "Full Away Team Name",
      "competition": "League/Tournament or null",
      "time": "HH:MM or null",
      "sport": "soccer|basketball|tennis|hockey|american_football|baseball|other",
      "homeOdds": 2.50,
      "drawOdds": 3.40,
      "awayOdds": 2.80,
      "overOdds": 1.73,
      "underOdds": 2.06,
      "overUnderLine": 2.5,
      "bttsYes": 1.46,
      "bttsNo": 2.55,
      "extraMarkets": [
        { "name": "Over 1.5 Corners", "odds": 2.20, "type": "over" }
      ]
    }
  ]
}

ABSOLUTE RULES:
- NEVER invent odds — if not in the text, use null
- ALWAYS extract, even from 1 line with 1 match and 1 odds value
- Parse decimal odds (2.38), comma decimals (2,38→2.38), fractional (5/2→3.50), american (+150→2.50, -110→1.91)
- extraMarkets = any market not fitting the standard fields (corners, cards, halftime, player props, handicaps, specials)
- Output ONLY raw JSON — no markdown, no \`\`\`, no explanation
- For Hungarian text: "Fradi Újpest hazai 1.30 döntetlen 5.50 vendég 9.00" → team1=Fradi, team2=Újpest, homeOdds=1.30, drawOdds=5.50, awayOdds=9.00`;

    const userPrompt = `Parse ALL matches and bets from this text:\n\n${text}`;

    try {
        const payload = {
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.05,
            max_completion_tokens: 4000,
            response_format: { type: 'json_object' },
        };

        const response = await fetch('/api/openai/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            console.error('[TextParser] GPT API error:', response.status, response.statusText);
            console.error('[TextParser] Error details:', errText.substring(0, 500));
            console.warn('[TextParser] Falling back to regex parser due to API error');
            return parseManualTextInput(text);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        if (!content) {
            console.warn('[TextParser] Empty GPT response, falling back to regex');
            return parseManualTextInput(text);
        }        console.log('[TextParser] GPT raw response:', content.substring(0, 500));

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch {
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                              content.match(/(\{[\s\S]*\})/) ||
                              content.match(/(\[[\s\S]*\])/);
            if (jsonMatch) {
                try {
                    parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                } catch {
                    console.warn('[TextParser] Could not parse extracted JSON, falling back to regex');
                    return parseManualTextInput(text);
                }
            } else {
                console.warn('[TextParser] No JSON found in GPT response, falling back to regex');
                return parseManualTextInput(text);
            }
        }

        const matches = Array.isArray(parsed) ? parsed : (parsed.matches || parsed.data || []);

        if (matches.length === 0) {
            console.warn('[TextParser] GPT returned 0 matches, trying regex fallback');
            const regexResult = parseManualTextInput(text);
            if (regexResult.length > 0) return regexResult;
        }

        return matches.map((match, idx) => {
            const homeOdds = safeParseOdds(match.homeOdds);
            const drawOdds = safeParseOdds(match.drawOdds);
            const awayOdds = safeParseOdds(match.awayOdds);
            const overOdds = safeParseOdds(match.overOdds);
            const underOdds = safeParseOdds(match.underOdds);
            const bttsYes = safeParseOdds(match.bttsYes);
            const bttsNo = safeParseOdds(match.bttsNo);
            const ouLine = safeParseOdds(match.overUnderLine) || 2.5;

            return {
                id: `gpt-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
                team1: match.team1 || 'Unknown',
                team2: match.team2 || 'Unknown',
                homeTeam: match.team1 || match.homeTeam || 'Unknown',
                awayTeam: match.team2 || match.awayTeam || 'Unknown',
                competition: match.competition || match.league || null,
                time: match.time || null,
                sport: match.sport || 'soccer',
                source: 'gpt_parser',
                homeOdds,
                drawOdds,
                awayOdds,
                overOdds,
                underOdds,
                overUnderLine: ouLine,
                bttsYes,
                bttsNo,
                extraMarkets: match.extraMarkets || [],
                markets: {
                    moneyline: { home: homeOdds, draw: drawOdds, away: awayOdds },
                    overUnder: { line: ouLine, over: overOdds, under: underOdds },
                    btts: { yes: bttsYes, no: bttsNo }
                },
                odds: {
                    homeWin: homeOdds, draw: drawOdds, awayWin: awayOdds,
                    over25: overOdds, under25: underOdds, bttsYes, bttsNo
                },
                isManualInput: true
            };
        });

    } catch (err) {
        console.error('[TextParser] GPT parsing failed:', err);
        return parseManualTextInput(text);
    }
}

function safeParseOdds(val) {
    if (val === null || val === undefined || val === '' || val === 'null') return null;
    if (typeof val === 'number' && isFinite(val) && val >= 1.0) return val;
    const num = parseFloat(String(val).replace(',', '.'));
    return isFinite(num) && num >= 1.0 ? num : null;
}

// ============== REGEX FALLBACK PARSER ==============

function parseMatchBlock(block) {
    try {
        const headerMatch = block.match(/###\s*\d+\.\s*\*\*(.+?)\s*[-–]\s*(.+?)\*\*\s*\(([^,]+),?\s*(\d{1,2}:\d{2})?\)/i);
        const simpleMatch = !headerMatch && block.match(/^([A-Za-zÀ-ÿ\s.]+?)\s*(?:vs\.?|[-–]|ellen)\s*([A-Za-zÀ-ÿ\s.]+?)(?:\s|,|$)/im);

        if (!headerMatch && !simpleMatch) return null;

        let team1, team2, competition, time;
        if (headerMatch) { [, team1, team2, competition, time] = headerMatch; }
        else { team1 = simpleMatch[1]; team2 = simpleMatch[2]; competition = null; time = null; }

        const moneylineMatch =
            block.match(/1X2.*?Hazai\s*\*\*([\d.,]+)\*\*.*?Döntetlen\s*\*\*([\d.,]+)\*\*.*?Vendég\s*\*\*([\d.,]+)\*\*/i) ||
            block.match(/1X2.*?Home\s*\*\*([\d.,]+)\*\*.*?Draw\s*\*\*([\d.,]+)\*\*.*?Away\s*\*\*([\d.,]+)\*\*/i) ||
            block.match(/(?:hazai|home)[:\s]*([\d.,]+).*?(?:döntetlen|draw)[:\s]*([\d.,]+).*?(?:vendég|away)[:\s]*([\d.,]+)/i) ||
            block.match(/(?:1x2|moneyline)[:\s]*([\d.,]+)\s*[/|,\s]\s*([\d.,]+)\s*[/|,\s]\s*([\d.,]+)/i);
        const threeOddsMatch = !moneylineMatch && block.match(/([\d.,]+)\s+[\s/|,]\s*([\d.,]+)\s+[\s/|,]\s*([\d.,]+)/);
        const ouMatch =
            block.match(/Over\/Under\s*[\d.]*.*?Over[^*]*\*\*([\d.,]+)\*\*.*?Under[^*]*\*\*([\d.,]+)\*\*/i) ||
            block.match(/o(?:ver)?\s*[\d.]*\s*(?:goals?)?\s*[:\s]*([\d.,]+).*?u(?:nder)?\s*[\d.]*\s*(?:goals?)?\s*[:\s]*([\d.,]+)/i);
        const bttsMatch =
            block.match(/Mindkét csapat gól.*?Igen\s*\*\*([\d.,]+)\*\*.*?Nem\s*\*\*([\d.,]+)\*\*/i) ||
            block.match(/BTTS.*?Yes\s*\*\*([\d.,]+)\*\*.*?No\s*\*\*([\d.,]+)\*\*/i) ||
            block.match(/btts[:\s]*([\d.,]+)\s*[/|,]\s*([\d.,]+)/i);

        const parseOdds = (str) => str ? parseFloat(String(str).replace(',', '.')) : null;
        const mlMatch = moneylineMatch || threeOddsMatch;

        const matchData = {
            id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            team1: team1.trim(), team2: team2.trim(),
            homeTeam: team1.trim(), awayTeam: team2.trim(),
            competition: competition ? competition.trim() : null, time: time || null,
            sport: 'soccer', source: 'manual_text_input',
            homeOdds: mlMatch ? parseOdds(mlMatch[1]) : null,
            drawOdds: mlMatch ? parseOdds(mlMatch[2]) : null,
            awayOdds: mlMatch ? parseOdds(mlMatch[3]) : null,
            overOdds: ouMatch ? parseOdds(ouMatch[1]) : null,
            underOdds: ouMatch ? parseOdds(ouMatch[2]) : null,
            overUnderLine: 2.5,
            bttsYes: bttsMatch ? parseOdds(bttsMatch[1]) : null,
            bttsNo: bttsMatch ? parseOdds(bttsMatch[2]) : null,
            markets: {}, isManualInput: true
        };

        if (mlMatch) { matchData.markets.moneyline = { home: parseOdds(mlMatch[1]), draw: parseOdds(mlMatch[2]), away: parseOdds(mlMatch[3]) }; }
        if (ouMatch) { matchData.markets.overUnder = { line: 2.5, over: parseOdds(ouMatch[1]), under: parseOdds(ouMatch[2]) }; }
        if (bttsMatch) { matchData.markets.btts = { yes: parseOdds(bttsMatch[1]), no: parseOdds(bttsMatch[2]) }; }

        matchData.odds = {
            homeWin: matchData.homeOdds, draw: matchData.drawOdds, awayWin: matchData.awayOdds,
            over25: matchData.overOdds, under25: matchData.underOdds,
            bttsYes: matchData.bttsYes, bttsNo: matchData.bttsNo
        };

        const hasAnyOdds = matchData.homeOdds || matchData.overOdds || matchData.bttsYes;
        if (!hasAnyOdds && !team1 && !team2) return null;

        return matchData;
    } catch (err) {
        console.error('[TextParser] Error parsing match block:', err);
        return null;
    }
}

export function parseManualTextInput(text) {
    if (!text || typeof text !== 'string') return [];
    const blocks = text.includes('###')
        ? text.split(/(?=###\s*\d+\.)/)
        : text.split(/[\n;]+/).map(s => s.trim()).filter(Boolean);
    const matches = [];
    for (const block of blocks) {
        if (!block.trim()) continue;
        const parsed = parseMatchBlock(block);
        if (parsed) matches.push(parsed);
    }
    console.log(`[TextParser] Regex parsed ${matches.length} matches from manual input`);
    return matches;
}

export function normalizeForPipeline(parsedMatches) {
    return parsedMatches.map(match => ({
        id: match.id, team1: match.team1, team2: match.team2,
        homeTeam: match.team1, awayTeam: match.team2,
        competition: match.competition, time: match.time,
        sport: match.sport, source: match.source,
        homeOdds: match.homeOdds || match.markets?.moneyline?.home || null,
        drawOdds: match.drawOdds || match.markets?.moneyline?.draw || null,
        awayOdds: match.awayOdds || match.markets?.moneyline?.away || null,
        overOdds: match.overOdds || match.markets?.overUnder?.over || null,
        underOdds: match.underOdds || match.markets?.overUnder?.under || null,
        overUnderLine: match.overUnderLine || match.markets?.overUnder?.line || 2.5,
        bttsYes: match.bttsYes || match.markets?.btts?.yes || null,
        bttsNo: match.bttsNo || match.markets?.btts?.no || null,
        extraMarkets: match.extraMarkets || [],
        markets: match.markets,
        odds: match.odds || {
            homeWin: match.homeOdds || null, draw: match.drawOdds || null,
            awayWin: match.awayOdds || null, over25: match.overOdds || null,
            under25: match.underOdds || null, bttsYes: match.bttsYes || null,
            bttsNo: match.bttsNo || null
        },
        isManualInput: true
    }));
}

export default { parseWithGPT, parseManualTextInput, normalizeForPipeline };
