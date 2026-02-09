
import os

file_path = "d:\\minden adat a gépről\\Letöltések mappából\\phd betting\\frontend\\src\\pages\\HowItWorksPage.jsx"

# --- 1. FULL DOCTORAL UI BLOCK (Restoring V2 Depth + V3 Master/Sports) ---
full_doctoral_block = r"""          {activeTab === "math_lab" && (
            <div className="phd-lab-theme min-h-screen p-6 rounded-[24px] text-left relative overflow-hidden">
              <style>{`
                :root {
                  --phd-bg: #0b1220;
                  --phd-card: #0f1b31;
                  --phd-text: #eaf0ff;
                  --phd-muted: #a7b4d1;
                  --phd-line: rgba(255,255,255,0.08);
                  --phd-accent: #35c7ff;
                }
                .phd-lab-theme {
                  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
                  background: radial-gradient(1200px 600px at 20% -10%, rgba(53,199,255,0.1), transparent 60%),
                              radial-gradient(900px 500px at 90% 0%, rgba(106,123,255,0.1), transparent 55%),
                              var(--phd-bg);
                  color: var(--phd-text);
                }
                .phd-lab-theme h1 { font-size: clamp(24px, 3vw, 36px); font-weight: 900; letter-spacing: -0.02em; }
                .phd-lab-theme h2 { font-size: 20px; font-weight: 800; margin: 0; color: #fff; }
                .phd-lab-theme section { margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--phd-line); }
                .phd-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; }
                .col-12 { grid-column: span 12; }
                @media(min-width: 768px) { .col-6 { grid-column: span 6; } }
                .card { background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border: 1px solid var(--phd-line); border-radius: 20px; padding: 20px; }
                
                .master-eq-card {
                  background: linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(161, 98, 7, 0.05));
                  border: 1px solid rgba(234, 179, 8, 0.3);
                  box-shadow: 0 0 30px rgba(234, 179, 8, 0.05);
                  position: relative;
                }
                .master-eq-title { color: #facc15; text-shadow: 0 0 10px rgba(250, 204, 21, 0.3); }
              `}</style>

              <header className="mb-8 max-w-6xl mx-auto text-center">
                 <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 mb-4 inline-block">
                    PhD Betting Research Lab
                 </h1>
                 <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
                   Doctoral-grade mathematical framework for risk-neutral pricing, portfolio optimization, and tail-dependence modeling.
                 </p>
              </header>

              <main className="max-w-6xl mx-auto space-y-6">
                
                {/* MASTER EQUATION (V3 Feature) */}
                <div className="card master-eq-card col-12 mb-8">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <h2 className="master-eq-title text-xl font-black uppercase tracking-widest mb-1">The Master Equation</h2>
                        <p className="text-yellow-500/80 text-xs font-bold uppercase tracking-wider">Log-Growth (Kelly) − Tail Risk (CVaR) − Transaction Costs</p>
                     </div>
                     <CopyButton text={LATEX_STORE.M1} label="Copy Master Equation" />
                  </div>
                  <div className="p-6 rounded-xl bg-black/40 border border-yellow-500/20 overflow-x-auto">
                    <KatexRenderer tex={LATEX_STORE.M1} displayMode={true} darkMode={true} />
                  </div>
                  <p className="mt-4 text-center text-yellow-200/60 text-sm italic font-medium max-w-3xl mx-auto">
                    "We do not maximize expected value. We maximize the expected logarithm of wealth, subject to survival constraints (CVaR) and friction costs."
                  </p>
                </div>

                {/* 0) Core Objects (Restored V2) */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>0) Notation & Core Objects</h2>
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Ω → Settlement Atoms</span>
                  </div>
                  <div className="phd-grid">
                    <CanonicalFormula texKey="Z0" title="Settlement-Atomic Space">
                      The foundational move is to separate the <b>world outcome space</b> (Ω) from the <b>settlement-atomic space</b> of the instrument.
                    </CanonicalFormula>
                  </div>
                </section>

                {/* A) Odds Invariance (Restored V2) */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>A) Odds-format Invariance</h2>
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">All Formats → Net Odds ρ</span>
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

                {/* B) Settlement (Restored V2) */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>B) Settlement Microstructure</h2>
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Split-Bet Decomposition</span>
                  </div>
                  <div className="phd-grid">
                     <CanonicalFormula texKey="B0" title="General Payout Factor">
                        Universal formalism: Asian lines and partial refunds become convex mixtures of standard atoms.
                     </CanonicalFormula>
                  </div>
                </section>
                
                {/* C) Market Mechanics (Restored V2) */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>C) Market Mechanics</h2>
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Vig Removal → Prior Q</span>
                  </div>
                  <div className="phd-grid">
                     <CanonicalFormula texKey="C1" title="Implied Prior Construction">
                        Vig removal is a <b>chosen model</b> for constructing Q. Temperature stabilizes noisy markets.
                     </CanonicalFormula>
                  </div>
                </section>

                {/* D) Wealth Update (Restored V2) */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>D) Wealth Update & Safety</h2>
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Log-Domain Domain Condition</span>
                  </div>
                   <div className="phd-grid">
                     <CanonicalFormula texKey="D0" title="Portfolio Wealth Factor">
                        Constraint W+ &gt; ε is not "conservative" — it is a domain condition for log-utility.
                     </CanonicalFormula>
                  </div>
                </section>

                {/* E) Risk (Restored V2) */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>E) Risk (CVaR Primal/Dual)</h2>
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Tail Reweighting</span>
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

                {/* F) Calibration (Restored V2) */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>F) Calibration / Training</h2>
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">NLL + KL-to-Market</span>
                  </div>
                   <div className="phd-grid">
                     <CanonicalFormula texKey="F1" title="Posterior Shrinkage">
                        Flooring Q ensures KL is always finite on discrete spaces.
                     </CanonicalFormula>
                  </div>
                </section>

                {/* G) Staking Doctrine (Restored V2) */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>G) Staking Doctrine</h2>
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Utility vs Cash Loss</span>
                  </div>
                   <div className="phd-grid">
                     <CanonicalFormula texKey="G1" title="Two Clean Choices">
                        Doctoral requirement: Declare a primary doctrine (Log-utility vs Cash-loss).
                     </CanonicalFormula>
                  </div>
                </section>

                {/* H) Dependence (Restored V2) */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>H) Multi-Market Dependence</h2>
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Tail Copulas</span>
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

                {/* I) SPORTS EXPANSION GRID (V3 Feature - Full Detail) */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                       <h2 className="text-cyan-400">I) Sport-Specific Generative Models</h2>
                       <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">ALL MAJOR SPORTS</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Soccer */}
                    <div className="card border-blue-500/30 bg-blue-500/5">
                       <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl">⚽</span>
                          <h3 className="font-bold text-blue-300 uppercase tracking-wider">Football (Soccer)</h3>
                       </div>
                       <div className="space-y-4">
                          <CanonicalFormula texKey="I1" title="Bivariate Poisson Baseline" />
                          <CanonicalFormula texKey="I2" title="Dixon-Coles Low-Score Correction" />
                       </div>
                    </div>

                    {/* Basketball */}
                    <div className="card border-orange-500/30 bg-orange-500/5">
                       <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl">🏀</span>
                          <h3 className="font-bold text-orange-300 uppercase tracking-wider">NBA Basketball</h3>
                       </div>
                       <div className="space-y-4">
                          <CanonicalFormula texKey="I3" title="Possession-Efficiency Decomposition" />
                          <CanonicalFormula texKey="I4" title="Pace-Adjusted Variance Proxy" />
                       </div>
                    </div>

                    {/* Tennis */}
                    <div className="card border-purple-500/30 bg-purple-500/5">
                       <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl">🎾</span>
                          <h3 className="font-bold text-purple-300 uppercase tracking-wider">ATP/WTA Tennis</h3>
                       </div>
                       <div className="space-y-4">
                          <CanonicalFormula texKey="I5" title="Hierarchical Point-Game-Set Process" />
                          <CanonicalFormula texKey="I6" title="Surface-Specific ELO Logit" />
                       </div>
                    </div>

                    {/* NFL */}
                    <div className="card border-emerald-500/30 bg-emerald-500/5">
                       <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl">🏈</span>
                          <h3 className="font-bold text-emerald-300 uppercase tracking-wider">NFL Football</h3>
                       </div>
                       <div className="space-y-4">
                          <CanonicalFormula texKey="I7" title="Compound Drive Process (Multinomial)" />
                          <CanonicalFormula texKey="I8" title="Red Zone Efficiency Logit" />
                       </div>
                    </div>

                    {/* Hockey */}
                    <div className="card border-teal-500/30 bg-teal-500/5">
                       <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl">🏒</span>
                          <h3 className="font-bold text-teal-300 uppercase tracking-wider">NHL Hockey</h3>
                       </div>
                       <div className="space-y-4">
                          <CanonicalFormula texKey="I9" title="Poisson Intensity w/ GSAx" />
                          <CanonicalFormula texKey="I10" title="Empty Net Volatility Jump" />
                       </div>
                    </div>

                    {/* Baseball */}
                    <div className="card border-red-500/30 bg-red-500/5">
                       <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl">⚾</span>
                          <h3 className="font-bold text-red-300 uppercase tracking-wider">MLB Baseball</h3>
                       </div>
                       <div className="space-y-4">
                          <CanonicalFormula texKey="I11" title="Negative Binomial Runs (Overdispersion)" />
                          <CanonicalFormula texKey="I12" title="Pythagorean Expectation (Bill James)" />
                       </div>
                    </div>
                  </div>
                </section>
                
                {/* J) Advanced Theory (Restored V2) */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>J) Upper-Tier Theory</h2>
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">PAC-Bayes & DV</span>
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

                <footer className="mt-16 pt-8 border-t border-white/10 text-center">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                    Doctoral Note: This framework ensures the mathematical attack surface is explicitly closed.
                  </p>
                </footer>
              </main>
            </div>
          )}"""

# --- 2. REPLACE LOGIC ---
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n') 

final_lines = []
math_lab_start_index = -1
math_lab_end_index = -1

for i, line in enumerate(lines):
    # Find start of block
    if '{activeTab === "math_lab" && (' in line:
        math_lab_start_index = i
    
    # Find end of block 
    # Logic: If we found start, look for the closing )}
    # In V3 script we replaced it, so it should be clean.
    if math_lab_start_index != -1 and i > math_lab_start_index:
         if line.strip() == ')}':
             math_lab_end_index = i
             break

if math_lab_start_index != -1 and math_lab_end_index != -1:
    # Reconstruct
    final_lines = lines[:math_lab_start_index]
    final_lines.append(full_doctoral_block)
    final_lines.extend(lines[math_lab_end_index+1:])
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(final_lines))
    print("RESTORED Full Doctoral UI (V4) successfully.")
else:
    print("Error: Could not isolate math_lab block for restoration. Indices:", math_lab_start_index, math_lab_end_index)
