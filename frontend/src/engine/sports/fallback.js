/**
 * Generic Sports Model (Fallback)
 * Used when no specific sport model is available.
 */

// Simple Logistic Function for Win Probability based on Rating Diff
// P(A) = 1 / (1 + 10^(-diff/400)) for Elo
// Here we assume "strength_diff" is provided in the input range [-100, 100]
const calcLogisticProb = (diff) => {
    // sensitivity: diff=10 => ~53%, diff=50 => ~64%
    return 1 / (1 + Math.exp(-diff * 0.05));
};

/**
 * Validates and provides fallback probabilities.
 * @param {object} params
 * @param {number} params.impliedProb - Market implied prob (for reference)
 * @param {number} params.confidence - Agent confidence in the pick (0-1)
 */
export const calcGenericProbs = ({ impliedProb, confidence = 0.5, skew = 0 }) => {
    // If we have no model, we might just "tilt" the market odds slightly based on confidence/skew
    // This is a heuristic for "I think the market is wrong by X%"

    // Safe defaults
    const pMarket = impliedProb || 0.5;

    // Apply Skew: if skew > 0, we like this side more
    // skew 0.05 means we add 5% to probability
    let pModel = pMarket + skew;

    // Clamp
    pModel = Math.max(0.01, Math.min(0.99, pModel));

    return {
        win: pModel,
        loss: 1 - pModel
    };
};
