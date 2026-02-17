// Netlify Function for API Proxying


// Global config for allowed APIs
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

export default async (req, context) => {
    const url = new URL(req.url);
    const path = url.pathname;

    // Find matching provider
    const providerKey = Object.keys(API_CONFIG).find(key => path.startsWith(`/api/${key}`));

    if (!providerKey) {
        return new Response("Not Found: Unknown API Provider", { status: 404 });
    }

    const config = API_CONFIG[providerKey];
    const targetPath = path.replace(config.strip, "");

    // Gemini sometimes needs query params for API key, sometimes in header. 
    // We pass the full search including ?key=... from the client.
    const targetUrl = `${config.target}${targetPath}${url.search}`;

    try {
        // Prepare headers
        const headers = new Headers(req.headers);
        headers.set("Host", new URL(config.target).host);

        // Remove headers that might confuse the upstream
        headers.delete("content-length");
        headers.delete("connection");
        headers.delete("origin");
        headers.delete("referer");

        // Make request to upstream API
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: headers,
            body: req.body,
            duplex: 'half' // Required for streaming bodies in simple fetch if supported, but standard fetch usually handles it
        });

        // Create response headers
        const resHeaders = new Headers(response.headers);
        resHeaders.set("Access-Control-Allow-Origin", "*"); // Basic CORS

        // Return streamed response
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: resHeaders
        });

    } catch (error) {
        console.error(`Proxy Error (${providerKey}):`, error);
        return new Response(JSON.stringify({ error: "Proxy Error", details: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};

export const config = {
    path: "/api/*"
};
