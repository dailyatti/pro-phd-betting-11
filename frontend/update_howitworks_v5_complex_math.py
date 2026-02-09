
import os

file_path = "d:\\minden adat a gépről\\Letöltések mappából\\phd betting\\frontend\\src\\pages\\HowItWorksPage.jsx"

# --- 1. SUPER-DOCTORAL LATEX STORE (Complex Math for Icons) ---
# We replace the LATEX_STORE block again.
# We keep sections 0-H and J identical to V4, but upgrade I (Sports) massively.

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

  // I) Sports (SUPER-DOCTORAL EXPANSION)
  // Soccer: Karlis-Ntzoufras Bivariate Poisson Infinite Sum
  I1: `\\textbf{Holistic Bivariate Process:}\\quad P(H=h, A=a) = e^{-(\\lambda_1+\\lambda_2+\\lambda_3)} \\sum_{k=0}^{\\min(h,a)} \\frac{\\lambda_1^{h-k} \\lambda_2^{a-k} \\lambda_3^k}{(h-k)! (a-k)! k!} \\\\ \\lambda_3 \\text{ explicitly governs the diagonal covariance (draw-inflation) beyond independence.}`,
  I2: `\\textbf{Diagonal Inflation (DC Kernel):}\\quad \\tau_{\\rho}(h,a) = \\begin{cases} 1-\\lambda_H\\lambda_A\\rho & h=a=0 \\\\ 1+\\lambda_H\\rho & h=0, a=1 \\\\ ... \\end{cases} \\\\ \\text{Provides local perturbation mass without destroying marginal consistency.}`,
  
  // Basketball (NBA): Four Factors Integral
  I3: `\\textbf{Ergodic Possession Flow:}\\quad \\mathbb{E}[\\text{PTS}] = \\int_{t=0}^{48} \\Big( \\underbrace{\\lambda_{\\text{pace}}(t\\mid x)}_{\\text{Tempo Process}} \\cdot \\underbrace{\\eta_{\\text{eff}}(t\\mid \\theta_{match})}_{\\text{Instant Efficiency}} \\Big) dt \\\\ \\eta_{\\text{eff}} \\approx \\text{eFG}\\% + \\alpha(\\text{TOV}) + \\beta(\\text{ORB})`,
  I4: `\\textbf{Variance Scaling Law:}\\quad \\text{Var}(S_{tot}) = \\text{Pace} \\cdot (\\sigma_H^2 + \\sigma_A^2) + 2\\,\\text{Pace}^2 \\cdot \\mathrm{Cov}(\\text{Eff}_H, \\text{Eff}_A) \\\\ \\text{Higher pace linearly amplifies variance, quadratically amplifies correlation sensitivity.}`,

  // Tennis (ATP): Bellman Equation / Markov Chain
  I5: `\\textbf{Point-Process Bellman Equation:}\\quad V(s_1, s_2) = p_{srv} V(s_1+1, s_2) + (1-p_{srv}) V(s_1, s_2+1) \\\\ \\text{Subject to boundary conditions: } V(g, s_2) = 1, V(s_1, g) = 0.`,
  I6: `\\textbf{Infinite Deuce Series:}\\quad P(\\text{Hold}|\\text{Deuce}) = \\sum_{n=0}^{\\infty} p^2 (2p(1-p))^n = \\frac{p^2}{1 - 2p(1-p)} \\\\ \\text{Exact analytical solution for the absorbing state probability.}`,

  // NFL: Characteristic Function of Compound Process
  I7: `\\textbf{Compound Characteristic Function:}\\quad \\phi_{S_T}(u) = \\exp\\left( \\lambda T \\left( \\sum_{z \\in \\{0,3,7\\}} \\pi_z e^{i u z} - 1 \\right) \\right) \\\\ \\text{Allows exact Fourier inversion for probability density } f_S(x) \\text{ without Monte Carlo.}`,
  I8: `\\textbf{Down-Conversion Tensor:}\\quad P(1^{st} | \\text{State}) = \\sigma\\Big( \\beta_0 + \\sum_{k=1}^K \\beta_k \\phi_k(x, \\text{down}, \\text{dist}) \\Big) \\\\ \\text{Non-linear logistic map over the discrete state-space grid.}`,

  // Hockey: Cox-Ingersoll-Ross Intensity
  I9: `\\textbf{Stochastic Intensity (CIR):}\\quad d\\lambda_t = \\kappa(\\bar{\\lambda} - \\lambda_t)dt + \\sigma_{\\lambda} \\sqrt{\\lambda_t} dW_t + J_{\\text{goal}} dN_t \\\\ \\text{Mean-reverting intensity with jump clusters upon scoring events (momentum).}`,
  I10: `\\textbf{Empty Net Volatility Jump:}\\quad \\lambda(t > 58:00) = \\lambda(t) \\cdot (1 + \\mathbb{I}_{|\\Delta S| \\le 2} \\cdot \\xi_{\\text{pull}}) \\\\ \\text{Regime-switching parameter } \\xi_{\\text{pull}} \\approx 5.0 \\text{ accounts for desperation variance.}`,

  // Baseball: Gamma-Poisson Mixture
  I11: `\\textbf{Negative Binomial Derivation:}\\quad P(R=k) = \\int_0^\\infty \\frac{\\lambda^k e^{-\\lambda}}{k!} \\cdot \\underbrace{\\frac{\\beta^\\alpha}{\\Gamma(\\alpha)} \\lambda^{\\alpha-1} e^{-\\beta\\lambda}}_{\\text{Gamma Prior on } \\lambda} d\\lambda = \\binom{k+\\alpha-1}{k} p^\\alpha (1-p)^k`,
  I12: `\\textbf{Pythagorean Non-Linearity:}\\quad \\text{Win}\\% = \\frac{RS^\\gamma}{RS^\\gamma + RA^\\gamma} \\implies \\frac{\\partial W}{\\partial RS} = \\frac{\\gamma (RS \\cdot RA)^{\\gamma-1}}{(RS^\\gamma + RA^\\gamma)^2} \\\\ \\text{Marginal value of a run is non-constant and state-dependent.}`,

  // J) Advanced Theory
  J1: `\\textbf{Donsker–Varadhan (DV):}\\quad \\log \\mathbb{E}_{Q}[e^{f}] = \\sup_{P} \\{ \\mathbb{E}_{P}[f]-\\mathrm{KL}(P\\|Q) \\} \\\\ \\text{Fundamental link between robust control and Bayesian inference.}`,
  J2: `\\textbf{PAC-Bayes Bound:}\\quad \\mathrm{kl}(\\hat{L} \\| L) \\le \\frac{\\mathrm{KL}(\\rho\\|\\pi) + \\log(2\\sqrt{n}/\\delta)}{n} \\\\ \\text{Generalizes VC-dimension to stochastic classifiers (posterior distributions).}`,
};"""

# --- 2. REPLACE LOGIC ---
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace LATEX_STORE using regex logic from V3 script
start_marker = "const LATEX_STORE = {"
start_idx = content.find(start_marker)

if start_idx != -1:
    brace_count = 0
    end_idx = -1
    for i in range(start_idx + len(start_marker) - 1, len(content)):
        char = content[i]
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                end_idx = i + 1 
                if i + 1 < len(content) and content[i+1] == ';':
                    end_idx += 1
                break
    
    if end_idx != -1:
        content = content[:start_idx] + new_latex_store + content[end_idx:]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Successful V5 Update: Super-Doctoral Sports Formulas Injected.")
    else:
        print("Error: Could not matching closing brace for LATEX_STORE.")
else:
    print("Error: LATEX_STORE start marker not found.")
