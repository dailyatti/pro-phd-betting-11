
import os

file_path = "d:\\minden adat a gépről\\Letöltések mappából\\phd betting\\frontend\\src\\pages\\HowItWorksPage.jsx"

new_content = """            <div className="phd-lab-theme text-left min-h-screen p-5 rounded-[20px]">
              <style>{`
                .phd-lab-theme {
                  --bg:#0b1220;
                  --card:#0f1b31;
                  --card2:#0c162a;
                  --text:#eaf0ff;
                  --muted:#a7b4d1;
                  --muted2:#7f8db0;
                  --line:rgba(255,255,255,0.08);
                  --accent:#35c7ff;
                  --accent2:#6a7bff;
                  --good:#34d399;
                  --warn:#fbbf24;
                  --bad:#fb7185;
                  --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                  --sans: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
                  --serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
                }

                .phd-lab-theme {
                  font-family: var(--sans);
                  background:
                    radial-gradient(1200px 600px at 20% -10%, rgba(53,199,255,0.14), transparent 60%),
                    radial-gradient(900px 500px at 90% 0%, rgba(106,123,255,0.14), transparent 55%),
                    radial-gradient(800px 800px at 50% 120%, rgba(52,211,153,0.10), transparent 55%),
                    var(--bg);
                  color: var(--text);
                }

                .phd-lab-theme header {
                  max-width: 1200px;
                  margin: 0 auto;
                  padding: 36px 18px 22px;
                }

                .phd-lab-theme .title {
                  display:flex;
                  align-items:center;
                  justify-content:space-between;
                  gap:12px;
                  flex-wrap:wrap;
                }

                .phd-lab-theme h1 {
                  font-size: clamp(26px, 3vw, 38px);
                  letter-spacing: -0.02em;
                  margin:0;
                  font-weight: 900;
                  color: var(--text);
                }

                .phd-lab-theme .subtitle {
                  color: var(--muted);
                  margin-top: 10px;
                  max-width: 920px;
                  line-height:1.55;
                  font-weight: 600;
                }

                .phd-lab-theme .pillbar {
                  display:flex;
                  gap:10px;
                  flex-wrap:wrap;
                  margin-top: 16px;
                }
                .phd-lab-theme .pill {
                  font-size: 12px;
                  font-weight: 900;
                  letter-spacing: 0.12em;
                  text-transform: uppercase;
                  padding: 10px 12px;
                  border-radius: 999px;
                  border: 1px solid var(--line);
                  background: rgba(255,255,255,0.04);
                  color: var(--muted);
                  white-space: nowrap;
                }
                .phd-lab-theme .pill b { color: var(--text); }

                .phd-lab-theme main {
                  max-width: 1200px;
                  margin: 0 auto;
                  padding: 0 18px 80px;
                }

                .phd-lab-theme .toc {
                  margin-top: 18px;
                  border: 1px solid var(--line);
                  background: rgba(255,255,255,0.03);
                  border-radius: 18px;
                  padding: 18px;
                }
                .phd-lab-theme .toc h2 {
                  margin:0 0 10px;
                  font-size: 13px;
                  letter-spacing: 0.14em;
                  text-transform: uppercase;
                  opacity: 0.9;
                  color: var(--text);
                }
                .phd-lab-theme .toc a {
                  color: var(--text);
                  text-decoration: none;
                  opacity: 0.9;
                  font-weight: 700;
                }
                .phd-lab-theme .toc a:hover { color: var(--accent); }
                .phd-lab-theme .toc ul { margin: 10px 0 0; padding-left: 18px; color: var(--muted); }
                .phd-lab-theme .toc li { margin: 6px 0; }

                .phd-lab-theme section {
                  margin-top: 22px;
                  padding-top: 18px;
                  border-top: 1px solid var(--line);
                }

                .phd-lab-theme .section-title {
                  display:flex;
                  align-items:flex-end;
                  justify-content:space-between;
                  gap:14px;
                  flex-wrap:wrap;
                  margin-bottom: 14px;
                }

                .phd-lab-theme h2 {
                  margin:0;
                  font-size: 22px;
                  font-weight: 900;
                  letter-spacing: -0.01em;
                  color: var(--text);
                }

                .phd-lab-theme .note {
                  color: var(--muted);
                  font-weight: 700;
                  font-size: 12px;
                  letter-spacing: 0.06em;
                  text-transform: uppercase;
                }

                .phd-lab-theme .grid-custom {
                  display:grid;
                  grid-template-columns: repeat(12, 1fr);
                  gap: 14px;
                }

                .phd-lab-theme .card {
                  grid-column: span 12;
                  border: 1px solid var(--line);
                  background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02));
                  border-radius: 22px;
                  padding: 18px;
                }

                @media (min-width: 900px){
                  .phd-lab-theme .card.half { grid-column: span 6; }
                  .phd-lab-theme .card.third { grid-column: span 4; }
                }

                .phd-lab-theme .card h3 {
                  margin: 0 0 10px;
                  font-size: 14px;
                  font-weight: 900;
                  letter-spacing: 0.10em;
                  text-transform: uppercase;
                  color: rgba(53,199,255,0.9);
                }

                .phd-lab-theme .desc {
                  color: var(--muted);
                  font-weight: 650;
                  line-height: 1.62;
                  margin-top: 10px;
                  font-size: 14px;
                }

                .phd-lab-theme .math {
                  border-radius: 18px;
                  border: 1px solid rgba(255,255,255,0.09);
                  background: rgba(0,0,0,0.22);
                  padding: 14px;
                  overflow-x:auto;
                  color: var(--text);
                }

                .phd-lab-theme .row {
                  display:flex;
                  align-items:center;
                  justify-content:space-between;
                  gap:12px;
                  flex-wrap:wrap;
                  margin-bottom: 8px;
                }

                .phd-lab-theme .badge {
                  font-family: var(--mono);
                  font-size: 12px;
                  padding: 6px 10px;
                  border-radius: 999px;
                  border: 1px solid var(--line);
                  background: rgba(255,255,255,0.04);
                  color: var(--muted);
                }

                .phd-lab-theme button.copy {
                  cursor:pointer;
                  border:1px solid var(--line);
                  background: rgba(255,255,255,0.04);
                  color: var(--text);
                  font-weight: 900;
                  padding: 8px 10px;
                  border-radius: 12px;
                  font-size: 12px;
                  letter-spacing: 0.08em;
                  text-transform: uppercase;
                }
                .phd-lab-theme button.copy:hover { border-color: rgba(53,199,255,0.35); color: var(--accent); }
                .phd-lab-theme button.copy:active { transform: translateY(1px); }

                .phd-lab-theme .warnbox {
                  border: 1px dashed rgba(251,191,36,0.35);
                  background: rgba(251,191,36,0.06);
                  border-radius: 18px;
                  padding: 14px;
                  margin-top: 12px;
                  color: rgba(255,255,255,0.92);
                }
                .phd-lab-theme .warnbox b { color: var(--warn); }

                .phd-lab-theme .goodbox {
                  border: 1px dashed rgba(52,211,153,0.35);
                  background: rgba(52,211,153,0.06);
                  border-radius: 18px;
                  padding: 14px;
                  margin-top: 12px;
                  color: rgba(255,255,255,0.92);
                }
                .phd-lab-theme .goodbox b { color: var(--good); }

                .phd-lab-theme .glossary {
                  display:grid;
                  grid-template-columns: repeat(12, 1fr);
                  gap: 10px;
                  margin-top: 10px;
                }
                .phd-lab-theme .gitem {
                  grid-column: span 12;
                  border: 1px solid var(--line);
                  background: rgba(255,255,255,0.03);
                  border-radius: 16px;
                  padding: 12px;
                  display:flex;
                  gap:12px;
                  align-items:flex-start;
                }
                @media (min-width: 900px){
                  .phd-lab-theme .gitem { grid-column: span 6; }
                }
                .phd-lab-theme .gsym {
                  font-family: var(--serif);
                  font-style: italic;
                  font-weight: 900;
                  color: var(--accent);
                  min-width: 64px;
                }
                .phd-lab-theme .gdef {
                  color: var(--muted);
                  font-weight: 650;
                  line-height:1.5;
                  font-size: 13px;
                }

                .phd-lab-theme footer {
                  max-width: 1200px;
                  margin: 0 auto;
                  padding: 22px 18px 80px;
                  color: var(--muted2);
                  font-weight: 700;
                  border-top: 1px solid var(--line);
                }

                .phd-lab-theme .small {
                  font-size: 12px;
                  line-height: 1.55;
                }
              `}</style>
              
              <header>
                <div className="title">
                  <h1>PhD Betting Research Lab — Formulas & Explanations</h1>
                  <div className="pillbar">
                    <span className="pill"><b>KaTeX</b> render</span>
                    <span className="pill"><b>Reviewer-proof</b> structure</span>
                    <span className="pill"><b>Robust</b> + advanced</span>
                  </div>
                </div>

                <p className="subtitle">
                  This page collects the full “core” math layer of a betting pipeline (vig removal → market prior → calibration → stake optimization),
                  plus sport-specific models and higher-tier (rarely shown, university-level) robustness and risk-theory extensions.
                  Each formula comes with implementation-friendly explanations.
                </p>

                <div className="toc">
                  <h2>Contents</h2>
                  <ul>
                    <li><a href="#glossary">0) Notation (Glossary)</a></li>
                    <li><a href="#market">A) Market mechanics: Vig removal, return, prior</a></li>
                    <li><a href="#risk">B) Risk: CVaR + feasible set</a></li>
                    <li><a href="#calibration">C) 0A Calibration / training objective (NLL + KL + R)</a></li>
                    <li><a href="#staking">D) 0B Stake optimization (Kelly + CVaR + L1)</a></li>
                    <li><a href="#reviewershield">E) Reviewer Shield: log-domain safety (recommended fix)</a></li>
                    <li><a href="#multimarket">F) Multi-market portfolio (joint optimization)</a></li>
                    <li><a href="#sports">G) Sport models: Soccer, Basketball, Tennis, NFL, Hockey, Baseball</a></li>
                    <li><a href="#advanced">H) Upper-tier extensions (Kusuoka, Wasserstein-DRO, DV, PAC-Bayes, HJB...)</a></li>
                  </ul>
                </div>
              </header>

              <main>
                {/* 0) Glossary */}
                <section id="glossary">
                  <div className="section-title">
                    <h2>0) Notation (Glossary)</h2>
                    <div className="note">Consistent notation = fewer attack surfaces</div>
                  </div>

                  <div className="card">
                    <div className="desc">
                      The symbols below mean the same thing everywhere on this page. The goal is to define both the market prior and the model posterior
                      on the same <em>atomic outcome</em> space, so every KL / EV / risk term is well-defined.
                    </div>

                    <div className="glossary">
                      {[
                        { sym: "x", def: "Feature vector (form, injuries, pace, matchup, context)." },
                        { sym: "y", def: "Realized outcome (atomic outcome; mutually exclusive)." },
                        { sym: "\\\\mathcal{Y}", def: "Atomic outcome space (e.g., 1X2: home/draw/away; spread: cover/push/no-cover, etc.)." },
                        { sym: "o_k", def: "Decimal odds for atomic outcome y_k." },
                        { sym: "\\\\pi_k", def: "Vig-removed implied probability for atomic outcome y_k (overround removed)." },
                        { sym: "Q(\\\\cdot\\\\mid o)", def: "Market-implied prior over atomic outcomes (computed from odds via π)." },
                        { sym: "P_{\\\\theta}(\\\\cdot\\\\mid x)", def: "Model predictive posterior distribution over atomic outcomes." },
                        { sym: "\\\\theta, \\\\theta^*", def: "θ: parameters; θ*: parameters after training + calibration." },
                        { sym: "r(y,o)\\\\in\\\\mathbb{R}^K", def: "Return vector: component k is the net return for “1 unit stake” on atomic outcome k." },
                        { sym: "s\\\\in\\\\mathbb{R}_+^K", def: "Stake vector (fraction of bankroll allocated to each atomic outcome)." },
                        { sym: "\\\\mathrm{KL}", def: "Kullback–Leibler divergence (calibration / regularization toward the market prior)." },
                        { sym: "\\\\mathrm{CVaR}_\\\\alpha", def: "Tail-risk control at level α (expected loss in the worst (1-α) tail)." }
                      ].map((gf, i) => (
                        <div key={i} className="gitem">
                          <div className="gsym"><KatexRenderer tex={gf.sym} displayMode={false} darkMode={true} /></div>
                          <div className="gdef">{gf.def}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* A) Market mechanics */}
                <section id="market">
                  <div className="section-title">
                    <h2>A) Market Mechanics (Vig removal, Return, Prior)</h2>
                    <div className="note">Odds → implied prob → prior</div>
                  </div>

                  <div className="grid-custom">
                    <div className="card half">
                      <div className="row">
                        <h3>A1. Vig Removal (Overround Normalization)</h3>
                        <span className="badge">Atomic outcomes: k=1..K</span>
                        <button className="copy" onClick={() => copyToClipboard("\\\\pi_k^{\\\\mathrm{raw}}=\\\\frac{1}{o_k},\\\\qquad\\\\pi_k=\\\\frac{\\\\pi_k^{\\\\mathrm{raw}}}{\\\\sum_{j=1}^{K}\\\\pi_j^{\\\\mathrm{raw}}},\\\\qquad\\\\sum_{k=1}^{K}\\\\pi_k=1")}>Copy LaTeX</button>
                      </div>
                      <div className="math">
                        <KatexRenderer tex="\\\\pi_k^{\\\\mathrm{raw}}=\\\\frac{1}{o_k},\\\\qquad\\\\pi_k=\\\\frac{\\\\pi_k^{\\\\mathrm{raw}}}{\\\\sum_{j=1}^{K}\\\\pi_j^{\\\\mathrm{raw}}},\\\\qquad\\\\sum_{k=1}^{K}\\\\pi_k=1" displayMode={true} darkMode={true} />
                      </div>
                      <div className="desc">
                        <b>What it does:</b> Convert decimal odds <KatexRenderer tex="o_k" displayMode={false} /> into implied probabilities, then remove bookmaker overround by renormalizing.
                        The result <KatexRenderer tex="\\\\pi_k" displayMode={false} /> is a proper distribution that sums to 1.
                      </div>
                    </div>

                    <div className="card half">
                      <div className="row">
                        <h3>A2. Net Return (1 unit stake, decimal odds)</h3>
                        <span className="badge">Return definition</span>
                        <button className="copy" onClick={() => copyToClipboard("r_k(y,o)=\\\\begin{cases}o_k-1, & \\\\text{if } y=y_k\\\\\\\\-1, & \\\\text{if } y\\\\neq y_k\\\\end{cases}")}>Copy LaTeX</button>
                      </div>
                      <div className="math">
                        <KatexRenderer tex="r_k(y,o)=\\\\begin{cases}o_k-1, & \\\\text{if } y=y_k\\\\\\\\-1, & \\\\text{if } y\\\\neq y_k\\\\end{cases}" displayMode={true} darkMode={true} />
                      </div>
                      <div className="desc">
                        <b>Meaning:</b> If you stake 1 unit on atomic outcome k, the net profit is <KatexRenderer tex="o_k-1" displayMode={false} /> on a win and -1 on a loss.
                      </div>
                    </div>

                    <div className="card">
                      <div className="row">
                        <h3>A3. Market-Implied Prior on the Atomic Outcome Space</h3>
                        <span className="badge">Prior compatibility</span>
                        <button className="copy" onClick={() => copyToClipboard("Q(y_k\\\\mid o)=\\\\pi_k,\\\\qquad y_k\\\\in\\\\mathcal{Y},\\\\qquad \\\\sum_{k=1}^{K}Q(y_k\\\\mid o)=1")}>Copy LaTeX</button>
                      </div>
                      <div className="math">
                        <KatexRenderer tex="Q(y_k\\\\mid o)=\\\\pi_k,\\\\qquad y_k\\\\in\\\\mathcal{Y},\\\\qquad \\\\sum_{k=1}^{K}Q(y_k\\\\mid o)=1" displayMode={true} darkMode={true} />
                      </div>
                      <div className="desc">
                        <b>Key idea:</b> Define the market prior Q on the same <KatexRenderer tex="\\\\mathcal{Y}" displayMode={false} /> space as the model posterior.
                        Then <KatexRenderer tex="\\\\mathrm{KL}(P_\\\\theta(\\\\cdot|x)\\\\|Q(\\\\cdot|o))" displayMode={false} /> is unambiguous and “apples-to-apples”.
                      </div>
                    </div>
                  </div>
                </section>

                {/* B) Risk & Feasible set */}
                <section id="risk">
                  <div className="section-title">
                    <h2>B) Risk & Constraints (CVaR + Feasible Set)</h2>
                    <div className="note">Tail risk + realistic bankroll guardrails</div>
                  </div>

                  <div className="grid-custom">
                    <div className="card half">
                      <div className="row">
                        <h3>B1. CVaR Definition (Rockafellar–Uryasev)</h3>
                        <span className="badge">Convex risk</span>
                        <button className="copy" onClick={() => copyToClipboard("\\\\mathrm{CVaR}_\\\\alpha(L)=\\\\min_{\\\\eta\\\\in\\\\mathbb{R}}\\\\left\\\\{\\\\eta+\\\\frac{1}{1-\\\\alpha}\\\\,\\\\mathbb{E}\\\\big[(L-\\\\eta)_+\\\\big]\\\\right\\\\},\\\\qquad (u)_+=\\\\max(u,0)")}>Copy LaTeX</button>
                      </div>
                      <div className="math">
                        <KatexRenderer tex="\\\\mathrm{CVaR}_\\\\alpha(L)=\\\\min_{\\\\eta\\\\in\\\\mathbb{R}}\\\\left\\\\{\\\\eta+\\\\frac{1}{1-\\\\alpha}\\\\,\\\\mathbb{E}\\\\big[(L-\\\\eta)_+\\\\big]\\\\right\\\\},\\\\qquad (u)_+=\\\\max(u,0)" displayMode={true} darkMode={true} />
                      </div>
                      <div className="desc">
                        <b>What it does:</b> <KatexRenderer tex="\\\\mathrm{CVaR}_\\\\alpha" displayMode={false} /> controls average loss in the worst (1-α) tail.
                        This form is <b>convex</b>, so it’s optimization-friendly (especially via scenario approximations).
                      </div>
                    </div>

                    <div className="card half">
                      <div className="row">
                        <h3>B2. Feasible Set (bankroll safety + caps)</h3>
                        <span className="badge">Stakes: s >= 0</span>
                        <button className="copy" onClick={() => copyToClipboard("\\\\mathcal{S}=\\\\left\\\\{s\\\\in\\\\mathbb{R}_+^{K}:\\\\ \\\\mathbf{1}^\\\\top s\\\\le s_{\\\\max},\\\\ 0\\\\le s_k\\\\le s_{\\\\mathrm{cap}}\\\\ \\\\forall k,\\\\ 1-\\\\mathbf{1}^\\\\top s \\\\ge \\\\varepsilon\\\\right\\\\}")}>Copy LaTeX</button>
                      </div>
                      <div className="math">
                        <KatexRenderer tex="\\\\mathcal{S}=\\\\left\\\\{s\\\\in\\\\mathbb{R}_+^{K}:\\\\ \\\\mathbf{1}^\\\\top s\\\\le s_{\\\\max},\\\\ 0\\\\le s_k\\\\le s_{\\\\mathrm{cap}}\\\\ \\\\forall k,\\\\ 1-\\\\mathbf{1}^\\\\top s \\\\ge \\\\varepsilon\\\\right\\\\}" displayMode={true} darkMode={true} />
                      </div>
                      <div className="desc">
                        <b>Why it’s needed:</b> Betting needs “real world” constraints: Nonnegativity, Portfolio cap, Per-outcome cap, Cash buffer.
                      </div>
                    </div>
                  </div>
                </section>

                {/* C) Calibration */}
                <section id="calibration">
                  <div className="section-title">
                    <h2>C) 0A — Posterior Calibration (NLL + KL-to-market + Regularization)</h2>
                    <div className="note">KL belongs in training (correct placement)</div>
                  </div>

                  <div className="card">
                    <div className="row">
                      <h3>C1. Training / calibration objective</h3>
                      <span className="badge"><KatexRenderer tex="\\\\theta^*" displayMode={false} /> = calibrated model</span>
                      <button className="copy" onClick={() => copyToClipboard("\\\\theta^*=\\\\arg\\\\min_{\\\\theta}\\\\ \\\\mathbb{E}_{(x,y,o)\\\\sim\\\\mathcal{D}}\\\\Big[-\\\\log P_{\\\\theta}(y\\\\mid x)+\\\\lambda\\\\,\\\\mathrm{KL}\\\\!\\\\big(P_{\\\\theta}(\\\\cdot\\\\mid x)\\\\,\\\\|\\\\,Q(\\\\cdot\\\\mid o)\\\\big)+\\\\beta\\\\,\\\\mathcal{R}(\\\\theta)\\\\Big]")}>Copy LaTeX</button>
                    </div>
                    <div className="math">
                      <KatexRenderer tex="\\\\theta^*=\\\\arg\\\\min_{\\\\theta}\\\\ \\\\mathbb{E}_{(x,y,o)\\\\sim\\\\mathcal{D}}\\\\Big[-\\\\log P_{\\\\theta}(y\\\\mid x)+\\\\lambda\\\\,\\\\mathrm{KL}\\\\!\\\\big(P_{\\\\theta}(\\\\cdot\\\\mid x)\\\\,\\\\|\\\\,Q(\\\\cdot\\\\mid o)\\\\big)+\\\\beta\\\\,\\\\mathcal{R}(\\\\theta)\\\\Big]" displayMode={true} darkMode={true} />
                    </div>
                    <div className="desc">
                      <b>What this is:</b> A defensible calibration objective including NLL, KL-to-market penalization, and regularization.
                    </div>
                  </div>
                </section>

                {/* D) Staking */}
                <section id="staking">
                  <div className="section-title">
                    <h2>D) 0B — Stake Optimization (Kelly + CVaR + Friction)</h2>
                    <div className="note">Only stake-dependent terms (correct)</div>
                  </div>

                  <div className="card">
                    <div className="row">
                      <h3>D1. Staking objective over <KatexRenderer tex="\\\\mathcal{S}" displayMode={false} /></h3>
                      <span className="badge">Kelly + tail risk + L1</span>
                      <button className="copy" onClick={() => copyToClipboard("s^*(x)=\\\\arg\\\\max_{s\\\\in\\\\mathcal{S}}\\\\Bigg\\\\{\\\\mathbb{E}_{y\\\\sim P_{\\\\theta^*}(\\\\cdot\\\\mid x)}\\\\Big[\\\\log\\\\!\\\\big(1+s^\\\\top r(y,o)\\\\big)\\\\Big]-\\\\gamma\\\\,\\\\mathrm{CVaR}_{\\\\alpha}\\\\!\\\\big(-s^\\\\top r(y,o)\\\\big)-c\\\\,\\\\lVert s\\\\rVert_{1}\\\\Bigg\\\\}")}>Copy LaTeX</button>
                    </div>
                    <div className="math">
                      <KatexRenderer tex="s^*(x)=\\\\arg\\\\max_{s\\\\in\\\\mathcal{S}}\\\\Bigg\\\\{\\\\mathbb{E}_{y\\\\sim P_{\\\\theta^*}(\\\\cdot\\\\mid x)}\\\\Big[\\\\log\\\\!\\\\big(1+s^\\\\top r(y,o)\\\\big)\\\\Big]-\\\\gamma\\\\,\\\\mathrm{CVaR}_{\\\\alpha}\\\\!\\\\big(-s^\\\\top r(y,o)\\\\big)-c\\\\,\\\\lVert s\\\\rVert_{1}\\\\Bigg\\\\}" displayMode={true} darkMode={true} />
                    </div>
                    <div className="desc">
                      <b>Three layers at once:</b> Kelly (log-growth), CVaR (tail risk), L1 friction (transaction costs).
                    </div>
                  </div>
                </section>
                
                 {/* E) Reviewer Shield */}
                <section id="reviewershield">
                  <div className="section-title">
                    <h2>E) Reviewer Shield — Log-domain Safety (recommended)</h2>
                    <div className="note">This closes the most common critique</div>
                  </div>

                  <div className="grid-custom">
                    <div className="card half">
                      <div className="row">
                        <h3>E1. Deterministic log-domain constraint (worst-case)</h3>
                        <span className="badge">Guarantees log() is defined</span>
                        <button className="copy" onClick={() => copyToClipboard("1+s^\\\\top r(y,o)\\\\ \\\\ge\\\\ \\\\varepsilon\\\\qquad \\\\forall y\\\\in\\\\mathcal{Y}")}>Copy LaTeX</button>
                      </div>
                      <div className="math">
                        <KatexRenderer tex="1+s^\\\\top r(y,o)\\\\ \\\\ge\\\\ \\\\varepsilon\\\\qquad \\\\forall y\\\\in\\\\mathcal{Y}" displayMode={true} darkMode={true} />
                      </div>
                      <div className="desc">
                        <b>Why it’s needed:</b> Log-utility is only defined if the log argument is positive for every possible outcome.
                      </div>
                    </div>

                    <div className="card half">
                      <div className="row">
                        <h3>E2. Chance constraint (stochastic safety)</h3>
                        <span className="badge">“Almost sure” safety</span>
                        <button className="copy" onClick={() => copyToClipboard("\\\\mathbb{P}_{y\\\\sim P_{\\\\theta^*}(\\\\cdot|x)}\\\\Big(1+s^\\\\top r(y,o)\\\\ge \\\\varepsilon\\\\Big)\\\\ \\\\ge\\\\ 1-\\\\delta")}>Copy LaTeX</button>
                      </div>
                      <div className="math">
                        <KatexRenderer tex="\\\\mathbb{P}_{y\\\\sim P_{\\\\theta^*}(\\\\cdot|x)}\\\\Big(1+s^\\\\top r(y,o)\\\\ge \\\\varepsilon\\\\Big)\\\\ \\\\ge\\\\ 1-\\\\delta" displayMode={true} darkMode={true} />
                      </div>
                      <div className="desc">
                        <b>When it’s better:</b> If you don’t want worst-case conservatism. This says: “with high probability, I stay within the log-domain”.
                      </div>
                    </div>

                    <div className="card">
                      <div className="warnbox">
                        <b>Pro tip:</b> If you include this block in your whitepaper UI, most “log-domain” criticism disappears immediately.
                      </div>
                    </div>
                  </div>
                </section>

                {/* F) Multi-market */}
                <section id="multimarket">
                  <div className="section-title">
                    <h2>F) Multi-market Portfolio (Joint Optimization)</h2>
                    <div className="note">Multiple markets at once, with market-specific parameters</div>
                  </div>

                  <div className="card">
                    <div className="row">
                      <h3>F1. Multi-market joint objective</h3>
                      <span className="badge">Markets: j=1..J</span>
                      <button className="copy" onClick={() => copyToClipboard("\\\\max_{\\\\{s_j\\\\}_{j=1}^{J}}\\\\sum_{j=1}^{J}\\\\omega_j\\\\,\\\\mathbb{E}_{y_j\\\\sim P_{\\\\theta_j^*}(\\\\cdot\\\\mid x_j)}\\\\Big[\\\\log\\\\!\\\\big(1+s_j^\\\\top r_j(y_j,o_j)\\\\big)\\\\Big]-\\\\sum_{j=1}^{J}\\\\gamma_j\\\\,\\\\mathrm{CVaR}_{\\\\alpha_j}\\\\!\\\\big(-s_j^\\\\top r_j(y_j,o_j)\\\\big)-\\\\sum_{j=1}^{J}c_j\\\\,\\\\lVert s_j\\\\rVert_{1}\\\\quad \\\\text{s.t. } s_j\\\\in\\\\mathcal{S}_j")}>Copy LaTeX</button>
                    </div>
                    <div className="math">
                      <KatexRenderer tex="\\\\max_{\\\\{s_j\\\\}_{j=1}^{J}}\\\\sum_{j=1}^{J}\\\\omega_j\\\\,\\\\mathbb{E}_{y_j\\\\sim P_{\\\\theta_j^*}(\\\\cdot\\\\mid x_j)}\\\\Big[\\\\log\\\\!\\\\big(1+s_j^\\\\top r_j(y_j,o_j)\\\\big)\\\\Big]-\\\\sum_{j=1}^{J}\\\\gamma_j\\\\,\\\\mathrm{CVaR}_{\\\\alpha_j}\\\\!\\\\big(-s_j^\\\\top r_j(y_j,o_j)\\\\big)-\\\\sum_{j=1}^{J}c_j\\\\,\\\\lVert s_j\\\\rVert_{1}\\\\quad \\\\text{s.t. } s_j\\\\in\\\\mathcal{S}_j" displayMode={true} darkMode={true} />
                    </div>
                    <div className="desc">
                      <b>What it adds:</b> Each market has its own posterior, odds, and risk/friction parameters. w_j weights prioritize markets.
                    </div>
                  </div>
                </section>
                
                {/* G) Sport models */}
                <section id="sports">
                  <div className="section-title">
                    <h2>G) Sport-Specific Models (your formulas)</h2>
                    <div className="note">Defensible assumptions</div>
                  </div>

                  <div className="grid-custom">
                    {/* Soccer */}
                    <div className="card">
                      <h3>Soccer</h3>
                      <div className="row"><span className="badge">G1.1 Independent Poisson Goals</span></div>
                      <div className="math"><KatexRenderer tex="G_H\\\\sim\\\\mathrm{Pois}(\\\\mu_H),\\\\qquad G_A\\\\sim\\\\mathrm{Pois}(\\\\mu_A),\\\\qquad \\\\mu_H=\\\\exp(\\\\beta^\\\\top x + h),\\\\ \\\\ \\\\mu_A=\\\\exp(\\\\beta^\\\\top x)" displayMode={true} darkMode={true} /></div>
                      
                      <div className="row mt-4"><span className="badge">G1.3 Dixon–Coles Low-Score Correction</span></div>
                      <div className="math"><KatexRenderer tex="P_{\\\\mathrm{DC}}(i,j)=\\\\phi_{ij}(\\\\rho)\\\\,P(i;\\\\mu_H)\\\\,P(j;\\\\mu_A)" displayMode={true} darkMode={true} /></div>
                      
                      <div className="row mt-4"><span className="badge">G1.4 DC Adjustment Table</span></div>
                      <div className="math"><KatexRenderer tex="\\\\phi_{ij}(\\\\rho)=\\\\begin{cases}1-\\\\mu_H\\\\mu_A\\\\rho, & (i,j)=(0,0)\\\\\\\\1+\\\\mu_H\\\\rho, & (i,j)=(0,1)\\\\\\\\1+\\\\mu_A\\\\rho, & (i,j)=(1,0)\\\\\\\\1-\\\\rho, & (i,j)=(1,1)\\\\\\\\1, & \\\\text{otherwise}\\\\end{cases}" displayMode={true} darkMode={true} /></div>
                    
                      <div className="row mt-4"><span className="badge">G1.7 Corners/Cards as NegBin</span></div>
                      <div className="math"><KatexRenderer tex="Y\\\\mid x \\\\sim \\\\mathrm{NegBin}(\\\\mu(x),\\\\kappa),\\\\qquad \\\\mu(x)=\\\\exp(\\\\alpha^\\\\top x),\\\\qquad \\\\mathrm{Var}(Y\\\\mid x)=\\\\mu(x)+\\\\frac{\\\\mu(x)^2}{\\\\kappa}" displayMode={true} darkMode={true} /></div>
                    </div>

                    {/* Basketball */}
                    <div className="card">
                      <h3>Basketball</h3>
                      <div className="row"><span className="badge">G2.1 Pace × PPP</span></div>
                      <div className="math"><KatexRenderer tex="\\\\mathbb{E}[\\\\mathrm{Pts}\\\\mid x]=\\\\mathbb{E}[n\\\\mid x]\\\\cdot \\\\mathbb{E}[\\\\mathrm{PPP}\\\\mid x],\\\\qquad n=\\\\mathrm{Pace}(x)" displayMode={true} darkMode={true} /></div>
                      
                      <div className="row mt-4"><span className="badge">G2.2 Spread ≈ Normal</span></div>
                      <div className="math"><KatexRenderer tex="D=\\\\mathrm{Pts}_H-\\\\mathrm{Pts}_A \\\\approx \\\\mathcal{N}(\\\\mu_D(x),\\\\sigma_D^2(x)),\\\\qquad \\\\sigma_D^2(x)\\\\propto \\\\mathbb{E}[n\\\\mid x]" displayMode={true} darkMode={true} /></div>

                      <div className="row mt-4"><span className="badge">G2.3 Empirical Bayes shrinkage</span></div>
                      <div className="math"><KatexRenderer tex="\\\\hat{\\\\theta}_p=\\\\frac{\\\\tau^2}{\\\\tau^2+\\\\sigma^2/n}\\\\,\\\\bar{y}_p+\\\\frac{\\\\sigma^2/n}{\\\\tau^2+\\\\sigma^2/n}\\\\,\\\\mu_0" displayMode={true} darkMode={true} /></div>
                    </div>

                    {/* Tennis */}
                    <div className="card">
                      <h3>Tennis</h3>
                      <div className="row"><span className="badge">G3.1 Hold probability (i.i.d. points + deuce)</span></div>
                      <div className="math"><KatexRenderer tex="P(\\\\mathrm{Hold}\\\\mid p)=\\\\sum_{k=0}^{2}\\\\binom{3+k}{k}p^{4}(1-p)^k+\\\\binom{6}{3}p^{3}(1-p)^{3}\\\\cdot \\\\frac{p^{2}}{1-2p(1-p)}" displayMode={true} darkMode={true} /></div>
                      
                      <div className="row mt-4"><span className="badge">G3.2 Win probability logistic (ELO + surface)</span></div>
                      <div className="math"><KatexRenderer tex="P(\\\\mathrm{Win}\\\\mid x)=\\\\sigma\\\\!\\\\Big(\\\\Delta \\\\mathrm{ELO}_{\\\\mathrm{base}}+\\\\delta_{\\\\mathrm{surf}}\\\\Delta \\\\mathrm{ELO}_{\\\\mathrm{surf}}-\\\\beta\\\\,\\\\mathrm{Fatigue}\\\\Big),\\\\qquad \\\\sigma(z)=\\\\frac{1}{1+e^{-z}}" displayMode={true} darkMode={true} /></div>
                    </div>

                    {/* NFL */}
                    <div className="card">
                      <h3>NFL</h3>
                      <div className="row"><span className="badge">G4.1 Drive-based compound scoring</span></div>
                      <div className="math"><KatexRenderer tex="\\\\mathrm{Pts}=\\\\sum_{d=1}^{N_D} Z_d,\\\\qquad N_D\\\\sim \\\\mathrm{Pois}(\\\\nu(x)),\\\\qquad Z_d\\\\in\\\\{7,3,0\\\\}" displayMode={true} darkMode={true} /></div>
                      
                      <div className="row mt-4"><span className="badge">G4.2 Softmax drive outcomes</span></div>
                      <div className="math"><KatexRenderer tex="p_{\\\\mathrm{TD}},p_{\\\\mathrm{FG}},p_{0}\\\\ge 0,\\\\qquad p_{\\\\mathrm{TD}}+p_{\\\\mathrm{FG}}+p_{0}=1" displayMode={true} darkMode={true} /></div>
                    </div>

                    {/* Hockey */}
                    <div className="card">
                      <h3>Hockey</h3>
                      <div className="row"><span className="badge">G5.1 Poisson goals + goalie adjustment</span></div>
                      <div className="math"><KatexRenderer tex="G_H\\\\sim \\\\mathrm{Pois}(\\\\mu_H),\\\\qquad \\\\mu_H=\\\\exp(\\\\beta^\\\\top x-\\\\eta\\\\,\\\\mathrm{GSAx}_{\\\\mathrm{goalie}})" displayMode={true} darkMode={true} /></div>
                      
                      <div className="row mt-4"><span className="badge">G5.2 Win probability logistic</span></div>
                      <div className="math"><KatexRenderer tex="P(\\\\mathrm{Win}\\\\mid x)=\\\\sigma(\\\\theta^\\\\top v(x)),\\\\qquad \\\\sigma(z)=\\\\frac{1}{1+e^{-z}}" displayMode={true} darkMode={true} /></div>
                    </div>

                    {/* Baseball */}
                     <div className="card">
                      <h3>Baseball</h3>
                      <div className="row"><span className="badge">G6.1 Runs as NegBin + ParkFactor</span></div>
                      <div className="math"><KatexRenderer tex="R\\\\mid x \\\\sim \\\\mathrm{NegBin}(\\\\mu_R(x),\\\\kappa),\\\\qquad \\\\mu_R(x)=\\\\exp(\\\\beta^\\\\top x)\\\\cdot \\\\mathrm{ParkFactor}" displayMode={true} darkMode={true} /></div>
                      
                      <div className="row mt-4"><span className="badge">G6.2 Pythagorean baseline</span></div>
                      <div className="math"><KatexRenderer tex="P(\\\\mathrm{Win})\\\\approx \\\\frac{\\\\mathrm{RS}^{\\\\gamma_{\\\\mathrm{season}}}}{\\\\mathrm{RS}^{\\\\gamma_{\\\\mathrm{season}}}+\\\\mathrm{RA}^{\\\\gamma_{\\\\mathrm{season}}}}" displayMode={true} darkMode={true} /></div>

                      <div className="row mt-4"><span className="badge">G6.3 Tri-level pitcher shrinkage</span></div>
                      <div className="math"><KatexRenderer tex="\\\\hat{\\\\theta}_{\\\\mathrm{pit}}=w_1\\\\theta_{\\\\mathrm{obs}}+w_2\\\\theta_{\\\\mathrm{cluster}}+\\\\big(1-w_1-w_2\\\\big)\\\\theta_{\\\\mathrm{lg}}" displayMode={true} darkMode={true} /></div>
                    </div>
                  </div>
                </section>
                
                {/* H) Advanced */}
                <section id="advanced">
                  <div className="section-title">
                    <h2>H) Upper-Tier Extensions (rare, “top shelf”)</h2>
                    <div className="note">Robustness + theoretical shield</div>
                  </div>

                  <div className="grid-custom">
                    <div className="card half">
                      <div className="row">
                        <h3>H1. Kusuoka representation</h3>
                        <span className="badge">A “super” CVaR</span>
                      </div>
                      <div className="math"><KatexRenderer tex="\\\\rho(L)=\\\\sup_{\\\\mu\\\\in\\\\mathcal{M}}\\\\int_{0}^{1}\\\\mathrm{CVaR}_{\\\\alpha}(L)\\\\,d\\\\mu(\\\\alpha)" displayMode={true} darkMode={true} /></div>
                    </div>

                    <div className="card half">
                      <div className="row">
                        <h3>H2. Wasserstein-DRO</h3>
                        <span className="badge">Optimal transport</span>
                      </div>
                      <div className="math"><KatexRenderer tex="\\\\max_{s\\\\in\\\\mathcal{S}} \\\\ \\\\inf_{P\\\\in\\\\mathcal{B}_\\\\varepsilon(\\\\widehat P)} \\\\ \\\\mathbb{E}_{y\\\\sim P}\\\\Big[\\\\log\\\\big(1+s^\\\\top r(y,o)\\\\big)\\\\Big] -\\\\gamma\\\\,\\\\rho\\\\big(-s^\\\\top r(y,o)\\\\big)" displayMode={true} darkMode={true} /></div>
                    </div>

                     <div className="card">
                      <div className="goodbox">
                        <b>If you want a “professor-level” impact:</b>
                        H2 (Wasserstein-DRO) + H3 (Donsker–Varadhan) + H1 (Kusuoka) together are an extremely strong theoretical shield.
                        Keep the core implementation as (Kelly + CVaR + caps), and present the top-shelf pieces as optional extensions.
                      </div>
                    </div>
                  </div>
                </section>

              </main>

              <footer>
                <div className="small">
                  <b>Note:</b> This is a “whitepaper UI” style page. The models and risk forms are defensible and built on standard theory.
                </div>
              </footer>
            </div>
            {/*
"""

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

output_lines = lines[:555] + [new_content] + lines[740:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(output_lines)
