import { useState, useEffect, useCallback } from "react";
import { safeJsonParse, genId } from "../utils/common";

const HISTORY_KEY = "phd_betting_history_v1";

/**
 * Hook for managing the betting history.
 */
export function useHistory() {
    const [history, setHistory] = useState(() => {
        const raw = localStorage.getItem(HISTORY_KEY);
        const parsed = safeJsonParse(raw || "");
        return Array.isArray(parsed) ? parsed : [];
    });

    // Persist History
    useEffect(() => {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch {
            // ignore
        }
    }, [history]);

    /**
     * Add analysis results to history.
     * @param {object|object[]} analysisResults 
     */
    const handleAddToHistory = useCallback(
        (analysisResults) => {
            const inputs = Array.isArray(analysisResults) ? analysisResults : (analysisResults ? [analysisResults] : []);
            const newEntries = [];
            const timestamp = new Date().toISOString();

            inputs.forEach((result) => {
                const matches = Array.isArray(result?.strategies) ? result.strategies : [result];

                matches.forEach((match) => {
                    if (!match) return;

                    const recs = Array.isArray(match.recommendations) ? match.recommendations : [];
                    const matchId = match.matchId || match.match_id || genId();

                    newEntries.push({
                        id: matchId,
                        timestamp,
                        matchLabel: match.matchLabel || match.selection || "Unknown Match",
                        sport: match.sport || "UNKNOWN",
                        recommendations: recs,
                        bets: recs.map((r) => ({
                            ...r,
                            id: genId(),
                            status: "PENDING",
                            actual_stake: r?.stake_size ?? "",
                            actual_odds: r?.odds ?? "",
                            pnl: 0,
                            notes: "",
                        })),
                        summary: match.summary_note || match.match_analysis?.summary || "",
                        match_analysis: match.match_analysis,
                        confidence: match.confidence,
                        formula_selection: match.formula_selection
                    });
                });
            });

            setHistory((prev) => {
                const seen = new Set(prev.map(p => p.id));
                const uniqueNew = newEntries.filter(e => !seen.has(e.id));
                return [...uniqueNew, ...prev];
            });
        },
        []
    );

    const handleUpdateHistoryItem = useCallback((matchId, betId, updates) => {
        setHistory((prev) =>
            prev.map((match) => {
                if (match.id !== matchId) return match;
                const updatedBets = (match.bets || []).map((bet) => (bet.id === betId ? { ...bet, ...updates } : bet));
                return { ...match, bets: updatedBets };
            })
        );
    }, []);

    const handleDeleteHistoryItem = useCallback((matchId) => {
        if (window.confirm("Are you sure you want to delete this entire match event and all its bets?")) {
            setHistory((prev) => prev.filter((m) => m.id !== matchId));
        }
    }, []);

    const handleDeleteBet = useCallback((matchId, betId) => {
        if (!window.confirm("Delete this specific bet?")) return;

        setHistory((prev) =>
            prev
                .map((match) => {
                    if (match.id !== matchId) return match;
                    const newBets = (match.bets || []).filter((b) => b.id !== betId);
                    return { ...match, bets: newBets };
                })
                .filter((match) => (match.bets?.length || 0) > 0)
        );
    }, []);

    const handleClearHistory = useCallback(() => {
        if (window.confirm("Are you sure you want to delete ALL betting history? This cannot be undone.")) {
            setHistory([]);
        }
    }, []);

    return {
        history,
        setHistory,
        handleAddToHistory,
        handleUpdateHistoryItem,
        handleDeleteHistoryItem,
        handleDeleteBet,
        handleClearHistory,
    };
}
