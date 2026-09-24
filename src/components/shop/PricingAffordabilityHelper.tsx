import React from 'react';
import { Sparkles, Users, Clock, AlertCircle } from 'lucide-react';
import { ShopItem, Currency } from '../../types/economy';

interface PricingAffordabilityHelperProps {
  item: ShopItem;
  currencies: Currency[];
}

export const PricingAffordabilityHelper: React.FC<PricingAffordabilityHelperProps> = ({
  item,
  currencies,
}) => {
  // Compute estimated affordability percentages at 5 min, 30 min, and 24h
  const computeAffordability = (minutes: number) => {
    if (item.realMoneyPrice) {
      // Real money IAP conversion heuristic (~2-5% industry average)
      return { percentage: Math.min(10, Math.max(1, Math.round(15 / (item.realMoneyPrice.usd || 1)))), isRealMoney: true };
    }

    if (item.priceOptions.length === 0) {
      return { percentage: 100, isRealMoney: false };
    }

    // Check against the easiest currency price option
    let maxAffordablePct = 0;

    for (const price of item.priceOptions) {
      const curr = currencies.find((c) => c.id === price.currencyId);
      if (!curr) continue;

      // Net accumulated earnings by time T
      const inflation = 1 + curr.inflationFactor * (minutes / 10);
      const earned = curr.startingAmount + (curr.earnRatePerMinute * inflation - curr.sinkRatePerMinute) * minutes;
      const netAvailable = Math.max(0, earned);

      if (netAvailable >= price.amount) {
        maxAffordablePct = Math.max(maxAffordablePct, 95);
      } else {
        const ratio = netAvailable / (price.amount || 1);
        const pct = Math.min(90, Math.max(5, Math.round(ratio * 100)));
        maxAffordablePct = Math.max(maxAffordablePct, pct);
      }
    }

    return { percentage: Math.min(100, Math.max(0, maxAffordablePct)), isRealMoney: false };
  };

  const aff5m = computeAffordability(5);
  const aff30m = computeAffordability(30);
  const aff24h = computeAffordability(1440);

  const getBadgeColor = (pct: number) => {
    if (pct >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (pct >= 40) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span>Player Affordability Forecast</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Based on earn velocities</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" /> 5 Min
          </div>
          <div className={`text-xs font-mono font-bold mt-1 px-1.5 py-0.5 rounded border inline-block ${getBadgeColor(aff5m.percentage)}`}>
            {aff5m.percentage}%
          </div>
        </div>

        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" /> 30 Min
          </div>
          <div className={`text-xs font-mono font-bold mt-1 px-1.5 py-0.5 rounded border inline-block ${getBadgeColor(aff30m.percentage)}`}>
            {aff30m.percentage}%
          </div>
        </div>

        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" /> 24 Hours
          </div>
          <div className={`text-xs font-mono font-bold mt-1 px-1.5 py-0.5 rounded border inline-block ${getBadgeColor(aff24h.percentage)}`}>
            {aff24h.percentage}%
          </div>
        </div>
      </div>

      {aff5m.percentage > 80 && item.category === 'cosmetic' && (
        <div className="text-[11px] text-amber-300 flex items-center gap-1 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Cosmetic item priced too low for standard casual progression pacing.</span>
        </div>
      )}
    </div>
  );
};
