import { DatabaseService } from './databaseService.js';
import { CartService } from './cartService.js';
import { Order, CreateOrderRequest, OrderResponse, OrderListResponse } from '../models/Order.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

export class OrderService {
  private db = DatabaseService.getInstance().getDatabase();
  private cartService = new CartService();

  // Create order from cart
  async createOrder(sessionId: string, request: CreateOrderRequest): Promise<OrderResponse> {
    const cart = await this.cartService.getCartBySessionId(sessionId);
    
    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    const orderId = uuidv4();
    const orderNumber = this.generateOrderNumber();
    const now = new Date().toISOString();

    // Create order with cart snapshot
    const query = `
      INSERT INTO orders (
        id, order_number, cart_snapshot, subtotal, tax, total,
        customer_email, customer_name, payment_status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `;

    this.db.prepare(query).run(
      orderId,
      orderNumber,
      JSON.stringify(cart),
      cart.subtotal,
      cart.tax,
      cart.total,
      request.customer?.email || null,
      request.customer?.name || null,
      now
    );

    logger.info('Order created', { 
      orderId, 
      orderNumber, 
      total: cart.total,
      sessionId 
    });

    const order = await this.getOrderById(orderId);
    return {
      order: order!,
      message: 'Order created successfully'
    };
  }

  // Get order by ID
  async getOrderById(id: string): Promise<Order | null> {
    const query = `
      SELECT 
        id, order_number as orderNumber, cart_snapshot as cartSnapshot,
        subtotal, tax, total, customer_email as customerEmail,
        customer_name as customerName, payment_status as paymentStatus,
        transaction_hash as transactionHash, block_number as blockNumber,
        chain_id as chainId, token_used as tokenUsed,
        created_at as createdAt, completed_at as completedAt
      FROM orders
      WHERE id = ?
    `;

    const row = this.db.prepare(query).get(id) as any;
    if (!row) {
      return null;
    }

    return this.mapRowToOrder(row);
  }

  // Get order by order number
  async getOrderByOrderNumber(orderNumber: string): Promise<Order | null> {
    const query = `
      SELECT 
        id, order_number as orderNumber, cart_snapshot as cartSnapshot,
        subtotal, tax, total, customer_email as customerEmail,
        customer_name as customerName, payment_status as paymentStatus,
        transaction_hash as transactionHash, block_number as blockNumber,
        chain_id as chainId, token_used as tokenUsed,
        created_at as createdAt, completed_at as completedAt
      FROM orders
      WHERE order_number = ?
    `;

    const row = this.db.prepare(query).get(orderNumber) as any;
    if (!row) {
      return null;
    }

    return this.mapRowToOrder(row);
  }

  // Get orders with pagination
  async getOrders(options: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<OrderListResponse> {
    const { page = 1, limit = 20, status } = options;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];

    if (status) {
      whereClause = 'WHERE payment_status = ?';
      params.push(status);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders
      ${whereClause}
    `;
    const countResult = this.db.prepare(countQuery).get(...params) as { total: number };

    // Get orders
    const ordersQuery = `
      SELECT 
        id, order_number as orderNumber, cart_snapshot as cartSnapshot,
        subtotal, tax, total, customer_email as customerEmail,
        customer_name as customerName, payment_status as paymentStatus,
        transaction_hash as transactionHash, block_number as blockNumber,
        chain_id as chainId, token_used as tokenUsed,
        created_at as createdAt, completed_at as completedAt
      FROM orders
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = this.db.prepare(ordersQuery).all(...params, limit, offset) as any[];

    return {
      orders: rows.map(this.mapRowToOrder),
      total: countResult.total,
      page,
      limit,
      hasMore: offset + rows.length < countResult.total
    };
  }

  // Update order payment status
  async updateOrderPaymentStatus(
    orderId: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed',
    paymentData?: {
      transactionHash?: string;
      blockNumber?: number;
      chainId?: string;
      tokenUsed?: 'DOT' | 'KSM' | 'USDC';
    }
  ): Promise<Order | null> {
    const updateFields: string[] = ['payment_status = ?'];
    const params: any[] = [status];

    if (paymentData?.transactionHash) {
      updateFields.push('transaction_hash = ?');
      params.push(paymentData.transactionHash);
    }

    if (paymentData?.blockNumber) {
      updateFields.push('block_number = ?');
      params.push(paymentData.blockNumber);
    }

    if (paymentData?.chainId) {
      updateFields.push('chain_id = ?');
      params.push(paymentData.chainId);
    }

    if (paymentData?.tokenUsed) {
      updateFields.push('token_used = ?');
      params.push(paymentData.tokenUsed);
    }

    if (status === 'completed') {
      updateFields.push('completed_at = ?');
      params.push(new Date().toISOString());
    }

    params.push(orderId);

    const query = `
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    const result = this.db.prepare(query).run(...params);

    if (result.changes > 0) {
      logger.info('Order payment status updated', { 
        orderId, 
        status,
        transactionHash: paymentData?.transactionHash 
      });
      return this.getOrderById(orderId);
    }

    return null;
  }

  // Generate unique order number
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ORD-${timestamp}-${random}`.toUpperCase();
  }

  // Helper method to map database row to Order object
  private mapRowToOrder(row: any): Order {
    return {
      id: row.id,
      orderNumber: row.orderNumber,
      cart: JSON.parse(row.cartSnapshot),
      customer: {
        email: row.customerEmail,
        name: row.customerName
      },
      paymentStatus: row.paymentStatus,
      transactionHash: row.transactionHash,
      blockNumber: row.blockNumber,
      chainId: row.chainId,
      tokenUsed: row.tokenUsed,
      createdAt: new Date(row.createdAt),
      completedAt: row.completedAt ? new Date(row.completedAt) : undefined
    };
  }
}
