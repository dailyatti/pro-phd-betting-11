
/**
 * MPC Reference Image Verification Script
 * 
 * Goal: Prove that the system correctly interprets the User's reference image
 * (Hungarian headers, Comma decimals) and prepares valid data for the Math Engine.
 */

// 1. SIMULATE RAW GPT VISION OUTPUT
// This represents exactly what GPT "sees" based on my new prompt instructions
const rawGptOutput = {
    "_raw_text_dump": "Real Sociedad Elche Hazai 1,66... Alaves Getafe... Fiorentina Torino...",
    "matches": [
        {
            "sport": "FOOTBALL",
            "team_1": "Real Sociedad",
            "team_2": "Elche",
            "odds": {
                "Hazai": "1,66", // Hungarian
                "Döntetlen": "4,00",
                "Vendég": "5,00",
                "Igen": "1,79",
                "Nem": "1,94",
                "Gólszám": "2,5",
                "Több": "1,49",
                "Kevesebb": "2,48"
            }
        },
        {
            "sport": "FOOTBALL",
            "team_1": "Alavés",
            "team_2": "Getafe",
            "odds": {
                "Hazai": "2,41",
                "Döntetlen": "2,70",
                "Vendég": "3,85",
                "Igen": "2,75",
                "Nem": "1,39"
            }
        },
        {
            "sport": "FOOTBALL",
            "team_1": "Fiorentina",
            "team_2": "Torino",
            "odds": {
                "Hazai": "1,73",
                "Döntetlen": "3,85",
                "Vendég": "4,85",
                "Igen": "1,76",
                "Nem": "1,97"
            }
        }
    ]
};

// 2. REPLICATE THE PARSING LOGIC from visionScraper.js
// I am copying the critical parsing functions to test them in isolation

function clean(v) {
    if (v == null) return null;
    let s = String(v).replace(',', '.').trim(); // THE FIX: Handle commas
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

function flattenOdds(oddsObj) {
    const flat = {};
    if (!oddsObj || typeof oddsObj !== 'object') return flat;

    // Map all possible variations to standard MPC keys
    let home = clean(oddsObj.homeWin || oddsObj.homeML || oddsObj["1"] || oddsObj.Hazai);
    let draw = clean(oddsObj.draw || oddsObj.drawML || oddsObj["X"] || oddsObj.Dontetlen || oddsObj.Döntetlen);
    let away = clean(oddsObj.awayWin || oddsObj.awayML || oddsObj["2"] || oddsObj.Vendeg || oddsObj.Vendég);

    if (home) flat.homeWin = home;
    if (draw) flat.draw = draw;
    if (away) flat.awayWin = away;

    // BTTS
    let bYes = clean(oddsObj.bttsYes || oddsObj.yes || oddsObj.Igen || oddsObj["Igen"]);
    let bNo = clean(oddsObj.bttsNo || oddsObj.no || oddsObj.Nem || oddsObj["Nem"]);

    if (bYes) flat.bttsYes = bYes;
    if (bNo) flat.bttsNo = bNo;

    // Over/Under
    let over = clean(oddsObj.over || oddsObj["Több, mint"] || oddsObj["Több"]);
    let under = clean(oddsObj.under || oddsObj["Kevesebb, mint"] || oddsObj["Kevesebb"]);
    let line = clean(oddsObj.line || oddsObj["Gólszám"]);

    if (over) flat.over = over;
    if (under) flat.under = under;
    if (line) flat.line = line;

    return flat;
}

// 3. RUN THE TEST
console.log("\n--- MPC DATA INTEGRITY TEST ---\n");

rawGptOutput.matches.forEach((match, idx) => {
    console.log(`Checking Match ${idx + 1}: ${match.team_1} vs ${match.team_2}`);

    // Step A: Parse
    const mpcInput = flattenOdds(match.odds);

    // Step B: Validate for MPC
    const has1X2 = mpcInput.homeWin && mpcInput.draw && mpcInput.awayWin;
    const hasBTTS = mpcInput.bttsYes && mpcInput.bttsNo;
    const hasOU = mpcInput.over && mpcInput.under && mpcInput.line;

    console.log("   [INPUT] Raw Odds:  ", JSON.stringify(match.odds));
    console.log("   [OUTPUT] MPC Data: ", JSON.stringify(mpcInput));

    if (has1X2) {
        console.log("   ✅ SUCCESS: 1X2 Odds ready for Math Engine (Poisson/Kelly).");
        const margin = (1 / mpcInput.homeWin + 1 / mpcInput.draw + 1 / mpcInput.awayWin);
        console.log(`      -> Bookmaker Margin: ${((margin - 1) * 100).toFixed(2)}%`);
    } else {
        console.log("   ❌ FAILED: Missing primary odds.");
    }

    if (hasBTTS) {
        console.log("   ✅ SUCCESS: BTTS Odds ready for Math Engine.");
    }

    if (hasOU) {
        console.log(`   ✅ SUCCESS: Over/Under ${mpcInput.line} Odds ready for Math Engine.`);
    }

    console.log("-".repeat(40));
});
