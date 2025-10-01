import { Request } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

export interface SessionData {
  sessionId: string;
  userId?: string;
  tempUserId?: string;
  walletAddress?: string;
  isAdmin?: boolean;
  createdAt: Date;
  lastAccessed: Date;
  ipAddress: string;
  userAgent: string;
}

export class SessionService {
  private static instance: SessionService;
  private sessions: Map<string, SessionData> = new Map();
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

  private constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanupExpiredSessions(), this.CLEANUP_INTERVAL);
  }

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Generate a secure session ID
   */
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new session
   */
  public createSession(req: Request, userId?: string, isAdmin: boolean = false): string {
    const sessionId = this.generateSessionId();
    const now = new Date();
    
    const sessionData: SessionData = {
      sessionId,
      userId,
      isAdmin,
      createdAt: now,
      lastAccessed: now,
      ipAddress: this.getClientIP(req),
      userAgent: req.get('User-Agent') || 'unknown'
    };

    this.sessions.set(sessionId, sessionData);
    
    logger.info('Session created', { 
      sessionId: `${sessionId.substring(0, 8)  }...`,
      userId,
      isAdmin,
      ipAddress: sessionData.ipAddress
    });

    return sessionId;
  }

  /**
   * Get session data by session ID
   */
  public getSession(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if session is expired
    const now = new Date();
    if (now.getTime() - session.lastAccessed.getTime() > this.SESSION_TIMEOUT) {
      this.sessions.delete(sessionId);
      logger.info('Session expired', { sessionId: `${sessionId.substring(0, 8)  }...` });
      return null;
    }

    // Update last accessed time
    session.lastAccessed = now;
    return session;
  }

  /**
   * Validate session and return session data
   */
  public validateSession(req: Request): SessionData | null {
    const sessionId = this.getSessionIdFromRequest(req);
    
    if (!sessionId) {
      return null;
    }

    const session = this.getSession(sessionId);
    
    if (!session) {
      return null;
    }

    // Validate IP address (optional - can be disabled for mobile users)
    const currentIP = this.getClientIP(req);
    if (process.env.STRICT_IP_VALIDATION === 'true' && session.ipAddress !== currentIP) {
      logger.security('Session IP mismatch', { 
        sessionId: `${sessionId.substring(0, 8)  }...`,
        expectedIP: session.ipAddress,
        actualIP: currentIP
      });
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Destroy a session
   */
  public destroySession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      logger.info('Session destroyed', { sessionId: `${sessionId.substring(0, 8)  }...` });
    }
    return deleted;
  }

  /**
   * Get session ID from request (cookie or header)
   */
  private getSessionIdFromRequest(req: Request): string | null {
    // Try to get from cookie first
    const cookieSessionId = req.cookies?.sessionId;
    if (cookieSessionId && this.isValidSessionId(cookieSessionId)) {
      return cookieSessionId;
    }

    // Fallback to header
    const headerSessionId = req.get('X-Session-ID');
    if (headerSessionId && this.isValidSessionId(headerSessionId)) {
      return headerSessionId;
    }

    return null;
  }

  /**
   * Validate session ID format
   */
  private isValidSessionId(sessionId: string): boolean {
    return /^[a-f0-9]{64}$/.test(sessionId);
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: Request): string {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           (req.connection as any)?.socket?.remoteAddress ||
           'unknown';
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now.getTime() - session.lastAccessed.getTime() > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Cleaned up expired sessions', { count: cleanedCount });
    }
  }

  /**
   * Get session statistics
   */
  public getSessionStats(): { total: number; active: number; admin: number } {
    const now = new Date();
    let active = 0;
    let admin = 0;

    for (const session of this.sessions.values()) {
      if (now.getTime() - session.lastAccessed.getTime() <= this.SESSION_TIMEOUT) {
        active++;
        if (session.isAdmin) {
          admin++;
        }
      }
    }

    return {
      total: this.sessions.size,
      active,
      admin
    };
  }
}
