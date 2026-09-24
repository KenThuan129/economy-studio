import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  Sparkles,
  BarChart3,
  Dices,
  Wrench,
  X,
  LogOut,
  ShieldCheck,
  Zap,
  Code2,
  Copy,
  Check,
  FileDown,
  KeyRound,
  ChevronRight,
  Sliders,
  HelpCircle,
} from 'lucide-react';
import { useEconomy } from '../../context/EconomyContext';
import {
  googleSignIn,
  googleLogout,
  getAccessToken,
  setCachedAccessToken,
  initAuth,
} from '../../services/googleAuth';
import {
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_SPREADSHEET_URL,
  SHEET_NAMES,
  CONFIG_LABELS,
  extractSpreadsheetId,
  extractConfigFromProject,
  readConfigFromSheet,
  writeConfigToSheet,
  writeBalanceReportToSheet,
  writeMonteCarloResultsToSheet,
  writeBalanceSuggestionsToSheet,
  syncAllToSheet,
  syncViaWebAppUrl,
  computeFixedFlow,
  generateSuggestions,
  generateCsvString,
  downloadCsvFile,
  SheetConfigData,
} from '../../services/sheetsService';
import { HYPER_CASUAL_APPS_SCRIPT_CODE } from '../../data/googleAppsScriptCode';
import { User } from 'firebase/auth';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { project, simResult, updateCurrency, updateNodeData, updateSimConfig } = useEconomy();

  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  const [spreadsheetInput, setSpreadsheetInput] = useState<string>(DEFAULT_SPREADSHEET_ID);
  const [webAppUrl, setWebAppUrl] = useState<string>('');
  const [manualToken, setManualToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'sync' | 'preview' | 'script' | 'csv'>('sync');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processStatus, setProcessStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedCsv, setCopiedCsv] = useState<string | null>(null);

  // Confirmation Modal state for mutations
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    affectedTabs: string[];
    onConfirm: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    initAuth(
      (authUser) => {
        setUser(authUser);
        setIsAuthenticated(true);
      },
      () => {
        setUser(null);
        setIsAuthenticated(false);
      }
    );
  }, []);

  if (!isOpen) return null;

  const effectiveSpreadsheetId = extractSpreadsheetId(spreadsheetInput) || DEFAULT_SPREADSHEET_ID;
  const currentSpreadsheetUrl = `https://docs.google.com/spreadsheets/d/${effectiveSpreadsheetId}/edit`;

  const configData: SheetConfigData = extractConfigFromProject(project, simResult);
  const fixedFlowMetrics = computeFixedFlow(configData);
  const suggestions = generateSuggestions(configData);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setErrorMessage(null);
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/popup-blocked') {
        setErrorMessage(
          'Trình duyệt đã chặn cửa sổ Popup đăng nhập. Vui lòng cho phép Pop-up trên thanh địa chỉ hoặc dán Access Token vào ô bên dưới.'
        );
        setShowTokenInput(true);
      } else {
        setErrorMessage(err.message || 'Đăng nhập Google thất bại');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleApplyManualToken = () => {
    if (!manualToken.trim()) return;
    setCachedAccessToken(manualToken.trim());
    setIsAuthenticated(true);
    setSyncSuccessMsg('Đã nạp Access Token thành công! Bạn có thể thực hiện mọi thao tác đồng bộ.');
  };

  const handleSignOut = async () => {
    try {
      await googleLogout();
      setUser(null);
      setIsAuthenticated(false);
      setManualToken('');
    } catch (err: any) {
      console.error(err);
    }
  };

  const executeWithConfirmation = (
    title: string,
    description: string,
    affectedTabs: string[],
    action: () => Promise<void>
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      description,
      affectedTabs,
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsProcessing(true);
        setErrorMessage(null);
        setSyncSuccessMsg(null);
        try {
          await action();
        } catch (err: any) {
          console.error(err);
          setErrorMessage(err.message || 'Có lỗi xảy ra trong quá trình đồng bộ.');
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  // 1. Full 1-Click Sync
  const handleSyncAll = () => {
    executeWithConfirmation(
      'Xác nhận Đồng bộ Toàn diện vào Google Sheet',
      `Thao tác này sẽ cập nhật & ghi mới dữ liệu vào bảng tính Google Sheet "${effectiveSpreadsheetId}". Cả 4 tab (⚙️ Config, 📊 Balance_Report, 🎲 MonteCarlo_Results, 🛠 Balance_Suggestions) sẽ được đồng bộ.`,
      [
        SHEET_NAMES.CONFIG,
        SHEET_NAMES.BALANCE,
        SHEET_NAMES.MONTE_CARLO,
        SHEET_NAMES.SUGGESTIONS,
      ],
      async () => {
        if (webAppUrl.trim()) {
          setProcessStatus('Đang gửi dữ liệu qua Apps Script Web App...');
          setProgressPercent(50);
          await syncViaWebAppUrl(webAppUrl.trim(), configData);
          setProgressPercent(100);
          setSyncSuccessMsg('Đã gửi yêu cầu đồng bộ toàn diện thành công qua Web App URL!');
        } else {
          await syncAllToSheet(
            effectiveSpreadsheetId,
            configData,
            simResult,
            (step, pct) => {
              setProcessStatus(step);
              setProgressPercent(pct);
            }
          );
          setSyncSuccessMsg('Đã đồng bộ thành công cả 4 tab vào Google Sheet!');
        }
      }
    );
  };

  // 2. Push Config Only
  const handlePushConfig = () => {
    executeWithConfirmation(
      'Ghi Cấu hình sang Sheet (⚙️ Config)',
      'Thao tác này sẽ ghi đè các tham số kinh tế trong tab ⚙️ Config trên Google Sheet theo thiết lập hiện tại.',
      [SHEET_NAMES.CONFIG],
      async () => {
        setProcessStatus('Đang cập nhật tab ⚙️ Config...');
        setProgressPercent(50);
        await writeConfigToSheet(effectiveSpreadsheetId, configData);
        setProgressPercent(100);
        setSyncSuccessMsg('Đã ghi cấu hình thành công sang tab ⚙️ Config!');
      }
    );
  };

  // 3. Pull Config from Sheet
  const handlePullConfig = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSyncSuccessMsg(null);
    setProcessStatus('Đang đọc dữ liệu từ tab ⚙️ Config trên Google Sheet...');
    setProgressPercent(30);

    try {
      const sheetCfg = await readConfigFromSheet(effectiveSpreadsheetId);
      setProgressPercent(70);

      // Apply to project currencies
      const coin = project.currencies.find(
        (c) => c.id === 'curr_coins' || c.id === 'curr_gold' || c.type === 'soft'
      );
      if (coin) {
        updateCurrency(coin.id, {
          startingAmount: sheetCfg.coinStart,
          maxCap: sheetCfg.coinCap,
          earnRatePerMinute: sheetCfg.coinEarn,
          sinkRatePerMinute: sheetCfg.coinSink,
        });
      }

      const gem = project.currencies.find(
        (c) => c.id === 'curr_gems' || c.id === 'curr_diamonds' || c.type === 'hard'
      );
      if (gem) {
        updateCurrency(gem.id, {
          startingAmount: sheetCfg.gemStart,
          earnRatePerMinute: sheetCfg.gemEarn,
          sinkRatePerMinute: sheetCfg.gemSink,
        });
      }

      const life = project.currencies.find(
        (c) => c.id === 'curr_lives' || c.id === 'curr_stamina' || c.id === 'curr_energy'
      );
      if (life) {
        updateCurrency(life.id, {
          startingAmount: sheetCfg.lifeCap,
          maxCap: sheetCfg.lifeCap,
        });
      }

      // Update Chance Node win rate
      const chanceNode = project.nodes.find((n) => n.data.type === 'CHANCE');
      if (chanceNode) {
        const winProb = Math.round(sheetCfg.winRate * 100);
        updateNodeData(chanceNode.id, {
          chanceBranches: [
            { label: `Win (${winProb}%)`, probability: winProb },
            { label: `Lose (${100 - winProb}%)`, probability: 100 - winProb },
          ],
        });
      }

      // Update Simulation Config
      updateSimConfig({
        numberOfBots: sheetCfg.simBots,
        maxSessionMinutes: sheetCfg.sessionLen,
      });

      setProgressPercent(100);
      setSyncSuccessMsg('Đã nhập thành công các tham số từ Google Sheet vào Studio!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể đọc cấu hình từ Sheet.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Push Balance Report
  const handlePushBalanceReport = () => {
    executeWithConfirmation(
      'Cập nhật Báo cáo Cân bằng (📊 Balance_Report)',
      'Thao tác này sẽ ghi đè bảng phân tích lạm phát & Fixed-Flow Spend Model vào tab 📊 Balance_Report.',
      [SHEET_NAMES.BALANCE],
      async () => {
        setProcessStatus('Đang ghi tab 📊 Balance_Report...');
        setProgressPercent(60);
        await writeBalanceReportToSheet(effectiveSpreadsheetId, configData);
        setProgressPercent(100);
        setSyncSuccessMsg('Đã cập nhật thành công tab 📊 Balance_Report!');
      }
    );
  };

  // 5. Push Monte Carlo Results
  const handlePushMonteCarlo = () => {
    executeWithConfirmation(
      'Ghi Kết quả Monte Carlo (🎲 MonteCarlo_Results)',
      'Thao tác này sẽ mô phỏng phân phối kinh tế theo ngày và ghi kết quả vào tab 🎲 MonteCarlo_Results.',
      [SHEET_NAMES.MONTE_CARLO],
      async () => {
        setProcessStatus('Đang tạo & ghi kết quả Monte Carlo...');
        setProgressPercent(70);
        await writeMonteCarloResultsToSheet(effectiveSpreadsheetId, configData, simResult);
        setProgressPercent(100);
        setSyncSuccessMsg('Đã ghi thành công tab 🎲 MonteCarlo_Results!');
      }
    );
  };

  // 6. Push Suggestions
  const handlePushSuggestions = () => {
    executeWithConfirmation(
      'Ghi Đề xuất Cân bằng AI Solver (🛠 Balance_Suggestions)',
      'Thao tác này sẽ ghi các đề xuất tự động cân bằng tiền tệ vào tab 🛠 Balance_Suggestions.',
      [SHEET_NAMES.SUGGESTIONS],
      async () => {
        setProcessStatus('Đang ghi đề xuất cân bằng...');
        setProgressPercent(80);
        await writeBalanceSuggestionsToSheet(effectiveSpreadsheetId, configData);
        setProgressPercent(100);
        setSyncSuccessMsg('Đã ghi thành công tab 🛠 Balance_Suggestions!');
      }
    );
  };

  // Apply Solver Suggestions Directly to Studio
  const handleApplySolverToStudio = () => {
    const coin = project.currencies.find(
      (c) => c.id === 'curr_coins' || c.id === 'curr_gold' || c.type === 'soft'
    );
    if (coin) {
      const optimalSink = Math.round(configData.coinEarn * 0.95);
      updateCurrency(coin.id, { sinkRatePerMinute: optimalSink });
    }

    const gem = project.currencies.find(
      (c) => c.id === 'curr_gems' || c.id === 'curr_diamonds' || c.type === 'hard'
    );
    if (gem) {
      const targetCost = Math.max(
        5,
        Math.round(
          (configData.gemStart /
            (configData.targetDays * configData.sessionsPerDay * 0.5 * (1 - configData.winRate))) *
            10
        ) / 10
      );
      // Update revive spend node
      const reviveNode = project.nodes.find(
        (n) => n.data.type === 'SPEND' && n.id.includes('revive')
      );
      if (reviveNode) {
        updateNodeData(reviveNode.id, { spendAmount: targetCost });
      }
    }
    setSyncSuccessMsg('Đã áp dụng các thông số cân bằng tối ưu vào Studio!');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(HYPER_CASUAL_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleDownloadCsv = (sheetType: 'config' | 'balance' | 'monte_carlo' | 'suggestions') => {
    if (sheetType === 'config') {
      const rows = [
        ['THAM SỐ', 'GIÁ TRỊ'],
        [CONFIG_LABELS.COIN_START, configData.coinStart],
        [CONFIG_LABELS.COIN_CAP, configData.coinCap],
        [CONFIG_LABELS.COIN_EARN, configData.coinEarn],
        [CONFIG_LABELS.COIN_SINK, configData.coinSink],
        [CONFIG_LABELS.GEM_START, configData.gemStart],
        [CONFIG_LABELS.GEM_EARN, configData.gemEarn],
        [CONFIG_LABELS.GEM_SINK, configData.gemSink],
        [CONFIG_LABELS.LIFE_CAP, configData.lifeCap],
        [CONFIG_LABELS.WIN_RATE, configData.winRate],
        [CONFIG_LABELS.AVG_REWARD, configData.avgReward],
        [CONFIG_LABELS.ONE_TIME_BONUS, configData.oneTimeBonus],
        [CONFIG_LABELS.REVIVE_COST, configData.reviveCost],
        [CONFIG_LABELS.REVIVE_UPTAKE, configData.reviveUptake],
        [CONFIG_LABELS.SESSION_LEN, configData.sessionLen],
        [CONFIG_LABELS.SESSIONS_PER_DAY, configData.sessionsPerDay],
        [CONFIG_LABELS.SIM_BOTS, configData.simBots],
        [CONFIG_LABELS.SIM_DAYS, configData.simDays],
        [CONFIG_LABELS.TARGET_DAYS, configData.targetDays],
      ];
      downloadCsvFile('01_Config.csv', generateCsvString(rows));
    } else if (sheetType === 'balance') {
      const rows = [
        [
          'Currency',
          'Earn/phút',
          'Sink/phút',
          'Net/phút',
          `Net/Session (${configData.sessionLen}m)`,
          '% Surplus(+)/Deficit(-)',
          'Verdict',
        ],
        [
          'Gold Coins',
          configData.coinEarn,
          configData.coinSink,
          fixedFlowMetrics.coinNetPerMin,
          fixedFlowMetrics.coinNetPerSession,
          `${(fixedFlowMetrics.coinSurplusPct * 100).toFixed(1)}%`,
          fixedFlowMetrics.coinVerdict,
        ],
        [
          'Gems',
          configData.gemEarn,
          configData.gemSink,
          fixedFlowMetrics.gemNetPerMin,
          fixedFlowMetrics.gemNetPerSession,
          `${(fixedFlowMetrics.gemSurplusPct * 100).toFixed(1)}%`,
          fixedFlowMetrics.gemVerdict,
        ],
        ['Expected Attempts/Session', fixedFlowMetrics.expectedAttempts],
        ['Expected Soft-Currency Earned/Session', fixedFlowMetrics.expectedSoftEarned],
        ['Expected Gems Spent trên Revive/Session', fixedFlowMetrics.expectedHardSpent],
        ['Net Gems Delta/Session', fixedFlowMetrics.netHardDelta],
        ['Số ngày cạn Gems khởi điểm', fixedFlowMetrics.daysToDeplete],
      ];
      downloadCsvFile('02_Balance_Report.csv', generateCsvString(rows));
    } else if (sheetType === 'suggestions') {
      const rows = [
        ['Hạng mục', 'Giá trị hiện tại', 'Giá trị đề xuất', 'Lý do & Tác động'],
        ...suggestions.map((s) => [s.category, s.currentValue, s.suggestedValue, s.reasonImpact]),
      ];
      downloadCsvFile('04_Balance_Suggestions.csv', generateCsvString(rows));
    }
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700/80 ring-1 ring-white/10 rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[86vh] flex flex-col shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)] overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header - Fixed Top */}
        <div className="flex-shrink-0 px-5 py-3.5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight truncate">
                  Google Sheets Balancer Sync
                </h2>
                <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  Two-Way Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Đồng bộ 2 chiều dữ liệu kinh tế với Google Sheet & Apps Script
              </p>
            </div>
          </div>

          {/* Header Actions: Google Login & Close */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google'}
                    className="w-5 h-5 rounded-full border border-slate-600"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {user?.email ? user.email.charAt(0).toUpperCase() : 'G'}
                  </div>
                )}
                <span className="text-[11px] font-medium text-slate-200 hidden md:inline truncate max-w-[120px]">
                  {user?.displayName || user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  title="Đăng xuất"
                  className="text-slate-400 hover:text-rose-400 p-0.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl border border-slate-300 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isSigningIn ? 'Đang kết nối...' : 'Đăng nhập Google'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Secondary Bar: Spreadsheet Target & Token - Fixed */}
        <div className="flex-shrink-0 px-5 py-2.5 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <span className="text-slate-400 text-[11px] font-medium whitespace-nowrap">Target Sheet:</span>
            <input
              type="text"
              value={spreadsheetInput}
              onChange={(e) => setSpreadsheetInput(e.target.value)}
              placeholder="Spreadsheet ID..."
              className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <a
              href={currentSpreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mở Sheet ↗</span>
            </a>
            <button
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors"
              title="Nhập Token / Web App URL dự phòng"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>

        {/* Manual Token / Web App Input Drawer */}
        {showTokenInput && (
          <div className="px-5 py-3 bg-slate-950/90 border-b border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold flex items-center gap-1.5 text-amber-400">
                <KeyRound className="w-3.5 h-3.5" /> Nạp Token OAuth hoặc Web App URL (Dự phòng)
              </span>
              <button
                onClick={() => setShowTokenInput(false)}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                Đóng
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Access Token (Bearer ya29...):</span>
                <div className="flex gap-1.5">
                  <input
                    type="password"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="ya29.a0..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                  <button
                    onClick={handleApplyManualToken}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
                  >
                    Nạp
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Apps Script Web App URL:</span>
                <input
                  type="text"
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation - Fixed */}
        <div className="flex-shrink-0 px-5 border-b border-slate-800 flex gap-3 bg-slate-950/40 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-2 font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'sync'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Trung tâm Đồng bộ (Sync Hub)</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-2 font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'preview'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Xem trước Báo cáo & Solver</span>
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`py-2 font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'script'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Mã Nguồn Google Apps Script</span>
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`py-2 font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'csv'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Xuất / Nhập CSV</span>
          </button>
        </div>

        {/* Body Content - Scrollable */}
        <div className="p-5 flex-1 min-h-0 overflow-y-auto space-y-4">
          {/* Status & Error Toasts */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {syncSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{syncSuccessMsg}</span>
            </div>
          )}

          {isProcessing && (
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-300 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {processStatus || 'Đang xử lý...'}
                </span>
                <span className="font-mono text-indigo-400 font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* TAB 1: SYNC HUB */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              {/* Prominent Google Sign-in Banner (Visible when unauthenticated) */}
              {!isAuthenticated && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-xs font-bold text-white">
                        Chưa đăng nhập Google
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-300 max-w-md">
                      Nhấn vào nút bên cạnh để đăng nhập Google và cấp quyền kết nối hai chiều với Google Sheets.
                    </p>
                  </div>
                  <button
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                    className="flex items-center justify-center gap-2.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl border border-slate-300 shadow-md transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>{isSigningIn ? 'Đang kết nối...' : 'Đăng nhập Google'}</span>
                  </button>
                </div>
              )}

              {/* Primary 1-Click Sync Hero Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 relative overflow-hidden group shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400 fill-current" />
                      <h3 className="text-sm font-bold text-white">
                        Đồng bộ Toàn diện 1-Click (1-Click Master Sync)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 max-w-xl">
                      Tự động tạo & ghi đè toàn bộ 4 tab: <code className="text-emerald-300">⚙️ Config</code>,{' '}
                      <code className="text-emerald-300">📊 Balance_Report</code>,{' '}
                      <code className="text-emerald-300">🎲 MonteCarlo_Results</code>, và{' '}
                      <code className="text-emerald-300">🛠 Balance_Suggestions</code> theo dự án studio.
                    </p>
                  </div>
                  <button
                    onClick={handleSyncAll}
                    disabled={isProcessing || (!isAuthenticated && !webAppUrl)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                  >
                    <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                    <span>{isProcessing ? 'Đang đồng bộ...' : 'Chạy Đồng Bộ Toàn Diện'}</span>
                  </button>
                </div>
              </div>

              {/* Individual Modular Operations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Push Config */}
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-xs font-bold text-slate-200">
                        Đẩy Cấu hình (Push ⚙️ Config)
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Ghi các giá trị starting coins, gems, earn/sink rates, win rate và revive cost sang tab ⚙️ Config trên Google Sheet.
                    </p>
                  </div>
                  <button
                    onClick={handlePushConfig}
                    disabled={isProcessing || !isAuthenticated}
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Ghi sang ⚙️ Config</span>
                  </button>
                </div>

                {/* Pull Config */}
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <DownloadCloud className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-slate-200">
                        Nhập từ Sheet (Pull ⚙️ Config)
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Đọc các giá trị vừa chỉnh sửa trên Google Sheet và cập nhật ngay vào studio (tiền tệ, win rate, simulation).
                    </p>
                  </div>
                  <button
                    onClick={handlePullConfig}
                    disabled={isProcessing || !isAuthenticated}
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
                  >
                    <DownloadCloud className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tải về từ ⚙️ Config</span>
                  </button>
                </div>

                {/* Push Balance Report */}
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-slate-200">
                        Xuất Báo Cáo (📊 Balance_Report)
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Tính toán Net rate/min, Surplus %, Churn Verdict và Fixed-Flow model rồi ghi sang tab 📊 Balance_Report.
                    </p>
                  </div>
                  <button
                    onClick={handlePushBalanceReport}
                    disabled={isProcessing || !isAuthenticated}
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cập nhật 📊 Balance_Report</span>
                  </button>
                </div>

                {/* Push Monte Carlo */}
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Dices className="w-4 h-4 text-purple-400" />
                      <h4 className="text-xs font-bold text-slate-200">
                        Mô Phỏng Monte Carlo (🎲 MonteCarlo_Results)
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Chạy phân phối 500 bot qua 7 ngày (P10, P50 Median, P90, Gems Bankruptcy, Churn Rate) và xuất bảng kết quả.
                    </p>
                  </div>
                  <button
                    onClick={handlePushMonteCarlo}
                    disabled={isProcessing || !isAuthenticated}
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
                  >
                    <Dices className="w-3.5 h-3.5 text-purple-400" />
                    <span>Ghi 🎲 MonteCarlo_Results</span>
                  </button>
                </div>

                {/* Push Suggestions */}
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 md:col-span-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-bold text-slate-200">
                        Đề Xuất Auto-Balance Solver (🛠 Balance_Suggestions)
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Phân tích các lỗ hổng lạm phát coin, thời gian cạn gem mục tiêu (Target {configData.targetDays} ngày), và khuyến nghị điều chỉnh số liệu chính xác.
                    </p>
                  </div>
                  <button
                    onClick={handlePushSuggestions}
                    disabled={isProcessing || !isAuthenticated}
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
                  >
                    <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ghi 🛠 Balance_Suggestions</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE PREVIEW & IN-APP SOLVER */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              {/* Currency Balance Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    Báo Cáo Cân Bằng Tiền Tệ (Balance Report Preview)
                  </h4>
                  <button
                    onClick={handleApplySolverToStudio}
                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Áp Dụng Đề Xuất Solver Vào Studio</span>
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Tiền tệ</th>
                        <th className="p-3">Earn/phút</th>
                        <th className="p-3">Sink/phút</th>
                        <th className="p-3">Net/phút</th>
                        <th className="p-3">Net/Session ({configData.sessionLen}m)</th>
                        <th className="p-3">% Thặng dư / Thiếu hụt</th>
                        <th className="p-3">Đánh giá (Verdict)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      <tr>
                        <td className="p-3 font-semibold text-amber-400">Gold Coins</td>
                        <td className="p-3 font-mono">{configData.coinEarn}</td>
                        <td className="p-3 font-mono">{configData.coinSink}</td>
                        <td className="p-3 font-mono font-bold text-slate-200">
                          {fixedFlowMetrics.coinNetPerMin > 0 ? `+${fixedFlowMetrics.coinNetPerMin}` : fixedFlowMetrics.coinNetPerMin}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-200">
                          {fixedFlowMetrics.coinNetPerSession > 0 ? `+${fixedFlowMetrics.coinNetPerSession}` : fixedFlowMetrics.coinNetPerSession}
                        </td>
                        <td className="p-3 font-mono">
                          {(fixedFlowMetrics.coinSurplusPct * 100).toFixed(1)}%
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-200">
                            {fixedFlowMetrics.coinVerdict}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-sky-400">Gems</td>
                        <td className="p-3 font-mono">{configData.gemEarn}</td>
                        <td className="p-3 font-mono">{configData.gemSink}</td>
                        <td className="p-3 font-mono font-bold text-slate-200">
                          {fixedFlowMetrics.gemNetPerMin > 0 ? `+${fixedFlowMetrics.gemNetPerMin}` : fixedFlowMetrics.gemNetPerMin}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-200">
                          {fixedFlowMetrics.gemNetPerSession > 0 ? `+${fixedFlowMetrics.gemNetPerSession}` : fixedFlowMetrics.gemNetPerSession}
                        </td>
                        <td className="p-3 font-mono">
                          {(fixedFlowMetrics.gemSurplusPct * 100).toFixed(1)}%
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-200">
                            {fixedFlowMetrics.gemVerdict}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fixed Flow Model Metrics */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Mô hình Fixed-Flow Kỳ Vọng Tuyến Tính
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Expected Attempts/Session</span>
                    <span className="text-base font-bold text-white font-mono">
                      {fixedFlowMetrics.expectedAttempts} lượt
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Expected Coins Earned/Session</span>
                    <span className="text-base font-bold text-amber-400 font-mono">
                      {fixedFlowMetrics.expectedSoftEarned} coins
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Expected Gems Revive Spent</span>
                    <span className="text-base font-bold text-sky-400 font-mono">
                      {fixedFlowMetrics.expectedHardSpent} gems
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 sm:col-span-3">
                    <span className="text-[11px] text-slate-400 block">
                      Số Ngày Cạn Gems Khởi Điểm (Mục tiêu: {configData.targetDays} ngày)
                    </span>
                    <span className="text-base font-bold text-emerald-400 font-mono">
                      {fixedFlowMetrics.daysToDeplete === Infinity
                        ? 'Không cạn (Dư thừa gems)'
                        : `${fixedFlowMetrics.daysToDeplete} ngày`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Suggestions Preview */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-cyan-400" />
                  Đề Xuất Cân Bằng (Auto-Balance Suggestions Preview)
                </h4>
                <div className="space-y-2">
                  {suggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{sug.category}</span>
                        <span className="text-emerald-400 font-semibold font-mono">
                          {sug.suggestedValue}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{sug.reasonImpact}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APPS SCRIPT SOURCE CODE & SETUP */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              {/* Instructions */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-400" /> Hướng dẫn cài đặt Google Apps Script vào Google Sheet
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold mb-1.5">
                      1
                    </span>
                    <p className="text-[11px] text-slate-300">
                      Mở Google Sheet của bạn.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold mb-1.5">
                      2
                    </span>
                    <p className="text-[11px] text-slate-300">
                      Menu <strong className="text-white">Extensions &gt; Apps Script</strong>.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold mb-1.5">
                      3
                    </span>
                    <p className="text-[11px] text-slate-300">
                      Xoá code cũ, dán toàn bộ code bên dưới.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold mb-1.5">
                      4
                    </span>
                    <p className="text-[11px] text-slate-300">
                      Nhấn <strong>Save (Ctrl+S)</strong> và quay lại Sheet F5.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold mb-1.5">
                      5
                    </span>
                    <p className="text-[11px] text-emerald-300 font-semibold">
                      Menu "🎮 Cân Bằng Kinh Tế" sẵn sàng!
                    </p>
                  </div>
                </div>
              </div>

              {/* Code Box with Copy Button */}
              <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">HyperCasualEconomyBalancer.gs</span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Đã sao chép!' : 'Sao chép toàn bộ mã'}</span>
                  </button>
                </div>
                <pre className="p-4 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[380px] leading-relaxed">
                  {HYPER_CASUAL_APPS_SCRIPT_CODE}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: CSV EXPORT & BACKUP */}
          {activeTab === 'csv' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-emerald-400" /> Tải về tệp CSV sẵn sàng nhập vào Google Sheet
                </h4>
                <p className="text-xs text-slate-300">
                  Bạn có thể tải các tệp CSV này và dùng tính năng <strong>File &gt; Import</strong> trên Google Sheet để cập nhật bảng tính ngay lập tức mà không cần xác thực trực tuyến.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-200">01_Config.csv</h5>
                    <p className="text-[11px] text-slate-400">
                      Tất cả tham số kinh tế khởi điểm, win rate, earn/sink rate.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadCsv('config')}
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Tải 01_Config.csv</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-200">02_Balance_Report.csv</h5>
                    <p className="text-[11px] text-slate-400">
                      Báo cáo net/session, tỷ lệ thặng dư và Fixed-Flow model.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadCsv('balance')}
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tải 02_Balance_Report.csv</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-200">04_Balance_Suggestions.csv</h5>
                    <p className="text-[11px] text-slate-400">
                      Bảng đề xuất điều chỉnh tối ưu cân bằng kinh tế.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadCsv('suggestions')}
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Tải 04_Balance_Suggestions.csv</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-500">
          <span>Spreadsheet ID: <code className="text-slate-400 font-mono">{effectiveSpreadsheetId}</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Explicit User Confirmation Dialog (MANDATORY per Workspace Skill) */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">{confirmDialog.title}</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {confirmDialog.description}
            </p>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
              <span className="text-slate-400 font-medium">Các tab sẽ được cập nhật/ghi đè:</span>
              <ul className="list-disc list-inside text-emerald-300 font-mono text-[11px] space-y-0.5">
                {confirmDialog.affectedTabs.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Huỷ bỏ
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
              >
                Xác nhận & Thực hiện
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
