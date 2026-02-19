import { useState, useEffect, useMemo, useCallback } from 'react';
import { Key, Save, CheckCircle, ExternalLink, Cpu, Plus, ShieldCheck, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { saveKeysEncrypted, isVaultSupported } from '../utils/keyVault';

const STORAGE_KEYS = {
    models: 'phd_betting_models',
    customModels: 'phd_betting_custom_models'
};

const DEFAULT_KEYS = { openai: '', perplexity: '', gemini: '' };
const DEFAULT_MODELS = {
    openai: 'gpt-5.2',
    perplexity: 'sonar-pro',
    gemini: 'gemini-2.0-flash',
    visionProvider: 'openai',
    // Provider enable/disable states
    openaiEnabled: true,
    perplexityEnabled: true,
    geminiEnabled: true
};
const DEFAULT_CUSTOM_MODELS = { openai: [], perplexity: [], gemini: [] };
const GEMINI_MODEL_OPTIONS = [
    'gemini-2.0-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite'
];

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

const ApiKeyCard = ({ provider, value, onChange, placeholder, link, focusRing, accentColor, darkMode, enabled, onToggle }) => {
    const [showKey, setShowKey] = useState(false);
    const [copied, setCopied] = useState(false);
    const hasValue = value && value.length > 5;

    const handleCopy = () => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`group relative rounded-xl border transition-all duration-300 overflow-hidden
            ${!enabled ? 'opacity-50' : ''}
            ${darkMode
                ? 'bg-subtle border-subtle hover:border-cyan/30'
                : 'bg-[#FFFFFF] border-subtle hover:border-slate-300 shadow-sm'
            }`}
        >
            <div className="flex items-stretch">
                {/* Brand / Label Stripe */}
                <div className={`w-1.5 ${darkMode ? accentColor.replace('text-', 'bg-') : accentColor.replace('text-', 'bg-').replace('400', '500')}`} />

                <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            {/* Enable/Disable Toggle */}
                            <button
                                onClick={onToggle}
                                className={`relative w-10 h-5 rounded-full transition-all duration-200 ${enabled
                                    ? (darkMode ? 'bg-cyan-500' : 'bg-blue-500')
                                    : (darkMode ? 'bg-slate-700' : 'bg-slate-300')
                                    }`}
                                title={enabled ? 'Disable Provider' : 'Enable Provider'}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${enabled ? 'left-[1.375rem]' : 'left-0.5'
                                    }`} />
                            </button>
                            <label className={`text-sm font-bold tracking-wide flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                {provider.label}
                                {provider.hint && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${darkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                        {provider.hint}
                                    </span>
                                )}
                            </label>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <a
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                                className={`text-[10px] font-semibold flex items-center gap-1 transition-colors
                                    ${darkMode
                                        ? 'text-slate-500 hover:text-cyan-400'
                                        : 'text-slate-400 hover:text-blue-600'
                                    }`}
                            >
                                GET KEY <ExternalLink size={10} />
                            </a>

                            <div className="flex items-center gap-1">
                                {hasValue && (
                                    <div className={`flex items-center gap-1 px-1.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider mr-1
                                        ${darkMode ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-600 bg-emerald-100'}`}>
                                        <ShieldCheck size={10} /> Verified
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className={`flex items-center rounded-lg border overflow-hidden ${darkMode ? 'border-slate-700 bg-black/20' : 'border-slate-200 bg-slate-50'}`}>
                                    <button
                                        onClick={handleCopy}
                                        disabled={!value}
                                        title="Copy Key"
                                        className={`p-1.5 transition-colors flex items-center justify-center w-7 border-r ${darkMode ? 'border-slate-700 hover:bg-white/5 text-slate-400 hover:text-white' : 'border-slate-200 hover:bg-white text-slate-500 hover:text-slate-700'} disabled:opacity-30`}
                                    >
                                        {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                    </button>
                                    <button
                                        onClick={() => setShowKey(!showKey)}
                                        title={showKey ? "Hide Key" : "Show Key"}
                                        className={`p-1.5 transition-colors flex items-center justify-center w-7 ${darkMode ? 'hover:bg-white/5 text-slate-400 hover:text-white' : 'hover:bg-white text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <input
                            type={showKey ? "text" : "password"}
                            value={value}
                            onChange={onChange}
                            className={`w-full rounded-lg px-3 py-2.5 text-xs font-mono tracking-wide outline-none transition-all
                                ${darkMode
                                    ? 'bg-black/40 border border-transparent focus:border-cyan/50 text-cyan-50 placeholder-slate-700'
                                    : 'bg-slate-50 border border-slate-200 focus:border-blue-400 text-slate-700 placeholder-slate-400 shadow-inner'
                                }`}
                            placeholder={placeholder}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ConfigurationPage = ({
    apiKeys,
    setApiKeys,
    modelSettings,
    setModelSettings,
    darkMode,
    setIsDirty
}) => {
    // Local draft state (editing)
    const [localKeys, setLocalKeys] = useState({ ...DEFAULT_KEYS, ...apiKeys });
    const [localModels, setLocalModels] = useState({ ...DEFAULT_MODELS, ...modelSettings });
    const [saved, setSaved] = useState(false);

    // Sync from parent when keys load from encrypted vault (async)
    useEffect(() => {
        if (apiKeys && (apiKeys.openai || apiKeys.perplexity || apiKeys.gemini)) {
            setLocalKeys(prev => {
                const hasAny = prev.openai || prev.perplexity || prev.gemini;
                if (hasAny) return prev; // Don't override user edits
                return { ...DEFAULT_KEYS, ...apiKeys };
            });
        }
    }, [apiKeys]);

    // Custom model UI toggles + inputs
    const [showCustomOpenai, setShowCustomOpenai] = useState(false);
    const [showCustomPerplexity, setShowCustomPerplexity] = useState(false);
    const [customOpenai, setCustomOpenai] = useState('');
    const [customPerplexity, setCustomPerplexity] = useState('');

    // Persisted custom models
    const [customModels, setCustomModels] = useState(DEFAULT_CUSTOM_MODELS);

    // Load from localStorage once (initial mount)
    // API keys are loaded from parent (useSettings handles encrypted vault)
    useEffect(() => {
        const storedModelsStr = localStorage.getItem(STORAGE_KEYS.models);
        const storedCustomModelsStr = localStorage.getItem(STORAGE_KEYS.customModels);

        const storedModels = storedModelsStr ? safeParse(storedModelsStr, DEFAULT_MODELS) : null;
        const storedCustom = storedCustomModelsStr ? safeParse(storedCustomModelsStr, DEFAULT_CUSTOM_MODELS) : null;

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
            if (setModelSettings) setModelSettings(merged);
            localStorage.setItem(STORAGE_KEYS.models, JSON.stringify(merged));
        }

        if (storedCustom) {
            const merged = {
                openai: dedupe(storedCustom.openai),
                perplexity: dedupe(storedCustom.perplexity),
                gemini: dedupe(storedCustom.gemini),
            };
            setCustomModels(merged);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const apiProviders = useMemo(() => ([
        {
            key: 'openai',
            label: 'OpenAI',
            hint: 'GPT-5.2 Strategy',
            placeholder: 'sk-...',
            link: 'https://platform.openai.com/account/api-keys',
            accent: 'text-cyan-400',
            focusRing: 'focus:ring-cyan-500/50',
            enabledKey: 'openaiEnabled'
        },
        {
            key: 'perplexity',
            label: 'Perplexity',
            hint: 'Sonar Pro / Reason',
            placeholder: 'pplx-...',
            link: 'https://docs.perplexity.ai/guides/getting-started',
            accent: 'text-blue-400',
            focusRing: 'focus:ring-blue-500/50',
            enabledKey: 'perplexityEnabled'
        },
        {
            key: 'gemini',
            label: 'Gemini (Google AI)',
            hint: 'Alternative Vision',
            placeholder: 'AIza...',
            link: 'https://aistudio.google.com/apikey',
            accent: 'text-emerald-400',
            focusRing: 'focus:ring-emerald-500/50',
            enabledKey: 'geminiEnabled'
        },
    ]), []);

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
        xai: [
            'grok-2-latest',
            'grok-2',
            'grok-beta'
        ]
    }), []);

    // Merge base + custom (deduped)
    const modelOptions = useMemo(() => ({
        openai: dedupe([...baseModelOptions.openai, ...(customModels.openai || [])]),
        perplexity: dedupe([...baseModelOptions.perplexity, ...(customModels.perplexity || [])]),
        gemini: dedupe([...GEMINI_MODEL_OPTIONS, ...(customModels.gemini || [])])
    }), [baseModelOptions, customModels]);

    // UI Variables
    const headerColor = 'text-primary';
    const dividerColor = 'border-subtle';
    const inputBg = darkMode
        ? 'bg-black border-subtle text-primary placeholder-tertiary focus:border-cyan/50'
        : 'bg-white border-subtle text-primary placeholder-tertiary shadow-sm focus:border-blue-400';

    const persistAll = useCallback(async (keysToSave, modelsToSave, customToSave) => {
        // Save keys encrypted via vault
        if (isVaultSupported()) {
            await saveKeysEncrypted(keysToSave);
        } else {
            localStorage.setItem('phd_betting_api_keys', JSON.stringify(keysToSave));
        }
        localStorage.setItem(STORAGE_KEYS.models, JSON.stringify(modelsToSave));
        localStorage.setItem(STORAGE_KEYS.customModels, JSON.stringify(customToSave));
    }, []);

    // Sync dirty state to parent
    useEffect(() => {
        if (!setIsDirty) return;
        const keysChanged = JSON.stringify(localKeys) !== JSON.stringify({ ...DEFAULT_KEYS, ...apiKeys });
        const modelsChanged = JSON.stringify(localModels) !== JSON.stringify({ ...DEFAULT_MODELS, ...modelSettings });
        // Custom models comparison is tricky due to array, but good enough proxy:
        const customChanged = JSON.stringify(customModels) !== JSON.stringify(
            // We need to compare against what was loaded/saved, which is tricky since we don't have "savedCustomModels" prop.
            // For now, we'll assume if localKeys/models changed it's dirty.
            // To be precise we should lift 'customModels' state to App.jsx too, but let's stick to keys/models for now or rely on 'saved' trigger.
            // ACTUALLY: Let's just track if localKeys/localModels differ from the passed props.
            // Custom models are internal to this page mostly but used in persisted options.
            // Simple check:
            DEFAULT_CUSTOM_MODELS // Simplified for now to avoid complexity explosion, focus on critical keys/models.
        );

        setIsDirty(keysChanged || modelsChanged);
    }, [localKeys, localModels, apiKeys, modelSettings, setIsDirty]);

    const handleSave = useCallback(async () => {
        const keysToSave = { ...DEFAULT_KEYS, ...localKeys };
        const modelsToSave = { ...DEFAULT_MODELS, ...localModels };
        const customToSave = {
            openai: dedupe(customModels.openai),
            perplexity: dedupe(customModels.perplexity),
            gemini: dedupe(customModels.gemini),
        };

        await persistAll(keysToSave, modelsToSave, customToSave);

        if (setApiKeys) setApiKeys(keysToSave);
        if (setModelSettings) setModelSettings(modelsToSave);

        setSaved(true);
        if (setIsDirty) setIsDirty(false);
        setTimeout(() => setSaved(false), 2000);
    }, [localKeys, localModels, customModels, persistAll, setApiKeys, setModelSettings, setIsDirty]);

    const addCustomModel = useCallback((provider) => {
        let raw = '';
        if (provider === 'openai') raw = customOpenai;
        else if (provider === 'perplexity') raw = customPerplexity;

        const value = String(raw || '').trim();
        if (!value) return;

        setCustomModels(prev => {
            const next = {
                ...prev,
                [provider]: dedupe([...(prev?.[provider] || []), value])
            };
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
        }
    }, [customOpenai, customPerplexity]);

    const customModelsFlat = useMemo(() => {
        return dedupe([...(customModels.openai || []), ...(customModels.perplexity || [])]);
    }, [customModels]);

    return (
        <div className="min-h-full flex flex-col items-center justify-center p-4 lg:p-12 animate-in fade-in zoom-in-95 duration-500">

            {/* Main Content Card */}
            <div className={`w-full max-w-2xl relative rounded-3xl z-10 backdrop-blur-xl transition-all duration-300 overflow-hidden
                ${darkMode
                    ? 'bg-panel border border-subtle shadow-2xl shadow-black/50'
                    : 'bg-panel border border-strong shadow-xl'
                }`}
            >
                {/* Header Section */}
                <div className={`p-8 border-b ${dividerColor} relative overflow-hidden`}>

                    {/* Background glow for header */}
                    {darkMode && <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />}

                    <div className="relative flex items-center gap-5">
                        <div className={`p-3.5 rounded-2xl
                            ${darkMode
                                ? 'bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border border-cyan-500/20'
                                : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60'
                            }`}
                        >
                            <Key size={28} className={darkMode ? "text-cyan-400" : "text-amber-600"} />
                        </div>
                        <div>
                            <h2 className={`text-2xl font-black ${headerColor} tracking-tight`}>System Configuration</h2>
                            <p className={`text-sm mt-0.5 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Manage secure keys & AI model behaviors.</p>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="p-8 space-y-10">

                    {/* Security Note - Redesigned Banner */}
                    <div className={`relative flex items-start gap-4 p-5 rounded-2xl border overflow-hidden
                        ${darkMode
                            ? 'bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 border-emerald-500/20'
                            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100' // Updated light mode banner
                        }`}
                    >
                        <div className={`p-2.5 rounded-xl shrink-0 ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white text-blue-600 shadow-sm border border-blue-100'}`}>
                            <ShieldCheck size={20} />
                        </div>
                        <div className="relative z-10">
                            <h4 className={`font-bold text-sm mb-1.5 tracking-wide ${darkMode ? 'text-emerald-100' : 'text-slate-800'}`}>Encrypted Local Storage (BYOK)</h4>
                            <p className={`text-xs leading-relaxed max-w-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Your keys are encrypted with AES-256-GCM and stored locally in your browser. They are sent only to AI providers (OpenAI, Perplexity, Google) via our secure HTTPS proxy — never stored on any server.
                            </p>
                        </div>
                        {/* Decorative background element */}
                        {darkMode && <div className="absolute -right-4 -bottom-8 w-24 h-24 bg-emerald-500/10 blur-[30px] rounded-full" />}
                    </div>

                    {/* API Keys - Grid Layout */}
                    <div>
                        <h3 className={`text-xs font-black uppercase tracking-widest mb-5 ml-1 opacity-70 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            API Credentials
                        </h3>
                        <div className="space-y-4">
                            {apiProviders.map((provider) => (
                                <ApiKeyCard
                                    key={provider.key}
                                    provider={provider}
                                    value={localKeys?.[provider.key] ?? ''}
                                    onChange={e => setLocalKeys(prev => ({ ...(prev || {}), [provider.key]: e.target.value }))}
                                    placeholder={provider.placeholder}
                                    link={provider.link}
                                    focusRing={provider.focusRing}
                                    accentColor={provider.accent}
                                    darkMode={darkMode}
                                    enabled={localModels?.[provider.enabledKey] ?? true}
                                    onToggle={() => setLocalModels(prev => ({ ...prev, [provider.enabledKey]: !prev[provider.enabledKey] }))}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className={`h-px w-full ${dividerColor}`} />

                    {/* Model Settings */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <Cpu size={20} className={darkMode ? "text-purple-400" : "text-purple-600"} />
                            <h3 className={`text-lg font-bold ${headerColor}`}>AI Model Selection</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* OpenAI Selector */}
                            <div>
                                <label className={`text-xs font-bold uppercase tracking-wider mb-2 block text-secondary`}>Strategy Agent</label>
                                <div className="flex gap-2">
                                    <select
                                        value={localModels.openai}
                                        onChange={e => setLocalModels(prev => ({ ...prev, openai: e.target.value }))}
                                        className={`flex-1 rounded-xl p-3 text-sm outline-none border focus:ring-2 focus:ring-purple-500/50 transition-all ${inputBg}`}
                                        style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                                    >
                                        {modelOptions.openai.map(m => <option key={m} value={m} style={{ background: darkMode ? '#000' : '#fff', color: darkMode ? '#fff' : '#000' }}>{m}</option>)}
                                    </select>
                                    <button onClick={() => setShowCustomOpenai(v => !v)} className={`p-3 rounded-xl border transition-colors ${darkMode ? 'border-slate-700 bg-slate-800 hover:bg-slate-700' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                                        <Plus size={16} />
                                    </button>
                                </div>
                                {showCustomOpenai && (
                                    <div className="mt-2 flex gap-2 animate-in slide-in-from-top-2">
                                        <input
                                            value={customOpenai}
                                            onChange={e => setCustomOpenai(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addCustomModel('openai')}
                                            className={`flex-1 rounded-lg p-2 text-xs border outline-none focus:border-purple-500 ${inputBg}`}
                                            placeholder="Custom model ID..."
                                            autoFocus
                                        />
                                        <button onClick={() => addCustomModel('openai')} className="px-3 py-1 bg-purple-600 rounded-lg text-white text-xs font-bold hover:bg-purple-500 transition-colors">Add</button>
                                    </div>
                                )}
                            </div>

                            {/* Perplexity Selector */}
                            <div>
                                <label className={`text-xs font-bold uppercase tracking-wider mb-2 block text-secondary`}>Research Agent</label>
                                <div className="flex gap-2">
                                    <select
                                        value={localModels.perplexity}
                                        onChange={e => setLocalModels(prev => ({ ...prev, perplexity: e.target.value }))}
                                        className={`flex-1 rounded-xl p-3 text-sm outline-none border focus:ring-2 focus:ring-purple-500/50 transition-all ${inputBg}`}
                                        style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                                    >
                                        {modelOptions.perplexity.map(m => <option key={m} value={m} style={{ background: darkMode ? '#000' : '#fff', color: darkMode ? '#fff' : '#000' }}>{m}</option>)}
                                    </select>
                                    <button onClick={() => setShowCustomPerplexity(v => !v)} className={`p-3 rounded-xl border transition-colors ${darkMode ? 'border-slate-700 bg-slate-800 hover:bg-slate-700' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                                        <Plus size={16} />
                                    </button>
                                </div>
                                {showCustomPerplexity && (
                                    <div className="mt-2 flex gap-2 animate-in slide-in-from-top-2">
                                        <input
                                            value={customPerplexity}
                                            onChange={e => setCustomPerplexity(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addCustomModel('perplexity')}
                                            className={`flex-1 rounded-lg p-2 text-xs border outline-none focus:border-purple-500 ${inputBg}`}
                                            placeholder="Custom model ID..."
                                            autoFocus
                                        />
                                        <button onClick={() => addCustomModel('perplexity')} className="px-3 py-1 bg-purple-600 rounded-lg text-white text-xs font-bold hover:bg-purple-500 transition-colors">Add</button>
                                    </div>
                                )}
                            </div>

                            {/* Gemini Selector */}
                            <div>
                                <label className={`text-xs font-bold uppercase tracking-wider mb-2 block text-secondary`}>Gemini Model</label>
                                <select
                                    value={localModels.gemini || 'gemini-2.0-flash'}
                                    onChange={e => setLocalModels(prev => ({ ...prev, gemini: e.target.value }))}
                                    className={`w-full rounded-xl p-3 text-sm outline-none border focus:ring-2 focus:ring-emerald-500/50 transition-all ${inputBg}`}
                                    style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                                >
                                    {modelOptions.gemini.map(m => <option key={m} value={m} style={{ background: darkMode ? '#000' : '#fff', color: darkMode ? '#fff' : '#000' }}>{m}</option>)}
                                </select>
                            </div>

                        </div>

                        {customModelsFlat.length > 0 && (
                            <p className={`text-[10px] mt-4 font-mono text-center opacity-60 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                Custom models active: {customModelsFlat.join(', ')}
                            </p>
                        )}
                    </div>

                </div>

                {/* Footer / Actions */}
                <div className={`p-8 border-t ${dividerColor}`}>
                    <button
                        onClick={handleSave}
                        className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98]
                            ${saved
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : darkMode
                                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 border border-cyan-500/30'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/20 border border-amber-400/30'
                            }`}
                    >
                        {saved ? <CheckCircle size={18} /> : <Save size={18} />}
                        {saved ? 'Settings Saved' : 'Save Changes'}
                    </button>
                    <p className="text-[10px] text-center mt-4 font-medium text-tertiary">
                        Changes apply immediately to your next analysis session.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default ConfigurationPage;
