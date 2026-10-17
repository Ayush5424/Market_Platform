import React from 'react';
import { ProductSummary } from '../types';
import { Building2, Package, Tag, Users, AlertCircle } from 'lucide-react';
import { formatINR } from '../utils/formatters';

interface ProductCardProps {
  product: ProductSummary;
  onViewOffers: (product: ProductSummary) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewOffers }) => {
  const hasEligibleSellers = product.eligibleSellersCount > 0 && product.lowestPrice !== null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col overflow-hidden group">
      {/* Product Image Thumbnail */}
      <div className="relative h-44 w-full bg-slate-100 overflow-hidden flex items-center justify-center">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <Package className="w-12 h-12 text-slate-300" />
        )}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-900/80 backdrop-blur-sm text-white">
            {product.categoryName}
          </span>
        </div>
        <div className="absolute top-2.5 right-2.5">
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white/90 backdrop-blur-sm text-slate-700 shadow-sm border border-slate-200">
            {product.brand}
          </span>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2">
            {product.description || 'Verified grade building specification materials.'}
          </p>
          <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
              <Tag className="w-3 h-3 text-slate-400" />
              Unit: {product.unit}
            </span>
          </div>
        </div>

        {/* Pricing & Seller Stats */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                {hasEligibleSellers ? 'Lowest Price' : 'Availability'}
              </div>
              {hasEligibleSellers ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-extrabold text-slate-900">
                    {formatINR(product.lowestPrice)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ {product.unit}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs font-semibold text-rose-600 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  No eligible suppliers available
                </div>
              )}
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  hasEligibleSellers
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                <Users className="w-3 h-3" />
                {product.eligibleSellersCount} {product.eligibleSellersCount === 1 ? 'supplier' : 'suppliers'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onViewOffers(product)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-sm"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            Compare Suppliers
          </button>
        </div>
      </div>
    </div>
  );
};
