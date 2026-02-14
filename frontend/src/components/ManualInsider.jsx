import React from "react";
import PropTypes from "prop-types";
import { CloudLightning, CheckCircle, Copy, Search } from "lucide-react";

const ManualInsider = ({
  manualInsiderMode,
  setManualInsiderMode,
  manualIntelText,
  setManualIntelText,
  hasQueue,
  handleCopyPrompt,
  copySuccess,
  handleCopyAndNavigate,
  perplexityCopySuccess,
  grokCopySuccess,
  darkMode,
}) => {
  const intelOk = (manualIntelText || "").trim().length > 10;

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setManualInsiderMode((v) => !v)}
        aria-pressed={manualInsiderMode}
        aria-expanded={manualInsiderMode}
        className={clsxButton(
          "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
          manualInsiderMode
            ? "bg-purple-900/10 border-purple-500/30"
            : darkMode
              ? "bg-black/20 border-subtle"
              : "bg-panel border-subtle"
        )}
      >
        <div className="flex items-center gap-3">
          <CloudLightning
            size={16}
            className={manualInsiderMode ? "text-purple-400" : darkMode ? "text-slate-500" : "text-amber-500"}
          />
          <span
            className={clsxButton(
              "text-sm font-bold uppercase tracking-wider",
              manualInsiderMode ? "text-purple-400" : "text-secondary"
            )}
          >
            Manual Insider Intel
          </span>
        </div>

        <div
          className={clsxButton(
            "w-8 h-4 rounded-full relative transition-colors",
            manualInsiderMode ? "bg-purple-500" : darkMode ? "bg-slate-700" : "bg-amber-300"
          )}
        >
          <div
            className={clsxButton(
              "absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow",
              manualInsiderMode ? "translate-x-4" : ""
            )}
          />
        </div>
      </button>

      {manualInsiderMode && (
        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col gap-3">
            {/* Gen-5 Prompt Button */}
            <button
              type="button"
              onClick={handleCopyPrompt}
              disabled={!hasQueue}
              className={clsxButton(
                "w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all",
                darkMode
                  ? "bg-black/30 hover:bg-black/50 border-subtle text-purple-400"
                  : "bg-panel hover:bg-elevated border-subtle text-purple-600",
                !hasQueue ? "opacity-60 cursor-not-allowed" : ""
              )}
            >
              {copySuccess ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copySuccess ? "Gen-5 Prompt Copied!" : "Copy Gen-5 Prompt"}
            </button>

            {/* Separator with Label */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-subtle" />
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-tertiary">
                FOR SEARCH TOOLS
              </span>
              <div className="h-px flex-1 bg-subtle" />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleCopyAndNavigate("perplexity")}
                disabled={!hasQueue}
                className={clsxButton(
                  "flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all",
                  darkMode
                    ? "bg-sky-950/30 hover:bg-sky-900/40 border-sky-900/50 text-sky-400"
                    : "bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-600",
                  !hasQueue ? "opacity-60 cursor-not-allowed" : ""
                )}
              >
                {perplexityCopySuccess ? <CheckCircle size={14} className="text-emerald-500" /> : <Search size={14} />}
                {perplexityCopySuccess ? "Copied & Opened!" : "Perplexity"}
              </button>

              <button
                type="button"
                onClick={() => handleCopyAndNavigate("grok")}
                disabled={!hasQueue}
                className={clsxButton(
                  "flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all",
                  darkMode
                    ? "bg-black/30 hover:bg-black/50 border-subtle text-primary"
                    : "bg-panel hover:bg-elevated border-subtle text-primary",
                  !hasQueue ? "opacity-60 cursor-not-allowed" : ""
                )}
              >
                {grokCopySuccess ? (
                  <CheckCircle size={14} className="text-emerald-500" />
                ) : (
                  <div className="text-[10px] font-black">X</div>
                )}
                {grokCopySuccess ? "Copied & Opened!" : "Grok"}
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={manualIntelText}
              onChange={(e) => setManualIntelText(e.target.value)}
              placeholder="Paste leaked intel here..."
              className={clsxButton(
                "w-full h-24 rounded-xl border p-3 text-xs font-mono focus:border-purple-500 focus:outline-none resize-none transition-colors",
                darkMode
                  ? "bg-black/40 border-subtle text-primary placeholder:text-tertiary"
                  : "bg-panel border-subtle text-primary placeholder:text-tertiary"
              )}
            />
            {manualIntelText.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setManualIntelText("")}
                className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {intelOk && (
            <div className="flex justify-end animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
                <CheckCircle size={10} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Intel Accepted</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// tiny helper to avoid importing clsx here
function clsxButton(...parts) {
  return parts.filter(Boolean).join(" ");
}

ManualInsider.propTypes = {
  manualInsiderMode: PropTypes.bool.isRequired,
  setManualInsiderMode: PropTypes.func.isRequired,
  manualIntelText: PropTypes.string.isRequired,
  setManualIntelText: PropTypes.func.isRequired,
  hasQueue: PropTypes.bool.isRequired,
  handleCopyPrompt: PropTypes.func.isRequired,
  copySuccess: PropTypes.bool.isRequired,
  handleCopyAndNavigate: PropTypes.func.isRequired,
  perplexityCopySuccess: PropTypes.bool.isRequired,
  grokCopySuccess: PropTypes.bool.isRequired,
  darkMode: PropTypes.bool.isRequired,
};

export default ManualInsider;