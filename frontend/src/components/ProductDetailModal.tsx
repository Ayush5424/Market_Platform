import React, { useEffect, useState } from 'react';
import { ProductDetail } from '../types';
import { api } from '../services/api';
import {
  X,
  Building2,
  Tag,
  Star,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Loader2,
  Package,
} from 'lucide-react';

interface ProductDetailModalProps {
  productId: number;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ productId, onClose }) => {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .getProductDetail(productId)
      .then((data) => {
        if (isMounted) {
          setProduct(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load product details');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold">Seller Comparison & Availability</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
              <p className="text-sm font-medium">Loading seller quotes and inventory...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
              <XCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && product && (
            <div className="space-y-6">
              {/* Product Header Card */}
              <div className="flex flex-col sm:flex-row gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-full sm:w-32 h-32 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Package className="w-10 h-10 text-slate-300" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-slate-900 text-white">
                      {product.categoryName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                      Brand: {product.brand}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1.5">{product.name}</h3>
                  <p className="text-xs text-slate-600 mt-1">{product.description}</p>
                  <div className="mt-2.5 flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    Standard Order Unit: <strong className="text-slate-800">{product.unit}</strong>
                  </div>
                </div>
              </div>

              {/* Price & Eligibility Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      Lowest Available Price
                    </span>
                    <div className="text-2xl font-black text-emerald-950 mt-0.5">
                      {product.lowestPrice !== null ? (
                        <>
                          ${Number(product.lowestPrice).toFixed(2)}{' '}
                          <span className="text-xs font-normal text-emerald-700">/ {product.unit}</span>
                        </>
                      ) : (
                        <span className="text-sm font-semibold text-rose-600">No active sellers</span>
                      )}
                    </div>
                  </div>
                  {product.lowestPrice !== null && (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <Award className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Eligible Sellers Offering Stock
                    </span>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">
                      {product.eligibleSellersCount}{' '}
                      <span className="text-xs font-normal text-slate-500">of {product.offers.length} sellers</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-700 border border-slate-200">
                    <Building2 className="w-5 h-5 text-amber-500" />
                  </div>
                </div>
              </div>

              {/* Seller Offerings Comparison Table */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    All Seller Listings
                  </h4>
                  <span className="text-xs text-slate-500">
                    * Only approved sellers with stock ≥ MOQ appear in discovery
                  </span>
                </div>

                {product.offers.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-sm">
                    No sellers have listed this construction material yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-3.5">Seller & Business</th>
                          <th className="py-3 px-3.5">Unit Price</th>
                          <th className="py-3 px-3.5">Available Stock</th>
                          <th className="py-3 px-3.5">Min Order (MOQ)</th>
                          <th className="py-3 px-3.5">Buyer Discovery Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {product.offers.map((offer) => {
                          const isLowest =
                            product.lowestPrice !== null &&
                            offer.isAvailable &&
                            Number(offer.price) === Number(product.lowestPrice);

                          return (
                            <tr
                              key={offer.listingId}
                              className={`transition-colors ${
                                isLowest
                                  ? 'bg-amber-50/50 hover:bg-amber-50'
                                  : offer.isAvailable
                                  ? 'hover:bg-slate-50'
                                  : 'bg-slate-50/60 opacity-75'
                              }`}
                            >
                              <td className="py-3 px-3.5">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  {offer.businessName}
                                  {isLowest && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950">
                                      <Award className="w-3 h-3" /> Best Price
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span>{offer.sellerName}</span>
                                  <span className="flex items-center text-amber-600 font-semibold">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                                    {Number(offer.rating).toFixed(1)}
                                  </span>
                                </div>
                              </td>

                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <span className="text-base font-extrabold text-slate-900">
                                  ${Number(offer.price).toFixed(2)}
                                </span>
                                <span className="text-[11px] text-slate-500 ml-1">/ {product.unit}</span>
                              </td>

                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <span className={`font-semibold ${offer.stockQuantity < offer.minOrderQuantity ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                                  {offer.stockQuantity.toLocaleString()} {product.unit}
                                </span>
                              </td>

                              <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 font-medium">
                                {offer.minOrderQuantity} {product.unit}
                              </td>

                              <td className="py-3 px-3.5 whitespace-nowrap">
                                {offer.isAvailable ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Eligible & Ready
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-200 text-slate-700 border border-slate-300">
                                    <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                                    Excluded (Stock &lt; MOQ / Inactive)
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
