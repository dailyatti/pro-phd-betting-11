import React, { memo } from "react";
import { InlineMath } from "react-katex";

const GLOSSARY = [
    { symbol: "\\pi_k", def: "Normalized market implied probability" },
    { symbol: "\\theta^*", def: "Calibrated model parameters (posterior)" },
    { symbol: "s^*", def: "Optimal stake vector (fraction of bankroll)" },
    { symbol: "\\Delta", def: "Edge/Alpha (Model Probability - Market Implied)" },
    { symbol: "\\eta", def: "Friction coefficient (Tax + Slippage + Spread)" },
    { symbol: "\\lambda", def: "Risk aversion / Tail-penalty multiplier" },
    { symbol: "\\Phi(\\cdot)", def: "Standard Normal Cumulative Distribution Function" },
    { symbol: "V(s)", def: "Value function (residual win probability)" },
];

const GlossaryTab = memo(function GlossaryTab() {
    return (
        <div className="space-y-12 animate-in fade-in duration-500" id="phd-panels-panel-glossary">
            <div className="max-w-3xl mx-auto text-center space-y-4">
                <h2 className="text-3xl font-black uppercase tracking-tight">Mathematical Glossary</h2>
                <p className="text-sm opacity-60">Standard notation for doctoral-grade sports modeling and risk optimization.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
                {GLOSSARY.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-6 p-6 rounded-2xl border transition-all group" style={{ borderColor: "var(--lab-line)", background: "var(--lab-panel)" }}>
                        <div className="text-2xl min-w-[60px] flex justify-center py-2 rounded-xl transition-colors" style={{ background: "var(--lab-panel2)" }}>
                            <InlineMath math={item.symbol} />
                        </div>
                        <div className="text-sm font-bold opacity-80 leading-snug">
                            {item.def}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default GlossaryTab;
