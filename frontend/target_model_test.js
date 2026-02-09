
import { testGeminiConnection } from './src/agents/common/geminiHelper.js';

const API_KEY = "AIzaSyCmkIyjVqEj0HtC74Fg1q6RTpcMC9KvxcY";
const MODELS_TO_TEST = [
    "gemini-3-pro",          // User request
    "gemini-3.0-pro",        // User request variant
    "gemini-2.0-pro-exp",    // Realistic next gen
    "gemini-1.5-pro",        // Standard fallback
    "gemini-1.5-pro-002",    // Updated standard
    "gemini-exp-1206"        // Known experimental
];

console.log(`[Gemini-3 Test] Checking API Key: ${API_KEY.slice(0, 8)}...`);
console.log("---------------------------------------------------");

async function runTests() {
    for (const model of MODELS_TO_TEST) {
        process.stdout.write(`Testing ${model.padEnd(25)} ... `);
        try {
            const success = await testGeminiConnection(API_KEY, model);
            if (success) {
                console.log("✅ WORKS!");
            } else {
                console.log("❌ Failed (404 or Auth)");
            }
        } catch (err) {
            // simplify error logging
            console.log(`❌ ${err.message.split(':')[0]}`);
        }
    }
}

runTests();
