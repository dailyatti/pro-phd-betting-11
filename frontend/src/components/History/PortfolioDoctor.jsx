import React, { useState } from 'react';
import { Microscope, Loader2, Play } from 'lucide-react';
import clsx from 'clsx';

const PortfolioDoctor = ({ history, apiKeys, modelSettings, darkMode }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        // Simulation for now - will connect to Orchestrator later
        setTimeout(() => {
            setAnalysis({
                summary: "Your portfolio shows a strong leaning towards Football Over 2.5 markets, which is your most profitable segment (+12% ROI). However, Tennis Moneyline bets are dragging down overall performance (-5% ROI).",
                grade: "B+",
                recommendations: [
                    "Reduce stake size on Tennis underdogs.",
                    "Increase volume on Bundesliga Over markets.",
                    "Stop avoiding draws; your model is well-calibrated there."
                ]
            });
            setIsAnalyzing(false);
        }, 2000);
    };

    return (
        <div className={clsx("rounded-xl border p-6 mb-8", darkMode ? "bg-indigo-950/20 border-indigo-900/50" : "bg-indigo-50 border-indigo-200")}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={clsx("p-2 rounded-lg", darkMode ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600")}>
                        <Microscope size={24} />
                    </div>
                    <div>
                        <h3 className={clsx("text-lg font-bold", darkMode ? "text-white" : "text-indigo-900")}>Portfolio Doctor</h3>
                        <p className={clsx("text-xs opacity-70", darkMode ? "text-indigo-300" : "text-indigo-700")}>AI-Powered Behavioral Analysis</p>
                    </div>
                </div>

                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || history.length === 0}
                    className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                        darkMode
                            ? "bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                    )}
                >
                    {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                    {isAnalyzing ? "Analyzing..." : "Run Diagnosis"}
                </button>
            </div>

            {analysis && (
                <div className="animate-in fade-in slide-in-from-top-2">
                    <div className={clsx("p-4 rounded-lg mb-4 text-sm leading-relaxed border", darkMode ? "bg-black/20 border-white/10 text-indigo-100" : "bg-white border-indigo-100 text-indigo-800")}>
                        {analysis.summary}
                    </div>

                    <h4 className={clsx("text-xs font-bold uppercase tracking-widest mb-2", darkMode ? "text-indigo-400" : "text-indigo-700")}>Rx Recommendations</h4>
                    <ul className="space-y-2">
                        {analysis.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span className={darkMode ? "text-slate-300" : "text-slate-700"}>{rec}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PortfolioDoctor;
