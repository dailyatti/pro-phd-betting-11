/**
 * Common Helper Functions for Agents
 * 
 * Contains utility functions used across all agent modules:
 * - JSON parsing and stringification
 * - Abort error detection
 * - Retry logic with exponential backoff
 * - Date utilities
 * 
 * @module agents/common/helpers
 */

import axios from 'axios';

// ============================================================================
// JSON UTILITIES
// ============================================================================

/**
 * Strips markdown code fences from text (e.g., ```json ... ```)
 * @param {string} txt - Input text potentially containing code fences
 * @returns {string} Cleaned text without fences
 */
export const stripFences = (txt) =>
    String(txt || '')
        .replace(/^\uFEFF/, '')
        .replace(/<think>[\s\S]*?<\/think>/gi, '') // Remove <think> reasoning chains
        .replace(/```(?:json)?/gi, '')
        .replace(/```/g, '')
        .trim();

/**
 * Attempts to parse JSON from text, stripping code fences first
 * @param {string} txt - Text containing JSON
 * @returns {Object|null} Parsed JSON object or null if parsing fails
 */
export const tryParseJson = (txt) => {
    const cleaned = stripFences(txt);
    if (!cleaned) return null;

    // Strategy 1: Direct parse (cleanest case)
    try {
        return JSON.parse(cleaned);
    } catch {
        // continue to fallback strategies
    }

    // Strategy 2: Extract first { ... } or [ ... ] block (handles text before/after JSON)
    const jsonObjMatch = cleaned.match(/(\{[\s\S]*\})/);
    if (jsonObjMatch) {
        try { return JSON.parse(jsonObjMatch[1]); } catch { /* continue */ }
    }

    const jsonArrMatch = cleaned.match(/(\[[\s\S]*\])/);
    if (jsonArrMatch) {
        try { return JSON.parse(jsonArrMatch[1]); } catch { /* continue */ }
    }

    // Strategy 3: Fix trailing commas (common LLM mistake)
    try {
        return JSON.parse(cleaned.replace(/,\s*([}\]])/g, '$1'));
    } catch { /* give up */ }

    console.warn("[tryParseJson] All parse strategies failed. Preview:", cleaned.substring(0, 200));
    return null;
};

/**
 * Safely stringifies an object, handling circular references and truncating long strings
 * @param {Object} obj - Object to stringify
 * @param {number} maxLen - Maximum length of output string (default 24000)
 * @returns {string} JSON string representation
 */
export const safeStringify = (obj, maxLen = 24000) => {
    try {
        const seen = new WeakSet();
        const json = JSON.stringify(obj, (k, v) => {
            if (typeof v === 'object' && v !== null) {
                if (seen.has(v)) return '[Circular]';
                seen.add(v);
            }
            if (typeof v === 'string' && v.length > 2000) return v.slice(0, 2000) + '…[truncated]';
            return v;
        });
        return json.length > maxLen ? json.slice(0, maxLen) + '…[truncated]' : json;
    } catch {
        return '"[Unstringifiable]"';
    }
};

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Checks if an error is an abort/cancel error
 * @param {Error} e - Error to check
 * @param {AbortSignal} signal - Optional AbortSignal
 * @returns {boolean} True if the error is an abort error
 */
export const isAbortError = (e, signal) => {
    return (
        signal?.aborted ||
        e?.name === 'AbortError' ||
        e?.code === 'ERR_CANCELED' ||
        e?.name === 'CanceledError' ||
        axios.isCancel?.(e)
    );
};

/**
 * Retry wrapper for async functions with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Array} args - Arguments to pass to the function
 * @param {number} maxAttempts - Maximum number of attempts (default 3)
 * @returns {Promise<*>} Result of the function call
 * @throws {Error} Last error if all attempts fail
 */
export const retryAsync = async (fn, args = [], maxAttempts = 3) => {
    let attempt = 0;
    let lastError;

    while (attempt < maxAttempts) {
        try {
            attempt++;
            if (attempt > 1) console.log(`[Retry] Attempt ${attempt}/${maxAttempts} (Backoff)...`);
            return await fn(...args);
        } catch (e) {
            lastError = e;
            if (attempt >= maxAttempts) {
                console.error(`[Retry] All ${maxAttempts} attempts failed. Last error:`, e.message);
                throw e;
            }

            // Log server error details safely
            if (e.response) {
                const url = e.config?.url || 'unknown-url';
                const status = e.response.status;
                const errDetail = e.response.data ? stripFences(safeStringify(e.response.data)).substring(0, 500) : 'No data';
                console.error(`[Retry] Server Error (${status}) at ${url}:`, errDetail);
            }

            // Exponential Backoff: 1s, 2s, 4s...
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.warn(`[Retry] Attempt ${attempt} failed: ${e.message}. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
};

// ============================================================================
// DATE UTILITIES
// ============================================================================


/**
 * Gets ISO date string (YYYY-MM-DD) for N days ago
 * @param {number} days - Number of days ago (default 7)
 * @returns {string} ISO date string in UTC
 */
export const getISODateDaysAgo = (days = 7) => {
    const n = Number(days);
    const safeDays = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 7;
    const d = new Date();
    d.setDate(d.getDate() - safeDays);
    return d.toISOString().slice(0, 10);
};

/**
 * Gets today's date in YYYY-MM-DD format (UTC)
 * @returns {string} ISO date string
 */
export const getTodayUTC = () => {
    return new Date().toISOString().slice(0, 10);
};

// ============================================================================
// IMAGE UTILITIES
// ============================================================================

export const isHttpUrl = (s) => /^https?:\/\//i.test(String(s || ""));
export const isDataImageUrl = (s) => /^data:image\/[a-z0-9.+-]+;base64,/i.test(String(s || ""));
export const isBlobUrl = (s) => /^blob:/i.test(String(s || ""));

// very tolerant base64 test (no prefix)
export const looksLikeBase64 = (s) => {
    const t = String(s || "").trim();
    if (t.length < 200) return false; // too small to be a real screenshot anyway
    // avoid treating URLs as base64
    if (isHttpUrl(t) || isDataImageUrl(t) || isBlobUrl(t)) return false;
    // allow newlines/spaces
    const b = t.replace(/\s+/g, "");
    // base64 chars only
    return /^[A-Za-z0-9+/=]+$/.test(b);
};

export const sniffImageMimeFromBase64 = (b64) => {
    const head = String(b64 || "").replace(/\s+/g, "").slice(0, 20);
    // JPEG starts with /9j/
    if (head.startsWith("/9j/")) return "image/jpeg";
    // PNG starts with iVBORw0KGgo
    if (head.startsWith("iVBORw0KGgo")) return "image/png";
    // GIF starts with R0lGOD
    if (head.startsWith("R0lGOD")) return "image/gif";
    // WEBP starts with UklGR (RIFF...)
    if (head.startsWith("UklGR")) return "image/webp";
    // fallback
    return "image/png";
};

export const estimateBase64Bytes = (b64) => {
    const s = String(b64 || "").replace(/\s+/g, "");
    const len = s.length;
    const padding = s.endsWith("==") ? 2 : s.endsWith("=") ? 1 : 0;
    // bytes ≈ (len * 3)/4 - padding
    return Math.max(0, Math.floor((len * 3) / 4) - padding);
};

/**
 * Normalizes a base64 string or URL to a valid data URL for Vision API
 * @param {string} img - Raw base64 string, data URL, or HTTP URL
 * @param {number} idx - Optional index for error reporting
 * @returns {string} Full data URL or original URL
 * @throws {Error} If input is invalid (e.g. empty, blob URL, unknown format)
 */
export const normalizeImageToVisionUrl = (img, idx = 0) => {
    const raw = String(img || "").trim();

    if (!raw) throw new Error(`[Vision] Image ${idx}: empty image input`);

    // blob: URLs are NOT fetchable by OpenAI — hard fail immediately
    if (isBlobUrl(raw)) {
        throw new Error(
            `[Vision] Image ${idx}: got a blob: URL. Convert to a dataURL (base64) via FileReader/readAsDataURL and pass that instead.`
        );
    }

    // already valid
    if (isDataImageUrl(raw) || isHttpUrl(raw)) return raw;

    // raw base64 (no prefix) -> convert to dataURL
    if (looksLikeBase64(raw)) {
        const b64 = raw.replace(/\s+/g, "");
        const mime = sniffImageMimeFromBase64(b64);
        return `data:${mime};base64,${b64}`;
    }

    // unknown string -> hard fail
    throw new Error(
        `[Vision] Image ${idx}: not a supported image input. Expected data:image;base64,... OR https://... OR raw base64 string. Got prefix="${raw.slice(0, 30)}..."`
    );
};

// ============================================================================
// NUMERIC HELPERS
// ============================================================================

/**
 * Safe number parser with fallback.
 * USE THIS instead of || 0 to avoid falsy/null bugs.
 * @param {*} x - Input value
 * @param {number} fallback - Default value (default 0)
 * @returns {number}
 */
export const n = (x, fallback = 0) => {
    const v = typeof x === "string" ? Number(x) : x;
    return Number.isFinite(v) ? v : fallback;
};

// ============================================================================
// NETLIFY PROXY HELPER
// ============================================================================

/**
 * Unified BYOK API Proxy:
 * Routes requests through /api/{provider}/* which forwards to the upstream API.
 * The user's API key is sent via the Authorization header.
 *
 * Provider endpoint mapping:
 *   openai     -> /api/openai/chat/completions
 *   perplexity -> /api/perplexity/chat/completions
 *   gemini     -> /api/gemini/models/{model}:generateContent
 *   grok       -> /api/grok/chat/completions
 *
 * @param {Object} params
 * @param {string} params.provider - 'openai', 'perplexity', 'gemini', 'grok'
 * @param {string} params.apiKey - User provided API key
 * @param {string} params.model - Model identifier
 * @param {Object} params.payload - Provider-specific payload
 * @param {AbortSignal} [params.signal] - Optional abort signal
 * @param {number} [params.timeoutMs] - Optional timeout (default 90000)
 * @returns {Promise<any>} Response data from the provider
 */
export const callLlmProxy = async ({ provider, apiKey, model, payload, signal, timeoutMs = 90000 }) => {
    const key = String(apiKey || "").trim();
    if (!key) throw new Error(`[callLlmProxy] No API key provided for ${provider}`);

    let url;
    let headers = { "Content-Type": "application/json" };
    let body;

    switch (provider) {
        case 'openai':
            url = '/api/openai/chat/completions';
            headers["Authorization"] = `Bearer ${key}`;
            body = payload;
            break;

        case 'perplexity':
            url = '/api/perplexity/chat/completions';
            headers["Authorization"] = `Bearer ${key}`;
            body = payload;
            break;

        case 'grok':
            url = '/api/grok/chat/completions';
            headers["Authorization"] = `Bearer ${key}`;
            body = payload;
            break;

        case 'gemini': {
            const m = model || payload?.model || 'gemini-2.0-flash';
            url = `/api/gemini/models/${m}:generateContent?key=${encodeURIComponent(key)}`;
            // Gemini uses API key in URL, not Authorization header
            body = {
                contents: payload?.contents,
                generationConfig: payload?.generationConfig,
            };
            // Include tools if present (e.g., google_search_retrieval for grounding)
            if (payload?.tools) body.tools = payload.tools;
            break;
        }

        default:
            throw new Error(`[callLlmProxy] Unknown provider: ${provider}`);
    }

    const res = await axios.post(url, body, {
        headers,
        signal,
        timeout: timeoutMs,
    });
    return res.data;
};
