import React from 'react';
import { Upload, Eye, CloudLightning, Image, ScanLine } from 'lucide-react';

const MatchUploadZone = ({
    isScanning,
    onFileUpload,
    dragActiveState,
    darkMode = true,
    onSetActiveUploadTarget
}) => {
    const isDragActive = dragActiveState === 'MAIN';

    return (
        <div
            className={`relative group overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ${
                isDragActive
                    ? darkMode
                        ? 'border-cyan-500 bg-cyan-500/10 scale-[1.01]'
                        : 'border-amber-400 bg-amber-400/5 scale-[1.01]'
                    : darkMode
                        ? 'border-slate-700/60 bg-black/20 hover:border-cyan-500/30 hover:bg-cyan-500/5'
                        : 'border-slate-300 bg-white hover:border-amber-300 hover:bg-amber-50/50 shadow-sm'
            }`}
            onMouseEnter={() => onSetActiveUploadTarget?.('MAIN')}
            onClick={() => onSetActiveUploadTarget?.('MAIN')}
            onDragEnter={() => onSetActiveUploadTarget?.('MAIN')}
        >
            <input
                type="file"
                multiple
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                onChange={onFileUpload}
                disabled={isScanning}
            />

            <div className="p-10 flex flex-col items-center justify-center text-center relative z-10 pointer-events-none min-h-[260px]">
                {/* Icon Container */}
                <div className={`mb-6 p-6 rounded-3xl border transition-all duration-500 group-hover:scale-105 ${
                    isScanning
                        ? darkMode
                            ? 'bg-cyan-500/10 border-cyan-500/20 animate-pulse'
                            : 'bg-amber-50 border-amber-200 animate-pulse'
                        : darkMode
                            ? 'bg-slate-900/60 border-slate-700/50 group-hover:border-cyan-500/30'
                            : 'bg-slate-50 border-slate-200 group-hover:border-amber-300'
                }`}>
                    {isScanning ? (
                        <div className="relative">
                            <ScanLine size={40} className={darkMode ? 'text-cyan-400 animate-pulse' : 'text-amber-600 animate-pulse'} />
                        </div>
                    ) : (
                        <Upload size={36} className={`transition-colors ${
                            darkMode
                                ? 'text-slate-500 group-hover:text-cyan-400'
                                : 'text-slate-400 group-hover:text-amber-600'
                        }`} />
                    )}
                </div>

                {/* Text Content */}
                <h2 className="text-xl font-black mb-2 tracking-tight text-primary">
                    {isScanning ? 'Analyzing Intelligence...' : 'Drop Betting Screenshots'}
                </h2>

                <p className="max-w-md text-sm leading-relaxed mb-6 text-secondary">
                    Upload market odds, lineups, or stats.
                    The <span className={`font-bold ${darkMode ? 'text-cyan-400' : 'text-amber-600'}`}>Vision Agent</span> will automatically extract and structure the data.
                </p>

                {/* Badges */}
                <div className="flex gap-3">
                    <span className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
                        darkMode
                            ? 'bg-slate-900/60 border-slate-700/50 text-slate-400'
                            : 'bg-white border-slate-200 text-slate-500 shadow-sm'
                    }`}>
                        <Image size={12} className={darkMode ? 'text-emerald-400' : 'text-emerald-500'} />
                        JPG / PNG
                    </span>
                    <span className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
                        darkMode
                            ? 'bg-slate-900/60 border-slate-700/50 text-slate-400'
                            : 'bg-white border-slate-200 text-slate-500 shadow-sm'
                    }`}>
                        <CloudLightning size={12} className={darkMode ? 'text-cyan-400' : 'text-amber-500'} />
                        Auto-OCR
                    </span>
                </div>
            </div>

            {/* Background Glow Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] blur-[100px] rounded-full ${
                    darkMode ? 'bg-cyan-500/5' : 'bg-amber-300/10'
                }`} />
            </div>
        </div>
    );
};

export default MatchUploadZone;
