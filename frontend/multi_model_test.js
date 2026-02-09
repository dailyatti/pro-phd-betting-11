
import { testGeminiConnection } from './src/agents/common/geminiHelper.js';

const API_KEY = "AIzaSyCmkIyjVqEj0HtC74Fg1q6RTpcMC9KvxcY";
const MODELS_TO_TEST = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest",
    "gemini-pro",
    "gemini-2.0-flash-exp" // Experimental, just in case
];

console.log(`[Multi-Test] Checking API Key: ${API_KEY.slice(0, 8)}...`);
console.log("---------------------------------------------------");

async function runTests() {
    let workingModel = null;

    for (const model of MODELS_TO_TEST) {
        process.stdout.write(`Testing ${model.padEnd(25)} ... `);
        try {
            const success = await testGeminiConnection(API_KEY, model);
            if (success) {
                console.log("✅ WORKS!");
                workingModel = model;
                // We keep testing to see all options, or strictly break? 
                // Let's break on first success to be fast, or find best? 
                // Let's find ALL working ones.
            } else {
                console.log("❌ Failed");
            }
        } catch (err) {
            console.log(`❌ Error: ${err.message}`);
        }
    }

    console.log("---------------------------------------------------");
    if (workingModel) {
        console.log(`RECOMMENDATION: Update your settings to use one of the working models (e.g., '${workingModel}').`);
    } else {
        console.log("CONCLUSION: The API Key appears invalid or has no access to ANY standard Vision models.");
    }
}

runTests();
