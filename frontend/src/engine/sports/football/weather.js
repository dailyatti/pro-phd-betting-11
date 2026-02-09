/**
 * Football Weather Adjustments
 * Reduces expected goals (xG) based on adverse weather.
 */

const WEATHER_PENALTIES = {
    RAIN: { heavy: 0.10, light: 0.02 }, // 10% reduction for heavy rain
    SNOW: { heavy: 0.20, light: 0.05 },
    WIND: { strong: 0.15, moderate: 0.05 }, // Wind affects long balls/crosses
    HEAT: { extreme: 0.05 } // Fatigue factor (slower pace)
};

/**
 * Adjusts team lambda (xG) based on weather report.
 * @param {number} lambda - Expected goals
 * @param {object} weather - { condition: 'RAIN', intensity: 'heavy' }
 * @returns {number} Adjusted lambda
 */
export const adjustForWeather = (lambda, weather) => {
    if (!weather || !weather.condition) return lambda;

    const type = weather.condition.toUpperCase(); // RAIN, SNOW...
    const intensity = (weather.intensity || 'moderate').toLowerCase();

    const penalties = WEATHER_PENALTIES[type];
    if (!penalties) return lambda;

    // Use specific intensity penalty or default to lowest if not found
    const penalty = penalties[intensity] || Object.values(penalties)[0] || 0;

    return lambda * (1 - penalty);
};
