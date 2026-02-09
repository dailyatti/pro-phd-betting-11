import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AlertCircle, Sparkles, XCircle } from "lucide-react";

// Layouts & Components
import DashboardLayout from "./layouts/DashboardLayout";
import MatchUploadZone from "./components/MatchUploadZone";
import MatchCard from "./components/MatchCard";
import Blackboard from "./components/Blackboard";
import HeaderSection from "./components/HeaderSection";
import ActionBar from "./components/ActionBar";
import ManualInsider from "./components/ManualInsider";
import ConfigurationPage from "./pages/ConfigurationPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import HistoryPage from "./pages/HistoryPage";

import "./App.css";

// Custom Hooks
import { useBlackboardState } from "./hooks/useBlackboardState";
import { useSettings } from "./hooks/useSettings";
import { useImageUpload } from "./hooks/useImageUpload";
import { useAnalysis } from "./hooks/useAnalysis";
import { parseWithDeepSeek, parseManualTextInput, normalizeForPipeline } from "./agents/textParser";

// -----------------------------
// Utilities (local, tiny & safe)
// -----------------------------
const STORAGE_KEY = "phd_betting_app_v1";
const HISTORY_KEY = "phd_betting_history_v1";

const safeJsonParse = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

const normalizeView = (v) => {
  const x = String(v || "").toLowerCase().trim();
  if (x === "dashboard" || x === "settings" || x === "methodology" || x === "history") return x;
  return "dashboard";
};

const normalizeStatus = (s) => String(s || "IDLE").toUpperCase().trim();

const isRunningStatus = (status) => {
  const s = normalizeStatus(status);
  return s === "VISION" || s === "FACTS" || s === "INTEL" || s === "STRATEGY";
};

const coerceBankroll = (raw) => {
  if (raw === "" || raw == null) return { n: 0, ok: false };
  const n = Number(raw);
  if (!Number.isFinite(n)) return { n: 0, ok: false };
  if (n <= 0) return { n, ok: false };
  return { n: clamp(n, 0, 1_000_000_000), ok: true };
};

async function copyToClipboard(text) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "-1000px";
  ta.style.left = "-1000px";
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(ta);
  if (!ok) throw new Error("Clipboard fallback failed");
  return true;
}

function App() {
  // --- Mount Safety (StrictMode-safe) ---
  const isMounted = useRef(false);
  const copyTimeoutRef = useRef(null);
  const perplexityCopyTimeoutRef = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      if (perplexityCopyTimeoutRef.current) clearTimeout(perplexityCopyTimeoutRef.current);
      copyTimeoutRef.current = null;
      perplexityCopyTimeoutRef.current = null;
    };
  }, []);

  // --- Load persisted minimal UI state once ---
  const persisted = useMemo(() => {
    const raw = safeJsonParse(localStorage.getItem(STORAGE_KEY) || "");
    return raw && typeof raw === "object" ? raw : null;
  }, []);

  // --- View State ---
  const [currentView, setCurrentView] = useState(() => normalizeView(persisted?.currentView || "dashboard"));
  const [darkMode, setDarkMode] = useState(() => (typeof persisted?.darkMode === "boolean" ? persisted.darkMode : true));

  // --- Manual Insider State ---
  const [manualInsiderMode, setManualInsiderMode] = useState(() => !!persisted?.manualInsiderMode);
  const [manualIntelText, setManualIntelText] = useState(() => (typeof persisted?.manualIntelText === "string" ? persisted.manualIntelText : ""));
  const [copySuccess, setCopySuccess] = useState(false);
  const [perplexityCopySuccess, setPerplexityCopySuccess] = useState(false);

  // --- Input Mode State (Screenshot vs Manual Text) ---
  const [inputMode, setInputMode] = useState(() => persisted?.inputMode || 'screenshot'); // 'screenshot' | 'text'
  const [manualMatchText, setManualMatchText] = useState(() => (typeof persisted?.manualMatchText === "string" ? persisted.manualMatchText : ""));

  // Ref for auto-scroll
  const blackboardRef = useRef(null);

  // --- Theme Sync ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  // --- ID Generator (stable) ---
  const genId = useCallback(() => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`, []);

  // --- Initialize Hooks ---
  const { blackboardState, updateBlackboard, resetBlackboard } = useBlackboardState();

  const {
    apiKeys,
    setApiKeys,
    modelSettings,
    setModelSettings,
    bankroll,
    setBankroll,
  } = useSettings();

  // Restore bankroll from persisted (only if user settings hook is empty)
  useEffect(() => {
    if (persisted?.bankroll != null && (bankroll == null || bankroll === "")) {
      setBankroll(String(persisted.bankroll));
    }
  }, [persisted, bankroll, setBankroll]);

  const {
    imageGroups,
    setImageGroups,
    isScanning,
    error: uploadError,
    setError: setUploadError,
    handleFileUpload,
    handleRemoveImage,
    handleUpdateMatchLabel,
    handleUpdateSport,
    handleDeleteGroup,
    dragActiveState,
    // activeUploadTarget,
    setActiveUploadTarget,
    previewImage,
    setPreviewImage,
    handleAddImageToGroup,
  } = useImageUpload({
    apiKeys,
    modelSettings,
    genId,
    isMountedRef: isMounted,
    resetBlackboard,
  });

  const { status, error: analysisError, startAnalysis, stopAnalysis } = useAnalysis({
    apiKeys,
    modelSettings,
    updateBlackboard,
    isMountedRef: isMounted,
    onComplete: (results) => {
      console.log("[App] Analysis complete. Ready for manual save.", results);
    },
  });

  const appStatus = useMemo(() => normalizeStatus(status), [status]);
  const isRunning = useMemo(() => isRunningStatus(appStatus), [appStatus]);
  const hasQueue = (imageGroups?.length || 0) > 0;
  console.log(`[App Render] imageGroups length: ${imageGroups?.length}, hasQueue: ${hasQueue}`);

  // Auto-scroll to analysis when running starts
  // Auto-scroll to analysis when running starts
  useEffect(() => {
    if (isRunning) {
      // Small delay to ensure DOM render and layout reflow
      setTimeout(() => {
        if (blackboardRef.current) {
          blackboardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          // Fallback: try finding by ID if ref failed due to closure/timing
          const el = document.getElementById("blackboard-section");
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    }
  }, [isRunning]);

  const bankrollMeta = useMemo(() => coerceBankroll(bankroll), [bankroll]);
  const bankrollOk = bankrollMeta.ok;

  // --- History State Management ---
  const [history, setHistory] = useState(() => {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = safeJsonParse(raw || "");
    return Array.isArray(parsed) ? parsed : [];
  });

  // Persist History
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  // Accepts either:
  // - array of match results
  // - single match result object
  // Accepts either:
  // - single result object
  // - array of result objects
  // - result object with "strategies" array (multi-match)
  const handleAddToHistory = useCallback(
    (analysisResults) => {
      // MASTER PROMPT FIX: flatten strategies so every match is 1 entry
      const inputs = Array.isArray(analysisResults) ? analysisResults : (analysisResults ? [analysisResults] : []);
      const newEntries = [];
      const timestamp = new Date().toISOString();

      inputs.forEach((result) => {
        // If the result has a 'strategies' array, those are the individual matches
        const matches = Array.isArray(result?.strategies) ? result.strategies : [result];

        matches.forEach((match) => {
          if (!match) return;

          const recs = Array.isArray(match.recommendations) ? match.recommendations : [];
          // Unique match ID
          const matchId = match.matchId || match.match_id || genId();

          newEntries.push({
            id: matchId,
            timestamp,
            matchLabel: match.matchLabel || match.selection || "Unknown Match",
            sport: match.sport || "UNKNOWN",
            recommendations: recs,
            bets: recs.map((r) => ({
              ...r,
              id: genId(),
              status: "PENDING",
              actual_stake: r?.stake_size ?? "",
              actual_odds: r?.odds ?? "",
              pnl: 0,
              notes: "",
            })),
            summary: match.summary_note || match.match_analysis?.summary || "",
            match_analysis: match.match_analysis,
            confidence: match.confidence,
            formula_selection: match.formula_selection
          });
        });
      });

      setHistory((prev) => {
        // Deduplicate by ID just in case
        const seen = new Set(prev.map(p => p.id));
        const uniqueNew = newEntries.filter(e => !seen.has(e.id));
        return [...uniqueNew, ...prev];
      });
    },
    [genId]
  );

  const handleUpdateHistoryItem = useCallback((matchId, betId, updates) => {
    setHistory((prev) =>
      prev.map((match) => {
        if (match.id !== matchId) return match;
        const updatedBets = (match.bets || []).map((bet) => (bet.id === betId ? { ...bet, ...updates } : bet));
        return { ...match, bets: updatedBets };
      })
    );
  }, []);

  const handleDeleteHistoryItem = useCallback((matchId) => {
    if (window.confirm("Are you sure you want to delete this entire match event and all its bets?")) {
      setHistory((prev) => prev.filter((m) => m.id !== matchId));
    }
  }, []);

  const handleDeleteBet = useCallback((matchId, betId) => {
    if (!window.confirm("Delete this specific bet?")) return;

    setHistory((prev) =>
      prev
        .map((match) => {
          if (match.id !== matchId) return match;
          const newBets = (match.bets || []).filter((b) => b.id !== betId);
          return { ...match, bets: newBets };
        })
        .filter((match) => (match.bets?.length || 0) > 0)
    );
  }, []);

  const handleClearHistory = useCallback(() => {
    if (window.confirm("Are you sure you want to delete ALL betting history? This cannot be undone.")) {
      setHistory([]);
    }
  }, []);

  const appError = useMemo(() => {
    const e = uploadError || analysisError;
    if (!e) return "";
    return typeof e === "string" ? e : "An unexpected error occurred.";
  }, [uploadError, analysisError]);

  // Persist minimal UI state
  useEffect(() => {
    const payload = {
      currentView,
      darkMode,
      manualInsiderMode,
      manualIntelText: manualIntelText.slice(0, 8000),
      bankroll: bankrollMeta.ok ? bankrollMeta.n : bankroll,
      inputMode,
      manualMatchText: manualMatchText.slice(0, 20000),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [currentView, darkMode, manualInsiderMode, manualIntelText, bankroll, bankrollMeta, inputMode, manualMatchText]);

  // ----------------------
  // Prompt generators
  // ----------------------
  const generateInsiderPrompt = useMemo(() => {
    if (!hasQueue) return "";
    let fullPrompt = "Act as a DEEP INSIDER for the following matches.\n";
    fullPrompt += "GOAL: Find verified breaking news, late line movements, and smart money signals.\n\n";

    imageGroups.forEach((group, idx) => {
      const sport = group?.sport || "UNKNOWN";
      const label = group?.matchLabel || `Match ${idx + 1}`;
      fullPrompt += `--- MATCH ${idx + 1}: ${label} (${sport}) ---\n`;
      fullPrompt +=
        "SEARCH X (TWITTER) & REAL-TIME SOURCES FOR:\n" +
        "1. LATE BREAKING NEWS\n" +
        "2. SMART MONEY\n" +
        "3. MOTIVATION & PSYCH\n" +
        "STRICT RULES:\n" +
        "- NO GENERIC STATS\n" +
        "- FIND THE EDGE\n" +
        "- IMPACT SCORE [1-10]\n\n";
    });

    fullPrompt += "FORMAT: High-density bullet points. No fluff.";
    return fullPrompt;
  }, [hasQueue, imageGroups]);

  const handleCopyPrompt = useCallback(async () => {
    const text = generateInsiderPrompt;
    if (!text) return;

    try {
      await copyToClipboard(text);
      if (!isMounted.current) return;

      setCopySuccess(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => {
        if (isMounted.current) setCopySuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      if (isMounted.current) setUploadError?.("Copy failed. Your browser blocked clipboard access.");
    }
  }, [generateInsiderPrompt, setUploadError]);

  const generatePerplexityPrompt = useMemo(() => {
    if (!hasQueue) return "";
    let fullPrompt = "You are a specialized Sports Intelligence Researcher using Deep Search (Perplexity/Grok).\n";
    fullPrompt += "TASK: Find real-time confirmed lineups, injury reports, and validated insider rumors for these matches.\n\n";

    imageGroups.forEach((group, idx) => {
      const sport = group?.sport || "UNKNOWN";
      const label = group?.matchLabel || `Match ${idx + 1}`;
      fullPrompt += `### EVENT: ${label} (${sport})\n`;
      fullPrompt += "- FIND: Official starting lineups / Inactives (link sources)\n";
      fullPrompt += "- FIND: Sharp money movement & Bookmaker liabilities\n";
      fullPrompt += "- FIND: Weather or Venue specific impacts\n\n";
    });

    fullPrompt +=
      "OUTPUT FORMAT:\n" +
      "- **Source Links**: MUST include URL for every claim.\n" +
      "- **Confidence**: High/Medium/Low based on source credibility.";
    return fullPrompt;
  }, [hasQueue, imageGroups]);

  const handleCopyAndNavigate = useCallback(
    async (destination) => {
      const text = generatePerplexityPrompt;

      if (text) {
        try {
          await copyToClipboard(text);
          if (isMounted.current) {
            setPerplexityCopySuccess(true);
            if (perplexityCopyTimeoutRef.current) clearTimeout(perplexityCopyTimeoutRef.current);
            perplexityCopyTimeoutRef.current = setTimeout(() => {
              if (isMounted.current) setPerplexityCopySuccess(false);
            }, 2000);
          }
        } catch (err) {
          console.error("Failed to copy:", err);
          if (isMounted.current) setUploadError?.("Copy failed. Browser blocked access.");
        }
      }

      if (destination === "perplexity") {
        window.open("https://www.perplexity.ai/", "_blank");
      } else if (destination === "grok") {
        window.open("https://x.com/i/grok", "_blank");
      }
    },
    [generatePerplexityPrompt, setUploadError]
  );

  // ----------------------
  // Action handlers
  // ----------------------
  const handleStop = useCallback(() => {
    stopAnalysis?.();
  }, [stopAnalysis]);

  const handleStart = useCallback(() => {
    // Immediate Scroll (User Request)
    // Scroll to blackboard BEFORE analysis starts
    setTimeout(() => {
      const el = document.getElementById("blackboard-section");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    // Validation for screenshot mode
    if (inputMode === 'screenshot') {
      if (!hasQueue) return;
      if (isScanning) return;
      if (isRunning) return;
      if (!bankrollOk) return;

      const manualIntel = manualInsiderMode ? manualIntelText.trim().slice(0, 5000) : "";
      startAnalysis?.(imageGroups, manualIntel, bankrollMeta.n);
    }
    // Validation for text mode
    else if (inputMode === 'text') {
      if (!manualMatchText.trim()) return;
      if (isRunning) return;
      if (!bankrollOk) return;

      // Use DeepSeek parser if API key available, else fallback to regex
      const deepseekKey = apiKeys?.deepseek;
      // FORCE V3.2 for parsing speed & quality, as requested by user
      const parserModel = 'deepseek-v3.2';

      const doParse = async () => {
        let parsedMatches;

        if (deepseekKey && modelSettings?.deepseekEnabled !== false) {
          console.log('[App] Using DeepSeek V3.2 to parse text input...');
          try {
            parsedMatches = await parseWithDeepSeek(manualMatchText, deepseekKey, parserModel);
          } catch (err) {
            console.warn('[App] DeepSeek parsing failed, falling back to regex:', err);
            parsedMatches = parseManualTextInput(manualMatchText);
          }
        } else {
          console.log('[App] Using regex parser (no DeepSeek key)');
          parsedMatches = parseManualTextInput(manualMatchText);
        }

        if (!parsedMatches || parsedMatches.length === 0) {
          console.error('[App] No matches parsed from manual text input');
          setUploadError?.("Could not parse any matches from the text. Please check the format.");
          return;
        }

        // Convert to pipeline-compatible format (synthetic image groups)
        const normalizedMatches = normalizeForPipeline(parsedMatches);
        const syntheticGroups = normalizedMatches.map((match) => ({
          id: match.id,
          matchLabel: `${match.team1} vs ${match.team2}`,
          sport: match.sport || 'soccer',
          images: [], // No images in text mode
          scanResults: [match], // Pre-populate with parsed data
          isManualInput: true,
        }));

        console.log(`[App] Starting analysis with ${syntheticGroups.length} manual matches`);
        const manualIntel = manualInsiderMode ? manualIntelText.trim().slice(0, 5000) : "";
        startAnalysis?.(syntheticGroups, manualIntel, bankrollMeta.n);
      };

      doParse();
    }
  }, [
    inputMode,
    hasQueue,
    isScanning,
    isRunning,
    bankrollOk,
    manualInsiderMode,
    manualIntelText,
    manualMatchText,
    startAnalysis,
    imageGroups,
    bankrollMeta.n,
  ]);

  const handleClearQueue = useCallback(() => {
    if (isRunning) return;
    setImageGroups([]);
    resetBlackboard?.();
    setUploadError?.("");
  }, [isRunning, setImageGroups, resetBlackboard, setUploadError]);

  // --- Settings Dirty State ---
  const [isSettingsDirty, setIsSettingsDirty] = useState(false);

  const handleViewChange = useCallback((targetView, force = false) => {
    const nextView = normalizeView(targetView);
    if (!force && isSettingsDirty && currentView === 'settings' && nextView !== 'settings') {
      if (window.confirm("You have unsaved changes in Settings. Are you sure you want to leave? Unsaved changes will be lost.")) {
        setIsSettingsDirty(false); // Reset dirty state on forced exit
        setCurrentView(nextView);
      }
      return;
    }
    setCurrentView(nextView);
  }, [isSettingsDirty, currentView]);

  // Determine if Run button should be enabled based on input mode
  // PhD-Level Requirement: Must have at least ONE reasoning/research key to run (Perplexity OR OpenAI OR DeepSeek)
  const hasValidKeys = useMemo(() => {
    const k = apiKeys || {};
    // Check for valid key length (basic heuristic)
    const hasPplx = k.perplexity?.length > 10;
    const hasOpenAI = k.openai?.length > 10;
    const hasDeepSeek = k.deepseek?.length > 10;
    return hasPplx || hasOpenAI || hasDeepSeek;
  }, [apiKeys]);

  const canRunScreenshot = hasQueue && !isScanning && !isRunning && bankrollOk && hasValidKeys;
  const canRunText = inputMode === 'text' && manualMatchText.trim().length > 10 && !isRunning && bankrollOk && hasValidKeys;
  const canRun = inputMode === 'screenshot' ? canRunScreenshot : canRunText;
  const canStop = isRunning;

  // Methodology full page
  if (currentView === "methodology") {
    return (
      <HowItWorksPage
        onBack={() => handleViewChange("dashboard")}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  return (
    <>
      <DashboardLayout currentView={currentView} onViewChange={handleViewChange} darkMode={darkMode}>
        {currentView === "settings" && (
          <ConfigurationPage
            apiKeys={apiKeys}
            setApiKeys={setApiKeys}
            modelSettings={modelSettings}
            setModelSettings={setModelSettings}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            setIsDirty={setIsSettingsDirty}
          />
        )}

        {currentView === "dashboard" && (
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
              <HeaderSection darkMode={darkMode} />
              <ActionBar
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                bankroll={bankroll}
                setBankroll={setBankroll}
                canRun={canRun}
                canStop={canStop}
                onStart={handleStart}
                onStop={handleStop}
                appStatus={appStatus}
                bankrollOk={bankrollOk}
                isScanning={isScanning}
                isRunning={isRunning}
                inputMode={inputMode}
                manualMatchTextLength={manualMatchText.length}
                hasValidKeys={hasValidKeys}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div
                className={`col-span-12 transition-all duration-500 ${hasQueue || inputMode === 'text' ? "lg:col-span-5 xl:col-span-4" : "lg:col-span-12"
                  }`}
              >
                {/* Input Mode Toggle */}
                <div className={`mb-4 p-4 rounded-2xl border transition-all ${darkMode ? 'bg-black/20 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Input Mode</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setInputMode('screenshot')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${inputMode === 'screenshot'
                        ? (darkMode ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'bg-blue-50 text-blue-700 border border-blue-200')
                        : (darkMode ? 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-700/50' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100')
                        }`}
                    >
                      📸 Screenshot
                    </button>
                    <button
                      onClick={() => setInputMode('text')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${inputMode === 'text'
                        ? (darkMode ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50' : 'bg-indigo-50 text-indigo-700 border border-indigo-200')
                        : (darkMode ? 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-700/50' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100')
                        }`}
                    >
                      📝 Paste Text
                    </button>
                  </div>
                </div>

                {/* Manual Text Input Area (shown when in text mode) */}
                {inputMode === 'text' && (
                  <div className={`mb-4 p-4 rounded-2xl border transition-all ${darkMode ? 'bg-indigo-900/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className={`block text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                        Paste Match Data
                      </label>

                      {/* Clear Button (User Request) */}
                      <button
                        onClick={() => setManualMatchText("")}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded transition-colors ${darkMode
                          ? 'text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/20'
                          : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100'
                          }`}
                        title="Clear all text"
                      >
                        Clear
                      </button>
                    </div>
                    <p className={`text-[10px] mb-3 leading-relaxed ${darkMode ? 'text-indigo-200/60' : 'text-indigo-600/70'}`}>
                      Paste formatted match data with odds. Supports markdown format with 1X2, Over/Under, and BTTS markets.
                    </p>
                    <textarea
                      value={manualMatchText}
                      onChange={(e) => setManualMatchText(e.target.value)}
                      placeholder={"### 1. **Liverpool vs Manchester City** (Premier League, 17:30)\n- **1X2:** Home **2.38** | Draw **3.90** | Away **2.90**\n- **Over/Under 2.5:** Over **1.73** | Under **2.06**\n- **BTTS:** Yes **1.46** | No **2.55**\n\n### 2. **LA Lakers vs Boston Celtics** (NBA, 20:00)\n- **Spread:** Lakers -5.5 @ **1.91** | Celtics +5.5 @ **1.91**\n- **Total Points:** Over 221.5 @ **1.90** | Under 221.5 @ **1.90**\n- **Moneyline:** Lakers **1.65** | Celtics **2.25**"}
                      className={`w-full h-48 p-3 rounded-xl text-xs font-mono border resize-none transition-all outline-none ${darkMode
                        ? 'bg-black/30 border-indigo-500/30 text-indigo-100 placeholder-indigo-500/40 focus:border-indigo-400'
                        : 'bg-white border-indigo-200 text-indigo-900 placeholder-indigo-400/50 focus:border-indigo-400'
                        }`}
                    />

                    {/* Live Match Preview - Premium PhD Design */}
                    {manualMatchText.trim() && (() => {
                      const detectedMatches = parseManualTextInput(manualMatchText);
                      return detectedMatches.length > 0 ? (
                        <div className="mt-5 space-y-3">
                          {/* Header */}
                          <div className={`flex items-center justify-between`}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full animate-pulse ${darkMode ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                              <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                {detectedMatches.length} Match{detectedMatches.length > 1 ? 'es' : ''} Detected
                              </span>
                            </div>
                            <span className={`text-[10px] font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                              Live Preview
                            </span>
                          </div>

                          {/* Match Cards Grid */}
                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                            {detectedMatches.map((match, i) => (
                              <div
                                key={i}
                                className={`relative group rounded-xl border overflow-hidden transition-all duration-300 hover:scale-[1.01] ${darkMode
                                  ? 'bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 border-slate-700/50 hover:border-cyan-500/30'
                                  : 'bg-gradient-to-br from-white via-slate-50 to-white border-slate-200 hover:border-blue-300 shadow-sm'
                                  }`}
                              >
                                {/* Glow Effect */}
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${darkMode ? 'bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5' : 'bg-gradient-to-r from-blue-500/5 via-transparent to-indigo-500/5'
                                  }`} />

                                {/* Card Content */}
                                <div className="relative p-3">
                                  {/* Top Row: Teams + Competition Badge */}
                                  <div className="flex items-start justify-between gap-3 mb-3">
                                    {/* Teams Section */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      {/* Team 1 Initial */}
                                      <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black ${darkMode ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {(match.team1 || '?')[0].toUpperCase()}
                                      </div>

                                      {/* Match Info */}
                                      <div className="flex-1 min-w-0">
                                        <div className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                          {match.team1} <span className="opacity-40 mx-0.5">vs</span> {match.team2}
                                        </div>
                                        <div className={`text-[10px] font-medium mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                          {match.competition || 'Unknown League'} {match.time && `• ${match.time}`}
                                        </div>
                                      </div>

                                      {/* Team 2 Initial */}
                                      <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black ${darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-indigo-100 text-indigo-700'
                                        }`}>
                                        {(match.team2 || '?')[0].toUpperCase()}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Odds Display Grid */}
                                  <div className="grid grid-cols-3 gap-2">
                                    {/* 1X2 Market */}
                                    <div className={`rounded-lg p-2 text-center ${match.markets?.moneyline
                                      ? (darkMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100')
                                      : (darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-slate-50 border border-slate-200')
                                      }`}>
                                      <div className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${match.markets?.moneyline
                                        ? (darkMode ? 'text-emerald-400' : 'text-emerald-600')
                                        : (darkMode ? 'text-slate-500' : 'text-slate-400')
                                        }`}>1X2</div>
                                      {match.markets?.moneyline ? (
                                        <div className="flex justify-center gap-1.5 text-[10px] font-mono font-bold">
                                          <span className={darkMode ? 'text-emerald-300' : 'text-emerald-700'}>{match.homeOdds?.toFixed(2) || '—'}</span>
                                          <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>{match.drawOdds?.toFixed(2) || '—'}</span>
                                          <span className={darkMode ? 'text-emerald-300' : 'text-emerald-700'}>{match.awayOdds?.toFixed(2) || '—'}</span>
                                        </div>
                                      ) : (
                                        <div className={`text-[10px] ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>N/A</div>
                                      )}
                                    </div>

                                    {/* Over/Under Market */}
                                    <div className={`rounded-lg p-2 text-center ${match.markets?.overUnder
                                      ? (darkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100')
                                      : (darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-slate-50 border border-slate-200')
                                      }`}>
                                      <div className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${match.markets?.overUnder
                                        ? (darkMode ? 'text-blue-400' : 'text-blue-600')
                                        : (darkMode ? 'text-slate-500' : 'text-slate-400')
                                        }`}>O/U {match.overUnderLine || 2.5}</div>
                                      {match.markets?.overUnder ? (
                                        <div className="flex justify-center gap-2 text-[10px] font-mono font-bold">
                                          <span className={darkMode ? 'text-blue-300' : 'text-blue-700'}>O {match.overOdds?.toFixed(2) || '—'}</span>
                                          <span className={darkMode ? 'text-blue-300' : 'text-blue-700'}>U {match.underOdds?.toFixed(2) || '—'}</span>
                                        </div>
                                      ) : (
                                        <div className={`text-[10px] ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>N/A</div>
                                      )}
                                    </div>

                                    {/* BTTS Market */}
                                    <div className={`rounded-lg p-2 text-center ${match.markets?.btts
                                      ? (darkMode ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-100')
                                      : (darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-slate-50 border border-slate-200')
                                      }`}>
                                      <div className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${match.markets?.btts
                                        ? (darkMode ? 'text-purple-400' : 'text-purple-600')
                                        : (darkMode ? 'text-slate-500' : 'text-slate-400')
                                        }`}>BTTS</div>
                                      {match.markets?.btts ? (
                                        <div className="flex justify-center gap-2 text-[10px] font-mono font-bold">
                                          <span className={darkMode ? 'text-purple-300' : 'text-purple-700'}>Y {match.bttsYes?.toFixed(2) || '—'}</span>
                                          <span className={darkMode ? 'text-purple-300' : 'text-purple-700'}>N {match.bttsNo?.toFixed(2) || '—'}</span>
                                        </div>
                                      ) : (
                                        <div className={`text-[10px] ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>N/A</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                {/* Screenshot Upload Zone (shown when in screenshot mode) */}
                {inputMode === 'screenshot' && (
                  <MatchUploadZone
                    isScanning={isScanning}
                    onFileUpload={handleFileUpload}
                    dragActiveState={dragActiveState}
                    darkMode={darkMode}
                    onSetActiveUploadTarget={setActiveUploadTarget}
                  />
                )}
                <ManualInsider
                  manualInsiderMode={manualInsiderMode}
                  setManualInsiderMode={setManualInsiderMode}
                  manualIntelText={manualIntelText}
                  setManualIntelText={setManualIntelText}
                  hasQueue={hasQueue || inputMode === 'text'}
                  handleCopyPrompt={handleCopyPrompt}
                  copySuccess={copySuccess}
                  handleCopyAndNavigate={handleCopyAndNavigate}
                  perplexityCopySuccess={perplexityCopySuccess}
                  grokCopySuccess={false} // Placeholder until state added
                  darkMode={darkMode}
                />
              </div>

              {hasQueue && (
                <div className="col-span-12 lg:col-span-7 xl:col-span-8 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-subtle mb-4">
                    <h3 className="text-sm font-bold text-tertiary uppercase tracking-widest">
                      Analysis Queue <span className="text-cyan">({imageGroups.length})</span>
                    </h3>
                    <button
                      onClick={handleClearQueue}
                      disabled={isRunning}
                      className={`text-xs font-medium ${isRunning ? "text-muted cursor-not-allowed" : "text-rose-500 hover:text-rose-400"
                        }`}
                      title={isRunning ? "Stop analysis before clearing the queue." : "Clear queue"}
                    >
                      Clear Queue
                    </button>
                  </div>

                  <div className="grid gap-4">
                    {imageGroups.map((group) => (
                      <MatchCard
                        key={group.id}
                        group={group}
                        darkMode={darkMode}
                        dragActiveState={dragActiveState}
                        onRemoveImage={handleRemoveImage}
                        onUpdateMatchLabel={handleUpdateMatchLabel}
                        onUpdateSport={handleUpdateSport}
                        onDeleteGroup={handleDeleteGroup}
                        onPreviewImage={setPreviewImage}
                        onAddImageToGroup={handleAddImageToGroup}
                        onSetActiveUploadTarget={setActiveUploadTarget}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!!appError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3 animate-pulse">
                <AlertCircle size={20} />
                <span className="font-bold">{appError}</span>
              </div>
            )}

            {(appStatus !== "IDLE" || (blackboardState?.MATCH_DATA?.length || 0) > 0) && (
              <div id="blackboard-section" ref={blackboardRef} className="pt-8 border-t border-subtle">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-subtle">
                  <div className={`p-2.5 rounded-xl text-cyan shadow-sm ${darkMode ? "bg-cyan/10" : "bg-cyan/5 border border-cyan/10"}`}>
                    <Sparkles size={24} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight text-primary">Intelligence Blackboard</h3>
                    <p className="text-xs font-medium uppercase tracking-widest text-tertiary">Live Analysis Feed</p>
                  </div>
                </div>

                <Blackboard
                  key={blackboardState.runId || 'initial'}
                  status={appStatus}
                  state={blackboardState}
                  darkMode={darkMode}
                  onAddToHistory={handleAddToHistory}
                  bankroll={bankrollMeta.ok ? bankrollMeta.n : 0}
                />
              </div>
            )}
          </div>
        )}

        {currentView === "history" && (
          <HistoryPage
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            history={history}
            onUpdateBet={handleUpdateHistoryItem}
            onDeleteMatch={handleDeleteHistoryItem}
            onDeleteBet={handleDeleteBet}
            onClearHistory={handleClearHistory}
            bankroll={bankrollMeta.ok ? bankrollMeta.n : 0}
            apiKeys={apiKeys}
            modelSettings={modelSettings}
          />
        )}
      </DashboardLayout>

      {/* Image Preview Modal - outside layout to escape sidebar z-index */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <img
            src={previewImage}
            alt="Preview"
            className="w-auto h-auto max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl border border-slate-800"
          />
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 text-white hover:text-rose-500 transition-colors bg-black/50 p-2 rounded-full"
            aria-label="Close preview"
          >
            <XCircle size={24} />
          </button>
        </div>
      )}
    </>
  );
}

export default App;