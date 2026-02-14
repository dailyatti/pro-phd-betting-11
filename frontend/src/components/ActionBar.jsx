import React, { useMemo, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { DollarSign, Play, Loader2, Square, Gauge } from "lucide-react";
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
  return NaN;
};

/**
 * ActionBar — Premium control strip with bankroll, run/stop, and theme toggle.
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
      const raw = e.target.value;
      if (raw === "") { setBankroll(""); return; }
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
    return false;
  }, [isScanning, canRun, bankrollOk, bankrollIsPositive]);

  const runTitle = useMemo(() => {
    if (isScanning) return "Scanning screenshots... (Please wait)";
    if (isRunning) return "System is currently running analysis...";
    if (!bankrollIsPositive) return "Please enter a bankroll number > 0";
    if (!bankrollOk) return "Bankroll format is invalid";
    if (!hasValidKeys) return "REQUIRES API KEY: Add Perplexity or OpenAI key in Settings.";
    if (!canRun) {
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
    <div className="flex items-center gap-2.5 flex-shrink-0">
      {/* Theme Toggle */}
      <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />

      {/* Bankroll Input */}
      <div
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all cursor-text group ${
          darkMode
            ? 'bg-black/50 border-slate-700/60 hover:border-cyan-500/40 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/20'
            : 'bg-white border-slate-200 hover:border-amber-300 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-300/30 shadow-sm'
        }`}
        onClick={focusBankroll}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") focusBankroll();
        }}
        aria-label="Focus bankroll input"
      >
        <Gauge
          size={15}
          className={
            bankrollIsPositive
              ? "text-emerald-500 group-focus-within:text-cyan-400 transition-colors"
              : "text-amber-500 group-focus-within:text-amber-400 transition-colors"
          }
        />
        <div className="flex items-center gap-0.5">
          <DollarSign size={13} className="text-tertiary" />
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={bankroll}
            onChange={handleBankrollChange}
            placeholder="300"
            className={`bg-transparent outline-none font-mono font-bold text-sm w-20 ${
              darkMode ? 'text-white placeholder-slate-600' : 'text-slate-800 placeholder-slate-400'
            }`}
            aria-invalid={!bankrollOk || !bankrollIsPositive}
            aria-label="Bankroll amount"
          />
        </div>
      </div>

      {/* Run / Stop */}
      {canStop ? (
        <button
          onClick={onStop}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
            darkMode
              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
              : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
          }`}
          type="button"
        >
          <Square size={16} />
          Stop Analysis
        </button>
      ) : (
        <button
          onClick={onStart}
          disabled={runDisabled}
          className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${
            runDisabled
              ? darkMode
                ? "bg-slate-800/60 text-slate-600 cursor-not-allowed border border-slate-700/50"
                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              : isRunning || isScanning
                ? "bg-gradient-to-r from-cyan-700 to-blue-700 text-white/80 border border-cyan-600/30"
                : darkMode
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 active:scale-95 border border-cyan-500/30"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/20 active:scale-95 border border-amber-400/30"
          }`}
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
  hasValidKeys: PropTypes.bool,
};

export default ActionBar;
