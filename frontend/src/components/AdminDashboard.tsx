import React, { useEffect, useState, useRef } from 'react';
import {
  AdminDashboardResponse,
  SellerStatus,
} from '../types';
import { api } from '../services/api';
import { formatINR } from '../utils/formatters';
import {
  Users,
  Package,
  Layers,
  RefreshCw,
  Activity,
  Clock,
  ShieldAlert,
  Search,
  TrendingUp,
  Radio,
  Loader2,
  Tag,
  Store,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | SellerStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [timeAgo, setTimeAgo] = useState('just now');
  const [flashLive, setFlashLive] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Load initial data
  const loadDashboardData = async (showSyncSpinner = false) => {
    if (showSyncSpinner) setSyncing(true);
    try {
      const res = await api.getAdminDashboard();
      setData(res);
      setLastSyncTime(new Date());
      triggerFlash();
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
      if (showSyncSpinner) setSyncing(false);
    }
  };

  const triggerFlash = () => {
    setFlashLive(true);
    setTimeout(() => setFlashLive(false), 1200);
  };

  // Real-time Server-Sent Events (SSE) connection
  useEffect(() => {
    loadDashboardData();

    const streamUrl = api.getDashboardStreamUrl();
    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setSseConnected(true);
    };

    eventSource.addEventListener('dashboard-init', (e: MessageEvent) => {
      try {
        const payload: AdminDashboardResponse = JSON.parse(e.data);
        setData(payload);
        setLastSyncTime(new Date());
        setSseConnected(true);
        triggerFlash();
      } catch (err) {
        console.error('Error parsing dashboard-init event:', err);
      }
    });

    eventSource.addEventListener('dashboard-sync', (e: MessageEvent) => {
      try {
        const payload: AdminDashboardResponse = JSON.parse(e.data);
        setData(payload);
        setLastSyncTime(new Date());
        setSseConnected(true);
        triggerFlash();
      } catch (err) {
        console.error('Error parsing dashboard-sync event:', err);
      }
    });

    eventSource.onerror = () => {
      setSseConnected(false);
    };

    // Polling fallback every 15s if SSE drops
    const fallbackInterval = setInterval(() => {
      if (!eventSourceRef.current || eventSourceRef.current.readyState !== EventSource.OPEN) {
        loadDashboardData();
      }
    }, 15000);

    return () => {
      clearInterval(fallbackInterval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Relative timestamp ticker
  useEffect(() => {
    const timer = setInterval(() => {
      const seconds = Math.floor((new Date().getTime() - lastSyncTime.getTime()) / 1000);
      if (seconds < 3) setTimeAgo('just now');
      else if (seconds < 60) setTimeAgo(`${seconds}s ago`);
      else setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
    }, 1000);
    return () => clearInterval(timer);
  }, [lastSyncTime]);

  // Handle manual sync trigger
  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await api.triggerAdminSync();
      setData(res);
      setLastSyncTime(new Date());
      triggerFlash();
    } catch (err) {
      console.error('Error triggering manual sync:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Handle quick seller status toggle (Approve / Reject / Pending)
  const handleStatusChange = async (sellerId: number, newStatus: SellerStatus) => {
    setStatusUpdatingId(sellerId);
    try {
      await api.updateSellerStatus(sellerId, newStatus);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to update seller status:', err);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Loading Admin Dashboard...</p>
      </div>
    );
  }

  if (!data) return null;

  const { overview, sellerMetrics, categoryMetrics, recentEvents } = data;

  // Filter out any technical or system test events from the business activity feed
  const businessEvents = recentEvents.filter(
    (evt) =>
      !['SYSTEM_INIT', 'CONCURRENCY_TEST', 'CONCURRENCY_TEST_COMPLETE', 'MANUAL_SYNC'].includes(
        evt.eventType
      )
  );

  // Filter sellers
  const filteredSellers = sellerMetrics.filter((s) => {
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesSearch =
      s.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: SellerStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live / Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            Suspended
          </span>
        );
    }
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'LISTING_CREATED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
            New Listing
          </span>
        );
      case 'LISTING_UPDATED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
            Price & Stock
          </span>
        );
      case 'STATUS_TOGGLED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
            Visibility
          </span>
        );
      case 'SELLER_STATUS_CHANGED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
            Supplier Status
          </span>
        );
      case 'LISTING_DELETED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
            Removed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
            Update
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Live Sync Status Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                Marketplace Administration
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs text-slate-300">Control Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Admin Operations Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Live monitoring of suppliers, product listings, category distributions, and marketplace inventory.
            </p>
          </div>

          {/* Sync Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live SSE Status Pill */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-300 ${
                sseConnected
                  ? flashLive
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/50'
                    : 'bg-emerald-950/50 border-emerald-800/80 text-emerald-400'
                  : 'bg-amber-950/50 border-amber-800 text-amber-400'
              }`}
            >
              <Radio
                className={`w-3.5 h-3.5 ${
                  sseConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
                }`}
              />
              <span>{sseConnected ? 'LIVE SYNCED' : 'POLLING FALLBACK'}</span>
              <span className="text-[10px] text-slate-400">({timeAgo})</span>
            </div>

            {/* Sync Now Button */}
            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition active:scale-95 disabled:opacity-50"
              title="Refresh dashboard metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-amber-400' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>

        {/* Clean Footer Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Last synchronized:{' '}
              <span className="text-white font-medium">
                {lastSyncTime.toLocaleTimeString()}
              </span>{' '}
              ({timeAgo})
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Real-time updates synced across all connected devices
          </div>
        </div>
      </div>

      {/* KPI Cards: The 3 Core Requirements + Valuation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Live Sellers */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Suppliers</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{overview.liveSellersCount}</span>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Active Live
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Out of <span className="font-semibold text-slate-700">{overview.totalSellersCount}</span> registered suppliers
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-amber-700 font-medium">
              <Clock className="w-3 h-3 text-amber-500" />
              {overview.pendingSellersCount} Pending
            </span>
            <span className="flex items-center gap-1 text-rose-700 font-medium">
              <ShieldAlert className="w-3 h-3 text-rose-500" />
              {overview.rejectedSellersCount} Suspended
            </span>
          </div>
        </div>

        {/* KPI 2: Products Listed */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Products Listed</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{overview.activeListingsCount}</span>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Active Listings
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Across <span className="font-semibold text-slate-700">{overview.totalProductsCount}</span> master materials
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Listings: {overview.totalListingsCount}</span>
            <span className="text-slate-600 font-medium">
              {(overview.totalListingsCount > 0
                ? (overview.activeListingsCount / overview.totalListingsCount) * 100
                : 0
              ).toFixed(0)}
              % Active
            </span>
          </div>
        </div>

        {/* KPI 3: Categories Count */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Heavy Categories</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{overview.totalCategoriesCount}</span>
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                100% Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Cement, Steel, Aggregates, Bricks, etc.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Master Catalogue</span>
            <span className="text-slate-700 font-medium">{overview.totalProductsCount} Material Specs</span>
          </div>
        </div>

        {/* KPI 4: Active Inventory Valuation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Market Inventory Value</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 truncate">
                {formatINR(overview.totalInventoryValueInr)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Estimated active catalogue worth
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Available Stock:</span>
            <span className="text-slate-900 font-semibold">{overview.totalStockUnits.toLocaleString()} units</span>
          </div>
        </div>
      </div>

      {/* Main Content: Category Distributions & Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Matrix (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  Categories & Materials Distribution
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Breakdown of active listings, distinct products, and lowest quote per category.
                </p>
              </div>
              <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {categoryMetrics.length} Categories
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryMetrics.map((cat) => (
                <div
                  key={cat.categoryId}
                  className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{cat.description}</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      ID #{cat.categoryId}
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Listings</span>
                      <span className="font-bold text-slate-800">
                        {cat.activeListingsCount} <span className="text-slate-400 font-normal">/ {cat.totalListingsCount}</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">Materials</span>
                      <span className="font-bold text-slate-800">{cat.productsCount} items</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Lowest Available</span>
                      <span className="font-bold text-emerald-600">
                        {cat.lowestPrice ? formatINR(cat.lowestPrice) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Business Activity Feed (1 col on large screen) */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                Recent Marketplace Activity
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Real-time supplier listings, stock adjustments, and account verification updates.
            </p>

            <div className="space-y-2.5 overflow-y-auto max-h-[340px] pr-1">
              {businessEvents.length === 0 ? (
                <div className="text-center py-10 px-4 text-xs text-slate-400 space-y-1">
                  <Store className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="font-medium text-slate-600">No recent updates yet</p>
                  <p className="text-[11px] text-slate-400">
                    When suppliers add materials or modify inventory, updates will stream here in real time.
                  </p>
                </div>
              ) : (
                businessEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50/80 text-xs hover:border-slate-300 transition"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      {getEventBadge(evt.eventType)}
                      <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-800 text-xs leading-relaxed font-medium mt-1">
                      {evt.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Sellers & Products Listed Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              Supplier Accounts & Listings Monitor
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status, number of products listed, active inventory, and administrative approval actions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none w-48 sm:w-60"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    statusFilter === filter
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter === 'ALL'
                    ? `All (${overview.totalSellersCount})`
                    : filter === 'APPROVED'
                    ? `Live (${overview.liveSellersCount})`
                    : filter === 'PENDING'
                    ? `Pending (${overview.pendingSellersCount})`
                    : `Suspended (${overview.rejectedSellersCount})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sellers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Supplier Business</th>
                <th className="py-3.5 px-4">Live Status</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4 text-center">Products Listed</th>
                <th className="py-3.5 px-4 text-center">Active Live</th>
                <th className="py-3.5 px-4 text-right">Available Stock</th>
                <th className="py-3.5 px-4 text-right">Stock Valuation</th>
                <th className="py-3.5 px-4 text-center">Admin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSellers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No suppliers found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredSellers.map((seller) => (
                  <tr key={seller.sellerId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{seller.businessName}</div>
                      <div className="text-[11px] text-slate-500">
                        {seller.name} • {seller.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(seller.status)}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-800">★ {Number(seller.rating).toFixed(2)}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{seller.totalListings}</span>
                      <span className="text-[11px] text-slate-400 block">listings</span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded font-bold ${
                          seller.activeListings > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {seller.activeListings} live
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-medium text-slate-800">
                      {seller.totalStockUnits.toLocaleString()} units
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-slate-900">
                      {formatINR(seller.inventoryValueInr)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {seller.status !== 'APPROVED' && (
                          <button
                            type="button"
                            disabled={statusUpdatingId === seller.sellerId}
                            onClick={() => handleStatusChange(seller.sellerId, 'APPROVED')}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition active:scale-95 disabled:opacity-50"
                            title="Approve seller to make them live on the marketplace"
                          >
                            {statusUpdatingId === seller.sellerId ? '...' : 'Approve'}
                          </button>
                        )}
                        {seller.status !== 'REJECTED' && (
                          <button
                            type="button"
                            disabled={statusUpdatingId === seller.sellerId}
                            onClick={() => handleStatusChange(seller.sellerId, 'REJECTED')}
                            className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-semibold transition active:scale-95 disabled:opacity-50"
                            title="Suspend or reject seller"
                          >
                            {statusUpdatingId === seller.sellerId ? '...' : 'Suspend'}
                          </button>
                        )}
                        {seller.status !== 'PENDING' && (
                          <button
                            type="button"
                            disabled={statusUpdatingId === seller.sellerId}
                            onClick={() => handleStatusChange(seller.sellerId, 'PENDING')}
                            className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-semibold transition active:scale-95 disabled:opacity-50"
                            title="Set to Pending review"
                          >
                            {statusUpdatingId === seller.sellerId ? '...' : 'Review'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
