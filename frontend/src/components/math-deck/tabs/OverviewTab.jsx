import React, { memo } from "react";
import { Rocket, Eye, Search, Activity, BrainCircuit, ArrowRight } from "lucide-react";

/**
 * OverviewTab
 * Formerly "Workflow" in some versions.
 */
const OverviewTab = memo(function OverviewTab() {
    const agents = [
        {
            icon: Eye,
            title: "Vision Parser",
            subtitle: "GPT-5.2",
            desc: "Extracts sport, teams, odds, market type, and lines from screenshots; outputs structured inputs for reasoning.",
            accent: "from-cyan-400 to-sky-500",
            accentBg: "cyan",
        },
        {
            icon: Search,
            title: "Data Crawler",
            subtitle: "Perplexity",
            desc: "Retrieval layer gathers injuries, xG/shot-quality, pace/efficiency, and matchup signals with source-aware skepticism.",
            accent: "from-violet-400 to-purple-500",
            accentBg: "violet",
        },
        {
            icon: Activity,
            title: "Soft-Factor Ingest",
            subtitle: "Context Engine",
            desc: "Captures context: lineup uncertainty, travel/schedule load, and late constraints with guardrails.",
            accent: "from-emerald-400 to-teal-500",
            accentBg: "emerald",
        },
        {
            icon: BrainCircuit,
            title: "Stochastic Engine",
            subtitle: "Kelly + CVaR",
            desc: "Builds posterior distributions per sport; evaluates EV, fractional Kelly sizing, and tail-risk controls (CVaR).",
            accent: "from-amber-400 to-orange-500",
            accentBg: "amber",
        },
    ];

    const accentColors = {
        cyan: { iconBg: "rgba(6,182,212,0.12)", iconColor: "#22d3ee", numColor: "rgba(6,182,212,0.15)", border: "rgba(6,182,212,0.25)" },
        violet: { iconBg: "rgba(139,92,246,0.12)", iconColor: "#a78bfa", numColor: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.25)" },
        emerald: { iconBg: "rgba(16,185,129,0.12)", iconColor: "#34d399", numColor: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.25)" },
        amber: { iconBg: "rgba(245,158,11,0.12)", iconColor: "#fbbf24", numColor: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.25)" },
    };

    return (
        <div className="space-y-14 animate-in fade-in duration-500" id="phd-panels-panel-overview">
            {/* Hero heading */}
            <div className="max-w-3xl space-y-5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"
                    style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.18)", color: "#22d3ee" }}>
                    <Rocket className="w-3.5 h-3.5" />
                    System Pipeline
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1]">
                    How the PhD AI <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Processes Data.</span>
                </h2>
                <p className="text-base md:text-lg opacity-60 leading-relaxed font-medium max-w-2xl">
                    The system operates as a multi-agent orchestration layer, moving from raw visual data to
                    stochastic probability distributions and defensive capital allocation.
                </p>
            </div>

            {/* Flow connector label */}
            <div className="flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: "var(--lab-line)" }} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Agent Pipeline</span>
                <div className="h-px flex-1" style={{ background: "var(--lab-line)" }} />
            </div>

            {/* Agent Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {agents.map((agent, i) => {
                    const colors = accentColors[agent.accentBg];
                    return (
                        <div
                            key={i}
                            className="relative p-6 md:p-7 rounded-2xl border transition-all duration-300 group hover:translate-y-[-2px] hover:shadow-lg overflow-hidden"
                            style={{
                                borderColor: "var(--lab-line)",
                                background: "var(--lab-panel)",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.border; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--lab-line)"; }}
                        >
                            {/* Step number watermark */}
                            <span
                                className="absolute top-3 right-4 text-6xl font-black pointer-events-none select-none"
                                style={{ color: colors.numColor, lineHeight: 1 }}
                            >
                                {String(i + 1).padStart(2, "0")}
                            </span>

                            {/* Icon */}
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                                style={{ background: colors.iconBg }}
                            >
                                <agent.icon className="w-5 h-5" style={{ color: colors.iconColor }} />
                            </div>

                            {/* Title + subtitle */}
                            <div className="mb-3">
                                <h3 className="text-lg font-black tracking-tight">{agent.title}</h3>
                                <span className="text-[11px] font-bold uppercase tracking-wider opacity-40">{agent.subtitle}</span>
                            </div>

                            {/* Description */}
                            <p className="text-sm leading-relaxed opacity-50 font-medium">{agent.desc}</p>

                            {/* Bottom accent line */}
                            <div
                                className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ background: `linear-gradient(to right, ${colors.iconColor}, transparent)` }}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Flow arrow to next section */}
            <div className="flex justify-center pt-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full opacity-30"
                    style={{ background: "var(--lab-panel2)", border: "1px solid var(--lab-line)" }}>
                    <span className="text-[10px] font-black uppercase tracking-widest">Output</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Strategy + Sizing</span>
                </div>
            </div>
        </div>
    );
});

export default OverviewTab;
