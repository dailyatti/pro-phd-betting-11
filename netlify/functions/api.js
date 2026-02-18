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

    // Handle CORS preflight requests - browsers send OPTIONS before POST with Authorization header
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Max-Age": "86400"
            }
        });
    }

    // Find matching provider
    const providerKey = Object.keys(API_CONFIG).find(key => path.startsWith(`/api/${key}`));

    if (!providerKey) {
        console.warn(`[Proxy 404] Unknown Provider. URL: ${req.url}`);
        return new Response("Not Found: Unknown API Provider", { status: 404 });
    }

    const config = API_CONFIG[providerKey];
    const targetPath = path.replace(config.strip, ""); // Remove /api/provider prefix

    // Gemini sometimes needs query params for API key, sometimes in header. 
    // We pass the full search including ?key=... from the client.
    const targetUrl = `${config.target}${targetPath}${url.search}`;

    console.log(`[Proxy Start] ${req.method} ${url.pathname} -> ${targetUrl}`);

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
        headers.delete("content-length"); // Let fetch calc this

        // Delete Netlify-specific headers that might interfere
        headers.delete("netlify-original-pathname");
        headers.delete("netlify-branch");

        // Handle request body properly - BUFFER IT
        let body = null;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            try {
                const arrayBuffer = await req.arrayBuffer();
                if (arrayBuffer && arrayBuffer.byteLength > 0) {
                    body = arrayBuffer;
                    console.log(`[Proxy Body] Buffered ${arrayBuffer.byteLength} bytes.`);
                }
            } catch (e) {
                console.warn(`[Proxy Body] Failed to read body: ${e.message}`);
            }
        }

        // Prepare fetch options
        const fetchOptions = {
            method: req.method,
            headers: headers,
            body: body
        };

        // Make request to upstream API
        const response = await fetch(targetUrl, fetchOptions);

        console.log(`[Proxy Upstream] ${providerKey} responded with ${response.status}`);

        // Create response headers
        const resHeaders = new Headers(response.headers);
        resHeaders.set("Access-Control-Allow-Origin", "*"); // CORS
        resHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        resHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

        // Return response with proper streaming
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: resHeaders
        });

    } catch (error) {
        // SANITIZATION: Never log the full error object if it contains config/headers with keys
        const safeError = {
            message: error.message,
            stack: error.stack ? error.stack.split('\n')[0] : 'No stack', // First line only
            response: error.response ? {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            } : 'No response'
        };

        console.error(`[Proxy Error] ${providerKey} Failed:`, JSON.stringify(safeError));

        return new Response(JSON.stringify({
            error: "Proxy Error",
            details: error.message, // Return only the message, not the full object
            provider: providerKey
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    }
};

export const config = {
    path: "/api/*"
};
