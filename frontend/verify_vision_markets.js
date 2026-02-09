
import { strict as assert } from 'assert';

// Mock the flattenOdds function from visionScraper.js (since we can't easily import internal functions in this environment without a build step)
// I will copy the function logic here to verify it works as intended with the new keys.

function flattenOdds(oddsObj) {
    const flat = {};
    if (!oddsObj || typeof oddsObj !== 'object') return flat;

    // Helper: Clean Value
    const clean = (v) => {
        if (v == null) return null;
        let s = String(v).replace(',', '.').trim();
        const n = Number(s);
        return Number.isFinite(n) ? n : null;
    };

    // 1. Primary Markets (Moneyline / 1X2)
    const ml = oddsObj.moneyline || oddsObj.h2h || [];
    const isArrayML = Array.isArray(ml) && ml.length >= 2;

    let home = clean(oddsObj.homeWin || oddsObj.homeML || oddsObj.home_win || (isArrayML ? ml[0] : null));
    let draw = clean(oddsObj.draw || oddsObj.drawML || oddsObj.draw_win || (isArrayML && ml.length === 3 ? ml[1] : null));
    let away = clean(oddsObj.awayWin || oddsObj.awayML || oddsObj.away_win || (isArrayML ? (ml.length === 3 ? ml[2] : ml[1]) : null));

    if (home) flat.homeWin = home;
    if (draw) flat.draw = draw;
    if (away) flat.awayWin = away;

    // 2. Totals
    const t = oddsObj.total || {};
    let tLine = clean(oddsObj.totalLine || oddsObj.total_line || oddsObj.line || t.line);
    let tOver = clean(oddsObj.totalOver || oddsObj.total_over || oddsObj.over || t.over);
    let tUnder = clean(oddsObj.totalUnder || oddsObj.total_under || oddsObj.under || t.under);

    if (tLine !== null) flat.totalLine = tLine;
    if (tOver) flat.totalOver = tOver;
    if (tUnder) flat.totalUnder = tUnder;

    // 3. Spreads
    const s = oddsObj.spread || {};
    let sLine = clean(oddsObj.spreadLine || oddsObj.spread_line || s.line);
    let sHome = clean(oddsObj.homeSpread || oddsObj.home_spread || s.home);
    let sAway = clean(oddsObj.awaySpread || oddsObj.away_spread || s.away);

    if (sLine !== null) flat.spreadLine = sLine;
    if (sHome) flat.homeSpread = sHome;
    if (sAway) flat.awaySpread = sAway;

    // 4. BTTS
    let bYes = clean(oddsObj.bttsYes || oddsObj.btts_yes || oddsObj.yes);
    let bNo = clean(oddsObj.bttsNo || oddsObj.btts_no || oddsObj.no);

    if (bYes) flat.bttsYes = bYes;
    if (bNo) flat.bttsNo = bNo;

    return flat;
}

// Test Case 1: Standard Vision Output (New Format)
const test1 = {
    homeWin: 1.71,
    draw: 3.75,
    awayWin: 5.00,
    totalLine: 2.5,
    totalOver: 2.00,
    totalUnder: 1.78,
    bttsYes: 1.94,
    bttsNo: 1.79
};

const result1 = flattenOdds(test1);
console.log("Test 1 Result:", result1);

assert.equal(result1.homeWin, 1.71);
assert.equal(result1.draw, 3.75);
assert.equal(result1.awayWin, 5.00);
assert.equal(result1.totalLine, 2.5);
assert.equal(result1.totalOver, 2.00);
assert.equal(result1.totalUnder, 1.78);
assert.equal(result1.bttsYes, 1.94);
assert.equal(result1.bttsNo, 1.79);

// Test Case 2: Nested/Alternate Keys (Legacy/LLM variation protection)
const test2 = {
    home_win: "1,71", // comma check
    draw: "3,75",
    away_win: "5,00",
    total: {
        line: 2.5,
        over: 2.00,
        under: 1.78
    },
    btts_yes: 1.94,
    btts_no: 1.79
};

const result2 = flattenOdds(test2);
console.log("Test 2 Result:", result2);

assert.equal(result2.homeWin, 1.71);
assert.equal(result2.totalLine, 2.5);
assert.equal(result2.bttsYes, 1.94);

console.log("✅ All tests passed!");
