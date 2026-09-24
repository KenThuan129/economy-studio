import React from 'react';
import {
  Edit3,
  Copy,
  Trash2,
  TrendingUp,
  TrendingDown,
  Scale,
  ShieldAlert,
  Coins,
  ArrowRightLeft,
  Layers,
  Lock,
} from 'lucide-react';
import { Currency } from '../../types/economy';
import { Tooltip } from '../common/Tooltip';

interface CurrencyCardProps {
  currency: Currency;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export const CurrencyCard: React.FC<CurrencyCardProps> = ({
  currency,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const netPerMin = currency.earnRatePerMinute - currency.sinkRatePerMinute;
  const projected30Min = Math.max(0, currency.startingAmount + netPerMin * 30);
  const isCapped = currency.maxCap !== null && currency.maxCap !== undefined;

  // Compute balance status
  let statusText = 'Balanced';
  let statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let StatusIcon = Scale;

  if (netPerMin < 0) {
    statusText = 'Deficit / Starvation Risk';
    statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    StatusIcon = TrendingDown;
  } else if (currency.type === 'hard' && currency.earnRatePerMinute > 5) {
    statusText = 'Hyper-Inflation Danger';
    statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    StatusIcon = ShieldAlert;
  } else if (netPerMin > 20) {
    statusText = 'Rapid Surplus Accumulation';
    statusColor = 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    StatusIcon = TrendingUp;
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg shadow-black/40 flex flex-col justify-between transition-all group">
      <div>
        {/* Header: Icon, Name & Actions */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border"
              style={{
                backgroundColor: `${currency.color}15`,
                borderColor: `${currency.color}40`,
              }}
            >
              {currency.icon || '🪙'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">{currency.name}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                    currency.type === 'hard'
                      ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {currency.type === 'hard' ? '💎 Hard Currency' : '🪙 Soft Currency'}
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                {currency.description || 'No description set'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              title="Edit Currency"
              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onDuplicate}
              title="Duplicate Currency"
              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              title="Delete Currency"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Balance Indicator Box */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              Live 30-Min Balance Forecast
              <Tooltip
                title="Balance Indicator"
                content="Forecasts player wallet health over 30 minutes based on passive earn vs sink velocity. Helps detect soft-locks and over-accumulation."
              />
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${statusColor}`}>
              <StatusIcon className="w-3 h-3" />
              {statusText}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-800/60">
            <div>
              <div className="text-[10px] text-slate-400">Earn Rate</div>
              <div className="text-xs font-mono font-bold text-emerald-400">
                +{currency.earnRatePerMinute}/min
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Sink Rate</div>
              <div className="text-xs font-mono font-bold text-rose-400">
                -{currency.sinkRatePerMinute}/min
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Net 30-Min</div>
              <div
                className={`text-xs font-mono font-bold ${
                  netPerMin >= 0 ? 'text-indigo-300' : 'text-rose-400'
                }`}
              >
                {netPerMin >= 0 ? `+${Math.round(netPerMin * 30)}` : Math.round(netPerMin * 30)}
              </div>
            </div>
          </div>
        </div>

        {/* Currency Attributes Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Starting Amount</span>
            <span className="font-mono font-semibold text-slate-200">
              {currency.startingAmount.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Wallet Cap</span>
            <span className="font-mono font-semibold text-slate-200">
              {isCapped ? currency.maxCap?.toLocaleString() : 'Unlimited (∞)'}
            </span>
          </div>

          {currency.regenIntervalMinutes ? (
            <div className="bg-rose-950/30 p-2.5 rounded-lg border border-rose-500/30 col-span-2">
              <span className="text-rose-300 block text-[11px] font-bold flex items-center gap-1">
                ⏱️ Passive Time Regeneration
              </span>
              <span className="font-mono font-semibold text-rose-200 text-xs">
                +{currency.regenAmount ?? 1} every {currency.regenIntervalMinutes}m (Cap: {currency.maxCap ?? 5})
              </span>
            </div>
          ) : null}

          <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Inflation Scaling</span>
            <span className="font-mono font-semibold text-slate-200">
              x{(1 + currency.inflationFactor).toFixed(2)} factor
            </span>
          </div>

          <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Gating Requirement</span>
            <span className="font-mono font-semibold text-slate-200 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-400" />
              Lvl {currency.gatingRules.minPlayerLevel || 1}+
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Sources & Sinks badges */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <strong className="text-slate-300 font-mono">{currency.sources.length}</strong> Sources
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <strong className="text-slate-300 font-mono">{currency.sinks.length}</strong> Sinks
          </span>
        </div>

        {currency.conversionRate.length > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-indigo-400">
            <ArrowRightLeft className="w-3 h-3" />
            {currency.conversionRate.length} Exchange
          </span>
        )}
      </div>
    </div>
  );
};
