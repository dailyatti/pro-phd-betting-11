
import os

file_path = "d:\\minden adat a gépről\\Letöltések mappából\\phd betting\\frontend\\src\\pages\\HowItWorksPage.jsx"

# 1. Define the new content (transpiled JSX)
# Note: Using raw string `r` to help with backslashes, but JSX template literals use backticks.
# We will use triple quotes and be careful.
new_content = """          {activeTab === "math_lab" && (
            <div className="phd-lab-theme min-h-screen p-5 rounded-[20px] text-left">
              <style>{`
                :root {
                  --phd-bg: #0b1220;
                  --phd-card: #0f1b31;
                  --phd-text: #eaf0ff;
                  --phd-muted: #a7b4d1;
                  --phd-line: rgba(255,255,255,0.08);
                  --phd-accent: #35c7ff;
                  --phd-good: #34d399;
                  --phd-warn: #fbbf24;
                  --phd-bad: #fb7185;
                }
                .phd-lab-theme {
                  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
                  background:
                    radial-gradient(1200px 600px at 20% -10%, rgba(53,199,255,0.14), transparent 60%),
                    radial-gradient(900px 500px at 90% 0%, rgba(106,123,255,0.14), transparent 55%),
                    radial-gradient(800px 800px at 50% 120%, rgba(52,211,153,0.10), transparent 55%),
                    var(--phd-bg);
                  color: var(--phd-text);
                }
                .phd-lab-theme h1 { font-size: clamp(26px, 3vw, 38px); font-weight: 900; letter-spacing: -0.02em; margin: 0; }
                .phd-lab-theme h2 { font-size: 22px; font-weight: 900; letter-spacing: -0.01em; margin: 0; }
                .phd-lab-theme h3 { font-size: 14px; font-weight: 900; letter-spacing: 0.10em; text-transform: uppercase; color: rgba(53,199,255,0.92); margin: 0 0 10px; }
                .phd-lab-theme .subtitle { color: var(--phd-muted); margin-top: 10px; max-width: 980px; line-height: 1.55; font-weight: 600; }
                .phd-lab-theme .card { background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02)); border: 1px solid var(--phd-line); border-radius: 22px; padding: 18px; }
                .phd-lab-theme .math { background: rgba(0,0,0,0.22); border: 1px solid rgba(255,255,255,0.09); border-radius: 18px; padding: 14px; overflow-x: auto; }
                .phd-lab-theme .badge { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; padding: 6px 10px; border-radius: 999px; border: 1px solid var(--phd-line); background: rgba(255,255,255,0.04); color: var(--phd-muted); }
                .phd-lab-theme .desc { color: var(--phd-muted); font-weight: 600; line-height: 1.62; margin-top: 10px; font-size: 14px; }
                .phd-lab-theme .gitem { border: 1px solid var(--phd-line); background: rgba(255,255,255,0.03); border-radius: 16px; padding: 12px; display: flex; gap: 12px; align-items: flex-start; }
                .phd-lab-theme .gsym { font-family: ui-serif, Georgia, serif; font-style: italic; font-weight: 900; color: var(--phd-accent); min-width: 74px; }
                .phd-lab-theme section { margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--phd-line); }
                /* Grid helpers */
                .phd-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 14px; }
                .col-12 { grid-column: span 12; }
                @media (min-width: 900px) { .col-6 { grid-column: span 6; } .col-4 { grid-column: span 4; } }
              `}</style>

              <header className="mb-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h1>PhD Betting Research Lab — Formulas & Explanations</h1>
                  <div className="flex flex-wrap gap-2">
                    {["Doctoral microstructure", "Reviewer-proof math", "Implementable risk + staking"].map(pill => (
                      <span key={pill} className="px-3 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-black uppercase tracking-widest text-slate-400">
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="subtitle">
                  This page is a doctoral-grade “math layer” for a betting system: odds → vig removal → market prior →
                  posterior calibration → staking (log-growth + tail risk) → multi-market portfolio under correlation and distribution shift.
                  Every object is defined on a consistent atomic outcome space.
                </p>
              </header>

              <main>
                {/* 0) Glossary */}
                <section id="glossary">
                  <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
                    <h2>0) Notation (Glossary)</h2>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Fully consistent objects = minimal attack surface</div>
                  </div>
                  <div className="card col-12">
                    <div className="desc mb-4">
                      Everything (priors, posteriors, KL, risk, expected utility) is defined on the same <em>atomic outcome space</em>.
                    </div>
                    <div className="phd-grid gap-3">
                      {[
                        { sym: "x", def: "Feature vector (form, injuries, pace, matchup, context)." },
                        { sym: "y", def: "Realized atomic outcome (mutually exclusive)." },
                        { sym: "\\\\mathcal{Y}", def: "Atomic outcome space (e.g., 1X2, spread cover)." },
                        { sym: "o_y", def: "Decimal odds associated with atomic outcome y." },
                        { sym: "\\\\pi_y", def: "Vig-removed implied probability for atomic outcome y." },
                        { sym: "Q(\\\\cdot|o)", def: "Market-implied prior distribution on Y." },
                        { sym: "P_{\\\\theta}(\\\\cdot|x)", def: "Model predictive posterior distribution on Y." },
                        { sym: "g(y,o)", def: "Payout multiplier mapping. Net return is g(y,o)-1." },
                        { sym: "s", def: "Stake vector: fraction of bankroll allocated to each outcome." },
                        { sym: "W_+(y)", def: "Wealth update factor after settlement under outcome y." },
                        { sym: "\\\\mathrm{CVaR}_\\\\alpha", def: "Tail-risk at level alpha (expected loss in worst cases)." }
                      ].map((item, i) => (
                        <div key={i} className="gitem col-12 md:col-6">
                           <div className="gsym"><KatexRenderer tex={item.sym} displayMode={false} darkMode={true}/></div>
                           <div className="text-sm font-medium text-slate-400 leading-snug">{item.def}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* A) Market Mechanics */}
                <section id="market">
                  <div className="flex items-end justify-between gap-4 mb-4">
                    <h2>A) Market Mechanics</h2>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Odds → Implied Prob → Prior</div>
                  </div>
                  <div className="phd-grid">
                    <div className="card col-12 md:col-6">
                      <div className="flex justify-between items-center mb-2">
                        <h3>A1. Vig Removal</h3>
                        <CopyButton latex="\\\\pi_y^{\\\\mathrm{raw}}=\\\\frac{1}{o_y},\\\\qquad \\\\pi_y=\\\\frac{\\\\pi_y^{\\\\mathrm{raw}}}{\\\\sum \\\\pi^{\\\\mathrm{raw}}}" />
                      </div>
                      <div className="math">
                        <KatexRenderer tex="\\\\pi_y^{\\\\mathrm{raw}}=\\\\frac{1}{o_y},\\\\qquad \\\\pi_y=\\\\frac{\\\\pi_y^{\\\\mathrm{raw}}}{\\\\sum_{y'\\\\in\\\\mathcal{Y}}\\\\pi_{y'}^{\\\\mathrm{raw}}},\\\\qquad \\\\sum \\\\pi_y=1" displayMode={true} darkMode={true} />
                      </div>
                      <div className="desc">Normalizes odds to sum to 1.</div>
                    </div>

                    <div className="card col-12 md:col-6">
                      <div className="flex justify-between items-center mb-2">
                         <h3>A2. Payout Mapping</h3>
                         <CopyButton latex="g(y,o)=\\\\begin{cases} o & y=\\\\mathrm{win} \\\\\\\\ 1 & y=\\\\mathrm{push} \\\\\\\\ 0 & y=\\\\mathrm{lose} \\\\end{cases}" />
                      </div>
                      <div className="math">
                        <KatexRenderer tex="g(y,o)=\\\\begin{cases} o, & y=\\\\mathrm{win} \\\\\\\\ 1, & y=\\\\mathrm{push} \\\\\\\\ 0, & y=\\\\mathrm{lose} \\\\end{cases}" displayMode={true} darkMode={true} />
                      </div>
                      <div className="desc">Handles void/push correctly in the atomic space.</div>
                    </div>
                    
                    <div className="card col-12">
                       <div className="flex justify-between items-center mb-2">
                         <h3>A3. Wealth Update (The "Doctoral" Fix)</h3>
                         <CopyButton latex="W_+(y)=1-\\\\mathbf{1}^\\\\top s + s_y g(y,o)" />
                       </div>
                       <div className="math">
                         <KatexRenderer tex="W_+(y)=1-\\\\mathbf{1}^\\\\top s + s_y\\\\,g(y,o),\\\\qquad \\\\log\\\\text{-growth}=\\\\log W_+(y)" displayMode={true} darkMode={true} />
                       </div>
                       <div className="desc">Forces correct accounting for log-growth and constraints.</div>
                    </div>
                  </div>
                </section>

                {/* B) Risk */}
                <section id="risk">
                   <div className="flex items-end justify-between gap-4 mb-4">
                    <h2>B) Risk & Constraints</h2>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">CVaR + Feasible Set</div>
                  </div>
                  <div className="phd-grid">
                    <div className="card col-12 md:col-6">
                      <div className="flex justify-between items-center mb-2">
                        <h3>B1. CVaR (Rockafellar–Uryasev)</h3>
                        <CopyButton latex="\\\\mathrm{CVaR}_\\\\alpha(L)=\\\\min_{\\\\eta} \\\\left\\\\{ \\\\eta + \\\\frac{1}{1-\\\\alpha}\\\\mathbb{E}[(L-\\\\eta)_+] \\\\right\\\\}" />
                      </div>
                      <div className="math">
                        <KatexRenderer tex="\\\\mathrm{CVaR}_\\\\alpha(L)=\\\\min_{\\\\eta\\\\in\\\\mathbb{R}} \\\\left\\\\{ \\\\eta + \\\\frac{1}{1-\\\\alpha}\\\\mathbb{E}[(L-\\\\eta)_+] \\\\right\\\\}" displayMode={true} darkMode={true} />
                      </div>
                    </div>
                    <div className="card col-12 md:col-6">
                      <div className="flex justify-between items-center mb-2">
                        <h3>B3. Feasible Set</h3>
                        <CopyButton latex="\\\\mathcal{S}=\\\\{ s\\\\ge 0 : \\\\mathbf{1}^\\\\top s \\\\le s_{\\\\max} \\\\}" />
                      </div>
                      <div className="math">
                        <KatexRenderer tex="\\\\mathcal{S}=\\\\left\\\\{ s\\\\in\\\\mathbb{R}_+^{|\\\\mathcal{Y}|} : \\\\mathbf{1}^\\\\top s\\\\le s_{\\\\max},\\\\ s_y \\\\le s_{\\\\mathrm{cap}} \\\\right\\\\}" displayMode={true} darkMode={true} />
                      </div>
                    </div>
                  </div>
                </section>

                {/* D) Stake Optimization */}
                <section id="staking">
                   <div className="flex items-end justify-between gap-4 mb-4">
                    <h2>D) Stake Optimization</h2>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Log-Growth + CVaR + Friction</div>
                  </div>
                  <div className="card col-12">
                     <div className="flex justify-between items-center mb-2">
                       <h3>D1. Doctoral Staking Objective</h3>
                       <CopyButton latex="s^*(x)=\\\\arg\\\\max_{s\\\\in\\\\mathcal{S}} \\\\mathbb{E}[\\\\log W_+(y)] - \\\\gamma \\\\mathrm{CVaR}(L_s) - c\\\\|s\\\\|_1" />
                     </div>
                     <div className="math">
                        <KatexRenderer tex="s^*(x)=\\\\arg\\\\max_{s\\\\in\\\\mathcal{S}} \\\\Bigg\\\\{ \\\\mathbb{E}_{y\\\\sim P_{\\\\theta^*}}\\\\big[\\\\log W_+(y)\\\\big] - \\\\gamma\\\\,\\\\mathrm{CVaR}_{\\\\alpha}\\\\big(-\\\\log W_+(y)\\\\big) - c\\\\,\\\\lVert s\\\\rVert_1 \\\\Bigg\\\\}" displayMode={true} darkMode={true} />
                     </div>
                     <div className="desc">
                        Maximizes expected log-wealth (Kelly) while explicitly penalizing tail risk (CVaR) and transaction/operational friction (L1).
                     </div>
                  </div>
                </section>

                 {/* E) Reviewer Shield */}
                <section id="reviewershield">
                   <div className="flex items-end justify-between gap-4 mb-4">
                    <h2>E) Reviewer Shield</h2>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Log-Domain Safety</div>
                  </div>
                  <div className="phd-grid">
                    <div className="card col-12 md:col-6">
                       <div className="flex justify-between items-center mb-2">
                         <h3>E1. Deterministic Safety</h3>
                         <CopyButton latex="W_+(y) \\\\ge \\\\varepsilon \\\\quad \\\\forall y" />
                       </div>
                       <div className="math">
                          <KatexRenderer tex="W_+(y)=1-\\\\mathbf{1}^\\\\top s + s_y g(y,o) \\\\ge \\\\varepsilon \\\\quad \\\\forall y\\\\in\\\\mathcal{Y}" displayMode={true} darkMode={true} />
                       </div>
                       <div className="desc">Prevents log(<=0) blowups mathematically.</div>
                    </div>
                     <div className="card col-12 md:col-6">
                       <div className="flex justify-between items-center mb-2">
                         <h3>E2. Chance Constraint</h3>
                         <CopyButton latex="\\\\mathbb{P}(W_+(y) \\\\ge \\\\varepsilon) \\\\ge 1-\\\\delta" />
                       </div>
                       <div className="math">
                          <KatexRenderer tex="\\\\mathbb{P}_{y\\\\sim P}\\\\big(W_+(y)\\\\ge \\\\varepsilon\\\\big) \\\\ge 1-\\\\delta" displayMode={true} darkMode={true} />
                       </div>
                       <div className="desc">High-probability safety barrier (less conservative).</div>
                    </div>
                  </div>
                </section>
                
                 {/* G) Sport Models */}
                <section id="sports">
                  <div className="flex items-end justify-between gap-4 mb-4">
                    <h2>G) Sport Models (Doctoral Upgrades)</h2>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Microstructure & Correlation</div>
                  </div>
                  <div className="phd-grid">
                     {/* Soccer */}
                     <div className="card col-12 md:col-6">
                        <h3>Soccer: Bivariate Poisson</h3>
                        <div className="math mt-2">
                           <KatexRenderer tex="\\\\mathbb{P}(G_H=i, G_A=j) = e^{-(\\\\lambda_1+\\\\lambda_2+\\\\lambda_3)} \\\\sum_{k=0}^{\\\\min(i,j)} \\\\frac{\\\\lambda_1^{i-k}}{(i-k)!}\\\\frac{\\\\lambda_2^{j-k}}{(j-k)!}\\\\frac{\\\\lambda_3^k}{k!}" displayMode={true} darkMode={true} />
                        </div>
                        <div className="desc">Replaces ad-hoc Dixon-Coles with principled covariance (lambda 3).</div>
                     </div>
                     
                     {/* Basketball */}
                     <div className="card col-12 md:col-6">
                        <h3>Basketball: Possession Microstructure</h3>
                        <div className="math mt-2">
                           <KatexRenderer tex="D=\\\\sum_{t=1}^{N} (R_{H,t}-R_{A,t}), \\\\quad R_t \\\\in \\\\{0,1,2,3,4\\\\}" displayMode={true} darkMode={true} />
                        </div>
                        <div className="desc">Models game as a sequence of possessions/drives rather than just final score.</div>
                     </div>

                     {/* NFL */}
                     <div className="card col-12 md:col-6">
                        <h3>NFL: Hidden Drive Quality (HMM)</h3>
                         <div className="math mt-2">
                           <KatexRenderer tex="\\\\mathrm{Pts}=\\\\sum_{d=1}^{N_D} Z_d, \\\\quad Z_d|H_d \\\\sim B_{H_d}(\\\\cdot)" displayMode={true} darkMode={true} />
                        </div>
                        <div className="desc">Hidden Markov Model for drive momentum and scoring efficiency.</div>
                     </div>
                     
                     {/* Hockey */}
                     <div className="card col-12 md:col-6">
                        <h3>Hockey: Shot Process</h3>
                         <div className="math mt-2">
                           <KatexRenderer tex="G = \\\\sum_{i=1}^{N(T)} \\\\mathrm{Bernoulli}(\\\\sigma(\\\\theta^\\\\top \\\\phi_i))" displayMode={true} darkMode={true} />
                        </div>
                        <div className="desc">Goals modeled as thinned shot process (xG-consistent).</div>
                     </div>
                  </div>
                </section>
                
                <footer className="mt-12 pt-8 border-t border-white/10 text-slate-500 text-xs text-center font-bold">
                   Note: This is a doctoral-grade “whitepaper UI”. Correctness here is mathematical/structural.
                </footer>
            </div>
          )}"""

# 2. Append the CopyButton component definition
copy_button_component = """
const CopyButton = ({ latex, label }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
        copied 
          ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
          : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-cyan-400"
      }`}
    >
      {copied ? "COPIED" : "Copy LaTeX"}
    </button>
  );
};
"""

# 3. Read and modify the file
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Be very precise with indices.
# lines[555] is `{activeTab === "math_lab" && (` (0-based index)
# lines[740] is `)}`
# We want to replace line 555 to 740 inclusive with new_content.
start_idx = 555
end_idx = 741 # Python slice is exclusive at end, so 741 includes 740.

# Check context
print(f"Replacing lines {start_idx} to {end_idx}")
# Split new_content into lines
new_lines = [line + '\n' for line in new_content.split('\n')]

output_lines = lines[:start_idx] + new_lines + lines[end_idx:]

# Append component to end of file, before the last line or just at the end?
# If I append it at the end, it's outside the component, which is fine for usage within the file.
# But `export default function HowItWorksPage` is usually at the bottom.
# I need to insert it BEFORE `export default function`.
# Let's find "export default function HowItWorksPage"
insert_pos = -1
for i, line in enumerate(output_lines):
    if "export default function HowItWorksPage" in line:
        insert_pos = i
        break

if insert_pos != -1:
    # Insert before
    output_lines = output_lines[:insert_pos] + [copy_button_component] + output_lines[insert_pos:]
else:
    # Append
    output_lines.append(copy_button_component)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(output_lines)
