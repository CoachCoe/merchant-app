import { Request, Response, NextFunction } from 'express';
import { SessionService, SessionData } from '../services/sessionService.js';
import { logger } from '../utils/logger.js';

// Extend Express Request interface to include session
declare global {
  namespace Express {
    interface Request {
      session?: SessionData;
    }
  }
}

export class SessionMiddleware {
  private sessionService: SessionService;

  constructor() {
    this.sessionService = SessionService.getInstance();
  }

  /**
   * Middleware to handle session management
   */
  public sessionHandler = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const session = this.sessionService.validateSession(req);
      
      if (session) {
        req.session = session;
        logger.debug('Session validated', { 
          sessionId: session.sessionId.substring(0, 8) + '...',
          userId: session.userId,
          isAdmin: session.isAdmin
        });
      } else {
        // Create anonymous session for cart functionality
        const sessionId = this.sessionService.createSession(req);
        req.session = this.sessionService.getSession(sessionId)!;
        
        // Set session cookie
        res.cookie('sessionId', sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        logger.debug('Anonymous session created', { 
          sessionId: sessionId.substring(0, 8) + '...'
        });
      }

      next();
    } catch (error) {
      logger.error('Session middleware error', error);
      res.status(500).json({
        success: false,
        message: 'Session error'
      });
    }
  };

  /**
   * Middleware to require authentication
   */
  public requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session || !req.session.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    next();
  };

  /**
   * Middleware to require admin privileges
   */
  public requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session || !req.session.isAdmin) {
      logger.security('Unauthorized admin access attempt', {
        sessionId: req.session?.sessionId?.substring(0, 8) + '...',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
      return;
    }

    next();
  };

  /**
   * Middleware to log admin actions
   */
  public logAdminAction = (action: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (req.session?.isAdmin) {
        logger.info('Admin action', {
          action,
          adminId: req.session.userId,
          sessionId: req.session.sessionId.substring(0, 8) + '...',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
      next();
    };
  };
}

export const sessionMiddleware = new SessionMiddleware();
