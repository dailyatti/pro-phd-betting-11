
const convertOddsToDecimalAuto = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const s = String(value).trim().replace(/,/g, ".");
    const n = Number(s);
    if (!Number.isFinite(n) || n < 1.0001) return null;
    return n;
};

const flattenOdds = (rawOdds, sport) => {
    if (!rawOdds || typeof rawOdds !== "object") return {};
    const val = (v) => convertOddsToDecimalAuto(v);
    const flat = {};
    const s = String(sport || "FOOTBALL").toUpperCase();

    const pHome1x2 = val(rawOdds.homeWin);
    const pDraw1x2 = val(rawOdds.draw);
    const pAway1x2 = val(rawOdds.awayWin);

    const pHomeML = val(rawOdds.homeML);
    const pAwayML = val(rawOdds.awayML);

    if (pHome1x2) { flat.homeWin = pHome1x2; flat["1"] = pHome1x2; }
    if (pAway1x2) { flat.awayWin = pAway1x2; flat["2"] = pAway1x2; }
    if (pDraw1x2) { flat.draw = pDraw1x2; flat["X"] = pDraw1x2; }

    const isMoneylineSport = ["BASKETBALL", "NBA", "NFL", "MLB", "NHL", "TENNIS"].includes(s);

    if (pHomeML) {
        flat.homeML = pHomeML;
        if (isMoneylineSport) flat.homeWin = pHomeML;
    }
    if (pAwayML) {
        flat.awayML = pAwayML;
        if (isMoneylineSport) flat.awayWin = pAwayML;
    }

    return flat;
};

const hasPrimaryOdds = (obj) => {
    const usefulKeys = ['homeWin', 'awayWin', 'draw', 'homeML', 'awayML'];
    return usefulKeys.some(k => typeof obj[k] === 'number' && obj[k] > 1.0001);
};

// TEST CASE: FTC vs Újpest (Draw 4.65 only)
const mockOdds = { draw: "4.65" };
const flat = flattenOdds(mockOdds, "FOOTBALL");
console.log("Flattened Odds:", JSON.stringify(flat, null, 2));
console.log("Has Primary Odds:", hasPrimaryOdds(flat));

if (flat.draw === 4.65 && hasPrimaryOdds(flat)) {
    console.log("SUCCESS: Partial (Draw-only) odds recognized correctly.");
} else {
    console.error("FAILURE: Partial odds recognition failed.");
    process.exit(1);
}
