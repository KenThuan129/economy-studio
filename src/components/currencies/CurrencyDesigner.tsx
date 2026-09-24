import React, { useState } from 'react';
import { Plus, Coins, ArrowRightLeft, Sparkles, Filter } from 'lucide-react';
import { useEconomy } from '../../context/EconomyContext';
import { Currency } from '../../types/economy';
import { CurrencyCard } from './CurrencyCard';
import { CurrencyModal } from './CurrencyModal';
import { CurrencyBalanceWarningPanel } from './CurrencyBalanceWarningPanel';
import { CurrencyExchangeGraph } from './CurrencyExchangeGraph';

export const CurrencyDesigner: React.FC = () => {
  const { currencies, addCurrency, updateCurrency, duplicateCurrency, deleteCurrency } = useEconomy();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currencyToEdit, setCurrencyToEdit] = useState<Currency | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'hard' | 'soft'>('all');

  const filteredCurrencies = currencies.filter((c) => {
    if (filterType === 'all') return true;
    return c.type === filterType;
  });

  const handleOpenCreate = () => {
    setCurrencyToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (curr: Currency) => {
    setCurrencyToEdit(curr);
    setIsModalOpen(true);
  };

  const handleSaveCurrency = (saved: Currency) => {
    if (currencyToEdit) {
      updateCurrency(saved.id, saved);
    } else {
      addCurrency(saved);
    }
  };

  const handleQuickFix = (currencyId: string, updates: Partial<Currency>) => {
    updateCurrency(currencyId, updates);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🪙</span>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Currency Designer & Balancing Lab
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure Hard & Soft currencies, drop sources, spend sinks, and inflation scaling curves.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({currencies.length})
            </button>
            <button
              onClick={() => setFilterType('soft')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterType === 'soft'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🪙 Soft ({currencies.filter((c) => c.type === 'soft').length})
            </button>
            <button
              onClick={() => setFilterType('hard')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterType === 'hard'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              💎 Hard ({currencies.filter((c) => c.type === 'hard').length})
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Currency</span>
          </button>
        </div>
      </div>

      {/* Live Warning Audit Panel */}
      <CurrencyBalanceWarningPanel currencies={currencies} onQuickFix={handleQuickFix} />

      {/* Currency Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCurrencies.map((curr) => (
          <CurrencyCard
            key={curr.id}
            currency={curr}
            onEdit={() => handleOpenEdit(curr)}
            onDuplicate={() => duplicateCurrency(curr.id)}
            onDelete={() => {
              if (confirm(`Delete currency "${curr.name}"? This will remove its references across shop & nodes.`)) {
                deleteCurrency(curr.id);
              }
            }}
          />
        ))}

        {filteredCurrencies.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
            <Coins className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <h3 className="text-sm font-semibold text-slate-300">No currencies match this filter</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Add a new currency to build your game economy balance model.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
            >
              Create Currency
            </button>
          </div>
        )}
      </div>

      {/* Visual Exchange Graph & 30-min Forecast */}
      {currencies.length > 0 && <CurrencyExchangeGraph currencies={currencies} />}

      {/* Currency Modal */}
      <CurrencyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCurrency}
        currencyToEdit={currencyToEdit}
        allCurrencies={currencies}
      />
    </div>
  );
};
