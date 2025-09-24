import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { logger } from '../utils/logger.js';
import { formatValidationError } from '../validation/schemas.js';

export class ValidationMiddleware {
  /**
   * Validate request body against a Zod schema
   */
  public validateBody = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        req.body = schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          logger.warn('Validation error in request body', {
            error: formatValidationError(error),
            body: req.body,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });

          res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
          return;
        }

        logger.error('Unexpected validation error', error);
        res.status(500).json({
          success: false,
          message: 'Internal validation error'
        });
      }
    };
  };

  /**
   * Validate request parameters against a Zod schema
   */
  public validateParams = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        req.params = schema.parse(req.params);
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          logger.warn('Validation error in request parameters', {
            error: formatValidationError(error),
            params: req.params,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });

          res.status(400).json({
            success: false,
            message: 'Invalid parameters',
            errors: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
          return;
        }

        logger.error('Unexpected validation error', error);
        res.status(500).json({
          success: false,
          message: 'Internal validation error'
        });
      }
    };
  };

  /**
   * Validate request query parameters against a Zod schema
   */
  public validateQuery = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        req.query = schema.parse(req.query);
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          logger.warn('Validation error in query parameters', {
            error: formatValidationError(error),
            query: req.query,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });

          res.status(400).json({
            success: false,
            message: 'Invalid query parameters',
            errors: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
          return;
        }

        logger.error('Unexpected validation error', error);
        res.status(500).json({
          success: false,
          message: 'Internal validation error'
        });
      }
    };
  };

  /**
   * Sanitize request body to prevent XSS
   */
  public sanitizeBody = (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (req.body && typeof req.body === 'object') {
        req.body = this.sanitizeObject(req.body);
      }
      next();
    } catch (error) {
      logger.error('Sanitization error', error);
      res.status(500).json({
        success: false,
        message: 'Sanitization error'
      });
    }
  };

  /**
   * Recursively sanitize object properties
   */
  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return obj.trim().replace(/[<>]/g, '');
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }
}

export const validationMiddleware = new ValidationMiddleware();
