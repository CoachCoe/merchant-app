/**
 * Anonymous User Management for Web3 Marketplace
 * Privacy-preserving user system with blockchain-based identity
 */

export interface AnonymousUser {
  id: string; // UUID-based temporary identifier
  tempId: string; // Session-based temporary identifier
  walletAddress?: string; // Optional wallet connection for escrow
  reputation: number; // Blockchain-based reputation score (0-100)
  reputationHistory: ReputationEvent[];
  createdAt: Date;
  lastActive: Date;
  isVerified: boolean; // Verified through blockchain transactions
  totalTransactions: number;
  successfulTransactions: number;
  disputeCount: number;
  metadata: UserMetadata;
}

export interface ReputationEvent {
  id: string;
  userId: string;
  type: 'transaction_completed' | 'dispute_resolved' | 'review_received' | 'penalty_applied';
  value: number; // Reputation change (-100 to +100)
  description: string;
  transactionId?: string;
  createdAt: Date;
}

export interface UserMetadata {
  preferences: {
    currency: 'DOT' | 'KSM';
    language: string;
    timezone: string;
  };
  privacy: {
    showReputation: boolean;
    allowMessaging: boolean;
    shareAnalytics: boolean;
  };
  encryptedData?: string; // Encrypted user preferences and data
}

export interface PrivacySession {
  sessionHash: string; // Derived from wallet signature or session ID
  userId: string;
  encryptedData: string; // User preferences, favorites, etc.
  expiresAt: Date;
  createdAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
}

export interface CreateAnonymousUserRequest {
  walletAddress?: string;
  preferences?: Partial<UserMetadata['preferences']>;
  privacy?: Partial<UserMetadata['privacy']>;
}

export interface UpdateUserReputationRequest {
  userId: string;
  type: ReputationEvent['type'];
  value: number;
  description: string;
  transactionId?: string;
}

export interface UserListResponse {
  users: AnonymousUser[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  averageReputation: number;
  totalTransactions: number;
  disputeRate: number;
}
