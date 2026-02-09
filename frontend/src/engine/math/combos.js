/**
 * PhD Betting Engine - Combo/Parlay Module (Production Hardened)
 * Handles multi-leg bets with basic correlation adjustments + safety guards.
 */

import { calcEV } from "./ev.js";

const EPS = 1e-12;

const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const clamp01 = (p) => (p < 0 ? 0 : p > 1 ? 1 : p);

const safeOdds = (o) => {
  const x = Number(o);
  if (!Number.isFinite(x) || x <= 1) return NaN;
  return x;
};

const safeProb = (p) => {
  const x = Number(p);
  if (!Number.isFinite(x)) return NaN;
  return clamp01(x);
};

/**
 * Combined decimal odds of a parlay.
 * @param {number[]} oddsArray
 * @returns {number}
 */
export const calcComboOdds = (oddsArray) => {
  if (!Array.isArray(oddsArray) || oddsArray.length === 0) return NaN;
  let acc = 1;
  for (const o of oddsArray) {
    const odd = safeOdds(o);
    if (!isNum(odd)) return NaN;
    acc *= odd;
  }
  return acc;
};

/**
 * Combined probability under independence.
 * @param {number[]} probs
 * @returns {number}
 */
export const calcComboProbIndependent = (probs) => {
  if (!Array.isArray(probs) || probs.length === 0) return NaN;
  let acc = 1;
  for (const p of probs) {
    const pr = safeProb(p);
    if (!isNum(pr)) return NaN;
    acc *= pr;
  }
  return clamp01(acc);
};

/**
 * Correlation adjustment:
 * - If legs are from the same match (or same market family), apply stronger penalty.
 * - Penalty composes with number of legs: p_final = p_raw * (1 - penalty)^(k-1)
 *
 * @param {number} rawProb
 * @param {number} penalty 0..0.9 (recommended)
 * @param {number} k number of legs
 */
export const applyCorrelationPenalty = (rawProb, penalty, k) => {
  const p = clamp01(rawProb);
  const pen = clamp01(penalty);
  const kk = Math.max(1, Math.floor(k || 1));
  if (kk <= 1 || pen <= 0) return p;

  // compounding penalty for extra legs
  const factor = Math.pow(1 - pen, kk - 1);
  return clamp01(p * factor);
};

/**
 * Analyzes a combo bet with optional correlation handling.
 *
 * legs: [{ odds, p, matchId?, tag? }]
 * options:
 *  - correlationPenalty: explicit 0..0.9
 *  - autoCorrelation: if true, apply default penalty when same matchId repeats
 *  - autoPenaltySameMatch: default 0.08 (8%) per extra leg same match
 */
export const analyzeCombo = (
  legs,
  options = {}
) => {
  const {
    correlationPenalty = 0,
    autoCorrelation = true,
    autoPenaltySameMatch = 0.08,
  } = options;

  const warnings = [];
  const cleanLegs = Array.isArray(legs) ? legs : [];

  if (cleanLegs.length === 0) {
    return {
      odds: 0,
      p: 0,
      ev: 0,
      impliedProb: 0,
      edge: 0,
      fairOdds: 0,
      legsCount: 0,
      warnings: ["No legs provided."],
    };
  }

  const oddsArr = [];
  const probArr = [];
  const matchIds = [];

  for (const [i, l] of cleanLegs.entries()) {
    const o = safeOdds(l?.odds);
    const p = safeProb(l?.p);

    if (!isNum(o)) warnings.push(`Leg #${i + 1}: invalid odds (${l?.odds}).`);
    if (!isNum(p)) warnings.push(`Leg #${i + 1}: invalid probability (${l?.p}).`);

    if (!isNum(o) || !isNum(p)) continue;

    oddsArr.push(o);
    probArr.push(p);
    matchIds.push(l?.matchId ? String(l.matchId) : "");
  }

  if (oddsArr.length === 0) {
    return {
      odds: 0,
      p: 0,
      ev: 0,
      impliedProb: 0,
      edge: 0,
      fairOdds: 0,
      legsCount: 0,
      warnings: warnings.length ? warnings : ["All legs invalid."],
    };
  }

  const combinedOdds = calcComboOdds(oddsArr);
  const rawProb = calcComboProbIndependent(probArr);

  // Decide penalty
  let pen = clamp01(correlationPenalty);

  if (autoCorrelation && pen === 0) {
    // If same matchId appears more than once, apply default penalty
    const counts = new Map();
    for (const id of matchIds) {
      if (!id) continue;
      counts.set(id, (counts.get(id) || 0) + 1);
    }
    const maxDup = Math.max(1, ...Array.from(counts.values()));
    if (maxDup >= 2) {
      pen = clamp01(autoPenaltySameMatch);
      warnings.push(`Auto-correlation applied: same-match legs detected (maxDup=${maxDup}).`);
    }
  }

  const combinedProb = applyCorrelationPenalty(rawProb, pen, oddsArr.length);

  const ev = calcEV(combinedProb, combinedOdds);

  const impliedProb = combinedOdds > 1 ? 1 / combinedOdds : 0;
  const edge = combinedProb - impliedProb;
  const fairOdds = combinedProb > EPS ? 1 / combinedProb : 0;

  return {
    odds: Number.isFinite(combinedOdds) ? combinedOdds : 0,
    p: Number.isFinite(combinedProb) ? combinedProb : 0,
    ev: Number.isFinite(ev) ? ev : 0,

    impliedProb,
    edge,
    fairOdds,
    legsCount: oddsArr.length,
    correlationPenaltyUsed: pen,

    warnings,
  };
};

export default {
  calcComboOdds,
  calcComboProbIndependent,
  applyCorrelationPenalty,
  analyzeCombo,
};