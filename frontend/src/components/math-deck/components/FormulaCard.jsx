import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { Copy, Check, ChevronDown, ChevronUp, FlaskConical, Lightbulb, Maximize2 } from "lucide-react";
import clsx from "clsx";
import { useInViewOnce } from "../hooks";
import { copyToClipboard, stripDisplayDelims, isBrowser } from "../utils";
import { MathBlock, MathText } from "../katex-engine";
import ExamplePanel from "./ExamplePanel";
import FormulaZoomModal from "./FormulaZoomModal";
import { SPORT_META, TAG_LABELS } from "../data";

/**
 * Renders an individual mathematical formula card.
 * Includes copy LaTeX, collapse/expand, and lazy-loading.
 */
const FormulaCard = memo(function FormulaCard({ item, mix }) {
    const { ref, inView } = useInViewOnce("420px");
    const [collapsed, setCollapsed] = useState(false);
    const [copied, setCopied] = useState(false);
    const [derivOpen, setDerivOpen] = useState(false);
    const [zoomOpen, setZoomOpen] = useState(false);
    // Which formula to zoom: null = main, "deriv" = derivation
    const [zoomTarget, setZoomTarget] = useState(null);

    const openZoom = (target = null) => {
        setZoomTarget(target);
        setZoomOpen(true);
    };

    const zoomItem = zoomTarget === "deriv"
        ? { id: `${item.id}-deriv`, title: `${item.title} — Derivation`, latex: item.derivation, explanation: item.explanation }
        : zoomTarget === "usage"
            ? { id: `${item.id}-usage`, title: `${item.title} — Practical Usage`, richText: item.usage, explanation: item.explanation }
            : item;
    const tRef = useRef(null);

    const accentVar = SPORT_META[item.sport]?.colorVar ?? "--lab-accent";
    const accentCss = `var(${accentVar})`;

    // Consolidate timer cleanup using Ref to avoid shadowing/closure issues
    useEffect(() => {
        return () => {
            if (tRef.current && isBrowser) window.clearTimeout(tRef.current);
        };
    }, []);

    const onCopyLatex = useCallback(async () => {
        const ok = await copyToClipboard(stripDisplayDelims(item.latex));
        if (!ok) return;

        setCopied(true);
        if (tRef.current && isBrowser) window.clearTimeout(tRef.current);
        if (isBrowser) {
            tRef.current = window.setTimeout(() => setCopied(false), 1200);
        }
    }, [item.latex]);

    return (
        <div
            ref={ref}
            className={clsx(
                "relative overflow-hidden rounded-[2.5rem] border transition-all duration-500",
                "lab-card group/card",
                collapsed ? "p-4 sm:p-5" : "p-5 sm:p-8 md:p-10"
            )}
            style={{
                borderColor: collapsed ? "var(--lab-line)" : "var(--lab-line2)",
                "--active-accent": accentCss,
                minHeight: inView ? "auto" : "320px",
            }}
        >
            {!inView ? (
                <div className="flex flex-col gap-6 p-8 animate-pulse opacity-60">
                    <div className="flex items-center justify-between">
                        <div className="h-4 w-24 rounded bg-current opacity-20" />
                        <div className="h-9 w-28 rounded-2xl bg-current opacity-10" />
                    </div>
                    <div className="h-8 w-4/5 rounded-lg bg-current opacity-15" />
                    <div className="h-32 rounded-2xl bg-current opacity-5" />
                </div>
            ) : (
                <>
                    {!collapsed && (
                        <>
                            <div
                                className="absolute -right-28 -top-28 h-72 w-72 rounded-full blur-[120px] pointer-events-none opacity-25"
                                style={{ background: `var(${accentVar})` }}
                            />
                            <div
                                className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full blur-[130px] pointer-events-none opacity-10"
                                style={{ background: "var(--lab-panel2)" }}
                            />
                        </>
                    )}

                    <div className="relative flex flex-wrap items-start justify-between gap-6">
                        <div className="flex-1 min-w-[280px]">
                            <div className="flex items-center gap-3">
                                <span
                                    className="text-[10px] font-black tracking-[0.22em] uppercase"
                                    style={{ color: mix(accentCss, 84, "var(--lab-fg)") }}
                                >
                                    {item.id}
                                </span>
                                <div
                                    className="h-px flex-1 opacity-55"
                                    style={{
                                        background: `linear-gradient(90deg, var(--lab-line), transparent)`,
                                    }}
                                />
                            </div>

                            <h3 className="mt-4 text-2xl font-black tracking-tight leading-tight">
                                {item.title}
                            </h3>

                            {!collapsed && item.badges?.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {item.badges.map((b) => (
                                        <span
                                            key={b}
                                            className="rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                                            style={{
                                                background: "var(--lab-panel2)",
                                                border: "1px solid var(--lab-line)",
                                                color: "var(--lab-muted)",
                                            }}
                                        >
                                            {b}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onCopyLatex}
                                aria-label="Copy LaTeX source"
                                className={clsx(
                                    "lab-focus-ring group/btn relative flex items-center gap-2 overflow-hidden rounded-2xl border px-4 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                                    "hover:bg-opacity-80 active:scale-95"
                                )}
                                style={{
                                    borderColor: copied ? "var(--lab-ok)" : "var(--lab-line)",
                                    background: copied
                                        ? mix("var(--lab-ok)", 12, "transparent")
                                        : "var(--lab-panel)",
                                    color: copied ? "var(--lab-ok)" : "var(--lab-muted2)",
                                }}
                            >
                                {copied ? (
                                    <Check className="h-3.5 w-3.5" />
                                ) : (
                                    <Copy className="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110" />
                                )}
                                {copied ? "Verified" : "Copy LaTeX"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setCollapsed((v) => !v)}
                                aria-label={collapsed ? "Expand card" : "Collapse card"}
                                className="lab-focus-ring flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all hover:bg-black/5 active:scale-95"
                                style={{
                                    borderColor: "var(--lab-line)",
                                    background: "var(--lab-panel)",
                                    color: "var(--lab-muted2)",
                                }}
                            >
                                {collapsed ? (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                    <ChevronUp className="h-3.5 w-3.5" />
                                )}
                                {collapsed ? "Expand" : "Collapse"}
                            </button>
                        </div>
                    </div>

                    {!collapsed && (
                        <div className="mt-8 space-y-6">
                            {/* Clickable formula — opens zoom modal */}
                            <div
                                className="formula-clickable group/math relative cursor-pointer"
                                onClick={() => openZoom(null)}
                                role="button"
                                tabIndex={0}
                                aria-label={`Zoom into formula ${item.id}`}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openZoom(null); } }}
                            >
                                <MathBlock latex={item.latex} id={item.id} title={item.title} />
                                <div className="formula-zoom-hint">
                                    <Maximize2 className="h-4 w-4" />
                                    <span>Click to zoom</span>
                                </div>
                            </div>

                            <div
                                className="rounded-2xl p-6 border transition-all duration-300"
                                style={{
                                    background: mix("var(--lab-panel2)", 45, "transparent"),
                                    borderColor: "var(--lab-line)",
                                }}
                            >
                                <div className="flex gap-4">
                                    <div
                                        className="w-1 rounded-full flex-shrink-0"
                                        style={{ background: `var(${accentVar})`, opacity: 0.6 }}
                                    />
                                    <div className="flex-1 space-y-3">
                                        <div
                                            className="text-[10px] font-black uppercase tracking-[0.32em]"
                                            style={{ color: "var(--lab-muted2)" }}
                                        >
                                            What it means
                                        </div>
                                        <div
                                            className="text-sm leading-relaxed font-medium"
                                            style={{ color: "var(--lab-fg)" }}
                                        >
                                            <MathText text={item.explanation} />
                                        </div>

                                        {item.notes?.length > 0 && (
                                            <>
                                                <div
                                                    className="pt-2 text-[10px] font-black uppercase tracking-[0.32em]"
                                                    style={{ color: "var(--lab-muted2)" }}
                                                >
                                                    Engineering Notes
                                                </div>
                                                <ul className="space-y-2">
                                                    {item.notes.map((n, i) => (
                                                        <li
                                                            key={i}
                                                            className="flex gap-3 text-xs font-medium leading-relaxed"
                                                            style={{ color: "var(--lab-fg)" }}
                                                        >
                                                            <span
                                                                style={{
                                                                    color: `var(${accentVar})`,
                                                                    opacity: 0.8,
                                                                }}
                                                            >
                                                                •
                                                            </span>
                                                            <span>
                                                                <MathText text={n} />
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </>
                                        )}

                                        {/* Worked Example */}
                                        <ExamplePanel item={item} mix={mix} accentCss={accentCss} />

                                        {/* Usage Box — clickable for zoom */}
                                        {item.usage && (
                                            <div
                                                className="formula-clickable mt-5 rounded-xl p-4 text-xs leading-relaxed font-medium cursor-pointer group/usage"
                                                style={{
                                                    background: mix(accentCss, 5, "transparent"),
                                                    border: `1px solid ${mix(accentCss, 15, "transparent")}`,
                                                    color: "var(--lab-fg)",
                                                }}
                                                onClick={() => openZoom("usage")}
                                                role="button"
                                                tabIndex={0}
                                                aria-label="Zoom into practical usage"
                                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openZoom("usage"); } }}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Lightbulb
                                                            className="h-3.5 w-3.5 flex-shrink-0"
                                                            style={{ color: accentCss, opacity: 0.7 }}
                                                        />
                                                        <span
                                                            className="text-[9px] font-black uppercase tracking-[0.3em]"
                                                            style={{ color: "var(--lab-muted2)" }}
                                                        >
                                                            Practical Usage
                                                        </span>
                                                    </div>
                                                    <div className="formula-zoom-hint-inline">
                                                        <Maximize2 className="h-3 w-3" />
                                                    </div>
                                                </div>
                                                <MathText text={item.usage} />
                                            </div>
                                        )}

                                        {/* Derivation Toggle */}
                                        {item.derivation && (
                                            <div className="mt-5">
                                                <button
                                                    type="button"
                                                    onClick={() => setDerivOpen((v) => !v)}
                                                    className="lab-focus-ring flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-black/5"
                                                    style={{
                                                        color: accentCss,
                                                        background: "none",
                                                        border: "none",
                                                    }}
                                                >
                                                    <FlaskConical className="h-3.5 w-3.5" />
                                                    {derivOpen ? "Hide Derivation" : "Show Derivation"}
                                                    {derivOpen ? (
                                                        <ChevronUp className="h-3 w-3" />
                                                    ) : (
                                                        <ChevronDown className="h-3 w-3" />
                                                    )}
                                                </button>
                                                {derivOpen && (
                                                    <div
                                                        className="mt-3 pl-4"
                                                        style={{
                                                            borderLeft: `2px solid ${mix(accentCss, 30, "transparent")}`,
                                                        }}
                                                    >
                                                        <div
                                                            className="formula-clickable group/math relative cursor-pointer"
                                                            onClick={() => openZoom("deriv")}
                                                            role="button"
                                                            tabIndex={0}
                                                            aria-label="Zoom into derivation"
                                                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openZoom("deriv"); } }}
                                                        >
                                                            <MathBlock
                                                                latex={item.derivation}
                                                                id={`${item.id}-deriv`}
                                                            />
                                                            <div className="formula-zoom-hint">
                                                                <Maximize2 className="h-3.5 w-3.5" />
                                                                <span>Zoom</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                {item.tags?.map((t) => (
                                    <span
                                        key={t}
                                        className="rounded-lg border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest opacity-85"
                                        style={{
                                            borderColor: "var(--lab-line)",
                                            background: "var(--lab-panel)",
                                            color: "var(--lab-muted)",
                                        }}
                                    >
                                        {TAG_LABELS[t] ?? t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Zoom Modal — rendered via Portal at document.body */}
            {zoomOpen && (
                <FormulaZoomModal
                    item={zoomItem}
                    accentCss={accentCss}
                    mix={mix}
                    onClose={() => setZoomOpen(false)}
                />
            )}
        </div>
    );
});

export default FormulaCard;
