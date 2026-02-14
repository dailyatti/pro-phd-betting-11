/* eslint-disable react/prop-types */
import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * KaTeX rendering options with PhD-level macros.
 */
const KATEX_MACROS = {
    "\\E": "\\mathbb{E}",
    "\\P": "\\mathbb{P}",
    "\\PP": "\\mathbb{P}",
    "\\R": "\\mathbb{R}",
    "\\Z": "\\mathbb{Z}",
    "\\N": "\\mathbb{N}",
    "\\1": "\\mathbf{1}",
    "\\KL": "\\mathrm{KL}",
    "\\cvar": "\\mathrm{CVaR}",
    "\\var": "\\mathrm{VaR}",
    "\\argmin": "\\operatorname*{arg\\,min}",
    "\\argmax": "\\operatorname*{arg\\,max}",
    "\\diag": "\\operatorname{diag}",
    "\\Cov": "\\operatorname{Cov}",
    "\\Var": "\\operatorname{Var}",
    "\\Corr": "\\operatorname{Corr}",
    "\\tr": "\\operatorname{tr}",
    "\\sgn": "\\operatorname{sgn}",
    "\\Pois": "\\mathrm{Pois}",
    "\\NB": "\\mathrm{NB}",
    "\\Bern": "\\mathrm{Bern}",
    "\\Bin": "\\mathrm{Bin}",
    "\\Beta": "\\mathrm{Beta}",
    "\\Gam": "\\mathrm{Gamma}",
    "\\Unif": "\\mathrm{Unif}",
};

/**
 * Render LaTeX to HTML string using KaTeX with macros.
 */
function renderToHtml(latex, displayMode = true) {
    try {
        return {
            html: katex.renderToString(latex, {
                displayMode,
                throwOnError: false,
                trust: false,
                strict: (code) =>
                    ["unknownSymbol", "unicodeText"].includes(code) ? "ignore" : "warn",
                macros: { ...KATEX_MACROS },
            }),
            error: null,
        };
    } catch (e) {
        return { html: "", error: e.message || String(e) };
    }
}

/**
 * Strips common math delimiters from a string repeatedly to handle nested wrapping.
 */
function stripMathDelimiters(input) {
    let s = String(input ?? "").trim();

    for (let k = 0; k < 3; k++) {
        const before = s;
        if (s.startsWith("\\[") && s.endsWith("\\]")) {
            s = s.slice(2, -2).trim();
        } else if (s.startsWith("\\(") && s.endsWith("\\)")) {
            s = s.slice(2, -2).trim();
        } else if (s.startsWith("$$") && s.endsWith("$$")) {
            s = s.slice(2, -2).trim();
        } else if (s.startsWith("$") && s.endsWith("$") && s.length >= 2) {
            if (!(s.startsWith("$$") && s.endsWith("$$"))) {
                s = s.slice(1, -1).trim();
            }
        }
        if (s === before) break;
    }
    return s;
}

/**
 * Checks if a character at idx is escaped by an odd number of backslashes.
 */
function isEscaped(text, idx) {
    let count = 0;
    for (let i = idx - 1; i >= 0 && text[i] === "\\"; i--) count++;
    return count % 2 === 1;
}

/**
 * Tokenizes text into segments of text + math.
 */
function tokenizeMath(text) {
    const s = String(text ?? "");
    const out = [];
    let i = 0;
    let buf = "";

    const flushBuf = () => {
        if (buf) {
            out.push({ kind: "text", value: buf });
            buf = "";
        }
    };

    while (i < s.length) {
        if (s[i] === "\\" && s[i + 1] === "[" && !isEscaped(s, i)) {
            const start = i + 2;
            let j = start;
            while (j < s.length) {
                if (s[j] === "\\" && s[j + 1] === "]" && !isEscaped(s, j)) break;
                j++;
            }
            if (j < s.length) {
                flushBuf();
                out.push({ kind: "math", value: stripMathDelimiters(s.slice(start, j)), display: true });
                i = j + 2;
                continue;
            }
        }

        if (s[i] === "\\" && s[i + 1] === "(" && !isEscaped(s, i)) {
            const start = i + 2;
            let j = start;
            while (j < s.length) {
                if (s[j] === "\\" && s[j + 1] === ")" && !isEscaped(s, j)) break;
                j++;
            }
            if (j < s.length) {
                flushBuf();
                out.push({ kind: "math", value: stripMathDelimiters(s.slice(start, j)), display: false });
                i = j + 2;
                continue;
            }
        }

        if (s[i] === "$" && s[i + 1] === "$" && !isEscaped(s, i)) {
            const start = i + 2;
            let j = start;
            while (j < s.length - 1) {
                if (s[j] === "$" && s[j + 1] === "$" && !isEscaped(s, j)) break;
                j++;
            }
            if (j < s.length - 1) {
                flushBuf();
                out.push({ kind: "math", value: stripMathDelimiters(s.slice(start, j)), display: true });
                i = j + 2;
                continue;
            }
        }

        if (s[i] === "$" && !isEscaped(s, i)) {
            const start = i + 1;
            let j = start;
            while (j < s.length) {
                if (s[j] === "$" && !isEscaped(s, j)) break;
                j++;
            }
            if (j < s.length) {
                flushBuf();
                out.push({ kind: "math", value: stripMathDelimiters(s.slice(start, j)), display: false });
                i = j + 1;
                continue;
            }
        }

        buf += s[i];
        i++;
    }

    flushBuf();
    return out;
}

/* ═══════════════════════════════════════════════════════════════
   MathBlock — Display math
   ═══════════════════════════════════════════════════════════════ */

export const MathBlock = function MathBlock({
    latex,
    id,
    className = "",
}) {
    const result = useMemo(() => {
        if (!latex) return null;
        const clean = stripMathDelimiters(latex);
        if (!clean) return null;
        return renderToHtml(clean, true);
    }, [latex]);

    if (!result) return null;

    if (result.error) {
        return (
            <div
                className={"my-6 rounded-2xl px-4 sm:px-8 py-6 border " + className}
                style={{
                    background: "var(--lab-katex-bg, var(--lab-panel2))",
                    borderColor: "var(--lab-line2)",
                }}
            >
                <span style={{ color: "var(--lab-bad)", fontFamily: "monospace", fontSize: "11px" }}>
                    {result.error}
                </span>
            </div>
        );
    }

    return (
        <div
            className={
                "relative my-6 rounded-3xl p-8 border overflow-hidden text-center transition-all duration-500 " +
                className
            }
            style={{
                background: "var(--lab-katex-bg, var(--lab-panel2))",
                borderColor: "var(--lab-line2)",
            }}
            id={id != null ? `math-block-${id}` : undefined}
        >
            <div
                className="py-4"
                dangerouslySetInnerHTML={{ __html: result.html }}
            />
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   MathText — Inline math
   ═══════════════════════════════════════════════════════════════ */

const InlineMath = function InlineMath({ html, display }) {
    if (display) {
        return (
            <div
                className="my-3 overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    }
    return (
        <span
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

export const MathText = function MathText({ text, className = "" }) {
    const segments = useMemo(() => tokenizeMath(text ?? ""), [text]);
    if (!text) return null;

    return (
        <span className={className}>
            {segments.map((seg, idx) => {
                if (seg.kind === "text") return <span key={idx}>{seg.value}</span>;
                const result = renderToHtml(seg.value, seg.display);
                if (result.error) {
                    return <code key={idx} style={{ color: "var(--lab-bad)" }}>{seg.value}</code>;
                }
                return (
                    <InlineMath
                        key={idx}
                        html={result.html}
                        display={seg.display}
                    />
                );
            })}
        </span>
    );
};
