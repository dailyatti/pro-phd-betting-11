import React, { useState, useMemo, memo } from "react";
import { Calculator, TrendingUp, Shield, BarChart3, Layers, Percent, ChevronDown, ChevronUp, Info } from "lucide-react";

/* ================================================================== */
/*  PhD-Level Betting Calculator Suite                                 */
/*  Real mathematical models used in quantitative sports analytics     */
/* ================================================================== */

// ── Utility: parse any odds format to decimal ──
function parseOddsToDecimal(raw) {
  const s = String(raw).trim();
  if (!s) return NaN;
  if (/^\d+\/\d+$/.test(s)) {
    const [n, d] = s.split("/").map(Number);
    if (d === 0) return NaN;
    return n / d + 1;
  }
  if (/^\+\d+/.test(s)) return 1 + Number(s.slice(1)) / 100;
  if (/^-\d+/.test(s)) {
    const abs = Math.abs(Number(s));
    if (abs === 0) return NaN;
    return 1 + 100 / abs;
  }
  const n = Number(s);
  return n > 1 ? n : NaN;
}

function decimalToFormats(dec) {
  if (!isFinite(dec) || dec <= 1) return { decimal: "—", fractional: "—", american: "—", implied: "—" };
  const impl = 1 / dec;
  const fNum = dec - 1;
  const gcd = (a, b) => (b < 0.0001 ? a : gcd(b, a % b));
  const denom = 100;
  const numer = Math.round(fNum * denom);
  const g = gcd(numer, denom);
  const fractional = `${Math.round(numer / g)}/${Math.round(denom / g)}`;
  const american = dec >= 2 ? `+${((dec - 1) * 100).toFixed(0)}` : `-${(100 / (dec - 1)).toFixed(0)}`;
  return { decimal: dec.toFixed(3), fractional, american, implied: (impl * 100).toFixed(2) + "%" };
}

// ── Normal inverse CDF (Beasley-Springer-Moro) ──
function normInv(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0, -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0, 3.754408661907416e0];
  const pLow = 0.02425, pHigh = 1 - pLow;
  let q, r;
  if (p < pLow) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
  else if (p <= pHigh) { q = p - 0.5; r = q * q; return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1); }
  else { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
}

function poissonPmf(k, lambda) {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let logP = -lambda + k * Math.log(lambda);
  for (let i = 2; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

// ── Theme helper ──
const t = (dark, darkVal, lightVal) => dark ? darkVal : lightVal;

/* ================================================================== */
/*  Shared UI components (theme-aware)                                 */
/* ================================================================== */
const Section = memo(({ id, icon: Icon, title, subtitle, color, bg, children, defaultOpen = false, dark }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      dark ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between p-5 text-left transition-colors ${
          dark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
        }`}
        aria-expanded={open}
        aria-controls={`calc-section-${id}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <h3 className={`text-base font-black tracking-tight ${dark ? 'text-slate-100' : 'text-slate-800'}`}>{title}</h3>
            <p className={`text-[11px] font-medium ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{subtitle}</p>
          </div>
        </div>
        {open
          ? <ChevronUp className={`w-5 h-5 ${dark ? 'text-slate-600' : 'text-slate-300'}`} />
          : <ChevronDown className={`w-5 h-5 ${dark ? 'text-slate-600' : 'text-slate-300'}`} />}
      </button>
      {open && (
        <div id={`calc-section-${id}`} className={`px-5 pb-6 space-y-5 border-t ${dark ? 'border-slate-700/50' : 'border-slate-100'}`}>
          {children}
        </div>
      )}
    </div>
  );
});

const InputField = ({ label, ariaLabel, value, onChange, placeholder, type = "text", step, min, max, helpText, dark }) => (
  <div className="space-y-1.5">
    <label className={`text-[10px] font-black uppercase tracking-widest ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</label>
    <input
      aria-label={ariaLabel || label}
      type={type} step={step} min={min} max={max}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-xl px-4 py-3 font-mono text-sm outline-none transition-all border ${
        dark
          ? 'bg-black/40 border-slate-700/60 text-white placeholder-slate-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20'
          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-300/30'
      }`}
    />
    {helpText && <p className={`text-[10px] font-medium leading-relaxed ${dark ? 'text-slate-600' : 'text-slate-400'}`}>{helpText}</p>}
  </div>
);

const ResultRow = ({ label, value, isHighlight, formula, dark }) => (
  <div className={`phd-kv flex items-center justify-between p-4 rounded-xl border ${
    dark ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-50/80 border-slate-200/80'
  }`}>
    <div>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
      {formula && <p className={`text-[9px] font-mono mt-0.5 ${dark ? 'text-slate-700' : 'text-slate-300'}`}>{formula}</p>}
    </div>
    <span className={`v font-mono text-base ${
      isHighlight
        ? dark ? 'text-cyan-400 font-black' : 'text-amber-600 font-black'
        : dark ? 'font-bold text-slate-200' : 'font-bold text-slate-700'
    }`}>
      {value}
    </span>
  </div>
);

const FormulaNote = ({ children, dark }) => (
  <div className={`flex items-start gap-2 p-3 rounded-lg text-[11px] leading-relaxed font-medium border ${
    dark ? 'bg-slate-800/40 border-slate-700/40 text-slate-500' : 'bg-amber-50/50 border-amber-200/40 text-slate-500'
  }`}>
    <Info className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${dark ? 'text-cyan-500/40' : 'text-amber-500/50'}`} />
    <span>{children}</span>
  </div>
);

/* ================================================================== */
/*  1. ODDS CONVERTER + EDGE                                           */
/* ================================================================== */
const OddsConverterSection = memo(function OddsConverterSection({ dark }) {
  const [oddsStr, setOddsStr] = useState("2.00");
  const [probStr, setProbStr] = useState("55");
  const dec = useMemo(() => parseOddsToDecimal(oddsStr), [oddsStr]);
  const formats = useMemo(() => decimalToFormats(dec), [dec]);
  const valid = isFinite(dec) && dec > 1;
  const p = Number(probStr) / 100;
  const implied = valid ? 1 / dec : 0;
  const edge = valid ? p - implied : 0;

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField dark={dark} label="Odds Input" ariaLabel="Odds Input" value={oddsStr} onChange={setOddsStr}
          placeholder="2.00, +150, -110, 5/2" helpText="Accepts Decimal, American (+/-), or Fractional formats" />
        <InputField dark={dark} label="Your Win Probability P (%)" ariaLabel="Your Win Probability P (%)" value={probStr} onChange={setProbStr}
          type="number" step="1" min="1" max="99" placeholder="55" />
      </div>
      {!valid && <p className="text-red-400 text-xs font-bold">Invalid odds format.</p>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ResultRow dark={dark} label="Decimal" value={formats.decimal} />
        <ResultRow dark={dark} label="Fractional" value={formats.fractional} />
        <ResultRow dark={dark} label="American" value={formats.american} />
        <ResultRow dark={dark} label="Implied Prob" value={formats.implied} />
      </div>
      <ResultRow dark={dark} label="Edge" value={`${(edge * 100).toFixed(2)}%`} isHighlight formula="Edge = P(win) - 1/odds" />
      <FormulaNote dark={dark}>Edge = Your estimated probability minus the bookmaker's implied probability. Positive edge indicates a potentially profitable wager over sufficient sample size.</FormulaNote>
    </div>
  );
});

/* ================================================================== */
/*  2. KELLY CRITERION                                                 */
/* ================================================================== */
const KellySection = memo(function KellySection({ dark }) {
  const [oddsStr, setOddsStr] = useState("2.10");
  const [probStr, setProbStr] = useState("52");
  const [fractionStr, setFractionStr] = useState("25");
  const [bankrollStr, setBankrollStr] = useState("1000");

  const dec = useMemo(() => parseOddsToDecimal(oddsStr), [oddsStr]);
  const p = Number(probStr) / 100;
  const q = 1 - p;
  const b = isFinite(dec) ? dec - 1 : 0;
  const fraction = Number(fractionStr) / 100;
  const bankroll = Number(bankrollStr);
  const fullKelly = b > 0 ? (b * p - q) / b : 0;
  const fractionalKelly = fullKelly * fraction;
  const betSize = isFinite(bankroll) && bankroll > 0 ? fractionalKelly * bankroll : 0;
  const growthFull = fullKelly > 0 && fullKelly < 1 ? p * Math.log(1 + fullKelly * b) + q * Math.log(1 - fullKelly) : 0;
  const growthFrac = fractionalKelly > 0 && fractionalKelly < 1 ? p * Math.log(1 + fractionalKelly * b) + q * Math.log(1 - fractionalKelly) : 0;
  const ruinProb = fullKelly > 0 && fractionalKelly > 0 ? Math.pow(q / p, 1 / fractionalKelly) : fullKelly <= 0 ? 1 : 0;

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <InputField dark={dark} label="Decimal Odds" value={oddsStr} onChange={setOddsStr} placeholder="2.10" />
        <InputField dark={dark} label="Win Probability (%)" value={probStr} onChange={setProbStr} type="number" step="1" min="1" max="99" />
        <InputField dark={dark} label="Kelly Fraction (%)" value={fractionStr} onChange={setFractionStr} type="number" step="5" min="1" max="100" helpText="Typical: 20-33% for risk control" />
        <InputField dark={dark} label="Bankroll ($)" value={bankrollStr} onChange={setBankrollStr} type="number" min="1" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <ResultRow dark={dark} label="Full Kelly f*" value={`${(fullKelly * 100).toFixed(2)}%`} formula="f* = (bp - q) / b" />
        <ResultRow dark={dark} label={`Fractional Kelly (${fractionStr}%)`} value={`${(fractionalKelly * 100).toFixed(2)}%`} isHighlight />
        <ResultRow dark={dark} label="Recommended Bet" value={betSize > 0 ? `$${betSize.toFixed(2)}` : "$0.00"} isHighlight />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <ResultRow dark={dark} label="Growth Rate (Full)" value={`${(growthFull * 100).toFixed(4)}%`} formula="G = p·ln(1+fb) + q·ln(1-f)" />
        <ResultRow dark={dark} label="Growth Rate (Frac)" value={`${(growthFrac * 100).toFixed(4)}%`} />
        <ResultRow dark={dark} label="Ruin Probability" value={ruinProb < 0.0001 ? "<0.01%" : `${(ruinProb * 100).toFixed(2)}%`} formula="P(ruin) ≈ (q/p)^(1/f)" />
      </div>
      <FormulaNote dark={dark}>The Kelly Criterion maximizes long-run geometric growth rate of capital. Fractional Kelly (typically 25%) reduces variance at a modest cost to expected growth, providing superior risk-adjusted returns over finite horizons.</FormulaNote>
    </div>
  );
});

/* ================================================================== */
/*  3. POISSON MATCH MODEL                                             */
/* ================================================================== */
const PoissonSection = memo(function PoissonSection({ dark }) {
  const [homeXg, setHomeXg] = useState("1.55");
  const [awayXg, setAwayXg] = useState("1.20");
  const [overLine, setOverLine] = useState("2.5");
  const hLam = Number(homeXg) || 0;
  const aLam = Number(awayXg) || 0;
  const line = Number(overLine) || 2.5;

  const grid = useMemo(() => {
    const matrix = [];
    for (let h = 0; h <= 8; h++) for (let a = 0; a <= 8; a++) matrix.push({ h, a, prob: poissonPmf(h, hLam) * poissonPmf(a, aLam) });
    return matrix;
  }, [hLam, aLam]);

  const results = useMemo(() => {
    let homeWin = 0, draw = 0, awayWin = 0, over = 0, under = 0, bttsYes = 0;
    grid.forEach(({ h, a, prob }) => {
      if (h > a) homeWin += prob; else if (h === a) draw += prob; else awayWin += prob;
      if (h + a > line) over += prob; else if (h + a < line) under += prob;
      if (h > 0 && a > 0) bttsYes += prob;
    });
    return { homeWin, draw, awayWin, over, under, bttsYes, bttsNo: 1 - bttsYes };
  }, [grid, line]);

  const topScores = useMemo(() => [...grid].sort((a, b) => b.prob - a.prob).slice(0, 6), [grid]);
  const fairOdds = (p) => p > 0.001 ? (1 / p).toFixed(2) : "—";

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-3 gap-4">
        <InputField dark={dark} label="Home xG (λ₁)" value={homeXg} onChange={setHomeXg} type="number" step="0.05" min="0" placeholder="1.55" />
        <InputField dark={dark} label="Away xG (λ₂)" value={awayXg} onChange={setAwayXg} type="number" step="0.05" min="0" placeholder="1.20" />
        <InputField dark={dark} label="Over/Under Line" value={overLine} onChange={setOverLine} type="number" step="0.5" min="0.5" placeholder="2.5" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <ResultRow dark={dark} label="Home Win" value={`${(results.homeWin * 100).toFixed(1)}%`} formula={`Fair: ${fairOdds(results.homeWin)}`} />
        <ResultRow dark={dark} label="Draw" value={`${(results.draw * 100).toFixed(1)}%`} formula={`Fair: ${fairOdds(results.draw)}`} />
        <ResultRow dark={dark} label="Away Win" value={`${(results.awayWin * 100).toFixed(1)}%`} formula={`Fair: ${fairOdds(results.awayWin)}`} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ResultRow dark={dark} label={`Over ${overLine}`} value={`${(results.over * 100).toFixed(1)}%`} isHighlight formula={`Fair: ${fairOdds(results.over)}`} />
        <ResultRow dark={dark} label={`Under ${overLine}`} value={`${(results.under * 100).toFixed(1)}%`} formula={`Fair: ${fairOdds(results.under)}`} />
        <ResultRow dark={dark} label="BTTS Yes" value={`${(results.bttsYes * 100).toFixed(1)}%`} formula={`Fair: ${fairOdds(results.bttsYes)}`} />
        <ResultRow dark={dark} label="BTTS No" value={`${(results.bttsNo * 100).toFixed(1)}%`} formula={`Fair: ${fairOdds(results.bttsNo)}`} />
      </div>
      <div>
        <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Most Likely Scorelines</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {topScores.map(({ h, a, prob }, i) => (
            <div key={i} className={`text-center p-2.5 rounded-lg border ${
              dark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <p className={`font-mono font-black text-sm ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{h} – {a}</p>
              <p className={`text-[10px] font-mono ${dark ? 'text-slate-600' : 'text-slate-400'}`}>{(prob * 100).toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </div>
      <FormulaNote dark={dark}>Bivariate Poisson model: P(H=h, A=a) = Poisson(h; λ₁) × Poisson(a; λ₂). Fair odds = 1/P(outcome). This independent Poisson assumes no correlation — advanced models add a covariance parameter.</FormulaNote>
    </div>
  );
});

/* ================================================================== */
/*  4. CVaR / VALUE-AT-RISK                                            */
/* ================================================================== */
const CvarSection = memo(function CvarSection({ dark }) {
  const [bankrollStr, setBankrollStr] = useState("1000");
  const [numBetsStr, setNumBetsStr] = useState("10");
  const [avgOddsStr, setAvgOddsStr] = useState("2.00");
  const [avgProbStr, setAvgProbStr] = useState("55");
  const [stakeStr, setStakeStr] = useState("3");
  const [confidenceStr, setConfidenceStr] = useState("95");

  const bankroll = Number(bankrollStr) || 1000;
  const numBets = Math.max(1, Math.round(Number(numBetsStr) || 10));
  const avgOdds = Number(avgOddsStr) || 2;
  const avgProb = (Number(avgProbStr) || 55) / 100;
  const stakePerc = (Number(stakeStr) || 3) / 100;
  const alpha = (Number(confidenceStr) || 95) / 100;
  const stakeAmount = bankroll * stakePerc;
  const winPnl = stakeAmount * (avgOdds - 1);
  const losePnl = -stakeAmount;
  const mu = avgProb * winPnl + (1 - avgProb) * losePnl;
  const sigma2 = avgProb * Math.pow(winPnl - mu, 2) + (1 - avgProb) * Math.pow(losePnl - mu, 2);
  const sigma = Math.sqrt(sigma2);
  const portMu = numBets * mu;
  const portSigma = sigma * Math.sqrt(numBets);
  const zAlpha = normInv(1 - alpha);
  const VaR = -(portMu + zAlpha * portSigma);
  const phiZ = Math.exp(-zAlpha * zAlpha / 2) / Math.sqrt(2 * Math.PI);
  const CVaR = -(portMu - portSigma * phiZ / (1 - alpha));
  const sharpe = sigma > 0 ? mu / sigma : 0;

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <InputField dark={dark} label="Bankroll ($)" value={bankrollStr} onChange={setBankrollStr} type="number" min="100" />
        <InputField dark={dark} label="Number of Bets" value={numBetsStr} onChange={setNumBetsStr} type="number" min="1" max="1000" />
        <InputField dark={dark} label="Avg Decimal Odds" value={avgOddsStr} onChange={setAvgOddsStr} type="number" step="0.05" min="1.01" />
        <InputField dark={dark} label="Avg Win Prob (%)" value={avgProbStr} onChange={setAvgProbStr} type="number" min="1" max="99" />
        <InputField dark={dark} label="Stake per Bet (% of BR)" value={stakeStr} onChange={setStakeStr} type="number" step="0.5" min="0.5" max="25" />
        <InputField dark={dark} label="Confidence Level (%)" value={confidenceStr} onChange={setConfidenceStr} type="number" min="90" max="99.9" step="0.5" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <ResultRow dark={dark} label="Expected PnL" value={`${portMu >= 0 ? '+' : ''}$${portMu.toFixed(2)}`} formula="μ_portfolio = n × E[PnL_bet]" />
        <ResultRow dark={dark} label="Portfolio Std Dev" value={`$${portSigma.toFixed(2)}`} formula="σ_p = σ_bet × √n" />
        <ResultRow dark={dark} label="Bet Sharpe Ratio" value={sharpe.toFixed(3)} formula="SR = μ_bet / σ_bet" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ResultRow dark={dark} label={`VaR (${confidenceStr}%)`} value={`$${Math.max(0, VaR).toFixed(2)}`} isHighlight formula="VaR_α = -(μ + z_α × σ)" />
        <ResultRow dark={dark} label={`CVaR / ES (${confidenceStr}%)`} value={`$${Math.max(0, CVaR).toFixed(2)}`} isHighlight formula="CVaR_α = -(μ - σ×φ(z_α)/(1-α))" />
      </div>
      <FormulaNote dark={dark}>VaR = maximum expected loss at the given confidence level. CVaR (Expected Shortfall) measures the average loss beyond VaR — a coherent risk measure preferred by Basel III. Parametric normal approximation via CLT.</FormulaNote>
    </div>
  );
});

/* ================================================================== */
/*  5. PARLAY / ACCUMULATOR ANALYZER                                   */
/* ================================================================== */
const ParlaySection = memo(function ParlaySection({ dark }) {
  const [legsStr, setLegsStr] = useState("1.80, 2.10, 1.65");
  const [probsStr, setProbsStr] = useState("58, 50, 63");
  const [stakeStr, setStakeStr] = useState("50");
  const [correlationStr, setCorrelationStr] = useState("0");

  const legs = useMemo(() => legsStr.split(",").map(s => parseOddsToDecimal(s.trim())).filter(n => isFinite(n) && n > 1), [legsStr]);
  const probs = useMemo(() => probsStr.split(",").map(s => Number(s.trim()) / 100).filter(n => n > 0 && n < 1), [probsStr]);
  const stake = Number(stakeStr) || 0;
  const correlation = Math.max(-0.5, Math.min(0.5, Number(correlationStr) || 0));
  const n = Math.min(legs.length, probs.length);
  const combinedOdds = useMemo(() => legs.slice(0, n).reduce((acc, o) => acc * o, 1), [legs, n]);
  const combinedImplied = useMemo(() => legs.slice(0, n).reduce((acc, o) => acc * (1 / o), 1), [legs, n]);
  const trueProb = useMemo(() => {
    if (n === 0) return 0;
    const indep = probs.slice(0, n).reduce((acc, p) => acc * p, 1);
    const corrAdj = 1 + correlation * (n - 1) * 0.15;
    return Math.max(0.001, Math.min(0.99, indep * corrAdj));
  }, [probs, n, correlation]);
  const payout = combinedOdds * stake;
  const ev = trueProb * (payout - stake) - (1 - trueProb) * stake;
  const evPercent = stake > 0 ? (ev / stake) * 100 : 0;
  const vig = 1 - combinedImplied;

  const legDetails = useMemo(() => {
    return legs.slice(0, n).map((odds, i) => {
      const p = probs[i] || 0;
      const impl = 1 / odds;
      return { odds, prob: p, implied: impl, edge: p - impl };
    });
  }, [legs, probs, n]);

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField dark={dark} label="Leg Odds (comma-separated)" value={legsStr} onChange={setLegsStr} placeholder="1.80, 2.10, 1.65" helpText="Decimal odds for each leg" />
        <InputField dark={dark} label="Win Probabilities (%, comma-separated)" value={probsStr} onChange={setProbsStr} placeholder="58, 50, 63" helpText="Your estimated win % for each leg" />
        <InputField dark={dark} label="Stake ($)" value={stakeStr} onChange={setStakeStr} type="number" min="1" />
        <InputField dark={dark} label="Correlation Factor" value={correlationStr} onChange={setCorrelationStr} type="number" step="0.05" min="-0.5" max="0.5" helpText="0 = independent, +/- = correlated legs" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ResultRow dark={dark} label="Combined Odds" value={n > 0 ? combinedOdds.toFixed(3) : "—"} />
        <ResultRow dark={dark} label="True Joint Prob" value={`${(trueProb * 100).toFixed(2)}%`} />
        <ResultRow dark={dark} label="Potential Payout" value={`$${payout.toFixed(2)}`} />
        <ResultRow dark={dark} label="Implied Vig" value={`${(vig * 100).toFixed(1)}%`} />
      </div>
      <ResultRow dark={dark} label="Parlay EV" value={`${ev >= 0 ? '+' : ''}$${ev.toFixed(2)} (${evPercent >= 0 ? '+' : ''}${evPercent.toFixed(1)}%)`} isHighlight formula="EV = P(all win) × (payout - stake) - P(any lose) × stake" />
      {legDetails.length > 0 && (
        <div>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Leg Breakdown</p>
          <div className="grid grid-cols-1 gap-2">
            {legDetails.map((leg, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-lg text-[12px] font-medium border ${
                dark ? 'bg-slate-800/40 border-slate-700/40' : 'bg-slate-50 border-slate-200/60'
              }`}>
                <span className={`font-bold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Leg {i + 1}</span>
                <span className={`font-mono ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Odds: {leg.odds.toFixed(2)}</span>
                <span className={`font-mono ${dark ? 'text-slate-500' : 'text-slate-400'}`}>P: {(leg.prob * 100).toFixed(0)}%</span>
                <span className={`font-mono ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Impl: {(leg.implied * 100).toFixed(1)}%</span>
                <span className={`font-mono font-bold ${leg.edge > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  Edge: {(leg.edge * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <FormulaNote dark={dark}>Parlay EV compounds individual leg edges but also compounds risk. A positive-EV parlay requires each leg to carry edge. The correlation factor adjusts joint probability for non-independent events (e.g., same-game parlays).</FormulaNote>
    </div>
  );
});

/* ================================================================== */
/*  6. CLOSING LINE VALUE (CLV) TRACKER                                */
/* ================================================================== */
const ClvSection = memo(function ClvSection({ dark }) {
  const [openOddsStr, setOpenOddsStr] = useState("2.10");
  const [closeOddsStr, setCloseOddsStr] = useState("1.90");
  const [numBetsStr, setNumBetsStr] = useState("100");
  const [avgClvStr, setAvgClvStr] = useState("3.5");
  const openDec = parseOddsToDecimal(openOddsStr);
  const closeDec = parseOddsToDecimal(closeOddsStr);
  const numBets = Number(numBetsStr) || 100;
  const avgClv = Number(avgClvStr) || 0;
  const openImpl = isFinite(openDec) ? 1 / openDec : 0;
  const closeImpl = isFinite(closeDec) ? 1 / closeDec : 0;
  const clvSingle = closeImpl - openImpl;
  const expectedRoi = avgClv / 100;
  const expectedProfit = expectedRoi * numBets;

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <InputField dark={dark} label="Your Odds (at bet time)" value={openOddsStr} onChange={setOpenOddsStr} placeholder="2.10" />
        <InputField dark={dark} label="Closing Line Odds" value={closeOddsStr} onChange={setCloseOddsStr} placeholder="1.90" helpText="Market odds at kickoff" />
        <InputField dark={dark} label="Total Bets Tracked" value={numBetsStr} onChange={setNumBetsStr} type="number" min="1" />
        <InputField dark={dark} label="Avg CLV (%)" value={avgClvStr} onChange={setAvgClvStr} type="number" step="0.1" helpText="Average closing line value across all bets" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ResultRow dark={dark} label="Open Implied" value={`${(openImpl * 100).toFixed(2)}%`} />
        <ResultRow dark={dark} label="Close Implied" value={`${(closeImpl * 100).toFixed(2)}%`} />
        <ResultRow dark={dark} label="This Bet CLV" value={`${(clvSingle * 100).toFixed(2)}%`} isHighlight formula="CLV = P_close - P_open" />
        <ResultRow dark={dark} label={`Expected ROI (${numBets} bets)`} value={`${(expectedRoi * 100).toFixed(1)}%`} formula={`≈ ${expectedProfit.toFixed(1)} units`} />
      </div>
      <FormulaNote dark={dark}>Closing Line Value is the strongest known predictor of long-term betting profitability. If you consistently beat the closing line, you are extracting value from the market. Research shows CLV correlates ~1:1 with long-run ROI.</FormulaNote>
    </div>
  );
});

/* ================================================================== */
/*  MAIN CALCULATOR TAB                                                */
/* ================================================================== */
const CalculatorTab = memo(function CalculatorTab({ darkMode = true }) {
  const dark = darkMode;
  return (
    <div className="space-y-12 animate-in fade-in duration-500" id="phd-panels-panel-calculator">
      <div className="max-w-3xl space-y-5">
        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
          dark ? 'bg-emerald-500/8 border-emerald-500/18 text-emerald-400' : 'bg-emerald-50 border-emerald-200/60 text-emerald-700'
        }`}>
          <Calculator className="w-3.5 h-3.5" />
          Quantitative Tools
        </div>
        <h2 className={`text-4xl md:text-5xl font-black tracking-tight leading-[1.1] ${dark ? 'text-white' : 'text-slate-900'}`}>
          Analytical <br />
          <span className={`text-transparent bg-clip-text bg-gradient-to-r ${
            dark ? 'from-emerald-400 to-cyan-500' : 'from-emerald-600 to-cyan-600'
          }`}>
            Calculator Suite.
          </span>
        </h2>
        <p className={`text-base md:text-lg leading-relaxed font-medium max-w-2xl ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          Production-grade mathematical tools used in quantitative sports analytics.
          Every formula is implemented with full precision — from Kelly criterion to CVaR risk modeling.
        </p>
      </div>

      <div className="space-y-4">
        <Section dark={dark} id="odds" icon={Percent} title="Odds Converter & Edge Calculator" subtitle="Decimal, American, Fractional — with implied probability and edge"
          color={dark ? "#22d3ee" : "#0891b2"} bg={dark ? "rgba(6,182,212,0.10)" : "rgba(6,182,212,0.08)"} defaultOpen={true}>
          <OddsConverterSection dark={dark} />
        </Section>

        <Section dark={dark} id="kelly" icon={TrendingUp} title="Kelly Criterion & Growth Optimization" subtitle="Full Kelly, fractional Kelly, geometric growth rate, ruin probability"
          color={dark ? "#a78bfa" : "#7c3aed"} bg={dark ? "rgba(139,92,246,0.10)" : "rgba(139,92,246,0.08)"}>
          <KellySection dark={dark} />
        </Section>

        <Section dark={dark} id="poisson" icon={BarChart3} title="Poisson Match Model" subtitle="Bivariate Poisson for 1X2, Over/Under, BTTS, and exact scoreline probabilities"
          color={dark ? "#f97316" : "#ea580c"} bg={dark ? "rgba(249,115,22,0.10)" : "rgba(249,115,22,0.08)"}>
          <PoissonSection dark={dark} />
        </Section>

        <Section dark={dark} id="cvar" icon={Shield} title="VaR & CVaR Risk Analysis" subtitle="Value-at-Risk, Expected Shortfall, portfolio-level tail risk modeling"
          color={dark ? "#f43f5e" : "#e11d48"} bg={dark ? "rgba(244,63,94,0.10)" : "rgba(244,63,94,0.08)"}>
          <CvarSection dark={dark} />
        </Section>

        <Section dark={dark} id="parlay" icon={Layers} title="Parlay & Accumulator Analyzer" subtitle="Multi-leg EV, correlation adjustment, vig analysis, per-leg edge breakdown"
          color={dark ? "#fbbf24" : "#d97706"} bg={dark ? "rgba(245,158,11,0.10)" : "rgba(245,158,11,0.08)"}>
          <ParlaySection dark={dark} />
        </Section>

        <Section dark={dark} id="clv" icon={TrendingUp} title="Closing Line Value Tracker" subtitle="CLV measurement — the strongest predictor of long-term profitability"
          color={dark ? "#34d399" : "#059669"} bg={dark ? "rgba(16,185,129,0.10)" : "rgba(16,185,129,0.08)"}>
          <ClvSection dark={dark} />
        </Section>
      </div>
    </div>
  );
});

export default CalculatorTab;
