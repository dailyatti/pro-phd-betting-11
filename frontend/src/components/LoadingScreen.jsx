import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Eye, Search, BrainCircuit, Zap, TrendingUp, Target, UserRound, CheckCircle2 } from "lucide-react";

// --------------------
// CONTENT
// --------------------
const LOADING_TIPS = [
  { text: "Analyzing line movements and market sentiment...", icon: TrendingUp },
  { text: "Scanning for late injury reports and lineup changes...", icon: Search },
  { text: "Cross-referencing bookmaker odds for edge detection...", icon: Target },
  { text: "Applying Kelly Criterion for optimal stake sizing...", icon: Zap },
  { text: "Extracting value from historical head-to-head data...", icon: BrainCircuit },
  { text: "Checking for sharp money vs public betting splits...", icon: TrendingUp },
  { text: "Evaluating motivation factors and team psychology...", icon: Eye },
  { text: "Calculating fair probabilities after vig removal...", icon: Target },
];

const STAGES = {
  VISION: { label: "Vision Scan", icon: Eye, colorClass: "text-cyan-400", progress: 18 },
  FACTS: { label: "Deep Research", icon: Search, colorClass: "text-blue-400", progress: 55 },
  INTEL: { label: "Insider Intel", icon: UserRound, colorClass: "text-purple-400", progress: 75 },
  STRATEGY: { label: "PhD Analysis", icon: BrainCircuit, colorClass: "text-emerald-400", progress: 92 },
  COMPLETE: { label: "Finalizing Report", icon: CheckCircle2, colorClass: "text-emerald-400", progress: 100 },
};

// --------------------
// HELPERS
// --------------------
const normalizeStatus = (status) => String(status || "").trim().toUpperCase();
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(!!mq.matches);

    onChange();
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  return reduced;
};

const useBodyScrollLock = (enabled) => {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [enabled]);
};

const formatTime = (seconds) => {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

/**
 * Professional Loading Screen for PhD Betting Intelligence
 *
 * Props:
 * - status: string (VISION/FACTS/INTEL/STRATEGY/COMPLETE or any -> fallback)
 * - onCancel: optional function
 * - darkMode: boolean
 * - isOpen: optional (default true) if you want to control mount vs show/hide
 */
export default function LoadingScreen({ status, onCancel, darkMode = true, isOpen = true }) {
  const reducedMotion = usePrefersReducedMotion();
  useBodyScrollLock(isOpen);

  const [tipIndex, setTipIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [smoothProgress, setSmoothProgress] = useState(0);

  const tipTimerRef = useRef(null);
  const timeTimerRef = useRef(null);
  const cancelBtnRef = useRef(null);

  const normalized = normalizeStatus(status);
  const stage = STAGES[normalized] || STAGES.FACTS;
  const StageIcon = stage.icon;

  const currentTip = LOADING_TIPS[clamp(tipIndex, 0, LOADING_TIPS.length - 1)] || LOADING_TIPS[0];
  const TipIcon = currentTip.icon;

  const formattedTimeStr = useMemo(() => formatTime(elapsedSeconds), [elapsedSeconds]);

  const canCancel = typeof onCancel === "function";

  const handleCancel = () => {
    if (canCancel) onCancel();
  };

  // Focus the cancel button on open (nice UX)
  useEffect(() => {
    if (!isOpen) return;
    // small delay ensures element exists
    const t = setTimeout(() => cancelBtnRef.current?.focus?.(), 50);
    return () => clearTimeout(t);
  }, [isOpen]);

  // ESC to cancel
  useEffect(() => {
    if (!isOpen || !canCancel) return;

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, canCancel, onCancel]);

  // Tip rotation (StrictMode safe)
  useEffect(() => {
    if (!isOpen) return;

    if (tipTimerRef.current) clearInterval(tipTimerRef.current);

    tipTimerRef.current = setInterval(() => {
      setTipIndex((prev) => {
        const len = LOADING_TIPS.length || 1;
        return (prev + 1) % len;
      });
    }, reducedMotion ? 9000 : 4000);

    return () => {
      if (tipTimerRef.current) clearInterval(tipTimerRef.current);
      tipTimerRef.current = null;
    };
  }, [isOpen, reducedMotion]);

  // Elapsed time counter (StrictMode safe)
  useEffect(() => {
    if (!isOpen) return;

    if (timeTimerRef.current) clearInterval(timeTimerRef.current);

    timeTimerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timeTimerRef.current) clearInterval(timeTimerRef.current);
      timeTimerRef.current = null;
    };
  }, [isOpen]);

  // Smooth progress toward stage.progress
  useEffect(() => {
    if (!isOpen) return;

    const target = clamp(stage.progress, 0, 100);
    // jump faster when reducedMotion
    const speed = reducedMotion ? 1 : 0.35;

    setSmoothProgress((prev) => {
      if (!Number.isFinite(prev)) return target;
      const next = prev + (target - prev) * speed;
      // snap near
      if (Math.abs(next - target) < 0.3) return target;
      return clamp(next, 0, 100);
    });
  }, [stage.progress, reducedMotion, isOpen]);

  // If you want to keep mounted but hidden:
  if (!isOpen) return null;

  return (
    <div
      className={clsx(
        "fixed inset-0 z-[1000] flex items-center justify-center p-4",
        darkMode ? "bg-black/60" : "bg-white/70",
        "backdrop-blur-sm",
        "animate-in fade-in duration-300"
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Analysis loading screen"
    >
      {/* Subtle background particles (kept minimal, reduced motion friendly) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {Array.from({ length: reducedMotion ? 3 : 6 }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              "absolute w-2 h-2 rounded-full",
              reducedMotion ? "opacity-20" : "animate-pulse",
              darkMode ? "bg-cyan-500/20" : "bg-cyan-600/15"
            )}
            style={{
              top: `${15 + i * 18}%`,
              left: `${10 + (i % 3) * 35}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: "3s",
            }}
          />
        ))}
      </div>

      {/* Main Content Card */}
      <div
        className={clsx(
          "relative z-10 w-full max-w-md rounded-3xl border p-10",
          darkMode ? "bg-slate-900/80 border-slate-700/50 shadow-2xl" : "bg-white/90 border-slate-200 shadow-xl"
        )}
      >
        {/* Premium Spinner */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div
              className={clsx(
                "w-24 h-24 rounded-full border-4 border-transparent border-t-cyan-500 border-r-blue-500",
                reducedMotion ? "" : "animate-spin"
              )}
              style={{ animationDuration: "1.5s" }}
            />
            <div
              className={clsx(
                "absolute inset-2 w-20 h-20 rounded-full border-4 border-transparent border-b-purple-500 border-l-emerald-500",
                reducedMotion ? "" : "animate-spin"
              )}
              style={{ animationDuration: "2s", animationDirection: "reverse" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <StageIcon size={28} className={clsx(stage.colorClass, reducedMotion ? "" : "animate-pulse")} />
            </div>
          </div>
        </div>

        {/* Current Stage Label */}
        <h2 className={clsx("text-center text-2xl font-bold mb-2", darkMode ? "text-white" : "text-slate-800")}>
          {stage.label}
        </h2>

        {/* aria-live stage line (screen readers) */}
        <div className="sr-only" aria-live="polite">
          Current stage: {stage.label}. Elapsed time: {formattedTimeStr}.
        </div>

        {/* Progress Bar */}
        <div className={clsx("h-2 rounded-full overflow-hidden mb-6", darkMode ? "bg-slate-800" : "bg-slate-200")}>
          <div
            className={clsx(
              "h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500",
              reducedMotion ? "" : "transition-all duration-700 ease-out"
            )}
            style={{ width: `${clamp(smoothProgress, 0, 100)}%` }}
            aria-label="Progress"
          />
        </div>

        {/* Rotating Tips */}
        <div
          className={clsx(
            "flex items-center gap-3 p-4 rounded-xl mb-6",
            reducedMotion ? "" : "transition-all duration-500",
            darkMode ? "bg-slate-800/50" : "bg-slate-100"
          )}
        >
          <TipIcon size={20} className={clsx("flex-shrink-0", darkMode ? "text-cyan-400" : "text-cyan-600")} />
          <p className={clsx("text-sm", darkMode ? "text-slate-300" : "text-slate-600")}>{currentTip.text}</p>
        </div>

        {/* Elapsed Time */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className={clsx("text-xs font-mono", darkMode ? "text-slate-500" : "text-slate-400")}>Elapsed:</span>
          <span className={clsx("text-lg font-mono font-bold", darkMode ? "text-slate-300" : "text-slate-700")}>
            {formattedTimeStr}
          </span>
        </div>

        {/* Cancel Button */}
        <button
          ref={cancelBtnRef}
          type="button"
          onClick={handleCancel}
          disabled={!canCancel}
          className={clsx(
            "w-full py-3 px-6 rounded-xl font-bold text-white transition-all shadow-lg outline-none focus:ring-2 focus:ring-offset-2",
            darkMode ? "focus:ring-cyan-400 focus:ring-offset-slate-900" : "focus:ring-cyan-600 focus:ring-offset-white",
            canCancel
              ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 hover:shadow-red-500/25 active:scale-[0.99]"
              : "bg-slate-600 cursor-not-allowed opacity-60"
          )}
        >
          Cancel Analysis
        </button>
      </div>
    </div>
  );
}