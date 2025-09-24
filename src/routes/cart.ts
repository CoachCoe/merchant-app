import { Router, Request, Response } from 'express';
import { CartService } from '../services/cartService.js';
import { logger } from '../utils/logger.js';

const router = Router();
const cartService = new CartService();

// Helper function to get session ID from request
function getSessionId(req: Request): string {
  // For now, use a simple session ID based on IP and user agent
  // In production, you'd want to use proper session management
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  return Buffer.from(`${ip}-${userAgent}`).toString('base64').substring(0, 32);
}

// GET /api/cart - Get current cart
router.get('/', async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const cart = await cartService.getOrCreateCart(sessionId);
    
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
});

// POST /api/cart/items - Add item to cart
router.post('/items', async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const { productId, quantity } = req.body;
    
    // Basic validation
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and valid quantity are required'
      });
    }

    const result = await cartService.addToCart(sessionId, { productId, quantity });
    
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
});

// PUT /api/cart/items/:id - Update item quantity
router.put('/items/:id', async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const { id } = req.params;
    const { quantity } = req.body;
    
    // Basic validation
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    const result = await cartService.updateCartItem(sessionId, id, { quantity });
    
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
});

// DELETE /api/cart/items/:id - Remove item from cart
router.delete('/items/:id', async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const { id } = req.params;
    
    const result = await cartService.removeCartItem(sessionId, id);
    
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
});

// POST /api/cart/clear - Clear entire cart
router.post('/clear', async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const result = await cartService.clearCart(sessionId);
    
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
});

export { router as cartRoutes };
