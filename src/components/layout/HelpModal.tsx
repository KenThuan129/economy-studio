import React, { useState } from 'react';
import {
  X,
  Coins,
  ShoppingBag,
  Activity,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Play,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    title: 'Welcome to HyperEconomy Studio',
    subtitle: 'The professional browser tool for hypercasual game economy design & Monte Carlo simulation.',
    icon: Sparkles,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    content: (
      <div className="space-y-3 text-sm text-slate-300">
        <p>
          Hypercasual games succeed or fail based on their <strong>first 10 minutes of economy flow</strong>. HyperEconomy Studio lets you design currencies, build a complete shop, and simulate thousands of virtual player bots in real-time.
        </p>
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 text-center">
            <Coins className="w-5 h-5 mx-auto text-amber-400 mb-1" />
            <div className="font-semibold text-xs text-slate-200">1. Currencies</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Earn, sink & inflation curves</div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 text-center">
            <ShoppingBag className="w-5 h-5 mx-auto text-pink-400 mb-1" />
            <div className="font-semibold text-xs text-slate-200">2. Shop & IAP</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Boosters, skins & multi-currency</div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 text-center">
            <Activity className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
            <div className="font-semibold text-xs text-slate-200">3. Bot Simulator</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Monte Carlo agent walk</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Section 1: Currency Designer',
    subtitle: 'Define Hard (Gems) and Soft (Coins) currencies, drop rates, and sink thresholds.',
    icon: Coins,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    content: (
      <div className="space-y-3 text-sm text-slate-300">
        <p>
          Configure every currency parameter with instant balance auditing:
        </p>
        <ul className="space-y-2 text-xs">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span><strong>Hard vs Soft:</strong> Hard currencies monetize and gate premium upgrades; Soft currencies pace base session loops.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span><strong>Inflation Factor (0.0 – 2.0):</strong> Dynamically scales earn drops over player session length.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span><strong>Live Warnings Panel:</strong> Automatically detects soft-lock threats (sinks &gt; earns) and hyper-inflation.</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: 'Section 2: Shop & Pricing Wizard',
    subtitle: 'Design Boosters, Consumables, Cosmetics, and Currency Packs with mobile preview.',
    icon: ShoppingBag,
    color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
    content: (
      <div className="space-y-3 text-sm text-slate-300">
        <p>
          Test your catalog in a live hypercasual smartphone mockup:
        </p>
        <ul className="space-y-2 text-xs">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
            <span><strong>Multi-Currency Pricing:</strong> Price items in Coins, Gems, or Real Money USD IAP.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
            <span><strong>Affordability Helper:</strong> Instantly check what % of players can afford items at 5m, 30m, and 24h.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
            <span><strong>Bulk Tools:</strong> Batch discount, set unlock levels, and tag featured carousel deals.</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: 'Section 3: Monte Carlo User Flow Simulator',
    subtitle: 'Simulate up to 10,000 autonomous bots walking your game loop graph.',
    icon: Activity,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    content: (
      <div className="space-y-3 text-sm text-slate-300">
        <p>
          Connect Start, Action, Earn, Spend, Condition, Shop, Chance, and End nodes:
        </p>
        <ul className="space-y-2 text-xs">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>High-Speed Engine:</strong> Bots make probabilistic choices, collect multipliers, and make wallet purchases.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Heatmap & Funnels:</strong> Pinpoint exact bottleneck nodes where players churn or soft-lock.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Export Artifacts:</strong> Download full simulation runs as JSON or detailed CSV event streams.</span>
          </li>
        </ul>
      </div>
    ),
  },
];

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/80 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${step.color}`}>
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-wider text-indigo-400 uppercase">
                Guide • Step {currentStep + 1} of {STEPS.length}
              </div>
              <h3 className="text-base font-bold text-slate-100">{step.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          <p className="text-xs text-slate-400 mb-4">{step.subtitle}</p>
          {step.content}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Prev
              </button>
            )}

            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
              >
                Get Started <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
