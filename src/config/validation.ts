import { z } from 'zod';

// Environment variable validation schema
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number).pipe(z.number().min(1).max(65535)),
  JWT_SECRET: z.string().min(32).optional(),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number).pipe(z.number().positive()), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number).pipe(z.number().positive()),
});

// API request validation schemas
export const paymentRequestSchema = z.object({
  amount: z.number().positive().max(1000000), // Max $1M
  merchantAddress: z.string().min(1).max(100),
});

export const qrCodeRequestSchema = z.object({
  amount: z.number().positive().max(1000000),
  merchantAddress: z.string().min(1).max(100),
});

export const walletScanRequestSchema = z.object({
  address: z.string().min(1).max(100).optional(),
});

// Substrate address validation
export const substrateAddressSchema = z.string().regex(
  /^[1-9A-HJ-NP-Za-km-z]{32,48}$/,
  'Invalid Substrate address format'
);

// Chain ID validation
export const chainIdSchema = z.number().int().min(0).max(999999);

// Transaction hash validation
export const txHashSchema = z.string().regex(
  /^0x[a-fA-F0-9]{64}$/,
  'Invalid transaction hash format'
);

// Amount validation (in smallest units)
export const amountSchema = z.bigint().positive();

// Error response schema
export const errorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errorType: z.string().optional(),
  timestamp: z.number(),
  requestId: z.string().optional(),
});

// Success response schema
export const successResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  data: z.any().optional(),
  timestamp: z.number(),
  requestId: z.string().optional(),
});

export type PaymentRequest = z.infer<typeof paymentRequestSchema>;
export type QRCodeRequest = z.infer<typeof qrCodeRequestSchema>;
export type WalletScanRequest = z.infer<typeof walletScanRequestSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type SuccessResponse = z.infer<typeof successResponseSchema>;
