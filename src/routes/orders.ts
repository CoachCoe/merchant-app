import { Router, Request, Response } from 'express';
import { OrderService } from '../services/orderService.js';
import { logger } from '../utils/logger.js';

const router = Router();
const orderService = new OrderService();

// Helper function to get session ID from request
function getSessionId(req: Request): string {
  // For now, use a simple session ID based on IP and user agent
  // In production, you'd want to use proper session management
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  return Buffer.from(`${ip}-${userAgent}`).toString('base64').substring(0, 32);
}

// POST /api/orders - Create order from cart
router.post('/', async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const { customer } = req.body;
    
    const result = await orderService.createOrder(sessionId, { customer });
    
    res.status(201).json({
      success: true,
      data: result.order,
      message: result.message
    });
  } catch (error) {
    logger.error('Error creating order', error);
    
    if (error instanceof Error && error.message.includes('empty')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/orders/:id - Get order details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Error fetching order', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/orders - List orders (admin)
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      status
    } = req.query;

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      status: status as string
    };

    const result = await orderService.getOrders(options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching orders', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/orders/:id/status - Update order payment status (admin)
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paymentData } = req.body;
    
    // Basic validation
    if (!status || !['pending', 'processing', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required'
      });
    }

    const order = await orderService.updateOrderPaymentStatus(id, status, paymentData);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    logger.error('Error updating order status', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as orderRoutes };
