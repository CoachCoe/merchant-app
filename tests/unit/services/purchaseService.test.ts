import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PurchaseService } from '../../../src/services/purchaseService';
import { DatabaseService } from '../../../src/services/databaseService';

describe('PurchaseService', () => {
  let purchaseService: PurchaseService;
  let dbService: DatabaseService;

  beforeEach(() => {
    dbService = DatabaseService.getInstance();
    purchaseService = new PurchaseService();

    // Setup test product
    const db = dbService.getDatabase();
    db.prepare(`
      INSERT OR IGNORE INTO products (
        id, title, description, price_hollar, category_id,
        seller_wallet_address, digital_delivery_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'test-product-1',
      'Test Product',
      'Test description',
      100000,
      'digital-goods',
      '0xSellerAddress123',
      'email'
    );
  });

  afterEach(() => {
    const db = dbService.getDatabase();
    db.prepare('DELETE FROM delivery_tokens').run();
    db.prepare('DELETE FROM purchases').run();
  });

  describe('createPurchase', () => {
    it('should create purchase and generate delivery token', async () => {
      const purchaseRequest = {
        productId: 'test-product-1',
        buyerWalletAddress: '0xBuyerAddress456',
        sellerWalletAddress: '0xSellerAddress123',
        amountHollar: 100000,
        paymentTxHash: '0xtxhash789',
        blockNumber: 12345
      };

      const purchase = await purchaseService.createPurchase(purchaseRequest);

      expect(purchase).toBeDefined();
      expect(purchase.id).toBeDefined();
      expect(purchase.productId).toBe('test-product-1');
      expect(purchase.buyerWalletAddress).toBe('0xBuyerAddress456');
      expect(purchase.sellerWalletAddress).toBe('0xSellerAddress123');
      expect(purchase.amountHollar).toBe(100000);
      expect(purchase.paymentTxHash).toBe('0xtxhash789');
      expect(purchase.blockNumber).toBe(12345);

      // Check delivery token
      expect(purchase.deliveryToken).toBeDefined();
      expect(purchase.deliveryToken).toHaveLength(64);
      expect(purchase.deliveryUrl).toBeDefined();
      expect(purchase.deliveryUrl).toContain('/delivery/');
      expect(purchase.deliveryExpiresAt).toBeDefined();
    });

    it('should create purchase without block number', async () => {
      const purchaseRequest = {
        productId: 'test-product-1',
        buyerWalletAddress: '0xBuyerAddress456',
        sellerWalletAddress: '0xSellerAddress123',
        amountHollar: 100000,
        paymentTxHash: '0xtxhash789'
      };

      const purchase = await purchaseService.createPurchase(purchaseRequest);

      expect(purchase).toBeDefined();
      expect(purchase.blockNumber).toBeUndefined();
    });

    it('should set delivery token expiration to 7 days', async () => {
      const purchaseRequest = {
        productId: 'test-product-1',
        buyerWalletAddress: '0xBuyerAddress456',
        sellerWalletAddress: '0xSellerAddress123',
        amountHollar: 100000,
        paymentTxHash: '0xtxhash789'
      };

      const purchase = await purchaseService.createPurchase(purchaseRequest);

      const now = new Date();
      const expiryDate = purchase.deliveryExpiresAt!;
      const daysDiff = Math.floor(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysDiff).toBeGreaterThanOrEqual(6);
      expect(daysDiff).toBeLessThanOrEqual(7);
    });
  });

  describe('getPurchaseById', () => {
    it('should return purchase by ID', async () => {
      const created = await purchaseService.createPurchase({
        productId: 'test-product-1',
        buyerWalletAddress: '0xBuyer',
        sellerWalletAddress: '0xSeller',
        amountHollar: 100000,
        paymentTxHash: '0xtx123'
      });

      const retrieved = purchaseService.getPurchaseById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.paymentTxHash).toBe('0xtx123');
    });

    it('should return null for non-existent purchase', () => {
      const purchase = purchaseService.getPurchaseById('nonexistent-id');
      expect(purchase).toBeNull();
    });
  });

  describe('getPurchasesByBuyer', () => {
    it('should return all purchases for a buyer', async () => {
      const buyerAddress = '0xBuyerAddress456';

      await purchaseService.createPurchase({
        productId: 'test-product-1',
        buyerWalletAddress: buyerAddress,
        sellerWalletAddress: '0xSeller1',
        amountHollar: 100000,
        paymentTxHash: '0xtx1'
      });

      await purchaseService.createPurchase({
        productId: 'test-product-1',
        buyerWalletAddress: buyerAddress,
        sellerWalletAddress: '0xSeller2',
        amountHollar: 200000,
        paymentTxHash: '0xtx2'
      });

      await purchaseService.createPurchase({
        productId: 'test-product-1',
        buyerWalletAddress: '0xDifferentBuyer',
        sellerWalletAddress: '0xSeller1',
        amountHollar: 50000,
        paymentTxHash: '0xtx3'
      });

      const purchases = purchaseService.getPurchasesByBuyer(buyerAddress);

      expect(purchases).toHaveLength(2);
      expect(purchases[0].buyerWalletAddress).toBe(buyerAddress);
      expect(purchases[1].buyerWalletAddress).toBe(buyerAddress);
    });

    it('should return purchases in descending order by date', async () => {
      const buyerAddress = '0xBuyer';

      const first = await purchaseService.createPurchase({
        productId: 'test-product-1',
        buyerWalletAddress: buyerAddress,
        sellerWalletAddress: '0xSeller',
        amountHollar: 100000,
        paymentTxHash: '0xtx1'
      });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const second = await purchaseService.createPurchase({
        productId: 'test-product-1',
        buyerWalletAddress: buyerAddress,
        sellerWalletAddress: '0xSeller',
        amountHollar: 200000,
        paymentTxHash: '0xtx2'
      });

      const purchases = purchaseService.getPurchasesByBuyer(buyerAddress);

      expect(purchases[0].id).toBe(second.id); // Most recent first
      expect(purchases[1].id).toBe(first.id);
    });
  });

  describe('getPurchasesBySeller', () => {
    it('should return all purchases for a seller', async () => {
      const sellerAddress = '0xSellerAddress123';

      await purchaseService.createPurchase({
        productId: 'test-product-1',
        buyerWalletAddress: '0xBuyer1',
        sellerWalletAddress: sellerAddress,
        amountHollar: 100000,
        paymentTxHash: '0xtx1'
      });

      await purchaseService.createPurchase({
        productId: 'test-product-1',
        buyerWalletAddress: '0xBuyer2',
        sellerWalletAddress: sellerAddress,
        amountHollar: 200000,
        paymentTxHash: '0xtx2'
      });

      const purchases = purchaseService.getPurchasesBySeller(sellerAddress);

      expect(purchases).toHaveLength(2);
      expect(purchases[0].sellerWalletAddress).toBe(sellerAddress);
      expect(purchases[1].sellerWalletAddress).toBe(sellerAddress);
    });
  });

  describe('getSellerTransactionCount', () => {
    it('should return correct transaction count for seller', async () => {
      const sellerAddress = '0xSellerAddress123';

      expect(purchaseService.getSellerTransactionCount(sellerAddress)).toBe(0);

      await purchaseService.createPurchase({
        productId: 'test-product-1',
        buyerWalletAddress: '0xBuyer1',
        sellerWalletAddress: sellerAddress,
        amountHollar: 100000,
        paymentTxHash: '0xtx1'
      });

      expect(purchaseService.getSellerTransactionCount(sellerAddress)).toBe(1);

      await purchaseService.createPurchase({
        productId: 'test-product-1',
        buyerWalletAddress: '0xBuyer2',
        sellerWalletAddress: sellerAddress,
        amountHollar: 200000,
        paymentTxHash: '0xtx2'
      });

      expect(purchaseService.getSellerTransactionCount(sellerAddress)).toBe(2);
    });

    it('should return 0 for seller with no transactions', () => {
      const count = purchaseService.getSellerTransactionCount('0xNewSeller');
      expect(count).toBe(0);
    });
  });

  describe('updateBlockNumber', () => {
    it('should update block number for purchase', async () => {
      const purchase = await purchaseService.createPurchase({
        productId: 'test-product-1',
        buyerWalletAddress: '0xBuyer',
        sellerWalletAddress: '0xSeller',
        amountHollar: 100000,
        paymentTxHash: '0xtx123'
      });

      const updated = purchaseService.updateBlockNumber('0xtx123', 54321);

      expect(updated).toBe(true);

      const retrieved = purchaseService.getPurchaseById(purchase.id);
      expect(retrieved?.blockNumber).toBe(54321);
    });

    it('should return false for non-existent transaction', () => {
      const updated = purchaseService.updateBlockNumber('0xNonexistent', 12345);
      expect(updated).toBe(false);
    });
  });

  describe('getPurchaseWithDelivery', () => {
    it('should return purchase with delivery token details', async () => {
      const created = await purchaseService.createPurchase({
        productId: 'test-product-1',
        buyerWalletAddress: '0xBuyer',
        sellerWalletAddress: '0xSeller',
        amountHollar: 100000,
        paymentTxHash: '0xtx123'
      });

      const withDelivery = purchaseService.getPurchaseWithDelivery(created.id);

      expect(withDelivery).toBeDefined();
      expect(withDelivery?.deliveryToken).toBeDefined();
      expect(withDelivery?.deliveryUrl).toBeDefined();
      expect(withDelivery?.deliveryExpiresAt).toBeDefined();
    });

    it('should return purchase without delivery details after redemption', async () => {
      const db = dbService.getDatabase();

      const created = await purchaseService.createPurchase({
        productId: 'test-product-1',
        buyerWalletAddress: '0xBuyer',
        sellerWalletAddress: '0xSeller',
        amountHollar: 100000,
        paymentTxHash: '0xtx123'
      });

      // Manually mark token as redeemed
      db.prepare(`
        UPDATE delivery_tokens
        SET redeemed_at = datetime('now')
        WHERE purchase_id = ?
      `).run(created.id);

      const withDelivery = purchaseService.getPurchaseWithDelivery(created.id);

      expect(withDelivery).toBeDefined();
      expect(withDelivery?.deliveryToken).toBeUndefined();
      expect(withDelivery?.deliveryUrl).toBeUndefined();
      expect(withDelivery?.deliveryExpiresAt).toBeUndefined();
    });

    it('should return null for non-existent purchase', () => {
      const purchase = purchaseService.getPurchaseWithDelivery('nonexistent-id');
      expect(purchase).toBeNull();
    });
  });
});
