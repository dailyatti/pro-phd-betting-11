/**
 * Custom hook to manage the central Blackboard state.
 * Defines the initial structure for match data, fact reports, insider intel, and strategy.
 * 
 * @module hooks/useBlackboardState
 */

import { useState, useCallback } from 'react';

// Consolidated initial state for clean resets
const INITIAL_BLACKBOARD_STATE = {
    MATCH_DATA: [],       // array of matchData (per group)
    FACT_REPORT: [],      // array of fact reports (per match)
    INSIDER_INTEL: [],    // array of intel reports (per match)
    STRATEGY_REPORT: null, // final aggregated strategy
    runId: null           // Unique ID for the current analysis run to prevent stale data
};

/**
 * Manages the global analysis state (The "Blackboard").
 * 
 * @returns {Object} Blackboard state and setters
 */
export const useBlackboardState = () => {
    const [blackboardState, setBlackboardState] = useState(INITIAL_BLACKBOARD_STATE);

    /**
     * Resets the blackboard to its initial empty state.
     */
    const resetBlackboard = useCallback(() => {
        setBlackboardState(INITIAL_BLACKBOARD_STATE);
    }, []);

    /**
     * Updates the blackboard state.
     * Can accept a partial state update or a function.
     * 
     * @param {Object|Function} update
     */
    const updateBlackboard = useCallback((update) => {
        setBlackboardState(prev => {
            if (typeof update === 'function') {
                return update(prev);
            }
            return { ...prev, ...update };
        });
    }, []);

    return {
        blackboardState,
        resetBlackboard,
        updateBlackboard,
        INITIAL_BLACKBOARD_STATE
    };
};
