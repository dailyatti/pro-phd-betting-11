import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    useDeferredValue,
} from "react";
import {
    Sigma,
    BookOpen,
    Sun,
    Moon,
    Download,
    Search,
    X,
    ShieldCheck,
    Copy,
    FileDown,
    Pin,
    PinOff,
} from "lucide-react";
import clsx from "clsx";

// Internal modules
import { useLabStyles } from "./styles";
import {
    isBrowser,
    safeBrowser,
    copyToClipboard,
    stripDisplayDelims,
    getMixFn,
} from "./utils";
import { FORMULAS, SPORT_META, TAG_LABELS } from "./data";

// UI Components
import Toast from "./components/Toast";
import FormulaCard from "./components/FormulaCard";

/**
 * PhD Betting Math Deck
 * A modular, high-fidelity mathematical research lab for sports betting.
 */
export default function PhDBettingMathDeck({ onBack }) {
    useLabStyles();

    // SSR Hydration Fix: Ensure component is mounted before reading browser APIs
    const [mounted, setMounted] = useState(false);

    // --- Theme State ---
    const [theme, setTheme] = useState("dark"); // default for SSR

    // --- Sport/Module State ---
    const [sport, setSport] = useState("overview");

    // --- Sticky Header State ---
    const [stickyHeader, setStickyHeader] = useState(() => {
        return safeBrowser(() => localStorage.getItem("lab-sticky-header") !== "false", true);
    });

    // --- Filter State ---
    const [query, setQuery] = useState("");
    const [tag, setTag] = useState("all");

    // Smooth search when lots of formulas
    const deferredQuery = useDeferredValue(query);

    // --- UI Feedback ---
    const [toast, setToast] = useState({
        kind: "info",
        text: "",
    });
    const toastTimerRef = useRef(null);

    // Toast: safe setter + auto-clear
    const setToastSafe = useCallback((kind, text) => {
        setToast({ kind, text });
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => {
            setToast({ kind: "info", text: "" });
            toastTimerRef.current = null;
        }, 2400);
    }, []);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                safeBrowser(() => window.clearTimeout(toastTimerRef.current));
                toastTimerRef.current = null;
            }
        };
    }, []);

    // Initialize browser-dependent state after mount
    useEffect(() => {
        setMounted(true);

        const savedTheme = safeBrowser(() => localStorage.getItem("lab-theme"), null);
        if (savedTheme === "light" || savedTheme === "dark") {
            setTheme(savedTheme);
        } else {
            const prefersLight = safeBrowser(
                () => window.matchMedia?.("(prefers-color-scheme: light)").matches,
                false
            );
            setTheme(prefersLight ? "light" : "dark");
        }

        const savedSport = safeBrowser(() => localStorage.getItem("lab-sport"), null);
        if (savedSport && SPORT_META[savedSport]) {
            setSport(savedSport);
        }
    }, []);

    // Persist sticky header preference
    useEffect(() => {
        if (!mounted) return;
        safeBrowser(() => localStorage.setItem("lab-sticky-header", String(stickyHeader)));
    }, [stickyHeader, mounted]);

    // Sync theme to DOM + storage
    useEffect(() => {
        if (!mounted) return;

        safeBrowser(() => localStorage.setItem("lab-theme", theme));
        safeBrowser(() => {
            document.documentElement.setAttribute("data-lab-theme", theme);
            document.documentElement.classList.toggle("dark", theme === "dark");
        });
    }, [theme, mounted]);

    // Sync sport selection + scroll
    useEffect(() => {
        if (!mounted) return;

        safeBrowser(() => localStorage.setItem("lab-sport", sport));
        safeBrowser(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    }, [sport, mounted]);

    // Color mix detection
    const supportsColorMix = useMemo(() => {
        return safeBrowser(
            () => CSS?.supports?.("color", "color-mix(in srgb, #fff 50%, transparent)"),
            false
        );
    }, []);

    // Unified mix function
    const mix = useMemo(() => getMixFn(supportsColorMix), [supportsColorMix]);

    // Filter logic
    const visibleFormulas = useMemo(() => {
        const q = deferredQuery.trim().toLowerCase();

        return FORMULAS.filter((it) => {
            if (it.sport !== sport) return false;
            if (tag !== "all" && !(it.tags || []).includes(tag)) return false;
            if (!q) return true;

            const hay = [
                it.id,
                it.title,
                it.explanation,
                ...(it.badges || []),
                ...(it.tags || []),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return hay.includes(q);
        });
    }, [deferredQuery, sport, tag]);

    const availableTags = useMemo(() => {
        const set = new Set();
        for (const it of FORMULAS) {
            if (it.sport !== sport) continue;
            (it.tags || []).forEach((t) => set.add(t));
        }
        return ["all", ...Array.from(set).sort()];
    }, [sport]);

    const toggleTheme = useCallback(() => {
        setTheme((t) => (t === "dark" ? "light" : "dark"));
    }, []);

    const buildExportText = useCallback(() => {
        const lines = [
            `PhD Betting Research Lab — Full Protocol Export`,
            `Timestamp: ${new Date().toISOString()}`,
            `Total formulas: ${FORMULAS.length}`,
            ``,
            `============================================================`,
            ``,
        ];

        const sportOrder = Object.keys(SPORT_META);
        for (const sp of sportOrder) {
            const meta = SPORT_META[sp];
            const moduleFormulas = FORMULAS.filter((f) => f.sport === sp);
            if (moduleFormulas.length === 0) continue;

            lines.push(`████ ${meta.label.toUpperCase()} (${moduleFormulas.length} formulas) ████`);
            lines.push(`${meta.description}`);
            lines.push(``);

            for (const it of moduleFormulas) {
                lines.push(`== ${it.id} :: ${it.title} ==`);
                lines.push(stripDisplayDelims(it.latex));
                lines.push(``);
                lines.push(`Meaning: ${String(it.explanation ?? "")}`);

                if (it.notes?.length) {
                    lines.push(`Notes:`);
                    for (const n of it.notes) lines.push(`- ${n}`);
                }

                if (it.usage) {
                    lines.push(`Practical Usage: ${it.usage}`);
                }

                if (it.tags?.length) lines.push(`Tags: ${it.tags.join(", ")}`);

                if (it.exampleTitle) {
                    lines.push(``);
                    lines.push(`WORKED EXAMPLE: ${it.exampleTitle}`);
                    lines.push(`Context: ${it.exampleContext}`);
                    lines.push(`Inputs:`);
                    for (const input of it.exampleInputs) {
                        lines.push(
                            `  - ${input.name}: ${input.value}${input.note ? ` (${input.note})` : ""}`
                        );
                    }
                    lines.push(`Calculation: ${stripDisplayDelims(it.exampleLatex)}`);
                    lines.push(`Steps:`);
                    for (let i = 0; i < it.exampleSteps.length; i++) {
                        lines.push(`  ${i + 1}. ${it.exampleSteps[i]}`);
                    }
                    lines.push(`Interpretation: ${it.exampleInterpretation}`);
                }

                if (it.derivation) {
                    lines.push(``);
                    lines.push(`DERIVATION:`);
                    lines.push(stripDisplayDelims(it.derivation));
                }

                lines.push(``);
                lines.push(`------------------------------------------------------------`);
                lines.push(``);
            }

            lines.push(`============================================================`);
            lines.push(``);
        }

        return lines.join("\n");
    }, []);

    const exportProtocol = useCallback(async () => {
        const text = buildExportText();
        const ok = await copyToClipboard(text);
        if (ok) setToastSafe("ok", `ALL ${FORMULAS.length} FORMULAS COPIED TO CLIPBOARD`);
        else setToastSafe("error", "CLIPBOARD BLOCKED — CHECK PERMISSIONS");
    }, [buildExportText, setToastSafe]);

    const saveTxtFile = useCallback(() => {
        const text = buildExportText();
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `phd-betting-lab-export-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setToastSafe("ok", `SAVED ${FORMULAS.length} FORMULAS AS TXT FILE`);
    }, [buildExportText, setToastSafe]);

    // SSR Safety: Render nothing until mounted to avoid mismatch
    if (!mounted) return null;

    const activeMeta = SPORT_META[sport];
    const activeColorVar = activeMeta?.colorVar ?? "--lab-accent";

    return (
        <div
            className={clsx("lab-root antialiased")}
            data-lab-theme={theme}
            style={{ background: "var(--lab-bg)", color: "var(--lab-fg)" }}
        >
            {/* Ambient background */}
            <div
                className="pointer-events-none fixed inset-0 -z-10 opacity-35 transition-colors duration-1000"
                style={{
                    background: `radial-gradient(circle at 50% 0%, ${mix(
                        `var(${activeColorVar})`,
                        16,
                        "transparent"
                    )}, transparent 70%)`,
                }}
            />
            <div className="pointer-events-none fixed inset-0 -z-10 opacity-20">
                <div
                    className="absolute top-0 left-1/4 h-[520px] w-[520px] blur-[160px] transition-colors duration-1000"
                    style={{ background: `var(${activeColorVar})` }}
                />
            </div>

            <Toast kind={toast.kind} text={toast.text} mix={mix} />

            {/* Topbar — sticky or static based on user preference */}
            <div className={clsx(stickyHeader ? "sticky top-0 z-40" : "relative z-40")}>
                <div
                    className="mx-auto max-w-6xl px-4 sm:px-6 pt-4"
                    style={{ backdropFilter: "blur(18px)" }}
                >
                    <div
                        className="rounded-[1.75rem] border shadow-xl"
                        style={{
                            background: mix("var(--lab-panel2)", 75, "transparent"),
                            borderColor: "var(--lab-line)",
                        }}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="lab-focus-ring group flex items-center gap-3 rounded-2xl border px-5 py-3 text-[11px] font-black tracking-[0.28em] uppercase transition-all hover:bg-black/5 active:scale-95"
                                    style={{
                                        borderColor: "var(--lab-line)",
                                        background: "var(--lab-panel)",
                                        color: "var(--lab-muted2)",
                                    }}
                                    aria-label="Exit Research Lab"
                                >
                                    <Sigma className="h-4 w-4 transition-transform group-hover:rotate-12 group-hover:text-[var(--lab-accent)]" />
                                    <span className="group-hover:text-[var(--lab-fg)] transition-colors">
                                        Exit
                                    </span>
                                </button>

                                <div className="hidden md:flex items-center gap-3">
                                    <div
                                        className="flex h-11 w-11 items-center justify-center rounded-2xl border"
                                        style={{
                                            background: mix(`var(${activeColorVar})`, 10, "transparent"),
                                            borderColor: "var(--lab-line)",
                                            color: `var(${activeColorVar})`,
                                        }}
                                        aria-hidden="true"
                                    >
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-[12px] font-black uppercase tracking-[0.22em]">
                                            PhD Betting Lab
                                        </div>
                                        <div
                                            className="text-[10px] font-black uppercase tracking-[0.26em]"
                                            style={{ color: "var(--lab-muted2)" }}
                                        >
                                            v6.0 • PhD Research Lab
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                    type="button"
                                    onClick={toggleTheme}
                                    className="lab-focus-ring flex items-center gap-2 rounded-2xl border px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-black/5 active:scale-95"
                                    style={{
                                        borderColor: "var(--lab-line2)",
                                        background: "var(--lab-panel)",
                                        color: "var(--lab-fg)",
                                    }}
                                    aria-label="Toggle theme"
                                >
                                    {theme === "dark" ? (
                                        <Sun className="h-4 w-4 text-[var(--lab-warn)]" />
                                    ) : (
                                        <Moon className="h-4 w-4 text-[var(--lab-accent)]" />
                                    )}
                                    {theme === "dark" ? "Light" : "Dark"}
                                </button>

                                <button
                                    type="button"
                                    onClick={exportProtocol}
                                    className="lab-focus-ring flex items-center gap-2 rounded-2xl border px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:brightness-110 active:scale-95"
                                    style={{
                                        borderColor: mix(`var(${activeColorVar})`, 55, "transparent"),
                                        background: mix(`var(${activeColorVar})`, 18, "transparent"),
                                        color: `var(--lab-fg)`,
                                    }}
                                    aria-label="Copy all formulas to clipboard"
                                >
                                    <Copy className="h-4 w-4" />
                                    <span className="hidden sm:inline">Copy All</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={saveTxtFile}
                                    className="lab-focus-ring flex items-center gap-2 rounded-2xl border px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:brightness-110 active:scale-95"
                                    style={{
                                        borderColor: mix(`var(${activeColorVar})`, 55, "transparent"),
                                        background: mix(`var(${activeColorVar})`, 18, "transparent"),
                                        color: `var(--lab-fg)`,
                                    }}
                                    aria-label="Save all formulas as TXT file"
                                >
                                    <FileDown className="h-4 w-4" />
                                    <span className="hidden sm:inline">Save TXT</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStickyHeader((v) => !v)}
                                    className="lab-focus-ring flex items-center gap-2 rounded-2xl border px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:brightness-110 active:scale-95"
                                    style={{
                                        borderColor: stickyHeader
                                            ? mix("var(--lab-accent)", 55, "transparent")
                                            : "var(--lab-line2)",
                                        background: stickyHeader
                                            ? mix("var(--lab-accent)", 18, "transparent")
                                            : "var(--lab-panel)",
                                        color: stickyHeader ? "var(--lab-accent)" : "var(--lab-muted2)",
                                    }}
                                    aria-label={stickyHeader ? "Unpin header" : "Pin header"}
                                    title={stickyHeader ? "Header pinned — click to unpin" : "Header unpinned — click to pin"}
                                >
                                    {stickyHeader ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
                                    <span className="hidden sm:inline">{stickyHeader ? "Pinned" : "Unpin"}</span>
                                </button>

                                <div
                                    className="hidden lg:flex items-center gap-2 rounded-2xl border px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] select-none"
                                    style={{
                                        borderColor: mix("var(--lab-ok)", 40, "transparent"),
                                        background: mix("var(--lab-ok)", 12, "transparent"),
                                        color: "var(--lab-ok)",
                                    }}
                                    aria-label="Secure session"
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                    Secure
                                </div>
                            </div>
                        </div>

                        {/* Search + Tag row */}
                        <div className="px-5 pb-5" style={{ borderTop: "1px solid var(--lab-line)" }}>
                            <div className="flex flex-col md:flex-row md:items-center gap-3 pt-4">
                                <div className="flex-1">
                                    <div
                                        className="flex items-center gap-2 rounded-2xl border px-4 py-3"
                                        style={{
                                            borderColor: "var(--lab-line)",
                                            background: "var(--lab-panel)",
                                        }}
                                    >
                                        <Search className="h-4 w-4" style={{ color: "var(--lab-muted2)" }} />
                                        <input
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Search in current module (id/title/tags)..."
                                            className="w-full bg-transparent outline-none text-sm font-semibold"
                                            style={{ color: "var(--lab-fg)" }}
                                        />
                                        {query ? (
                                            <button
                                                type="button"
                                                onClick={() => setQuery("")}
                                                className="lab-focus-ring rounded-xl p-2"
                                                aria-label="Clear search"
                                                style={{
                                                    color: "var(--lab-muted2)",
                                                    border: "1px solid var(--lab-line)",
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div
                                        className="text-[10px] font-black uppercase tracking-[0.28em]"
                                        style={{ color: "var(--lab-muted2)" }}
                                    >
                                        Tag
                                    </div>
                                    <select
                                        className="lab-focus-ring rounded-2xl border px-4 py-3 text-sm font-bold cursor-pointer"
                                        style={{
                                            borderColor: "var(--lab-line2)",
                                        }}
                                        value={tag}
                                        onChange={(e) => setTag(e.target.value)}
                                        aria-label="Tag filter"
                                    >
                                        {availableTags.map((t) => (
                                            <option key={t} value={t}>
                                                {t === "all" ? "All tags" : TAG_LABELS[t] ?? t}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-4" />
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-28 pt-2">
                {/* Module Selector */}
                <div className="mb-10 flex flex-wrap gap-3 justify-center md:justify-start">
                    {Object.keys(SPORT_META).map((k) => {
                        const isActive = sport === k;
                        const meta = SPORT_META[k];
                        const isLight = theme === "light";

                        const activeBg = isLight
                            ? mix(`var(${meta.colorVar})`, 10, "#ffffff")
                            : mix(`var(${meta.colorVar})`, 10, "transparent");

                        const activeBorder = `var(${meta.colorVar})`;

                        return (
                            <button
                                type="button"
                                key={k}
                                onClick={() => {
                                    setSport(k);
                                    setQuery("");
                                    setTag("all");
                                }}
                                className={clsx(
                                    "lab-focus-ring group relative flex items-center gap-3 overflow-hidden rounded-2xl border-2 transition-all duration-300",
                                    "px-5 py-3 text-[14px] font-black tracking-widest",
                                    isActive ? "scale-[1.05] z-10" : "hover:-translate-y-0.5"
                                )}
                                style={{
                                    borderColor: isActive
                                        ? activeBorder
                                        : isLight
                                            ? "rgba(0,0,0,0.15)"
                                            : "rgba(255,255,255,0.22)",
                                    background: isActive ? activeBg : "var(--lab-panel2)",
                                    color: "var(--lab-fg)",
                                    boxShadow: isActive
                                        ? isLight
                                            ? `0 16px 28px -16px ${mix(
                                                `var(${meta.colorVar})`,
                                                45,
                                                "transparent"
                                            )}, inset 0 1px 0 rgba(255, 255, 255, 0.9)`
                                            : `0 0 30px -10px rgba(255,255,255,0.30), 0 18px 40px -26px rgba(0,0,0,0.65)`
                                        : "none",
                                }}
                            >
                                <span
                                    className={clsx(
                                        "relative z-10 transition-transform duration-500",
                                        isActive && "scale-110"
                                    )}
                                >
                                    {meta.icon}
                                </span>
                                <span className="relative z-10">{meta.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Hero */}
                <div className="mb-10 rounded-[2rem] border p-6 md:p-8 relative overflow-hidden lab-card group transition-all duration-700">
                    <div
                        className="absolute inset-0 opacity-20 transition-all duration-700 group-hover:opacity-30"
                        style={{
                            background: `radial-gradient(circle at top left, var(${activeColorVar}), transparent 70%),
linear-gradient(to bottom right, ${mix(`var(${activeColorVar})`, 10, "transparent")}, transparent)`,
                        }}
                    />
                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-10 text-center md:text-left">
                        <div className="flex-shrink-0">
                            <div
                                className="inline-flex items-center justify-center rounded-2xl p-4 shadow-xl backdrop-blur-2xl border"
                                style={{ background: "var(--lab-panel2)", borderColor: "var(--lab-line2)" }}
                            >
                                <span className="text-4xl leading-none select-none">
                                    {activeMeta?.icon ?? "🧪"}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-3 leading-none">
                                {activeMeta?.label ?? sport}
                            </h2>
                            <p
                                className="text-lg font-medium leading-relaxed max-w-3xl opacity-90"
                                style={{ color: "var(--lab-muted)" }}
                            >
                                {activeMeta?.description ?? ""}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Cards */}
                <div className="space-y-12">
                    {visibleFormulas.map((item) => (
                        <FormulaCard key={item.id} item={item} mix={mix} />
                    ))}

                    {visibleFormulas.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
                            <div className="text-6xl mb-4">🔭</div>
                            <div className="text-xl font-bold uppercase tracking-widest">No Formulas Found</div>
                            <div className="mt-2 text-sm font-semibold" style={{ color: "var(--lab-muted2)" }}>
                                Try clearing the search or tag filter.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}