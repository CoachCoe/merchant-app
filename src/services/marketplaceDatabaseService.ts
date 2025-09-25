/**
 * Enhanced Database Service for Web3 Marketplace
 * Extends the existing database with marketplace-specific tables and functionality
 */

import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';
import { DatabaseService } from './databaseService.js';


export class MarketplaceDatabaseService {
  private static marketplaceInstance: MarketplaceDatabaseService;
  private db: Database.Database;

  private constructor() {
    // Get the existing database instance
    this.db = DatabaseService.getInstance().getDatabase();
    this.initializeMarketplaceTables();
    logger.info('Marketplace database service initialized');
  }

  public static getInstance(): MarketplaceDatabaseService {
    if (!MarketplaceDatabaseService.marketplaceInstance) {
      MarketplaceDatabaseService.marketplaceInstance = new MarketplaceDatabaseService();
    }
    return MarketplaceDatabaseService.marketplaceInstance;
  }

  public getDatabase(): Database.Database {
    return this.db;
  }

  private initializeMarketplaceTables(): void {
    const db = this.getDatabase();

    // Anonymous Users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS anonymous_users (
        id TEXT PRIMARY KEY,
        temp_id TEXT UNIQUE NOT NULL,
        wallet_address TEXT,
        reputation REAL DEFAULT 50.0,
        is_verified BOOLEAN DEFAULT 0,
        total_transactions INTEGER DEFAULT 0,
        successful_transactions INTEGER DEFAULT 0,
        dispute_count INTEGER DEFAULT 0,
        preferences TEXT, -- JSON string
        privacy_settings TEXT, -- JSON string
        encrypted_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_active DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reputation Events table
    db.exec(`
      CREATE TABLE IF NOT EXISTS reputation_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('transaction_completed', 'dispute_resolved', 'review_received', 'penalty_applied')),
        value REAL NOT NULL,
        description TEXT NOT NULL,
        transaction_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES anonymous_users(id) ON DELETE CASCADE
      )
    `);

    // Privacy Sessions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS privacy_sessions (
        id TEXT PRIMARY KEY,
        session_hash TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        encrypted_data TEXT,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        user_agent TEXT,
        FOREIGN KEY (user_id) REFERENCES anonymous_users(id) ON DELETE CASCADE
      )
    `);

    // Enhanced Products table (marketplace version)
    db.exec(`
      CREATE TABLE IF NOT EXISTS marketplace_products (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        images TEXT NOT NULL, -- JSON array of IPFS hashes
        price_amount TEXT NOT NULL,
        price_currency TEXT NOT NULL CHECK (price_currency IN ('DOT', 'KSM')),
        price_usd_value REAL,
        seller_anonymous_id TEXT NOT NULL,
        seller_reputation REAL DEFAULT 50.0,
        seller_wallet_address TEXT,
        seller_display_name TEXT,
        category TEXT NOT NULL,
        subcategory TEXT,
        tags TEXT, -- JSON array
        availability TEXT DEFAULT 'available' CHECK (availability IN ('available', 'sold', 'reserved', 'draft')),
        condition TEXT DEFAULT 'new' CHECK (condition IN ('new', 'used', 'refurbished')),
        shipping_available BOOLEAN DEFAULT 0,
        shipping_cost_amount TEXT,
        shipping_cost_currency TEXT CHECK (shipping_cost_currency IN ('DOT', 'KSM')),
        shipping_estimated_days INTEGER,
        shipping_regions TEXT, -- JSON array
        digital_delivery_available BOOLEAN DEFAULT 0,
        digital_delivery_method TEXT CHECK (digital_delivery_method IN ('email', 'download', 'nft')),
        digital_delivery_instructions TEXT,
        blockchain_verified BOOLEAN DEFAULT 0,
        blockchain_transaction_hash TEXT,
        blockchain_block_number INTEGER,
        blockchain_chain_id TEXT,
        ipfs_metadata_hash TEXT NOT NULL,
        metadata_version INTEGER DEFAULT 1,
        metadata_last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        views INTEGER DEFAULT 0,
        favorites INTEGER DEFAULT 0,
        purchases INTEGER DEFAULT 0,
        reviews INTEGER DEFAULT 0,
        average_rating REAL DEFAULT 0.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        FOREIGN KEY (seller_anonymous_id) REFERENCES anonymous_users(id)
      )
    `);

    // Marketplace Transactions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS marketplace_transactions (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        buyer_anonymous_id TEXT NOT NULL,
        buyer_wallet_address TEXT NOT NULL,
        buyer_reputation REAL DEFAULT 50.0,
        seller_anonymous_id TEXT NOT NULL,
        seller_wallet_address TEXT NOT NULL,
        seller_reputation REAL DEFAULT 50.0,
        escrow_address TEXT NOT NULL,
        escrow_amount TEXT NOT NULL,
        escrow_currency TEXT NOT NULL CHECK (escrow_currency IN ('DOT', 'KSM')),
        escrow_usd_value REAL NOT NULL,
        escrow_release_conditions TEXT, -- JSON array
        product_title TEXT NOT NULL,
        product_price TEXT NOT NULL,
        product_currency TEXT NOT NULL,
        product_images TEXT, -- JSON array
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'escrowed', 'shipped', 'delivered', 'completed', 'disputed', 'refunded', 'cancelled')),
        payment_transaction_hash TEXT NOT NULL,
        payment_block_number INTEGER NOT NULL,
        payment_chain_id TEXT NOT NULL,
        payment_gas_used TEXT,
        payment_gas_price TEXT,
        payment_timestamp DATETIME NOT NULL,
        delivery_method TEXT NOT NULL CHECK (delivery_method IN ('physical', 'digital')),
        tracking_number TEXT,
        estimated_delivery DATETIME,
        actual_delivery DATETIME,
        delivery_proof TEXT, -- IPFS hash
        dispute_id TEXT,
        refund_amount TEXT,
        refund_currency TEXT,
        refund_reason TEXT,
        refund_transaction_hash TEXT,
        refund_block_number INTEGER,
        refund_timestamp DATETIME,
        refund_processed_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (product_id) REFERENCES marketplace_products(id),
        FOREIGN KEY (buyer_anonymous_id) REFERENCES anonymous_users(id),
        FOREIGN KEY (seller_anonymous_id) REFERENCES anonymous_users(id)
      )
    `);

    // Transaction Events table
    db.exec(`
      CREATE TABLE IF NOT EXISTS transaction_events (
        id TEXT PRIMARY KEY,
        transaction_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('created', 'payment_sent', 'escrowed', 'shipped', 'delivered', 'disputed', 'resolved', 'refunded', 'completed')),
        description TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        actor TEXT NOT NULL CHECK (actor IN ('buyer', 'seller', 'system', 'arbitrator')),
        metadata TEXT, -- JSON object
        FOREIGN KEY (transaction_id) REFERENCES marketplace_transactions(id) ON DELETE CASCADE
      )
    `);

    // Disputes table
    db.exec(`
      CREATE TABLE IF NOT EXISTS disputes (
        id TEXT PRIMARY KEY,
        transaction_id TEXT NOT NULL,
        reason TEXT NOT NULL CHECK (reason IN ('item_not_received', 'item_not_as_described', 'seller_not_responding', 'other')),
        description TEXT NOT NULL,
        arbitrator_address TEXT,
        arbitrator_reputation REAL,
        resolution_decision TEXT CHECK (resolution_decision IN ('buyer_wins', 'seller_wins', 'partial_refund')),
        resolution_amount TEXT,
        resolution_reasoning TEXT,
        resolution_timestamp DATETIME,
        status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'escalated')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        FOREIGN KEY (transaction_id) REFERENCES marketplace_transactions(id) ON DELETE CASCADE
      )
    `);

    // Dispute Evidence table
    db.exec(`
      CREATE TABLE IF NOT EXISTS dispute_evidence (
        id TEXT PRIMARY KEY,
        dispute_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('image', 'document', 'message', 'transaction')),
        data TEXT NOT NULL, -- IPFS hash or transaction hash
        description TEXT NOT NULL,
        submitted_by TEXT NOT NULL CHECK (submitted_by IN ('buyer', 'seller')),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE
      )
    `);

    // Product Reviews table
    db.exec(`
      CREATE TABLE IF NOT EXISTS product_reviews (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        transaction_id TEXT NOT NULL,
        reviewer_anonymous_id TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title TEXT,
        comment TEXT,
        verified_purchase BOOLEAN DEFAULT 1,
        helpful_votes INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES marketplace_products(id) ON DELETE CASCADE,
        FOREIGN KEY (transaction_id) REFERENCES marketplace_transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewer_anonymous_id) REFERENCES anonymous_users(id)
      )
    `);

    // Create indexes for better performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_anonymous_users_temp_id ON anonymous_users(temp_id);
      CREATE INDEX IF NOT EXISTS idx_anonymous_users_wallet ON anonymous_users(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_anonymous_users_reputation ON anonymous_users(reputation);
      CREATE INDEX IF NOT EXISTS idx_reputation_events_user ON reputation_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_privacy_sessions_hash ON privacy_sessions(session_hash);
      CREATE INDEX IF NOT EXISTS idx_privacy_sessions_user ON privacy_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_marketplace_products_seller ON marketplace_products(seller_anonymous_id);
      CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON marketplace_products(category);
      CREATE INDEX IF NOT EXISTS idx_marketplace_products_availability ON marketplace_products(availability);
      CREATE INDEX IF NOT EXISTS idx_marketplace_products_price ON marketplace_products(price_currency, price_amount);
      CREATE INDEX IF NOT EXISTS idx_marketplace_products_created ON marketplace_products(created_at);
      CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_buyer ON marketplace_transactions(buyer_anonymous_id);
      CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_seller ON marketplace_transactions(seller_anonymous_id);
      CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_status ON marketplace_transactions(status);
      CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_created ON marketplace_transactions(created_at);
      CREATE INDEX IF NOT EXISTS idx_transaction_events_transaction ON transaction_events(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_disputes_transaction ON disputes(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
      CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
      CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
    `);

    // Initialize marketplace default data
    this.initializeMarketplaceDefaultData();
  }

  private initializeMarketplaceDefaultData(): void {
    const db = this.getDatabase();

    // Insert enhanced categories for marketplace
    const marketplaceCategories = [
      { id: 'digital-goods', name: 'Digital Goods', description: 'Software, NFTs, digital art, and virtual items', sortOrder: 1 },
      { id: 'electronics', name: 'Electronics', description: 'Electronic devices and accessories', sortOrder: 2 },
      { id: 'clothing', name: 'Clothing & Fashion', description: 'Apparel, shoes, and fashion accessories', sortOrder: 3 },
      { id: 'home-garden', name: 'Home & Garden', description: 'Home improvement, furniture, and garden supplies', sortOrder: 4 },
      { id: 'books-media', name: 'Books & Media', description: 'Books, music, movies, and educational materials', sortOrder: 5 },
      { id: 'sports-outdoors', name: 'Sports & Outdoors', description: 'Sports equipment, fitness gear, and outdoor equipment', sortOrder: 6 },
      { id: 'art-crafts', name: 'Art & Crafts', description: 'Handmade items, artwork, and craft supplies', sortOrder: 7 },
      { id: 'collectibles', name: 'Collectibles', description: 'Rare items, memorabilia, and collectible goods', sortOrder: 8 },
      { id: 'services', name: 'Services', description: 'Digital services, consulting, and professional services', sortOrder: 9 },
      { id: 'crypto-merchandise', name: 'Crypto Merchandise', description: 'Cryptocurrency-themed merchandise and accessories', sortOrder: 10 }
    ];

    const insertCategory = db.prepare(`
      INSERT OR IGNORE INTO categories (id, name, description, sort_order)
      VALUES (?, ?, ?, ?)
    `);

    marketplaceCategories.forEach(category => {
      insertCategory.run(category.id, category.name, category.description, category.sortOrder);
    });

    logger.info('Marketplace default categories initialized');
  }

  // Migration method to upgrade existing database
  public migrateToMarketplace(): void {
    const db = this.getDatabase();
    
    try {
      // Check if marketplace tables already exist
      const tablesExist = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='anonymous_users'
      `).get();

      if (!tablesExist) {
        logger.info('Starting marketplace database migration...');
        this.initializeMarketplaceTables();
        logger.info('Marketplace database migration completed successfully');
      } else {
        logger.info('Marketplace tables already exist, skipping migration');
      }
    } catch (error) {
      logger.error('Error during marketplace migration:', error);
      throw error;
    }
  }

  // Get database statistics
  public getMarketplaceStats(): any {
    const db = this.getDatabase();
    
    const stats = {
      users: db.prepare('SELECT COUNT(*) as count FROM anonymous_users').get(),
      products: db.prepare('SELECT COUNT(*) as count FROM marketplace_products').get(),
      transactions: db.prepare('SELECT COUNT(*) as count FROM marketplace_transactions').get(),
      disputes: db.prepare('SELECT COUNT(*) as count FROM disputes WHERE status != "resolved"').get(),
      totalValue: db.prepare(`
        SELECT 
          SUM(CASE WHEN escrow_currency = 'DOT' THEN CAST(escrow_amount AS REAL) ELSE 0 END) as dot_value,
          SUM(CASE WHEN escrow_currency = 'KSM' THEN CAST(escrow_amount AS REAL) ELSE 0 END) as ksm_value,
          SUM(escrow_usd_value) as usd_value
        FROM marketplace_transactions 
        WHERE status = 'completed'
      `).get()
    };

    return stats;
  }
}
