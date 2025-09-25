/**
 * Marketplace API Routes
 * Handles anonymous user management, product listings, and transaction processing
 */

import { Router, Request, Response } from 'express';
import { AnonymousUserService } from '../services/anonymousUserService.js';
import { MarketplaceProductService } from '../services/marketplaceProductService.js';
import { EscrowService } from '../services/escrowService.js';
import { logger } from '../utils/logger.js';
import { sessionMiddleware } from '../middleware/sessionMiddleware.js';
import { validationMiddleware } from '../middleware/validationMiddleware.js';
import { ERROR_MESSAGES } from '../config/constants.js';
import { z } from 'zod';

const router = Router();
const userService = new AnonymousUserService();
const productService = new MarketplaceProductService();
const escrowService = new EscrowService();

// Validation schemas
const createUserSchema = z.object({
  walletAddress: z.string().optional(),
  preferences: z.object({
    currency: z.enum(['DOT', 'KSM']).optional(),
    language: z.string().optional(),
    timezone: z.string().optional()
  }).optional(),
  privacy: z.object({
    showReputation: z.boolean().optional(),
    allowMessaging: z.boolean().optional(),
    shareAnalytics: z.boolean().optional()
  }).optional()
});

const createProductSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  images: z.array(z.string().url('Image must be a valid URL')).min(1, 'At least one image is required'),
  price: z.object({
    amount: z.string().regex(/^\d+(\.\d+)?$/, 'Amount must be a valid number'),
    currency: z.enum(['DOT', 'KSM'])
  }),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  condition: z.enum(['new', 'used', 'refurbished']),
  shipping: z.object({
    available: z.boolean(),
    cost: z.object({
      amount: z.string(),
      currency: z.enum(['DOT', 'KSM'])
    }).optional(),
    estimatedDays: z.number().int().positive().optional(),
    regions: z.array(z.string()).optional()
  }).optional(),
  digitalDelivery: z.object({
    available: z.boolean(),
    method: z.enum(['email', 'download', 'nft']),
    instructions: z.string().optional()
  }).optional(),
  expiresAt: z.string().datetime().optional()
});

const searchProductsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  priceMin: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  priceMax: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  currency: z.enum(['DOT', 'KSM']).optional(),
  condition: z.array(z.string()).optional(),
  availability: z.array(z.string()).optional(),
  sellerReputation: z.string().transform(Number).pipe(z.number().min(0).max(100)).optional(),
  sortBy: z.enum(['price', 'reputation', 'newest', 'popularity', 'rating']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional()
});

const createTransactionSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  buyerWalletAddress: z.string().min(1, 'Buyer wallet address is required'),
  quantity: z.number().int().min(1).optional(),
  deliveryMethod: z.enum(['physical', 'digital']),
  deliveryAddress: z.string().optional(),
  digitalDeliveryInfo: z.string().optional(),
  trackingNumber: z.string().optional()
});

// Anonymous User Routes

// POST /api/marketplace/users - Create anonymous user
router.post('/users',
  sessionMiddleware.sessionHandler,
  validationMiddleware.sanitizeBody,
  validationMiddleware.validateBody(createUserSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.session) {
        return res.status(401).json({
          success: false,
          message: ERROR_MESSAGES.AUTH.SESSION_REQUIRED
        });
      }

      const user = await userService.createUser(req.body);
      
      res.status(201).json({
        success: true,
        data: {
          id: user.id,
          tempId: user.tempId,
          reputation: user.reputation,
          isVerified: user.isVerified,
          preferences: user.metadata.preferences,
          privacy: user.metadata.privacy
        },
        message: 'Anonymous user created successfully'
      });
    } catch (error) {
      logger.error('Error creating anonymous user', error);
      res.status(500).json({
        success: false,
        message: ERROR_MESSAGES.SYSTEM.DATABASE_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/marketplace/users/me - Get current user
router.get('/users/me',
  sessionMiddleware.sessionHandler,
  async (req: Request, res: Response) => {
    try {
      if (!req.session) {
        return res.status(401).json({
          success: false,
          message: ERROR_MESSAGES.AUTH.SESSION_REQUIRED
        });
      }

      // For now, create a temporary user if none exists
      // In a real implementation, this would be linked to the session
      const tempId = req.session.sessionId;
      let user = await userService.getUserByTempId(tempId);
      
      if (!user) {
        user = await userService.createUser({
          preferences: { currency: 'DOT', language: 'en', timezone: 'UTC' }
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          tempId: user.tempId,
          reputation: user.reputation,
          isVerified: user.isVerified,
          totalTransactions: user.totalTransactions,
          successfulTransactions: user.successfulTransactions,
          disputeCount: user.disputeCount,
          preferences: user.metadata.preferences,
          privacy: user.metadata.privacy
        }
      });
    } catch (error) {
      logger.error('Error getting current user', error);
      res.status(500).json({
        success: false,
        message: ERROR_MESSAGES.SYSTEM.DATABASE_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// PUT /api/marketplace/users/me - Update current user
router.put('/users/me',
  sessionMiddleware.sessionHandler,
  validationMiddleware.sanitizeBody,
  validationMiddleware.validateBody(createUserSchema.partial()),
  async (req: Request, res: Response) => {
    try {
      if (!req.session) {
        return res.status(401).json({
          success: false,
          message: ERROR_MESSAGES.AUTH.SESSION_REQUIRED
        });
      }

      // Update user logic would go here
      res.json({
        success: true,
        message: 'User updated successfully'
      });
    } catch (error) {
      logger.error('Error updating user', error);
      res.status(500).json({
        success: false,
        message: ERROR_MESSAGES.SYSTEM.DATABASE_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Marketplace Product Routes

// GET /api/marketplace/products - Search products
router.get('/products',
  validationMiddleware.validateQuery(searchProductsSchema),
  async (req: Request, res: Response) => {
    try {
      const result = await productService.searchProducts(req.query as any);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error searching products', error);
      res.status(500).json({
        success: false,
        message: ERROR_MESSAGES.SYSTEM.DATABASE_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/marketplace/products/:id - Get single product
router.get('/products/:id',
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Increment view count
      await productService.updateProductStats(id, { views: 1 });

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      logger.error('Error fetching product', error);
      res.status(500).json({
        success: false,
        message: ERROR_MESSAGES.SYSTEM.DATABASE_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// POST /api/marketplace/products - Create product
router.post('/products',
  sessionMiddleware.sessionHandler,
  validationMiddleware.sanitizeBody,
  validationMiddleware.validateBody(createProductSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.session) {
        return res.status(401).json({
          success: false,
          message: ERROR_MESSAGES.AUTH.SESSION_REQUIRED
        });
      }

      // Get or create user
      const tempId = req.session.sessionId;
      let user = await userService.getUserByTempId(tempId);
      
      if (!user) {
        user = await userService.createUser({
          preferences: { currency: 'DOT', language: 'en', timezone: 'UTC' }
        });
      }

      const product = await productService.createProduct(req.body, user.id);
      
      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully'
      });
    } catch (error) {
      logger.error('Error creating product', error);
      res.status(500).json({
        success: false,
        message: ERROR_MESSAGES.SYSTEM.DATABASE_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// PUT /api/marketplace/products/:id - Update product
router.put('/products/:id',
  sessionMiddleware.sessionHandler,
  validationMiddleware.sanitizeBody,
  validationMiddleware.validateBody(createProductSchema.partial()),
  async (req: Request, res: Response) => {
    try {
      if (!req.session) {
        return res.status(401).json({
          success: false,
          message: ERROR_MESSAGES.AUTH.SESSION_REQUIRED
        });
      }

      const { id } = req.params;
      const product = await productService.updateProduct(id, req.body);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product,
        message: 'Product updated successfully'
      });
    } catch (error) {
      logger.error('Error updating product', error);
      res.status(500).json({
        success: false,
        message: ERROR_MESSAGES.SYSTEM.DATABASE_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// DELETE /api/marketplace/products/:id - Delete product
router.delete('/products/:id',
  sessionMiddleware.sessionHandler,
  async (req: Request, res: Response) => {
    try {
      if (!req.session) {
        return res.status(401).json({
          success: false,
          message: ERROR_MESSAGES.AUTH.SESSION_REQUIRED
        });
      }

      const { id } = req.params;
      const success = await productService.deleteProduct(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting product', error);
      res.status(500).json({
        success: false,
        message: ERROR_MESSAGES.SYSTEM.DATABASE_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/marketplace/products/seller/:sellerId - Get products by seller
router.get('/products/seller/:sellerId',
  async (req: Request, res: Response) => {
    try {
      const { sellerId } = req.params;
      const { page, limit, availability } = req.query;
      
      const result = await productService.getProductsBySeller(sellerId, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        availability: availability ? (Array.isArray(availability) ? availability as string[] : [availability as string]) : undefined
      });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error fetching seller products', error);
      res.status(500).json({
        success: false,
        message: ERROR_MESSAGES.SYSTEM.DATABASE_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Transaction Routes

// POST /api/marketplace/transactions - Create transaction
router.post('/transactions',
  sessionMiddleware.sessionHandler,
  validationMiddleware.sanitizeBody,
  validationMiddleware.validateBody(createTransactionSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.session) {
        return res.status(401).json({
          success: false,
          message: ERROR_MESSAGES.AUTH.SESSION_REQUIRED
        });
      }

      // Get or create user
      const tempId = req.session.sessionId;
      let user = await userService.getUserByTempId(tempId);
      
      if (!user) {
        user = await userService.createUser({
          preferences: { currency: 'DOT', language: 'en', timezone: 'UTC' }
        });
      }

      const transaction = await escrowService.createTransaction(req.body, user.id);
      
      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaction created successfully'
      });
    } catch (error) {
      logger.error('Error creating transaction', error);
      res.status(500).json({
        success: false,
        message: ERROR_MESSAGES.SYSTEM.DATABASE_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/marketplace/transactions - Get user transactions
router.get('/transactions',
  sessionMiddleware.sessionHandler,
  async (req: Request, res: Response) => {
    try {
      if (!req.session) {
        return res.status(401).json({
          success: false,
          message: ERROR_MESSAGES.AUTH.SESSION_REQUIRED
        });
      }

      const tempId = req.session.sessionId;
      const user = await userService.getUserByTempId(tempId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const { status, page, limit } = req.query;
      const result = await escrowService.getTransactions({
        buyerId: user.id,
        status: status as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined
      });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error fetching transactions', error);
      res.status(500).json({
        success: false,
        message: ERROR_MESSAGES.SYSTEM.DATABASE_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/marketplace/transactions/:id - Get single transaction
router.get('/transactions/:id',
  sessionMiddleware.sessionHandler,
  async (req: Request, res: Response) => {
    try {
      if (!req.session) {
        return res.status(401).json({
          success: false,
          message: ERROR_MESSAGES.AUTH.SESSION_REQUIRED
        });
      }

      const { id } = req.params;
      const transaction = await escrowService.getTransactionById(id);
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.error('Error fetching transaction', error);
      res.status(500).json({
        success: false,
        message: ERROR_MESSAGES.SYSTEM.DATABASE_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// PUT /api/marketplace/transactions/:id/status - Update transaction status
router.put('/transactions/:id/status',
  sessionMiddleware.sessionHandler,
  validationMiddleware.sanitizeBody,
  async (req: Request, res: Response) => {
    try {
      if (!req.session) {
        return res.status(401).json({
          success: false,
          message: ERROR_MESSAGES.AUTH.SESSION_REQUIRED
        });
      }

      const { id } = req.params;
      const transaction = await escrowService.updateTransactionStatus(id, req.body);
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        data: transaction,
        message: 'Transaction status updated successfully'
      });
    } catch (error) {
      logger.error('Error updating transaction status', error);
      res.status(500).json({
        success: false,
        message: ERROR_MESSAGES.SYSTEM.DATABASE_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Statistics Routes

// GET /api/marketplace/stats - Get marketplace statistics
router.get('/stats',
  async (req: Request, res: Response) => {
    try {
      const [userStats, productStats, transactionStats] = await Promise.all([
        userService.getUserStats(),
        productService.getProductStats(),
        escrowService.getTransactionStats()
      ]);
      
      res.json({
        success: true,
        data: {
          users: userStats,
          products: productStats,
          transactions: transactionStats
        }
      });
    } catch (error) {
      logger.error('Error fetching marketplace stats', error);
      res.status(500).json({
        success: false,
        message: ERROR_MESSAGES.SYSTEM.DATABASE_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
