import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AlertCircle, Sparkles, XCircle, Play, Loader2 } from "lucide-react";

// Layouts & Components
import DashboardLayout from "./layouts/DashboardLayout";
import MatchUploadZone from "./components/MatchUploadZone";
import MatchCard from "./components/MatchCard";
import Blackboard from "./components/Blackboard";
import HeaderSection from "./components/HeaderSection";
import ActionBar from "./components/ActionBar";
import ManualInsider from "./components/ManualInsider";
import LoadingScreen from "./components/LoadingScreen";
import ConfigurationPage from "./pages/ConfigurationPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import HistoryPage from "./pages/HistoryPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

import "./App.css";

// Custom Hooks
import { useBlackboardState } from "./hooks/useBlackboardState";
import { useSettings } from "./hooks/useSettings";
import { useImageUpload } from "./hooks/useImageUpload";
import { useAnalysis } from "./hooks/useAnalysis";
import { useHistory } from "./hooks/useHistory";
import { parseWithGPT, parseManualTextInput, normalizeForPipeline } from "./agents/textParser";

// Utilities
import {
  safeJsonParse,

  normalizeView,
  normalizeStatus,
  isRunningStatus,
  coerceBankroll,
  copyToClipboard,
  genId
} from "./utils/common";

const STORAGE_KEY = "phd_betting_app_v1";


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
  const [manualMatchText, setManualMatchText] = useState(""); // Never restore from localStorage — fresh start every session
  const [isParsingText, setIsParsingText] = useState(false); // GPT parsing in progress
  const [parseError, setParseError] = useState(""); // Text parse error message

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
    history,
    handleAddToHistory,
    handleUpdateHistoryItem,
    handleDeleteHistoryItem,
    handleDeleteBet,
    handleClearHistory,
  } = useHistory();

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
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [currentView, darkMode, manualInsiderMode, manualIntelText, bankroll, bankrollMeta, inputMode]);

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

  // Dedicated text parsing + analysis launcher with proper state management
  const parseAndRunTextInput = useCallback(async () => {
    const textToParse = manualMatchText.trim();
    if (!textToParse || textToParse.length < 10) {
      setParseError("Please enter at least 10 characters of match data.");
      return;
    }

    setIsParsingText(true);
    setParseError("");

    try {
      const openaiKey = apiKeys?.openai;
      const parserModel = modelSettings?.openai || 'gpt-4.1-mini';
      let parsedMatches;

      if (openaiKey) {
        console.log('[App] Using GPT to parse text input');
        console.log('[App] OpenAI key:', !!openaiKey, '| Model:', parserModel);
        try {
          parsedMatches = await parseWithGPT(textToParse, openaiKey, parserModel);
          console.log('[App] GPT returned', parsedMatches?.length, 'matches');
        } catch (err) {
          console.warn('[App] GPT parsing failed, falling back to regex:', err);
          parsedMatches = parseManualTextInput(textToParse);
        }
      } else {
        console.log('[App] Using regex parser (no OpenAI key)');
        parsedMatches = parseManualTextInput(textToParse);
      }

      if (!parsedMatches || parsedMatches.length === 0) {
        setParseError("Could not extract any matches from the text. Try a clearer format like: 'Real Madrid vs Barcelona 2.10 3.40 3.50'");
        setIsParsingText(false);
        return;
      }

      // Convert to pipeline-compatible format
      const normalizedMatches = normalizeForPipeline(parsedMatches);
      const syntheticGroups = normalizedMatches.map((match) => ({
        id: match.id,
        matchLabel: `${match.team1} vs ${match.team2}`,
        sport: match.sport || 'soccer',
        images: [],
        scanResults: [match],
        isManualInput: true,
      }));

      console.log(`[App] Starting analysis with ${syntheticGroups.length} manual matches`);
      const manualIntel = manualInsiderMode ? manualIntelText.trim().slice(0, 5000) : "";
      startAnalysis?.(syntheticGroups, manualIntel, bankrollMeta.n);
    } catch (err) {
      console.error('[App] Text parsing failed:', err);
      setParseError(`Parsing failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsParsingText(false);
    }
  }, [manualMatchText, apiKeys, modelSettings, manualInsiderMode, manualIntelText, startAnalysis, bankrollMeta.n]);

  const handleStart = useCallback(async () => {
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
      // Bankroll is optional now

      const manualIntel = manualInsiderMode ? manualIntelText.trim().slice(0, 5000) : "";
      startAnalysis?.(imageGroups, manualIntel, bankrollMeta.n);
    }
    // Validation for text mode
    else if (inputMode === 'text') {
      if (!manualMatchText.trim()) return;
      if (isRunning || isParsingText) return;

      // Parse and run — with proper loading state and error handling
      await parseAndRunTextInput();
    }
  }, [
    inputMode,
    hasQueue,
    isScanning,
    isRunning,
    isParsingText,
    bankrollOk,
    manualInsiderMode,
    manualIntelText,
    startAnalysis,
    imageGroups,
    bankrollMeta.n,
    parseAndRunTextInput,
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
  // PhD-Level Requirement: Must have at least ONE reasoning/research key to run (Perplexity OR OpenAI OR Gemini)
  const hasValidKeys = useMemo(() => {
    const k = apiKeys || {};
    // Check for valid key length (basic heuristic)
    const hasPplx = k.perplexity?.length > 10;
    const hasOpenAI = k.openai?.length > 10;
    const hasGemini = k.gemini?.length > 10;
    return hasPplx || hasOpenAI || hasGemini;
  }, [apiKeys]);

  const canRunScreenshot = hasQueue && !isScanning && !isRunning && hasValidKeys;
  const canRunText = inputMode === 'text' && manualMatchText.trim().length > 10 && !isRunning && !isParsingText && hasValidKeys;
  const canRun = inputMode === 'screenshot' ? canRunScreenshot : canRunText;
  const canStop = isRunning;

  // Methodology full page
  if (currentView === "methodology") {
    return (
      <ErrorBoundary darkMode={darkMode}>
        <HowItWorksPage
          onBack={() => handleViewChange("dashboard")}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary darkMode={darkMode}>
      <DashboardLayout currentView={currentView} onViewChange={handleViewChange} darkMode={darkMode}>
        {currentView === "settings" && (
          <ConfigurationPage
            apiKeys={apiKeys}
            setApiKeys={setApiKeys}
            modelSettings={modelSettings}
            setModelSettings={setModelSettings}
            darkMode={darkMode}
            setIsDirty={setIsSettingsDirty}
          />
        )}

        {currentView === "dashboard" && (
          <div className="space-y-8">
            {/* Hero Command Bar */}
            <div className={`mt-2 sm:mt-4 p-4 sm:p-5 rounded-3xl border backdrop-blur-sm transition-all ${darkMode
              ? 'bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80 border-slate-700/40 shadow-xl shadow-black/20'
              : 'bg-gradient-to-r from-white/90 via-white/70 to-white/90 border-slate-200/60 shadow-lg shadow-slate-200/30'
              }`}>
              <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between">
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div
                className={`col-span-12 transition-all duration-500 ${hasQueue || inputMode === 'text' ? "lg:col-span-5 xl:col-span-4" : "lg:col-span-12"
                  }`}
              >
                {/* Input Mode Toggle */}
                <div className={`mb-4 p-1.5 rounded-2xl border transition-all ${darkMode ? 'bg-black/30 border-slate-700/40' : 'bg-slate-100 border-slate-200'}`}>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setInputMode('screenshot')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${inputMode === 'screenshot'
                        ? (darkMode ? 'bg-slate-800 text-cyan-300 shadow-md' : 'bg-white text-slate-800 shadow-sm')
                        : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')
                        }`}
                    >
                      Screenshot
                    </button>
                    <button
                      onClick={() => setInputMode('text')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${inputMode === 'text'
                        ? (darkMode ? 'bg-slate-800 text-indigo-300 shadow-md' : 'bg-white text-slate-800 shadow-sm')
                        : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')
                        }`}
                    >
                      Paste Text
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

                      {/* Clear Button */}
                      {manualMatchText.trim().length > 0 && (
                        <button
                          onClick={() => { setManualMatchText(""); setParseError(""); }}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors ${darkMode
                            ? 'text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 bg-rose-500/10'
                            : 'text-rose-600 hover:text-rose-800 hover:bg-rose-100 bg-rose-50'
                            }`}
                          title="Clear all text"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className={`text-[10px] mb-3 leading-relaxed ${darkMode ? 'text-indigo-200/60' : 'text-indigo-600/70'}`}>
                      Write matches in any format. GPT AI will parse team names, odds, and markets automatically.
                    </p>
                    <textarea
                      value={manualMatchText}
                      onChange={(e) => { setManualMatchText(e.target.value); setParseError(""); }}
                      placeholder={"Write matches in ANY format — GPT AI will parse them:\n\nReal Madrid vs Barcelona over 1.5 corner 2.20\nLiverpool - Man City 2.10 3.40 3.50 btts 1.70\nPSG Monaco hazai 1.80 döntetlen 3.50 vendég 4.20\nLakers vs Celtics ML 1.65\n\nOr use structured format:\n### 1. **Arsenal vs Chelsea** (PL, 17:30)\n- 1X2: 2.38 / 3.90 / 2.90"}
                      maxLength={20000}
                      className={`w-full h-48 p-3 rounded-xl text-xs font-mono border resize-none transition-all outline-none ${darkMode
                        ? 'bg-black/30 border-indigo-500/30 text-indigo-100 placeholder-indigo-500/40 focus:border-indigo-400'
                        : 'bg-white border-indigo-200 text-indigo-900 placeholder-indigo-400/50 focus:border-indigo-400'
                        }`}
                      disabled={isParsingText || isRunning}
                    />

                    {/* Character count + readiness */}
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[10px] font-mono ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {manualMatchText.trim().length} chars
                      </span>
                      {manualMatchText.trim().length > 10 && !parseError && (
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                          <span className={`text-[10px] font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            Ready to analyze
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Parse Error */}
                    {parseError && (
                      <div className={`mt-3 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${darkMode ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-rose-50 border border-rose-200 text-rose-600'}`}>
                        <AlertCircle size={14} />
                        {parseError}
                      </div>
                    )}

                    {/* ANALYZE BUTTON — Primary action for text mode */}
                    <button
                      type="button"
                      onClick={parseAndRunTextInput}
                      disabled={isParsingText || isRunning || manualMatchText.trim().length < 10}
                      className={`w-full mt-4 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${isParsingText || isRunning
                        ? (darkMode
                          ? 'bg-indigo-900/30 text-indigo-300 border border-indigo-500/30 cursor-wait'
                          : 'bg-indigo-100 text-indigo-500 border border-indigo-200 cursor-wait')
                        : manualMatchText.trim().length < 10 || !bankrollOk
                          ? (darkMode
                            ? 'bg-slate-800/60 text-slate-600 cursor-not-allowed border border-slate-700/50'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200')
                          : (darkMode
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98] border border-indigo-500/30'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98] border border-indigo-400/30')
                        }`}
                      title={
                        !bankrollOk ? "Set a bankroll amount first" :
                          manualMatchText.trim().length < 10 ? "Enter at least 10 characters of match data" :
                            isParsingText ? "GPT is parsing your text..." :
                              isRunning ? "Analysis is running..." :
                                "Parse text with GPT AI and start analysis"
                      }
                    >
                      {isParsingText ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Parsing with GPT...
                        </>
                      ) : isRunning ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Play size={18} fill="currentColor" />
                          Analyze Matches
                        </>
                      )}
                    </button>

                    {/* Bankroll warning removed - optional now */}
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

      {/* Professional Loading Screen — shown during analysis */}
      <LoadingScreen
        status={appStatus}
        onCancel={handleStop}
        darkMode={darkMode}
        isOpen={isRunning}
      />
    </ErrorBoundary>
  );
}

export default App;