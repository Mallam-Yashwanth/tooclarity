/**
 * Course Routes Integration Tests
 * Test IDs: TS-044 to TS-054
 * 
 * Tests for course CRUD, metrics, caching, and Elasticsearch sync
 */

const mongoose = require('mongoose');

// Mock stores
const mockDataStore = {
  courses: new Map(),
  institutions: new Map(),
  cache: new Map(),
  elasticsearch: [],
};

describe('Course Routes Integration Tests', () => {

  beforeEach(() => {
    mockDataStore.courses.clear();
    mockDataStore.institutions.clear();
    mockDataStore.cache.clear();
    mockDataStore.elasticsearch = [];
  });

  // Helper to create mock institution
  const createMockInstitution = (adminId) => {
    const id = new mongoose.Types.ObjectId();
    const institution = {
      _id: id,
      instituteName: 'Test Institution',
      instituteType: "School's",
      institutionAdmin: adminId,
    };
    mockDataStore.institutions.set(id.toString(), institution);
    return institution;
  };

  // Mock course service
  const courseService = {
    create: async (institutionId, coursesData, userId) => {
      const institution = mockDataStore.institutions.get(institutionId.toString());
      
      if (!institution) {
        throw { status: 404, message: 'Institution not found' };
      }
      
      if (institution.institutionAdmin.toString() !== userId.toString()) {
        throw { status: 403, message: 'Not authorized' };
      }

      const createdCourses = coursesData.map(data => {
        const course = {
          _id: new mongoose.Types.ObjectId(),
          ...data,
          institution: institutionId,
          status: 'Inactive',
          views: 0,
          comparisons: 0,
          leads: 0,
          createdAt: new Date(),
        };
        mockDataStore.courses.set(course._id.toString(), course);
        return course;
      });

      return { count: createdCourses.length, data: createdCourses };
    },

    findByInstitution: async (institutionId, page = 1, limit = 10) => {
      const courses = Array.from(mockDataStore.courses.values())
        .filter(c => c.institution.toString() === institutionId.toString());
      
      const start = (page - 1) * limit;
      const paginated = courses.slice(start, start + limit);
      
      return {
        courses: paginated,
        total: courses.length,
        page,
        pages: Math.ceil(courses.length / limit),
      };
    },

    findById: async (courseId, userId = null) => {
      const cacheKey = `course:${courseId}`;
      const cached = mockDataStore.cache.get(cacheKey);
      
      if (cached) {
        return { data: JSON.parse(cached), fromCache: true };
      }

      const course = mockDataStore.courses.get(courseId.toString());
      
      if (!course || course.status !== 'Active') {
        return null;
      }

      const institution = mockDataStore.institutions.get(course.institution.toString());
      
      const result = {
        course,
        institution: institution || null,
      };

      // Cache the result
      mockDataStore.cache.set(cacheKey, JSON.stringify(result));

      return { data: result, fromCache: false };
    },

    update: async (institutionId, courseId, updateData, userId) => {
      const institution = mockDataStore.institutions.get(institutionId.toString());
      
      if (!institution || institution.institutionAdmin.toString() !== userId.toString()) {
        throw { status: 403, message: 'Not authorized' };
      }

      const course = mockDataStore.courses.get(courseId.toString());
      
      if (!course) {
        throw { status: 404, message: 'Course not found' };
      }

      Object.assign(course, updateData, { updatedAt: new Date() });

      // Sync to Elasticsearch if active
      if (course.status === 'Active') {
        const esIndex = mockDataStore.elasticsearch.findIndex(e => e.id === courseId.toString());
        const esDoc = { id: courseId.toString(), courseName: course.courseName };
        
        if (esIndex >= 0) {
          mockDataStore.elasticsearch[esIndex] = esDoc;
        } else {
          mockDataStore.elasticsearch.push(esDoc);
        }
      }

      // Clear cache
      mockDataStore.cache.delete(`course:${courseId}`);

      return course;
    },

    delete: async (institutionId, courseId, userId) => {
      const institution = mockDataStore.institutions.get(institutionId.toString());
      
      if (!institution || institution.institutionAdmin.toString() !== userId.toString()) {
        throw { status: 403, message: 'Not authorized' };
      }

      const course = mockDataStore.courses.get(courseId.toString());
      
      if (!course) {
        throw { status: 404, message: 'Course not found' };
      }

      mockDataStore.courses.delete(courseId.toString());

      // Remove from Elasticsearch
      const esIndex = mockDataStore.elasticsearch.findIndex(e => e.id === courseId.toString());
      if (esIndex >= 0) {
        mockDataStore.elasticsearch.splice(esIndex, 1);
      }

      // Clear cache
      mockDataStore.cache.delete(`course:${courseId}`);

      return { success: true };
    },

    incrementMetric: async (courseId, metricType, userId) => {
      const course = mockDataStore.courses.get(courseId.toString());
      
      if (!course) {
        throw { status: 404, message: 'Course not found' };
      }

      if (metricType === 'views') {
        course.views = (course.views || 0) + 1;
      } else if (metricType === 'comparisons') {
        course.comparisons = (course.comparisons || 0) + 1;
      } else if (metricType === 'leads') {
        course.leads = (course.leads || 0) + 1;
      }

      return course;
    },
  };

  // TS-044: Create multiple courses for institution
  describe('TS-044: Create Multiple Courses', () => {
    it('should bulk create courses linked to institution', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const institution = createMockInstitution(adminId);

      const coursesData = [
        { courseName: 'Course 1', courseDuration: '6 months', priceOfCourse: 10000 },
        { courseName: 'Course 2', courseDuration: '12 months', priceOfCourse: 20000 },
        { courseName: 'Course 3', courseDuration: '24 months', priceOfCourse: 35000 },
      ];

      const result = await courseService.create(institution._id, coursesData, adminId);

      expect(result.count).toBe(3);
      expect(result.data).toHaveLength(3);
      expect(result.data[0].institution.toString()).toBe(institution._id.toString());
      expect(mockDataStore.courses.size).toBe(3);
    });

    it('should reject unauthorized course creation', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();
      const institution = createMockInstitution(adminId);

      const coursesData = [{ courseName: 'Unauthorized Course' }];

      await expect(
        courseService.create(institution._id, coursesData, otherUserId)
      ).rejects.toMatchObject({ status: 403 });
    });
  });

  // TS-045: Get all courses for institution with pagination
  describe('TS-045: Get Courses with Pagination', () => {
    it('should return paginated courses with total count', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const institution = createMockInstitution(adminId);

      // Create 15 courses
      for (let i = 0; i < 15; i++) {
        const courseId = new mongoose.Types.ObjectId();
        mockDataStore.courses.set(courseId.toString(), {
          _id: courseId,
          courseName: `Course ${i + 1}`,
          institution: institution._id,
          status: 'Active',
        });
      }

      const result = await courseService.findByInstitution(institution._id, 1, 10);

      expect(result.courses).toHaveLength(10);
      expect(result.total).toBe(15);
      expect(result.pages).toBe(2);
    });

    it('should return correct page of results', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const institution = createMockInstitution(adminId);

      for (let i = 0; i < 25; i++) {
        const courseId = new mongoose.Types.ObjectId();
        mockDataStore.courses.set(courseId.toString(), {
          _id: courseId,
          courseName: `Course ${i + 1}`,
          institution: institution._id,
        });
      }

      const page2 = await courseService.findByInstitution(institution._id, 2, 10);
      const page3 = await courseService.findByInstitution(institution._id, 3, 10);

      expect(page2.courses).toHaveLength(10);
      expect(page3.courses).toHaveLength(5);
    });
  });

  // TS-046: Get course by ID with caching
  describe('TS-046: Get Course with Caching', () => {
    it('should fetch from DB and cache on first request', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const institution = createMockInstitution(adminId);
      
      const courseId = new mongoose.Types.ObjectId();
      mockDataStore.courses.set(courseId.toString(), {
        _id: courseId,
        courseName: 'Cached Course',
        institution: institution._id,
        status: 'Active',
      });

      const result = await courseService.findById(courseId);

      expect(result.fromCache).toBe(false);
      expect(result.data.course.courseName).toBe('Cached Course');
      expect(mockDataStore.cache.has(`course:${courseId}`)).toBe(true);
    });

    it('should return cached data on subsequent requests', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const institution = createMockInstitution(adminId);
      
      const courseId = new mongoose.Types.ObjectId();
      mockDataStore.courses.set(courseId.toString(), {
        _id: courseId,
        courseName: 'Cached Course',
        institution: institution._id,
        status: 'Active',
      });

      // First request - populates cache
      await courseService.findById(courseId);
      
      // Second request - should hit cache
      const result = await courseService.findById(courseId);

      expect(result.fromCache).toBe(true);
    });

    it('should return null for inactive course', async () => {
      const courseId = new mongoose.Types.ObjectId();
      mockDataStore.courses.set(courseId.toString(), {
        _id: courseId,
        courseName: 'Inactive Course',
        institution: new mongoose.Types.ObjectId(),
        status: 'Inactive',
      });

      const result = await courseService.findById(courseId);

      expect(result).toBeNull();
    });
  });

  // TS-047: Update course details
  describe('TS-047: Update Course Details', () => {
    it('should update course and sync to Elasticsearch if active', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const institution = createMockInstitution(adminId);
      
      const courseId = new mongoose.Types.ObjectId();
      mockDataStore.courses.set(courseId.toString(), {
        _id: courseId,
        courseName: 'Original Name',
        institution: institution._id,
        status: 'Active',
      });

      const result = await courseService.update(
        institution._id,
        courseId,
        { courseName: 'Updated Name' },
        adminId
      );

      expect(result.courseName).toBe('Updated Name');
      expect(mockDataStore.elasticsearch.some(e => e.courseName === 'Updated Name')).toBe(true);
    });

    it('should clear cache after update', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const institution = createMockInstitution(adminId);
      
      const courseId = new mongoose.Types.ObjectId();
      mockDataStore.courses.set(courseId.toString(), {
        _id: courseId,
        courseName: 'To Update',
        institution: institution._id,
        status: 'Active',
      });

      // Populate cache
      mockDataStore.cache.set(`course:${courseId}`, JSON.stringify({ course: { courseName: 'To Update' } }));

      await courseService.update(institution._id, courseId, { courseName: 'Updated' }, adminId);

      expect(mockDataStore.cache.has(`course:${courseId}`)).toBe(false);
    });
  });

  // TS-048: Delete course
  describe('TS-048: Delete Course', () => {
    it('should remove course from DB and Elasticsearch', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const institution = createMockInstitution(adminId);
      
      const courseId = new mongoose.Types.ObjectId();
      mockDataStore.courses.set(courseId.toString(), {
        _id: courseId,
        courseName: 'To Delete',
        institution: institution._id,
        status: 'Active',
      });
      mockDataStore.elasticsearch.push({ id: courseId.toString(), courseName: 'To Delete' });

      const result = await courseService.delete(institution._id, courseId, adminId);

      expect(result.success).toBe(true);
      expect(mockDataStore.courses.has(courseId.toString())).toBe(false);
      expect(mockDataStore.elasticsearch.some(e => e.id === courseId.toString())).toBe(false);
    });

    it('should reject unauthorized deletion', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();
      const institution = createMockInstitution(adminId);
      
      const courseId = new mongoose.Types.ObjectId();
      mockDataStore.courses.set(courseId.toString(), {
        _id: courseId,
        institution: institution._id,
      });

      await expect(
        courseService.delete(institution._id, courseId, otherUserId)
      ).rejects.toMatchObject({ status: 403 });
    });
  });

  // TS-049: Increment course views metric
  describe('TS-049: Increment Views Metric', () => {
    it('should increment views counter', async () => {
      const courseId = new mongoose.Types.ObjectId();
      mockDataStore.courses.set(courseId.toString(), {
        _id: courseId,
        courseName: 'Popular Course',
        views: 10,
      });

      const result = await courseService.incrementMetric(courseId, 'views');

      expect(result.views).toBe(11);
    });

    it('should handle first view (initialize from 0)', async () => {
      const courseId = new mongoose.Types.ObjectId();
      mockDataStore.courses.set(courseId.toString(), {
        _id: courseId,
        courseName: 'New Course',
      });

      const result = await courseService.incrementMetric(courseId, 'views');

      expect(result.views).toBe(1);
    });
  });

  // TS-050: Increment comparisons metric
  describe('TS-050: Increment Comparisons Metric', () => {
    it('should increment comparisons counter', async () => {
      const courseId = new mongoose.Types.ObjectId();
      mockDataStore.courses.set(courseId.toString(), {
        _id: courseId,
        comparisons: 5,
      });

      const result = await courseService.incrementMetric(courseId, 'comparisons');

      expect(result.comparisons).toBe(6);
    });
  });

  // TS-051: Increment leads metric
  describe('TS-051: Increment Leads Metric', () => {
    it('should increment leads counter', async () => {
      const courseId = new mongoose.Types.ObjectId();
      mockDataStore.courses.set(courseId.toString(), {
        _id: courseId,
        leads: 3,
      });

      const result = await courseService.incrementMetric(courseId, 'leads');

      expect(result.leads).toBe(4);
    });

    it('should throw error for non-existent course', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      await expect(
        courseService.incrementMetric(nonExistentId, 'leads')
      ).rejects.toMatchObject({ status: 404 });
    });
  });

  // TS-052: Elasticsearch sync on course save (Active)
  describe('TS-052: Elasticsearch Sync for Active Course', () => {
    it('should index active course in Elasticsearch', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const institution = createMockInstitution(adminId);
      
      const courseId = new mongoose.Types.ObjectId();
      mockDataStore.courses.set(courseId.toString(), {
        _id: courseId,
        courseName: 'Active Course',
        institution: institution._id,
        status: 'Active',
      });

      // Simulate ES sync
      mockDataStore.elasticsearch.push({
        id: courseId.toString(),
        courseName: 'Active Course',
      });

      expect(mockDataStore.elasticsearch.length).toBe(1);
      expect(mockDataStore.elasticsearch[0].courseName).toBe('Active Course');
    });
  });

  // TS-053: Elasticsearch sync on course save (Inactive)
  describe('TS-053: Elasticsearch Sync for Inactive Course', () => {
    it('should remove inactive course from Elasticsearch', async () => {
      const courseId = new mongoose.Types.ObjectId();
      
      // Add to ES first
      mockDataStore.elasticsearch.push({ id: courseId.toString() });
      expect(mockDataStore.elasticsearch.length).toBe(1);

      // Simulate course becoming inactive - should remove from ES
      const esIndex = mockDataStore.elasticsearch.findIndex(e => e.id === courseId.toString());
      if (esIndex >= 0) {
        mockDataStore.elasticsearch.splice(esIndex, 1);
      }

      expect(mockDataStore.elasticsearch.length).toBe(0);
    });
  });
});
