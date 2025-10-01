/**
 * Marketplace Transaction Model
 * Represents transactions in the Web3 marketplace
 */

export interface MarketplaceTransaction {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  amount: {
    value: number;
    currency: string;
    usdValue: number;
  };
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'disputed' | 'cancelled' | 'refunded';
  escrowAddress: string;
  transactionHash?: string;
  trackingNumber?: string;
  deliveryProof?: string;
  digitalDeliveryInfo?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  disputeReason?: string;
  refundAmount?: number;
  refundReason?: string;
  buyerRating?: number;
  sellerRating?: number;
  buyerReview?: string;
  sellerReview?: string;
}

export interface CreateTransactionRequest {
  productId: string;
  buyerId: string;
  sellerId: string;
  amount: {
    value: number;
    currency: string;
  };
  digitalDeliveryInfo?: string;
}

export interface UpdateTransactionRequest {
  status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'disputed' | 'cancelled' | 'refunded';
  transactionHash?: string;
  trackingNumber?: string;
  deliveryProof?: string;
  disputeReason?: string;
  refundAmount?: number;
  refundReason?: string;
  buyerRating?: number;
  sellerRating?: number;
  buyerReview?: string;
  sellerReview?: string;
}

export interface TransactionFilters {
  buyerId?: string;
  sellerId?: string;
  status?: string[];
  currency?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: 'newest' | 'oldest' | 'amount_high' | 'amount_low';
}

export interface TransactionStats {
  totalTransactions: number;
  totalVolume: number;
  averageValue: number;
  successRate: number;
  disputeRate: number;
  refundRate: number;
}
