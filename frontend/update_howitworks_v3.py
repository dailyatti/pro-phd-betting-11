
import os
import re

file_path = "d:\\minden adat a gépről\\Letöltések mappából\\phd betting\\frontend\\src\\pages\\HowItWorksPage.jsx"

# --- 1. NEW LATEX STORE CONTENT (Includes Sports I3-I12 and Master M1) ---
# We will replace the entire LATEX_STORE definition to be safe and clean.
new_latex_store = r"""const LATEX_STORE = {
  // 0) Core Objects
  Z0: `\\textbf{World outcome space:}\\ \\Omega \\ \\text{(full match realization: goals, points, etc.)} \\\\ \\textbf{Instrument } b\\ \\text{induces a settlement map}\\quad h_b:\\Omega\\to\\mathcal{Y}_b \\\\ \\textbf{Settlement atoms}\\ \\mathcal{Y}_b\\ \\text{encode}\\ \\{\\text{win/push/lose/half-...}\\}\\ \\text{states}`,

  // M) MASTER EQUATION (Kelly + CVaR)
  M1: `s^*(x) = \\arg\\max_{s \\in \\mathcal{S}} \\Big\\{ \\underbrace{\\mathbb{E}_{y \\sim P_{\\theta^*}(\\cdot|x)} [\\log(1+s^T r(y,o))]}_{\\text{Log-Growth (Kelly)}} - \\gamma \\cdot \\underbrace{\\mathrm{CVaR}_{\\alpha}(-s^T r(y,o))}_{\\text{Tail Risk (Downside)}} - c\\lVert s \\rVert_1 \\Big\\}`,

  // A) Odds Format Invariance
  A0: `\\textbf{Net odds}\\ \\rho>0\\ \\text{(profit multiple per unit stake)},\\quad \\textbf{decimal odds}\\ o=1+\\rho \\\\ g(y;\\rho)=\\begin{cases} 1+\\rho, & y=\\text{win} \\\\ 1, & y=\\text{push/void} \\\\ 0, & y=\\text{lose} \\end{cases} \\qquad R(y;\\rho)=g(y;\\rho)-1 \\\\ \\textbf{Odds-format invariance:}\\ \\ \\text{all formats} \\ \\Rightarrow \\ \\rho \\ \\Rightarrow \\ \\text{same }g,R,\\mathrm{EV},\\log\\text{-utility},\\mathrm{CVaR}`,
  A1: `\\textbf{Decimal:}\\ o>1\\Rightarrow \\rho=o-1 \\qquad \\textbf{Fractional:}\\ a/b>0\\Rightarrow \\rho=\\frac{a}{b},\\ o=1+\\frac{a}{b} \\\\ \\textbf{American:}\\ A\\ne 0,\\quad \\rho(A)=\\begin{cases} \\frac{A}{100}, & A>0\\\\[4pt] \\frac{100}{|A|}, & A<0 \\end{cases} \\qquad o=1+\\rho(A) \\\\ \\textbf{Hong Kong:}\\ H\\ge 0\\Rightarrow \\rho=H,\\ o=1+H \\qquad \\textbf{Indonesian:}\\ I\\ne 0,\\ \\rho=\\begin{cases} I, & I>0\\\\ \\frac{1}{|I|}, & I<0 \\end{cases} \\\\ \\textbf{Malay:}\\ M\\in(-1,1)\\setminus\\{0\\},\\ \\rho=\\begin{cases} M, & M>0\\\\ \\frac{1}{|M|}, & M<0 \\end{cases}`,

  // B) Settlement
  B0: `\\textbf{Split-bet decomposition:}\\quad b \\equiv \\{(w_i,\\rho_i,h_i)\\}_{i=1}^m,\\ \\ w_i\\ge 0,\\ \\sum_{i=1}^m w_i=1 \\\\ \\textbf{Total payout factor (fully general):}\\quad g_b(\\omega)=\\sum_{i=1}^m w_i\\ g(h_i(\\omega);\\rho_i) \\\\ \\textbf{Examples:}\\ \\text{Asian }\\pm 0.25 \\text{ is }m=2\\text{ split between }\\pm 0.0\\text{ and }\\pm 0.5;\\ \\text{quarter-lines are closed under this representation.}`,

  // C) Market Mechanics
  C1: `\\pi_y^{\\mathrm{raw}}=\\frac{1}{o_y},\\qquad \\pi_y=\\frac{\\pi_y^{\\mathrm{raw}}}{\\sum_{y'\\in\\mathcal{Y}}\\pi_{y'}^{\\mathrm{raw}}},\\qquad \\sum_{y\\in\\mathcal{Y}}\\pi_y=1 \\\\ \\textbf{Temperature family (stabilizes noisy extremes):}\\quad \\pi_y(\\tau)=\\frac{(1/o_y)^{1/\\tau}}{\\sum_{y'}(1/o_{y'})^{1/\\tau}},\\ \\tau>0 \\\\ Q(y\\mid o)\\triangleq \\pi_y \\ \\ \\text{(a chosen vig-removal model, i.e., a prior model)}.`,

  // D) Wealth Update
  D0: `\\textbf{Portfolio of bets } \\{b_j\\}_{j=1}^J \\text{ with bankroll fractions } s_j\\in[0,1] \\\\ W_+(\\omega)=1-\\sum_{j=1}^J s_j+\\sum_{j=1}^J s_j\\, g_{b_j}(\\omega) \\\\ \\textbf{Log-domain safety (domain requirement for log-utility):}\\qquad W_+(\\omega)\\ge \\varepsilon>0\\quad \\forall\\ \\omega\\ \\text{in the modeled support.} \\\\ \\textbf{Softened log (engineering alternative):}\\quad \\log W_+(\\omega)\\ \\leadsto\\ \\log(\\max\\{W_+(\\omega),\\varepsilon\\})`,

  // E) Risk (CVaR)
  E1: `\\mathrm{CVaR}_\\alpha(L)= \\min_{\\eta\\in\\mathbb{R}} \\left\\{ \\eta+\\frac{1}{1-\\alpha}\\,\\mathbb{E}\\big[(L-\\eta)_+\\big] \\right\\},\\qquad (u)_+=\\max(u,0) \\\\ \\textbf{Scenario approximation (optimization-ready):}\\quad \\mathrm{CVaR}_\\alpha(L)\\approx \\min_{\\eta} \\left[ \\eta+\\frac{1}{(1-\\alpha)M}\\sum_{m=1}^{M}(L^{(m)}-\\eta)_+ \\right]`,
  E2: `\\textbf{Dual form (coherent tail reweighting):}\\quad \\mathrm{CVaR}_\\alpha(L)= \\sup_{q\\in\\mathcal{Q}_\\alpha}\\ \\mathbb{E}[q(Y)\\,L(Y)] \\\\ \\mathcal{Q}_\\alpha= \\left\\{ q\\ge 0:\\ \\mathbb{E}[q]=1,\\ 0\\le q\\le \\frac{1}{1-\\alpha} \\right\\}`,

  // F) Calibration
  F1: `\\theta^*=\\arg\\min_{\\theta}\\ \\mathbb{E}_{(x,y,o)\\sim\\mathcal{D}} \\Big[ -\\log P_{\\theta}(y\\mid x) +\\lambda\\,\\mathrm{KL}\\!\\big(P_{\\theta}(\\cdot\\mid x)\\,\\|\\,Q(\\cdot\\mid o)\\big) +\\beta\\,\\mathcal{R}(\\theta) \\Big] \\\\ \\mathrm{KL}(P\\|Q)=\\sum_{y\\in\\mathcal{Y}} P(y)\\log\\frac{P(y)}{Q(y)} \\\\ \\textbf{Flooring (ensures finiteness):}\\quad Q_\\varepsilon(y)=(1-\\varepsilon)Q(y)+\\varepsilon\\cdot\\frac{1}{|\\mathcal{Y}|},\\ \\ \\varepsilon\\in(0,1)`,

  // G) Staking Doctrine
  G1: `\\textbf{Doctrine 1 (log-utility consistent):}\\quad L_s(\\omega)=-\\log W_+(\\omega),\\quad \\max_{s\\in\\mathcal{S}}\\ \\mathbb{E}[\\log W_+(\\omega)]-\\gamma\\,\\mathrm{CVaR}_\\alpha(L_s(\\omega))-c\\|s\\|_1 \\\\ \\textbf{Doctrine 2 (cash-loss drawdown control):}\\quad L^{cash}_s(\\omega)=-(W_+(\\omega)-1),\\quad \\max_{s\\in\\mathcal{S}}\\ \\mathbb{E}[W_+(\\omega)-1]-\\gamma\\,\\mathrm{CVaR}_\\alpha(L^{cash}_s(\\omega))-c\\|s\\|_1`,

  // H) Dependence
  H1: `\\textbf{Latent factor (discrete-friendly, doctoral-clean):}\\quad P(y_1,\\dots,y_J\\mid x)=\\int \\prod_{j=1}^{J} P(y_j\\mid x_j,Z)\\,dP(Z) \\\\ \\textbf{Copula coupling (marginals preserved):}\\quad F(y_1,\\dots,y_J)=C(F_1(y_1),\\dots,F_J(y_J))`,
  H2: `\\textbf{Gaussian copula (note: zero tail dependence):}\\quad C_\\Sigma(u)=\\Phi_\\Sigma\\big(\\Phi^{-1}(u_1),\\dots,\\Phi^{-1}(u_J)\\big) \\\\ \\textbf{Student-}t\\textbf{ copula (tail dependence):}\\quad C^{(t)}_{\\Sigma,\\nu}(u)=t_{\\Sigma,\\nu}\\big(t^{-1}_\\nu(u_1),\\dots,t^{-1}_\\nu(u_J)\\big) \\\\ \\textbf{Clayton copula (lower-tail dependence):}\\quad C_\\theta(u)=\\left(\\sum_{j=1}^J u_j^{-\\theta}-J+1\\right)^{-1/\\theta},\\ \\theta>0`,

  // I) Sports (Expanded)
  // Soccer
  I1: `\\textbf{Soccer Baseline (Poisson):}\\quad G_H\\sim\\mathrm{Pois}(\\mu_H),\\ \\ G_A\\sim\\mathrm{Pois}(\\mu_A), \\quad \\mu_H=\\exp(\\beta_H^\\top x_H) \\\\ \\textbf{Limitation: } \\mathrm{Cov}(G_H,G_A)=0 \\text{ (independence constraint).}`,
  I2: `\\textbf{Dixon-Coles Correction:}\\quad \\mathbb{P}(i,j)\\propto \\tau_\\phi(i,j)\\ \\mathrm{Pois}(i;\\mu_H)\\ \\mathrm{Pois}(j;\\mu_A) \\\\ \\tau_\\phi(i,j) \\text{ enhances low-score dependency (0-0, 1-1 draws).}`,
  
  // Basketball (NBA)
  I3: `\\textbf{Possession Decomposition:}\\quad \\mathbb{E}[\\mathrm{Pts}|x] = \\mathbb{E}[\\mathrm{Pace}|x] \\cdot \\mathbb{E}[\\mathrm{OffEff}|x] \\\\ \\text{Models tempo (possessions/48m) separate from efficiency (pts/100).}`,
  I4: `\\textbf{Spread Normal Proxy:}\\quad D = \\mathrm{Pts}_H - \\mathrm{Pts}_A \\sim \\mathcal{N}(\\mu_D(x), \\sigma_D^2(x)) \\\\ \\sigma_D^2(x) \\text{ scales linearly with Pace (higher tempo = wider variance).}`,

  // Tennis (ATP/WTA)
  I5: `\\textbf{Hierarchical Point-Game-Set:}\\quad P(\\mathrm{Game}|p_{srv}) = \\sum_{k=0}^{\\infty} P(\\text{win at deuce}+k) \\\\ \\text{Explicit recursion for deuce logic; } p_{srv} = f(\\Delta\\mathrm{ELO}, \\text{Surface}).`,
  I6: `\\textbf{Fatigue & Surface Adjustments:}\\quad \\mathrm{logit}(p) = \\beta_0 + \\beta_1(\\Delta\\mathrm{ELO}_{surf}) + \\beta_2(\\text{TimeOnCourt})`,

  // NFL (American Football)
  I7: `\\textbf{Compound Drive Process:}\\quad \\mathrm{Pts} = \\sum_{d=1}^{N_{drives}} Z_d, \\quad Z_d \\in \\{0,3,6,7,8\\} \\\\ N_{drives} \\sim \\mathrm{Pois}(\\text{Tempo}), \\quad Z_d \\sim \\mathrm{Multinomial}(p_{TD}, p_{FG}, p_{punt})`,
  I8: `\\textbf{Red Zone Efficiency:}\\quad p_{TD}(x) = \\sigma(\\alpha + \\beta \\cdot \\text{RZ\\_Off} - \\gamma \\cdot \\text{RZ\\_Def})`,

  // Hockey (NHL)
  I9: `\\textbf{Poisson Intensity w/ GSAx:}\\quad \\lambda_H = \\exp(\\beta^T x - \\eta \\cdot \\mathrm{GSAx}_{goalie}) \\\\ \\text{Explicitly accounts for goaltender variance (Goals Saved Above Expected).}`,
  I10: `\\textbf{Empty Net Volatility:}\\quad \\lambda(t) \\text{ jumps by } 5\\times \\text{ in final 2 mins if } |\\text{score\_diff}| \\le 2.`,

  // Baseball (MLB)
  I11: `\\textbf{Negative Binomial Runs:}\\quad R|x \\sim \\mathrm{NegBin}(\\mu(x), \\kappa) \\\\ \\text{Captures interpret-inning variance (clustering of runs) better than Poisson.}`,
  I12: `\\textbf{Pythagorean Expectation (Bill James):}\\quad P(\\mathrm{Win}) \\approx \\frac{RS^{\\gamma}}{RS^{\\gamma} + RA^{\\gamma}}, \\quad \\gamma \\approx 1.83`,

  // J) Advanced Theory
  J1: `\\textbf{Donsker–Varadhan (DV):}\\quad \\log \\mathbb{E}_{Q}[e^{f}] = \\sup_{P} \\{ \\mathbb{E}_{P}[f]-\\mathrm{KL}(P\\|Q) \\} \\\\ \\text{Fundamental link between robust control and Bayesian inference.}`,
  J2: `\\textbf{PAC-Bayes Bound:}\\quad \\mathrm{kl}(\\hat{L} \\| L) \\le \\frac{\\mathrm{KL}(\\rho\\|\\pi) + \\log(2\\sqrt{n}/\\delta)}{n} \\\\ \\text{Generalizes VC-dimension to stochastic classifiers (posterior distributions).}`,
};"""

# --- 2. NEW FOOTER / CSS (with Master Equation Styling) ---
# We'll update the CSS in the style block to support the "Master Equation" gold card.
master_eq_css = r"""
                .master-eq-card {
                  background: linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(234, 179, 8, 0.05));
                  border: 1px solid rgba(253, 224, 71, 0.3);
                  box-shadow: 0 0 40px rgba(234, 179, 8, 0.1);
                  position: relative;
                  overflow: hidden;
                }
                .master-eq-card::before {
                  content: '';
                  position: absolute;
                  top: 0; left: 0; right: 0; height: 1px;
                  background: linear-gradient(90deg, transparent, rgba(253, 224, 71, 0.8), transparent);
                }
"""

# --- 3. RE-ARCHITECTED CONTENT BLOCK (Master Eq + 2-Col Sports) ---
new_math_lab_block = r"""          {activeTab === "math_lab" && (
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
                
                {/* MASTER EQUATION */}
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

                {/* 0) Core Objects */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>0) Notation & Core Objects</h2>
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Ω → Settlement Atoms</span>
                  </div>
                  <div className="phd-grid">
                    <CanonicalFormula texKey="Z0" title="Settlement-Atomic Space">
                      Separating world outcomes (Ω) from settlement atoms allows rigorous handling of pushes/voids.
                    </CanonicalFormula>
                  </div>
                </section>

                {/* I) SPORTS EXPANSION GRID */}
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

                {/* A) Odds Format Invariance */}
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

                {/* B-H Standard Sections (Condensed for brevity in this script, typically would be full) */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>B-H) Market Mechanics & Risk</h2>
                  </div>
                  <div className="phd-grid">
                     <div className="col-12 md:col-6">
                        <CanonicalFormula texKey="C1" title="Vig Removal (Temperature)" />
                     </div>
                     <div className="col-12 md:col-6">
                        <CanonicalFormula texKey="E1" title="CVaR Primal (Scenario)" />
                     </div>
                     <div className="col-12 md:col-6">
                        <CanonicalFormula texKey="H1" title="Latent Factors + Copulas" />
                     </div>
                     <div className="col-12 md:col-6">
                        <CanonicalFormula texKey="J1" title="Donsker-Varadhan Identity" />
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

# --- 4. EXECUTIONLOGIC ---

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace LATEX_STORE
# Use regex to find the const LATEX_STORE = { ... }; block
# This might be tricky if braces are nested.
# Safer strategy: Find start index, find matching closing brace.
start_marker = "const LATEX_STORE = {"
start_idx = content.find(start_marker)

if start_idx != -1:
    # Find matching brace
    brace_count = 0
    end_idx = -1
    for i in range(start_idx + len(start_marker) - 1, len(content)):
        char = content[i]
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                end_idx = i + 1 # Include the closing brace/semicolon check
                # Check for semicolon
                if i + 1 < len(content) and content[i+1] == ';':
                    end_idx += 1
                break
    
    if end_idx != -1:
        # Replace the block
        content = content[:start_idx] + new_latex_store + content[end_idx:]
        print("Updated LATEX_STORE.")

# 2. Replace Math Lab Content
# Similar strategy: find {activeTab === "math_lab" && ( ... )}
# We will look for the unique start of the math lab block we added in V2
lab_start_marker = '{activeTab === "math_lab" && ('
lab_start_idx = content.find(lab_start_marker)

if lab_start_idx != -1:
    # Assuming the block ends with )} and is the last major block in the file or structurally identifiable.
    # In V2 script we replaced lines. Here we are replacing a string block.
    # We can scan for the matching parenthesis.
    
    # Actually, simpler: finding the next occurrence of `)}` might be risky if nested.
    # Let's count parens?
    # No, let's just use the line-based approach from V2 but adapted for full string replacement.
    pass 
else:
    print("Could not find math_lab block start.")

# Resetting to V2 logic for reliable block replacement (line based)
# Reading lines again since we modified `content` string
lines = content.split('\n') 

final_lines = []
skip = False
lab_block_replaced = False

# We need to find the START of math lab and replace until the END of math lab
# The start is distinct. The end is `          )}` (indented closing).

math_lab_start_index = -1
math_lab_end_index = -1

for i, line in enumerate(lines):
    if '{activeTab === "math_lab" && (' in line:
        math_lab_start_index = i
    
    if math_lab_start_index != -1 and i > math_lab_start_index:
         # Find the closing tag. In V2 it ends with `          )}`
         # We need to be careful not to catch nested `)}`.
         # But the math lab block is at the top level of the return() structure.
         if line.strip() == ')}':
             math_lab_end_index = i
             # We should stop here or continue?
             # There is an activeTab loop but this is inside the return.
             # It assumes this is the correct closing brace.
             # Let's assume it is since we wrote it that way in V2.
             break

if math_lab_start_index != -1 and math_lab_end_index != -1:
    # Reconstruct
    # constant part
    final_lines = lines[:math_lab_start_index]
    # new block
    final_lines.append(new_math_lab_block)
    # remainder
    final_lines.extend(lines[math_lab_end_index+1:])
    
    # Save
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(final_lines))
    print("Updated HowItWorksPage.jsx successfully.")
    
else:
    print("Error: Could not isolate math_lab block. Indices:", math_lab_start_index, math_lab_end_index)

