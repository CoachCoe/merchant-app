import { Product } from './Product.js';

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number; // in cents (USD)
  totalPrice: number; // in cents (USD)
  createdAt: Date;
}

export interface Cart {
  id: string;
  sessionId: string;
  items: CartItem[];
  subtotal: number; // in cents (USD)
  tax: number; // in cents (USD)
  total: number; // in cents (USD)
  createdAt: Date;
  updatedAt: Date;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartResponse {
  cart: Cart;
  message?: string;
}
