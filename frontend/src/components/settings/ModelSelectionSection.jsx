import { Plus } from 'lucide-react';

export function ModelSelectionSection({
    localModels,
    setLocalModels,
    modelOptions,
    darkMode,
    inputBg,
    labelColor,
    buttonSecondary,
    setShowCustomOpenai,
    setShowCustomPerplexity,
    setShowCustomGemini,
    addCustomModel,
    customOpenai,
    setCustomOpenai,
    customPerplexity,
    setCustomPerplexity,
    customGemini,
    setCustomGemini,
    showCustomOpenai,
    showCustomPerplexity,
    showCustomGemini
}) {
    return (
        <div className="space-y-4">
            {/* OpenAI Model */}
            <div className="mb-4">
                <label className={`text-xs font-medium block mb-1.5 ${labelColor}`}>OpenAI Model</label>
                <div className="flex gap-2">
                    <select
                        value={localModels.openai}
                        onChange={e => setLocalModels(prev => ({ ...prev, openai: e.target.value }))}
                        className={`flex-1 border rounded-xl p-3 text-sm transition outline-none focus:ring-2 focus:ring-cyan-500/50 ${inputBg}`}
                        style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                    >
                        {modelOptions.openai.map(m => (
                            <option key={m} value={m} style={{ background: darkMode ? '#1e293b' : '#fff', color: darkMode ? '#fff' : '#000' }}>{m}</option>
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
                        className={`flex-1 border rounded-xl p-3 text-sm transition outline-none focus:ring-2 focus:ring-blue-500/50 ${inputBg}`}
                        style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                    >
                        {modelOptions.perplexity.map(m => (
                            <option key={m} value={m} style={{ background: darkMode ? '#1e293b' : '#fff', color: darkMode ? '#fff' : '#000' }}>{m}</option>
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
                        className={`flex-1 border rounded-xl p-3 text-sm transition outline-none focus:ring-2 focus:ring-emerald-500/50 ${inputBg}`}
                        style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                    >
                        {modelOptions.gemini.map(m => (
                            <option key={m} value={m} style={{ background: darkMode ? '#1e293b' : '#fff', color: darkMode ? '#fff' : '#000' }}>{m}</option>
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

            {/* Vision Provider Toggle */}
            <div className={`p-4 rounded-2xl border mb-4 ${darkMode ? 'bg-black/20 border-subtle' : 'bg-slate-50 border-subtle'}`}>
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
        </div>
    );
}
