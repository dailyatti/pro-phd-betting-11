import { normalizeMatchInput } from './phd/utils/normalizeMatchInput.js';
import { getSportEngine } from './phd/registry.js';
import { validateEngineResult } from './phd/utils/validateEngineResult.js';

/**
 * Runs the deterministic PhD Math Engine on a list of matches.
 * @param {Array} matchList - List of raw match objects from Vision/App.
 * @param {Object} config - { bankroll, kellyFraction, aggressive }
 * @returns {Object} - Map of matchId -> EngineResult
 */
export const runEngine = (matchList, config = {}, bankroll = 300) => {
    // Merge bankroll into config
    const finalConfig = { ...config, bankroll };
    console.log('[PhD Engine] Starting determinstic engine run...', { matches: matchList.length, bankroll });

    const results = {};

    matchList.forEach(rawMatch => {
        try {
            // 1. Normalize Input
            const matchInput = normalizeMatchInput(rawMatch);

            // 2. Get Engine
            const engine = getSportEngine(matchInput.sport);

            // 3. Compute
            const result = engine.computeEngine(matchInput, finalConfig);

            // 4. Validate
            const validation = validateEngineResult(result, finalConfig);

            // Attach validation to result
            result.validation = validation;

            // 5. Store
            // If validation failed critically, we might want to flag it?
            if (!validation.ok) {
                console.error(`[PhD Engine] Validation Failed for ${matchInput.id}`, validation.errors);
                result.recommendations = []; // Clear recs if invalid high risk
                result.errors = validation.errors;
            }

            results[rawMatch.id || rawMatch.matchId] = result;

        } catch (err) {
            console.error('[PhD Engine] Critical Error processing match:', rawMatch, err);
            results[rawMatch.id] = {
                error: err.message,
                recommendations: []
            };
        }
    });

    console.log('[PhD Engine] Run complete.', Object.keys(results));
    return results; // Return map for easy lookup
};
