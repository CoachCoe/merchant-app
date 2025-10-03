import { Router, Request, Response } from 'express';
import { PurchaseService } from '../services/purchaseService.js';
import { logger } from '../utils/logger.js';
import { ERROR_MESSAGES } from '../config/constants.js';

const router = Router();
const purchaseService = new PurchaseService();

/**
 * GET /api/sellers/:walletAddress/reputation
 * Get seller reputation (transaction count)
 */
router.get('/:walletAddress/reputation', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress || walletAddress.length < 40) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address'
      });
    }

    const transactionCount = purchaseService.getSellerTransactionCount(walletAddress);
    const purchases = purchaseService.getPurchasesBySeller(walletAddress);

    // Calculate total sales volume
    const totalVolume = purchases.reduce((sum, p) => sum + p.amountHollar, 0);

    // Calculate average transaction value
    const averageValue = transactionCount > 0 ? totalVolume / transactionCount : 0;

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPurchases = purchases.filter(p =>
      new Date(p.createdAt) >= thirtyDaysAgo
    );

    res.json({
      success: true,
      data: {
        walletAddress,
        transactionCount,
        totalVolume,
        averageValue,
        recentActivityCount: recentPurchases.length,
        firstSaleDate: purchases.length > 0
          ? purchases[purchases.length - 1].createdAt
          : null,
        lastSaleDate: purchases.length > 0
          ? purchases[0].createdAt
          : null
      }
    });

  } catch (error) {
    logger.error('Error fetching seller reputation', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SYSTEM.DATABASE_ERROR,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/sellers/:walletAddress/sales
 * Get seller's sales history
 */
router.get('/:walletAddress/sales', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const purchases = purchaseService.getPurchasesBySeller(walletAddress);

    // Paginate results
    const paginatedPurchases = purchases.slice(
      Number(offset),
      Number(offset) + Number(limit)
    );

    res.json({
      success: true,
      data: {
        purchases: paginatedPurchases,
        total: purchases.length,
        limit: Number(limit),
        offset: Number(offset)
      }
    });

  } catch (error) {
    logger.error('Error fetching seller sales', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SYSTEM.DATABASE_ERROR
    });
  }
});

export { router as sellerRoutes };
