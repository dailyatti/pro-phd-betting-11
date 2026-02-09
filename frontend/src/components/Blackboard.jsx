import React, { useMemo, useCallback } from "react";
import { Eye, BookOpen, UserRound, Brain, Loader2, CheckCircle2 } from "lucide-react";
import AgentCard from "./AgentCard";

// ============================================================================
// CONFIG
// ============================================================================
const DATA_AGENTS = [
  {
    id: "VISION",
    title: "Vision Scraper",
    agentName: "Vision Pro",
    icon: Eye,
    color: "cyan",
    stateKey: "MATCH_DATA",
    delay: 0.1,
  },
  {
    id: "FACTS",
    title: "Fact Checker",
    agentName: "Deep Fact Engine",
    icon: BookOpen,
    color: "blue",
    stateKey: "FACT_REPORT",
    delay: 0.2,
  },
  {
    id: "INTEL",
    title: "Inside Intel",
    agentName: "Social Intelligence",
    icon: UserRound,
    color: "purple",
    stateKey: "INSIDER_INTEL",
    delay: 0.3,
  },
];

const STRATEGY_AGENT = {
  id: "STRATEGY",
  title: "Master Strategist",
  agentName: "PhD Strategist",
  icon: Brain,
  color: "emerald",
  stateKey: "STRATEGY_REPORT",
  delay: 0.5,
  isLarge: true,
};

const ALL_AGENTS = [...DATA_AGENTS, STRATEGY_AGENT];

// ============================================================================
// HELPERS
// ============================================================================
const isNonEmpty = (x) => {
  if (!x) return false;
  if (Array.isArray(x)) return x.length > 0;
  if (typeof x === "object") return Object.keys(x).length > 0;
  return true;
};

const normalizeStatus = (status) => String(status || "IDLE").trim().toUpperCase();

// ============================================================================
// PURGE-SAFE TAILWIND MAPS
// ============================================================================
const STEP_DOT = {
  done: "bg-emerald-500 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]",
  active: {
    cyan: "bg-cyan-500 border-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.4)] scale-125",
    blue: "bg-blue-500 border-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.4)] scale-125",
    purple: "bg-purple-500 border-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.4)] scale-125",
    emerald: "bg-emerald-500 border-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.4)] scale-125",
  },
  inactive: "bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700", // "bg-subtle" replacement
};

const STEP_LINE = {
  done: "bg-emerald-500/50",
  active: "bg-gradient-to-r from-emerald-500/50 to-slate-200 dark:to-slate-800", // "to-subtle" replacement
  inactive: "bg-slate-200 dark:bg-slate-800",
};

// ============================================================================
// COMPONENT
// ============================================================================
const Blackboard = ({
  state = {},
  status = "IDLE",
  darkMode = true,
  onAddToHistory,
  bankroll,
  showLongRunningHint = true,
  longRunningHintText = "Deep Analysis in Progress. This may take 5-10 minutes depending on match volume.",
}) => {
  const st = useMemo(() => normalizeStatus(status), [status]);
  const isIdle = st === "IDLE";
  const isComplete = st === "COMPLETE";
  const isError = st === "ERROR";

  // Manage expanded state locally
  // Vision and Strategy default to OPEN. Others (Facts, Intel) default to CLOSED.
  const [expanded, setExpanded] = React.useState({ VISION: true, STRATEGY: true });

  const toggleExpanded = useCallback((id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Has any agent produced data?
  const hasAnyData = useMemo(() => {
    if (!state) return false;
    return ALL_AGENTS.some((a) => isNonEmpty(state?.[a.stateKey]));
  }, [state]);

  // Completed agents count (based on actual data presence)
  const completedCount = useMemo(() => {
    return ALL_AGENTS.reduce((acc, a) => acc + (isNonEmpty(state?.[a.stateKey]) ? 1 : 0), 0);
  }, [state]);

  // Compute current active index from status
  const activeIndex = useMemo(() => {
    if (isIdle) return -1;
    if (isComplete) return ALL_AGENTS.length - 1;
    const idx = ALL_AGENTS.findIndex((a) => a.id === st);
    return idx >= 0 ? idx : 0;
  }, [st, isIdle, isComplete]);

  // Running means not idle/complete and not all data is present yet
  const isRunning = useMemo(() => {
    if (isIdle || isComplete || isError) return false;
    return completedCount < ALL_AGENTS.length;
  }, [isIdle, isComplete, isError, completedCount]);

  // Agent status for AgentCard
  const getAgentStatus = useCallback(
    (agentId, data) => {
      if (isError) return "error";
      if (isNonEmpty(data)) return "complete";
      if (isComplete) return "complete";
      if (!isIdle && st === agentId) return "active";
      return "idle";
    },
    [isIdle, isComplete, isError, st]
  );

  // ========================================================================
  // EMPTY STATE
  // ========================================================================
  if (!hasAnyData && isIdle) {
    return (
      <div
        className={[
          "h-full min-h-[420px] flex items-center justify-center p-12 rounded-3xl border-2 border-dashed transition-all duration-500",
          darkMode ? "bg-panel border-subtle text-muted" : "bg-panel border-subtle text-muted shadow-inner",
        ].join(" ")}
      >
        <div className="text-center animate-in fade-in zoom-in duration-700">
          <div className="relative inline-block mb-6">
            <Brain size={72} className={darkMode ? "text-slate-700/50" : "text-slate-200"} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={[
                  "w-3 h-3 rounded-full animate-pulse",
                  darkMode ? "bg-cyan-500/50" : "bg-slate-300",
                ].join(" ")}
              />
            </div>
          </div>

          <h3 className={["text-xl font-bold mb-2", darkMode ? "text-slate-300" : "text-slate-700"].join(" ")}>
            System Standby
          </h3>

          <p className="max-w-sm mx-auto text-sm leading-relaxed">
            Upload match screenshots to initiate multi-agent contextual analysis.
            <span className="block mt-2 text-xs opacity-80">Vision → Facts → Intel → Strategy</span>
          </p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // MAIN UI
  // ========================================================================
  return (
    <div className="flex flex-col gap-6 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* PIPELINE HEADER */}
      <div
        className={[
          "rounded-2xl border p-1 relative overflow-hidden transition-all duration-500",
          darkMode ? "bg-panel border-subtle shadow-lg" : "bg-panel border-subtle shadow-md",
        ].join(" ")}
      >
        {/* Animated Background Effect when Running */}
        {isRunning && (
          <div className="absolute inset-0 z-0">
            <div
              className={[
                "absolute inset-0 opacity-20 animate-pulse",
                darkMode
                  ? "bg-gradient-to-r from-cyan-900/40 via-transparent to-cyan-900/40"
                  : "bg-gradient-to-r from-cyan-100 via-transparent to-cyan-100",
              ].join(" ")}
            />
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50 animate-shimmer" />
          </div>
        )}

        {/* Subtle Border Effect when not running */}
        {!isRunning && (
          <div
            className={[
              "absolute inset-0 opacity-10 pointer-events-none",
              darkMode ? "bg-gradient-to-r from-cyan-500/20 to-transparent" : "bg-gradient-to-r from-cyan-500/10 to-transparent",
            ].join(" ")}
          />
        )}

        <div className={["rounded-xl px-5 py-4 flex items-center justify-between relative z-10", "bg-panel/90 backdrop-blur-sm"].join(" ")}>
          <div className="flex items-center gap-5">
            {/* Status Icon Ring */}
            <div className="relative">
              {isRunning && <div className="absolute inset-0 rounded-xl bg-cyan-500 blur-md opacity-20 animate-pulse" />}
              <div
                className={[
                  "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500 border",
                  darkMode
                    ? isRunning
                      ? "bg-black border-cyan-500/50 text-cyan-400"
                      : isError
                        ? "bg-black border-rose-500/40 text-rose-400"
                        : "bg-black border-emerald-500/20 text-emerald-400"
                    : isRunning
                      ? "bg-white border-cyan-200 text-cyan-600"
                      : isError
                        ? "bg-white border-rose-200 text-rose-600"
                        : "bg-white border-emerald-200 text-emerald-600",
                ].join(" ")}
              >
                {isRunning ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
            </div>

            <div>
              <div className={["text-lg font-bold tracking-tight flex items-center gap-2", darkMode ? "text-white" : "text-slate-900"].join(" ")}>
                PhD Betting Intelligence Pipeline
                {isRunning && (
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse">
                    LIVE ANALYSIS
                  </span>
                )}
                {isError && (
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    ERROR
                  </span>
                )}
              </div>

              <div className="flex flex-col mt-1">
                <div className="flex items-center gap-2">
                  <span className={["text-xs font-mono uppercase tracking-wider", darkMode ? "text-slate-400" : "text-slate-500"].join(" ")}>
                    {completedCount}/{ALL_AGENTS.length} modules completed
                  </span>

                  {isRunning && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                    </span>
                  )}
                </div>

                {/* Long running hint (optional) */}
                {isRunning && showLongRunningHint && (
                  <div className="mt-2 text-xs text-amber-500 flex items-center gap-1.5 font-medium animate-in fade-in slide-in-from-left-2 duration-700">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {longRunningHintText}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step dots with connecting lines */}
          <div className="hidden md:flex items-center gap-1">
            {ALL_AGENTS.map((a, idx) => {
              const done = isNonEmpty(state?.[a.stateKey]) || isComplete;
              const active = idx === activeIndex && !done && !isIdle && !isError;

              return (
                <div key={a.id} className="flex items-center">
                  <div
                    title={a.title}
                    className={[
                      "h-3 w-3 rounded-full transition-all duration-500 border-2",
                      done
                        ? STEP_DOT.done
                        : active
                          ? STEP_DOT.active[a.color] || STEP_DOT.active.cyan
                          : STEP_DOT.inactive,
                    ].join(" ")}
                  />
                  {idx < ALL_AGENTS.length - 1 && (
                    <div
                      className={[
                        "w-6 h-0.5 rounded-full mx-1 transition-colors duration-500",
                        done && (isNonEmpty(state?.[ALL_AGENTS[idx + 1].stateKey]) || isComplete)
                          ? STEP_LINE.done
                          : active
                            ? STEP_LINE.active
                            : STEP_LINE.inactive,
                      ].join(" ")}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TOP GRID: VISION & STRATEGY */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* VISION */}
        {DATA_AGENTS.filter((a) => a.id === "VISION").map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            data={state?.[agent.stateKey]}
            status={getAgentStatus(agent.id, state?.[agent.stateKey])}
            darkMode={darkMode}
            isExpanded={expanded[agent.id]}
            onExpand={() => toggleExpanded(agent.id)}
            className="h-full"
          />
        ))}

        {/* STRATEGY */}
        <AgentCard
          agent={STRATEGY_AGENT}
          data={state?.[STRATEGY_AGENT.stateKey]}
          status={getAgentStatus(STRATEGY_AGENT.id, state?.[STRATEGY_AGENT.stateKey])}
          darkMode={darkMode}
          isExpanded={expanded[STRATEGY_AGENT.id]}
          onExpand={() => toggleExpanded(STRATEGY_AGENT.id)}
          className="h-full"
          onAddToHistory={onAddToHistory}
          bankroll={bankroll}
        />
      </div>

      {/* BOTTOM GRID: EVIDENCE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {DATA_AGENTS.filter((a) => a.id !== "VISION").map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            data={state?.[agent.stateKey]}
            status={getAgentStatus(agent.id, state?.[agent.stateKey])}
            darkMode={darkMode}
            isExpanded={expanded[agent.id]}
            onExpand={() => toggleExpanded(agent.id)}
            className="min-h-[200px]"
          />
        ))}
      </div>
    </div>
  );
};

export default Blackboard;