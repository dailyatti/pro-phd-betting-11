
import { strict as assert } from 'assert';
import { parseOdds } from '../parsers/oddsParser.js';

console.log('--- Testing GPT Odds Parsing (Array Support) ---');

// Case 1: Totals as Array (GPT Style)
const gptMatch = {
    odds: {
        moneyline: { home: 1.50, draw: 4.0, away: 6.50 },
        totals: [
            { line: "2.5", over: 1.95, under: 1.85 },
            { line: "3.5", over: 3.20, under: 1.30 }
        ]
    }
};

const result1 = parseOdds(gptMatch, []);
console.log('Input Array (2.5 & 3.5):', JSON.stringify(result1, null, 2));

assert.equal(result1.totalOver, 1.95, 'Should pick 2.5 line Over');
assert.equal(result1.totalUnder, 1.85, 'Should pick 2.5 line Under');
assert.equal(result1.homeWin, 1.50, 'Should parse moneyline correctly');


// Case 2: Totals as Array (No 2.5 line)
const gptMatchNo25 = {
    odds: {
        totals: [
            { line: "1.5", over: 1.20, under: 4.00 }
        ]
    }
};
const result2 = parseOdds(gptMatchNo25, []);
console.log('Input Array (1.5 only):', JSON.stringify(result2, null, 2));
assert.equal(result2.totalOver, 1.20, 'Should pick first available line Over');


// Case 3: Mixed Types (Line is number)
const gptMatchNumberLine = {
    odds: {
        totals: [
            { line: 2.5, over: 2.05, under: 1.75 }
        ]
    }
};
const result3 = parseOdds(gptMatchNumberLine, []);
console.log('Input Array (Number Line):', JSON.stringify(result3, null, 2));
assert.equal(result3.totalOver, 2.05, 'Should handle number line 2.5');

console.log('✅ ALL GPT ODDS TESTS PASSED');
