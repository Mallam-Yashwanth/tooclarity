/**
 * Jest Test Setup Configuration
 * Initializes test environment, mocks, and global test utilities
 */

const mongoose = require('mongoose');

// Environment configuration for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-12345';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.RAZORPAY_KEY_ID = 'rzp_test_123456789';
process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';
process.env.ELASTICSEARCH_URL = 'http://localhost:9200';

// Increase timeout for async operations
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  generateObjectId: () => new mongoose.Types.ObjectId(),
  
  createMockUser: (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'Test@1234',
    role: 'INSTITUTE_ADMIN',
    isEmailVerified: true,
    isProfileCompleted: false,
    ...overrides
  }),

  createMockStudent: (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    name: 'Test Student',
    email: 'teststudent@example.com',
    password: 'Test@1234',
    role: 'STUDENT',
    isEmailVerified: true,
    isProfileCompleted: false,
    ...overrides
  }),

  createMockInstitution: (adminId, overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    instituteName: 'Test Institution',
    instituteType: "School's",
    institutionAdmin: adminId,
    aboutInstitute: 'A test institution for unit tests',
    address: '123 Test Street',
    district: 'Test District',
    state: 'Test State',
    ...overrides
  }),

  createMockCourse: (institutionId, overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    courseName: 'Test Course',
    aboutCourse: 'A test course description',
    courseDuration: '12 months',
    mode: 'Offline',
    priceOfCourse: 50000,
    institution: institutionId,
    status: 'Active',
    ...overrides
  }),

  createMockEnquiry: (studentId, institutionId, overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    student: studentId,
    institution: institutionId,
    enquiryType: 'callback',
    programInterest: 'Test Program',
    ...overrides
  }),

  createMockSubscription: (institutionId, overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    institution: institutionId,
    planType: 'yearly',
    status: 'active',
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    ...overrides
  }),

  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
};

// Mock console for cleaner test output (optional)
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}

// Suppress unhandled promise rejection warnings during tests
process.on('unhandledRejection', (reason, promise) => {
  // Silently ignore in test environment
});

// Cleanup after all tests
afterAll(async () => {
  // Close mongoose connection if open
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
