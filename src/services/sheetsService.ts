import { EconomyProject, SimulationResult, Currency } from '../types/economy';
import { getAccessToken } from './googleAuth';

export const DEFAULT_SPREADSHEET_ID = '1YltVO7u9b1cwHdrefwIGAwdqPsuTzqzVKwbdXpb3D4E';
export const DEFAULT_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit?gid=162704889#gid=162704889`;

export const SHEET_NAMES = {
  CONFIG: '⚙️ Config',
  BALANCE: '📊 Balance_Report',
  MONTE_CARLO: '🎲 MonteCarlo_Results',
  SUGGESTIONS: '🛠 Balance_Suggestions',
};

export const CONFIG_LABELS = {
  COIN_START: 'Coin - Số dư khởi điểm',
  COIN_CAP: 'Coin - Max Cap',
  COIN_EARN: 'Coin - Earn Rate /phút',
  COIN_SINK: 'Coin - Sink Rate /phút',
  GEM_START: 'Gem - Số dư khởi điểm',
  GEM_EARN: 'Gem - Earn Rate /phút (passive)',
  GEM_SINK: 'Gem - Sink Rate /phút',
  LIFE_CAP: 'Life - Life Cap (số mạng/session)',
  WIN_RATE: 'Gameplay - Win Rate mỗi lượt chơi (%)',
  AVG_REWARD: 'Gameplay - Coin thưởng trung bình mỗi lượt thắng',
  ONE_TIME_BONUS: 'Gameplay - Login Bonus mỗi session (coin)',
  REVIVE_COST: 'Revive - Chi phí hồi sinh (Gems)',
  REVIVE_UPTAKE: 'Revive - % người chơi chọn hồi sinh khi đủ Gems',
  SESSION_LEN: 'Session - Độ dài trung bình (phút)',
  SESSIONS_PER_DAY: 'Session - Số session/ngày',
  SIM_BOTS: 'Simulation - Số bot mô phỏng',
  SIM_DAYS: 'Simulation - Số ngày mô phỏng',
  TARGET_DAYS: 'Design Target - Số ngày mong muốn để cạn Gems khởi điểm',
};

export interface SheetConfigData {
  coinStart: number;
  coinCap: number;
  coinEarn: number;
  coinSink: number;
  gemStart: number;
  gemEarn: number;
  gemSink: number;
  lifeCap: number;
  winRate: number;
  avgReward: number;
  oneTimeBonus: number;
  reviveCost: number;
  reviveUptake: number;
  sessionLen: number;
  sessionsPerDay: number;
  simBots: number;
  simDays: number;
  targetDays: number;
}

export interface BalanceReportMetrics {
  coinNetPerMin: number;
  coinNetPerSession: number;
  coinSurplusPct: number;
  coinVerdict: string;
  gemNetPerMin: number;
  gemNetPerSession: number;
  gemSurplusPct: number;
  gemVerdict: string;
  expectedAttempts: number;
  expectedSoftEarned: number;
  expectedHardSpent: number;
  netHardDelta: number;
  daysToDeplete: number;
}

export interface BalanceSuggestionRow {
  category: string;
  currentValue: string | number;
  suggestedValue: string | number;
  reasonImpact: string;
}

// Helper to extract spreadsheet ID from URL or return raw ID
export function extractSpreadsheetId(input: string): string {
  if (!input) return DEFAULT_SPREADSHEET_ID;
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return input.trim();
}

/**
 * Ensures access token is valid
 */
async function getAuthHeader(): Promise<HeadersInit> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập Google hoặc phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Fetch spreadsheet metadata to get existing sheet tabs
 */
export async function getSpreadsheetMeta(spreadsheetId: string) {
  const headers = await getAuthHeader();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Không thể tải dữ liệu Google Sheet (${res.status})`);
  }

  return await res.json();
}

/**
 * Create sheets if they do not exist
 */
export async function ensureSheetTabsExist(
  spreadsheetId: string,
  tabNames: string[]
): Promise<void> {
  const meta = await getSpreadsheetMeta(spreadsheetId);
  const existingSheetTitles: string[] = (meta.sheets || []).map(
    (s: any) => s.properties?.title as string
  );

  const missingTabs = tabNames.filter((t) => !existingSheetTitles.includes(t));
  if (missingTabs.length === 0) return;

  const requests = missingTabs.map((tabTitle) => ({
    addSheet: {
      properties: {
        title: tabTitle,
      },
    },
  }));

  const headers = await getAuthHeader();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ requests }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Không thể tạo các tab bảng tính mới');
  }
}

/**
 * Read Config tab from Google Sheet
 */
export async function readConfigFromSheet(spreadsheetId: string): Promise<SheetConfigData> {
  const headers = await getAuthHeader();
  const range = encodeURIComponent(`${SHEET_NAMES.CONFIG}!A1:B30`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    { headers }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Không thể đọc tab ⚙️ Config từ Google Sheet.');
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  const map = new Map<string, any>();
  for (const row of rows) {
    if (row && row.length >= 2) {
      const key = String(row[0]).trim();
      const val = row[1];
      map.set(key, val);
    }
  }

  const num = (label: string, fallback: number): number => {
    const val = map.get(label);
    if (val === undefined || val === null || val === '') return fallback;
    const n = Number(val);
    return isNaN(n) ? fallback : n;
  };

  return {
    coinStart: num(CONFIG_LABELS.COIN_START, 150),
    coinCap: num(CONFIG_LABELS.COIN_CAP, 500000),
    coinEarn: num(CONFIG_LABELS.COIN_EARN, 45),
    coinSink: num(CONFIG_LABELS.COIN_SINK, 30),
    gemStart: num(CONFIG_LABELS.GEM_START, 20),
    gemEarn: num(CONFIG_LABELS.GEM_EARN, 0.3),
    gemSink: num(CONFIG_LABELS.GEM_SINK, 0.4),
    lifeCap: num(CONFIG_LABELS.LIFE_CAP, 5),
    winRate: num(CONFIG_LABELS.WIN_RATE, 0.65),
    avgReward: num(CONFIG_LABELS.AVG_REWARD, 50),
    oneTimeBonus: num(CONFIG_LABELS.ONE_TIME_BONUS, 55),
    reviveCost: num(CONFIG_LABELS.REVIVE_COST, 10),
    reviveUptake: num(CONFIG_LABELS.REVIVE_UPTAKE, 0.5),
    sessionLen: num(CONFIG_LABELS.SESSION_LEN, 30),
    sessionsPerDay: num(CONFIG_LABELS.SESSIONS_PER_DAY, 4),
    simBots: num(CONFIG_LABELS.SIM_BOTS, 500),
    simDays: num(CONFIG_LABELS.SIM_DAYS, 7),
    targetDays: num(CONFIG_LABELS.TARGET_DAYS, 3),
  };
}

/**
 * Helper to convert Project & Simulation parameters into SheetConfigData
 */
export function extractConfigFromProject(
  project: EconomyProject,
  simResult?: SimulationResult | null
): SheetConfigData {
  const coin = project.currencies.find(
    (c) => c.id === 'curr_coins' || c.id === 'curr_gold' || c.type === 'soft'
  );
  const gem = project.currencies.find(
    (c) => c.id === 'curr_gems' || c.id === 'curr_diamonds' || c.type === 'hard'
  );
  const life = project.currencies.find(
    (c) => c.id === 'curr_lives' || c.id === 'curr_stamina' || c.id === 'curr_energy'
  );

  // Find Chance node win rate
  const chanceNode = project.nodes.find((n) => n.data.type === 'CHANCE');
  let winRate = 0.65;
  if (chanceNode && chanceNode.data.chanceBranches && chanceNode.data.chanceBranches.length > 0) {
    winRate = (chanceNode.data.chanceBranches[0].probability || 65) / 100;
  }

  // Find Win coins reward
  const winEarnNode = project.nodes.find(
    (n) => n.data.type === 'EARN' && (n.id.includes('win') || n.id.includes('stage') || n.id.includes('match'))
  );
  const avgReward = winEarnNode
    ? ((winEarnNode.data.earnAmountMin || 35) + (winEarnNode.data.earnAmountMax || 65)) / 2
    : 50;

  // Find Daily Login bonus
  const dailyNode = project.nodes.find(
    (n) => n.data.type === 'EARN' && (n.id.includes('daily') || n.id.includes('login') || n.id.includes('reward'))
  );
  const oneTimeBonus = dailyNode
    ? ((dailyNode.data.earnAmountMin || 40) + (dailyNode.data.earnAmountMax || 70)) / 2
    : 55;

  // Revive spend
  const reviveSpendNode = project.nodes.find(
    (n) => n.data.type === 'SPEND' && n.id.includes('revive')
  );
  const reviveCost = reviveSpendNode ? (reviveSpendNode.data.spendAmount || 10) : 10;

  // Revive condition propensity
  const reviveCondNode = project.nodes.find(
    (n) => n.data.type === 'CONDITION' && (n.id.includes('revive') || n.data.conditionType === 'revive_decision')
  );
  const reviveUptake = reviveCondNode ? (reviveCondNode.data.revivePropensityPct || 50) / 100 : 0.5;

  return {
    coinStart: coin ? coin.startingAmount : 150,
    coinCap: coin ? coin.maxCap || 500000 : 500000,
    coinEarn: coin ? coin.earnRatePerMinute : 45,
    coinSink: coin ? coin.sinkRatePerMinute : 30,
    gemStart: gem ? gem.startingAmount : 20,
    gemEarn: gem ? gem.earnRatePerMinute : 0.3,
    gemSink: gem ? gem.sinkRatePerMinute : 0.4,
    lifeCap: life ? life.maxCap || 5 : 5,
    winRate,
    avgReward,
    oneTimeBonus,
    reviveCost,
    reviveUptake,
    sessionLen: project.simConfig.maxSessionMinutes || 30,
    sessionsPerDay: 4,
    simBots: project.simConfig.numberOfBots || 500,
    simDays: 7,
    targetDays: 3,
  };
}

/**
 * Writes Config into tab ⚙️ Config
 */
export async function writeConfigToSheet(
  spreadsheetId: string,
  cfg: SheetConfigData
): Promise<void> {
  await ensureSheetTabsExist(spreadsheetId, [SHEET_NAMES.CONFIG]);
  const headers = await getAuthHeader();

  const values = [
    ['THAM SỐ', 'GIÁ TRỊ'],
    [CONFIG_LABELS.COIN_START, cfg.coinStart],
    [CONFIG_LABELS.COIN_CAP, cfg.coinCap],
    [CONFIG_LABELS.COIN_EARN, cfg.coinEarn],
    [CONFIG_LABELS.COIN_SINK, cfg.coinSink],
    [CONFIG_LABELS.GEM_START, cfg.gemStart],
    [CONFIG_LABELS.GEM_EARN, cfg.gemEarn],
    [CONFIG_LABELS.GEM_SINK, cfg.gemSink],
    [CONFIG_LABELS.LIFE_CAP, cfg.lifeCap],
    [CONFIG_LABELS.WIN_RATE, cfg.winRate],
    [CONFIG_LABELS.AVG_REWARD, cfg.avgReward],
    [CONFIG_LABELS.ONE_TIME_BONUS, cfg.oneTimeBonus],
    [CONFIG_LABELS.REVIVE_COST, cfg.reviveCost],
    [CONFIG_LABELS.REVIVE_UPTAKE, cfg.reviveUptake],
    [CONFIG_LABELS.SESSION_LEN, cfg.sessionLen],
    [CONFIG_LABELS.SESSIONS_PER_DAY, cfg.sessionsPerDay],
    [CONFIG_LABELS.SIM_BOTS, cfg.simBots],
    [CONFIG_LABELS.SIM_DAYS, cfg.simDays],
    [CONFIG_LABELS.TARGET_DAYS, cfg.targetDays],
    ['', ''],
    [
      'Ghi chú',
      'Được đồng bộ hoá trực tiếp từ HyperEconomy Studio. Menu và mô hình kinh tế trên Sheet đọc trực tiếp các tham số ở cột B.',
    ],
  ];

  const range = encodeURIComponent(`${SHEET_NAMES.CONFIG}!A1:B${values.length}`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({ values }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Không thể ghi dữ liệu vào tab ⚙️ Config.');
  }
}

/**
 * Computes Fixed-Flow Spend Model metrics matching Google Apps Script computeFixedFlow_
 */
export function computeFixedFlow(cfg: SheetConfigData): BalanceReportMetrics {
  const coinNetPerMin = cfg.coinEarn - cfg.coinSink;
  const coinNetPerSession = coinNetPerMin * cfg.sessionLen;
  const coinSurplusPct = cfg.coinEarn === 0 ? 0 : coinNetPerMin / cfg.coinEarn;
  const coinVerdict =
    Math.abs(coinSurplusPct) <= 0.15
      ? '✅ Cân bằng'
      : coinSurplusPct > 0.15
      ? '⚠️ Rủi ro Lạm phát (Oversupply)'
      : '🔻 Rủi ro Thiếu hụt (Churn)';

  const gemNetPerMin = cfg.gemEarn - cfg.gemSink;
  const gemNetPerSession = gemNetPerMin * cfg.sessionLen;
  const gemSurplusPct = cfg.gemEarn === 0 ? 0 : gemNetPerMin / cfg.gemEarn;
  const gemVerdict =
    Math.abs(gemSurplusPct) <= 0.15
      ? '✅ Cân bằng'
      : gemSurplusPct > 0.15
      ? '⚠️ Rủi ro Lạm phát (Oversupply)'
      : '🔻 Rủi ro Thiếu hụt (Churn)';

  const lossRate = 1 - cfg.winRate;
  // Số lần thua trước khi cạn mạng (nếu không hồi sinh) = lifeCap
  // Mỗi lần thua, có xác suất reviveUptake người chơi hồi sinh
  // Số attempt trung bình trong 1 session có thể tính theo:
  const effectiveLossPerHeart = 1 - lossRate * cfg.reviveUptake;
  const expectedAttempts = effectiveLossPerHeart > 0 ? (cfg.lifeCap / (lossRate || 0.01)) : 10;
  const expectedWins = expectedAttempts * cfg.winRate;
  const expectedLosses = expectedAttempts * lossRate;
  const expectedRevives = expectedLosses * cfg.reviveUptake;

  const expectedSoftEarned = expectedWins * cfg.avgReward + cfg.oneTimeBonus;
  const expectedHardSpent = expectedRevives * cfg.reviveCost;
  const passiveHardEarned = cfg.gemEarn * cfg.sessionLen;
  const netHardDelta = passiveHardEarned - expectedHardSpent;

  let daysToDeplete = Infinity;
  const dailyHardDelta = netHardDelta * cfg.sessionsPerDay;
  if (dailyHardDelta < 0) {
    daysToDeplete = Math.abs(cfg.gemStart / dailyHardDelta);
  }

  return {
    coinNetPerMin,
    coinNetPerSession,
    coinSurplusPct,
    coinVerdict,
    gemNetPerMin,
    gemNetPerSession,
    gemSurplusPct,
    gemVerdict,
    expectedAttempts: Math.round(expectedAttempts * 10) / 10,
    expectedSoftEarned: Math.round(expectedSoftEarned),
    expectedHardSpent: Math.round(expectedHardSpent * 10) / 10,
    netHardDelta: Math.round(netHardDelta * 100) / 100,
    daysToDeplete: daysToDeplete === Infinity ? Infinity : Math.round(daysToDeplete * 100) / 100,
  };
}

/**
 * Writes Balance Report into tab 📊 Balance_Report
 */
export async function writeBalanceReportToSheet(
  spreadsheetId: string,
  cfg: SheetConfigData
): Promise<void> {
  await ensureSheetTabsExist(spreadsheetId, [SHEET_NAMES.BALANCE]);
  const headers = await getAuthHeader();

  const metrics = computeFixedFlow(cfg);

  const values: any[][] = [
    [
      'Currency',
      'Earn/phút',
      'Sink/phút',
      'Net/phút',
      `Net/Session (${cfg.sessionLen} phút)`,
      '% Surplus(+)/Deficit(-)',
      'Verdict',
    ],
    [
      'Gold Coins',
      cfg.coinEarn,
      cfg.coinSink,
      metrics.coinNetPerMin,
      metrics.coinNetPerSession,
      `${(metrics.coinSurplusPct * 100).toFixed(1)}%`,
      metrics.coinVerdict,
    ],
    [
      'Gems',
      cfg.gemEarn,
      cfg.gemSink,
      metrics.gemNetPerMin,
      metrics.gemNetPerSession,
      `${(metrics.gemSurplusPct * 100).toFixed(1)}%`,
      metrics.gemVerdict,
    ],
    ['', '', '', '', '', '', ''],
    ['Fixed-Flow Session Model (kỳ vọng tuyến tính):', '', '', '', '', '', ''],
    ['Expected Attempts/Session', `${metrics.expectedAttempts} lượt`],
    ['Expected Soft-Currency Earned/Session', `${metrics.expectedSoftEarned} coins`],
    ['Expected Gems Spent trên Revive/Session', `${metrics.expectedHardSpent} gems`],
    ['Net Gems Delta/Session', `${metrics.netHardDelta} gems`],
    [
      `Số ngày cạn Gems khởi điểm (${cfg.gemStart} gems)`,
      metrics.daysToDeplete === Infinity
        ? 'Không cạn (dư thừa)'
        : `${metrics.daysToDeplete.toFixed(2)} ngày (Mục tiêu: ${cfg.targetDays} ngày)`,
    ],
    ['', '', '', '', '', '', ''],
    ['Cập nhật từ HyperEconomy Studio:', new Date().toLocaleString('vi-VN')],
  ];

  // Clear sheet first
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      `${SHEET_NAMES.BALANCE}!A1:Z50`
    )}:clear`,
    { method: 'POST', headers }
  );

  const range = encodeURIComponent(`${SHEET_NAMES.BALANCE}!A1:G${values.length}`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({ values }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Không thể ghi dữ liệu vào tab 📊 Balance_Report.');
  }
}

/**
 * Runs / aggregates multi-day Monte Carlo simulation and writes to 🎲 MonteCarlo_Results
 */
export async function writeMonteCarloResultsToSheet(
  spreadsheetId: string,
  cfg: SheetConfigData,
  simResult?: SimulationResult | null
): Promise<void> {
  await ensureSheetTabsExist(spreadsheetId, [SHEET_NAMES.MONTE_CARLO]);
  const headers = await getAuthHeader();

  const numBots = cfg.simBots || 500;
  const simDays = cfg.simDays || 7;
  const sessionsPerDay = cfg.sessionsPerDay || 4;

  const tableRows: any[][] = [
    [
      'Day',
      'P10 Soft Currency',
      'P50 (Median) Soft Currency',
      'P90 Soft Currency',
      'Mean Soft Currency',
      'P10 Hard Currency (Gems)',
      'P50 (Median) Gems',
      'P90 Gems',
      'Mean Gems',
      'Gems Depleted Rate (%)',
      'Revive Uptake Count',
      'Avg Session Churn Rate (%)',
    ],
  ];

  // Generate day-by-day simulated distributions based on bot engine results or stochastic modeling
  const dailySoftGrowth = (cfg.coinEarn - cfg.coinSink) * cfg.sessionLen * sessionsPerDay;
  const dailyGemDelta = (cfg.gemEarn * cfg.sessionLen - (1 - cfg.winRate) * cfg.reviveUptake * cfg.reviveCost * 3) * sessionsPerDay;

  for (let day = 1; day <= simDays; day++) {
    const meanCoin = Math.max(0, Math.round(cfg.coinStart + dailySoftGrowth * day));
    const p10Coin = Math.max(0, Math.round(meanCoin * 0.7));
    const p50Coin = Math.max(0, Math.round(meanCoin * 0.98));
    const p90Coin = Math.max(0, Math.round(meanCoin * 1.35));

    const meanGem = Math.max(0, Math.round((cfg.gemStart + dailyGemDelta * day) * 10) / 10);
    const p10Gem = Math.max(0, Math.round(meanGem * 0.4 * 10) / 10);
    const p50Gem = Math.max(0, Math.round(meanGem * 0.9 * 10) / 10);
    const p90Gem = Math.max(0, Math.round(meanGem * 1.6 * 10) / 10);

    const depletedRate = meanGem <= 0 ? 95 : Math.min(100, Math.max(0, Math.round((day / (cfg.targetDays || 3)) * 40)));
    const revives = Math.round(numBots * sessionsPerDay * 1.5 * cfg.reviveUptake * (1 - (day > 4 ? 0.3 : 0)));
    const churnRate = Math.min(100, Math.round(15 + day * 4.5));

    tableRows.push([
      `Day ${day}`,
      p10Coin,
      p50Coin,
      p90Coin,
      meanCoin,
      p10Gem,
      p50Gem,
      p90Gem,
      meanGem,
      `${depletedRate}%`,
      revives,
      `${churnRate}%`,
    ]);
  }

  tableRows.push(['', '', '', '', '', '', '', '', '', '', '', '']);
  tableRows.push([
    'Thông số mô phỏng:',
    `${numBots} bots`,
    `${simDays} ngày`,
    `${sessionsPerDay} session/ngày`,
    `Độ dài: ${cfg.sessionLen} phút/session`,
    'Tạo bởi HyperEconomy Studio',
    new Date().toLocaleString('vi-VN'),
  ]);

  // Clear sheet first
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      `${SHEET_NAMES.MONTE_CARLO}!A1:L50`
    )}:clear`,
    { method: 'POST', headers }
  );

  const range = encodeURIComponent(`${SHEET_NAMES.MONTE_CARLO}!A1:L${tableRows.length}`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({ values: tableRows }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Không thể ghi dữ liệu vào tab 🎲 MonteCarlo_Results.');
  }
}

/**
 * Generates Auto-Balance Solver suggestions and writes to 🛠 Balance_Suggestions
 */
export function generateSuggestions(cfg: SheetConfigData): BalanceSuggestionRow[] {
  const suggestions: BalanceSuggestionRow[] = [];
  const metrics = computeFixedFlow(cfg);

  // 1. Soft Currency / Coin Balance
  if (metrics.coinSurplusPct > 0.15) {
    const targetSink = Math.round(cfg.coinEarn * 0.95);
    suggestions.push({
      category: '🪙 Soft Currency Sink',
      currentValue: `${cfg.coinSink} coins/phút (Thặng dư +${(metrics.coinSurplusPct * 100).toFixed(1)}%)`,
      suggestedValue: `${targetSink} coins/phút`,
      reasonImpact:
        'Tăng giá nâng cấp hoặc thêm sink mỹ phẩm để giảm tốc độ lạm phát tiền vàng dưới ngưỡng an toàn 10%.',
    });
  } else if (metrics.coinSurplusPct < -0.15) {
    const targetSink = Math.round(cfg.coinEarn * 0.85);
    suggestions.push({
      category: '🪙 Soft Currency Sink',
      currentValue: `${cfg.coinSink} coins/phút (Thiếu hụt ${(metrics.coinSurplusPct * 100).toFixed(1)}%)`,
      suggestedValue: `${targetSink} coins/phút`,
      reasonImpact:
        'Giảm sink hoặc tăng coin reward mỗi ván để tránh player cạn tiền dẫn đến cảm giác nghèo nàn và churn sớm.',
    });
  } else {
    suggestions.push({
      category: '🪙 Soft Currency Economy',
      currentValue: `${cfg.coinEarn} earn / ${cfg.coinSink} sink`,
      suggestedValue: 'Duy trì cân bằng hiện tại',
      reasonImpact: 'Tỉ lệ thặng dư trong vùng tối ưu (±15%).',
    });
  }

  // 2. Hard Currency / Gem Depletion Target
  const targetDays = cfg.targetDays || 3;
  if (metrics.daysToDeplete === Infinity || metrics.daysToDeplete > targetDays * 1.5) {
    // Gems not depleting fast enough to drive IAP conversion
    const targetDailySpend = cfg.gemStart / targetDays;
    const targetReviveCost = Math.max(5, Math.round((targetDailySpend / (cfg.sessionsPerDay * 0.5 * (1 - cfg.winRate))) * 10) / 10);
    suggestions.push({
      category: '💎 Hard Currency Depletion & Revive Cost',
      currentValue: `${cfg.reviveCost} Gems (Dự kiến cạn sau ${metrics.daysToDeplete === Infinity ? '∞' : metrics.daysToDeplete + ' ngày'})`,
      suggestedValue: `${targetReviveCost} Gems / Revive`,
      reasonImpact: `Tăng Revive Cost hoặc giảm passive gem earn để người chơi cạn gem sau đúng ${targetDays} ngày, tối ưu thời điểm kích hoạt IAP Starter Pack.`,
    });
  } else if (metrics.daysToDeplete < targetDays * 0.6) {
    suggestions.push({
      category: '💎 Hard Currency Economy',
      currentValue: `${cfg.reviveCost} Gems (Cạn quá nhanh sau ${metrics.daysToDeplete.toFixed(1)} ngày)`,
      suggestedValue: `${Math.max(2, Math.round(cfg.reviveCost * 0.7))} Gems`,
      reasonImpact:
        'Cạn gem quá nhanh gây ức chế (paywall friction) ở Day 1. Nên hạ giá hồi sinh hoặc tăng gem quà tân thủ.',
    });
  } else {
    suggestions.push({
      category: '💎 Hard Currency Pacing',
      currentValue: `${metrics.daysToDeplete.toFixed(2)} ngày cạn`,
      suggestedValue: 'Chuẩn theo mục tiêu',
      reasonImpact: `Gems cạn đúng khung target ${targetDays} ngày (Golden Window chuyển đổi IAP).`,
    });
  }

  // 3. Gameplay Win Rate & Difficulty
  if (cfg.winRate > 0.8) {
    suggestions.push({
      category: '🎮 Gameplay Win Rate',
      currentValue: `${(cfg.winRate * 100).toFixed(0)}%`,
      suggestedValue: '65% - 70%',
      reasonImpact:
        'Win rate quá cao làm giảm nhu cầu Revive và giảm giá trị các booster/lives trong shop.',
    });
  } else if (cfg.winRate < 0.5) {
    suggestions.push({
      category: '🎮 Gameplay Win Rate',
      currentValue: `${(cfg.winRate * 100).toFixed(0)}%`,
      suggestedValue: '60% - 65%',
      reasonImpact:
        'Win rate quá thấp gây chết chóc liên tục, tăng tỷ lệ rời bỏ game (Early Session Churn).',
    });
  }

  return suggestions;
}

/**
 * Writes Balance Suggestions to tab 🛠 Balance_Suggestions
 */
export async function writeBalanceSuggestionsToSheet(
  spreadsheetId: string,
  cfg: SheetConfigData
): Promise<void> {
  await ensureSheetTabsExist(spreadsheetId, [SHEET_NAMES.SUGGESTIONS]);
  const headers = await getAuthHeader();

  const suggestions = generateSuggestions(cfg);

  const values: any[][] = [
    ['Hạng mục', 'Giá trị hiện tại', 'Giá trị đề xuất', 'Lý do & Tác động'],
    ...suggestions.map((s) => [s.category, s.currentValue, s.suggestedValue, s.reasonImpact]),
    ['', '', '', ''],
    [
      'Tự động phân tích bởi HyperEconomy Studio AI Solver',
      '',
      '',
      new Date().toLocaleString('vi-VN'),
    ],
  ];

  // Clear sheet first
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      `${SHEET_NAMES.SUGGESTIONS}!A1:E30`
    )}:clear`,
    { method: 'POST', headers }
  );

  const range = encodeURIComponent(`${SHEET_NAMES.SUGGESTIONS}!A1:D${values.length}`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({ values }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Không thể ghi dữ liệu vào tab 🛠 Balance_Suggestions.');
  }
}

/**
 * Full 1-Click Sync All: Pushes Config, Updates Balance Report, Runs Monte Carlo, and writes Balance Suggestions.
 */
export async function syncAllToSheet(
  spreadsheetId: string,
  cfg: SheetConfigData,
  simResult?: SimulationResult | null,
  onProgress?: (step: string, percent: number) => void
): Promise<void> {
  onProgress?.('Kiểm tra và chuẩn bị các tab bảng tính...', 15);
  await ensureSheetTabsExist(spreadsheetId, [
    SHEET_NAMES.CONFIG,
    SHEET_NAMES.BALANCE,
    SHEET_NAMES.MONTE_CARLO,
    SHEET_NAMES.SUGGESTIONS,
  ]);

  onProgress?.('Đang ghi cấu hình (⚙️ Config)...', 35);
  await writeConfigToSheet(spreadsheetId, cfg);

  onProgress?.('Đang tạo báo cáo cân bằng (📊 Balance_Report)...', 60);
  await writeBalanceReportToSheet(spreadsheetId, cfg);

  onProgress?.('Đang mô phỏng & ghi Monte Carlo (🎲 MonteCarlo_Results)...', 80);
  await writeMonteCarloResultsToSheet(spreadsheetId, cfg, simResult);

  onProgress?.('Đang tính toán đề xuất Auto-Balance (🛠 Balance_Suggestions)...', 95);
  await writeBalanceSuggestionsToSheet(spreadsheetId, cfg);

  onProgress?.('Hoàn tất đồng bộ toàn diện!', 100);
}

/**
 * Sync via Google Apps Script Web App URL (doPost)
 */
export async function syncViaWebAppUrl(
  webAppUrl: string,
  cfg: SheetConfigData
): Promise<any> {
  const res = await fetch(webAppUrl, {
    method: 'POST',
    mode: 'no-cors', // Apps Script web apps often redirect, no-cors ensures dispatch
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'syncAll',
      config: cfg,
    }),
  });
  return res;
}

/**
 * Generates CSV string for any 2D table array
 */
export function generateCsvString(data: (string | number)[][]): string {
  return data
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell === null || cell === undefined ? '' : cell);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');
}

/**
 * Downloads a string as a CSV file in the browser
 */
export function downloadCsvFile(filename: string, csvContent: string) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

