import React, { useEffect, useState, useCallback } from 'react';
import { Seller, SellerListing, ProductSummary, Category, CreateListingPayload, UpdateListingPayload, ApiError } from '../types';
import { api } from '../services/api';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  RotateCw,
  PackagePlus,
  Layers,
  DollarSign,
  Boxes,
  Power,
  Info,
  ShieldCheck,
  Clock,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

interface SellerDashboardProps {
  currentSeller: Seller | null;
  sellers: Seller[];
  onSelectSeller: (seller: Seller) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  currentSeller,
  sellers,
  onSelectSeller,
}) => {
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeEditingListing, setActiveEditingListing] = useState<SellerListing | null>(null);

  // Modal Form states
  const [existingProducts, setExistingProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addMode, setAddMode] = useState<'existing' | 'new'>('existing');

  // Form fields for Add
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductBrand, setNewProductBrand] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('50kg Bag');
  const [newProductCategory, setNewProductCategory] = useState<number | ''>('');
  const [newProductImageUrl, setNewProductImageUrl] = useState('');

  // Shared listing fields
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formMoq, setFormMoq] = useState('1');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formVersion, setFormVersion] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const showToast = (type: 'success' | 'error' | 'warning', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const loadListings = useCallback(async () => {
    if (!currentSeller) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSellerListings(currentSeller.id, page, 10);
      setListings(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [currentSeller, page]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  // Load existing products & categories when opening Add Modal
  const openAddModal = async () => {
    setFieldErrors({});
    setSelectedProductId('');
    setFormPrice('');
    setFormStock('');
    setFormMoq('10');
    setFormIsActive(true);
    setNewProductName('');
    setNewProductBrand('');
    setNewProductDesc('');
    setNewProductUnit('50kg Bag');
    setNewProductCategory('');
    setNewProductImageUrl('');

    try {
      const [prodsRes, catsRes] = await Promise.all([
        api.getProducts({ size: 100 }),
        api.getCategories(),
      ]);
      setExistingProducts(prodsRes.content);
      setCategories(catsRes);
      if (catsRes.length > 0) setNewProductCategory(catsRes[0].id);
      setShowAddModal(true);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      showToast('error', apiErr.message || 'Failed to load catalogue');
    }
  };

  const openEditModal = (listing: SellerListing) => {
    setFieldErrors({});
    setActiveEditingListing(listing);
    setFormPrice(listing.price.toString());
    setFormStock(listing.stockQuantity.toString());
    setFormMoq(listing.minOrderQuantity.toString());
    setFormIsActive(listing.isActive);
    setFormVersion(listing.version);
    setShowEditModal(true);
  };

  const handleToggleStatus = async (listing: SellerListing) => {
    if (!currentSeller) return;
    try {
      const updated = await api.toggleListingStatus(currentSeller.id, listing.id, !listing.isActive);
      setListings((prev) => prev.map((l) => (l.id === listing.id ? updated : l)));
      showToast('success', `Listing for ${listing.productName} is now ${updated.isActive ? 'Active' : 'Deactivated'}.`);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      showToast('error', apiErr.message || 'Failed to update status');
    }
  };

  const handleDeleteListing = async (listingId: number) => {
    if (!currentSeller) return;
    if (!window.confirm('Are you sure you want to delete this listing from your catalogue?')) return;

    try {
      await api.deleteListing(currentSeller.id, listingId);
      setListings((prev) => prev.filter((l) => l.id !== listingId));
      showToast('success', 'Listing removed successfully.');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      showToast('error', apiErr.message || 'Failed to delete listing');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSeller) return;

    const errors: Record<string, string> = {};
    const priceNum = parseFloat(formPrice);
    const stockNum = parseInt(formStock, 10);
    const moqNum = parseInt(formMoq, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      errors.price = 'Price must be greater than 0';
    }
    if (isNaN(stockNum) || stockNum < 0) {
      errors.stock = 'Stock quantity cannot be negative';
    }
    if (isNaN(moqNum) || moqNum <= 0) {
      errors.moq = 'Minimum order quantity must be at least 1';
    }

    if (addMode === 'existing') {
      if (!selectedProductId) {
        errors.product = 'Please select a product from the catalogue';
      }
    } else {
      if (!newProductName.trim()) errors.name = 'Product name is required';
      if (!newProductBrand.trim()) errors.brand = 'Brand is required';
      if (!newProductUnit.trim()) errors.unit = 'Unit is required';
      if (!newProductCategory) errors.category = 'Category is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateListingPayload = {
        price: priceNum,
        stockQuantity: stockNum,
        minOrderQuantity: moqNum,
        isActive: formIsActive,
      };

      if (addMode === 'existing') {
        payload.productId = Number(selectedProductId);
      } else {
        payload.newProduct = {
          name: newProductName.trim(),
          brand: newProductBrand.trim(),
          description: newProductDesc.trim() || undefined,
          unit: newProductUnit.trim(),
          categoryId: Number(newProductCategory),
          imageUrl: newProductImageUrl.trim() || undefined,
        };
      }

      await api.createListing(currentSeller.id, payload);
      setShowAddModal(false);
      showToast('success', 'Listing added successfully to your catalogue!');
      loadListings();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.validationErrors) {
        setFieldErrors(apiErr.validationErrors);
      }
      showToast('error', apiErr.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSeller || !activeEditingListing) return;

    const errors: Record<string, string> = {};
    const priceNum = parseFloat(formPrice);
    const stockNum = parseInt(formStock, 10);
    const moqNum = parseInt(formMoq, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      errors.price = 'Price must be greater than 0';
    }
    if (isNaN(stockNum) || stockNum < 0) {
      errors.stock = 'Stock cannot be negative';
    }
    if (isNaN(moqNum) || moqNum <= 0) {
      errors.moq = 'MOQ must be at least 1';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload: UpdateListingPayload = {
        price: priceNum,
        stockQuantity: stockNum,
        minOrderQuantity: moqNum,
        isActive: formIsActive,
        version: formVersion ?? activeEditingListing.version,
      };

      const updated = await api.updateListing(currentSeller.id, activeEditingListing.id, payload);
      setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setShowEditModal(false);
      showToast('success', `Listing updated successfully! New version: v${updated.version}`);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.status === 409) {
        showToast('error', 'Optimistic Locking Conflict (409): Listing was modified concurrently by another user or session. Please refresh.');
      } else {
        showToast('error', apiErr.message || 'Failed to update listing');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentSeller) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600">Please select a demo seller from the dropdown above to access the seller dashboard.</p>
      </div>
    );
  }

  const isApproved = currentSeller.status === 'APPROVED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 max-w-md p-4 rounded-xl shadow-xl flex items-start gap-3 border animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : toastMessage.type === 'warning'
              ? 'bg-amber-900 text-white border-amber-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-300 flex-shrink-0 mt-0.5" />
          )}
          <div className="text-xs font-medium leading-relaxed">{toastMessage.text}</div>
        </div>
      )}

      {/* Seller Header & Demo Identity Notice */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Seller ID #{currentSeller.id}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  currentSeller.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : currentSeller.status === 'PENDING'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {currentSeller.status === 'APPROVED' && <ShieldCheck className="w-3.5 h-3.5" />}
                {currentSeller.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                {currentSeller.status === 'REJECTED' && <ShieldAlert className="w-3.5 h-3.5" />}
                {currentSeller.status} ACCOUNT
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">{currentSeller.businessName}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Primary Contact: <strong className="text-slate-700">{currentSeller.name}</strong> • Email: {currentSeller.email} • Rating: ★ {Number(currentSeller.rating).toFixed(2)}
            </p>
          </div>

          {/* Quick Demo Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Switch Identity:</span>
            <select
              aria-label="Switch Seller Identity"
              value={currentSeller.id}
              onChange={(e) => {
                const s = sellers.find((item) => item.id === Number(e.target.value));
                if (s) onSelectSeller(s);
              }}
              className="text-xs font-semibold bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  #{s.id}: {s.businessName} ({s.status})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={loadListings}
              title="Refresh Listings"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Status Alert Banner */}
        {!isApproved && (
          <div
            className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${
              currentSeller.status === 'PENDING'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
            <div className="text-xs">
              <strong className="font-bold block text-sm">
                Account Status: {currentSeller.status}
              </strong>
              {currentSeller.status === 'PENDING' ? (
                <span>
                  Your seller account is currently awaiting administrative onboarding review. As enforced by backend security rules,
                  creating or modifying material listings is strictly disabled until status is upgraded to APPROVED.
                </span>
              ) : (
                <span>
                  This seller account has been rejected due to compliance/quality checks. All marketplace listings are disabled, and further
                  changes are rejected with HTTP 403 Forbidden.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">My Listings</div>
            <div className="text-xl font-black text-slate-900">{totalElements}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Active Listings</div>
            <div className="text-xl font-black text-emerald-700">
              {listings.filter((l) => l.isActive).length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Power className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Deactivated</div>
            <div className="text-xl font-black text-slate-600">
              {listings.filter((l) => !l.isActive).length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Total Stocked Units</div>
            <div className="text-xl font-black text-slate-900">
              {listings.reduce((sum, l) => sum + l.stockQuantity, 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Listings Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Catalogue Offerings</h2>
            <p className="text-xs text-slate-500">Manage unit prices, live warehouse inventory, and minimum orders</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!isApproved}
              onClick={openAddModal}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                isApproved
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              Add Product Listing
            </button>
          </div>
        </div>

        {/* Content States */}
        {loading && (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
            <p className="text-sm font-medium">Loading your listings...</p>
          </div>
        )}

        {error && (
          <div className="p-6 text-center text-rose-600 text-sm">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            {error}
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="py-16 text-center px-4">
            <PackagePlus className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Listings Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              You haven't listed any construction materials yet. Add existing materials from the master catalogue or register a new one.
            </p>
            {isApproved && (
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                Add First Listing
              </button>
            )}
          </div>
        )}

        {!loading && !error && listings.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-100/75 text-slate-700 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product Name & Category</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Warehouse Stock</th>
                  <th className="py-3 px-4">MOQ</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Version (JPA)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {listings.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Product Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">{item.productBrand}</span>
                        <span>•</span>
                        <span>{item.categoryName}</span>
                        <span>•</span>
                        <span>Unit: {item.productUnit}</span>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-sm font-extrabold text-slate-900">
                        ${Number(item.price).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">per {item.productUnit}</span>
                    </td>

                    {/* Stock */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold ${
                            item.stockQuantity < item.minOrderQuantity
                              ? 'text-rose-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {item.stockQuantity.toLocaleString()}
                        </span>
                        {item.stockQuantity < item.minOrderQuantity && (
                          <span
                            title="Stock is below Minimum Order Quantity! Excluded from buyer discovery."
                            className="p-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold"
                          >
                            &lt; MOQ
                          </span>
                        )}
                      </div>
                    </td>

                    {/* MOQ */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {item.minOrderQuantity}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={!isApproved}
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                          item.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.isActive ? 'bg-emerald-600' : 'bg-slate-500'
                          }`}
                        />
                        {item.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Version (Optimistic Lock) */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono text-[11px] font-semibold border border-slate-200">
                        v{item.version}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={!isApproved}
                          onClick={() => openEditModal(item)}
                          className={`p-1.5 rounded-lg border text-slate-700 hover:bg-slate-100 transition-colors ${
                            isApproved ? 'border-slate-300 hover:border-slate-400' : 'opacity-40 cursor-not-allowed'
                          }`}
                          title="Edit Listing"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={!isApproved}
                          onClick={() => handleDeleteListing(item.id)}
                          className={`p-1.5 rounded-lg border text-rose-600 hover:bg-rose-50 transition-colors ${
                            isApproved ? 'border-rose-200 hover:border-rose-300' : 'opacity-40 cursor-not-allowed'
                          }`}
                          title="Delete Listing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing page <strong className="text-slate-900">{page + 1}</strong> of{' '}
              <strong className="text-slate-900">{totalPages}</strong> ({totalElements} listings)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded bg-white border border-slate-300 disabled:opacity-40 hover:bg-slate-100"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded bg-white border border-slate-300 disabled:opacity-40 hover:bg-slate-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE LISTING MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                Add Catalogue Listing
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {/* Mode switch: existing product or brand new */}
              <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddMode('existing')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                    addMode === 'existing'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  From Master Catalogue
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('new')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                    addMode === 'new'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create New Material
                </button>
              </div>

              {addMode === 'existing' ? (
                <div>
                  <label htmlFor="product-select" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Select Catalogue Product *
                  </label>
                  <select
                    id="product-select"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Choose a construction material --</option>
                    {existingProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.brand}) • {p.unit}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.product && (
                    <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.product}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-900 uppercase">New Material Specifications</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="new-product-name" className="block text-[11px] font-semibold text-slate-600">Material Name *</label>
                      <input
                        id="new-product-name"
                        type="text"
                        placeholder="e.g. Portland Cement 43 Grade"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                      />
                      {fieldErrors.name && <p className="text-[10px] text-rose-600">{fieldErrors.name}</p>}
                    </div>

                    <div>
                      <label htmlFor="new-product-brand" className="block text-[11px] font-semibold text-slate-600">Brand / Manufacturer *</label>
                      <input
                        id="new-product-brand"
                        type="text"
                        placeholder="e.g. UltraTech, Tata, Ambuja"
                        value={newProductBrand}
                        onChange={(e) => setNewProductBrand(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                      />
                      {fieldErrors.brand && <p className="text-[10px] text-rose-600">{fieldErrors.brand}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="new-product-category" className="block text-[11px] font-semibold text-slate-600">Category *</label>
                      <select
                        id="new-product-category"
                        value={newProductCategory}
                        onChange={(e) => setNewProductCategory(Number(e.target.value))}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="new-product-unit" className="block text-[11px] font-semibold text-slate-600">Unit of Measure *</label>
                      <input
                        id="new-product-unit"
                        type="text"
                        placeholder="e.g. 50kg Bag, Ton, Sq Meter"
                        value={newProductUnit}
                        onChange={(e) => setNewProductUnit(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                      />
                      {fieldErrors.unit && <p className="text-[10px] text-rose-600">{fieldErrors.unit}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="new-product-desc" className="block text-[11px] font-semibold text-slate-600">Technical Description</label>
                    <textarea
                      id="new-product-desc"
                      rows={2}
                      placeholder="Specifications, compressive strength, grade..."
                      value={newProductDesc}
                      onChange={(e) => setNewProductDesc(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Price, Stock, MOQ */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label htmlFor="create-form-price" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Price ($) *
                  </label>
                  <input
                    id="create-form-price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="25.50"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                  {fieldErrors.price && <p className="text-[10px] text-rose-600 mt-1">{fieldErrors.price}</p>}
                </div>

                <div>
                  <label htmlFor="create-form-stock" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    id="create-form-stock"
                    type="number"
                    min="0"
                    placeholder="500"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                  {fieldErrors.stock && <p className="text-[10px] text-rose-600 mt-1">{fieldErrors.stock}</p>}
                </div>

                <div>
                  <label htmlFor="create-form-moq" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Min Order (MOQ) *
                  </label>
                  <input
                    id="create-form-moq"
                    type="number"
                    min="1"
                    placeholder="10"
                    value={formMoq}
                    onChange={(e) => setFormMoq(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                  {fieldErrors.moq && <p className="text-[10px] text-rose-600 mt-1">{fieldErrors.moq}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-medium text-slate-700">
                  Publish listing immediately as Active (Discoverable by buyers)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LISTING MODAL WITH OPTIMISTIC LOCKING VERSION TEST */}
      {showEditModal && activeEditingListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                Edit Listing: {activeEditingListing.productName}
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="font-bold text-slate-900">{activeEditingListing.productName}</div>
                <div className="text-slate-500 mt-0.5">
                  Brand: {activeEditingListing.productBrand} • Category: {activeEditingListing.categoryName} • Unit: {activeEditingListing.productUnit}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="edit-form-price" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Price ($) *
                  </label>
                  <input
                    id="edit-form-price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                  {fieldErrors.price && <p className="text-[10px] text-rose-600 mt-1">{fieldErrors.price}</p>}
                </div>

                <div>
                  <label htmlFor="edit-form-stock" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    id="edit-form-stock"
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                  {fieldErrors.stock && <p className="text-[10px] text-rose-600 mt-1">{fieldErrors.stock}</p>}
                </div>

                <div>
                  <label htmlFor="edit-form-moq" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    MOQ *
                  </label>
                  <input
                    id="edit-form-moq"
                    type="number"
                    min="1"
                    value={formMoq}
                    onChange={(e) => setFormMoq(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                  {fieldErrors.moq && <p className="text-[10px] text-rose-600 mt-1">{fieldErrors.moq}</p>}
                </div>
              </div>

              {/* Optimistic Locking Concurrency Simulation Box */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-amber-600" />
                    Optimistic Locking Control (@Version)
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded">
                    Current DB Version: v{activeEditingListing.version}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  The backend enforces JPA `@Version` optimistic concurrency. If another user saves an update first, your submit will trigger a <strong>409 Conflict</strong>.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <label htmlFor="test-stale-version" className="text-[11px] font-semibold text-slate-700">Simulate Stale Version:</label>
                  <input
                    id="test-stale-version"
                    type="number"
                    value={formVersion ?? activeEditingListing.version}
                    onChange={(e) => setFormVersion(Number(e.target.value))}
                    className="w-20 text-xs font-mono font-bold p-1 border border-slate-300 rounded bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setFormVersion((formVersion ?? activeEditingListing.version) + 99)}
                    className="text-[10px] font-bold px-2 py-1 rounded bg-amber-200 text-amber-900 hover:bg-amber-300 transition-colors"
                  >
                    Simulate Conflict (+99)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormVersion(activeEditingListing.version)}
                    className="text-[10px] font-bold px-2 py-1 rounded bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <label htmlFor="editIsActive" className="text-xs font-medium text-slate-700">
                  Listing is Active (Available for buyer orders)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
