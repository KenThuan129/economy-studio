import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  Coins,
  Gem,
  Heart,
  Zap,
  CheckCircle2,
  TrendingUp,
  Percent,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Currency, ShopItem } from '../../types/economy';

interface RemoveAdsBalancerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencies: Currency[];
  onApplyBundles: (items: ShopItem[]) => void;
}

export const RemoveAdsBalancerModal: React.FC<RemoveAdsBalancerModalProps> = ({
  isOpen,
  onClose,
  currencies,
  onApplyBundles,
}) => {
  // Find soft & hard currency candidates
  const softCurr = currencies.find((c) => c.type === 'soft') || currencies[0];
  const hardCurr = currencies.find((c) => c.type === 'hard') || currencies[1] || currencies[0];
  const livesCurr = currencies.find((c) => c.name.toLowerCase().includes('live') || c.id.includes('live')) || softCurr;

  // Configurable tier parameters
  const [soloPriceUsd, setSoloPriceUsd] = useState(2.99);
  const [coinsBundlePriceUsd, setCoinsBundlePriceUsd] = useState(3.99);
  const [coinsAmount, setCoinsAmount] = useState(2500);

  const [gemsBundlePriceUsd, setGemsBundlePriceUsd] = useState(4.99);
  const [gemsAmount, setGemsAmount] = useState(250);

  const [megaBundlePriceUsd, setMegaBundlePriceUsd] = useState(9.99);
  const [megaCoins, setMegaCoins] = useState(5000);
  const [megaGems, setMegaGems] = useState(500);
  const [megaLives, setMegaLives] = useState(5);
  const [megaBoosters, setMegaBoosters] = useState(3);

  const [appliedNotification, setAppliedNotification] = useState(false);

  if (!isOpen) return null;

  // Calculators
  const calcCoinValueUsd = (coins: number) => (coins / 1000) * 0.99; // approx $0.99 per 1k coins
  const calcGemValueUsd = (gems: number) => (gems / 100) * 1.99; // approx $1.99 per 100 gems
  const baseAdRemovalValue = 2.99;

  // 1. Solo Value & Multiplier
  const soloValue = baseAdRemovalValue;
  const soloMultiplier = Math.round((soloValue / soloPriceUsd) * 100);

  // 2. Coins Bundle Value & Multiplier
  const coinsBundleRealValue = baseAdRemovalValue + calcCoinValueUsd(coinsAmount);
  const coinsBundleMultiplier = Math.round((coinsBundleRealValue / coinsBundlePriceUsd) * 100);

  // 3. Gems Bundle Value & Multiplier
  const gemsBundleRealValue = baseAdRemovalValue + calcGemValueUsd(gemsAmount);
  const gemsBundleMultiplier = Math.round((gemsBundleRealValue / gemsBundlePriceUsd) * 100);

  // 4. Mega Bundle Value & Multiplier
  const megaRealValue =
    baseAdRemovalValue +
    calcCoinValueUsd(megaCoins) +
    calcGemValueUsd(megaGems) +
    megaLives * 0.5 +
    megaBoosters * 0.75;
  const megaMultiplier = Math.round((megaRealValue / megaBundlePriceUsd) * 100);

  // Projected conversion models
  const projSoloConv = 2.2;
  const projCoinsConv = 3.6;
  const projGemsConv = 2.9;
  const projMegaConv = 1.8;
  const blendedArpuEstimate = (
    (soloPriceUsd * projSoloConv +
      coinsBundlePriceUsd * projCoinsConv +
      gemsBundlePriceUsd * projGemsConv +
      megaBundlePriceUsd * projMegaConv) /
    100
  ).toFixed(2);

  const handleApplyAll = () => {
    const bundlesToCreate: ShopItem[] = [
      // 1. Small Remove Ads Solo
      {
        id: 'item_remove_ads_solo',
        name: 'Ad-Free Standard',
        icon: '🛡️',
        description: 'Permanently eliminates all forced interstitial and banner advertisements forever.',
        category: 'remove_ads',
        priceOptions: [],
        realMoneyPrice: { usd: soloPriceUsd, skuLabel: 'com.game.removeads.solo' },
        unlockCondition: { minPlayerLevel: 1, minSessionMinutes: 0 },
        purchaseLimit: { perDay: 1, perSession: 1, lifetime: 1 },
        weight: 90,
        isFeatured: false,
        isRemoveAds: true,
        bundleSummary: {
          perks: ['Zero Banner Ads', 'Zero Forced Interstitials', 'VIP Support'],
        },
        valueBadge: `${soloMultiplier}% Value`,
      },

      // 2. Remove Ads + Coins Bundle
      {
        id: 'item_remove_ads_coins',
        name: 'No-Ads Starter Coin Pack',
        icon: '🪙',
        description: `Permanently removes all forced ads and instantly grants +${coinsAmount.toLocaleString()} ${softCurr?.name || 'Coins'}.`,
        category: 'bundle',
        priceOptions: [],
        realMoneyPrice: { usd: coinsBundlePriceUsd, skuLabel: 'com.game.removeads.coins' },
        unlockCondition: { minPlayerLevel: 1, minSessionMinutes: 0 },
        purchaseLimit: { perDay: 1, perSession: 1, lifetime: 1 },
        weight: 95,
        isFeatured: true,
        isRemoveAds: true,
        bundledCurrencies: softCurr ? [{ currencyId: softCurr.id, amount: coinsAmount }] : [],
        bundleSummary: {
          coins: coinsAmount,
          perks: ['Remove All Forced Ads', `+${coinsAmount.toLocaleString()} ${softCurr?.name || 'Coins'}`],
        },
        valueBadge: `+${coinsBundleMultiplier - 100}% Extra Value`,
      },

      // 3. Remove Ads + Gems Bundle
      {
        id: 'item_remove_ads_gems',
        name: 'No-Ads Gem Vault Pack',
        icon: '💎',
        description: `Permanently removes all forced ads and provides +${gemsAmount.toLocaleString()} ${hardCurr?.name || 'Gems'} for revives and chests.`,
        category: 'bundle',
        priceOptions: [],
        realMoneyPrice: { usd: gemsBundlePriceUsd, skuLabel: 'com.game.removeads.gems' },
        unlockCondition: { minPlayerLevel: 1, minSessionMinutes: 0 },
        purchaseLimit: { perDay: 1, perSession: 1, lifetime: 1 },
        weight: 95,
        isFeatured: true,
        isRemoveAds: true,
        bundledCurrencies: hardCurr ? [{ currencyId: hardCurr.id, amount: gemsAmount }] : [],
        bundleSummary: {
          gems: gemsAmount,
          perks: ['Remove All Forced Ads', `+${gemsAmount.toLocaleString()} ${hardCurr?.name || 'Gems'}`],
        },
        valueBadge: `+${gemsBundleMultiplier - 100}% Extra Value`,
      },

      // 4. Ultimate No-Ads Super Bundle
      {
        id: 'item_remove_ads_ultimate',
        name: 'Ultimate No-Ads Super Bundle',
        icon: '👑',
        description: `The complete VIP experience: No-Ads + ${megaCoins.toLocaleString()} ${softCurr?.name || 'Coins'} + ${megaGems} ${hardCurr?.name || 'Gems'} + ${megaLives} ${livesCurr?.name || 'Lives'} + ${megaBoosters} Revive Boosters.`,
        category: 'bundle',
        priceOptions: [],
        realMoneyPrice: { usd: megaBundlePriceUsd, skuLabel: 'com.game.removeads.ultimate' },
        unlockCondition: { minPlayerLevel: 1, minSessionMinutes: 0 },
        purchaseLimit: { perDay: 1, perSession: 1, lifetime: 1 },
        weight: 100,
        isFeatured: true,
        isRemoveAds: true,
        bundledCurrencies: [
          ...(softCurr ? [{ currencyId: softCurr.id, amount: megaCoins }] : []),
          ...(hardCurr && hardCurr.id !== softCurr?.id ? [{ currencyId: hardCurr.id, amount: megaGems }] : []),
          ...(livesCurr && livesCurr.id !== softCurr?.id && livesCurr.id !== hardCurr?.id
            ? [{ currencyId: livesCurr.id, amount: megaLives }]
            : []),
        ],
        bundleSummary: {
          coins: megaCoins,
          gems: megaGems,
          lives: megaLives,
          boosters: megaBoosters,
          perks: [
            'Permanently Remove All Ads',
            `+${megaCoins.toLocaleString()} ${softCurr?.name || 'Coins'}`,
            `+${megaGems} ${hardCurr?.name || 'Gems'}`,
            `+${megaLives} Extra ${livesCurr?.name || 'Lives'}`,
            `+${megaBoosters} Instant Revives`,
          ],
        },
        valueBadge: `+${megaMultiplier - 100}% BEST VALUE`,
      },
    ];

    onApplyBundles(bundlesToCreate);
    setAppliedNotification(true);
    setTimeout(() => {
      setAppliedNotification(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl shadow-lg shadow-amber-500/10">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  Remove Ads Packaging & Monetization Balancer
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  4 Tier Suite
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Balance perceived value multipliers, price elasticity, and ARPU impact across Solo, Coins, Gems, and Ultimate bundles.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Top Metric Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Estimated Net ARPU
              </span>
              <div className="text-xl font-black text-emerald-400 mt-0.5 font-mono">
                ${blendedArpuEstimate}
              </div>
              <span className="text-[10px] text-emerald-500 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +42% vs Solo Ad-Free
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Decoy Conversion Lift
              </span>
              <div className="text-xl font-black text-amber-400 mt-0.5 font-mono">
                ~10.5%
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Combined cohort conversion
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Top Seller Prediction
              </span>
              <div className="text-xl font-black text-indigo-400 mt-0.5">
                Coin Pack ($3.99)
              </div>
              <span className="text-[10px] text-indigo-400/80 mt-1 block">
                Highest casual impulse buy
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Mega Bundle Value
              </span>
              <div className="text-xl font-black text-pink-400 mt-0.5 font-mono">
                {megaMultiplier}%
              </div>
              <span className="text-[10px] text-pink-400/80 mt-1 block">
                Best value anchor for whales
              </span>
            </div>
          </div>

          {/* 4 Packaging Tiers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* TIER 1: Solo Remove Ads */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold">
                    Tier 1 (Base)
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-base">
                    🛡️
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-white">Ad-Free Standard</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Pure No-Ads with zero currency extras</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Price (USD):</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.99"
                      max="9.99"
                      value={soloPriceUsd}
                      onChange={(e) => setSoloPriceUsd(Number(e.target.value))}
                      className="w-16 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono font-bold text-white text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5">
                    <span>Est. Conv:</span>
                    <span className="font-mono text-slate-200 font-bold">{projSoloConv}%</span>
                  </div>
                </div>

                <ul className="space-y-1.5 text-[11px] text-slate-300 pt-1">
                  <li className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Removes all forced ads
                  </li>
                  <li className="flex items-center gap-1.5 text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Optional rewarded ads stay
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 font-mono block">Anchor Baseline</span>
                <span className="text-sm font-extrabold text-slate-300">${soloPriceUsd}</span>
              </div>
            </div>

            {/* TIER 2: Remove Ads + Coins */}
            <div className="bg-slate-950/90 border-2 border-amber-500/40 rounded-3xl p-4 flex flex-col justify-between hover:border-amber-400 transition-all shadow-lg shadow-amber-500/5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                    +150% Value
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-base">
                    🪙
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-white">No-Ads + Coins Pack</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">High converting starter progression</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Price (USD):</span>
                    <input
                      type="number"
                      step="0.5"
                      min="1.99"
                      max="14.99"
                      value={coinsBundlePriceUsd}
                      onChange={(e) => setCoinsBundlePriceUsd(Number(e.target.value))}
                      className="w-16 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono font-bold text-amber-300 text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Coins Grant:</span>
                    <input
                      type="number"
                      step="500"
                      min="500"
                      max="50000"
                      value={coinsAmount}
                      onChange={(e) => setCoinsAmount(Number(e.target.value))}
                      className="w-20 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono font-bold text-white text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5">
                    <span>Est. Conv:</span>
                    <span className="font-mono text-emerald-400 font-bold">{projCoinsConv}% 🔥</span>
                  </div>
                </div>

                <ul className="space-y-1.5 text-[11px] text-slate-300 pt-1">
                  <li className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Permanent Ad-Free
                  </li>
                  <li className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> +{coinsAmount.toLocaleString()} {softCurr?.name || 'Coins'}
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-center">
                <span className="text-[10px] text-amber-400 font-mono block font-bold">
                  {coinsBundleMultiplier}% Perceived Value
                </span>
                <span className="text-sm font-extrabold text-amber-300">${coinsBundlePriceUsd}</span>
              </div>
            </div>

            {/* TIER 3: Remove Ads + Gems */}
            <div className="bg-slate-950/90 border-2 border-indigo-500/40 rounded-3xl p-4 flex flex-col justify-between hover:border-indigo-400 transition-all shadow-lg shadow-indigo-500/5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                    +200% Value
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-base">
                    💎
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-white">No-Ads + Gems Vault</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Revive & continue acceleration</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Price (USD):</span>
                    <input
                      type="number"
                      step="0.5"
                      min="2.99"
                      max="19.99"
                      value={gemsBundlePriceUsd}
                      onChange={(e) => setGemsBundlePriceUsd(Number(e.target.value))}
                      className="w-16 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono font-bold text-indigo-300 text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Gems Grant:</span>
                    <input
                      type="number"
                      step="50"
                      min="50"
                      max="5000"
                      value={gemsAmount}
                      onChange={(e) => setGemsAmount(Number(e.target.value))}
                      className="w-16 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono font-bold text-white text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5">
                    <span>Est. Conv:</span>
                    <span className="font-mono text-indigo-300 font-bold">{projGemsConv}%</span>
                  </div>
                </div>

                <ul className="space-y-1.5 text-[11px] text-slate-300 pt-1">
                  <li className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Permanent Ad-Free
                  </li>
                  <li className="flex items-center gap-1.5 text-indigo-300 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> +{gemsAmount} {hardCurr?.name || 'Gems'}
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-center">
                <span className="text-[10px] text-indigo-400 font-mono block font-bold">
                  {gemsBundleMultiplier}% Perceived Value
                </span>
                <span className="text-sm font-extrabold text-indigo-300">${gemsBundlePriceUsd}</span>
              </div>
            </div>

            {/* TIER 4: Ultimate Super Bundle */}
            <div className="bg-gradient-to-b from-purple-950/50 to-slate-950/90 border-2 border-pink-500/60 rounded-3xl p-4 flex flex-col justify-between hover:border-pink-400 transition-all shadow-xl shadow-pink-500/10 relative">
              <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-md">
                👑 Best Value
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 text-[10px] font-bold border border-pink-500/30">
                    +350% MEGA
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-300 flex items-center justify-center text-base">
                    👑
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-white">Ultimate No-Ads Super Pack</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Coins, Gems, Lives & Revives bundle</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Price (USD):</span>
                    <input
                      type="number"
                      step="1"
                      min="4.99"
                      max="29.99"
                      value={megaBundlePriceUsd}
                      onChange={(e) => setMegaBundlePriceUsd(Number(e.target.value))}
                      className="w-16 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono font-bold text-pink-300 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    <div className="bg-slate-950/60 p-1 rounded border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Coins:</span>
                      <span className="font-mono text-amber-300">{megaCoins}</span>
                    </div>
                    <div className="bg-slate-950/60 p-1 rounded border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Gems:</span>
                      <span className="font-mono text-indigo-300">{megaGems}</span>
                    </div>
                    <div className="bg-slate-950/60 p-1 rounded border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Lives:</span>
                      <span className="font-mono text-pink-300">+{megaLives}</span>
                    </div>
                    <div className="bg-slate-950/60 p-1 rounded border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Revives:</span>
                      <span className="font-mono text-emerald-300">+{megaBoosters}</span>
                    </div>
                  </div>
                </div>

                <ul className="space-y-1 text-[10px] text-slate-300 pt-0.5">
                  <li className="flex items-center gap-1 text-pink-400">
                    <CheckCircle2 className="w-3 h-3 shrink-0" /> Permanent Ad-Free VIP
                  </li>
                  <li className="flex items-center gap-1 text-slate-300">
                    <CheckCircle2 className="w-3 h-3 shrink-0" /> +{megaCoins} {softCurr?.name || 'Coins'} & {megaGems} {hardCurr?.name || 'Gems'}
                  </li>
                  <li className="flex items-center gap-1 text-slate-300">
                    <CheckCircle2 className="w-3 h-3 shrink-0" /> +{megaLives} Lives & {megaBoosters} Revive Boosters
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-center">
                <span className="text-[10px] text-pink-400 font-mono block font-bold">
                  {megaMultiplier}% Perceived Value
                </span>
                <span className="text-sm font-extrabold text-pink-300">${megaBundlePriceUsd}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Applying will inject these 4 balanced packages with matching SKUs and value multipliers into your Shop.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApplyAll}
              disabled={appliedNotification}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-purple-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {appliedNotification ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>4 Packages Injected to Shop!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Apply All 4 Remove Ads Packages</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
