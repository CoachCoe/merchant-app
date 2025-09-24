import { DatabaseService } from './databaseService.js';
import { Product, CreateProductRequest, UpdateProductRequest, ProductListResponse } from '../models/Product.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

export class ProductService {
  private db = DatabaseService.getInstance().getDatabase();

  // Get all products with pagination and filtering
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
      whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `;
    const countResult = this.db.prepare(countQuery).get(...params) as { total: number };

    // Get products with category information
    const productsQuery = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image,
        p.category_id as category,
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

  // Get single product by ID
  async getProductById(id: string): Promise<Product | null> {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image,
        p.category_id as category,
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

  // Create new product
  async createProduct(data: CreateProductRequest): Promise<Product> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const query = `
      INSERT INTO products (id, name, description, price, image, category_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this.db.prepare(query).run(
      id,
      data.name,
      data.description,
      data.price,
      data.image,
      data.category,
      now,
      now
    );

    logger.info('Product created', { productId: id, name: data.name });
    const product = await this.getProductById(id);
    if (!product) {
      throw new Error('Failed to retrieve created product');
    }
    return product;
  }

  // Update product
  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product | null> {
    const existingProduct = await this.getProductById(id);
    if (!existingProduct) {
      return null;
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updateFields.push('name = ?');
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updateFields.push('description = ?');
      params.push(data.description);
    }
    if (data.price !== undefined) {
      updateFields.push('price = ?');
      params.push(data.price);
    }
    if (data.image !== undefined) {
      updateFields.push('image = ?');
      params.push(data.image);
    }
    if (data.category !== undefined) {
      updateFields.push('category_id = ?');
      params.push(data.category);
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

  // Delete product
  async deleteProduct(id: string): Promise<boolean> {
    const query = 'DELETE FROM products WHERE id = ?';
    const result = this.db.prepare(query).run(id);
    
    if (result.changes > 0) {
      logger.info('Product deleted', { productId: id });
      return true;
    }
    return false;
  }

  // Helper method to map database row to Product object
  private mapRowToProduct(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      image: row.image,
      category: row.category,
      isActive: Boolean(row.isActive),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }
}
