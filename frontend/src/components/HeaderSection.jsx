import React from 'react';
import PropTypes from 'prop-types';
import { BrainCircuit, Zap } from 'lucide-react';

/**
 * HeaderSection — Dashboard hero banner with system status indicator.
 */
const HeaderSection = ({ darkMode }) => {
    return (
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3.5">
                <div className={`p-2.5 rounded-xl transition-colors ${darkMode
                    ? 'bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border border-cyan-500/20'
                    : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60'
                }`}>
                    <BrainCircuit size={24} className={darkMode ? 'text-cyan-400' : 'text-amber-600'} />
                </div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-primary flex items-center gap-2.5">
                        Active Intelligence
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${darkMode
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}>
                            <Zap size={9} fill="currentColor" />
                            Online
                        </span>
                    </h2>
                    <p className="text-xs text-secondary mt-0.5 max-w-lg leading-relaxed hidden sm:block">
                        Upload betting slips or paste market data. The multi-agent system extracts odds, verifies facts via live research, and formulates PhD-level strategies.
                    </p>
                </div>
            </div>
        </div>
    );
};

HeaderSection.propTypes = {
    darkMode: PropTypes.bool.isRequired,
};

export default HeaderSection;
