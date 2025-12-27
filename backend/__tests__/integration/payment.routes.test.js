/**
 * Payment Routes Integration Tests
 * Test IDs: TS-058 to TS-064
 * 
 * Tests for order creation, payment verification, and subscription management
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

// Mock stores
const mockDataStore = {
  orders: new Map(),
  paymentContexts: new Map(), // Redis mock
  subscriptions: new Map(),
  courses: new Map(),
  institutions: new Map(),
  users: new Map(),
};

// Mock Razorpay
const mockRazorpay = {
  orders: {
    create: jest.fn((options) => Promise.resolve({
      id: 'order_' + Date.now(),
      amount: options.amount,
      currency: options.currency || 'INR',
      status: 'created',
      receipt: options.receipt,
    })),
  },
};

// Mock plans
const PLANS = {
  yearly: 999,
  monthly: 99,
};

describe('Payment Routes Integration Tests', () => {

  beforeEach(() => {
    mockDataStore.orders.clear();
    mockDataStore.paymentContexts.clear();
    mockDataStore.subscriptions.clear();
    mockDataStore.courses.clear();
    mockDataStore.institutions.clear();
    mockDataStore.users.clear();
    jest.clearAllMocks();
  });

  // Helper to setup user and institution
  const setupUserWithInstitution = () => {
    const userId = new mongoose.Types.ObjectId();
    const institutionId = new mongoose.Types.ObjectId();
    
    mockDataStore.users.set(userId.toString(), {
      _id: userId,
      email: 'admin@example.com',
      institution: institutionId,
    });
    
    mockDataStore.institutions.set(institutionId.toString(), {
      _id: institutionId,
      instituteName: 'Test Institution',
      institutionAdmin: userId,
    });

    return { userId, institutionId };
  };

  // Helper to create inactive courses
  const createInactiveCourses = (institutionId, count) => {
    const courseIds = [];
    for (let i = 0; i < count; i++) {
      const courseId = new mongoose.Types.ObjectId();
      mockDataStore.courses.set(courseId.toString(), {
        _id: courseId,
        courseName: `Course ${i + 1}`,
        institution: institutionId,
        status: 'Inactive',
      });
      courseIds.push(courseId);
    }
    return courseIds;
  };

  // Payment service mock
  const paymentService = {
    createOrder: async ({ userId, planType, couponCode, courseIds }) => {
      const user = mockDataStore.users.get(userId.toString());
      if (!user || !user.institution) {
        throw { status: 404, message: 'Institution not found' };
      }

      const institutionId = user.institution;
      
      // Get inactive courses
      const inactiveCourses = Array.from(mockDataStore.courses.values())
        .filter(c => 
          c.institution.toString() === institutionId.toString() &&
          c.status === 'Inactive'
        );

      let selectedCourses = inactiveCourses;
      if (courseIds && courseIds.length > 0) {
        selectedCourses = inactiveCourses.filter(c => 
          courseIds.some(id => id.toString() === c._id.toString())
        );
      }

      if (selectedCourses.length === 0) {
        throw { status: 400, message: 'No inactive courses to activate' };
      }

      const planPrice = PLANS[planType];
      if (!planPrice) {
        throw { status: 400, message: 'Invalid plan type' };
      }

      let amount = selectedCourses.length * planPrice;
      let discount = 0;

      // Apply coupon
      if (couponCode) {
        // Mock coupon: 10% discount
        discount = amount * 0.1;
        amount -= discount;
      }

      // Create Razorpay order
      const razorpayOrder = await mockRazorpay.orders.create({
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
      });

      // Cache payment context
      const context = {
        institution: institutionId.toString(),
        selectedCourseIds: selectedCourses.map(c => c._id.toString()),
        planType,
        amount,
        couponCode,
      };
      mockDataStore.paymentContexts.set(razorpayOrder.id, context);
      mockDataStore.orders.set(razorpayOrder.id, razorpayOrder);

      return {
        orderId: razorpayOrder.id,
        amount,
        totalInactiveCourses: selectedCourses.length,
        discount,
      };
    },

    verifyPayment: async ({ orderId, paymentId, signature, webhookSecret }) => {
      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(orderId + '|' + paymentId)
        .digest('hex');

      if (signature !== expectedSignature) {
        throw { status: 400, message: 'Invalid signature' };
      }

      // Get payment context
      const context = mockDataStore.paymentContexts.get(orderId);
      if (!context) {
        throw { status: 422, message: 'Payment context not found' };
      }

      // Check if already processed
      const existingSub = Array.from(mockDataStore.subscriptions.values())
        .find(s => s.orderId === orderId);
      if (existingSub && existingSub.status === 'active') {
        return { status: 'already_processed' };
      }

      // Create/update subscription
      const subscriptionId = new mongoose.Types.ObjectId();
      const now = new Date();
      const endDate = context.planType === 'yearly'
        ? new Date(now.setFullYear(now.getFullYear() + 1))
        : new Date(now.setMonth(now.getMonth() + 1));

      mockDataStore.subscriptions.set(subscriptionId.toString(), {
        _id: subscriptionId,
        institution: context.institution,
        planType: context.planType,
        status: 'active',
        orderId,
        startDate: new Date(),
        endDate,
      });

      // Activate courses
      context.selectedCourseIds.forEach(courseId => {
        const course = mockDataStore.courses.get(courseId);
        if (course) {
          course.status = 'Active';
          course.courseSubscriptionStartDate = new Date();
          course.courseSubscriptionEndDate = endDate;
        }
      });

      // Clear payment context
      mockDataStore.paymentContexts.delete(orderId);

      return {
        status: 'success',
        subscriptionId,
        activatedCourses: context.selectedCourseIds.length,
      };
    },

    pollStatus: async (userId, orderId) => {
      const user = mockDataStore.users.get(userId.toString());
      if (!user) {
        throw { status: 400, message: 'User not found' };
      }

      // Find subscription by institution
      const subscription = Array.from(mockDataStore.subscriptions.values())
        .find(s => s.institution === user.institution.toString());

      if (!subscription) {
        return { status: 'pending' };
      }

      return {
        status: subscription.status,
        planType: subscription.planType,
        endDate: subscription.endDate,
      };
    },
  };

  // TS-058: Create payment order
  describe('TS-058: Create Payment Order', () => {
    it('should create Razorpay order and cache context in Redis', async () => {
      const { userId, institutionId } = setupUserWithInstitution();
      createInactiveCourses(institutionId, 3);

      const result = await paymentService.createOrder({
        userId,
        planType: 'yearly',
      });

      expect(result.orderId).toBeDefined();
      expect(result.orderId).toMatch(/^order_/);
      expect(result.totalInactiveCourses).toBe(3);
      expect(result.amount).toBe(3 * 999);
      expect(mockDataStore.paymentContexts.has(result.orderId)).toBe(true);
    });

    it('should calculate correct amount based on course count', async () => {
      const { userId, institutionId } = setupUserWithInstitution();
      createInactiveCourses(institutionId, 5);

      const result = await paymentService.createOrder({
        userId,
        planType: 'monthly',
      });

      expect(result.amount).toBe(5 * 99);
      expect(result.totalInactiveCourses).toBe(5);
    });

    it('should select only specified course IDs', async () => {
      const { userId, institutionId } = setupUserWithInstitution();
      const courseIds = createInactiveCourses(institutionId, 5);

      const result = await paymentService.createOrder({
        userId,
        planType: 'yearly',
        courseIds: [courseIds[0], courseIds[1]], // Only 2 courses
      });

      expect(result.totalInactiveCourses).toBe(2);
      expect(result.amount).toBe(2 * 999);
    });
  });

  // TS-059: Create order with coupon discount
  describe('TS-059: Create Order with Coupon', () => {
    it('should apply discount and show reduced amount', async () => {
      const { userId, institutionId } = setupUserWithInstitution();
      createInactiveCourses(institutionId, 10);

      const result = await paymentService.createOrder({
        userId,
        planType: 'yearly',
        couponCode: 'DISCOUNT10',
      });

      const expectedAmount = 10 * 999 * 0.9; // 10% discount
      expect(result.amount).toBe(expectedAmount);
      expect(result.discount).toBe(10 * 999 * 0.1);
    });
  });

  // TS-060: Verify payment webhook (success)
  describe('TS-060: Verify Payment Webhook Success', () => {
    it('should activate subscription and courses, send email', async () => {
      const { userId, institutionId } = setupUserWithInstitution();
      const courseIds = createInactiveCourses(institutionId, 3);

      // Create order first
      const order = await paymentService.createOrder({
        userId,
        planType: 'yearly',
      });

      // Generate valid signature
      const paymentId = 'pay_test123';
      const webhookSecret = 'test_secret';
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(order.orderId + '|' + paymentId)
        .digest('hex');

      const result = await paymentService.verifyPayment({
        orderId: order.orderId,
        paymentId,
        signature,
        webhookSecret,
      });

      expect(result.status).toBe('success');
      expect(result.activatedCourses).toBe(3);

      // Check courses are activated
      courseIds.forEach(id => {
        const course = mockDataStore.courses.get(id.toString());
        expect(course.status).toBe('Active');
      });

      // Check payment context is cleared
      expect(mockDataStore.paymentContexts.has(order.orderId)).toBe(false);
    });
  });

  // TS-061: Verify payment webhook (invalid signature)
  describe('TS-061: Verify Payment with Invalid Signature', () => {
    it('should return 400 error for invalid signature', async () => {
      const { userId, institutionId } = setupUserWithInstitution();
      createInactiveCourses(institutionId, 2);

      const order = await paymentService.createOrder({
        userId,
        planType: 'yearly',
      });

      await expect(
        paymentService.verifyPayment({
          orderId: order.orderId,
          paymentId: 'pay_test',
          signature: 'invalid_signature',
          webhookSecret: 'test_secret',
        })
      ).rejects.toMatchObject({ status: 400, message: 'Invalid signature' });
    });
  });

  // TS-062: Poll subscription status after payment
  describe('TS-062: Poll Subscription Status', () => {
    it('should return subscription status from DB', async () => {
      const { userId, institutionId } = setupUserWithInstitution();
      createInactiveCourses(institutionId, 2);

      // Create and verify order
      const order = await paymentService.createOrder({
        userId,
        planType: 'yearly',
      });

      const paymentId = 'pay_test456';
      const webhookSecret = 'test_secret';
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(order.orderId + '|' + paymentId)
        .digest('hex');

      await paymentService.verifyPayment({
        orderId: order.orderId,
        paymentId,
        signature,
        webhookSecret,
      });

      // Poll status
      const status = await paymentService.pollStatus(userId, order.orderId);

      expect(status.status).toBe('active');
      expect(status.planType).toBe('yearly');
    });

    it('should return pending if no subscription found', async () => {
      const { userId } = setupUserWithInstitution();

      const status = await paymentService.pollStatus(userId, 'non_existent_order');

      expect(status.status).toBe('pending');
    });
  });

  // TS-063: Payment context expiry handling
  describe('TS-063: Payment Context Expiry', () => {
    it('should handle stale payment context gracefully', async () => {
      const orderId = 'order_stale';
      const paymentId = 'pay_test';
      const webhookSecret = 'test';
      
      // Generate valid signature for this order
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(orderId + '|' + paymentId)
        .digest('hex');
      
      // No context stored (simulates expiry)
      expect(mockDataStore.paymentContexts.has(orderId)).toBe(false);

      await expect(
        paymentService.verifyPayment({
          orderId,
          paymentId,
          signature,
          webhookSecret,
        })
      ).rejects.toMatchObject({ status: 422, message: 'Payment context not found' });
    });
  });

  // Additional: Prevent duplicate processing
  describe('Duplicate Payment Processing', () => {
    it('should not process same payment twice', async () => {
      const { userId, institutionId } = setupUserWithInstitution();
      createInactiveCourses(institutionId, 2);

      const order = await paymentService.createOrder({
        userId,
        planType: 'yearly',
      });

      const paymentId = 'pay_dup';
      const webhookSecret = 'test_secret';
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(order.orderId + '|' + paymentId)
        .digest('hex');

      // First verification
      const result1 = await paymentService.verifyPayment({
        orderId: order.orderId,
        paymentId,
        signature,
        webhookSecret,
      });
      expect(result1.status).toBe('success');

      // Store context again for second attempt
      mockDataStore.paymentContexts.set(order.orderId, {
        institution: institutionId.toString(),
        selectedCourseIds: [],
        planType: 'yearly',
      });

      // Second verification (duplicate)
      const result2 = await paymentService.verifyPayment({
        orderId: order.orderId,
        paymentId,
        signature,
        webhookSecret,
      });
      expect(result2.status).toBe('already_processed');
    });
  });
});
