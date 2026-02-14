import React, { memo } from "react";
import {
  Rocket,
  Zap,
  ShieldCheck,
  Brain,
  TrendingUp,
  BarChart3,
  Target,
  Layers,
  GitBranch,
  Database,
  AlertTriangle,
  CheckCircle2,
  MinusCircle,
  Flame,
  Dribbble,
  Swords,
  Timer,
  Trophy,
  Snowflake,
  CircleDot,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Sport Engines Tab – Purpose-Built vs General-Purpose              */
/* ------------------------------------------------------------------ */

const SportEnginesTab = memo(function SportEnginesTab() {
  /* ---------- Sport-specific engine data ---------- */
  const sports = [
    {
      icon: CircleDot,
      name: "Soccer",
      color: "#22d3ee",
      bg: "rgba(6,182,212,0.10)",
      border: "rgba(6,182,212,0.22)",
      metrics: ["xG & shot quality maps", "Pressing intensity (PPDA)", "Set-piece conversion rates", "Travel fatigue & schedule density"],
    },
    {
      icon: Dribbble,
      name: "Basketball",
      color: "#f97316",
      bg: "rgba(249,115,22,0.10)",
      border: "rgba(249,115,22,0.22)",
      metrics: ["Pace & efficiency ratings", "Rebound differential", "Back-to-back fatigue model", "Lineup rotation depth"],
    },
    {
      icon: Target,
      name: "Tennis",
      color: "#a3e635",
      bg: "rgba(163,230,53,0.10)",
      border: "rgba(163,230,53,0.22)",
      metrics: ["Surface-specific win rates", "Break-point conversion", "First-serve % under pressure", "H2H surface-adjusted Elo"],
    },
    {
      icon: Trophy,
      name: "NFL",
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.10)",
      border: "rgba(139,92,246,0.22)",
      metrics: ["EPA per play & DVOA", "Red-zone efficiency", "QB pressure rate", "Weather & altitude adjustments"],
    },
    {
      icon: Snowflake,
      name: "Hockey",
      color: "#38bdf8",
      bg: "rgba(56,189,248,0.10)",
      border: "rgba(56,189,248,0.22)",
      metrics: ["xG & high-danger chances", "Corsi / Fenwick possession", "Goalie save % (recent form)", "Special teams efficiency"],
    },
    {
      icon: Swords,
      name: "Baseball",
      color: "#f43f5e",
      bg: "rgba(244,63,94,0.10)",
      border: "rgba(244,63,94,0.22)",
      metrics: ["Pitcher FIP & xFIP", "Batter wOBA vs handedness", "Bullpen fatigue index", "Park factor adjustments"],
    },
  ];

  /* ---------- Capability comparison rows ---------- */
  const comparison = [
    {
      feature: "Sport-specific statistical models",
      general: "Typically requires manual prompt engineering per sport",
      phd: "Calibrated xG, EPA, Elo, and Corsi models built into each sport engine",
    },
    {
      feature: "Real-time data retrieval",
      general: "May rely on training-data snapshots",
      phd: "Live injury reports, lineup confirmations, and line movement via integrated deep search",
    },
    {
      feature: "Bankroll & risk management",
      general: "Typically requires external tools for position sizing",
      phd: "Fractional Kelly sizing with CVaR tail-risk controls, built into the pipeline",
    },
    {
      feature: "Multi-agent verification",
      general: "Single-model architecture, prompt-dependent validation",
      phd: "Four specialized agents cross-verify every data point before output",
    },
    {
      feature: "Structured odds extraction",
      general: "Manual copy-paste workflow from betting slips",
      phd: "Vision parser extracts odds, teams, and markets directly from screenshots",
    },
    {
      feature: "Probability distributions",
      general: "Typically produces qualitative assessments",
      phd: "Bayesian posteriors per market with quantified confidence intervals",
    },
    {
      feature: "Expected Value calculation",
      general: "May require manual EV computation",
      phd: "Automated edge calculation: (model probability x odds) - 1 on every line",
    },
    {
      feature: "Systematic bias controls",
      general: "Optimized for conversational helpfulness",
      phd: "Designed for statistical objectivity with hard confidence thresholds",
    },
  ];

  /* ---------- Key advantages ---------- */
  const advantages = [
    {
      icon: Brain,
      title: "Domain-Specific Reasoning",
      desc: "Each sport engine applies calibrated statistical frameworks tailored to its discipline. Soccer analysis uses xG models, NFL uses EPA/DVOA, Tennis uses surface-adjusted Elo — all integrated by default.",
      color: "#a78bfa",
      bg: "rgba(139,92,246,0.08)",
    },
    {
      icon: Layers,
      title: "Multi-Agent Verification",
      desc: "Four independent agents — Vision Parser, Data Crawler, Soft-Factor Ingest, and Stochastic Engine — cross-validate data points before any recommendation surfaces.",
      color: "#22d3ee",
      bg: "rgba(6,182,212,0.08)",
    },
    {
      icon: ShieldCheck,
      title: "Defensive Capital Allocation",
      desc: "Fractional Kelly criterion with CVaR constraints is applied to every position. The system is designed to protect bankroll integrity across variance-heavy sequences.",
      color: "#34d399",
      bg: "rgba(16,185,129,0.08)",
    },
    {
      icon: TrendingUp,
      title: "Edge-First Recommendations",
      desc: "Every output includes a calculated Expected Value. When the quantified edge falls below threshold, the system recommends passing — discipline is built into the workflow.",
      color: "#fbbf24",
      bg: "rgba(245,158,11,0.08)",
    },
    {
      icon: Database,
      title: "Analysis-Time Data Retrieval",
      desc: "Rather than relying on static training data, the system pulls live lineups, injury updates, and sharp line movements at the moment of analysis via integrated deep search.",
      color: "#f97316",
      bg: "rgba(249,115,22,0.08)",
    },
    {
      icon: GitBranch,
      title: "Full Audit Trail",
      desc: "Every recommendation exposes its reasoning chain: raw data, parsed odds, research findings, probability distribution, and Kelly sizing. Complete transparency at every step.",
      color: "#f43f5e",
      bg: "rgba(244,63,94,0.08)",
    },
  ];

  return (
    <div className="space-y-16 animate-in fade-in duration-500" id="phd-panels-panel-engines">

      {/* ===== HERO SECTION ===== */}
      <div className="max-w-3xl space-y-5">
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"
          style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.18)", color: "#a78bfa" }}
        >
          <Rocket className="w-3.5 h-3.5" />
          Sport Engines
        </div>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1]">
          Purpose-Built <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-500">
            Sport Intelligence.
          </span>
        </h2>
        <p className="text-base md:text-lg opacity-60 leading-relaxed font-medium max-w-2xl">
          General-purpose language models are remarkably flexible — but sports betting demands
          domain-specific statistical models, real-time data, and disciplined risk management.
          PhD Betting is an integrated analytical system purpose-built for this workflow.
        </p>
      </div>

      {/* ===== KEY ADVANTAGES ===== */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1" style={{ background: "var(--lab-line)" }} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Platform Advantages</span>
          <div className="h-px flex-1" style={{ background: "var(--lab-line)" }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {advantages.map((adv, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border transition-all duration-300 group hover:translate-y-[-2px] hover:shadow-lg"
              style={{ borderColor: "var(--lab-line)", background: "var(--lab-panel)" }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{ background: adv.bg }}
              >
                <adv.icon className="w-5 h-5" style={{ color: adv.color }} />
              </div>
              <h3 className="text-base font-black tracking-tight mb-2">{adv.title}</h3>
              <p className="text-sm leading-relaxed opacity-50 font-medium">{adv.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== SPORT-SPECIFIC ENGINES ===== */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1" style={{ background: "var(--lab-line)" }} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Sport-Specific Engines</span>
          <div className="h-px flex-1" style={{ background: "var(--lab-line)" }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sports.map((sport, i) => (
            <div
              key={i}
              className="relative p-5 rounded-2xl border transition-all duration-300 group hover:translate-y-[-2px] hover:shadow-lg overflow-hidden"
              style={{ borderColor: "var(--lab-line)", background: "var(--lab-panel)" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = sport.border; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--lab-line)"; }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ background: sport.bg }}
                >
                  <sport.icon className="w-5 h-5" style={{ color: sport.color }} />
                </div>
                <h3 className="text-lg font-black tracking-tight">{sport.name}</h3>
              </div>

              <ul className="space-y-2">
                {sport.metrics.map((metric, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm opacity-55 font-medium">
                    <Zap className="w-3 h-3 mt-1 flex-shrink-0" style={{ color: sport.color }} />
                    <span>{metric}</span>
                  </li>
                ))}
              </ul>

              <div
                className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(to right, ${sport.color}, transparent)` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ===== WHY PURPOSE-BUILT MATTERS ===== */}
      <div
        className="p-6 md:p-8 rounded-2xl border relative overflow-hidden"
        style={{ borderColor: "var(--lab-line)", background: "var(--lab-panel)" }}
      >
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(245,158,11,0.10)" }}
          >
            <AlertTriangle className="w-5 h-5" style={{ color: "#fbbf24" }} />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight mb-1">Why General-Purpose Tools Typically Fall Short</h3>
            <p className="text-sm opacity-50 font-medium">The gaps a purpose-built system is designed to close</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: "EV calculation is not native",
              desc: "General-purpose models may assess which team is favored, but typically require additional prompting and external tools to quantify whether the odds represent positive Expected Value.",
            },
            {
              title: "Training data has a cutoff",
              desc: "Language models are trained on historical snapshots. Today's injury report, this morning's lineup change, or the line movement from an hour ago typically require a separate retrieval step.",
            },
            {
              title: "Conversational optimization",
              desc: "General-purpose assistants are designed to be helpful in conversation. Sports analysis requires statistical objectivity — which sometimes means recommending inaction over action.",
            },
            {
              title: "Position sizing is external",
              desc: "Kelly criterion, unit sizing, drawdown limits, and CVaR constraints require a dedicated risk-management layer. These are typically outside the scope of a conversational interface.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="p-4 rounded-xl"
              style={{ background: "var(--lab-panel2)", border: "1px solid var(--lab-line)" }}
            >
              <h4 className="text-sm font-black mb-1.5" style={{ color: "#fbbf24" }}>{item.title}</h4>
              <p className="text-[13px] leading-relaxed opacity-45 font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== CAPABILITY COMPARISON (bottom) ===== */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1" style={{ background: "var(--lab-line)" }} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Capability Comparison</span>
          <div className="h-px flex-1" style={{ background: "var(--lab-line)" }} />
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--lab-line)", background: "var(--lab-panel)" }}>
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest opacity-40"
            style={{ borderBottom: "1px solid var(--lab-line)", background: "var(--lab-panel2)" }}>
            <div className="col-span-4">Capability</div>
            <div className="col-span-4 text-center">General-Purpose LLMs</div>
            <div className="col-span-4 text-center">PhD Betting</div>
          </div>

          {/* Table rows */}
          {comparison.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-4 px-5 py-4 items-start transition-colors hover:opacity-90"
              style={{ borderBottom: i < comparison.length - 1 ? "1px solid var(--lab-line)" : "none" }}
            >
              <div className="col-span-4">
                <p className="text-sm font-bold">{row.feature}</p>
              </div>
              <div className="col-span-4">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(148,163,184,0.08)" }}>
                    <MinusCircle className="w-3.5 h-3.5" style={{ color: "#94a3b8" }} />
                  </div>
                  <p className="text-[12px] opacity-45 leading-relaxed font-medium">{row.general}</p>
                </div>
              </div>
              <div className="col-span-4">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(16,185,129,0.08)" }}>
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#34d399" }} />
                  </div>
                  <p className="text-[12px] opacity-60 leading-relaxed font-medium">{row.phd}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== BOTTOM CTA ===== */}
      <div className="text-center space-y-4 pt-4 pb-8">
        <div className="flex items-center gap-3 justify-center">
          <div className="h-px w-16" style={{ background: "var(--lab-line)" }} />
          <Flame className="w-5 h-5" style={{ color: "#f97316" }} />
          <div className="h-px w-16" style={{ background: "var(--lab-line)" }} />
        </div>
        <p className="text-xl md:text-2xl font-black tracking-tight">
          From data to discipline.
        </p>
        <p className="text-sm opacity-40 font-medium max-w-lg mx-auto leading-relaxed">
          PhD Betting is designed to identify quantified edges — not predict winners.
          The difference between speculation and systematic investing is a process. This is that process.
        </p>
      </div>
    </div>
  );
});

export default SportEnginesTab;
