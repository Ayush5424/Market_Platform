import {
  Category,
  Seller,
  ProductSummary,
  ProductDetail,
  SellerListing,
  PagedResponse,
  CreateListingPayload,
  UpdateListingPayload,
  ApiError,
  AdminDashboardResponse,
  SellerStatus,
} from '../types';

const API_BASE_URL = '/api/v1';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorData: ApiError;
    try {
      errorData = await res.json();
    } catch {
      errorData = {
        timestamp: new Date().toISOString(),
        status: res.status,
        error: res.statusText,
        message: `HTTP error ${res.status}: ${res.statusText}`,
      };
    }
    throw errorData;
  }
  if (res.status === 204) {
    return {} as T;
  }
  return res.json();
}

export const api = {
  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE_URL}/categories`);
    return handleResponse<Category[]>(res);
  },

  // Sellers
  async getSellers(): Promise<Seller[]> {
    const res = await fetch(`${API_BASE_URL}/sellers`);
    return handleResponse<Seller[]>(res);
  },

  // Buyer Marketplace
  async getProducts(params: {
    categoryId?: number;
    query?: string;
    sortBy?: string;
    sortDirection?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<ProductSummary>> {
    const searchParams = new URLSearchParams();
    if (params.categoryId) searchParams.set('categoryId', params.categoryId.toString());
    if (params.query?.trim()) searchParams.set('query', params.query.trim());
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortDirection) searchParams.set('sortDirection', params.sortDirection);
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());

    const res = await fetch(`${API_BASE_URL}/products?${searchParams.toString()}`);
    return handleResponse<PagedResponse<ProductSummary>>(res);
  },

  async getProductDetail(id: number): Promise<ProductDetail> {
    const res = await fetch(`${API_BASE_URL}/products/${id}`);
    return handleResponse<ProductDetail>(res);
  },

  // Seller Operations (Authenticated via X-Seller-Id demo header)
  async getSellerListings(sellerId: number, page = 0, size = 10): Promise<PagedResponse<SellerListing>> {
    const res = await fetch(`${API_BASE_URL}/seller/listings?page=${page}&size=${size}`, {
      headers: {
        'X-Seller-Id': sellerId.toString(),
      },
    });
    return handleResponse<PagedResponse<SellerListing>>(res);
  },

  async createListing(sellerId: number, payload: CreateListingPayload): Promise<SellerListing> {
    const res = await fetch(`${API_BASE_URL}/seller/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Seller-Id': sellerId.toString(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<SellerListing>(res);
  },

  async updateListing(sellerId: number, listingId: number, payload: UpdateListingPayload): Promise<SellerListing> {
    const res = await fetch(`${API_BASE_URL}/seller/listings/${listingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Seller-Id': sellerId.toString(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<SellerListing>(res);
  },

  async toggleListingStatus(sellerId: number, listingId: number, active: boolean): Promise<SellerListing> {
    const res = await fetch(`${API_BASE_URL}/seller/listings/${listingId}/status?active=${active}`, {
      method: 'PATCH',
      headers: {
        'X-Seller-Id': sellerId.toString(),
      },
    });
    return handleResponse<SellerListing>(res);
  },

  async deleteListing(sellerId: number, listingId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/seller/listings/${listingId}`, {
      method: 'DELETE',
      headers: {
        'X-Seller-Id': sellerId.toString(),
      },
    });
    return handleResponse<void>(res);
  },

  // Admin Dashboard & Real-Time Sync
  async getAdminDashboard(): Promise<AdminDashboardResponse> {
    const res = await fetch(`${API_BASE_URL}/admin/dashboard`);
    return handleResponse<AdminDashboardResponse>(res);
  },

  async triggerAdminSync(): Promise<AdminDashboardResponse> {
    const res = await fetch(`${API_BASE_URL}/admin/dashboard/sync`, {
      method: 'POST',
    });
    return handleResponse<AdminDashboardResponse>(res);
  },

  async simulateAdminConcurrency(threads = 10): Promise<Record<string, any>> {
    const res = await fetch(`${API_BASE_URL}/admin/dashboard/simulate-concurrency?threads=${threads}`, {
      method: 'POST',
    });
    return handleResponse<Record<string, any>>(res);
  },

  async updateSellerStatus(sellerId: number, status: SellerStatus): Promise<Seller> {
    const res = await fetch(`${API_BASE_URL}/admin/sellers/${sellerId}/status?status=${status}`, {
      method: 'PUT',
    });
    return handleResponse<Seller>(res);
  },

  getDashboardStreamUrl(): string {
    return `${API_BASE_URL}/admin/dashboard/stream`;
  },
};
