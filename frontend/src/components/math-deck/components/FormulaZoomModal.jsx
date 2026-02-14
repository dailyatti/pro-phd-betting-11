import React, { useEffect, useCallback, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Check, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { MathBlock, MathText } from "../katex-engine";
import { copyToClipboard, stripDisplayDelims, isBrowser } from "../utils";

/**
 * Professional full-screen zoom modal for mathematical formulas.
 * Uses React Portal to render at document.body level (escapes overflow-hidden parents).
 * Supports pinch/scroll zoom, keyboard navigation.
 */
export default function FormulaZoomModal({ item, accentCss, mix, onClose }) {
    const [closing, setClosing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [scale, setScale] = useState(1);
    const copyTimer = useRef(null);
    const contentRef = useRef(null);

    const MIN_SCALE = 0.5;
    const MAX_SCALE = 3;
    const SCALE_STEP = 0.25;

    // Animate close
    const handleClose = useCallback(() => {
        setClosing(true);
        setTimeout(() => onClose(), 280);
    }, [onClose]);

    // ESC key + zoom shortcuts
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") handleClose();
            if (e.key === "+" || e.key === "=") setScale((s) => Math.min(s + SCALE_STEP, MAX_SCALE));
            if (e.key === "-") setScale((s) => Math.max(s - SCALE_STEP, MIN_SCALE));
            if (e.key === "0") setScale(1);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [handleClose]);

    // Lock body scroll
    useEffect(() => {
        if (!isBrowser) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    // Cleanup timer
    useEffect(() => {
        return () => {
            if (copyTimer.current) window.clearTimeout(copyTimer.current);
        };
    }, []);

    // Ctrl+Scroll zoom
    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const onWheel = (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
                setScale((s) => Math.min(Math.max(s + delta, MIN_SCALE), MAX_SCALE));
            }
        };
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, []);

    const copyText = item.latex ? stripDisplayDelims(item.latex) : (item.richText || "");

    const onCopy = useCallback(async () => {
        try {
            const ok = await copyToClipboard(copyText);
            if (!ok) return;
            setCopied(true);
            if (copyTimer.current) window.clearTimeout(copyTimer.current);
            copyTimer.current = window.setTimeout(() => setCopied(false), 1500);
        } catch {
            // silently fail
        }
    }, [copyText]);

    const scalePercent = Math.round(scale * 100);

    const modal = (
        <div
            className={`formula-zoom-overlay ${closing ? "formula-zoom-out" : "formula-zoom-in"}`}
            onClick={(e) => {
                if (e.target === e.currentTarget) handleClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-label={`Formula zoom: ${item.title}`}
        >
            {/* Glass panel */}
            <div
                className={`formula-zoom-panel ${closing ? "formula-zoom-panel-out" : "formula-zoom-panel-in"}`}
                ref={contentRef}
            >
                {/* Top bar */}
                <div className="formula-zoom-topbar">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span
                            className="formula-zoom-id"
                            style={{ color: accentCss }}
                        >
                            {item.id}
                        </span>
                        <div
                            className="h-px flex-1 opacity-30"
                            style={{ background: "var(--lab-line2)" }}
                        />
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Zoom controls */}
                        <div
                            className="flex items-center gap-1 rounded-xl border px-2 py-1.5"
                            style={{
                                borderColor: "var(--lab-line)",
                                background: "var(--lab-panel)",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setScale((s) => Math.max(s - SCALE_STEP, MIN_SCALE))}
                                className="formula-zoom-btn-icon"
                                aria-label="Zoom out"
                                disabled={scale <= MIN_SCALE}
                            >
                                <ZoomOut className="h-3.5 w-3.5" />
                            </button>
                            <span
                                className="text-[10px] font-black tracking-wider tabular-nums min-w-[3ch] text-center select-none"
                                style={{ color: "var(--lab-muted)" }}
                            >
                                {scalePercent}%
                            </span>
                            <button
                                type="button"
                                onClick={() => setScale((s) => Math.min(s + SCALE_STEP, MAX_SCALE))}
                                className="formula-zoom-btn-icon"
                                aria-label="Zoom in"
                                disabled={scale >= MAX_SCALE}
                            >
                                <ZoomIn className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setScale(1)}
                                className="formula-zoom-btn-icon"
                                aria-label="Reset zoom"
                            >
                                <RotateCcw className="h-3 w-3" />
                            </button>
                        </div>

                        {/* Copy */}
                        <button
                            type="button"
                            onClick={onCopy}
                            className="formula-zoom-btn"
                            style={{
                                borderColor: copied ? "var(--lab-ok)" : "var(--lab-line)",
                                background: copied
                                    ? mix("var(--lab-ok)", 12, "transparent")
                                    : "var(--lab-panel)",
                                color: copied ? "var(--lab-ok)" : "var(--lab-muted2)",
                            }}
                        >
                            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            <span className="hidden sm:inline">{copied ? "Copied" : (item.richText ? "Copy" : "LaTeX")}</span>
                        </button>

                        {/* Close */}
                        <button
                            type="button"
                            onClick={handleClose}
                            className="formula-zoom-btn-close"
                            aria-label="Close zoom view"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Title */}
                <h2 className="formula-zoom-title">{item.title}</h2>

                {/* Formula display area */}
                <div className="formula-zoom-math-area">
                    <div
                        className={item.richText ? "formula-zoom-richtext-inner" : "formula-zoom-math-inner"}
                        style={{
                            transform: `scale(${scale})`,
                            transformOrigin: "center center",
                        }}
                    >
                        {item.richText ? (
                            <MathText text={item.richText} />
                        ) : (
                            <MathBlock latex={item.latex} id={`zoom-${item.id}`} />
                        )}
                    </div>
                </div>

                {/* Explanation below */}
                <div className="formula-zoom-explanation">
                    <div className="flex gap-3">
                        <div
                            className="w-1 rounded-full flex-shrink-0"
                            style={{ background: accentCss, opacity: 0.5 }}
                        />
                        <div className="flex-1 space-y-2">
                            <div
                                className="text-[9px] font-black uppercase tracking-[0.3em]"
                                style={{ color: "var(--lab-muted2)" }}
                            >
                                Interpretation
                            </div>
                            <div
                                className="text-sm leading-relaxed font-medium"
                                style={{ color: "var(--lab-fg)" }}
                            >
                                <MathText text={item.explanation} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Keyboard hints */}
                <div className="formula-zoom-hints">
                    <span>ESC</span> close
                    <span className="mx-2">|</span>
                    <span>+/-</span> zoom
                    <span className="mx-2">|</span>
                    <span>0</span> reset
                    <span className="mx-2">|</span>
                    <span>Ctrl+Scroll</span> zoom
                </div>
            </div>
        </div>
    );

    // Portal: render at document.body so it escapes overflow-hidden + transform parents
    if (!isBrowser) return null;
    return createPortal(modal, document.body);
}
