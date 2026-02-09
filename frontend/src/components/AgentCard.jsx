import React, { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2 } from "lucide-react";
import clsx from "clsx";

import { LoadingSkeleton } from "./AgentCard/shared";

import VisionContent from "./AgentCard/content/VisionContent";
import FactCheckerContent from "./AgentCard/content/FactCheckerContent";
import InsiderContent from "./AgentCard/content/InsiderContent";
import StrategyContent from "./AgentCard/content/StrategyContent";

import { getAgentIcon } from "./AgentCard/theme";

// -------------------------
// Harden helpers
// -------------------------
const isObject = (x) => x !== null && typeof x === "object";
const isPlainObject = (x) => isObject(x) && !Array.isArray(x);

const normId = (x) => String(x || "").trim().toLowerCase();
const normStatus = (x) => String(x || "").trim().toLowerCase();

/**
 * Decide if "data" is effectively empty (so we should still show skeleton while active)
 */
const isEmptyData = (data) => {
  if (data == null) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (isPlainObject(data)) return Object.keys(data).length === 0;
  return false;
};

/**
 * Robust match count detection across schema drift:
 * - data.matches: array
 * - data itself is array (multi-match already normalized upstream)
 * - data.__group.matchCount
 */
const getMatchCount = (data) => {
  if (!data) return 1;

  if (Array.isArray(data)) return Math.max(1, data.length);
  if (Array.isArray(data?.matches)) return Math.max(1, data.matches.length);

  const mc = data?.__group?.matchCount;
  const n = Number(mc);
  if (Number.isFinite(n) && n > 0) return Math.floor(n);

  return 1;
};

// -------------------------
// Tailwind-safe color map
// (NO dynamic class strings)
// -------------------------
const COLOR_BY_AGENT = {
  vision: "cyan",
  facts: "blue",
  intel: "purple",
  strategy: "emerald",
};

const TW = {
  glowBg: {
    cyan: "bg-cyan-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    emerald: "bg-emerald-500",
  },
  badgeRing: {
    cyan: "ring-cyan-500/20 bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    blue: "ring-blue-500/20 bg-blue-500/10 text-blue-300 border-blue-500/20",
    purple: "ring-purple-500/20 bg-purple-500/10 text-purple-300 border-purple-500/20",
    emerald: "ring-emerald-500/20 bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  },
  iconBoxExpanded: {
    cyan: "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20",
    blue: "bg-blue-500 text-white shadow-lg shadow-blue-500/20",
    purple: "bg-purple-500 text-white shadow-lg shadow-purple-500/20",
    emerald: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
  },
};

const cardMotion = {
  layout: true,
  transition: { type: "spring", stiffness: 420, damping: 38 },
};

// ============================================================================
// AGENT CARD
// ============================================================================
const AgentCard = ({
  agent,
  data,
  status, // expected: 'active' | 'complete' | 'idle' | 'error'
  isExpanded,
  onExpand,
  className,
  darkMode,
  onAddToHistory,
  bankroll,
}) => {
  const id = useMemo(() => normId(agent?.id), [agent?.id]);
  const s = useMemo(() => normStatus(status), [status]);

  const isActive = s === "active";
  const isComplete = s === "complete";
  const isError = s === "error";

  const colorKey = COLOR_BY_AGENT[id] || "cyan";
  const Icon = getAgentIcon(id) || (() => null);

  const matchCount = useMemo(() => getMatchCount(data), [data]);

  // skeleton when active and data is empty ({} / [] included)
  const showSkeleton = isActive && isEmptyData(data);

  const handleToggle = useCallback(
    (e) => {
      e?.stopPropagation?.();
      onExpand?.();
    },
    [onExpand]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleToggle(e);
      }
    },
    [handleToggle]
  );

  // Prevent expanding when interacting inside content area
  const stop = useCallback((e) => e.stopPropagation(), []);

  return (
    <motion.div
      {...cardMotion}
      className={clsx(
        "group relative flex flex-col rounded-2xl border transition-all duration-500 overflow-hidden backdrop-blur-md",
        "cursor-default", // no full-card click expand (prevents accidental toggles)
        isExpanded ? "ring-1 ring-white/10" : "hover:border-white/20",
        darkMode ? "bg-[#0A0A0A] border-white/5" : "bg-white border-slate-200",
        className
      )}
    >
      {/* Background Glow */}
      <div
        className={clsx(
          "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none",
          TW.glowBg[colorKey]
        )}
      />

      {/* Header */}
      <div
        className="p-5 flex items-center justify-between cursor-pointer focus:outline-none focus:bg-white/5 transition-colors"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${agent?.title} module`}
      >
        <div className="flex items-center gap-4">
          <div
            className={clsx(
              "p-3 rounded-xl transition-all duration-500",
              isExpanded ? TW.iconBoxExpanded[colorKey] : "bg-white/5 text-secondary group-hover:bg-white/10"
            )}
          >
            <Icon size={22} className={clsx(isActive && "animate-pulse")} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className={clsx("text-base font-bold tracking-tight uppercase", darkMode ? "text-white" : "text-slate-900")}>
                {agent?.title || agent?.name || id}
              </h3>

              {matchCount > 1 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white/5 text-[10px] font-mono font-bold text-tertiary">
                  {matchCount}x
                </span>
              )}

              {isComplete && (
                <span className={clsx("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ring-1", TW.badgeRing[colorKey])}>
                  Complete
                </span>
              )}

              {isError && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20">
                  Error
                </span>
              )}
            </div>

            <p className={clsx("text-xs font-medium uppercase tracking-wider opacity-60 mt-0.5", darkMode ? "text-slate-400" : "text-stone-500")}>
              {agent?.agentName || agent?.description || "Agent Module"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isActive && (
            <div className="flex items-center gap-3 pr-2">
              <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
              <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Active</span>
            </div>
          )}

          {/* Expand toggle button (explicit) */}
          <button
            type="button"
            onClick={handleToggle}
            className={clsx(
              "p-1.5 rounded-lg transition-colors border border-transparent",
              darkMode ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-900"
            )}
            aria-label={isExpanded ? "Collapse card" : "Expand card"}
          >
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={clsx(
              "relative",
              darkMode ? "bg-black/10" : "bg-slate-50",
              id === "strategy" && "max-h-[min(75vh,900px)] overflow-y-auto overflow-x-hidden"
            )}
            onClick={stop}
          >
            <div className="p-5 pt-2 border-t border-dashed border-subtle">
              {renderAgentContent(id, data, { isActive, darkMode, showSkeleton }, onAddToHistory, bankroll)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// CONTENT FACTORY
// ============================================================================
const renderAgentContent = (agentId, data, ctx, onAddToHistory, bankroll) => {
  const id = normId(agentId);
  const { isActive, darkMode, showSkeleton } = ctx || {};

  if (showSkeleton) {
    const colorKey = COLOR_BY_AGENT[id] || "cyan";
    return <LoadingSkeleton color={colorKey} darkMode={darkMode} />;
  }

  if (!data) return null;

  switch (id) {
    case "vision":
      return <VisionContent data={data} darkMode={darkMode} />;

    case "facts":
      return <FactCheckerContent data={data} darkMode={darkMode} />;

    case "intel":
      return <InsiderContent data={data} darkMode={darkMode} />;

    case "strategy":
      return (
        <StrategyContent
          data={data}
          isLoading={!!isActive}
          darkMode={darkMode}
          onAddToHistory={onAddToHistory}
          bankroll={bankroll}
        />
      );

    default:
      return (
        <div
          className={clsx(
            "p-4 rounded border text-sm font-mono whitespace-pre-wrap max-h-60 overflow-y-auto",
            darkMode ? "bg-panel border-subtle text-secondary" : "bg-white border-slate-200 text-slate-700"
          )}
        >
          {JSON.stringify(data, null, 2)}
        </div>
      );
  }
};

export default AgentCard;