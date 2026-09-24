import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Bot,
  Activity,
  History,
  X,
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Gamepad2,
  Flame,
  Scale,
} from 'lucide-react';
import { useEconomy } from '../../context/EconomyContext';
import { BotPersonaType } from '../../types/economy';

const PERSONAS: {
  id: BotPersonaType;
  name: string;
  badge: string;
  icon: React.ReactNode;
  desc: string;
  activeBg: string;
}[] = [
  {
    id: 'casual',
    name: 'Casual',
    badge: 'Casual',
    icon: <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />,
    desc: 'Enjoys easy play. Easy 98%, Med 90%, Hard 40% (stuck on hard)',
    activeBg: 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/30',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    badge: 'Balanced',
    icon: <Scale className="w-3.5 h-3.5 text-blue-400" />,
    desc: 'Balanced try-hard. Easy 98%, Med 90%, Hard 65%, V.Hard 20%, Extreme 5%',
    activeBg: 'bg-blue-600 text-white border-blue-400 shadow-blue-500/30',
  },
  {
    id: 'hardcore',
    name: 'Hardcore',
    badge: 'Hardcore',
    icon: <Flame className="w-3.5 h-3.5 text-amber-400" />,
    desc: 'Master player. Easy-Hard 100%, V.Hard 60%, Extreme 35%',
    activeBg: 'bg-amber-600 text-white border-amber-400 shadow-amber-500/30',
  },
];

export const SingleBotLiveHUD: React.FC = () => {
  const {
    singleBotState,
    currencies,
    selectedPersona,
    startSingleBotSimulation,
    stepSingleBotForward,
    togglePlaySingleBot,
    resetSingleBot,
    setSingleBotSpeed,
    setIsSingleBotMode,
  } = useEconomy();

  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  if (!singleBotState) return null;

  const { bot, activeNodeId, isPlaying, playbackSpeed, isFinished, finishReason, steps, lastDecision } = singleBotState;

  // Format session time
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const activePersonaObj = PERSONAS.find((p) => p.id === (bot.persona || selectedPersona)) || PERSONAS[0];

  return (
    <div className="bg-slate-900/95 border-b border-indigo-500/30 backdrop-blur-md px-4 py-3 shadow-xl z-20 flex flex-col gap-2.5">
      {/* Top Main Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Bot Status, Persona & Wallet */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/40 px-3 py-1.5 rounded-xl shadow-inner">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">Single Bot Inspector</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                    isFinished
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : isPlaying
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isFinished ? 'Terminated' : isPlaying ? 'Running' : 'Stepping'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                <span>Step #{steps.length}</span>
                <span>•</span>
                <span>Time: {formatTime(bot.ticksLived)}</span>
                <span>•</span>
                <span className="text-indigo-300 font-bold">Stage: Lvl {bot.level}</span>
                <span>•</span>
                <span className="text-amber-300 font-bold flex items-center gap-0.5">
                  🔥 Streak: {bot.currentStreak || 0}/{bot.streakStepTarget || 3} (Max 9)
                </span>
              </div>
            </div>
          </div>

          {/* Persona Switcher Selector */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1.5 shrink-0">
              Bot Cohort:
            </span>
            {PERSONAS.map((p) => {
              const isSelected = (bot.persona || selectedPersona) === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => startSingleBotSimulation(p.id)}
                  title={p.desc}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    isSelected
                      ? `${p.activeBg} shadow-md scale-105`
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {p.icon}
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>

          {/* Wallet Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {currencies.map((c) => {
              const bal = bot.currentWallet[c.id] ?? 0;
              const isLives = c.name.toLowerCase().includes('live') || c.id.includes('live');
              return (
                <div
                  key={c.id}
                  className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 text-xs font-mono transition-all ${
                    isLives && bal <= 1
                      ? 'bg-rose-950/60 border-rose-500/60 text-rose-300 animate-pulse'
                      : 'bg-slate-950/60 border-slate-800 text-slate-200'
                  }`}
                >
                  <span className="text-sm">{c.icon || '🪙'}</span>
                  <span className="font-bold">
                    {bal.toLocaleString()}
                    {c.maxCap !== null ? `/${c.maxCap}` : ''}
                  </span>
                </div>
              );
            })}

            {bot.inventory.some((it) => it.includes('ads') || it.includes('remove')) && (
              <span className="px-2 py-1 rounded-xl bg-pink-950/60 border border-pink-500/40 text-pink-300 text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> No-Ads VIP
              </span>
            )}
          </div>
        </div>

        {/* Right: Stepper Controls */}
        <div className="flex items-center gap-2">
          {/* Speed Selector */}
          <div className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
            {[0.5, 1, 2, 5].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setSingleBotSpeed(spd)}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  playbackSpeed === spd
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Reset */}
          <button
            type="button"
            onClick={resetSingleBot}
            title="Reset Bot to Start"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={togglePlaySingleBot}
            disabled={isFinished}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-40 ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Autoplay'}</span>
          </button>

          {/* Step 1 Forward */}
          <button
            type="button"
            onClick={stepSingleBotForward}
            disabled={isFinished || isPlaying}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-40"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Step Next Node</span>
          </button>

          {/* History Toggle */}
          <button
            type="button"
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className={`p-2 rounded-xl border transition-colors ${
              isHistoryExpanded
                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title="Toggle Step History"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Exit Single Bot Mode */}
          <button
            type="button"
            onClick={() => setIsSingleBotMode(false)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 rounded-xl border border-slate-700 transition-colors"
            title="Exit Single Bot Mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Decision Narrative Callout */}
      <div className="flex items-center justify-between gap-3 bg-slate-950/70 border border-slate-800/90 rounded-xl px-3 py-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
            Node Event:
          </span>
          <span className="text-slate-200 font-medium truncate">
            {lastDecision || 'Bot is ready at the starting node.'}
          </span>
        </div>

        {finishReason && (
          <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-500/30">
            <AlertTriangle className="w-3 h-3" />
            <span>End Reason: {finishReason}</span>
          </div>
        )}
      </div>

      {/* Expandable Step History Log Drawer */}
      {isHistoryExpanded && (
        <div className="mt-2 bg-slate-950 border border-slate-800 rounded-2xl p-3 max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] font-bold text-slate-400">
            <span>Step-by-Step Trajectory Log ({steps.length} Steps)</span>
            <span className="text-[10px] text-slate-500">Live Decision Trace</span>
          </div>
          <div className="space-y-1 text-xs">
            {steps.slice().reverse().map((step, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-3 p-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] font-bold">
                    #{step.stepNumber}
                  </span>
                  <span className="font-bold text-indigo-300 text-[11px]">{step.nodeLabel}</span>
                  <span className="text-slate-400 text-[11px] truncate max-w-md">
                    {step.decisionMade || 'Transitioned'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] text-slate-400">
                  <span>{formatTime(step.timeSec)}</span>
                  <div className="flex items-center gap-1 text-slate-300">
                    {Object.entries(step.walletSnapshot || step.walletAfter || {}).map(([k, v]) => (
                      <span key={k} className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {String(v)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
