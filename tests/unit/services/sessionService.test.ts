import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SessionService } from '../../../src/services/sessionService.js';
import { Request } from 'express';

// Mock the logger
jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('SessionService', () => {
  let sessionService: SessionService;
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    sessionService = SessionService.getInstance();
    mockRequest = {
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0 Test Browser') as any,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a new session with correct properties', () => {
      const sessionId = sessionService.createSession(mockRequest as Request);

      expect(sessionId).toBeDefined();
      expect(sessionId).toMatch(/^[a-f0-9]{32}$/); // UUID without hyphens

      const session = sessionService.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.sessionId).toBe(sessionId);
      expect(session?.ipAddress).toBe('127.0.0.1');
      expect(session?.userAgent).toBe('Mozilla/5.0 Test Browser');
      expect(session?.isAdmin).toBe(false);
      expect(session?.userId).toBeUndefined();
    });

    it('should create an admin session when isAdmin is true', () => {
      const sessionId = sessionService.createSession(mockRequest as Request, 'admin-user', true);

      const session = sessionService.getSession(sessionId);
      expect(session?.isAdmin).toBe(true);
      expect(session?.userId).toBe('admin-user');
    });

    it('should create a user session with userId', () => {
      const sessionId = sessionService.createSession(mockRequest as Request, 'user-123');

      const session = sessionService.getSession(sessionId);
      expect(session?.userId).toBe('user-123');
      expect(session?.isAdmin).toBe(false);
    });
  });

  describe('getSession', () => {
    it('should return session for valid sessionId', () => {
      const sessionId = sessionService.createSession(mockRequest as Request);
      const session = sessionService.getSession(sessionId);

      expect(session).toBeDefined();
      expect(session?.sessionId).toBe(sessionId);
    });

    it('should return undefined for invalid sessionId', () => {
      const session = sessionService.getSession('invalid-session-id');
      expect(session).toBeNull();
    });

    it('should update lastAccessed when accessing session', () => {
      const sessionId = sessionService.createSession(mockRequest as Request);
      const session1 = sessionService.getSession(sessionId);
      const initialAccess = session1?.lastAccessed;

      // Wait a small amount to ensure time difference
      setTimeout(() => {
        const session2 = sessionService.getSession(sessionId);
        expect(session2?.lastAccessed.getTime()).toBeGreaterThan(initialAccess?.getTime() || 0);
      }, 10);
    });
  });

  describe('validateSession', () => {
    it('should return session for valid cookie', () => {
      const sessionId = sessionService.createSession(mockRequest as Request);
      const requestWithCookie = {
        ...mockRequest,
        cookies: { sessionId },
      };

      const session = sessionService.validateSession(requestWithCookie as Request);
      expect(session).toBeDefined();
      expect(session?.sessionId).toBe(sessionId);
    });

    it('should return null for invalid cookie', () => {
      const requestWithInvalidCookie = {
        ...mockRequest,
        cookies: { sessionId: 'invalid-session-id' },
      };

      const session = sessionService.validateSession(requestWithInvalidCookie as Request);
      expect(session).toBeNull();
    });

    it('should return null when no cookie is present', () => {
      const requestWithoutCookie = {
        ...mockRequest,
        cookies: {},
      };

      const session = sessionService.validateSession(requestWithoutCookie as Request);
      expect(session).toBeNull();
    });
  });

  describe('session expiration', () => {
    it('should handle session expiration correctly', () => {
      // Create a session
      const sessionId = sessionService.createSession(mockRequest as Request);
      const session = sessionService.getSession(sessionId);
      
      expect(session).toBeDefined();
      
      // Manually expire the session by setting lastAccessed to past
      if (session) {
        session.lastAccessed = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      }
      
      // Session should be null after expiration
      const expiredSession = sessionService.getSession(sessionId);
      expect(expiredSession).toBeNull();
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SessionService.getInstance();
      const instance2 = SessionService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
});