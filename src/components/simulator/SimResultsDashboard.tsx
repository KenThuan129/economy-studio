import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Download,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Activity,
  Users,
  Clock,
  DollarSign,
  FileSpreadsheet,
  Bot,
  Search,
  Copy,
  Check,
  ChevronRight,
  ArrowRight,
  Filter,
  Sparkles,
  Terminal,
  ShoppingBag,
} from 'lucide-react';
import { SimulationResult, Currency, FlowNode, BotRunSummary, BotStepRecord } from '../../types/economy';

interface SimResultsDashboardProps {
  result: SimulationResult;
  currencies: Currency[];
  nodes: FlowNode[];
  onExportJson: () => void;
  onExportCsv: () => void;
}

export const SimResultsDashboard: React.FC<SimResultsDashboardProps> = ({
  result,
  currencies,
  nodes,
  onExportJson,
  onExportCsv,
}) => {
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>(
    currencies[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'balance' | 'bot_runs' | 'heatmap' | 'churn' | 'alerts'>('balance');

  // Bot Runs Explorer State
  const [selectedBotId, setSelectedBotId] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'active' | 'soft_locked' | 'churned'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'id' | 'steps' | 'level' | 'duration'>('id');
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [stepFilter, setStepFilter] = useState<string>('');

  const selectedCurr = currencies.find((c) => c.id === selectedCurrencyId) || currencies[0];

  // Format time series data for the selected currency
  const timeSeriesData = result.timeSeries.map((t) => {
    const avg = t.currenciesAvg[selectedCurrencyId] ?? 0;
    const median = t.currenciesMedian[selectedCurrencyId] ?? 0;
    const min = t.currenciesMin[selectedCurrencyId] ?? 0;
    const max = t.currenciesMax[selectedCurrencyId] ?? 0;
    return {
      minute: `${t.minute}m`,
      avg: Math.round(avg),
      median: Math.round(median),
      min: Math.round(min),
      max: Math.round(max),
      activeBots: t.activeBots,
    };
  });

  // Sort heatmap entries
  const heatmapEntries = Object.entries(result.nodeHeatmap)
    .map(([nodeId, stats]) => {
      const matchedNode = nodes.find((n) => n.id === nodeId);
      return {
        nodeId,
        nodeLabel: matchedNode?.data.label || nodeId,
        nodeType: matchedNode?.data.type || 'UNKNOWN',
        visits: stats.visits,
        uniqueBots: stats.uniqueBots,
        avgTimeSpentSec: Math.round(stats.avgTimeSpentSec),
      };
    })
    .sort((a, b) => b.visits - a.visits);

  const softLockRate = result.totalBots > 0 ? (result.softLockedBotsCount / result.totalBots) * 100 : 0;

  // Filter and sort bot runs
  const botRunsList = result.botRuns || [];

  const filteredBots = useMemo(() => {
    return botRunsList
      .filter((b) => {
        if (statusFilter !== 'all' && b.status !== statusFilter) return false;
        if (searchTerm) {
          const matchId = `bot ${b.botId}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.botId.toString().includes(searchTerm);
          const matchReason = b.finishReason?.toLowerCase().includes(searchTerm.toLowerCase());
          return matchId || matchReason;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'steps') return b.totalSteps - a.totalSteps;
        if (sortBy === 'level') return b.finalLevel - a.finalLevel;
        if (sortBy === 'duration') return b.totalDurationSec - a.totalDurationSec;
        return a.botId - b.botId;
      });
  }, [botRunsList, statusFilter, searchTerm, sortBy]);

  const activeBot = useMemo(() => {
    return botRunsList.find((b) => b.botId === selectedBotId) || filteredBots[0] || botRunsList[0];
  }, [botRunsList, selectedBotId, filteredBots]);

  // Filter steps for the active bot
  const filteredSteps = useMemo(() => {
    if (!activeBot) return [];
    if (!stepFilter) return activeBot.steps;
    const query = stepFilter.toLowerCase();
    return activeBot.steps.filter(
      (s) =>
        s.nodeLabel.toLowerCase().includes(query) ||
        s.actionTaken.toLowerCase().includes(query) ||
        s.nodeType.toLowerCase().includes(query) ||
        s.details?.toLowerCase().includes(query) ||
        s.outcomeStatus?.toLowerCase().includes(query)
    );
  }, [activeBot, stepFilter]);

  const handleCopyBotJson = () => {
    if (!activeBot) return;
    navigator.clipboard.writeText(JSON.stringify(activeBot, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleExportBotTrajectoriesCsv = () => {
    if (!result.botRuns || result.botRuns.length === 0) return;

    let csv = 'bot_id,step_number,time_sec,node_id,node_label,node_type,action_taken,level_after,outcome_status,details,wallet_snapshot\n';
    result.botRuns.forEach((bot) => {
      bot.steps.forEach((step) => {
        const walletStr = Object.entries(step.walletAfter)
          .map(([k, v]) => `${k}:${v}`)
          .join('|');
        const cleanAction = `"${(step.actionTaken || '').replace(/"/g, '""')}"`;
        const cleanDetails = `"${(step.details || '').replace(/"/g, '""')}"`;
        const cleanLabel = `"${(step.nodeLabel || '').replace(/"/g, '""')}"`;
        csv += `${bot.botId},${step.stepNumber},${step.timeSec},${step.nodeId},${cleanLabel},${step.nodeType},${cleanAction},${step.levelAfter},${step.outcomeStatus || ''},${cleanDetails},"${walletStr}"\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hypereconomy_bot_trajectories_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getNodeTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'START':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'ACTION':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'EARN':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'SPEND':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'CONDITION':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'CHANCE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'SHOP_VISIT':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/40';
      case 'END':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  const getOutcomeBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Success</span>;
      case 'branch_true':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Branch: True</span>;
      case 'branch_false':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Branch: False</span>;
      case 'purchased':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">Purchased</span>;
      case 'skipped':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400 border border-slate-600">No Action</span>;
      case 'soft_locked':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">Soft-Locked</span>;
      case 'churned':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">Session Exit</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              Monte Carlo Simulation Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cohort of <strong>{result.totalBots.toLocaleString()} bots</strong> simulated across{' '}
            <strong>{result.durationMinutes.toFixed(1)} minutes</strong> of progression.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportBotTrajectoriesCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            title="Download step-by-step trajectories of all bots for ML / Data Learning"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export Bot Steps (CSV)</span>
          </button>
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Time-Series (CSV)</span>
          </button>
          <button
            onClick={onExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Full JSON</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Soft-Lock Rate */}
        <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Soft-Lock Rate
          </div>
          <div
            className={`text-lg font-mono font-black ${
              softLockRate > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {softLockRate.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {result.softLockedBotsCount} bots ran out of funds
          </div>
        </div>

        {/* Ticks Executed */}
        <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Simulation Ticks
          </div>
          <div className="text-lg font-mono font-black text-slate-100">
            {result.ticksExecuted.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Total engine cycles</div>
        </div>

        {/* Total Revenue Simulated */}
        <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Simulated Revenue
          </div>
          <div className="text-lg font-mono font-black text-emerald-400">
            ${result.totalRevenueSimulatedUsd.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">From IAP / Real money purchases</div>
        </div>

        {/* Alert Count */}
        <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Balancing Alerts
          </div>
          <div
            className={`text-lg font-mono font-black ${
              result.economyAlerts.some((a) => a.type === 'critical')
                ? 'text-rose-400'
                : result.economyAlerts.length > 0
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {result.economyAlerts.length} Warnings
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {result.economyAlerts.filter((a) => a.type === 'critical').length} critical issues
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs flex-wrap">
          <button
            onClick={() => setActiveTab('balance')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'balance'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Wallet Over Time
          </button>
          <button
            onClick={() => setActiveTab('bot_runs')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'bot_runs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-400 hover:text-indigo-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Bot Trajectories & Steps</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 font-mono">
              {botRunsList.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'heatmap'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Node Heatmap ({heatmapEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('churn')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'churn'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Retention & Funnel
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
              activeTab === 'alerts'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-400 hover:text-amber-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Alerts ({result.economyAlerts.length})</span>
          </button>
        </div>

        {/* Currency Selector for Wallet Chart */}
        {activeTab === 'balance' && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Currency:</span>
            <select
              value={selectedCurrencyId}
              onChange={(e) => setSelectedCurrencyId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-bold"
            >
              {currencies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: Wallet Balance Over Time Chart */}
      {activeTab === 'balance' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Tracking <strong>{selectedCurr?.name}</strong> trajectory (Min, Median, Average, Max)
            </span>
            <span className="font-mono text-[11px]">
              Avg End Balance: {timeSeriesData[timeSeriesData.length - 1]?.avg.toLocaleString()}
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={selectedCurr?.color || '#6366f1'} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={selectedCurr?.color || '#6366f1'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="minute" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="avg"
                  name="Average"
                  stroke={selectedCurr?.color || '#6366f1'}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#areaGrad)"
                />
                <Line
                  type="monotone"
                  dataKey="median"
                  name="Median"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="max"
                  name="Max Bot"
                  stroke="#4ade80"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="min"
                  name="Min Bot"
                  stroke="#f43f5e"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB: BOT STEP TRAJECTORIES (Data Learning & Detailed Analysis) */}
      {activeTab === 'bot_runs' && (
        <div className="space-y-5">
          {/* Controls Bar for Bot List */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Status:
              </span>
              {(['all', 'completed', 'active', 'soft_locked', 'churned'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-medium capitalize transition-all ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Search & Sort Controls */}
            <div className="flex items-center gap-2.5 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-48">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Bot ID / Reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300 font-medium"
              >
                <option value="id">Sort by Bot ID</option>
                <option value="steps">Sort by Most Steps</option>
                <option value="level">Sort by Highest Lvl</option>
                <option value="duration">Sort by Duration</option>
              </select>
            </div>
          </div>

          {/* Main 2-Column Split: Bot Selector List & Active Bot Step-by-Step Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Bot Selection Rail */}
            <div className="lg:col-span-4 bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex flex-col max-h-[580px]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs text-slate-400">
                <span className="font-bold text-slate-300">Bot Cohort ({filteredBots.length})</span>
                <span className="text-[10px]">Click to inspect step trace</span>
              </div>

              <div className="overflow-y-auto space-y-1.5 flex-1 pr-1">
                {filteredBots.map((bot) => {
                  const isSelected = activeBot?.botId === bot.botId;
                  return (
                    <button
                      key={bot.botId}
                      onClick={() => setSelectedBotId(bot.botId)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-900/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold font-mono text-xs text-indigo-300">
                            Bot #{bot.botId}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                              bot.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : bot.status === 'soft_locked'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : bot.status === 'churned'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            }`}
                          >
                            {bot.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {bot.finishReason || `${bot.totalSteps} steps completed`}
                        </div>
                      </div>

                      <div className="text-right font-mono text-[11px] flex-shrink-0 ml-2">
                        <div className="font-bold text-slate-200">{bot.totalSteps} steps</div>
                        <div className="text-[10px] text-slate-400">Lvl {bot.finalLevel}</div>
                      </div>
                    </button>
                  );
                })}

                {filteredBots.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-500">
                    No bots match the selected filter criteria.
                  </div>
                )}
              </div>
            </div>

            {/* Right: Detailed Step Trace & Transition Analysis */}
            <div className="lg:col-span-8 space-y-4">
              {activeBot ? (
                <>
                  {/* Bot Profile Header Banner */}
                  <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold font-mono text-sm">
                          #{activeBot.botId}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-extrabold text-white">
                              Bot #{activeBot.botId} Trajectory Trace
                            </h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                activeBot.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : activeBot.status === 'soft_locked'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  : activeBot.status === 'churned'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              }`}
                            >
                              {activeBot.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {activeBot.finishReason || 'Active in loop'} • Total Steps: {activeBot.totalSteps} • Duration: {(activeBot.totalDurationSec / 60).toFixed(1)}m
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyBotJson}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                          title="Copy trajectory JSON for data learning"
                        >
                          {copiedJson ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy JSON</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setShowRawJson(!showRawJson)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                            showRawJson
                              ? 'bg-indigo-600 text-white border-indigo-500'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          <span>{showRawJson ? 'Hide Raw' : 'Raw JSON'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Final Wallet & Economy Stats Chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-xs">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Final Level</div>
                        <div className="text-sm font-black font-mono text-indigo-300">Lvl {activeBot.finalLevel}</div>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-xs">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Purchases</div>
                        <div className="text-sm font-black font-mono text-pink-300">
                          {activeBot.itemsPurchased.length} items
                        </div>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-xs col-span-2">
                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Final Wallet Snapshot</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {currencies.map((curr) => {
                            const val = activeBot.finalWallet[curr.id] ?? 0;
                            return (
                              <span
                                key={curr.id}
                                className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 flex items-center gap-1"
                              >
                                <span>{curr.icon}</span>
                                <span className="font-bold text-slate-200">{val.toLocaleString()}</span>
                                <span className="text-[10px] text-slate-400">{curr.name}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Raw JSON Data Viewer for ML / Data Learning */}
                  {showRawJson && (
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-mono font-bold text-indigo-400 flex items-center gap-1">
                          <Terminal className="w-3.5 h-3.5" /> Structured Trajectory Object (Bot #{activeBot.botId})
                        </span>
                        <span>Format: JSON (ML / Training Ready)</span>
                      </div>
                      <pre className="text-[11px] font-mono bg-slate-900/90 text-emerald-300 p-3 rounded-xl overflow-x-auto max-h-60 border border-slate-800 leading-relaxed">
                        {JSON.stringify(activeBot, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Step Search & Filter */}
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                    <span className="font-bold text-slate-300">
                      Step Sequence ({filteredSteps.length} / {activeBot.steps.length} steps)
                    </span>
                    <input
                      type="text"
                      placeholder="Filter steps by node, outcome, or action..."
                      value={stepFilter}
                      onChange={(e) => setStepFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-64"
                    />
                  </div>

                  {/* Step-by-Step Trajectory Flow Cards */}
                  <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                    {filteredSteps.map((step, idx) => (
                      <div
                        key={step.stepNumber}
                        className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 space-y-2 hover:border-slate-700 transition-colors"
                      >
                        {/* Step Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-extrabold text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              Step #{step.stepNumber}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getNodeTypeBadgeColor(
                                step.nodeType
                              )}`}
                            >
                              {step.nodeType}
                            </span>
                            <span className="font-bold text-xs text-slate-200">{step.nodeLabel}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {getOutcomeBadge(step.outcomeStatus)}
                            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {Math.floor(step.timeSec / 60)}:{(step.timeSec % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        </div>

                        {/* Action Description & What Happened */}
                        <div className="text-xs text-slate-300 font-medium flex items-start gap-2">
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div>{step.actionTaken}</div>
                            {step.details && (
                              <div className="text-[11px] text-slate-400 mt-0.5 italic">
                                ↳ {step.details}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Wallet Delta & Balance After Step */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs bg-slate-900/50 p-2 rounded-xl border border-slate-800/60">
                          {/* Currency Delta */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-semibold">Delta:</span>
                            {Object.keys(step.deltaWallet).length > 0 ? (
                              Object.entries(step.deltaWallet).map(([cid, amt]) => {
                                const curr = currencies.find((c) => c.id === cid);
                                const isPositive = amt > 0;
                                return (
                                  <span
                                    key={cid}
                                    className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                      isPositive
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    }`}
                                  >
                                    {isPositive ? `+${amt}` : amt} {curr?.icon || ''} {curr?.name || cid}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-[11px] text-slate-400">0 change</span>
                            )}
                          </div>

                          {/* Wallet After Step */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-semibold">Wallet After:</span>
                            {Object.entries(step.walletAfter).map(([cid, bal]) => {
                              const curr = currencies.find((c) => c.id === cid);
                              return (
                                <span
                                  key={cid}
                                  className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-300"
                                >
                                  {curr?.icon || ''} {bal}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredSteps.length === 0 && (
                      <div className="text-center py-8 text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
                        No steps match the filter keyword "{stepFilter}".
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-xs text-slate-500">
                  Select a bot from the cohort list to view step trajectory details.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Node Visit Heatmap */}
      {activeTab === 'heatmap' && (
        <div className="space-y-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatmapEntries} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="nodeLabel"
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="visits" name="Total Bot Visits" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Heatmap summary table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {heatmapEntries.map((node) => (
              <div
                key={node.nodeId}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-200 truncate">{node.nodeLabel}</div>
                  <div className="text-[10px] text-slate-400 capitalize">Type: {node.nodeType}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-indigo-300">{node.visits.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500">
                    {node.uniqueBots} unique bots
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Retention & Churn Funnel */}
      {activeTab === 'churn' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Churn Funnel Steps */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Milestone Retention Funnel
              </h4>
              <div className="space-y-2">
                {result.churnFunnel.map((step, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">{step.milestone}</span>
                      <span className="font-mono font-bold text-indigo-400">
                        {step.percentage.toFixed(1)}% ({step.count.toLocaleString()} bots)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${step.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Bots Retention Curve */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Active Bots Remaining vs Session Time
              </h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="minute" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#f8fafc',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="activeBots"
                      name="Active Bots"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Economy Alerts */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {result.economyAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                alert.type === 'critical'
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  : alert.type === 'warning'
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  : 'bg-sky-950/30 border-sky-500/40 text-sky-200'
              }`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                      alert.type === 'critical'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {alert.type}
                  </span>
                  <span className="font-bold text-slate-100">{alert.title}</span>
                </div>
                <p className="text-[11px] text-slate-300">{alert.message}</p>
                <p className="text-[10px] text-slate-400 italic">💡 {alert.suggestedFix}</p>
              </div>
            </div>
          ))}

          {result.economyAlerts.length === 0 && (
            <div className="text-center py-10 text-xs text-emerald-400 bg-emerald-950/20 rounded-2xl border border-emerald-500/30">
              <ShieldCheck className="w-8 h-8 mx-auto mb-1 text-emerald-400" />
              All simulation metrics passed with zero economic balance alerts!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
