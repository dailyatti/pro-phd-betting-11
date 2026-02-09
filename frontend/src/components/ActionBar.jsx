import React, { useMemo, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { DollarSign, Play, Loader2, Square } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const toNumber = (x) => {
  if (x == null) return NaN;
  if (typeof x === "number") return Number.isFinite(x) ? x : NaN;
  if (typeof x === "string") {
    const s = x.trim();
    if (!s) return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }
  const n = Number(x);
  return Number.isFinite(n) ? n : NaN;
};

const clamp = (x, min, max) => Math.min(Math.max(x, min), max);

/**
 * ActionBar — Premium + Production Hardened
 * - Ref-based focus (no document.querySelector)
 * - Bankroll numeric sanitization (keeps user typing fluid)
 * - Accessible buttons + stable state rendering
 */
const ActionBar = ({
  darkMode,
  setDarkMode,
  bankroll,
  setBankroll,
  canRun,
  canStop,
  onStart,
  onStop,
  appStatus,
  bankrollOk,
  isScanning = false,
  isRunning = false,
  inputMode = 'screenshot',
  manualMatchTextLength = 0,
  hasValidKeys = true,
}) => {
  const inputRef = useRef(null);

  const status = useMemo(() => String(appStatus || "").trim().toUpperCase(), [appStatus]);

  const focusBankroll = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleBankrollChange = useCallback(
    (e) => {
      // Keep raw string for UX (so user can type "300", delete, etc.)
      const raw = e.target.value;

      // Allow empty (user clearing input)
      if (raw === "") {
        setBankroll("");
        return;
      }

      // Remove obvious junk that number inputs still sometimes allow via paste
      // (We still keep it permissive; validation happens elsewhere via bankrollOk)
      const cleaned = raw.replace(/[^\d.\-]/g, "");
      setBankroll(cleaned);
    },
    [setBankroll]
  );

  const bankrollNum = useMemo(() => toNumber(bankroll), [bankroll]);
  const bankrollIsPositive = Number.isFinite(bankrollNum) && bankrollNum > 0;

  const runDisabled = useMemo(() => {
    if (isScanning) return true;
    if (!canRun) return true;
    if (!bankrollOk || !bankrollIsPositive) return true;
    // Additional check carried over from parent, but good to have here too visually
    return false;
  }, [isScanning, canRun, bankrollOk, bankrollIsPositive]);

  const runTitle = useMemo(() => {
    if (isScanning) return "Scanning screenshots... (Please wait)";
    if (isRunning) return "System is currently running analysis...";
    if (!bankrollIsPositive) return "Please enter a bankroll number > 0";
    if (!bankrollOk) return "Bankroll format is invalid";

    // PhD-Level Check: Research Key Requirement
    if (!hasValidKeys) return "REQUIRES API KEY: Add Perplexity, OpenAI, or DeepSeek key in Settings.";

    // Parent handles the specific canRun logic (e.g. text length vs queue)
    if (!canRun) {
      // We can try to guess WHY it's disabled based on props if we had them,
      // but for now a generic message or relying on parent's boolean is okay.
      // However, we can be more specific if we know the mode:
      if (inputMode === 'text' && (manualMatchTextLength || 0) < 10) return "Please enter at least 10 characters of match data";
      if (inputMode === 'screenshot') return "Upload at least one match screenshot to run analysis";
      return "Review inputs to run analysis";
    }
    return "Start the multi-agent analysis pipeline";
  }, [isScanning, isRunning, bankrollIsPositive, bankrollOk, canRun, inputMode, manualMatchTextLength, hasValidKeys]);

  const primaryLabel = useMemo(() => {
    if (isScanning) return "Scanning...";
    if (status === "COMPLETE") return "Run Again";
    return "Run System";
  }, [isScanning, status]);

  return (
    <div className="top-bar">
      {/* Theme Toggle */}
      <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />

      {/* Bankroll Input */}
      <div className="flex items-center gap-2 px-2 border-r border-subtle h-full">
        <div
          className="top-bar-input-wrapper group cursor-text"
          onClick={focusBankroll}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") focusBankroll();
          }}
          aria-label="Focus bankroll input"
        >
          <DollarSign
            size={18}
            className={[
              "transition-colors",
              bankrollIsPositive ? "text-emerald-500 group-focus-within:text-cyan-400" : "text-amber-500 group-focus-within:text-amber-400",
            ].join(" ")}
          />
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={bankroll}
            onChange={handleBankrollChange}
            placeholder="300"
            className="top-bar-input"
            aria-invalid={!bankrollOk || !bankrollIsPositive}
            aria-label="Bankroll amount"
          />
        </div>
      </div>

      {/* Run / Stop */}
      {canStop ? (
        <button
          onClick={onStop}
          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-6 py-3 rounded-xl font-bold text-sm transition-all"
          type="button"
        >
          <span className="inline-flex items-center gap-2">
            <Square size={16} />
            Stop Analysis
          </span>
        </button>
      ) : (
        <button
          onClick={onStart}
          disabled={runDisabled}
          className={[
            "px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center gap-3 shadow-lg transition-all",
            runDisabled
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : isRunning || isScanning
                ? "bg-gradient-to-r from-cyan-700 to-blue-700 text-white/80"
                : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:shadow-cyan-500/25 text-white active:scale-95",
          ].join(" ")}
          title={runTitle}
          aria-disabled={runDisabled}
          type="button"
        >
          {(isScanning || isRunning) ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isScanning ? "Scanning..." : "Analyzing..."}
            </>
          ) : (
            <>
              <Play size={18} fill="currentColor" className={runDisabled ? "opacity-50" : ""} />
              {primaryLabel}
            </>
          )}
        </button>
      )}
    </div>
  );
};

ActionBar.propTypes = {
  darkMode: PropTypes.bool.isRequired,
  setDarkMode: PropTypes.func.isRequired,

  bankroll: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  setBankroll: PropTypes.func.isRequired,

  canRun: PropTypes.bool.isRequired,
  canStop: PropTypes.bool.isRequired,

  onStart: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,

  appStatus: PropTypes.string.isRequired,
  bankrollOk: PropTypes.bool.isRequired,

  isScanning: PropTypes.bool,
  isRunning: PropTypes.bool,
  inputMode: PropTypes.string,
  manualMatchTextLength: PropTypes.number,
};

export default ActionBar;