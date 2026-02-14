/**
 * Common utility functions for the PhD Betting application.
 */

/**
 * Safely parse JSON string.
 * @param {string} s 
 * @returns {any|null}
 */
export const safeJsonParse = (s) => {
    try {
        return JSON.parse(s);
    } catch {
        return null;
    }
};

/**
 * Clamp a number between a min and max value.
 * @param {number} x 
 * @param {number} a Min
 * @param {number} b Max
 * @returns {number}
 */
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/**
 * Normalize the view name.
 * @param {string} v 
 * @returns {string}
 */
export const normalizeView = (v) => {
    const x = String(v || "").toLowerCase().trim();
    if (x === "dashboard" || x === "settings" || x === "methodology" || x === "history") return x;
    return "dashboard";
};

/**
 * Normalize status string.
 * @param {string} s 
 * @returns {string}
 */
export const normalizeStatus = (s) => String(s || "IDLE").toUpperCase().trim();

/**
 * Check if the status is a running status.
 * @param {string} status 
 * @returns {boolean}
 */
export const isRunningStatus = (status) => {
    const s = normalizeStatus(status);
    return s === "VISION" || s === "FACTS" || s === "INTEL" || s === "STRATEGY";
};

/**
 * Coerce a value into a bankroll number.
 * @param {any} raw 
 * @returns {{n: number, ok: boolean}}
 */
export const coerceBankroll = (raw) => {
    if (raw === "" || raw == null) return { n: 0, ok: false };
    const n = Number(raw);
    if (!Number.isFinite(n)) return { n: 0, ok: false };
    if (n <= 0) return { n, ok: false };
    return { n: clamp(n, 0, 1_000_000_000), ok: true };
};

/**
 * Copy text to clipboard with fallback.
 * @param {string} text 
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
    if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.left = "-1000px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    if (!ok) throw new Error("Clipboard fallback failed");
    return true;
}

/**
 * Deduplicate an array of strings.
 * @param {string[]} arr 
 * @returns {string[]}
 */
export const dedupe = (arr) => Array.from(new Set((arr || []).map(s => String(s).trim()).filter(Boolean)));

/**
 * Generate a unique ID.
 * @returns {string}
 */
export const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Safe JSON parse helper with fallback (used in SettingsModal).
 * @param {string} str 
 * @param {any} fallback 
 * @returns {any}
 */
export const safeParse = (str, fallback) => {
    try {
        const parsed = JSON.parse(str);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
};
