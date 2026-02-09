
import { testGeminiConnection } from './src/agents/common/geminiHelper.js';

const API_KEY = "AIzaSyCmkIyjVqEj0HtC74Fg1q6RTpcMC9KvxcY";
const MODEL = "gemini-1.5-flash";

console.log(`[ReTest] Testing Gemini Connection with model: ${MODEL}`);

try {
    const success = await testGeminiConnection(API_KEY, MODEL);
    if (success) {
        console.log("✅ SUCCESS: Gemini API is reachable with 1.5-flash!");
        console.log("   Recommendation: Use 'gemini-1.5-flash' in your settings.");
    } else {
        console.error("❌ FAILURE: Could not connect even with 1.5-flash. Key is likely invalid.");
    }
} catch (err) {
    console.error("❌ ERROR during retest:", err.message);
}
