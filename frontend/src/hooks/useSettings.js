/**
 * Custom hook to manage application settings.
 * Handles API keys, model selection, and UI state for the settings modal.
 * 
 * @module hooks/useSettings
 */

import { useState } from 'react';

/**
 * Manages settings, API keys, and model configurations.
 * 
 * @returns {Object} Settings state and handlers
 */
export const useSettings = () => {
    const [showSettings, setShowSettings] = useState(false);

    // API Keys state
    const [apiKeys, setApiKeys] = useState(() => {
        try {
            const raw = localStorage.getItem('phd_betting_api_keys');
            const storedKeys = raw ? JSON.parse(raw) : {};
            // BYOK: No default keys - users must provide their own
            return {
                openai: storedKeys.openai || "",
                perplexity: storedKeys.perplexity || "",
                gemini: storedKeys.gemini || "",
            };
        } catch (e) {
            // BYOK: No default keys - users must provide their own
            return {
                openai: "",
                perplexity: "",
                gemini: "",
            };
        }
    });

    // AI Model settings — load from localStorage if available
    const [modelSettings, setModelSettings] = useState(() => {
        const defaults = {
            openai: 'gpt-5.2',
            perplexity: 'sonar-pro',
            // Provider enable/disable states
            openaiEnabled: true,
            perplexityEnabled: true,
            geminiEnabled: true
        };
        try {
            const raw = localStorage.getItem('phd_betting_models');
            if (raw) {
                const stored = JSON.parse(raw);
                return { ...defaults, ...stored };
            }
        } catch {
            // ignore
        }
        return defaults;
    });

    // Bankroll state
    const [bankroll, setBankroll] = useState('');

    /**
     * Toggles the visibility of the settings modal.
     * @param {boolean} [forceState] - Optional boolean to force a specific state
     */
    const toggleSettings = (forceState) => {
        setShowSettings(prev => typeof forceState === 'boolean' ? forceState : !prev);
    };

    /**
     * Updates a specific API key.
     * @param {string} provider - 'openai', 'perplexity', or 'gemini'
     * @param {string} key - The API key
     */
    const updateApiKey = (provider, key) => {
        setApiKeys(prev => ({ ...prev, [provider]: key }));
    };

    /**
     * Updates model selection for a provider.
     * @param {string} provider - 'openai', 'perplexity', 'gemini', or 'visionProvider'
     * @param {string} model - The model ID
     */
    const updateModel = (provider, model) => {
        setModelSettings(prev => ({ ...prev, [provider]: model }));
    };

    return {
        showSettings,
        toggleSettings,
        apiKeys,
        setApiKeys,
        updateApiKey,
        modelSettings,
        setModelSettings,
        updateModel,
        bankroll,
        setBankroll
    };
};
