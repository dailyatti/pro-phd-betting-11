/**
 * Odds Conversion Utilities
 * Handles American, Fractional, and Decimal odds transformations.
 */

export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

export const cleanText = (v) =>
    String(v ?? "")
        .trim()
        .replace(/\uFEFF/g, "")
        .replace(/[–—]/g, "-")
        .replace(/[•·∙]/g, ".")
        .replace(/\s+/g, "")
        .replace(/,/g, ".");

export const num = (v) => {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    const s = cleanText(v);
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
};

export const fixLikelyMissingDecimal = (s) => {
    if (/^\d{3}$/.test(s)) {
        const n = Number(s);
        if (n >= 100 && n <= 999) return (n / 100).toFixed(2);
    }
    if (/^\d{4}$/.test(s)) {
        const n = Number(s);
        if (n >= 1000 && n <= 9999) return (n / 100).toFixed(2);
    }
    return s;
};

export const isSuspended = (s) => {
    const t = String(s ?? "").trim().toLowerCase();
    return (
        t === "-" || t === "—" || t === "susp" || t === "suspended" ||
        t === "lock" || t === "locked" || t.includes("🔒")
    );
};

export const pctToDecimal = (p) => {
    const prob = p / 100;
    if (!(prob > 0 && prob < 1)) return null;
    return 1 / prob;
};

export const americanToDecimal = (a) => {
    const x = Number(a);
    if (!Number.isFinite(x) || x === 0) return null;
    if (x > 0) return 1 + x / 100;
    return 1 + 100 / Math.abs(x);
};

export const fractionalToDecimal = (s) => {
    const m = String(s).match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
    if (!m) return null;
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (!(a >= 0) || !(b > 0)) return null;
    return 1 + a / b;
};

/**
 * Robust, per-value autodetect conversion to decimal odds.
 */
export const convertOddsToDecimalAuto = (value, formatHint = null) => {
    if (value === null || value === undefined || value === "") return null;

    if (typeof value === "object" && !Array.isArray(value)) {
        if (typeof value.decimal === "number" && Number.isFinite(value.decimal)) return value.decimal;
        if (typeof value.decimal === "string") return convertOddsToDecimalAuto(value.decimal, formatHint);
        if (typeof value.raw === "string") return convertOddsToDecimalAuto(value.raw, formatHint);
    }

    if (typeof value === "number") {
        if (!Number.isFinite(value)) return null;
        if (value < 1.0001 || value > 10000) return null;
        return value;
    }

    let s = cleanText(value);
    s = s.replace(/o/gi, "0").replace(/i/g, "1").replace(/l/g, "1").replace(/s/g, "5");

    if (!s) return null;
    if (isSuspended(s)) return null;

    const hint = String(formatHint ?? "").toLowerCase();

    if (/%$/.test(s)) {
        const p = Number(s.replace("%", ""));
        const dec = pctToDecimal(p);
        return dec && dec > 1.0001 ? clamp(dec, 1.01, 10000) : null;
    }
    if (s.includes("/") && /^\d+(\.\d+)?\/\d+(\.\d+)?$/.test(s)) {
        const dec = fractionalToDecimal(s);
        return dec && dec > 1.0001 ? clamp(dec, 1.01, 10000) : null;
    }
    if (/^[+-]\d{2,5}$/.test(s)) {
        const dec = americanToDecimal(s);
        return dec && dec > 1.0001 ? clamp(dec, 1.01, 10000) : null;
    }
    if (/^\d{3,4}$/.test(s)) s = fixLikelyMissingDecimal(s);

    const n = Number(s);
    if (!Number.isFinite(n)) return null;

    const hasSign = /^[+-]/.test(s);
    if (hasSign && Math.abs(n) > 0 && Math.abs(n) <= 2.0) {
        const dec = n < 0 ? 1 + 1 / Math.abs(n) : 1 + n;
        return dec && dec > 1.0001 ? clamp(dec, 1.01, 10000) : null;
    }
    if ((hint === "hongkong" || hint === "hk") && n > 0 && n < 1.01) return clamp(1 + n, 1.01, 10000);
    if (n > 0 && n < 1.01) return clamp(1 + n, 1.01, 10000);

    if (n < 1.0001 || n > 10000) return null;
    return clamp(n, 1.01, 10000);
};
