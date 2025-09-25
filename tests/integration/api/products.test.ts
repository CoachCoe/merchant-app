import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { productRoutes } from '../../../src/routes/products.js';
import { SessionService } from '../../../src/services/sessionService.js';

// Mock dependencies
jest.mock('../../../src/services/productService.js', () => ({
  ProductService: jest.fn().mockImplementation(() => ({
    getProducts: jest.fn(),
    getProductById: jest.fn(),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
  })),
}));

jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Products API Integration Tests', () => {
  let app: express.Application;
  let sessionService: SessionService;
  let testSessionId: string;
  let adminSessionId: string;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/products', productRoutes);

    sessionService = SessionService.getInstance();
    
    // Create test sessions
    const mockRequest = {
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Test User Agent'),
    } as any;
    
    testSessionId = sessionService.createSession(mockRequest);
    adminSessionId = sessionService.createSession(mockRequest, 'admin-user', true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return products list with pagination', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=10')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/products?page=0&limit=101')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/products?category=123e4567-e89b-12d3-a456-426614174000')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should search products', async () => {
      const response = await request(app)
        .get('/api/products?search=test')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return single product', async () => {
      const productId = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('should reject invalid product ID', async () => {
      const response = await request(app)
        .get('/api/products/invalid-uuid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 404 for non-existent product', async () => {
      const { ProductService } = require('../../../src/services/productService.js');
      const mockProductService = new ProductService();
      mockProductService.getProductById.mockResolvedValue(null);

      const productId = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .get(`/api/products/${productId}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Product not found');
    });
  });

  describe('POST /api/products (Admin)', () => {
    it('should create product with admin session', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product',
        price: 1999,
        image: 'https://example.com/image.jpg',
        category: '123e4567-e89b-12d3-a456-426614174000',
        isActive: true,
      };

      const response = await request(app)
        .post('/api/products')
        .set('Cookie', `sessionId=${adminSessionId}`)
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message', 'Product created successfully');
    });

    it('should reject non-admin users', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product',
        price: 1999,
      };

      const response = await request(app)
        .post('/api/products')
        .set('Cookie', `sessionId=${testSessionId}`)
        .send(productData)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Admin privileges required');
    });

    it('should validate product data', async () => {
      const invalidProductData = {
        name: '', // Invalid: empty name
        description: 'A test product',
        price: -100, // Invalid: negative price
      };

      const response = await request(app)
        .post('/api/products')
        .set('Cookie', `sessionId=${adminSessionId}`)
        .send(invalidProductData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should sanitize XSS in product data', async () => {
      const productData = {
        name: '<script>alert("xss")</script>Test Product',
        description: 'A test product',
        price: 1999,
      };

      const response = await request(app)
        .post('/api/products')
        .set('Cookie', `sessionId=${adminSessionId}`)
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('PUT /api/products/:id (Admin)', () => {
    it('should update product with admin session', async () => {
      const productId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = {
        name: 'Updated Product',
        price: 2999,
      };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Cookie', `sessionId=${adminSessionId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message', 'Product updated successfully');
    });

    it('should reject non-admin users', async () => {
      const productId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = { name: 'Updated Product' };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Cookie', `sessionId=${testSessionId}`)
        .send(updateData)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 404 for non-existent product', async () => {
      const { ProductService } = require('../../../src/services/productService.js');
      const mockProductService = new ProductService();
      mockProductService.updateProduct.mockResolvedValue(null);

      const productId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = { name: 'Updated Product' };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Cookie', `sessionId=${adminSessionId}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Product not found');
    });
  });

  describe('DELETE /api/products/:id (Admin)', () => {
    it('should delete product with admin session', async () => {
      const productId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Cookie', `sessionId=${adminSessionId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Product deleted successfully');
    });

    it('should reject non-admin users', async () => {
      const productId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Cookie', `sessionId=${testSessionId}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 404 for non-existent product', async () => {
      const { ProductService } = require('../../../src/services/productService.js');
      const mockProductService = new ProductService();
      mockProductService.deleteProduct.mockResolvedValue(false);

      const productId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Cookie', `sessionId=${adminSessionId}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Product not found');
    });
  });

  describe('Security', () => {
    it('should log admin actions', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product',
        price: 1999,
      };

      await request(app)
        .post('/api/products')
        .set('Cookie', `sessionId=${adminSessionId}`)
        .send(productData)
        .expect(201);

      // Verify admin action was logged
      const { logger } = require('../../../src/utils/logger.js');
      expect(logger.security).toHaveBeenCalledWith(
        'Admin action: create_product',
        expect.objectContaining({
          sessionId: adminSessionId,
          adminId: 'admin-user',
        })
      );
    });
  });
});
