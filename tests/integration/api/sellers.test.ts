import request from 'supertest';
import express from 'express';
import { sellerRoutes } from '../../../src/routes/sellers.js';
import { DatabaseService } from '../../../src/services/databaseService.js';
import { PurchaseService } from '../../../src/services/purchaseService.js';

const app = express();
app.use(express.json());
app.use('/api/sellers', sellerRoutes);

describe('Sellers API', () => {
  let dbService: DatabaseService;
  let purchaseService: PurchaseService;
  const testSellerAddress = '0xTestSellerAddress123';

  beforeAll(() => {
    dbService = DatabaseService.getInstance();
    purchaseService = new PurchaseService();

    // Setup test product
    const db = dbService.getDatabase();
    db.prepare(`
      INSERT OR IGNORE INTO products (
        id, title, description, price_hollar, category_id,
        seller_wallet_address, ipfs_metadata_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'test-product-seller',
      'Test Product',
      'Test description',
      100000,
      'digital-goods',
      testSellerAddress,
      'QmTestHash'
    );
  });

  afterAll(() => {
    const db = dbService.getDatabase();
    db.prepare('DELETE FROM delivery_tokens').run();
    db.prepare('DELETE FROM purchases').run();
  });

  describe('GET /api/sellers/:walletAddress/reputation', () => {
    it('should return seller reputation with zero transactions for new seller', async () => {
      const response = await request(app)
        .get(`/api/sellers/0xNewSeller/reputation`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        walletAddress: '0xNewSeller',
        transactionCount: 0,
        totalVolume: 0,
        averageValue: 0,
        recentActivityCount: 0
      });
    });

    it('should return seller reputation with transactions', async () => {
      // Create some purchases for the seller
      await purchaseService.createPurchase({
        productId: 'test-product-seller',
        buyerWalletAddress: '0xBuyer1',
        sellerWalletAddress: testSellerAddress,
        amountHollar: 100000,
        paymentTxHash: '0xtx1'
      });

      await purchaseService.createPurchase({
        productId: 'test-product-seller',
        buyerWalletAddress: '0xBuyer2',
        sellerWalletAddress: testSellerAddress,
        amountHollar: 200000,
        paymentTxHash: '0xtx2'
      });

      const response = await request(app)
        .get(`/api/sellers/${testSellerAddress}/reputation`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        walletAddress: testSellerAddress,
        transactionCount: 2,
        totalVolume: 300000,
        averageValue: 150000,
        recentActivityCount: 2
      });
    });

    it('should return 400 for invalid wallet address', async () => {
      const response = await request(app)
        .get('/api/sellers/invalid/reputation')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid wallet address');
    });
  });

  describe('GET /api/sellers/:walletAddress/sales', () => {
    it('should return seller sales history', async () => {
      const response = await request(app)
        .get(`/api/sellers/${testSellerAddress}/sales`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.purchases).toBeDefined();
      expect(response.body.data.total).toBeGreaterThanOrEqual(2);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/sellers/${testSellerAddress}/sales?limit=1&offset=0`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.purchases).toHaveLength(1);
      expect(response.body.data.limit).toBe(1);
      expect(response.body.data.offset).toBe(0);
    });
  });
});
