import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Key, Save, CheckCircle, ExternalLink, Cpu, Plus, AlertTriangle } from 'lucide-react';

const STORAGE_KEYS = {
    apiKeys: 'phd_betting_api_keys',
    models: 'phd_betting_models',
    customModels: 'phd_betting_custom_models'
};

const DEFAULT_KEYS = { openai: '', perplexity: '', gemini: '', deepseek: '' };
const DEFAULT_MODELS = { openai: 'gpt-5.2', perplexity: 'sonar-pro', gemini: 'gemini-2.5-flash-preview-05-20', deepseek: 'deepseek-reasoner', visionProvider: 'openai', useDeepSeekReasoning: false };
const DEFAULT_CUSTOM_MODELS = { openai: [], perplexity: [], gemini: [], deepseek: [] };

// Safe JSON parse helper
const safeParse = (str, fallback) => {
    try {
        const parsed = JSON.parse(str);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
};

// Dedupe helper
const dedupe = (arr) => Array.from(new Set((arr || []).map(s => String(s).trim()).filter(Boolean)));

const TestConnectionButton = ({ provider, apiKey, model, darkMode }) => {
    const [status, setStatus] = useState('IDLE'); // IDLE, LOADING, SUCCESS, ERROR
    const [msg, setMsg] = useState('');

    const testConnection = async () => {
        if (!apiKey) {
            setStatus('ERROR');
            setMsg('No Key');
            return;
        }

        setStatus('LOADING');
        setMsg('');

        try {
            let url = '';
            let body = {};

            if (provider === 'openai') {
                url = '/api/openai/chat/completions';
                body = {
                    model: model || 'gpt-5.2',
                    messages: [{ role: 'user', content: 'Hello (test)' }],
                    max_completion_tokens: 5
                };
            } else if (provider === 'perplexity') {
                url = '/api/perplexity/chat/completions';
                body = {
                    model: model || 'sonar-pro',
                    messages: [{ role: 'user', content: 'Hello (test)' }],
                    max_tokens: 5
                };
            } else if (provider === 'gemini') {
                url = '/api/gemini/chat/completions';
                body = {
                    model: model || 'gemini-1.5-flash',
                    messages: [{ role: 'user', content: 'Hello (test)' }],
                    max_tokens: 5
                };
            } else if (provider === 'deepseek') {
                url = '/api/deepseek/chat/completions';
                body = {
                    model: model || 'deepseek-chat',
                    messages: [{ role: 'user', content: 'Hello' }],
                    max_tokens: 5
                };
            } else {
                throw new Error('Unknown provider');
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Status ${res.status}`);
            }

            const data = await res.json();
            if (data?.choices?.[0] || data?.candidates?.[0]) {
                setStatus('SUCCESS');
                setMsg('OK');
            } else {
                throw new Error('Invalid response');
            }
        } catch (err) {
            setStatus('ERROR');
            setMsg('Failed');
            console.error(err);
        }
    };

    const isLoading = status === 'LOADING';
    const isSuccess = status === 'SUCCESS';
    const isError = status === 'ERROR';

    return (
        <div className="flex items-center gap-2">
            {msg && (
                <span className={`text-[10px] font-mono ${isError ? 'text-rose-500' : isSuccess ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {msg}
                </span>
            )}
            <button
                onClick={testConnection}
                disabled={isLoading || !apiKey}
                className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all border
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                    ${isSuccess
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : isError
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : darkMode
                                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }
                `}
            >
                {isLoading ? '...' : 'Test'}
            </button>
        </div>
    );
};

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
    const [showCustomDeepseek, setShowCustomDeepseek] = useState(false);
    const [customOpenai, setCustomOpenai] = useState('');
    const [customPerplexity, setCustomPerplexity] = useState('');
    const [customGemini, setCustomGemini] = useState('');
    const [customDeepseek, setCustomDeepseek] = useState('');

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
        {
            key: 'deepseek',
            label: 'DeepSeek',
            hint: 'Reasoning & Logic (Low Cost)',
            placeholder: 'sk-...',
            link: 'https://platform.deepseek.com/api_keys',
            accent: darkMode ? 'text-indigo-400' : 'text-indigo-600',
            focusRing: 'focus:ring-indigo-500/50'
        }
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
        deepseek: [
            'deepseek-reasoner',
            'deepseek-chat'
        ]
    }), []);

    // Merge base + custom (deduped)
    const modelOptions = useMemo(() => ({
        openai: dedupe([...baseModelOptions.openai, ...(customModels.openai || [])]),
        perplexity: dedupe([...baseModelOptions.perplexity, ...(customModels.perplexity || [])]),
        gemini: dedupe([...baseModelOptions.gemini, ...(customModels.gemini || [])]),
        deepseek: dedupe([...baseModelOptions.deepseek, ...(customModels.deepseek || [])])
    }), [baseModelOptions, customModels]);

    // UI classes (light/dark)
    const modalBg = darkMode ? 'bg-slate-900/95 border-slate-700' : 'bg-white border-slate-200';
    const inputBg = darkMode
        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400';
    const labelColor = darkMode ? 'text-slate-400' : 'text-slate-600';
    const headerColor = darkMode ? 'text-white' : 'text-slate-900';
    const bannerBg = darkMode
        ? 'bg-slate-800/50 border-slate-700 text-slate-300'
        : 'bg-blue-50 border-blue-200 text-blue-800';
    const dividerColor = darkMode ? 'border-slate-700' : 'border-slate-200';
    const buttonSecondary = darkMode
        ? 'bg-slate-700 hover:bg-slate-600 text-white'
        : 'bg-slate-200 hover:bg-slate-300 text-slate-700';

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
            gemini: dedupe(customModels.gemini),
            deepseek: dedupe(customModels.deepseek)
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
        else if (provider === 'deepseek') raw = customDeepseek;

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
        } else if (provider === 'deepseek') {
            setCustomDeepseek('');
            setShowCustomDeepseek(false);
        }
    }, [customOpenai, customPerplexity, customGemini, customDeepseek]);

    const onCloseHard = useCallback(() => {
        // close without saving -> revert draft to props
        setLocalKeys({ ...DEFAULT_KEYS, ...apiKeys });
        setLocalModels({ ...DEFAULT_MODELS, ...modelSettings });
        setCustomOpenai('');
        setCustomPerplexity('');
        setCustomGemini('');
        setCustomDeepseek('');
        onClose?.();
    }, [apiKeys, modelSettings, onClose]);

    const customModelsFlat = useMemo(() => {
        const list = dedupe([
            ...(customModels.openai || []),
            ...(customModels.perplexity || []),
            ...(customModels.deepseek || [])
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
        <div className="fixed inset-0 z-[100] flex items-start justify-center pl-64 pt-10 pb-10 overflow-y-auto">
            {/* Enhanced Backdrop with Gradient */}
            <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-slate-900/70 backdrop-blur-xl" onClick={handleCloseRequest} />

            {/* Modal Container */}
            <div className={`w-full max-w-xl relative rounded-3xl border-2 shadow-2xl z-10 my-auto
                ${darkMode
                    ? 'bg-slate-900/95 border-slate-700/50 shadow-cyan-900/20'
                    : 'bg-white/95 border-amber-200/50 shadow-amber-900/10'
                }`}
                style={{ backdropFilter: 'blur(20px)' }}
            >
                {/* UNSAVED CHANGES OVERLAY */}
                {showConfirmClose && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-3xl animate-in fade-in duration-200">
                        <div className={`p-6 rounded-2xl border max-w-sm w-full mx-4 shadow-2xl transform scale-100 transition-all ${darkMode ? 'bg-slate-900 border-rose-500/30' : 'bg-white border-rose-200'}`}>
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
                <div className="relative z-10 p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                                <Key size={20} className="text-cyan-500" />
                            </div>
                            <h3 className={`text-xl font-bold ${headerColor}`}>API Configuration</h3>
                        </div>

                        <button
                            onClick={handleCloseRequest}
                            className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Info Banner */}
                    <div className={`border rounded-lg p-3 mb-6 text-sm ${bannerBg}`}>
                        <p>🔐 Your keys are stored locally in your browser. Never sent to any server except the AI providers.</p>
                    </div>

                    {/* API Key Inputs */}
                    <div className="space-y-4">
                        {apiProviders.map((provider) => (
                            <div key={provider.key}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className={`text-xs font-medium ${labelColor}`}>
                                        {provider.label}{' '}
                                        <span className={provider.accent}>({provider.hint})</span>
                                    </label>

                                    <div className="flex items-center gap-2">
                                        <TestConnectionButton
                                            provider={provider.key}
                                            apiKey={localKeys?.[provider.key]}
                                            model={localModels?.[provider.key]}
                                            darkMode={darkMode}
                                        />
                                        <a
                                            href={provider.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`text-xs flex items-center gap-1 ${provider.accent} hover:underline`}
                                        >
                                            Get Key <ExternalLink size={12} />
                                        </a>
                                    </div>
                                </div>

                                <input
                                    type="password"
                                    value={localKeys?.[provider.key] ?? ''}
                                    onChange={e => setLocalKeys(prev => ({ ...(prev || {}), [provider.key]: e.target.value }))}
                                    className={`w-full border rounded-lg p-2.5 text-sm transition outline-none focus:ring-2 ${provider.focusRing} ${inputBg}`}
                                    placeholder={provider.placeholder}
                                    autoComplete="off"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Model Selection */}
                    <div className={`mt-6 pt-6 border-t ${dividerColor}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <Cpu size={18} className="text-purple-500" />
                            <h4 className={`font-semibold text-sm ${headerColor}`}>Optional: Model Override</h4>
                        </div>

                        {/* OpenAI Model */}
                        <div className="mb-4">
                            <label className={`text-xs font-medium block mb-1.5 ${labelColor}`}>OpenAI Model</label>
                            <div className="flex gap-2">
                                <select
                                    value={localModels.openai}
                                    onChange={e => setLocalModels(prev => ({ ...prev, openai: e.target.value }))}
                                    className={`flex-1 border rounded-lg p-2.5 text-sm transition outline-none focus:ring-2 focus:ring-cyan-500/50 ${inputBg}`}
                                >
                                    {modelOptions.openai.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>

                                <button
                                    onClick={() => setShowCustomOpenai(v => !v)}
                                    className={`px-3 rounded-lg transition ${buttonSecondary}`}
                                    title="Add custom model"
                                    aria-label="Add custom OpenAI model"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            {showCustomOpenai && (
                                <div className="mt-2 flex gap-2 animate-fade-in">
                                    <input
                                        type="text"
                                        value={customOpenai}
                                        onChange={e => setCustomOpenai(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addCustomModel('openai')}
                                        className={`flex-1 border rounded-lg p-2 text-sm transition outline-none focus:ring-2 focus:ring-cyan-500/50 ${inputBg}`}
                                        placeholder="Enter custom model name..."
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => addCustomModel('openai')}
                                        className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Perplexity Model */}
                        <div className="mb-2">
                            <label className={`text-xs font-medium block mb-1.5 ${labelColor}`}>Perplexity Model</label>
                            <div className="flex gap-2">
                                <select
                                    value={localModels.perplexity}
                                    onChange={e => setLocalModels(prev => ({ ...prev, perplexity: e.target.value }))}
                                    className={`flex-1 border rounded-lg p-2.5 text-sm transition outline-none focus:ring-2 focus:ring-blue-500/50 ${inputBg}`}
                                >
                                    {modelOptions.perplexity.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>

                                <button
                                    onClick={() => setShowCustomPerplexity(v => !v)}
                                    className={`px-3 rounded-lg transition ${buttonSecondary}`}
                                    title="Add custom model"
                                    aria-label="Add custom Perplexity model"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            {showCustomPerplexity && (
                                <div className="mt-2 flex gap-2 animate-fade-in">
                                    <input
                                        type="text"
                                        value={customPerplexity}
                                        onChange={e => setCustomPerplexity(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addCustomModel('perplexity')}
                                        className={`flex-1 border rounded-lg p-2 text-sm transition outline-none focus:ring-2 focus:ring-blue-500/50 ${inputBg}`}
                                        placeholder="Enter custom model name..."
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => addCustomModel('perplexity')}
                                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Gemini Model */}
                        <div className="mb-4">
                            <label className={`text-xs font-medium block mb-1.5 ${labelColor}`}>Gemini Model</label>
                            <div className="flex gap-2">
                                <select
                                    value={localModels.gemini}
                                    onChange={e => setLocalModels(prev => ({ ...prev, gemini: e.target.value }))}
                                    className={`flex-1 border rounded-lg p-2.5 text-sm transition outline-none focus:ring-2 focus:ring-emerald-500/50 ${inputBg}`}
                                >
                                    {modelOptions.gemini.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>

                                <button
                                    onClick={() => setShowCustomGemini(v => !v)}
                                    className={`px-3 rounded-lg transition ${buttonSecondary}`}
                                    title="Add custom model"
                                    aria-label="Add custom Gemini model"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            {showCustomGemini && (
                                <div className="mt-2 flex gap-2 animate-fade-in">
                                    <input
                                        type="text"
                                        value={customGemini}
                                        onChange={e => setCustomGemini(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addCustomModel('gemini')}
                                        className={`flex-1 border rounded-lg p-2 text-sm transition outline-none focus:ring-2 focus:ring-emerald-500/50 ${inputBg}`}
                                        placeholder="Enter custom model name..."
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => addCustomModel('gemini')}
                                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* DeepSeek Model & Toggle */}
                        <div className="mb-4">
                            <label className={`text-xs font-medium block mb-1.5 ${labelColor}`}>DeepSeek Model</label>

                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${localModels.useDeepSeekReasoning ? 'text-indigo-500' : 'text-slate-400'}`}>
                                    {localModels.useDeepSeekReasoning ? 'ENABLED for Reasoning' : 'DISABLED'}
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={localModels.useDeepSeekReasoning || false}
                                        onChange={e => setLocalModels(prev => ({ ...prev, useDeepSeekReasoning: e.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            <div className="flex gap-2">
                                <select
                                    value={localModels.deepseek}
                                    onChange={e => setLocalModels(prev => ({ ...prev, deepseek: e.target.value }))}
                                    disabled={!localModels.useDeepSeekReasoning}
                                    className={`flex-1 border rounded-lg p-2.5 text-sm transition outline-none focus:ring-2 focus:ring-indigo-500/50 ${inputBg} ${!localModels.useDeepSeekReasoning ? 'opacity-50' : ''}`}
                                >
                                    {modelOptions.deepseek.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>

                                <button
                                    onClick={() => setShowCustomDeepseek(v => !v)}
                                    className={`px-3 rounded-lg transition ${buttonSecondary}`}
                                    title="Add custom model"
                                    aria-label="Add custom DeepSeek model"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            {showCustomDeepseek && (
                                <div className="mt-2 flex gap-2 animate-fade-in">
                                    <input
                                        type="text"
                                        value={customDeepseek}
                                        onChange={e => setCustomDeepseek(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addCustomModel('deepseek')}
                                        className={`flex-1 border rounded-lg p-2 text-sm transition outline-none focus:ring-2 focus:ring-indigo-500/50 ${inputBg}`}
                                        placeholder="Enter custom model name..."
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => addCustomModel('deepseek')}
                                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Vision Provider Toggle */}
                        <div className={`p-4 rounded-xl border mb-4 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <label className={`text-xs font-medium block mb-2 ${labelColor}`}>Vision Provider (Image Analysis)</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setLocalModels(prev => ({ ...prev, visionProvider: 'openai' }))}
                                    className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${localModels.visionProvider === 'openai'
                                        ? 'bg-cyan-600 text-white shadow-lg'
                                        : darkMode
                                            ? 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                        }`}
                                >
                                    OpenAI (GPT)
                                </button>
                                <button
                                    onClick={() => setLocalModels(prev => ({ ...prev, visionProvider: 'gemini' }))}
                                    className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${localModels.visionProvider === 'gemini'
                                        ? 'bg-emerald-600 text-white shadow-lg'
                                        : darkMode
                                            ? 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                        }`}
                                >
                                    Gemini (Google)
                                </button>
                            </div>
                            <p className={`text-[10px] mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                Select which AI provider to use for analyzing betting screenshots.
                            </p>
                        </div>

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
                        className={`w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${saved
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/20'
                            }`}
                    >
                        {saved ? <CheckCircle size={18} /> : <Save size={18} />}
                        {saved ? 'Saved!' : 'Save & Close'}
                    </button>

                    <p className={`text-xs text-center mt-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Leave API keys empty to run in Simulation Mode (demo data).
                    </p>
                </div>
            </div>
        </div >
    );
};

export default SettingsModal;
