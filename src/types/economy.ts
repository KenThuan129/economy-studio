export type CurrencyType = 'hard' | 'soft';

export interface CurrencySource {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  weight: number; // probability weight for drops
  description?: string;
}

export interface CurrencySink {
  id: string;
  name: string;
  cost: number;
  frequency: string; // e.g. 'per_run', 'upgrade_tier', 'respawn', 'hourly'
  description?: string;
}

export interface CurrencyConversion {
  toCurrencyId: string;
  rate: number; // e.g., 1 hard currency = 100 soft currency -> rate: 100
}

export interface CurrencyGatingRule {
  minPlayerLevel: number;
  requiresCurrencyId?: string;
  requiresAmount?: number;
}

export interface CurrencyBuyOption {
  softCurrencyId?: string;
  softCost?: number;
  hardCurrencyId?: string;
  hardCost?: number;
  grantAmount: number;
}

export interface Currency {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  type: CurrencyType;
  startingAmount: number;
  maxCap: number | null;
  earnRatePerMinute: number;
  sinkRatePerMinute: number;
  conversionRate: CurrencyConversion[];
  inflationFactor: number; // 0.0 to 2.0 (how earn rate scales over session time)
  sources: CurrencySource[];
  sinks: CurrencySink[];
  gatingRules: CurrencyGatingRule;
  // Time-based passive regeneration (e.g. Lives / Stamina regenerating every X minutes)
  regenIntervalMinutes?: number;
  regenAmount?: number;
  buyOptions?: CurrencyBuyOption[];
}

export type ShopItemCategory = 'remove_ads' | 'bundle' | 'booster' | 'consumable' | 'cosmetic' | 'currency_pack';

export interface PriceOption {
  currencyId: string;
  amount: number;
}

export interface RealMoneyPrice {
  usd: number;
  skuLabel: string;
}

export interface UnlockCondition {
  minPlayerLevel: number;
  requiredItemId?: string;
  minSessionMinutes: number;
}

export interface BoosterEffect {
  affectsCurrencyId: string;
  multiplier: number;
  durationSec: number;
}

export interface CurrencyPackGrant {
  currencyId: string;
  amount: number;
}

export interface PurchaseLimit {
  perDay: number | null;
  perSession: number | null;
  lifetime: number | null;
}

export interface ShopItemBundleSummary {
  coins?: number;
  gems?: number;
  lives?: number;
  boosters?: number;
  perks?: string[];
}

export interface ShopItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: ShopItemCategory;
  priceOptions: PriceOption[];
  realMoneyPrice: RealMoneyPrice | null;
  unlockCondition: UnlockCondition;
  boosterEffect?: BoosterEffect;
  currencyPackGrant?: CurrencyPackGrant;
  purchaseLimit: PurchaseLimit;
  weight: number; // drop likelihood if rotating
  isFeatured: boolean;
  // Remove Ads & Bundling properties
  isRemoveAds?: boolean;
  bundledCurrencies?: { currencyId: string; amount: number }[];
  bundleSummary?: ShopItemBundleSummary;
  valueBadge?: string; // e.g., '+150% Value', '+350% Best Deal'
}

export type BotPersonaType = 'casual' | 'balanced' | 'hardcore';

export type LevelDifficultyKey = 'easy' | 'medium' | 'hard' | 'very_hard' | 'extreme';

export interface LevelDifficultyConfig {
  key: LevelDifficultyKey;
  label: string;
  distributionRatio: number; // e.g., 40% for Easy
  baseWinRate: number; // e.g., 95%
  baseLossRate: number; // e.g., 5%
  baseRewardCoins: number; // Victory payout for this difficulty
}

// Node types for the User Flow Simulator
export type FlowNodeType =
  | 'START'
  | 'ACTION'
  | 'CONDITION'
  | 'EARN'
  | 'SPEND'
  | 'SHOP_VISIT'
  | 'CHANCE'
  | 'END';

export interface FlowNodeData {
  [key: string]: any;
  label: string;
  type: FlowNodeType;
  icon?: string;
  description?: string;
  // Specific node parameters:
  actionDurationSec?: number;
  actionEnergyCost?: number;
  conditionType?: 'currency_gte' | 'level_gte' | 'item_owned' | 'session_time_gte' | 'revive_decision' | 'streak_step' | 'streak_gte';
  conditionCurrencyId?: string;
  conditionThreshold?: number;
  conditionItemId?: string;
  streakInitialTarget?: number; // Starting streak requirement (e.g. 3)
  streakStepIncrement?: number; // Step increment on each claim (+1)
  streakMaxTarget?: number; // Max streak step ping (e.g. 9)
  revivePropensityPct?: number; // Base propensity to accept revive (0-100%)
  reviveByDifficulty?: Record<LevelDifficultyKey, number>; // Propensity per difficulty tier
  reviveByPersona?: Record<BotPersonaType, number>; // Propensity per persona
  useDifficultyReviveTendency?: boolean;
  usePersonaReviveTendency?: boolean;
  earnCurrencyId?: string;
  earnSourceId?: string;
  earnAmountMin?: number;
  earnAmountMax?: number;
  spendCurrencyId?: string;
  spendSinkId?: string;
  spendAmount?: number;
  shopTargetCategory?: ShopItemCategory | 'all';
  shopTargetItemId?: string;
  shopPurchaseProbability?: number; // 0-100%
  chanceBranches?: { label: string; probability: number }[]; // in %
  levelDifficulties?: LevelDifficultyConfig[]; // Difficulty matrix for level outcome nodes
  endReason?: 'churn' | 'victory' | 'quit' | 'session_limit' | 'soft_lock' | 'out_of_lives' | string;
  // Runtime simulation stats for visualization
  visitCount?: number;
  churnCount?: number;
}

export interface FlowNode {
  id: string;
  type: string; // React flow type
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
  animated?: boolean;
}

export interface StopConditions {
  allBotsEnded: boolean;
  hardCurrencyThreshold: number | null;
  sessionTimeExceeded: boolean;
  targetRetentionReached: number | null;
  onSoftLock?: boolean;
  onSessionLengthExceeded?: boolean;
  customExpression?: string;
}

export interface SimulationConfig {
  numberOfBots: number;
  ticksPerSecond: number;
  maxSessionMinutes: number;
  stopConditions: StopConditions;
  stepIntervalMs?: number;
}

export interface SimulationEvent {
  botId: number;
  tick: number;
  timeSec: number;
  nodeId: string;
  nodeType: FlowNodeType;
  currencyDelta: Record<string, number>;
  description: string;
  walletSnapshot: Record<string, number>;
}

export interface BotState {
  id: number;
  persona: BotPersonaType;
  currentWallet: Record<string, number>;
  level: number;
  sessionMinutes: number;
  activeBoosters: { currencyId: string; multiplier: number; expiresAtSec: number }[];
  inventory: string[];
  purchaseHistory: { itemId: string; count: number }[];
  currentNodeId: string;
  isFinished: boolean;
  finishReason?: string;
  totalEarned: Record<string, number>;
  totalSpent: Record<string, number>;
  historyPath: string[];
  ticksLived: number;
  isSoftLocked?: boolean;
  lastRegenTimeSec?: Record<string, number>;
  lastDifficultyRolled?: LevelDifficultyKey;
  currentStreak?: number; // Current consecutive level clear streak
  streakStepTarget?: number; // Current streak step requirement (starts at 3, steps +1 up to 9)
  levelsCleared?: number; // Total levels completed
  streakCyclesCompleted?: number; // Number of times streak bonus was claimed
}

export interface TimeSeriesSnapshot {
  minute: number;
  tick: number;
  activeBots: number;
  churnedBots: number;
  currenciesAvg: Record<string, number>;
  currenciesMedian: Record<string, number>;
  currenciesMin: Record<string, number>;
  currenciesMax: Record<string, number>;
  totalEarnedAvg: Record<string, number>;
  totalSpentAvg: Record<string, number>;
}

export interface EconomyAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  suggestedFix: string;
  metricValue?: string;
}

export interface BotStepRecord {
  stepNumber: number;
  tick: number;
  timeSec: number;
  nodeId: string;
  nodeLabel: string;
  nodeType: FlowNodeType;
  actionTaken: string;
  deltaWallet: Record<string, number>;
  walletAfter: Record<string, number>;
  levelAfter: number;
  currentStreak?: number;
  streakTarget?: number;
  decisionMade?: string;
  walletSnapshot?: Record<string, number>;
  persona?: BotPersonaType;
  difficultyRolled?: LevelDifficultyKey;
  winProbabilityPct?: number;
  outcomeStatus?: 'success' | 'failed' | 'branch_true' | 'branch_false' | 'purchased' | 'skipped' | 'churned' | 'soft_locked';
  details?: string;
}

export interface BotRunSummary {
  botId: number;
  persona: BotPersonaType;
  status: 'completed' | 'active' | 'soft_locked' | 'churned';
  totalSteps: number;
  totalDurationSec: number;
  finalLevel: number;
  finalWallet: Record<string, number>;
  totalEarned: Record<string, number>;
  totalSpent: Record<string, number>;
  itemsPurchased: string[];
  finishReason?: string;
  steps: BotStepRecord[];
}

export interface SimulationResult {
  completedAt: string;
  totalBots: number;
  durationMinutes: number;
  ticksExecuted: number;
  timeSeries: TimeSeriesSnapshot[];
  nodeHeatmap: Record<string, { visits: number; uniqueBots: number; avgTimeSpentSec: number }>;
  churnFunnel: { milestone: string; nodeId: string; count: number; percentage: number; avgTimeToReachSec: number }[];
  economyAlerts: EconomyAlert[];
  eventsSample: SimulationEvent[]; // sample of events for inspection
  botRuns: BotRunSummary[]; // Detailed return data of each bot run for data learning and step-by-step analysis
  softLockedBotsCount: number;
  totalRevenueSimulatedUsd: number;
}

export interface SingleBotLiveState {
  bot: BotState;
  currentStepIndex: number;
  steps: BotStepRecord[];
  activeNodeId: string;
  isPlaying: boolean;
  playbackSpeed: number; // 0.5, 1, 2, 5
  isFinished: boolean;
  finishReason?: string;
  lastDecision?: string;
  totalTicks: number;
}

export interface EconomyProject {
  version: string;
  name: string;
  updatedAt: string;
  currencies: Currency[];
  shopItems: ShopItem[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  simConfig: SimulationConfig;
}
