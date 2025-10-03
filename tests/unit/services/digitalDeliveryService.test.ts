import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { DigitalDeliveryService } from '../../../src/services/digitalDeliveryService';
import { DatabaseService } from '../../../src/services/databaseService';

describe('DigitalDeliveryService', () => {
  let deliveryService: DigitalDeliveryService;
  let dbService: DatabaseService;

  beforeEach(() => {
    dbService = DatabaseService.getInstance();
    deliveryService = new DigitalDeliveryService();
  });

  afterEach(() => {
    // Clean up test data
    const db = dbService.getDatabase();
    db.prepare('DELETE FROM delivery_tokens').run();
    db.prepare('DELETE FROM purchases').run();
  });

  describe('generateDeliveryToken', () => {
    beforeEach(() => {
      const db = dbService.getDatabase();

      // Create test product (use existing category 'digital-goods')
      db.prepare(`
        INSERT OR IGNORE INTO products (
          id, title, description, price_hollar, category_id,
          seller_wallet_address, ipfs_metadata_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('product-456', 'Test', 'Desc', 100, 'digital-goods', '0xSeller', 'QmTest');

      // Create test purchase
      db.prepare(`
        INSERT OR IGNORE INTO purchases (
          id, product_id, buyer_wallet_address, seller_wallet_address,
          amount_hollar, payment_tx_hash
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run('purchase-123', 'product-456', '0xBuyerAddress', '0xSeller', 100, '0xtx');
    });

    it('should generate a 64-character hex token', () => {
      const token = deliveryService.generateDeliveryToken(
        'purchase-123',
        'product-456',
        '0xBuyerAddress',
        7
      );

      expect(token).toBeDefined();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should store token in database with correct expiration', () => {
      const purchaseId = 'purchase-123';
      const productId = 'product-456';
      const buyerAddress = '0xBuyerAddress';

      const token = deliveryService.generateDeliveryToken(
        purchaseId,
        productId,
        buyerAddress,
        7
      );

      const db = dbService.getDatabase();
      const record = db.prepare(`
        SELECT * FROM delivery_tokens WHERE token = ?
      `).get(token) as any;

      expect(record).toBeDefined();
      expect(record.purchase_id).toBe(purchaseId);
      expect(record.product_id).toBe(productId);
      expect(record.buyer_wallet_address).toBe(buyerAddress);
      expect(record.redeemed_at).toBeNull();

      const expiresAt = new Date(record.expires_at);
      const now = new Date();
      const daysDiff = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(6);
      expect(daysDiff).toBeLessThanOrEqual(7);
    });

    it('should support custom validity periods', () => {
      const token = deliveryService.generateDeliveryToken(
        'purchase-123',
        'product-456',
        '0xBuyerAddress',
        30 // 30 days
      );

      const db = dbService.getDatabase();
      const record = db.prepare(`
        SELECT expires_at FROM delivery_tokens WHERE token = ?
      `).get(token) as any;

      const expiresAt = new Date(record.expires_at);
      const now = new Date();
      const daysDiff = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(29);
      expect(daysDiff).toBeLessThanOrEqual(30);
    });
  });

  describe('redeemDeliveryToken', () => {
    it('should return delivery details for valid token', async () => {
      // Setup: Create product and purchase
      const db = dbService.getDatabase();

      db.prepare(`
        INSERT OR IGNORE INTO products (
          id, title, description, price_hollar, category_id,
          seller_wallet_address, digital_delivery_type,
          digital_delivery_instructions, ipfs_metadata_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'prod-redeem-1',
        'Test Product',
        'Test description',
        100000,
        'digital-goods',
        '0xSellerAddress',
        'ipfs',
        'Download from IPFS',
        'QmTestHash123'
      );

      db.prepare(`
        INSERT OR IGNORE INTO purchases (
          id, product_id, buyer_wallet_address, seller_wallet_address,
          amount_hollar, payment_tx_hash
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        'purchase-redeem-1',
        'prod-redeem-1',
        '0xBuyerAddress',
        '0xSellerAddress',
        100000,
        '0xtxhash-redeem-1'
      );

      const token = deliveryService.generateDeliveryToken(
        'purchase-redeem-1',
        'prod-redeem-1',
        '0xBuyerAddress',
        7
      );

      const deliveryDetails = await deliveryService.redeemDeliveryToken(token);

      expect(deliveryDetails).toBeDefined();
      expect(deliveryDetails?.productName).toBe('Test Product');
      expect(deliveryDetails?.deliveryType).toBe('ipfs');
      expect(deliveryDetails?.deliveryInstructions).toBe('Download from IPFS');
      expect(deliveryDetails?.ipfsHash).toBe('QmTestHash123');
      expect(deliveryDetails?.deliveredAt).toBeDefined();
    });

    it('should mark token as redeemed after first use', async () => {
      const db = dbService.getDatabase();

      db.prepare(`
        INSERT OR IGNORE INTO products (
          id, title, description, price_hollar, category_id,
          seller_wallet_address, digital_delivery_type, ipfs_metadata_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'prod-redeem-2', 'Test', 'Desc', 100, 'digital-goods', '0xSeller', 'email', 'QmTest'
      );

      db.prepare(`
        INSERT OR IGNORE INTO purchases (
          id, product_id, buyer_wallet_address, seller_wallet_address,
          amount_hollar, payment_tx_hash
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run('purchase-redeem-2', 'prod-redeem-2', '0xBuyer', '0xSeller', 100, '0xtx-redeem-2');

      const token = deliveryService.generateDeliveryToken(
        'purchase-redeem-2',
        'prod-redeem-2',
        '0xBuyerAddress',
        7
      );

      // First redemption - should work
      const firstRedemption = await deliveryService.redeemDeliveryToken(token);
      expect(firstRedemption).toBeDefined();

      // Second redemption - should fail
      const secondRedemption = await deliveryService.redeemDeliveryToken(token);
      expect(secondRedemption).toBeNull();
    });

    it('should reject expired tokens', async () => {
      const db = dbService.getDatabase();

      db.prepare(`
        INSERT OR IGNORE INTO products (
          id, title, description, price_hollar, category_id,
          seller_wallet_address, digital_delivery_type, ipfs_metadata_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run('prod-expired-1', 'Test', 'Desc', 100, 'digital-goods', '0xSeller', 'email', 'QmTest');

      db.prepare(`
        INSERT OR IGNORE INTO purchases (
          id, product_id, buyer_wallet_address, seller_wallet_address,
          amount_hollar, payment_tx_hash
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run('purchase-expired-1', 'prod-expired-1', '0xBuyer', '0xSeller', 100, '0xtx-expired-1');

      const token = deliveryService.generateDeliveryToken(
        'purchase-expired-1',
        'prod-expired-1',
        '0xBuyerAddress',
        7
      );

      // Manually expire the token
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      db.prepare(`
        UPDATE delivery_tokens
        SET expires_at = ?
        WHERE token = ?
      `).run(yesterday.toISOString(), token);

      const deliveryDetails = await deliveryService.redeemDeliveryToken(token);
      expect(deliveryDetails).toBeNull();
    });

    it('should return null for invalid token', async () => {
      const deliveryDetails = await deliveryService.redeemDeliveryToken('invalid-token-123');
      expect(deliveryDetails).toBeNull();
    });
  });

  describe('getDeliveryStatus', () => {
    it('should return correct status for unredeemed token', () => {
      const db = dbService.getDatabase();

      db.prepare(`
        INSERT OR IGNORE INTO products (
          id, title, description, price_hollar, category_id,
          seller_wallet_address, ipfs_metadata_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('prod-status-1', 'Test', 'Desc', 100, 'digital-goods', '0xSeller', 'QmTest');

      db.prepare(`
        INSERT OR IGNORE INTO purchases (
          id, product_id, buyer_wallet_address, seller_wallet_address,
          amount_hollar, payment_tx_hash
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run('purchase-status-1', 'prod-status-1', '0xBuyer', '0xSeller', 100, '0xtx-status-1');

      deliveryService.generateDeliveryToken(
        'purchase-status-1',
        'prod-status-1',
        '0xBuyerAddress',
        7
      );

      const status = deliveryService.getDeliveryStatus('purchase-status-1');

      expect(status.hasToken).toBe(true);
      expect(status.tokenExpired).toBe(false);
      expect(status.delivered).toBe(false);
      expect(status.expiresAt).toBeDefined();
    });

    it('should return correct status when no token exists', () => {
      const status = deliveryService.getDeliveryStatus('nonexistent-purchase');

      expect(status.hasToken).toBe(false);
      expect(status.tokenExpired).toBe(false);
      expect(status.delivered).toBe(false);
      expect(status.expiresAt).toBeUndefined();
    });
  });

  describe('extendTokenExpiration', () => {
    it('should extend unredeemed token expiration', () => {
      const db = dbService.getDatabase();

      db.prepare(`
        INSERT OR IGNORE INTO products (
          id, title, description, price_hollar, category_id,
          seller_wallet_address, ipfs_metadata_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('prod-extend-2', 'Test', 'Desc', 100, 'digital-goods', '0xSeller', 'QmTest');

      db.prepare(`
        INSERT OR IGNORE INTO purchases (
          id, product_id, buyer_wallet_address, seller_wallet_address,
          amount_hollar, payment_tx_hash
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run('purchase-extend-2', 'prod-extend-2', '0xBuyer', '0xSeller', 100, '0xtx-extend-2');

      const token = deliveryService.generateDeliveryToken(
        'purchase-extend-2',
        'prod-extend-2',
        '0xBuyerAddress',
        7
      );

      const originalRecord = db.prepare(`
        SELECT expires_at FROM delivery_tokens WHERE token = ?
      `).get(token) as any;

      const extended = deliveryService.extendTokenExpiration(token, 7);
      expect(extended).toBe(true);

      const updatedRecord = db.prepare(`
        SELECT expires_at FROM delivery_tokens WHERE token = ?
      `).get(token) as any;

      const originalExpiry = new Date(originalRecord.expires_at);
      const newExpiry = new Date(updatedRecord.expires_at);

      const daysDiff = Math.floor(
        (newExpiry.getTime() - originalExpiry.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBe(7);
    });

    it('should not extend redeemed tokens', async () => {
      const db = dbService.getDatabase();

      db.prepare(`
        INSERT OR IGNORE INTO products (
          id, title, description, price_hollar, category_id,
          seller_wallet_address, digital_delivery_type, ipfs_metadata_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run('prod-extend-1', 'Test', 'Desc', 100, 'digital-goods', '0xSeller', 'email', 'QmTest');

      db.prepare(`
        INSERT OR IGNORE INTO purchases (
          id, product_id, buyer_wallet_address, seller_wallet_address,
          amount_hollar, payment_tx_hash
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run('purchase-extend-1', 'prod-extend-1', '0xBuyer', '0xSeller', 100, '0xtx-extend-1');

      const token = deliveryService.generateDeliveryToken(
        'purchase-extend-1',
        'prod-extend-1',
        '0xBuyerAddress',
        7
      );

      // Redeem the token
      await deliveryService.redeemDeliveryToken(token);

      // Try to extend - should fail
      const extended = deliveryService.extendTokenExpiration(token, 7);
      expect(extended).toBe(false);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should remove expired unredeemed tokens', () => {
      const db = dbService.getDatabase();

      db.prepare(`
        INSERT OR IGNORE INTO products (
          id, title, description, price_hollar, category_id,
          seller_wallet_address, ipfs_metadata_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('prod-cleanup-expired', 'Test', 'Desc', 100, 'digital-goods', '0xSeller', 'QmTest');

      db.prepare(`
        INSERT OR IGNORE INTO purchases (
          id, product_id, buyer_wallet_address, seller_wallet_address,
          amount_hollar, payment_tx_hash
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run('purchase-cleanup-expired', 'prod-cleanup-expired', '0xBuyer', '0xSeller', 100, '0xtx-cleanup-exp');

      const token = deliveryService.generateDeliveryToken(
        'purchase-cleanup-expired',
        'prod-cleanup-expired',
        '0xBuyerAddress',
        7
      );

      // Manually expire the token
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      db.prepare(`
        UPDATE delivery_tokens
        SET expires_at = ?
        WHERE token = ?
      `).run(yesterday.toISOString(), token);

      const removedCount = deliveryService.cleanupExpiredTokens();
      expect(removedCount).toBe(1);

      const remainingTokens = db.prepare(`
        SELECT COUNT(*) as count FROM delivery_tokens
      `).get() as any;

      expect(remainingTokens.count).toBe(0);
    });

    it('should not remove valid or redeemed tokens', async () => {
      const db = dbService.getDatabase();

      db.prepare(`
        INSERT OR IGNORE INTO products (
          id, title, description, price_hollar, category_id,
          seller_wallet_address, digital_delivery_type, ipfs_metadata_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run('prod-cleanup-1', 'Test', 'Desc', 100, 'digital-goods', '0xSeller', 'email', 'QmTest');

      db.prepare(`
        INSERT OR IGNORE INTO purchases (
          id, product_id, buyer_wallet_address, seller_wallet_address,
          amount_hollar, payment_tx_hash
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run('purchase-cleanup-1', 'prod-cleanup-1', '0xBuyer', '0xSeller', 100, '0xtx-cleanup-1');

      // Create valid token
      const validToken = deliveryService.generateDeliveryToken(
        'purchase-cleanup-1',
        'prod-cleanup-1',
        '0xBuyerAddress',
        7
      );

      // Create and redeem another token
      db.prepare(`
        INSERT OR IGNORE INTO purchases (
          id, product_id, buyer_wallet_address, seller_wallet_address,
          amount_hollar, payment_tx_hash
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run('purchase-cleanup-2', 'prod-cleanup-1', '0xBuyer2', '0xSeller', 100, '0xtx-cleanup-2');

      const redeemedToken = deliveryService.generateDeliveryToken(
        'purchase-cleanup-2',
        'prod-cleanup-1',
        '0xBuyer2',
        7
      );

      await deliveryService.redeemDeliveryToken(redeemedToken);

      // Cleanup should remove nothing
      const removedCount = deliveryService.cleanupExpiredTokens();
      expect(removedCount).toBe(0);

      const remainingTokens = db.prepare(`
        SELECT COUNT(*) as count FROM delivery_tokens
      `).get() as any;

      expect(remainingTokens.count).toBe(2);
    });
  });

  describe('getDeliveryUrl', () => {
    it('should generate correct delivery URL', () => {
      const token = 'abc123def456';
      const url = deliveryService.getDeliveryUrl(token, 'https://3bay.xyz');

      expect(url).toBe('https://3bay.xyz/delivery/abc123def456');
    });

    it('should use default URL from environment', () => {
      const token = 'abc123def456';
      const url = deliveryService.getDeliveryUrl(token);

      expect(url).toContain('/delivery/abc123def456');
    });
  });
});
