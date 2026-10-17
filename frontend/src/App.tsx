import React, { useEffect, useState } from 'react';
import { Seller, Category } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { BuyerMarketplace } from './components/BuyerMarketplace';
import { SellerDashboard } from './components/SellerDashboard';
import { Loader2, HardHat, ShieldCheck, Database, Layers } from 'lucide-react';

export const App: React.FC = () => {
  const [view, setView] = useState<'buyer' | 'seller'>('buyer');
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    async function initPlatform() {
      try {
        const [sellersData, categoriesData] = await Promise.all([
          api.getSellers(),
          api.getCategories(),
        ]);
        setSellers(sellersData);
        setCategories(categoriesData);
        // Default to first approved seller
        const defaultSeller = sellersData.find((s) => s.status === 'APPROVED') || sellersData[0] || null;
        setSelectedSeller(defaultSeller);
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setInitLoading(false);
      }
    }
    initPlatform();
  }, []);

  if (initLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 mb-4 animate-bounce shadow-lg">
          <HardHat className="w-7 h-7 stroke-[2.5]" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">MarketPlace Construction Engine</h1>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
          Loading supplier catalogue and platform data...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Navigation */}
      <Navbar
        currentView={view}
        onViewChange={(newView) => setView(newView)}
        sellers={sellers}
        selectedSeller={selectedSeller}
        onSellerSelect={(s) => setSelectedSeller(s)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {view === 'buyer' ? (
          <BuyerMarketplace categories={categories} />
        ) : (
          <SellerDashboard
            currentSeller={selectedSeller}
            sellers={sellers}
            onSelectSeller={(s) => setSelectedSeller(s)}
          />
        )}
      </main>

      {/* Professional Construction Platform Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-xs">
                M
              </div>
              <span className="font-bold text-slate-200 text-sm">MarketPlace Platform</span>
              <span className="text-[10px] text-slate-500 border-l border-slate-700 pl-2">
                Construction Materials Procurement Architecture
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                PostgreSQL + Flyway
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Optimistic Locking (@Version)
              </span>
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Spring Boot 3 + Java 21 + React
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} MarketPlace Enterprise. Designed for heavy construction logistics.</p>
            <p>Demo Auth Mode: Server-validated <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">X-Seller-Id</code> header.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
