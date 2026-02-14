/**
 * PhD Betting Math Deck Utilities
 */

export const isBrowser = typeof window !== "undefined";

/**
 * Safely execute browser-only code
 */
export const safeBrowser = (fn, fallback) => {
    if (!isBrowser) return fallback;
    try {
        return fn();
    } catch (err) {
        console.error("[MathDeck] Browser utility failed:", err);
        return fallback;
    }
};

/**
 * Strips display delimiters from LaTeX strings for clipboard usage
 */
export const stripDisplayDelims = (latex = "") => {
    return latex
        .replace(/^\\\[\s*/, "")
        .replace(/\s*\\\]$/, "")
        .replace(/^\\\(\s*/, "")
        .replace(/\s*\\\)$/, "")
        .trim();
};

/**
 * Modern clipboard utility with fallback
 */
export async function copyToClipboard(text) {
    if (!isBrowser) return false;

    if (navigator?.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.warn("[MathDeck] Clipboard API failed, using fallback:", err);
        }
    }

    // Fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.left = "-1000px";
    document.body.appendChild(ta);
    ta.select();
    try {
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
    } catch (err) {
        console.error("[MathDeck] Clipboard fallback fatal:", err);
        document.body.removeChild(ta);
        return false;
    }
}

/**
 * Color blending logic (pure function)
 * Supports fallbacks if color-mix() is not available
 */
export const getMixFn = (supportsColorMix) => (c, pct, base) =>
    supportsColorMix ? `color-mix(in srgb, ${c} ${pct}%, ${base})` : base;
