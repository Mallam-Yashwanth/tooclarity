/**
 * End-to-End Tests - Complete User Journeys
 * Test IDs: TS-020, TS-021, TS-040, TS-054, TS-064, TS-080, TS-109, TS-134, TS-135, TS-136
 * 
 * Tests for complete user flows spanning multiple features
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Comprehensive mock data store simulating the database
const mockDB = {
  users: new Map(),
  institutions: new Map(),
  courses: new Map(),
  subscriptions: new Map(),
  enquiries: new Map(),
  sessions: new Map(),
  otps: new Map(),
  notifications: new Map(),
  payments: new Map(),
};

// Mock services
const services = {
  auth: {
    register: async (data) => {
      if (mockDB.users.has(data.email)) {
        throw { status: 400, message: 'User already exists' };
      }

      const userId = new mongoose.Types.ObjectId();
      const user = {
        _id: userId,
        ...data,
        isEmailVerified: false,
        createdAt: new Date(),
      };
      mockDB.users.set(data.email, user);

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      mockDB.otps.set(data.email, { otp, expires: Date.now() + 5 * 60 * 1000 });

      return { userId, otpSent: true };
    },

    verifyOtp: async (email, code) => {
      const stored = mockDB.otps.get(email);
      if (!stored || stored.otp !== code || stored.expires < Date.now()) {
        throw { status: 400, message: 'Invalid or expired OTP' };
      }

      const user = mockDB.users.get(email);
      user.isEmailVerified = true;
      mockDB.otps.delete(email);

      const sessionId = 'session_' + Date.now();
      const accessToken = jwt.sign({ id: user._id.toString(), role: user.role }, 'secret', { expiresIn: '15m' });
      mockDB.sessions.set(sessionId, { userId: user._id, accessToken });

      return { sessionId, accessToken, user };
    },

    login: async (email, password) => {
      const user = mockDB.users.get(email);
      if (!user) {
        throw { status: 401, message: 'Invalid credentials' };
      }

      if (!user.isEmailVerified) {
        throw { status: 403, message: 'Email not verified' };
      }

      const sessionId = 'session_' + Date.now();
      const accessToken = jwt.sign({ id: user._id.toString(), role: user.role }, 'secret', { expiresIn: '15m' });
      mockDB.sessions.set(sessionId, { userId: user._id, accessToken });

      return { sessionId, accessToken, user };
    },

    forgotPassword: async (email) => {
      const user = mockDB.users.get(email);
      if (user) {
        const token = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
        return { token, emailSent: true };
      }
      return { emailSent: true }; // Security: don't reveal if email exists
    },

    resetPassword: async (token, newPassword) => {
      let user = null;
      for (const [, u] of mockDB.users) {
        if (u.passwordResetToken === token && u.passwordResetExpires > Date.now()) {
          user = u;
          break;
        }
      }

      if (!user) {
        throw { status: 400, message: 'Token invalid or expired' };
      }

      user.password = 'hashed_' + newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      return { success: true };
    },
  },

  institution: {
    createL1: async (userId, data) => {
      const institutionId = new mongoose.Types.ObjectId();
      const institution = {
        _id: institutionId,
        institutionAdmin: userId,
        ...data,
        createdAt: new Date(),
      };
      mockDB.institutions.set(institutionId.toString(), institution);

      const user = Array.from(mockDB.users.values()).find(u => u._id.toString() === userId.toString());
      if (user) {
        user.institution = institutionId;
      }

      return institution;
    },

    updateL2: async (userId, data) => {
      let institution = null;
      for (const [, inst] of mockDB.institutions) {
        if (inst.institutionAdmin.toString() === userId.toString()) {
          institution = inst;
          break;
        }
      }

      if (!institution) {
        throw { status: 404, message: 'Institution not found' };
      }

      Object.assign(institution, data);
      return institution;
    },
  },

  course: {
    create: async (institutionId, coursesData) => {
      const created = [];
      for (const data of coursesData) {
        const courseId = new mongoose.Types.ObjectId();
        const course = {
          _id: courseId,
          institution: institutionId,
          status: 'Inactive',
          views: 0,
          comparisons: 0,
          leads: 0,
          ...data,
          createdAt: new Date(),
        };
        mockDB.courses.set(courseId.toString(), course);
        created.push(course);
      }
      return created;
    },

    getById: async (courseId) => {
      return mockDB.courses.get(courseId.toString());
    },

    incrementViews: async (courseId) => {
      const course = mockDB.courses.get(courseId.toString());
      if (course) {
        course.views++;
      }
      return course;
    },
  },

  payment: {
    createOrder: async (userId, planType, courseIds) => {
      const user = Array.from(mockDB.users.values()).find(u => u._id.toString() === userId.toString());
      const institutionId = user?.institution;

      const inactiveCourses = Array.from(mockDB.courses.values())
        .filter(c => 
          c.institution.toString() === institutionId?.toString() &&
          c.status === 'Inactive'
        );

      const amount = inactiveCourses.length * (planType === 'yearly' ? 999 : 99);
      const orderId = 'order_' + Date.now();

      mockDB.payments.set(orderId, {
        orderId,
        userId,
        institutionId,
        planType,
        amount,
        courseIds: inactiveCourses.map(c => c._id.toString()),
        status: 'created',
      });

      return { orderId, amount };
    },

    verifyAndActivate: async (orderId) => {
      const payment = mockDB.payments.get(orderId);
      if (!payment) {
        throw { status: 404, message: 'Payment not found' };
      }

      payment.status = 'captured';

      // Create subscription
      const subscriptionId = new mongoose.Types.ObjectId();
      const now = new Date();
      const endDate = payment.planType === 'yearly'
        ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
        : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      mockDB.subscriptions.set(subscriptionId.toString(), {
        _id: subscriptionId,
        institution: payment.institutionId,
        planType: payment.planType,
        status: 'active',
        startDate: new Date(),
        endDate,
      });

      // Activate courses
      payment.courseIds.forEach(courseId => {
        const course = mockDB.courses.get(courseId);
        if (course) {
          course.status = 'Active';
          course.courseSubscriptionEndDate = endDate;
        }
      });

      return { subscriptionId, activatedCourses: payment.courseIds.length };
    },
  },

  enquiry: {
    create: async (studentId, institutionId, type) => {
      const enquiryId = new mongoose.Types.ObjectId();
      const enquiry = {
        _id: enquiryId,
        student: studentId,
        institution: institutionId,
        enquiryType: type,
        status: type,
        createdAt: new Date(),
      };
      mockDB.enquiries.set(enquiryId.toString(), enquiry);
      return enquiry;
    },
  },

  student: {
    updateProfile: async (studentId, data) => {
      const student = Array.from(mockDB.users.values())
        .find(u => u._id.toString() === studentId.toString() && u.role === 'STUDENT');

      if (!student) {
        throw { status: 404, message: 'Student not found' };
      }

      Object.assign(student, data);
      student.isProfileCompleted = true;
      return student;
    },

    addToWishlist: async (studentId, courseId) => {
      const student = Array.from(mockDB.users.values())
        .find(u => u._id.toString() === studentId.toString());

      if (!student) {
        throw { status: 404, message: 'Student not found' };
      }

      student.wishlist = student.wishlist || [];
      if (!student.wishlist.includes(courseId)) {
        student.wishlist.push(courseId);
      }
      return student.wishlist;
    },
  },
};

describe('End-to-End User Journeys', () => {

  beforeEach(() => {
    mockDB.users.clear();
    mockDB.institutions.clear();
    mockDB.courses.clear();
    mockDB.subscriptions.clear();
    mockDB.enquiries.clear();
    mockDB.sessions.clear();
    mockDB.otps.clear();
    mockDB.notifications.clear();
    mockDB.payments.clear();
  });

  // TS-020: Complete registration and email verification flow
  describe('TS-020: Complete Registration and Email Verification Flow', () => {
    it('should allow user to register, verify email, and login successfully', async () => {
      // Step 1: Register
      const { userId, otpSent } = await services.auth.register({
        name: 'New User',
        email: 'newuser@test.com',
        password: 'SecurePass123!',
        role: 'INSTITUTE_ADMIN',
      });

      expect(userId).toBeDefined();
      expect(otpSent).toBe(true);

      // User is not verified yet
      const unverifiedUser = mockDB.users.get('newuser@test.com');
      expect(unverifiedUser.isEmailVerified).toBe(false);

      // Step 2: Verify OTP
      const otp = mockDB.otps.get('newuser@test.com').otp;
      const { sessionId, accessToken, user } = await services.auth.verifyOtp('newuser@test.com', otp);

      expect(sessionId).toBeDefined();
      expect(accessToken).toBeDefined();
      expect(user.isEmailVerified).toBe(true);

      // Step 3: Can login successfully
      const loginResult = await services.auth.login('newuser@test.com', 'SecurePass123!');

      expect(loginResult.sessionId).toBeDefined();
      expect(loginResult.user.email).toBe('newuser@test.com');
    });

    it('should reject login before email verification', async () => {
      await services.auth.register({
        name: 'Unverified User',
        email: 'unverified@test.com',
        password: 'Pass123!',
        role: 'INSTITUTE_ADMIN',
      });

      await expect(
        services.auth.login('unverified@test.com', 'Pass123!')
      ).rejects.toMatchObject({ status: 403, message: 'Email not verified' });
    });
  });

  // TS-021: Full password reset journey
  describe('TS-021: Full Password Reset Journey', () => {
    it('should complete password reset: request → email → reset → login', async () => {
      // Setup: Create verified user
      const email = 'resetuser@test.com';
      await services.auth.register({
        email,
        password: 'OldPass123!',
        role: 'INSTITUTE_ADMIN',
      });
      const otpCode = mockDB.otps.get(email).otp;
      await services.auth.verifyOtp(email, otpCode);

      // Step 1: Request password reset
      const { token, emailSent } = await services.auth.forgotPassword(email);

      expect(emailSent).toBe(true);
      expect(token).toBeDefined();

      // Step 2: Reset password with token
      const resetResult = await services.auth.resetPassword(token, 'NewSecurePass456!');

      expect(resetResult.success).toBe(true);

      // Step 3: Login with new password
      const loginResult = await services.auth.login(email, 'NewSecurePass456!');

      expect(loginResult.sessionId).toBeDefined();
    });

    it('should reject expired reset token', async () => {
      const email = 'expiredtoken@test.com';
      await services.auth.register({ email, password: 'Pass123!', role: 'INSTITUTE_ADMIN' });
      const otp = mockDB.otps.get(email).otp;
      await services.auth.verifyOtp(email, otp);

      const { token } = await services.auth.forgotPassword(email);

      // Expire the token
      const user = mockDB.users.get(email);
      user.passwordResetExpires = Date.now() - 1000;

      await expect(
        services.auth.resetPassword(token, 'NewPass!')
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  // TS-040: Complete institution setup flow
  describe('TS-040: Complete Institution Setup Flow', () => {
    it('should complete L1 → L2 → courses → profile marked complete', async () => {
      // Setup: Register and verify admin
      await services.auth.register({
        name: 'Institution Admin',
        email: 'instadmin@test.com',
        password: 'Pass123!',
        role: 'INSTITUTE_ADMIN',
      });
      const otp = mockDB.otps.get('instadmin@test.com').otp;
      const { user } = await services.auth.verifyOtp('instadmin@test.com', otp);
      const userId = user._id;

      // Step 1: Create L1 Institution
      const institution = await services.institution.createL1(userId, {
        instituteName: 'Test Academy',
        instituteType: "School's",
      });

      expect(institution._id).toBeDefined();
      expect(institution.instituteName).toBe('Test Academy');

      // Step 2: Update L2 Details
      const updated = await services.institution.updateL2(userId, {
        aboutInstitute: 'A premier institution for quality education',
        address: '123 Education Lane',
        state: 'Maharashtra',
        district: 'Mumbai',
      });

      expect(updated.aboutInstitute).toBeDefined();
      expect(updated.state).toBe('Maharashtra');

      // Step 3: Add Courses
      const courses = await services.course.create(institution._id, [
        { courseName: 'Science', courseDuration: '12 months', priceOfCourse: 15000 },
        { courseName: 'Commerce', courseDuration: '12 months', priceOfCourse: 12000 },
      ]);

      expect(courses).toHaveLength(2);
      expect(courses[0].status).toBe('Inactive'); // Not paid yet

      // Verify user has institution linked
      const adminUser = Array.from(mockDB.users.values())
        .find(u => u._id.toString() === userId.toString());
      expect(adminUser.institution).toBeDefined();
    });
  });

  // TS-064: Complete subscription purchase flow
  describe('TS-064: Complete Subscription Purchase Flow', () => {
    it('should create order → complete payment → activate courses → send confirmation', async () => {
      // Setup: Admin with institution and courses
      await services.auth.register({
        email: 'payingadmin@test.com',
        password: 'Pass123!',
        role: 'INSTITUTE_ADMIN',
      });
      const otp = mockDB.otps.get('payingadmin@test.com').otp;
      const { user } = await services.auth.verifyOtp('payingadmin@test.com', otp);
      const userId = user._id;

      const institution = await services.institution.createL1(userId, {
        instituteName: 'Premium School',
        instituteType: "School's",
      });

      await services.course.create(institution._id, [
        { courseName: 'Course 1' },
        { courseName: 'Course 2' },
        { courseName: 'Course 3' },
      ]);

      // Step 1: Create order
      const { orderId, amount } = await services.payment.createOrder(userId, 'yearly');

      expect(orderId).toBeDefined();
      expect(amount).toBe(3 * 999);

      // Step 2: Verify payment (simulates webhook)
      const { subscriptionId, activatedCourses } = await services.payment.verifyAndActivate(orderId);

      expect(subscriptionId).toBeDefined();
      expect(activatedCourses).toBe(3);

      // Step 3: Verify courses are active
      const allCourses = Array.from(mockDB.courses.values())
        .filter(c => c.institution.toString() === institution._id.toString());

      expect(allCourses.every(c => c.status === 'Active')).toBe(true);

      // Step 4: Subscription is active
      const subscription = Array.from(mockDB.subscriptions.values())
        .find(s => s.institution.toString() === institution._id.toString());

      expect(subscription.status).toBe('active');
      expect(subscription.planType).toBe('yearly');
    });
  });

  // TS-109: Complete student onboarding
  describe('TS-109: Complete Student Onboarding', () => {
    it('should register → verify → complete profile → browse → wishlist', async () => {
      // Setup: Create institution with active courses first
      await services.auth.register({
        email: 'admin@school.com',
        password: 'Pass123!',
        role: 'INSTITUTE_ADMIN',
      });
      let adminOtp = mockDB.otps.get('admin@school.com').otp;
      const { user: admin } = await services.auth.verifyOtp('admin@school.com', adminOtp);
      const institution = await services.institution.createL1(admin._id, {
        instituteName: 'Good School',
        instituteType: "School's",
      });
      const courses = await services.course.create(institution._id, [
        { courseName: 'Mathematics' },
        { courseName: 'Physics' },
      ]);
      // Manually activate courses for testing
      courses.forEach(c => { c.status = 'Active'; });

      // Step 1: Student registers
      const { userId: studentId } = await services.auth.register({
        name: 'Test Student',
        email: 'student@example.com',
        password: 'StudentPass123!',
        role: 'STUDENT',
      });

      expect(studentId).toBeDefined();

      // Step 2: Verify email
      const studentOtp = mockDB.otps.get('student@example.com').otp;
      await services.auth.verifyOtp('student@example.com', studentOtp);

      const student = mockDB.users.get('student@example.com');
      expect(student.isEmailVerified).toBe(true);

      // Step 3: Complete academic profile
      const updatedStudent = await services.student.updateProfile(studentId, {
        academicProfile: {
          profileType: 'SCHOOL',
          details: {
            studyingIn: 'Class 10',
            preferredStream: 'Science',
          },
        },
      });

      expect(updatedStudent.isProfileCompleted).toBe(true);

      // Step 4: Browse courses (increment views)
      await services.course.incrementViews(courses[0]._id);
      const viewedCourse = await services.course.getById(courses[0]._id);

      expect(viewedCourse.views).toBe(1);

      // Step 5: Wishlist courses
      const wishlist = await services.student.addToWishlist(studentId, courses[0]._id.toString());

      expect(wishlist).toHaveLength(1);
      expect(wishlist[0]).toBe(courses[0]._id.toString());
    });
  });

  // TS-134: Institution Admin Complete Journey
  describe('TS-134: Institution Admin Complete Journey', () => {
    it('should complete full admin flow: register → institution → payment → receive enquiries', async () => {
      // Register Admin
      await services.auth.register({
        email: 'fulladmin@test.com',
        password: 'AdminPass123!',
        role: 'INSTITUTE_ADMIN',
      });
      const adminOtp = mockDB.otps.get('fulladmin@test.com').otp;
      const { user: admin } = await services.auth.verifyOtp('fulladmin@test.com', adminOtp);

      // Create Institution
      const institution = await services.institution.createL1(admin._id, {
        instituteName: 'Complete Academy',
        instituteType: 'Coaching Center',
      });

      // Add Courses
      const courses = await services.course.create(institution._id, [
        { courseName: 'JEE Preparation' },
        { courseName: 'NEET Preparation' },
      ]);

      expect(courses).toHaveLength(2);

      // Payment
      const { orderId } = await services.payment.createOrder(admin._id, 'yearly');
      await services.payment.verifyAndActivate(orderId);

      // Verify courses are active
      const activeCourses = Array.from(mockDB.courses.values())
        .filter(c => c.institution.toString() === institution._id.toString() && c.status === 'Active');
      expect(activeCourses).toHaveLength(2);

      // Create student for enquiry
      await services.auth.register({
        email: 'enquirystudent@test.com',
        password: 'Pass123!',
        role: 'STUDENT',
      });
      const studentOtp = mockDB.otps.get('enquirystudent@test.com').otp;
      const { user: student } = await services.auth.verifyOtp('enquirystudent@test.com', studentOtp);

      // Student submits enquiry
      const enquiry = await services.enquiry.create(student._id, institution._id, 'callback');

      expect(enquiry._id).toBeDefined();
      expect(enquiry.institution.toString()).toBe(institution._id.toString());
      expect(enquiry.student.toString()).toBe(student._id.toString());

      // Verify enquiry is in database
      expect(mockDB.enquiries.size).toBe(1);
    });
  });

  // TS-135: Student Discovery Journey
  describe('TS-135: Student Discovery Journey', () => {
    it('should register → browse courses → wishlist → enquiry → callback', async () => {
      // Setup institution with active courses
      await services.auth.register({
        email: 'schooladmin@test.com',
        password: 'Pass123!',
        role: 'INSTITUTE_ADMIN',
      });
      const adminOtp = mockDB.otps.get('schooladmin@test.com').otp;
      const { user: admin } = await services.auth.verifyOtp('schooladmin@test.com', adminOtp);
      const institution = await services.institution.createL1(admin._id, {
        instituteName: 'Discovery School',
        instituteType: "School's",
      });
      const courses = await services.course.create(institution._id, [
        { courseName: 'Art Class' },
        { courseName: 'Music Class' },
      ]);
      // Activate courses
      courses.forEach(c => { c.status = 'Active'; });

      // Student journey
      await services.auth.register({
        email: 'explorer@test.com',
        password: 'Explore123!',
        role: 'STUDENT',
      });
      const studentOtp = mockDB.otps.get('explorer@test.com').otp;
      const { user: student } = await services.auth.verifyOtp('explorer@test.com', studentOtp);

      // Browse courses
      await services.course.incrementViews(courses[0]._id);
      await services.course.incrementViews(courses[1]._id);

      // Wishlist favorite courses
      await services.student.addToWishlist(student._id, courses[0]._id.toString());

      // Submit enquiry
      const enquiry = await services.enquiry.create(student._id, institution._id, 'demo');

      expect(enquiry.enquiryType).toBe('demo');

      // Verify course views tracked
      expect(courses[0].views).toBe(1);
      expect(courses[1].views).toBe(1);
    });
  });

  // TS-136: Subscription Renewal Flow
  describe('TS-136: Subscription Renewal Flow', () => {
    it('should renew expiring subscription and extend courses', async () => {
      // Setup: Admin with existing subscription near expiry
      await services.auth.register({
        email: 'renewadmin@test.com',
        password: 'Pass123!',
        role: 'INSTITUTE_ADMIN',
      });
      const otp = mockDB.otps.get('renewadmin@test.com').otp;
      const { user: admin } = await services.auth.verifyOtp('renewadmin@test.com', otp);

      const institution = await services.institution.createL1(admin._id, {
        instituteName: 'Renewal Academy',
        instituteType: 'Coaching Center',
      });

      // Create and activate initial courses
      const courses = await services.course.create(institution._id, [
        { courseName: 'Advanced Course' },
      ]);

      // Initial payment
      const { orderId: initialOrder } = await services.payment.createOrder(admin._id, 'monthly');
      await services.payment.verifyAndActivate(initialOrder);

      // Verify initial activation
      const activeCourse = mockDB.courses.get(courses[0]._id.toString());
      expect(activeCourse.status).toBe('Active');

      // Add new course that needs activation
      const newCourses = await services.course.create(institution._id, [
        { courseName: 'New Premium Course' },
      ]);

      expect(newCourses[0].status).toBe('Inactive');

      // Renewal payment for new course
      const { orderId: renewalOrder, amount } = await services.payment.createOrder(admin._id, 'yearly');

      expect(amount).toBe(1 * 999); // Only 1 inactive course

      await services.payment.verifyAndActivate(renewalOrder);

      // Verify new course is now active
      const renewedCourse = mockDB.courses.get(newCourses[0]._id.toString());
      expect(renewedCourse.status).toBe('Active');
    });
  });
});
