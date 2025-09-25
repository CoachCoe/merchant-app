import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { logger } from './logger.js';

// Generic validation middleware factory
export const validate = (schema: z.ZodSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[property];
      const validatedData = schema.parse(data);
      req[property] = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Validation error', {
          requestId: req.requestId,
          path: req.path,
          method: req.method,
          errors: errorMessages,
        });

        res.status(400).json({
          success: false,
          message: 'Validation error',
          errorType: 'VALIDATION_ERROR',
          errors: errorMessages,
          timestamp: Date.now(),
          requestId: req.requestId,
        });
        return;
      }

      logger.error('Validation middleware error', error, {
        requestId: req.requestId,
        path: req.path,
        method: req.method,
      });

      res.status(500).json({
        success: false,
        message: 'Internal validation error',
        errorType: 'INTERNAL_SERVER_ERROR',
        timestamp: Date.now(),
        requestId: req.requestId,
      });
    }
  };
};

// Substrate address validation
export const validateSubstrateAddress = (address: string): boolean => {
  const substrateAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,48}$/;
  return substrateAddressRegex.test(address);
};

// Amount validation (must be positive and within reasonable bounds)
export const validateAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 1000000 && !isNaN(amount) && isFinite(amount);
};

// Chain ID validation
export const validateChainId = (chainId: number): boolean => {
  return Number.isInteger(chainId) && chainId >= 0 && chainId <= 999999;
};

// Transaction hash validation
export const validateTxHash = (txHash: string): boolean => {
  const txHashRegex = /^0x[a-fA-F0-9]{64}$/;
  return txHashRegex.test(txHash);
};

// Sanitize string input
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>"'&]/g, '');
};

// Validate and sanitize merchant address
export const validateMerchantAddress = (address: string): { isValid: boolean; sanitized?: string; error?: string } => {
  if (!address || typeof address !== 'string') {
    return { isValid: false, error: 'Address is required and must be a string' };
  }

  const sanitized = sanitizeString(address);
  
  if (sanitized.length === 0) {
    return { isValid: false, error: 'Address cannot be empty after sanitization' };
  }

  if (sanitized.length > 100) {
    return { isValid: false, error: 'Address is too long' };
  }

  if (!validateSubstrateAddress(sanitized)) {
    return { isValid: false, error: 'Invalid Substrate address format' };
  }

  return { isValid: true, sanitized };
};

// Validate payment amount
export const validatePaymentAmount = (amount: number): { isValid: boolean; error?: string } => {
  if (typeof amount !== 'number') {
    return { isValid: false, error: 'Amount must be a number' };
  }

  if (!validateAmount(amount)) {
    return { isValid: false, error: 'Amount must be between 0.01 and 1,000,000' };
  }

  return { isValid: true };
};

// Validate chain configuration
export const validateChainConfig = (chainId: number, supportedChains: any[]): { isValid: boolean; error?: string } => {
  if (!validateChainId(chainId)) {
    return { isValid: false, error: 'Invalid chain ID format' };
  }

  const chain = supportedChains.find(c => c.id === chainId);
  if (!chain) {
    return { isValid: false, error: `Chain ID ${chainId} is not supported` };
  }

  return { isValid: true };
};

// Comprehensive request validation
export const validatePaymentRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { amount, merchantAddress } = req.body;

  // Validate amount
  const amountValidation = validatePaymentAmount(amount);
  if (!amountValidation.isValid) {
    logger.warn('Invalid payment amount', {
      requestId: req.requestId,
      amount,
      error: amountValidation.error,
    });

    res.status(400).json({
      success: false,
      message: amountValidation.error,
      errorType: 'INVALID_AMOUNT',
      timestamp: Date.now(),
      requestId: req.requestId,
    });
    return;
  }

  // Validate merchant address
  const addressValidation = validateMerchantAddress(merchantAddress);
  if (!addressValidation.isValid) {
    logger.warn('Invalid merchant address', {
      requestId: req.requestId,
      address: merchantAddress,
      error: addressValidation.error,
    });

    res.status(400).json({
      success: false,
      message: addressValidation.error,
      errorType: 'INVALID_MERCHANT_ADDRESS',
      timestamp: Date.now(),
      requestId: req.requestId,
    });
    return;
  }

  // Update request body with sanitized data
  req.body.merchantAddress = addressValidation.sanitized;
  next();
};
