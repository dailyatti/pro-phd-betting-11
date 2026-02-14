import React from "react";
import clsx from "clsx";
import {
  Layers,
  Target,
  TrendingUp,
  TrendingDown,
  Zap,
  Search,
  Activity,
  BarChart3,
  ShieldCheck,
  FileText
} from "lucide-react";
import { safeText, toNumber, n } from "../shared";

// ============================================================================
// STRATEGY TERMINAL (PREMIUM & PROFESSIONAL)
// ============================================================================

const StrategyContent = ({ data, isLoading = false, darkMode = true, onAddToHistory, bankroll }) => {
  // Loading state (optional, but safe)
  if (isLoading) {
    return (
      <div
        className={clsx(
          "p-6 rounded-xl border animate-pulse",
          darkMode ? "bg-slate-950 border-slate-800" : "bg-white border-stone-200"
        )}
      >
        <div className={clsx("h-4 w-40 rounded", darkMode ? "bg-slate-800" : "bg-stone-200")} />
        <div className={clsx("mt-4 h-3 w-3/4 rounded", darkMode ? "bg-slate-900" : "bg-stone-100")} />
        <div className={clsx("mt-2 h-3 w-2/3 rounded", darkMode ? "bg-slate-900" : "bg-stone-100")} />
      </div>
    );
  }

  // 1) Multi-match strategies
  if (data?.strategies && Array.isArray(data.strategies)) {
    const strategies = data.strategies.filter(Boolean);

    return (
      <div className="space-y-12">
        {/* GLOBAL PORTFOLIO SUMMARY */}
        <PortfolioSummary
          strategies={strategies}
          darkMode={darkMode}
          onAddToHistory={onAddToHistory}
          bankroll={bankroll}
        />

        {strategies.map((strat, i) => {
          // STRICT FILTER: Check if this strategy has ANY positive EV bets
          // If not, hide the entire match card (including header)
          const hasActionableBets = Array.isArray(strat.recommendations) && strat.recommendations.some(r => {
            const edge = toNumber(r?.math_proof?.edge ?? r?.ev);
            return edge > 0;
          });

          if (!hasActionableBets) return null;

          return (
            <div key={`${strat?.matchLabel ?? "match"}-${i}`} className="space-y-6">
              <MatchHeader label={strat?.matchLabel ?? `Match #${i + 1}`} sport={strat?.sport} darkMode={darkMode} />
              <SingleStrategyBlock data={strat} darkMode={darkMode} />

              {i < strategies.length - 1 && (
                <div className={clsx("h-px w-full my-8", darkMode ? "bg-slate-800" : "bg-stone-200")} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // 2) Single match
  return (
    <div className="space-y-6">
      <PortfolioSummary strategies={[data].filter(Boolean)} darkMode={darkMode} onAddToHistory={onAddToHistory} bankroll={bankroll} />
      {data?.matchLabel && <MatchHeader label={data.matchLabel} sport={data?.sport} darkMode={darkMode} />}
      <SingleStrategyBlock data={data} darkMode={darkMode} />
    </div>
  );
};

const MatchHeader = ({ label, sport, darkMode }) => {
  const id = React.useMemo(() => Math.floor(Math.random() * 10000), []);

  return (
    <div className={clsx("flex items-center justify-between py-4 border-b", darkMode ? "border-slate-800" : "border-stone-200")}>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span
            className={clsx(
              "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
              darkMode ? "bg-cyan-500/10 text-cyan-400" : "bg-cyan-50 text-cyan-700"
            )}
          >
            {sport || "EVENT"}
          </span>
          <span className={clsx("text-[10px] font-mono", darkMode ? "text-slate-500" : "text-slate-400")}>
            ID: {id}
          </span>
        </div>
        <h2 className={clsx("text-xl font-bold tracking-tight", "text-primary")}>{label}</h2>
      </div>

      <div
        className={clsx(
          "p-2 rounded-lg border",
          darkMode ? "bg-slate-900 border-slate-700 hover:border-cyan-500/50" : "bg-white border-slate-200 shadow-sm"
        )}
      >
        <Activity size={20} className={darkMode ? "text-cyan-400" : "text-cyan-600"} />
      </div>
    </div>
  );
};

const SingleStrategyBlock = ({ data, darkMode }) => {
  const recs = Array.isArray(data?.recommendations) ? data.recommendations : [];

  // Robust EV extraction: math_proof.edge can be fraction (0.045) OR percent (4.5)
  const getEvPct = (rec) => {
    const mp = rec?.math_proof;
    let edge = toNumber(mp?.edge);
    if (edge == null) edge = toNumber(rec?.ev);

    // If it's a fraction (0.045), convert to percent (4.5)
    // heuristic: abs(edge) <= 1.2 -> treat as fraction
    if (typeof edge === "number" && Math.abs(edge) <= 1.2) edge = edge * 100;

    if (!Number.isFinite(edge)) return 0;
    return edge;
  };

  const sortedRecs = React.useMemo(() => {
    return [...recs].sort((a, b) => getEvPct(b) - getEvPct(a));
  }, [recs]);

  // IMPORTANT CHANGE:
  // Do NOT hide all "AVOID/0 stake/0 edge" items — that can result in empty UI.
  // We show them, but keep them visually as "AVOID/TRAP". Only hide truly empty noise:
  // missing selection + missing market + missing everything.
  const visibleRecs = React.useMemo(() => {
    return sortedRecs.filter((r) => {
      const sel = String(r?.selection || "").trim();
      const mkt = String(r?.market || "").trim();
      const lvl = String(r?.recommendation_level || "").trim();
      const odds = r?.odds != null;
      const hasAny = !!sel || !!mkt || !!lvl || odds;
      return hasAny;
    });
  }, [sortedRecs]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Recommendations Section */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <SectionLabel icon={Target} label="Investment Opportunities" darkMode={darkMode} className="mb-0" />

          {/* VERIFIED FORMULA BADGE */}
          {data?.formula_selection?.selectedFormulas?.[0] && (
            <div
              className={clsx(
                "flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-bold uppercase tracking-wider",
                darkMode ? "bg-emerald-950/30 border-emerald-900 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"
              )}
            >
              <ShieldCheck size={12} />
              <span>
                Verified Model:{" "}
                {data.formula_selection.selectedFormulas[0].formulaName || data.formula_selection.selectedFormulas[0].formulaId}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {visibleRecs.map((rec, i) => (
            <RecommendationCard key={`${rec?.market ?? "m"}-${rec?.selection ?? "s"}-${i}`} rec={rec} darkMode={darkMode} />
          ))}

          {visibleRecs.length === 0 && (
            <div
              className={clsx(
                "p-8 text-center border rounded-xl border-dashed text-sm",
                darkMode ? "border-slate-800 text-slate-500" : "border-slate-300 text-slate-400"
              )}
            >
              No recommendations returned for this event (empty payload).
            </div>
          )}
        </div>
      </div>

      {/* Analysis Section */}
      <div className="flex flex-col gap-8">
        <div>
          <SectionLabel icon={Search} label="Market Analysis" darkMode={darkMode} />
          <div
            className={clsx(
              "p-6 rounded-xl border h-full",
              darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-white border-slate-200 shadow-sm"
            )}
          >
            <p className={clsx("text-sm leading-relaxed font-mono", darkMode ? "text-slate-300" : "text-slate-600")}>
              {safeText(
                data?.match_analysis?.summary || data?.analysis_summary || data?.match_summary || data?.summary_note,
                "Detailed analysis unavailable."
              )}
            </p>

            {(data?.match_analysis?.key_factors || data?.key_factors) && (
              <div className="mt-6 flex flex-wrap gap-2">
                {(data?.match_analysis?.key_factors || data?.key_factors || []).map((f, i) => (
                  <span
                    key={`${typeof f === "string" ? f : f?.factor ?? "factor"}-${i}`}
                    className={clsx(
                      "text-[10px] px-3 py-1.5 rounded-md border font-medium",
                      darkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"
                    )}
                  >
                    {typeof f === "string" ? f : f?.factor}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <SectionLabel icon={ShieldCheck} label="Bankroll & Risk Strategy" darkMode={darkMode} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data?.risk_assessment?.confidence_level && (
              <div className={clsx("p-5 rounded-xl border", darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-white border-slate-200 shadow-sm")}>
                <div className="flex justify-between items-center mb-4">
                  <span className={clsx("text-xs font-bold uppercase tracking-wider", darkMode ? "text-slate-400" : "text-slate-500")}>
                    Confidence Level
                  </span>
                  <span className={clsx("text-base font-bold", "text-primary")}>
                    {data.risk_assessment.confidence_level}
                  </span>
                </div>

                <div className={clsx("w-full h-1.5 rounded-full overflow-hidden", darkMode ? "bg-slate-800" : "bg-slate-100")}>
                  <div
                    className={clsx(
                      "h-full rounded-full transition-all duration-1000 ease-out",
                      String(data.risk_assessment.confidence_level).toLowerCase().includes("high") ? "bg-emerald-500" : "bg-amber-500"
                    )}
                    style={{ width: "75%" }}
                  />
                </div>
              </div>
            )}

            {data?.money_management && (
              <div className={clsx("p-5 rounded-xl border", darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-white border-slate-200 shadow-sm")}>
                <div className="flex items-center gap-2 mb-4">
                  <Layers size={16} className={darkMode ? "text-indigo-400" : "text-indigo-600"} />
                  <span className={clsx("text-xs font-bold uppercase tracking-wider", darkMode ? "text-indigo-300" : "text-indigo-700")}>
                    Kelly Scenarios
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <DataPoint label="Projected Win" value={data.money_management.bankroll_impact_if_win} color="emerald" darkMode={darkMode} />
                  <DataPoint label="Max Risk" value={data.money_management.bankroll_impact_if_loss} color="red" darkMode={darkMode} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const RecommendationCard = ({ rec, darkMode }) => {
  const proof = rec?.math_proof || {};

  const getEvPct = () => {
    let edge = toNumber(proof.edge);
    if (edge == null) edge = toNumber(rec?.ev);

    if (typeof edge === "number" && Math.abs(edge) <= 1.2) edge = edge * 100; // fraction -> %
    if (!Number.isFinite(edge)) return 0;
    return edge;
  };

  const evValue = getEvPct();

  const odds = toNumber(rec?.odds);
  const impliedProb = odds && odds > 0 ? (100 / odds).toFixed(1) : "—";

  // true prob (prefer math proof)
  let trueProbPct = toNumber(proof.own_prob);
  if (typeof trueProbPct === "number" && Math.abs(trueProbPct) <= 1.2) trueProbPct = trueProbPct * 100;
  if (!Number.isFinite(trueProbPct)) trueProbPct = toNumber(rec?.true_prob);
  if (typeof trueProbPct === "number" && Math.abs(trueProbPct) <= 1.2) trueProbPct = trueProbPct * 100;
  const trueProb = Number.isFinite(trueProbPct) ? trueProbPct : 0;

  const recLevel = String(rec?.recommendation_level || "LEAN").toUpperCase();
  const isInfo = recLevel.includes("INFO") || recLevel.includes("PROJECTED");

  // AVOID if explicitly AVOID or EV <= 0, BUT NOT if it is an INFO/Projection
  const isAvoid = (recLevel.includes("AVOID") || evValue <= 0) && !isInfo;

  const isStrong = recLevel.includes("DIAMOND") || recLevel.includes("STRONG") || recLevel.includes("GOOD");

  const borderColor = isAvoid
    ? darkMode
      ? "border-red-900/50"
      : "border-red-200"
    : isInfo
      ? darkMode
        ? "border-indigo-500/30"
        : "border-indigo-200"
      : isStrong
        ? "border-emerald-500"
        : darkMode
          ? "border-emerald-500/30"
          : "border-emerald-200";

  const glowClass = !isAvoid && isStrong ? "shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]" : "";

  // Back-calc model prob if missing: Edge = p*odds - 1  => p = (1+Edge)/odds
  let displayTrueProb = trueProb;
  if ((!displayTrueProb || displayTrueProb <= 0) && odds > 0 && evValue !== 0) {
    const decimalProb = ((evValue / 100) + 1) / odds;
    displayTrueProb = decimalProb * 100;
  }

  // Calculate displayFairOdds: 1/p
  // Guard against divide by zero (Infinity) or NaN
  let displayFairOdds = "—";
  if (displayTrueProb > 0) {
    const fair = 100 / displayTrueProb;
    if (Number.isFinite(fair)) displayFairOdds = fair.toFixed(2);
  } else if (odds > 0 && Number.isFinite(evValue)) {
    // Derived from odds and EV if prob missing
    const fair = odds / ((evValue / 100) + 1);
    if (Number.isFinite(fair)) displayFairOdds = fair.toFixed(2);
  }

  const stakeShown = isAvoid ? "0 units" : safeText(rec?.stake_size, "1 Unit");

  return (
    <div
      className={clsx(
        "relative rounded-lg border p-5 transition-all group min-w-0 overflow-hidden",
        darkMode ? "bg-slate-950/50" : "bg-white shadow-sm",
        borderColor,
        glowClass
      )}
    >
      {!isAvoid && (
        <div
          className={clsx(
            "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-bl-full pointer-events-none transition-opacity",
            darkMode ? "opacity-100" : "opacity-0"
          )}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4 relative z-10 min-w-0">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <BadgeLabel label={rec?.market || "MARKET"} color="slate" darkMode={darkMode} />
            {recLevel.includes("DIAMOND") && <BadgeLabel label="DIAMOND EDGE" color="cyan" darkMode={darkMode} />}
            {recLevel.includes("GOLD") && <BadgeLabel label="GOLD TIER" color="amber" darkMode={darkMode} />}
            {isInfo && <BadgeLabel label="PROJECTED" color="indigo" darkMode={darkMode} />}
            {isAvoid && <BadgeLabel label="AVOID / TRAP" color="red" darkMode={darkMode} />}
          </div>

          <h3 className={clsx("text-xl font-bold tracking-tight break-words", "text-primary")}>
            {safeText(rec?.selection, "Selection Name")}
          </h3>

          <p className={clsx("text-xs font-medium leading-relaxed max-w-2xl mt-1.5 break-words whitespace-pre-wrap", darkMode ? "text-slate-400" : "text-slate-500")}>
            {safeText(rec?.reasoning, "No detailed reasoning provided.")}
          </p>
        </div>

        {/* KPI BOXES */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* BOOKMAKER ODDS */}
          <div className={clsx("relative overflow-hidden group/box rounded-xl border min-w-[90px] transition-all", darkMode ? "bg-slate-900 border-slate-700 hover:border-slate-600" : "bg-white border-slate-200 shadow-sm")}>
            <div className={clsx("absolute top-0 inset-x-0 h-1", darkMode ? "bg-amber-500/50" : "bg-amber-400")} />
            <div className="px-3 py-2.5 text-center">
              <div className={clsx("flex items-center justify-center gap-1.5 mb-1 text-[8px] font-bold uppercase tracking-wider", darkMode ? "text-amber-500" : "text-amber-600")}>
                <Activity size={10} strokeWidth={3} />
                <span>Bookie</span>
              </div>
              <div className={clsx("text-xl font-mono font-bold leading-none tracking-tight", "text-primary")}>
                {rec?.source_odds != null ? (toNumber(rec.source_odds) ?? 0).toFixed(2) : odds && odds > 0 ? odds.toFixed(2) : "—"}
              </div>
            </div>
          </div>

          {/* FAIR VALUE / MODEL ODDS */}
          <div className={clsx("relative overflow-hidden group/box rounded-xl border min-w-[90px] transition-all", darkMode ? "bg-cyan-950/20 border-cyan-800/50 hover:border-cyan-500/30" : "bg-cyan-50/50 border-cyan-200 shadow-sm")}>
            <div className={clsx("absolute top-0 inset-x-0 h-1", darkMode ? "bg-cyan-500/50" : "bg-cyan-400")} />
            <div className="px-3 py-2.5 text-center">
              <div className={clsx("flex items-center justify-center gap-1.5 mb-1 text-[8px] font-bold uppercase tracking-wider", darkMode ? "text-cyan-400" : "text-cyan-700")}>
                <Zap size={10} strokeWidth={3} />
                <span>Fair</span>
              </div>
              <div className={clsx("text-xl font-mono font-bold leading-none tracking-tight", darkMode ? "text-cyan-300" : "text-cyan-700")}>
                {displayFairOdds}
              </div>
            </div>
          </div>

          {/* EDGE (EV) */}
          <div
            className={clsx(
              "relative overflow-hidden group/box rounded-xl border min-w-[90px] transition-all",
              isAvoid
                ? darkMode
                  ? "bg-red-950/20 border-red-900/50"
                  : "bg-red-50 border-red-100"
                : darkMode
                  ? "bg-emerald-950/20 border-emerald-900/50"
                  : "bg-emerald-50 border-emerald-100"
            )}
          >
            <div className={clsx("absolute top-0 inset-x-0 h-1", isAvoid ? "bg-red-500" : "bg-emerald-500")} />
            <div className="px-3 py-2.5 text-center">
              <div className={clsx("flex items-center justify-center gap-1.5 mb-1 text-[8px] font-bold uppercase tracking-wider", isAvoid ? "text-red-500" : "text-emerald-500")}>
                {isAvoid ? <TrendingDown size={10} strokeWidth={3} /> : <TrendingUp size={10} strokeWidth={3} />}
                <span>Edge</span>
              </div>
              <div className={clsx("text-xl font-mono font-bold leading-none tracking-tight flex items-center justify-center", isAvoid ? "text-red-400" : "text-emerald-400")}>
                {evValue > 0 ? "+" : ""}
                {Number(evValue).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUANTITATIVE AUDIT */}
      <div className={clsx("mt-4 pt-4 border-t", darkMode ? "border-slate-800" : "border-slate-100")}>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={14} className={darkMode ? "text-slate-500" : "text-slate-400"} />
          <span className={clsx("text-[10px] font-bold uppercase tracking-widest", darkMode ? "text-slate-500" : "text-slate-400")}>
            Quantitative Validation
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DataPoint label="Implied Prob" value={`${impliedProb}%`} color="slate" darkMode={darkMode} />
          <DataPoint label="Model Prob" value={displayTrueProb > 0 ? `${displayTrueProb.toFixed(1)}%` : "N/A"} color="cyan" darkMode={darkMode} />
          <DataPoint label="Kelly Stake" value={stakeShown} color={isAvoid ? "red" : "indigo"} darkMode={darkMode} />
          <DataPoint label="True Odds" value={displayFairOdds} color="cyan" darkMode={darkMode} />
        </div>
      </div>

      {/* SMART MONEY SIGNAL */}
      {(rec?.smart_money_signal || rec?.sharp_action) && (
        <div className={clsx("mt-3 flex items-start gap-2 p-2 rounded bg-indigo-500/5 border border-indigo-500/10 text-[10px]", darkMode ? "text-indigo-300" : "text-indigo-700")}>
          <Zap size={14} className="shrink-0 mt-0.5" />
          <span>
            <span className="font-bold">SMART MONEY:</span> {rec.smart_money_signal || rec.sharp_action}
          </span>
        </div>
      )}

      {/* PhD Math Breakdown - ALWAYS Visible for transparency */}
      <div className={clsx("mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]", darkMode ? "border-white/5 text-slate-400" : "border-stone-200 text-stone-500")}>
        <div className="flex flex-col">
          <span className="uppercase opacity-50 tracking-wider">Model Prob</span>
          <span className={clsx("font-mono text-xs", (rec.math_proof?.own_prob > rec.math_proof?.implied_prob) ? "text-emerald-400" : "")}>
            {((rec.math_proof?.own_prob || 0) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="uppercase opacity-50 tracking-wider">
            {rec.math_proof?.implied_prob_vigfree ? "Fair Implied" : "Implied Prob"}
          </span>
          <span className="font-mono text-xs">
            {(((rec.math_proof?.implied_prob_vigfree || rec.math_proof?.implied_prob) || 0) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="uppercase opacity-50 tracking-wider">Metric Snapshot</span>
          <span className="font-mono text-xs truncate break-all" title={rec.math_proof?.metrics_snapshot}>
            {rec.math_proof?.metrics_snapshot || "-"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="uppercase opacity-50 tracking-wider">Kelly Criteria</span>
          <span className="font-mono text-xs">
            {((rec.math_proof?.kelly || 0) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

// --- SHARED COMPONENTS ---

const SectionLabel = ({ icon: Icon, label, darkMode, className }) => (
  <div className={clsx("flex items-center gap-2 mb-4 px-1", className)}>
    <Icon size={16} className={darkMode ? "text-emerald-500" : "text-emerald-600"} />
    <span className={clsx("text-xs font-bold uppercase tracking-widest", darkMode ? "text-slate-400" : "text-slate-500")}>
      {label}
    </span>
  </div>
);

const BadgeLabel = ({ label, color = "slate", darkMode }) => {
  const colors = {
    slate: darkMode ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-500 border-slate-200",
    cyan: darkMode ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-cyan-50 text-cyan-700 border-cyan-200",
    amber: darkMode ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-200",
    red: darkMode ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-50 text-red-700 border-red-200",
    indigo: darkMode ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

  return (
    <span className={clsx("text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider", colors[color])}>
      {label}
    </span>
  );
};

const DataPoint = ({ label, value, color = "slate", darkMode }) => {
  const textColors = {
    slate: darkMode ? "text-slate-300" : "text-slate-700",
    cyan: darkMode ? "text-cyan-400" : "text-cyan-600",
    emerald: darkMode ? "text-emerald-400" : "text-emerald-600",
    red: darkMode ? "text-red-400" : "text-red-600",
    indigo: darkMode ? "text-indigo-300" : "text-indigo-600",
  };

  return (
    <div>
      <p className={clsx("text-[9px] uppercase font-bold mb-0.5", darkMode ? "text-slate-500" : "text-slate-400")}>{label}</p>
      <p className={clsx("text-sm font-mono font-bold", textColors[color])}>{value}</p>
    </div>
  );
};

const PortfolioSummary = ({ strategies, darkMode, onAddToHistory, bankroll }) => {
  const safeStrategies = Array.isArray(strategies) ? strategies.filter(Boolean) : [];

  // Flatten ALL recommendations (no filtering here!)
  const allRecs = React.useMemo(() => {
    return safeStrategies.flatMap((s) => {
      const recs = Array.isArray(s?.recommendations) ? s.recommendations : [];
      return recs.map((r) => {
        // robust edge -> percent
        let edge = toNumber(r?.math_proof?.edge);
        if (edge == null) edge = toNumber(r?.ev);
        if (typeof edge === "number" && Math.abs(edge) <= 1.2) edge = edge * 100;
        const edgeSafe = Number.isFinite(edge) ? edge : 0;

        const isAvoid =
          String(r?.recommendation_level || "").toUpperCase().includes("AVOID") || edgeSafe <= 0;

        const stakeStrRaw = isAvoid ? "0 Units" : (r?.stake_size || "1 Unit");
        const stakeStr = String(stakeStrRaw);

        // Calculate stake % (0 for AVOID)
        let stakePct = 0;

        if (!isAvoid) {
          if (stakeStr.includes("%")) {
            stakePct = parseFloat(stakeStr) || 0;
          } else if (stakeStr.toLowerCase().includes("unit")) {
            const units = parseFloat(stakeStr) || 0;
            stakePct = units * 1; // 1 unit = 1%
          } else {
            // unknown -> fallback
            stakePct = 1;
          }
        }

        const safeBankroll = Number.isFinite(+bankroll) && +bankroll > 0 ? +bankroll : 300;
        const dollarAmt = isAvoid ? 0 : Number((safeBankroll * (stakePct / 100)).toFixed(2));

        return {
          ...r,
          matchLabel: s?.matchLabel || "Unknown Event",
          edge: edgeSafe,
          stakeAmt: stakeStr,
          stakePct,
          dollarAmt,
          isAvoid,
        };
      });
    });
  }, [safeStrategies, bankroll]);

  // Deduplicate + Normalize + Filter (Capital Allocation Table)
  const uniqueRecs = React.useMemo(() => {
    const out = [];
    const seen = new Set();

    for (const rec of allRecs) {
      // Robust Key: Match + Market + Selection + Odds (prevents "Sacramento +0" overwrite with "Sacramento +5")
      const key = `${rec.matchLabel ?? "match"}__${rec.market ?? "mkt"}__${rec.selection ?? "sel"}__${rec.odds ?? "0"}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(rec);
      }
    }

    return out
      .map((r) => {
        const edge = n(r.edge, 0);

        // normalize stake
        let stakeStr = String(r.stakeAmt || r.stake_size || "").trim();
        if (!stakeStr) stakeStr = edge > 0 ? "1 Unit" : "0 Units";

        let stakePct = 0;
        if (stakeStr.includes("%")) {
          stakePct = parseFloat(stakeStr) || 0;
        } else if (stakeStr.toLowerCase().includes("unit")) {
          const units = parseFloat(stakeStr) || 0;
          stakePct = units * 1;
        } else {
          stakePct = edge > 0 ? 1 : 0;
          stakeStr = edge > 0 ? "1 Unit" : "0 Units";
        }

        // Safe Bankroll Calc
        const safeBankroll = n(bankroll, 300);
        const dollarAmt = edge > 0 ? Number((safeBankroll * (stakePct / 100)).toFixed(2)) : 0;

        const isInfo = String(r?.recommendation_level || "").toUpperCase().includes("INFO");
        const isAvoid =
          (!!r.isAvoid || String(r?.recommendation_level || "").toUpperCase().includes("AVOID") || edge <= 0) && !isInfo;

        return {
          ...r,
          edge: isAvoid ? 0 : edge, // Hard rule: No EV display for AVOID
          isAvoid,
          isInfo,
          stakeAmt: isAvoid ? "0 Units" : stakeStr,
          stakePct: isAvoid ? 0 : stakePct,
          dollarAmt: isAvoid ? 0 : dollarAmt
        };
      })
      // STRICT FILTER (User Request): Only show actionable bets with real dollar allocation
      // Hide "PROJECTED" (Info) and "AVOID" (Zero Edge) from the capital table
      .filter(r => r.dollarAmt > 0)
      .sort((a, b) => n(b.edge) - n(a.edge));
  }, [allRecs, bankroll]);

  const handleSavePositiveEV = () => {
    if (!onAddToHistory) return;

    const smartStrategies = safeStrategies
      .map((strat) => {
        const originalRecs = Array.isArray(strat.recommendations) ? strat.recommendations : [];
        const positiveRecs = originalRecs.filter((r) => {
          const edge = n(r?.math_proof?.edge ?? r?.ev, 0);
          const isInfo = String(r?.recommendation_level || "").toUpperCase().includes("INFO");
          return edge > 0 && !isInfo;
        });

        if (positiveRecs.length === 0) return null;

        const safeBankroll = Number.isFinite(+bankroll) && +bankroll > 0 ? +bankroll : 300;

        const updatedRecs = positiveRecs.map((r) => {
          const stakeStrRaw = r?.stake_size || "1 Unit";
          let stakePct = 1;

          if (String(stakeStrRaw).includes("%")) {
            stakePct = parseFloat(stakeStrRaw) || 1;
          } else if (String(stakeStrRaw).toLowerCase().includes("unit")) {
            const units = parseFloat(stakeStrRaw) || 1;
            stakePct = units * 1;
          }

          const dollarAmt = Number((safeBankroll * (stakePct / 100)).toFixed(2));
          return { ...r, stake_size: `${stakeStrRaw} (~$${dollarAmt})` };
        });

        return { ...strat, recommendations: updatedRecs };
      })
      .filter(Boolean);

    if (smartStrategies.length === 0) {
      alert("No Positive EV bets found to save to History.");
      return;
    }

    onAddToHistory(smartStrategies);
  };

  const handleDownloadTxt = () => {
    let content = "PHD BETTING INTELLIGENCE - FULL ANALYSIS REPORT\n";
    content += `Date: ${new Date().toLocaleString()}\n`;
    content += `Bankroll Basis: $${bankroll}\n`;
    content += "=================================================\n\n";

    safeStrategies.forEach((strat, i) => {
      content += `MATCH ${i + 1}: ${strat.matchLabel || "Unknown"}\n`;
      content += `Sport: ${strat.sport || "Unknown"}\n`;
      content += `Summary: ${strat.analysis_summary || strat?.match_analysis?.summary || "N/A"}\n\n`;

      const recs = Array.isArray(strat.recommendations) ? strat.recommendations : [];
      recs.forEach((r, j) => {
        let edge = toNumber(r?.math_proof?.edge);
        if (edge == null) edge = toNumber(r?.ev);
        if (typeof edge === "number" && Math.abs(edge) <= 1.2) edge = edge * 100;
        edge = Number(edge) || 0;

        content += `  BET #${j + 1}: ${safeText(r.selection, "N/A")} (${safeText(r.market, "N/A")})\n`;
        content += `  Odds: ${safeText(r.odds, "N/A")}\n`;
        content += `  EV/Edge: ${edge.toFixed(2)}%\n`;
        content += `  Kelly Stake: ${safeText(r.stake_size, "N/A")}\n`;
        content += `  Reasoning: ${safeText(r.reasoning, "N/A")}\n`;
        content += `  Recommendation: ${safeText(r.recommendation_level, "N/A")}\n`;
        content += "  -------------------------------------------------\n";
      });
      content += "\n=================================================\n\n";
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `phd_analysis_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeBets = uniqueRecs.filter((r) => !r.isAvoid && (Number(r.edge) || 0) > 0);
  const totalDollarExposure = activeBets.reduce((acc, curr) => acc + (Number(curr.dollarAmt) || 0), 0);

  return (
    <div
      className={clsx(
        "rounded-xl border border-subtle overflow-hidden mb-8 shadow-sm transition-all duration-300",
        darkMode ? "bg-slate-950/50 shadow-[0_0_20px_-5px_rgba(16,185,129,0.05)]" : "bg-white/50 shadow-slate-200/50"
      )}
    >
      {/* Header Toolbar */}
      <div className={clsx("flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b", darkMode ? "bg-slate-900/50 border-white/5" : "bg-slate-50 border-slate-200")}>
        <div className="flex items-center gap-3">
          <div className={clsx("p-2 rounded-lg", darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-800")}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className={clsx("text-base font-bold tracking-tight uppercase leading-none", "text-primary")}>
              Capital Allocation
            </h3>
            <p className={clsx("text-[10px] font-medium mt-1 uppercase tracking-wider opacity-70", darkMode ? "text-slate-400" : "text-stone-500")}>
              Bankroll: <span className="text-emerald-500 font-bold">${Number.isFinite(+bankroll) && +bankroll > 0 ? +bankroll : 300}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onAddToHistory && (
            <button
              onClick={handleSavePositiveEV}
              className={clsx(
                "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md border transition-colors flex items-center gap-1.5",
                darkMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              )}
              title="Save ONLY Positive EV bets to Internal History"
            >
              <TrendingUp size={14} />
              Save to History (+EV Only)
            </button>
          )}

          <button
            onClick={handleDownloadTxt}
            className={clsx(
              "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md border transition-colors flex items-center gap-1.5",
              darkMode ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            )}
            title="Download FULL analysis report (including negative EV) to text file"
          >
            <FileText size={14} />
            Save as .txt (All)
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr
              className={clsx(
                "border-b text-[9px] uppercase tracking-widest font-bold",
                darkMode ? "border-white/5 text-slate-500 bg-slate-900/20" : "border-stone-200 text-stone-400 bg-stone-50/50"
              )}
            >
              <th className="py-3 px-5">Market / Event</th>
              <th className="py-3 px-4">Selection</th>
              <th className="py-3 px-4 text-right">Edge (EV)</th>
              <th className="py-3 px-4 text-right">Kelly Stake</th>
              <th className="py-3 px-5 text-right">Value</th>
            </tr>
          </thead>

          <tbody className={clsx("divide-y", darkMode ? "divide-white/5" : "divide-stone-100")}>
            {uniqueRecs.map((rec, i) => (
              <tr
                key={`${rec.matchLabel}-${rec.market}-${rec.selection}-${i}`}
                className={clsx(
                  "group transition-colors",
                  rec.isAvoid
                    ? darkMode
                      ? "bg-red-950/10 hover:bg-red-950/20"
                      : "bg-red-50/50 hover:bg-red-100/50"
                    : darkMode
                      ? "hover:bg-white/[0.02]"
                      : "hover:bg-stone-50"
                )}
              >
                <td className="py-3 px-5">
                  <span
                    className={clsx(
                      "block text-xs font-medium mb-0.5",
                      rec.isAvoid ? (darkMode ? "text-red-400" : "text-red-700") : darkMode ? "text-slate-300" : "text-stone-800"
                    )}
                  >
                    {safeText(rec.matchLabel, "Unknown Event")}
                  </span>
                  {rec.isAvoid && (
                    <span className={clsx("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", darkMode ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-700")}>
                      AVOID
                    </span>
                  )}
                  {rec.isInfo && (
                    <span className={clsx("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", darkMode ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-700")}>
                      PROJECTED
                    </span>
                  )}
                </td>

                <td className="py-3 px-4">
                  <span
                    className={clsx(
                      "font-bold text-xs px-2 py-1 rounded inline-block",
                      rec.isAvoid
                        ? darkMode
                          ? "bg-red-900/30 text-red-300 border border-red-800/50"
                          : "bg-red-50 text-red-800 border border-red-200"
                        : darkMode
                          ? "bg-slate-800 text-slate-200"
                          : "bg-stone-100 text-stone-900 border border-stone-200"
                    )}
                  >
                    {safeText(rec.selection, "Selection")}
                  </span>
                </td>

                <td
                  className={clsx(
                    "py-3 px-4 text-right font-mono text-xs font-bold",
                    Number(rec.edge) > 0
                      ? (darkMode ? "text-cyan-400" : "text-cyan-700")
                      : rec.isInfo
                        ? (darkMode ? "text-indigo-400" : "text-indigo-600")
                        : (darkMode ? "text-red-400" : "text-red-600")
                  )}
                >
                  {Number(rec.edge) > 0 ? "+" : ""}
                  {Number(rec.edge || 0).toFixed(1)}%
                </td>

                <td className={clsx("py-3 px-4 text-right font-mono text-xs", rec.isAvoid ? (darkMode ? "text-red-400/60" : "text-red-500") : darkMode ? "text-slate-400" : "text-stone-600")}>
                  {safeText(rec.stakeAmt, rec.isAvoid ? "0 Units" : "1 Unit")}
                </td>

                <td className={clsx("py-3 px-5 text-right font-mono font-bold text-sm",
                  rec.isAvoid
                    ? (darkMode ? "text-red-400" : "text-red-600")
                    : rec.isInfo
                      ? (darkMode ? "text-indigo-400" : "text-indigo-600")
                      : (darkMode ? "text-emerald-400" : "text-emerald-600")
                )}>
                  ${Number(rec.dollarAmt || 0).toFixed(2)}
                </td>
              </tr>
            ))}

            {uniqueRecs.length === 0 && (
              <tr>
                <td colSpan={5} className={clsx("py-10 text-center text-sm", darkMode ? "text-slate-500" : "text-stone-500")}>
                  {/* If we have HIDDEN bets (AVOID), show a hint */}
                  All potential bets were filtered as Non-Investable (Edge ≤ 0% or AVOID).
                  <br />
                  <span className="text-xs opacity-70">Check the "Strategy" cards below for details on why these were rejected.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      <div className={clsx("px-5 py-3 border-t flex items-center justify-between text-xs", darkMode ? "bg-slate-900/30 border-white/5 text-slate-400" : "bg-stone-50 border-stone-200 text-stone-500")}>
        <div className="flex gap-4">
          <span>
            Total Tips: <strong className={darkMode ? "text-white" : "text-stone-900"}>{uniqueRecs.length}</strong>
          </span>

          <span className={clsx("px-2 py-0.5 rounded text-[9px] font-bold", darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-700")}>
            Active: {uniqueRecs.filter(r => (Number(r.edge) || 0) > 0).length}
          </span>

          <span className={clsx("px-2 py-0.5 rounded text-[9px] font-bold", darkMode ? "bg-slate-500/10 text-slate-400" : "bg-slate-100 text-slate-600")}>
            Filtered: {allRecs.length - uniqueRecs.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span>Total Exposure:</span>
          <span className={clsx("font-mono font-bold text-sm", darkMode ? "text-emerald-400" : "text-emerald-700")}>
            ${totalDollarExposure.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StrategyContent;