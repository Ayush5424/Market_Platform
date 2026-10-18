export type SellerStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface Category {
  id: number;
  name: string;
  description: string;
  icon?: string;
}

export interface Seller {
  id: number;
  name: string;
  businessName: string;
  email: string;
  phone?: string;
  status: SellerStatus;
  rating: number;
}

export interface ProductSummary {
  id: number;
  name: string;
  brand: string;
  description: string;
  unit: string;
  categoryId: number;
  categoryName: string;
  imageUrl?: string;
  lowestPrice: number | null;
  eligibleSellersCount: number;
}

export interface SellerOffer {
  listingId: number;
  sellerId: number;
  sellerName: string;
  businessName: string;
  rating: number;
  price: number;
  stockQuantity: number;
  minOrderQuantity: number;
  isAvailable: boolean;
}

export interface ProductDetail {
  id: number;
  name: string;
  brand: string;
  description: string;
  unit: string;
  categoryId: number;
  categoryName: string;
  imageUrl?: string;
  lowestPrice: number | null;
  eligibleSellersCount: number;
  offers: SellerOffer[];
}

export interface SellerListing {
  id: number;
  sellerId: number;
  sellerBusinessName: string;
  productId: number;
  productName: string;
  productBrand: string;
  productUnit: string;
  productImageUrl?: string;
  categoryId: number;
  categoryName: string;
  price: number;
  stockQuantity: number;
  minOrderQuantity: number;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CreateProductPayload {
  name: string;
  brand: string;
  description?: string;
  unit: string;
  categoryId: number;
  imageUrl?: string;
}

export interface CreateListingPayload {
  productId?: number;
  newProduct?: CreateProductPayload;
  price: number;
  stockQuantity: number;
  minOrderQuantity: number;
  isActive?: boolean;
}

export interface UpdateListingPayload {
  price: number;
  stockQuantity: number;
  minOrderQuantity: number;
  isActive?: boolean;
  version: number;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  validationErrors?: Record<string, string>;
  path?: string;
}

export interface AdminDashboardOverview {
  liveSellersCount: number;
  totalSellersCount: number;
  pendingSellersCount: number;
  rejectedSellersCount: number;
  totalCategoriesCount: number;
  totalProductsCount: number;
  activeListingsCount: number;
  totalListingsCount: number;
  totalStockUnits: number;
  totalInventoryValueInr: number;
}

export interface AdminSellerMetric {
  sellerId: number;
  name: string;
  businessName: string;
  email: string;
  status: SellerStatus;
  rating: number;
  totalListings: number;
  activeListings: number;
  outOfStockListings: number;
  totalStockUnits: number;
  inventoryValueInr: number;
}

export interface AdminCategoryMetric {
  categoryId: number;
  name: string;
  description: string;
  icon?: string;
  productsCount: number;
  activeListingsCount: number;
  totalListingsCount: number;
  lowestPrice: number | null;
}

export interface MarketplaceEvent {
  id: string;
  eventType: string;
  description: string;
  timestamp: string;
}

export interface AdminConcurrencyStats {
  aggregationDurationMs: number;
  poolSize: number;
  activeThreads: number;
  completedTaskCount: number;
  threadPoolName: string;
  concurrentTasksExecuted: string[];
  timestamp: string;
}

export interface AdminDashboardResponse {
  overview: AdminDashboardOverview;
  sellerMetrics: AdminSellerMetric[];
  categoryMetrics: AdminCategoryMetric[];
  recentEvents: MarketplaceEvent[];
  concurrencyStats: AdminConcurrencyStats;
}

