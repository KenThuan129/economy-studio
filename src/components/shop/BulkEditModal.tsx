import React, { useState } from 'react';
import { X, Percent, Lock, Check, Sparkles } from 'lucide-react';
import { ShopItem } from '../../types/economy';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItemIds: string[];
  allItems: ShopItem[];
  onApply: (updatedIds: string[], updates: Partial<ShopItem>) => void;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  onClose,
  selectedItemIds,
  allItems,
  onApply,
}) => {
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [applyDiscount, setApplyDiscount] = useState(false);

  const [minPlayerLevel, setMinPlayerLevel] = useState<number>(2);
  const [applyLevel, setApplyLevel] = useState(false);

  const [toggleFeatured, setToggleFeatured] = useState<boolean>(true);
  const [applyFeatured, setApplyFeatured] = useState(false);

  if (!isOpen || selectedItemIds.length === 0) return null;

  const handleSave = () => {
    const selectedItems = allItems.filter((it) => selectedItemIds.includes(it.id));

    for (const item of selectedItems) {
      const updates: Partial<ShopItem> = {};

      if (applyDiscount && discountPercent > 0) {
        const factor = (100 - discountPercent) / 100;
        updates.priceOptions = item.priceOptions.map((p) => ({
          ...p,
          amount: Math.max(1, Math.round(p.amount * factor)),
        }));
        if (item.realMoneyPrice) {
          updates.realMoneyPrice = {
            ...item.realMoneyPrice,
            usd: Math.max(0.49, Math.round(item.realMoneyPrice.usd * factor * 100) / 100),
          };
        }
      }

      if (applyLevel) {
        updates.unlockCondition = {
          ...item.unlockCondition,
          minPlayerLevel: Number(minPlayerLevel),
        };
      }

      if (applyFeatured) {
        updates.isFeatured = toggleFeatured;
      }

      onApply([item.id], updates);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl shadow-black/80 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-100">Bulk Edit Items</h3>
            <p className="text-xs text-slate-400">
              Applying changes to <strong className="text-indigo-400">{selectedItemIds.length}</strong> selected items.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Discount option */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={applyDiscount}
                onChange={(e) => setApplyDiscount(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-amber-400" /> Apply Batch Price Discount
              </span>
            </label>
            {applyDiscount && (
              <div className="flex items-center gap-2 pl-6">
                <input
                  type="number"
                  min="5"
                  max="90"
                  step="5"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-amber-400"
                />
                <span className="text-xs text-slate-400">% Off (All currency & IAP prices)</span>
              </div>
            )}
          </div>

          {/* Unlock Level option */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={applyLevel}
                onChange={(e) => setApplyLevel(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-indigo-400" /> Set Shared Unlock Level
              </span>
            </label>
            {applyLevel && (
              <div className="flex items-center gap-2 pl-6">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={minPlayerLevel}
                  onChange={(e) => setMinPlayerLevel(Number(e.target.value))}
                  className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200"
                />
                <span className="text-xs text-slate-400">Min Player Level</span>
              </div>
            )}
          </div>

          {/* Featured Carousel option */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={applyFeatured}
                onChange={(e) => setApplyFeatured(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Update Featured Carousel Status
              </span>
            </label>
            {applyFeatured && (
              <div className="flex items-center gap-3 pl-6">
                <label className="flex items-center gap-1 text-xs text-slate-300">
                  <input
                    type="radio"
                    name="feat"
                    checked={toggleFeatured}
                    onChange={() => setToggleFeatured(true)}
                  />
                  Feature in Carousel
                </label>
                <label className="flex items-center gap-1 text-xs text-slate-300">
                  <input
                    type="radio"
                    name="feat"
                    checked={!toggleFeatured}
                    onChange={() => setToggleFeatured(false)}
                  />
                  Unfeature
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-md shadow-indigo-600/30 flex items-center gap-1"
          >
            <Check className="w-4 h-4" /> Apply to {selectedItemIds.length} Items
          </button>
        </div>
      </div>
    </div>
  );
};
