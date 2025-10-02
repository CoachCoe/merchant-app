export interface Product {
  id: string;
  onChainId?: string;
  title: string;
  description: string;
  priceHollar: number;
  categoryId: string;
  images: string[];

  sellerWalletAddress: string;
  storeId?: string;

  ipfsMetadataHash: string;
  blockchainVerified: boolean;
  registryTxHash?: string;
  blockNumber?: number;

  digitalDeliveryType?: 'download' | 'email' | 'ipfs';
  digitalDeliveryInstructions?: string;

  variants?: Array<{
    name: string;
    value: string;
    stock?: number;
  }>;
  tags?: string[];

  views: number;
  purchases: number;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  title: string;
  description: string;
  priceHollar: number;
  categoryId: string;
  images: string[];
  sellerWalletAddress: string;
  storeId?: string;
  ipfsMetadataHash?: string;
  digitalDeliveryType?: 'download' | 'email' | 'ipfs';
  digitalDeliveryInstructions?: string;
  variants?: Array<{
    name: string;
    value: string;
    stock?: number;
  }>;
  tags?: string[];
}

export interface UpdateProductRequest {
  title?: string;
  description?: string;
  priceHollar?: number;
  categoryId?: string;
  images?: string[];
  digitalDeliveryType?: 'download' | 'email' | 'ipfs';
  digitalDeliveryInstructions?: string;
  isActive?: boolean;
  tags?: string[];
  variants?: Array<{
    name: string;
    value: string;
    stock?: number;
  }>;
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
  categoryId?: string;
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
  sellerWalletAddress?: string;
  blockchainVerified?: boolean;
  sortBy?: 'price' | 'newest' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
