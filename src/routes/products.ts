import { Router, Request, Response } from 'express';
import { ProductService } from '../services/productService.js';
import { logger } from '../utils/logger.js';

const router = Router();
const productService = new ProductService();

// GET /api/products - List products with pagination and filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      category,
      search,
      isActive = 'true'
    } = req.query;

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
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
      message: 'Failed to fetch products',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
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
      message: 'Failed to fetch product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/products - Create product (admin)
router.post('/', async (req: Request, res: Response) => {
  try {
    const productData = req.body;
    
    // Basic validation
    if (!productData.name || !productData.price || productData.price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Name and valid price are required'
      });
    }

    const product = await productService.createProduct(productData);
    
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    logger.error('Error creating product', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

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
      message: 'Failed to delete product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as productRoutes };
