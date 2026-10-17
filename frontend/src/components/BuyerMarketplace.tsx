import React, { useEffect, useState, useCallback } from 'react';
import { ProductSummary, Category } from '../types';
import { api } from '../services/api';
import { CategoryPills } from './CategoryPills';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import {
  Search,
  ArrowUpDown,
  Filter,
  PackageOpen,
  Loader2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface BuyerMarketplaceProps {
  categories: Category[];
}

export const BuyerMarketplace: React.FC<BuyerMarketplaceProps> = ({ categories }) => {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Selected product for modal view
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(null);

  // Debounce search query input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(0); // Reset to first page on search
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProducts({
        categoryId: selectedCategoryId ?? undefined,
        query: debouncedQuery,
        sortBy,
        sortDirection,
        page,
        size: 12,
      });
      setProducts(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Unable to connect to marketplace service.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId, debouncedQuery, sortBy, sortDirection, page]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleCategorySelect = (id: number | null) => {
    setSelectedCategoryId(id);
    setPage(0);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'name_asc') {
      setSortBy('name');
      setSortDirection('asc');
    } else if (val === 'name_desc') {
      setSortBy('name');
      setSortDirection('desc');
    } else if (val === 'price_asc') {
      setSortBy('price');
      setSortDirection('asc');
    } else if (val === 'price_desc') {
      setSortBy('price');
      setSortDirection('desc');
    } else if (val === 'brand_asc') {
      setSortBy('brand');
      setSortDirection('asc');
    }
    setPage(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Banner with Clean Industrial Typography */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
            <span>Direct Commercial Supplier Discovery</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Procure High-Grade Construction Materials
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300">
            Compare verified regional suppliers for cement, structural steel rebars, washed aggregates, kiln bricks, and architectural finishes at direct wholesale rates.
          </p>
        </div>
        {/* Subtle geometric graphic in background */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden md:block">
          <div className="w-full h-full bg-gradient-to-l from-amber-500 to-transparent" />
        </div>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by material name or brand (e.g. UltraTech, Rebar, Sand)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>Sort by:</span>
            </div>
            <select
              aria-label="Sort products"
              value={`${sortBy}_${sortDirection}`}
              onChange={handleSortChange}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            >
              <option value="name_asc">Name (A to Z)</option>
              <option value="name_desc">Name (Z to A)</option>
              <option value="price_asc">Lowest Price (Low to High)</option>
              <option value="price_desc">Lowest Price (High to Low)</option>
              <option value="brand_asc">Brand Name</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <CategoryPills
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={handleCategorySelect}
        />
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
        <div>
          Showing <strong className="text-slate-800">{totalElements}</strong> materials available in catalogue
          {selectedCategoryId && (
            <span>
              {' '}
              in <strong className="text-slate-800">{categories.find((c) => c.id === selectedCategoryId)?.name}</strong>
            </span>
          )}
          {debouncedQuery && (
            <span>
              {' '}
              matching &ldquo;<strong className="text-slate-800">{debouncedQuery}</strong>&rdquo;
            </span>
          )}
        </div>

        {(selectedCategoryId || debouncedQuery) && (
          <button
            type="button"
            onClick={() => {
              setSelectedCategoryId(null);
              setSearchQuery('');
            }}
            className="flex items-center gap-1 text-amber-600 hover:text-amber-700 font-semibold"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filters
          </button>
        )}
      </div>

      {/* Product Grid / Loading / Empty / Error States */}
      {loading && (
        <div className="py-24 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-3" />
          <p className="text-sm font-semibold text-slate-700">Querying Regional Construction Material Catalogue...</p>
          <span className="text-xs text-slate-400 mt-1">Filtering live supplier quotes and available stock</span>
        </div>
      )}

      {error && !loading && (
        <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center max-w-lg mx-auto">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-rose-900">Failed to Load Materials</h3>
          <p className="text-xs text-rose-700 mt-1">{error}</p>
          <button
            type="button"
            onClick={loadProducts}
            className="mt-4 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
          >
            Retry Query
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <PackageOpen className="w-14 h-14 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Matching Materials Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            We could not find any products matching your query. Try adjusting your search term or exploring another category.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategoryId(null);
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewOffers={(p) => setSelectedProduct(p)}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-6">
          <div className="text-xs text-slate-600 font-medium">
            Page <span className="font-bold text-slate-900">{page + 1}</span> of{' '}
            <span className="font-bold text-slate-900">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Previous Page
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Next Page
            </button>
          </div>
        </div>
      )}

      {/* Seller Offerings Modal */}
      {selectedProduct && (
        <ProductDetailModal
          productId={selectedProduct.id}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};
