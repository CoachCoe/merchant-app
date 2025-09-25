import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { DatabaseService } from '../../../src/services/databaseService.js';
import Database from 'better-sqlite3';

// Mock the logger
jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  let db: Database.Database;

  beforeEach(() => {
    // Use in-memory database for tests
    process.env.DATABASE_PATH = ':memory:';
    databaseService = DatabaseService.getInstance();
    db = databaseService.getDatabase();
  });

  afterEach(() => {
    // Clean up database
    db.close();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create database instance', () => {
      expect(databaseService).toBeDefined();
      expect(db).toBeDefined();
    });

    it('should be a singleton', () => {
      const instance1 = DatabaseService.getInstance();
      const instance2 = DatabaseService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('database schema', () => {
    it('should have categories table', () => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'").get();
      expect(tables).toBeDefined();
    });

    it('should have products table', () => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='products'").get();
      expect(tables).toBeDefined();
    });

    it('should have carts table', () => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='carts'").get();
      expect(tables).toBeDefined();
    });

    it('should have cart_items table', () => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cart_items'").get();
      expect(tables).toBeDefined();
    });

    it('should have orders table', () => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='orders'").get();
      expect(tables).toBeDefined();
    });
  });

  describe('default data', () => {
    it('should have default categories', () => {
      const categories = db.prepare('SELECT * FROM categories').all();
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should have sample products', () => {
      const products = db.prepare('SELECT * FROM products').all();
      expect(products.length).toBeGreaterThan(0);
    });
  });

  describe('database operations', () => {
    it('should insert and retrieve data', () => {
      const insert = db.prepare('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)');
      const select = db.prepare('SELECT * FROM categories WHERE id = ?');
      
      const testId = 'test-category';
      const testName = 'Test Category';
      const testDescription = 'Test Description';
      
      insert.run(testId, testName, testDescription);
      const result = select.get(testId) as any;
      
      expect(result).toBeDefined();
      expect(result.id).toBe(testId);
      expect(result.name).toBe(testName);
      expect(result.description).toBe(testDescription);
    });

    it('should handle foreign key constraints', () => {
      const insertProduct = db.prepare(`
        INSERT INTO products (id, name, description, price, category, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const testProductId = 'test-product';
      const testCategoryId = 'test-category';
      
      // This should fail due to foreign key constraint
      expect(() => {
        insertProduct.run(testProductId, 'Test Product', 'Test Description', 1000, testCategoryId, 1);
      }).toThrow();
    });

    it('should handle transactions', () => {
      const insertCategory = db.prepare('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)');
      const insertProduct = db.prepare(`
        INSERT INTO products (id, name, description, price, category, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const transaction = db.transaction(() => {
        insertCategory.run('test-category-2', 'Test Category 2', 'Test Description 2');
        insertProduct.run('test-product-2', 'Test Product 2', 'Test Description 2', 2000, 'test-category-2', 1);
      });
      
      expect(() => transaction()).not.toThrow();
      
      // Verify data was inserted
      const category = db.prepare('SELECT * FROM categories WHERE id = ?').get('test-category-2');
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get('test-product-2');
      
      expect(category).toBeDefined();
      expect(product).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle invalid SQL gracefully', () => {
      expect(() => {
        db.prepare('INVALID SQL STATEMENT').run();
      }).toThrow();
    });

    it('should handle constraint violations', () => {
      const insert = db.prepare('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)');
      
      // Insert first time should succeed
      insert.run('duplicate-test', 'Test', 'Test');
      
      // Insert second time should fail due to unique constraint
      expect(() => {
        insert.run('duplicate-test', 'Test', 'Test');
      }).toThrow();
    });
  });
});
