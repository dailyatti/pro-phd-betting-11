/**
 * FactCheckerContent Component
 *
 * Displays Fact Checker agent output - match research and statistics.
 *
 * @module components/AgentCard/content/FactCheckerContent
 */

import React from "react";
import clsx from "clsx";
import { Search, Brain } from "lucide-react";
import { Badge, StatBar, FormVisual, safeText, isPlainObject } from "../shared";

// -------------------------
// Small hardening helpers
// -------------------------
const safeObj = (x) => (x && typeof x === "object" ? x : {});
const safeArr = (x) => (Array.isArray(x) ? x : []);
const hasAnyKeys = (o) => isPlainObject(o) && Object.keys(o).length > 0;

const stableKeyForReport = (factData, idx) => {
  const x = safeObj(factData);
  return x?.matchId || x?.__group?.matchId || x?.matchLabel || `facts-${idx}`;
};

export const FactCheckerContent = ({ data, darkMode }) => {
  // Multi
  if (Array.isArray(data)) {
    const reports = safeArr(data);

    return (
      <div className="space-y-6">
        {reports.map((factData, idx) => {
          const x = safeObj(factData);
          const matchLabel = safeText(x?.matchLabel, "");
          const key = stableKeyForReport(x, idx);

          // if evidence[0] exists and is object, use that; else use whole payload
          const evidence0 = safeArr(x?.evidence)?.[0];
          const blockData = isPlainObject(evidence0) ? evidence0 : x;

          return (
            <div key={key} className="space-y-4">
              {matchLabel && (
                <div
                  className={clsx(
                    "p-4 rounded-xl shadow-lg flex items-center justify-between relative overflow-hidden group border",
                    darkMode ? "bg-slate-950/50 border-blue-500/30" : "bg-[#FDFCF8] border-stone-200 shadow-sm"
                  )}
                >
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Search size={64} className={darkMode ? "text-slate-400" : "text-stone-300"} />
                  </div>

                  <div className="flex items-center gap-4 relative z-10 min-w-0">
                    <div
                      className={clsx(
                        "p-2.5 rounded-xl border shadow-inner",
                        darkMode ? "bg-blue-500/20 border-blue-500/20" : "bg-white border-stone-200 shadow-sm"
                      )}
                    >
                      <Search className={darkMode ? "text-blue-400" : "text-blue-600"} size={20} />
                    </div>

                    <div className="min-w-0">
                      <h3
                        className={clsx("text-base font-bold tracking-wide truncate", darkMode ? "text-white" : "text-stone-900")}
                        title={matchLabel}
                      >
                        {matchLabel}
                      </h3>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        <span
                          className={clsx(
                            "text-[10px] font-mono uppercase tracking-widest",
                            darkMode ? "text-blue-400" : "text-blue-600"
                          )}
                        >
                          Deep Facts Dossier
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <SingleFactBlock data={blockData} darkMode={darkMode} />
            </div>
          );
        })}
      </div>
    );
  }

  // Single
  const x = safeObj(data);
  const matchLabel = safeText(x?.matchLabel, "");

  return (
    <div className="space-y-4">
      {matchLabel && (
        <div
          className={clsx(
            "p-4 rounded-xl shadow-lg flex items-center gap-4 border",
            darkMode ? "bg-slate-950/50 border-blue-500/30" : "bg-[#FDFCF8] border-stone-200 shadow-sm"
          )}
        >
          <div
            className={clsx(
              "p-2.5 rounded-xl border shadow-inner",
              darkMode ? "bg-blue-500/20 border-blue-500/20" : "bg-white border-stone-200 shadow-sm"
            )}
          >
            <Search className={darkMode ? "text-blue-400" : "text-blue-600"} size={20} />
          </div>

          <div className="min-w-0">
            <h3 className={clsx("text-base font-bold tracking-wide truncate", darkMode ? "text-white" : "text-slate-800")} title={matchLabel}>
              {matchLabel}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span className={clsx("text-[10px] font-mono uppercase tracking-widest", darkMode ? "text-blue-400" : "text-blue-600")}>
                Deep Facts Dossier
              </span>
            </div>
          </div>
        </div>
      )}

      <SingleFactBlock data={x} darkMode={darkMode} />
    </div>
  );
};

// ============================================================================
// SINGLE FACT BLOCK (hardened)
// ============================================================================
const SingleFactBlock = ({ data, darkMode }) => {
  const x = safeObj(data);

  const matchContext = safeObj(x?.match_context);
  const injuries = safeObj(x?.injuries);
  const advanced = safeObj(x?.advanced_metrics);
  const h2h = safeArr(x?.head_to_head_last_5);
  const handicap = safeObj(x?.handicap_trends);

  const hasStructured =
    hasAnyKeys(matchContext) ||
    hasAnyKeys(injuries) ||
    !!x?.form_last_5 ||
    !!x?.form_guide ||
    hasAnyKeys(advanced) ||
    h2h.length > 0 ||
    hasAnyKeys(handicap);

  return (
    <div className="space-y-3">
      {/* Match Context Bar */}
      {hasAnyKeys(matchContext) && (
        <div
          className={clsx(
            "p-3 rounded-lg border-l-2",
            darkMode ? "bg-gradient-to-r from-blue-900/10 to-transparent border-blue-500" : "bg-[#FDFCF8] border-stone-200 border-l-stone-400 shadow-sm"
          )}
        >
          <div className="flex flex-wrap gap-4 text-xs font-medium">
            {matchContext.stadium && (
              <div className={clsx("flex items-center gap-1.5", darkMode ? "text-slate-300" : "text-stone-600")}>
                <span className={darkMode ? "text-blue-500" : "text-blue-600"}>🏟️</span>
                {safeText(matchContext.stadium, "—")}
              </div>
            )}

            {matchContext.weather_forecast && (
              <div className={clsx("flex items-center gap-1.5", darkMode ? "text-slate-300" : "text-stone-600")}>
                <span className={darkMode ? "text-cyan-400" : "text-cyan-600"}>🌤️</span>
                {safeText(matchContext.weather_forecast, "—")}
              </div>
            )}

            {matchContext.referee_name && (
              <div className={clsx("flex items-center gap-1.5", darkMode ? "text-slate-300" : "text-stone-600")}>
                <span className={darkMode ? "text-amber-500" : "text-amber-600"}>👨‍⚖️</span>
                <span>
                  {safeText(matchContext.referee_name, "—")}
                  <span className={clsx("text-[10px] ml-1", darkMode ? "text-slate-500" : "text-stone-500")}>
                    (Avg: {safeText(matchContext.referee_avg_yellow_cards, "?")} 🟨)
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Injuries Section */}
      {hasAnyKeys(injuries) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(injuries).map(([team, list]) => (
            <div
              key={team}
              className={clsx("p-3 rounded-lg border", darkMode ? "bg-red-500/5 border-red-500/10" : "bg-[#FDFCF8] border-red-100 shadow-sm")}
            >
              <div className={clsx("flex items-center gap-2 mb-2 pb-2 border-b", darkMode ? "border-red-500/10" : "border-red-100")}>
                <div className={clsx("p-1 rounded", darkMode ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600")}>🚑</div>
                <span className={clsx("text-xs font-bold uppercase tracking-wide truncate", darkMode ? "text-red-200" : "text-red-700")}>
                  {safeText(team, "Team")}
                </span>
              </div>

              <ul className="space-y-1.5">
                {Array.isArray(list) ? (
                  list.slice(0, 4).map((inj, i) => {
                    const injObj = isPlainObject(inj) ? inj : null;
                    const name = injObj ? injObj.name || "Unknown" : safeText(inj, "—");
                    const status = injObj ? injObj.status : null;

                    return (
                      <li
                        key={`${safeText(name, "inj")}-${i}`}
                        className={clsx("text-[11px] flex justify-between items-start", darkMode ? "text-red-200/80" : "text-red-800/80")}
                      >
                        <span className="pr-2">{safeText(name, "—")}</span>
                        {status && (
                          <span
                            className={clsx(
                              "text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0",
                              darkMode ? "bg-red-950/40 text-red-400" : "bg-red-100 text-red-600"
                            )}
                          >
                            {safeText(status, "")}
                          </span>
                        )}
                      </li>
                    );
                  })
                ) : (
                  <li className={clsx("text-xs", darkMode ? "text-red-300" : "text-red-600")}>{safeText(list, "—")}</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Form Guide */}
      {(x?.form_guide || x?.form_last_5) && (
        <div className={clsx("p-3 rounded-xl border", darkMode ? "bg-slate-800/30 border-white/5" : "bg-[#FDFCF8] border-stone-200 shadow-sm")}>
          <span className={clsx("text-[10px] font-bold uppercase tracking-widest mb-3 block", darkMode ? "text-slate-500" : "text-stone-400")}>
            Teams Form (Last 5)
          </span>
          <div className="grid grid-cols-2 gap-4">
            <FormVisual
              side="Home"
              guide={x?.form_guide?.home_last_5}
              name={safeText(x?.form_last_5?.home_team, "Home")}
              darkMode={darkMode}
            />
            <FormVisual
              side="Away"
              guide={x?.form_guide?.away_last_5}
              name={safeText(x?.form_last_5?.away_team, "Away")}
              darkMode={darkMode}
            />
          </div>
        </div>
      )}

      {/* Advanced Stats Grid */}
      {hasAnyKeys(advanced) && (
        <div
          className={clsx(
            "p-3 rounded-xl border",
            darkMode ? "bg-gradient-to-br from-slate-900 to-slate-800/50 border-slate-700/50" : "bg-[#FDFCF8] border-stone-200 shadow-sm"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={clsx("text-[10px] font-bold uppercase tracking-widest", darkMode ? "text-purple-400" : "text-stone-400")}>
              Advanced Metrics
            </span>
            <Brain size={12} className={darkMode ? "text-purple-500/50" : "text-purple-300"} />
          </div>

          <div className="space-y-3">
            <StatBar
              label="xG (Last 5)"
              home={advanced.home_xg_last_5_avg}
              away={advanced.away_xg_last_5_avg}
              unit="xG"
              darkMode={darkMode}
            />
            <StatBar
              label="Avg Goals"
              home={advanced.avg_goals_scored_home}
              away={advanced.avg_goals_scored_away}
              darkMode={darkMode}
            />
          </div>
        </div>
      )}

      {/* Head to Head Table */}
      {h2h.length > 0 && (
        <div className={clsx("rounded-xl overflow-hidden border", darkMode ? "bg-slate-800/30 border-white/5" : "bg-[#FDFCF8] border-stone-200 shadow-sm")}>
          <div className={clsx("px-3 py-1.5 flex justify-between items-center", darkMode ? "bg-white/5" : "bg-stone-50 border-b border-stone-100")}>
            <span className={clsx("text-[10px] font-bold uppercase tracking-wider", darkMode ? "text-slate-400" : "text-stone-500")}>H2H History</span>
          </div>

          <div className={clsx("divide-y", darkMode ? "divide-white/5" : "divide-stone-100")}>
            {h2h.slice(0, 3).map((row, i) => {
              const r = safeObj(row);
              const winner = safeText(r?.winner, "—");

              return (
                <div
                  key={`${safeText(r?.date, "d")}-${safeText(r?.score, "s")}-${i}`}
                  className={clsx("px-3 py-2 flex justify-between items-center text-xs transition-colors", darkMode ? "hover:bg-white/5" : "hover:bg-slate-50")}
                >
                  <span className={clsx("font-mono text-[10px]", darkMode ? "text-slate-500" : "text-slate-400")}>{safeText(r?.date, "—")}</span>
                  <span className={clsx("font-bold", darkMode ? "text-white" : "text-slate-800")}>{safeText(r?.score, "—")}</span>
                  <Badge
                    text={winner}
                    color={winner === "Home" ? "cyan" : winner === "Away" ? "amber" : "slate"}
                    size="xs"
                    darkMode={darkMode}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Handicap Trends */}
      {hasAnyKeys(handicap) && (
        <div className="flex gap-2">
          {handicap.home_avg_win_margin && (
            <div className="flex-1 bg-amber-500/10 border border-amber-500/20 p-2 rounded text-center">
              <span className="block text-[9px] text-amber-500/70 uppercase font-bold">Win Margin</span>
              <span className="text-amber-400 font-mono font-bold text-sm">{safeText(handicap.home_avg_win_margin, "—")}</span>
            </div>
          )}

          {handicap.home_clean_sheet_pct && (
            <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded text-center">
              <span className="block text-[9px] text-emerald-500/70 uppercase font-bold">Clean Sheet %</span>
              <span className="text-emerald-400 font-mono font-bold text-sm">{safeText(handicap.home_clean_sheet_pct, "—")}</span>
            </div>
          )}
        </div>
      )}

      {/* Fallback Text Content */}
      {x?.raw_content && !hasStructured && (
        <div
          className={clsx(
            "text-xs leading-relaxed p-3 rounded-lg border font-mono text-[11px]",
            darkMode ? "text-slate-300 bg-slate-800/50 border-slate-700/50" : "text-slate-700 bg-white border-stone-200 shadow-sm"
          )}
        >
          {safeText(x.raw_content, "")}
        </div>
      )}
    </div>
  );
};

export default FactCheckerContent;