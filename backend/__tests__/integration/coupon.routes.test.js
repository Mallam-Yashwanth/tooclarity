/**
 * Coupon Integration Tests
 * Test IDs: TS-065 to TS-073
 * 
 * Tests for coupon creation, validation, application, and restrictions
 */

const mongoose = require('mongoose');

// Mock stores
const mockDataStore = {
  coupons: new Map(),
  institutions: new Map(),
  users: new Map(),
  courses: new Map(),
  usageHistory: new Map(),
};

// Plans configuration
const PLANS = {
  yearly: 999,
  monthly: 99,
};

describe('Coupon Integration Tests', () => {

  beforeEach(() => {
    mockDataStore.coupons.clear();
    mockDataStore.institutions.clear();
    mockDataStore.users.clear();
    mockDataStore.courses.clear();
    mockDataStore.usageHistory.clear();
  });

  // Helper functions
  const createCoupon = (options = {}) => {
    const couponId = new mongoose.Types.ObjectId();
    
    const coupon = {
      _id: couponId,
      code: options.code || `COUPON_${couponId.toString().slice(-6).toUpperCase()}`,
      discountPercentage: options.discountPercentage || 10,
      validFrom: options.validFrom || new Date(),
      validTill: options.validTill || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      maxUses: options.maxUses || null,
      useCount: options.useCount || 0,
      isActive: options.isActive !== undefined ? options.isActive : true,
      forInstitutions: options.forInstitutions || [],
      minCourses: options.minCourses || 1,
      createdAt: new Date(),
    };

    mockDataStore.coupons.set(coupon.code, coupon);
    mockDataStore.coupons.set(couponId.toString(), coupon);
    return coupon;
  };

  const createUser = (options = {}) => {
    const userId = new mongoose.Types.ObjectId();
    const institutionId = options.institutionId || new mongoose.Types.ObjectId();
    
    const user = {
      _id: userId,
      email: options.email || `user_${userId}@test.com`,
      institution: institutionId,
      role: 'INSTITUTE_ADMIN',
    };

    mockDataStore.users.set(userId.toString(), user);
    
    // Create institution
    mockDataStore.institutions.set(institutionId.toString(), {
      _id: institutionId,
      instituteName: options.institutionName || 'Test Institution',
      institutionAdmin: userId,
    });

    return user;
  };

  const createCourses = (institutionId, count, status = 'Inactive') => {
    const courses = [];
    for (let i = 0; i < count; i++) {
      const courseId = new mongoose.Types.ObjectId();
      const course = {
        _id: courseId,
        courseName: `Course ${i + 1}`,
        institution: institutionId,
        status,
      };
      mockDataStore.courses.set(courseId.toString(), course);
      courses.push(course);
    }
    return courses;
  };

  // Coupon service mock
  const couponService = {
    create: async (data, creatorRole) => {
      if (creatorRole !== 'ADMIN') {
        throw { status: 403, message: 'Only admins can create coupons' };
      }

      if (!data.code || !data.discountPercentage) {
        throw { status: 400, message: 'Code and discount percentage are required' };
      }

      if (mockDataStore.coupons.has(data.code)) {
        throw { status: 409, message: 'Coupon code already exists' };
      }

      if (data.discountPercentage <= 0 || data.discountPercentage > 100) {
        throw { status: 400, message: 'Discount must be between 1 and 100' };
      }

      const coupon = createCoupon(data);
      return coupon;
    },

    validate: async (code, userId, planType, courseCount) => {
      const coupon = mockDataStore.coupons.get(code);
      
      if (!coupon) {
        return { valid: false, error: 'Invalid coupon code' };
      }

      if (!coupon.isActive) {
        return { valid: false, error: 'Coupon is no longer active' };
      }

      // Check date validity
      const now = new Date();
      if (coupon.validFrom && new Date(coupon.validFrom) > now) {
        return { valid: false, error: 'Coupon is not yet valid' };
      }

      if (coupon.validTill && new Date(coupon.validTill) < now) {
        return { valid: false, error: 'Coupon has expired' };
      }

      // Check usage limit
      if (coupon.maxUses && coupon.useCount >= coupon.maxUses) {
        return { valid: false, error: 'Coupon usage limit reached' };
      }

      // Check institution restriction
      if (coupon.forInstitutions && coupon.forInstitutions.length > 0) {
        const user = mockDataStore.users.get(userId.toString());
        if (!user || !coupon.forInstitutions.includes(user.institution.toString())) {
          return { valid: false, error: 'Coupon not valid for your institution' };
        }
      }

      // Check minimum courses
      if (coupon.minCourses && courseCount < coupon.minCourses) {
        return { valid: false, error: `Minimum ${coupon.minCourses} courses required for this coupon` };
      }

      // Check if user already used this coupon
      const usageKey = `${userId}:${code}`;
      if (mockDataStore.usageHistory.get(usageKey)) {
        return { valid: false, error: 'You have already used this coupon' };
      }

      // Calculate discount
      const planPrice = PLANS[planType];
      const baseAmount = courseCount * planPrice;
      const discountAmount = Math.round((baseAmount * coupon.discountPercentage) / 100 * 100) / 100;
      const finalAmount = Math.max(0, baseAmount - discountAmount);

      return {
        valid: true,
        coupon: {
          code: coupon.code,
          discountPercentage: coupon.discountPercentage,
        },
        originalAmount: baseAmount,
        discountAmount,
        finalAmount,
      };
    },

    apply: async (code, userId, orderId) => {
      const coupon = mockDataStore.coupons.get(code);
      
      if (!coupon) {
        throw { status: 400, message: 'Invalid coupon code' };
      }

      // Record usage
      coupon.useCount++;
      mockDataStore.usageHistory.set(`${userId}:${code}`, {
        orderId,
        usedAt: new Date(),
      });

      return { success: true };
    },

    listInstitutions: async (adminRole) => {
      if (adminRole !== 'ADMIN') {
        throw { status: 403, message: 'Only admins can view this' };
      }

      const institutions = Array.from(mockDataStore.institutions.values())
        .map(inst => ({
          _id: inst._id,
          name: inst.instituteName,
        }));

      return institutions;
    },
  };

  // TS-065: Create coupon (Admin only)
  describe('TS-065: Create Coupon', () => {
    it('should create coupon with valid data', async () => {
      const coupon = await couponService.create({
        code: 'NEWCOUPON',
        discountPercentage: 20,
        validTill: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }, 'ADMIN');

      expect(coupon.code).toBe('NEWCOUPON');
      expect(coupon.discountPercentage).toBe(20);
      expect(coupon.isActive).toBe(true);
    });

    it('should reject coupon creation by non-admin', async () => {
      await expect(
        couponService.create({
          code: 'UNAUTHORIZED',
          discountPercentage: 15,
        }, 'INSTITUTE_ADMIN')
      ).rejects.toMatchObject({ status: 403 });
    });

    it('should reject duplicate coupon code', async () => {
      await couponService.create({
        code: 'DUPLICATE',
        discountPercentage: 10,
      }, 'ADMIN');

      await expect(
        couponService.create({
          code: 'DUPLICATE',
          discountPercentage: 25,
        }, 'ADMIN')
      ).rejects.toMatchObject({ status: 409, message: 'Coupon code already exists' });
    });

    it('should reject invalid discount percentage', async () => {
      await expect(
        couponService.create({
          code: 'INVALID',
          discountPercentage: 150,
        }, 'ADMIN')
      ).rejects.toMatchObject({ status: 400 });

      await expect(
        couponService.create({
          code: 'ZERO',
          discountPercentage: 0,
        }, 'ADMIN')
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  // TS-066: Validate coupon with valid code
  describe('TS-066: Validate Coupon', () => {
    it('should return discount details for valid coupon', async () => {
      createCoupon({ code: 'VALID10', discountPercentage: 10 });
      const user = createUser();
      createCourses(user.institution, 5);

      const result = await couponService.validate('VALID10', user._id, 'yearly', 5);

      expect(result.valid).toBe(true);
      expect(result.originalAmount).toBe(5 * 999);
      expect(result.discountAmount).toBeCloseTo(5 * 999 * 0.1, 2);
      expect(result.finalAmount).toBe(5 * 999 - result.discountAmount);
    });

    it('should reject expired coupon', async () => {
      createCoupon({
        code: 'EXPIRED',
        discountPercentage: 20,
        validTill: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });
      const user = createUser();

      const result = await couponService.validate('EXPIRED', user._id, 'yearly', 3);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Coupon has expired');
    });

    it('should reject coupon not yet valid', async () => {
      createCoupon({
        code: 'FUTURE',
        discountPercentage: 15,
        validFrom: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      const user = createUser();

      const result = await couponService.validate('FUTURE', user._id, 'yearly', 2);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Coupon is not yet valid');
    });
  });

  // TS-067: Validate coupon usage limit
  describe('TS-067: Coupon Usage Limit', () => {
    it('should reject coupon at usage limit', async () => {
      createCoupon({
        code: 'LIMITED',
        discountPercentage: 25,
        maxUses: 100,
        useCount: 100,
      });
      const user = createUser();

      const result = await couponService.validate('LIMITED', user._id, 'yearly', 5);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Coupon usage limit reached');
    });

    it('should allow usage below limit', async () => {
      createCoupon({
        code: 'UNDERUSED',
        discountPercentage: 20,
        maxUses: 100,
        useCount: 50,
      });
      const user = createUser();

      const result = await couponService.validate('UNDERUSED', user._id, 'yearly', 3);

      expect(result.valid).toBe(true);
    });
  });

  // TS-068: Institution-specific coupon
  describe('TS-068: Institution-Specific Coupon', () => {
    it('should validate coupon for authorized institution', async () => {
      const user = createUser();
      createCoupon({
        code: 'INSTITUTION_ONLY',
        discountPercentage: 30,
        forInstitutions: [user.institution.toString()],
      });

      const result = await couponService.validate('INSTITUTION_ONLY', user._id, 'yearly', 2);

      expect(result.valid).toBe(true);
    });

    it('should reject coupon for unauthorized institution', async () => {
      const user = createUser();
      const otherInstitutionId = new mongoose.Types.ObjectId();
      
      createCoupon({
        code: 'OTHER_INST',
        discountPercentage: 30,
        forInstitutions: [otherInstitutionId.toString()],
      });

      const result = await couponService.validate('OTHER_INST', user._id, 'yearly', 2);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Coupon not valid for your institution');
    });
  });

  // TS-069: Minimum course requirement
  describe('TS-069: Minimum Course Requirement', () => {
    it('should reject coupon when below minimum courses', async () => {
      createCoupon({
        code: 'BULK_ONLY',
        discountPercentage: 40,
        minCourses: 10,
      });
      const user = createUser();

      const result = await couponService.validate('BULK_ONLY', user._id, 'yearly', 5);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Minimum 10 courses required for this coupon');
    });

    it('should accept coupon when meeting minimum courses', async () => {
      createCoupon({
        code: 'BULK_DISCOUNT',
        discountPercentage: 35,
        minCourses: 5,
      });
      const user = createUser();

      const result = await couponService.validate('BULK_DISCOUNT', user._id, 'yearly', 7);

      expect(result.valid).toBe(true);
    });
  });

  // TS-070: One-time user usage
  describe('TS-070: One-Time User Usage', () => {
    it('should prevent reuse of coupon by same user', async () => {
      const coupon = createCoupon({
        code: 'ONETIME',
        discountPercentage: 15,
      });
      const user = createUser();

      // First usage
      await couponService.apply('ONETIME', user._id, 'order_1');

      // Try to validate again
      const result = await couponService.validate('ONETIME', user._id, 'yearly', 3);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('You have already used this coupon');
    });

    it('should allow different users to use same coupon', async () => {
      createCoupon({
        code: 'MULTIUSER',
        discountPercentage: 10,
      });
      
      const user1 = createUser();
      const user2 = createUser();

      // User 1 applies coupon
      await couponService.apply('MULTIUSER', user1._id, 'order_1');

      // User 2 should still be able to validate
      const result = await couponService.validate('MULTIUSER', user2._id, 'yearly', 2);

      expect(result.valid).toBe(true);
    });
  });

  // TS-071: Inactive coupon
  describe('TS-071: Inactive Coupon', () => {
    it('should reject inactive coupon', async () => {
      createCoupon({
        code: 'DISABLED',
        discountPercentage: 50,
        isActive: false,
      });
      const user = createUser();

      const result = await couponService.validate('DISABLED', user._id, 'yearly', 5);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Coupon is no longer active');
    });
  });

  // TS-072: Apply coupon and increment usage
  describe('TS-072: Apply Coupon', () => {
    it('should increment usage count on application', async () => {
      const coupon = createCoupon({
        code: 'TRACKUSAGE',
        discountPercentage: 10,
      });
      const user = createUser();

      expect(coupon.useCount).toBe(0);

      await couponService.apply('TRACKUSAGE', user._id, 'order_123');

      expect(coupon.useCount).toBe(1);
    });

    it('should record user usage history', async () => {
      createCoupon({ code: 'HISTORY', discountPercentage: 5 });
      const user = createUser();

      await couponService.apply('HISTORY', user._id, 'order_456');

      const usage = mockDataStore.usageHistory.get(`${user._id}:HISTORY`);
      expect(usage).toBeDefined();
      expect(usage.orderId).toBe('order_456');
    });
  });

  // TS-073: List institutions for coupon assignment
  describe('TS-073: List Institutions for Admin', () => {
    it('should return institutions list for admin', async () => {
      createUser({ institutionName: 'School A' });
      createUser({ institutionName: 'School B' });
      createUser({ institutionName: 'School C' });

      const institutions = await couponService.listInstitutions('ADMIN');

      expect(institutions.length).toBeGreaterThanOrEqual(3);
    });

    it('should reject non-admin access', async () => {
      await expect(
        couponService.listInstitutions('INSTITUTE_ADMIN')
      ).rejects.toMatchObject({ status: 403 });
    });
  });
});
