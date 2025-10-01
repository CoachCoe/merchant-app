export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  categoryId: number;
  images: string[];

  sellerId?: string;
  sellerReputation?: number;
  sellerWalletAddress?: string;

  ipfsMetadataHash?: string;
  blockchainVerified?: boolean;
  transactionHash?: string;
  blockNumber?: number;
  chainId?: number;

  digitalDeliveryUrl?: string;
  digitalDeliveryMethod?: 'email' | 'download' | 'nft';
  digitalDeliveryInstructions?: string;

  tags?: string[];
  condition?: 'new' | 'used' | 'refurbished';
  availability?: 'available' | 'sold' | 'reserved' | 'draft';

  stats?: {
    views: number;
    favorites: number;
    purchases: number;
    reviews: number;
    averageRating: number;
  };

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface CreateProductRequest {
  title: string;
  description: string;
  price: number;
  categoryId: number;
  images: string[];
  sellerId?: string;
  ipfsMetadataHash?: string;
  digitalDeliveryUrl?: string;
  digitalDeliveryMethod?: 'email' | 'download' | 'nft';
  tags?: string[];
  condition?: 'new' | 'used' | 'refurbished';
  expiresAt?: string;
}

export interface UpdateProductRequest {
  title?: string;
  description?: string;
  price?: number;
  categoryId?: number;
  images?: string[];
  availability?: 'available' | 'sold' | 'reserved' | 'draft';
  condition?: 'new' | 'used' | 'refurbished';
  digitalDeliveryUrl?: string;
  isActive?: boolean;
  tags?: string[];
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ProductSearchRequest {
  query?: string;
  categoryId?: number;
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
  condition?: string[];
  availability?: string[];
  sellerReputation?: number;
  sortBy?: 'price' | 'reputation' | 'newest' | 'popularity' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
