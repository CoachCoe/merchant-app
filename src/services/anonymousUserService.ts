/**
 * Anonymous User Service for Web3 Marketplace
 * Manages privacy-preserving user sessions and blockchain-based reputation
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { MarketplaceDatabaseService } from './marketplaceDatabaseService.js';
import { 
  AnonymousUser, 
  CreateAnonymousUserRequest, 
  UpdateUserReputationRequest,
  UserListResponse,
  UserStats,
  ReputationEvent,
  PrivacySession
} from '../models/AnonymousUser.js';

export class AnonymousUserService {
  private db = MarketplaceDatabaseService.getInstance().getDatabase();

  /**
   * Create a new anonymous user
   */
  async createUser(request: CreateAnonymousUserRequest): Promise<AnonymousUser> {
    const userId = uuidv4();
    const tempId = this.generateTempId();
    
    const user: AnonymousUser = {
      id: userId,
      tempId,
      walletAddress: request.walletAddress,
      reputation: 50.0, // Starting reputation
      reputationHistory: [],
      createdAt: new Date(),
      lastActive: new Date(),
      isVerified: false,
      totalTransactions: 0,
      successfulTransactions: 0,
      disputeCount: 0,
      metadata: {
        preferences: {
          currency: request.preferences?.currency || 'DOT',
          language: request.preferences?.language || 'en',
          timezone: request.preferences?.timezone || 'UTC'
        },
        privacy: {
          showReputation: request.privacy?.showReputation ?? true,
          allowMessaging: request.privacy?.allowMessaging ?? true,
          shareAnalytics: request.privacy?.shareAnalytics ?? false
        }
      }
    };

    const query = `
      INSERT INTO anonymous_users (
        id, temp_id, wallet_address, reputation, is_verified,
        total_transactions, successful_transactions, dispute_count,
        preferences, privacy_settings, created_at, last_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this.db.prepare(query).run(
      user.id,
      user.tempId,
      user.walletAddress || null,
      user.reputation,
      user.isVerified ? 1 : 0,
      user.totalTransactions,
      user.successfulTransactions,
      user.disputeCount,
      JSON.stringify(user.metadata.preferences),
      JSON.stringify(user.metadata.privacy),
      user.createdAt.toISOString(),
      user.lastActive.toISOString()
    );

    logger.info('Anonymous user created', { userId, tempId, walletAddress: user.walletAddress });
    return user;
  }

  /**
   * Get user by temporary ID
   */
  async getUserByTempId(tempId: string): Promise<AnonymousUser | null> {
    const query = `
      SELECT * FROM anonymous_users WHERE temp_id = ?
    `;
    
    const row = this.db.prepare(query).get(tempId) as any;
    if (!row) return null;

    return this.mapRowToUser(row);
  }

  /**
   * Get user by wallet address
   */
  async getUserByWalletAddress(walletAddress: string): Promise<AnonymousUser | null> {
    const query = `
      SELECT * FROM anonymous_users WHERE wallet_address = ?
    `;
    
    const row = this.db.prepare(query).get(walletAddress) as any;
    if (!row) return null;

    return this.mapRowToUser(row);
  }

  /**
   * Update user activity
   */
  async updateUserActivity(userId: string): Promise<void> {
    const query = `
      UPDATE anonymous_users 
      SET last_active = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    this.db.prepare(query).run(userId);
  }

  /**
   * Update user reputation
   */
  async updateUserReputation(request: UpdateUserReputationRequest): Promise<AnonymousUser | null> {
    const { userId, type, value, description, transactionId } = request;

    // Add reputation event
    const eventId = uuidv4();
    const eventQuery = `
      INSERT INTO reputation_events (id, user_id, type, value, description, transaction_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    this.db.prepare(eventQuery).run(
      eventId,
      userId,
      type,
      value,
      description,
      transactionId || null
    );

    // Update user reputation
    const updateQuery = `
      UPDATE anonymous_users 
      SET reputation = MAX(0, MIN(100, reputation + ?))
      WHERE id = ?
    `;
    
    this.db.prepare(updateQuery).run(value, userId);

    // Update transaction counts based on event type
    if (type === 'transaction_completed') {
      const transactionQuery = `
        UPDATE anonymous_users 
        SET total_transactions = total_transactions + 1,
            successful_transactions = successful_transactions + 1
        WHERE id = ?
      `;
      this.db.prepare(transactionQuery).run(userId);
    } else if (type === 'dispute_resolved' && value < 0) {
      const disputeQuery = `
        UPDATE anonymous_users 
        SET dispute_count = dispute_count + 1
        WHERE id = ?
      `;
      this.db.prepare(disputeQuery).run(userId);
    }

    const updatedUser = await this.getUserById(userId);
    
    if (updatedUser) {
      logger.info('User reputation updated', { 
        userId, 
        type, 
        value, 
        newReputation: updatedUser.reputation 
      });
    }

    return updatedUser;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<AnonymousUser | null> {
    const query = `
      SELECT * FROM anonymous_users WHERE id = ?
    `;
    
    const row = this.db.prepare(query).get(userId) as any;
    if (!row) return null;

    return this.mapRowToUser(row);
  }

  /**
   * Get user reputation history
   */
  async getUserReputationHistory(userId: string): Promise<ReputationEvent[]> {
    const query = `
      SELECT * FROM reputation_events 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;
    
    const rows = this.db.prepare(query).all(userId) as any[];
    
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      value: row.value,
      description: row.description,
      transactionId: row.transaction_id,
      createdAt: new Date(row.created_at)
    }));
  }

  /**
   * Create privacy session
   */
  async createPrivacySession(
    userId: string, 
    sessionHash: string, 
    encryptedData: string,
    expiresAt: Date,
    ipAddress: string,
    userAgent: string
  ): Promise<PrivacySession> {
    const sessionId = uuidv4();
    
    const session: PrivacySession = {
      sessionHash,
      userId,
      encryptedData,
      expiresAt,
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress,
      userAgent
    };

    const query = `
      INSERT INTO privacy_sessions (
        id, session_hash, user_id, encrypted_data, expires_at, 
        created_at, last_activity, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this.db.prepare(query).run(
      sessionId,
      session.sessionHash,
      session.userId,
      session.encryptedData,
      session.expiresAt.toISOString(),
      session.createdAt.toISOString(),
      session.lastActivity.toISOString(),
      session.ipAddress,
      session.userAgent
    );

    logger.info('Privacy session created', { sessionId, userId, sessionHash });
    return session;
  }

  /**
   * Get privacy session by hash
   */
  async getPrivacySession(sessionHash: string): Promise<PrivacySession | null> {
    const query = `
      SELECT * FROM privacy_sessions 
      WHERE session_hash = ? AND expires_at > CURRENT_TIMESTAMP
    `;
    
    const row = this.db.prepare(query).get(sessionHash) as any;
    if (!row) return null;

    return {
      sessionHash: row.session_hash,
      userId: row.user_id,
      encryptedData: row.encrypted_data,
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at),
      lastActivity: new Date(row.last_activity),
      ipAddress: row.ip_address,
      userAgent: row.user_agent
    };
  }

  /**
   * Update privacy session activity
   */
  async updatePrivacySessionActivity(sessionHash: string): Promise<void> {
    const query = `
      UPDATE privacy_sessions 
      SET last_activity = CURRENT_TIMESTAMP 
      WHERE session_hash = ?
    `;
    
    this.db.prepare(query).run(sessionHash);
  }

  /**
   * Get users with pagination
   */
  async getUsers(options: {
    page?: number;
    limit?: number;
    minReputation?: number;
    verifiedOnly?: boolean;
  } = {}): Promise<UserListResponse> {
    const { page = 1, limit = 20, minReputation, verifiedOnly } = options;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params: any[] = [];

    if (minReputation !== undefined) {
      whereClause += ' AND reputation >= ?';
      params.push(minReputation);
    }

    if (verifiedOnly) {
      whereClause += ' AND is_verified = 1';
    }

    const countQuery = `SELECT COUNT(*) as total FROM anonymous_users WHERE ${whereClause}`;
    const countResult = this.db.prepare(countQuery).get(...params) as { total: number };

    const query = `
      SELECT * FROM anonymous_users 
      WHERE ${whereClause}
      ORDER BY reputation DESC, created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = this.db.prepare(query).all(...params, limit, offset) as any[];
    const users = rows.map(row => this.mapRowToUser(row));

    return {
      users,
      total: countResult.total,
      page,
      limit,
      hasMore: offset + users.length < countResult.total
    };
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as totalUsers,
        COUNT(CASE WHEN last_active > datetime('now', '-7 days') THEN 1 END) as activeUsers,
        COUNT(CASE WHEN is_verified = 1 THEN 1 END) as verifiedUsers,
        AVG(reputation) as averageReputation,
        SUM(total_transactions) as totalTransactions,
        AVG(CASE WHEN total_transactions > 0 THEN CAST(dispute_count AS REAL) / total_transactions ELSE 0 END) as disputeRate
      FROM anonymous_users
    `).get() as any;

    return {
      totalUsers: stats.totalUsers || 0,
      activeUsers: stats.activeUsers || 0,
      verifiedUsers: stats.verifiedUsers || 0,
      averageReputation: Math.round((stats.averageReputation || 50) * 100) / 100,
      totalTransactions: stats.totalTransactions || 0,
      disputeRate: Math.round((stats.disputeRate || 0) * 10000) / 100 // Convert to percentage
    };
  }

  /**
   * Clean up expired privacy sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const query = `
      DELETE FROM privacy_sessions 
      WHERE expires_at <= CURRENT_TIMESTAMP
    `;
    
    const result = this.db.prepare(query).run();
    const deletedCount = result.changes;

    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} expired privacy sessions`);
    }

    return deletedCount;
  }

  /**
   * Generate a temporary ID for anonymous users
   */
  private generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Map database row to AnonymousUser object
   */
  private mapRowToUser(row: any): AnonymousUser {
    return {
      id: row.id,
      tempId: row.temp_id,
      walletAddress: row.wallet_address,
      reputation: row.reputation,
      reputationHistory: [], // Will be loaded separately if needed
      createdAt: new Date(row.created_at),
      lastActive: new Date(row.last_active),
      isVerified: Boolean(row.is_verified),
      totalTransactions: row.total_transactions,
      successfulTransactions: row.successful_transactions,
      disputeCount: row.dispute_count,
      metadata: {
        preferences: JSON.parse(row.preferences || '{}'),
        privacy: JSON.parse(row.privacy_settings || '{}'),
        encryptedData: row.encrypted_data
      }
    };
  }
}
