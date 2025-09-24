// Application configuration constants
export const APP_CONFIG = {
  // Database
  DATABASE: {
    PATH: process.env.DATABASE_PATH || 'data/merchant.db',
    CONNECTION_TIMEOUT: 30000,
    QUERY_TIMEOUT: 10000
  },

  // Session management
  SESSION: {
    TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
    COOKIE_NAME: 'sessionId',
    COOKIE_OPTIONS: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  },

  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: {
      GENERAL: 100,
      AUTH: 5,
      PAYMENT: 10,
      ADMIN: 50
    }
  },

  // Security
  SECURITY: {
    STRICT_IP_VALIDATION: process.env.STRICT_IP_VALIDATION === 'true',
    CORS_ORIGINS: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001']
  },

  // Payment
  PAYMENT: {
    DEFAULT_MERCHANT_ADDRESS: process.env.MERCHANT_ADDRESS || 'EUfWfTP84xqpnd8GUpUAGWrvP7M6cHNJ2QT37RRYyEbWpei',
    SUPPORTED_TOKENS: ['DOT', 'KSM', 'USDC'] as const,
    TAX_RATE: 0.08, // 8%
    MIN_AMOUNT: 0.01, // $0.01
    MAX_AMOUNT: 999999.99 // $999,999.99
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },

  // File uploads
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    UPLOAD_PATH: 'uploads/'
  },

  // Logging
  LOGGING: {
    LEVEL: process.env.LOG_LEVEL || 'info',
    MAX_LOG_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_LOG_FILES: 5
  }
} as const;

// Validation limits
export const VALIDATION_LIMITS = {
  STRING: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 255,
    DESCRIPTION_MAX_LENGTH: 1000,
    EMAIL_MAX_LENGTH: 255,
    URL_MAX_LENGTH: 500
  },
  NUMBER: {
    MIN_PRICE: 0,
    MAX_PRICE: 99999999, // $999,999.99 in cents
    MIN_QUANTITY: 0,
    MAX_QUANTITY: 100,
    MIN_PAGE: 1,
    MAX_PAGE: 10000
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128
  }
} as const;

// Error messages
export const ERROR_MESSAGES = {
  VALIDATION: {
    REQUIRED: 'This field is required',
    INVALID_EMAIL: 'Please provide a valid email address',
    INVALID_URL: 'Please provide a valid URL',
    INVALID_UUID: 'Please provide a valid ID',
    INVALID_PRICE: 'Price must be between $0.00 and $999,999.99',
    INVALID_QUANTITY: 'Quantity must be between 0 and 100',
    INVALID_PAGE: 'Page must be a positive number',
    INVALID_LIMIT: 'Limit must be between 1 and 100'
  },
  AUTH: {
    SESSION_REQUIRED: 'Valid session required',
    AUTHENTICATION_REQUIRED: 'Authentication required',
    ADMIN_REQUIRED: 'Admin privileges required',
    INVALID_CREDENTIALS: 'Invalid username or password'
  },
  BUSINESS: {
    PRODUCT_NOT_FOUND: 'Product not found',
    CATEGORY_NOT_FOUND: 'Category not found',
    CART_EMPTY: 'Cart is empty',
    CART_ITEM_NOT_FOUND: 'Cart item not found',
    ORDER_NOT_FOUND: 'Order not found',
    INSUFFICIENT_STOCK: 'Insufficient stock available',
    PAYMENT_FAILED: 'Payment processing failed'
  },
  SYSTEM: {
    INTERNAL_ERROR: 'Internal server error',
    DATABASE_ERROR: 'Database operation failed',
    VALIDATION_ERROR: 'Validation failed',
    RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later'
  }
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  PRODUCT: {
    CREATED: 'Product created successfully',
    UPDATED: 'Product updated successfully',
    DELETED: 'Product deleted successfully'
  },
  CATEGORY: {
    CREATED: 'Category created successfully',
    UPDATED: 'Category updated successfully',
    DELETED: 'Category deleted successfully'
  },
  CART: {
    ITEM_ADDED: 'Item added to cart',
    ITEM_UPDATED: 'Cart item updated',
    ITEM_REMOVED: 'Item removed from cart',
    CART_CLEARED: 'Cart cleared successfully'
  },
  ORDER: {
    CREATED: 'Order created successfully',
    UPDATED: 'Order updated successfully',
    PAYMENT_PROCESSING: 'Payment is being processed',
    PAYMENT_COMPLETED: 'Payment completed successfully'
  }
} as const;
