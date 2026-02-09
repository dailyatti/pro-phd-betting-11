/**
 * Shared UI Components for AgentCard
 * 
 * Contains reusable UI primitives used across all AgentCard content sections.
 * 
 * @module components/AgentCard/shared
 */

import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

// ============================================================================
// HELPERS (moved from AgentCard.jsx)
// ============================================================================

export const safeText = (val, fallback = "") => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === "string") return val;
    if (typeof val === "number") return String(val);
    if (typeof val === "object") return JSON.stringify(val);
    return fallback;
};

export const toNumber = (val) => {
    if (val === null || val === undefined) return null;

    // If already a number, return as is
    if (typeof val === 'number') return Number.isFinite(val) ? val : null;

    // Convert to string and clean up
    let str = String(val).trim();

    // Handle percentage strings like "11.01%" or "+4.5%"
    const isPercent = str.includes('%');
    if (isPercent) {
        str = str.replace(/%/g, '');
    }

    // Remove non-numeric chars except minus, plus, dot
    str = str.replace(/[^\d.+-]/g, '');

    const num = parseFloat(str);
    return Number.isFinite(num) ? num : null;
};

/**
 * Safe number utility with fallback
 * @param {any} val 
 * @param {number} fallback 
 * @returns {number}
 */
export const n = (val, fallback = 0) => {
    const num = toNumber(val);
    return num !== null ? num : fallback;
};

export const fmtOdds = (val) => {
    const n = toNumber(val);
    if (n === null) return null;
    return n.toFixed(2);
};

export const fmtPct = (val, decimals = 1) => {
    const n = toNumber(val);
    if (n === null) return null;
    return `${n > 0 ? "+" : ""}${n.toFixed(decimals)}%`;
};

export const safeHostname = (url) => {
    try {
        return new URL(url).hostname;
    } catch {
        return null;
    }
};

export const isPlainObject = (obj) => {
    return Object.prototype.toString.call(obj) === '[object Object]';
};

// ============================================================================
// LOADING SKELETON
// ============================================================================

/**
 * Loading skeleton placeholder
 * @param {Object} props
 * @param {string} props.color - Color variant
 * @param {boolean} props.darkMode - Dark mode flag
 */
export const LoadingSkeleton = ({ color, darkMode }) => {
    const bgClass = darkMode
        ? (color === 'cyan' ? 'bg-cyan-500/10' : 'bg-slate-700/20')
        : (color === 'cyan' ? 'bg-cyan-400/10' : 'bg-stone-200/50');

    return (
        <div className="space-y-4 animate-pulse">
            <div className={clsx("h-20 rounded-xl w-full", bgClass)} />
            <div className="space-y-2">
                <div className={clsx("h-4 rounded w-3/4", bgClass)} />
                <div className={clsx("h-4 rounded w-1/2", bgClass)} />
            </div>
        </div>
    );
};

// ============================================================================
// ACTIVITY INDICATOR
// ============================================================================

/**
 * Animated activity indicator dots
 * @param {Object} props
 * @param {string} props.color - Tailwind background color class
 */
export const ActivityIndicator = ({ color }) => (
    <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
            <motion.div
                key={i}
                className={clsx("w-1.5 h-1.5 rounded-full", color)}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
        ))}
    </div>
);

// ============================================================================
// BADGE
// ============================================================================

/**
 * Badge component for labels and tags
 * @param {Object} props
 * @param {string} props.text - Badge text
 * @param {string} props.color - Color variant
 * @param {string} props.size - Size variant (xs, sm)
 * @param {boolean} props.darkMode - Dark mode flag
 */
export const Badge = ({ text, color = "slate", size = "sm", darkMode }) => {
    const map = {
        cyan: darkMode ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-cyan-100 text-cyan-700 border-cyan-200",
        amber: darkMode ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-100 text-amber-700 border-amber-200",
        emerald: darkMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-100 text-emerald-700 border-emerald-200",
        red: darkMode ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-100 text-red-700 border-red-200",
        slate: darkMode ? "bg-slate-500/10 text-slate-400 border-slate-500/20" : "bg-stone-100 text-stone-600 border-stone-200",
    };
    return (
        <span className={clsx("rounded border font-medium px-1.5 py-0.5 inline-block", map[color], size === "xs" ? "text-[9px]" : "text-xs")}>
            {text}
        </span>
    );
};

// ============================================================================
// ODDS BOX
// ============================================================================

/**
 * Odds display box
 * @param {Object} props
 * @param {string} props.label - Label text
 * @param {any} props.value - Odds value
 * @param {string} props.sub - Sub label
 * @param {string} props.color - Color variant
 * @param {boolean} props.small - Small size variant
 * @param {boolean} props.darkMode - Dark mode flag
 */
export const OddsBox = ({ label, value, sub, color = "cyan", small, darkMode }) => {
    const v = fmtOdds(value);
    if (!v) return <div className={clsx("rounded h-full", darkMode ? "bg-slate-800/20" : "bg-slate-50")} />;

    const colorMap = {
        cyan: darkMode ? "text-cyan-400" : "text-cyan-600",
        emerald: darkMode ? "text-emerald-400" : "text-emerald-600",
        red: darkMode ? "text-red-400" : "text-red-600"
    };

    return (
        <div className={clsx(
            "flex flex-col items-center justify-center rounded border transition-colors cursor-default",
            small ? "py-1.5 px-2" : "py-2 px-3",
            darkMode ? "bg-slate-800/50 border-white/5 hover:bg-white/5" : "bg-stone-50 border-stone-200 hover:bg-white"
        )}>
            <div className="flex items-center gap-1 mb-0.5">
                <span className={clsx("text-[9px] font-bold uppercase", darkMode ? "text-slate-500" : "text-stone-400")}>{label}</span>
                {sub && <span className={clsx("text-[8px] uppercase hidden sm:inline", darkMode ? "text-slate-600" : "text-stone-500")}>{sub}</span>}
            </div>
            <span className={clsx("font-mono font-bold tracking-tight", small ? "text-xs" : "text-sm", colorMap[color] || colorMap.cyan)}>
                {v}
            </span>
        </div>
    );
};

// ============================================================================
// STAT BAR
// ============================================================================

/**
 * Statistics comparison bar
 * @param {Object} props
 * @param {string} props.label - Label text
 * @param {number} props.home - Home team value
 * @param {number} props.away - Away team value
 * @param {string} props.unit - Unit label
 * @param {boolean} props.darkMode - Dark mode flag
 */
export const StatBar = ({ label, home, away, unit = "", darkMode }) => {
    if (!home && !away) return null;
    const h = parseFloat(home) || 0;
    const a = parseFloat(away) || 0;
    const total = h + a || 1;
    const hPct = (h / total) * 100;
    const aPct = (a / total) * 100;

    return (
        <div className="space-y-1">
            <div className={clsx("flex justify-between text-[10px] font-mono", darkMode ? "text-slate-400" : "text-stone-500")}>
                <span>{h} {unit}</span>
                <span className={clsx("font-sans font-bold uppercase", darkMode ? "text-slate-500" : "text-stone-400")}>{label}</span>
                <span>{a} {unit}</span>
            </div>
            <div className={clsx("h-1.5 w-full rounded-full overflow-hidden flex", darkMode ? "bg-slate-800" : "bg-slate-200")}>
                <div style={{ width: `${hPct}%` }} className="bg-cyan-500/70 h-full" />
                <div className={clsx("w-0.5 h-full", darkMode ? "bg-slate-900" : "bg-white")} />
                <div style={{ width: `${aPct}%` }} className="bg-amber-500/70 h-full" />
            </div>
        </div>
    );
};

// ============================================================================
// FORM VISUAL
// ============================================================================

/**
 * Form guide visual display (W/D/L results)
 * @param {Object} props
 * @param {string} props.side - Side label (Home/Away)
 * @param {Array} props.guide - Array of W/D/L results
 * @param {string} props.name - Team name
 * @param {boolean} props.darkMode - Dark mode flag
 */
export const FormVisual = ({ side, guide, name, darkMode }) => (
    <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-end">
            <span className={clsx("text-[10px] uppercase font-bold", darkMode ? "text-slate-500" : "text-stone-400")}>{side}</span>
            {name && <span className={clsx("text-[10px] font-bold truncate max-w-[80px]", darkMode ? "text-white" : "text-stone-800")}>{name}</span>}
        </div>

        {Array.isArray(guide) && guide.length > 0 ? (
            <div className="flex gap-0.5">
                {guide.map((r, i) => {
                    let bg = darkMode ? "bg-slate-700" : "bg-stone-200";
                    let text = darkMode ? "text-slate-400" : "text-stone-500";
                    if (r === "W") { bg = "bg-emerald-500"; text = "text-emerald-950"; }
                    if (r === "D") { bg = "bg-amber-400"; text = "text-amber-950"; }
                    if (r === "L") { bg = "bg-red-500"; text = "text-red-950"; }

                    return (
                        <div key={i} className={clsx("w-5 h-6 flex items-center justify-center rounded-sm text-[9px] font-black", bg, text)}>
                            {r}
                        </div>
                    );
                })}
            </div>
        ) : (
            <span className={clsx("text-[10px] italic", darkMode ? "text-slate-600" : "text-stone-400")}>No Data</span>
        )}
    </div>
);
