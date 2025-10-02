import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ProductService } from '../../../src/services/productService';
import { DatabaseService } from '../../../src/services/databaseService';
import { CreateProductRequest } from '../../../src/models/Product';

// Mock database
jest.mock('../../../src/services/databaseService');
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('ProductService', () => {
  let productService: ProductService;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock database methods
    mockDb = {
      prepare: jest.fn().mockReturnThis(),
      get: jest.fn(),
      all: jest.fn(),
      run: jest.fn().mockReturnValue({ changes: 1 })
    };

    (DatabaseService.getInstance as any).mockReturnValue({
      getDatabase: () => mockDb
    });

    productService = new ProductService();
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          title: 'Test Product 1',
          description: 'Description 1',
          priceHollar: 100,
          categoryId: 'cat-1',
          images: JSON.stringify(['img1.jpg']),
          sellerWalletAddress: '0x123',
          ipfsMetadataHash: 'QmTest1',
          blockchainVerified: 1,
          isActive: 1,
          views: 10,
          purchases: 5,
          createdAt: '2025-10-02T12:00:00.000Z',
          updatedAt: '2025-10-02T12:00:00.000Z'
        }
      ];

      mockDb.get.mockReturnValueOnce({ total: 1 });
      mockDb.all.mockReturnValueOnce(mockProducts);

      const result = await productService.getProducts({ page: 1, limit: 20 });

      expect(result.products).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.hasMore).toBe(false);
      expect(result.products[0].title).toBe('Test Product 1');
    });

    it('should filter by category', async () => {
      mockDb.get.mockReturnValueOnce({ total: 0 });
      mockDb.all.mockReturnValueOnce([]);

      await productService.getProducts({ categoryId: 'electronics' });

      expect(mockDb.prepare).toHaveBeenCalled();
      // Verify category filter was added to query
      const calls = mockDb.prepare.mock.calls;
      expect(calls.some((call: any) => call[0].includes('category_id'))).toBe(true);
    });

    it('should filter by seller wallet', async () => {
      mockDb.get.mockReturnValueOnce({ total: 0 });
      mockDb.all.mockReturnValueOnce([]);

      await productService.getProducts({
        sellerWalletAddress: '0x1234567890123456789012345678901234567890'
      });

      expect(mockDb.prepare).toHaveBeenCalled();
      const calls = mockDb.prepare.mock.calls;
      expect(calls.some((call: any) => call[0].includes('seller_wallet_address'))).toBe(true);
    });

    it('should support search query', async () => {
      mockDb.get.mockReturnValueOnce({ total: 0 });
      mockDb.all.mockReturnValueOnce([]);

      await productService.getProducts({ search: 'laptop' });

      expect(mockDb.prepare).toHaveBeenCalled();
      const calls = mockDb.prepare.mock.calls;
      expect(calls.some((call: any) => call[0].includes('LIKE'))).toBe(true);
    });
  });

  describe('getProductById', () => {
    it('should return product by ID', async () => {
      const mockProduct = {
        id: 'prod-123',
        title: 'Test Product',
        description: 'Test Description',
        priceHollar: 100,
        categoryId: 'cat-1',
        images: JSON.stringify(['img1.jpg']),
        sellerWalletAddress: '0x123',
        ipfsMetadataHash: 'QmTest',
        blockchainVerified: 1,
        isActive: 1,
        views: 0,
        purchases: 0,
        createdAt: '2025-10-02T12:00:00.000Z',
        updatedAt: '2025-10-02T12:00:00.000Z'
      };

      mockDb.get.mockReturnValueOnce(mockProduct);

      const result = await productService.getProductById('prod-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('prod-123');
      expect(result?.title).toBe('Test Product');
    });

    it('should return null for non-existent product', async () => {
      mockDb.get.mockReturnValueOnce(undefined);

      const result = await productService.getProductById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createProduct', () => {
    it('should create new product with valid data', async () => {
      const request: CreateProductRequest = {
        title: 'New Product',
        description: 'Product description',
        priceHollar: 150,
        categoryId: 'cat-1',
        images: ['img1.jpg', 'img2.jpg'],
        sellerWalletAddress: '0x1234567890123456789012345678901234567890'
      };

      const mockCreatedProduct = {
        id: 'prod-new',
        ...request,
        images: JSON.stringify(request.images),
        ipfsMetadataHash: 'pending',
        blockchainVerified: 0,
        isActive: 1,
        views: 0,
        purchases: 0,
        createdAt: '2025-10-02T12:00:00.000Z',
        updatedAt: '2025-10-02T12:00:00.000Z'
      };

      mockDb.run.mockReturnValueOnce({ changes: 1 });
      mockDb.get.mockReturnValueOnce(mockCreatedProduct);

      const result = await productService.createProduct(request);

      expect(result).toBeDefined();
      expect(result.title).toBe('New Product');
      expect(mockDb.run).toHaveBeenCalled();
    });

    it('should handle IPFS hash in creation', async () => {
      const request: CreateProductRequest = {
        title: 'Product with IPFS',
        description: 'Description',
        priceHollar: 100,
        categoryId: 'cat-1',
        images: [],
        sellerWalletAddress: '0x123',
        ipfsMetadataHash: 'QmTestHash'
      };

      mockDb.run.mockReturnValueOnce({ changes: 1 });
      mockDb.get.mockReturnValueOnce({ id: 'prod-1', ...request });

      await productService.createProduct(request);

      expect(mockDb.run).toHaveBeenCalled();
      const runCalls = mockDb.run.mock.calls;
      expect(runCalls[0]).toContain('QmTestHash');
    });
  });

  describe('updateProduct', () => {
    it('should update product fields', async () => {
      const updateData = {
        title: 'Updated Title',
        priceHollar: 200
      };

      mockDb.run.mockReturnValueOnce({ changes: 1 });
      mockDb.get.mockReturnValueOnce({
        id: 'prod-1',
        ...updateData,
        description: 'Original description',
        categoryId: 'cat-1',
        images: JSON.stringify([]),
        sellerWalletAddress: '0x123',
        ipfsMetadataHash: 'QmTest',
        blockchainVerified: 0,
        isActive: 1,
        views: 0,
        purchases: 0,
        createdAt: '2025-10-02T12:00:00.000Z',
        updatedAt: '2025-10-02T12:00:00.000Z'
      });

      const result = await productService.updateProduct('prod-1', updateData);

      expect(result.title).toBe('Updated Title');
      expect(result.priceHollar).toBe(200);
      expect(mockDb.run).toHaveBeenCalled();
    });

    it('should throw error for non-existent product', async () => {
      mockDb.run.mockReturnValueOnce({ changes: 0 });

      await expect(
        productService.updateProduct('non-existent', { title: 'New Title' })
      ).rejects.toThrow('Product not found');
    });

    it('should handle empty update (no changes)', async () => {
      const mockProduct = {
        id: 'prod-1',
        title: 'Existing Product',
        description: 'Description',
        priceHollar: 100,
        categoryId: 'cat-1',
        images: JSON.stringify([]),
        sellerWalletAddress: '0x123',
        ipfsMetadataHash: 'QmTest',
        blockchainVerified: 0,
        isActive: 1,
        views: 0,
        purchases: 0,
        createdAt: '2025-10-02T12:00:00.000Z',
        updatedAt: '2025-10-02T12:00:00.000Z'
      };

      mockDb.get.mockReturnValueOnce(mockProduct);

      const result = await productService.updateProduct('prod-1', {});

      expect(result.title).toBe('Existing Product');
      expect(mockDb.run).not.toHaveBeenCalled();
    });
  });

  describe('deleteProduct', () => {
    it('should soft-delete product (mark inactive)', async () => {
      mockDb.run.mockReturnValueOnce({ changes: 1 });

      await productService.deleteProduct('prod-1');

      expect(mockDb.run).toHaveBeenCalled();
      const runCalls = mockDb.run.mock.calls;
      expect(runCalls[0][0]).toContain('is_active = 0');
    });

    it('should throw error for non-existent product', async () => {
      mockDb.run.mockReturnValueOnce({ changes: 0 });

      await expect(productService.deleteProduct('non-existent'))
        .rejects.toThrow('Product not found');
    });
  });

  describe('incrementViews', () => {
    it('should increment product view count', async () => {
      mockDb.run.mockReturnValueOnce({ changes: 1 });

      await productService.incrementViews('prod-1');

      expect(mockDb.run).toHaveBeenCalled();
      const runCalls = mockDb.run.mock.calls;
      expect(runCalls[0][0]).toContain('views = views + 1');
    });
  });

  describe('mapRowToProduct', () => {
    it('should parse JSON fields correctly', async () => {
      const mockProduct = {
        id: 'prod-1',
        title: 'Test',
        description: 'Desc',
        priceHollar: 100,
        categoryId: 'cat-1',
        images: JSON.stringify(['img1.jpg', 'img2.jpg']),
        sellerWalletAddress: '0x123',
        ipfsMetadataHash: 'QmTest',
        blockchainVerified: 1,
        variants: JSON.stringify([{ name: 'Size', value: 'Large' }]),
        tags: JSON.stringify(['electronics', 'gadget']),
        isActive: 1,
        views: 10,
        purchases: 5,
        createdAt: '2025-10-02T12:00:00.000Z',
        updatedAt: '2025-10-02T12:00:00.000Z'
      };

      mockDb.get.mockReturnValueOnce(mockProduct);

      const result = await productService.getProductById('prod-1');

      expect(result?.images).toEqual(['img1.jpg', 'img2.jpg']);
      expect(result?.variants).toEqual([{ name: 'Size', value: 'Large' }]);
      expect(result?.tags).toEqual(['electronics', 'gadget']);
    });

    it('should handle malformed JSON gracefully', async () => {
      const mockProduct = {
        id: 'prod-1',
        title: 'Test',
        description: 'Desc',
        priceHollar: 100,
        categoryId: 'cat-1',
        images: 'invalid-json',
        sellerWalletAddress: '0x123',
        ipfsMetadataHash: 'QmTest',
        blockchainVerified: 0,
        variants: 'also-invalid',
        tags: 'bad-json',
        isActive: 1,
        views: 0,
        purchases: 0,
        createdAt: '2025-10-02T12:00:00.000Z',
        updatedAt: '2025-10-02T12:00:00.000Z'
      };

      mockDb.get.mockReturnValueOnce(mockProduct);

      const result = await productService.getProductById('prod-1');

      // Should handle gracefully with fallback values
      expect(result).toBeDefined();
      expect(Array.isArray(result?.images)).toBe(true);
    });
  });
});
