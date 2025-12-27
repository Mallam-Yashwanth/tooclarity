/**
 * Payment Unit Tests
 * Test IDs: TS-055 to TS-057
 * 
 * Tests for plan price calculation, signature verification, and subscription date calculation
 */

const crypto = require('crypto');

describe('Payment Unit Tests', () => {

  // Plan pricing configuration
  const PLANS = {
    yearly: 999,
    monthly: 99,
  };

  // TS-055: Plan price calculation
  describe('TS-055: Plan Price Calculation', () => {
    const calculateTotalPrice = (courseCount, planType) => {
      const planPrice = PLANS[planType];
      
      if (!planPrice) {
        throw new Error('Invalid plan type');
      }
      
      if (courseCount < 0) {
        throw new Error('Course count cannot be negative');
      }
      
      return courseCount * planPrice;
    };

    it('should calculate correct price for yearly plan', () => {
      const result = calculateTotalPrice(5, 'yearly');
      
      expect(result).toBe(5 * 999);
      expect(result).toBe(4995);
    });

    it('should calculate correct price for monthly plan', () => {
      const result = calculateTotalPrice(3, 'monthly');
      
      expect(result).toBe(3 * 99);
      expect(result).toBe(297);
    });

    it('should return 0 for 0 courses', () => {
      expect(calculateTotalPrice(0, 'yearly')).toBe(0);
      expect(calculateTotalPrice(0, 'monthly')).toBe(0);
    });

    it('should throw error for invalid plan type', () => {
      expect(() => {
        calculateTotalPrice(5, 'invalid');
      }).toThrow('Invalid plan type');
    });

    it('should throw error for negative course count', () => {
      expect(() => {
        calculateTotalPrice(-1, 'yearly');
      }).toThrow('Course count cannot be negative');
    });

    it('should calculate price for large number of courses', () => {
      const result = calculateTotalPrice(100, 'yearly');
      
      expect(result).toBe(100 * 999);
      expect(result).toBe(99900);
    });
  });

  // TS-056: Razorpay signature verification
  describe('TS-056: Razorpay Signature Verification', () => {
    const WEBHOOK_SECRET = 'test_webhook_secret';

    const verifyRazorpaySignature = (payload, signature, secret) => {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      return expectedSignature === signature;
    };

    const generateSignature = (payload, secret) => {
      return crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
    };

    it('should verify valid signature successfully', () => {
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: { entity: { order_id: 'order_123' } },
        },
      };
      
      const validSignature = generateSignature(payload, WEBHOOK_SECRET);
      
      const isValid = verifyRazorpaySignature(payload, validSignature, WEBHOOK_SECRET);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = { event: 'payment.captured' };
      const invalidSignature = 'invalid-signature-12345';
      
      const isValid = verifyRazorpaySignature(payload, invalidSignature, WEBHOOK_SECRET);
      
      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong secret', () => {
      const payload = { event: 'payment.captured' };
      const signatureWithWrongSecret = generateSignature(payload, 'wrong_secret');
      
      const isValid = verifyRazorpaySignature(payload, signatureWithWrongSecret, WEBHOOK_SECRET);
      
      expect(isValid).toBe(false);
    });

    it('should reject if payload is modified', () => {
      const originalPayload = { event: 'payment.captured', amount: 1000 };
      const validSignature = generateSignature(originalPayload, WEBHOOK_SECRET);
      
      const modifiedPayload = { event: 'payment.captured', amount: 5000 };
      
      const isValid = verifyRazorpaySignature(modifiedPayload, validSignature, WEBHOOK_SECRET);
      
      expect(isValid).toBe(false);
    });

    it('should generate consistent signatures for same payload', () => {
      const payload = { event: 'test', data: 'value' };
      
      const signature1 = generateSignature(payload, WEBHOOK_SECRET);
      const signature2 = generateSignature(payload, WEBHOOK_SECRET);
      
      expect(signature1).toBe(signature2);
    });

    it('should generate different signatures for different payloads', () => {
      const payload1 = { event: 'test1' };
      const payload2 = { event: 'test2' };
      
      const signature1 = generateSignature(payload1, WEBHOOK_SECRET);
      const signature2 = generateSignature(payload2, WEBHOOK_SECRET);
      
      expect(signature1).not.toBe(signature2);
    });
  });

  // TS-057: Subscription date calculation
  describe('TS-057: Subscription Date Calculation', () => {
    const calculateSubscriptionEndDate = (startDate, planType) => {
      const start = new Date(startDate);
      
      if (planType === 'yearly') {
        return new Date(start.setFullYear(start.getFullYear() + 1));
      } else if (planType === 'monthly') {
        return new Date(start.setMonth(start.getMonth() + 1));
      }
      
      throw new Error('Invalid plan type');
    };

    it('should calculate correct end date for yearly plan', () => {
      const startDate = new Date('2024-01-15');
      const endDate = calculateSubscriptionEndDate(startDate, 'yearly');
      
      expect(endDate.getFullYear()).toBe(2025);
      expect(endDate.getMonth()).toBe(0); // January
      expect(endDate.getDate()).toBe(15);
    });

    it('should calculate correct end date for monthly plan', () => {
      const startDate = new Date('2024-01-15');
      const endDate = calculateSubscriptionEndDate(startDate, 'monthly');
      
      expect(endDate.getFullYear()).toBe(2024);
      expect(endDate.getMonth()).toBe(1); // February
      expect(endDate.getDate()).toBe(15);
    });

    it('should handle year rollover for monthly plan', () => {
      const startDate = new Date('2024-12-15');
      const endDate = calculateSubscriptionEndDate(startDate, 'monthly');
      
      expect(endDate.getFullYear()).toBe(2025);
      expect(endDate.getMonth()).toBe(0); // January
    });

    it('should handle leap year for yearly plan', () => {
      const startDate = new Date('2024-02-29'); // Leap year
      const endDate = calculateSubscriptionEndDate(startDate, 'yearly');
      
      expect(endDate.getFullYear()).toBe(2025);
      // Note: 2025 is not a leap year, so Feb 29 becomes March 1
      expect(endDate.getMonth()).toBe(2); // March (since Feb 29 doesn't exist in 2025)
    });

    it('should handle month rollover with different days', () => {
      const startDate = new Date('2024-01-31');
      const endDate = calculateSubscriptionEndDate(startDate, 'monthly');
      
      // February doesn't have 31 days, so it rolls over
      expect(endDate.getMonth()).toBe(2); // March (rolls over from Feb)
    });

    it('should throw error for invalid plan type', () => {
      expect(() => {
        calculateSubscriptionEndDate(new Date(), 'invalid');
      }).toThrow('Invalid plan type');
    });

    it('should accept Date object as input', () => {
      const startDate = new Date();
      const endDate = calculateSubscriptionEndDate(startDate, 'yearly');
      
      expect(endDate instanceof Date).toBe(true);
    });

    it('should accept date string as input', () => {
      const startDateString = '2024-06-15T10:00:00Z';
      const endDate = calculateSubscriptionEndDate(startDateString, 'monthly');
      
      expect(endDate instanceof Date).toBe(true);
      expect(endDate.getMonth()).toBe(6); // July
    });

    it('should return date greater than start date', () => {
      const startDate = new Date();
      const endDateYearly = calculateSubscriptionEndDate(startDate, 'yearly');
      const endDateMonthly = calculateSubscriptionEndDate(new Date(), 'monthly');
      
      expect(endDateYearly.getTime()).toBeGreaterThan(startDate.getTime());
      expect(endDateMonthly.getTime()).toBeGreaterThan(startDate.getTime());
    });
  });

  // Additional payment tests
  describe('Payment Amount Conversion', () => {
    const convertToRazorpayAmount = (amountInRupees) => {
      // Razorpay expects amount in paise
      return Math.round(amountInRupees * 100);
    };

    const convertFromRazorpayAmount = (amountInPaise) => {
      return amountInPaise / 100;
    };

    it('should convert rupees to paise correctly', () => {
      expect(convertToRazorpayAmount(999)).toBe(99900);
      expect(convertToRazorpayAmount(100)).toBe(10000);
      expect(convertToRazorpayAmount(99.99)).toBe(9999);
    });

    it('should convert paise to rupees correctly', () => {
      expect(convertFromRazorpayAmount(99900)).toBe(999);
      expect(convertFromRazorpayAmount(10000)).toBe(100);
    });

    it('should handle decimal amounts', () => {
      expect(convertToRazorpayAmount(99.50)).toBe(9950);
      expect(convertToRazorpayAmount(1.5)).toBe(150);
    });
  });

  describe('Coupon Discount Calculation', () => {
    const calculateDiscount = (originalAmount, discountPercentage) => {
      if (discountPercentage < 0 || discountPercentage > 100) {
        throw new Error('Invalid discount percentage');
      }
      
      const discount = (originalAmount * discountPercentage) / 100;
      const finalAmount = Math.max(originalAmount - discount, 0);
      
      return {
        discount: Math.round(discount * 100) / 100,
        finalAmount: Math.round(finalAmount * 100) / 100,
      };
    };

    it('should calculate discount correctly', () => {
      const result = calculateDiscount(1000, 10);
      
      expect(result.discount).toBe(100);
      expect(result.finalAmount).toBe(900);
    });

    it('should handle 0% discount', () => {
      const result = calculateDiscount(1000, 0);
      
      expect(result.discount).toBe(0);
      expect(result.finalAmount).toBe(1000);
    });

    it('should handle 100% discount', () => {
      const result = calculateDiscount(1000, 100);
      
      expect(result.discount).toBe(1000);
      expect(result.finalAmount).toBe(0);
    });

    it('should not allow negative final amount', () => {
      const result = calculateDiscount(50, 100);
      
      expect(result.finalAmount).toBeGreaterThanOrEqual(0);
    });

    it('should throw error for invalid discount percentage', () => {
      expect(() => calculateDiscount(1000, -10)).toThrow('Invalid discount percentage');
      expect(() => calculateDiscount(1000, 110)).toThrow('Invalid discount percentage');
    });

    it('should handle decimal percentages', () => {
      const result = calculateDiscount(1000, 7.5);
      
      expect(result.discount).toBe(75);
      expect(result.finalAmount).toBe(925);
    });
  });
});
