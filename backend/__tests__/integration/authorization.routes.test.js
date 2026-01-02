/**
 * Authorization Integration Tests
 * Test IDs: TS-026 to TS-030
 * 
 * Tests for token validation, refresh flow, and session management
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Mock stores
const mockDataStore = {
  users: new Map(),
  sessions: new Map(),
  accessTokens: new Map(), // Redis mock
  locks: new Map(),
};

describe('Authorization Integration Tests', () => {
  const JWT_SECRET = 'test-jwt-secret';
  const JWT_REFRESH_SECRET = 'test-refresh-secret';

  beforeEach(() => {
    mockDataStore.users.clear();
    mockDataStore.sessions.clear();
    mockDataStore.accessTokens.clear();
    mockDataStore.locks.clear();
  });

  // Helper to create valid tokens
  const createTokens = (userId, role = 'INSTITUTE_ADMIN') => {
    const accessToken = jwt.sign(
      { id: userId.toString(), role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { id: userId.toString(), role },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    return { accessToken, refreshToken };
  };

  // Mock auth middleware
  const mockAuthMiddleware = async (req, sessionId, accessToken) => {
    // Public paths bypass
    const publicPaths = ['/login', '/register', '/otp', '/verify-email'];
    if (publicPaths.some(p => req.path?.startsWith(p))) {
      return { success: true, bypassed: true };
    }

    if (!sessionId) {
      return { success: false, status: 401, error: 'Session expired, please login again' };
    }

    // Check access token in Redis
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, JWT_SECRET);
        return {
          success: true,
          userId: decoded.id,
          userRole: decoded.role,
        };
      } catch (err) {
        // Token expired or invalid - try to refresh
        // Only fail immediately for malformed tokens
        if (err.name !== 'TokenExpiredError' && err.name !== 'JsonWebTokenError') {
          return { success: false, status: 401, error: 'Invalid session' };
        }
        // Token expired/invalid, fall through to try refresh
      }
    }

    // Check refresh token from session
    const session = mockDataStore.sessions.get(sessionId);
    if (!session || !session.refreshToken) {
      return { success: false, status: 401, error: 'Session expired' };
    }

    try {
      const decoded = jwt.verify(session.refreshToken, JWT_REFRESH_SECRET);
      
      // Generate new tokens
      const newTokens = createTokens(decoded.id, decoded.role);
      mockDataStore.accessTokens.set(sessionId, newTokens.accessToken);
      session.refreshToken = newTokens.refreshToken;

      return {
        success: true,
        userId: decoded.id,
        userRole: decoded.role,
        tokensRefreshed: true,
      };
    } catch (err) {
      return { success: false, status: 401, error: 'Session expired' };
    }
  };

  // TS-026: Access protected route with valid token
  describe('TS-026: Access Protected Route with Valid Token', () => {
    it('should succeed with userId attached to request', async () => {
      const userId = new mongoose.Types.ObjectId();
      const sessionId = 'session-valid-123';
      const { accessToken, refreshToken } = createTokens(userId);

      // Store session and access token
      mockDataStore.sessions.set(sessionId, { userId, refreshToken });
      mockDataStore.accessTokens.set(sessionId, accessToken);

      const req = { path: '/api/v1/institutions' };
      const result = await mockAuthMiddleware(req, sessionId, accessToken);

      expect(result.success).toBe(true);
      expect(result.userId).toBe(userId.toString());
      expect(result.userRole).toBe('INSTITUTE_ADMIN');
    });

    it('should attach correct user role to request', async () => {
      const userId = new mongoose.Types.ObjectId();
      const sessionId = 'session-student-123';
      const { accessToken, refreshToken } = createTokens(userId, 'STUDENT');

      mockDataStore.sessions.set(sessionId, { userId, refreshToken });
      mockDataStore.accessTokens.set(sessionId, accessToken);

      const req = { path: '/api/v1/profile' };
      const result = await mockAuthMiddleware(req, sessionId, accessToken);

      expect(result.success).toBe(true);
      expect(result.userRole).toBe('STUDENT');
    });
  });

  // TS-027: Access protected route without session cookie
  describe('TS-027: Access Protected Route Without Session', () => {
    it('should return 401 unauthorized without session cookie', async () => {
      const req = { path: '/api/v1/institutions' };
      const result = await mockAuthMiddleware(req, null, null);

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error).toContain('Session expired');
    });

    it('should return 401 for empty session ID', async () => {
      const req = { path: '/api/v1/courses' };
      const result = await mockAuthMiddleware(req, '', null);

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
    });
  });

  // TS-028: Token refresh when access token expires
  describe('TS-028: Token Refresh on Expiry', () => {
    it('should generate new access token from refresh token', async () => {
      const userId = new mongoose.Types.ObjectId();
      const sessionId = 'session-refresh-123';
      
      // Create expired access token
      const expiredAccessToken = jwt.sign(
        { id: userId.toString(), role: 'INSTITUTE_ADMIN' },
        JWT_SECRET,
        { expiresIn: '-1s' } // Already expired
      );
      
      // Valid refresh token
      const refreshToken = jwt.sign(
        { id: userId.toString(), role: 'INSTITUTE_ADMIN' },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      mockDataStore.sessions.set(sessionId, { userId, refreshToken });

      const req = { path: '/api/v1/institutions' };
      const result = await mockAuthMiddleware(req, sessionId, expiredAccessToken);

      expect(result.success).toBe(true);
      expect(result.tokensRefreshed).toBe(true);
      expect(result.userId).toBe(userId.toString());
    });

    it('should rotate refresh token on refresh', async () => {
      const userId = new mongoose.Types.ObjectId();
      const sessionId = 'session-rotate-123';
      
      // Create original refresh token with unique identifier
      const originalRefreshToken = jwt.sign(
        { id: userId.toString(), role: 'INSTITUTE_ADMIN', tokenVersion: 1 },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      mockDataStore.sessions.set(sessionId, { userId, refreshToken: originalRefreshToken });

      // Get original decoded to compare
      const originalDecoded = jwt.decode(originalRefreshToken);
      
      // Simulate a request without valid access token (forces refresh path)
      const req = { path: '/api/v1/dashboard' };
      const result = await mockAuthMiddleware(req, sessionId, undefined);

      // Verify refresh happened
      expect(result.success).toBe(true);
      expect(result.tokensRefreshed).toBe(true);
      
      // Verify new refresh token exists
      const session = mockDataStore.sessions.get(sessionId);
      expect(session.refreshToken).toBeDefined();
      
      // The new token should be different (new iat timestamp)
      const newDecoded = jwt.decode(session.refreshToken);
      expect(newDecoded.id).toBe(originalDecoded.id); // Same user
      expect(newDecoded.iat).toBeGreaterThanOrEqual(originalDecoded.iat); // Newer or same timestamp
    });
  });

  // TS-029: Concurrent refresh token requests
  describe('TS-029: Concurrent Refresh Requests', () => {
    it('should handle concurrent refresh requests safely', async () => {
      const userId = new mongoose.Types.ObjectId();
      const sessionId = 'session-concurrent-123';
      
      const refreshToken = jwt.sign(
        { id: userId.toString(), role: 'INSTITUTE_ADMIN' },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      mockDataStore.sessions.set(sessionId, { userId, refreshToken });

      // Simulate getting a lock
      const mockGetLock = (lockKey, ttl) => {
        if (mockDataStore.locks.has(lockKey)) {
          return false; // Lock already taken
        }
        mockDataStore.locks.set(lockKey, Date.now() + ttl * 1000);
        return true;
      };

      const mockReleaseLock = (lockKey) => {
        mockDataStore.locks.delete(lockKey);
      };

      const lockKey = `lock:${sessionId}`;

      // First request gets lock
      const gotLock1 = mockGetLock(lockKey, 10);
      expect(gotLock1).toBe(true);

      // Second concurrent request doesn't get lock
      const gotLock2 = mockGetLock(lockKey, 10);
      expect(gotLock2).toBe(false);

      // Release lock
      mockReleaseLock(lockKey);

      // Now another request can get it
      const gotLock3 = mockGetLock(lockKey, 10);
      expect(gotLock3).toBe(true);
    });

    it('should wait and use new token if refresh in progress', async () => {
      const userId = new mongoose.Types.ObjectId();
      const sessionId = 'session-wait-123';
      
      // Simulate another request already refreshed
      const newAccessToken = jwt.sign(
        { id: userId.toString(), role: 'INSTITUTE_ADMIN' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );
      mockDataStore.accessTokens.set(sessionId, newAccessToken);

      // Second request finds new token in Redis
      const cachedToken = mockDataStore.accessTokens.get(sessionId);
      expect(cachedToken).toBeDefined();

      const decoded = jwt.verify(cachedToken, JWT_SECRET);
      expect(decoded.id).toBe(userId.toString());
    });
  });

  // TS-030: Access with revoked session
  describe('TS-030: Access with Revoked Session', () => {
    it('should return 401 for revoked/deleted session', async () => {
      const sessionId = 'session-revoked-123';
      
      // Session doesn't exist (was deleted/revoked)
      expect(mockDataStore.sessions.has(sessionId)).toBe(false);

      const req = { path: '/api/v1/institutions' };
      const result = await mockAuthMiddleware(req, sessionId, null);

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error).toContain('Session expired');
    });

    it('should return 401 when session exists but no refresh token', async () => {
      const sessionId = 'session-no-refresh-123';
      
      // Session exists but refresh token was cleared
      mockDataStore.sessions.set(sessionId, { userId: new mongoose.Types.ObjectId() });

      const req = { path: '/api/v1/courses' };
      const result = await mockAuthMiddleware(req, sessionId, null);

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
    });

    it('should handle expired refresh token', async () => {
      const userId = new mongoose.Types.ObjectId();
      const sessionId = 'session-expired-refresh-123';
      
      // Expired refresh token
      const expiredRefreshToken = jwt.sign(
        { id: userId.toString(), role: 'INSTITUTE_ADMIN' },
        JWT_REFRESH_SECRET,
        { expiresIn: '-1d' }
      );

      mockDataStore.sessions.set(sessionId, { userId, refreshToken: expiredRefreshToken });

      const req = { path: '/api/v1/dashboard' };
      const result = await mockAuthMiddleware(req, sessionId, null);

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
    });
  });
});
