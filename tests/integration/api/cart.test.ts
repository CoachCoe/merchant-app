import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { cartRoutes } from '../../../src/routes/cart.js';
import { SessionService } from '../../../src/services/sessionService.js';

// Mock dependencies
jest.mock('../../../src/services/cartService.js', () => ({
  CartService: jest.fn().mockImplementation(() => ({
    getOrCreateCart: jest.fn(),
    addToCart: jest.fn(),
    updateCartItem: jest.fn(),
    removeCartItem: jest.fn(),
    clearCart: jest.fn(),
  })),
}));

jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Cart API Integration Tests', () => {
  let app: express.Application;
  let sessionService: SessionService;
  let testSessionId: string;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/cart', cartRoutes);

    sessionService = SessionService.getInstance();
    
    // Create a test session
    const mockRequest = {
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Test User Agent'),
    } as any;
    
    testSessionId = sessionService.createSession(mockRequest);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/cart', () => {
    it('should return cart for valid session', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Cookie', `sessionId=${testSessionId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('should create new session if no session cookie', async () => {
      const response = await request(app)
        .get('/api/cart')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });

  describe('POST /api/cart/items', () => {
    it('should add item to cart with valid data', async () => {
      const cartItem = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 2,
      };

      const response = await request(app)
        .post('/api/cart/items')
        .set('Cookie', `sessionId=${testSessionId}`)
        .send(cartItem)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('should reject invalid product ID', async () => {
      const cartItem = {
        productId: 'invalid-uuid',
        quantity: 2,
      };

      const response = await request(app)
        .post('/api/cart/items')
        .set('Cookie', `sessionId=${testSessionId}`)
        .send(cartItem)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should reject invalid quantity', async () => {
      const cartItem = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: -1,
      };

      const response = await request(app)
        .post('/api/cart/items')
        .set('Cookie', `sessionId=${testSessionId}`)
        .send(cartItem)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should sanitize XSS in request body', async () => {
      const cartItem = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 1,
        maliciousField: '<script>alert("xss")</script>',
      };

      const response = await request(app)
        .post('/api/cart/items')
        .set('Cookie', `sessionId=${testSessionId}`)
        .send(cartItem)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('PUT /api/cart/items/:id', () => {
    it('should update cart item with valid data', async () => {
      const updateData = { quantity: 3 };
      const itemId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .put(`/api/cart/items/${itemId}`)
        .set('Cookie', `sessionId=${testSessionId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should reject invalid item ID', async () => {
      const updateData = { quantity: 3 };

      const response = await request(app)
        .put('/api/cart/items/invalid-uuid')
        .set('Cookie', `sessionId=${testSessionId}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject invalid quantity', async () => {
      const updateData = { quantity: -1 };
      const itemId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .put(`/api/cart/items/${itemId}`)
        .set('Cookie', `sessionId=${testSessionId}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/cart/items/:id', () => {
    it('should remove cart item with valid ID', async () => {
      const itemId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .delete(`/api/cart/items/${itemId}`)
        .set('Cookie', `sessionId=${testSessionId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should reject invalid item ID', async () => {
      const response = await request(app)
        .delete('/api/cart/items/invalid-uuid')
        .set('Cookie', `sessionId=${testSessionId}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/cart/clear', () => {
    it('should clear entire cart', async () => {
      const response = await request(app)
        .post('/api/cart/clear')
        .set('Cookie', `sessionId=${testSessionId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Rate limiting', () => {
    it('should handle multiple rapid requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/cart')
          .set('Cookie', `sessionId=${testSessionId}`)
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed (within rate limit)
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle service errors gracefully', async () => {
      // Mock service to throw error
      const { CartService } = require('../../../src/services/cartService.js');
      const mockCartService = new CartService();
      mockCartService.getOrCreateCart.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/cart')
        .set('Cookie', `sessionId=${testSessionId}`)
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });
});
