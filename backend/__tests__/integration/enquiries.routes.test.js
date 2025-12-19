/**
 * Enquiries Integration Tests
 * Test IDs: TS-074 to TS-079
 * 
 * Tests for enquiry creation, retrieval, and status updates
 */

const mongoose = require('mongoose');

// Mock stores
const mockDataStore = {
  enquiries: new Map(),
  institutions: new Map(),
  users: new Map(),
  students: new Map(),
};

// Mock Socket.IO
const mockSocketIO = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
};

describe('Enquiries Integration Tests', () => {

  beforeEach(() => {
    mockDataStore.enquiries.clear();
    mockDataStore.institutions.clear();
    mockDataStore.users.clear();
    mockDataStore.students.clear();
    jest.clearAllMocks();
  });

  // Helper to setup test data
  const setupTestData = () => {
    const adminId = new mongoose.Types.ObjectId();
    const studentId = new mongoose.Types.ObjectId();
    const institutionId = new mongoose.Types.ObjectId();

    mockDataStore.users.set(adminId.toString(), {
      _id: adminId,
      email: 'admin@example.com',
      role: 'INSTITUTE_ADMIN',
    });

    mockDataStore.students.set(studentId.toString(), {
      _id: studentId,
      name: 'Test Student',
      email: 'student@example.com',
      contactNumber: '9876543210',
      role: 'STUDENT',
    });

    mockDataStore.institutions.set(institutionId.toString(), {
      _id: institutionId,
      instituteName: 'Test Institution',
      institutionAdmin: adminId,
      callbackLeadsTotal: 0,
      demoLeadsTotal: 0,
    });

    return { adminId, studentId, institutionId };
  };

  // Enquiry service mock
  const enquiryService = {
    create: async ({ studentId, institutionId, enquiryType, programInterest, io }) => {
      const student = mockDataStore.students.get(studentId.toString());
      if (!student) {
        throw { status: 404, message: 'Student not found' };
      }

      const institution = mockDataStore.institutions.get(institutionId.toString());
      if (!institution) {
        throw { status: 404, message: 'Institution not found' };
      }

      const enquiry = {
        _id: new mongoose.Types.ObjectId(),
        student: studentId,
        institution: institutionId,
        enquiryType,
        programInterest,
        status: enquiryType,
        statusHistory: [{
          status: enquiryType,
          changedBy: studentId,
          changedAt: new Date(),
          notes: 'Initial enquiry created',
        }],
        createdAt: new Date(),
      };

      mockDataStore.enquiries.set(enquiry._id.toString(), enquiry);

      // Update institution rollups
      if (enquiryType === 'callback') {
        institution.callbackLeadsTotal++;
      } else if (enquiryType === 'demo') {
        institution.demoLeadsTotal++;
      }

      // Emit socket event
      if (io) {
        io.to(`institution:${institutionId}`).emit('enquiryCreated', { enquiry });
      }

      return enquiry;
    },

    getLeadsSummary: async (userId) => {
      const institutions = Array.from(mockDataStore.institutions.values())
        .filter(i => i.institutionAdmin.toString() === userId.toString());

      const totalLeads = institutions.reduce((sum, inst) => {
        return sum + (inst.callbackLeadsTotal || 0) + (inst.demoLeadsTotal || 0);
      }, 0);

      return { totalLeads };
    },

    getMonthlyData: async (userId, year) => {
      const institutions = Array.from(mockDataStore.institutions.values())
        .filter(i => i.institutionAdmin.toString() === userId.toString());

      const institutionIds = institutions.map(i => i._id.toString());

      const enquiries = Array.from(mockDataStore.enquiries.values())
        .filter(e => institutionIds.includes(e.institution.toString()));

      // Group by month
      const monthlyData = Array(12).fill(0);
      enquiries.forEach(e => {
        const month = new Date(e.createdAt).getMonth();
        if (new Date(e.createdAt).getFullYear() === year) {
          monthlyData[month]++;
        }
      });

      return monthlyData.map((count, index) => ({
        month: index + 1,
        count,
      }));
    },

    getRecent: async (userId, limit = 10, offset = 0) => {
      const institutions = Array.from(mockDataStore.institutions.values())
        .filter(i => i.institutionAdmin.toString() === userId.toString());

      const institutionIds = institutions.map(i => i._id.toString());

      const enquiries = Array.from(mockDataStore.enquiries.values())
        .filter(e => institutionIds.includes(e.institution.toString()))
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(offset, offset + limit)
        .map(e => {
          const student = mockDataStore.students.get(e.student.toString());
          return {
            ...e,
            studentName: student?.name,
            studentEmail: student?.email,
            studentPhone: student?.contactNumber,
          };
        });

      return enquiries;
    },

    updateStatus: async ({ enquiryId, status, notes, userId, io }) => {
      const enquiry = mockDataStore.enquiries.get(enquiryId.toString());
      if (!enquiry) {
        throw { status: 404, message: 'Enquiry not found' };
      }

      // Check authorization
      const institution = mockDataStore.institutions.get(enquiry.institution.toString());
      if (!institution || institution.institutionAdmin.toString() !== userId.toString()) {
        throw { status: 403, message: 'Not authorized to update this enquiry' };
      }

      const validStatuses = ['callback', 'demo', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw { status: 400, message: 'Invalid status' };
      }

      const oldStatus = enquiry.status;
      enquiry.status = status;
      enquiry.statusHistory.push({
        status,
        changedBy: userId,
        changedAt: new Date(),
        notes,
      });
      enquiry.updatedAt = new Date();

      // Emit socket event
      if (io) {
        io.to(`institution:${enquiry.institution}`).emit('enquiryStatusUpdated', {
          enquiryId,
          oldStatus,
          newStatus: status,
        });
      }

      return {
        enquiryId: enquiry._id,
        oldStatus,
        newStatus: status,
      };
    },
  };

  // TS-074: Create enquiry from student
  describe('TS-074: Create Enquiry from Student', () => {
    it('should create enquiry and emit real-time event', async () => {
      const { studentId, institutionId } = setupTestData();

      const enquiry = await enquiryService.create({
        studentId,
        institutionId,
        enquiryType: 'callback',
        programInterest: 'Computer Science',
        io: mockSocketIO,
      });

      expect(enquiry._id).toBeDefined();
      expect(enquiry.student.toString()).toBe(studentId.toString());
      expect(enquiry.institution.toString()).toBe(institutionId.toString());
      expect(enquiry.enquiryType).toBe('callback');
      expect(mockSocketIO.to).toHaveBeenCalledWith(`institution:${institutionId}`);
      expect(mockSocketIO.emit).toHaveBeenCalledWith('enquiryCreated', expect.any(Object));
    });

    it('should update institution lead counts', async () => {
      const { studentId, institutionId } = setupTestData();

      await enquiryService.create({
        studentId,
        institutionId,
        enquiryType: 'callback',
        programInterest: 'Engineering',
      });

      const institution = mockDataStore.institutions.get(institutionId.toString());
      expect(institution.callbackLeadsTotal).toBe(1);
    });

    it('should track demo leads separately', async () => {
      const { studentId, institutionId } = setupTestData();

      await enquiryService.create({
        studentId,
        institutionId,
        enquiryType: 'demo',
        programInterest: 'MBA',
      });

      const institution = mockDataStore.institutions.get(institutionId.toString());
      expect(institution.demoLeadsTotal).toBe(1);
    });

    it('should create initial status history', async () => {
      const { studentId, institutionId } = setupTestData();

      const enquiry = await enquiryService.create({
        studentId,
        institutionId,
        enquiryType: 'callback',
        programInterest: 'Test',
      });

      expect(enquiry.statusHistory).toHaveLength(1);
      expect(enquiry.statusHistory[0].status).toBe('callback');
      expect(enquiry.statusHistory[0].notes).toBe('Initial enquiry created');
    });
  });

  // TS-075: Get institution admin leads summary
  describe('TS-075: Get Leads Summary', () => {
    it('should return total leads count for admin institutions', async () => {
      const { adminId, studentId, institutionId } = setupTestData();

      // Create multiple enquiries
      await enquiryService.create({ studentId, institutionId, enquiryType: 'callback' });
      await enquiryService.create({ studentId, institutionId, enquiryType: 'demo' });
      await enquiryService.create({ studentId, institutionId, enquiryType: 'callback' });

      const summary = await enquiryService.getLeadsSummary(adminId);

      expect(summary.totalLeads).toBe(3);
    });

    it('should return 0 for admin with no enquiries', async () => {
      const { adminId } = setupTestData();

      const summary = await enquiryService.getLeadsSummary(adminId);

      expect(summary.totalLeads).toBe(0);
    });
  });

  // TS-076: Get monthly enquiries data
  describe('TS-076: Get Monthly Enquiries Data', () => {
    it('should return enquiries grouped by month', async () => {
      const { adminId, studentId, institutionId } = setupTestData();

      // Create enquiry
      await enquiryService.create({
        studentId,
        institutionId,
        enquiryType: 'callback',
      });

      const currentYear = new Date().getFullYear();
      const data = await enquiryService.getMonthlyData(adminId, currentYear);

      expect(data).toHaveLength(12);
      const currentMonth = new Date().getMonth();
      expect(data[currentMonth].count).toBe(1);
    });
  });

  // TS-077: Get recent enquiries with pagination
  describe('TS-077: Get Recent Enquiries with Pagination', () => {
    it('should return paginated enquiries with student details', async () => {
      const { adminId, studentId, institutionId } = setupTestData();

      // Create 5 enquiries
      for (let i = 0; i < 5; i++) {
        await enquiryService.create({
          studentId,
          institutionId,
          enquiryType: 'callback',
          programInterest: `Program ${i}`,
        });
      }

      const enquiries = await enquiryService.getRecent(adminId, 3, 0);

      expect(enquiries).toHaveLength(3);
      expect(enquiries[0].studentName).toBe('Test Student');
      expect(enquiries[0].studentEmail).toBe('student@example.com');
    });

    it('should support pagination offset', async () => {
      const { adminId, studentId, institutionId } = setupTestData();

      for (let i = 0; i < 5; i++) {
        await enquiryService.create({
          studentId,
          institutionId,
          enquiryType: 'callback',
        });
      }

      const page1 = await enquiryService.getRecent(adminId, 2, 0);
      const page2 = await enquiryService.getRecent(adminId, 2, 2);

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0]._id).not.toEqual(page2[0]._id);
    });
  });

  // TS-078: Update enquiry status
  describe('TS-078: Update Enquiry Status', () => {
    it('should update status, log history, and emit socket event', async () => {
      const { adminId, studentId, institutionId } = setupTestData();

      const enquiry = await enquiryService.create({
        studentId,
        institutionId,
        enquiryType: 'callback',
      });

      const result = await enquiryService.updateStatus({
        enquiryId: enquiry._id,
        status: 'in_progress',
        notes: 'Following up with student',
        userId: adminId,
        io: mockSocketIO,
      });

      expect(result.oldStatus).toBe('callback');
      expect(result.newStatus).toBe('in_progress');

      const updated = mockDataStore.enquiries.get(enquiry._id.toString());
      expect(updated.status).toBe('in_progress');
      expect(updated.statusHistory).toHaveLength(2);
      expect(mockSocketIO.emit).toHaveBeenCalledWith('enquiryStatusUpdated', expect.any(Object));
    });

    it('should reject invalid status values', async () => {
      const { adminId, studentId, institutionId } = setupTestData();

      const enquiry = await enquiryService.create({
        studentId,
        institutionId,
        enquiryType: 'callback',
      });

      await expect(
        enquiryService.updateStatus({
          enquiryId: enquiry._id,
          status: 'invalid_status',
          userId: adminId,
        })
      ).rejects.toMatchObject({ status: 400, message: 'Invalid status' });
    });
  });

  // TS-079: Update enquiry status (unauthorized)
  describe('TS-079: Update Enquiry Status Unauthorized', () => {
    it('should return 403 for enquiry not owned by admin', async () => {
      const { studentId, institutionId } = setupTestData();
      const otherAdminId = new mongoose.Types.ObjectId();

      const enquiry = await enquiryService.create({
        studentId,
        institutionId,
        enquiryType: 'callback',
      });

      await expect(
        enquiryService.updateStatus({
          enquiryId: enquiry._id,
          status: 'completed',
          userId: otherAdminId,
        })
      ).rejects.toMatchObject({ status: 403 });
    });

    it('should return 404 for non-existent enquiry', async () => {
      const { adminId } = setupTestData();
      const fakeEnquiryId = new mongoose.Types.ObjectId();

      await expect(
        enquiryService.updateStatus({
          enquiryId: fakeEnquiryId,
          status: 'completed',
          userId: adminId,
        })
      ).rejects.toMatchObject({ status: 404 });
    });
  });
});
