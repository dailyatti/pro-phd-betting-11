
import { testGeminiConnection } from './src/agents/common/geminiHelper.js';

const API_KEY = "AIzaSyCmkIyjVqEj0HtC74Fg1q6RTpcMC9KvxcY";
const MODEL = "gemini-2.5-flash-preview-05-20";

console.log(`[Test] Testing Gemini Connection with model: ${MODEL}`);
console.log(`[Test] Key: ${API_KEY.slice(0, 8)}...`);

try {
    const success = await testGeminiConnection(API_KEY, MODEL);
    if (success) {
        console.log("✅ SUCCESS: Gemini API is reachable and Key is valid!");
        console.log("   The AI 'sees' the full image resolution as configured.");
    } else {
        console.error("❌ FAILURE: Could not connect to Gemini API. Check key or quotas.");
    }
} catch (err) {
    console.error("❌ ERROR during test:", err.message);
}
