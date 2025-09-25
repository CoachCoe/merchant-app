import { Router, Request, Response } from 'express';
import { CartService } from '../services/cartService.js';
import { logger } from '../utils/logger.js';
import { sessionMiddleware } from '../middleware/sessionMiddleware.js';
import { validationMiddleware } from '../middleware/validationMiddleware.js';
import {
  addToCartSchema,
  updateCartItemSchema,
  cartItemIdSchema
} from '../validation/schemas.js';

const router = Router();
const cartService = new CartService();

// GET /api/cart - Get current cart
router.get('/', 
  sessionMiddleware.sessionHandler,
  async (req: Request, res: Response) => {
    try {
      if (!req.session) {
        return res.status(401).json({
          success: false,
          message: 'Session required'
        });
      }

      const cart = await cartService.getOrCreateCart(req.session.sessionId);
      
      res.json({
        success: true,
        data: cart
      });
    } catch (error) {
      logger.error('Error fetching cart', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch cart',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// POST /api/cart/items - Add item to cart
router.post('/items', 
  sessionMiddleware.sessionHandler,
  validationMiddleware.sanitizeBody,
  validationMiddleware.validateBody(addToCartSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.session) {
        return res.status(401).json({
          success: false,
          message: 'Session required'
        });
      }

      const { productId, quantity } = req.body;
      const result = await cartService.addToCart(req.session.sessionId, { productId, quantity });
      
      res.json({
        success: true,
        data: result.cart,
        message: result.message
      });
    } catch (error) {
      logger.error('Error adding to cart', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to add item to cart',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// PUT /api/cart/items/:id - Update item quantity
router.put('/items/:id', 
  sessionMiddleware.sessionHandler,
  validationMiddleware.validateParams(cartItemIdSchema),
  validationMiddleware.sanitizeBody,
  validationMiddleware.validateBody(updateCartItemSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.session) {
        return res.status(401).json({
          success: false,
          message: 'Session required'
        });
      }

      const { id } = req.params;
      const { quantity } = req.body;
      const result = await cartService.updateCartItem(req.session.sessionId, id, { quantity });
      
      res.json({
        success: true,
        data: result.cart,
        message: result.message
      });
    } catch (error) {
      logger.error('Error updating cart item', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to update cart item',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// DELETE /api/cart/items/:id - Remove item from cart
router.delete('/items/:id', 
  sessionMiddleware.sessionHandler,
  validationMiddleware.validateParams(cartItemIdSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.session) {
        return res.status(401).json({
          success: false,
          message: 'Session required'
        });
      }

      const { id } = req.params;
      const result = await cartService.removeCartItem(req.session.sessionId, id);
      
      res.json({
        success: true,
        data: result.cart,
        message: result.message
      });
    } catch (error) {
      logger.error('Error removing cart item', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to remove cart item',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// POST /api/cart/clear - Clear entire cart
router.post('/clear', 
  sessionMiddleware.sessionHandler,
  async (req: Request, res: Response) => {
    try {
      if (!req.session) {
        return res.status(401).json({
          success: false,
          message: 'Session required'
        });
      }

      const result = await cartService.clearCart(req.session.sessionId);
      
      res.json({
        success: true,
        data: result.cart,
        message: result.message
      });
    } catch (error) {
      logger.error('Error clearing cart', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cart',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export { router as cartRoutes };
