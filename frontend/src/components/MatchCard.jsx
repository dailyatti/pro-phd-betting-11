import React, { useMemo, useRef } from "react";
import clsx from "clsx";
import { XCircle, CloudLightning, PlusCircle } from "lucide-react";

const safeArr = (x) => (Array.isArray(x) ? x : []);
const isFn = (f) => typeof f === "function";

// Tailwind purge-safe maps (NO dynamic bg-${...})
const COLOR_BG_500 = {
  cyan: "bg-cyan-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
};

const MatchCard = ({
  group,
  darkMode = true,
  dragActiveState,
  onRemoveImage,
  onUpdateMatchLabel,
  onUpdateSport,
  onDeleteGroup,
  onPreviewImage,
  onAddImageToGroup,
  onSetActiveUploadTarget,
}) => {
  const groupId = group?.id ?? "unknown-group";
  const images = safeArr(group?.images);
  const topImages = useMemo(() => images.slice(0, 4), [images]);

  const fileInputRef = useRef(null);

  const isDropTarget = dragActiveState === groupId || dragActiveState === `plus-${groupId}`;
  const isPlusDrop = dragActiveState === `plus-${groupId}`;

  // If you later want per-sport color, change this safely:
  const glowColor = "cyan";
  const glowBg = COLOR_BG_500[glowColor] || "bg-cyan-500";

  const handlePreview = (url) => {
    if (!url) return;
    if (isFn(onPreviewImage)) onPreviewImage(url);
  };

  const handleRemoveImage = (imgId, e) => {
    e?.stopPropagation?.();
    if (isFn(onRemoveImage)) onRemoveImage(groupId, imgId);
  };

  const handleDeleteGroup = (e) => {
    e?.stopPropagation?.();
    if (isFn(onDeleteGroup)) onDeleteGroup(groupId);
  };

  const openFilePicker = (e) => {
    e?.stopPropagation?.();
    if (isFn(onSetActiveUploadTarget)) onSetActiveUploadTarget(groupId);
    fileInputRef.current?.click?.();
  };

  const handleFiles = (e) => {
    const files = Array.from(e?.target?.files || []);
    if (files.length && isFn(onAddImageToGroup)) {
      files.forEach((f) => onAddImageToGroup(groupId, f));
    }
    // allow same file reselect
    if (e?.target) e.target.value = "";
  };

  return (
    <div
      className={clsx(
        "relative group rounded-2xl border transition-all duration-300 overflow-visible",
        isDropTarget
          ? darkMode
            ? "border-cyan-500 bg-cyan-500/10 scale-[1.01]"
            : "border-amber-400 bg-amber-400/10 scale-[1.01]"
          : darkMode
            ? "bg-panel border-subtle hover:border-strong hover:bg-black"
            : "bg-panel border-subtle hover:border-strong"
      )}
      data-group-id={groupId}
    >
      {/* Background Glow (purge-safe) */}
      <div
        className={clsx(
          "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none",
          glowBg
        )}
      />

      {/* Drag Overlay */}
      {isDropTarget && (
        <div
          className={clsx(
            "absolute inset-0 z-40 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-dashed animate-pulse pointer-events-none",
            darkMode ? "bg-cyan-950/80 border-cyan-500" : "bg-amber-100/90 border-amber-500"
          )}
          aria-hidden="true"
        >
          <span
            className={clsx(
              "font-bold text-lg tracking-wider flex items-center gap-2",
              darkMode ? "text-cyan-300" : "text-amber-700"
            )}
          >
            <CloudLightning size={24} />
            ADD TO INTELLIGENCE
          </span>
        </div>
      )}

      <div className="p-5 flex flex-col sm:flex-row gap-6">
        {/* Left: Thumbnail Grid */}
        <div className="flex flex-wrap gap-2 py-2 relative isolate">
          {topImages.map((img, idx) => {
            const imgId = img?.id ?? `${groupId}-img-${idx}`;
            const url = img?.url;

            return (
              <div
                key={imgId}
                className="group/thumb relative w-24 h-16 flex-shrink-0 transition-all duration-300 hover:scale-105 hover:z-10 cursor-pointer shadow-sm hover:shadow-md rounded-lg bg-black/50 overflow-hidden border border-subtle/30"
                onClick={() => handlePreview(url)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handlePreview(url);
                }}
                aria-label={`Preview image ${idx + 1}`}
              >
                <img src={url || ""} alt="" className="w-full h-full object-contain" loading="lazy" />

                <button
                  type="button"
                  onClick={(e) => handleRemoveImage(imgId, e)}
                  className="absolute top-1 right-1 bg-rose-500/90 text-white rounded-full p-1 shadow-sm opacity-0 group-hover/thumb:opacity-100 transition-all hover:bg-rose-600 z-20"
                  aria-label="Remove image"
                >
                  <XCircle size={12} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add Button / Mini Dropzone */}
        {images.length < 4 && (
          <div
            className={clsx(
              "w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative z-0 ml-4 group/add",
              isPlusDrop
                ? "border-cyan-500 bg-cyan-500/10 scale-105"
                : "border-subtle text-tertiary hover:border-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/5 bg-subtle/30"
            )}
            onMouseEnter={() => isFn(onSetActiveUploadTarget) && onSetActiveUploadTarget(groupId)}
            onClick={openFilePicker}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") openFilePicker(e);
            }}
            aria-label="Add images to group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFiles}
            />
            <PlusCircle size={24} className="transition-transform group-hover/add:scale-110 mb-1" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Add</span>
          </div>
        )}

        {/* Right: Metadata */}
        <div className="flex-1 space-y-3 pt-1 min-w-0">
          <div className="space-y-1">
            <input
              type="text"
              value={group?.matchLabel ?? ""}
              onChange={(e) => isFn(onUpdateMatchLabel) && onUpdateMatchLabel(groupId, e.target.value)}
              className={clsx(
                "w-full bg-transparent text-lg font-black tracking-tight placeholder-tertiary focus:outline-none border-b transition-colors min-w-0 text-primary",
                darkMode ? "border-transparent focus:border-cyan-500/50" : "border-transparent focus:border-amber-400/50"
              )}
              placeholder="Match Label..."
              aria-label="Match label"
            />

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={group?.sport ?? ""}
                onChange={(e) => isFn(onUpdateSport) && onUpdateSport(groupId, e.target.value)}
                className={clsx(
                  "text-xs px-2 py-1 rounded-lg border font-mono uppercase tracking-wide outline-none w-28 text-center",
                  darkMode
                    ? "bg-black/30 border-subtle text-cyan-400 focus:border-cyan-500"
                    : "bg-amber-50 border-subtle text-amber-700 focus:border-amber-400"
                )}
                placeholder="SPORT"
                aria-label="Sport"
              />

              {group?.autoDetected ? (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded text-emerald-500 bg-emerald-500/10">
                  <CloudLightning size={10} /> AI Detected
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 text-muted">Manual Override</span>
              )}

              {/* ODDS PREVIEW - Extended for Multi-Market */}
              {group?.preview_odds && (
                <div className="flex flex-col gap-2 mt-2 w-full">
                  {/* 1X2 Row */}
                  {(group.preview_odds.homeWin || group.preview_odds.home || group.preview_odds.homeML) && (
                    <div className={clsx(
                      "flex items-center justify-between rounded-lg px-3 py-2 border w-full shadow-sm",
                      darkMode ? "bg-black/60 border-slate-700/50" : "bg-slate-50 border-slate-200"
                    )}>
                      <span className={clsx("text-[10px] font-bold uppercase tracking-wider", darkMode ? "text-slate-400" : "text-slate-500")}>1X2</span>
                      <div className="flex gap-3 font-mono text-xs font-semibold">
                        <span className={darkMode ? "text-cyan-400" : "text-cyan-700"}>{group.preview_odds.homeWin || group.preview_odds.home || group.preview_odds.homeML}</span>
                        <span className={darkMode ? "text-emerald-500" : "text-slate-400"}>/</span>
                        <span className={darkMode ? "text-indigo-400" : "text-indigo-600"}>{group.preview_odds.draw || group.preview_odds.drawML || "-"}</span>
                        <span className={darkMode ? "text-emerald-500" : "text-slate-400"}>/</span>
                        <span className={darkMode ? "text-rose-400" : "text-rose-600"}>{group.preview_odds.awayWin || group.preview_odds.away || group.preview_odds.awayML}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 w-full">
                    {/* O/U Badge */}
                    {(group.preview_odds.totalOver || group.preview_odds.over || group.preview_odds.total_over) && (
                      <div className={clsx(
                        "flex flex-1 items-center justify-between rounded-lg px-2.5 py-1.5 border shadow-sm",
                        darkMode ? "bg-black/60 border-slate-700/50" : "bg-blue-50 border-blue-100"
                      )}>
                        <span className={clsx("text-[9px] font-bold uppercase tracking-tight", darkMode ? "text-blue-400" : "text-blue-600")}>
                          O/U {group.preview_odds.totalLine || group.preview_odds.line || '2.5'}
                        </span>
                        <div className="flex gap-2 font-mono text-[11px] font-medium">
                          <span className={darkMode ? "text-blue-200" : "text-blue-700"}>O:{group.preview_odds.totalOver || group.preview_odds.over}</span>
                          <span className={darkMode ? "text-slate-600" : "text-slate-400"}>|</span>
                          <span className={darkMode ? "text-orange-200/80" : "text-orange-600"}>U:{group.preview_odds.totalUnder || group.preview_odds.under || '-'}</span>
                        </div>
                      </div>
                    )}

                    {/* BTTS Badge */}
                    {(group.preview_odds.bttsYes || group.preview_odds.btts_yes) && (
                      <div className={clsx(
                        "flex flex-1 items-center justify-between rounded-lg px-2.5 py-1.5 border shadow-sm",
                        darkMode ? "bg-black/60 border-slate-700/50" : "bg-emerald-50 border-emerald-100"
                      )}>
                        <span className={clsx("text-[9px] font-bold uppercase tracking-tight", darkMode ? "text-emerald-400" : "text-emerald-600")}>BTTS</span>
                        <div className="flex gap-2 font-mono text-[11px] font-medium">
                          <span className={darkMode ? "text-emerald-200" : "text-emerald-700"}>Y:{group.preview_odds.bttsYes || group.preview_odds.btts_yes}</span>
                          <span className={darkMode ? "text-slate-600" : "text-slate-400"}>|</span>
                          <span className={darkMode ? "text-rose-200/80" : "text-rose-600"}>N:{group.preview_odds.bttsNo || group.preview_odds.btts_no || '-'}</span>
                        </div>
                      </div>
                    )}

                    {/* Spread/Handicap Badge */}
                    {(group.preview_odds.spreadLine || group.preview_odds.homeSpread || group.preview_odds.awaySpread) && (
                      <div className={clsx(
                        "flex flex-1 items-center justify-between rounded-lg px-2.5 py-1.5 border shadow-sm",
                        darkMode ? "bg-black/60 border-slate-700/50" : "bg-amber-50 border-amber-100"
                      )}>
                        <span className={clsx("text-[9px] font-bold uppercase tracking-tight", darkMode ? "text-amber-400" : "text-amber-600")}>
                          HDP {group.preview_odds.spreadLine || ''}
                        </span>
                        <div className="flex gap-2 font-mono text-[11px] font-medium">
                          <span className={darkMode ? "text-amber-200" : "text-amber-700"}>H:{group.preview_odds.homeSpread}</span>
                          <span className={darkMode ? "text-slate-600" : "text-slate-400"}>|</span>
                          <span className={darkMode ? "text-amber-200/80" : "text-amber-600"}>A:{group.preview_odds.awaySpread}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <button
          type="button"
          onClick={handleDeleteGroup}
          className={clsx(
            "self-start sm:self-center p-2 transition-colors rounded-lg",
            darkMode ? "text-slate-600 hover:text-rose-500 hover:bg-rose-500/10" : "text-slate-400 hover:text-rose-500 hover:bg-rose-100"
          )}
          aria-label="Delete group"
        >
          <XCircle size={20} />
        </button>
      </div>
    </div>
  );
};

export default MatchCard;