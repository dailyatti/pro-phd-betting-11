/**
 * Shared Utilities for PhD Betting
 */

export const safeText = (val, fallback = "") => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === "string") return val;
    if (typeof val === "number") return String(val);
    if (typeof val === "object") return JSON.stringify(val);
    return fallback;
};

export const toNumber = (val) => {
    if (val === null || val === undefined) return null;
    const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(num) ? num : null;
};

export const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
};
