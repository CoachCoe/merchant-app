import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from './databaseService.js';
import { DigitalDeliveryService } from './digitalDeliveryService.js';
import { logger } from '../utils/logger.js';

export interface PurchaseRequest {
  productId: string;
  buyerWalletAddress: string;
  sellerWalletAddress: string;
  amountHollar: number;
  paymentTxHash: string;
  blockNumber?: number;
}

export interface Purchase {
  id: string;
  productId: string;
  buyerWalletAddress: string;
  sellerWalletAddress: string;
  amountHollar: number;
  paymentTxHash: string;
  blockNumber?: number;
  deliveredAt?: string;
  createdAt: string;
}

export interface PurchaseWithDelivery extends Purchase {
  deliveryToken?: string;
  deliveryUrl?: string;
  deliveryExpiresAt?: Date;
}

export class PurchaseService {
  private db = DatabaseService.getInstance().getDatabase();
  private deliveryService = new DigitalDeliveryService();

  /**
   * Record a purchase and generate delivery token
   */
  async createPurchase(request: PurchaseRequest): Promise<PurchaseWithDelivery> {
    const purchaseId = uuidv4();

    // Insert purchase record
    this.db.prepare(`
      INSERT INTO purchases (
        id,
        product_id,
        buyer_wallet_address,
        seller_wallet_address,
        amount_hollar,
        payment_tx_hash,
        block_number,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      purchaseId,
      request.productId,
      request.buyerWalletAddress,
      request.sellerWalletAddress,
      request.amountHollar,
      request.paymentTxHash,
      request.blockNumber || null
    );

    logger.info('Purchase created', {
      purchaseId,
      productId: request.productId,
      buyer: request.buyerWalletAddress,
      seller: request.sellerWalletAddress,
      amount: request.amountHollar
    });

    // Generate delivery token (7-day expiration)
    const deliveryToken = this.deliveryService.generateDeliveryToken(
      purchaseId,
      request.productId,
      request.buyerWalletAddress,
      7 // 7 days validity
    );

    const deliveryUrl = this.deliveryService.getDeliveryUrl(deliveryToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Get purchase details
    const purchase = this.db.prepare(`
      SELECT * FROM purchases WHERE id = ?
    `).get(purchaseId) as Purchase;

    return {
      ...purchase,
      deliveryToken,
      deliveryUrl,
      deliveryExpiresAt: expiresAt
    };
  }

  /**
   * Get purchase by ID
   */
  getPurchaseById(purchaseId: string): Purchase | null {
    const purchase = this.db.prepare(`
      SELECT * FROM purchases WHERE id = ?
    `).get(purchaseId) as Purchase | undefined;

    return purchase || null;
  }

  /**
   * Get all purchases for a buyer
   */
  getPurchasesByBuyer(buyerWalletAddress: string): Purchase[] {
    return this.db.prepare(`
      SELECT * FROM purchases
      WHERE buyer_wallet_address = ?
      ORDER BY created_at DESC
    `).all(buyerWalletAddress) as Purchase[];
  }

  /**
   * Get all purchases for a seller
   */
  getPurchasesBySeller(sellerWalletAddress: string): Purchase[] {
    return this.db.prepare(`
      SELECT * FROM purchases
      WHERE seller_wallet_address = ?
      ORDER BY created_at DESC
    `).all(sellerWalletAddress) as Purchase[];
  }

  /**
   * Get seller transaction count (for reputation)
   */
  getSellerTransactionCount(sellerWalletAddress: string): number {
    const result = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM purchases
      WHERE seller_wallet_address = ?
    `).get(sellerWalletAddress) as { count: number };

    return result.count;
  }

  /**
   * Update purchase with block number after confirmation
   */
  updateBlockNumber(paymentTxHash: string, blockNumber: number): boolean {
    const result = this.db.prepare(`
      UPDATE purchases
      SET block_number = ?
      WHERE payment_tx_hash = ?
    `).run(blockNumber, paymentTxHash);

    if (result.changes > 0) {
      logger.info('Purchase block number updated', {
        paymentTxHash,
        blockNumber
      });
      return true;
    }

    return false;
  }

  /**
   * Get purchase with delivery status
   */
  getPurchaseWithDelivery(purchaseId: string): PurchaseWithDelivery | null {
    const purchase = this.getPurchaseById(purchaseId);
    if (!purchase) {
      return null;
    }

    const deliveryStatus = this.deliveryService.getDeliveryStatus(purchaseId);

    if (!deliveryStatus.hasToken) {
      return purchase;
    }

    // Get the actual token from database
    const tokenRecord = this.db.prepare(`
      SELECT token, expires_at
      FROM delivery_tokens
      WHERE purchase_id = ?
    `).get(purchaseId) as { token: string; expires_at: string } | undefined;

    if (!tokenRecord) {
      return purchase;
    }

    return {
      ...purchase,
      deliveryToken: deliveryStatus.delivered ? undefined : tokenRecord.token,
      deliveryUrl: deliveryStatus.delivered
        ? undefined
        : this.deliveryService.getDeliveryUrl(tokenRecord.token),
      deliveryExpiresAt: deliveryStatus.delivered
        ? undefined
        : new Date(tokenRecord.expires_at)
    };
  }
}
