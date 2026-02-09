/**
 * PhD Engine Test - JSON Output for Verification
 */
import { computeEngine } from './src/engine/phd/formulas/football.js';
import { writeFileSync } from 'fs';

const config = {
    bankroll: 10000,
    staking: { gamma: 0.5, friction: 0.02, alpha: 0.05 },
    useDixonColes: true,
    eloBlend: { enabled: true, weight: 0.30 }
};

const matches = [
    {
        id: 'liverpool_mancity', team_1: 'Liverpool', team_2: 'Manchester City', league: 'Premier Liga',
        odds: { homeWin: 2.38, draw: 3.90, awayWin: 2.90, over25: 1.73, under25: 2.06, bttsYes: 1.46, bttsNo: 2.55 },
        extractedParameters: { homeXG: 1.85, awayXG: 1.70, homeELO: 1850, awayELO: 1820, rho: -0.03 }
    },
    {
        id: 'sevilla_girona', team_1: 'Sevilla', team_2: 'Girona', league: 'La Liga',
        odds: { homeWin: 2.06, draw: 3.45, awayWin: 3.75, over25: 1.73, under25: 2.06, bttsYes: 1.78, bttsNo: 1.95 },
        extractedParameters: { homeXG: 1.55, awayXG: 1.25, homeELO: 1680, awayELO: 1620, rho: -0.03 }
    },
    {
        id: 'lecce_udinese', team_1: 'Lecce', team_2: 'Udinese', league: 'Serie A',
        odds: { homeWin: 3.15, draw: 2.85, awayWin: 2.63, over25: 1.73, under25: 2.06, bttsYes: 2.19, bttsNo: 1.62 },
        extractedParameters: { homeXG: 1.20, awayXG: 1.35, homeELO: 1480, awayELO: 1510, rho: -0.03 }
    },
    {
        id: 'koln_leipzig', team_1: '1. FC Koln', team_2: 'RB Leipzig', league: 'Bundesliga',
        odds: { homeWin: 3.40, draw: 3.95, awayWin: 2.03, over25: 1.42, under25: 2.69, bttsYes: 1.42, bttsNo: 2.69 },
        extractedParameters: { homeXG: 1.10, awayXG: 1.80, homeELO: 1520, awayELO: 1720, rho: -0.03 }
    },
    {
        id: 'puskas_zte', team_1: 'Puskas Akademia', team_2: 'ZTE', league: 'NB I',
        odds: { homeWin: 1.90, draw: 3.75, awayWin: 3.85, over25: 1.73, under25: 2.06, bttsYes: 1.65, bttsNo: 2.12 },
        extractedParameters: { homeXG: 1.65, awayXG: 1.15, homeELO: 1520, awayELO: 1380, rho: -0.03 }
    }
];

const results = matches.map(match => {
    const result = computeEngine(match, config);
    const positiveEV = result.recommendations.filter(r => r.ev > 0 && r.odds > 0);
    return {
        match: `${match.team_1} vs ${match.team_2}`,
        league: match.league,
        formula: result.formulaUsed,
        stats: result.computedStats,
        positiveEVBets: positiveEV.map(r => ({
            selection: r.selection,
            odds: r.odds,
            trueProb: (r.probability * 100).toFixed(1) + '%',
            edge: (r.edge * 100).toFixed(2) + '%',
            ev: (r.ev * 100).toFixed(2) + '%',
            stake: r.stake_size,
            level: r.recommendation_level
        }))
    };
});

const output = {
    timestamp: new Date().toISOString(),
    config,
    matchResults: results,
    summary: {
        totalMatches: matches.length,
        totalPositiveEVBets: results.reduce((sum, r) => sum + r.positiveEVBets.length, 0),
        formulasUsed: ['DIXON_COLES', 'POISSON', 'KELLY_CVAR_L1']
    }
};

writeFileSync('test_results.json', JSON.stringify(output, null, 2));
console.log('Results written to test_results.json');
