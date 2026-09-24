import React from 'react';
import { AlertTriangle, ShieldCheck, TrendingDown, Flame, Zap, ArrowRight, ShieldAlert } from 'lucide-react';
import { Currency } from '../../types/economy';

interface CurrencyBalanceWarningPanelProps {
  currencies: Currency[];
  onQuickFix?: (currencyId: string, updates: Partial<Currency>) => void;
}

export const CurrencyBalanceWarningPanel: React.FC<CurrencyBalanceWarningPanelProps> = ({
  currencies,
  onQuickFix,
}) => {
  const warnings: {
    id: string;
    currencyId: string;
    currencyName: string;
    currencyIcon: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    recommendation: string;
    fixPayload?: Partial<Currency>;
  }[] = [];

  for (const curr of currencies) {
    const netPerMin = curr.earnRatePerMinute - curr.sinkRatePerMinute;

    // 1. Soft currency deficit (Soft-lock threat)
    if (curr.type === 'soft' && netPerMin < 0) {
      warnings.push({
        id: `warn_softlock_${curr.id}`,
        currencyId: curr.id,
        currencyName: curr.name,
        currencyIcon: curr.icon,
        severity: 'critical',
        title: 'Soft-Lock Threat: Sinks Exceed Earn Velocity',
        description: `${curr.name} has a negative net flow (-${Math.abs(netPerMin).toFixed(1)}/min). Players will deplete funds within ~${Math.max(1, Math.round(curr.startingAmount / Math.abs(netPerMin)))} minutes and soft-lock.`,
        recommendation: `Boost earn rate to at least ${(curr.sinkRatePerMinute * 1.25).toFixed(0)}/min or lower sink costs.`,
        fixPayload: { earnRatePerMinute: Math.round(curr.sinkRatePerMinute * 1.3) },
      });
    }

    // 2. Hard currency hyper-earning
    if (curr.type === 'hard' && curr.earnRatePerMinute > 5 && (curr.gatingRules.minPlayerLevel || 1) < 5) {
      warnings.push({
        id: `warn_hard_inflation_${curr.id}`,
        currencyId: curr.id,
        currencyName: curr.name,
        currencyIcon: curr.icon,
        severity: 'critical',
        title: 'Monetization Threat: Hard Currency Earn Velocity Too High',
        description: `Premium currency "${curr.name}" is dropping at ${curr.earnRatePerMinute}/min without high-level gating (currently Lvl ${curr.gatingRules.minPlayerLevel || 1}). Players will never buy IAP.`,
        recommendation: `Lower earn rate to <= 1.0/min and gate drops behind Level 5+.`,
        fixPayload: { earnRatePerMinute: 0.8, gatingRules: { minPlayerLevel: 5 } },
      });
    }

    // 3. High inflation factor without sinks
    if (curr.inflationFactor > 1.5 && curr.sinks.length < 2) {
      warnings.push({
        id: `warn_inflation_${curr.id}`,
        currencyId: curr.id,
        currencyName: curr.name,
        currencyIcon: curr.icon,
        severity: 'warning',
        title: 'Severe Inflation Without Scaling Sinks',
        description: `Inflation factor is ${curr.inflationFactor.toFixed(2)}, but only ${curr.sinks.length} sink is defined. Numbers will explode in later session minutes.`,
        recommendation: 'Add scaling late-game sinks or reduce inflation factor to 1.0.',
        fixPayload: { inflationFactor: 1.0 },
      });
    }

    // 4. Starting at 0 with high initial sink
    if (curr.startingAmount === 0 && curr.sinks.some((s) => s.cost > 20)) {
      warnings.push({
        id: `warn_empty_start_${curr.id}`,
        currencyId: curr.id,
        currencyName: curr.name,
        currencyIcon: curr.icon,
        severity: 'info',
        title: 'Zero Starting Balance With High Sinks',
        description: `Players begin with 0 ${curr.name}, but early sinks cost > 20. First-time user experience may feel blocked.`,
        recommendation: 'Provide a small starting stipend (e.g., 50 coins) for a smooth onboarding tutorial.',
        fixPayload: { startingAmount: 50 },
      });
    }
  }

  if (warnings.length === 0) {
    return (
      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-300">Live Balance Auditor: Healthy Economy</div>
            <div className="text-[11px] text-slate-400">
              No critical soft-locks or monetization risks detected across all {currencies.length} active currencies.
            </div>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          100% Passed
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 shadow-lg shadow-black/40 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-300">
              Live Balance Warnings ({warnings.length} Active {warnings.length === 1 ? 'Risk' : 'Risks'})
            </h4>
            <p className="text-[11px] text-slate-400">
              Automated heuristics flagging potential churn bottlenecks and monetization issues.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {warnings.map((warn) => (
          <div
            key={warn.id}
            className={`p-3 rounded-xl border flex flex-col justify-between text-xs ${
              warn.severity === 'critical'
                ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                : warn.severity === 'warning'
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                : 'bg-sky-950/30 border-sky-500/40 text-sky-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <span>{warn.currencyIcon}</span>
                  <span className="text-slate-100">{warn.title}</span>
                </div>
                <span
                  className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                    warn.severity === 'critical'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : warn.severity === 'warning'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  }`}
                >
                  {warn.severity}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                {warn.description}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2 mt-1">
              <span className="text-[10px] text-slate-400 italic truncate">
                💡 {warn.recommendation}
              </span>

              {warn.fixPayload && onQuickFix && (
                <button
                  type="button"
                  onClick={() => onQuickFix(warn.currencyId, warn.fixPayload!)}
                  className="shrink-0 flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm"
                >
                  Auto-Fix <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
