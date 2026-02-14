import React, { memo } from "react";

/**
 * Global toast notification for the Math Deck lab.
 */
const Toast = memo(function Toast({ kind = "info", text, mix }) {
    if (!text) return null;

    const colorVar =
        kind === "error"
            ? "var(--lab-bad)"
            : kind === "ok"
                ? "var(--lab-ok)"
                : "var(--lab-accent)";

    return (
        <div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 rounded-2xl border px-6 py-4 text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300"
            style={{
                background: mix(colorVar, 12, "var(--lab-bg)"),
                borderColor: mix(colorVar, 40, "transparent"),
                color: mix(colorVar, 92, "var(--lab-fg)"),
                boxShadow: `0 20px 50px -10px ${mix(colorVar, 22, "transparent")}`,
            }}
            role="status"
            aria-live="polite"
        >
            <div className="flex items-center gap-3">
                <div
                    className="h-2 w-2 rounded-full animate-pulse"
                    style={{ background: colorVar }}
                    aria-hidden="true"
                />
                {text}
            </div>
        </div>
    );
});

export default Toast;
