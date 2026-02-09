import React from 'react';
import { Upload, Eye, CloudLightning } from 'lucide-react';

const MatchUploadZone = ({
    isScanning,
    onFileUpload,
    dragActiveState,
    darkMode = true,
    onSetActiveUploadTarget
}) => {
    return (
        <div
            className={`relative group drop-zone overflow-hidden
            ${dragActiveState === 'MAIN' ? 'border-cyan-500 bg-cyan-500/10' : ''}`}
            onMouseEnter={() => onSetActiveUploadTarget && onSetActiveUploadTarget('MAIN')}
            onClick={() => onSetActiveUploadTarget && onSetActiveUploadTarget('MAIN')}
            onDragEnter={() => onSetActiveUploadTarget && onSetActiveUploadTarget('MAIN')}
        >
            <input
                type="file"
                multiple
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                onChange={onFileUpload}
                disabled={isScanning}
            />

            <div className="p-10 flex flex-col items-center justify-center text-center relative z-10 pointer-events-none min-h-[280px]">
                {/* Animated Icon Container */}
                <div className={`mb-6 drop-zone-icon group-hover:scale-110 transition-transform duration-500 ${isScanning ? 'animate-pulse bg-cyan-500/10' : ''}`}>
                    {isScanning ? (
                        <div className="relative">
                            <Eye className={darkMode ? 'text-cyan-400 animate-pulse' : 'text-amber-600 animate-pulse'} size={48} />
                            <div className={`absolute inset-0 blur-xl animate-pulse ${darkMode ? 'bg-cyan-400/20' : 'bg-amber-400/20'}`} />
                        </div>
                    ) : (
                        <Upload className={darkMode ? 'text-cyan-500 group-hover:text-cyan-400' : 'text-amber-500 group-hover:text-amber-600'} size={40} />
                    )}
                </div>

                {/* Text Content */}
                <h2 className={`text-2xl font-black mb-2 tracking-tight text-primary`}>
                    {isScanning ? 'Analyzing Intelligence...' : 'Drop Betting Screenshots'}
                </h2>

                <p className={`max-w-md text-sm leading-relaxed mb-6 text-secondary`}>
                    Upload market odds, lineups, or stats. Our <span className={`font-bold text-cyan`}>Vision Agent</span> will automatically extract and structure the data.
                </p>

                {/* Badges */}
                <div className={`flex gap-4 text-[10px] font-mono uppercase tracking-wider text-tertiary`}>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-subtle border border-subtle`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                        JPG/PNG
                    </span>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-subtle border border-subtle`}>
                        <CloudLightning size={10} className={'text-cyan'} />
                        Auto-OCR
                    </span>
                </div>
            </div>

            {/* Background Glow Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] blur-[100px] rounded-full
                    ${darkMode ? 'bg-cyan-500/5' : 'bg-amber-300/10'}`} />
            </div>
        </div>
    );
};

export default MatchUploadZone;
