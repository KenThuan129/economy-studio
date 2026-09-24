import React, { useRef, useState, useEffect } from 'react';
import {
  Coins,
  ShoppingBag,
  Activity,
  Download,
  Upload,
  RotateCcw,
  HelpCircle,
  Sparkles,
  Play,
  Layers,
  ChevronDown,
  FileSpreadsheet,
} from 'lucide-react';
import { useEconomy, ActiveSection } from '../../context/EconomyContext';
import { GoogleSheetsSyncModal } from '../sheets/GoogleSheetsSyncModal';
import { initAuth } from '../../services/googleAuth';
import { User } from 'firebase/auth';

export const Navbar: React.FC = () => {
  const {
    activeSection,
    setActiveSection,
    project,
    currencies,
    shopItems,
    nodes,
    selectedTemplateKey,
    loadTemplate,
    exportProjectJson,
    importProjectJson,
    resetProjectToDefault,
    setIsHelpOpen,
    runSimulation,
    isSimulating,
  } = useEconomy();

  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState<boolean>(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);

  useEffect(() => {
    initAuth(
      (user) => setGoogleUser(user),
      () => setGoogleUser(null)
    );
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importProjectJson(content);
        if (!res.success) {
          alert(`Import failed: ${res.error}`);
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none sticky top-0">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">
                HyperEconomy <span className="text-indigo-400 font-semibold">Studio</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[200px] leading-tight">
              {project.name}
            </p>
          </div>
        </div>

        {/* Template Quick Switcher */}
        <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" /> Template:
          </span>
          <select
            value={selectedTemplateKey}
            onChange={(e) => loadTemplate(e.target.value)}
            className="bg-slate-800 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
          >
            <option value="hyper_casual_loop">❤️ Hyper-Casual (Lives, Revives & No-Ads)</option>
            <option value="idle_clicker">🎮 Idle Clicker Starter</option>
            <option value="runner_runner">🏃 Runner Runner Starter</option>
            <option value="instant_game">⚡ Instant Game (Social/Web)</option>
            <option value="hybrid_game">⚔️ Hybrid-Casual (Archero/Survivor)</option>
            <option value="midcore_game">🛡️ Midcore RPG (Hero Battler)</option>
          </select>
        </div>
      </div>

      {/* Main 3 Section Tabs */}
      <nav className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80">
        <button
          onClick={() => setActiveSection('currencies')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeSection === 'currencies'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-400" />
          <span>Currency Designer</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
              activeSection === 'currencies' ? 'bg-indigo-700/60 text-indigo-100' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {currencies.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('shop')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeSection === 'shop'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-pink-400" />
          <span>Shop Designer</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
              activeSection === 'shop' ? 'bg-indigo-700/60 text-indigo-100' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {shopItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('simulator')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeSection === 'simulator'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>User Flow Simulator</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
              activeSection === 'simulator' ? 'bg-indigo-700/60 text-indigo-100' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {nodes.length} nodes
          </span>
        </button>
      </nav>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* Quick Simulator Run Button */}
        <button
          onClick={() => {
            setActiveSection('simulator');
            runSimulation();
          }}
          disabled={isSimulating}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-900/30 transition-all active:scale-95 disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isSimulating ? 'Simulating...' : 'Run Simulation'}</span>
        </button>

        {/* Project Import / Export */}
        <div className="flex items-center gap-1 bg-slate-800/60 p-0.5 rounded-lg border border-slate-700/70">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import Project JSON"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-md transition-colors"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={exportProjectJson}
            title="Export Project JSON"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-md transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Google Sheets Economy Sync Button */}
        <button
          onClick={() => setIsSheetsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/40 shadow-sm shadow-emerald-950/50 transition-all active:scale-95"
          title="Đồng bộ Google Sheets & Apps Script"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Google Sheets</span>
          {googleUser && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        {/* Reset */}
        <button
          onClick={() => {
            if (confirm('Reset project to default starter configuration?')) {
              resetProjectToDefault();
            }
          }}
          title="Reset to Starter"
          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Help Onboarding Walkthrough */}
        <button
          onClick={() => setIsHelpOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700/60 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Help</span>
        </button>
      </div>

      {/* Google Sheets Sync Modal */}
      <GoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />
    </header>
  );
};
