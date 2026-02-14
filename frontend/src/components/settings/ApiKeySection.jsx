import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

export const TestConnectionButton = ({ provider, apiKey, model, darkMode }) => {
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
                // const errText = await res.text();
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

export function ApiKeySection({ apiProviders, localKeys, setLocalKeys, localModels, darkMode, inputBg, labelColor }) {
    return (
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
                        className={`w-full border rounded-xl p-3 text-xs font-mono tracking-wide transition outline-none ${inputBg}`}
                        placeholder={provider.placeholder}
                        autoComplete="off"
                    />
                </div>
            ))}
        </div>
    );
}
