import { DatabaseService } from './databaseService.js';
import { Product, CreateProductRequest, UpdateProductRequest, ProductListResponse } from '../models/Product.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

export class ProductService {
  private db = DatabaseService.getInstance().getDatabase();

  async getProducts(options: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    isActive?: boolean;
    sellerWalletAddress?: string;
  } = {}): Promise<ProductListResponse> {
    const { page = 1, limit = 20, categoryId, search, isActive = true, sellerWalletAddress } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (isActive !== undefined) {
      whereClause += ' AND p.is_active = ?';
      params.push(isActive ? 1 : 0);
    }

    if (categoryId) {
      whereClause += ' AND p.category_id = ?';
      params.push(categoryId);
    }

    if (sellerWalletAddress) {
      whereClause += ' AND p.seller_wallet_address = ?';
      params.push(sellerWalletAddress);
    }

    if (search) {
      whereClause += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `;
    const countResult = this.db.prepare(countQuery).get(...params) as { total: number };

    const productsQuery = `
      SELECT
        p.id,
        p.on_chain_id as onChainId,
        p.title,
        p.description,
        p.price_hollar as priceHollar,
        p.category_id as categoryId,
        p.images,
        p.seller_wallet_address as sellerWalletAddress,
        p.store_id as storeId,
        p.ipfs_metadata_hash as ipfsMetadataHash,
        p.blockchain_verified as blockchainVerified,
        p.registry_tx_hash as registryTxHash,
        p.block_number as blockNumber,
        p.digital_delivery_type as digitalDeliveryType,
        p.digital_delivery_instructions as digitalDeliveryInstructions,
        p.variants,
        p.tags,
        p.views,
        p.purchases,
        p.is_active as isActive,
        p.created_at as createdAt,
        p.updated_at as updatedAt
      FROM products p
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const products = this.db.prepare(productsQuery).all(...params, limit, offset) as any[];

    return {
      products: products.map(this.mapRowToProduct),
      total: countResult.total,
      page,
      limit,
      hasMore: offset + products.length < countResult.total
    };
  }

  async getProductById(id: string): Promise<Product | null> {
    const query = `
      SELECT
        p.id,
        p.on_chain_id as onChainId,
        p.title,
        p.description,
        p.price_hollar as priceHollar,
        p.category_id as categoryId,
        p.images,
        p.seller_wallet_address as sellerWalletAddress,
        p.store_id as storeId,
        p.ipfs_metadata_hash as ipfsMetadataHash,
        p.blockchain_verified as blockchainVerified,
        p.registry_tx_hash as registryTxHash,
        p.block_number as blockNumber,
        p.digital_delivery_type as digitalDeliveryType,
        p.digital_delivery_instructions as digitalDeliveryInstructions,
        p.variants,
        p.tags,
        p.views,
        p.purchases,
        p.is_active as isActive,
        p.created_at as createdAt,
        p.updated_at as updatedAt
      FROM products p
      WHERE p.id = ?
    `;

    const row = this.db.prepare(query).get(id);

    if (!row) {
      return null;
    }

    return this.mapRowToProduct(row);
  }

  async createProduct(request: CreateProductRequest): Promise<Product> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const ipfsHash = request.ipfsMetadataHash || 'pending';

    const query = `
      INSERT INTO products (
        id,
        title,
        description,
        price_hollar,
        category_id,
        images,
        seller_wallet_address,
        store_id,
        ipfs_metadata_hash,
        blockchain_verified,
        digital_delivery_type,
        digital_delivery_instructions,
        variants,
        tags,
        views,
        purchases,
        is_active,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this.db.prepare(query).run(
      id,
      request.title,
      request.description,
      request.priceHollar,
      request.categoryId,
      JSON.stringify(request.images || []),
      request.sellerWalletAddress,
      request.storeId || null,
      ipfsHash,
      0,
      request.digitalDeliveryType || null,
      request.digitalDeliveryInstructions || null,
      request.variants ? JSON.stringify(request.variants) : null,
      request.tags ? JSON.stringify(request.tags) : null,
      0,
      0,
      1,
      now,
      now
    );

    logger.info('Product created', { id, title: request.title });

    const product = await this.getProductById(id);
    if (!product) {
      throw new Error('Failed to retrieve created product');
    }

    return product;
  }

  async updateProduct(id: string, request: UpdateProductRequest): Promise<Product> {
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

    if (request.priceHollar !== undefined) {
      updateFields.push('price_hollar = ?');
      params.push(request.priceHollar);
    }

    if (request.categoryId !== undefined) {
      updateFields.push('category_id = ?');
      params.push(request.categoryId);
    }

    if (request.images !== undefined) {
      updateFields.push('images = ?');
      params.push(JSON.stringify(request.images));
    }

    if (request.digitalDeliveryType !== undefined) {
      updateFields.push('digital_delivery_type = ?');
      params.push(request.digitalDeliveryType);
    }

    if (request.digitalDeliveryInstructions !== undefined) {
      updateFields.push('digital_delivery_instructions = ?');
      params.push(request.digitalDeliveryInstructions);
    }

    if (request.variants !== undefined) {
      updateFields.push('variants = ?');
      params.push(JSON.stringify(request.variants));
    }

    if (request.tags !== undefined) {
      updateFields.push('tags = ?');
      params.push(JSON.stringify(request.tags));
    }

    if (request.isActive !== undefined) {
      updateFields.push('is_active = ?');
      params.push(request.isActive ? 1 : 0);
    }

    if (updateFields.length === 0) {
      const product = await this.getProductById(id);
      if (!product) {
        throw new Error('Product not found');
      }
      return product;
    }

    updateFields.push('updated_at = ?');
    params.push(new Date().toISOString());

    const query = `
      UPDATE products
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    params.push(id);

    const result = this.db.prepare(query).run(...params);

    if (result.changes === 0) {
      throw new Error('Product not found');
    }

    logger.info('Product updated', { id });

    const product = await this.getProductById(id);
    if (!product) {
      throw new Error('Failed to retrieve updated product');
    }

    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    const query = 'UPDATE products SET is_active = 0 WHERE id = ?';
    const result = this.db.prepare(query).run(id);

    if (result.changes === 0) {
      throw new Error('Product not found');
    }

    logger.info('Product deactivated', { id });
  }

  async incrementViews(id: string): Promise<void> {
    const query = 'UPDATE products SET views = views + 1 WHERE id = ?';
    this.db.prepare(query).run(id);
  }

  private mapRowToProduct(row: any): Product {
    let images: string[] = [];
    try {
      images = row.images ? JSON.parse(row.images) : [];
    } catch (e) {
      images = row.images ? [row.images] : [];
    }

    let variants: Array<{ name: string; value: string; stock?: number }> | undefined;
    try {
      variants = row.variants ? JSON.parse(row.variants) : undefined;
    } catch (e) {
      variants = undefined;
    }

    let tags: string[] | undefined;
    try {
      tags = row.tags ? JSON.parse(row.tags) : undefined;
    } catch (e) {
      tags = undefined;
    }

    return {
      id: row.id,
      onChainId: row.onChainId || undefined,
      title: row.title,
      description: row.description,
      priceHollar: row.priceHollar,
      categoryId: row.categoryId,
      images,
      sellerWalletAddress: row.sellerWalletAddress,
      storeId: row.storeId || undefined,
      ipfsMetadataHash: row.ipfsMetadataHash,
      blockchainVerified: Boolean(row.blockchainVerified),
      registryTxHash: row.registryTxHash || undefined,
      blockNumber: row.blockNumber || undefined,
      digitalDeliveryType: row.digitalDeliveryType || undefined,
      digitalDeliveryInstructions: row.digitalDeliveryInstructions || undefined,
      variants,
      tags,
      views: row.views || 0,
      purchases: row.purchases || 0,
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }
}
