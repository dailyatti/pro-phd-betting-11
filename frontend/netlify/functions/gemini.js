/**
 * @file gemini.js
 * @description Netlify serverless function to proxy requests to Google Gemini API.
 * BYOK (Bring Your Own Key): The user's API key is passed via x-goog-api-key or Authorization header.
 */

export default async (req, context) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization, x-goog-api-key",
            },
        });
    }

    // Accept API key from either header
    const apiKey = req.headers.get("x-goog-api-key") || req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!apiKey) {
        return new Response(JSON.stringify({ error: "Missing API key. Please provide your Gemini API key." }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    const url = new URL(req.url);
    const pathSuffix = url.pathname.replace(/^\/api\/gemini/, "");
    const targetUrl = `https://generativelanguage.googleapis.com/v1beta${pathSuffix}?key=${apiKey}`;

    try {
        const body = await req.text();

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                "Content-Type": "application/json",
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
        console.error("[Gemini Proxy Error]", error);
        return new Response(JSON.stringify({ error: "Proxy request failed", details: String(error) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

export const config = {
    path: "/api/gemini/*",
};
