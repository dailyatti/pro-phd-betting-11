/**
 * @typedef {import('../types').EngineResult} EngineResult
 * @typedef {import('../types').ValidationResult} ValidationResult
 */

/**
 * Validates the output of a sport engine to ensure mathematical sanity.
 * @param {EngineResult} result
 * @param {object} config - { bankroll }
 * @returns {ValidationResult}
 */
export const validateEngineResult = (result, config) => {
    const errors = [];
    const warnings = [];

    if (!result) {
        return { ok: false, errors: ['Null engine result'], warnings: [] };
    }

    // 1. Check Recommendations
    result.recommendations.forEach((rec, idx) => {
        const prefix = `Rec[${idx} - ${rec.selection}]`;

        // NaN Checks
        if (isNaN(rec.probability) || rec.probability < 0 || rec.probability > 1) {
            errors.push(`${prefix}: Invalid probability (${rec.probability})`);
        }
        if (typeof rec.odds !== 'number' || rec.odds <= 1) {
            errors.push(`${prefix}: Invalid odds (${rec.odds})`);
        }
        if (isNaN(rec.ev)) {
            errors.push(`${prefix}: Invalid EV (NaN)`);
        }
        if (isNaN(rec.suggestedStake) || rec.suggestedStake < 0) {
            errors.push(`${prefix}: Invalid stake (${rec.suggestedStake})`);
        }

        // Logical Consistency: Positive EV but AVOID? (Allowed, but warn)
        if (rec.ev > 0.10 && rec.recommendation_level === 'AVOID' && rec.odds > 1.2) {
            warnings.push(`${prefix}: High EV (${rec.ev}) but marked AVOID. Check logic.`);
        }

        // Logical Consistency: Negative EV but RECOMMENDED? (Error)
        if (rec.ev < 0 && ['STRONG', 'GOOD', 'LEAN'].includes(rec.recommendation_level)) {
            // Except for hedges, this is usually wrong
            warnings.push(`${prefix}: Negative EV (${rec.ev}) but level is ${rec.recommendation_level}.`);
        }

        // Bankroll Sanity
        if (config.bankroll && rec.suggestedStake > config.bankroll * 0.5) {
            warnings.push(`${prefix}: Stake > 50% of bankroll. This is reckless.`);
        }
    });

    return {
        ok: errors.length === 0,
        errors,
        warnings
    };
};
