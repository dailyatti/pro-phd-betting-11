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
        // Prepare headers - CRITICAL: Keep Authorization header intact
        const headers = new Headers(req.headers);
        
        // Set correct host for the upstream API
        headers.set("Host", new URL(config.target).host);

        // Remove only the headers that will cause issues with upstream
        // DO NOT remove Authorization - it's needed!
        headers.delete("connection");
        headers.delete("keep-alive");
        headers.delete("x-forwarded-host");
        headers.delete("x-forwarded-proto");
        headers.delete("x-forwarded-for");
        
        // Delete Netlify-specific headers that might interfere
        headers.delete("netlify-original-pathname");
        headers.delete("netlify-branch");

        // Handle request body properly
        let body = null;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            // For POST/PUT - use the raw body
            if (req.body) {
                if (typeof req.body === 'string') {
                    body = req.body;
                } else {
                    // If it's a ReadableStream or Buffer, use it as-is
                    body = req.body;
                }
            }
        }

        // Prepare fetch options
        const fetchOptions = {
            method: req.method,
            headers: headers,
        };

        // Only add body if present
        if (body) {
            fetchOptions.body = body;
        }

        // Log request for debugging (first 200 chars of body)
        console.log(`[Proxy] ${providerKey}: ${req.method} ${targetPath}`);
        if (body && typeof body === 'string' && body.length < 200) {
            console.log(`[Proxy] Body: ${body}`);
        }

        // Make request to upstream API
        const response = await fetch(targetUrl, fetchOptions);

        // Create response headers
        const resHeaders = new Headers(response.headers);
        resHeaders.set("Access-Control-Allow-Origin", "*"); // CORS
        resHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        resHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

        // Log response status
        console.log(`[Proxy] ${providerKey} Response: ${response.status}`);

        // Return response with proper streaming
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: resHeaders
        });

    } catch (error) {
        console.error(`Proxy Error (${providerKey}):`, error);
        return new Response(JSON.stringify({ 
            error: "Proxy Error", 
            details: error.message,
            provider: providerKey
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};

export const config = {
    path: "/api/*"
};
