import { Router, Request, Response } from 'express';
import { ProductService } from '../services/productService.js';
import { logger } from '../utils/logger.js';
import { sessionMiddleware } from '../middleware/sessionMiddleware.js';
import { validationMiddleware } from '../middleware/validationMiddleware.js';
import {
  createProductSchema,
  productIdSchema,
  paginationSchema
} from '../validation/schemas.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';

const router = Router();
const productService = new ProductService();

// GET /api/products - List products with pagination and filtering
router.get('/', 
  validationMiddleware.validateQuery(paginationSchema),
  async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        search,
        isActive = 'true'
      } = req.query;

      const options = {
        page: Number(page),
        limit: Number(limit),
        category: category as string,
        search: search as string,
        isActive: isActive === 'true'
      };

      const result = await productService.getProducts(options);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error fetching products', error);
      res.status(500).json({
        success: false,
        message: ERROR_MESSAGES.SYSTEM.DATABASE_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/products/:id - Get single product
router.get('/:id', 
  validationMiddleware.validateParams(productIdSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: ERROR_MESSAGES.BUSINESS.PRODUCT_NOT_FOUND
        });
      }

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

// POST /api/products - Create product (admin)
router.post('/', 
  sessionMiddleware.sessionHandler,
  sessionMiddleware.requireAdmin,
  sessionMiddleware.logAdminAction('create_product'),
  validationMiddleware.sanitizeBody,
  validationMiddleware.validateBody(createProductSchema),
  async (req: Request, res: Response) => {
    try {
      const productData = req.body;
      const product = await productService.createProduct(productData);
      
      res.status(201).json({
        success: true,
        data: product,
        message: SUCCESS_MESSAGES.PRODUCT.CREATED
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

// PUT /api/products/:id - Update product (admin)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const product = await productService.updateProduct(id, updateData);
    
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
      message: 'Failed to update product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/products/:id - Delete product (admin)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await productService.deleteProduct(id);

    // deleteProduct throws error if not found, so if we reach here it succeeded

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting product', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/products/sync/blockchain - Sync products from blockchain (admin)
router.post('/sync/blockchain',
  sessionMiddleware.sessionHandler,
  sessionMiddleware.requireAdmin,
  sessionMiddleware.logAdminAction('sync_blockchain'),
  async (req: Request, res: Response) => {
    try {
      logger.info('Starting blockchain sync...');

      const result = await productService.refreshProductsFromBlockchain();

      res.json({
        success: true,
        data: result,
        message: `Blockchain sync complete: ${result.synced} products synced, ${result.errors} errors`
      });
    } catch (error) {
      logger.error('Error syncing from blockchain', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync from blockchain',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export { router as productRoutes };
