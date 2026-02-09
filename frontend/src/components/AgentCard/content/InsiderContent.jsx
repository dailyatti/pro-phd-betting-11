import React, { useMemo } from "react";
import clsx from "clsx";
import { Lock, Zap, AlertTriangle, Activity, Eye } from "lucide-react";
import { safeText, safeHostname } from "../shared";

const safeArr = (x) => (Array.isArray(x) ? x : []);
const safeObj = (x) => (x && typeof x === "object" ? x : {});
const isNonEmptyStr = (x) => typeof x === "string" && x.trim() !== "";

// "High / Medium / Low / Neutral" → pct (0..100)
const confidenceToPct = (v) => {
  const s = String(v || "").toLowerCase();
  if (s.includes("very high")) return 90;
  if (s.includes("high")) return 75;
  if (s.includes("medium")) return 55;
  if (s.includes("low")) return 35;
  if (s.includes("very low")) return 20;
  if (s.includes("neutral")) return 50;
  // if it's already numeric-ish (e.g. "62")
  const n = Number(String(v).replace("%", ""));
  if (Number.isFinite(n)) return Math.max(0, Math.min(100, n));
  return 50;
};

const normalizeBool = (v) => {
  if (typeof v === "boolean") return v;
  const s = String(v || "").trim().toLowerCase();
  if (s === "true" || s === "1" || s === "yes") return true;
  if (s === "false" || s === "0" || s === "no") return false;
  return undefined;
};

const stableKeyForReport = (intelData, idx) => {
  const x = safeObj(intelData);
  return x?.matchId || x?.__group?.matchId || x?.matchLabel || `intel-${idx}`;
};

// ============================================================================
// INSIDER INTEL (PREMIUM BRIEF)
// ============================================================================
const InsiderContent = ({ data, darkMode }) => {
  // Multi report
  if (Array.isArray(data)) {
    const reports = safeArr(data);

    return (
      <div className="space-y-6">
        {reports.map((intelData, idx) => {
          const x = safeObj(intelData);
          const matchLabel = safeText(x?.matchLabel, "");
          const key = stableKeyForReport(x, idx);

          return (
            <div key={key} className="space-y-4">
              {matchLabel && (
                <div
                  className={clsx(
                    "p-4 rounded-xl shadow-lg flex items-center justify-between group relative overflow-hidden border",
                    darkMode ? "bg-slate-950/50 border-purple-500/30" : "bg-[#FDFCF8] border-stone-200 shadow-sm"
                  )}
                >
                  <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12">
                    <Lock size={100} className={darkMode ? "text-slate-400" : "text-stone-300"} />
                  </div>

                  <div className="flex items-center gap-4 relative z-10 min-w-0">
                    <div
                      className={clsx(
                        "p-2.5 rounded-xl border shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]",
                        darkMode ? "bg-purple-500/20 border-purple-500/20" : "bg-white border-stone-200 text-purple-600 shadow-sm"
                      )}
                    >
                      <Lock className={darkMode ? "text-purple-400" : "text-purple-600"} size={20} />
                    </div>

                    <div className="min-w-0">
                      <h3 className={clsx("text-base font-bold tracking-wide truncate", darkMode ? "text-white" : "text-stone-900")} title={matchLabel}>
                        {matchLabel}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                        <span className={clsx("text-[10px] font-mono uppercase tracking-widest", darkMode ? "text-purple-400" : "text-purple-600")}>
                          Classified Intel
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <SingleInsiderBlock data={x} darkMode={darkMode} />
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
            darkMode ? "bg-slate-950/50 border-purple-500/30" : "bg-[#FDFCF8] border-stone-200 shadow-sm"
          )}
        >
          <div
            className={clsx(
              "p-2.5 rounded-xl border shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]",
              darkMode ? "bg-purple-500/20 border-purple-500/20" : "bg-white border-stone-200 shadow-sm"
            )}
          >
            <Lock className={darkMode ? "text-purple-400" : "text-purple-600"} size={20} />
          </div>

          <div className="min-w-0">
            <h3 className={clsx("text-base font-bold tracking-wide truncate", darkMode ? "text-white" : "text-stone-900")} title={matchLabel}>
              {matchLabel}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
              <span className={clsx("text-[10px] font-mono uppercase tracking-widest", darkMode ? "text-purple-400" : "text-purple-600")}>
                Classified Intel
              </span>
            </div>
          </div>
        </div>
      )}

      <SingleInsiderBlock data={x} darkMode={darkMode} />
    </div>
  );
};

const SingleInsiderBlock = ({ data, darkMode }) => {
  const x = safeObj(data);

  const searchEnabled = normalizeBool(x?.search_enabled);
  const rumors = safeArr(x?.rumors);
  const keyInsights = safeArr(x?.key_insights);
  const citations = safeArr(x?.x_citations);

  const sentiment = safeObj(x?.sentiment);

  const homePct = useMemo(() => confidenceToPct(sentiment?.home), [sentiment?.home]);
  const awayPct = useMemo(() => confidenceToPct(sentiment?.away), [sentiment?.away]);

  const showRumors = rumors.length > 0;
  const showSentiment = !!x?.sentiment;
  const showWhispers = !!x?.weather_insider || !!x?.referee_note;
  const showKeyInsights = keyInsights.length > 0;

  const hasAnySignals = showRumors || showSentiment || showWhispers || showKeyInsights || !!x?.raw_content;

  return (
    <div className="space-y-4">
      {/* Intel Header Chips */}
      <div className="flex flex-wrap gap-2">
        {searchEnabled !== undefined && (
          <div
            className={clsx(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide",
              searchEnabled
                ? darkMode
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-white border-emerald-200 text-emerald-700 shadow-sm"
                : darkMode
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-white border-amber-200 text-amber-700 shadow-sm"
            )}
          >
            <Zap size={10} />
            {searchEnabled ? "Deep Scan: Active" : "Scan: Limited"}
          </div>
        )}

        {x?.quality_warning && (
          <div
            className={clsx(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide",
              darkMode ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "bg-white border-amber-200 text-amber-700 shadow-sm"
            )}
          >
            <AlertTriangle size={10} />
            {safeText(x.quality_warning, "Warning")}
          </div>
        )}
      </div>

      {/* Sentiment Meter (data-driven widths) */}
      {showSentiment && (
        <div
          className={clsx(
            "p-4 rounded-xl border relative overflow-hidden",
            darkMode ? "bg-slate-900/60 border-purple-500/30" : "bg-white border-purple-200 shadow-sm"
          )}
        >
          <div
            className={clsx(
              "absolute top-0 left-0 w-1 h-full",
              darkMode ? "bg-gradient-to-b from-purple-500 to-indigo-600" : "bg-gradient-to-b from-purple-400 to-indigo-400"
            )}
          />
          <span className={clsx("text-[10px] font-bold uppercase tracking-widest block mb-3", darkMode ? "text-purple-400" : "text-purple-600")}>
            Community Sentiment
          </span>

          <div className="flex gap-4 items-center">
            {/* Home */}
            <div className="flex-1 space-y-1">
              <div className={clsx("flex justify-between text-[10px] font-mono", darkMode ? "text-slate-400" : "text-slate-500")}>
                <span>Home Confidence</span>
                <span className={clsx(homePct >= 70 ? (darkMode ? "text-emerald-400" : "text-emerald-600") : "")}>
                  {safeText(sentiment?.home, "Neutral")}
                </span>
              </div>
              <div className={clsx("h-1.5 rounded-full overflow-hidden", darkMode ? "bg-slate-800" : "bg-slate-200")}>
                <div className="h-full bg-purple-500/60 animate-pulse" style={{ width: `${homePct}%` }} />
              </div>
            </div>

            {/* Away */}
            <div className="flex-1 space-y-1">
              <div className={clsx("flex justify-between text-[10px] font-mono", darkMode ? "text-slate-400" : "text-slate-500")}>
                <span>Away Confidence</span>
                <span className={clsx(awayPct >= 70 ? (darkMode ? "text-emerald-400" : "text-emerald-600") : "")}>
                  {safeText(sentiment?.away, "Neutral")}
                </span>
              </div>
              <div className={clsx("h-1.5 rounded-full overflow-hidden", darkMode ? "bg-slate-800" : "bg-slate-200")}>
                <div className="h-full bg-indigo-500/60 animate-pulse" style={{ width: `${awayPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contextual Whisper */}
      {showWhispers && (
        <div className="grid grid-cols-1 gap-2">
          {x?.weather_insider && (
            <div
              className={clsx(
                "p-3 rounded-lg border border-dashed flex gap-3 items-start",
                darkMode ? "bg-cyan-950/30 border-cyan-500/30" : "bg-cyan-50 border-cyan-200"
              )}
            >
              <div className={clsx("mt-0.5", darkMode ? "text-cyan-400" : "text-cyan-600")}>
                <Activity size={14} />
              </div>
              <div>
                <p className={clsx("text-[9px] uppercase font-bold mb-0.5", darkMode ? "text-cyan-500" : "text-cyan-700")}>Meteorological Intel</p>
                <p className={clsx("text-xs italic font-mono leading-relaxed", darkMode ? "text-cyan-100/80" : "text-cyan-900/80")}>
                  "{safeText(x.weather_insider, "")}"
                </p>
              </div>
            </div>
          )}

          {x?.referee_note && (
            <div
              className={clsx(
                "p-3 rounded-lg border border-dashed flex gap-3 items-start",
                darkMode ? "bg-amber-950/30 border-amber-500/30" : "bg-amber-50 border-amber-200"
              )}
            >
              <div className={clsx("mt-0.5", darkMode ? "text-amber-400" : "text-amber-600")}>
                <Eye size={14} />
              </div>
              <div>
                <p className={clsx("text-[9px] uppercase font-bold mb-0.5", darkMode ? "text-amber-500" : "text-amber-700")}>Officiating Intel</p>
                <p className={clsx("text-xs italic font-mono leading-relaxed", darkMode ? "text-amber-100/80" : "text-amber-900/80")}>
                  "{safeText(x.referee_note, "")}"
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rumors Feed */}
      {showRumors && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
            <span className={clsx("text-[10px] font-bold uppercase tracking-widest", darkMode ? "text-slate-400" : "text-slate-500")}>Active Rumors</span>
          </div>

          <div className="space-y-2">
            {rumors.map((rumor, i) => {
              const r = typeof rumor === "string" ? { content: rumor } : safeObj(rumor);
              const cred = String(r?.credibility ?? "").toLowerCase();
              const isHigh = cred === "high" || cred.includes("high");

              return (
                <div
                  key={`${safeText(r?.source, "src")}-${i}`}
                  className={clsx(
                    "p-3 rounded-lg border flex gap-3 group transition-colors",
                    darkMode ? "bg-slate-900/40 hover:bg-slate-900/60" : "bg-white hover:bg-slate-50",
                    isHigh ? (darkMode ? "border-purple-500/30" : "border-purple-200 shadow-sm") : darkMode ? "border-slate-700/50" : "border-slate-200"
                  )}
                >
                  <div className="mt-1">
                    {isHigh ? (
                      <div className={clsx("p-1 rounded", darkMode ? "text-purple-400 bg-purple-500/10" : "text-purple-600 bg-purple-100")}>
                        <Lock size={12} />
                      </div>
                    ) : (
                      <div className={clsx(darkMode ? "text-slate-500" : "text-slate-400")}>
                        <Activity size={12} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm",
                          isHigh
                            ? darkMode
                              ? "bg-purple-500 text-white"
                              : "bg-purple-100 text-purple-700"
                            : darkMode
                            ? "bg-slate-700 text-slate-300"
                            : "bg-slate-200 text-slate-600"
                        )}
                      >
                        {safeText(r?.credibility, "Rumor")}
                      </span>

                      {r?.source && (
                        <span className={clsx("text-[9px] font-mono truncate", darkMode ? "text-slate-500" : "text-slate-400")}>
                          via {safeText(r.source, "Unknown")}
                        </span>
                      )}
                    </div>

                    <p className={clsx("text-xs leading-snug font-medium", darkMode ? "text-slate-300" : "text-slate-700")}>
                      {safeText(r?.content, "")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Key Insights */}
      {showKeyInsights && (
        <div className={clsx("p-4 rounded-xl border", darkMode ? "bg-slate-800/20 border-white/5" : "bg-[#FDFCF8] border-stone-200 shadow-sm")}>
          <span className={clsx("text-[10px] font-bold uppercase tracking-widest mb-3 block", darkMode ? "text-cyan-400" : "text-stone-400")}>
            Analyst Keynotes
          </span>
          <ul className="space-y-2">
            {keyInsights.map((insight, i) => (
              <li key={i} className={clsx("flex gap-2 text-xs", darkMode ? "text-slate-300" : "text-stone-600")}>
                <span className={darkMode ? "text-cyan-500" : "text-cyan-600"}>›</span>
                <span className="leading-relaxed">{safeText(insight, "")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Citations */}
      {citations.length > 0 && (
        <div className={clsx("pt-2 border-t border-dashed", darkMode ? "border-slate-800" : "border-slate-300")}>
          <span className={clsx("text-[9px] uppercase font-bold mb-1 block", darkMode ? "text-slate-600" : "text-slate-400")}>
            Verified Sources
          </span>
          <div className="flex flex-wrap gap-1.5">
            {citations.slice(0, 4).map((u, i) => {
              const url = isNonEmptyStr(u) ? u.trim() : "";
              const host = url ? safeHostname(url) : "";
              if (!host) return null;

              return (
                <a
                  key={`${host}-${i}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clsx(
                    "text-[9px] px-2 py-0.5 rounded border transition-colors truncate max-w-[120px]",
                    darkMode
                      ? "text-blue-400 hover:text-white bg-blue-900/10 hover:bg-blue-600 border-blue-500/10"
                      : "text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border-blue-200"
                  )}
                  title={url}
                >
                  {host}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasAnySignals && (
        <div className={clsx("text-center py-6 border-2 border-dashed rounded-xl", darkMode ? "border-slate-800" : "border-slate-200")}>
          <p className={clsx("text-xs font-mono uppercase", darkMode ? "text-slate-600" : "text-slate-400")}>
            Signal Silent. No Chatter Detected.
          </p>
        </div>
      )}
    </div>
  );
};

export default InsiderContent;