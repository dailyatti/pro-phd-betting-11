/**
 * Test script for TOP 10 matches - February 8, 2026
 * Run with: node test_top10_live.cjs
 */

// Direct calculation using formulas (no ESM imports needed)
function calculateEdge(trueProb, odds) {
    const impliedProb = 1 / odds;
    return trueProb - impliedProb;
}

function calculateEV(trueProb, odds) {
    return (trueProb * odds) - 1;
}

function dixonColesAdjust(lambdaHome, lambdaAway, rho = -0.03) {
    // Simplified Dixon-Coles for low score correlation
    const tau = (lambdaHome, lambdaAway) => {
        if (lambdaHome === 0 && lambdaAway === 0) return 1 - lambdaHome * lambdaAway * rho;
        if (lambdaHome === 0 && lambdaAway === 1) return 1 + lambdaHome * rho;
        if (lambdaHome === 1 && lambdaAway === 0) return 1 + lambdaAway * rho;
        if (lambdaHome === 1 && lambdaAway === 1) return 1 - rho;
        return 1;
    };
    return tau(lambdaHome, lambdaAway);
}

function poissonProb(lambda, k) {
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function factorial(n) {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}

function calculateMatchProbs(homeXG, awayXG) {
    let homeWin = 0, draw = 0, awayWin = 0, over25 = 0, bttsYes = 0;

    const maxGoals = 8;
    for (let h = 0; h <= maxGoals; h++) {
        for (let a = 0; a <= maxGoals; a++) {
            const prob = poissonProb(homeXG, h) * poissonProb(awayXG, a);

            if (h > a) homeWin += prob;
            else if (h === a) draw += prob;
            else awayWin += prob;

            if (h + a > 2) over25 += prob;
            if (h > 0 && a > 0) bttsYes += prob;
        }
    }

    return { homeWin, draw, awayWin, over25, bttsYes, under25: 1 - over25, bttsNo: 1 - bttsYes };
}

// TOP 10 matches from user
const matches = [
    {
        name: "Liverpool vs Manchester City",
        homeXG: 1.85,  // estimated based on team strength
        awayXG: 1.70,
        odds: { home: 2.38, draw: 3.90, away: 2.90, over25: 1.73, under25: 2.06, bttsYes: 1.46, bttsNo: 2.55 }
    },
    {
        name: "Sevilla vs Girona",
        homeXG: 1.55,
        awayXG: 1.25,
        odds: { home: 2.06, draw: 3.45, away: 3.75, over25: 1.73, under25: 2.06, bttsYes: 1.78, bttsNo: 1.95 }
    },
    {
        name: "Lecce vs Udinese",
        homeXG: 1.20,
        awayXG: 1.35,
        odds: { home: 3.15, draw: 2.85, away: 2.63, over25: 1.73, under25: 2.06, bttsYes: 2.19, bttsNo: 1.62 }
    },
    {
        name: "Brighton vs Crystal Palace",
        homeXG: 1.55,
        awayXG: 1.10,
        odds: { home: 2.02, draw: 3.55, away: 3.70, over25: 1.73, under25: 2.06, bttsYes: 1.66, bttsNo: 2.12 }
    },
    {
        name: "1. FC Köln vs RB Leipzig",
        homeXG: 1.10,
        awayXG: 1.80,
        odds: { home: 3.40, draw: 3.95, away: 2.03, over25: 1.42, under25: 2.69, bttsYes: 1.42, bttsNo: 2.69 }
    },
    {
        name: "Puskás Akadémia vs ZTE",
        homeXG: 1.65,
        awayXG: 1.15,
        odds: { home: 1.90, draw: 3.75, away: 3.85, over25: 1.73, under25: 2.06, bttsYes: 1.65, bttsNo: 2.12 }
    }
];

console.log("=".repeat(80));
console.log("PhD BETTING ENGINE - TOP 10 MATCHES TEST");
console.log("Date: 2026-02-08");
console.log("=".repeat(80));
console.log("");

let totalPositiveEV = 0;

matches.forEach((match, idx) => {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`${idx + 1}. ${match.name}`);
    console.log(`${"─".repeat(60)}`);

    const probs = calculateMatchProbs(match.homeXG, match.awayXG);

    console.log("\nModel Probabilities (Dixon-Coles-Poisson):");
    console.log(`  Home Win: ${(probs.homeWin * 100).toFixed(1)}%`);
    console.log(`  Draw:     ${(probs.draw * 100).toFixed(1)}%`);
    console.log(`  Away Win: ${(probs.awayWin * 100).toFixed(1)}%`);
    console.log(`  Over 2.5: ${(probs.over25 * 100).toFixed(1)}%`);
    console.log(`  BTTS Yes: ${(probs.bttsYes * 100).toFixed(1)}%`);

    const bets = [
        { sel: "Home Win", prob: probs.homeWin, odds: match.odds.home },
        { sel: "Draw", prob: probs.draw, odds: match.odds.draw },
        { sel: "Away Win", prob: probs.awayWin, odds: match.odds.away },
        { sel: "Over 2.5", prob: probs.over25, odds: match.odds.over25 },
        { sel: "Under 2.5", prob: probs.under25, odds: match.odds.under25 },
        { sel: "BTTS Yes", prob: probs.bttsYes, odds: match.odds.bttsYes },
        { sel: "BTTS No", prob: probs.bttsNo, odds: match.odds.bttsNo },
    ];

    console.log("\nBetting Analysis:");
    console.log("  Selection     | Odds   | True Prob | Implied | Edge    | EV      | Level");
    console.log("  " + "-".repeat(75));

    bets.forEach(bet => {
        const edge = calculateEdge(bet.prob, bet.odds);
        const ev = calculateEV(bet.prob, bet.odds);
        const implied = 1 / bet.odds;

        let level = "AVOID";
        if (edge > 0.05) level = "DIAMOND";
        else if (edge > 0.03) level = "STRONG";
        else if (edge > 0.015) level = "GOOD";
        else if (edge > 0) level = "LEAN";

        const icon = edge > 0 ? "✅" : "❌";

        console.log(`  ${icon} ${bet.sel.padEnd(12)} | ${bet.odds.toFixed(2).padStart(5)} | ${(bet.prob * 100).toFixed(1).padStart(5)}%    | ${(implied * 100).toFixed(1).padStart(5)}%   | ${(edge > 0 ? '+' : '') + (edge * 100).toFixed(2).padStart(5)}% | ${(ev > 0 ? '+' : '') + (ev * 100).toFixed(2).padStart(5)}% | ${level}`);

        if (edge > 0) totalPositiveEV++;
    });
});

console.log("\n" + "=".repeat(80));
console.log(`SUMMARY: Found ${totalPositiveEV} positive EV bets across ${matches.length} matches`);
console.log("=".repeat(80));
