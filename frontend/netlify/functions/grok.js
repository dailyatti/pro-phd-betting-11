/**
 * @file grok.js
 * @description Netlify serverless function to proxy requests to Grok/X.AI API.
 * BYOK (Bring Your Own Key): The user's API key is passed via Authorization header.
 */

export default async (req, context) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
        return new Response(JSON.stringify({ error: "Missing Authorization header. Please provide your Grok API key." }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    const url = new URL(req.url);
    const pathSuffix = url.pathname.replace(/^\/api\/grok/, "") || "/chat/completions";
    const targetUrl = `https://api.x.ai/v1${pathSuffix}`;

    try {
        const body = await req.text();

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader,
                "User-Agent": "PhD-Betting-Intelligence/1.0",
            },
            body: body || undefined,
        });

        const responseBody = await response.text();

        return new Response(responseBody, {
            status: response.status,
            headers: {
                "Content-Type": response.headers.get("Content-Type") || "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        console.error("[Grok Proxy Error]", error);
        return new Response(JSON.stringify({ error: "Proxy request failed", details: String(error) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

export const config = {
    path: "/api/grok/*",
};
