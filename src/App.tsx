import React from 'react';
import { EconomyProvider, useEconomy } from './context/EconomyContext';
import { Navbar } from './components/layout/Navbar';
import { CurrencyDesigner } from './components/currencies/CurrencyDesigner';
import { ShopDesigner } from './components/shop/ShopDesigner';
import { FlowSimulator } from './components/simulator/FlowSimulator';

const MainContent: React.FC = () => {
  const { activeSection } = useEconomy();

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Fixed / Sticky Navigation Bar */}
      <Navbar />

      {/* Dynamic Main Workspace Sections */}
      <main className="flex-1 pb-16">
        {activeSection === 'currencies' && <CurrencyDesigner />}
        {activeSection === 'shop' && <ShopDesigner />}
        {activeSection === 'simulator' && <FlowSimulator />}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <EconomyProvider>
      <MainContent />
    </EconomyProvider>
  );
};

export default App;
