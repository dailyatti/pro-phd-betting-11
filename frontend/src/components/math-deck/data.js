export const SPORT_META = {
    overview: {
        label: "Overview",
        icon: "🧬",
        colorVar: "--c-overview",
        description: "Master objective: robust log-growth + coherent tail risk + KL-ball robustness under joint dependence. The unified framework that ties every sport-specific model into a single optimization program.",
    },
    core: {
        label: "Core Lab",
        icon: "🧠",
        colorVar: "--c-core",
        description: "Atomic outcomes, settlement maps, feasibility constraints, calibration, market priors, and de-vigging. The mathematical foundation shared by all sport modules.",
    },
    soccer: {
        label: "Soccer",
        icon: "⚽",
        colorVar: "--c-soccer",
        description: "Bivariate Poisson grids, Dixon–Coles local dependence, xG-based shrinkage, hierarchical attack/defense priors, and market-consistent derivatives.",
    },
    basketball: {
        label: "Basketball",
        icon: "🏀",
        colorVar: "--c-basketball",
        description: "Possession-based scoring, pace/efficiency decomposition, Normal spread/total approximations, endgame bridge-limits, and quarter-level correlations.",
    },
    tennis: {
        label: "Tennis",
        icon: "🎾",
        colorVar: "--c-tennis",
        description: "Point → game → set → match hierarchy, exact deuce series, tiebreak recursion, surface-weighted skill priors, and serve/return interaction models.",
    },
    nfl: {
        label: "NFL",
        icon: "🏈",
        colorVar: "--c-nfl",
        description: "Drive-based compound Poisson scoring, discrete scoring atoms {2,3,6,7,8}, FFT-based convolution for spreads, and key-number multi-modality.",
    },
    hockey: {
        label: "Hockey",
        icon: "🏒",
        colorVar: "--c-hockey",
        description: "Goal intensities with goalie GSAx, shot-quality mixtures, regulation/OT/SO decomposition, and empty-net volatility spikes.",
    },
    baseball: {
        label: "Baseball",
        icon: "⚾",
        colorVar: "--c-baseball",
        description: "Overdispersed run scoring (Negative Binomial), park factors, pitcher random-effect shrinkage, bullpen fatigue, and runline/total coherence.",
    },
    combat: {
        label: "Boxing/UFC",
        icon: "🥊",
        colorVar: "--c-combat",
        description: "KO hazard functions with fatigue-dependent intensity, judges' covariance matrix, round-level survival analysis, and method-of-victory pricing.",
    },
    advanced: {
        label: "Advanced",
        icon: "🧿",
        colorVar: "--c-advanced",
        description: "Kusuoka risk representation, PAC-Bayes generalization bounds, Donsker–Varadhan duality, copula tail dependence, and uncertainty quantification.",
    },
};

export const TAG_LABELS = {
    all: "All Formulas",
    poisson: "Poisson",
    normal: "Normal/Gauss",
    markov: "Markov Chain",
    logistic: "Logistic/WinLog",
    kelly: "Kelly Criterion",
    control: "Tail Control",
    cvar: "CVaR / ES",
    kusuoka: "Kusuoka",
    pacbayes: "PAC-Bayes",
    kl: "KL-Divergence",
    copula: "Copula / Tails",
    dro: "Distributional Robust",
    constraints: "Constraints",
    market: "Market",
    returns: "Returns",
    prior: "Prior",
    calibration: "Calibration",
    shrinkage: "Shrinkage",
    survival: "Survival",
    hazard: "Hazard",
};

export const FORMULAS = [

// ====================== OVERVIEW ======================
{
    id: "Ω-01",
    sport: "overview",
    title: "Master Objective — Nominal Log-Growth with Tail Risk and Friction",
    badges: ["reviewer-proof constraints", "joint-risk evaluation"],
    tags: ["kelly", "cvar", "constraints", "kl", "dro", "market", "returns", "prior"],
    latex: String.raw`\boxed{\begin{aligned}
s^{*}(x) \;\in\; \arg\max_{s\in\mathcal{S}_\varepsilon}\Bigg\{
&\;\mathbb{E}_{P_{\theta}}\!\bigl[\log W_{+}(\omega;\,s)\bigr]
  -\gamma\cdot\mathrm{CVaR}_{\alpha}^{P_{\theta}}\!\bigl(L_s(\omega)\bigr)
  -c\,\|s\|_1
\Bigg\}
\\[6pt]
\text{where:}\quad
& L_s(\omega)=-\log\bigl(W_{+}(\omega;\,s)\bigr), \quad W_{+}\ge\varepsilon>0.
\\[4pt]
\text{Feasible set:}\quad
&\mathcal{S}_\varepsilon=\Bigl\{s\in\mathbb{R}_{+}^{J}:\;\mathbf{1}^{\!\top}s\le s_{\max},\; W_{+}(\omega;\,s)\ge\varepsilon\;\;P_\theta\text{-a.s.}\Bigr\}.
\end{aligned}}`,
    explanation: String.raw`The canonical log-growth optimization under coherent tail-risk constraints. Expected value and CVaR are computed under the predictive posterior measure \(P_\theta\), subject to the wealth remaining \(P_\theta\)-almost surely strictly positive (\(\varepsilon\)-floor). The parameter \(\gamma\) governs risk-aversion intensity, while the \(c\|s\|_1\) term models transaction costs and diversification penalty via L1 regularization.`,
    notes: [
        String.raw`The wealth floor \(\varepsilon > 0\) is mandatory for existence of log-moments and well-definedness of the CVaR objective (see Ω-02, Condition B).`,
        String.raw`CVaR is applied to the loss \(L_s = -\log(W)\), quantifying the left tail of the log-wealth distribution.`,
        String.raw`Robustness enters by replacing \(\mathbb{E}[\cdot]\) with \(\inf_Q \mathbb{E}_Q[\cdot]\) over a KL-ball (see Ω-03).`,
        String.raw`When \(\gamma=0\), this reduces to the pure Kelly criterion. As \(\gamma\to\infty\), the solution converges to the minimum-risk portfolio.`,
        String.raw`The L1 penalty \(c\|s\|_1\) automatically yields sparse allocation — capital is deployed only on high-value bets.`,
    ],
    usage: String.raw`Given 10 betting opportunities with market odds and model probabilities, the solver finds the optimal allocation \(s^*\) that maximizes long-run capital growth while constraining losses at the 5% CVaR level.`,
    exampleTitle: "Optimal Allocation — 3 Bets Portfolio",
    exampleContext: "A bettor has bankroll $1000 and identifies 3 value bets. Model estimates edge on each; we solve for optimal stakes under CVaR constraint.",
    exampleInputs: [
        { name: "Bet A (Home Win)", value: "p=0.58, odds=2.10", note: "Edge: 0.58×2.10−1 = 21.8%" },
        { name: "Bet B (Over 2.5)", value: "p=0.62, odds=1.85", note: "Edge: 0.62×1.85−1 = 14.7%" },
        { name: "Bet C (BTTS)", value: "p=0.55, odds=2.00", note: "Edge: 0.55×2.00−1 = 10.0%" },
        { name: "Risk params", value: "γ=0.5, α=0.95, c=0.01", note: "Moderate risk aversion" },
    ],
    exampleLatex: String.raw`s^* = \arg\max_{s\ge 0}\left\{\sum_\omega P(\omega)\log(1+s^\top R(\omega)) - 0.5\cdot\mathrm{CVaR}_{0.95}(L_s) - 0.01\|s\|_1\right\}`,
    exampleSteps: [
        "Enumerate all 8 joint outcomes (2³ combinations of win/loss for A, B, C).",
        "For each outcome ω, compute net return: R(ω) = Σ sⱼ·(oⱼ·𝟙[win_j] − 1).",
        "Compute log-wealth: log(1 + s⊤R(ω)) for each outcome under model P.",
        "Evaluate CVaR₀.₉₅ of the loss distribution via the Rockafellar–Uryasev formula.",
        "Solve the convex program numerically (e.g., scipy.optimize.minimize).",
        "Result: s* ≈ (0.082, 0.065, 0.038) — allocate 8.2%, 6.5%, 3.8% of bankroll.",
    ],
    exampleInterpretation: "The solver allocates more to Bet A (highest edge) and less to Bet C (lowest edge). The CVaR constraint prevents overconcentration. Total exposure: 18.5% of bankroll — well below Kelly full-stake.",
},
{
    id: "Ω-02",
    sport: "overview",
    title: "Existence and Regularity Conditions",
    badges: ["existence conditions", "DV/KL dual admissibility"],
    tags: ["constraints", "dro", "kl", "returns"],
    latex: String.raw`\boxed{\begin{aligned}
\textbf{(A) Essential Positivity:}\quad & W_{+}(\omega;\,s)\ge\varepsilon>0\;\;P_0\text{-a.s.}\;\;\forall\,s\in\mathcal{S}_\varepsilon.\\[4pt]
\textbf{(B) Exponential Integrability:}\quad &\exists\,\lambda_0>0:\;\mathbb{E}_{P_0}\!\Bigl[W_{+}(\omega;\,s)^{1/\lambda_0}\Bigr]<\infty.\\[4pt]
\textbf{(C) Compactness:}\quad &\mathcal{S}_\varepsilon\neq\emptyset\;\text{ is a convex, compact subset of }\mathbb{R}_{+}^{J}.\\[6pt]
\Longrightarrow\quad &\text{A maximizer }s^{*}\text{ exists, and }\mathbb{E}[\log W_{+}]\text{ is finite.}
\end{aligned}}`,
    explanation: String.raw`Sufficient regularity conditions: (A) avoids log-singularities (\(\log 0 = -\infty\)), (B) ensures the Donsker–Varadhan dual is well-defined (for \(f = \log W_+\), the MGF condition becomes \(\mathbb{E}[W_+^{1/\lambda}] < \infty\)), and (C) guarantees existence of a maximizer via the Weierstrass extreme value theorem.`,
    notes: [
        String.raw`Condition (B) holds automatically whenever \(W_+\) is bounded — guaranteed under finite odds and finite \(s_{\max}\).`,
        String.raw`For KL-DRO with \(f = \log W_+\): \(\exp(f/\lambda) = W_+^{1/\lambda}\), so (B) is the precise DV requirement.`,
        String.raw`Compactness (C) follows in practice from the constraints \(\mathbf{1}^\top s \le s_{\max}\) and \(s \ge 0\).`,
    ],
},
{
    id: "Ω-03",
    sport: "overview",
    title: "Donsker–Varadhan Dual — Robust Expectation on KL-Ball",
    badges: ["KL-ball", "robust expectation dual"],
    tags: ["dro", "kl", "market", "prior"],
    latex: String.raw`\boxed{\begin{aligned}
&\sup_{Q:\,\mathrm{KL}(Q\|P_0)\le\delta}\;\mathbb{E}_Q\!\bigl[f(\omega)\bigr]
\;=\;\inf_{\lambda>0}\Bigl\{\lambda\delta+\lambda\log\mathbb{E}_{P_0}\!\bigl[e^{f(\omega)/\lambda}\bigr]\Bigr\}
\\[6pt]
&\text{Optimal measure:}\quad dQ_{\lambda}^{*}(\omega)=\frac{e^{f(\omega)/\lambda}}{\mathbb{E}_{P_0}\!\bigl[e^{f/\lambda}\bigr]}\,dP_0(\omega).
\\[4pt]
&\text{Condition:}\quad\mathbb{E}_{P_0}\!\bigl[e^{f(\omega)/\lambda}\bigr]<\infty\quad\forall\,\lambda>0.
\end{aligned}}`,
    explanation: String.raw`The mathematically precise dual formulation for Distributionally Robust Optimization (DRO). The dual converts an infinite-dimensional optimization (over \(Q\)) into a univariate convex optimization (over \(\lambda\)). The parameter \(\delta\) controls ambiguity set size: larger \(\delta\) = more conservative strategy.`,
    notes: [
        String.raw`For robust Kelly (worst-case utility): use \(\inf_{Q}\mathbb{E}_Q[\log W_+] = -\sup_Q \mathbb{E}_Q[-\log W_+]\), so the dual applies with \(f = -\log W_+\) (loss).`,
        String.raw`\(P_0\) is the nominal (reference) model. \(Q^*\) places more mass on adverse outcomes (worst-case tilting).`,
        String.raw`Dual validity requires \(f\) to be exponentially integrable under \(P_0\) (cf. condition (B) in \(\Omega\)-02).`,
        String.raw`As \(\delta \to 0\), we recover the nominal \(\mathbb{E}_{P_0}[f]\). As \(\delta \to \infty\), the worst-case outcome dominates.`,
    ],
    usage: String.raw`Example: If our model estimates 55% win probability but we apply a robustness radius of \(\delta=0.05\), the DRO automatically reduces allocation as if the true probability were ~51–52%.`,
    exampleTitle: "Robust Expected Value — Binary Bet",
    exampleContext: "Model says P(win)=0.60 at odds 2.00. We compute the worst-case expected log-return over a KL-ball of radius δ=0.10.",
    exampleInputs: [
        { name: "P₀(win)", value: "0.60", note: "Nominal model probability" },
        { name: "P₀(loss)", value: "0.40" },
        { name: "δ (KL radius)", value: "0.10", note: "Ambiguity set size" },
        { name: "f(win)", value: "log(1+0.10×1.00)=0.0953", note: "10% stake, odds 2.00" },
        { name: "f(loss)", value: "log(1−0.10)=−0.1054", note: "10% stake lost" },
    ],
    exampleLatex: String.raw`\inf_{\lambda>0}\left\{\lambda\cdot 0.10 + \lambda\log\left(0.60\cdot e^{0.0953/\lambda} + 0.40\cdot e^{-0.1054/\lambda}\right)\right\}`,
    exampleSteps: [
        "Define f(ω): f(win) = log(1.10) = 0.0953, f(loss) = log(0.90) = −0.1054.",
        "Nominal: E_{P₀}[f] = 0.60×0.0953 + 0.40×(−0.1054) = 0.0572 − 0.0422 = 0.0150.",
        "Write the dual: g(λ) = λδ + λ·log(E[exp(f/λ)]).",
        "Compute E[exp(f/λ)] = 0.60·exp(0.0953/λ) + 0.40·exp(−0.1054/λ).",
        "Minimize g(λ) numerically. Optimal λ* ≈ 0.18. Worst-case: g(λ*) ≈ 0.0052.",
        "The worst-case Q* tilts: Q*(win) ≈ 0.54, Q*(loss) ≈ 0.46.",
    ],
    exampleInterpretation: "The robust expected log-return drops from 0.0150 (nominal) to 0.0052 (worst-case) — a 65% reduction. The worst-case measure shifts win probability from 60% to ~54%. The bet remains positive-EV even under worst-case, confirming genuine value.",
},
{
    id: "Ω-04",
    sport: "overview",
    title: "Wealth Process Dynamics — Multiplicative Growth",
    badges: ["multiplicative", "sequential"],
    tags: ["kelly", "returns"],
    latex: String.raw`\boxed{\begin{aligned}
&W_n = W_0 \prod_{t=1}^{n}\bigl(1 + s_t^{\top} R_t(\omega_t)\bigr), \quad W_0 > 0.
\\[6pt]
&\log W_n = \log W_0 + \sum_{t=1}^{n}\log\bigl(1 + s_t^{\top} R_t(\omega_t)\bigr).
\\[4pt]
&\frac{1}{n}\log\frac{W_n}{W_0}\;\xrightarrow{\;n\to\infty\;}\;\mathbb{E}\!\bigl[\log(1 + s^{\top}R)\bigr] \quad\text{(a.s., under ergodicity).}
\end{aligned}}`,
    explanation: "The multiplicative dynamics of wealth. Log-wealth is additive, so the Strong Law of Large Numbers applies: the long-run growth rate converges almost surely to the expected log-return. This is the theoretical foundation of the Kelly criterion — maximizing log-utility is equivalent to maximizing long-run growth rate.",
    notes: [
        String.raw`Multiplicative vs. additive: A -50% loss followed by +50% gain does not restore wealth (\(0.5 \times 1.5 = 0.75\)).`,
        "The ergodicity/i.i.d. assumption is an idealization: real betting sequences are non-stationary. This serves as theoretical motivation, not a strict theorem for practice.",
        String.raw`Kelly optimality theorem: No other strategy grows faster in the long run, \(P\)-a.s., under the i.i.d. assumption.`,
    ],
    exampleTitle: "Growth Rate — 100 Bets Simulation",
    exampleContext: "A bettor places 100 sequential bets at odds 2.00 with true P(win)=0.55, staking 5% of bankroll each time.",
    exampleInputs: [
        { name: "W₀", value: "$1,000", note: "Initial bankroll" },
        { name: "P(win)", value: "0.55" },
        { name: "Odds", value: "2.00", note: "Net return on win: +1.00" },
        { name: "Stake fraction", value: "0.05", note: "5% of current bankroll" },
    ],
    exampleLatex: String.raw`\frac{1}{100}\log\frac{W_{100}}{W_0} \approx \mathbb{E}[\log(1+0.05\cdot R)] = 0.55\log(1.05)+0.45\log(0.95) = 0.00375`,
    exampleSteps: [
        "Per-bet log-return: win → log(1.05) = 0.04879, loss → log(0.95) = −0.05129.",
        "Expected log-return per bet: 0.55×0.04879 + 0.45×(−0.05129) = 0.02684 − 0.02308 = 0.00375.",
        "After 100 bets: E[log(W₁₀₀/W₀)] = 100 × 0.00375 = 0.375.",
        "Expected final wealth: W₀ × exp(0.375) = $1000 × 1.455 = $1,455.",
        "Compare: additive expectation = 1000 + 100×(0.55×50 − 0.45×50) = $1,500 (misleading!).",
    ],
    exampleInterpretation: "The multiplicative growth rate is +0.375% per bet. The expected geometric growth ($1,455) is slightly less than the arithmetic expectation ($1,500) — this gap is the cost of volatility. With larger stakes (e.g., 20%), the gap widens dramatically, which is why Kelly sizing matters.",
},

// ====================== CORE ======================
{
    id: "C-01",
    sport: "core",
    title: "Outcome Space, Settlement Map, and Net Returns",
    badges: ["atomic space", "settlement mapping"],
    tags: ["returns", "market"],
    latex: String.raw`\boxed{\begin{aligned}
&\omega\in\Omega\quad\text{(Discrete sample space: outcome permutations)}.\\[4pt]
&g_b:\Omega\to[0,\,o_b]\quad\text{(Settlement map for the }b\text{-th instrument)}.\\[4pt]
&R_b(\omega)=g_b(\omega)-1,\quad W_{+}(\omega;\,s)=1+s^{\top}R(\omega).\\[4pt]
&R_b(\omega)\in\bigl\{-1,\;0,\;\tfrac{1}{2}(o_b{-}1),\;o_b{-}1\bigr\}\quad\text{(loss / push / half-win / win)}.
\end{aligned}}`,
    explanation: String.raw`Coherent mapping from the physical outcome space (\(\Omega\)) to net returns. Each instrument \(b\) maps outcomes to returns: loss (\(R_b=-1\)), push/void (\(R_b=0\)), half-win (\(R_b=\tfrac{1}{2}(o_b-1)\)), or full win (\(R_b=o_b-1\)). The wealth function \(W_+(\omega;s)\) always carries the explicit \(\omega\) dependence.`,
    notes: [
        String.raw`Decimal odds \(o_b\): The bettor receives \(o_b\) per unit stake upon winning (including returned stake).`,
        String.raw`Push: \(R_b = 0\), so wealth is unchanged — distinct from a loss (\(R_b = -1\)) and a win (\(R_b = o_b - 1\)).`,
        String.raw`Asian handicap half-lines (e.g. -0.25): \(g_b\) is a linear interpolation between adjacent whole lines.`,
    ],
},
{
    id: "C-02",
    sport: "core",
    title: "Market De-Vig — Simplex Projections",
    badges: ["market normalization", "overround removal"],
    tags: ["market", "prior"],
    latex: String.raw`\boxed{\begin{aligned}
&\text{Raw implied probabilities: }\;\hat{\pi}_k = \frac{1}{o_k},\quad\sum_{k=1}^{K}\hat{\pi}_k = 1 + \nu\quad(\nu > 0\text{ overround}).\\[6pt]
&\textbf{Proportional (basic):}\quad\pi_k^{\text{prop}} = \frac{1/o_k}{\sum_{j=1}^{K}1/o_j}\;\in\;\Delta^{K-1}.\\[6pt]
&\textbf{Power Method:}\quad\pi_k^{\text{pow}} = \frac{(1/o_k)^{p}}{\sum_{j=1}^{K}(1/o_j)^{p}},\quad 0 < p < 1\;\text{(flattening)}.\\[6pt]
&\textbf{Shin Model:}\quad\pi_k^{\text{shin}} = \frac{\sqrt{z^2 + 4(1-z)\hat{\pi}_k^2/(1+\nu)} - z}{2(1-z)},\quad z\text{ from }\sum_k\pi_k^{\text{shin}}(z)=1.
\end{aligned}}`,
    explanation: String.raw`Three methods for removing market overround. The proportional method distributes the vig uniformly. The Power Method uses \(0 < p < 1\) which flattens the distribution — longshots receive less vig reduction than favorites, correcting the well-documented favorite-longshot bias. The Shin model assumes the overround partially originates from insider trading; the insider fraction \(z\) is estimated by solving the implicit normalization constraint \(\sum_k \pi_k(z) = 1\).`,
    notes: [
        String.raw`The overround \(\nu\) is typically 2–8% on main markets and 10–20% on prop bets.`,
        String.raw`Shin model: The insider fraction \(z\) is typically 1–5% in major leagues.`,
        String.raw`All three methods ensure \(\sum \pi_k = 1\) (simplex projection).`,
        String.raw`Example: If odds are 1.90/1.90 (50/50 market), overround \(= 2 \times 1/1.90 - 1 \approx 5.26\%\).`,
    ],
    usage: String.raw`Given odds: Home 2.10, Draw 3.40, Away 3.60. Raw: \(1/2.10 + 1/3.40 + 1/3.60 = 0.476 + 0.294 + 0.278 = 1.048\). Overround: 4.8%. Proportional de-vig: Home = 0.476/1.048 = 45.4%, Draw = 28.1%, Away = 26.5%.`,
    exampleTitle: "Three-Way De-Vig — Premier League Match",
    exampleContext: "Manchester City vs Arsenal. Bookmaker offers: Home 1.72, Draw 3.80, Away 4.75. Compare all three de-vig methods.",
    exampleInputs: [
        { name: "Home odds", value: "1.72", note: "π̂_H = 1/1.72 = 0.5814" },
        { name: "Draw odds", value: "3.80", note: "π̂_D = 1/3.80 = 0.2632" },
        { name: "Away odds", value: "4.75", note: "π̂_A = 1/4.75 = 0.2105" },
        { name: "Overround", value: "ν = 1.0551 − 1 = 5.51%", note: "Sum of raw implied probs" },
    ],
    exampleLatex: String.raw`\pi_H^{\text{prop}} = \frac{0.5814}{1.0551} = 0.5511,\quad \pi_D^{\text{prop}} = \frac{0.2632}{1.0551} = 0.2494,\quad \pi_A^{\text{prop}} = \frac{0.2105}{1.0551} = 0.1995`,
    exampleSteps: [
        "Raw implied: π̂ = (0.5814, 0.2632, 0.2105). Sum = 1.0551.",
        "Proportional: divide each by 1.0551 → (0.551, 0.249, 0.200). Sum = 1.000 ✓",
        "Power (p=1.12): (0.5814^1.12, 0.2632^1.12, 0.2105^1.12) / Z → (0.557, 0.246, 0.197).",
        "Shin (z=0.03): Solve Shin equation for each → (0.554, 0.248, 0.198).",
        "Differences are small for balanced markets but grow for longshot props.",
    ],
    exampleInterpretation: "All three methods agree to within ~1% for this balanced market. The Power and Shin methods give slightly lower longshot probabilities (Away), correcting for the favorite-longshot bias inherent in bookmaker pricing.",
},
{
    id: "C-03",
    sport: "core",
    title: "KL Regularization and Prior Support",
    badges: ["prior grounding", "entropy anchoring"],
    tags: ["prior", "market", "kl"],
    latex: String.raw`\boxed{\begin{aligned}
&Q(\cdot\mid o) = \text{Market projections (de-vigged)},\quad P_\theta(\cdot\mid x)\ll Q(\cdot\mid o).\\[4pt]
&\text{Objective: }\mathrm{KL}(P_\theta\|Q) = \sum_{\omega\in\Omega}P_\theta(\omega)\log\frac{P_\theta(\omega)}{Q(\omega)}.\\[6pt]
&\text{Unconstrained gradient: }\frac{\partial\mathrm{KL}}{\partial P_\theta(\omega)} = \log\frac{P_\theta(\omega)}{Q(\omega)} + 1\quad\text{(+Lagrange multiplier on simplex)}.\\[4pt]
&\mathrm{KL}(P_\theta\|Q) \ge 0,\quad\text{equality }\iff P_\theta = Q.
\end{aligned}}`,
    explanation: String.raw`Anchors the model to market consensus. The absolute continuity condition \(P_\theta \ll Q\) (i.e., \(P_\theta\) has no support where \(Q=0\)) prevents arbitrage spikes from infinitesimally small probabilities. The \(\lambda \cdot \mathrm{KL}\) regularization ensures the model only deviates from market consensus when features (\(x\)) provide significant log-likelihood evidence.`,
    notes: [
        String.raw`In practice, \(Q\) is \(\varepsilon\)-smoothed for full-support guarantee and KL numerical stability.`,
        String.raw`As \(\lambda \to \infty\), \(P_\theta \to Q\) (full market conformity). When \(\lambda = 0\), no market anchor.`,
        String.raw`KL is not symmetric: \(\mathrm{KL}(P\|Q) \neq \mathrm{KL}(Q\|P)\). The \(\mathrm{KL}(P\|Q)\) form is 'mode-seeking'.`,
    ],
},
{
    id: "C-04",
    sport: "core",
    title: "Calibration via Empirical Risk Minimization",
    badges: ["training objective", "unified loss"],
    tags: ["calibration", "kl", "prior", "market"],
    latex: String.raw`\boxed{\begin{aligned}
&\theta^{*} = \arg\min_{\theta}\;\frac{1}{n}\sum_{i=1}^{n}\!\left[-\log P_\theta(y_i\mid x_i) + \lambda\,\mathrm{KL}\!\bigl(P_\theta(\cdot\mid x_i)\,\|\,Q(\cdot\mid o_i)\bigr)\right] + \beta\,\mathcal{R}(\theta)\\[6pt]
&\text{where: }\mathcal{D}=\{(x_i,\,y_i,\,o_i)\}_{i=1}^{n},\quad\mathcal{R}(\theta) = \|\theta\|_2^2\;\text{(Ridge)}\;\text{or}\;\|\theta\|_1\;\text{(Lasso)}.
\end{aligned}}`,
    explanation: String.raw`The global calibration objective. Expectation is computed under the empirical data distribution \(\mathcal{D} = \{(x_i, y_i, o_i)\}\), where \(x_i\) is the feature vector, \(y_i\) the outcome, and \(o_i\) the market odds. The first term is log-likelihood (predictive accuracy), the second is the market anchor (KL regularization), and the third is parameter regularization (overfitting prevention).`,
    notes: [
        String.raw`Hyperparameters \(\lambda\) and \(\beta\) are tuned via cross-validation.`,
        "The log-loss (cross-entropy) is a proper scoring rule: it prefers calibrated models.",
        "The three terms balance: predictive power vs. market consensus vs. model complexity.",
    ],
},
{
    id: "C-05",
    sport: "core",
    title: "CVaR — Rockafellar–Uryasev Variational Form",
    badges: ["coherent tail risk", "convex optimization"],
    tags: ["cvar"],
    latex: String.raw`\boxed{\begin{aligned}
&\mathrm{CVaR}_\alpha(L) = \inf_{\eta\in\mathbb{R}}\left\{\eta + \frac{1}{1-\alpha}\,\mathbb{E}_{P_\theta}\!\bigl[(L-\eta)_{+}\bigr]\right\}\\[6pt]
&\text{where }(x)_{+} = \max(x,\,0),\quad\text{and the optimal }\eta^{*} = \mathrm{VaR}_\alpha(L).\\[6pt]
&\text{Equivalently: }\mathrm{CVaR}_\alpha(L) = \mathbb{E}\!\bigl[L\mid L\ge\mathrm{VaR}_\alpha(L)\bigr]\\[4pt]
&\quad\text{(the mean of losses in the }(1{-}\alpha)\text{ tail).}
\end{aligned}}`,
    explanation: String.raw`A coherent risk measure that yields the average loss in the \((1-\alpha)\%\) extreme tail. Convexity enables efficient global optimization in wealth allocation. The variational form is superior to VaR: it is convex and subadditive (diversification reduces risk).`,
    notes: [
        String.raw`At \(\alpha=0.95\): the average of the worst 5% of outcomes.`,
        "CVaR is coherent (subadditive, positively homogeneous, translation-invariant, monotone). VaR is not coherent (fails subadditivity).",
        String.raw`In sports betting, we typically use \(\alpha \in [0.90, 0.99]\).`,
        String.raw`For discrete distributions, the optimal \(\eta^*\) is not unique — any value in the flat segment of the VaR function works. The variational form remains valid regardless.`,
        String.raw`Example: If from 1000 simulations the 50 worst average 15% loss, then \(\mathrm{CVaR}_{0.95} = 0.15\).`,
    ],
    exampleTitle: "CVaR Computation — 5-Bet Portfolio",
    exampleContext: "We have a portfolio of 5 simultaneous bets. Monte Carlo simulation yields 1000 P&L scenarios. Compute CVaR at the 95% level.",
    exampleInputs: [
        { name: "Scenarios", value: "N = 1000", note: "Monte Carlo draws" },
        { name: "α", value: "0.95", note: "Tail probability = 5%" },
        { name: "Tail size", value: "50 scenarios", note: "1000 × (1−0.95) = 50" },
        { name: "Sorted losses", value: "L₍₉₅₁₎=−8.2%, ..., L₍₁₀₀₀₎=−23.1%", note: "Worst 50" },
    ],
    exampleLatex: String.raw`\mathrm{CVaR}_{0.95} = \frac{1}{50}\sum_{i=951}^{1000}L_{(i)} = \frac{-8.2\% + \cdots + (-23.1\%)}{50} = -12.7\%`,
    exampleSteps: [
        "Sort all 1000 P&L outcomes from best to worst.",
        "Identify the worst 50 outcomes (bottom 5%): these form the tail.",
        "VaR₀.₉₅ = the 50th worst loss = −8.2% (the boundary).",
        "CVaR₀.₉₅ = average of the 50 worst losses = −12.7%.",
        "Interpretation: In the worst 5% of scenarios, we lose 12.7% on average.",
    ],
    exampleInterpretation: "CVaR = 12.7% means that conditional on being in the worst 5% of outcomes, the expected loss is 12.7% of bankroll. This is significantly worse than VaR (8.2%), capturing the severity of tail events.",
},
{
    id: "C-06",
    sport: "core",
    title: "Dependence Layer — Copula Coherence",
    badges: ["joint law", "parlay structure"],
    tags: ["market", "prior", "copula"],
    latex: String.raw`\boxed{\begin{aligned}
&\text{Sklar's Theorem: }\exists\;\text{copula }C:[0,1]^J\to[0,1]\text{ s.t.:}\\[4pt]
&F(y_1,\dots,y_J) = C\!\bigl(F_1(y_1),\dots,F_J(y_J)\bigr)\\[4pt]
&\text{where }F_j\text{ is the }j\text{-th marginal CDF.}\\[6pt]
&\text{Density: }f(y_1,\dots,y_J)=c\!\bigl(F_1(y_1),\dots,F_J(y_J)\bigr)\prod_{j=1}^J f_j(y_j)
\end{aligned}}`,
    explanation: String.raw`Ensures that parlay (accumulator) risk is evaluated under the correct joint law. Sklar's theorem separates marginal distributions (sport-specific models) from the dependence structure (copula). All risk measures (Expectation, CVaR) are functionals of the joint measure \(P(y_1,\dots,y_J)\).`,
    notes: [
        String.raw`Parlay pricing: \(P(A \cap B) = C(P(A), P(B)) \neq P(A) \cdot P(B)\) in general (unless the copula is the independence copula).`,
        String.raw`Gaussian copula: simple, but weak at modeling extremes (\(\lambda_U = 0\), zero upper tail dependence).`,
        "Clayton/Gumbel copulas: asymmetric tail dependence — critical for 'Same Game Parlay' pricing.",
        String.raw`The copula parameter (e.g., \(\rho\) for Gaussian) is estimated from empirical joint moments.`,
    ],
},
{
    id: "C-07",
    sport: "core",
    title: "Proper Scoring Rules",
    badges: ["calibration", "model evaluation"],
    tags: ["calibration", "prior"],
    latex: String.raw`\boxed{\begin{aligned}
&\textbf{Log Score: }\; S_{\log}(P,\,y) = \log P(y).\\[4pt]
&\textbf{Brier Score: }\; S_{\text{Brier}}(P,\,y) = -\sum_{k=1}^{K}\bigl(P_k - \mathbb{I}(y=k)\bigr)^2.\\[6pt]
&\text{Proper: }\;\mathbb{E}_Q\!\bigl[S(P,\,Y)\bigr] \le \mathbb{E}_Q\!\bigl[S(Q,\,Y)\bigr]\;\;\forall\,P,\;Q.\\[4pt]
&\text{(The true distribution }\;Q\;\text{ maximizes the expected score.)}
\end{aligned}}`,
    explanation: String.raw`Proper scoring rules guarantee that the model receives the best expected score if and only if the forecast matches the true probabilities. The log score is strictly proper, so there is a unique optimum at \(P = Q\). The Brier score is the squared-error analogue for probabilistic forecasts.`,
    notes: [
        "The Log Score is more sensitive to small-probability errors (ruthless for confident wrong predictions).",
        String.raw`The Brier Score is bounded on \([0, 1]\), making it more stable on small samples.`,
        "Calibration decomposition: Brier = Reliability - Resolution + Uncertainty.",
    ],
},

// ====================== SOCCER ======================
{
    id: "S-01",
    sport: "soccer",
    title: "Bivariate Poisson with Shared Intensity",
    badges: ["joint PMF", "covariance λ₃"],
    tags: ["poisson"],
    latex: String.raw`\boxed{\begin{aligned}
&X_1\sim\mathrm{Pois}(\lambda_1),\;\;X_2\sim\mathrm{Pois}(\lambda_2),\;\;X_3\sim\mathrm{Pois}(\lambda_3),\quad\text{independent}.\\[4pt]
&H = X_1 + X_3\;\;(\text{home goals}),\quad A = X_2 + X_3\;\;(\text{away goals}).\\[6pt]
&P(H=h,\,A=a) = e^{-(\lambda_1+\lambda_2+\lambda_3)}\sum_{k=0}^{\min(h,a)}\frac{\lambda_1^{h-k}\,\lambda_2^{a-k}\,\lambda_3^{k}}{(h-k)!\,(a-k)!\,k!}\\[6pt]
&\operatorname{Cov}(H,A)=\operatorname{Var}(X_3)=\lambda_3\ge 0.\\[4pt]
&\mathbb{E}[H]=\lambda_1+\lambda_3,\quad\mathbb{E}[A]=\lambda_2+\lambda_3,\quad\operatorname{Var}(H)=\lambda_1+\lambda_3,\quad\operatorname{Var}(A)=\lambda_2+\lambda_3.
\end{aligned}}`,
    explanation: String.raw`The canonical joint goal-distribution model: \(\lambda_3\) creates an explicit draw/correlation channel, improving realistic modeling of low-scoring matches without ad-hoc adjustments. The covariance is exactly \(\lambda_3\) in the trivariate reduction construction.`,
    notes: [
        String.raw`Derivation: \(\operatorname{Cov}(H,A) = \operatorname{Cov}(X_1+X_3,\,X_2+X_3) = \operatorname{Var}(X_3) = \lambda_3\) (independent terms vanish).`,
        String.raw`When \(\lambda_3 = 0\): independent Poisson model. In practice, \(\lambda_3 \in [0.05, 0.20]\).`,
        String.raw`Exponential moment integrability holds automatically for all \(\lambda_i > 0\).`,
    ],
    usage: String.raw`Given Home xG=1.8 (\(\lambda_1+\lambda_3\)) and Away xG=1.2 (\(\lambda_2+\lambda_3\)). If \(\lambda_3=0.12\), then \(\lambda_1=1.68\), \(\lambda_2=1.08\). The 2-1 score probability: \(\sum_{k=0}^{1}\frac{1.68^{2-k}\cdot1.08^{1-k}\cdot0.12^k}{(2-k)!(1-k)!k!}\cdot e^{-2.88}\).`,
    exampleTitle: "Bivariate Poisson — Liverpool vs Everton",
    exampleContext: "Liverpool (home) xG=1.80, Everton (away) xG=1.05. Correlation parameter λ₃=0.10. Compute P(2-1) and P(Home Win).",
    exampleInputs: [
        { name: "λ₁ (home independent)", value: "1.70", note: "1.80 − 0.10" },
        { name: "λ₂ (away independent)", value: "0.95", note: "1.05 − 0.10" },
        { name: "λ₃ (shared)", value: "0.10", note: "Covariance channel" },
        { name: "E[H], E[A]", value: "1.80, 1.05", note: "λ₁+λ₃, λ₂+λ₃" },
    ],
    exampleLatex: String.raw`P(2,1) = e^{-2.75}\sum_{k=0}^{1}\frac{1.70^{2-k}\cdot 0.95^{1-k}\cdot 0.10^k}{(2-k)!(1-k)!k!} = e^{-2.75}\left(\frac{2.89\cdot 0.95}{2}+\frac{1.70\cdot 0.10}{1}\right) = 0.0986`,
    exampleSteps: [
        "k=0 term: (1.70²×0.95¹×0.10⁰)/(2!×1!×0!) = (2.89×0.95)/2 = 1.3728.",
        "k=1 term: (1.70¹×0.95⁰×0.10¹)/(1!×0!×1!) = 1.70×0.10 = 0.1700.",
        "Sum = 1.3728 + 0.1700 = 1.5428.",
        "Multiply by e^(−2.75) = 0.0639.",
        "P(2,1) = 1.5428 × 0.0639 = 0.0986 ≈ 9.86%.",
        "P(Home Win) = Σ_{i>j} P(i,j) ≈ 52.1%. P(Draw) ≈ 23.4%. P(Away) ≈ 24.5%.",
    ],
    exampleInterpretation: "The 2-1 scoreline has ~9.9% probability. Liverpool's home win probability is 52.1%, corresponding to fair odds of 1.92. If the bookmaker offers 1.95+, there is slight value.",
    derivation: String.raw`\begin{aligned}
&\textbf{Trivariate Reduction Derivation:}\\[4pt]
&\text{Let }X_1,X_2,X_3\text{ be independent Poisson sources:}\\
&X_i\sim\mathrm{Pois}(\lambda_i),\quad H=X_1+X_3,\quad A=X_2+X_3\\[4pt]
&\text{MGF: }M_{H,A}(t_1,t_2)=\mathbb{E}[e^{t_1 H+t_2 A}]\\
&\quad=\mathbb{E}[e^{t_1 X_1}]\mathbb{E}[e^{t_2 X_2}]\mathbb{E}[e^{(t_1+t_2)X_3}]\\
&\quad=\exp\!\bigl(\lambda_1(e^{t_1}-1)+\lambda_2(e^{t_2}-1)+\lambda_3(e^{t_1+t_2}-1)\bigr)\\[4pt]
&\text{PMF via series expansion:}\\
&P(h,a)=e^{-(\lambda_1+\lambda_2+\lambda_3)}\sum_{k=0}^{\min(h,a)}\frac{\lambda_1^{h-k}\lambda_2^{a-k}\lambda_3^{k}}{(h-k)!(a-k)!k!}
\end{aligned}`,
},
{
    id: "S-02",
    sport: "soccer",
    title: "Dixon–Coles Local Dependence Correction",
    badges: ["normalized", "0–0 / 1–1 correction"],
    tags: ["poisson"],
    latex: String.raw`\boxed{\begin{aligned}
&P_{\text{base}}(i,j)=\mathrm{Pois}(i;\,\mu_H)\,\mathrm{Pois}(j;\,\mu_A),\quad i,j\in\mathbb{Z}_{\ge 0}.\\[6pt]
&\tau_{ij}(\rho)=\begin{cases}
1-\rho\,\mu_H\mu_A, &(i,j)=(0,0),\\
1+\rho\,\mu_H, &(i,j)=(0,1),\\
1+\rho\,\mu_A, &(i,j)=(1,0),\\
1-\rho, &(i,j)=(1,1),\\
1, &\text{otherwise}.
\end{cases}\\[6pt]
&\widetilde{P}(i,j) = \frac{\tau_{ij}(\rho)}{Z(\rho)}\,P_{\text{base}}(i,j),\\[4pt]
&Z(\rho) = \sum_{(i,j)\in\mathbb{Z}_{\ge0}^2}\tau_{ij}(\rho)\,P_{\text{base}}(i,j).
\end{aligned}}`,
    explanation: String.raw`Dixon–Coles correction for low-scoring cells (0-0, 0-1, 1-0, 1-1). The normalization constant \(Z(\rho)\) ensures a valid probability measure after reweighting. \(\rho > 0\) decreases 0-0 and 1-1 probabilities (fewer draws), while \(\rho < 0\) increases them.`,
    notes: [
        String.raw`Admissible range of \(\rho\): requires \(\tau_{ij} \ge 0\) for all \((i,j)\in\{0,1\}^2\).`,
        String.raw`Constraints: \(1-\rho\mu_H\mu_A \ge 0\), \(1+\rho\mu_H \ge 0\), \(1+\rho\mu_A \ge 0\), \(1-\rho \ge 0\).`,
        String.raw`Typical estimated \(\rho\): between -0.05 and +0.15 across most leagues.`,
    ],
    usage: String.raw`Procedure: (1) Generate full goal grid (0-10 × 0-10). (2) Apply \(\tau_{ij}\) to the \(\{0,1\}^2\) cells. (3) Divide by \(Z(\rho)\). (4) Verify: \(\sum_{i,j}\widetilde{P}(i,j) = 1\).`,
},
{
    id: "S-03",
    sport: "soccer",
    title: "From Score Grid to Markets — Coherent Summation",
    badges: ["no-arbitrage structure"],
    tags: ["poisson", "market"],
    latex: String.raw`\boxed{\begin{aligned}
&\mathbb{P}(\text{Home Win})=\sum_{i>j}\widetilde{P}(i,j),\quad\mathbb{P}(\text{Draw})=\sum_{i=j}\widetilde{P}(i,j),\\[2pt]
&\mathbb{P}(\text{Away Win})=\sum_{i<j}\widetilde{P}(i,j).\\[6pt]
&\mathbb{P}(\text{BTTS})=\sum_{i\ge 1}\sum_{j\ge 1}\widetilde{P}(i,j),\quad\mathbb{P}(\text{Under }u)=\sum_{i+j<u}\widetilde{P}(i,j).\\[6pt]
&\mathbb{P}(\text{Correct Score }h{:}a)=\widetilde{P}(h,a),\quad\mathbb{P}(\text{AH }-1.5)=\sum_{i\ge j+2}\widetilde{P}(i,j).\\[4pt]
&\text{Verification: }\mathbb{P}(\text{H})+\mathbb{P}(\text{D})+\mathbb{P}(\text{A})=1.
\end{aligned}}`,
    explanation: "Every market is computed as disjoint or overlapping sums of the atomic goal grid, ensuring internal no-arbitrage consistency. This structure guarantees that all market prices can be derived from a single goal-grid model.",
    notes: [
        String.raw`Integer lines: \(\text{Under} < u\), \(\text{Push} = u\), \(\text{Over} > u\) (strict inequality separation).`,
        String.raw`Asian Handicap \(-1.5\) home: the home side must win by at least 2 goals.`,
        "BTTS (Both Teams To Score) market sums the positive-positive quadrant.",
        String.raw`Double Chance: \(P(\text{Home or Draw}) = P(H) + P(D)\).`,
    ],
},
{
    id: "S-04",
    sport: "soccer",
    title: "Attack/Defense Strength — Hierarchical Shrinkage",
    badges: ["partial pooling", "Bayesian"],
    tags: ["calibration", "shrinkage"],
    latex: String.raw`\boxed{\begin{aligned}
&\log\mu_H = \alpha + a_{\text{home}} - d_{\text{away}} + \eta_{\text{HFA}},\\[2pt]
&\log\mu_A = \alpha + a_{\text{away}} - d_{\text{home}}.\\[6pt]
&a_t\sim\mathcal{N}(0,\,\sigma_a^2),\quad d_t\sim\mathcal{N}(0,\,\sigma_d^2)\quad\Rightarrow\;\text{partial pooling}.\\[4pt]
&\hat{a}_t = \frac{n_t\bar{y}_{t,\text{att}} + \sigma_e^2/\sigma_a^2\cdot 0}{n_t + \sigma_e^2/\sigma_a^2}\quad\text{(BLUP shrinkage)}.
\end{aligned}}`,
    explanation: String.raw`Hierarchical priors stabilize parameter estimates for teams with sparse recent data, shrinking towards the league mean. The parameter \(\eta_{\text{HFA}}\) models home-field advantage. The BLUP formula shown is illustrative (ridge-regression analogy on the log-link scale) — in a full Poisson GLMM, shrinkage operates on log-intensities and the exact posterior is computed via MCMC or Laplace approximation.`,
    notes: [
        String.raw`The \(\sigma_a^2 / \sigma_d^2\) ratio controls attack vs. defense variability.`,
        String.raw`Home-field advantage: \(\eta_{\text{HFA}} \approx 0.2\text{–}0.4\) (log-scale) in most European leagues.`,
        "Temporal decay: older matches can receive smaller weights via exponential decay.",
        "The BLUP shrinkage formula is a Normal-theory illustration. The actual Poisson model requires iterative estimation (PQL, INLA, or Stan).",
    ],
    exampleTitle: "Shrinkage — Promoted Team with 5 Matches",
    exampleContext: "A newly promoted team has scored 8 goals in 5 matches (raw avg=1.60). League average is 1.35 goals/match. How much does shrinkage correct the estimate?",
    exampleInputs: [
        { name: "Raw attack avg", value: "1.60 goals/match", note: "8 goals in 5 matches" },
        { name: "League mean (α)", value: "1.35", note: "League-wide average" },
        { name: "n (matches)", value: "5", note: "Small sample" },
        { name: "σ²_e / σ²_a", value: "≈ 8", note: "Noise-to-signal ratio" },
    ],
    exampleLatex: String.raw`\hat{a}_t = \frac{5 \times 1.60 + 8 \times 1.35}{5 + 8} = \frac{8.0 + 10.8}{13} = 1.446`,
    exampleSteps: [
        "Raw attack rate: ȳ = 8/5 = 1.60 goals/match.",
        "League mean: μ₀ = 1.35.",
        "Shrinkage factor: B = σ²_e/(nσ²_a + σ²_e) = 8/(5+8) = 0.615.",
        "Shrunk estimate: â = (1−B)×1.60 + B×1.35 = 0.385×1.60 + 0.615×1.35 = 1.446.",
        "The estimate is pulled 62% toward the league mean due to small sample size.",
    ],
    exampleInterpretation: "With only 5 matches, the raw 1.60 avg is heavily shrunk to 1.45 — much closer to the league mean. After 20+ matches, shrinkage would be minimal (~15%). This prevents overreaction to small samples from newly promoted teams.",
},
{
    id: "S-05",
    sport: "soccer",
    title: "Live Red Card — Dynamic Intensity Regime Switch",
    badges: ["live betting", "regime switch"],
    tags: ["poisson", "prior"],
    latex: String.raw`\boxed{\begin{aligned}
&\lambda_H(t) = \lambda_{H,\text{base}}\cdot\mathbb{I}_{[t<\tau]} + \lambda_{H,\text{red}}\cdot\mathbb{I}_{[t\ge\tau]},\\[4pt]
&\lambda_{H,\text{red}} = \lambda_{H,\text{base}}\cdot\exp(\beta_{\text{red}}),\quad\beta_{\text{red}}\approx +0.2\;\text{(opponent sent off)}.\\[6pt]
&\text{Remaining goals distribution, }t_0 < t < 90\text{:}\\[2pt]
&G_{\text{rem}}\sim\mathrm{Pois}\!\left(\int_{t_0}^{90}\lambda_H(u)\,du\right).
\end{aligned}}`,
    explanation: String.raw`Dynamically modifies goal-scoring intensity upon a red card event. Modeled as a piecewise-constant intensity switch at time \(\tau\). The Poisson process superposition property enables simple computation of remaining goals.`,
},
{
    id: "S-06",
    sport: "soccer",
    title: "xG — Expected Goals Poisson Link",
    badges: ["shot-level", "micro-model"],
    tags: ["poisson", "calibration"],
    latex: String.raw`\boxed{\begin{aligned}
&\text{xG}_i = P(\text{goal}\mid\text{shot}_i) = \sigma(\beta^{\top}x_i),\quad x_i\in\mathbb{R}^d.\\[4pt]
&\text{Team xG} = \sum_{i=1}^{n_{\text{shots}}}\text{xG}_i.\\[6pt]
&\lambda_{\text{team}} \approx \text{Team xG}\quad\text{(Poisson intensity approximation)}.\\[6pt]
&G_i\sim\mathrm{Bern}(\text{xG}_i)\;\text{(indep.)}\;\Rightarrow\;\operatorname{Var}\!\left(\sum_i G_i\right)=\sum_i\text{xG}_i(1-\text{xG}_i)\le\lambda.
\end{aligned}}`,
    explanation: String.raw`Aggregating shot-level xG yields team-level expected goals. Each shot \(i\) is modeled as a Bernoulli trial with probability \(\text{xG}_i = \sigma(\beta^\top x_i)\). The sum of independent Bernoulli variables gives \(\operatorname{Var}(\sum G_i) = \sum \text{xG}_i(1-\text{xG}_i) \le \lambda\), which is sub-Poisson. In practice, shot-count randomness and correlation restore or exceed Poisson-level variance.`,
    notes: [
        String.raw`The Poisson approximation works well when individual shot xG is small (\(\ll 1\)) — Le Cam's theorem.`,
        String.raw`Sub-Poisson variance \(\sum p_i(1-p_i) < \sum p_i = \lambda\) arises because shot-count \(n\) is treated as fixed. Random \(n\) adds extra variance.`,
        "Features: distance to goal, angle, body part, counter-attack/free kick/corner.",
    ],
},

// ====================== BASKETBALL ======================
{
    id: "B-01",
    sport: "basketball",
    title: "Possession-Based Scoring — Pace × Efficiency",
    badges: ["variance control", "interpretability"],
    tags: ["normal"],
    latex: String.raw`\boxed{\begin{aligned}
&\mathrm{Pts}_T\approx\mathrm{Poss}_T\cdot\frac{\mathrm{OffEff}_T}{100},\quad\operatorname{Cov}(\text{Pace},\text{Eff})\approx 0.\\[6pt]
&\mathbb{E}[\mathrm{Pts}_H-\mathrm{Pts}_A]\approx\text{Pace}\cdot\frac{\mathrm{OffEff}_H-\mathrm{OffEff}_A}{100}.\\[6pt]
&\textbf{Goodman:}\;\operatorname{Var}(\mathrm{Pts})\approx\mathbb{E}[P]^2\operatorname{Var}(E)+\mathbb{E}[E]^2\operatorname{Var}(P)+\operatorname{Var}(P)\operatorname{Var}(E).
\end{aligned}}`,
    explanation: String.raw`Mathematical decomposition: a team's score is the product of possession count (Pace) and efficiency (ORtg, points per 100 possessions). The Goodman variance formula assumes \(\operatorname{Cov}(P,E) = 0\) (Pace-Efficiency independence). This is approximately true (\(r \approx -0.1\)); when the assumption fails, the full product-moment formula adds a \(2\mathbb{E}[P]\mathbb{E}[E]\operatorname{Cov}(P,E)\) correction term.`,
    notes: [
        String.raw`If Pace=98.5 and ORtg=112.0, expected points: \((98.5 \times 112.0)/100 = 110.32\).`,
        "Variance scales with Pace: faster games = more uncertainty.",
        String.raw`The Cov(Pace, Eff) \(\approx\) 0 assumption holds with weak correlation (\(r \approx -0.1\)) in practice.`,
    ],
    exampleTitle: "Spread Prediction — Celtics vs Lakers",
    exampleContext: "Boston Celtics (ORtg=118.5) vs LA Lakers (ORtg=112.0). Expected pace ~97.5 possessions. Predict the spread.",
    exampleInputs: [
        { name: "Pace", value: "97.5 poss.", note: "Average of both teams' pace" },
        { name: "Celtics ORtg", value: "118.5", note: "Points per 100 poss." },
        { name: "Lakers ORtg", value: "112.0" },
        { name: "Celtics DRtg", value: "108.2", note: "Points allowed per 100 poss." },
        { name: "Lakers DRtg", value: "111.5" },
    ],
    exampleLatex: String.raw`\mu_D = 97.5 \times \frac{(\text{ORtg}_{\text{BOS}} - \text{DRtg}_{\text{LAL}}) - (\text{ORtg}_{\text{LAL}} - \text{DRtg}_{\text{BOS}})}{100} = 97.5 \times \frac{7.0 - 3.8}{100} = +3.12`,
    exampleSteps: [
        "Celtics net edge: ORtg_BOS − DRtg_LAL = 118.5 − 111.5 = +7.0 (Celtics points per 100 poss vs Lakers D).",
        "Lakers net edge: ORtg_LAL − DRtg_BOS = 112.0 − 108.2 = +3.8 (Lakers points per 100 poss vs Celtics D).",
        "Net differential: 7.0 − 3.8 = +3.2 per 100 possessions (Celtics advantage).",
        "Expected spread (neutral site): 97.5 × 3.2/100 = +3.12 points (Celtics favored).",
        "Add home court advantage: +3.0 → Final predicted spread: Celtics −6.1.",
    ],
    exampleInterpretation: "The model predicts Celtics favored by ~6.1 points (including home court). If the market line is Celtics −4.5, there is value on the Celtics spread. The Goodman variance estimate gives σ_D ≈ 11.5 pts.",
    derivation: String.raw`\begin{aligned}
&\textbf{Expected Points Decomposition:}\\
&T = P \cdot E,\quad\mathbb{E}[T] = \mathbb{E}[P]\mathbb{E}[E] + \operatorname{Cov}(P,E)\\
&\text{Standard: }\operatorname{Cov}(P,E)\approx 0\;\text{(independence).}\\[4pt]
&\textbf{Variance Propagation (Goodman):}\\
&\operatorname{Var}(T)\approx\mathbb{E}[P]^2\operatorname{Var}(E)+\mathbb{E}[E]^2\operatorname{Var}(P)+\operatorname{Var}(P)\operatorname{Var}(E)\\[4pt]
&\textbf{Standard Deviation Estimate (NBA):}\\
&\sigma_T\approx\sqrt{98^2\cdot 3.5^2 + 1.10^2\cdot 3.0^2 + 3.0^2\cdot 3.5^2}\approx 11.5\;\text{pts.}
\end{aligned}`,
},
{
    id: "B-02",
    sport: "basketball",
    title: "Spread Approximation — CLT Normal",
    badges: ["Normal limit", "pace-dependent variance"],
    tags: ["normal"],
    latex: String.raw`\boxed{\begin{aligned}
&D=\mathrm{Pts}_H-\mathrm{Pts}_A\;\dot{\sim}\;\mathcal{N}(\mu_D(x),\;\sigma_D^2(x)).\\[6pt]
&\sigma_D^2(x)\propto\mathbb{E}[\mathrm{Poss}\mid x]\quad\text{(linear possession-scaling)}.\\[6pt]
&\mathbb{P}(\text{Cover }L) = \mathbb{P}(D > L) = 1 - \Phi\!\left(\frac{L - \mu_D}{\sigma_D}\right).\\[4pt]
&\mathbb{P}(\text{Total Over }T) = 1 - \Phi\!\left(\frac{T - (\mu_H + \mu_A)}{\sigma_T}\right).
\end{aligned}}`,
    explanation: "Spreads and totals converge to Normal-like behavior since the score is a sum of many independent possession-atoms (CLT). Variance grows proportionally with possession count.",
    notes: [
        String.raw`In the NBA, typically \(\sigma_D \approx 11\text{–}13\) points (full game).`,
        "The Normal approximation performs well on spread markets, but is less accurate at the tails (key number effects).",
        "Quarter-level analysis: Q4 variance is smaller due to tactical adjustments.",
    ],
},
{
    id: "B-03",
    sport: "basketball",
    title: "Push-Aware Probability — Continuity Correction",
    badges: ["discrete-to-normal"],
    tags: ["normal"],
    latex: String.raw`\boxed{\begin{aligned}
&\mathbb{P}(\text{Over }T_0) \approx 1 - \Phi\!\left(\frac{T_0+0.5-\mu_T}{\sigma_T}\right),\quad T_0\in\mathbb{Z}.\\[6pt]
&\mathbb{P}(\text{Push }T_0) \approx \Phi\!\left(\frac{T_0+0.5-\mu_T}{\sigma_T}\right) - \Phi\!\left(\frac{T_0-0.5-\mu_T}{\sigma_T}\right).\\[6pt]
&\text{Half-point line }(T_0\in\mathbb{Z}+\tfrac{1}{2}):\;\mathbb{P}(\text{Push})=0,\;\text{no correction needed.}
\end{aligned}}`,
    explanation: String.raw`Mapping discrete score-atoms (integers) to a continuous Normal distribution. \(T_0\) denotes the total line (avoiding collision with the loss variable \(L\)). The continuity correction ensures that the 'Push' mass is non-zero at integer lines. At half-point lines, Push probability is identically zero.`,
    notes: [
        String.raw`An integer total \(T_0\) has probability: \(\int_{T_0-0.5}^{T_0+0.5}f(x)\,dx\) under the continuous approximation.`,
        String.raw`Over \(T_0\): integrate from \(T_0+0.5\). Under \(T_0\): integrate to \(T_0-0.5\).`,
        "In the NBA, Push probability on integer lines is typically 2–4%.",
    ],
},
{
    id: "B-04",
    sport: "basketball",
    title: "Endgame Variance Collapse — Bridge Limit",
    badges: ["live betting", "bridge limit"],
    tags: ["normal"],
    latex: String.raw`\boxed{\begin{aligned}
&\tau = T - t\;\;\text{(remaining time)}.\\[4pt]
&\sigma^2(t)=\sigma_0^2\cdot\frac{\tau}{T}\cdot g_{\text{clutch}}(x),\quad t\to T\implies\sigma(t)\to 0.\\[6pt]
&\mathbb{P}(\text{Win}\mid\Delta(t))\;\approx\;\Phi\!\left(\frac{\Delta(t)}{\sigma(t)}\right)\;\xrightarrow{\;\tau\downarrow 0\;}\;\mathbb{I}_{\{\Delta(t)>0\}}.
\end{aligned}}`,
    explanation: "In live endgame pricing, uncertainty must collapse as the match approaches its end. Variance decreases proportionally with remaining time, so win-probability gradually becomes deterministic.",
    notes: [
        String.raw`The \(g_{\text{clutch}}(x)\) term models context: fouling games, timeouts, clutch performance.`,
        String.raw`As \(\tau \to 0\): \(\Phi(\Delta/\sigma) \to \mathbb{I}_{\Delta > 0}\) (deterministic outcome).`,
        "In the NBA, variance collapses dramatically within the final ~2 minutes.",
    ],
},

// ====================== TENNIS ======================
{
    id: "T-01",
    sport: "tennis",
    title: "Point → Game Transition — Markov Recursion",
    badges: ["recursive", "stochastic"],
    tags: ["markov"],
    latex: String.raw`\boxed{\begin{aligned}
&V(s_1, s_2) = p_{\text{srv}} \cdot V(s_1+1, s_2) + (1-p_{\text{srv}}) \cdot V(s_1, s_2+1)\\[6pt]
&\text{Boundary conditions:}\\[2pt]
&V(s_1, s_2) = 1\;\;\text{if }s_1 \ge 4\;\text{ and }\;s_1 - s_2 \ge 2\quad\text{(game won)},\\
&V(s_1, s_2) = 0\;\;\text{if }s_2 \ge 4\;\text{ and }\;s_2 - s_1 \ge 2\quad\text{(game lost)}.\\[6pt]
&\text{Deuce: }V(3,3) = \frac{p^2}{p^2 + (1-p)^2}\quad\text{(geometric series)}.
\end{aligned}}`,
    explanation: String.raw`The Markov chain recursion at the tennis point → game level. \(p_{\text{srv}}\) is the server's point-win probability. The deuce (40-40) state win probability is obtained in closed form as a geometric series: two consecutive points must be won.`,
    notes: [
        String.raw`If \(p = 0.65\) (elite server), deuce win probability: \(0.65^2/(0.65^2+0.35^2) = 0.775\).`,
        "Full game-win probability is obtained by starting the recursion from state (0,0).",
        "Markov property: the future depends only on the current state, not the history.",
    ],
    exampleTitle: "Game Win Probability — Djokovic Serve",
    exampleContext: "Novak Djokovic serves with p_srv = 0.68 (point-win probability on serve). Compute the probability of holding serve (winning the game).",
    exampleInputs: [
        { name: "p_srv", value: "0.68", note: "Server point-win probability" },
        { name: "q = 1−p", value: "0.32", note: "Returner point-win probability" },
    ],
    exampleLatex: String.raw`V(\text{Deuce}) = \frac{0.68^2}{0.68^2 + 0.32^2} = \frac{0.4624}{0.4624 + 0.1024} = \frac{0.4624}{0.5648} = 0.8187`,
    exampleSteps: [
        "Deuce win probability: p²/(p²+q²) = 0.68²/(0.68²+0.32²) = 0.8187.",
        "State (3,2): V(3,2) = p·1 + q·V(Deuce) = 0.68 + 0.32×0.8187 = 0.9420.",
        "State (2,3): V(2,3) = p·V(Deuce) + q·0 = 0.68×0.8187 = 0.5567.",
        "Working backward from (0,0) through all states...",
        "Final: V(0,0) = P(Hold) ≈ 0.8468 = 84.7%.",
    ],
    exampleInterpretation: "With a 68% point-win rate, Djokovic holds serve ~84.7% of the time. The deuce probability is 81.9% — significantly amplified from the raw 68% due to the 'must win by 2' rule. Elite servers (p≥0.70) hold >88%.",
},
{
    id: "T-02",
    sport: "tennis",
    title: "Set Win Probability — Tiebreak Integration",
    badges: ["recursive", "tiebreak"],
    tags: ["markov"],
    latex: String.raw`\boxed{\begin{aligned}
&S(g_1, g_2,\,\text{srv}) = P_{\text{win}}(\text{srv}) \cdot S(g_1+1, g_2,\,\overline{\text{srv}}) + \bigl(1-P_{\text{win}}(\text{srv})\bigr) \cdot S(g_1, g_2+1,\,\overline{\text{srv}})\\[4pt]
&P_{\text{win}}(\text{srv}{=}1) = P_{\text{hold}},\quad P_{\text{win}}(\text{srv}{=}0) = P_{\text{break}},\quad \overline{\text{srv}} = 1-\text{srv}.\\[6pt]
&\text{Boundaries: }S(6, g_2, \cdot) = 1\;\text{if }g_2 \le 4,\quad S(g_1, 6, \cdot) = 0\;\text{if }g_1 \le 4.\\[4pt]
&S(6,5,\text{srv}) = P_{\text{win}}(\text{srv})\cdot 1 + (1-P_{\text{win}}(\text{srv}))\cdot S(6,6,\,\overline{\text{srv}}).\\[4pt]
&S(6,6,\cdot) = \text{Tiebreak}(p_{\text{srv}}, p_{\text{ret}}).
\end{aligned}}`,
    explanation: String.raw`The set-level recursion with explicit server tracking. The state \((\text{srv})\) alternates after every game (\(\overline{\text{srv}} = 1-\text{srv}\)). When the server holds, the game-win probability is \(P_{\text{hold}}\); when returning, it is \(P_{\text{break}}\). At 6-6, a tiebreak is triggered with its own alternating-service Markov chain.`,
    notes: [
        String.raw`Alternating serve: the \(\overline{\text{srv}}\) flip is essential — without it, the model overestimates one player's set-win probability.`,
        "The tiebreak service alternation occurs every 2 points (special structure).",
        "Grand Slam 5th set: some tournaments have no tiebreak, requiring a 2-game lead.",
    ],
},

// ====================== NFL ======================
{
    id: "N-01",
    sport: "nfl",
    title: "Compound Poisson Scoring — FFT Convolution",
    badges: ["discrete atoms", "FFT convolution"],
    tags: ["poisson"],
    latex: String.raw`\boxed{\begin{aligned}
&\phi_{S_T}(u) = \exp\left( \lambda T \left( \pi_0 + \sum_{z \in \{2,3,6,7,8\}} \pi_z e^{i u z} - 1 \right) \right)\\[6pt]
&\text{where }\sum_{z}\pi_z = 1\text{ and:}\\[2pt]
&\pi_0\text{ (no score / punt / TO)},\;\pi_7\text{ (TD+XP)},\;\pi_3\text{ (FG)},\;\pi_6\text{ (TD, no XP)},\;\pi_8\text{ (TD+2pt)},\;\pi_2\text{ (Safety)}.\\[6pt]
&P(S_T = k) = \frac{1}{2\pi}\int_{-\pi}^{\pi}\phi_{S_T}(u)\,e^{-iuk}\,du\quad\text{(inverse FFT)}.
\end{aligned}}`,
    explanation: String.raw`NFL scoring consists of discrete atoms: a touchdown is 6+1 or 6+2 points, a field goal 3 points, a safety 2 points. The compound Poisson model combines drive counts (Poisson) with per-drive scoring type probabilities (\(\pi_z\)). The 0-atom (\(\pi_0\): punts, turnovers, downs) ensures \(\sum_z \pi_z = 1\). Note: \(\pi_0 e^{i \cdot 0 \cdot u} = \pi_0\), so the 0-atom contributes a constant term. The FFT efficiently computes the full score distribution.`,
    notes: [
        "Key numbers: 3 and 7 are the most common score differences (FG and TD+XP).",
        "The characteristic function enables convolutional computation of spread distributions.",
        String.raw`\(\lambda T\) is the expected number of drives (typically 10–12 drives/team/game).`,
        String.raw`The \(\pi_0\) term (no-score drives) is typically 0.45–0.55; without it, the normalization \(\sum \pi_z = 1\) fails.`,
    ],
    exampleTitle: "Score Distribution — Chiefs vs Bills",
    exampleContext: "Kansas City drives per game: λT=11.2. Scoring type probabilities estimated from season data. Compute P(Total = 24).",
    exampleInputs: [
        { name: "λT (drives)", value: "11.2", note: "Expected drives per game" },
        { name: "π₇ (TD+XP)", value: "0.28", note: "Most common" },
        { name: "π₃ (FG)", value: "0.18" },
        { name: "π₆ (TD, no XP)", value: "0.02" },
        { name: "π₈ (TD+2pt)", value: "0.02" },
        { name: "π₀ (no score)", value: "0.50", note: "Punt/turnover" },
    ],
    exampleLatex: String.raw`\phi(u) = \exp\!\left(11.2\left(0.50 + 0.18 e^{3iu} + 0.02 e^{6iu} + 0.28 e^{7iu} + 0.02 e^{8iu} - 1\right)\right)`,
    exampleSteps: [
        "Build characteristic function φ(u) with scoring atoms {0,3,6,7,8}.",
        "Apply inverse FFT on a grid of 128 points to get P(S=k) for k=0,...,127.",
        "Extract P(S=24): approximately 6.8%.",
        "Key numbers: P(S=21) ≈ 8.2%, P(S=24) ≈ 6.8%, P(S=28) ≈ 5.9%.",
        "Multiples of 7 (21, 28, 35) are local modes due to the dominance of π₇.",
    ],
    exampleInterpretation: "The compound Poisson model captures the discrete, multi-modal nature of NFL scoring. Key numbers (3, 7, 10, 14, 17, 21, 24, 28) have elevated probability mass — critical for spread and total pricing.",
},

// ====================== HOCKEY ======================
{
    id: "H-01",
    sport: "hockey",
    title: "Goal Intensity with GSAx Adjustment",
    badges: ["goalie adjustment", "shot quality"],
    tags: ["poisson"],
    latex: String.raw`\boxed{\begin{aligned}
&d\lambda_t = \kappa(\bar{\lambda} - \lambda_t)dt + \sigma_{\lambda} \sqrt{\lambda_t}\, dW_t + J_{\text{goal}}\, dN_t\\[6pt]
&\text{where:}\\[2pt]
&\kappa\text{ — mean-reversion speed},\;\bar{\lambda}\text{ — long-run average},\\
&\sigma_\lambda\text{ — volatility},\;J_{\text{goal}}\text{ — goal-jump size},\;N_t\text{ — Poisson process}.\\[6pt]
&\text{GSAx correction: }\lambda_{\text{adj}} = \lambda_{\text{raw}} \cdot \exp\!\bigl(\text{GSAx}_{\text{goalie}}/n_{\text{shots}}\bigr)\quad(\text{ensures }\lambda_{\text{adj}}>0).
\end{aligned}}`,
    explanation: String.raw`Goal intensity modeled via a stochastic differential equation capturing time-varying game intensity. The GSAx (Goals Saved Above Expected) correction uses the exponential form \(\exp(\text{GSAx}/n)\) rather than the additive \((1 + \text{GSAx}/n)\) to guarantee \(\lambda_{\text{adj}} > 0\) even for extreme GSAx values.`,
    notes: [
        "PDO = Sh% + Sv%. Long-run average is 1000. Extreme values signal regression to the mean.",
        String.raw`The \(\kappa\) parameter governs how quickly intensity reverts to the mean.`,
        "Empty-net situations: goal intensity increases dramatically in the final 2 minutes.",
        String.raw`The additive form \(1 + \text{GSAx}/n\) can go negative for elite goalies with large GSAx; the exponential form avoids this.`,
    ],
},

// ====================== BASEBALL ======================
{
    id: "M-01",
    sport: "baseball",
    title: "Overdispersed Run Scoring — Negative Binomial Model",
    badges: ["pitcher-adjusted", "park factors"],
    tags: ["poisson"],
    latex: String.raw`\boxed{\begin{aligned}
&P(R=k) = \int_0^\infty \frac{\lambda^k e^{-\lambda}}{k!} \cdot \frac{\beta^\alpha}{\Gamma(\alpha)} \lambda^{\alpha-1} e^{-\beta\lambda}\, d\lambda\\[6pt]
&= \binom{k+\alpha-1}{k}\left(\frac{\beta}{\beta+1}\right)^\alpha\left(\frac{1}{\beta+1}\right)^k\\[6pt]
&\mathbb{E}[R] = \alpha/\beta,\quad\operatorname{Var}(R) = \alpha/\beta + \alpha/\beta^2 > \mathbb{E}[R].
\end{aligned}}`,
    explanation: String.raw`The Negative Binomial distribution is a Poisson-Gamma mixture: the intensity \(\lambda\) itself is random (Gamma-distributed), yielding overdispersion. In baseball, run-scoring variability generally exceeds the Poisson model's prediction.`,
    notes: [
        String.raw`FIP correction: \(\lambda\) derives from the pitcher's FIP (Fielding Independent Pitching), not ERA.`,
        String.raw`Park factor: \(\lambda_{\text{adj}} = \lambda \cdot \text{PF}\), where PF captures the stadium's run-scoring effect.`,
        String.raw`\(\alpha\) and \(\beta\) are estimated from the team's run-scoring distribution moments.`,
    ],
    exampleTitle: "Run Distribution — Yankees at Coors Field",
    exampleContext: "Yankees have baseline run expectation 4.8 runs/game. Coors Field park factor = 1.28. Compute the NB distribution parameters and P(Over 9.5).",
    exampleInputs: [
        { name: "Baseline E[R]", value: "4.80 runs", note: "Yankees avg" },
        { name: "Park Factor", value: "1.28", note: "Coors Field (hitter-friendly)" },
        { name: "Adjusted E[R]", value: "6.14 runs", note: "4.80 × 1.28" },
        { name: "Observed Var(R)", value: "9.50", note: "Overdispersed: Var > E" },
    ],
    exampleLatex: String.raw`\alpha = \frac{6.14^2}{9.50 - 6.14} = \frac{37.7}{3.36} = 11.22,\quad \beta = \frac{6.14}{9.50 - 6.14} = \frac{6.14}{3.36} = 1.827`,
    exampleSteps: [
        "Park-adjusted mean: μ = 4.80 × 1.28 = 6.14.",
        "Method of moments: α = μ²/(σ²−μ), β = μ/(σ²−μ).",
        "α = 6.14²/(9.50−6.14) = 37.70/3.36 = 11.22.",
        "β = 6.14/3.36 = 1.827.",
        "P(R ≤ 9) = Σ_{k=0}^{9} NB(k; α=11.22, β=1.827) ≈ 0.87.",
        "P(Over 9.5) = 1 − 0.87 = 0.13 = 13%.",
    ],
    exampleInterpretation: "Despite the high 6.14 run expectation at Coors Field, the Negative Binomial model gives only 13% probability for the team alone to score 10+. The overdispersion (Var/E = 1.55) is crucial — a Poisson model would underestimate tail probabilities.",
},

// ====================== COMBAT ======================
{
    id: "UFC-01",
    sport: "combat",
    title: "KO Hazard — Time-Dependent Survival Analysis",
    badges: ["survival", "intensity"],
    tags: ["control", "hazard", "survival"],
    latex: String.raw`\boxed{\begin{aligned}
&\lambda_{\text{KO}}(t)=\lambda_0\exp(\beta^T X(t)), \quad S(t)=\exp\left(-\int_0^t \lambda_{\text{KO}}(u)\,du\right)\\[6pt]
&P(\text{KO in round }r) = S(t_{r-1}) - S(t_r)\\[4pt]
&P(\text{Decision}) = S(T_{\text{final}})\\[4pt]
&\text{where }X(t)\text{ includes: fatigue, strikes landed, takedown rate.}
\end{aligned}}`,
    explanation: "A survival model for fight finishes. The hazard function varies over time with fatigue and fight dynamics. The survival function enables mathematically consistent pricing of round-betting markets.",
    notes: [
        String.raw`The baseline hazard \(\lambda_0\) is the KO rate per minute (typically 0.01–0.05).`,
        String.raw`Fatigue increases KO probability: \(\beta_{\text{fatigue}} > 0\) as time progresses.`,
        "Decision probability equals the probability of surviving the entire fight.",
        "Method-of-victory pricing: decomposition into KO, Submission, Decision sub-analyses.",
    ],
    exampleTitle: "KO Probability by Round — Heavyweight Bout",
    exampleContext: "Fighter A has baseline KO rate λ₀=0.035/min. Fatigue coefficient β=0.008. Compute P(KO in Round 3) and P(Decision).",
    exampleInputs: [
        { name: "λ₀", value: "0.035 /min", note: "Baseline KO hazard" },
        { name: "β_fatigue", value: "0.008", note: "Fatigue multiplier" },
        { name: "Round length", value: "5 min" },
        { name: "Total rounds", value: "3 (non-title)", note: "T_final = 15 min" },
    ],
    exampleLatex: String.raw`S(t) = \exp\!\left(-\int_0^t 0.035\,e^{0.008u}\,du\right) = \exp\!\left(-\frac{0.035}{0.008}(e^{0.008t}-1)\right)`,
    exampleSteps: [
        "Cumulative hazard: Λ(t) = (0.035/0.008)×(e^{0.008t}−1) = 4.375×(e^{0.008t}−1).",
        "S(5) = exp(−4.375×(e^{0.04}−1)) = exp(−4.375×0.0408) = exp(−0.1786) = 0.8365.",
        "S(10) = exp(−4.375×(e^{0.08}−1)) = exp(−4.375×0.0833) = exp(−0.3644) = 0.6947.",
        "S(15) = exp(−4.375×(e^{0.12}−1)) = exp(−4.375×0.1275) = exp(−0.5576) = 0.5727.",
        "P(KO in R3) = S(10) − S(15) = 0.6947 − 0.5727 = 0.1220 = 12.2%.",
        "P(Decision) = S(15) = 0.5727 = 57.3%.",
    ],
    exampleInterpretation: "Total KO probability is 42.7%. Round-by-round: R1=16.3%, R2=14.2%, R3=12.2%. Although the per-minute hazard rate increases with fatigue, absolute round KO probabilities decrease because fewer fights survive to later rounds. Decision at 57.3% is the most likely outcome.",
},

// ====================== ADVANCED ======================
{
    id: "A-01",
    sport: "advanced",
    title: "Kusuoka Representation — Coherent Risk Measures",
    badges: ["coherent risk class"],
    tags: ["kusuoka", "cvar", "control"],
    latex: String.raw`\boxed{\rho(L)=\sup_{\mu\in\mathcal{M}}\int_0^1 \mathrm{CVaR}_\alpha(L)\,d\mu(\alpha)}`,
    explanation: String.raw`Kusuoka's theorem characterizes all law-invariant coherent risk measures: each can be written as a mixture of CVaR. This provides the theoretical foundation for institutional risk profiles. The measure \(\mu\) specifies the mixing weights.`,
    notes: [
        String.raw`When \(\mu\) is a Dirac measure at \(\alpha_0\): \(\rho(L) = \mathrm{CVaR}_{\alpha_0}(L)\).`,
        String.raw`\(\mathcal{M}\) is the set of probability measures on \([0,1]\).`,
        "In practice, we typically use mixtures of CVaR(95%) and CVaR(99%).",
    ],
    exampleTitle: "Kusuoka Mixture — Institutional Risk Profile",
    exampleContext: "A fund uses a mixed risk measure: 60% weight on CVaR₀.₉₅ and 40% weight on CVaR₀.₉₉. Compute the composite risk for a portfolio with known tail losses.",
    exampleInputs: [
        { name: "CVaR₀.₉₅(L)", value: "12.7%", note: "Average loss in worst 5%" },
        { name: "CVaR₀.₉₉(L)", value: "22.3%", note: "Average loss in worst 1%" },
        { name: "Weight w₁", value: "0.60", note: "On CVaR₀.₉₅" },
        { name: "Weight w₂", value: "0.40", note: "On CVaR₀.₉₉" },
    ],
    exampleLatex: String.raw`\rho(L) = 0.60 \times \mathrm{CVaR}_{0.95}(L) + 0.40 \times \mathrm{CVaR}_{0.99}(L) = 0.60 \times 12.7\% + 0.40 \times 22.3\% = 16.54\%`,
    exampleSteps: [
        "Kusuoka representation: ρ(L) = ∫₀¹ CVaRα(L) dμ(α).",
        "Discrete mixing measure: μ = 0.60·δ(α=0.95) + 0.40·δ(α=0.99).",
        "Compute: ρ = 0.60 × 12.7% + 0.40 × 22.3% = 7.62% + 8.92% = 16.54%.",
        "This is coherent (subadditive) because it's a convex combination of coherent measures.",
        "The 40% weight on CVaR₀.₉₉ makes the measure more tail-sensitive than pure CVaR₀.₉₅.",
    ],
    exampleInterpretation: "The composite risk measure is 16.54%, reflecting a balance between moderate tail (5%) and extreme tail (1%) sensitivity. This is higher than CVaR₀.₉₅ alone (12.7%) but lower than CVaR₀.₉₉ (22.3%), providing a nuanced risk assessment.",
},
{
    id: "A-02",
    sport: "advanced",
    title: "PAC-Bayes Generalization Bound",
    badges: ["reviewer-grade bound"],
    tags: ["pacbayes", "kl", "control"],
    latex: String.raw`\boxed{\mathrm{kl}(\hat{L}_n\|L)\le \frac{\mathrm{KL}(\rho\|\pi)+\ln\frac{2\sqrt{n}}{\delta}}{n}}`,
    explanation: String.raw`The PAC-Bayes–kl inequality (Seeger 2002, Maurer 2004 tightening): empirical loss controls true loss with a KL complexity penalty. \(\rho\) is the posterior (learned) distribution, \(\pi\) is the prior (pre-training) distribution over the hypothesis space. \(\delta\) is the confidence level. This is the standard form used in modern PAC-Bayesian learning theory.`,
    notes: [
        String.raw`\(n\) is the sample size. Larger \(n\) = tighter bound.`,
        String.raw`\(\mathrm{kl}(p\|q) = p\ln\frac{p}{q} + (1{-}p)\ln\frac{1{-}p}{1{-}q}\) is the Bernoulli KL-divergence.`,
        "PAC-Bayes bounds are non-asymptotic: valid for finite samples.",
        String.raw`The \(2\sqrt{n}\) term comes from Maurer's refinement of the original \(\frac{n}{n-1}\) factor.`,
    ],
    exampleTitle: "Generalization Bound — Betting Model Validation",
    exampleContext: "A betting model trained on n=2000 matches has empirical loss 0.18. The KL divergence between posterior and prior is 45 nats. Compute the generalization bound at 95% confidence.",
    exampleInputs: [
        { name: "n (sample size)", value: "2000" },
        { name: "Empirical loss L̂", value: "0.18", note: "Training error rate" },
        { name: "KL(ρ‖π)", value: "45 nats", note: "Model complexity" },
        { name: "δ (confidence)", value: "0.05", note: "95% confidence" },
    ],
    exampleLatex: String.raw`\mathrm{kl}(0.18\|L) \le \frac{45 + \ln\frac{2\sqrt{2000}}{0.05}}{2000} = \frac{45 + \ln(1788.9)}{2000} = \frac{45 + 7.49}{2000} = 0.02624`,
    exampleSteps: [
        "RHS: (KL + ln(2√n/δ)) / n = (45 + ln(2×44.72/0.05)) / 2000.",
        "= (45 + ln(1788.9)) / 2000 = (45 + 7.49) / 2000 = 0.02624.",
        "Solve kl(0.18 ‖ L) ≤ 0.02624 for L (binary KL inversion).",
        "kl(p‖q) = p·ln(p/q) + (1−p)·ln((1−p)/(1−q)).",
        "Numerically: L ≤ 0.228.",
        "True loss is at most 22.8% with 95% confidence.",
    ],
    exampleInterpretation: "The PAC-Bayes bound guarantees that the model's true error rate is at most 22.8% (vs. 18% empirical), with 95% confidence. The 4.8% gap is the 'price of generalization'. With n=10000 matches, this gap would shrink to ~2%.",
},

];
