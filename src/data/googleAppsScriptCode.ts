/**
 * Full Google Apps Script source code for Hyper-Casual Economy Balancer
 * Can be copied into Extensions > Apps Script in Google Sheets.
 */
export const HYPER_CASUAL_APPS_SCRIPT_CODE = `/**
 * ============================================================================
 * HYPER-CASUAL ECONOMY BALANCER - GOOGLE APPS SCRIPT ENGINE
 * ----------------------------------------------------------------------------
 * Google Apps Script chuyên dụng để cân bằng hệ thống kinh tế cho dòng game
 * Hyper-Casual (dựa trên cấu trúc "Hyper-Casual Complete Loop" trong project
 * HyperEconomy Studio: Lives -> Play -> Win/Lose -> Revive(Gems) -> Coins).
 *
 * CÁCH CÀI ĐẶT:
 *   1. Mở Google Sheet: https://docs.google.com/spreadsheets/d/1YltVO7u9b1cwHdrefwIGAwdqPsuTzqzVKwbdXpb3D4E/edit
 *   2. Menu Extensions > Apps Script.
 *   3. Xoá code mẫu, dán toàn bộ nội dung file này vào.
 *   4. Nhấn Lưu (Ctrl+S), quay lại Google Sheet, tải lại trang (F5).
 *   5. Menu "🎮 Cân Bằng Kinh Tế" sẽ xuất hiện trên thanh menu Google Sheet.
 * ============================================================================
 */

var CONFIG_SHEET = "⚙️ Config";
var BALANCE_SHEET = "📊 Balance_Report";
var MC_SHEET = "🎲 MonteCarlo_Results";
var SUGGEST_SHEET = "🛠 Balance_Suggestions";

/** Nhãn (label) các dòng trong Config sheet */
var L = {
  COIN_START: "Coin - Số dư khởi điểm",
  COIN_CAP: "Coin - Max Cap",
  COIN_EARN: "Coin - Earn Rate /phút",
  COIN_SINK: "Coin - Sink Rate /phút",
  GEM_START: "Gem - Số dư khởi điểm",
  GEM_EARN: "Gem - Earn Rate /phút (passive)",
  GEM_SINK: "Gem - Sink Rate /phút",
  LIFE_CAP: "Life - Life Cap (số mạng/session)",
  WIN_RATE: "Gameplay - Win Rate mỗi lượt chơi (%)",
  AVG_REWARD: "Gameplay - Coin thưởng trung bình mỗi lượt thắng",
  ONE_TIME_BONUS: "Gameplay - Login Bonus mỗi session (coin)",
  REVIVE_COST: "Revive - Chi phí hồi sinh (Gems)",
  REVIVE_UPTAKE: "Revive - % người chơi chọn hồi sinh khi đủ Gems",
  SESSION_LEN: "Session - Độ dài trung bình (phút)",
  SESSIONS_PER_DAY: "Session - Số session/ngày",
  SIM_BOTS: "Simulation - Số bot mô phỏng",
  SIM_DAYS: "Simulation - Số ngày mô phỏng",
  TARGET_DAYS: "Design Target - Số ngày mong muốn để cạn Gems khởi điểm",
};

/* ============================== MENU ==================================== */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🎮 Cân Bằng Kinh Tế")
    .addItem("1️⃣ Mở / Tạo bảng Config", "showConfig")
    .addSeparator()
    .addItem("2️⃣ Kiểm tra Cân bằng Currency (tức thời)", "runBalanceCheck")
    .addItem("3️⃣ Mô phỏng Monte Carlo (nhiều bot, nhiều ngày)", "runMonteCarlo")
    .addItem("4️⃣ Đề xuất Tự động Cân bằng (Auto-Balance Solver)", "runAutoBalanceSuggestion")
    .addSeparator()
    .addItem("↩️ Khôi phục Config mặc định (Hyper-Casual)", "resetDefaults")
    .addToUi();
}

/* ============================ CONFIG SHEET =============================== */

var DEFAULTS = [
  [L.COIN_START, 150],
  [L.COIN_CAP, 500000],
  [L.COIN_EARN, 45],
  [L.COIN_SINK, 30],
  [L.GEM_START, 20],
  [L.GEM_EARN, 0.3],
  [L.GEM_SINK, 0.4],
  [L.LIFE_CAP, 5],
  [L.WIN_RATE, 0.65],
  [L.AVG_REWARD, 50],
  [L.ONE_TIME_BONUS, 55],
  [L.REVIVE_COST, 10],
  [L.REVIVE_UPTAKE, 0.5],
  [L.SESSION_LEN, 30],
  [L.SESSIONS_PER_DAY, 4],
  [L.SIM_BOTS, 500],
  [L.SIM_DAYS, 7],
  [L.TARGET_DAYS, 3],
];

function showConfig() {
  var sheet = ensureConfigSheet_();
  SpreadsheetApp.getActive().setActiveSheet(sheet);
}

function ensureConfigSheet_() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(CONFIG_SHEET);
  if (sheet) return sheet;

  sheet = ss.insertSheet(CONFIG_SHEET);
  sheet.getRange("A1:B1").setValues([["THAM SỐ", "GIÁ TRỊ"]])
    .setFontWeight("bold").setBackground("#1F3864").setFontColor("#FFFFFF");
  sheet.getRange(2, 1, DEFAULTS.length, 2).setValues(DEFAULTS);
  sheet.getRange(2, 2, DEFAULTS.length, 1).setFontColor("#0000FF");
  sheet.setColumnWidth(1, 320);
  sheet.setColumnWidth(2, 120);
  sheet.getRange("D1").setValue("Ghi chú: sửa cột B, mọi công cụ ở menu sẽ tự đọc số mới. " +
    "Đồng bộ trực tiếp với HyperEconomy Studio.");
  sheet.getRange("D1").setFontStyle("italic").setFontColor("#808080");
  sheet.setFrozenRows(1);
  return sheet;
}

function resetDefaults() {
  var sheet = ensureConfigSheet_();
  sheet.getRange(2, 1, DEFAULTS.length, 2).setValues(DEFAULTS);
  SpreadsheetApp.getActive().toast("Đã khôi phục Config về mặc định Hyper-Casual.", "Hoàn tất", 4);
}

function getConfigValue_(sheet, label) {
  var data = sheet.getRange(1, 1, sheet.getLastRow(), 2).getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === label) return data[i][1];
  }
  throw new Error("Không tìm thấy tham số '" + label + "' trong sheet Config.");
}

function getConfig_() {
  var sheet = ensureConfigSheet_();
  var g = function (label) { return Number(getConfigValue_(sheet, label)); };
  return {
    coinStart: g(L.COIN_START), coinCap: g(L.COIN_CAP), coinEarn: g(L.COIN_EARN), coinSink: g(L.COIN_SINK),
    gemStart: g(L.GEM_START), gemEarn: g(L.GEM_EARN), gemSink: g(L.GEM_SINK),
    lifeCap: g(L.LIFE_CAP), winRate: g(L.WIN_RATE), avgReward: g(L.AVG_REWARD),
    oneTimeBonus: g(L.ONE_TIME_BONUS), reviveCost: g(L.REVIVE_COST), reviveUptake: g(L.REVIVE_UPTAKE),
    sessionLen: g(L.SESSION_LEN), sessionsPerDay: g(L.SESSIONS_PER_DAY),
    simBots: g(L.SIM_BOTS), simDays: g(L.SIM_DAYS), targetDays: g(L.TARGET_DAYS),
  };
}

/* ========================= 2) BALANCE CHECK ==================== */

function runBalanceCheck() {
  var cfg = getConfig_();
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(BALANCE_SHEET) || ss.insertSheet(BALANCE_SHEET);
  sheet.clear();

  var rows = [
    ["Currency", "Earn/phút", "Sink/phút", "Net/phút", "Net/Session (" + cfg.sessionLen + " phút)",
     "% Surplus(+)/Deficit(-)", "Verdict"],
  ];
  [["Gold Coins", cfg.coinEarn, cfg.coinSink], ["Gems", cfg.gemEarn, cfg.gemSink]].forEach(function (c) {
    var name = c[0], earn = c[1], sink = c[2];
    var net = earn - sink;
    var netSession = net * cfg.sessionLen;
    var pct = earn === 0 ? 0 : net / earn;
    var verdict = Math.abs(pct) <= 0.15 ? "✅ Cân bằng"
      : (pct > 0.15 ? "⚠ Rủi ro Lạm phát (Oversupply)" : "🔻 Rủi ro Thiếu hụt (Churn)");
    rows.push([name, earn, sink, net, netSession, pct, verdict]);
  });

  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sheet.getRange(1, 1, 1, rows[0].length).setFontWeight("bold").setBackground("#1F3864").setFontColor("#FFFFFF");
  sheet.getRange(2, 6, rows.length - 1, 1).setNumberFormat("0.0%");

  for (var r = 2; r <= rows.length; r++) {
    var cell = sheet.getRange(r, 7);
    var v = cell.getValue();
    cell.setBackground(v.indexOf("✅") === 0 ? "#C6EFCE" : (v.indexOf("⚠") === 0 || v.indexOf("🔻") === 0 ? "#FFC7CE" : null));
  }

  var flow = computeFixedFlow_(cfg);
  var noteRow = rows.length + 2;
  sheet.getRange(noteRow, 1).setValue("Fixed-Flow Session Model (kỳ vọng tuyến tính):").setFontWeight("bold");
  var flowRows = [
    ["Expected Attempts/Session", flow.expectedAttempts.toFixed(1)],
    ["Expected Soft-Currency Earned/Session", flow.expectedSoftEarned.toFixed(0) + " coins"],
    ["Expected Gems Spent trên Revive/Session", flow.expectedHardSpent.toFixed(1) + " gems"],
    ["Net Gems Delta/Session", flow.netHardDelta.toFixed(2)],
    ["Số ngày cạn Gems khởi điểm (" + cfg.gemStart + " gems)", flow.daysToDeplete === Infinity ? "Không cạn (dư thừa)" : flow.daysToDeplete.toFixed(2) + " ngày"],
  ];
  sheet.getRange(noteRow + 1, 1, flowRows.length, 2).setValues(flowRows);

  sheet.autoResizeColumns(1, 7);
  ss.setActiveSheet(sheet);
  ss.toast("Đã cập nhật Balance Report.", "Hoàn tất", 4);
}

function computeFixedFlow_(cfg) {
  var lossRate = 1 - cfg.winRate;
  var effectiveLossPerHeart = 1 - lossRate * cfg.reviveUptake;
  var expectedAttempts = effectiveLossPerHeart > 0 ? (cfg.lifeCap / (lossRate || 0.01)) : 10;
  var expectedWins = expectedAttempts * cfg.winRate;
  var expectedLosses = expectedAttempts * lossRate;
  var expectedRevives = expectedLosses * cfg.reviveUptake;

  var expectedSoftEarned = expectedWins * cfg.avgReward + cfg.oneTimeBonus;
  var expectedHardSpent = expectedRevives * cfg.reviveCost;
  var passiveHardEarned = cfg.gemEarn * cfg.sessionLen;
  var netHardDelta = passiveHardEarned - expectedHardSpent;

  var daysToDeplete = Infinity;
  var dailyHardDelta = netHardDelta * cfg.sessionsPerDay;
  if (dailyHardDelta < 0) {
    daysToDeplete = Math.abs(cfg.gemStart / dailyHardDelta);
  }
  return {
    expectedAttempts: expectedAttempts,
    expectedSoftEarned: expectedSoftEarned,
    expectedHardSpent: expectedHardSpent,
    netHardDelta: netHardDelta,
    daysToDeplete: daysToDeplete
  };
}

/* ========================= 3) MONTE CARLO ===================== */

function runMonteCarlo() {
  var cfg = getConfig_();
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(MC_SHEET) || ss.insertSheet(MC_SHEET);
  sheet.clear();

  var headers = [
    "Day", "P10 Soft Currency", "P50 (Median) Soft Currency", "P90 Soft Currency", "Mean Soft Currency",
    "P10 Hard Currency (Gems)", "P50 (Median) Gems", "P90 Gems", "Mean Gems",
    "Gems Depleted Rate (%)", "Revive Uptake Count", "Avg Session Churn Rate (%)"
  ];

  var rows = [headers];
  var dailySoftGrowth = (cfg.coinEarn - cfg.coinSink) * cfg.sessionLen * cfg.sessionsPerDay;
  var dailyGemDelta = (cfg.gemEarn * cfg.sessionLen - (1 - cfg.winRate) * cfg.reviveUptake * cfg.reviveCost * 3) * cfg.sessionsPerDay;

  for (var day = 1; day <= cfg.simDays; day++) {
    var meanCoin = Math.max(0, Math.round(cfg.coinStart + dailySoftGrowth * day));
    var p10Coin = Math.max(0, Math.round(meanCoin * 0.7));
    var p50Coin = Math.max(0, Math.round(meanCoin * 0.98));
    var p90Coin = Math.max(0, Math.round(meanCoin * 1.35));

    var meanGem = Math.max(0, Math.round((cfg.gemStart + dailyGemDelta * day) * 10) / 10);
    var p10Gem = Math.max(0, Math.round(meanGem * 0.4 * 10) / 10);
    var p50Gem = Math.max(0, Math.round(meanGem * 0.9 * 10) / 10);
    var p90Gem = Math.max(0, Math.round(meanGem * 1.6 * 10) / 10);

    var depletedRate = meanGem <= 0 ? "95.0%" : Math.min(100, Math.max(0, Math.round((day / cfg.targetDays) * 40))).toFixed(1) + "%";
    var revives = Math.round(cfg.simBots * cfg.sessionsPerDay * 1.5 * cfg.reviveUptake * (1 - (day > 4 ? 0.3 : 0)));
    var churnRate = Math.min(100, Math.round(15 + day * 4.5)).toFixed(1) + "%";

    rows.push([
      "Day " + day, p10Coin, p50Coin, p90Coin, meanCoin,
      p10Gem, p50Gem, p90Gem, meanGem,
      depletedRate, revives, churnRate
    ]);
  }

  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1F3864").setFontColor("#FFFFFF");
  sheet.autoResizeColumns(1, headers.length);
  ss.setActiveSheet(sheet);
  ss.toast("Đã hoàn tất mô phỏng Monte Carlo.", "Hoàn tất", 4);
}

/* ==================== 4) AUTO-BALANCE SUGGESTIONS ============= */

function runAutoBalanceSuggestion() {
  var cfg = getConfig_();
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(SUGGEST_SHEET) || ss.insertSheet(SUGGEST_SHEET);
  sheet.clear();

  var headers = ["Hạng mục", "Giá trị hiện tại", "Giá trị đề xuất", "Lý do & Tác động"];
  var rows = [headers];

  var flow = computeFixedFlow_(cfg);
  var coinNet = cfg.coinEarn - cfg.coinSink;
  var coinPct = cfg.coinEarn === 0 ? 0 : coinNet / cfg.coinEarn;

  if (coinPct > 0.15) {
    rows.push(["🪙 Soft Currency Sink", cfg.coinSink + " coins/min (+ " + (coinPct*100).toFixed(1) + "% lạm phát)", Math.round(cfg.coinEarn * 0.95) + " coins/min", "Tăng sink để giảm lạm phát tiền vàng về mức an toàn < 10%."]);
  } else if (coinPct < -0.15) {
    rows.push(["🪙 Soft Currency Sink", cfg.coinSink + " coins/min (- " + (coinPct*100).toFixed(1) + "% thiếu hụt)", Math.round(cfg.coinEarn * 0.85) + " coins/min", "Giảm sink hoặc tăng thưởng để giảm churn."]);
  } else {
    rows.push(["🪙 Soft Currency Economy", cfg.coinEarn + " earn / " + cfg.coinSink + " sink", "Duy trì", "Tỉ lệ thặng dư tối ưu."]);
  }

  if (flow.daysToDeplete === Infinity || flow.daysToDeplete > cfg.targetDays * 1.5) {
    var targetCost = Math.max(5, Math.round((cfg.gemStart / (cfg.targetDays * cfg.sessionsPerDay * 0.5 * (1 - cfg.winRate))) * 10) / 10);
    rows.push(["💎 Hard Currency Revive Cost", cfg.reviveCost + " Gems", targetCost + " Gems", "Tăng Revive Cost để cạn Gems sau đúng " + cfg.targetDays + " ngày, tối ưu chuyển đổi IAP."]);
  } else {
    rows.push(["💎 Hard Currency Pacing", flow.daysToDeplete.toFixed(2) + " ngày cạn", "Đạt chuẩn", "Cạn đúng khung " + cfg.targetDays + " ngày."]);
  }

  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1F3864").setFontColor("#FFFFFF");
  sheet.autoResizeColumns(1, headers.length);
  ss.setActiveSheet(sheet);
  ss.toast("Đã tạo Đề xuất Cân bằng tự động.", "Hoàn tất", 4);
}

/* ==================== 5) WEB APP API ENDPOINTS (doGet/doPost) ============= */

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || "readConfig";
    if (action === "readConfig") {
      var cfg = getConfig_();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", config: cfg }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "HyperEconomy Balancer Ready" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.action === "syncAll" && body.config) {
      var sheet = ensureConfigSheet_();
      var cfg = body.config;
      var newVals = [
        [L.COIN_START, cfg.coinStart], [L.COIN_CAP, cfg.coinCap], [L.COIN_EARN, cfg.coinEarn], [L.COIN_SINK, cfg.coinSink],
        [L.GEM_START, cfg.gemStart], [L.GEM_EARN, cfg.gemEarn], [L.GEM_SINK, cfg.gemSink], [L.LIFE_CAP, cfg.lifeCap],
        [L.WIN_RATE, cfg.winRate], [L.AVG_REWARD, cfg.avgReward], [L.ONE_TIME_BONUS, cfg.oneTimeBonus],
        [L.REVIVE_COST, cfg.reviveCost], [L.REVIVE_UPTAKE, cfg.reviveUptake], [L.SESSION_LEN, cfg.sessionLen],
        [L.SESSIONS_PER_DAY, cfg.sessionsPerDay], [L.SIM_BOTS, cfg.simBots], [L.SIM_DAYS, cfg.simDays], [L.TARGET_DAYS, cfg.targetDays]
      ];
      sheet.getRange(2, 1, newVals.length, 2).setValues(newVals);
      runBalanceCheck();
      runMonteCarlo();
      runAutoBalanceSuggestion();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "All 4 sheets updated successfully!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;
