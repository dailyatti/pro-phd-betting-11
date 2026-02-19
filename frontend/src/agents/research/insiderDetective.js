/**
 * Insider Detective Agent
 * 
 * Perplexity-based agent for social media and insider intel.
 * Scans X (Twitter), Reddit, and fan forums for rumors and insights.
 * 
 * @module agents/research/insiderDetective
 */

import axios from 'axios';
import { tryParseJson, safeStringify, isAbortError, retryAsync, callLlmProxy } from '../common/helpers.js';
import { getInsiderPrompt } from '../common/prompts/insider.js';

// ============================================================================
// PROMPTS
// ============================================================================

/**
 * Player props insider prompt
 * @param {Object} matchData - Match data
 * @returns {string} Props prompt
 */
const getPropsInsiderPrompt = (matchData) => {
    const players = matchData.extracted_props || matchData.odds?.player_props || [];
    return `
ROLE: SOCIAL MEDIA INVESTIGATOR (NO BETTING PICKS)
TARGET: ${safeStringify(players)}

TASK:
- Find credible chatter about: training absences, late scratches, sickness, coach quotes, lineup leaks.
- Prefer: verified beat writers, reputable aggregators, official club comms.
- Avoid: random ITKs unless corroborated.

OUTPUT JSON ONLY:
{
  "rumors": [
    { "content": "RUMOR: ...", "source": "X/Reddit/Forum", "credibility": "High/Medium/Low", "evidence": "short quote/token" }
  ],
  "key_insights": ["..."],
  "sources_used": ["..."]
}
`.trim();
};

/**
 * List/bulk mode insider prompt
 * @param {string} sport - Sport type
 * @param {Object} matchData - Match data
 * @returns {string} List mode prompt
 */
const getListInsiderPrompt = (sport, matchData) => `
ROLE: MULTI-MATCH INSIDER SCAN (${sport}) — NO BETTING PICKS
TARGET MATCHES: ${safeStringify(matchData.matches?.map(m => ({ team_1: m.team_1, team_2: m.team_2 })) || [])}

TASK:
- Scan for: mass illness, extreme weather, travel disruption, protests, lineup leaks.
- Return only items with some credibility; label low-cred items clearly.

OUTPUT JSON ONLY:
{
  "matches": [
    {
      "match": "Team A vs Team B",
      "rumors": [
        { "content": "RUMOR: ...", "source": "X/Reddit/Forum", "credibility": "High/Medium/Low", "evidence": "short quote/token" }
      ],
      "key_insights": ["..."]
    }
  ],
  "sources_used": ["..."]
}
`.trim();

// ============================================================================
// RESPONSE NORMALIZATION
// ============================================================================

/**
 * Normalizes insider response
 * @param {Object} res - Axios response
 * @returns {Object} Normalized response
 */
const normalizeInsiderResponse = (res) => {
    const content = res?.data?.choices?.[0]?.message?.content ?? '';
    const citations = res?.data?.citations || [];
    const parsed = tryParseJson(content);

    if (parsed && typeof parsed === 'object') {
        return {
            ...parsed,
            x_citations: citations,
            search_enabled: true,
            raw_content: content
        };
    }

    return {
        raw_content: content,
        x_citations: citations,
        quality_warning: "Response was unstructured",
        search_enabled: true
    };
};

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Runs the Insider Detective agent
 * @param {Object|string} config - Config object with key/model or API key string
 * @param {Object} matchData - Match data from Vision agent
 * @param {AbortSignal} signal - Abort signal for cancellation
 * @returns {Promise<Object>} Insider intel results
 */
export const runInsiderDetective = async (config, matchData, signal) => {
    const apiKey = typeof config === 'string' ? config : config?.key;
    const model = (config?.model && config.model.includes('sonar')) ? config.model : 'sonar-pro';

    if (!apiKey) throw new Error("Perplexity API Key is missing for Insider Intel.");
    console.log(`[Insider Detective] Scanning Social/Web with Perplexity (${model})...`);

    const sport = matchData.sport || 'FOOTBALL';
    const isList = matchData.mode === 'LIST';
    const isProps = matchData.market_type === 'PLAYER_PROPS';

    // Build search query
    let query = getInsiderPrompt(sport, matchData);

    // INJECT VISION SCRAPER GENERATED QUERIES (if available)
    const visionInsiderQueries = matchData.perplexity_search_instructions?.insider_intel_queries || [];
    if (visionInsiderQueries.length > 0 && !isProps && !isList) {
        const visionQuerySection = `
══════════════════════════════════════════════════════════════════════════════
🔍 VISION SCRAPER PRIORITY QUERIES (EXECUTE THESE FIRST):
══════════════════════════════════════════════════════════════════════════════
${visionInsiderQueries.map((q, i) => `${i + 1}. ${q}`).join('\n')}

AFTER executing the above, proceed with standard intel gathering:
══════════════════════════════════════════════════════════════════════════════
`;
        query = visionQuerySection + query;
    }

    // Override query for special modes
    if (isProps) {
        query = getPropsInsiderPrompt(matchData);
    } else if (isList) {
        query = getListInsiderPrompt(sport, matchData);
    }

    const payload = {
        model: model,
        messages: [{ role: "user", content: query }]
    };

    try {
        return await retryAsync(async () => {
            console.log('[Insider Detective] Sending request to Perplexity...');
            console.log('[Insider Detective] Sending request to Perplexity...');
            const data = await callLlmProxy({
                provider: 'perplexity',
                apiKey,
                model,
                payload,
                signal
            });

            console.log('[Insider Detective] Response received. Citations:', (data?.citations || []).length);
            return normalizeInsiderResponse({ data });
        }, [], 2);
    } catch (e) {
        if (isAbortError(e, signal)) {
            throw new DOMException('Aborted', 'AbortError');
        }
        console.error('[Insider Detective] Error:', e.message);

        // Auto-heal attempt if model was wrong or transient error
        if (model !== 'sonar-pro') {
            console.warn(`[Insider Detective] Model ${model} failed. Retrying with sonar-pro...`);
            try {
                const retryPayload = { ...payload, model: 'sonar-pro' };
                const data = await callLlmProxy({
                    provider: 'perplexity',
                    apiKey,
                    model: 'sonar-pro',
                    payload: retryPayload,
                    signal
                });
                return normalizeInsiderResponse({ data });
            } catch (retryErr) {
                console.error('[Insider Detective] Retry failed:', retryErr.message);
            }
        }

        return {
            error: true,
            quality_warning: `Insider Search failed: ${e.message}`,
            search_enabled: false
        };
    }
};
