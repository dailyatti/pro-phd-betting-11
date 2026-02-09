/**
 * VisionContent — PhD-Grade Vision Scraper Renderer
 *
 * Purpose:
 * - Render Vision Scraper agent output (extracted matches + markets + odds)
 * - Hardened against schema drift (different vendors / OCR noise / partial extractions)
 * - Deterministic multi-match grouping + deduplication
 * - Clean, audit-style UI (markets → compact blocks) without runtime crashes
 *
 * @module components/AgentCard/content/VisionContent
 */

import React from "react";
import clsx from "clsx";
import { Target, UserRound } from "lucide-react";
import { OddsBox, safeText, fmtOdds, toNumber } from "../shared";

// ============================================================================
// HELPERS (Schema-hardening + deterministic keys)
// ============================================================================

/**
 * Resolve a stable label for a match group.
 * Priority: explicit label → (team1 vs team2) → matchId → index fallback
 */
const resolveMatchLabel = (matchData, idx) => {
  const g = matchData?.__group;
  const t1 = matchData?.team_1 || matchData?.team1 || matchData?.home_team;
  const t2 = matchData?.team_2 || matchData?.team2 || matchData?.away_team;

  return (
    g?.matchLabel ||
    (t1 && t2 ? `${t1} vs ${t2}` : null) ||
    g?.matchId ||
    matchData?.matchId ||
    `match-${idx}`
  );
};

/**
 * Resolve a stable React key.
 * Prefer matchId; otherwise, label; otherwise, fallback to idx.
 */
const resolveMatchKey = (matchData, idx) => {
  const g = matchData?.__group;
  return g?.matchId || matchData?.matchId || resolveMatchLabel(matchData, idx) || `idx-${idx}`;
};

/**
 * Normalize match object:
 * Vision Scraper can output: { matches:[{...}] } or direct fields on root.
 */
const normalizeMatch = (data) => {
  const first = Array.isArray(data?.matches) && data.matches.length > 0 ? data.matches[0] : null;
  return first || data || {};
};

/**
 * Normalize odds container:
 * Sometimes odds are on match.odds, sometimes on root.
 */
const normalizeOdds = (match, root) => match?.odds || root?.odds || {};

/**
 * Extract moneyline fields across schema variants.
 * CRITICAL: Vision Agent outputs 'homeWin', 'awayWin', 'draw' (camelCase flat).
 */
const extractMoneyline = (odds = {}) => ({
  home: odds?.homeWin ?? odds?.moneyline?.home ?? odds?.team_1 ?? odds?.home ?? null,
  draw: odds?.draw ?? odds?.moneyline?.draw ?? null,
  away: odds?.awayWin ?? odds?.moneyline?.away ?? odds?.team_2 ?? odds?.away ?? null,
});

/**
 * True if a value is present (non-empty after stringification).
 */
const hasValue = (v) => v != null && String(v).trim() !== "";

/**
 * Decide totals naming based on sport.
 */
const totalsLabelForSport = (sport) => {
  const s = String(sport || "").toUpperCase();
  // Use string includes for flexible matching (e.g., "BASKETBALL - NBA" should match)
  if (s.includes('BASKET') || s.includes('NBA') || s.includes('NFL') || s.includes('NCAAF') || s.includes('WNBA')) return "Total_Points";
  if (s.includes('TENNIS') || s.includes('ATP') || s.includes('WTA')) return "Total_Games";
  return "Total_Goals";
};

/**
 * Player prop sort:
 * prefer "over" if numeric; else fallback high value.
 */
const playerPropSortKey = (p) => {
  const x = toNumber(p?.over);
  return Number.isFinite(x) ? x : 999;
};

// ============================================================================
// VISION CONTENT (Multi-match + Single match entry)
// ============================================================================

/**
 * VisionContent
 * @param {Object} props
 * @param {Object|Array} props.data - Vision scraper output data (single match or array of match groups)
 * @param {boolean} props.darkMode
 */
export const VisionContent = ({ data, darkMode }) => {
  // Multi-match (array) — deduplicate by resolved label
  if (Array.isArray(data)) {
    const seen = new Set();

    const uniqueData = data.filter((matchData, idx) => {
      const label = resolveMatchLabel(matchData, idx);
      if (seen.has(label)) return false;
      seen.add(label);
      return true;
    });

    return (
      <div className="space-y-6">
        {uniqueData.map((matchData, idx) => {
          const label = resolveMatchLabel(matchData, idx);
          const key = resolveMatchKey(matchData, idx);

          return (
            <div key={key} className="relative">
              {label && (
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div
                    className={clsx(
                      "p-1.5 rounded-lg shadow-sm border",
                      darkMode ? "bg-slate-800 border-slate-700" : "bg-[#FDFCF8] border-stone-200"
                    )}
                  >
                    <Target size={16} className={darkMode ? "text-cyan-400" : "text-stone-500"} />
                  </div>

                  <div className="min-w-0">
                    <h3 className={clsx("text-sm font-bold tracking-tight truncate", darkMode ? "text-slate-200" : "text-slate-800")}>
                      {label}
                    </h3>
                    <span className={clsx("text-[10px] uppercase tracking-wider font-semibold", darkMode ? "text-slate-500" : "text-stone-400")}>
                      Match {idx + 1}
                    </span>
                  </div>
                </div>
              )}

              <SingleVisionBlock data={matchData} darkMode={darkMode} />
            </div>
          );
        })}
      </div>
    );
  }

  // Single match
  const label = data?.__group?.matchLabel;

  return (
    <div className="space-y-4">
      {label && (
        <div
          className={clsx(
            "flex items-center gap-3 p-3 rounded-xl border",
            darkMode ? "bg-slate-800/40 border-white/5" : "bg-[#FDFCF8] border-stone-200 shadow-sm"
          )}
        >
          <div className={clsx("p-2 rounded-lg", darkMode ? "bg-cyan-500/10" : "bg-white border text-stone-500")}>
            <Target className={darkMode ? "text-cyan-400" : "text-stone-500"} size={18} />
          </div>

          <div className="min-w-0">
            <h3 className={clsx("text-sm font-bold tracking-wide truncate", darkMode ? "text-white" : "text-stone-800")}>
              {label}
            </h3>
            <div className={clsx("text-[10px] uppercase tracking-widest font-bold", darkMode ? "text-cyan-400/60" : "text-stone-400")}>
              Visual Analysis
            </div>
          </div>
        </div>
      )}

      <SingleVisionBlock data={data} darkMode={darkMode} />
    </div>
  );
};

// ============================================================================
// SINGLE VISION BLOCK (Hardened, deterministic, multi-market)
// ============================================================================

/**
 * SingleVisionBlock
 * @param {Object} props
 * @param {Object} props.data - match group / match payload
 * @param {boolean} props.darkMode
 */
const SingleVisionBlock = ({ data, darkMode }) => {
  const match = normalizeMatch(data);
  const odds = normalizeOdds(match, data);

  // --- Identity fields (schema drift tolerant) ---
  const sport = safeText(match?.sport ?? data?.sport, "FOOTBALL");
  const team1 =
    safeText(match?.team_1 ?? match?.team1 ?? match?.home_team, null) ||
    safeText(data?.team_1 ?? data?.team1 ?? data?.home_team, "Team Home");

  const team2 =
    safeText(match?.team_2 ?? match?.team2 ?? match?.away_team, null) ||
    safeText(data?.team_2 ?? data?.team2 ?? data?.away_team, "Team Away");

  const time = safeText(match?.kickoff_time ?? match?.time ?? data?.time, "TBD");
  const date = safeText(match?.kickoff_date ?? match?.date ?? data?.date, "");

  const moneyline = extractMoneyline(odds);

  const showMoneyline = [moneyline.home, moneyline.draw, moneyline.away].some(hasValue);

  // Totals - support flat keys (totalOver) from Vision Agent
  const totalsArr = Array.isArray(odds?.totals) ? odds.totals : [];
  const hasFlatTotals = hasValue(odds?.totalOver) || hasValue(odds?.over);
  const showTotals = totalsArr.length > 0 || hasFlatTotals;
  const flatTotals = hasFlatTotals ? {
    line: odds?.totalLine || odds?.line || '2.5',
    over: odds?.totalOver || odds?.over,
    under: odds?.totalUnder || odds?.under,
  } : null;

  // Handicap - support flat keys
  const handicapArr = Array.isArray(odds?.handicap) ? odds.handicap : [];
  const hasFlatHandicap = hasValue(odds?.homeSpread) || hasValue(odds?.awaySpread);
  const showHandicap = handicapArr.length > 0 || hasFlatHandicap;
  const flatHandicap = hasFlatHandicap ? {
    line: odds?.spreadLine || '',
    home: odds?.homeSpread,
    away: odds?.awaySpread,
  } : null;

  const playerPropsArr = Array.isArray(odds?.player_props) ? odds.player_props : [];

  // BTTS - support flat keys (bttsYes) from Vision Agent
  const hasFlatBTTS = hasValue(odds?.bttsYes) || hasValue(odds?.btts_yes);
  const showBTTS = (!!odds?.btts && (hasValue(odds?.btts?.yes) || hasValue(odds?.btts?.no))) || hasFlatBTTS;
  const flatBTTS = hasFlatBTTS ? {
    yes: odds?.bttsYes || odds?.btts_yes,
    no: odds?.bttsNo || odds?.btts_no,
  } : null;

  const showPlayerProps = playerPropsArr.length > 0;

  return (
    <div
      className={clsx(
        "rounded-xl border overflow-hidden w-full transition-all duration-300",
        darkMode
          ? "bg-slate-950/50 border-white/10 shadow-2xl shadow-cyan-900/5 backdrop-blur-sm"
          : "bg-white border-stone-200 shadow-lg shadow-stone-200/50"
      )}
    >
      {/* Match Header Ticket */}
      <div className={clsx("p-5 border-b relative overflow-hidden", darkMode ? "border-white/5" : "border-stone-100")}>
        {/* Background Gradient */}
        <div
          className={clsx(
            "absolute inset-0 opacity-20 pointer-events-none",
            darkMode
              ? "bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-900"
              : "bg-gradient-to-br from-cyan-100 via-white to-white"
          )}
        />

        <div
          className={clsx(
            "flex justify-between items-center text-[10px] uppercase tracking-widest font-bold mb-3 relative z-10",
            darkMode ? "text-cyan-400" : "text-cyan-700"
          )}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span>{sport}</span>
          </div>
          <span className={darkMode ? "text-slate-500" : "text-stone-400"}>
            {date} • {time}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 relative z-10">
          <div className="flex-1 text-right min-w-0">
            <span
              className={clsx(
                "block text-base md:text-lg font-bold leading-tight line-clamp-2 tracking-tight",
                darkMode ? "text-white" : "text-slate-900"
              )}
              title={team1}
            >
              {team1}
            </span>
          </div>

          <div
            className={clsx(
              "px-3 py-1.5 rounded-lg text-xs font-mono font-bold border shrink-0 m-auto shadow-sm",
              darkMode ? "bg-slate-900 text-slate-400 border-slate-700" : "bg-white text-stone-400 border-stone-200"
            )}
          >
            VS
          </div>

          <div className="flex-1 text-left min-w-0">
            <span
              className={clsx(
                "block text-base md:text-lg font-bold leading-tight line-clamp-2 tracking-tight",
                darkMode ? "text-white" : "text-slate-900"
              )}
              title={team2}
            >
              {team2}
            </span>
          </div>
        </div>
      </div>

      {/* Markets Container */}
      <div className="p-4 space-y-4">
        {/* 1X2 / Moneyline */}
        {showMoneyline && (
          <div className="space-y-2">
            <p className={clsx("text-[10px] uppercase font-bold tracking-wider", darkMode ? "text-slate-500" : "text-stone-400")}>
              Money_Line
            </p>
            <div className="grid grid-cols-3 gap-2">
              <OddsBox label="1" value={moneyline.home} darkMode={darkMode} />
              <OddsBox label="X" value={moneyline.draw} sub="Draw" darkMode={darkMode} />
              <OddsBox label="2" value={moneyline.away} darkMode={darkMode} />
            </div>
          </div>
        )}

        {/* Totals & BTTS */}
        {(showTotals || showBTTS) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {showTotals && (
              <div className="space-y-2">
                <p className={clsx("text-[10px] uppercase font-bold tracking-wider", darkMode ? "text-slate-500" : "text-slate-400")}>
                  {totalsLabelForSport(sport)}
                </p>

                <div className="space-y-1.5">
                  {totalsArr.length > 0 ? totalsArr.slice(0, 3).map((t, i) => (
                    <div
                      key={`${safeText(t?.line, "line")}-${i}`}
                      className={clsx(
                        "grid grid-cols-[1fr_auto_auto] gap-2 items-center px-2 py-1.5 rounded border",
                        darkMode ? "bg-slate-800/50 border-white/5" : "bg-white border-stone-200 shadow-sm"
                      )}
                    >
                      <span className={clsx("text-xs font-mono font-bold", darkMode ? "text-slate-300" : "text-stone-700")}>
                        {safeText(t?.line, "—")}
                      </span>
                      <span className={clsx("text-[10px] font-mono", darkMode ? "text-emerald-400" : "text-emerald-600")}>
                        O: {fmtOdds(t?.over) ?? "-"}
                      </span>
                      <span className={clsx("text-[10px] font-mono", darkMode ? "text-fuchsia-400" : "text-fuchsia-600")}>
                        U: {fmtOdds(t?.under) ?? "-"}
                      </span>
                    </div>
                  )) : flatTotals && (
                    <div
                      className={clsx(
                        "grid grid-cols-[1fr_auto_auto] gap-2 items-center px-2 py-1.5 rounded border",
                        darkMode ? "bg-slate-800/50 border-white/5" : "bg-white border-stone-200 shadow-sm"
                      )}
                    >
                      <span className={clsx("text-xs font-mono font-bold", darkMode ? "text-slate-300" : "text-stone-700")}>
                        {flatTotals.line}
                      </span>
                      <span className={clsx("text-[10px] font-mono", darkMode ? "text-emerald-400" : "text-emerald-600")}>
                        O: {fmtOdds(flatTotals.over) ?? "-"}
                      </span>
                      <span className={clsx("text-[10px] font-mono", darkMode ? "text-fuchsia-400" : "text-fuchsia-600")}>
                        U: {fmtOdds(flatTotals.under) ?? "-"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showBTTS && (
              <div className="space-y-2">
                <p className={clsx("text-[10px] uppercase font-bold tracking-wider", darkMode ? "text-slate-500" : "text-stone-400")}>
                  BTTS
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <OddsBox label="Yes" value={odds?.btts?.yes || flatBTTS?.yes} color="emerald" small darkMode={darkMode} />
                  <OddsBox label="No" value={odds?.btts?.no || flatBTTS?.no} color="red" small darkMode={darkMode} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Handicap */}
        {showHandicap && (
          <div className={clsx("mt-2 pt-3 border-t", darkMode ? "border-white/5" : "border-stone-100")}>
            <div className="flex items-center gap-2 mb-2">
              <p className={clsx("text-[10px] uppercase font-bold tracking-wider", darkMode ? "text-slate-500" : "text-stone-400")}>
                Asian_Handicap
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {handicapArr.slice(0, 4).map((h, i) => (
                <div
                  key={`${safeText(h?.line, "h")}-${i}`}
                  className={clsx(
                    "border px-2 py-1 rounded text-[10px] flex gap-2 items-center",
                    darkMode ? "bg-slate-800/30 border-white/5" : "bg-white border-stone-200 shadow-sm"
                  )}
                >
                  <span className={clsx("font-mono", darkMode ? "text-slate-400" : "text-stone-500")}>
                    {safeText(h?.line, "")}
                  </span>
                  <span className={clsx("font-bold", darkMode ? "text-cyan-400" : "text-cyan-600")}>{fmtOdds(h?.home)}</span>
                  <span className={clsx("opacity-50", darkMode ? "text-slate-500" : "text-stone-500")}>|</span>
                  <span className={clsx("font-bold", darkMode ? "text-amber-400" : "text-amber-600")}>{fmtOdds(h?.away)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Player Props */}
        {showPlayerProps && (
          <div className={clsx("mt-3 pt-3 border-t", darkMode ? "border-white/5" : "border-stone-100")}>
            <div className="flex items-center gap-2 mb-2">
              <UserRound size={14} className={darkMode ? "text-slate-400" : "text-slate-500"} />
              <p className={clsx("text-[10px] uppercase font-bold tracking-wider", darkMode ? "text-slate-500" : "text-stone-400")}>
                Player_Props
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {[...playerPropsArr]
                .sort((a, b) => playerPropSortKey(a) - playerPropSortKey(b))
                .slice(0, 5)
                .map((p, i) => {
                  const market = safeText(p?.market, "");
                  const marketLower = market.toLowerCase();

                  const overLabel =
                    marketLower.includes("goal") || marketLower.includes("score") ? "Yes" : "Over";

                  return (
                    <div
                      key={`${safeText(p?.player, "player")}-${safeText(p?.market, "m")}-${safeText(p?.line, "l")}-${i}`}
                      className={clsx(
                        "grid grid-cols-[1fr_auto_auto] gap-3 items-center px-3 py-2 rounded border",
                        darkMode ? "bg-slate-800/30 border-white/5" : "bg-white border-stone-200 shadow-sm"
                      )}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className={clsx("text-xs font-bold truncate", darkMode ? "text-slate-300" : "text-slate-700")}>
                          {safeText(p?.player, "Unknown Player")}
                        </span>
                        <span className={clsx("text-[10px] font-mono", darkMode ? "text-slate-500" : "text-slate-500")}>
                          {safeText(p?.market, "Market")} {p?.line ? `• ${p.line}` : ""}
                        </span>
                      </div>

                      {hasValue(p?.over) && (
                        <div className="flex flex-col items-center">
                          <span className={clsx("text-[9px] uppercase font-bold", darkMode ? "text-emerald-400" : "text-emerald-600")}>
                            {overLabel}
                          </span>
                          <span className={clsx("text-xs font-mono font-bold", darkMode ? "text-white" : "text-slate-900")}>
                            {fmtOdds(p?.over)}
                          </span>
                        </div>
                      )}

                      {hasValue(p?.under) && (
                        <div className="flex flex-col items-center">
                          <span className={clsx("text-[9px] uppercase font-bold", darkMode ? "text-red-300" : "text-red-500")}>
                            Under
                          </span>
                          <span className={clsx("text-xs font-mono font-bold", darkMode ? "text-white" : "text-slate-900")}>
                            {fmtOdds(p?.under)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!showMoneyline && !showTotals && !showBTTS && !showHandicap && !showPlayerProps && (
          <div
            className={clsx(
              "p-6 rounded-xl border border-dashed text-center",
              darkMode ? "border-slate-800 text-slate-500" : "border-stone-200 text-stone-400"
            )}
          >
            No markets detected from the image. Try a higher-resolution screenshot or include the odds panel in-frame.
          </div>
        )}
      </div>
    </div>
  );
};

export default VisionContent;