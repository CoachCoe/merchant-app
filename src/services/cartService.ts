import { DatabaseService } from './databaseService.js';
import { ProductService } from './productService.js';
import { Cart, CartItem, AddToCartRequest, UpdateCartItemRequest, CartResponse } from '../models/Cart.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

export class CartService {
  private db = DatabaseService.getInstance().getDatabase();
  private productService = new ProductService();

  // Get or create cart for session
  async getOrCreateCart(sessionId: string): Promise<Cart> {
    let cart = await this.getCartBySessionId(sessionId);
    
    if (!cart) {
      cart = await this.createCart(sessionId);
    }
    
    return cart;
  }

  // Get cart by session ID
  async getCartBySessionId(sessionId: string): Promise<Cart | null> {
    const cartQuery = `
      SELECT id, session_id as sessionId, created_at as createdAt, updated_at as updatedAt
      FROM carts
      WHERE session_id = ?
    `;

    const cartRow = this.db.prepare(cartQuery).get(sessionId) as any;
    if (!cartRow) {
      return null;
    }

    const items = await this.getCartItems(cartRow.id);
    return this.calculateCartTotals({
      id: cartRow.id,
      sessionId: cartRow.sessionId,
      items,
      subtotal: 0,
      tax: 0,
      total: 0,
      createdAt: new Date(cartRow.createdAt),
      updatedAt: new Date(cartRow.updatedAt)
    });
  }

  // Create new cart
  async createCart(sessionId: string): Promise<Cart> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const query = `
      INSERT INTO carts (id, session_id, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `;

    this.db.prepare(query).run(id, sessionId, now, now);

    return {
      id,
      sessionId,
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  }

  // Add item to cart
  async addToCart(sessionId: string, request: AddToCartRequest): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(sessionId);
    
    // Check if product exists and is active
    const product = await this.productService.getProductById(request.productId);
    if (!product || !product.isActive) {
      throw new Error('Product not found or inactive');
    }

    // Check if item already exists in cart
    const existingItem = cart.items.find(item => item.productId === request.productId);
    
    if (existingItem) {
      // Update quantity
      return this.updateCartItem(sessionId, existingItem.id, { quantity: existingItem.quantity + request.quantity });
    } else {
      // Add new item
      const itemId = uuidv4();
      const now = new Date().toISOString();

      const query = `
        INSERT INTO cart_items (id, cart_id, product_id, quantity, unit_price, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      this.db.prepare(query).run(
        itemId,
        cart.id,
        request.productId,
        request.quantity,
        product.priceHollar,
        now
      );

      logger.info('Item added to cart', { 
        cartId: cart.id, 
        productId: request.productId, 
        quantity: request.quantity 
      });

      const updatedCart = await this.getCartBySessionId(sessionId);
      return {
        cart: updatedCart!,
        message: 'Item added to cart'
      };
    }
  }

  // Update cart item quantity
  async updateCartItem(sessionId: string, itemId: string, request: UpdateCartItemRequest): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(sessionId);
    const item = cart.items.find(i => i.id === itemId);
    
    if (!item) {
      throw new Error('Cart item not found');
    }

    if (request.quantity <= 0) {
      return this.removeCartItem(sessionId, itemId);
    }

    const query = `
      UPDATE cart_items
      SET quantity = ?, unit_price = (
        SELECT price_hollar FROM products WHERE id = cart_items.product_id
      )
      WHERE id = ? AND cart_id = ?
    `;

    this.db.prepare(query).run(request.quantity, itemId, cart.id);

    logger.info('Cart item updated', { itemId, quantity: request.quantity });

    const updatedCart = await this.getCartBySessionId(sessionId);
    return {
      cart: updatedCart!,
      message: 'Cart item updated'
    };
  }

  // Remove item from cart
  async removeCartItem(sessionId: string, itemId: string): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(sessionId);
    
    const query = 'DELETE FROM cart_items WHERE id = ? AND cart_id = ?';
    const result = this.db.prepare(query).run(itemId, cart.id);

    if (result.changes === 0) {
      throw new Error('Cart item not found');
    }

    logger.info('Cart item removed', { itemId });

    const updatedCart = await this.getCartBySessionId(sessionId);
    return {
      cart: updatedCart!,
      message: 'Item removed from cart'
    };
  }

  // Clear entire cart
  async clearCart(sessionId: string): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(sessionId);
    
    const query = 'DELETE FROM cart_items WHERE cart_id = ?';
    this.db.prepare(query).run(cart.id);

    logger.info('Cart cleared', { cartId: cart.id });

    const updatedCart = await this.getCartBySessionId(sessionId);
    return {
      cart: updatedCart!,
      message: 'Cart cleared'
    };
  }

  // Get cart items with product details
  private async getCartItems(cartId: string): Promise<CartItem[]> {
    const query = `
      SELECT
        ci.id,
        ci.product_id as productId,
        ci.quantity,
        ci.unit_price as unitPrice,
        ci.created_at as createdAt,
        p.title,
        p.description,
        p.price_hollar as priceHollar,
        p.images,
        p.category_id as categoryId,
        p.seller_wallet_address as sellerWalletAddress,
        p.ipfs_metadata_hash as ipfsMetadataHash,
        p.is_active as isActive,
        p.created_at as productCreatedAt,
        p.updated_at as productUpdatedAt,
        p.views,
        p.purchases,
        p.blockchain_verified as blockchainVerified
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
      ORDER BY ci.created_at ASC
    `;

    const rows = this.db.prepare(query).all(cartId) as any[];

    return rows.map(row => {
      let images: string[] = [];
      try {
        images = row.images ? JSON.parse(row.images) : [];
      } catch (e) {
        images = [row.images].filter(Boolean);
      }

      return {
        id: row.id,
        productId: row.productId,
        product: {
          id: row.productId,
          title: row.title,
          description: row.description,
          priceHollar: row.priceHollar,
          images,
          categoryId: row.categoryId,
          sellerWalletAddress: row.sellerWalletAddress,
          ipfsMetadataHash: row.ipfsMetadataHash,
          blockchainVerified: Boolean(row.blockchainVerified),
          views: row.views,
          purchases: row.purchases,
          isActive: Boolean(row.isActive),
          createdAt: row.productCreatedAt,
          updatedAt: row.productUpdatedAt
        },
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        totalPrice: row.quantity * row.unitPrice,
        createdAt: new Date(row.createdAt)
      };
    });
  }

  // Calculate cart totals
  private calculateCartTotals(cart: Cart): Cart {
    const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = Math.round(subtotal * 0.08); // 8% tax rate
    const total = subtotal + tax;

    return {
      ...cart,
      subtotal,
      tax,
      total
    };
  }
}
