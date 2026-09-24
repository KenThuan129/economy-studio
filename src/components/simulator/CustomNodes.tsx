import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Play,
  Activity,
  GitBranch,
  CreditCard,
  ShoppingBag,
  Percent,
  AlertOctagon,
  Sparkles,
  Bot,
} from 'lucide-react';
import { FlowNodeData } from '../../types/economy';

interface CustomNodeComponentProps {
  data: FlowNodeData & { isSingleBotActive?: boolean };
  selected?: boolean;
}

const BotActiveIndicator: React.FC = () => (
  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg shadow-indigo-500/50 flex items-center gap-1 z-30 animate-bounce">
    <Bot className="w-3 h-3" />
    <span>Bot #1 Here</span>
  </div>
);

// 1. START NODE
export const StartNode: React.FC<CustomNodeComponentProps> = memo(({ data, selected }) => {
  const isBotHere = !!data.isSingleBotActive;
  return (
    <div
      className={`bg-slate-900 border-2 rounded-2xl p-3.5 shadow-xl min-w-[190px] transition-all relative ${
        isBotHere
          ? 'border-indigo-400 ring-4 ring-indigo-500/60 shadow-2xl shadow-indigo-500/50 scale-105'
          : selected
          ? 'border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-500/30'
          : 'border-emerald-500/50 hover:border-emerald-400'
      }`}
    >
      {isBotHere && <BotActiveIndicator />}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <Play className="w-4 h-4 fill-current" />
        </div>
        <div>
          <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider block">
            Entry Point
          </span>
          <div className="text-xs font-bold text-slate-100">{data.label || 'Game Start'}</div>
        </div>
      </div>
      {data.description && (
        <p className="text-[10px] text-slate-400 mt-2 line-clamp-1 border-t border-slate-800 pt-1.5">
          {data.description}
        </p>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 !bg-emerald-400 border-2 !border-slate-950"
      />
    </div>
  );
});
StartNode.displayName = 'StartNode';

// 2. ACTION NODE
export const ActionNode: React.FC<CustomNodeComponentProps> = memo(({ data, selected }) => {
  const isBotHere = !!data.isSingleBotActive;
  return (
    <div
      className={`bg-slate-900 border-2 rounded-2xl p-3.5 shadow-xl min-w-[200px] transition-all relative ${
        isBotHere
          ? 'border-indigo-400 ring-4 ring-indigo-500/60 shadow-2xl shadow-indigo-500/50 scale-105'
          : selected
          ? 'border-indigo-500 shadow-indigo-500/20 ring-2 ring-indigo-500/30'
          : 'border-indigo-500/40 hover:border-indigo-400'
      }`}
    >
      {isBotHere && <BotActiveIndicator />}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 !bg-indigo-400 border-2 !border-slate-950"
      />
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-wider block">
            Player Action
          </span>
          <div className="text-xs font-bold text-slate-100">{data.label || 'Action'}</div>
        </div>
      </div>
      {data.actionDurationSec !== undefined && (
        <div className="mt-2 text-[10px] text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">
          Duration: ~{data.actionDurationSec}s
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 !bg-indigo-400 border-2 !border-slate-950"
      />
    </div>
  );
});
ActionNode.displayName = 'ActionNode';

// 3. CONDITION NODE
export const ConditionNode: React.FC<CustomNodeComponentProps> = memo(({ data, selected }) => {
  const isBotHere = !!data.isSingleBotActive;
  return (
    <div
      className={`bg-slate-900 border-2 rounded-2xl p-3.5 shadow-xl min-w-[210px] transition-all relative ${
        isBotHere
          ? 'border-indigo-400 ring-4 ring-indigo-500/60 shadow-2xl shadow-indigo-500/50 scale-105'
          : selected
          ? 'border-amber-500 shadow-amber-500/20 ring-2 ring-amber-500/30'
          : 'border-amber-500/40 hover:border-amber-400'
      }`}
    >
      {isBotHere && <BotActiveIndicator />}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 !bg-amber-400 border-2 !border-slate-950"
      />
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
          <GitBranch className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-wider block">
            Branch Condition
          </span>
          <div className="text-xs font-bold text-slate-100">{data.label || 'Check State'}</div>
        </div>
      </div>
      <div className="mt-2 text-[10px] text-slate-300 bg-slate-950/60 p-1.5 rounded border border-slate-800 font-mono">
        {(data.conditionType === 'streak_step' || data.conditionType === 'streak_gte' || data.label?.toLowerCase().includes('streak')) &&
          `🔥 Streak Step: ${data.streakInitialTarget ?? data.conditionThreshold ?? 3} -> Max ${data.streakMaxTarget ?? 9}`}
        {data.conditionType === 'currency_gte' && !data.label?.toLowerCase().includes('streak') && `Balance >= ${data.conditionThreshold ?? 10}`}
        {data.conditionType === 'revive_decision' && `Revive Check: Gems >= ${data.conditionThreshold ?? 10}`}
        {data.conditionType === 'level_gte' && !data.label?.toLowerCase().includes('streak') && `Level >= ${data.conditionThreshold ?? 2}`}
        {data.conditionType === 'item_owned' && `Owns Item`}
        {(!data.conditionType && !data.label?.toLowerCase().includes('streak') || data.conditionType === 'session_time_gte') &&
          `Time >= ${data.conditionThreshold ?? 5}m`}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="w-3.5 h-3.5 !bg-emerald-400 border-2 !border-slate-950"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3.5 h-3.5 !bg-rose-400 border-2 !border-slate-950"
      />
    </div>
  );
});
ConditionNode.displayName = 'ConditionNode';

// 4. EARN NODE
export const EarnNode: React.FC<CustomNodeComponentProps> = memo(({ data, selected }) => {
  const isBotHere = !!data.isSingleBotActive;
  return (
    <div
      className={`bg-slate-900 border-2 rounded-2xl p-3.5 shadow-xl min-w-[200px] transition-all relative ${
        isBotHere
          ? 'border-indigo-400 ring-4 ring-indigo-500/60 shadow-2xl shadow-indigo-500/50 scale-105'
          : selected
          ? 'border-emerald-400 shadow-emerald-400/20 ring-2 ring-emerald-400/30'
          : 'border-emerald-500/50 hover:border-emerald-400'
      }`}
    >
      {isBotHere && <BotActiveIndicator />}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 !bg-emerald-400 border-2 !border-slate-950"
      />
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-base">
          🪙
        </div>
        <div>
          <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider block">
            Reward / Earn
          </span>
          <div className="text-xs font-bold text-slate-100">{data.label || 'Earn Currency'}</div>
        </div>
      </div>
      <div className="mt-2 text-[10px] text-emerald-300 font-mono font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
        +{data.earnAmountMin ?? 15} - {data.earnAmountMax ?? 35} Drop
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 !bg-emerald-400 border-2 !border-slate-950"
      />
    </div>
  );
});
EarnNode.displayName = 'EarnNode';

// 5. SPEND NODE
export const SpendNode: React.FC<CustomNodeComponentProps> = memo(({ data, selected }) => {
  const isBotHere = !!data.isSingleBotActive;
  return (
    <div
      className={`bg-slate-900 border-2 rounded-2xl p-3.5 shadow-xl min-w-[200px] transition-all relative ${
        isBotHere
          ? 'border-indigo-400 ring-4 ring-indigo-500/60 shadow-2xl shadow-indigo-500/50 scale-105'
          : selected
          ? 'border-rose-500 shadow-rose-500/20 ring-2 ring-rose-500/30'
          : 'border-rose-500/40 hover:border-rose-400'
      }`}
    >
      {isBotHere && <BotActiveIndicator />}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 !bg-rose-400 border-2 !border-slate-950"
      />
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
          <CreditCard className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[9px] font-extrabold text-rose-400 uppercase tracking-wider block">
            Spend Sink
          </span>
          <div className="text-xs font-bold text-slate-100">{data.label || 'Spend'}</div>
        </div>
      </div>
      <div className="mt-2 text-[10px] text-rose-300 font-mono font-bold bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/20">
        Cost: -{data.spendAmount ?? 10}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 !bg-rose-400 border-2 !border-slate-950"
      />
    </div>
  );
});
SpendNode.displayName = 'SpendNode';

// 6. SHOP_VISIT NODE
export const ShopVisitNode: React.FC<CustomNodeComponentProps> = memo(({ data, selected }) => {
  const isBotHere = !!data.isSingleBotActive;
  return (
    <div
      className={`bg-slate-900 border-2 rounded-2xl p-3.5 shadow-xl min-w-[210px] transition-all relative ${
        isBotHere
          ? 'border-indigo-400 ring-4 ring-indigo-500/60 shadow-2xl shadow-indigo-500/50 scale-105'
          : selected
          ? 'border-pink-500 shadow-pink-500/20 ring-2 ring-pink-500/30'
          : 'border-pink-500/50 hover:border-pink-400'
      }`}
    >
      {isBotHere && <BotActiveIndicator />}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 !bg-pink-400 border-2 !border-slate-950"
      />
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
          <ShoppingBag className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[9px] font-extrabold text-pink-400 uppercase tracking-wider block">
            Shop Prompt
          </span>
          <div className="text-xs font-bold text-slate-100">{data.label || 'Visit Shop'}</div>
        </div>
      </div>
      <div className="mt-2 text-[10px] text-pink-300 bg-pink-950/40 px-2 py-0.5 rounded border border-pink-500/20 font-mono">
        Buy Prob: {data.shopPurchaseProbability ?? 45}%
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 !bg-pink-400 border-2 !border-slate-950"
      />
    </div>
  );
});
ShopVisitNode.displayName = 'ShopVisitNode';

// 7. CHANCE NODE
export const ChanceNode: React.FC<CustomNodeComponentProps> = memo(({ data, selected }) => {
  const isBotHere = !!data.isSingleBotActive;
  return (
    <div
      className={`bg-slate-900 border-2 rounded-2xl p-3.5 shadow-xl min-w-[200px] transition-all relative ${
        isBotHere
          ? 'border-indigo-400 ring-4 ring-indigo-500/60 shadow-2xl shadow-indigo-500/50 scale-105'
          : selected
          ? 'border-purple-500 shadow-purple-500/20 ring-2 ring-purple-500/30'
          : 'border-purple-500/40 hover:border-purple-400'
      }`}
    >
      {isBotHere && <BotActiveIndicator />}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 !bg-purple-400 border-2 !border-slate-950"
      />
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
          <Percent className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[9px] font-extrabold text-purple-400 uppercase tracking-wider block">
            Probability Roll
          </span>
          <div className="text-xs font-bold text-slate-100">{data.label || 'Chance Roll'}</div>
        </div>
      </div>
      <div className="mt-2 flex gap-1 text-[9px] font-mono">
        {(data.chanceBranches || [
          { label: 'A', probability: 50 },
          { label: 'B', probability: 50 },
        ]).map((b, i) => (
          <span
            key={i}
            className="bg-slate-950 px-1.5 py-0.5 rounded text-purple-300 border border-slate-800"
          >
            {b.label}: {b.probability}%
          </span>
        ))}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 !bg-purple-400 border-2 !border-slate-950"
      />
    </div>
  );
});
ChanceNode.displayName = 'ChanceNode';

// 8. END NODE
export const EndNode: React.FC<CustomNodeComponentProps> = memo(({ data, selected }) => {
  const isBotHere = !!data.isSingleBotActive;
  return (
    <div
      className={`bg-slate-900 border-2 rounded-2xl p-3.5 shadow-xl min-w-[190px] transition-all relative ${
        isBotHere
          ? 'border-indigo-400 ring-4 ring-indigo-500/60 shadow-2xl shadow-indigo-500/50 scale-105'
          : selected
          ? 'border-rose-500 shadow-rose-500/20 ring-2 ring-rose-500/30'
          : 'border-slate-700 hover:border-rose-400'
      }`}
    >
      {isBotHere && <BotActiveIndicator />}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 !bg-rose-400 border-2 !border-slate-950"
      />
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
          <AlertOctagon className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[9px] font-extrabold text-rose-400 uppercase tracking-wider block">
            Session Terminus
          </span>
          <div className="text-xs font-bold text-slate-100">{data.label || 'Exit'}</div>
        </div>
      </div>
      <div className="mt-2 text-[10px] text-slate-400 capitalize bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
        Reason: {data.endReason || 'Quit / Churn'}
      </div>
    </div>
  );
});
EndNode.displayName = 'EndNode';

// 9. GENERIC / FALLBACK NODE (Ensures no white unstyled boxes ever appear)
export const GenericNode: React.FC<CustomNodeComponentProps> = memo(({ data, selected }) => {
  const isBotHere = !!data.isSingleBotActive;
  return (
    <div
      className={`bg-slate-900 border-2 rounded-2xl p-3.5 shadow-xl min-w-[190px] transition-all relative ${
        isBotHere
          ? 'border-indigo-400 ring-4 ring-indigo-500/60 shadow-2xl shadow-indigo-500/50 scale-105'
          : selected
          ? 'border-indigo-500 shadow-indigo-500/20 ring-2 ring-indigo-500/30'
          : 'border-slate-700 hover:border-slate-500'
      }`}
    >
      {isBotHere && <BotActiveIndicator />}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 !bg-slate-400 border-2 !border-slate-950"
      />
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Flow Step
          </span>
          <div className="text-xs font-bold text-slate-100">{data.label || 'Step'}</div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 !bg-slate-400 border-2 !border-slate-950"
      />
    </div>
  );
});
GenericNode.displayName = 'GenericNode';

export const nodeTypes = {
  startNode: StartNode,
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  earnNode: EarnNode,
  spendNode: SpendNode,
  shopVisitNode: ShopVisitNode,
  chanceNode: ChanceNode,
  endNode: EndNode,
  genericNode: GenericNode,
};
