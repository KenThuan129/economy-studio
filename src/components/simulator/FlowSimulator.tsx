import React from 'react';
import { Play } from 'lucide-react';
import { useEconomy } from '../../context/EconomyContext';
import { SimControlsBar } from './SimControlsBar';
import { FlowCanvas } from './FlowCanvas';
import { SingleBotLiveHUD } from './SingleBotLiveHUD';
import { SimResultsDashboard } from './SimResultsDashboard';
import { TimeSeriesSnapshot } from '../../types/economy';

export const FlowSimulator: React.FC = () => {
  const { simResult, currencies, nodes, isSingleBotMode } = useEconomy();

  const handleExportCsv = () => {
    if (!simResult) return;

    // Build CSV of time series
    let csv = 'minute,active_bots';
    currencies.forEach((c) => {
      csv += `,${c.name}_avg,${c.name}_median,${c.name}_min,${c.name}_max`;
    });
    csv += '\n';

    simResult.timeSeries.forEach((t: TimeSeriesSnapshot) => {
      let row = `${t.minute},${t.activeBots}`;
      currencies.forEach((c) => {
        const avg = t.currenciesAvg[c.id] ?? 0;
        const median = t.currenciesMedian[c.id] ?? 0;
        const min = t.currenciesMin[c.id] ?? 0;
        const max = t.currenciesMax[c.id] ?? 0;
        row += `,${avg},${median},${min},${max}`;
      });
      csv += row + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hypereconomy_simulation_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    if (!simResult) return;
    const blob = new Blob([JSON.stringify(simResult, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hypereconomy_simulation_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Section Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔀</span>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              User Flow Diagram & Monte Carlo Simulator
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Build decision trees with Start, Action, Earn, Spend, Shop, Condition, and Chance nodes, then stress-test with up to 10,000 simulated bots or step a single bot node-by-node.
          </p>
        </div>
      </div>

      {/* Simulator Control Bar */}
      <SimControlsBar />

      {/* Live Single Bot Stepping HUD */}
      {isSingleBotMode && <SingleBotLiveHUD />}

      {/* React Flow Visual Canvas */}
      <FlowCanvas />

      {/* Simulation Results Dashboard */}
      {simResult ? (
        <SimResultsDashboard
          result={simResult}
          currencies={currencies}
          nodes={nodes}
          onExportJson={handleExportJson}
          onExportCsv={handleExportCsv}
        />
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
            <Play className="w-6 h-6 fill-current" />
          </div>
          <h3 className="text-base font-bold text-slate-200">Ready to Simulate Economy</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click <strong>"Run Monte Carlo"</strong> above to launch simulated bots across this game loop, or click <strong>"Single Bot Step Mode"</strong> to step through each node individually with live wallet and decision tracing.
          </p>
        </div>
      )}
    </div>
  );
};
