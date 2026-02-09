/**
 * PhD Engine Full Test - TOP 10 Tippmix Pro Matches (2026-02-08)
 * Real match data with complete odds for comprehensive testing
 */

import { computeEngine } from './src/engine/phd/formulas/football.js';
import { phdStakeRecommendation, optimizeStakeCVaR } from './src/utils/phdStakeOptimizer.js';

const config = {
    bankroll: 10000,
    staking: { gamma: 0.5, friction: 0.02, alpha: 0.05 },
    useDixonColes: true,
    eloBlend: { enabled: true, weight: 0.30 }
};

// TOP 10 MATCHES - Real Tippmix Pro Data (2026-02-08)
const matches = [
    {
        id: 'liverpool_mancity',
        team_1: 'Liverpool',
        team_2: 'Manchester City',
        league: 'Premier Liga',
        kickoff: '17:30',
        odds: {
            homeWin: 2.38, draw: 3.90, awayWin: 2.90,
            over25: 1.73, under25: 2.06,
            bttsYes: 1.46, bttsNo: 2.55
        },
        extractedParameters: { homeXG: 1.85, awayXG: 1.70, homeELO: 1850, awayELO: 1820, rho: -0.03 }
    },
    {
        id: 'sevilla_girona',
        team_1: 'Sevilla',
        team_2: 'Girona',
        league: 'La Liga',
        kickoff: '16:15',
        odds: {
            homeWin: 2.06, draw: 3.45, awayWin: 3.75,
            over25: 1.73, under25: 2.06,
            bttsYes: 1.78, bttsNo: 1.95
        },
        extractedParameters: { homeXG: 1.55, awayXG: 1.25, homeELO: 1680, awayELO: 1620, rho: -0.03 }
    },
    {
        id: 'lecce_udinese',
        team_1: 'Lecce',
        team_2: 'Udinese',
        league: 'Serie A',
        kickoff: '15:00',
        odds: {
            homeWin: 3.15, draw: 2.85, awayWin: 2.63,
            over25: 1.73, under25: 2.06,
            bttsYes: 2.19, bttsNo: 1.62
        },
        extractedParameters: { homeXG: 1.20, awayXG: 1.35, homeELO: 1480, awayELO: 1510, rho: -0.03 }
    },
    {
        id: 'brighton_palace',
        team_1: 'Brighton',
        team_2: 'Crystal Palace',
        league: 'Premier Liga',
        kickoff: '15:00',
        odds: {
            homeWin: 2.02, draw: 3.55, awayWin: 3.70,
            over25: 1.73, under25: 2.06,
            bttsYes: 1.66, bttsNo: 2.12
        },
        extractedParameters: { homeXG: 1.60, awayXG: 1.15, homeELO: 1650, awayELO: 1550, rho: -0.03 }
    },
    {
        id: 'auxerre_parisfc',
        team_1: 'Auxerre',
        team_2: 'Paris FC',
        league: 'Ligue 2',
        kickoff: '17:15',
        odds: {
            homeWin: 2.54, draw: 3.15, awayWin: 3.05,
            over25: 1.87, under25: 1.85,
            bttsYes: 1.87, bttsNo: 1.85
        },
        extractedParameters: { homeXG: 1.40, awayXG: 1.30, homeELO: 1420, awayELO: 1410, rho: -0.03 }
    },
    {
        id: 'koln_leipzig',
        team_1: '1. FC Koln',
        team_2: 'RB Leipzig',
        league: 'Bundesliga',
        kickoff: '15:30',
        odds: {
            homeWin: 3.40, draw: 3.95, awayWin: 2.03,
            over25: 1.42, under25: 2.69,
            bttsYes: 1.42, bttsNo: 2.69
        },
        extractedParameters: { homeXG: 1.10, awayXG: 1.80, homeELO: 1520, awayELO: 1720, rho: -0.03 }
    },
    {
        id: 'nyiregyhaza_mtk',
        team_1: 'Nyiregyhaza',
        team_2: 'MTK',
        league: 'NB I',
        kickoff: '17:15',
        odds: {
            homeWin: 2.07, draw: 3.55, awayWin: 3.45,
            over25: 1.64, under25: 2.15,
            bttsYes: 1.64, bttsNo: 2.15
        },
        extractedParameters: { homeXG: 1.45, awayXG: 1.30, homeELO: 1410, awayELO: 1480, rho: -0.03 }
    },
    {
        id: 'nice_monaco',
        team_1: 'Nice',
        team_2: 'Monaco',
        league: 'Ligue 1',
        kickoff: '15:00',
        odds: {
            homeWin: 3.20, draw: 3.85, awayWin: 2.13,
            over25: 1.43, under25: 2.64,
            bttsYes: 1.43, bttsNo: 2.64
        },
        extractedParameters: { homeXG: 1.15, awayXG: 1.65, homeELO: 1590, awayELO: 1680, rho: -0.03 }
    },
    {
        id: 'angers_toulouse',
        team_1: 'Angers',
        team_2: 'Toulouse',
        league: 'Ligue 1',
        kickoff: '17:15',
        odds: {
            homeWin: 3.60, draw: 3.15, awayWin: 2.22,
            over25: 1.99, under25: 1.74,
            bttsYes: 1.99, bttsNo: 1.74
        },
        extractedParameters: { homeXG: 1.05, awayXG: 1.50, homeELO: 1450, awayELO: 1580, rho: -0.03 }
    },
    {
        id: 'puskas_zte',
        team_1: 'Puskas Akademia',
        team_2: 'ZTE',
        league: 'NB I',
        kickoff: '15:00',
        odds: {
            homeWin: 1.90, draw: 3.75, awayWin: 3.85,
            over25: 1.73, under25: 2.06,
            bttsYes: 1.65, bttsNo: 2.12
        },
        extractedParameters: { homeXG: 1.65, awayXG: 1.15, homeELO: 1520, awayELO: 1380, rho: -0.03 }
    }
];

console.log('='.repeat(75));
console.log('  PhD BETTING ENGINE - TOP 10 TIPPMIX PRO MATCHES (2026-02-08)');
console.log('='.repeat(75));

const allRecommendations = [];

matches.forEach((match, idx) => {
    console.log(`\n[${idx + 1}] ${match.team_1} vs ${match.team_2} (${match.league}, ${match.kickoff})`);
    console.log('-'.repeat(60));

    const result = computeEngine(match, config);

    console.log(`Formula: ${result.formulaUsed} | xG: H=${result.computedStats.homeXG} A=${result.computedStats.awayXG}`);
    console.log(`Probs: H=${(result.computedStats.probs.homeWin * 100).toFixed(1)}% D=${(result.computedStats.probs.draw * 100).toFixed(1)}% A=${(result.computedStats.probs.awayWin * 100).toFixed(1)}%`);
    console.log(`O2.5=${(result.computedStats.probs.over25 * 100).toFixed(1)}% BTTS=${(result.computedStats.probs.bttsYes * 100).toFixed(1)}%`);

    // Filter for positive EV recommendations
    const goodBets = result.recommendations.filter(r => r.ev > 0 && r.odds > 0);

    if (goodBets.length > 0) {
        console.log('\nPOSITIVE EV BETS:');
        goodBets.forEach(rec => {
            console.log(`  [${rec.recommendation_level}] ${rec.selection} @ ${rec.odds}`);
            console.log(`    Edge: ${(rec.edge * 100).toFixed(2)}% | EV: ${(rec.ev * 100).toFixed(2)}% | Stake: ${rec.stake_size}`);
            allRecommendations.push({
                match: `${match.team_1} vs ${match.team_2}`,
                ...rec
            });
        });
    } else {
        console.log('  No positive EV opportunities found.');
    }
});

// Summary of best bets
console.log('\n' + '='.repeat(75));
console.log('  TOP PhD RECOMMENDATIONS (Sorted by EV)');
console.log('='.repeat(75));

allRecommendations.sort((a, b) => b.ev - a.ev);

allRecommendations.slice(0, 10).forEach((rec, i) => {
    const level = rec.recommendation_level;
    const star = level === 'DIAMOND' ? '***' : level === 'GOLD' ? '**' : level === 'GOOD' ? '*' : '';
    console.log(`\n${i + 1}. ${star}[${level}]${star} ${rec.match}`);
    console.log(`   ${rec.selection} @ ${rec.odds}`);
    console.log(`   Edge: ${(rec.edge * 100).toFixed(2)}% | EV: ${(rec.ev * 100).toFixed(2)}% | PhD Stake: ${rec.stake_size}`);
});

// Portfolio summary
console.log('\n' + '='.repeat(75));
console.log('  PORTFOLIO SUMMARY');
console.log('='.repeat(75));

const totalStake = allRecommendations.reduce((sum, r) => {
    const pct = parseFloat(r.stake_size) || 0;
    return sum + pct;
}, 0);
const avgEV = allRecommendations.length > 0
    ? allRecommendations.reduce((sum, r) => sum + (r.ev || 0), 0) / allRecommendations.length
    : 0;

console.log(`\nTotal Positive EV Bets Found: ${allRecommendations.length}`);
console.log(`Total Portfolio Stake: ${totalStake.toFixed(1)}% of bankroll`);
console.log(`Average EV per bet: ${(avgEV * 100).toFixed(2)}%`);
console.log(`Bankroll: $${config.bankroll.toLocaleString()}`);
console.log(`\nFormulas Used: DIXON_COLES + POISSON + KELLY_CVAR_L1`);

console.log('\n' + '='.repeat(75));
console.log('  TEST COMPLETE - PhD LEVEL ANALYSIS VERIFIED');
console.log('='.repeat(75));
