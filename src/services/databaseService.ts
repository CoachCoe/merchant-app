import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatabaseService {
  private static instance: DatabaseService;
  private db: Database.Database;

  private constructor() {
    // Use SQLite for development, can be configured for PostgreSQL in production
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/merchant.db');
    
    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
    } catch (error) {
      logger.error('Failed to create data directory', error);
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    
    this.initializeTables();
    logger.info(`Database initialized at: ${dbPath}`);
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private initializeTables(): void {
    // Categories table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        image TEXT,
        category_id TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    // Shopping carts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS carts (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Cart items table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id TEXT PRIMARY KEY,
        cart_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Orders table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT UNIQUE NOT NULL,
        cart_snapshot TEXT NOT NULL,
        subtotal INTEGER NOT NULL,
        tax INTEGER DEFAULT 0,
        total INTEGER NOT NULL,
        customer_email TEXT,
        customer_name TEXT,
        payment_status TEXT DEFAULT 'pending',
        transaction_hash TEXT,
        block_number INTEGER,
        chain_id TEXT,
        token_used TEXT CHECK (token_used IN ('DOT', 'KSM', 'USDC')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
      CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(payment_status);
      CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    `);

    // Insert default categories if they don't exist
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    const defaultCategories = [
      { id: 'electronics', name: 'Electronics', description: 'Electronic devices and accessories', sortOrder: 1 },
      { id: 'clothing', name: 'Clothing', description: 'Apparel and fashion items', sortOrder: 2 },
      { id: 'books', name: 'Books', description: 'Books and educational materials', sortOrder: 3 },
      { id: 'home', name: 'Home & Garden', description: 'Home improvement and garden supplies', sortOrder: 4 },
      { id: 'sports', name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear', sortOrder: 5 }
    ];

    const insertCategory = this.db.prepare(`
      INSERT OR IGNORE INTO categories (id, name, description, sort_order)
      VALUES (?, ?, ?, ?)
    `);

    defaultCategories.forEach(category => {
      insertCategory.run(category.id, category.name, category.description, category.sortOrder);
    });

    // Insert some sample products
    const sampleProducts = [
      {
        id: 'sample-1',
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 19999, // $199.99
        image: 'https://via.placeholder.com/300x300?text=Headphones',
        categoryId: 'electronics'
      },
      {
        id: 'sample-2',
        name: 'Cotton T-Shirt',
        description: 'Comfortable 100% cotton t-shirt in various colors',
        price: 2499, // $24.99
        image: 'https://via.placeholder.com/300x300?text=T-Shirt',
        categoryId: 'clothing'
      },
      {
        id: 'sample-3',
        name: 'Programming Book',
        description: 'Learn TypeScript programming from basics to advanced',
        price: 3999, // $39.99
        image: 'https://via.placeholder.com/300x300?text=Book',
        categoryId: 'books'
      }
    ];

    const insertProduct = this.db.prepare(`
      INSERT OR IGNORE INTO products (id, name, description, price, image, category_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    sampleProducts.forEach(product => {
      insertProduct.run(
        product.id,
        product.name,
        product.description,
        product.price,
        product.image,
        product.categoryId
      );
    });

    logger.info('Default categories and sample products initialized');
  }

  public getDatabase(): Database.Database {
    return this.db;
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      logger.info('Database connection closed');
    }
  }
}
