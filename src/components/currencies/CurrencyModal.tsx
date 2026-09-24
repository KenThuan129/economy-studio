import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Coins,
  ArrowRightLeft,
  Lock,
  Flame,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { Currency, CurrencySource, CurrencySink, CurrencyConversion, CurrencyType } from '../../types/economy';
import { EmojiPickerModal } from '../common/EmojiPickerModal';
import { Tooltip } from '../common/Tooltip';

interface CurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (currency: Currency) => void;
  currencyToEdit?: Currency | null;
  allCurrencies: Currency[];
}

export const CurrencyModal: React.FC<CurrencyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currencyToEdit,
  allCurrencies,
}) => {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'sources_sinks' | 'conversion' | 'gating'>('basic');

  // Form State
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🪙');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#fbbf24');
  const [type, setType] = useState<CurrencyType>('soft');
  const [startingAmount, setStartingAmount] = useState(0);
  const [hasCap, setHasCap] = useState(false);
  const [maxCap, setMaxCap] = useState<number>(1000000);
  const [earnRatePerMinute, setEarnRatePerMinute] = useState(30);
  const [sinkRatePerMinute, setSinkRatePerMinute] = useState(25);
  const [inflationFactor, setInflationFactor] = useState(1.0);
  const [regenIntervalMinutes, setRegenIntervalMinutes] = useState<number | undefined>(undefined);
  const [regenAmount, setRegenAmount] = useState<number>(1);
  const [hasRegen, setHasRegen] = useState(false);

  const [sources, setSources] = useState<CurrencySource[]>([]);
  const [sinks, setSinks] = useState<CurrencySink[]>([]);
  const [conversionRate, setConversionRate] = useState<CurrencyConversion[]>([]);
  const [minPlayerLevel, setMinPlayerLevel] = useState(1);
  const [requiresCurrencyId, setRequiresCurrencyId] = useState('');
  const [requiresAmount, setRequiresAmount] = useState(0);

  useEffect(() => {
    if (currencyToEdit) {
      setName(currencyToEdit.name);
      setIcon(currencyToEdit.icon);
      setDescription(currencyToEdit.description);
      setColor(currencyToEdit.color);
      setType(currencyToEdit.type);
      setStartingAmount(currencyToEdit.startingAmount);
      setHasCap(currencyToEdit.maxCap !== null);
      setMaxCap(currencyToEdit.maxCap || 1000000);
      setEarnRatePerMinute(currencyToEdit.earnRatePerMinute);
      setSinkRatePerMinute(currencyToEdit.sinkRatePerMinute);
      setInflationFactor(currencyToEdit.inflationFactor);
      setHasRegen(!!currencyToEdit.regenIntervalMinutes);
      setRegenIntervalMinutes(currencyToEdit.regenIntervalMinutes);
      setRegenAmount(currencyToEdit.regenAmount || 1);
      setSources(currencyToEdit.sources || []);
      setSinks(currencyToEdit.sinks || []);
      setConversionRate(currencyToEdit.conversionRate || []);
      setMinPlayerLevel(currencyToEdit.gatingRules.minPlayerLevel || 1);
      setRequiresCurrencyId(currencyToEdit.gatingRules.requiresCurrencyId || '');
      setRequiresAmount(currencyToEdit.gatingRules.requiresAmount || 0);
    } else {
      // Defaults for new currency
      setName('');
      setIcon('🪙');
      setDescription('');
      setColor('#38bdf8');
      setType('soft');
      setStartingAmount(100);
      setHasCap(false);
      setMaxCap(1000000);
      setEarnRatePerMinute(40);
      setSinkRatePerMinute(30);
      setInflationFactor(1.0);
      setHasRegen(false);
      setRegenIntervalMinutes(undefined);
      setRegenAmount(1);
      setSources([
        { id: `src_${Date.now()}_1`, name: 'Level Clear Drop', minAmount: 10, maxAmount: 30, weight: 80 },
      ]);
      setSinks([
        { id: `snk_${Date.now()}_1`, name: 'Speed Upgrade', cost: 50, frequency: 'per_level' },
      ]);
      setConversionRate([]);
      setMinPlayerLevel(1);
      setRequiresCurrencyId('');
      setRequiresAmount(0);
    }
    setActiveTab('basic');
  }, [currencyToEdit, isOpen]);

  const applyPreset = (preset: 'lives' | 'coins' | 'gems' | 'energy') => {
    if (preset === 'lives') {
      setName('Lives');
      setIcon('❤️');
      setDescription('Player session lives. Max cap at 5, regenerates 1 life every 20 minutes.');
      setColor('#f43f5e');
      setType('soft');
      setStartingAmount(5);
      setHasCap(true);
      setMaxCap(5);
      setEarnRatePerMinute(0.05);
      setSinkRatePerMinute(0.1);
      setInflationFactor(0);
      setHasRegen(true);
      setRegenIntervalMinutes(20);
      setRegenAmount(1);
      setSources([
        { id: `src_${Date.now()}_time`, name: 'Time-Based Passive Regen', minAmount: 1, maxAmount: 1, weight: 80 },
        { id: `src_${Date.now()}_ad`, name: 'Rewarded Ad Refill (+1 Life)', minAmount: 1, maxAmount: 1, weight: 50 },
      ]);
      setSinks([
        { id: `snk_${Date.now()}_play`, name: 'Level Entry / Attempt Cost', cost: 1, frequency: 'per_run' },
      ]);
    } else if (preset === 'coins') {
      setName('Gold Coins');
      setIcon('🪙');
      setDescription('Standard gameplay soft currency earned by completing levels and streaks.');
      setColor('#fbbf24');
      setType('soft');
      setStartingAmount(100);
      setHasCap(false);
      setMaxCap(1000000);
      setEarnRatePerMinute(40);
      setSinkRatePerMinute(35);
      setInflationFactor(1.1);
      setHasRegen(false);
      setRegenIntervalMinutes(undefined);
    } else if (preset === 'gems') {
      setName('Gems');
      setIcon('💎');
      setDescription('Premium hard currency for revives, instant refilling, and booster packs.');
      setColor('#38bdf8');
      setType('hard');
      setStartingAmount(15);
      setHasCap(false);
      setMaxCap(1000000);
      setEarnRatePerMinute(0.5);
      setSinkRatePerMinute(0.4);
      setInflationFactor(0.1);
      setHasRegen(false);
      setRegenIntervalMinutes(undefined);
    } else if (preset === 'energy') {
      setName('Energy');
      setIcon('⚡');
      setDescription('Stamina energy required to start stages. Max cap 30, regens 5 every 10m.');
      setColor('#eab308');
      setType('soft');
      setStartingAmount(30);
      setHasCap(true);
      setMaxCap(30);
      setEarnRatePerMinute(0.5);
      setSinkRatePerMinute(0.5);
      setInflationFactor(0);
      setHasRegen(true);
      setRegenIntervalMinutes(10);
      setRegenAmount(5);
    }
  };

  if (!isOpen) return null;

  const handleAddSource = () => {
    setSources((prev) => [
      ...prev,
      {
        id: `src_${Date.now()}`,
        name: 'New Reward Source',
        minAmount: 5,
        maxAmount: 20,
        weight: 50,
      },
    ]);
  };

  const handleRemoveSource = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddSink = () => {
    setSinks((prev) => [
      ...prev,
      {
        id: `snk_${Date.now()}`,
        name: 'New Spend Sink',
        cost: 25,
        frequency: 'per_session',
      },
    ]);
  };

  const handleRemoveSink = (id: string) => {
    setSinks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddConversion = () => {
    const otherCurrencies = allCurrencies.filter((c) => c.id !== currencyToEdit?.id);
    if (otherCurrencies.length === 0) return;
    setConversionRate((prev) => [
      ...prev,
      { toCurrencyId: otherCurrencies[0].id, rate: 10 },
    ]);
  };

  const handleRemoveConversion = (toId: string) => {
    setConversionRate((prev) => prev.filter((c) => c.toCurrencyId !== toId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const currency: Currency = {
      id: currencyToEdit ? currencyToEdit.id : `curr_${Date.now()}`,
      name: name.trim(),
      icon: icon || '🪙',
      description: description.trim(),
      color,
      type,
      startingAmount: Number(startingAmount) || 0,
      maxCap: hasCap ? Number(maxCap) || 1000000 : null,
      earnRatePerMinute: Number(earnRatePerMinute) || 0,
      sinkRatePerMinute: Number(sinkRatePerMinute) || 0,
      inflationFactor: Number(inflationFactor) || 0,
      regenIntervalMinutes: hasRegen && regenIntervalMinutes ? Number(regenIntervalMinutes) : undefined,
      regenAmount: hasRegen ? Number(regenAmount) || 1 : undefined,
      sources,
      sinks,
      conversionRate,
      gatingRules: {
        minPlayerLevel: Number(minPlayerLevel) || 1,
        requiresCurrencyId: requiresCurrencyId || undefined,
        requiresAmount: requiresAmount > 0 ? Number(requiresAmount) : undefined,
      },
    };

    onSave(currency);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl shadow-black/80 flex flex-col my-8 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen(true)}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl border hover:scale-105 transition-all"
              style={{ backgroundColor: `${color}20`, borderColor: `${color}50` }}
            >
              {icon}
            </button>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {currencyToEdit ? `Edit "${currencyToEdit.name}"` : 'Create New Currency'}
              </h3>
              <p className="text-xs text-slate-400">
                Configure currency category, earn/sink velocities, drop sources, and gating rules.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-5 bg-slate-950/40 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'basic'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Core Parameters
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sources_sinks')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sources_sinks'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Sources & Sinks
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded-full font-mono">
              {sources.length + sinks.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('conversion')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'conversion'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Exchange Rates
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gating')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'gating'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            4. Gating Rules
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              {/* Quick 1-Click Presets */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Quick Balance Presets:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('lives')}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-left transition-all text-xs"
                  >
                    <div className="font-bold text-rose-300 flex items-center gap-1">
                      ❤️ Lives
                    </div>
                    <div className="text-[10px] text-slate-400">Max 5, 20m Regen</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('coins')}
                    className="p-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-left transition-all text-xs"
                  >
                    <div className="font-bold text-amber-300 flex items-center gap-1">
                      🪙 Gold Coins
                    </div>
                    <div className="text-[10px] text-slate-400">Soft Progression</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('gems')}
                    className="p-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-xl text-left transition-all text-xs"
                  >
                    <div className="font-bold text-sky-300 flex items-center gap-1">
                      💎 Gems
                    </div>
                    <div className="text-[10px] text-slate-400">Hard Monetization</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('energy')}
                    className="p-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-left transition-all text-xs"
                  >
                    <div className="font-bold text-yellow-300 flex items-center gap-1">
                      ⚡ Energy
                    </div>
                    <div className="text-[10px] text-slate-400">Max 30, 10m Regen</div>
                  </button>
                </div>
              </div>

              {/* Name & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Currency Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Gold Coins, Diamonds"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    Economy Category
                    <Tooltip
                      title="Currency Type"
                      content="Hard currency (premium/Gems) is scarce and drives monetization. Soft currency (Coins) is earned freely in gameplay to power core loop upgrades."
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType('soft')}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                        type === 'soft'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      🪙 Soft Currency
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('hard')}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                        type === 'hard'
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      💎 Hard Currency
                    </button>
                  </div>
                </div>
              </div>

              {/* Description & Color */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Standard reward dropped by lane pickups"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Starting Amount & Wallet Cap */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    Starting Player Amount
                    <Tooltip
                      title="Starting Balance"
                      content="The initial balance granted to every new bot or player at session start. Setting this too low with mandatory early costs creates instant soft-locks."
                    />
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={startingAmount}
                    onChange={(e) => setStartingAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                      Wallet Max Cap
                      <Tooltip
                        title="Wallet Soft/Hard Cap"
                        content="Maximum balance a player can hold. When reached, further earnings are discarded, preventing infinite accumulation without spending."
                      />
                    </label>
                    <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasCap}
                        onChange={(e) => setHasCap(e.target.checked)}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      Enable Cap
                    </label>
                  </div>
                  <input
                    type="number"
                    min="1"
                    disabled={!hasCap}
                    value={maxCap}
                    onChange={(e) => setMaxCap(Number(e.target.value))}
                    placeholder={hasCap ? '1,000,000' : 'Unlimited (∞)'}
                    className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500 ${
                      !hasCap ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Passive Time Regeneration (Lives / Stamina) */}
              <div className="bg-rose-950/20 border border-rose-500/30 p-3.5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    ❤️ Passive Time-Based Regeneration (Lives / Stamina)
                    <Tooltip
                      title="Passive Regeneration"
                      content="Automatically regenerates Lives / Stamina over real session time up to the max cap (e.g., +1 Life every 20 minutes)."
                    />
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-rose-300 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasRegen}
                      onChange={(e) => {
                        setHasRegen(e.target.checked);
                        if (e.target.checked && !regenIntervalMinutes) {
                          setRegenIntervalMinutes(20);
                        }
                      }}
                      className="rounded border-rose-500 text-rose-600 focus:ring-0"
                    />
                    Enable Time Regen
                  </label>
                </div>

                {hasRegen && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Regen Interval (Minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1440"
                        value={regenIntervalMinutes ?? 20}
                        onChange={(e) => setRegenIntervalMinutes(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-rose-300 focus:outline-none focus:border-rose-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">e.g. 20 min per life</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Amount Added Per Interval
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={regenAmount}
                        onChange={(e) => setRegenAmount(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-rose-300 focus:outline-none focus:border-rose-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">e.g. +1 Life</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Earn Rate & Sink Rate */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                    Earn Velocity (Per Minute)
                    <Tooltip
                      title="Passive Earn Rate"
                      content="Average currency earned per minute of active gameplay. If hard currency earn velocity exceeds 5/min, it significantly degrades monetization."
                    />
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={earnRatePerMinute}
                    onChange={(e) => setEarnRatePerMinute(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-rose-400 mb-1 flex items-center gap-1">
                    Sink Velocity (Per Minute)
                    <Tooltip
                      title="Spend Sink Rate"
                      content="Average currency consumed by game sinks per minute. If sink velocity exceeds earn velocity, players will run out of resources."
                    />
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={sinkRatePerMinute}
                    onChange={(e) => setSinkRatePerMinute(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-rose-400 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Inflation Factor */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    Session Inflation Factor ({inflationFactor.toFixed(2)})
                    <Tooltip
                      title="Session Inflation Factor"
                      content="Scaling multiplier for rewards as session time advances. 0 = static flat rewards, 1.0 = rewards double by minute 10, 2.0 = hyper scaling."
                    />
                  </label>
                  <span className="text-xs font-mono text-indigo-400">
                    x{(1 + inflationFactor).toFixed(2)} at 10 min
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={inflationFactor}
                  onChange={(e) => setInflationFactor(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>0.0 (Flat)</span>
                  <span>1.0 (Standard Casual)</span>
                  <span>2.0 (Hyper-scaling)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sources_sinks' && (
            <div className="space-y-6">
              {/* Drop Sources */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <h4 className="text-sm font-bold text-slate-200">Currency Sources (Where it Drops)</h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSource}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/30 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Source
                  </button>
                </div>

                <div className="space-y-2.5">
                  {sources.map((source, index) => (
                    <div
                      key={source.id || index}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-5">
                        <label className="text-[10px] text-slate-400 block">Source Name</label>
                        <input
                          type="text"
                          value={source.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSources((prev) =>
                              prev.map((s) => (s.id === source.id ? { ...s, name: val } : s))
                            );
                          }}
                          placeholder="e.g. Level Complete Bonus"
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 block">Min Drop</label>
                        <input
                          type="number"
                          value={source.minAmount}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSources((prev) =>
                              prev.map((s) => (s.id === source.id ? { ...s, minAmount: val } : s))
                            );
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-emerald-400"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 block">Max Drop</label>
                        <input
                          type="number"
                          value={source.maxAmount}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSources((prev) =>
                              prev.map((s) => (s.id === source.id ? { ...s, maxAmount: val } : s))
                            );
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-emerald-400"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 block">Weight</label>
                        <input
                          type="number"
                          value={source.weight}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSources((prev) =>
                              prev.map((s) => (s.id === source.id ? { ...s, weight: val } : s))
                            );
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end pt-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveSource(source.id)}
                          className="text-slate-400 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {sources.length === 0 && (
                    <div className="text-xs text-slate-400 text-center py-4 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
                      No drop sources configured yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Spend Sinks */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <h4 className="text-sm font-bold text-slate-200">Currency Sinks (Where it is Spent)</h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSink}
                    className="flex items-center gap-1 px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold rounded-lg border border-rose-500/30 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Sink
                  </button>
                </div>

                <div className="space-y-2.5">
                  {sinks.map((sink, index) => (
                    <div
                      key={sink.id || index}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-5">
                        <label className="text-[10px] text-slate-400 block">Sink Name</label>
                        <input
                          type="text"
                          value={sink.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSinks((prev) =>
                              prev.map((s) => (s.id === sink.id ? { ...s, name: val } : s))
                            );
                          }}
                          placeholder="e.g. Upgrade Speed Tier"
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[10px] text-slate-400 block">Cost</label>
                        <input
                          type="number"
                          value={sink.cost}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSinks((prev) =>
                              prev.map((s) => (s.id === sink.id ? { ...s, cost: val } : s))
                            );
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-rose-400"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[10px] text-slate-400 block">Frequency</label>
                        <select
                          value={sink.frequency}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSinks((prev) =>
                              prev.map((s) => (s.id === sink.id ? { ...s, frequency: val } : s))
                            );
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                        >
                          <option value="per_run">Per Run</option>
                          <option value="per_level">Per Level</option>
                          <option value="per_session">Per Session</option>
                          <option value="hourly">Hourly</option>
                          <option value="one_time">One-Time</option>
                        </select>
                      </div>
                      <div className="col-span-1 flex justify-end pt-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveSink(sink.id)}
                          className="text-slate-400 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {sinks.length === 0 && (
                    <div className="text-xs text-slate-400 text-center py-4 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
                      No spend sinks configured yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'conversion' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Currency Exchange Rates</h4>
                  <p className="text-xs text-slate-400">
                    Define conversion ratio from 1 unit of this currency into another target currency.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddConversion}
                  className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-500/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Conversion
                </button>
              </div>

              <div className="space-y-3">
                {conversionRate.map((conv, idx) => {
                  const targetCurr = allCurrencies.find((c) => c.id === conv.toCurrencyId);
                  return (
                    <div
                      key={idx}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3"
                    >
                      <div className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                        1 {name || 'This Currency'} =
                      </div>
                      <input
                        type="number"
                        step="0.001"
                        value={conv.rate}
                        onChange={(e) => {
                          const rateVal = Number(e.target.value);
                          setConversionRate((prev) =>
                            prev.map((c, i) => (i === idx ? { ...c, rate: rateVal } : c))
                          );
                        }}
                        className="w-28 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-indigo-300"
                      />
                      <select
                        value={conv.toCurrencyId}
                        onChange={(e) => {
                          const targetId = e.target.value;
                          setConversionRate((prev) =>
                            prev.map((c, i) => (i === idx ? { ...c, toCurrencyId: targetId } : c))
                          );
                        }}
                        className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 flex-1"
                      >
                        {allCurrencies
                          .filter((c) => c.id !== currencyToEdit?.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.icon} {c.name} ({c.type})
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveConversion(conv.toCurrencyId)}
                        className="text-slate-400 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                {conversionRate.length === 0 && (
                  <div className="text-xs text-slate-400 text-center py-6 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
                    No direct exchange conversions active for this currency.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'gating' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-200">Progression & Gating Rules</h4>
                <p className="text-xs text-slate-400">
                  Restrict this currency until the player meets specific level or balance prerequisites.
                </p>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    Minimum Player Level Required
                    <Tooltip
                      title="Gating Level"
                      content="Prevents early-game users from receiving or seeing this currency until reaching the target level. Essential for pacing Hard currency."
                    />
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minPlayerLevel}
                    onChange={(e) => setMinPlayerLevel(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Requires Other Currency
                    </label>
                    <select
                      value={requiresCurrencyId}
                      onChange={(e) => setRequiresCurrencyId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                    >
                      <option value="">None (No Currency Prerequisite)</option>
                      {allCurrencies
                        .filter((c) => c.id !== currencyToEdit?.id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.icon} {c.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Required Threshold Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={!requiresCurrencyId}
                      value={requiresAmount}
                      onChange={(e) => setRequiresAmount(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-md shadow-indigo-600/30 transition-all"
            >
              {currencyToEdit ? 'Save Changes' : 'Create Currency'}
            </button>
          </div>
        </form>
      </div>

      <EmojiPickerModal
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        onSelect={(selected) => setIcon(selected)}
        currentEmoji={icon}
      />
    </div>
  );
};
