import { DatabaseService } from './databaseService.js';
import { Category, CreateCategoryRequest, UpdateCategoryRequest, CategoryListResponse } from '../models/Category.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

export class CategoryService {
  private db = DatabaseService.getInstance().getDatabase();

  // Get all categories
  async getCategories(includeInactive: boolean = false): Promise<CategoryListResponse> {
    let query = `
      SELECT id, name, description, sort_order as sortOrder, is_active as isActive, created_at as createdAt
      FROM categories
    `;

    if (!includeInactive) {
      query += ' WHERE is_active = 1';
    }

    query += ' ORDER BY sort_order ASC, name ASC';

    const rows = this.db.prepare(query).all() as any[];

    return {
      categories: rows.map(this.mapRowToCategory),
      total: rows.length
    };
  }

  // Get single category by ID
  async getCategoryById(id: string): Promise<Category | null> {
    const query = `
      SELECT id, name, description, sort_order as sortOrder, is_active as isActive, created_at as createdAt
      FROM categories
      WHERE id = ?
    `;

    const row = this.db.prepare(query).get(id) as any;
    return row ? this.mapRowToCategory(row) : null;
  }

  // Create new category
  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    const id = uuidv4();
    const sortOrder = data.sortOrder ?? await this.getNextSortOrder();

    const query = `
      INSERT INTO categories (id, name, description, sort_order)
      VALUES (?, ?, ?, ?)
    `;

    this.db.prepare(query).run(
      id,
      data.name,
      data.description || null,
      sortOrder
    );

    logger.info('Category created', { categoryId: id, name: data.name });
    const category = await this.getCategoryById(id);
    if (!category) {
      throw new Error('Failed to retrieve created category');
    }
    return category;
  }

  // Update category
  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category | null> {
    const existingCategory = await this.getCategoryById(id);
    if (!existingCategory) {
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
    if (data.sortOrder !== undefined) {
      updateFields.push('sort_order = ?');
      params.push(data.sortOrder);
    }
    if (data.isActive !== undefined) {
      updateFields.push('is_active = ?');
      params.push(data.isActive ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return existingCategory;
    }

    params.push(id);

    const query = `
      UPDATE categories 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    this.db.prepare(query).run(...params);

    logger.info('Category updated', { categoryId: id });
    return this.getCategoryById(id);
  }

  // Delete category
  async deleteCategory(id: string): Promise<boolean> {
    // Check if category has products
    const productCountQuery = 'SELECT COUNT(*) as count FROM products WHERE category_id = ?';
    const productCount = this.db.prepare(productCountQuery).get(id) as { count: number };

    if (productCount.count > 0) {
      throw new Error('Cannot delete category with existing products');
    }

    const query = 'DELETE FROM categories WHERE id = ?';
    const result = this.db.prepare(query).run(id);
    
    if (result.changes > 0) {
      logger.info('Category deleted', { categoryId: id });
      return true;
    }
    return false;
  }

  // Get next sort order value
  private async getNextSortOrder(): Promise<number> {
    const query = 'SELECT MAX(sort_order) as maxOrder FROM categories';
    const result = this.db.prepare(query).get() as { maxOrder: number | null };
    return (result.maxOrder ?? 0) + 1;
  }

  // Helper method to map database row to Category object
  private mapRowToCategory(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      sortOrder: row.sortOrder,
      isActive: Boolean(row.isActive),
      createdAt: new Date(row.createdAt)
    };
  }
}
