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
    // Stores table (for merchant profiles)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS stores (
        id TEXT PRIMARY KEY,
        owner_wallet_address TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        ipfs_profile_hash TEXT,
        description TEXT,
        logo_url TEXT,
        banner_url TEXT,
        contact_email TEXT,
        contact_website TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

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

    // Products table (3bae marketplace model with on-chain registry)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        on_chain_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        price_hollar INTEGER NOT NULL,
        category_id TEXT,
        images TEXT,

        seller_wallet_address TEXT NOT NULL,
        store_id TEXT,

        ipfs_metadata_hash TEXT NOT NULL,
        blockchain_verified BOOLEAN DEFAULT 0,
        registry_tx_hash TEXT,
        block_number INTEGER,

        digital_delivery_type TEXT,
        digital_delivery_instructions TEXT,

        variants TEXT,
        tags TEXT,

        views INTEGER DEFAULT 0,
        purchases INTEGER DEFAULT 0,

        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (store_id) REFERENCES stores(id)
      )
    `);

    // Purchases table (records direct wallet-to-wallet payments)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS purchases (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        buyer_wallet_address TEXT NOT NULL,
        seller_wallet_address TEXT NOT NULL,
        amount_hollar INTEGER NOT NULL,
        payment_tx_hash TEXT NOT NULL UNIQUE,
        block_number INTEGER,
        delivery_token TEXT,
        token_expires_at DATETIME,
        delivered_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
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

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_stores_wallet ON stores(owner_wallet_address);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
      CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_wallet_address);
      CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
      CREATE INDEX IF NOT EXISTS idx_products_on_chain ON products(on_chain_id);
      CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON purchases(buyer_wallet_address);
      CREATE INDEX IF NOT EXISTS idx_purchases_seller ON purchases(seller_wallet_address);
      CREATE INDEX IF NOT EXISTS idx_purchases_tx ON purchases(payment_tx_hash);
    `);

    // Insert default categories if they don't exist
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    const defaultCategories = [
      { id: 'digital-goods', name: 'Digital Goods', description: 'Digital downloads and software', sortOrder: 1 },
      { id: 'apparel', name: 'Apparel', description: 'Clothing and merchandise', sortOrder: 2 },
      { id: 'electronics', name: 'Electronics', description: 'Electronic devices and accessories', sortOrder: 3 },
      { id: 'books', name: 'Books & Media', description: 'Books, music, and educational materials', sortOrder: 4 },
      { id: 'collectibles', name: 'Collectibles', description: 'NFTs, art, and collectible items', sortOrder: 5 }
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
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'NFT Digital Art Collection',
        description: 'Exclusive digital art NFT collection',
        priceHollar: 500000,
        images: JSON.stringify(['https://via.placeholder.com/300x300?text=NFT+Art']),
        categoryId: 'digital-goods',
        sellerWalletAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        ipfsMetadataHash: 'QmSampleHash1'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'Polkadot T-Shirt',
        description: 'Official Polkadot merchandise t-shirt',
        priceHollar: 25000,
        images: JSON.stringify(['https://via.placeholder.com/300x300?text=Polkadot+Tee']),
        categoryId: 'apparel',
        sellerWalletAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        ipfsMetadataHash: 'QmSampleHash2'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        title: 'Web3 Development Guide',
        description: 'Complete guide to Web3 development on Polkadot',
        priceHollar: 15000,
        images: JSON.stringify(['https://via.placeholder.com/300x300?text=Web3+Guide']),
        categoryId: 'books',
        sellerWalletAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        ipfsMetadataHash: 'QmSampleHash3'
      }
    ];

    const insertProduct = this.db.prepare(`
      INSERT OR IGNORE INTO products (
        id, title, description, price_hollar, images, category_id,
        seller_wallet_address, ipfs_metadata_hash, blockchain_verified,
        views, purchases, is_active, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    sampleProducts.forEach(product => {
      insertProduct.run(
        product.id,
        product.title,
        product.description,
        product.priceHollar,
        product.images,
        product.categoryId,
        product.sellerWalletAddress,
        product.ipfsMetadataHash,
        0,
        0,
        0,
        1,
        now,
        now
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
