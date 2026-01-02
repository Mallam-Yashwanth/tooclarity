/**
 * Test Helpers and Mock Factories
 * Provides reusable mocks and helper functions for testing
 */

const crypto = require('crypto');

/**
 * Creates a mock Express request object
 */
const mockRequest = (options = {}) => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
  headers: options.headers || {},
  cookies: options.cookies || {},
  userId: options.userId || null,
  userRole: options.userRole || null,
  user: options.user || null,
  file: options.file || null,
  files: options.files || null,
  app: {
    get: jest.fn((key) => {
      if (key === 'io') {
        return mockSocketIO();
      }
      return null;
    }),
  },
  ...options,
});

/**
 * Creates a mock Express response object
 */
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Creates a mock next function
 */
const mockNext = () => jest.fn();

/**
 * Creates a mock Socket.IO server
 */
const mockSocketIO = () => ({
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
  on: jest.fn(),
});

/**
 * Creates a mock Redis client
 */
const mockRedisClient = () => ({
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  hget: jest.fn(),
  hset: jest.fn(),
  hdel: jest.fn(),
  setnx: jest.fn(),
  quit: jest.fn(),
});

/**
 * Creates a mock Mongoose model with common methods
 */
const mockMongooseModel = (data = null) => ({
  find: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  findByIdAndUpdate: jest.fn().mockResolvedValue(data),
  findByIdAndDelete: jest.fn().mockResolvedValue(data),
  findOneAndUpdate: jest.fn().mockResolvedValue(data),
  findOneAndDelete: jest.fn().mockResolvedValue(data),
  create: jest.fn().mockResolvedValue(data),
  insertMany: jest.fn().mockResolvedValue(data ? [data] : []),
  updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  countDocuments: jest.fn().mockResolvedValue(1),
  aggregate: jest.fn().mockResolvedValue(data ? [data] : []),
  select: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(data),
  session: jest.fn().mockReturnThis(),
  save: jest.fn().mockResolvedValue(data),
});

/**
 * Creates a mock Mongoose session for transactions
 */
const mockMongooseSession = () => ({
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
  withTransaction: jest.fn((fn) => fn()),
});

/**
 * Creates mock Razorpay instance
 */
const mockRazorpay = () => ({
  orders: {
    create: jest.fn().mockResolvedValue({
      id: 'order_test123',
      amount: 100000,
      currency: 'INR',
      status: 'created',
    }),
  },
  payments: {
    fetch: jest.fn().mockResolvedValue({
      id: 'pay_test123',
      status: 'captured',
    }),
  },
});

/**
 * Generates valid JWT-like token for testing
 */
const generateMockToken = (payload = {}) => {
  const defaultPayload = {
    id: global.testUtils?.generateObjectId?.()?.toString() || 'test-user-id',
    role: 'INSTITUTE_ADMIN',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  
  const finalPayload = { ...defaultPayload, ...payload };
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(JSON.stringify(finalPayload)).toString('base64');
  const signature = crypto.randomBytes(32).toString('base64');
  
  return `${header}.${body}.${signature}`;
};

/**
 * Generates mock OTP
 */
const generateMockOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Creates mock email service
 */
const mockEmailService = () => ({
  sendVerificationToken: jest.fn().mockResolvedValue(true),
  sendPasswordResetLink: jest.fn().mockResolvedValue(true),
  sendPaymentSuccessEmail: jest.fn().mockResolvedValue(true),
  sendPasswordChangedConfirmation: jest.fn().mockResolvedValue(true),
});

/**
 * Creates mock file upload
 */
const mockFile = (overrides = {}) => ({
  fieldname: 'file',
  originalname: 'test-file.json',
  encoding: '7bit',
  mimetype: 'application/json',
  buffer: Buffer.from(JSON.stringify({ test: 'data' })),
  size: 1024,
  ...overrides,
});

/**
 * Creates mock Elasticsearch client
 */
const mockElasticsearchClient = () => ({
  index: jest.fn().mockResolvedValue({ result: 'created' }),
  delete: jest.fn().mockResolvedValue({ result: 'deleted' }),
  search: jest.fn().mockResolvedValue({
    hits: {
      hits: [],
      total: { value: 0 },
    },
  }),
  bulk: jest.fn().mockResolvedValue({ errors: false }),
});

/**
 * Waits for all pending promises to resolve
 */
const flushPromises = () => new Promise(setImmediate);

/**
 * Creates a mock cookie parser result
 */
const mockCookies = (sessionId = null, overrides = {}) => ({
  session_id: sessionId || 'test-session-id',
  ...overrides,
});

module.exports = {
  mockRequest,
  mockResponse,
  mockNext,
  mockSocketIO,
  mockRedisClient,
  mockMongooseModel,
  mockMongooseSession,
  mockRazorpay,
  generateMockToken,
  generateMockOTP,
  mockEmailService,
  mockFile,
  mockElasticsearchClient,
  flushPromises,
  mockCookies,
};
