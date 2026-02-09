
import { strict as assert } from 'assert';
import { getSportEngine } from '../registry.js';

console.log('--- Testing PhD Math Engines ---');

const mockConfig = { bankroll: 1000, kellyFraction: 0.25 };

// 1. BASKETBALL
console.log('[TEST] Basketball Engine...');
const bballInput = {
    id: 'test-nba',
    sport: 'BASKETBALL',
    team1: 'Lakers', team2: 'Warriors',
    odds: { totalOver: 1.91, totalUnder: 1.91 },
    warnings: []
};
const bballEng = getSportEngine('BASKETBALL');
const bballRes = bballEng.computeEngine(bballInput, mockConfig);
console.log('Basketball Result:', bballRes.explanations[0]);
assert(bballRes.computedStats.projPace > 0, 'Basketball Pace missing');

// 2. TENNIS
console.log('[TEST] Tennis Engine...');
const tennisInput = {
    id: 'test-atp',
    sport: 'TENNIS',
    team1: 'Sinner', team2: 'Alcaraz',
    odds: { homeWin: 1.80, awayWin: 2.00 },
    warnings: []
};
const tennisEng = getSportEngine('TENNIS');
const tennisRes = tennisEng.computeEngine(tennisInput, mockConfig);
console.log('Tennis Result:', tennisRes.explanations[0]);
assert(tennisRes.computedStats.winProbP1 > 0, 'Tennis WinProb missing');

// 3. HOCKEY
console.log('[TEST] Hockey Engine...');
const hockeyInput = {
    id: 'test-nhl',
    sport: 'HOCKEY',
    team1: 'Oilers', team2: 'Leafs',
    odds: { homeWin: 2.10, awayWin: 2.80, draw: 4.0 },
    warnings: []
};
const hockeyEng = getSportEngine('HOCKEY');
const hockeyRes = hockeyEng.computeEngine(hockeyInput, mockConfig);
console.log('Hockey Result:', hockeyRes.explanations[1]);
assert(hockeyRes.computedStats.expHomeGoals > 0, 'Hockey xG missing');

// 4. BASEBALL
console.log('[TEST] Baseball Engine...');
const mlbInput = {
    id: 'test-mlb',
    sport: 'BASEBALL',
    team1: 'Yankees', team2: 'Red Sox',
    odds: { homeWin: 1.65, awayWin: 2.30 },
    warnings: []
};
const mlbEng = getSportEngine('BASEBALL');
const mlbRes = mlbEng.computeEngine(mlbInput, mockConfig);
console.log('Baseball Result:', mlbRes.explanations[0]);
assert(mlbRes.computedStats.totalRuns > 0, 'Baseball TotalRuns missing');

// 5. NFL
console.log('[TEST] NFL Engine...');
const nflInput = {
    id: 'test-nfl',
    sport: 'NFL',
    team1: 'Chiefs', team2: 'Bills',
    odds: { homeWin: 1.50, awayWin: 2.60 },
    warnings: []
};
const nflEng = getSportEngine('NFL');
const nflRes = nflEng.computeEngine(nflInput, mockConfig);
console.log('NFL Result:', nflRes.explanations[1]);
assert(nflRes.computedStats.projMargin !== undefined, 'NFL Margin missing');


// 6. FOOTBALL (Soccer - Poisson)
console.log('[TEST] Football Engine (Poisson)...');
const footInput = {
    id: 'test-foot',
    sport: 'FOOTBALL',
    team1: 'Real', team2: 'Barca',
    odds: { homeWin: 2.50, draw: 3.40, awayWin: 2.80 },
    warnings: []
};
const footEng = getSportEngine('FOOTBALL');
const footRes = footEng.computeEngine(footInput, mockConfig);
console.log('Football Result:', footRes.explanations[1]);
assert(footRes.computedStats.probDraw > 0, 'Football Poisson Draw Prob missing');

console.log('✅ ALL PHD ENGINES PASSED');
