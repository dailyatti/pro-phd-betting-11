// Netlify Function for API Proxying — Security Hardened
// BYOK (Bring Your Own Key) proxy: user API keys are forwarded, never stored server-side.

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_CONFIG = {
    "openai": {
        target: "https://api.openai.com/v1",
        strip: "/api/openai"
    },
    "perplexity": {
        target: "https://api.perplexity.ai",
        strip: "/api/perplexity"
    },
    "grok": {
        target: "https://api.x.ai/v1",
        strip: "/api/grok"
    },
    "gemini": {
        target: "https://generativelanguage.googleapis.com/v1beta",
        strip: "/api/gemini"
    }
};

// ============================================================================
// RATE LIMITING (in-memory, per-function-instance)
// ============================================================================

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60;  // max 60 requests per minute per IP

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(ip, { windowStart: now, count: 1 });
        return true;
    }

    entry.count++;
    if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
        return false;
    }
    return true;
}

// Periodic cleanup to prevent memory leak
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
        if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
            rateLimitMap.delete(ip);
        }
    }
}, RATE_LIMIT_WINDOW_MS * 3);

// ============================================================================
// SECURITY: Request validation
// ============================================================================

const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB (screenshots can be large base64)
const ALLOWED_METHODS = new Set(['GET', 'POST', 'OPTIONS']);

function getAllowedOrigin(requestOrigin) {
    // In production, restrict to the actual Netlify domain
    // The SITE_URL env var is automatically set by Netlify
    const siteUrl = process.env.URL || process.env.SITE_URL;

    if (siteUrl && requestOrigin) {
        try {
            const siteHost = new URL(siteUrl).host;
            const reqHost = new URL(requestOrigin).host;
            // Allow exact match or Netlify deploy previews
            if (reqHost === siteHost || reqHost.endsWith('.netlify.app')) {
                return requestOrigin;
            }
        } catch {
            // Invalid URL, fall through
        }
    }

    // Development: allow localhost
    if (requestOrigin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin)) {
        return requestOrigin;
    }

    // Fallback: if no SITE_URL is set (first deploy), allow the request
    // but with a restrictive origin
    if (!siteUrl) {
        return requestOrigin || '*';
    }

    // Deny unknown origins by returning the site URL (browser will block mismatched origins)
    return siteUrl;
}

function getCorsHeaders(requestOrigin) {
    const allowedOrigin = getAllowedOrigin(requestOrigin);
    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin"
    };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async (req, context) => {
    const url = new URL(req.url);
    const path = url.pathname;
    const requestOrigin = req.headers.get('origin') || '';
    const corsHeaders = getCorsHeaders(requestOrigin);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Method validation
    if (!ALLOWED_METHODS.has(req.method)) {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-nf-client-connection-ip')
        || 'unknown';

    if (!checkRateLimit(clientIp)) {
        console.warn(`[Proxy] Rate limit exceeded for ${clientIp}`);
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait before retrying." }), {
            status: 429,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "Retry-After": "60"
            }
        });
    }

    // Find matching provider
    const providerKey = Object.keys(API_CONFIG).find(key => path.startsWith(`/api/${key}`));

    if (!providerKey) {
        return new Response(JSON.stringify({ error: "Unknown API provider" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    const config = API_CONFIG[providerKey];
    const targetPath = path.replace(config.strip, "");
    const targetUrl = `${config.target}${targetPath}${url.search}`;

    // Validate Authorization header exists (BYOK requirement)
    const authHeader = req.headers.get('authorization');
    const hasGeminiKeyParam = providerKey === 'gemini' && url.search.includes('key=');

    if (!authHeader && !hasGeminiKeyParam) {
        return new Response(JSON.stringify({ error: "Authorization required. Please provide your API key." }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    console.log(`[Proxy] ${req.method} ${providerKey}${targetPath}`);

    try {
        // Prepare headers
        const headers = new Headers();
        headers.set("Content-Type", req.headers.get("content-type") || "application/json");
        headers.set("User-Agent", "PhD-Betting-Proxy/1.0");

        if (authHeader) {
            headers.set("Authorization", authHeader);
        }

        // Handle request body with size limit
        let body = null;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            try {
                const arrayBuffer = await req.arrayBuffer();
                if (arrayBuffer.byteLength > MAX_BODY_SIZE) {
                    return new Response(JSON.stringify({ error: "Request body too large", maxSize: "10MB" }), {
                        status: 413,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }
                if (arrayBuffer.byteLength > 0) {
                    body = arrayBuffer;
                }
            } catch (e) {
                return new Response(JSON.stringify({ error: "Failed to read request body" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
        }

        // Make upstream request
        const response = await fetch(targetUrl, {
            method: req.method,
            headers,
            body
        });

        console.log(`[Proxy] ${providerKey} -> ${response.status}`);

        // Build response headers
        const resHeaders = new Headers(response.headers);

        // CRITICAL FIX: fetch automatically decompresses body, but keeps content-encoding header.
        // We must strip it so the browser doesn't try to double-decompress and throw JSON parse errors.
        resHeaders.delete("content-encoding");
        resHeaders.delete("content-length");

        // Strip upstream cookies (like Cloudflare's __cf_bm) to prevent invalid domain warnings
        resHeaders.delete("set-cookie");

        for (const [key, value] of Object.entries(corsHeaders)) {
            resHeaders.set(key, value);
        }

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: resHeaders
        });

    } catch (error) {
        // SECURITY: Never log full error objects (may contain keys in config)
        console.error(`[Proxy] ${providerKey} error: ${error.message}`);

        return new Response(JSON.stringify({
            error: "Proxy request failed",
            provider: providerKey
        }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
};

export const config = {
    path: "/api/*"
};
