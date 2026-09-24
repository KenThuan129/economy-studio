import React from 'react';
import { X, Trash2, Settings, Plus } from 'lucide-react';
import { FlowNodeData, Currency, ShopItem } from '../../types/economy';

interface NodeConfigDrawerProps {
  selectedNode: { id: string; type: string; data: FlowNodeData } | null;
  onClose: () => void;
  onUpdateNodeData: (nodeId: string, data: Partial<FlowNodeData>) => void;
  onDeleteNode: (nodeId: string) => void;
  currencies: Currency[];
  shopItems: ShopItem[];
}

export const NodeConfigDrawer: React.FC<NodeConfigDrawerProps> = ({
  selectedNode,
  onClose,
  onUpdateNodeData,
  onDeleteNode,
  currencies,
  shopItems,
}) => {
  if (!selectedNode) return null;

  const { id, data } = selectedNode;

  const handleChange = (field: keyof FlowNodeData, value: any) => {
    onUpdateNodeData(id, { [field]: value });
  };

  return (
    <div className="absolute right-4 top-4 bottom-4 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl z-20 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Node Inspector
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
        {/* Label */}
        <div>
          <label className="text-[11px] font-bold text-slate-300 block mb-1">Node Title</label>
          <input
            type="text"
            value={data.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-[11px] font-bold text-slate-300 block mb-1">Description</label>
          <textarea
            rows={2}
            value={data.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Node notes..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        {/* ACTION NODE PARAMS */}
        {data.type === 'ACTION' && (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Action Duration (Sec)</label>
              <input
                type="number"
                min="0"
                value={data.actionDurationSec || 5}
                onChange={(e) => handleChange('actionDurationSec', Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-slate-200"
              />
            </div>
          </div>
        )}

        {/* EARN NODE PARAMS */}
        {data.type === 'EARN' && (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-emerald-500/30 space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Currency Awarded</label>
              <select
                value={data.earnCurrencyId || currencies[0]?.id || ''}
                onChange={(e) => handleChange('earnCurrencyId', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-slate-200"
              >
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Min Payout</label>
                <input
                  type="number"
                  min="0"
                  value={data.earnAmountMin ?? 10}
                  onChange={(e) => handleChange('earnAmountMin', Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono text-emerald-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Max Payout</label>
                <input
                  type="number"
                  min="0"
                  value={data.earnAmountMax ?? 25}
                  onChange={(e) => handleChange('earnAmountMax', Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono text-emerald-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* SPEND NODE PARAMS */}
        {data.type === 'SPEND' && (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-rose-500/30 space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Currency Spent</label>
              <select
                value={data.spendCurrencyId || currencies[0]?.id || ''}
                onChange={(e) => handleChange('spendCurrencyId', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
              >
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Amount Spent</label>
              <input
                type="number"
                min="0"
                value={data.spendAmount ?? 10}
                onChange={(e) => handleChange('spendAmount', Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono text-rose-400"
              />
            </div>
          </div>
        )}

        {/* CONDITION NODE PARAMS */}
        {data.type === 'CONDITION' && (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-amber-500/30 space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Condition Type</label>
              <select
                value={data.conditionType || 'currency_gte'}
                onChange={(e) => handleChange('conditionType', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
              >
                <option value="currency_gte">Currency Balance &gt;= Value</option>
                <option value="streak_step">Stepped Streak Bonus (3 &rarr; 4 ... &rarr; 9 Level Streak)</option>
                <option value="revive_decision">Revive Decision (Affordability + Difficulty Tendency)</option>
                <option value="level_gte">Player Level &gt;= Value</option>
                <option value="session_time_gte">Session Time &gt;= Minutes</option>
                <option value="item_owned">Specific Item Owned</option>
              </select>
            </div>

            {data.conditionType === 'level_gte' && (
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Target Player Level</label>
                <input
                  type="number"
                  min="1"
                  value={data.conditionThreshold ?? 2}
                  onChange={(e) => handleChange('conditionThreshold', Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono text-amber-300"
                />
              </div>
            )}

            {(data.conditionType === 'streak_step' || data.conditionType === 'streak_gte' || data.label?.toLowerCase().includes('streak')) && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="bg-amber-950/40 p-2.5 rounded-lg border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-amber-300">🔥 Stepped Streak Parameters</label>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                      Dynamic Tier
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Each level Victory adds +1 to streak. Reaching the target unlocks rewards, resets progress to 0, and increments the step target.
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">Initial Target</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={data.streakInitialTarget ?? data.conditionThreshold ?? 3}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          handleChange('streakInitialTarget', val);
                          handleChange('conditionThreshold', val);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono text-amber-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">Step (+)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={data.streakStepIncrement ?? 1}
                        onChange={(e) => handleChange('streakStepIncrement', Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono text-amber-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">Max Ping</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={data.streakMaxTarget ?? 9}
                        onChange={(e) => handleChange('streakMaxTarget', Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono text-amber-300 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(data.conditionType === 'currency_gte' || data.conditionType === 'revive_decision' || (!data.conditionType && !data.label?.toLowerCase().includes('streak'))) && (
              <>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Required Currency</label>
                  <select
                    value={data.conditionCurrencyId || currencies.find((c) => c.type === 'hard')?.id || currencies[0]?.id || ''}
                    onChange={(e) => handleChange('conditionCurrencyId', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                  >
                    {currencies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Cost / Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={data.conditionThreshold ?? 10}
                    onChange={(e) => handleChange('conditionThreshold', Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono text-amber-300"
                  />
                </div>
              </>
            )}

            {(data.conditionType === 'revive_decision' || data.label?.toLowerCase().includes('revive') || data.revivePropensityPct !== undefined) && (
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-amber-400">Base Revive Propensity</label>
                    <span className="text-[10px] font-mono text-amber-300">{data.revivePropensityPct ?? 50}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={data.revivePropensityPct ?? 50}
                    onChange={(e) => handleChange('revivePropensityPct', Number(e.target.value))}
                    className="w-full accent-amber-500 h-1.5"
                  />
                </div>

                {/* Difficulty Tendency Matrix */}
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-300">Vary Tendency by Level Difficulty</label>
                    <input
                      type="checkbox"
                      checked={data.useDifficultyReviveTendency ?? true}
                      onChange={(e) => handleChange('useDifficultyReviveTendency', e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                  </div>

                  {(data.useDifficultyReviveTendency ?? true) && (
                    <div className="space-y-1.5 pt-1">
                      {[
                        { key: 'easy', label: 'Easy Stage', defaultVal: 15 },
                        { key: 'medium', label: 'Medium Stage', defaultVal: 35 },
                        { key: 'hard', label: 'Hard Stage', defaultVal: 65 },
                        { key: 'very_hard', label: 'Very Hard Stage', defaultVal: 85 },
                        { key: 'extreme', label: 'Extreme Stage', defaultVal: 95 },
                      ].map((tier) => {
                        const curMap = data.reviveByDifficulty || {
                          easy: 15,
                          medium: 35,
                          hard: 65,
                          very_hard: 85,
                          extreme: 95,
                        };
                        const val = curMap[tier.key as keyof typeof curMap] ?? tier.defaultVal;
                        return (
                          <div key={tier.key} className="flex items-center justify-between gap-2">
                            <span className="text-[9px] text-slate-400 w-24 truncate">{tier.label}</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={val}
                              onChange={(e) => {
                                const newMap = { ...curMap, [tier.key]: Number(e.target.value) };
                                handleChange('reviveByDifficulty', newMap);
                              }}
                              className="flex-1 accent-amber-500 h-1"
                            />
                            <span className="text-[9px] font-mono text-amber-300 w-8 text-right">{val}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Persona Tendency Matrix */}
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-300">Vary Tendency by Bot Persona</label>
                    <input
                      type="checkbox"
                      checked={data.usePersonaReviveTendency ?? true}
                      onChange={(e) => handleChange('usePersonaReviveTendency', e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                  </div>

                  {(data.usePersonaReviveTendency ?? true) && (
                    <div className="space-y-1.5 pt-1">
                      {[
                        { key: 'casual', label: 'Casual Persona', defaultVal: 25 },
                        { key: 'balanced', label: 'Balanced Persona', defaultVal: 50 },
                        { key: 'hardcore', label: 'Hardcore Persona', defaultVal: 80 },
                      ].map((p) => {
                        const curMap = data.reviveByPersona || {
                          casual: 25,
                          balanced: 50,
                          hardcore: 80,
                        };
                        const val = curMap[p.key as keyof typeof curMap] ?? p.defaultVal;
                        return (
                          <div key={p.key} className="flex items-center justify-between gap-2">
                            <span className="text-[9px] text-slate-400 w-24 truncate">{p.label}</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={val}
                              onChange={(e) => {
                                const newMap = { ...curMap, [p.key]: Number(e.target.value) };
                                handleChange('reviveByPersona', newMap);
                              }}
                              className="flex-1 accent-amber-500 h-1"
                            />
                            <span className="text-[9px] font-mono text-amber-300 w-8 text-right">{val}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SHOP_VISIT PARAMS */}
        {data.type === 'SHOP_VISIT' && (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-pink-500/30 space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Target Item (Optional)</label>
              <select
                value={data.shopTargetItemId || ''}
                onChange={(e) => handleChange('shopTargetItemId', e.target.value || undefined)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
              >
                <option value="">Any Affordable Item</option>
                {shopItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.icon} {i.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                Purchase Likelihood ({data.shopPurchaseProbability ?? 40}%)
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={data.shopPurchaseProbability ?? 40}
                onChange={(e) =>
                  handleChange('shopPurchaseProbability', Number(e.target.value))
                }
                className="w-full accent-pink-500"
              />
            </div>
          </div>
        )}

        {/* CHANCE PARAMS */}
        {data.type === 'CHANCE' && (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-purple-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Level Difficulty Distribution & Outcomes
              </label>
              <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-mono">
                RNG Variance
              </span>
            </div>

            <div className="space-y-2 border-t border-slate-800/80 pt-2">
              <span className="text-[10px] text-slate-400 block font-semibold">
                Difficulty Ratios & Base Win Rates
              </span>
              {(
                data.levelDifficulties || [
                  { key: 'easy', label: 'Easy Stage', distributionRatio: 40, baseWinRate: 95, baseRewardCoins: 20 },
                  { key: 'medium', label: 'Medium Stage', distributionRatio: 30, baseWinRate: 85, baseRewardCoins: 50 },
                  { key: 'hard', label: 'Hard Stage', distributionRatio: 20, baseWinRate: 65, baseRewardCoins: 120 },
                  { key: 'very_hard', label: 'Very Hard Stage', distributionRatio: 8, baseWinRate: 20, baseRewardCoins: 300 },
                  { key: 'extreme', label: 'Extreme Stage', distributionRatio: 2, baseWinRate: 5, baseRewardCoins: 800 },
                ]
              ).map((diff, idx) => (
                <div key={diff.key} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                    <span>{diff.label}</span>
                    <span className="text-purple-300 text-[10px]">Win: {diff.baseWinRate}% | Loss: {100 - diff.baseWinRate}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px]">
                    <div>
                      <span className="text-slate-500 block">Ratio %</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={diff.distributionRatio}
                        onChange={(e) => {
                          const list = [...(data.levelDifficulties || [
                            { key: 'easy', label: 'Easy Stage', distributionRatio: 40, baseWinRate: 95, baseRewardCoins: 20 },
                            { key: 'medium', label: 'Medium Stage', distributionRatio: 30, baseWinRate: 85, baseRewardCoins: 50 },
                            { key: 'hard', label: 'Hard Stage', distributionRatio: 20, baseWinRate: 65, baseRewardCoins: 120 },
                            { key: 'very_hard', label: 'Very Hard Stage', distributionRatio: 8, baseWinRate: 20, baseRewardCoins: 300 },
                            { key: 'extreme', label: 'Extreme Stage', distributionRatio: 2, baseWinRate: 5, baseRewardCoins: 800 },
                          ])];
                          list[idx] = { ...list[idx], distributionRatio: Number(e.target.value) };
                          handleChange('levelDifficulties', list);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 font-mono text-purple-300"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 block">Win %</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={diff.baseWinRate}
                        onChange={(e) => {
                          const list = [...(data.levelDifficulties || [
                            { key: 'easy', label: 'Easy Stage', distributionRatio: 40, baseWinRate: 95, baseRewardCoins: 20 },
                            { key: 'medium', label: 'Medium Stage', distributionRatio: 30, baseWinRate: 85, baseRewardCoins: 50 },
                            { key: 'hard', label: 'Hard Stage', distributionRatio: 20, baseWinRate: 65, baseRewardCoins: 120 },
                            { key: 'very_hard', label: 'Very Hard Stage', distributionRatio: 8, baseWinRate: 20, baseRewardCoins: 300 },
                            { key: 'extreme', label: 'Extreme Stage', distributionRatio: 2, baseWinRate: 5, baseRewardCoins: 800 },
                          ])];
                          const win = Number(e.target.value);
                          list[idx] = { ...list[idx], baseWinRate: win, baseLossRate: 100 - win };
                          handleChange('levelDifficulties', list);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 font-mono text-emerald-400"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 block">+Coins</span>
                      <input
                        type="number"
                        min="0"
                        value={diff.baseRewardCoins}
                        onChange={(e) => {
                          const list = [...(data.levelDifficulties || [
                            { key: 'easy', label: 'Easy Stage', distributionRatio: 40, baseWinRate: 95, baseRewardCoins: 20 },
                            { key: 'medium', label: 'Medium Stage', distributionRatio: 30, baseWinRate: 85, baseRewardCoins: 50 },
                            { key: 'hard', label: 'Hard Stage', distributionRatio: 20, baseWinRate: 65, baseRewardCoins: 120 },
                            { key: 'very_hard', label: 'Very Hard Stage', distributionRatio: 8, baseWinRate: 20, baseRewardCoins: 300 },
                            { key: 'extreme', label: 'Extreme Stage', distributionRatio: 2, baseWinRate: 5, baseRewardCoins: 800 },
                          ])];
                          list[idx] = { ...list[idx], baseRewardCoins: Number(e.target.value) };
                          handleChange('levelDifficulties', list);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 font-mono text-amber-300"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800/80 pt-2">
              <label className="text-[10px] text-slate-400 block mb-1">Generic Branch Probability Split</label>
              {(data.chanceBranches || [
                { label: 'Success / Win', probability: 60 },
                { label: 'Fail / Loss', probability: 40 },
              ]).map((b, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-1">
                  <input
                    type="text"
                    value={b.label}
                    onChange={(e) => {
                      const branches = [...(data.chanceBranches || [])];
                      branches[idx] = { ...branches[idx], label: e.target.value };
                      handleChange('chanceBranches', branches);
                    }}
                    className="w-1/2 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={b.probability}
                    onChange={(e) => {
                      const branches = [...(data.chanceBranches || [])];
                      branches[idx] = { ...branches[idx], probability: Number(e.target.value) };
                      handleChange('chanceBranches', branches);
                    }}
                    className="w-1/3 bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono text-purple-300"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* END NODE PARAMS */}
        {data.type === 'END' && (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-rose-500/30 space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Exit / Churn Reason</label>
              <select
                value={data.endReason || 'churn'}
                onChange={(e) => handleChange('endReason', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
              >
                <option value="churn">Churn (Frustration / Out of resources)</option>
                <option value="quit">Natural Session Quit (Satisfied)</option>
                <option value="soft_lock">Soft Lock</option>
                <option value="victory">Victory / Complete</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Delete */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onDeleteNode(id)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg border border-rose-500/30 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete Node
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
