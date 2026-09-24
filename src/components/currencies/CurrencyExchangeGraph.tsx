import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { ArrowRightLeft, TrendingUp, Info } from 'lucide-react';
import { Currency } from '../../types/economy';

interface CurrencyExchangeGraphProps {
  currencies: Currency[];
}

export const CurrencyExchangeGraph: React.FC<CurrencyExchangeGraphProps> = ({ currencies }) => {
  const [viewMode, setViewMode] = useState<'forecast' | 'conversions'>('forecast');

  // Compute 30-minute forecast data for all currencies
  const forecastData = useMemo(() => {
    const data = [];
    for (let minute = 0; minute <= 30; minute += 2) {
      const entry: Record<string, any> = { minute: `${minute}m` };
      for (const curr of currencies) {
        const netPerMin = curr.earnRatePerMinute - curr.sinkRatePerMinute;
        // Apply inflation scaling over time
        const inflationScale = 1 + curr.inflationFactor * (minute / 10);
        const earnOverTime = curr.earnRatePerMinute * inflationScale * minute;
        const sinkOverTime = curr.sinkRatePerMinute * minute;
        const calculated = Math.max(0, curr.startingAmount + earnOverTime - sinkOverTime);
        const finalVal = curr.maxCap ? Math.min(curr.maxCap, calculated) : calculated;
        entry[curr.name] = Math.round(finalVal);
      }
      data.push(entry);
    }
    return data;
  }, [currencies]);

  // Generate conversion exchange matrix
  const conversionMatrix = useMemo(() => {
    const pairs: { from: Currency; to: Currency; rate: number }[] = [];
    for (const curr of currencies) {
      for (const conv of curr.conversionRate) {
        const target = currencies.find((c) => c.id === conv.toCurrencyId);
        if (target) {
          pairs.push({
            from: curr,
            to: target,
            rate: conv.rate,
          });
        }
      }
    }
    return pairs;
  }, [currencies]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-black/40">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              {viewMode === 'forecast' ? '30-Minute Projected Wallet Velocity' : 'Currency Exchange Conversion Matrix'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {viewMode === 'forecast'
                ? 'Simulation of player wallet trajectory with inflation curve over a standard 30-minute session.'
                : 'Configured exchange ratios and conversion rates across all game currencies.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('forecast')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              viewMode === 'forecast'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            30-Min Forecast
          </button>
          <button
            type="button"
            onClick={() => setViewMode('conversions')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              viewMode === 'conversions'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Exchange Rates ({conversionMatrix.length})
          </button>
        </div>
      </div>

      {viewMode === 'forecast' ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="minute" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              {currencies.map((curr) => (
                <Line
                  key={curr.id}
                  type="monotone"
                  dataKey={curr.name}
                  stroke={curr.color || '#38bdf8'}
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 py-2">
          {conversionMatrix.map((pair, idx) => (
            <div
              key={idx}
              className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{pair.from.icon}</span>
                <span className="text-xs font-bold text-slate-200">1 {pair.from.name}</span>
              </div>
              <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-300">
                  {pair.rate.toLocaleString()}
                </span>
                <span className="text-xl">{pair.to.icon}</span>
                <span className="text-xs font-bold text-slate-200">{pair.to.name}</span>
              </div>
            </div>
          ))}

          {conversionMatrix.length === 0 && (
            <div className="col-span-full text-center py-8 text-xs text-slate-400 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
              <ArrowRightLeft className="w-6 h-6 mx-auto mb-1 text-slate-600" />
              No currency exchange conversions set up yet. Edit a currency to configure conversion rates.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
