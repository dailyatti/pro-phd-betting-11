
import os

file_path = "d:\\minden adat a gépről\\Letöltések mappából\\phd betting\\frontend\\src\\pages\\HowItWorksPage.jsx"

# --- 1. NEW COMPONENT DEFINITIONS (CSS Variable Based) ---
# We replace CanonicalFormula and CopyButton to use semantic CSS classes instead of hardcoded colors.

new_components_block = r"""const CopyButton = ({ text, label }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      aria-label={label || "Copy LaTeX"}
      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${copied
        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
        : "bg-[var(--phd-btn-bg)] border-[var(--phd-btn-border)] text-[var(--phd-btn-text)] hover:border-[var(--phd-accent)] hover:text-[var(--phd-accent)]"
        }`}
    >
      {copied ? "COPIED" : "Copy LaTeX"}
    </button>
  );
};

const CanonicalFormula = ({ texKey, title, children }) => {
  const tex = LATEX_STORE[texKey] || "";
  return (
    <div className="card col-12 group">
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-black uppercase tracking-widest text-[var(--phd-accent)] m-0">{title}</h3>
        <CopyButton text={tex} />
      </div>
      <div className="relative p-4 rounded-xl border border-[var(--phd-line)] bg-[var(--phd-code-bg)] overflow-x-auto mb-3">
        <KatexRenderer tex={tex} displayMode={true} darkMode={true} />
      </div>
      {children && <div className="text-sm font-semibold text-[var(--phd-muted)] leading-relaxed border-l-2 border-[var(--phd-line)] pl-3">{children}</div>}
    </div>
  );
};"""

# --- 2. NEW MATH LAB BLOCK (With Light/Dark CSS Variables) ---
# We inject a full CSS system for light/dark modes.

new_math_lab_block = r"""          {activeTab === "math_lab" && (
            <div className={`phd-lab-theme min-h-screen p-6 rounded-[24px] text-left relative overflow-hidden transition-colors duration-500 ${safeDarkMode ? 'theme-dark' : 'theme-light'}`}>
              <style>{`
                .phd-lab-theme {
                  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
                  transition: background 0.5s ease, color 0.5s ease;
                }
                
                /* DARK MODE (Original Doctoral) */
                .phd-lab-theme.theme-dark {
                  --phd-bg: #0b1220;
                  --phd-text: #eaf0ff;
                  --phd-muted: #94a3b8;
                  --phd-card-bg: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
                  --phd-card-border: rgba(255,255,255,0.08);
                  --phd-line: rgba(255,255,255,0.08);
                  --phd-accent: #35c7ff;
                  --phd-code-bg: rgba(0,0,0,0.3);
                  --phd-btn-bg: rgba(255,255,255,0.05);
                  --phd-btn-border: rgba(255,255,255,0.1);
                  --phd-btn-text: #94a3b8;
                  
                  background: radial-gradient(1200px 600px at 20% -10%, rgba(53,199,255,0.1), transparent 60%),
                              radial-gradient(900px 500px at 90% 0%, rgba(106,123,255,0.1), transparent 55%),
                              var(--phd-bg);
                }

                /* LIGHT MODE (Academic Whitepaper) */
                .phd-lab-theme.theme-light {
                  --phd-bg: #f8fafc;
                  --phd-text: #0f172a;
                  --phd-muted: #475569;
                  --phd-card-bg: linear-gradient(180deg, #ffffff, #f1f5f9);
                  --phd-card-border: #cbd5e1;
                  --phd-line: #e2e8f0;
                  --phd-accent: #0369a1; /* Darker blue for contrast */
                  --phd-code-bg: #ffffff;
                  --phd-btn-bg: #ffffff;
                  --phd-btn-border: #cbd5e1;
                  --phd-btn-text: #64748b;
                  
                  background: radial-gradient(1200px 600px at 20% -10%, rgba(14, 165, 233, 0.05), transparent 60%),
                              radial-gradient(900px 500px at 90% 0%, rgba(99, 102, 241, 0.05), transparent 55%),
                              var(--phd-bg);
                }

                .phd-lab-theme h1 { color: var(--phd-text); font-size: clamp(24px, 3vw, 36px); font-weight: 900; letter-spacing: -0.02em; }
                .phd-lab-theme h2 { font-size: 20px; font-weight: 800; margin: 0; color: var(--phd-text); }
                .phd-lab-theme section { margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--phd-line); }
                .phd-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; }
                .col-12 { grid-column: span 12; }
                @media(min-width: 768px) { .col-6 { grid-column: span 6; } }
                
                .card { 
                  background: var(--phd-card-bg); 
                  border: 1px solid var(--phd-card-border); 
                  border-radius: 20px; 
                  padding: 20px; 
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); /* Gentle shadow for light mode depth */
                }
                
                /* Master Equation - Adaptive Gold */
                .master-eq-card {
                  position: relative;
                  overflow: hidden;
                }
                .theme-dark .master-eq-card {
                  background: linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(234, 179, 8, 0.05));
                  border: 1px solid rgba(253, 224, 71, 0.3);
                  box-shadow: 0 0 40px rgba(234, 179, 8, 0.1);
                }
                .theme-light .master-eq-card {
                  background: linear-gradient(135deg, #fefce8, #fef9c3);
                  border: 1px solid #facc15;
                  box-shadow: 0 10px 30px rgba(234, 179, 8, 0.15);
                }
                
                .master-eq-title { font-weight: 900; letter-spacing: 0.1em; }
                .theme-dark .master-eq-title { color: #facc15; text-shadow: 0 0 10px rgba(250, 204, 21, 0.3); }
                .theme-light .master-eq-title { color: #854d0e; }

                .theme-dark .master-eq-subtitle { color: rgba(234, 179, 8, 0.8); }
                .theme-light .master-eq-subtitle { color: #a16207; }

                /* Sports Cards - Adaptive Colors */
                .sport-card-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
                .sport-icon { font-size: 1.5rem; }
                .sport-title { font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
                
                /* Helper to force specific accent colors in light mode if needed, 
                   but generally relying on var(--phd-accent) is cleaner unless we want fruit-loop colors.
                   Let's keep the slight tinting but make it subtle for light mode. */
                .theme-light .sport-card-blue { background: #f0f9ff; border-color: #bae6fd; }
                .theme-light .sport-card-blue .sport-title { color: #0369a1; }
                
                .theme-light .sport-card-orange { background: #fff7ed; border-color: #fed7aa; }
                .theme-light .sport-card-orange .sport-title { color: #c2410c; }
                
                .theme-light .sport-card-purple { background: #faf5ff; border-color: #e9d5ff; }
                .theme-light .sport-card-purple .sport-title { color: #7e22ce; }
                
                .theme-light .sport-card-emerald { background: #ecfdf5; border-color: #a7f3d0; }
                .theme-light .sport-card-emerald .sport-title { color: #047857; }
                
                .theme-light .sport-card-teal { background: #f0fdfa; border-color: #99f6e4; }
                .theme-light .sport-card-teal .sport-title { color: #0f766e; }
                
                .theme-light .sport-card-red { background: #fef2f2; border-color: #fecaca; }
                .theme-light .sport-card-red .sport-title { color: #b91c1c; }

                /* Dark mode keeps V3 styles (via Tailwind classes in JSX or here) 
                   We will use class composition in JSX. */
              `}</style>

              <header className="mb-8 max-w-6xl mx-auto text-center">
                 <h1 className="mb-4 inline-block">
                    PhD Betting Research Lab
                 </h1>
                 <p className="text-[var(--phd-muted)] max-w-2xl mx-auto text-lg leading-relaxed">
                   Doctoral-grade mathematical framework for risk-neutral pricing, portfolio optimization, and tail-dependence modeling.
                 </p>
              </header>

              <main className="max-w-6xl mx-auto space-y-6">
                
                {/* MASTER EQUATION */}
                <div className="card master-eq-card col-12 mb-8">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <h2 className="master-eq-title text-xl mb-1">The Master Equation</h2>
                        <p className="master-eq-subtitle text-xs font-bold uppercase tracking-wider">Log-Growth (Kelly) − Tail Risk (CVaR) − Transaction Costs</p>
                     </div>
                     <CopyButton text={LATEX_STORE.M1} label="Copy Master Equation" />
                  </div>
                  <div className="p-6 rounded-xl border overflow-x-auto transition-colors
                    theme-dark:bg-black/40 theme-dark:border-yellow-500/20
                    theme-light:bg-white theme-light:border-yellow-500/50">
                    <KatexRenderer tex={LATEX_STORE.M1} displayMode={true} darkMode={true} />
                  </div>
                  <p className="mt-4 text-center text-sm italic font-medium max-w-3xl mx-auto opacity-80" style={{ color: 'var(--phd-muted)' }}>
                    "We do not maximize expected value. We maximize the expected logarithm of wealth, subject to survival constraints (CVaR) and friction costs."
                  </p>
                </div>

                {/* 0) Core Objects */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>0) Notation & Core Objects</h2>
                    <span className="text-xs font-bold uppercase text-[var(--phd-muted)] tracking-wider">Ω → Settlement Atoms</span>
                  </div>
                  <div className="phd-grid">
                    <CanonicalFormula texKey="Z0" title="Settlement-Atomic Space">
                      The foundational move is to separate the <b>world outcome space</b> (Ω) from the <b>settlement-atomic space</b> of the instrument.
                    </CanonicalFormula>
                  </div>
                </section>

                {/* A) Odds Invariance */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>A) Odds-format Invariance</h2>
                    <span className="text-xs font-bold uppercase text-[var(--phd-muted)] tracking-wider">All Formats → Net Odds ρ</span>
                  </div>
                  <div className="phd-grid">
                     <div className="col-12 md:col-6">
                        <CanonicalFormula texKey="A0" title="Canonical Payout">
                           Once mapped to ρ, every downstream object (EV, CVaR, etc.) is identical.
                        </CanonicalFormula>
                     </div>
                     <div className="col-12 md:col-6">
                        <CanonicalFormula texKey="A1" title="Conversion Table">
                           Conversion must be total and deterministic.
                        </CanonicalFormula>
                     </div>
                  </div>
                </section>

                {/* B) Settlement */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>B) Settlement Microstructure</h2>
                    <span className="text-xs font-bold uppercase text-[var(--phd-muted)] tracking-wider">Split-Bet Decomposition</span>
                  </div>
                  <div className="phd-grid">
                     <CanonicalFormula texKey="B0" title="General Payout Factor">
                        Universal formalism: Asian lines and partial refunds become convex mixtures of standard atoms.
                     </CanonicalFormula>
                  </div>
                </section>
                
                {/* C) Market Mechanics */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>C) Market Mechanics</h2>
                    <span className="text-xs font-bold uppercase text-[var(--phd-muted)] tracking-wider">Vig Removal → Prior Q</span>
                  </div>
                  <div className="phd-grid">
                     <CanonicalFormula texKey="C1" title="Implied Prior Construction">
                        Vig removal is a <b>chosen model</b> for constructing Q. Temperature stabilizes noisy markets.
                     </CanonicalFormula>
                  </div>
                </section>

                {/* D) Wealth Update */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>D) Wealth Update & Safety</h2>
                    <span className="text-xs font-bold uppercase text-[var(--phd-muted)] tracking-wider">Log-Domain Domain Condition</span>
                  </div>
                   <div className="phd-grid">
                     <CanonicalFormula texKey="D0" title="Portfolio Wealth Factor">
                        Constraint W+ &gt; ε is not "conservative" — it is a domain condition for log-utility.
                     </CanonicalFormula>
                  </div>
                </section>

                {/* E) Risk */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>E) Risk (CVaR Primal/Dual)</h2>
                    <span className="text-xs font-bold uppercase text-[var(--phd-muted)] tracking-wider">Tail Reweighting</span>
                  </div>
                  <div className="phd-grid">
                     <div className="col-12 md:col-6">
                       <CanonicalFormula texKey="E1" title="CVaR Primal (Scenario)">
                          Optimization-ready form via scenario approximation.
                       </CanonicalFormula>
                     </div>
                     <div className="col-12 md:col-6">
                       <CanonicalFormula texKey="E2" title="CVaR Dual Form">
                          Interprets CVaR as worst-case tail tilting under bounded density reweighting.
                       </CanonicalFormula>
                     </div>
                  </div>
                </section>

                {/* F) Calibration */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>F) Calibration / Training</h2>
                    <span className="text-xs font-bold uppercase text-[var(--phd-muted)] tracking-wider">NLL + KL-to-Market</span>
                  </div>
                   <div className="phd-grid">
                     <CanonicalFormula texKey="F1" title="Posterior Shrinkage">
                        Flooring Q ensures KL is always finite on discrete spaces.
                     </CanonicalFormula>
                  </div>
                </section>

                {/* G) Staking Doctrine */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>G) Staking Doctrine</h2>
                    <span className="text-xs font-bold uppercase text-[var(--phd-muted)] tracking-wider">Utility vs Cash Loss</span>
                  </div>
                   <div className="phd-grid">
                     <CanonicalFormula texKey="G1" title="Two Clean Choices">
                        Doctoral requirement: Declare a primary doctrine (Log-utility vs Cash-loss).
                     </CanonicalFormula>
                  </div>
                </section>

                {/* H) Dependence */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>H) Multi-Market Dependence</h2>
                    <span className="text-xs font-bold uppercase text-[var(--phd-muted)] tracking-wider">Tail Copulas</span>
                  </div>
                  <div className="phd-grid">
                     <div className="col-12 md:col-6">
                       <CanonicalFormula texKey="H1" title="Latent Factors + Copulas">
                          Latent factors are most defensible for discrete spaces.
                       </CanonicalFormula>
                     </div>
                     <div className="col-12 md:col-6">
                       <CanonicalFormula texKey="H2" title="Copula Menu">
                          Gaussian copulas have zero tail dependence; use Student-t or Clayton for crash correlation.
                       </CanonicalFormula>
                     </div>
                  </div>
                </section>

                {/* I) SPORTS EXPANSION GRID (Updated for Light Mode) */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                       <h2 className="text-[var(--phd-accent)]">I) Sport-Specific Generative Models</h2>
                       <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-[var(--phd-accent)] text-[var(--phd-accent)] opacity-80">ALL MAJOR SPORTS</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* SC: Soccer */}
                    <div className="card sport-card-blue transition-colors duration-300 theme-dark:border-blue-500/30 theme-dark:bg-blue-500/5">
                       <div className="sport-card-header">
                          <span className="sport-icon">⚽</span>
                          <h3 className="sport-title theme-dark:text-blue-300">Football (Soccer)</h3>
                       </div>
                       <div className="space-y-4">
                          <CanonicalFormula texKey="I1" title="Holistic Bivariate Poisson" />
                          <CanonicalFormula texKey="I2" title="DC Kernel Inflation" />
                       </div>
                    </div>

                    {/* SC: Basketball */}
                    <div className="card sport-card-orange transition-colors duration-300 theme-dark:border-orange-500/30 theme-dark:bg-orange-500/5">
                       <div className="sport-card-header">
                          <span className="sport-icon">🏀</span>
                          <h3 className="sport-title theme-dark:text-orange-300">NBA Basketball</h3>
                       </div>
                       <div className="space-y-4">
                          <CanonicalFormula texKey="I3" title="Ergodic Possession Integral" />
                          <CanonicalFormula texKey="I4" title="Ten-Factor Variance Scaling" />
                       </div>
                    </div>

                    {/* SC: Tennis */}
                    <div className="card sport-card-purple transition-colors duration-300 theme-dark:border-purple-500/30 theme-dark:bg-purple-500/5">
                       <div className="sport-card-header">
                          <span className="sport-icon">🎾</span>
                          <h3 className="sport-title theme-dark:text-purple-300">ATP/WTA Tennis</h3>
                       </div>
                       <div className="space-y-4">
                          <CanonicalFormula texKey="I5" title="Bellman Point-Process" />
                          <CanonicalFormula texKey="I6" title="Infinite Deuce Series" />
                       </div>
                    </div>

                    {/* SC: NFL */}
                    <div className="card sport-card-emerald transition-colors duration-300 theme-dark:border-emerald-500/30 theme-dark:bg-emerald-500/5">
                       <div className="sport-card-header">
                          <span className="sport-icon">🏈</span>
                          <h3 className="sport-title theme-dark:text-emerald-300">NFL Football</h3>
                       </div>
                       <div className="space-y-4">
                          <CanonicalFormula texKey="I7" title="Compound Characteristic Function" />
                          <CanonicalFormula texKey="I8" title="Down-Conversion Tensor" />
                       </div>
                    </div>

                    {/* SC: Hockey */}
                    <div className="card sport-card-teal transition-colors duration-300 theme-dark:border-teal-500/30 theme-dark:bg-teal-500/5">
                       <div className="sport-card-header">
                          <span className="sport-icon">🏒</span>
                          <h3 className="sport-title theme-dark:text-teal-300">NHL Hockey</h3>
                       </div>
                       <div className="space-y-4">
                          <CanonicalFormula texKey="I9" title="CIR Stochastic Intensity" />
                          <CanonicalFormula texKey="I10" title="Regime-Switching Volatility" />
                       </div>
                    </div>

                    {/* SC: Baseball */}
                    <div className="card sport-card-red transition-colors duration-300 theme-dark:border-red-500/30 theme-dark:bg-red-500/5">
                       <div className="sport-card-header">
                          <span className="sport-icon">⚾</span>
                          <h3 className="sport-title theme-dark:text-red-300">MLB Baseball</h3>
                       </div>
                       <div className="space-y-4">
                          <CanonicalFormula texKey="I11" title="Gamma-Poisson Mixture" />
                          <CanonicalFormula texKey="I12" title="Pythagorean Differential" />
                       </div>
                    </div>
                  </div>
                </section>
                
                {/* J) Advanced Theory */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>J) Upper-Tier Theory</h2>
                    <span className="text-xs font-bold uppercase text-[var(--phd-muted)] tracking-wider">PAC-Bayes & DV</span>
                  </div>
                   <div className="phd-grid">
                     <div className="col-12 md:col-6">
                       <CanonicalFormula texKey="J1" title="Donsker-Varadhan">
                          Explicit integrability condition tied to log-domain safety.
                       </CanonicalFormula>
                     </div>
                     <div className="col-12 md:col-6">
                       <CanonicalFormula texKey="J2" title="PAC-Bayes Bounded Loss">
                          Requires clipped log-loss or mgf condition for validity.
                       </CanonicalFormula>
                     </div>
                  </div>
                </section>

                <footer className="mt-16 pt-8 border-t border-[var(--phd-line)] text-center">
                  <p className="text-xs text-[var(--phd-muted)] font-bold uppercase tracking-widest">
                    Doctoral Note: This framework ensures the mathematical attack surface is explicitly closed.
                  </p>
                </footer>
              </main>
            </div>
          )}"""

# --- 3. EXECUTION ---
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# REPLACE COMPONENT DEFINITIONS
# Start looking for "const CopyButton ="
# End looking after CanonicalFormula definition close.
# Logic: Find "const CopyButton =", find "export default function".
# Everything in between is the definitions.
start_def_marker = "const CopyButton = ({ text, label }) => {"
start_def_idx = content.find(start_def_marker)

end_def_marker = "export default function HowItWorksPage"
end_def_idx = content.find(end_def_marker)

if start_def_idx != -1 and end_def_idx != -1:
    # Replace the block
    # We need to make sure we replace up to the line before export default
    content = content[:start_def_idx] + new_components_block + "\n\n" + content[end_def_idx:]
    print("Updated Component Definitions (CSS Variables).")
else:
    print("Error: Could not locate component definitions.")

# REPLACE MATH LAB BLOCK
# We use the standard approach to find the math_lab block.
lines = content.split('\n')
math_lab_start_index = -1
math_lab_end_index = -1

for i, line in enumerate(lines):
    if '{activeTab === "math_lab" && (' in line:
        math_lab_start_index = i
    
    if math_lab_start_index != -1 and i > math_lab_start_index:
         # Find closing )} logic.
         if line.strip() == ')}':
             math_lab_end_index = i
             break

if math_lab_start_index != -1 and math_lab_end_index != -1:
    final_lines = lines[:math_lab_start_index]
    final_lines.append(new_math_lab_block)
    final_lines.extend(lines[math_lab_end_index+1:])
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(final_lines))
    print("Updated Math Lab Block (Light Mode CSS).")
else:
    print("Error: Could not isolate math_lab block.")
