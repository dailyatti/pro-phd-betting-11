import React, { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Search, BrainCircuit, Zap, TrendingUp, Target, UserRound, CheckCircle2, X, Activity, Cpu, Database, Shield } from "lucide-react";

// --------------------
// STAGE CONFIG
// --------------------
const STAGES = [
  { id: "VISION", label: "Vision Scan", sublabel: "Extracting match data from inputs", icon: Eye, color: "#06b6d4", progressMin: 0, progressMax: 20 },
  { id: "FACTS", label: "Deep Research", sublabel: "Gathering facts & evidence", icon: Search, color: "#3b82f6", progressMin: 20, progressMax: 55 },
  { id: "INTEL", label: "Insider Intel", sublabel: "Cross-referencing intelligence", icon: UserRound, color: "#8b5cf6", progressMin: 55, progressMax: 75 },
  { id: "STRATEGY", label: "PhD Strategy", sublabel: "Building optimal betting strategy", icon: BrainCircuit, color: "#10b981", progressMin: 75, progressMax: 95 },
  { id: "COMPLETE", label: "Report Ready", sublabel: "Analysis complete", icon: CheckCircle2, color: "#10b981", progressMin: 100, progressMax: 100 },
];

const LOADING_MESSAGES = [
  { text: "Analyzing line movements and market sentiment", icon: TrendingUp },
  { text: "Scanning for late injury reports", icon: Search },
  { text: "Cross-referencing bookmaker odds", icon: Target },
  { text: "Applying Kelly Criterion optimization", icon: Zap },
  { text: "Extracting value from H2H data", icon: BrainCircuit },
  { text: "Checking sharp money vs public splits", icon: Activity },
  { text: "Processing neural probability model", icon: Cpu },
  { text: "Querying research databases", icon: Database },
  { text: "Validating edge detection signals", icon: Shield },
  { text: "Calculating fair odds after vig removal", icon: Target },
];

// --------------------
// HELPERS
// --------------------
const normalizeStatus = (s) => String(s || "").trim().toUpperCase();
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

const formatTime = (seconds) => {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

// --------------------
// ANIMATED RING (SVG)
// --------------------
function AnimatedRing({ progress, color, darkMode, size = 130, strokeWidth = 5 }) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={darkMode ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.2)"}
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          filter: darkMode ? `drop-shadow(0 0 8px ${color}60)` : `drop-shadow(0 0 4px ${color}40)`,
        }}
      />
      {/* Glow dot at tip */}
      {progress > 0 && progress < 100 && (
        <circle
          cx={size / 2 + radius * Math.cos((2 * Math.PI * progress / 100) - Math.PI / 2)}
          cy={size / 2 + radius * Math.sin((2 * Math.PI * progress / 100) - Math.PI / 2)}
          r={strokeWidth + 1.5}
          fill={color}
          opacity={0.7}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        >
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

// --------------------
// MAIN COMPONENT
// --------------------
export default function LoadingScreen({ status, onCancel, darkMode = true, isOpen = true }) {
  const [tipIndex, setTipIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [smoothProgress, setSmoothProgress] = useState(0);
  const stageElapsedRef = useRef(0);
  const prevStageRef = useRef("");
  const cancelRef = useRef(null);

  const normalized = normalizeStatus(status);
  const stageIndex = STAGES.findIndex((s) => s.id === normalized);
  const stage = STAGES[stageIndex >= 0 ? stageIndex : 0];
  const StageIcon = stage.icon;
  const canCancel = typeof onCancel === "function";

  const tip = LOADING_MESSAGES[tipIndex % LOADING_MESSAGES.length];
  const TipIcon = tip.icon;

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // ESC to cancel
  useEffect(() => {
    if (!isOpen || !canCancel) return;
    const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); onCancel(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, canCancel, onCancel]);

  // Tip rotation
  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => setTipIndex((p) => p + 1), 3000);
    return () => clearInterval(id);
  }, [isOpen]);

  // Elapsed timer
  useEffect(() => {
    if (!isOpen) return;
    setElapsed(0);
    const id = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(id);
  }, [isOpen]);

  // Track time within current stage for sub-progress creep
  useEffect(() => {
    if (prevStageRef.current !== stage.id) {
      stageElapsedRef.current = 0;
      prevStageRef.current = stage.id;
    }
  }, [stage.id]);

  // Smooth progress with time-based creep within each stage
  useEffect(() => {
    if (!isOpen) return;

    const id = setInterval(() => {
      stageElapsedRef.current += 0.1; // 100ms ticks

      setSmoothProgress((prev) => {
        // If complete, snap to 100
        if (stage.id === "COMPLETE") {
          const diff = 100 - prev;
          if (Math.abs(diff) < 0.5) return 100;
          return prev + diff * 0.15;
        }

        // Time-based creep: slowly fill within the current stage's range
        // Use a logarithmic-ish curve so it starts fast and slows down near the end
        const stageRange = stage.progressMax - stage.progressMin;
        const timeFactor = Math.min(1, stageElapsedRef.current / 60); // fills ~90% over 60s
        const easedFactor = 1 - Math.pow(1 - timeFactor, 2); // quadratic ease-out
        const creepTarget = stage.progressMin + stageRange * easedFactor * 0.85; // never quite reach max (leaves room for next stage)

        // Also ensure we at least reach progressMin quickly
        const minTarget = stage.progressMin + 2; // jump to at least stage start + 2%
        const target = Math.max(minTarget, creepTarget);

        const diff = target - prev;
        if (Math.abs(diff) < 0.3) return target;
        return prev + diff * 0.12; // faster convergence than before (was 0.08)
      });
    }, 100);

    return () => clearInterval(id);
  }, [isOpen, stage.id, stage.progressMin, stage.progressMax]);

  // Focus cancel on mount
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => cancelRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const progressPct = clamp(Math.round(smoothProgress), 0, 100);

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Analysis in progress"
    >
      {/* Backdrop */}
      <div className={`absolute inset-0 backdrop-blur-xl ${
        darkMode ? 'bg-slate-950/85' : 'bg-white/80'
      }`} />

      {/* Subtle gradient overlay for light mode */}
      {!darkMode && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${stage.color}08 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Main card */}
      <div className={`relative z-10 w-full max-w-md mx-4 rounded-3xl overflow-hidden ${
        darkMode
          ? 'bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/50 shadow-2xl shadow-black/60'
          : 'bg-white border border-slate-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]'
      }`}>

        {/* Top accent line */}
        <div
          className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${stage.color}, transparent)` }}
        />

        <div className="px-8 pt-8 pb-6 sm:px-10 sm:pt-10 sm:pb-8">
          {/* Ring + Icon */}
          <div className="flex justify-center mb-7">
            <div className="relative">
              <AnimatedRing progress={progressPct} color={stage.color} darkMode={darkMode} size={130} strokeWidth={5} />

              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: darkMode ? `${stage.color}18` : `${stage.color}12`,
                    border: `1.5px solid ${darkMode ? `${stage.color}35` : `${stage.color}25`}`,
                  }}
                >
                  <StageIcon size={26} style={{ color: stage.color }} />
                </div>
              </div>

              {/* Progress percentage */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                <span
                  className="text-[11px] font-mono font-black px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: darkMode ? `${stage.color}20` : `${stage.color}10`,
                    color: stage.color,
                    border: `1px solid ${darkMode ? `${stage.color}35` : `${stage.color}20`}`,
                  }}
                >
                  {progressPct}%
                </span>
              </div>
            </div>
          </div>

          {/* Stage label */}
          <div className="text-center mb-5">
            <h2 className={`text-2xl font-black tracking-tight mb-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              {stage.label}
            </h2>
            <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {stage.sublabel}
            </p>
          </div>

          {/* Pipeline stages */}
          <div className="flex items-center justify-center gap-1.5 mb-7">
            {STAGES.filter(s => s.id !== "COMPLETE").map((s, idx) => {
              const isActive = s.id === stage.id;
              const isDone = stageIndex > idx || normalized === "COMPLETE";
              const SIcon = s.icon;

              return (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 ${
                        isDone
                          ? 'scale-100'
                          : isActive
                            ? 'scale-110'
                            : 'scale-90 opacity-40'
                      }`}
                      style={{
                        backgroundColor: isDone || isActive
                          ? (darkMode ? `${s.color}18` : `${s.color}12`)
                          : (darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                        border: `1.5px solid ${isDone || isActive ? (darkMode ? `${s.color}40` : `${s.color}30`) : 'transparent'}`,
                        boxShadow: isActive ? `0 0 16px ${s.color}20` : 'none',
                      }}
                    >
                      {isDone ? (
                        <CheckCircle2 size={16} style={{ color: s.color }} />
                      ) : (
                        <SIcon size={16} style={{ color: isDone || isActive ? s.color : darkMode ? '#64748b' : '#94a3b8' }} />
                      )}
                    </div>
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider"
                      style={{ color: isDone || isActive ? s.color : darkMode ? '#475569' : '#94a3b8' }}
                    >
                      {s.label.split(' ')[0]}
                    </span>
                  </div>

                  {idx < STAGES.length - 2 && (
                    <div className="flex-shrink-0 mb-5">
                      <div
                        className="w-6 h-0.5 rounded-full transition-all duration-700"
                        style={{
                          backgroundColor: isDone ? s.color : darkMode ? '#1e293b' : '#e2e8f0',
                          boxShadow: isDone ? `0 0 6px ${s.color}40` : 'none',
                        }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Activity message */}
          <div
            className={`flex items-center gap-3 p-3.5 rounded-xl mb-5 transition-all duration-500 ${
              darkMode
                ? 'bg-slate-800/50 border border-slate-700/40'
                : 'bg-slate-50 border border-slate-200/80'
            }`}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: darkMode ? `${stage.color}18` : `${stage.color}10` }}
            >
              <TipIcon size={15} style={{ color: stage.color }} />
            </div>
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {tip.text}
            </p>
          </div>

          {/* Elapsed time */}
          <div className="flex items-center justify-center mb-5">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
              darkMode ? 'bg-slate-800/50' : 'bg-slate-100/80'
            }`}>
              <Activity size={12} style={{ color: stage.color, opacity: 0.7 }} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Elapsed
              </span>
              <span className={`text-sm font-mono font-black tabular-nums ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                {formatTime(elapsed)}
              </span>
            </div>
          </div>

          {/* Cancel button */}
          {canCancel && (
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className={`w-full py-3 px-6 rounded-2xl font-bold text-xs uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 ${
                darkMode
                  ? 'bg-slate-800/80 hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 border border-slate-700/50 hover:border-rose-500/30'
                  : 'bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200'
              }`}
            >
              <X size={14} />
              Cancel Analysis
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
