import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationMiddleware } from '../../../src/middleware/validationMiddleware.js';

// Mock the logger
jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ValidationMiddleware', () => {
  let validationMiddleware: ValidationMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    validationMiddleware = new ValidationMiddleware();
    mockRequest = {
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Test User Agent') as any,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
    mockNext = jest.fn();
  });

  describe('validateBody', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      age: z.number().min(0),
    });

    it('should pass valid data', () => {
      mockRequest.body = { name: 'John', age: 25 };
      
      validationMiddleware.validateBody(testSchema)(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject invalid data', () => {
      mockRequest.body = { name: '', age: -1 };
      
      validationMiddleware.validateBody(testSchema)(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Validation error',
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'name',
              message: expect.any(String),
            }),
            expect.objectContaining({
              field: 'age',
              message: expect.any(String),
            }),
          ]),
        })
      );
    });

    it('should handle missing required fields', () => {
      mockRequest.body = {};
      
      validationMiddleware.validateBody(testSchema)(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateParams', () => {
    const testSchema = z.object({
      id: z.string().uuid(),
    });

    it('should pass valid UUID parameter', () => {
      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
      
      validationMiddleware.validateParams(testSchema)(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject invalid UUID parameter', () => {
      mockRequest.params = { id: 'invalid-uuid' };
      
      validationMiddleware.validateParams(testSchema)(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateQuery', () => {
    const testSchema = z.object({
      page: z.string().transform(Number).pipe(z.number().min(1)),
      limit: z.string().transform(Number).pipe(z.number().min(1).max(100)),
    });

    it('should pass valid query parameters', () => {
      mockRequest.query = { page: '1', limit: '10' };
      
      validationMiddleware.validateQuery(testSchema)(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject invalid query parameters', () => {
      mockRequest.query = { page: '0', limit: '101' };
      
      validationMiddleware.validateQuery(testSchema)(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('sanitizeBody', () => {
    it('should sanitize string values in body', () => {
      mockRequest.body = {
        name: '<script>alert("xss")</script>John',
        description: 'Normal text',
        age: 25,
      };
      
      validationMiddleware.sanitizeBody(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockRequest.body.name).not.toContain('<script>');
      expect(mockRequest.body.description).toBe('Normal text');
      expect(mockRequest.body.age).toBe(25);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle non-object body', () => {
      mockRequest.body = 'string body';
      
      validationMiddleware.sanitizeBody(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle null body', () => {
      mockRequest.body = null;
      
      validationMiddleware.sanitizeBody(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle unexpected validation errors', () => {
      const invalidSchema = z.object({
        test: z.string(),
      });
      
      // Mock a scenario that would cause an unexpected error
      jest.spyOn(invalidSchema, 'parse').mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      mockRequest.body = { test: 'value' };
      
      validationMiddleware.validateBody(invalidSchema)(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Internal validation error',
        })
      );
    });
  });
});
