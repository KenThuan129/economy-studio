import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Users,
  Clock,
  Sliders,
  Bot,
  Sparkles,
} from 'lucide-react';
import { useEconomy } from '../../context/EconomyContext';

export const SimControlsBar: React.FC = () => {
  const {
    simConfig,
    updateSimConfig,
    isSimulating,
    runSimulation,
    resetSimulation,
    isSingleBotMode,
    startSingleBotSimulation,
    setIsSingleBotMode,
  } = useEconomy();

  const [isConditionsOpen, setIsConditionsOpen] = useState(false);

  const botPresets = [100, 500, 1000, 5000];

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
      {/* Left: Bot Count & Duration Controls */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        {/* Bot Population */}
        <div className="flex items-center gap-2.5 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 font-bold text-slate-300">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Simulated Cohort:</span>
          </div>
          <div className="flex items-center gap-1">
            {botPresets.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => updateSimConfig({ numberOfBots: count })}
                className={`px-2 py-1 rounded font-mono font-bold transition-colors ${
                  simConfig.numberOfBots === count
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {count.toLocaleString()}
              </button>
            ))}
          </div>
          <input
            type="number"
            min="10"
            max="10000"
            step="50"
            value={simConfig.numberOfBots}
            onChange={(e) => updateSimConfig({ numberOfBots: Number(e.target.value) })}
            className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-indigo-300 text-center"
          />
          <span className="text-[10px] text-slate-400">bots</span>
        </div>

        {/* Max Session Length */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-slate-300">Max Time:</span>
          <select
            value={simConfig.maxSessionMinutes}
            onChange={(e) => updateSimConfig({ maxSessionMinutes: Number(e.target.value) })}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-amber-300 focus:outline-none"
          >
            <option value={10}>10 Min</option>
            <option value={30}>30 Min (Standard)</option>
            <option value={60}>60 Min (Core loop)</option>
            <option value={120}>120 Min (Hardcore)</option>
          </select>
        </div>

        {/* Stop Conditions Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsConditionsOpen(!isConditionsOpen)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/80 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 font-semibold transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Stop Rules</span>
          </button>

          {isConditionsOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl z-30 space-y-2 text-xs animate-in fade-in">
              <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                <span>Simulation Stop Triggers</span>
                <span className="text-[10px] text-slate-400">Auto-halt bots</span>
              </div>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simConfig.stopConditions.onSoftLock}
                  onChange={(e) =>
                    updateSimConfig({
                      stopConditions: {
                        ...simConfig.stopConditions,
                        onSoftLock: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Halt on zero balance soft-lock</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simConfig.stopConditions.onSessionLengthExceeded}
                  onChange={(e) =>
                    updateSimConfig({
                      stopConditions: {
                        ...simConfig.stopConditions,
                        onSessionLengthExceeded: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Session max time exceeded</span>
              </label>

              <div className="p-1.5 border-t border-slate-800 pt-2 space-y-1">
                <label className="text-[10px] text-slate-400 block">
                  Hard Currency Cap Threshold (Optional):
                </label>
                <input
                  type="number"
                  placeholder="None"
                  value={simConfig.stopConditions.hardCurrencyThreshold ?? ''}
                  onChange={(e) =>
                    updateSimConfig({
                      stopConditions: {
                        ...simConfig.stopConditions,
                        hardCurrencyThreshold: e.target.value ? Number(e.target.value) : null,
                      },
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Simulation Action Controls */}
      <div className="flex flex-wrap items-center gap-2.5 justify-end">
        {/* Reset */}
        <button
          type="button"
          onClick={resetSimulation}
          disabled={isSimulating}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        {/* Single Bot Step-by-Step Mode */}
        <button
          type="button"
          onClick={() => {
            if (!isSingleBotMode) {
              startSingleBotSimulation();
            } else {
              setIsSingleBotMode(false);
            }
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all shadow-md active:scale-95 ${
            isSingleBotMode
              ? 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-600/30 ring-2 ring-indigo-400/40'
              : 'bg-indigo-950/60 hover:bg-indigo-900/60 border-indigo-500/40 text-indigo-300 hover:text-indigo-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>{isSingleBotMode ? 'Active: Single Bot Mode' : 'Single Bot Step Mode'}</span>
        </button>

        {/* Play / Run Monte Carlo */}
        <button
          type="button"
          onClick={runSimulation}
          disabled={isSimulating}
          className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSimulating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run Monte Carlo ({simConfig.numberOfBots.toLocaleString()} Bots)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
