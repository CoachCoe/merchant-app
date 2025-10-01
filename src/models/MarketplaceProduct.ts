/**
 * Marketplace Product Model
 * Represents products in the Web3 marketplace
 */

export interface MarketplaceProduct {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: {
    amount: number;
    currency: string;
    usdValue: number;
  };
  seller: {
    id: string;
    reputation: number;
    totalSales: number;
  };
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  availability: 'available' | 'sold' | 'reserved';
  category: string;
  tags: string[];
  ipfsHash: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likeCount: number;
  isFeatured: boolean;
  isVerified: boolean;
}

export interface CreateMarketplaceProductRequest {
  title: string;
  description: string;
  images: string[];
  price: {
    amount: number;
    currency: string;
  };
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  category: string;
  tags: string[];
  digitalDeliveryInfo?: string;
}

export interface UpdateMarketplaceProductRequest {
  title?: string;
  description?: string;
  images?: string[];
  price?: {
    amount: number;
    currency: string;
  };
  condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  category?: string;
  tags?: string[];
  availability?: 'available' | 'sold' | 'reserved';
  digitalDeliveryInfo?: string;
}

export interface MarketplaceProductFilters {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  condition?: string[];
  availability?: string[];
  sellerId?: string;
  tags?: string[];
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'popularity' | 'reputation';
}

export interface MarketplaceProductStats {
  totalProducts: number;
  totalCategories: number;
  averagePrice: number;
  totalSellers: number;
  featuredProducts: number;
}
