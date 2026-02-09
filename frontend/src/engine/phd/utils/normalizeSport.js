/**
 * @typedef {import('./types').SportType} SportType
 */

/**
 * Normalizes a raw sport string into a strict SportType enum.
 * @param {string} rawSport - The raw sport string (e.g., "Soccer", "NBA", "ice_hockey")
 * @returns {SportType} - The normalized sport type. Defaults to 'FOOTBALL' if unknown.
 */
export const normalizeSport = (rawSport) => {
    if (!rawSport) return 'FOOTBALL';

    const s = rawSport.toUpperCase().trim();

    if (s.includes('SOCCER') || s.includes('FOOTBALL') || s.includes('FOCI')) return 'FOOTBALL';
    if (s.includes('BASKET') || s.includes('KOSAR') || s.includes('KOSÁR') || s.includes('NBA') || s.includes('EUROLEAGUE')) return 'BASKETBALL';
    if (s.includes('TENNIS') || s.includes('ATP') || s.includes('WTA')) return 'TENNIS';
    if (s.includes('NFL') || s.includes('AM. FOOTBALL')) return 'NFL';
    if (s.includes('HOCKEY') || s.includes('NHL')) return 'HOCKEY';
    if (s.includes('BASEBALL') || s.includes('MLB')) return 'BASEBALL';

    console.warn(`[Engine] Unknown sport '${rawSport}', defaulting to FOOTBALL`);
    return 'FOOTBALL';
};
