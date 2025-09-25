import { z } from 'zod';

// Common validation patterns
const uuidSchema = z.string().uuid();
const positiveIntegerSchema = z.number().int().positive();
const nonEmptyStringSchema = z.string().min(1).max(255);
const emailSchema = z.string().email().max(255);
const urlSchema = z.string().url().max(500);
const priceSchema = z.number().int().min(0).max(99999999); // Max $999,999.99

// Product validation schemas
export const createProductSchema = z.object({
  name: nonEmptyStringSchema,
  description: z.string().max(1000).optional(),
  price: priceSchema,
  image: urlSchema.optional(),
  category: uuidSchema,
  isActive: z.boolean().optional().default(true)
});

export const updateProductSchema = z.object({
  name: nonEmptyStringSchema.optional(),
  description: z.string().max(1000).optional(),
  price: priceSchema.optional(),
  image: urlSchema.optional(),
  category: uuidSchema.optional(),
  isActive: z.boolean().optional()
});

export const productIdSchema = z.object({
  id: uuidSchema
});

// Category validation schemas
export const createCategorySchema = z.object({
  name: nonEmptyStringSchema,
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional().default(0)
});

export const updateCategorySchema = z.object({
  name: nonEmptyStringSchema.optional(),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional()
});

export const categoryIdSchema = z.object({
  id: uuidSchema
});

// Cart validation schemas
export const addToCartSchema = z.object({
  productId: uuidSchema,
  quantity: z.number().int().min(1).max(100)
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(100)
});

export const cartItemIdSchema = z.object({
  id: uuidSchema
});

// Order validation schemas
export const createOrderSchema = z.object({
  customer: z.object({
    name: nonEmptyStringSchema,
    email: emailSchema
  }).optional()
});

export const orderIdSchema = z.object({
  id: uuidSchema
});

// Admin authentication schemas
export const adminLoginSchema = z.object({
  username: nonEmptyStringSchema,
  password: z.string().min(8).max(128)
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1)).optional().default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100)).optional().default(20)
});

export const categoryFilterSchema = z.object({
  includeInactive: z.string().transform(val => val === 'true').optional().default(false)
});

// Payment validation schemas
export const paymentRequestSchema = z.object({
  amount: z.number().positive().max(999999.99),
  merchantAddress: z.string().min(1).max(100)
});

// WebSocket message schemas
export const websocketMessageSchema = z.object({
  type: z.enum(['transaction_confirmed', 'payment_failure', 'payment_qr', 'connection_status']),
  data: z.any().optional(),
  message: z.string().optional()
});

// Sanitization helpers
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};

export const sanitizeHtml = (html: string): string => {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

// Validation error formatter
export const formatValidationError = (error: z.ZodError): string => {
  return error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ');
};
