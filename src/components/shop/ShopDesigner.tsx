import React, { useState } from 'react';
import { Plus, ShoppingBag, Layers, Percent, Sparkles, ShieldCheck } from 'lucide-react';
import { useEconomy } from '../../context/EconomyContext';
import { ShopItem } from '../../types/economy';
import { ShopItemList } from './ShopItemList';
import { ShopMockupPreview } from './ShopMockupPreview';
import { ShopItemWizard } from './ShopItemWizard';
import { BulkEditModal } from './BulkEditModal';
import { RemoveAdsBalancerModal } from './RemoveAdsBalancerModal';

export const ShopDesigner: React.FC = () => {
  const {
    shopItems,
    currencies,
    addShopItem,
    updateShopItem,
    duplicateShopItem,
    deleteShopItem,
    bulkUpdateShopItems,
    reorderShopItems,
  } = useEconomy();

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ShopItem | null>(null);

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isRemoveAdsModalOpen, setIsRemoveAdsModalOpen] = useState(false);

  const handleOpenCreate = () => {
    setItemToEdit(null);
    setIsWizardOpen(true);
  };

  const handleOpenEdit = (item: ShopItem) => {
    setItemToEdit(item);
    setIsWizardOpen(true);
  };

  const handleSaveItem = (saved: ShopItem) => {
    if (itemToEdit) {
      updateShopItem(saved.id, saved);
    } else {
      addShopItem(saved);
    }
  };

  const handleApplyRemoveAdsBundles = (bundles: ShopItem[]) => {
    bundles.forEach((bundle) => {
      const existing = shopItems.find((s) => s.id === bundle.id);
      if (existing) {
        updateShopItem(bundle.id, bundle);
      } else {
        addShopItem(bundle);
      }
    });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedItemIds(shopItems.map((i) => i.id));
  };

  const handleDeselectAll = () => {
    setSelectedItemIds([]);
  };

  const handleApplyBulk = (ids: string[], updates: Partial<ShopItem>) => {
    bulkUpdateShopItems(ids, updates);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Shop Designer & Monetization Lab
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Build boosters, consumables, cosmetics, and currency packs with multi-currency pricing and live game preview.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Remove Ads Packaging Balancer Button */}
          <button
            type="button"
            onClick={() => setIsRemoveAdsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-pink-600/20 to-purple-600/20 hover:from-pink-600/30 hover:to-purple-600/30 text-pink-300 text-xs font-bold rounded-xl border border-pink-500/40 shadow-sm transition-all active:scale-95"
          >
            <ShieldCheck className="w-4 h-4 text-pink-400" />
            <span>Remove Ads Packaging Suite</span>
          </button>

          {selectedItemIds.length > 0 && (
            <button
              onClick={() => setIsBulkEditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
            >
              <Percent className="w-3.5 h-3.5 text-amber-400" />
              <span>Bulk Discount ({selectedItemIds.length})</span>
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Split View: Left = Item Library, Right = Mobile Phone Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Items Library */}
        <div className="lg:col-span-7 xl:col-span-8">
          <ShopItemList
            items={shopItems}
            currencies={currencies}
            onEdit={handleOpenEdit}
            onDuplicate={duplicateShopItem}
            onDelete={(id) => {
              if (confirm('Delete this shop item?')) {
                deleteShopItem(id);
              }
            }}
            onReorder={reorderShopItems}
            selectedIds={selectedItemIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onOpenBulkEdit={() => setIsBulkEditOpen(true)}
          />
        </div>

        {/* Right Column: Live Mobile Game Mockup */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
          <ShopMockupPreview items={shopItems} currencies={currencies} />
        </div>
      </div>

      {/* Item Wizard Modal */}
      <ShopItemWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSave={handleSaveItem}
        itemToEdit={itemToEdit}
        currencies={currencies}
        allItems={shopItems}
      />

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        selectedItemIds={selectedItemIds}
        allItems={shopItems}
        onApply={handleApplyBulk}
      />

      {/* Remove Ads Packaging Balancer Modal */}
      <RemoveAdsBalancerModal
        isOpen={isRemoveAdsModalOpen}
        onClose={() => setIsRemoveAdsModalOpen(false)}
        currencies={currencies}
        onApplyBundles={handleApplyRemoveAdsBundles}
      />
    </div>
  );
};
