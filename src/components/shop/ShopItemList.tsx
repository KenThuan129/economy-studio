import React, { useState } from 'react';
import {
  Edit3,
  Copy,
  Trash2,
  Sparkles,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Layers,
  Star,
  ChevronDown,
  ChevronUp,
  Lock,
  Zap,
} from 'lucide-react';
import { ShopItem, Currency, ShopItemCategory } from '../../types/economy';
import { PricingAffordabilityHelper } from './PricingAffordabilityHelper';

interface ShopItemListProps {
  items: ShopItem[];
  currencies: Currency[];
  onEdit: (item: ShopItem) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (newItems: ShopItem[]) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onOpenBulkEdit: () => void;
}

export const ShopItemList: React.FC<ShopItemListProps> = ({
  items,
  currencies,
  onEdit,
  onDuplicate,
  onDelete,
  onReorder,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onOpenBulkEdit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<ShopItemCategory | 'all'>('all');
  const [expandedAffordabilityId, setExpandedAffordabilityId] = useState<string | null>(null);

  const filteredItems = items.filter((item) => {
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const copy = [...items];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    onReorder(copy);
  };

  const isAllSelected = items.length > 0 && selectedIds.length === items.length;

  return (
    <div className="flex flex-col space-y-4">
      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs overflow-x-auto no-scrollbar">
          {(['all', 'booster', 'consumable', 'cosmetic', 'currency_pack'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 ? (
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-300">
              {selectedIds.length} of {items.length} items selected
            </span>
            <button
              onClick={onDeselectAll}
              className="text-slate-400 hover:text-slate-200 underline text-[11px]"
            >
              Clear
            </button>
          </div>
          <button
            onClick={onOpenBulkEdit}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors shadow-sm"
          >
            Bulk Edit Selected
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={(e) => (e.target.checked ? onSelectAll() : onDeselectAll())}
              className="rounded border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>Select all items for bulk discount</span>
          </label>
          <span>{filteredItems.length} items listed</span>
        </div>
      )}

      {/* Item List Cards */}
      <div className="space-y-3">
        {filteredItems.map((item, index) => {
          const isSelected = selectedIds.includes(item.id);
          const isAffordabilityOpen = expandedAffordabilityId === item.id;

          return (
            <div
              key={item.id}
              className={`bg-slate-900/90 border rounded-2xl p-4 transition-all shadow-md ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Checkbox & Drag / Order Controls */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(item.id)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      className="text-slate-500 hover:text-slate-300 disabled:opacity-20 p-0.5"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className="text-slate-500 hover:text-slate-300 disabled:opacity-20 p-0.5"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Main Item Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                    {item.icon || '🎁'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-100 truncate">{item.name}</h4>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.2 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                        {item.category.replace('_', ' ')}
                      </span>
                      {item.isFeatured && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> Featured
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                      {item.description || 'No description provided'}
                    </p>

                    {/* Meta info chips */}
                    <div className="flex items-center gap-2 mt-2 text-[11px] flex-wrap">
                      {item.unlockCondition.minPlayerLevel > 1 && (
                        <span className="text-slate-400 flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          <Lock className="w-3 h-3 text-amber-400" /> Lvl {item.unlockCondition.minPlayerLevel}+
                        </span>
                      )}
                      {item.boosterEffect && (
                        <span className="text-indigo-300 flex items-center gap-1 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/30">
                          <Zap className="w-3 h-3 text-indigo-400" /> x{item.boosterEffect.multiplier} boost ({item.boosterEffect.durationSec}s)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing & Actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    {item.priceOptions.map((p, idx) => {
                      const curr = currencies.find((c) => c.id === p.currencyId);
                      return (
                        <span
                          key={idx}
                          className="text-xs font-mono font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1 text-slate-200"
                        >
                          <span>{curr?.icon || '🪙'}</span>
                          <span>{p.amount.toLocaleString()}</span>
                        </span>
                      );
                    })}
                    {item.realMoneyPrice && (
                      <span className="text-xs font-mono font-bold bg-emerald-950/50 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        ${item.realMoneyPrice.usd.toFixed(2)} USD
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedAffordabilityId((prev) => (prev === item.id ? null : item.id))
                      }
                      title="Affordability Analysis"
                      className={`p-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1 transition-colors ${
                        isAffordabilityOpen
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>Affordability</span>
                      {isAffordabilityOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      title="Edit Item"
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicate(item.id)}
                      title="Duplicate Item"
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      title="Delete Item"
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsible Affordability Helper */}
              {isAffordabilityOpen && (
                <div className="mt-3 pt-3 border-t border-slate-800 animate-in fade-in">
                  <PricingAffordabilityHelper item={item} currencies={currencies} />
                </div>
              )}
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="py-10 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 text-xs text-slate-400">
            No shop items found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
};
