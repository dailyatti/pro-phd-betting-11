import { useLayoutEffect } from "react";

/**
 * Custom hook to inject the PhD Betting Research Lab design system (CSS variables).
 * This ensures the component has its own self-contained styling environment.
 */
export function useLabStyles() {
  useLayoutEffect(() => {
    const style = document.createElement("style");
    style.id = "phd-lab-styles";
    style.innerHTML = `
      :root {
        --lab-bg: #000000;
        --lab-fg: #ffffff;
        --lab-accent: #22d3ee;
        --lab-accent-rgb: 34, 211, 238;
        --lab-warn: #fcd34d;
        --lab-bad: #fb7185;
        --lab-ok: #34d399;
        --lab-line: rgba(255, 255, 255, 0.08);
        --lab-line2: rgba(255, 255, 255, 0.15);
        --lab-panel: rgba(255, 255, 255, 0.02);
        --lab-panel2: rgba(0, 0, 0, 0.5);
        --lab-muted: rgba(255, 255, 255, 0.6);
        --lab-muted2: rgba(255, 255, 255, 0.3);
        --lab-katex-bg: #09090b;
        --lab-katex-fg: #f1f5f9;
        --c-overview: #c084fc;
        --c-core: #38bdf8;
        --c-soccer: #2dd4bf;
        --c-basketball: #fb923c;
        --c-tennis: #a3e635;
        --c-nfl: #818cf8;
        --c-hockey: #22d3ee;
        --c-baseball: #f472b6;
        --c-combat: #f87171;
        --c-advanced: #e879f9;
      }

      [data-lab-theme="light"] {
        --lab-bg: #fffdf5;
        --lab-fg: #09090b;
        --lab-accent: #0891b2;
        --lab-accent-rgb: 8, 145, 178;
        --lab-warn: #d97706;
        --lab-bad: #be123c;
        --lab-ok: #059669;
        --lab-line: rgba(0, 0, 0, 0.08);
        --lab-line2: rgba(0, 0, 0, 0.14);
        --lab-panel: #ffffff;
        --lab-panel2: rgba(255, 255, 255, 0.85);
        --lab-muted: #52525b;
        --lab-muted2: #a1a1aa;
        --lab-katex-bg: #ffffff;
        --lab-katex-fg: #09090b;
        --c-overview: #7c3aed;
        --c-core: #0284c7;
        --c-soccer: #0d9488;
        --c-basketball: #ea580c;
        --c-tennis: #65a30d;
        --c-nfl: #4f46e5;
        --c-hockey: #0891b2;
        --c-baseball: #db2777;
        --c-combat: #dc2626;
        --c-advanced: #c026d3;
      }

      .lab-root {
        font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
        min-height: 100vh;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      .lab-root ::selection {
        background: var(--lab-accent);
        color: #fff;
      }

      .lab-card {
        background: var(--lab-panel);
        backdrop-filter: blur(20px);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .lab-card:hover {
        border-color: var(--lab-line2);
        box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.4);
        transform: translateY(-2px);
      }

      [data-lab-theme="light"] .lab-card:hover {
        box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.1);
      }

      .lab-focus-ring:focus-visible {
        outline: 2px solid var(--lab-accent);
        outline-offset: 4px;
      }

      /* Native select / option — force theme colors */
      .lab-root select {
        background-color: #09090b;
        color: #ffffff;
        appearance: none;
        -webkit-appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        padding-right: 36px;
      }
      .lab-root select option {
        background-color: #09090b;
        color: #ffffff;
        padding: 8px 12px;
      }
      [data-lab-theme="light"] .lab-root select,
      .lab-root[data-lab-theme="light"] select {
        background-color: #ffffff;
        color: #09090b;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2309090b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
      }
      [data-lab-theme="light"] .lab-root select option,
      .lab-root[data-lab-theme="light"] select option {
        background-color: #ffffff;
        color: #09090b;
      }

      /* Custom Scrollbar for Lab */
      .lab-root ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      .lab-root ::-webkit-scrollbar-track {
        background: transparent;
      }
      .lab-root ::-webkit-scrollbar-thumb {
        background: var(--lab-line2);
        border-radius: 10px;
      }
      .lab-root ::-webkit-scrollbar-thumb:hover {
        background: var(--lab-muted2);
      }

      /* =============================================
         KaTeX Math Rendering — PhD Lab Design
         ============================================= */

      /* Display equation container */
      .katex-display {
        margin: 0.8em 0 !important;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 16px 8px;
        text-align: center;
      }

      /* Base font */
      .katex {
        font-size: 1.2em !important;
        color: var(--lab-fg) !important;
      }

      /* All symbol classes inherit theme color */
      .katex .mord,
      .katex .mbin,
      .katex .mrel,
      .katex .mopen,
      .katex .mclose,
      .katex .mpunct,
      .katex .mop,
      .katex .minner,
      .katex .mathnormal,
      .katex .mathbb {
        color: var(--lab-fg) !important;
      }

      /* Double-struck letters (E, R, etc) accent color */
      .katex .mathbb {
        color: var(--lab-accent) !important;
      }

      /* Operator names (ln, log, etc) */
      .katex .mop {
        color: var(--lab-fg) !important;
        font-weight: 500;
      }

      /* text{} labels under braces — muted, smaller */
      .katex .mord.text,
      .katex .text .mord {
        color: var(--lab-muted) !important;
        font-size: 0.82em;
        font-style: italic;
      }

      /* Underbrace / overbrace — the brace itself */
      .katex .munder .stretchy,
      .katex .mover .stretchy {
        color: var(--lab-accent) !important;
        opacity: 0.6;
      }
      /* But NOT the fbox stretchy */
      .katex .fbox.stretchy {
        color: var(--lab-fg) !important;
        opacity: 1;
      }

      /* Underbrace text labels (sizing class) */
      .katex .munder .sizing {
        font-size: 0.7em !important;
      }

      /* boxed — KaTeX renders as .stretchy.fbox with inline border */
      .katex .fbox {
        border: 2px solid var(--lab-accent) !important;
        border-width: 2px !important;
        border-radius: 10px !important;
        padding: 0.4em 0.65em !important;
        background: rgba(var(--lab-accent-rgb), 0.05) !important;
      }

      /* boxpad — inner spacing for boxed content */
      .katex .boxpad {
        padding: 0 0.3em !important;
      }

      /* Fraction lines */
      .katex .frac-line {
        border-bottom-color: var(--lab-muted) !important;
        background: var(--lab-muted) !important;
      }

      /* Square root */
      .katex .sqrt > .sqrt-sign {
        color: var(--lab-fg) !important;
      }
      .katex .sqrt > .vlist-t .sqrt-line {
        background: var(--lab-fg) !important;
      }

      /* Binary operators (+, -, =, etc) — slight muted */
      .katex .mbin {
        color: var(--lab-muted) !important;
        padding: 0 0.15em;
      }

      /* Relations (=, <, >, etc) */
      .katex .mrel {
        color: var(--lab-fg) !important;
        padding: 0 0.2em;
      }

      /* Subscript/superscript sizes */
      .katex .mtight {
        font-size: 0.78em;
      }

      /* Scrollbar for wide equations */
      .katex-display::-webkit-scrollbar {
        height: 4px;
      }
      .katex-display::-webkit-scrollbar-thumb {
        background: var(--lab-line2);
        border-radius: 4px;
      }

      /* Light mode overrides */
      [data-lab-theme="light"] .katex,
      [data-lab-theme="light"] .katex-html {
        color: #0f172a !important;
      }
      [data-lab-theme="light"] .katex .mord,
      [data-lab-theme="light"] .katex .mrel,
      [data-lab-theme="light"] .katex .mopen,
      [data-lab-theme="light"] .katex .mclose,
      [data-lab-theme="light"] .katex .mathnormal {
        color: #0f172a !important;
      }
      [data-lab-theme="light"] .katex .fbox {
        border-color: var(--lab-accent) !important;
        background: rgba(var(--lab-accent-rgb), 0.04) !important;
      }
      [data-lab-theme="light"] .katex .mbin {
        color: #475569 !important;
      }

      @keyframes labFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .lab-animate-in {
        animation: labFadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      }

      .custom-scrollbar::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        border: 2px solid transparent;
        background-clip: content-box;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
        background-clip: content-box;
      }

      /* =============================================
         Formula Zoom — Clickable Math + Modal
         ============================================= */

      /* Clickable formula wrapper */
      .formula-clickable {
        position: relative;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: 1.5rem;
      }

      .formula-clickable:hover {
        transform: scale(1.008);
      }

      .formula-clickable:hover > div:first-child {
        border-color: var(--lab-accent) !important;
        box-shadow: 0 0 0 1px var(--lab-accent),
                    0 0 40px -10px rgba(var(--lab-accent-rgb), 0.25);
      }

      .formula-clickable:active {
        transform: scale(0.995);
      }

      /* Zoom hint badge */
      .formula-zoom-hint {
        position: absolute;
        top: 12px;
        right: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--lab-muted2);
        background: var(--lab-panel2);
        border: 1px solid var(--lab-line);
        backdrop-filter: blur(12px);
        opacity: 0;
        transform: translateY(-4px) scale(0.95);
        transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
        pointer-events: none;
        z-index: 5;
      }

      .formula-clickable:hover .formula-zoom-hint {
        opacity: 1;
        transform: translateY(0) scale(1);
        color: var(--lab-accent);
        border-color: var(--lab-accent);
      }

      /* ── Zoom Modal Overlay ── */
      .formula-zoom-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(20px) saturate(1.2);
        -webkit-backdrop-filter: blur(20px) saturate(1.2);
      }

      [data-lab-theme="light"] .formula-zoom-overlay {
        background: rgba(255, 255, 255, 0.7);
      }

      /* Overlay entrance */
      .formula-zoom-in {
        animation: zoomOverlayIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      }
      .formula-zoom-out {
        animation: zoomOverlayOut 0.28s cubic-bezier(0.4, 0, 1, 1) forwards;
      }

      @keyframes zoomOverlayIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes zoomOverlayOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      /* ── Zoom Panel ── */
      .formula-zoom-panel {
        position: relative;
        width: 100%;
        max-width: 960px;
        max-height: 90vh;
        overflow-y: auto;
        border-radius: 2rem;
        border: 1px solid var(--lab-line2);
        background: var(--lab-panel);
        backdrop-filter: blur(24px);
        padding: 28px 32px 20px;
        box-shadow:
          0 0 0 1px rgba(255,255,255,0.04),
          0 40px 100px -20px rgba(0, 0, 0, 0.6),
          0 0 80px -20px rgba(var(--lab-accent-rgb), 0.15);
      }

      [data-lab-theme="light"] .formula-zoom-panel {
        background: rgba(255, 255, 255, 0.95);
        box-shadow:
          0 0 0 1px rgba(0,0,0,0.06),
          0 40px 100px -20px rgba(0, 0, 0, 0.15),
          0 0 60px -20px rgba(var(--lab-accent-rgb), 0.08);
      }

      /* Panel entrance */
      .formula-zoom-panel-in {
        animation: zoomPanelIn 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      }
      .formula-zoom-panel-out {
        animation: zoomPanelOut 0.25s cubic-bezier(0.4, 0, 1, 1) forwards;
      }

      @keyframes zoomPanelIn {
        from { opacity: 0; transform: scale(0.92) translateY(20px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes zoomPanelOut {
        from { opacity: 1; transform: scale(1) translateY(0); }
        to { opacity: 0; transform: scale(0.95) translateY(10px); }
      }

      /* Panel scrollbar */
      .formula-zoom-panel::-webkit-scrollbar {
        width: 6px;
      }
      .formula-zoom-panel::-webkit-scrollbar-track {
        background: transparent;
      }
      .formula-zoom-panel::-webkit-scrollbar-thumb {
        background: var(--lab-line2);
        border-radius: 6px;
      }

      /* ── Top bar ── */
      .formula-zoom-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }

      .formula-zoom-id {
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.22em;
        text-transform: uppercase;
      }

      /* ── Title ── */
      .formula-zoom-title {
        font-size: 1.5rem;
        font-weight: 900;
        letter-spacing: -0.02em;
        line-height: 1.2;
        margin-bottom: 24px;
        color: var(--lab-fg);
      }

      @media (min-width: 640px) {
        .formula-zoom-title {
          font-size: 1.75rem;
        }
      }

      /* ── Math display area ── */
      .formula-zoom-math-area {
        position: relative;
        overflow: hidden;
        border-radius: 1.5rem;
        border: 1px solid var(--lab-line2);
        background: var(--lab-katex-bg, var(--lab-panel2));
        padding: 32px 24px;
        min-height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 24px;
      }

      .formula-zoom-math-inner {
        transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
        width: 100%;
      }

      /* Override MathBlock margin inside zoom */
      .formula-zoom-math-inner .katex-display {
        margin: 0 !important;
      }

      .formula-zoom-math-inner > div {
        margin: 0 !important;
        border: none !important;
        background: transparent !important;
        padding: 0 !important;
        box-shadow: none !important;
      }

      /* Larger font in zoom */
      .formula-zoom-math-inner .katex {
        font-size: 1.6em !important;
      }

      @media (min-width: 640px) {
        .formula-zoom-math-inner .katex {
          font-size: 1.9em !important;
        }
      }

      /* Rich text (mixed text + inline math) zoom inner */
      .formula-zoom-richtext-inner {
        transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
        width: 100%;
        font-size: 1.15rem;
        line-height: 1.9;
        font-weight: 500;
        color: var(--lab-fg);
        text-align: left;
        padding: 8px 4px;
      }

      .formula-zoom-richtext-inner .katex {
        font-size: 1.4em !important;
      }

      @media (min-width: 640px) {
        .formula-zoom-richtext-inner {
          font-size: 1.3rem;
          line-height: 2;
        }
        .formula-zoom-richtext-inner .katex {
          font-size: 1.6em !important;
        }
      }

      /* Inline zoom hint (small icon in top-right of usage box) */
      .formula-zoom-hint-inline {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
        border-radius: 6px;
        color: var(--lab-muted2);
        opacity: 0;
        transform: scale(0.8);
        transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
      }

      .formula-clickable:hover .formula-zoom-hint-inline {
        opacity: 1;
        transform: scale(1);
        color: var(--lab-accent);
      }

      /* ── Explanation ── */
      .formula-zoom-explanation {
        border-radius: 1rem;
        padding: 16px 20px;
        border: 1px solid var(--lab-line);
        background: var(--lab-panel2);
        margin-bottom: 16px;
      }

      /* ── Buttons ── */
      .formula-zoom-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 12px;
        border: 1px solid var(--lab-line);
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        cursor: pointer;
        transition: all 0.2s;
        background: var(--lab-panel);
        color: var(--lab-muted2);
      }

      .formula-zoom-btn:hover {
        border-color: var(--lab-accent);
        color: var(--lab-accent);
      }

      .formula-zoom-btn:active {
        transform: scale(0.95);
      }

      .formula-zoom-btn-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
        border-radius: 8px;
        border: none;
        background: transparent;
        color: var(--lab-muted2);
        cursor: pointer;
        transition: all 0.15s;
      }

      .formula-zoom-btn-icon:hover:not(:disabled) {
        color: var(--lab-accent);
        background: rgba(var(--lab-accent-rgb), 0.08);
      }

      .formula-zoom-btn-icon:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .formula-zoom-btn-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 12px;
        border: 1px solid var(--lab-line);
        background: var(--lab-panel);
        color: var(--lab-muted2);
        cursor: pointer;
        transition: all 0.2s;
      }

      .formula-zoom-btn-close:hover {
        background: var(--lab-bad);
        border-color: var(--lab-bad);
        color: #fff;
        transform: scale(1.05);
      }

      .formula-zoom-btn-close:active {
        transform: scale(0.92);
      }

      /* ── Keyboard hints ── */
      .formula-zoom-hints {
        text-align: center;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.1em;
        color: var(--lab-muted2);
        opacity: 0.6;
        padding-top: 4px;
      }

      .formula-zoom-hints span {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        background: var(--lab-panel2);
        border: 1px solid var(--lab-line);
        font-family: monospace;
        font-size: 9px;
        vertical-align: middle;
      }
    `;
    document.head.appendChild(style);
    return () => {
      const existing = document.getElementById("phd-lab-styles");
      if (existing) existing.remove();
    };
  }, []);
}
