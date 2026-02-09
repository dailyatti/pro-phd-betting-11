/**
 * Odds Flattening Module
 * Transforms nested Vision output into a flat, engine-ready structure.
 */

import { num, convertOddsToDecimalAuto as val } from "../utils/oddsConversion.js";

/**
 * flattens nested odds structure from Vision into flat keys.
 * @param {Object} rawOdds 
 * @param {string} sport 
 * @returns {Object}
 */
export const flattenOdds = (rawOdds, sport) => {
    if (!rawOdds || typeof rawOdds !== "object") return {};

    const s = String(sport || "FOOTBALL").toUpperCase();
    const flat = {};

    // ---------------------------
    // 1) MONEYLINE / 1X2 (RELAXED SEPARATION)
    // ---------------------------
    let mlRaw = rawOdds.moneyline || rawOdds.match_winner || rawOdds["1x2"] || rawOdds.match_result || rawOdds;
    if (Array.isArray(mlRaw)) mlRaw = mlRaw[0] || {};
    const ml = mlRaw && typeof mlRaw === "object" ? mlRaw : {};

    const pHome1x2 = val(rawOdds.homeWin) || val(ml.homeWin);
    const pDraw1x2 = val(rawOdds.draw) || val(ml.draw);
    const pAway1x2 = val(rawOdds.awayWin) || val(ml.awayWin);

    const pHomeML = val(rawOdds.homeML) || val(ml.homeML);
    const pAwayML = val(rawOdds.awayML) || val(ml.awayML);

    // Logic: Map whatever we found, even if partial (e.g. just Draw)
    if (pHome1x2) { flat.homeWin = pHome1x2; flat["1"] = pHome1x2; }
    if (pAway1x2) { flat.awayWin = pAway1x2; flat["2"] = pAway1x2; }
    if (pDraw1x2) { flat.draw = pDraw1x2; flat["X"] = pDraw1x2; }

    const isMoneylineSport = [
        "BASKETBALL", "NBA", "NFL", "MLB", "NHL",
        "TENNIS", "ESPORTS", "MMA", "BOXING", "UFC"
    ].includes(s);

    if (pHomeML) {
        flat.homeML = pHomeML;
        if (isMoneylineSport) flat.homeWin = pHomeML;
    }
    if (pAwayML) {
        flat.awayML = pAwayML;
        if (isMoneylineSport) flat.awayWin = pAwayML;
    }

    if (!flat.homeWin && !flat.homeML) {
        const homeGeneric = val(ml.home) || val(ml["1"]) || val(rawOdds["1"]);
        const drawGeneric = val(ml.draw) || val(ml["X"]) || val(ml["x"]) || val(rawOdds["X"]);
        const awayGeneric = val(ml.away) || val(ml["2"]) || val(rawOdds["2"]);

        if (homeGeneric && awayGeneric) {
            if (isMoneylineSport) {
                flat.homeML = homeGeneric;
                flat.awayML = awayGeneric;
            } else {
                flat.homeWin = homeGeneric;
                flat.awayWin = awayGeneric;
                if (drawGeneric) flat.draw = drawGeneric;
            }
        }
    }

    // ---------------------------
    // 2) TOTALS
    // ---------------------------
    let mainTotal = null;
    const flatTotalLine = num(rawOdds.line) || num(rawOdds.totalLine);
    const flatOver = val(rawOdds.over) || val(rawOdds.totalOver);
    const flatUnder = val(rawOdds.under) || val(rawOdds.totalUnder);

    if (flatTotalLine !== null && (flatOver || flatUnder)) {
        mainTotal = { line: flatTotalLine, over: flatOver, under: flatUnder };
    }

    const totals = Array.isArray(rawOdds.totals) ? rawOdds.totals : [];
    if (!mainTotal && totals.length > 0) {
        const pickMainTotal = () => {
            if (s === "FOOTBALL" || s === "SOCCER") return totals.find((t) => num(t.line) === 2.5) || totals[1] || totals[0];
            if (s === "BASKETBALL" || s === "NBA") return totals.find((t) => {
                const L = num(t.line);
                return L !== null && L >= 170 && L <= 280;
            }) || totals[0];
            return totals[0];
        };
        mainTotal = pickMainTotal();
    }

    if (mainTotal) {
        const L = num(mainTotal.line);
        const O = val(mainTotal.over);
        const U = val(mainTotal.under);
        if (L !== null) {
            flat.totalLine = L;
            flat.line = L;
        }
        if (O) flat.totalOver = O;
        if (U) flat.totalUnder = U;
    }

    // ---------------------------
    // 3) SPREAD / HANDICAP
    // ---------------------------
    let mainSpread = null;
    const flatSpreadLine = num(rawOdds.spreadLine) || num(rawOdds.handicapLine);
    const flatS1 = val(rawOdds.homeSpread) || val(rawOdds.s1);
    const flatS2 = val(rawOdds.awaySpread) || val(rawOdds.s2);

    if (flatSpreadLine !== null && (flatS1 || flatS2)) {
        mainSpread = { line: flatSpreadLine, home: flatS1, away: flatS2 };
    }

    const spreads = Array.isArray(rawOdds.spreads) ? rawOdds.spreads : [];
    if (!mainSpread && spreads.length > 0) {
        mainSpread = spreads[0];
    }

    if (mainSpread) {
        const L = num(mainSpread.line);
        const H = val(mainSpread.home);
        const A = val(mainSpread.away);
        if (L !== null) flat.spreadLine = L;
        if (H) flat.homeSpread = H;
        if (A) flat.awaySpread = A;
    }

    // ---------------------------
    // 4) BTTS
    // ---------------------------
    let bttsYes = val(rawOdds.bttsYes);
    let bttsNo = val(rawOdds.bttsNo);
    if (!bttsYes && !bttsNo) {
        const bttsObj = rawOdds.btts || {};
        bttsYes = val(bttsObj.yes) || val(bttsObj.bttsYes);
        bttsNo = val(bttsObj.no) || val(bttsObj.bttsNo);
    }
    if (bttsYes) flat.bttsYes = bttsYes;
    if (bttsNo) flat.bttsNo = bttsNo;

    // ---------------------------
    // 5) ASIAN HANDICAP (FOOTBALL)
    // ---------------------------
    const ahRaw = rawOdds.asian_handicap || rawOdds.ah || {};
    const ahLine = num(ahRaw.line);
    const ahHome = val(ahRaw.home);
    const ahAway = val(ahRaw.away);
    if (ahLine !== null) flat.ahLine = ahLine;
    if (ahHome) flat.ahHome = ahHome;
    if (ahAway) flat.ahAway = ahAway;

    return flat;
};
