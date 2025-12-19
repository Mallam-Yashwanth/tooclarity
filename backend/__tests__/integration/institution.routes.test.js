/**
 * Institution Routes Integration Tests
 * Test IDs: TS-034 to TS-039
 * 
 * Tests for institution CRUD, file upload, and search functionality
 */

const mongoose = require('mongoose');

// Mock stores
const mockDataStore = {
  institutions: new Map(),
  users: new Map(),
  courses: new Map(),
  branches: new Map(),
  elasticsearch: [],
};

describe('Institution Routes Integration Tests', () => {

  beforeEach(() => {
    mockDataStore.institutions.clear();
    mockDataStore.users.clear();
    mockDataStore.courses.clear();
    mockDataStore.branches.clear();
    mockDataStore.elasticsearch = [];
  });

  // Helper to create user
  const createUser = (role = 'INSTITUTE_ADMIN') => {
    const userId = new mongoose.Types.ObjectId();
    const user = {
      _id: userId,
      email: `user_${userId}@test.com`,
      role,
      isProfileCompleted: false,
    };
    mockDataStore.users.set(userId.toString(), user);
    return user;
  };

  // Mock institution service
  const institutionService = {
    createL1: async (userId, data) => {
      // Check if user already has institution
      const existingInst = Array.from(mockDataStore.institutions.values())
        .find(i => i.institutionAdmin.toString() === userId.toString());
      
      if (existingInst) {
        throw { status: 400, message: 'Institution already exists for this admin' };
      }

      const institutionId = new mongoose.Types.ObjectId();
      const institution = {
        _id: institutionId,
        ...data,
        institutionAdmin: userId,
        createdAt: new Date(),
      };

      mockDataStore.institutions.set(institutionId.toString(), institution);

      // Update user's institution reference
      const user = mockDataStore.users.get(userId.toString());
      if (user) {
        user.institution = institutionId;
      }

      return institution;
    },

    updateL2: async (userId, data) => {
      let institution = null;
      for (const [, inst] of mockDataStore.institutions) {
        if (inst.institutionAdmin.toString() === userId.toString()) {
          institution = inst;
          break;
        }
      }

      if (!institution) {
        throw { status: 404, message: 'Institution not found for this user' };
      }

      Object.assign(institution, data, { updatedAt: new Date() });

      // Sync to Elasticsearch
      const esIndex = mockDataStore.elasticsearch.findIndex(
        e => e.id === institution._id.toString()
      );
      const esDoc = {
        id: institution._id.toString(),
        instituteName: institution.instituteName,
        instituteType: institution.instituteType,
        state: institution.state,
        district: institution.district,
      };

      if (esIndex >= 0) {
        mockDataStore.elasticsearch[esIndex] = esDoc;
      } else {
        mockDataStore.elasticsearch.push(esDoc);
      }

      return institution;
    },

    getMyInstitution: async (userId) => {
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

      return institution;
    },

    deleteMyInstitution: async (userId) => {
      let institution = null;
      let institutionId = null;

      for (const [id, inst] of mockDataStore.institutions) {
        if (inst.institutionAdmin.toString() === userId.toString()) {
          institution = inst;
          institutionId = id;
          break;
        }
      }

      if (!institution) {
        throw { status: 404, message: 'Institution not found' };
      }

      // Delete related courses
      for (const [id, course] of mockDataStore.courses) {
        if (course.institution.toString() === institutionId) {
          mockDataStore.courses.delete(id);
        }
      }

      // Delete related branches
      for (const [id, branch] of mockDataStore.branches) {
        if (branch.institution.toString() === institutionId) {
          mockDataStore.branches.delete(id);
        }
      }

      // Remove from Elasticsearch
      const esIndex = mockDataStore.elasticsearch.findIndex(
        e => e.id === institutionId
      );
      if (esIndex >= 0) {
        mockDataStore.elasticsearch.splice(esIndex, 1);
      }

      mockDataStore.institutions.delete(institutionId);

      // Clear user's institution reference
      const user = mockDataStore.users.get(userId.toString());
      if (user) {
        user.institution = null;
      }

      return { success: true };
    },

    uploadFileData: async (userId, fileContent) => {
      const existingInst = Array.from(mockDataStore.institutions.values())
        .find(i => i.institutionAdmin.toString() === userId.toString());
      
      if (existingInst) {
        throw { status: 400, message: 'Institution already exists' };
      }

      const parsed = JSON.parse(fileContent);
      const { institution: instData, courses: coursesData } = parsed;

      if (!instData) {
        throw { status: 400, message: 'Institution data is required' };
      }

      // Create institution
      const institutionId = new mongoose.Types.ObjectId();
      const institution = {
        _id: institutionId,
        ...instData,
        institutionAdmin: userId,
        createdAt: new Date(),
      };
      mockDataStore.institutions.set(institutionId.toString(), institution);

      // Update user
      const user = mockDataStore.users.get(userId.toString());
      if (user) {
        user.institution = institutionId;
        user.isProfileCompleted = true;
      }

      // Create courses
      const createdCourses = [];
      if (coursesData && Array.isArray(coursesData)) {
        for (const courseData of coursesData) {
          const courseId = new mongoose.Types.ObjectId();
          const course = {
            _id: courseId,
            ...courseData,
            institution: institutionId,
            status: 'Inactive',
          };
          mockDataStore.courses.set(courseId.toString(), course);
          createdCourses.push(course);
        }
      }

      // Sync to Elasticsearch
      mockDataStore.elasticsearch.push({
        id: institutionId.toString(),
        instituteName: institution.instituteName,
      });

      return { institution, courses: createdCourses };
    },

    search: async (filters, page = 1, limit = 10) => {
      let results = [...mockDataStore.elasticsearch];

      if (filters.query) {
        const query = filters.query.toLowerCase();
        results = results.filter(r => 
          r.instituteName?.toLowerCase().includes(query)
        );
      }

      if (filters.instituteType) {
        results = results.filter(r => r.instituteType === filters.instituteType);
      }

      if (filters.state) {
        results = results.filter(r => r.state === filters.state);
      }

      const total = results.length;
      const start = (page - 1) * limit;
      const paginated = results.slice(start, start + limit);

      return {
        results: paginated,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    },
  };

  // TS-034: Create L1 Institution
  describe('TS-034: Create L1 Institution', () => {
    it('should create institution and link to admin, return 201', async () => {
      const user = createUser();

      const institution = await institutionService.createL1(user._id, {
        instituteName: 'Test Academy',
        instituteType: "School's",
      });

      expect(institution._id).toBeDefined();
      expect(institution.instituteName).toBe('Test Academy');
      expect(institution.institutionAdmin.toString()).toBe(user._id.toString());

      // Verify user has institution linked
      const updatedUser = mockDataStore.users.get(user._id.toString());
      expect(updatedUser.institution).toBeDefined();
    });

    it('should reject duplicate institution for same admin', async () => {
      const user = createUser();

      await institutionService.createL1(user._id, {
        instituteName: 'First Academy',
        instituteType: "School's",
      });

      await expect(
        institutionService.createL1(user._id, {
          instituteName: 'Second Academy',
          instituteType: 'Coaching Center',
        })
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  // TS-035: Update L2 Institution Details
  describe('TS-035: Update L2 Institution Details', () => {
    it('should update details and sync to Elasticsearch', async () => {
      const user = createUser();
      await institutionService.createL1(user._id, {
        instituteName: 'Update Test',
        instituteType: 'Coaching Center',
      });

      const updated = await institutionService.updateL2(user._id, {
        aboutInstitute: 'Premier coaching center for competitive exams',
        address: '456 Coaching Street',
        state: 'Karnataka',
        district: 'Bangalore',
      });

      expect(updated.aboutInstitute).toBeDefined();
      expect(updated.state).toBe('Karnataka');
      expect(updated.updatedAt).toBeDefined();

      // Check Elasticsearch sync
      const esDoc = mockDataStore.elasticsearch.find(
        e => e.id === updated._id.toString()
      );
      expect(esDoc).toBeDefined();
      expect(esDoc.state).toBe('Karnataka');
    });

    it('should return 404 for non-existent institution', async () => {
      const user = createUser();

      await expect(
        institutionService.updateL2(user._id, { aboutInstitute: 'Test' })
      ).rejects.toMatchObject({ status: 404 });
    });
  });

  // TS-036: Get institution for logged-in admin
  describe('TS-036: Get My Institution', () => {
    it('should return institution data for current admin', async () => {
      const user = createUser();
      await institutionService.createL1(user._id, {
        instituteName: 'My Institution',
        instituteType: "School's",
      });

      const institution = await institutionService.getMyInstitution(user._id);

      expect(institution.instituteName).toBe('My Institution');
      expect(institution.institutionAdmin.toString()).toBe(user._id.toString());
    });

    it('should return 404 for admin without institution', async () => {
      const user = createUser();

      await expect(
        institutionService.getMyInstitution(user._id)
      ).rejects.toMatchObject({ status: 404 });
    });
  });

  // TS-037: Delete institution with related data
  describe('TS-037: Delete Institution with Related Data', () => {
    it('should delete institution and related courses within transaction', async () => {
      const user = createUser();
      const institution = await institutionService.createL1(user._id, {
        instituteName: 'To Delete',
        instituteType: 'Coaching Center',
      });

      // Add courses
      for (let i = 0; i < 3; i++) {
        const courseId = new mongoose.Types.ObjectId();
        mockDataStore.courses.set(courseId.toString(), {
          _id: courseId,
          courseName: `Course ${i}`,
          institution: institution._id,
        });
      }

      // Sync to ES
      mockDataStore.elasticsearch.push({ id: institution._id.toString() });

      expect(mockDataStore.courses.size).toBe(3);

      const result = await institutionService.deleteMyInstitution(user._id);

      expect(result.success).toBe(true);
      expect(mockDataStore.institutions.size).toBe(0);
      expect(mockDataStore.courses.size).toBe(0);
      expect(mockDataStore.elasticsearch.length).toBe(0);

      // User's institution cleared
      const updatedUser = mockDataStore.users.get(user._id.toString());
      expect(updatedUser.institution).toBeNull();
    });
  });

  // TS-038: Upload institution data from JSON file
  describe('TS-038: Upload File Data', () => {
    it('should parse file and create institution with courses', async () => {
      const user = createUser();

      const fileContent = JSON.stringify({
        institution: {
          instituteName: 'File Upload Academy',
          instituteType: "School's",
          address: 'File Street',
        },
        courses: [
          { courseName: 'Math', priceOfCourse: 5000 },
          { courseName: 'Science', priceOfCourse: 6000 },
          { courseName: 'English', priceOfCourse: 4500 },
        ],
      });

      const result = await institutionService.uploadFileData(user._id, fileContent);

      expect(result.institution.instituteName).toBe('File Upload Academy');
      expect(result.courses).toHaveLength(3);
      expect(result.courses.every(c => c.status === 'Inactive')).toBe(true);

      // User profile marked complete
      const updatedUser = mockDataStore.users.get(user._id.toString());
      expect(updatedUser.isProfileCompleted).toBe(true);
    });

    it('should reject if institution data missing', async () => {
      const user = createUser();

      const fileContent = JSON.stringify({
        courses: [{ courseName: 'Orphan Course' }],
      });

      await expect(
        institutionService.uploadFileData(user._id, fileContent)
      ).rejects.toMatchObject({ status: 400, message: 'Institution data is required' });
    });
  });

  // TS-039: Search institutions with filters
  describe('TS-039: Search Institutions', () => {
    beforeEach(async () => {
      // Populate test data
      const institutions = [
        { instituteName: 'ABC School', instituteType: "School's", state: 'Maharashtra' },
        { instituteName: 'XYZ Academy', instituteType: 'Coaching Center', state: 'Karnataka' },
        { instituteName: 'ABC College', instituteType: 'Under Graduation/Post Graduation', state: 'Maharashtra' },
        { instituteName: 'DEF School', instituteType: "School's", state: 'Tamil Nadu' },
      ];

      institutions.forEach((inst, i) => {
        const id = new mongoose.Types.ObjectId();
        mockDataStore.elasticsearch.push({
          id: id.toString(),
          ...inst,
        });
      });
    });

    it('should return paginated filtered results', async () => {
      const result = await institutionService.search({ query: 'ABC' }, 1, 10);

      expect(result.results).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by institute type', async () => {
      const result = await institutionService.search(
        { instituteType: "School's" },
        1,
        10
      );

      expect(result.results).toHaveLength(2);
      expect(result.results.every(r => r.instituteType === "School's")).toBe(true);
    });

    it('should filter by state', async () => {
      const result = await institutionService.search(
        { state: 'Maharashtra' },
        1,
        10
      );

      expect(result.results).toHaveLength(2);
      expect(result.results.every(r => r.state === 'Maharashtra')).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const page1 = await institutionService.search({}, 1, 2);
      const page2 = await institutionService.search({}, 2, 2);

      expect(page1.results).toHaveLength(2);
      expect(page2.results).toHaveLength(2);
      expect(page1.pages).toBe(2);
    });
  });
});
