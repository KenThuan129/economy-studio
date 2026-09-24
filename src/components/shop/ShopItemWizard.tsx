import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  Package,
  Sparkle,
  Coins,
  ArrowRight,
  ArrowLeft,
  Check,
  Shield,
  Clock,
  Lock,
} from 'lucide-react';
import {
  ShopItem,
  ShopItemCategory,
  Currency,
  PriceOption,
  RealMoneyPrice,
  UnlockCondition,
  BoosterEffect,
  CurrencyPackGrant,
  PurchaseLimit,
} from '../../types/economy';
import { EmojiPickerModal } from '../common/EmojiPickerModal';
import { Tooltip } from '../common/Tooltip';

interface ShopItemWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ShopItem) => void;
  itemToEdit?: ShopItem | null;
  currencies: Currency[];
  allItems: ShopItem[];
}

const CATEGORIES: {
  id: ShopItemCategory;
  name: string;
  icon: string;
  badge: string;
  description: string;
}[] = [
  {
    id: 'booster',
    name: 'Booster / Multiplier',
    icon: '⚡',
    badge: 'Buff',
    description: 'Temporary gameplay multiplier (e.g. 2x Gold for 5 minutes, Auto-tapper).',
  },
  {
    id: 'consumable',
    name: 'Consumable Item',
    icon: '💖',
    badge: 'One-Shot',
    description: 'Single-use charge (e.g. Emergency Revive, Bomb clearing, Energy Drink).',
  },
  {
    id: 'cosmetic',
    name: 'Cosmetic / Skin',
    icon: '🛹',
    badge: 'Permanent',
    description: 'Visual customization (e.g. Character Outfits, Board skins, Trail effects).',
  },
  {
    id: 'currency_pack',
    name: 'Currency Pack / IAP',
    icon: '💰',
    badge: 'Monetized',
    description: 'Direct currency injection (e.g. 100 Gems for $0.99 or 5,000 Coins for 20 Gems).',
  },
];

export const ShopItemWizard: React.FC<ShopItemWizardProps> = ({
  isOpen,
  onClose,
  onSave,
  itemToEdit,
  currencies,
  allItems,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  // Form State
  const [category, setCategory] = useState<ShopItemCategory>('booster');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('⚡');
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [weight, setWeight] = useState(50);

  // Booster effect
  const [boosterCurrencyId, setBoosterCurrencyId] = useState(currencies[0]?.id || '');
  const [boosterMultiplier, setBoosterMultiplier] = useState(2.0);
  const [boosterDurationSec, setBoosterDurationSec] = useState(300);

  // Currency pack grant
  const [packCurrencyId, setPackCurrencyId] = useState(currencies[0]?.id || '');
  const [packAmount, setPackAmount] = useState(100);

  // Pricing
  const [priceOptions, setPriceOptions] = useState<PriceOption[]>([]);
  const [hasRealMoney, setHasRealMoney] = useState(false);
  const [realMoneyUsd, setRealMoneyUsd] = useState(0.99);
  const [realMoneySku, setRealMoneySku] = useState('com.game.pack');

  // Unlock conditions
  const [minPlayerLevel, setMinPlayerLevel] = useState(1);
  const [minSessionMinutes, setMinSessionMinutes] = useState(0);
  const [requiredItemId, setRequiredItemId] = useState('');

  // Purchase Limits
  const [limitPerSession, setLimitPerSession] = useState<number | null>(null);
  const [limitLifetime, setLimitLifetime] = useState<number | null>(null);

  useEffect(() => {
    if (itemToEdit) {
      setCategory(itemToEdit.category);
      setName(itemToEdit.name);
      setIcon(itemToEdit.icon);
      setDescription(itemToEdit.description);
      setIsFeatured(itemToEdit.isFeatured);
      setWeight(itemToEdit.weight);

      if (itemToEdit.boosterEffect) {
        setBoosterCurrencyId(itemToEdit.boosterEffect.affectsCurrencyId);
        setBoosterMultiplier(itemToEdit.boosterEffect.multiplier);
        setBoosterDurationSec(itemToEdit.boosterEffect.durationSec);
      }

      if (itemToEdit.currencyPackGrant) {
        setPackCurrencyId(itemToEdit.currencyPackGrant.currencyId);
        setPackAmount(itemToEdit.currencyPackGrant.amount);
      }

      setPriceOptions(itemToEdit.priceOptions || []);
      setHasRealMoney(itemToEdit.realMoneyPrice !== null);
      setRealMoneyUsd(itemToEdit.realMoneyPrice?.usd || 0.99);
      setRealMoneySku(itemToEdit.realMoneyPrice?.skuLabel || 'com.game.sku');

      setMinPlayerLevel(itemToEdit.unlockCondition.minPlayerLevel || 1);
      setMinSessionMinutes(itemToEdit.unlockCondition.minSessionMinutes || 0);
      setRequiredItemId(itemToEdit.unlockCondition.requiredItemId || '');

      setLimitPerSession(itemToEdit.purchaseLimit.perSession);
      setLimitLifetime(itemToEdit.purchaseLimit.lifetime);
      setCurrentStep(1);
    } else {
      // Defaults
      setCategory('booster');
      setName('');
      setIcon('⚡');
      setDescription('');
      setIsFeatured(false);
      setWeight(50);
      setBoosterCurrencyId(currencies[0]?.id || '');
      setBoosterMultiplier(2.0);
      setBoosterDurationSec(300);
      setPackCurrencyId(currencies[0]?.id || '');
      setPackAmount(100);
      setPriceOptions(currencies.length > 0 ? [{ currencyId: currencies[0].id, amount: 150 }] : []);
      setHasRealMoney(false);
      setRealMoneyUsd(0.99);
      setRealMoneySku('com.game.item');
      setMinPlayerLevel(1);
      setMinSessionMinutes(0);
      setRequiredItemId('');
      setLimitPerSession(null);
      setLimitLifetime(null);
      setCurrentStep(1);
    }
  }, [itemToEdit, isOpen, currencies]);

  if (!isOpen) return null;

  const handleAddPriceOption = () => {
    if (currencies.length === 0) return;
    setPriceOptions((prev) => [
      ...prev,
      { currencyId: currencies[0].id, amount: 100 },
    ]);
  };

  const handleRemovePriceOption = (index: number) => {
    setPriceOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectCategory = (cat: ShopItemCategory) => {
    setCategory(cat);
    // Set appropriate default icon
    if (cat === 'booster') setIcon('⚡');
    if (cat === 'consumable') setIcon('💖');
    if (cat === 'cosmetic') setIcon('🛹');
    if (cat === 'currency_pack') setIcon('💰');
  };

  const handleFinish = () => {
    if (!name.trim()) return;

    const item: ShopItem = {
      id: itemToEdit ? itemToEdit.id : `item_${Date.now()}`,
      name: name.trim(),
      icon: icon || '🎁',
      description: description.trim(),
      category,
      priceOptions,
      realMoneyPrice: hasRealMoney
        ? { usd: Number(realMoneyUsd) || 0.99, skuLabel: realMoneySku }
        : null,
      unlockCondition: {
        minPlayerLevel: Number(minPlayerLevel) || 1,
        minSessionMinutes: Number(minSessionMinutes) || 0,
        requiredItemId: requiredItemId || undefined,
      },
      boosterEffect:
        category === 'booster'
          ? {
              affectsCurrencyId: boosterCurrencyId || currencies[0]?.id || '',
              multiplier: Number(boosterMultiplier) || 2.0,
              durationSec: Number(boosterDurationSec) || 300,
            }
          : undefined,
      currencyPackGrant:
        category === 'currency_pack'
          ? {
              currencyId: packCurrencyId || currencies[0]?.id || '',
              amount: Number(packAmount) || 100,
            }
          : undefined,
      purchaseLimit: {
        perDay: null,
        perSession: limitPerSession,
        lifetime: limitLifetime,
      },
      weight: Number(weight) || 50,
      isFeatured,
    };

    onSave(item);
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
              className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl hover:scale-105 transition-all"
            >
              {icon}
            </button>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Item Wizard • Step {currentStep} of 4
              </div>
              <h3 className="text-base font-bold text-slate-100">
                {itemToEdit ? `Edit "${itemToEdit.name}"` : 'Create New Shop Item'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Bar */}
        <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950/40 text-center text-xs font-semibold">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`py-3 border-b-2 transition-colors ${
              currentStep === 1
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Type
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`py-3 border-b-2 transition-colors ${
              currentStep === 2
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Details
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`py-3 border-b-2 transition-colors ${
              currentStep === 3
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Pricing
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            className={`py-3 border-b-2 transition-colors ${
              currentStep === 4
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            4. Limits
          </button>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* STEP 1: Type Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-200">Select Item Archetype</h4>
                <p className="text-xs text-slate-400">
                  Choose how this item behaves in the game economy and player progression loop.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      category === cat.id
                        ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-3xl">{cat.icon}</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                        {cat.badge}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="font-bold text-sm text-slate-100">{cat.name}</div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{cat.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Details & Effects */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. 2x Speed Potion, Revive Token"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Store Drop Weight
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Item Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Doubles gold gain for 5 minutes"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Booster Specific Controls */}
              {category === 'booster' && (
                <div className="bg-slate-950/60 p-4 rounded-xl border border-indigo-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <Zap className="w-4 h-4" /> Booster Buff Parameters
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Boost Currency</label>
                      <select
                        value={boosterCurrencyId}
                        onChange={(e) => setBoosterCurrencyId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                      >
                        {currencies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.icon} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Multiplier</label>
                      <input
                        type="number"
                        step="0.5"
                        min="1.5"
                        value={boosterMultiplier}
                        onChange={(e) => setBoosterMultiplier(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-indigo-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Duration (Sec)</label>
                      <input
                        type="number"
                        step="30"
                        min="10"
                        value={boosterDurationSec}
                        onChange={(e) => setBoosterDurationSec(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Currency Pack Specific Controls */}
              {category === 'currency_pack' && (
                <div className="bg-slate-950/60 p-4 rounded-xl border border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Coins className="w-4 h-4" /> Currency Pack Payout
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Currency Granted</label>
                      <select
                        value={packCurrencyId}
                        onChange={(e) => setPackCurrencyId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                      >
                        {currencies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.icon} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Amount Granted</label>
                      <input
                        type="number"
                        min="1"
                        value={packAmount}
                        onChange={(e) => setPackAmount(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-amber-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Featured toggle */}
              <label className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Feature on Shop Carousel Banner
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Places this item in top featured deal slots in the mobile store preview.
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* STEP 3: Multi-Currency & Real Money Pricing */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-slate-200">Game Currency Price Options</h4>
                  <button
                    type="button"
                    onClick={handleAddPriceOption}
                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-500/30 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Price Option
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Players can choose to buy with any of these configured currencies.
                </p>

                <div className="space-y-2.5">
                  {priceOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3"
                    >
                      <select
                        value={opt.currencyId}
                        onChange={(e) => {
                          const cid = e.target.value;
                          setPriceOptions((prev) =>
                            prev.map((p, i) => (i === idx ? { ...p, currencyId: cid } : p))
                          );
                        }}
                        className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 flex-1"
                      >
                        {currencies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.icon} {c.name} ({c.type})
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] text-slate-400">Amount:</label>
                        <input
                          type="number"
                          min="1"
                          value={opt.amount}
                          onChange={(e) => {
                            const amt = Number(e.target.value);
                            setPriceOptions((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, amount: amt } : p))
                            );
                          }}
                          className="w-28 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-amber-300"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemovePriceOption(idx)}
                        className="text-slate-400 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {priceOptions.length === 0 && !hasRealMoney && (
                    <div className="text-xs text-slate-400 text-center py-4 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
                      No currency pricing set. (Item will be Free unless real money is configured).
                    </div>
                  )}
                </div>
              </div>

              {/* Real Money IAP Option */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasRealMoney}
                    onChange={(e) => setHasRealMoney(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      Enable Real Money In-App Purchase (USD)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Allow players to buy this item directly with real money via App Store / Google Play.
                    </div>
                  </div>
                </label>

                {hasRealMoney && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">USD Price</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.49"
                        value={realMoneyUsd}
                        onChange={(e) => setRealMoneyUsd(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">SKU Label</label>
                      <input
                        type="text"
                        value={realMoneySku}
                        onChange={(e) => setRealMoneySku(e.target.value)}
                        placeholder="e.g. com.game.starterpack"
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-300"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Unlock Conditions & Purchase Limits */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> Unlock Prerequisites
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Min Player Level</label>
                    <input
                      type="number"
                      min="1"
                      value={minPlayerLevel}
                      onChange={(e) => setMinPlayerLevel(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Min Session Time (Min)</label>
                    <input
                      type="number"
                      min="0"
                      value={minSessionMinutes}
                      onChange={(e) => setMinSessionMinutes(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Requires Prior Item</label>
                    <select
                      value={requiredItemId}
                      onChange={(e) => setRequiredItemId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      <option value="">None</option>
                      {allItems
                        .filter((i) => i.id !== itemToEdit?.id)
                        .map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.icon} {i.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" /> Purchase Limits (Scarcity)
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Per-Session Limit</label>
                    <input
                      type="number"
                      min="1"
                      value={limitPerSession ?? ''}
                      placeholder="Unlimited (∞)"
                      onChange={(e) =>
                        setLimitPerSession(e.target.value ? Number(e.target.value) : null)
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Lifetime Account Limit</label>
                    <input
                      type="number"
                      min="1"
                      value={limitLifetime ?? ''}
                      placeholder="Unlimited (∞)"
                      onChange={(e) =>
                        setLimitLifetime(e.target.value ? Number(e.target.value) : null)
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 2 && !name.trim()) {
                    alert('Please enter an item name.');
                    return;
                  }
                  setCurrentStep((prev) => prev + 1);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-md shadow-indigo-600/30"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
              >
                <Check className="w-4 h-4" />
                {itemToEdit ? 'Save Item' : 'Add to Shop'}
              </button>
            )}
          </div>
        </div>
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
