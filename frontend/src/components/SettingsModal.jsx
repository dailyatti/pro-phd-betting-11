import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Key, Save, CheckCircle, Cpu, AlertTriangle } from 'lucide-react';
import { safeParse, dedupe } from '../utils/common';
import { ApiKeySection } from './settings/ApiKeySection';
import { ModelSelectionSection } from './settings/ModelSelectionSection';

const STORAGE_KEYS = {
    apiKeys: 'phd_betting_api_keys',
    models: 'phd_betting_models',
    customModels: 'phd_betting_custom_models'
};

const DEFAULT_KEYS = { openai: '', perplexity: '', gemini: '' };
const DEFAULT_MODELS = { openai: 'gpt-4o', perplexity: 'sonar-pro', gemini: 'gemini-2.5-flash-preview-05-20', visionProvider: 'openai' };
const DEFAULT_CUSTOM_MODELS = { openai: [], perplexity: [], gemini: [] };


const SettingsModal = ({
    isOpen,
    onClose,
    apiKeys = DEFAULT_KEYS,
    setApiKeys,
    modelSettings = DEFAULT_MODELS,
    setModelSettings,
    darkMode = true,
}) => {
    // Local draft state (modal editing)
    const [localKeys, setLocalKeys] = useState({ ...DEFAULT_KEYS, ...apiKeys });
    const [localModels, setLocalModels] = useState({ ...DEFAULT_MODELS, ...modelSettings });
    const [saved, setSaved] = useState(false);
    const [showConfirmClose, setShowConfirmClose] = useState(false); // User Request: Unsaved changes confirmation

    // Custom model UI toggles + inputs
    const [showCustomOpenai, setShowCustomOpenai] = useState(false);
    const [showCustomPerplexity, setShowCustomPerplexity] = useState(false);
    const [showCustomGemini, setShowCustomGemini] = useState(false);
    const [customOpenai, setCustomOpenai] = useState('');
    const [customPerplexity, setCustomPerplexity] = useState('');
    const [customGemini, setCustomGemini] = useState('');

    // Persisted custom models
    const [customModels, setCustomModels] = useState(DEFAULT_CUSTOM_MODELS);

    // Load from localStorage once (initial mount)
    useEffect(() => {
        const storedKeysStr = localStorage.getItem(STORAGE_KEYS.apiKeys);
        const storedModelsStr = localStorage.getItem(STORAGE_KEYS.models);
        const storedCustomModelsStr = localStorage.getItem(STORAGE_KEYS.customModels);

        const storedKeys = storedKeysStr ? safeParse(storedKeysStr, DEFAULT_KEYS) : null;
        const storedModels = storedModelsStr ? safeParse(storedModelsStr, DEFAULT_MODELS) : null;
        const storedCustom = storedCustomModelsStr ? safeParse(storedCustomModelsStr, DEFAULT_CUSTOM_MODELS) : null;

        if (storedKeys) {
            const merged = { ...DEFAULT_KEYS, ...storedKeys };
            setLocalKeys(merged);
            setApiKeys?.(merged);
        }

        if (storedModels) {
            // MIGRATION: Fix invalid Perplexity model names from old versions
            const VALID_PERPLEXITY_MODELS = [
                'sonar-pro', 'sonar', 'sonar-reasoning', 'sonar-reasoning-pro',
                'sonar-deep-research', 'sonar-deep-research-pro'
            ];
            let pplxModel = storedModels.perplexity || DEFAULT_MODELS.perplexity;
            if (!VALID_PERPLEXITY_MODELS.includes(pplxModel)) {
                console.warn(`[Settings] Invalid Perplexity model "${pplxModel}" found. Migrating to "sonar-pro".`);
                pplxModel = 'sonar-pro';
            }
            const merged = { ...DEFAULT_MODELS, ...storedModels, perplexity: pplxModel };
            setLocalModels(merged);
            setModelSettings?.(merged);
            // Persist the fix immediately
            localStorage.setItem(STORAGE_KEYS.models, JSON.stringify(merged));
        }

        if (storedCustom) {
            const merged = {
                openai: dedupe(storedCustom.openai),
                perplexity: dedupe(storedCustom.perplexity)
            };
            setCustomModels(merged);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const apiProviders = useMemo(() => ([
        {
            key: 'openai',
            label: 'OpenAI',
            hint: 'GPT-5.2 / 4o',
            placeholder: 'sk-...',
            link: 'https://platform.openai.com/api-keys',
            accent: darkMode ? 'text-cyan-400' : 'text-cyan-600',
            focusRing: 'focus:ring-cyan-500/50'
        },
        {
            key: 'perplexity',
            label: 'Perplexity',
            hint: 'Fact Checker & Insider (Sonar Pro)',
            placeholder: 'pplx-...',
            link: 'https://docs.perplexity.ai/guides/getting-started',
            accent: darkMode ? 'text-blue-400' : 'text-blue-600',
            focusRing: 'focus:ring-blue-500/50'
        },
        {
            key: 'gemini',
            label: 'Gemini (Google AI)',
            hint: 'Alternative Vision',
            placeholder: 'AIza...',
            link: 'https://aistudio.google.com/apikey',
            accent: darkMode ? 'text-emerald-400' : 'text-emerald-600',
            focusRing: 'focus:ring-emerald-500/50'
        },
    ]), [darkMode]);

    // Base model lists
    const baseModelOptions = useMemo(() => ({
        openai: [
            'gpt-5-mini-2025-08-07',
            'gpt-5.2',
            'gpt-5.2-pro',
            'gpt-4.1',
            'gpt-4.1-mini',
            'gpt-4o',
            'gpt-4o-mini',
            'o4-mini',
            'o3',
            'o3-mini',
            'o3-pro'
        ],
        perplexity: [
            'sonar-pro',
            'sonar',
            'sonar-reasoning',
            'sonar-reasoning-pro',
            'sonar-deep-research',
            'sonar-deep-research-pro'
        ],
        gemini: [
            'gemini-2.5-flash-preview-05-20',
            'gemini-2.5-pro-preview-05-06',
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-1.5-pro'
        ],
        xai: [
            'grok-2',
            'grok-beta'
        ],
    }), []);

    // Merge base + custom (deduped)
    const modelOptions = useMemo(() => ({
        openai: dedupe([...baseModelOptions.openai, ...(customModels.openai || [])]),
        perplexity: dedupe([...baseModelOptions.perplexity, ...(customModels.perplexity || [])]),
        gemini: dedupe([...baseModelOptions.gemini, ...(customModels.gemini || [])])
    }), [baseModelOptions, customModels]);

    // UI classes — uses theme design tokens for consistency
    const inputBg = darkMode
        ? 'bg-black/40 border-subtle text-primary placeholder-tertiary focus:border-cyan-500/50'
        : 'bg-white border-subtle text-primary placeholder-tertiary shadow-sm focus:border-amber-400';
    const labelColor = 'text-secondary';
    const headerColor = 'text-primary';
    const bannerBg = darkMode
        ? 'bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 border-emerald-500/20 text-slate-300'
        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 text-blue-800';
    const dividerColor = 'border-subtle';
    const buttonSecondary = darkMode
        ? 'bg-black/30 hover:bg-black/50 border border-subtle text-primary'
        : 'bg-white hover:bg-slate-50 border border-subtle text-primary shadow-sm';

    const persistAll = useCallback((keysToSave, modelsToSave, customToSave) => {
        localStorage.setItem(STORAGE_KEYS.apiKeys, JSON.stringify(keysToSave));
        localStorage.setItem(STORAGE_KEYS.models, JSON.stringify(modelsToSave));
        localStorage.setItem(STORAGE_KEYS.customModels, JSON.stringify(customToSave));
    }, []);

    const handleSave = useCallback(() => {
        const keysToSave = { ...DEFAULT_KEYS, ...localKeys };
        const modelsToSave = { ...DEFAULT_MODELS, ...localModels };
        const customToSave = {
            openai: dedupe(customModels.openai),
            perplexity: dedupe(customModels.perplexity),
            gemini: dedupe(customModels.gemini)
        };

        persistAll(keysToSave, modelsToSave, customToSave);

        setApiKeys?.(keysToSave);
        setModelSettings?.(modelsToSave);

        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            onClose?.();
        }, 800);
    }, [localKeys, localModels, customModels, persistAll, setApiKeys, setModelSettings, onClose]);

    const addCustomModel = useCallback((provider) => {
        let raw = '';
        if (provider === 'openai') raw = customOpenai;
        else if (provider === 'perplexity') raw = customPerplexity;
        else if (provider === 'gemini') raw = customGemini;

        const value = String(raw || '').trim();
        if (!value) return;

        setCustomModels(prev => {
            const next = {
                ...prev,
                [provider]: dedupe([...(prev?.[provider] || []), value])
            };
            // persist immediately to avoid losing on close
            localStorage.setItem(STORAGE_KEYS.customModels, JSON.stringify(next));
            return next;
        });

        // select it immediately
        setLocalModels(prev => ({ ...prev, [provider]: value }));

        // clear + hide
        if (provider === 'openai') {
            setCustomOpenai('');
            setShowCustomOpenai(false);
        } else if (provider === 'perplexity') {
            setCustomPerplexity('');
            setShowCustomPerplexity(false);
        } else if (provider === 'gemini') {
            setCustomGemini('');
            setShowCustomGemini(false);
        }
    }, [customOpenai, customPerplexity, customGemini]);

    const onCloseHard = useCallback(() => {
        // close without saving -> revert draft to props
        setLocalKeys({ ...DEFAULT_KEYS, ...apiKeys });
        setLocalModels({ ...DEFAULT_MODELS, ...modelSettings });
        setCustomOpenai('');
        setCustomPerplexity('');
        setCustomGemini('');
        onClose?.();
    }, [apiKeys, modelSettings, onClose]);

    const customModelsFlat = useMemo(() => {
        const list = dedupe([
            ...(customModels.openai || []),
            ...(customModels.perplexity || []),
            ...(customModels.gemini || [])
        ]);
        return list;
    }, [customModels]);

    // Check for unsaved changes
    const hasUnsavedChanges = useMemo(() => {
        // Compare current local drafts with what was passed in (or loaded)
        // We use JSON stringify for deep comparison of simple objects
        const keysChanged = JSON.stringify(localKeys) !== JSON.stringify({ ...DEFAULT_KEYS, ...apiKeys });
        const modelsChanged = JSON.stringify(localModels) !== JSON.stringify({ ...DEFAULT_MODELS, ...modelSettings });
        return keysChanged || modelsChanged;
    }, [localKeys, apiKeys, localModels, modelSettings]);

    const handleCloseRequest = useCallback(() => {
        if (hasUnsavedChanges) {
            setShowConfirmClose(true);
        } else {
            onCloseHard();
        }
    }, [hasUnsavedChanges, onCloseHard]);

    const handleDiscardChanges = useCallback(() => {
        setShowConfirmClose(false);
        onCloseHard();
    }, [onCloseHard]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center lg:pl-64 pt-6 pb-10 px-4 overflow-y-auto">
            {/* Enhanced Backdrop */}
            <div className={`fixed inset-0 backdrop-blur-xl ${darkMode ? 'bg-black/70' : 'bg-white/60'}`} onClick={handleCloseRequest} />

            {/* Modal Container */}
            <div className={`w-full max-w-xl relative rounded-3xl border shadow-2xl z-10 my-auto transition-all duration-300
                ${darkMode
                    ? 'bg-panel border-subtle shadow-black/50'
                    : 'bg-panel border-strong shadow-xl'
                }`}
            >
                {/* UNSAVED CHANGES OVERLAY */}
                {showConfirmClose && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-3xl animate-in fade-in duration-200">
                        <div className={`p-6 rounded-2xl border max-w-sm w-full mx-4 shadow-2xl transform scale-100 transition-all ${darkMode ? 'bg-panel border-rose-500/30' : 'bg-panel border-rose-200'}`}>
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-3 rounded-full bg-rose-500/10 mb-2">
                                    <AlertTriangle size={32} className="text-rose-500" />
                                </div>
                                <h3 className={`text-xl font-bold ${headerColor}`}>Unsaved Changes</h3>
                                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    You have unsaved changes in your configuration. Do you want to save them or discard them?
                                </p>

                                <div className="flex flex-col w-full gap-2 pt-2">
                                    <button
                                        onClick={() => { setShowConfirmClose(false); handleSave(); }}
                                        className="w-full py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} /> Save & Close
                                    </button>

                                    <button
                                        onClick={handleDiscardChanges}
                                        className={`w-full py-3 rounded-xl font-bold transition-colors ${darkMode ? 'bg-slate-800 text-rose-400 hover:bg-slate-700 hover:text-rose-300' : 'bg-slate-100 text-rose-600 hover:bg-slate-200'}`}
                                    >
                                        Discard Changes
                                    </button>

                                    <button
                                        onClick={() => setShowConfirmClose(false)}
                                        className={`w-full py-2 text-xs font-medium ${darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Cancel (Keep Editing)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Ambient Glow Effect */}
                <div className={`absolute inset-0 opacity-30 pointer-events-none rounded-3xl
                    ${darkMode
                        ? 'bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10'
                        : 'bg-gradient-to-br from-amber-300/10 via-transparent to-orange-300/10'
                    }`}
                />

                {/* Content */}
                <div className="relative z-10 p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${darkMode
                                ? 'bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border border-cyan-500/20'
                                : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60'
                                }`}>
                                <Key size={24} className={darkMode ? 'text-cyan-400' : 'text-amber-600'} />
                            </div>
                            <div>
                                <h3 className={`text-xl font-black tracking-tight ${headerColor}`}>API Configuration</h3>
                                <p className="text-xs text-tertiary mt-0.5">Manage secure keys & model settings</p>
                            </div>
                        </div>

                        <button
                            onClick={handleCloseRequest}
                            className={`p-2.5 rounded-xl transition-colors ${darkMode ? 'hover:bg-elevated text-tertiary hover:text-primary' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'}`}
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Info Banner */}
                    <div className={`border rounded-2xl p-4 mb-8 text-sm flex items-start gap-3 ${bannerBg}`}>
                        <div className={`p-2 rounded-xl shrink-0 ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white text-blue-600 shadow-sm border border-blue-100'}`}>
                            <Key size={16} />
                        </div>
                        <p className="text-xs leading-relaxed">Your keys are stored locally in your browser's localStorage. They communicate directly with AI providers — never sent to any backend server.</p>
                    </div>

                    {/* API Key Inputs */}
                    <ApiKeySection
                        apiProviders={apiProviders}
                        localKeys={localKeys}
                        setLocalKeys={setLocalKeys}
                        localModels={localModels}
                        darkMode={darkMode}
                        inputBg={inputBg}
                        labelColor={labelColor}
                    />

                    {/* Model Selection */}
                    <div className={`mt-8 pt-8 border-t ${dividerColor}`}>
                        <div className="flex items-center gap-3 mb-6">
                            <Cpu size={20} className={darkMode ? "text-purple-400" : "text-purple-600"} />
                            <h4 className={`text-lg font-bold ${headerColor}`}>AI Model Selection</h4>
                        </div>

                        <ModelSelectionSection
                            localModels={localModels}
                            setLocalModels={setLocalModels}
                            modelOptions={modelOptions}
                            darkMode={darkMode}
                            inputBg={inputBg}
                            labelColor={labelColor}
                            buttonSecondary={buttonSecondary}
                            setShowCustomOpenai={setShowCustomOpenai}
                            setShowCustomPerplexity={setShowCustomPerplexity}
                            setShowCustomGemini={setShowCustomGemini}
                            addCustomModel={addCustomModel}
                            customOpenai={customOpenai}
                            setCustomOpenai={setCustomOpenai}
                            customPerplexity={customPerplexity}
                            setCustomPerplexity={setCustomPerplexity}
                            customGemini={customGemini}
                            setCustomGemini={setCustomGemini}
                            showCustomOpenai={showCustomOpenai}
                            showCustomPerplexity={showCustomPerplexity}
                            showCustomGemini={showCustomGemini}
                        />

                        {/* Custom models list */}
                        {customModelsFlat.length > 0 && (
                            <p className={`text-xs mt-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                💡 Custom models: {customModelsFlat.join(', ')}
                            </p>
                        )}
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        className={`w-full mt-8 flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.98] ${saved
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : darkMode
                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 border border-cyan-500/30'
                                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/20 border border-amber-400/30'
                            }`}
                    >
                        {saved ? <CheckCircle size={18} /> : <Save size={18} />}
                        {saved ? 'Settings Saved' : 'Save & Close'}
                    </button>

                    <p className="text-[10px] text-center mt-4 font-medium text-tertiary">
                        Changes apply immediately to your next analysis session.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
