export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in cents (USD)
  image: string; // Single image URL
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number; // in cents (USD)
  image: string;
  category: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number; // in cents (USD)
  image?: string;
  category?: string;
  isActive?: boolean;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
