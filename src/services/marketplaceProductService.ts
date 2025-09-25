/**
 * Marketplace Product Service for Web3 Marketplace
 * Manages products with IPFS integration and blockchain verification
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { MarketplaceDatabaseService } from './marketplaceDatabaseService.js';
import { 
  MarketplaceProduct, 
  CreateMarketplaceProductRequest, 
  UpdateMarketplaceProductRequest,
  ProductListResponse,
  ProductSearchRequest,
  ProductStats
} from '../models/MarketplaceProduct.js';

export class MarketplaceProductService {
  private db = MarketplaceDatabaseService.getInstance().getDatabase();

  /**
   * Create a new marketplace product
   */
  async createProduct(request: CreateMarketplaceProductRequest, sellerId: string): Promise<MarketplaceProduct> {
    const productId = uuidv4();
    const ipfsHash = await this.generateIPFSHash(request); // Placeholder for IPFS integration
    
    const product: MarketplaceProduct = {
      id: productId,
      title: request.title,
      description: request.description,
      images: request.images,
      price: {
        amount: request.price.amount,
        currency: request.price.currency,
        usdValue: await this.convertToUSD(request.price.amount, request.price.currency)
      },
      seller: {
        anonymousId: sellerId,
        reputation: 50.0, // Will be fetched from user service
        walletAddress: undefined, // Will be fetched from user service
        displayName: undefined
      },
      category: request.category,
      subcategory: request.subcategory,
      tags: request.tags,
      availability: 'available',
      condition: request.condition,
      shipping: request.shipping || { available: false },
      digitalDelivery: request.digitalDelivery || { available: false, method: 'email' },
      blockchain: {
        verified: false,
        transactionHash: undefined,
        blockNumber: undefined,
        chainId: undefined
      },
      metadata: {
        ipfsHash,
        version: 1,
        lastUpdated: new Date()
      },
      stats: {
        views: 0,
        favorites: 0,
        purchases: 0,
        reviews: 0,
        averageRating: 0
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: request.expiresAt
    };

    // Get seller information
    const sellerInfo = await this.getSellerInfo(sellerId);
    if (sellerInfo) {
      product.seller.reputation = sellerInfo.reputation;
      product.seller.walletAddress = sellerInfo.walletAddress;
      product.seller.displayName = sellerInfo.displayName;
    }

    const query = `
      INSERT INTO marketplace_products (
        id, title, description, images, price_amount, price_currency, price_usd_value,
        seller_anonymous_id, seller_reputation, seller_wallet_address, seller_display_name,
        category, subcategory, tags, availability, condition,
        shipping_available, shipping_cost_amount, shipping_cost_currency, 
        shipping_estimated_days, shipping_regions,
        digital_delivery_available, digital_delivery_method, digital_delivery_instructions,
        blockchain_verified, blockchain_transaction_hash, blockchain_block_number, blockchain_chain_id,
        ipfs_metadata_hash, metadata_version, metadata_last_updated,
        views, favorites, purchases, reviews, average_rating,
        created_at, updated_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this.db.prepare(query).run(
      product.id,
      product.title,
      product.description,
      JSON.stringify(product.images),
      product.price.amount,
      product.price.currency,
      product.price.usdValue,
      product.seller.anonymousId,
      product.seller.reputation,
      product.seller.walletAddress || null,
      product.seller.displayName || null,
      product.category,
      product.subcategory || null,
      JSON.stringify(product.tags),
      product.availability,
      product.condition,
      product.shipping.available ? 1 : 0,
      product.shipping.cost?.amount || null,
      product.shipping.cost?.currency || null,
      product.shipping.estimatedDays || null,
      JSON.stringify(product.shipping.regions || []),
      product.digitalDelivery.available ? 1 : 0,
      product.digitalDelivery.method,
      product.digitalDelivery.instructions || null,
      product.blockchain.verified ? 1 : 0,
      product.blockchain.transactionHash || null,
      product.blockchain.blockNumber || null,
      product.blockchain.chainId || null,
      product.metadata.ipfsHash,
      product.metadata.version,
      product.metadata.lastUpdated.toISOString(),
      product.stats.views,
      product.stats.favorites,
      product.stats.purchases,
      product.stats.reviews,
      product.stats.averageRating,
      product.createdAt.toISOString(),
      product.updatedAt.toISOString(),
      product.expiresAt?.toISOString() || null
    );

    logger.info('Marketplace product created', { 
      productId, 
      title: product.title, 
      sellerId: product.seller.anonymousId,
      price: `${product.price.amount} ${product.price.currency}`
    });

    return product;
  }

  /**
   * Get product by ID
   */
  async getProductById(productId: string): Promise<MarketplaceProduct | null> {
    const query = `
      SELECT * FROM marketplace_products WHERE id = ?
    `;
    
    const row = this.db.prepare(query).get(productId) as any;
    if (!row) return null;

    return this.mapRowToProduct(row);
  }

  /**
   * Update product
   */
  async updateProduct(productId: string, request: UpdateMarketplaceProductRequest): Promise<MarketplaceProduct | null> {
    const existingProduct = await this.getProductById(productId);
    if (!existingProduct) return null;

    const updateFields: string[] = [];
    const params: any[] = [];

    if (request.title !== undefined) {
      updateFields.push('title = ?');
      params.push(request.title);
    }

    if (request.description !== undefined) {
      updateFields.push('description = ?');
      params.push(request.description);
    }

    if (request.images !== undefined) {
      updateFields.push('images = ?');
      params.push(JSON.stringify(request.images));
    }

    if (request.price !== undefined) {
      updateFields.push('price_amount = ?');
      updateFields.push('price_currency = ?');
      updateFields.push('price_usd_value = ?');
      params.push(request.price.amount, request.price.currency);
      params.push(await this.convertToUSD(request.price.amount, request.price.currency));
    }

    if (request.category !== undefined) {
      updateFields.push('category = ?');
      params.push(request.category);
    }

    if (request.subcategory !== undefined) {
      updateFields.push('subcategory = ?');
      params.push(request.subcategory);
    }

    if (request.tags !== undefined) {
      updateFields.push('tags = ?');
      params.push(JSON.stringify(request.tags));
    }

    if (request.availability !== undefined) {
      updateFields.push('availability = ?');
      params.push(request.availability);
    }

    if (request.condition !== undefined) {
      updateFields.push('condition = ?');
      params.push(request.condition);
    }

    if (request.shipping !== undefined) {
      updateFields.push('shipping_available = ?');
      updateFields.push('shipping_cost_amount = ?');
      updateFields.push('shipping_cost_currency = ?');
      updateFields.push('shipping_estimated_days = ?');
      updateFields.push('shipping_regions = ?');
      params.push(
        request.shipping.available ? 1 : 0,
        request.shipping.cost?.amount || null,
        request.shipping.cost?.currency || null,
        request.shipping.estimatedDays || null,
        JSON.stringify(request.shipping.regions || [])
      );
    }

    if (request.digitalDelivery !== undefined) {
      updateFields.push('digital_delivery_available = ?');
      updateFields.push('digital_delivery_method = ?');
      updateFields.push('digital_delivery_instructions = ?');
      params.push(
        request.digitalDelivery.available ? 1 : 0,
        request.digitalDelivery.method,
        request.digitalDelivery.instructions || null
      );
    }

    if (request.expiresAt !== undefined) {
      updateFields.push('expires_at = ?');
      params.push(request.expiresAt?.toISOString() || null);
    }

    // Always update metadata and timestamp
    updateFields.push('metadata_version = metadata_version + 1');
    updateFields.push('metadata_last_updated = ?');
    updateFields.push('updated_at = ?');
    params.push(new Date().toISOString(), new Date().toISOString());

    params.push(productId);

    const query = `
      UPDATE marketplace_products 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    const result = this.db.prepare(query).run(...params);

    if (result.changes > 0) {
      logger.info('Marketplace product updated', { productId, fields: updateFields.length });
      return this.getProductById(productId);
    }

    return null;
  }

  /**
   * Delete product
   */
  async deleteProduct(productId: string): Promise<boolean> {
    const query = `DELETE FROM marketplace_products WHERE id = ?`;
    const result = this.db.prepare(query).run(productId);

    if (result.changes > 0) {
      logger.info('Marketplace product deleted', { productId });
      return true;
    }

    return false;
  }

  /**
   * Search products with advanced filtering
   */
  async searchProducts(request: ProductSearchRequest): Promise<ProductListResponse> {
    const {
      query,
      category,
      subcategory,
      tags,
      priceMin,
      priceMax,
      currency = 'DOT',
      condition,
      availability = ['available'],
      sellerReputation,
      sortBy = 'newest',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = request;

    const offset = (page - 1) * limit;
    const whereConditions: string[] = [];
    const params: any[] = [];

    // Text search
    if (query) {
      whereConditions.push('(title LIKE ? OR description LIKE ? OR tags LIKE ?)');
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Category filter
    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }

    // Subcategory filter
    if (subcategory) {
      whereConditions.push('subcategory = ?');
      params.push(subcategory);
    }

    // Tags filter
    if (tags && tags.length > 0) {
      const tagConditions = tags.map(() => 'tags LIKE ?');
      whereConditions.push(`(${tagConditions.join(' OR ')})`);
      tags.forEach(tag => params.push(`%"${tag}"%`));
    }

    // Price range filter
    if (priceMin !== undefined || priceMax !== undefined) {
      whereConditions.push('price_currency = ?');
      params.push(currency);

      if (priceMin !== undefined) {
        whereConditions.push('CAST(price_amount AS REAL) >= ?');
        params.push(priceMin);
      }

      if (priceMax !== undefined) {
        whereConditions.push('CAST(price_amount AS REAL) <= ?');
        params.push(priceMax);
      }
    }

    // Condition filter
    if (condition && condition.length > 0) {
      const conditionPlaceholders = condition.map(() => '?').join(',');
      whereConditions.push(`condition IN (${conditionPlaceholders})`);
      condition.forEach(c => params.push(c));
    }

    // Availability filter
    if (availability && availability.length > 0) {
      const availabilityPlaceholders = availability.map(() => '?').join(',');
      whereConditions.push(`availability IN (${availabilityPlaceholders})`);
      availability.forEach(a => params.push(a));
    }

    // Seller reputation filter
    if (sellerReputation !== undefined) {
      whereConditions.push('seller_reputation >= ?');
      params.push(sellerReputation);
    }

    // Expired products filter
    whereConditions.push('(expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)');

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Sorting
    let orderBy = 'created_at DESC';
    switch (sortBy) {
      case 'price':
        orderBy = `CAST(price_amount AS REAL) ${sortOrder.toUpperCase()}`;
        break;
      case 'reputation':
        orderBy = `seller_reputation ${sortOrder.toUpperCase()}`;
        break;
      case 'popularity':
        orderBy = `views ${sortOrder.toUpperCase()}`;
        break;
      case 'rating':
        orderBy = `average_rating ${sortOrder.toUpperCase()}`;
        break;
      case 'newest':
      default:
        orderBy = `created_at ${sortOrder.toUpperCase()}`;
        break;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM marketplace_products ${whereClause}`;
    const countResult = this.db.prepare(countQuery).get(...params) as { total: number };

    // Get products
    const productsQuery = `
      SELECT * FROM marketplace_products 
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const rows = this.db.prepare(productsQuery).all(...params, limit, offset) as any[];
    const products = rows.map(row => this.mapRowToProduct(row));

    // Get filter options
    const filters = await this.getFilterOptions();

    return {
      products,
      total: countResult.total,
      page,
      limit,
      hasMore: offset + products.length < countResult.total,
      filters
    };
  }

  /**
   * Get products by seller
   */
  async getProductsBySeller(sellerId: string, options: {
    page?: number;
    limit?: number;
    availability?: string[];
  } = {}): Promise<ProductListResponse> {
    const { page = 1, limit = 20, availability = ['available'] } = options;
    const offset = (page - 1) * limit;

    const availabilityPlaceholders = availability.map(() => '?').join(',');
    const params = [sellerId, ...availability];

    const countQuery = `
      SELECT COUNT(*) as total FROM marketplace_products 
      WHERE seller_anonymous_id = ? AND availability IN (${availabilityPlaceholders})
    `;
    const countResult = this.db.prepare(countQuery).get(...params) as { total: number };

    const sellerQuery = `
      SELECT * FROM marketplace_products 
      WHERE seller_anonymous_id = ? AND availability IN (${availabilityPlaceholders})
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = this.db.prepare(sellerQuery).all(...params, limit, offset) as any[];
    const products = rows.map(row => this.mapRowToProduct(row));

    const filters = await this.getFilterOptions();

    return {
      products,
      total: countResult.total,
      page,
      limit,
      hasMore: offset + products.length < countResult.total,
      filters
    };
  }

  /**
   * Update product statistics
   */
  async updateProductStats(productId: string, stats: {
    views?: number;
    favorites?: number;
    purchases?: number;
    reviews?: number;
    averageRating?: number;
  }): Promise<void> {
    const updateFields: string[] = [];
    const params: any[] = [];

    if (stats.views !== undefined) {
      updateFields.push('views = views + ?');
      params.push(stats.views);
    }

    if (stats.favorites !== undefined) {
      updateFields.push('favorites = favorites + ?');
      params.push(stats.favorites);
    }

    if (stats.purchases !== undefined) {
      updateFields.push('purchases = purchases + ?');
      params.push(stats.purchases);
    }

    if (stats.reviews !== undefined) {
      updateFields.push('reviews = reviews + ?');
      params.push(stats.reviews);
    }

    if (stats.averageRating !== undefined) {
      updateFields.push('average_rating = ?');
      params.push(stats.averageRating);
    }

    if (updateFields.length > 0) {
      params.push(productId);
      const query = `
        UPDATE marketplace_products 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;
      
      this.db.prepare(query).run(...params);
    }
  }

  /**
   * Get product statistics
   */
  async getProductStats(): Promise<ProductStats> {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as totalProducts,
        COUNT(CASE WHEN availability = 'available' THEN 1 END) as activeProducts,
        COUNT(DISTINCT category) as totalCategories,
        AVG(CASE WHEN price_currency = 'DOT' THEN CAST(price_amount AS REAL) END) as avgPriceDOT,
        AVG(CASE WHEN price_currency = 'KSM' THEN CAST(price_amount AS REAL) END) as avgPriceKSM,
        COUNT(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 END) as recentListings
      FROM marketplace_products
    `).get() as any;

    // Get top categories
    const topCategories = this.db.prepare(`
      SELECT category, COUNT(*) as count
      FROM marketplace_products
      WHERE availability = 'available'
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `).all() as any[];

    return {
      totalProducts: stats.totalProducts || 0,
      activeProducts: stats.activeProducts || 0,
      totalCategories: stats.totalCategories || 0,
      averagePrice: {
        DOT: Math.round((stats.avgPriceDOT || 0) * 100) / 100,
        KSM: Math.round((stats.avgPriceKSM || 0) * 100) / 100
      },
      topCategories: topCategories.map(cat => ({
        category: cat.category,
        count: cat.count
      })),
      recentListings: stats.recentListings || 0
    };
  }

  /**
   * Get filter options for search
   */
  private async getFilterOptions(): Promise<ProductListResponse['filters']> {
    const categories = this.db.prepare(`
      SELECT DISTINCT category FROM marketplace_products 
      WHERE availability = 'available'
      ORDER BY category
    `).all() as any[];

    const conditions = this.db.prepare(`
      SELECT DISTINCT condition FROM marketplace_products 
      WHERE availability = 'available'
      ORDER BY condition
    `).all() as any[];

    const priceRange = this.db.prepare(`
      SELECT 
        MIN(CAST(price_amount AS REAL)) as min,
        MAX(CAST(price_amount AS REAL)) as max
      FROM marketplace_products 
      WHERE availability = 'available'
    `).get() as any;

    return {
      categories: categories.map(cat => cat.category),
      priceRange: {
        min: priceRange.min || 0,
        max: priceRange.max || 1000
      },
      conditions: conditions.map(cond => cond.condition),
      availability: ['available', 'sold', 'reserved']
    };
  }

  /**
   * Get seller information
   */
  private async getSellerInfo(sellerId: string): Promise<{
    reputation: number;
    walletAddress?: string;
    displayName?: string;
  } | null> {
    const query = `
      SELECT reputation, wallet_address, temp_id as displayName
      FROM anonymous_users 
      WHERE id = ?
    `;
    
    const row = this.db.prepare(query).get(sellerId) as any;
    if (!row) return null;

    return {
      reputation: row.reputation,
      walletAddress: row.wallet_address,
      displayName: row.displayName
    };
  }

  /**
   * Convert crypto amount to USD (placeholder)
   */
  private async convertToUSD(amount: string, currency: 'DOT' | 'KSM'): Promise<number> {
    // This would integrate with the existing price service
    // For now, return a placeholder value
    const pricePerUnit = currency === 'DOT' ? 3.9 : 13.6; // Placeholder prices
    return parseFloat(amount) * pricePerUnit;
  }

  /**
   * Generate IPFS hash (placeholder)
   */
  private async generateIPFSHash(_product: CreateMarketplaceProductRequest): Promise<string> {
    // This would integrate with IPFS service
    // For now, return a placeholder hash
    return `Qm${Math.random().toString(36).substr(2, 44)}`;
  }

  /**
   * Map database row to MarketplaceProduct object
   */
  private mapRowToProduct(row: any): MarketplaceProduct {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      images: JSON.parse(row.images || '[]'),
      price: {
        amount: row.price_amount,
        currency: row.price_currency,
        usdValue: row.price_usd_value
      },
      seller: {
        anonymousId: row.seller_anonymous_id,
        reputation: row.seller_reputation,
        walletAddress: row.seller_wallet_address,
        displayName: row.seller_display_name
      },
      category: row.category,
      subcategory: row.subcategory,
      tags: JSON.parse(row.tags || '[]'),
      availability: row.availability,
      condition: row.condition,
      shipping: {
        available: Boolean(row.shipping_available),
        cost: row.shipping_cost_amount ? {
          amount: row.shipping_cost_amount,
          currency: row.shipping_cost_currency
        } : undefined,
        estimatedDays: row.shipping_estimated_days,
        regions: JSON.parse(row.shipping_regions || '[]')
      },
      digitalDelivery: {
        available: Boolean(row.digital_delivery_available),
        method: row.digital_delivery_method,
        instructions: row.digital_delivery_instructions
      },
      blockchain: {
        verified: Boolean(row.blockchain_verified),
        transactionHash: row.blockchain_transaction_hash,
        blockNumber: row.blockchain_block_number,
        chainId: row.blockchain_chain_id
      },
      metadata: {
        ipfsHash: row.ipfs_metadata_hash,
        version: row.metadata_version,
        lastUpdated: new Date(row.metadata_last_updated)
      },
      stats: {
        views: row.views,
        favorites: row.favorites,
        purchases: row.purchases,
        reviews: row.reviews,
        averageRating: row.average_rating
      },
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined
    };
  }
}
