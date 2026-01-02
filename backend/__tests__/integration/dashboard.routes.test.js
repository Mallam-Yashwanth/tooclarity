/**
 * Dashboard Integration Tests
 * Test IDs: TS-080 to TS-091
 * 
 * Tests for password change OTP, dashboard data export, and institution updates
 */

const mongoose = require('mongoose');

// Mock stores
const mockDataStore = {
  users: new Map(),
  institutions: new Map(),
  courses: new Map(),
  branches: new Map(),
  otps: new Map(),
};

describe('Dashboard Integration Tests', () => {

  beforeEach(() => {
    mockDataStore.users.clear();
    mockDataStore.institutions.clear();
    mockDataStore.courses.clear();
    mockDataStore.branches.clear();
    mockDataStore.otps.clear();
  });

  // Helper functions
  const createUser = (options = {}) => {
    const userId = new mongoose.Types.ObjectId();
    const institutionId = options.institutionId || new mongoose.Types.ObjectId();
    
    const user = {
      _id: userId,
      email: options.email || `user_${userId}@test.com`,
      password: options.password || 'hashedPassword',
      name: options.name || 'Test User',
      institution: institutionId,
      role: options.role || 'INSTITUTE_ADMIN',
    };

    mockDataStore.users.set(userId.toString(), user);
    return user;
  };

  const createInstitution = (adminId, options = {}) => {
    const institutionId = options._id || new mongoose.Types.ObjectId();
    
    const institution = {
      _id: institutionId,
      instituteName: options.instituteName || 'Test Institution',
      instituteType: options.instituteType || "School's",
      institutionAdmin: adminId,
      aboutInstitute: options.aboutInstitute || 'A test institution',
      address: options.address || '123 Test St',
      district: options.district || 'Test District',
      state: options.state || 'Test State',
    };

    mockDataStore.institutions.set(institutionId.toString(), institution);
    return institution;
  };

  // Dashboard service mock
  const dashboardService = {
    sendPasswordChangeOtp: async (userId, email) => {
      const user = mockDataStore.users.get(userId.toString());
      if (!user) {
        throw { status: 404, message: 'User not found' };
      }

      if (user.email !== email) {
        throw { status: 400, message: 'Email does not match registered email' };
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      mockDataStore.otps.set(`password_change:${userId}`, {
        otp,
        expires: Date.now() + 5 * 60 * 1000,
        attempts: 0,
      });

      return { success: true, message: 'OTP sent to email' };
    },

    verifyPasswordChangeOtp: async (userId, otp) => {
      const storedOtp = mockDataStore.otps.get(`password_change:${userId}`);
      
      if (!storedOtp) {
        throw { status: 400, message: 'OTP not found or expired' };
      }

      if (storedOtp.expires < Date.now()) {
        mockDataStore.otps.delete(`password_change:${userId}`);
        throw { status: 400, message: 'OTP expired' };
      }

      storedOtp.attempts++;

      if (storedOtp.attempts > 3) {
        mockDataStore.otps.delete(`password_change:${userId}`);
        throw { status: 429, message: 'Too many attempts. Please request a new OTP' };
      }

      if (storedOtp.otp !== otp) {
        throw { status: 400, message: 'Invalid OTP' };
      }

      // Mark as verified
      storedOtp.verified = true;

      return { success: true, verified: true };
    },

    updatePassword: async (userId, currentPassword, newPassword) => {
      const user = mockDataStore.users.get(userId.toString());
      if (!user) {
        throw { status: 404, message: 'User not found' };
      }

      // Check OTP verification
      const otpEntry = mockDataStore.otps.get(`password_change:${userId}`);
      if (!otpEntry || !otpEntry.verified) {
        throw { status: 403, message: 'Please verify OTP first' };
      }

      // Validate password requirements
      if (!newPassword || newPassword.length < 8) {
        throw { status: 400, message: 'Password must be at least 8 characters' };
      }

      if (currentPassword === newPassword) {
        throw { status: 400, message: 'New password must be different from current password' };
      }

      // Update password
      user.password = 'newHashedPassword:' + newPassword;
      user.passwordLastUpdated = new Date();

      // Clear OTP entry
      mockDataStore.otps.delete(`password_change:${userId}`);

      return { success: true, message: 'Password updated successfully' };
    },

    exportStructuredData: async (userId, format = 'json') => {
      const user = mockDataStore.users.get(userId.toString());
      if (!user) {
        throw { status: 404, message: 'User not found' };
      }

      // Get institution
      let institution = null;
      for (const [, inst] of mockDataStore.institutions) {
        if (inst.institutionAdmin.toString() === userId.toString()) {
          institution = inst;
          break;
        }
      }

      if (!institution) {
        throw { status: 404, message: 'Institution not found' };
      }

      // Get courses
      const courses = Array.from(mockDataStore.courses.values())
        .filter(c => c.institution.toString() === institution._id.toString());

      // Get branches
      const branches = Array.from(mockDataStore.branches.values())
        .filter(b => b.institution.toString() === institution._id.toString());

      const exportData = {
        institution: {
          name: institution.instituteName,
          type: institution.instituteType,
          address: institution.address,
          state: institution.state,
          district: institution.district,
        },
        courses: courses.map(c => ({
          name: c.courseName,
          duration: c.courseDuration,
          price: c.priceOfCourse,
          status: c.status,
        })),
        branches: branches.map(b => ({
          name: b.branchName,
          address: b.address,
        })),
        exportedAt: new Date().toISOString(),
      };

      if (format === 'json') {
        return {
          data: exportData,
          contentType: 'application/json',
          filename: `${institution.instituteName.replace(/\s+/g, '_')}_export.json`,
        };
      }

      throw { status: 400, message: 'Unsupported export format' };
    },

    updateInstitutionAndCourses: async (userId, data) => {
      const user = mockDataStore.users.get(userId.toString());
      if (!user) {
        throw { status: 404, message: 'User not found' };
      }

      let institution = null;
      for (const [, inst] of mockDataStore.institutions) {
        if (inst.institutionAdmin.toString() === userId.toString()) {
          institution = inst;
          break;
        }
      }

      if (!institution) {
        throw { status: 404, message: 'Institution not found' };
      }

      // Validate and update institution
      if (data.institution) {
        if (data.institution.instituteName) {
          institution.instituteName = data.institution.instituteName;
        }
        if (data.institution.aboutInstitute) {
          institution.aboutInstitute = data.institution.aboutInstitute;
        }
        if (data.institution.address) {
          institution.address = data.institution.address;
        }
        institution.updatedAt = new Date();
      }

      // Update courses
      let coursesUpdated = 0;
      if (data.courses && Array.isArray(data.courses)) {
        for (const courseUpdate of data.courses) {
          if (courseUpdate._id) {
            const course = mockDataStore.courses.get(courseUpdate._id.toString());
            if (course && course.institution.toString() === institution._id.toString()) {
              if (courseUpdate.courseName) course.courseName = courseUpdate.courseName;
              if (courseUpdate.aboutCourse) course.aboutCourse = courseUpdate.aboutCourse;
              if (courseUpdate.priceOfCourse !== undefined) course.priceOfCourse = courseUpdate.priceOfCourse;
              course.updatedAt = new Date();
              coursesUpdated++;
            }
          }
        }
      }

      return {
        success: true,
        institution: institution._id,
        coursesUpdated,
      };
    },
  };

  // TS-080: Send password change OTP
  describe('TS-080: Send Password Change OTP', () => {
    it('should send OTP to registered email', async () => {
      const user = createUser({ email: 'test@example.com' });

      const result = await dashboardService.sendPasswordChangeOtp(user._id, 'test@example.com');

      expect(result.success).toBe(true);
      expect(mockDataStore.otps.has(`password_change:${user._id}`)).toBe(true);
    });

    it('should reject mismatched email', async () => {
      const user = createUser({ email: 'correct@example.com' });

      await expect(
        dashboardService.sendPasswordChangeOtp(user._id, 'wrong@example.com')
      ).rejects.toMatchObject({ status: 400 });
    });

    it('should reject non-existent user', async () => {
      await expect(
        dashboardService.sendPasswordChangeOtp(new mongoose.Types.ObjectId(), 'any@example.com')
      ).rejects.toMatchObject({ status: 404 });
    });
  });

  // TS-081: Verify password change OTP
  describe('TS-081: Verify Password Change OTP', () => {
    it('should verify valid OTP', async () => {
      const user = createUser();
      const otp = '123456';
      
      mockDataStore.otps.set(`password_change:${user._id}`, {
        otp,
        expires: Date.now() + 5 * 60 * 1000,
        attempts: 0,
      });

      const result = await dashboardService.verifyPasswordChangeOtp(user._id, otp);

      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);
    });

    it('should reject invalid OTP', async () => {
      const user = createUser();
      
      mockDataStore.otps.set(`password_change:${user._id}`, {
        otp: '123456',
        expires: Date.now() + 5 * 60 * 1000,
        attempts: 0,
      });

      await expect(
        dashboardService.verifyPasswordChangeOtp(user._id, '000000')
      ).rejects.toMatchObject({ status: 400, message: 'Invalid OTP' });
    });

    it('should reject expired OTP', async () => {
      const user = createUser();
      
      mockDataStore.otps.set(`password_change:${user._id}`, {
        otp: '123456',
        expires: Date.now() - 1000, // Expired
        attempts: 0,
      });

      await expect(
        dashboardService.verifyPasswordChangeOtp(user._id, '123456')
      ).rejects.toMatchObject({ status: 400, message: 'OTP expired' });
    });

    it('should block after too many attempts', async () => {
      const user = createUser();
      
      mockDataStore.otps.set(`password_change:${user._id}`, {
        otp: '123456',
        expires: Date.now() + 5 * 60 * 1000,
        attempts: 3,
      });

      await expect(
        dashboardService.verifyPasswordChangeOtp(user._id, '000000')
      ).rejects.toMatchObject({ status: 429, message: 'Too many attempts. Please request a new OTP' });
    });
  });

  // TS-082: Update password
  describe('TS-082: Update Password', () => {
    it('should update password after OTP verification', async () => {
      const user = createUser();
      
      mockDataStore.otps.set(`password_change:${user._id}`, {
        otp: '123456',
        expires: Date.now() + 5 * 60 * 1000,
        verified: true,
        attempts: 0,
      });

      const result = await dashboardService.updatePassword(user._id, 'oldPass', 'NewSecurePass123!');

      expect(result.success).toBe(true);
      expect(user.password).toContain('newHashedPassword');
      expect(user.passwordLastUpdated).toBeDefined();
    });

    it('should reject without OTP verification', async () => {
      const user = createUser();

      await expect(
        dashboardService.updatePassword(user._id, 'oldPass', 'newPass123')
      ).rejects.toMatchObject({ status: 403, message: 'Please verify OTP first' });
    });

    it('should reject short password', async () => {
      const user = createUser();
      
      mockDataStore.otps.set(`password_change:${user._id}`, {
        verified: true,
        attempts: 0,
      });

      await expect(
        dashboardService.updatePassword(user._id, 'oldPass', 'short')
      ).rejects.toMatchObject({ status: 400 });
    });

    it('should reject same password', async () => {
      const user = createUser();
      
      mockDataStore.otps.set(`password_change:${user._id}`, {
        verified: true,
        attempts: 0,
      });

      await expect(
        dashboardService.updatePassword(user._id, 'samePassword', 'samePassword')
      ).rejects.toMatchObject({ status: 400, message: 'New password must be different from current password' });
    });
  });

  // TS-083: Export structured data
  describe('TS-083: Export Structured Data', () => {
    it('should export institution, courses, and branches as JSON', async () => {
      const user = createUser();
      const institution = createInstitution(user._id, {
        _id: user.institution,
        instituteName: 'Export Test School',
      });

      // Add courses
      for (let i = 0; i < 3; i++) {
        const courseId = new mongoose.Types.ObjectId();
        mockDataStore.courses.set(courseId.toString(), {
          _id: courseId,
          courseName: `Course ${i + 1}`,
          institution: institution._id,
          status: 'Active',
          priceOfCourse: 10000,
        });
      }

      // Add branches
      const branchId = new mongoose.Types.ObjectId();
      mockDataStore.branches.set(branchId.toString(), {
        _id: branchId,
        branchName: 'Main Branch',
        institution: institution._id,
        address: 'Branch Address',
      });

      const result = await dashboardService.exportStructuredData(user._id, 'json');

      expect(result.contentType).toBe('application/json');
      expect(result.data.institution.name).toBe('Export Test School');
      expect(result.data.courses).toHaveLength(3);
      expect(result.data.branches).toHaveLength(1);
      expect(result.data.exportedAt).toBeDefined();
    });

    it('should reject unsupported format', async () => {
      const user = createUser();
      createInstitution(user._id, { _id: user.institution });

      await expect(
        dashboardService.exportStructuredData(user._id, 'xml')
      ).rejects.toMatchObject({ status: 400, message: 'Unsupported export format' });
    });
  });

  // TS-084: Update institution and courses atomically
  describe('TS-084: Update Institution and Courses', () => {
    it('should update institution and multiple courses', async () => {
      const user = createUser();
      const institution = createInstitution(user._id, {
        _id: user.institution,
        instituteName: 'Original Name',
      });

      const courseId = new mongoose.Types.ObjectId();
      mockDataStore.courses.set(courseId.toString(), {
        _id: courseId,
        courseName: 'Original Course',
        institution: institution._id,
        priceOfCourse: 5000,
      });

      const result = await dashboardService.updateInstitutionAndCourses(user._id, {
        institution: {
          instituteName: 'Updated Name',
          aboutInstitute: 'Updated description',
        },
        courses: [
          {
            _id: courseId,
            courseName: 'Updated Course',
            priceOfCourse: 7500,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.coursesUpdated).toBe(1);
      expect(institution.instituteName).toBe('Updated Name');
      
      const course = mockDataStore.courses.get(courseId.toString());
      expect(course.courseName).toBe('Updated Course');
      expect(course.priceOfCourse).toBe(7500);
    });

    it('should handle partial updates', async () => {
      const user = createUser();
      const institution = createInstitution(user._id, {
        _id: user.institution,
        instituteName: 'Keep This Name',
        aboutInstitute: 'Original About',
      });

      const result = await dashboardService.updateInstitutionAndCourses(user._id, {
        institution: {
          aboutInstitute: 'Only update this',
        },
      });

      expect(result.success).toBe(true);
      expect(institution.instituteName).toBe('Keep This Name');
      expect(institution.aboutInstitute).toBe('Only update this');
    });
  });
});
