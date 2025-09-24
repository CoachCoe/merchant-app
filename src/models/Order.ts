import { Cart } from './Cart.js';

export interface Order {
  id: string;
  orderNumber: string;
  cart: Cart;
  customer?: {
    email?: string;
    name?: string;
  };
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed';
  transactionHash?: string;
  blockNumber?: number;
  chainId?: string;
  tokenUsed?: 'DOT' | 'KSM' | 'USDC'; // Simplified token support
  createdAt: Date;
  completedAt?: Date;
}

export interface CreateOrderRequest {
  cartId?: string; // Optional, can be derived from session
  customer?: {
    email?: string;
    name?: string;
  };
}

export interface OrderResponse {
  order: Order;
  message?: string;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
