import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("[ErrorBoundary] Caught exception:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className={`min-h-screen flex items-center justify-center p-6 ${this.props.darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
                    <div className={`max-w-md w-full p-8 rounded-3xl border shadow-2xl ${this.props.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="p-4 rounded-full bg-rose-500/10 text-rose-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            </div>
                            <h1 className="text-2xl font-black tracking-tight">System Fault Detected</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                The PhD Betting engine encountered a critical rendering error. Your configuration and history remain safely stored.
                            </p>
                            <div className="w-full p-4 rounded-xl bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5 font-mono text-[10px] text-left overflow-auto max-h-32">
                                {this.state.error?.toString()}
                            </div>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-lg shadow-cyan-500/20"
                            >
                                Restart Application
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
