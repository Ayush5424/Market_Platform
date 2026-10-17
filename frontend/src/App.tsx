import React, { useEffect, useState } from 'react';
import { Seller, Category } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { BuyerMarketplace } from './components/BuyerMarketplace';
import { SellerDashboard } from './components/SellerDashboard';
import { Loader2, HardHat } from 'lucide-react';

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
        <h1 className="text-xl font-bold tracking-tight">MarketPlace</h1>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
          Loading supplier catalogue and materials...
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

      {/* Clean, Professional Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-1.5">
          <div className="font-bold text-slate-100 text-base">MarketPlace</div>
          <p className="text-slate-400 text-xs">Construction Materials Marketplace</p>
          <p className="text-slate-500 text-[11px] pt-2">© 2026 MarketPlace. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
