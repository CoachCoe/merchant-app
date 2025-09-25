/**
 * Enhanced Product Model for Web3 Marketplace
 * Supports IPFS storage, anonymous sellers, and blockchain verification
 */

export interface MarketplaceProduct {
  id: string; // IPFS hash or content-addressed ID
  title: string;
  description: string;
  images: string[]; // IPFS hashes for product images
  price: {
    amount: string; // Price in smallest unit (e.g., planck for DOT)
    currency: 'DOT' | 'KSM';
    usdValue?: number; // Cached USD value for display
  };
  seller: {
    anonymousId: string;
    reputation: number;
    walletAddress?: string; // For escrow purposes
    displayName?: string; // Optional display name
  };
  category: string;
  subcategory?: string;
  tags: string[];
  availability: 'available' | 'sold' | 'reserved' | 'draft';
  condition: 'new' | 'used' | 'refurbished';
  shipping: {
    available: boolean;
    cost?: {
      amount: string;
      currency: 'DOT' | 'KSM';
    };
    estimatedDays?: number;
    regions?: string[]; // Shipping regions
  };
  digitalDelivery: {
    available: boolean;
    method: 'email' | 'download' | 'nft';
    instructions?: string;
  };
  blockchain: {
    verified: boolean;
    transactionHash?: string; // Hash of the listing transaction
    blockNumber?: number;
    chainId?: string;
  };
  metadata: {
    ipfsHash: string; // Full product metadata on IPFS
    version: number; // For metadata updates
    lastUpdated: Date;
  };
  stats: {
    views: number;
    favorites: number;
    purchases: number;
    reviews: number;
    averageRating: number;
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date; // For time-limited listings
}

export interface CreateMarketplaceProductRequest {
  title: string;
  description: string;
  images: string[]; // IPFS hashes
  price: {
    amount: string;
    currency: 'DOT' | 'KSM';
  };
  category: string;
  subcategory?: string;
  tags: string[];
  condition: 'new' | 'used' | 'refurbished';
  shipping?: {
    available: boolean;
    cost?: {
      amount: string;
      currency: 'DOT' | 'KSM';
    };
    estimatedDays?: number;
    regions?: string[];
  };
  digitalDelivery?: {
    available: boolean;
    method: 'email' | 'download' | 'nft';
    instructions?: string;
  };
  expiresAt?: Date;
}

export interface UpdateMarketplaceProductRequest {
  title?: string;
  description?: string;
  images?: string[];
  price?: {
    amount: string;
    currency: 'DOT' | 'KSM';
  };
  category?: string;
  subcategory?: string;
  tags?: string[];
  availability?: 'available' | 'sold' | 'reserved' | 'draft';
  condition?: 'new' | 'used' | 'refurbished';
  shipping?: {
    available: boolean;
    cost?: {
      amount: string;
      currency: 'DOT' | 'KSM';
    };
    estimatedDays?: number;
    regions?: string[];
  };
  digitalDelivery?: {
    available: boolean;
    method: 'email' | 'download' | 'nft';
    instructions?: string;
  };
  expiresAt?: Date;
}

export interface ProductListResponse {
  products: MarketplaceProduct[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  filters: {
    categories: string[];
    priceRange: {
      min: number;
      max: number;
    };
    conditions: string[];
    availability: string[];
  };
}

export interface ProductSearchRequest {
  query?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
  currency?: 'DOT' | 'KSM';
  condition?: string[];
  availability?: string[];
  sellerReputation?: number;
  sortBy?: 'price' | 'reputation' | 'newest' | 'popularity' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  totalCategories: number;
  averagePrice: {
    DOT: number;
    KSM: number;
  };
  topCategories: Array<{
    category: string;
    count: number;
  }>;
  recentListings: number;
}
