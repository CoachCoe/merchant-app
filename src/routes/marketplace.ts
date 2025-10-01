import { Router, Request, Response } from 'express';
import { AnonymousUserService } from '../services/anonymousUserService.js';
import { logger } from '../utils/logger.js';
import { sessionMiddleware } from '../middleware/sessionMiddleware.js';

const router = Router();
const userService = new AnonymousUserService();

router.use(sessionMiddleware.sessionHandler);

router.get('/users/:id?', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id || req.session?.tempUserId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required'
      });
    }

    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    logger.error('Error fetching user', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

router.post('/users', async (req: Request, res: Response) => {
  try {
    const userData = {
      walletAddress: req.body.walletAddress,
      preferences: req.body.preferences,
      privacy: req.body.privacy
    };

    const user = await userService.createUser(userData);

    res.status(201).json({
      success: true,
      user
    });
  } catch (error) {
    logger.error('Error creating user', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await userService.updateUser(id, updates);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    logger.error('Error updating user', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

router.get('/products', async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: 'Marketplace products not yet implemented. Use /api/products for current product catalog.'
  });
});

router.post('/products', async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: 'Marketplace product creation not yet implemented. Wallet authentication required (coming in Week 3).'
  });
});

router.get('/transactions', async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: 'Escrow transactions not yet implemented. Smart contracts coming in Week 6-9.'
  });
});

router.post('/transactions', async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: 'Escrow transactions not yet implemented. Smart contracts coming in Week 6-9.'
  });
});

export default router;
