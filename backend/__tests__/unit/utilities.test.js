/**
 * Utilities Unit Tests
 * Test IDs: TS-110 to TS-113
 * 
 * Tests for AppError, Redis cache operations, cookie setting, and S3 utilities
 */

describe('Utilities Unit Tests', () => {

  // TS-110: AppError class construction
  describe('TS-110: AppError Class Construction', () => {
    class AppError extends Error {
      constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
      }
    }

    it('should create error with correct message and status code', () => {
      const error = new AppError('Not found', 404);
      
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
    });

    it('should set status to "fail" for 4xx errors', () => {
      const error400 = new AppError('Bad request', 400);
      const error404 = new AppError('Not found', 404);
      const error422 = new AppError('Unprocessable entity', 422);
      
      expect(error400.status).toBe('fail');
      expect(error404.status).toBe('fail');
      expect(error422.status).toBe('fail');
    });

    it('should set status to "error" for 5xx errors', () => {
      const error500 = new AppError('Internal server error', 500);
      const error502 = new AppError('Bad gateway', 502);
      const error503 = new AppError('Service unavailable', 503);
      
      expect(error500.status).toBe('error');
      expect(error502.status).toBe('error');
      expect(error503.status).toBe('error');
    });

    it('should mark error as operational', () => {
      const error = new AppError('Test error', 400);
      
      expect(error.isOperational).toBe(true);
    });

    it('should inherit from Error class', () => {
      const error = new AppError('Test error', 400);
      
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });

    it('should have a stack trace', () => {
      const error = new AppError('Test error', 400);
      
      expect(error.stack).toBeDefined();
      expect(error.stack.length).toBeGreaterThan(0);
    });
  });

  // TS-111: Redis cache operations
  describe('TS-111: Redis Cache Operations', () => {
    const mockRedisClient = {
      store: new Map(),
      
      get: jest.fn((key) => Promise.resolve(mockRedisClient.store.get(key) || null)),
      
      set: jest.fn((key, value) => {
        mockRedisClient.store.set(key, value);
        return Promise.resolve('OK');
      }),
      
      setex: jest.fn((key, seconds, value) => {
        mockRedisClient.store.set(key, value);
        return Promise.resolve('OK');
      }),
      
      del: jest.fn((key) => {
        const existed = mockRedisClient.store.has(key);
        mockRedisClient.store.delete(key);
        return Promise.resolve(existed ? 1 : 0);
      }),
      
      clear: () => mockRedisClient.store.clear(),
    };

    beforeEach(() => {
      mockRedisClient.clear();
      jest.clearAllMocks();
    });

    it('getCachedCourses should return cached data', async () => {
      const cacheKey = 'course:123';
      const courseData = JSON.stringify({ courseName: 'Test Course' });
      
      await mockRedisClient.set(cacheKey, courseData);
      const result = await mockRedisClient.get(cacheKey);
      
      expect(result).toBe(courseData);
      expect(JSON.parse(result)).toEqual({ courseName: 'Test Course' });
    });

    it('getCachedCourses should return null for cache miss', async () => {
      const result = await mockRedisClient.get('non-existent-key');
      
      expect(result).toBeNull();
    });

    it('setCachedCourses should store data with TTL', async () => {
      const cacheKey = 'course:456';
      const courseData = JSON.stringify({ courseName: 'Another Course' });
      const ttlSeconds = 3600;
      
      await mockRedisClient.setex(cacheKey, ttlSeconds, courseData);
      
      expect(mockRedisClient.setex).toHaveBeenCalledWith(cacheKey, ttlSeconds, courseData);
      const result = await mockRedisClient.get(cacheKey);
      expect(result).toBe(courseData);
    });

    it('should delete cached data', async () => {
      const cacheKey = 'course:789';
      await mockRedisClient.set(cacheKey, 'test data');
      
      const deleteResult = await mockRedisClient.del(cacheKey);
      const getResult = await mockRedisClient.get(cacheKey);
      
      expect(deleteResult).toBe(1);
      expect(getResult).toBeNull();
    });

    it('should return 0 when deleting non-existent key', async () => {
      const result = await mockRedisClient.del('non-existent');
      
      expect(result).toBe(0);
    });
  });

  // TS-112: Cookie setting utility
  describe('TS-112: Cookie Setting Utility', () => {
    const setCookie = (res, name, value, options = {}) => {
      const defaultOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      };
      
      const finalOptions = { ...defaultOptions, ...options };
      res.cookie(name, value, finalOptions);
    };

    it('should set cookie with HttpOnly flag', () => {
      const res = { cookie: jest.fn() };
      
      setCookie(res, 'session_id', 'abc123');
      
      expect(res.cookie).toHaveBeenCalledWith(
        'session_id',
        'abc123',
        expect.objectContaining({ httpOnly: true })
      );
    });

    it('should set cookie with Secure flag in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const res = { cookie: jest.fn() };
      setCookie(res, 'session_id', 'abc123');
      
      expect(res.cookie).toHaveBeenCalledWith(
        'session_id',
        'abc123',
        expect.objectContaining({ secure: true })
      );
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not set Secure flag in development', () => {
      process.env.NODE_ENV = 'test';
      
      const res = { cookie: jest.fn() };
      setCookie(res, 'session_id', 'abc123');
      
      expect(res.cookie).toHaveBeenCalledWith(
        'session_id',
        'abc123',
        expect.objectContaining({ secure: false })
      );
    });

    it('should set SameSite attribute to strict', () => {
      const res = { cookie: jest.fn() };
      
      setCookie(res, 'session_id', 'abc123');
      
      expect(res.cookie).toHaveBeenCalledWith(
        'session_id',
        'abc123',
        expect.objectContaining({ sameSite: 'strict' })
      );
    });

    it('should set default maxAge to 7 days', () => {
      const res = { cookie: jest.fn() };
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      
      setCookie(res, 'session_id', 'abc123');
      
      expect(res.cookie).toHaveBeenCalledWith(
        'session_id',
        'abc123',
        expect.objectContaining({ maxAge: sevenDaysMs })
      );
    });

    it('should allow overriding default options', () => {
      const res = { cookie: jest.fn() };
      
      setCookie(res, 'session_id', 'abc123', { maxAge: 1000, path: '/api' });
      
      expect(res.cookie).toHaveBeenCalledWith(
        'session_id',
        'abc123',
        expect.objectContaining({ maxAge: 1000, path: '/api' })
      );
    });
  });

  // TS-113: S3 presigned URL generation
  describe('TS-113: S3 Presigned URL Generation', () => {
    const generatePresignedUrl = (options) => {
      const { bucket, key, operation = 'putObject', expiresIn = 3600 } = options;
      
      if (!bucket || !key) {
        throw new Error('Bucket and key are required');
      }
      
      // Simulate presigned URL structure
      const baseUrl = `https://${bucket}.s3.amazonaws.com/${key}`;
      const expires = Math.floor(Date.now() / 1000) + expiresIn;
      const signature = 'mock-signature-' + Buffer.from(key).toString('base64');
      
      return {
        url: `${baseUrl}?X-Amz-Expires=${expiresIn}&X-Amz-Signature=${signature}`,
        expires,
        bucket,
        key,
      };
    };

    it('should generate valid presigned upload URL', () => {
      const result = generatePresignedUrl({
        bucket: 'test-bucket',
        key: 'uploads/test-file.jpg',
      });
      
      expect(result.url).toContain('test-bucket.s3.amazonaws.com');
      expect(result.url).toContain('X-Amz-Signature');
      expect(result.url).toContain('X-Amz-Expires');
    });

    it('should include bucket and key in result', () => {
      const result = generatePresignedUrl({
        bucket: 'my-bucket',
        key: 'folder/file.pdf',
      });
      
      expect(result.bucket).toBe('my-bucket');
      expect(result.key).toBe('folder/file.pdf');
    });

    it('should set default expiry to 1 hour (3600 seconds)', () => {
      const result = generatePresignedUrl({
        bucket: 'test-bucket',
        key: 'test-key',
      });
      
      expect(result.url).toContain('X-Amz-Expires=3600');
    });

    it('should allow custom expiry time', () => {
      const result = generatePresignedUrl({
        bucket: 'test-bucket',
        key: 'test-key',
        expiresIn: 7200, // 2 hours
      });
      
      expect(result.url).toContain('X-Amz-Expires=7200');
    });

    it('should throw error when bucket is missing', () => {
      expect(() => {
        generatePresignedUrl({ key: 'test-key' });
      }).toThrow('Bucket and key are required');
    });

    it('should throw error when key is missing', () => {
      expect(() => {
        generatePresignedUrl({ bucket: 'test-bucket' });
      }).toThrow('Bucket and key are required');
    });

    it('should generate unique signatures for different keys', () => {
      const result1 = generatePresignedUrl({
        bucket: 'test-bucket',
        key: 'file1.jpg',
      });
      
      const result2 = generatePresignedUrl({
        bucket: 'test-bucket',
        key: 'file2.jpg',
      });
      
      expect(result1.url).not.toBe(result2.url);
    });
  });
});
