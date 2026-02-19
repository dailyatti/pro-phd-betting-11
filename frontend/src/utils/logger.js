/**
 * Production-safe logger
 *
 * In production builds (import.meta.env.PROD), suppresses debug logs.
 * Ensures API keys and sensitive data are never logged.
 *
 * @module utils/logger
 */

const IS_DEV = import.meta.env.DEV;

/**
 * Sanitize a string to remove potential API key patterns
 */
function sanitize(str) {
    if (typeof str !== 'string') return str;
    // Mask patterns that look like API keys
    return str
        .replace(/sk-[a-zA-Z0-9_-]{20,}/g, 'sk-***REDACTED***')
        .replace(/pplx-[a-zA-Z0-9_-]{20,}/g, 'pplx-***REDACTED***')
        .replace(/AIza[a-zA-Z0-9_-]{20,}/g, 'AIza***REDACTED***')
        .replace(/Bearer\s+[a-zA-Z0-9_.-]{20,}/gi, 'Bearer ***REDACTED***');
}

function sanitizeArgs(args) {
    return args.map(arg => {
        if (typeof arg === 'string') return sanitize(arg);
        if (typeof arg === 'object' && arg !== null) {
            try {
                return JSON.parse(sanitize(JSON.stringify(arg)));
            } catch {
                return arg;
            }
        }
        return arg;
    });
}

export const logger = {
    debug(...args) {
        if (IS_DEV) console.log(...sanitizeArgs(args));
    },
    info(...args) {
        if (IS_DEV) console.info(...sanitizeArgs(args));
    },
    warn(...args) {
        console.warn(...sanitizeArgs(args));
    },
    error(...args) {
        console.error(...sanitizeArgs(args));
    }
};

export default logger;
