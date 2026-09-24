import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Zap,
  ShoppingBag,
  Clock,
  Check,
  ChevronRight,
  Flame,
  Star,
  Smartphone,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ShopItem, Currency, ShopItemCategory } from '../../types/economy';

interface ShopMockupPreviewProps {
  items: ShopItem[];
  currencies: Currency[];
}

export const ShopMockupPreview: React.FC<ShopMockupPreviewProps> = ({ items, currencies }) => {
  const [activeTab, setActiveTab] = useState<ShopItemCategory | 'all'>('all');
  const [playerLevel, setPlayerLevel] = useState<number>(2);
  const [purchasedIds, setPurchasedIds] = useState<Record<string, number>>({});
  const [lastPurchased, setLastPurchased] = useState<string | null>(null);

  const featuredItems = items.filter((item) => item.isFeatured);
  const filteredItems = items.filter((item) => (activeTab === 'all' ? true : item.category === activeTab));

  const handleTestBuy = (item: ShopItem, e: React.MouseEvent) => {
    // Trigger confetti
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      origin: { x, y },
      particleCount: 25,
      spread: 60,
      colors: ['#6366f1', '#ec4899', '#f59e0b', '#10b981'],
    });

    setPurchasedIds((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));
    setLastPurchased(item.name);
    setTimeout(() => setLastPurchased(null), 2500);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl shadow-black/60 flex flex-col items-center">
      {/* Phone Mockup Frame */}
      <div className="w-full max-w-[360px] bg-slate-950 border-[6px] border-slate-800 rounded-[36px] overflow-hidden shadow-2xl relative flex flex-col min-h-[640px]">
        {/* Phone Notch & Status Bar */}
        <div className="h-6 bg-slate-950 flex items-center justify-between px-6 pt-1 text-[10px] text-slate-500 font-mono select-none">
          <span>9:41</span>
          <div className="w-16 h-3 bg-slate-900 rounded-full mx-auto" />
          <span>5G 100%</span>
        </div>

        {/* Top Game Resource Bar */}
        <div className="bg-slate-900/95 border-b border-slate-800/80 px-3 py-2 flex items-center justify-between gap-1.5 z-10">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {currencies.map((curr) => (
              <div
                key={curr.id}
                className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-full border border-slate-800 text-[11px] font-mono font-bold shrink-0"
              >
                <span>{curr.icon}</span>
                <span className="text-slate-200">
                  {curr.startingAmount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Player Level Simulator */}
          <div className="flex items-center gap-1 text-[10px] font-bold bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded-full shrink-0">
            <span>LVL</span>
            <select
              value={playerLevel}
              onChange={(e) => setPlayerLevel(Number(e.target.value))}
              className="bg-transparent font-mono cursor-pointer focus:outline-none"
            >
              {[1, 2, 3, 5, 10, 20].map((lvl) => (
                <option key={lvl} value={lvl} className="bg-slate-900 text-white">
                  {lvl}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Shop Title & Banner */}
        <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900 p-3 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-pink-400" />
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Hyper Store
            </h4>
          </div>
          <span className="text-[10px] font-semibold text-amber-300 flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
            <Flame className="w-3 h-3 fill-current" /> Daily Deals
          </span>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-900/60 border-b border-slate-800 overflow-x-auto no-scrollbar text-[11px] font-bold">
          {(['all', 'booster', 'consumable', 'cosmetic', 'currency_pack'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap transition-all ${
                activeTab === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Toast alert on test buy */}
        {lastPurchased && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
            <Check className="w-3.5 h-3.5" />
            <span>Purchased {lastPurchased}!</span>
          </div>
        )}

        {/* Shop Items Scroll View */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {/* Featured Hero Carousel Banner */}
          {featuredItems.length > 0 && activeTab === 'all' && (
            <div className="bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-pink-600/30 border border-indigo-500/40 rounded-2xl p-3.5 relative overflow-hidden shadow-lg">
              <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-amber-300 mb-1">
                <Star className="w-3 h-3 fill-current" /> Special Featured Offer
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="text-3xl bg-slate-900/80 p-2 rounded-xl border border-indigo-500/30 shadow-md">
                    {featuredItems[0].icon}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white line-clamp-1">
                      {featuredItems[0].name}
                    </h5>
                    <p className="text-[10px] text-slate-300 line-clamp-1">
                      {featuredItems[0].description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-indigo-500/20">
                <div className="text-[10px] text-indigo-200 font-mono">
                  {featuredItems[0].realMoneyPrice
                    ? `$${featuredItems[0].realMoneyPrice.usd.toFixed(2)} USD`
                    : featuredItems[0].priceOptions.map((p) => `${p.amount} ${currencies.find(c => c.id === p.currencyId)?.icon || ''}`).join(' or ')}
                </div>
                <button
                  type="button"
                  onClick={(e) => handleTestBuy(featuredItems[0], e)}
                  className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-[11px] rounded-lg shadow-md transition-all active:scale-95"
                >
                  CLAIM DEAL
                </button>
              </div>
            </div>
          )}

          {/* Grid of Catalog Items */}
          <div className="grid grid-cols-1 gap-2.5">
            {filteredItems.map((item) => {
              const isLocked = item.unlockCondition.minPlayerLevel > playerLevel;
              const boughtCount = purchasedIds[item.id] || 0;
              const isLimitReached =
                item.purchaseLimit.lifetime !== null && boughtCount >= item.purchaseLimit.lifetime;

              return (
                <div
                  key={item.id}
                  className={`bg-slate-900/80 border rounded-xl p-2.5 flex items-center justify-between gap-3 transition-all ${
                    isLocked
                      ? 'border-slate-800 opacity-60'
                      : isLimitReached
                      ? 'border-slate-800 opacity-50 bg-slate-950/40'
                      : 'border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-xl shrink-0 border border-slate-800 relative">
                      {item.icon}
                      {isLocked && (
                        <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h6 className="text-xs font-bold text-slate-100 truncate">{item.name}</h6>
                        {item.boosterEffect && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            x{item.boosterEffect.multiplier}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {isLocked
                          ? `Unlocks at Level ${item.unlockCondition.minPlayerLevel}`
                          : item.description || item.category}
                      </p>
                    </div>
                  </div>

                  {/* Buy / Price Button */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {isLimitReached ? (
                      <span className="text-[10px] font-bold text-slate-500 px-2 py-1 rounded bg-slate-800 border border-slate-700">
                        Sold Out
                      </span>
                    ) : isLocked ? (
                      <button
                        disabled
                        className="px-3 py-1 bg-slate-800 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-700 cursor-not-allowed flex items-center gap-1"
                      >
                        <Lock className="w-3 h-3" /> Lvl {item.unlockCondition.minPlayerLevel}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleTestBuy(item, e)}
                        className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-[11px] font-black rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1"
                      >
                        {item.realMoneyPrice ? (
                          <span>${item.realMoneyPrice.usd.toFixed(2)}</span>
                        ) : item.priceOptions.length > 0 ? (
                          <span className="flex items-center gap-1">
                            <span>{currencies.find((c) => c.id === item.priceOptions[0].currencyId)?.icon || '🪙'}</span>
                            <span>{item.priceOptions[0].amount.toLocaleString()}</span>
                          </span>
                        ) : (
                          <span>Free</span>
                        )}
                      </button>
                    )}

                    {boughtCount > 0 && (
                      <span className="text-[9px] text-slate-400 font-mono">
                        Owned: {boughtCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="text-center py-10 text-xs text-slate-500">
                No items in this category.
              </div>
            )}
          </div>
        </div>

        {/* Phone Bottom Home Bar */}
        <div className="h-5 bg-slate-950 flex items-center justify-center">
          <div className="w-24 h-1 bg-slate-700 rounded-full" />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
        <span>Live Game Preview • Click buttons to simulate player purchases</span>
      </div>
    </div>
  );
};
