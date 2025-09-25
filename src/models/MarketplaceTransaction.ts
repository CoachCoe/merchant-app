/**
 * Enhanced Transaction Model for Web3 Marketplace
 * Supports escrow, multi-signature wallets, and dispute resolution
 */

export interface MarketplaceTransaction {
  id: string;
  productId: string;
  buyer: {
    anonymousId: string;
    walletAddress: string;
    reputation: number;
  };
  seller: {
    anonymousId: string;
    walletAddress: string;
    reputation: number;
  };
  escrow: {
    address: string; // Multi-signature escrow address
    amount: string; // Total amount in smallest unit
    currency: 'DOT' | 'KSM';
    usdValue: number; // USD value at time of transaction
    releaseConditions: EscrowCondition[];
  };
  product: {
    title: string;
    price: string;
    currency: 'DOT' | 'KSM';
    images: string[];
  };
  status: 'pending' | 'escrowed' | 'shipped' | 'delivered' | 'completed' | 'disputed' | 'refunded' | 'cancelled';
  timeline: TransactionEvent[];
  payment: {
    transactionHash: string;
    blockNumber: number;
    chainId: string;
    gasUsed: string;
    gasPrice: string;
    timestamp: Date;
  };
  delivery: {
    method: 'physical' | 'digital';
    trackingNumber?: string;
    estimatedDelivery?: Date;
    actualDelivery?: Date;
    deliveryProof?: string; // IPFS hash of delivery confirmation
  };
  dispute?: DisputeInfo;
  refund?: RefundInfo;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface EscrowCondition {
  type: 'time_based' | 'delivery_confirmation' | 'manual_release' | 'dispute_resolution';
  value: string | number; // Time in hours, or specific condition
  description: string;
  met: boolean;
  metAt?: Date;
}

export interface TransactionEvent {
  id: string;
  type: 'created' | 'payment_sent' | 'escrowed' | 'shipped' | 'delivered' | 'disputed' | 'resolved' | 'refunded' | 'completed';
  description: string;
  timestamp: Date;
  actor: 'buyer' | 'seller' | 'system' | 'arbitrator';
  metadata?: Record<string, any>;
}

export interface DisputeInfo {
  id: string;
  reason: 'item_not_received' | 'item_not_as_described' | 'seller_not_responding' | 'other';
  description: string;
  evidence: DisputeEvidence[];
  arbitrator?: {
    address: string;
    reputation: number;
  };
  resolution?: {
    decision: 'buyer_wins' | 'seller_wins' | 'partial_refund';
    amount: string;
    reasoning: string;
    timestamp: Date;
  };
  status: 'open' | 'under_review' | 'resolved' | 'escalated';
  createdAt: Date;
  resolvedAt?: Date;
}

export interface DisputeEvidence {
  id: string;
  type: 'image' | 'document' | 'message' | 'transaction';
  data: string; // IPFS hash or transaction hash
  description: string;
  submittedBy: 'buyer' | 'seller';
  timestamp: Date;
}

export interface RefundInfo {
  amount: string;
  currency: 'DOT' | 'KSM';
  reason: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: Date;
  processedBy: 'seller' | 'arbitrator' | 'system';
}

export interface CreateTransactionRequest {
  productId: string;
  buyerWalletAddress: string;
  quantity?: number;
  deliveryMethod: 'physical' | 'digital';
  deliveryAddress?: string; // For physical items
  digitalDeliveryInfo?: string; // For digital items
}

export interface UpdateTransactionStatusRequest {
  status: MarketplaceTransaction['status'];
  eventType: TransactionEvent['type'];
  description: string;
  metadata?: Record<string, any>;
  deliveryProof?: string;
  trackingNumber?: string;
}

export interface TransactionListResponse {
  transactions: MarketplaceTransaction[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  stats: {
    totalValue: number;
    averageValue: number;
    completionRate: number;
    disputeRate: number;
  };
}

export interface EscrowConfig {
  releaseTimeHours: number; // Default time for automatic release
  disputeWindowHours: number; // Time window for disputes
  arbitratorRequired: boolean;
  multiSigThreshold: number; // Number of signatures required
  fees: {
    platform: number; // Platform fee percentage
    arbitrator: number; // Arbitrator fee percentage
  };
}

export interface TransactionStats {
  totalTransactions: number;
  totalValue: {
    DOT: string;
    KSM: string;
    USD: number;
  };
  averageTransactionValue: number;
  completionRate: number;
  disputeRate: number;
  averageCompletionTime: number; // in hours
  topSellers: Array<{
    anonymousId: string;
    reputation: number;
    transactionCount: number;
    totalValue: number;
  }>;
  recentActivity: TransactionEvent[];
}
