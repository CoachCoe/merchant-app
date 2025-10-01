import { DatabaseService } from './databaseService.js';
import { Product, CreateProductRequest, UpdateProductRequest, ProductListResponse } from '../models/Product.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

export class ProductService {
  private db = DatabaseService.getInstance().getDatabase();

  async getProducts(options: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    isActive?: boolean;
  } = {}): Promise<ProductListResponse> {
    const { page = 1, limit = 20, category, search, isActive = true } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (isActive !== undefined) {
      whereClause += ' AND p.is_active = ?';
      params.push(isActive ? 1 : 0);
    }

    if (category) {
      whereClause += ' AND p.category_id = ?';
      params.push(category);
    }

    if (search) {
      whereClause += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
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
        p.title,
        p.description,
        p.price,
        p.images,
        p.category_id as categoryId,
        p.seller_id as sellerId,
        p.seller_reputation as sellerReputation,
        p.seller_wallet_address as sellerWalletAddress,
        p.ipfs_metadata_hash as ipfsMetadataHash,
        p.blockchain_verified as blockchainVerified,
        p.is_active as isActive,
        p.created_at as createdAt,
        p.updated_at as updatedAt,
        c.name as categoryName
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
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
        p.title,
        p.description,
        p.price,
        p.images,
        p.category_id as categoryId,
        p.seller_id as sellerId,
        p.seller_reputation as sellerReputation,
        p.seller_wallet_address as sellerWalletAddress,
        p.ipfs_metadata_hash as ipfsMetadataHash,
        p.blockchain_verified as blockchainVerified,
        p.is_active as isActive,
        p.created_at as createdAt,
        p.updated_at as updatedAt,
        c.name as categoryName
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `;

    const row = this.db.prepare(query).get(id) as any;
    return row ? this.mapRowToProduct(row) : null;
  }

  async createProduct(data: CreateProductRequest): Promise<Product> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const imagesJson = typeof data.images === 'string'
      ? data.images
      : JSON.stringify(data.images);

    const query = `
      INSERT INTO products (id, title, description, price, images, category_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this.db.prepare(query).run(
      id,
      data.title,
      data.description,
      data.price,
      imagesJson,
      data.categoryId,
      now,
      now
    );

    logger.info('Product created', { productId: id, title: data.title });
    const product = await this.getProductById(id);
    if (!product) {
      throw new Error('Failed to retrieve created product');
    }
    return product;
  }

  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product | null> {
    const existingProduct = await this.getProductById(id);
    if (!existingProduct) {
      return null;
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
      updateFields.push('title = ?');
      params.push(data.title);
    }
    if (data.description !== undefined) {
      updateFields.push('description = ?');
      params.push(data.description);
    }
    if (data.price !== undefined) {
      updateFields.push('price = ?');
      params.push(data.price);
    }
    if (data.images !== undefined) {
      updateFields.push('images = ?');
      const imagesJson = typeof data.images === 'string'
        ? data.images
        : JSON.stringify(data.images);
      params.push(imagesJson);
    }
    if (data.categoryId !== undefined) {
      updateFields.push('category_id = ?');
      params.push(data.categoryId);
    }
    if (data.isActive !== undefined) {
      updateFields.push('is_active = ?');
      params.push(data.isActive ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return existingProduct;
    }

    updateFields.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    const query = `
      UPDATE products
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    this.db.prepare(query).run(...params);

    logger.info('Product updated', { productId: id });
    return this.getProductById(id);
  }

  async deleteProduct(id: string): Promise<boolean> {
    const query = 'DELETE FROM products WHERE id = ?';
    const result = this.db.prepare(query).run(id);

    if (result.changes > 0) {
      logger.info('Product deleted', { productId: id });
      return true;
    }
    return false;
  }

  private mapRowToProduct(row: any): Product {
    let images: string[] = [];
    try {
      images = row.images ? JSON.parse(row.images) : [];
    } catch (e) {
      images = [row.images].filter(Boolean);
    }

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      price: row.price,
      categoryId: row.categoryId,
      images,
      sellerId: row.sellerId,
      sellerReputation: row.sellerReputation,
      sellerWalletAddress: row.sellerWalletAddress,
      ipfsMetadataHash: row.ipfsMetadataHash,
      blockchainVerified: Boolean(row.blockchainVerified),
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }
}
