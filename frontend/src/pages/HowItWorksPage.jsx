import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Rocket,
  Eye,
  Search,
  Activity,
  BrainCircuit,
  ExternalLink,
  Sun,
  Moon,
  Sigma,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";

import "katex/dist/katex.min.css";
import katex from "katex";

// -------------------------
// UTILITY: Clipboard Copy (with fallback)
// -------------------------
async function copyToClipboard(text) {
  // SSR guard
  if (typeof window === "undefined") return false;

  const value = String(text ?? "");

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // continue to fallback
  }

  // Fallback for older browsers
  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.setAttribute("readonly", "");
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return Boolean(ok);
  } catch {
    return false;
  }
}

// -------------------------
// DATA & CONSTANTS (Moved to top level for export/copy access)
// -------------------------

const LATEX_STORE = {
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
  I2: `\\textbf{Diagonal Inflation (DC Kernel):}\\quad \\tau_{\\rho}(h,a) = \\begin{cases} 1-\\lambda_H\\lambda_A\\rho, & (h,a)=(0,0) \\\\ 1+\\lambda_H\\rho, & (h,a)=(0,1) \\\\ 1+\\lambda_A\\rho, & (h,a)=(1,0) \\\\ 1-\\rho, & (h,a)=(1,1) \\\\ 1, & \\text{otherwise} \\end{cases} \\\\ \\text{Provides local perturbation mass without destroying marginal consistency.}`,

  // Basketball (NBA): Four Factors Integral
  I3: `\\textbf{Ergodic Possession Flow:}\\quad \\mathbb{E}[\\text{PTS}] = \\int_{t=0}^{48} \\Big( \\underbrace{\\lambda_{\\text{pace}}(t\\mid x)}_{\\text{Tempo Process}} \\cdot \\underbrace{\\eta_{\\text{eff}}(t\\mid \\theta_{match})}_{\\text{Instant Efficiency}} \\Big) dt \\\\ \\eta_{\\text{eff}} \\approx \\text{eFG}\\% + \\alpha(\\text{TOV}) + \\beta(\\text{ORB})`,
  I4: `\\textbf{Variance Scaling Law:}\\quad \\text{Var}(S_{tot}) = \\text{Pace} \\cdot (\\sigma_H^2 + \\sigma_A^2) + 2\\,\\text{Pace}^2 \\cdot \\mathrm{Cov}(\\text{Eff}_H, \\text{Eff}_A) \\\\ \\text{Higher pace linearly amplifies variance, quadratically amplifies correlation sensitivity.}`,

  // Tennis (ATP): Bellman Equation / Markov Chain
  I5: `\\textbf{Point-Process Bellman Equation:}\\quad V(s_1, s_2) = p_{srv} V(s_1+1, s_2) + (1-p_{srv}) V(s_1, s_2+1) \\\\ \\text{Subject to boundary conditions: } V(g, s_2) = 1, V(s_1, g) = 0.`,
  I6: `\\textbf{Infinite Deuce Resolution:}\\quad P(\\text{Hold}|\\text{Deuce}) = \\sum_{n=0}^{\\infty} \\big(2p(1-p)\\big)^n p^2 = \\frac{p^2}{1-2p(1-p)} = \\frac{p^2}{p^2+(1-p)^2} \\\\ \\text{Closed form: } \\frac{p^2}{p^2+(1-p)^2}\\text{ (geometric series over WL/LW loops).}`,

  // NFL: Characteristic Function of Compound Process
  I7: `\\textbf{Compound Poisson (Drive-Level Skeleton):}\\quad \\phi_{S_T}(u) = \\exp\\left( \\lambda T \\left( \\sum_{z \\in \\mathcal{Z}} \\pi_z e^{i u z} - 1 \\right) \\right) \\\\ \\mathcal{Z} \\subset \\mathbb{Z}_{\\ge 0}\\ \\text{captures scoring quanta (e.g., }2,3,6,7,8\\text{). Fourier-invertible for exact pmf.}`,
  I8: `\\textbf{Down-Conversion Tensor:}\\quad P(1^{st} | \\text{State}) = \\sigma\\Big( \\beta_0 + \\sum_{k=1}^K \\beta_k \\phi_k(x, \\text{down}, \\text{dist}) \\Big) \\\\ \\text{Non-linear logistic map over the discrete state-space grid.}`,

  // Hockey: Cox-Ingersoll-Ross Intensity
  I9: `\\textbf{Stochastic Intensity (CIR):}\\quad d\\lambda_t = \\kappa(\\bar{\\lambda} - \\lambda_t)dt + \\sigma_{\\lambda} \\sqrt{\\lambda_t} dW_t + J_{\\text{goal}} dN_t \\\\ \\text{Mean-reverting intensity with jump clusters upon scoring events (momentum).}`,
  I10: `\\textbf{Empty Net Volatility Jump:}\\quad \\lambda(t > 58:00) = \\lambda(t) \\cdot (1 + \\mathbb{I}_{|\\Delta S| \\le 2} \\cdot \\xi_{\\text{pull}}) \\\\ \\text{Regime-switching parameter } \\xi_{\\text{pull}} \\approx 5.0 \\text{ accounts for desperation variance.}`,

  // Baseball: Gamma-Poisson Mixture
  I11: `\\textbf{Negative Binomial Derivation:}\\quad P(R=k) = \\int_0^\\infty \\frac{\\lambda^k e^{-\\lambda}}{k!} \\cdot \\underbrace{\\frac{\\beta^\\alpha}{\\Gamma(\\alpha)} \\lambda^{\\alpha-1} e^{-\\beta\\lambda}}_{\\text{Gamma Prior on } \\lambda} d\\lambda = \\binom{k+\\alpha-1}{k} p^\\alpha (1-p)^k`,
  I12: `\\textbf{Pythagorean Non-Linearity:}\\quad \\text{Win}\\% = \\frac{RS^\\gamma}{RS^\\gamma + RA^\\gamma} \\implies \\frac{\\partial W}{\\partial RS} = \\frac{\\gamma\\,RS^{\\gamma-1}\\,RA^\\gamma}{(RS^\\gamma + RA^\\gamma)^2} \\\\ \\text{Marginal value of a run is non-constant and state-dependent.}`,

  // J) Advanced Theory
  J1: `\\textbf{Donsker–Varadhan (DV):}\\quad \\log \\mathbb{E}_{Q}[e^{f}] = \\sup_{P} \\{ \\mathbb{E}_{P}[f]-\\mathrm{KL}(P\\|Q) \\} \\\\ \\text{Fundamental link between robust control and Bayesian inference.}`,
  J2: `\\textbf{PAC-Bayes Bound:}\\quad \\mathrm{kl}(\\hat{L} \\| L) \\le \\frac{\\mathrm{KL}(\\rho\\|\\pi) + \\log(2\\sqrt{n}/\\delta)}{n} \\\\ \\text{Generalizes VC-dimension to stochastic classifiers (posterior distributions).}`,
};

const CALIBRATION_FORMULA = {
  title: "A. Vig Removal / Overround Normalization",
  tex: `\\pi_k = \\frac{\\pi_k^{raw}}{\\sum_j \\pi_j^{raw}}, \\quad \\pi_k^{raw} = \\frac{1}{o_k}`,
  desc: "Implied probabilities (π) are derived from odds (o) and normalized to sum to 1, removing bookmaker margin (vig).",
};

const OPTIMIZATION_FORMULA = {
  title: "0B. Stake Optimization: Kelly (log-growth) + CVaR + L1 Friction",
  tex: `s^*(x) = \\arg\\max_{s \\in \\mathcal{S}} \\Big\\{ \\mathbb{E}_{y \\sim P_{\\theta^*}(\\cdot|x)} [\\log(1+s^T r(y,o))] - \\gamma \\cdot \\mathrm{CVaR}_{\\alpha}(-s^T r(y,o)) - c\\lVert s \\rVert_1 \\Big\\}`,
  desc: "Solves for optimal stake (s*) maximizing logarithmic growth while penalizing tail risk (CVaR) and transaction costs (L1 norm).",
};

const MULTI_MARKET_FORMULA = {
  title: "Multi-Market (Portfolio) Joint Optimization",
  tex: `\\max_{\\{s_j\\}_{j=1}^J} \\sum_{j=1}^J \\omega_j \\mathbb{E}[\\log(1+s_j^T r_j)] - \\sum_{j=1}^J \\gamma_j \\mathrm{CVaR}_{\\alpha_j}(-s_j^T r_j) - \\sum_{j=1}^J c_j \\lVert s_j \\rVert_1`,
  desc: "Allocates capital across J concurrent markets, optimizing global growth vs. aggregate tail risk, subject to portfolio constraints.",
};

const GLOSSARY = [
  { symbol: "\\pi_k", def: "Normalized market implied probability" },
  { symbol: "\\theta^*", def: "Calibrated model parameters (posterior)" },
  { symbol: "s^*", def: "Optimal stake vector (fraction of bankroll)" },
  { symbol: "\\mathrm{CVaR}_{\\alpha}", def: "Conditional Value at Risk (expected loss in worst (1−α) tail)" },
  { symbol: "\\mathbb{E}[\\cdot]", def: "Expected value operator under model distribution" },
  { symbol: "\\mathcal{S}", def: "Feasible set (bankroll & liquidity constraints)" },
];



const APPENDIX_FORMULAS = [
  {
    title: "Poisson Distribution (Soccer/Hockey)",
    tex: "P(k; \\lambda) = \\frac{\\lambda^k e^{-\\lambda}}{k!}",
    desc: "Used for modeling goal/point arrivals in low-scoring sports.",
  },
  {
    title: "Log-Normal Price Movement",
    tex: "dS_t = \\mu S_t dt + \\sigma S_t dW_t",
    desc: "Stochastic calculus model for odds drifting before game time.",
  },
];

const SPORT_FORMULAS = {
  soccer: [
    {
      title: "1.1 Independent Poisson Goals",
      tex: "G_H \\sim \\mathrm{Pois}(\\mu_H), \\quad G_A \\sim \\mathrm{Pois}(\\mu_A), \\quad \\mu_H = \\exp(\\beta^T x + h)",
      desc: "Baseline goal expectancy model with home advantage (h) and covariate vector (x).",
      explanation: "Modeling goal arrivals as independent Poisson processes is the industry standard baseline. The rate parameters (μH, μA) are log-linear functions of team strength vectors (x) and home advantage (h). This assumes goals occur randomly and at a constant average rate throughout the match.",
      usage: "Used to generate the initial 'unadjusted' score matrix. This matrix is later modified by the Dixon-Coles parameters to account for dependencies. It provides the raw 'power rating' difference between teams before tactical nuances are applied."
    },
    {
      title: "1.3 Dixon-Coles Adjustment",
      tex: "P_{\\mathrm{DC}}(i,j) = \\tau_{\\rho}(i,j) \\cdot P(i;\\mu_H) \\cdot P(j;\\mu_A)",
      desc: "Corrects independence assumption for low scores (0-0, 1-0, 0-1, 1-1) via correlation parameter ρ.",
      explanation: "Teams that play defensively against each other tend to produce more low-scoring draws than independent Poisson models predict. The Dixon-Coles adjustment applies a 'diagonal inflation' factor (τ) to the probabilities of 0-0, 1-0, 0-1, and 1-1 scores, redistributing probability mass from other outcomes to better match empirical match data.",
      usage: "Critical for accurate 'Draw' and 'Under 2.5' pricing. Without this, the model would consistently undervalue the likelihood of tight, low-scoring affairs in top-tier leagues."
    },
    {
      title: "1.6 Market Mapping",
      tex: "P(\\mathrm{Market}_k) = \\sum_{(i,j) \\in \\mathcal{M}_k} P_{\\mathrm{DC}}(i,j)",
      desc: "Aggregates exact score probabilities into market outcomes (1X2, Over/Under, BTTS).",
      explanation: "Once the full bivariate probability mass function (PMF) P(i,j) is established for all possible scores (0-0 to N-N), pricing any derivative market is simply a summation task. For example, 'Over 2.5 Goals' is the sum of all P(i,j) where i+j > 2.5.",
      usage: "This guarantees internal consistency. The price for 'Home Win' and 'Correct Score 1-0' are mathematically locked, preventing arbitrage/Dutching opportunities within the model's own predictions."
    }
  ],
  basketball: [
    {
      title: "2.1 Possession Decomposition",
      tex: "\\mathbb{E}[\\mathrm{Pts}|x] = \\mathbb{E}[n|x] \\cdot \\mathbb{E}[\\mathrm{PPP}|x]",
      desc: "Points = Pace (possessions) × Points Per Possession (efficiency).",
      explanation: "A team's total score is the product of how many chances they get (Pace) and how efficient they are per chance (PPP). We model these separately because they have different variances and correlations. Pace is often dictated by the faster team, while efficiency is a matchup of offense vs. defense.",
      usage: "Allows for granular adjustments. If a star player is out, we adjust PPP heavily but Pace only slightly. If a team operates a 'slow-down' strategy, we adjust Pace without necessarily degrading their offensive efficiency rating."
    },
    {
      title: "2.2 Spread Normal Proxy",
      tex: "D = \\mathrm{Pts}_H - \\mathrm{Pts}_A \\approx \\mathcal{N}(\\mu_D(x), \\sigma_D^2(x))",
      desc: "Modeling point differential D as Gaussian, where variance scales with Pace.",
      explanation: "While individual points are discrete, the final score difference in high-scoring games converges to a Normal distribution (CLT). The critical innovation is that the variance (σ²) is not constant; it scales linearly with the expected Pace of the game.",
      usage: "used to price Spread and Alternative Lines. A high-pace game (e.g., 240 pts) has a wider spread distribution than a low-pace game (e.g., 200 pts), meaning the favorite needs a larger edge to cover the same -5.5 line in a slower game."
    }
  ],
  tennis: [
    {
      title: "3.1 Hold Probability (Geometric)",
      tex: "P(\\mathrm{Hold}|p) = \\sum_{k=0}^2 \\binom{3+k}{k}p^4(1-p)^k + \\binom{6}{3}p^3(1-p)^3 \\frac{p^2}{1-2p(1-p)}",
      desc: "Exact probability of holding serve, accounting for Deuce (infinite geometric series).",
      explanation: "Tennis scoring is unique because of the 'Deuce' state, which theoretically allows a game to go on forever. This formula sums the probabilities of winning at 40-0, 40-15, 40-30, and then solves the infinite geometric series representing the Deuce-Ad-Deuce loop.",
      usage: "This is the atomic unit of tennis modeling. We calculate P(Hold) for both players based on surface-adjusted serve stats, then recursively build up to Set and Match probabilities."
    },
    {
      title: "3.2 Win Probability (Logit)",
      tex: "P(\\mathrm{Win}|x) = \\sigma(\\Delta \\mathrm{ELO}_{base} + \\delta_{surf}\\Delta \\mathrm{ELO}_{surf} - \\beta \\cdot \\mathrm{Fatigue})",
      desc: "Surface-adjusted ELO model with fatigue decay factors.",
      explanation: "We use a modified ELO system that tracks separate ratings for each surface (Clay, Grass, Hard). The 'Fatigue' term is a decay factor based on time-on-court in the previous 48 hours, penalizing players on back-to-back grueling matches.",
      usage: "Provides the prior probability for the match winner. This is often blended with the point-by-point simulation to catch spots where a player's raw talent (ELO) might be high, but situational factors (Fatigue/Surface) put them at a disadvantage."
    }
  ],
  nfl: [
    {
      title: "4.1 Compound Drive Process",
      tex: "\\mathrm{Pts} = \\sum_{d=1}^{N_D} Z_d, \\quad N_D \\sim \\mathrm{Pois}(\\nu(x))",
      desc: "Total points modeled as a sum of random drive outcomes (TD, FG, Punt).",
      explanation: "Football scores are multimodal (0, 3, 7, 10, 14...). Modeling them as a simple Poisson or Normal distribution fails to capture these key numbers. We model the game as a random number of 'Drives' (ND), where each drive produces a stochastic outcome Zd (Touchdown, Field Goal, Safety, Turnover/Punt).",
      usage: "Essential for accurate Spread pricing around key numbers (3, 7, 10). A standard Normal model might smooth over the difference between -2.5 and -3.5, but this compound model correctly identifies the massive equity jump crossing the '3'."
    },
    {
      title: "4.2 Drive Outcome Logit",
      tex: "\\mathrm{logit}(p_{TD}) = a^T u(x), \\quad \\mathrm{logit}(p_{FG}) = b^T u(x)",
      desc: "Drive success probabilities conditional on field position and team efficiency.",
      explanation: "The probability of a drive ending in a TD or FG depends on starting field position and the team's Red Zone efficiency. We use logistic regression to estimate these probabilities for each team matchup.",
      usage: "Inputs into the Compound Drive Process. If a team has great 'Between 20s' yards but terrible Red Zone efficiency, this model will correctly predict a lower score despite high yardage."
    }
  ],
  hockey: [
    {
      title: "5.1 Poisson Intensity w/ GSAx",
      tex: "\\mu_H = \\exp(\\beta^T x - \\eta \\cdot \\mathrm{GSAx}_{goalie})",
      desc: "Expected goals adjusted for specific goaltender Goals Saved Above Expected (GSAx).",
      explanation: "In hockey, the goaltender is the single most impactful variable. We adjust the team's base expected goals (xG) by subtracting the specific opposing goalie's GSAx (Goals Saved Above Expected). A hot goalie can depress scoring rates significantly below the team average.",
      usage: "Used to sharpen Moneyline and Over/Under edges. Often the market prices the team history, but misses the specific goaltender matchup impact (e.g., resting the starter)."
    },
    {
      title: "5.2 Win Probability",
      tex: "P(\\mathrm{Win}|x) = \\sigma(\\theta^T v(x))",
      desc: "Logistic regression on team strength vectors.",
      explanation: "A standard logistic regression approach for win probability, using inputs like Fenwick (shot attempts), High-Danger Chances, and Special Teams (PP/PK) efficiency.",
      usage: "Acts as a 'sanity check' or prior for the more granular Poisson intensity model. If the two models diverge significantly, it flags high uncertainty."
    }
  ],
  baseball: [
    {
      title: "6.1 Negative Binomial Runs",
      tex: "R|x \\sim \\mathrm{NegBin}(\\mu_R(x), \\kappa), \\quad \\mathrm{Var}(R|x) = \\mu + \\mu^2/\\kappa",
      desc: "Models run scoring with overdispersion (variance > mean) typical of baseball.",
      explanation: "Baseball scores often exhibit 'bunches' (big innings) that violate the Poisson assumption (where Mean = Variance). The Negative Binomial distribution adds a parameter κ to model this 'overdispersion', capturing the 'feast or famine' nature of run scoring.",
      usage: "Critical for Run Line (-1.5) and Alternate Total pricing. It correctly assigns higher probability to blowout outcomes (e.g., 9+ runs) than a standard Poisson model would."
    },
    {
      title: "6.2 Pythagorean Expectation",
      tex: "P(\\mathrm{Win}) \\approx \\frac{RS^{\\gamma}}{RS^{\\gamma} + RA^{\\gamma}}",
      desc: "Bill James' formula with season-dependent exponent γ.",
      explanation: "A structural estimator relating runs scored (RS) and runs allowed (RA) to win percentage. The exponent γ is typically around 1.83 but varies by era and league run environment.",
      usage: "Identifies 'Lucky' vs 'Unlucky' teams. A team with many wins but a poor RS/RA differential is flagged as overperforming and likely to regress (fade candidate)."
    }
  ]
};



const SPORT_META = {
  soccer: { icon: "⚽", title: "Football (Soccer)", color: "blue" },
  basketball: { icon: "🏀", title: "NBA Basketball", color: "orange" },
  tennis: { icon: "🎾", title: "ATP/WTA Tennis", color: "purple" },
  nfl: { icon: "🏈", title: "NFL Football", color: "emerald" },
  hockey: { icon: "🏒", title: "NHL Hockey", color: "teal" },
  baseball: { icon: "⚾", title: "MLB Baseball", color: "red" }
};

// Conditional classes for sports cards (runtime-safe, avoids non-existent theme-dark: Tailwind variant)
function getSportCardClasses(sport, isDark) {
  if (!isDark) return { card: "", title: "" };

  const darkClasses = {
    soccer: { card: "border-blue-500/30 bg-blue-500/5", title: "text-blue-300" },
    basketball: { card: "border-orange-500/30 bg-orange-500/5", title: "text-orange-300" },
    tennis: { card: "border-purple-500/30 bg-purple-500/5", title: "text-purple-300" },
    nfl: { card: "border-emerald-500/30 bg-emerald-500/5", title: "text-emerald-300" },
    hockey: { card: "border-teal-500/30 bg-teal-500/5", title: "text-teal-300" },
    baseball: { card: "border-red-500/30 bg-red-500/5", title: "text-red-300" },
  };

  return darkClasses[sport] || { card: "border-cyan-500/30 bg-cyan-500/5", title: "text-cyan-300" };
}

// -------------------------
// Custom Safe Renderer (No react-katex)
// -------------------------
const KatexRenderer = memo(function KatexRenderer({ tex, displayMode = true, darkMode }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Clear previous content before rendering (prevents stacking artifacts)
    el.innerHTML = "";

    try {
      katex.render(tex, el, {
        displayMode,
        throwOnError: false, // Render errors as red text instead of crashing
        errorColor: "#cc0000",
        strict: "ignore",    // Don't throw on warnings
        trust: false,        // Security: disable dangerous commands
        macros: {},          // Whitelist macros here if needed later
      });
      setError(null);
    } catch (err) {
      console.error("Katex render error:", err);
      setError(err.message);
    }
  }, [tex, displayMode]);

  if (error) {
    return (
      <div className="text-xs font-mono text-red-500 opacity-80 whitespace-pre-wrap">
        {error}
        <br />
        <span className="opacity-50">{tex}</span>
      </div>
    );
  }

  return <div ref={containerRef} />;
});

// Custom hook for intersection observer
function useInViewOnce(rootMargin = "0px") {
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (inView) return;

    const el = ref.current;
    if (!el) return;

    // Fallback for environments without IntersectionObserver (old Safari, embedded webviews)
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { rootMargin }
    );

    observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [inView, rootMargin]);

  return { ref, inView };
}

// Lazy wrapper remains (for intersection observer)
const LazyBlockMath = memo(function LazyBlockMath({ tex, darkMode }) {
  const { ref, inView } = useInViewOnce("220px");
  return (
    <div ref={ref}>
      {inView ? (
        <KatexRenderer tex={tex} displayMode={true} darkMode={darkMode} />
      ) : (
        <div
          className={`rounded-xl border p-4 text-xs font-mono opacity-60 ${darkMode ? "bg-black/10 border-slate-800" : "bg-slate-50 border-slate-100"
            }`}
        >
          Rendering…
        </div>
      )}
    </div>
  );
});

// -------------------------
// UI COMPONENTS
// -------------------------


// -------------------------
// MAIN PAGE
// -------------------------



const CopyButton = memo(function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  const tRef = useRef(null);

  useEffect(() => {
    return () => {
      if (tRef.current) window.clearTimeout(tRef.current);
    };
  }, []);

  const handleCopy = useCallback(async (e) => {
    e.stopPropagation();
    const ok = await copyToClipboard(text);
    if (!ok) return;

    setCopied(true);
    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      aria-label={label || "Copy LaTeX"}
      type="button"
      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${copied
        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
        : "bg-[var(--phd-btn-bg)] border-[var(--phd-btn-border)] text-[var(--phd-btn-text)] hover:border-[var(--phd-accent)] hover:text-[var(--phd-accent)]"
        }`}
    >
      {copied ? "COPIED" : "Copy LaTeX"}
    </button>
  );
});

const CanonicalFormula = ({ texKey, tex, title, explanation, usage, children, darkMode, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const formulaTex = tex || LATEX_STORE[texKey] || "";

  return (
    <div className={`col-12 rounded-xl border border-[var(--phd-line)] bg-[var(--phd-code-bg)] p-5 shadow-sm transition-all hover:shadow-md ${className}`}>
      <div className="flex justify-between items-start mb-3 gap-4">
        <div className="flex-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--phd-accent)] m-0 mb-1">{title}</h3>
          {children && <div className="text-sm font-medium text-[var(--phd-muted)] leading-relaxed opacity-90">{children}</div>}
        </div>
        <CopyButton text={formulaTex} />
      </div>

      <div className="relative p-3 rounded-lg border border-[var(--phd-line)] bg-[var(--phd-bg)] overflow-x-auto mb-3">
        <KatexRenderer tex={formulaTex} displayMode={true} darkMode={darkMode} />
      </div>

      {(explanation || usage) && (
        <div className="mt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--phd-muted)] hover:text-[var(--phd-accent)] transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp size={12} /> Hide Analysis Protocol
              </>
            ) : (
              <>
                <ChevronDown size={12} /> Show Analysis Protocol
              </>
            )}
          </button>

          <div
            className={`grid transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-3 pb-2' : 'grid-rows-[0fr] opacity-0'}`}
          >
            <div className="min-h-0 space-y-3 px-3 py-3 border-l-2 border-[var(--phd-accent)] bg-[var(--phd-bg)]/50 rounded-r-lg">
              {explanation && (
                <div>
                  <h4 className="text-[10px] font-black uppercase text-[var(--phd-accent)] mb-1 opacity-70">Theoretical Basis</h4>
                  <p className="text-xs text-[var(--phd-muted)] leading-relaxed">{explanation}</p>
                </div>
              )}
              {usage && (
                <div>
                  <h4 className="text-[10px] font-black uppercase text-[var(--phd-accent)] mb-1 opacity-70">Application Strategy</h4>
                  <p className="text-xs text-[var(--phd-muted)] leading-relaxed">{usage}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ MOVED HERE: SportCard depends on CanonicalFormula, which must be defined first.
const SportCard = memo(function SportCard({ sport, icon, title, color, formulas, darkMode }) {
  const cls = getSportCardClasses(sport, darkMode);

  return (
    <div className={`card sport-card-${color} transition-colors duration-300 ${cls.card}`}>
      <div className="sport-card-header">
        <span className="sport-icon">{icon}</span>
        <h3 className={`sport-title ${cls.title}`}>{title}</h3>
      </div>
      <div className="space-y-4">
        {formulas.map((f, i) => (
          <CanonicalFormula
            key={`${sport}-${i}-${f.title}`}
            title={f.title}
            tex={f.tex}
            explanation={f.explanation}
            usage={f.usage}
            darkMode={darkMode}
          >
            {f.desc}
          </CanonicalFormula>
        ))}
      </div>
    </div>
  );
});

export default function HowItWorksPage({ onBack, darkMode, setDarkMode }) {
  const [activeTab, setActiveTab] = useState("workflow");
  const [protocolCopied, setProtocolCopied] = useState(false);
  const protocolTimerRef = useRef(null);

  const safeDarkMode = Boolean(darkMode);
  const canToggle = typeof setDarkMode === "function";

  // Cleanup protocol timer on unmount
  useEffect(() => {
    return () => {
      if (protocolTimerRef.current) window.clearTimeout(protocolTimerRef.current);
    };
  }, []);

  const gridStyle = useMemo(
    () => ({
      backgroundImage: safeDarkMode
        ? "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)"
        : "radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)",
      backgroundSize: "40px 40px",
    }),
    [safeDarkMode]
  );

  const tabs = useMemo(
    () => [
      { id: "workflow", label: "Workflow", icon: Rocket },
      { id: "api_keys", label: "Terminals", icon: Zap },
      { id: "math_lab", label: "PhD Research Lab", icon: Sigma },
    ],
    []
  );

  const agents = useMemo(
    () => [
      {
        icon: Eye,
        title: "Vision Parser (GPT-5.2)",
        desc: "Extracts sport, teams, odds, market type, and lines (spread/total) from screenshots; outputs structured inputs for downstream reasoning.",
      },
      {
        icon: Search,
        title: "Data Crawler (Perplexity)",
        desc: "Retrieval layer gathers injuries, xG/shot-quality, pace/efficiency, matchup stats, and credible news signals with source-aware skepticism.",
      },
      {
        icon: Activity,
        title: "Soft-Factor Ingest",
        desc: "Captures context: lineup uncertainty, travel/schedule load, motivation proxies, and late constraints, with guardrails against low-quality rumors.",
      },
      {
        icon: BrainCircuit,
        title: "Stochastic Engine",
        desc: "Builds posterior distributions per sport/market; evaluates EV, fractional Kelly sizing, and tail-risk controls (CVaR), under explicit realism constraints.",
      },
    ],
    []
  );

  const handleToggleDark = useCallback(() => {
    if (!canToggle) return;
    setDarkMode(!safeDarkMode);
  }, [canToggle, safeDarkMode, setDarkMode]);

  const handleBack = useCallback(() => {
    if (typeof onBack === "function") onBack();
  }, [onBack]);

  const handleCopyProtocol = useCallback(async () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const chunks = [];
    chunks.push(`# PHD BETTING INTELLIGENCE - MATHEMATICAL PROTOCOL`);
    chunks.push(`Generated: ${timestamp}\n`);
    chunks.push(`## I. GLOSSARY OF SYMBOLS`);
    chunks.push(...GLOSSARY.map(g => `- ${g.symbol}: ${g.def}`));
    chunks.push(``);
    chunks.push(`## II. CORE OPTIMIZATION ENGINE`);
    [CALIBRATION_FORMULA, OPTIMIZATION_FORMULA, MULTI_MARKET_FORMULA].forEach(f => {
      chunks.push(`### ${f.title}`);
      chunks.push(`> ${f.desc}`);
      chunks.push(`\n$$ ${f.tex.trim()} $$\n`);
    });
    chunks.push(`## III. SPORT-SPECIFIC MODELS`);
    Object.entries(SPORT_FORMULAS).forEach(([sport, forms]) => {
      chunks.push(`### ${sport.toUpperCase()}`);
      forms.forEach(f => {
        chunks.push(`#### ${f.title}`);
        chunks.push(`> ${f.desc}`);
        chunks.push(`\n$$ ${f.tex.trim()} $$\n`);
      });
    });
    chunks.push(`## IV. APPENDIX`);
    APPENDIX_FORMULAS.forEach(f => {
      chunks.push(`### ${f.title}`);
      chunks.push(`> ${f.desc}`);
      chunks.push(`\n$$ ${f.tex.trim()} $$\n`);
    });

    const text = chunks.join('\n');
    const ok = await copyToClipboard(text);
    if (!ok) return;

    setProtocolCopied(true);
    if (protocolTimerRef.current) window.clearTimeout(protocolTimerRef.current);
    protocolTimerRef.current = window.setTimeout(() => setProtocolCopied(false), 2000);
  }, []);

  return (
    <div
      className={`min-h-screen p-8 font-sans transition-colors duration-500 bg-app text-primary`}
      style={activeTab === "math_lab" ? gridStyle : undefined}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <button
            onClick={handleBack}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95 bg-panel text-secondary border border-subtle hover:bg-subtle`}
            type="button"
          >
            <ArrowLeft size={18} />
            Exit Lab
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleCopyProtocol}
              className={`p-4 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center gap-2 font-bold ${safeDarkMode
                ? "bg-slate-800 text-emerald-400 border border-slate-700 hover:bg-slate-700"
                : "bg-white text-emerald-600 border border-slate-100 hover:bg-slate-50"
                }`}
              title="Copy Full Mathematical Protocol"
            >
              {protocolCopied ? <Check size={20} /> : <Copy size={20} />}
              <span className="hidden md:inline text-sm">Save Protocol</span>
            </button>

            <button
              onClick={handleToggleDark}
              disabled={!canToggle}
              className={`p-4 rounded-2xl transition-all shadow-lg active:scale-95 ${safeDarkMode
                ? "bg-slate-900 hover:bg-slate-800 text-yellow-400 border border-slate-800"
                : "bg-white hover:bg-slate-50 text-blue-600 border-2 border-slate-100"
                } ${!canToggle ? "opacity-50 cursor-not-allowed" : ""}`}
              aria-label="Toggle dark mode"
              type="button"
            >
              {safeDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex justify-center mb-16 px-2">
          <div
            className={`flex p-1.5 rounded-3xl border-2 transition-all ${safeDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200 shadow-lg"
              }`}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 md:px-8 md:py-4 rounded-2xl font-black transition-all whitespace-nowrap text-xs md:text-base ${activeTab === tab.id
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xl scale-105"
                  : safeDarkMode
                    ? "text-slate-500 hover:text-slate-300"
                    : "text-slate-400 hover:text-slate-600"
                  }`}
                type="button"
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="transition-all duration-500">
          {/* WORKFLOW TAB */}
          {activeTab === "workflow" && (
            <div className="space-y-12 max-w-5xl mx-auto">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-extrabold tracking-tight">Multi-Agent Intelligence Matrix</h2>
                <p className={`${safeDarkMode ? "text-slate-400" : "text-slate-500"} font-medium`}>
                  Four specialized modules operating in sequence with auditability and risk controls.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 pt-8">
                {agents.map((a, i) => (
                  <div
                    key={i}
                    className={`p-8 rounded-3xl border-2 transition-all hover:scale-[1.02] ${safeDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl"
                      }`}
                  >
                    <div className={`inline-flex p-4 rounded-2xl mb-6 ${safeDarkMode ? "bg-slate-800" : "bg-slate-50"}`}>
                      <a.icon size={32} className={safeDarkMode ? "text-cyan-400" : "text-blue-600"} />
                    </div>
                    <h3 className="text-xl font-black mb-4 tracking-tight">{a.title}</h3>
                    <p className={`${safeDarkMode ? "text-slate-400" : "text-slate-500"} leading-relaxed text-sm font-medium`}>
                      {a.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API KEYS TAB */}
          {activeTab === "api_keys" && (
            <div className="space-y-12 max-w-4xl mx-auto">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-extrabold tracking-tight">Infrastructure Terminals</h2>
                <p className={`${safeDarkMode ? "text-slate-400" : "text-slate-500"} font-medium`}>
                  Keys are stored locally in your browser only.
                </p>
              </div>

              <div className="grid gap-6">
                {[
                  {
                    name: "OpenAI (Vision + Reasoning)",
                    link: "https://platform.openai.com/api-keys",
                    role: "Vision parsing + stochastic synthesis",
                  },
                  {
                    name: "Perplexity (Sonar)",
                    link: "https://docs.perplexity.ai/guides/getting-started",
                    role: "Real-time retrieval and statistics",
                  },
                ].map((api, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-8 rounded-3xl border-2 transition-all ${safeDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100 shadow-xl"
                      }`}
                  >
                    <div className="space-y-1">
                      <h4 className="font-black text-xl tracking-tight">{api.name}</h4>
                      <p className={`${safeDarkMode ? "text-slate-400" : "text-slate-500"} text-sm font-medium`}>
                        {api.role}
                      </p>
                    </div>
                    <a
                      href={api.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black flex items-center gap-2 shadow-lg transition-all active:scale-95"
                    >
                      Link Terminal <ExternalLink size={16} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MATH LAB TAB */}
          {activeTab === "math_lab" && (
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
                  --accent-gold: #fbbf24;
                  
                  background: radial-gradient(1200px 600px at 20% -10%, rgba(53,199,255,0.1), transparent 60%),
                              radial-gradient(900px 500px at 90% 0%, rgba(106,123,255,0.1), transparent 55%),
                              var(--phd-bg);
                }

                                /* LIGHT MODE (Academic Whitepaper) */
                .phd-lab-theme.theme-light {
                  --phd-bg: #f8fafc;
                  --phd-text: #0f172a;
                  --phd-muted: #475569;
                  --phd-card-bg: linear-gradient(180deg, #ffffff, #f8fafc); /* Subtler gradient */
                  --phd-card-border: #cbd5e1;
                  --phd-line: #e2e8f0;
                  --phd-accent: #0284c7; /* Adjusted Blue */
                  --phd-code-bg: #ffffff;
                  --phd-btn-bg: rgba(255, 255, 255, 0.5); /* Semi-transparent blending */
                  --phd-btn-border: rgba(0, 0, 0, 0.08); /* Minimal border */
                  --phd-btn-text: #64748b;
                  --accent-gold: #d97706;
                  
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
                
                /* Master Equation - Adaptive Gold (Refined) */
                .master-eq-card {
                  position: relative;
                  overflow: hidden;
                }
                .theme-dark .master-eq-card {
                  background: linear-gradient(180deg, rgba(253, 224, 71, 0.05), rgba(0,0,0,0)); 
                  border: 1px solid rgba(253, 224, 71, 0.2);
                }
                .theme-light .master-eq-card {
                  background: linear-gradient(180deg, #fffbeb, #ffffff);
                  border: 1px solid rgba(217, 119, 6, 0.15);
                  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.05);
                }
                
                .master-eq-title { font-weight: 800; letter-spacing: 0.02em; text-transform: uppercase; }
                .theme-dark .master-eq-title { color: #fefce8; }
                .theme-light .master-eq-title { color: #78350f; }

                .theme-dark .master-eq-subtitle { color: rgba(253, 224, 71, 0.7); }
                .theme-light .master-eq-subtitle { color: rgba(180, 83, 9, 0.8); }

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
                <div className="phd-grid mb-8">
                  <div className="card master-eq-card col-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                      <div>
                        <h2 className="master-eq-title text-xl mb-1.5 flex items-center gap-2">
                          <span className="text-[var(--accent-gold)]">Σ</span> The Master Equation
                        </h2>
                        <p className="master-eq-subtitle text-xs font-bold uppercase tracking-wider opacity-80">Log-Growth (Kelly) − Tail Risk (CVaR) − Transaction Costs</p>
                      </div>
                      <div className="flex-shrink-0">
                        <CopyButton text={LATEX_STORE.M1} label="Copy Master Equation" />
                      </div>
                    </div>
                    <div className={`p-6 rounded-2xl border overflow-x-auto transition-colors shadow-inner ${safeDarkMode
                      ? "bg-black/40 border-[var(--phd-line)]"
                      : "bg-white border-[var(--phd-line)]"
                      }`}>
                      <KatexRenderer tex={LATEX_STORE.M1} displayMode={true} darkMode={safeDarkMode} />
                    </div>
                    <p className="mt-4 text-center text-sm italic font-medium max-w-3xl mx-auto opacity-70" style={{ color: 'var(--phd-muted)' }}>
                      "We do not maximize expected value. We maximize the expected logarithm of wealth, subject to survival constraints (CVaR) and friction costs."
                    </p>
                  </div>
                </div>

                {/* 0) Core Objects */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>0) Notation & Core Objects</h2>
                    <span className="text-xs font-bold uppercase text-[var(--phd-muted)] tracking-wider">Ω → Settlement Atoms</span>
                  </div>
                  <div className="phd-grid">
                    <CanonicalFormula texKey="Z0" title="Settlement-Atomic Space" darkMode={safeDarkMode}>
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
                    <div className="col-12 col-6">
                      <CanonicalFormula texKey="A0" title="Canonical Payout" darkMode={safeDarkMode}>
                        Once mapped to ρ, every downstream object (EV, CVaR, etc.) is identical.
                      </CanonicalFormula>
                    </div>
                    <div className="col-12 col-6">
                      <CanonicalFormula texKey="A1" title="Conversion Table" darkMode={safeDarkMode}>
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
                    <CanonicalFormula texKey="B0" title="General Payout Factor" darkMode={safeDarkMode}>
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
                    <CanonicalFormula texKey="C1" title="Implied Prior Construction" darkMode={safeDarkMode}>
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
                    <CanonicalFormula texKey="D0" title="Portfolio Wealth Factor" darkMode={safeDarkMode}>
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
                    <div className="col-12 col-6">
                      <CanonicalFormula texKey="E1" title="CVaR Primal (Scenario)" darkMode={safeDarkMode}>
                        Optimization-ready form via scenario approximation.
                      </CanonicalFormula>
                    </div>
                    <div className="col-12 col-6">
                      <CanonicalFormula texKey="E2" title="CVaR Dual Form" darkMode={safeDarkMode}>
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
                    <CanonicalFormula texKey="F1" title="Posterior Shrinkage" darkMode={safeDarkMode}>
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
                    <CanonicalFormula texKey="G1" title="Two Clean Choices" darkMode={safeDarkMode}>
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
                    <div className="col-12 col-6">
                      <CanonicalFormula texKey="H1" title="Latent Factors + Copulas" darkMode={safeDarkMode}>
                        Latent factors are most defensible for discrete spaces.
                      </CanonicalFormula>
                    </div>
                    <div className="col-12 col-6">
                      <CanonicalFormula texKey="H2" title="Copula Menu" darkMode={safeDarkMode}>
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
                    {Object.entries(SPORT_FORMULAS).map(([sport, formulas]) => {
                      const meta = SPORT_META[sport] || { icon: "📊", title: sport.toUpperCase(), color: "cyan" };

                      return (
                        <SportCard
                          key={sport}
                          sport={sport}
                          icon={meta.icon}
                          title={meta.title}
                          color={meta.color}
                          formulas={formulas}
                          darkMode={safeDarkMode}
                        />
                      );
                    })}
                  </div>

                </section>

                {/* J) Advanced Theory */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2>J) Upper-Tier Theory</h2>
                    <span className="text-xs font-bold uppercase text-[var(--phd-muted)] tracking-wider">PAC-Bayes & DV</span>
                  </div>
                  <div className="phd-grid">
                    <div className="col-12 col-6">
                      <CanonicalFormula texKey="J1" title="Donsker-Varadhan" darkMode={safeDarkMode}>
                        Explicit integrability condition tied to log-domain safety.
                      </CanonicalFormula>
                    </div>
                    <div className="col-12 col-6">
                      <CanonicalFormula texKey="J2" title="PAC-Bayes Bounded Loss" darkMode={safeDarkMode}>
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
          )
          }
        </div >
      </div >
    </div >
  );
}
