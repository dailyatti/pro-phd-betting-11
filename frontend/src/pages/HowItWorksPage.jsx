import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  Sigma,
  Rocket,
  Calculator,
  Book,
  ChevronLeft,
  Sun,
  Moon
} from "lucide-react";
import clsx from "clsx";

// Modular Tabs
import OverviewTab from "../components/math-deck/tabs/OverviewTab";
import CalculatorTab from "../components/math-deck/tabs/CalculatorTab";
import GlossaryTab from "../components/math-deck/tabs/GlossaryTab";
import SportEnginesTab from "../components/math-deck/tabs/SportEnginesTab";
import PhDBettingMathDeck from "../components/math-deck";

/**
 * HowItWorksPage
 * 
 * Main entry point for the Methodology / Research section.
 * Implements the Tab System required by Playwright tests.
 */
export default function HowItWorksPage({ onBack, darkMode, setDarkMode }) {
  const [activeTab, setActiveTab] = useState("overview");
  // Sync with Playwright expectations (theme-dark/theme-light on <html>)
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add("theme-dark");
      html.classList.remove("theme-light");
      html.setAttribute("data-theme", "dark");
    } else {
      html.classList.add("theme-light");
      html.classList.remove("theme-dark");
      html.setAttribute("data-theme", "light");
    }
  }, [darkMode]);

  const tabs = useMemo(() => [
    { id: "overview", label: "Overview", icon: Rocket },
    { id: "math", label: "Math", icon: Sigma },
    { id: "engines", label: "Sport Engines", icon: Rocket },
    { id: "calculator", label: "Calculator", icon: Calculator },
    { id: "glossary", label: "Glossary", icon: Book },
  ], []);

  const handleTabChange = useCallback((id) => {
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // If the Math Lab is active, we render it. 
  // It has its own theme management, but we pass the app's state for consistency.
  if (activeTab === "math") {
    return (
      <PhDBettingMathDeck 
        onBack={() => setActiveTab("overview")} 
        appDarkMode={darkMode} 
        appSetDarkMode={setDarkMode} 
      />
    );
  }

  return (
    <div className={clsx(
      "min-h-screen transition-colors duration-500",
      darkMode ? "bg-[#030406] text-slate-100" : "bg-[#fdfdfd] text-slate-900"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-8">
        {/* Header */}
        <header className={clsx(
          "flex flex-wrap items-center justify-between gap-4 mb-8 p-4 sm:p-5 rounded-2xl border backdrop-blur-sm transition-all",
          darkMode
            ? "bg-gradient-to-r from-slate-900/80 via-slate-800/50 to-slate-900/80 border-slate-700/40 shadow-xl shadow-black/20"
            : "bg-gradient-to-r from-white/90 via-white/70 to-white/90 border-slate-200/60 shadow-lg shadow-slate-200/30"
        )}>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className={clsx(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all text-sm font-bold",
                darkMode
                  ? "border-slate-700/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                  : "border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Return
            </button>
            <div className={clsx("h-7 w-px mx-1", darkMode ? "bg-slate-700/60" : "bg-slate-200")} />
            <div className="flex items-center gap-2.5">
              <div className={clsx(
                "p-2 rounded-xl border",
                darkMode ? "bg-cyan-500/10 border-cyan-500/20" : "bg-amber-50 border-amber-200/60"
              )}>
                <Sigma className={clsx("w-5 h-5", darkMode ? "text-cyan-400" : "text-amber-600")} />
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight uppercase">Methodology</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
              className={clsx(
                "p-2.5 rounded-xl border transition-all",
                darkMode
                  ? "border-slate-700/60 hover:bg-slate-800"
                  : "border-slate-200 hover:bg-slate-50"
              )}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-cyan-500" />}
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className={clsx(
          "flex items-center gap-1.5 mb-10 p-1.5 rounded-2xl border w-fit",
          darkMode ? "border-slate-700/40 bg-slate-900/50" : "border-slate-200/60 bg-slate-100/80"
        )} role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`phd-panels-panel-${tab.id}`}
                onClick={() => handleTabChange(tab.id)}
                className={clsx(
                  "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
                  isActive
                    ? darkMode
                      ? "bg-white text-black shadow-lg scale-[1.02]"
                      : "bg-slate-800 text-white shadow-lg scale-[1.02]"
                    : darkMode
                      ? "opacity-40 hover:opacity-100 hover:bg-white/5"
                      : "opacity-50 hover:opacity-100 hover:bg-slate-200/60 text-slate-600"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Tab Content */}
        <main className="pb-32">
          {activeTab === "overview" && (
            <div role="tabpanel" aria-label="Overview" id="phd-panels-panel-overview">
              <OverviewTab />
            </div>
          )}
          {activeTab === "engines" && (
            <div role="tabpanel" aria-label="Sport Engines" id="phd-panels-panel-engines">
              <SportEnginesTab />
            </div>
          )}
          {activeTab === "math" && (
            <div role="tabpanel" aria-label="Math" id="phd-panels-panel-math">
              <PhDBettingMathDeck 
                onBack={() => setActiveTab("overview")} 
                appDarkMode={darkMode} 
                appSetDarkMode={setDarkMode} 
              />
            </div>
          )}
          {activeTab === "calculator" && (
            <div role="tabpanel" aria-label="Calculator" id="phd-panels-panel-calculator">
              <CalculatorTab darkMode={darkMode} />
            </div>
          )}
          {activeTab === "glossary" && (
            <div role="tabpanel" aria-label="Glossary" id="phd-panels-panel-glossary">
              <GlossaryTab />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
