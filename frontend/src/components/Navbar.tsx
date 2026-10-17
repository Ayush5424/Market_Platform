import React from 'react';
import { Seller } from '../types';
import { HardHat, Store, ShoppingBag, ShieldCheck, Clock, ShieldAlert, ChevronDown } from 'lucide-react';

interface NavbarProps {
  currentView: 'buyer' | 'seller';
  onViewChange: (view: 'buyer' | 'seller') => void;
  sellers: Seller[];
  selectedSeller: Seller | null;
  onSellerSelect: (seller: Seller) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  sellers,
  selectedSeller,
  onSellerSelect,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3 h-3" /> Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <ShieldAlert className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 shadow-inner">
              <HardHat className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">MarketPlace</span>
                <span className="text-[10px] tracking-widest uppercase bg-slate-800 text-amber-400 font-bold px-1.5 py-0.5 rounded border border-slate-700">
                  Heavy Materials
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Multi-Seller B2B Construction Procurement</p>
            </div>
          </div>

          {/* Navigation Mode Switcher */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => onViewChange('buyer')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentView === 'buyer'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Buyer Marketplace</span>
            </button>
            <button
              type="button"
              onClick={() => onViewChange('seller')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentView === 'seller'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Seller Portal</span>
            </button>
          </div>

          {/* Demo Seller Switcher Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative group">
              <div className="text-right hidden md:block">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Demo Seller Identity
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs transition-colors">
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-white truncate max-w-[140px] sm:max-w-[180px]">
                    {selectedSeller ? selectedSeller.businessName : 'Select Seller'}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {selectedSeller && getStatusBadge(selectedSeller.status)}
                    <span className="text-[10px] text-slate-400">ID #{selectedSeller?.id}</span>
                  </div>
                </div>
                <select
                  aria-label="Switch Demo Seller"
                  value={selectedSeller?.id || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const seller = sellers.find((s) => s.id === id);
                    if (seller) onSellerSelect(seller);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id} className="text-slate-900 bg-white">
                      #{s.id}: {s.businessName} ({s.status}) - {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
