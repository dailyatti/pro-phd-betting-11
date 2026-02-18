#!/usr/bin/env node

/**
 * API & GPT Parser Test for PhD Betting
 * Tests:
 * 1. Netlify API Proxy connectivity
 * 2. Hungarian language parsing ("mérkőzések")
 * 3. Full text extraction with GPT
 */

import axios from 'axios';

const API_KEY = process.env.OPENAI_API_KEY || "sk-your-key-here";
const API_URL = process.env.API_URL || "http://localhost:3000";

const tests = [
    {
        name: "Hungarian Mérkőzések (Matches)",
        input: "Fradi Újpest hazai 1.30 döntetlen 5.50 vendég 9.00 gólok over 2.5 1.85",
        expectedTeam1: "Ferencváros TC",
        expectedTeam2: "Újpest FC"
    },
    {
        name: "Hungarian Szöglet (Corners) Bet",
        input: "Bayern München Dortmund szöglet over 10.5 1.90 under 10.5 1.85",
        expectedTeam1: "Bayern München",
        expectedTeam2: "Borussia Dortmund"
    },
    {
        name: "Mixed Hungarian/English",
        input: "Liverpool City - Hazai 2.10, Draw 3.40, Away 3.50 - szöglet over 1.5 2.20",
        expectedTeam1: "Liverpool FC",
        expectedTeam2: "Manchester City"
    },
    {
        name: "English Standard Format",
        input: "Real Madrid vs Barcelona 1.80 3.50 4.20 over 2.5 corners 2.10",
        expectedTeam1: "Real Madrid",
        expectedTeam2: "FC Barcelona"
    },
    {
        name: "Hungarian Félidő (Half-Time)",
        input: "Psg Monaco félidő 1.95 döntetlen 3.20 vendég 4.00",
        expectedTeam1: "Paris Saint-Germain",
        expectedTeam2: "AS Monaco"
    }
];

async function testAPIProxy() {
    console.log('\n=== Testing API Proxy Connectivity ===\n');
    
    try {
        const response = await axios.post(
            `${API_URL}/api/openai/chat/completions`,
            {
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: 'Respond with: API proxy works!'
                    }
                ],
                max_tokens: 10
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );
        
        console.log('✅ API Proxy: Connected successfully');
        console.log(`   Response status: ${response.status}`);
        return true;
    } catch (error) {
        console.log('❌ API Proxy: Failed');
        if (error.response) {
            console.log(`   Status: ${error.response.status} ${error.response.statusText}`);
            console.log(`   Message: ${JSON.stringify(error.response.data).substring(0, 200)}`);
        } else {
            console.log(`   Error: ${error.message}`);
        }
        return false;
    }
}

async function testGPTParser(testCase) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    console.log(`   Input: "${testCase.input.substring(0, 80)}..."`);
    
    const systemPrompt = `You are a UNIVERSAL sports betting data extraction AI, expert in Hungarian ("mérkőzések" = matches).
Your job: find matches and odds in text, any language, any format.

HUNGARIAN SUPPORT:
- "mérkőzés" = match
- "hazai" = home
- "vendég" = away
- "döntetlen" = draw
- "szöglet" = corner
- "gól" = goal(s)
- "félidő" = half-time

TEAM INTELLIGENCE:
- "fradi" / "ftc" → Ferencváros TC
- "újpest" / "ujpest" → Újpest FC
- "barca" / "fcb" → FC Barcelona
- "real" / "rm" → Real Madrid
- "psg" → Paris Saint-Germain
- "monaco" → AS Monaco
- "bayern" → Bayern München
- "bvb" / "dortmund" → Borussia Dortmund
- "pool" / "lfc" → Liverpool FC
- "city" / "mancity" → Manchester City

OUTPUT: strict JSON only, no other text
{ "matches": [ { "team1": "Full Name", "team2": "Full Name", "homeOdds": 1.30, "drawOdds": 5.50, "awayOdds": 9.00, "competition": null, "extraMarkets": [] } ] }`;

    const userPrompt = `Parse ALL matches and bets from this text:\n\n${testCase.input}`;

    try {
        const response = await axios.post(
            `${API_URL}/api/openai/chat/completions`,
            {
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.05,
                max_completion_tokens: 1000,
                response_format: { type: 'json_object' }
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const content = response.data.choices?.[0]?.message?.content || '{}';
        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch {
            const jsonMatch = content.match(/\{[\s\S]*\}/) || content.match(/\[[\s\S]*\]/);
            parsed = JSON.parse(jsonMatch?.[0] || '{"matches": []}');
        }

        const matches = parsed.matches || [];
        
        if (matches.length === 0) {
            console.log(`   ❌ No matches extracted`);
            console.log(`   Raw response: ${content.substring(0, 200)}`);
            return false;
        }

        const match = matches[0];
        console.log(`   ✅ Parsed ${matches.length} match(es)`);
        console.log(`   Teams: ${match.team1 || 'Unknown'} vs ${match.team2 || 'Unknown'}`);
        console.log(`   Odds: ${match.homeOdds} / ${match.drawOdds} / ${match.awayOdds}`);

        // Check if teams match expected output
        const team1Match = !testCase.expectedTeam1 || 
                          (match.team1?.toLowerCase().includes(testCase.expectedTeam1.split(' ')[0].toLowerCase()));
        const team2Match = !testCase.expectedTeam2 || 
                          (match.team2?.toLowerCase().includes(testCase.expectedTeam2.split(' ')[0].toLowerCase()));

        if (team1Match && team2Match) {
            console.log(`   ✅ Team names recognized correctly`);
            return true;
        } else {
            console.log(`   ⚠️  Team recognition issue`);
            console.log(`      Expected: ${testCase.expectedTeam1} vs ${testCase.expectedTeam2}`);
            console.log(`      Got: ${match.team1} vs ${match.team2}`);
            return false;
        }

    } catch (error) {
        console.log(`   ❌ API Error`);
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Data: ${JSON.stringify(error.response.data).substring(0, 200)}`);
        } else {
            console.log(`   Error: ${error.message}`);
        }
        return false;
    }
}

async function runAllTests() {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  PhD Betting API & GPT Parser Diagnostic Test Suite    ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    // Test API connectivity first
    const proxyWorks = await testAPIProxy();
    
    if (!proxyWorks) {
        console.log('\n⚠️  API Proxy not working. Cannot proceed with parser tests.');
        console.log('   Make sure:');
        console.log('   1. Netlify function is deployed');
        console.log('   2. OpenAI API key is valid');
        console.log('   3. Firewall allows access to api.openai.com');
        process.exit(1);
    }

    // Test parser with each test case
    console.log('\n=== Testing GPT Parser with Various Languages ===');
    let passed = 0;
    let failed = 0;

    for (const testCase of tests) {
        const result = await testGPTParser(testCase);
        if (result) passed++;
        else failed++;
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log(`║  SUMMARY: ${passed} passed, ${failed} failed out of ${tests.length} tests       ║`);
    console.log('╚════════════════════════════════════════════════════════╝');

    if (failed === 0) {
        console.log('\n✅ All tests passed! API and GPT parser are working correctly.');
        console.log('   Hungarian language support: ✅ Confirmed');
    } else {
        console.log(`\n⚠️  ${failed} test(s) failed. Review the output above for details.`);
    }

    process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(err => {
    console.error('Test suite failed:', err);
    process.exit(1);
});
