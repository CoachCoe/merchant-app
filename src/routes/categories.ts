import { Router, Request, Response } from 'express';
import { CategoryService } from '../services/categoryService.js';
import { logger } from '../utils/logger.js';

const router = Router();
const categoryService = new CategoryService();

// GET /api/categories - List categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const { includeInactive = 'false' } = req.query;
    const result = await categoryService.getCategories(includeInactive === 'true');
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching categories', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/categories/:id - Get single category
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    logger.error('Error fetching category', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/categories - Create category (admin)
router.post('/', async (req: Request, res: Response) => {
  try {
    const categoryData = req.body;
    
    // Basic validation
    if (!categoryData.name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const category = await categoryService.createCategory(categoryData);
    
    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    logger.error('Error creating category', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/categories/:id - Update category (admin)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const category = await categoryService.updateCategory(id, updateData);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    logger.error('Error updating category', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/categories/:id - Delete category (admin)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await categoryService.deleteCategory(id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting category', error);
    
    if (error instanceof Error && error.message.includes('existing products')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing products'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as categoryRoutes };
