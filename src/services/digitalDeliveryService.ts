import crypto from 'crypto';
import { DatabaseService } from './databaseService.js';
import { logger } from '../utils/logger.js';

/**
 * Digital Delivery Service
 *
 * Handles secure delivery of digital products after payment confirmation.
 * Generates one-time delivery tokens and tracks delivery status.
 */

export interface DeliveryToken {
  token: string;
  productId: string;
  purchaseId: string;
  buyerWalletAddress: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface DeliveryDetails {
  productId: string;
  productName: string;
  deliveryType: 'ipfs' | 'email' | 'download' | 'link';
  deliveryInstructions: string;
  ipfsHash?: string;
  downloadUrl?: string;
  deliveredAt?: Date;
}

export class DigitalDeliveryService {
  private db = DatabaseService.getInstance().getDatabase();

  /**
   * Generate a secure one-time delivery token
   * Token is valid for 7 days by default
   */
  generateDeliveryToken(
    purchaseId: string,
    productId: string,
    buyerWalletAddress: string,
    validityDays: number = 7
  ): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    this.db.prepare(`
      INSERT INTO delivery_tokens (
        token,
        purchase_id,
        product_id,
        buyer_wallet_address,
        expires_at,
        created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(token, purchaseId, productId, buyerWalletAddress, expiresAt.toISOString());

    logger.info('Delivery token generated', {
      purchaseId,
      productId,
      expiresAt: expiresAt.toISOString()
    });

    return token;
  }

  /**
   * Validate delivery token and return delivery details
   * Marks token as used after first retrieval
   */
  async redeemDeliveryToken(token: string): Promise<DeliveryDetails | null> {
    const tokenRecord = this.db.prepare(`
      SELECT
        dt.token,
        dt.purchase_id,
        dt.product_id,
        dt.buyer_wallet_address,
        dt.expires_at,
        dt.redeemed_at,
        p.title as product_name,
        p.digital_delivery_type,
        p.digital_delivery_instructions,
        p.ipfs_metadata_hash
      FROM delivery_tokens dt
      JOIN products p ON dt.product_id = p.id
      WHERE dt.token = ?
    `).get(token) as any;

    if (!tokenRecord) {
      logger.warn('Invalid delivery token', { token: token.slice(0, 8) + '...' });
      return null;
    }

    // Check if already redeemed
    if (tokenRecord.redeemed_at) {
      logger.warn('Delivery token already redeemed', {
        token: token.slice(0, 8) + '...',
        redeemedAt: tokenRecord.redeemed_at
      });
      return null;
    }

    // Check expiration
    const expiresAt = new Date(tokenRecord.expires_at);
    if (expiresAt < new Date()) {
      logger.warn('Delivery token expired', {
        token: token.slice(0, 8) + '...',
        expiresAt: expiresAt.toISOString()
      });
      return null;
    }

    // Mark token as redeemed
    this.db.prepare(`
      UPDATE delivery_tokens
      SET redeemed_at = datetime('now')
      WHERE token = ?
    `).run(token);

    // Mark purchase as delivered
    this.db.prepare(`
      UPDATE purchases
      SET delivered_at = datetime('now')
      WHERE id = ?
    `).run(tokenRecord.purchase_id);

    logger.info('Delivery token redeemed successfully', {
      purchaseId: tokenRecord.purchase_id,
      productId: tokenRecord.product_id,
      buyerWallet: tokenRecord.buyer_wallet_address
    });

    return {
      productId: tokenRecord.product_id,
      productName: tokenRecord.product_name,
      deliveryType: tokenRecord.digital_delivery_type,
      deliveryInstructions: tokenRecord.digital_delivery_instructions,
      ipfsHash: tokenRecord.ipfs_metadata_hash,
      deliveredAt: new Date()
    };
  }

  /**
   * Get delivery status for a purchase
   */
  getDeliveryStatus(purchaseId: string): {
    hasToken: boolean;
    tokenExpired: boolean;
    delivered: boolean;
    expiresAt?: Date;
  } {
    const token = this.db.prepare(`
      SELECT
        token,
        expires_at,
        redeemed_at
      FROM delivery_tokens
      WHERE purchase_id = ?
    `).get(purchaseId) as any;

    if (!token) {
      return {
        hasToken: false,
        tokenExpired: false,
        delivered: false
      };
    }

    const expiresAt = new Date(token.expires_at);
    const now = new Date();

    return {
      hasToken: true,
      tokenExpired: expiresAt < now,
      delivered: !!token.redeemed_at,
      expiresAt
    };
  }

  /**
   * Generate delivery URL for buyer
   */
  getDeliveryUrl(token: string, baseUrl: string = process.env.APP_URL || 'http://localhost:3000'): string {
    return `${baseUrl}/delivery/${token}`;
  }

  /**
   * Clean up expired tokens (should be run periodically)
   */
  cleanupExpiredTokens(): number {
    const result = this.db.prepare(`
      DELETE FROM delivery_tokens
      WHERE expires_at < datetime('now')
      AND redeemed_at IS NULL
    `).run();

    if (result.changes > 0) {
      logger.info('Cleaned up expired delivery tokens', { count: result.changes });
    }

    return result.changes;
  }

  /**
   * Extend token expiration (e.g., if buyer requests more time)
   */
  extendTokenExpiration(token: string, additionalDays: number = 7): boolean {
    const result = this.db.prepare(`
      UPDATE delivery_tokens
      SET expires_at = datetime(expires_at, '+' || ? || ' days')
      WHERE token = ?
      AND redeemed_at IS NULL
    `).run(additionalDays, token);

    if (result.changes > 0) {
      logger.info('Extended delivery token expiration', {
        token: token.slice(0, 8) + '...',
        additionalDays
      });
      return true;
    }

    return false;
  }
}
