import React, { memo, useState } from "react";
import { Maximize2 } from "lucide-react";
import { MathBlock } from "../katex-engine";
import FormulaZoomModal from "./FormulaZoomModal";

/**
 * Renders the "Worked Example" section for a formula.
 */
const ExamplePanel = memo(function ExamplePanel({ item, mix, accentCss }) {
    const [zoomOpen, setZoomOpen] = useState(false);

    if (!item.exampleTitle) return null;

    // Build a virtual item for the zoom modal using example data
    const exampleZoomItem = {
        id: `${item.id}-example`,
        title: `${item.title} — Worked Example`,
        latex: item.exampleLatex,
        explanation: item.exampleInterpretation || item.exampleContext || "",
    };

    return (
        <div
            className="mt-6 overflow-hidden rounded-2xl border transition-all duration-300"
            style={{
                background: mix(accentCss, 4, "var(--lab-bg)"),
                borderColor: mix(accentCss, 15, "transparent"),
            }}
        >
            <div className="px-5 py-4 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h4
                        className="text-[10px] font-black uppercase tracking-[0.2em]"
                        style={{ color: mix(accentCss, 70, "var(--lab-fg)") }}
                    >
                        {item.exampleTitle}
                    </h4>
                    <span
                        className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border"
                        style={{
                            borderColor: mix(accentCss, 30, "transparent"),
                            color: mix(accentCss, 60, "var(--lab-fg)"),
                            background: mix(accentCss, 8, "var(--lab-bg)")
                        }}
                    >
                        Worked Example
                    </span>
                </div>

                {/* Context */}
                <p className="text-[12px] leading-relaxed italic opacity-80 decoration-dotted underline decoration-1 underline-offset-4">
                    {item.exampleContext}
                </p>

                {/* Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {item.exampleInputs.map((input, idx) => (
                        <div
                            key={idx}
                            className="flex flex-col p-3 rounded-xl border"
                            style={{
                                borderColor: "var(--lab-line, rgba(128,128,128,0.1))",
                                background: "var(--lab-panel, rgba(15,23,42,0.6))",
                            }}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">
                                    {input.name}
                                </span>
                                <span
                                    className="text-[11px] font-mono font-bold"
                                    style={{ color: mix(accentCss, 85, "var(--lab-fg)") }}
                                >
                                    {input.value}
                                </span>
                            </div>
                            {input.note && (
                                <span className="mt-1 text-[9px] italic opacity-40">
                                    {input.note}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Math Block — clickable for zoom */}
                <div
                    className="formula-clickable group/math relative cursor-pointer py-2"
                    onClick={() => setZoomOpen(true)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Zoom into example formula`}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setZoomOpen(true); } }}
                >
                    <MathBlock latex={item.exampleLatex} id={`${item.id}-ex`} />
                    <div className="formula-zoom-hint">
                        <Maximize2 className="h-3.5 w-3.5" />
                        <span>Zoom</span>
                    </div>
                </div>

                {/* Steps */}
                <div className="space-y-2.5">
                    {item.exampleSteps.map((step, idx) => (
                        <div key={idx} className="flex gap-3 text-[12px] leading-relaxed">
                            <span
                                className="shrink-0 font-black"
                                style={{ color: mix(accentCss, 50, "var(--lab-fg)") }}
                            >
                                {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="opacity-90">{step}</span>
                        </div>
                    ))}
                </div>

                {/* Interpretation */}
                <div
                    className="p-4 rounded-xl border-l-4"
                    style={{
                        background: mix(accentCss, 8, "var(--lab-bg)"),
                        borderColor: mix(accentCss, 60, "transparent")
                    }}
                >
                    <div className="flex items-start gap-3">
                        <span className="text-lg opacity-60 mt-[-2px]">💡</span>
                        <p className="text-[12px] leading-relaxed font-medium">
                            <span className="font-black uppercase tracking-wider text-[10px] mr-2">Result:</span>
                            {item.exampleInterpretation}
                        </p>
                    </div>
                </div>

                {/* Warnings */}
                {item.exampleWarnings && item.exampleWarnings.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-3">
                        {item.exampleWarnings.map((warning, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 opacity-50">
                                <span className="text-[10px]">⚠️</span>
                                <span className="text-[9px] font-medium tracking-tight">
                                    {warning}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Zoom Modal for example formula */}
            {zoomOpen && (
                <FormulaZoomModal
                    item={exampleZoomItem}
                    accentCss={accentCss}
                    mix={mix}
                    onClose={() => setZoomOpen(false)}
                />
            )}
        </div>
    );
});

export default ExamplePanel;
