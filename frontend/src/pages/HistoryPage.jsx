
import React, { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, Target, Activity, Trash2, Check, X, Filter } from 'lucide-react';
import clsx from 'clsx';
import { safeText, toNumber } from '../shared';
import PortfolioDoctor from '../components/History/PortfolioDoctor.jsx';

// Helper for formatting money
const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
};

// --- SUB-COMPONENTS (Defined BEFORE usage to avoid TDZ) ---

const KPICard = ({ label, value, subValue, icon: Icon, trend, darkMode }) => {
    const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-500';
    const iconBg = trend === 'up'
        ? (darkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200/60')
        : trend === 'down'
            ? (darkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200/60')
            : (darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200');
    return (
        <div className={clsx(
            "p-5 rounded-2xl border relative overflow-hidden transition-all duration-200",
            darkMode ? "bg-panel border-subtle hover:border-cyan-500/20" : "bg-panel border-subtle hover:border-slate-300 shadow-sm"
        )}>
            <div className="flex items-start justify-between mb-3">
                <div className={clsx("p-2.5 rounded-xl border", iconBg)}>
                    <Icon size={18} className={trendColor} />
                </div>
            </div>
            <div className={clsx("text-2xl font-black tracking-tight mb-1 text-primary")}>{value}</div>
            <h3 className={clsx("text-[10px] font-black uppercase tracking-[0.15em] mb-0.5 text-tertiary")}>{label}</h3>
            <p className={clsx("text-[10px] font-medium text-secondary")}>
                {subValue}
            </p>
        </div>
    );
};

const BetRow = ({ bet, darkMode, onUpdate, onDelete, initialBankroll }) => {
    // Calculate PnL for display
    let pnl = 0;
    // Normalized stake val
    let stakeVal = 0;
    let stakeStr = String(bet.actual_stake || bet.stake_size || '0');
    const displayStake = stakeStr;

    if (stakeStr.includes('%')) {
        const pct = parseFloat(stakeStr) || 0;
        stakeVal = (pct / 100) * initialBankroll;
    } else {
        const units = parseFloat(stakeStr) || 0;
        stakeVal = (units / 100) * initialBankroll;
    }

    if (bet.status === 'WIN') {
        pnl = stakeVal * (parseFloat(bet.actual_odds || bet.odds) - 1);
    } else if (bet.status === 'LOSS') {
        pnl = -stakeVal;
    }

    const pnlClass = pnl > 0
        ? (darkMode ? "text-emerald-400" : "text-emerald-600")
        : pnl < 0
            ? (darkMode ? "text-red-400" : "text-red-600")
            : (darkMode ? "text-slate-500" : "text-slate-400");

    return (
        <tr className={clsx("text-sm group", darkMode ? "hover:bg-slate-900/40" : "hover:bg-slate-50")}>
            <td className="p-4">
                <div className="font-bold mb-0.5 text-primary">
                    {bet.matchLabel}
                </div>
                <div className="text-xs text-tertiary">
                    {new Date(bet.matchTimestamp).toLocaleDateString()} • {bet.sport}
                </div>
            </td>
            <td className="p-4">
                <div className={clsx("font-bold", darkMode ? "text-cyan-300" : "text-amber-700")}>
                    {safeText(bet.selection, 'Selection')}
                </div>
                <div className="text-[10px] text-tertiary">
                    {safeText(bet.market, 'Market')}
                </div>
            </td>
            <td className="p-4 text-right font-mono">
                {Number(bet.actual_odds || bet.odds).toFixed(2)}
            </td>
            <td className="p-4 text-right font-mono">
                {displayStake}
            </td>
            <td className="p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={() => onUpdate({ status: 'WIN' })}
                        className={clsx(
                            "p-1.5 rounded-lg transition-all border",
                            bet.status === 'WIN'
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20"
                                : (darkMode ? "bg-black/30 border-slate-700 text-slate-600 hover:text-emerald-400 hover:border-emerald-500/40" : "bg-white border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-300")
                        )}
                        title="Mark as WIN"
                    >
                        <Check size={14} strokeWidth={3} />
                    </button>
                    <button
                        onClick={() => onUpdate({ status: 'LOSS' })}
                        className={clsx(
                            "p-1.5 rounded-lg transition-all border",
                            bet.status === 'LOSS'
                                ? "bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/20"
                                : (darkMode ? "bg-black/30 border-slate-700 text-slate-600 hover:text-red-400 hover:border-red-500/40" : "bg-white border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-300")
                        )}
                        title="Mark as LOSS"
                    >
                        <X size={14} strokeWidth={3} />
                    </button>
                </div>
            </td>
            <td className={clsx("p-4 text-right font-mono font-bold", pnlClass)}>
                {bet.status === 'PENDING' ? '—' : (pnl > 0 ? '+' : '') + formatMoney(pnl)}
            </td>
            <td className="p-4 text-right">
                <button
                    onClick={onDelete}
                    className={clsx("p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity", darkMode ? "text-slate-600 hover:text-red-400" : "text-slate-400 hover:text-red-600")}
                    title="Delete Record"
                >
                    <Trash2 size={16} />
                </button>
            </td>
        </tr>
    );
};

// --- MAIN COMPONENT ---

const HistoryPage = ({
    darkMode,
    history,
    onUpdateBet,
    onDeleteMatch,
    onDeleteBet,
    onClearHistory,
    bankroll: initialBankroll,
    apiKeys,
    modelSettings
}) => {
    const [filter, setFilter] = useState('ALL'); // ALL, PENDING, SETTLED, WIN, LOSS

    // --- AGGREGATE STATS ---
    const stats = useMemo(() => {
        let totalStaked = 0;
        let totalReturn = 0;
        let totalProfit = 0;
        let winCount = 0;
        let lossCount = 0;
        let pendingCount = 0;
        let betCount = 0;

        // Iterate all matches
        for (const match of history) {
            for (const bet of match.bets) {
                // Only count bets that are not avoided
                if (String(bet.recommendation_level).includes('AVOID')) continue;

                // Parse stake (e.g., "1 unit", "2 units", "0.5%")
                let stakeVal = 0;
                let stakeStr = String(bet.actual_stake || bet.stake_size || '0');
                if (stakeStr.includes('%')) {
                    const pct = parseFloat(stakeStr) || 0;
                    stakeVal = (pct / 100) * initialBankroll;
                } else {
                    const units = parseFloat(stakeStr) || 0;
                    // Assume 1 unit = 1% for calculation consistency if $ not set
                    stakeVal = (units / 100) * initialBankroll;
                }

                if (bet.status === 'WIN') {
                    winCount++;
                    totalStaked += stakeVal;
                    // Profit = Stake * (Odds - 1)
                    const profit = stakeVal * (parseFloat(bet.actual_odds || bet.odds) - 1);
                    totalProfit += profit;
                    totalReturn += (stakeVal + profit);
                    betCount++;
                } else if (bet.status === 'LOSS') {
                    lossCount++;
                    totalStaked += stakeVal;
                    totalProfit -= stakeVal; // Loss is -Stake
                    betCount++;
                } else if (bet.status === 'PENDING') {
                    pendingCount++;
                }
            }
        }

        const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
        const winRate = (winCount + lossCount) > 0 ? (winCount / (winCount + lossCount)) * 100 : 0;
        const currentBankroll = initialBankroll + totalProfit;

        return {
            totalProfit,
            roi,
            winRate,
            currentBankroll,
            pendingCount,
            betCount
        };
    }, [history, initialBankroll]);

    // --- FILTERING ---
    const filteredBets = useMemo(() => {
        const flatBets = [];
        history.forEach(match => {
            match.bets.forEach(bet => {
                if (String(bet.recommendation_level).includes('AVOID')) return;

                const matchesFilter =
                    filter === 'ALL' ||
                    (filter === 'PENDING' && bet.status === 'PENDING') ||
                    (filter === 'SETTLED' && (bet.status === 'WIN' || bet.status === 'LOSS')) ||
                    bet.status === filter;

                if (matchesFilter) {
                    flatBets.push({
                        ...bet,
                        matchId: match.id,
                        matchLabel: match.matchLabel,
                        sport: match.sport,
                        matchTimestamp: match.timestamp
                    });
                }
            });
        });
        // Sort by date desc
        return flatBets.sort((a, b) => new Date(b.matchTimestamp) - new Date(a.matchTimestamp));
    }, [history, filter]);

    return (
        <div className="animate-in fade-in zoom-in duration-300 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-subtle">
                <div className="flex items-center gap-4">
                    <div className={clsx("p-3 rounded-2xl", darkMode ? 'bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border border-cyan-500/20' : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60')}>
                        <TrendingUp size={28} className={darkMode ? 'text-cyan-400' : 'text-amber-600'} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-primary">Analysis History</h2>
                        <p className="text-sm text-secondary mt-0.5">
                            Performance tracking & portfolio management
                        </p>
                    </div>
                </div>

                {history.length > 0 && (
                    <button
                        onClick={onClearHistory}
                        className={clsx(
                            "flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all border",
                            darkMode ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20" : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                        )}
                    >
                        <Trash2 size={14} /> Clear All
                    </button>
                )}
            </div>

            {/* KPI DASHBOARD */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KPICard
                    label="Current Bankroll"
                    value={formatMoney(stats.currentBankroll)}
                    subValue={(stats.totalProfit >= 0 ? '+' : '') + formatMoney(stats.totalProfit) + ' PnL'}
                    icon={DollarSign}
                    trend={stats.totalProfit >= 0 ? 'up' : 'down'}
                    darkMode={darkMode}
                />
                <KPICard
                    label="ROI (Yield)"
                    value={stats.roi.toFixed(2) + '%'}
                    subValue="Return on Investment"
                    icon={TrendingUp}
                    trend={stats.roi >= 0 ? 'up' : 'down'}
                    darkMode={darkMode}
                />
                <KPICard
                    label="Win Rate"
                    value={stats.winRate.toFixed(1) + '%'}
                    subValue={stats.betCount + ' Settled Bets'}
                    icon={Target}
                    trend={stats.winRate > 52.4 ? 'up' : 'neutral'} // 52.4% is breakeven at -110
                    darkMode={darkMode}
                />
                <KPICard
                    label="Pending Actions"
                    value={stats.pendingCount}
                    subValue="Active Bets"
                    icon={Activity}
                    trend="neutral"
                    darkMode={darkMode}
                />
            </div>

            {/* PORTFOLIO DOCTOR */}
            {history.length > 0 && (
                <PortfolioDoctor
                    history={history}
                    apiKeys={apiKeys}
                    modelSettings={modelSettings}
                    darkMode={darkMode}
                />
            )}

            {/* FILTER BAR */}
            <div className={clsx(
                "inline-flex p-1.5 rounded-2xl border mb-6",
                darkMode ? "bg-black/30 border-slate-700/40" : "bg-slate-100 border-slate-200"
            )}>
                {['ALL', 'PENDING', 'WIN', 'LOSS'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={clsx(
                            "px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                            filter === f
                                ? (darkMode ? "bg-slate-800 text-cyan-300 shadow-md" : "bg-white text-slate-800 shadow-sm")
                                : (darkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-500 hover:text-slate-700")
                        )}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* BET LOG TABLE */}
            {filteredBets.length > 0 ? (
                <div className={clsx("rounded-2xl border overflow-hidden", darkMode ? "bg-panel border-subtle" : "bg-panel border-subtle shadow-sm")}>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={clsx("text-[10px] font-black uppercase tracking-[0.15em] border-b", darkMode ? "text-slate-500 border-subtle bg-black/30" : "text-slate-400 border-subtle bg-slate-50/80")}>
                                <th className="p-4">Date / Event</th>
                                <th className="p-4">Selection</th>
                                <th className="p-4 text-right">Odds</th>
                                <th className="p-4 text-right">Stake</th>
                                <th className="p-4 text-center">Outcome</th>
                                <th className="p-4 text-right">PnL</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className={clsx("divide-y", darkMode ? "divide-slate-800" : "divide-slate-100")}>
                            {filteredBets.map((bet) => (
                                <BetRow
                                    key={bet.id}
                                    bet={bet}
                                    darkMode={darkMode}
                                    onUpdate={(updates) => onUpdateBet(bet.matchId, bet.id, updates)}
                                    // Use granular delete if available, else fallback to match delete
                                    onDelete={() => onDeleteBet ? onDeleteBet(bet.matchId, bet.id) : onDeleteMatch(bet.matchId)}
                                    initialBankroll={initialBankroll}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className={clsx("flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed", darkMode ? "border-slate-800 text-slate-600" : "border-slate-200 text-slate-400")}>
                    <Filter size={32} className="mb-4 opacity-40" />
                    <p className="text-sm font-medium">No bets found for filter "{filter}"</p>
                </div>
            )}
        </div>
    );
};

export default HistoryPage;

