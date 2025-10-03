import { Router, Request, Response } from 'express';
import { DigitalDeliveryService } from '../services/digitalDeliveryService.js';
import { logger } from '../utils/logger.js';
import { ERROR_MESSAGES } from '../config/constants.js';

const router = Router();
const deliveryService = new DigitalDeliveryService();

/**
 * GET /api/delivery/:token
 * Redeem delivery token and get product download details
 */
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token || token.length !== 64) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery token format'
      });
    }

    const deliveryDetails = await deliveryService.redeemDeliveryToken(token);

    if (!deliveryDetails) {
      return res.status(404).json({
        success: false,
        message: 'Delivery token is invalid, expired, or already used'
      });
    }

    logger.info('Product delivered successfully', {
      productId: deliveryDetails.productId,
      deliveryType: deliveryDetails.deliveryType
    });

    res.json({
      success: true,
      data: {
        productName: deliveryDetails.productName,
        deliveryType: deliveryDetails.deliveryType,
        instructions: deliveryDetails.deliveryInstructions,
        ipfsHash: deliveryDetails.ipfsHash,
        downloadUrl: deliveryDetails.downloadUrl,
        deliveredAt: deliveryDetails.deliveredAt
      },
      message: 'Product delivery successful'
    });

  } catch (error) {
    logger.error('Error processing delivery', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SYSTEM.DATABASE_ERROR,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/delivery/:token/status
 * Check delivery status without redeeming token
 */
router.get('/:token/status', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // For now, we'll get the purchase ID from the token record
    // In production, you might want a separate status check method
    res.json({
      success: true,
      message: 'Use GET /api/delivery/:token to redeem your product'
    });

  } catch (error) {
    logger.error('Error checking delivery status', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SYSTEM.DATABASE_ERROR
    });
  }
});

/**
 * POST /api/delivery/:token/extend
 * Extend delivery token expiration (buyer request)
 */
router.post('/:token/extend', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { additionalDays = 7 } = req.body;

    if (additionalDays < 1 || additionalDays > 30) {
      return res.status(400).json({
        success: false,
        message: 'Additional days must be between 1 and 30'
      });
    }

    const extended = deliveryService.extendTokenExpiration(token, additionalDays);

    if (!extended) {
      return res.status(404).json({
        success: false,
        message: 'Token not found or already redeemed'
      });
    }

    res.json({
      success: true,
      message: `Delivery token extended by ${additionalDays} days`
    });

  } catch (error) {
    logger.error('Error extending delivery token', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SYSTEM.DATABASE_ERROR
    });
  }
});

export { router as deliveryRoutes };
