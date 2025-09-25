/**
 * Escrow Service for Web3 Marketplace
 * Manages multi-signature escrow contracts and dispute resolution
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { MarketplaceDatabaseService } from './marketplaceDatabaseService.js';
import { 
  MarketplaceTransaction,
  CreateTransactionRequest,
  UpdateTransactionStatusRequest,
  TransactionListResponse,
  EscrowConfig,
  TransactionStats,
  DisputeInfo,
  RefundInfo
} from '../models/MarketplaceTransaction.js';

export class EscrowService {
  private db = MarketplaceDatabaseService.getInstance().getDatabase();
  private escrowConfig: EscrowConfig = {
    releaseTimeHours: 72, // 3 days default
    disputeWindowHours: 168, // 7 days
    arbitratorRequired: false,
    multiSigThreshold: 2,
    fees: {
      platform: 2.5, // 2.5% platform fee
      arbitrator: 1.0 // 1% arbitrator fee
    }
  };

  /**
   * Create a new marketplace transaction with escrow
   */
  async createTransaction(request: CreateTransactionRequest, buyerId: string): Promise<MarketplaceTransaction> {
    const transactionId = uuidv4();
    const escrowAddress = await this.generateEscrowAddress(); // Placeholder for actual escrow contract deployment
    
    // Get product and seller information
    const product = await this.getProductInfo(request.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const seller = await this.getSellerInfo(product.seller.anonymousId);
    if (!seller) {
      throw new Error('Seller not found');
    }

    const buyer = await this.getBuyerInfo(buyerId);
    if (!buyer) {
      throw new Error('Buyer not found');
    }

    // Calculate total amount including fees
    const productPrice = parseFloat(product.price.amount);
    const platformFee = productPrice * (this.escrowConfig.fees.platform / 100);
    const totalAmount = productPrice + platformFee;

    const transaction: MarketplaceTransaction = {
      id: transactionId,
      productId: request.productId,
      buyer: {
        anonymousId: buyerId,
        walletAddress: request.buyerWalletAddress,
        reputation: buyer.reputation
      },
      seller: {
        anonymousId: product.seller.anonymousId,
        walletAddress: seller.walletAddress || '',
        reputation: seller.reputation
      },
      escrow: {
        address: escrowAddress,
        amount: totalAmount.toString(),
        currency: product.price.currency,
        usdValue: product.price.usdValue || 0,
        releaseConditions: [
          {
            type: 'time_based',
            value: this.escrowConfig.releaseTimeHours,
            description: `Automatic release after ${this.escrowConfig.releaseTimeHours} hours`,
            met: false
          },
          {
            type: 'delivery_confirmation',
            value: 1,
            description: 'Buyer confirms delivery',
            met: false
          }
        ]
      },
      product: {
        title: product.title,
        price: product.price.amount,
        currency: product.price.currency,
        images: product.images
      },
      status: 'pending',
      timeline: [
        {
          id: uuidv4(),
          type: 'created',
          description: 'Transaction created and escrow address generated',
          timestamp: new Date(),
          actor: 'system'
        }
      ],
      payment: {
        transactionHash: '', // Will be filled when payment is made
        blockNumber: 0,
        chainId: this.getChainId(product.price.currency),
        gasUsed: '0',
        gasPrice: '0',
        timestamp: new Date()
      },
      delivery: {
        method: request.deliveryMethod,
        trackingNumber: undefined,
        estimatedDelivery: request.deliveryMethod === 'physical' ? 
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : // 7 days for physical
          new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day for digital
        deliveryProof: request.digitalDeliveryInfo
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to database
    await this.saveTransaction(transaction);

    logger.info('Marketplace transaction created', {
      transactionId,
      productId: request.productId,
      buyerId,
      sellerId: product.seller.anonymousId,
      amount: `${totalAmount} ${product.price.currency}`,
      escrowAddress
    });

    return transaction;
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionId: string, 
    request: UpdateTransactionStatusRequest
  ): Promise<MarketplaceTransaction | null> {
    const transaction = await this.getTransactionById(transactionId);
    if (!transaction) return null;

    // Add timeline event
    const event = {
      id: uuidv4(),
      type: request.eventType,
      description: request.description,
      timestamp: new Date(),
      actor: 'system' as const,
      metadata: request.metadata
    };

    transaction.timeline.push(event);
    transaction.status = request.status;
    transaction.updatedAt = new Date();

    // Update delivery information if provided
    if (request.deliveryProof) {
      transaction.delivery.deliveryProof = request.deliveryProof;
    }

    if (request.trackingNumber) {
      transaction.delivery.trackingNumber = request.trackingNumber;
    }

    // Update escrow conditions
    if (request.status === 'delivered') {
      transaction.escrow.releaseConditions.forEach(condition => {
        if (condition.type === 'delivery_confirmation') {
          condition.met = true;
          condition.metAt = new Date();
        }
      });
    }

    // Mark as completed if all conditions are met
    if (this.areAllConditionsMet(transaction.escrow.releaseConditions)) {
      transaction.status = 'completed';
      transaction.completedAt = new Date();
    }

    await this.saveTransaction(transaction);

    logger.info('Transaction status updated', {
      transactionId,
      status: request.status,
      eventType: request.eventType
    });

    return transaction;
  }

  /**
   * Process payment and update transaction
   */
  async processPayment(
    transactionId: string,
    paymentData: {
      transactionHash: string;
      blockNumber: number;
      gasUsed: string;
      gasPrice: string;
    }
  ): Promise<MarketplaceTransaction | null> {
    const transaction = await this.getTransactionById(transactionId);
    if (!transaction) return null;

    transaction.payment = {
      ...transaction.payment,
      ...paymentData,
      timestamp: new Date()
    };

    transaction.status = 'escrowed';
    transaction.updatedAt = new Date();

    // Add timeline event
    transaction.timeline.push({
      id: uuidv4(),
      type: 'payment_sent',
      description: 'Payment sent to escrow contract',
      timestamp: new Date(),
      actor: 'buyer',
      metadata: { transactionHash: paymentData.transactionHash }
    });

    transaction.timeline.push({
      id: uuidv4(),
      type: 'escrowed',
      description: 'Funds held in escrow contract',
      timestamp: new Date(),
      actor: 'system'
    });

    await this.saveTransaction(transaction);

    logger.info('Payment processed and escrowed', {
      transactionId,
      transactionHash: paymentData.transactionHash,
      amount: transaction.escrow.amount
    });

    return transaction;
  }

  /**
   * Create a dispute
   */
  async createDispute(
    transactionId: string,
    disputeData: {
      reason: DisputeInfo['reason'];
      description: string;
      evidence: Array<{
        type: 'image' | 'document' | 'message' | 'transaction';
        data: string;
        description: string;
      }>;
    }
  ): Promise<DisputeInfo | null> {
    const transaction = await this.getTransactionById(transactionId);
    if (!transaction) return null;

    const disputeId = uuidv4();
    const dispute: DisputeInfo = {
      id: disputeId,
      reason: disputeData.reason,
      description: disputeData.description,
      evidence: disputeData.evidence.map(ev => ({
        id: uuidv4(),
        type: ev.type,
        data: ev.data,
        description: ev.description,
        submittedBy: 'buyer' as const,
        timestamp: new Date()
      })),
      status: 'open',
      createdAt: new Date()
    };

    transaction.dispute = dispute;
    transaction.status = 'disputed';
    transaction.updatedAt = new Date();

    // Add timeline event
    transaction.timeline.push({
      id: uuidv4(),
      type: 'disputed',
      description: `Dispute created: ${disputeData.reason}`,
      timestamp: new Date(),
      actor: 'buyer',
      metadata: { disputeId }
    });

    await this.saveTransaction(transaction);

    logger.info('Dispute created', {
      transactionId,
      disputeId,
      reason: disputeData.reason
    });

    return dispute;
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(
    transactionId: string,
    resolution: {
      decision: 'buyer_wins' | 'seller_wins' | 'partial_refund';
      amount?: string;
      reasoning: string;
      arbitratorAddress?: string;
    }
  ): Promise<MarketplaceTransaction | null> {
    const transaction = await this.getTransactionById(transactionId);
    if (!transaction || !transaction.dispute) return null;

    transaction.dispute.resolution = {
      decision: resolution.decision,
      amount: resolution.amount || transaction.escrow.amount,
      reasoning: resolution.reasoning,
      timestamp: new Date()
    };

    transaction.dispute.status = 'resolved';
    transaction.dispute.resolvedAt = new Date();

    if (resolution.arbitratorAddress) {
      transaction.dispute.arbitrator = {
        address: resolution.arbitratorAddress,
        reputation: 100 // Placeholder
      };
    }

    // Update transaction status based on resolution
    if (resolution.decision === 'buyer_wins') {
      transaction.status = 'refunded';
    } else if (resolution.decision === 'seller_wins') {
      transaction.status = 'completed';
      transaction.completedAt = new Date();
    } else {
      transaction.status = 'refunded'; // Partial refund
    }

    transaction.updatedAt = new Date();

    // Add timeline event
    transaction.timeline.push({
      id: uuidv4(),
      type: 'resolved',
      description: `Dispute resolved: ${resolution.decision}`,
      timestamp: new Date(),
      actor: 'arbitrator',
      metadata: { 
        decision: resolution.decision,
        amount: resolution.amount,
        arbitratorAddress: resolution.arbitratorAddress
      }
    });

    await this.saveTransaction(transaction);

    logger.info('Dispute resolved', {
      transactionId,
      decision: resolution.decision,
      amount: resolution.amount
    });

    return transaction;
  }

  /**
   * Process refund
   */
  async processRefund(
    transactionId: string,
    refundData: {
      amount: string;
      currency: 'DOT' | 'KSM';
      reason: string;
      transactionHash: string;
      blockNumber: number;
      processedBy: 'seller' | 'arbitrator' | 'system';
    }
  ): Promise<MarketplaceTransaction | null> {
    const transaction = await this.getTransactionById(transactionId);
    if (!transaction) return null;

    const refund: RefundInfo = {
      amount: refundData.amount,
      currency: refundData.currency,
      reason: refundData.reason,
      transactionHash: refundData.transactionHash,
      blockNumber: refundData.blockNumber,
      timestamp: new Date(),
      processedBy: refundData.processedBy
    };

    transaction.refund = refund;
    transaction.status = 'refunded';
    transaction.updatedAt = new Date();

    // Add timeline event
    transaction.timeline.push({
      id: uuidv4(),
      type: 'refunded',
      description: `Refund processed: ${refundData.reason}`,
      timestamp: new Date(),
      actor: refundData.processedBy,
      metadata: { 
        amount: refundData.amount,
        transactionHash: refundData.transactionHash
      }
    });

    await this.saveTransaction(transaction);

    logger.info('Refund processed', {
      transactionId,
      amount: refundData.amount,
      currency: refundData.currency,
      transactionHash: refundData.transactionHash
    });

    return transaction;
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string): Promise<MarketplaceTransaction | null> {
    const query = `
      SELECT * FROM marketplace_transactions WHERE id = ?
    `;
    
    const row = this.db.prepare(query).get(transactionId) as any;
    if (!row) return null;

    return this.mapRowToTransaction(row);
  }

  /**
   * Get transactions with filtering
   */
  async getTransactions(options: {
    buyerId?: string;
    sellerId?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<TransactionListResponse> {
    const { buyerId, sellerId, status, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (buyerId) {
      whereConditions.push('buyer_anonymous_id = ?');
      params.push(buyerId);
    }

    if (sellerId) {
      whereConditions.push('seller_anonymous_id = ?');
      params.push(sellerId);
    }

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM marketplace_transactions ${whereClause}`;
    const countResult = this.db.prepare(countQuery).get(...params) as { total: number };

    // Get transactions
    const query = `
      SELECT * FROM marketplace_transactions 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = this.db.prepare(query).all(...params, limit, offset) as any[];
    const transactions = rows.map(row => this.mapRowToTransaction(row));

    // Calculate stats
    const stats = await this.getTransactionStats();

    return {
      transactions,
      total: countResult.total,
      page,
      limit,
      hasMore: offset + transactions.length < countResult.total,
      stats: {
        totalValue: stats.totalValue.USD,
        averageValue: stats.averageTransactionValue,
        completionRate: stats.completionRate,
        disputeRate: stats.disputeRate
      }
    };
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(): Promise<TransactionStats> {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as totalTransactions,
        SUM(CASE WHEN escrow_currency = 'DOT' THEN CAST(escrow_amount AS REAL) ELSE 0 END) as totalValueDOT,
        SUM(CASE WHEN escrow_currency = 'KSM' THEN CAST(escrow_amount AS REAL) ELSE 0 END) as totalValueKSM,
        SUM(escrow_usd_value) as totalValueUSD,
        AVG(escrow_usd_value) as averageTransactionValue,
        AVG(CASE WHEN status = 'completed' THEN 1.0 ELSE 0.0 END) as completionRate,
        AVG(CASE WHEN status = 'disputed' THEN 1.0 ELSE 0.0 END) as disputeRate,
        AVG(CASE WHEN completed_at IS NOT NULL THEN 
          (julianday(completed_at) - julianday(created_at)) * 24 
        END) as averageCompletionTime
      FROM marketplace_transactions
    `).get() as any;

    return {
      totalTransactions: stats.totalTransactions || 0,
      totalValue: {
        DOT: stats.totalValueDOT?.toString() || '0',
        KSM: stats.totalValueKSM?.toString() || '0',
        USD: stats.totalValueUSD || 0
      },
      averageTransactionValue: stats.averageTransactionValue || 0,
      completionRate: (stats.completionRate || 0) * 100,
      disputeRate: (stats.disputeRate || 0) * 100,
      averageCompletionTime: stats.averageCompletionTime || 0,
      topSellers: [], // Would be implemented with additional queries
      recentActivity: [] // Would be implemented with timeline queries
    };
  }

  /**
   * Check if all escrow conditions are met
   */
  private areAllConditionsMet(conditions: any[]): boolean {
    return conditions.every(condition => condition.met);
  }

  /**
   * Generate escrow address (placeholder)
   */
  private async generateEscrowAddress(): Promise<string> {
    // This would deploy or reference an actual multi-signature escrow contract
    return `0x${Math.random().toString(16).substr(2, 40)}`;
  }

  /**
   * Get chain ID for currency
   */
  private getChainId(currency: 'DOT' | 'KSM'): string {
    return currency === 'DOT' ? '0' : '2';
  }

  /**
   * Get product information
   */
  private async getProductInfo(productId: string): Promise<any> {
    const query = `SELECT * FROM marketplace_products WHERE id = ?`;
    return this.db.prepare(query).get(productId);
  }

  /**
   * Get seller information
   */
  private async getSellerInfo(sellerId: string): Promise<any> {
    const query = `SELECT * FROM anonymous_users WHERE id = ?`;
    return this.db.prepare(query).get(sellerId);
  }

  /**
   * Get buyer information
   */
  private async getBuyerInfo(buyerId: string): Promise<any> {
    const query = `SELECT * FROM anonymous_users WHERE id = ?`;
    return this.db.prepare(query).get(buyerId);
  }

  /**
   * Save transaction to database
   */
  private async saveTransaction(transaction: MarketplaceTransaction): Promise<void> {
    const query = `
      INSERT OR REPLACE INTO marketplace_transactions (
        id, product_id, buyer_anonymous_id, buyer_wallet_address, buyer_reputation,
        seller_anonymous_id, seller_wallet_address, seller_reputation,
        escrow_address, escrow_amount, escrow_currency, escrow_usd_value, escrow_release_conditions,
        product_title, product_price, product_currency, product_images,
        status, payment_transaction_hash, payment_block_number, payment_chain_id,
        payment_gas_used, payment_gas_price, payment_timestamp,
        delivery_method, tracking_number, estimated_delivery, actual_delivery, delivery_proof,
        dispute_id, refund_amount, refund_currency, refund_reason, refund_transaction_hash,
        refund_block_number, refund_timestamp, refund_processed_by,
        created_at, updated_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this.db.prepare(query).run(
      transaction.id,
      transaction.productId,
      transaction.buyer.anonymousId,
      transaction.buyer.walletAddress,
      transaction.buyer.reputation,
      transaction.seller.anonymousId,
      transaction.seller.walletAddress,
      transaction.seller.reputation,
      transaction.escrow.address,
      transaction.escrow.amount,
      transaction.escrow.currency,
      transaction.escrow.usdValue,
      JSON.stringify(transaction.escrow.releaseConditions),
      transaction.product.title,
      transaction.product.price,
      transaction.product.currency,
      JSON.stringify(transaction.product.images),
      transaction.status,
      transaction.payment.transactionHash,
      transaction.payment.blockNumber,
      transaction.payment.chainId,
      transaction.payment.gasUsed,
      transaction.payment.gasPrice,
      transaction.payment.timestamp.toISOString(),
      transaction.delivery.method,
      transaction.delivery.trackingNumber,
      transaction.delivery.estimatedDelivery?.toISOString(),
      transaction.delivery.actualDelivery?.toISOString(),
      transaction.delivery.deliveryProof,
      transaction.dispute?.id,
      transaction.refund?.amount,
      transaction.refund?.currency,
      transaction.refund?.reason,
      transaction.refund?.transactionHash,
      transaction.refund?.blockNumber,
      transaction.refund?.timestamp?.toISOString(),
      transaction.refund?.processedBy,
      transaction.createdAt.toISOString(),
      transaction.updatedAt.toISOString(),
      transaction.completedAt?.toISOString()
    );

    // Save timeline events
    await this.saveTimelineEvents(transaction.id, transaction.timeline);
  }

  /**
   * Save timeline events
   */
  private async saveTimelineEvents(transactionId: string, events: any[]): Promise<void> {
    const query = `
      INSERT OR REPLACE INTO transaction_events (
        id, transaction_id, type, description, timestamp, actor, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const stmt = this.db.prepare(query);
    
    for (const event of events) {
      stmt.run(
        event.id,
        transactionId,
        event.type,
        event.description,
        event.timestamp.toISOString(),
        event.actor,
        JSON.stringify(event.metadata || {})
      );
    }
  }

  /**
   * Map database row to MarketplaceTransaction object
   */
  private mapRowToTransaction(row: any): MarketplaceTransaction {
    return {
      id: row.id,
      productId: row.product_id,
      buyer: {
        anonymousId: row.buyer_anonymous_id,
        walletAddress: row.buyer_wallet_address,
        reputation: row.buyer_reputation
      },
      seller: {
        anonymousId: row.seller_anonymous_id,
        walletAddress: row.seller_wallet_address,
        reputation: row.seller_reputation
      },
      escrow: {
        address: row.escrow_address,
        amount: row.escrow_amount,
        currency: row.escrow_currency,
        usdValue: row.escrow_usd_value,
        releaseConditions: JSON.parse(row.escrow_release_conditions || '[]')
      },
      product: {
        title: row.product_title,
        price: row.product_price,
        currency: row.product_currency,
        images: JSON.parse(row.product_images || '[]')
      },
      status: row.status,
      timeline: [], // Would be loaded separately
      payment: {
        transactionHash: row.payment_transaction_hash,
        blockNumber: row.payment_block_number,
        chainId: row.payment_chain_id,
        gasUsed: row.payment_gas_used,
        gasPrice: row.payment_gas_price,
        timestamp: new Date(row.payment_timestamp)
      },
      delivery: {
        method: row.delivery_method,
        trackingNumber: row.tracking_number,
        estimatedDelivery: row.estimated_delivery ? new Date(row.estimated_delivery) : undefined,
        actualDelivery: row.actual_delivery ? new Date(row.actual_delivery) : undefined,
        deliveryProof: row.delivery_proof
      },
      dispute: row.dispute_id ? {
        id: row.dispute_id,
        reason: 'other' as const,
        description: '',
        evidence: [],
        status: 'open' as const,
        createdAt: new Date()
      } : undefined,
      refund: row.refund_amount ? {
        amount: row.refund_amount,
        currency: row.refund_currency,
        reason: row.refund_reason,
        transactionHash: row.refund_transaction_hash,
        blockNumber: row.refund_block_number,
        timestamp: new Date(row.refund_timestamp),
        processedBy: row.refund_processed_by
      } : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined
    };
  }
}
