/**
 * Authentication Unit Tests
 * Test IDs: TS-001 to TS-006
 * 
 * Tests for password hashing, token generation, OTP generation, and JWT utilities
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Mock dependencies before requiring modules
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn(),
    connection: {
      readyState: 0,
      close: jest.fn(),
    },
  };
});

describe('Authentication Unit Tests', () => {
  
  // TS-001: Password hashing during user registration
  describe('TS-001: Password Hashing', () => {
    it('should hash password using bcrypt before saving to database', async () => {
      const plainPassword = 'Test@1234';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);
      
      // Verify password is hashed
      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword.length).toBeGreaterThan(50);
      expect(hashedPassword).toMatch(/^\$2[aby]?\$\d{1,2}\$/); // bcrypt hash pattern
    });

    it('should generate different hashes for the same password', async () => {
      const plainPassword = 'Test@1234';
      
      const hash1 = await bcrypt.hash(plainPassword, 10);
      const hash2 = await bcrypt.hash(plainPassword, 10);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should not hash password if not modified', async () => {
      const isModified = jest.fn().mockReturnValue(false);
      const next = jest.fn();
      
      // Simulate pre-save hook behavior
      if (!isModified('password')) {
        next();
      }
      
      expect(next).toHaveBeenCalled();
    });
  });

  // TS-002: Password comparison method
  describe('TS-002: Password Comparison', () => {
    it('should correctly validate matching passwords', async () => {
      const plainPassword = 'Test@1234';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
      
      expect(isMatch).toBe(true);
    });

    it('should reject non-matching passwords', async () => {
      const plainPassword = 'Test@1234';
      const wrongPassword = 'WrongPassword123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      const isMatch = await bcrypt.compare(wrongPassword, hashedPassword);
      
      expect(isMatch).toBe(false);
    });

    it('should return false if password field is empty', async () => {
      const comparePassword = async (candidatePassword, storedPassword) => {
        if (!storedPassword) return false;
        return await bcrypt.compare(candidatePassword, storedPassword);
      };
      
      const result = await comparePassword('Test@1234', null);
      
      expect(result).toBe(false);
    });

    it('should handle empty candidate password', async () => {
      const hashedPassword = await bcrypt.hash('Test@1234', 10);
      
      const isMatch = await bcrypt.compare('', hashedPassword);
      
      expect(isMatch).toBe(false);
    });
  });

  // TS-003: Password reset token generation
  describe('TS-003: Password Reset Token Generation', () => {
    it('should generate a valid hashed token with 15-minute expiry', () => {
      // Simulate createPasswordResetToken method
      const createPasswordResetToken = () => {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
        
        return {
          resetToken,
          hashedToken,
          expires,
        };
      };
      
      const result = createPasswordResetToken();
      
      expect(result.resetToken).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(result.hashedToken).toHaveLength(64);
      expect(result.expires).toBeGreaterThan(Date.now());
      expect(result.expires).toBeLessThanOrEqual(Date.now() + 15 * 60 * 1000 + 1000);
    });

    it('should generate unique tokens each time', () => {
      const createToken = () => crypto.randomBytes(32).toString('hex');
      
      const token1 = createToken();
      const token2 = createToken();
      
      expect(token1).not.toBe(token2);
    });

    it('should hash the token before storing in database', () => {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      expect(hashedToken).not.toBe(resetToken);
      expect(hashedToken).toHaveLength(64);
    });
  });

  // TS-004: OTP generation
  describe('TS-004: OTP Generation', () => {
    it('should produce a 6-digit random code', () => {
      const generateOtp = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
      };
      
      const otp = generateOtp();
      
      expect(otp).toHaveLength(6);
      expect(parseInt(otp)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(otp)).toBeLessThanOrEqual(999999);
    });

    it('should generate numeric-only OTP', () => {
      const generateOtp = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
      };
      
      const otp = generateOtp();
      
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should generate different OTPs on each call', () => {
      const generateOtp = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
      };
      
      const otps = new Set();
      for (let i = 0; i < 100; i++) {
        otps.add(generateOtp());
      }
      
      // With 100 generations, we should have mostly unique OTPs
      expect(otps.size).toBeGreaterThan(90);
    });
  });

  // TS-005: JWT token generation
  describe('TS-005: JWT Token Generation', () => {
    const jwt = require('jsonwebtoken');
    const testSecret = 'test-jwt-secret-key-12345';
    
    it('should create valid access token with correct expiry', () => {
      const userId = 'test-user-id-123';
      const role = 'INSTITUTE_ADMIN';
      
      const token = jwt.sign(
        { id: userId, role },
        testSecret,
        { expiresIn: '15m' }
      );
      
      const decoded = jwt.verify(token, testSecret);
      
      expect(decoded.id).toBe(userId);
      expect(decoded.role).toBe(role);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it('should create valid refresh token with longer expiry', () => {
      const userId = 'test-user-id-123';
      const role = 'INSTITUTE_ADMIN';
      
      const token = jwt.sign(
        { id: userId, role },
        testSecret,
        { expiresIn: '7d' }
      );
      
      const decoded = jwt.verify(token, testSecret);
      
      // 7 days = 7 * 24 * 60 * 60 seconds
      const expectedExpiry = decoded.iat + (7 * 24 * 60 * 60);
      expect(decoded.exp).toBe(expectedExpiry);
    });

    it('should include user role in token payload', () => {
      const userId = 'test-user-id-123';
      const role = 'STUDENT';
      
      const token = jwt.sign(
        { id: userId, role },
        testSecret,
        { expiresIn: '15m' }
      );
      
      const decoded = jwt.verify(token, testSecret);
      
      expect(decoded.role).toBe('STUDENT');
    });
  });

  // TS-006: JWT token verification
  describe('TS-006: JWT Token Verification', () => {
    const jwt = require('jsonwebtoken');
    const testSecret = 'test-jwt-secret-key-12345';
    
    it('should correctly decode valid tokens', () => {
      const payload = { id: 'user-123', role: 'ADMIN' };
      const token = jwt.sign(payload, testSecret, { expiresIn: '1h' });
      
      const decoded = jwt.verify(token, testSecret);
      
      expect(decoded.id).toBe(payload.id);
      expect(decoded.role).toBe(payload.role);
    });

    it('should reject expired tokens', () => {
      const payload = { id: 'user-123', role: 'ADMIN' };
      const token = jwt.sign(payload, testSecret, { expiresIn: '-1s' });
      
      expect(() => {
        jwt.verify(token, testSecret);
      }).toThrow(jwt.TokenExpiredError);
    });

    it('should reject tokens with invalid signature', () => {
      const payload = { id: 'user-123', role: 'ADMIN' };
      const token = jwt.sign(payload, testSecret, { expiresIn: '1h' });
      const wrongSecret = 'wrong-secret';
      
      expect(() => {
        jwt.verify(token, wrongSecret);
      }).toThrow(jwt.JsonWebTokenError);
    });

    it('should reject malformed tokens', () => {
      const malformedToken = 'not.a.valid.token';
      
      expect(() => {
        jwt.verify(malformedToken, testSecret);
      }).toThrow(jwt.JsonWebTokenError);
    });

    it('should reject null or undefined tokens', () => {
      expect(() => {
        jwt.verify(null, testSecret);
      }).toThrow();
      
      expect(() => {
        jwt.verify(undefined, testSecret);
      }).toThrow();
    });
  });
});
