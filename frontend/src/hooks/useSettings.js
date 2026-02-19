/**
 * Custom hook to manage application settings.
 * Handles API keys (encrypted), model selection, and UI state.
 *
 * @module hooks/useSettings
 */

import { useState, useEffect, useCallback } from 'react';
import { loadKeysEncrypted, saveKeysEncrypted, isVaultSupported } from '../utils/keyVault';

const DEFAULT_KEYS = { openai: '', perplexity: '', gemini: '' };

/**
 * Manages settings, API keys (with encryption), and model configurations.
 *
 * @returns {Object} Settings state and handlers
 */
export const useSettings = () => {
    const [showSettings, setShowSettings] = useState(false);

    // API Keys state — initialized empty, loaded async from vault
    const [apiKeys, setApiKeys] = useState(DEFAULT_KEYS);
    const [keysLoaded, setKeysLoaded] = useState(false);

    // Load encrypted keys on mount
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                if (isVaultSupported()) {
                    const keys = await loadKeysEncrypted();
                    if (!cancelled) {
                        setApiKeys({ ...DEFAULT_KEYS, ...keys });
                    }
                } else {
                    // Fallback: plaintext (old browsers)
                    try {
                        const raw = localStorage.getItem('phd_betting_api_keys');
                        const storedKeys = raw ? JSON.parse(raw) : {};
                        if (!cancelled) {
                            setApiKeys({ ...DEFAULT_KEYS, ...storedKeys });
                        }
                    } catch {
                        // ignore
                    }
                }
            } catch {
                // ignore — keys stay empty
            } finally {
                if (!cancelled) setKeysLoaded(true);
            }
        };

        load();
        return () => { cancelled = true; };
    }, []);

    // AI Model settings
    const [modelSettings, setModelSettings] = useState(() => {
        const defaults = {
            openai: 'gpt-5.2',
            perplexity: 'sonar-pro',
            gemini: 'gemini-2.0-flash',
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

    const toggleSettings = (forceState) => {
        setShowSettings(prev => typeof forceState === 'boolean' ? forceState : !prev);
    };

    /**
     * Update API keys — saves encrypted to vault
     */
    const updateApiKeys = useCallback(async (newKeys) => {
        const merged = { ...DEFAULT_KEYS, ...newKeys };
        setApiKeys(merged);

        if (isVaultSupported()) {
            await saveKeysEncrypted(merged);
        } else {
            localStorage.setItem('phd_betting_api_keys', JSON.stringify(merged));
        }
    }, []);

    const updateApiKey = (provider, key) => {
        setApiKeys(prev => {
            const next = { ...prev, [provider]: key };
            // Async save — fire and forget
            if (isVaultSupported()) {
                saveKeysEncrypted(next);
            }
            return next;
        });
    };

    const updateModel = (provider, model) => {
        setModelSettings(prev => ({ ...prev, [provider]: model }));
    };

    return {
        showSettings,
        toggleSettings,
        apiKeys,
        setApiKeys: updateApiKeys,
        updateApiKey,
        modelSettings,
        setModelSettings,
        updateModel,
        bankroll,
        setBankroll,
        keysLoaded
    };
};
