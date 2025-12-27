/**
 * Course & Institution Unit Tests
 * Test IDs: TS-031 to TS-033, TS-041 to TS-043
 * 
 * Tests for schema validation, ownership checks, and status enum validation
 */

const mongoose = require('mongoose');

describe('Course & Institution Unit Tests', () => {

  // TS-031: Institution schema validation
  describe('TS-031: Institution Schema Validation', () => {
    const validateInstitutionSchema = (data) => {
      const errors = [];
      
      // Required fields
      if (!data.instituteName || typeof data.instituteName !== 'string') {
        errors.push('Institution name is required');
      }
      
      if (!data.instituteType) {
        errors.push('Institution type is required');
      }
      
      const validTypes = [
        'Kindergarten/childcare center',
        "School's",
        'Intermediate college(K12)',
        'Under Graduation/Post Graduation',
        'Coaching Center',
        'Study Halls',
        "Tution Center's",
        'Study Abroad',
      ];
      
      if (data.instituteType && !validTypes.includes(data.instituteType)) {
        errors.push('Invalid institution type');
      }
      
      return { valid: errors.length === 0, errors };
    };

    it('should validate institution with required fields', () => {
      const data = {
        instituteName: 'Test School',
        instituteType: "School's",
      };
      
      const result = validateInstitutionSchema(data);
      expect(result.valid).toBe(true);
    });

    it('should reject missing instituteName', () => {
      const data = {
        instituteType: "School's",
      };
      
      const result = validateInstitutionSchema(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Institution name is required');
    });

    it('should reject missing instituteType', () => {
      const data = {
        instituteName: 'Test School',
      };
      
      const result = validateInstitutionSchema(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Institution type is required');
    });

    it('should reject invalid instituteType', () => {
      const data = {
        instituteName: 'Test School',
        instituteType: 'Invalid Type',
      };
      
      const result = validateInstitutionSchema(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid institution type');
    });

    it('should accept all valid institution types', () => {
      const validTypes = [
        'Kindergarten/childcare center',
        "School's",
        'Intermediate college(K12)',
        'Under Graduation/Post Graduation',
        'Coaching Center',
        'Study Halls',
        "Tution Center's",
        'Study Abroad',
      ];
      
      validTypes.forEach(type => {
        const result = validateInstitutionSchema({
          instituteName: 'Test',
          instituteType: type,
        });
        expect(result.valid).toBe(true);
      });
    });
  });

  // TS-032: Discriminator schema for Kindergarten
  describe('TS-032: Kindergarten Discriminator Schema', () => {
    const validateKindergartenFields = (data) => {
      const errors = [];
      
      const validSchoolTypes = [
        'Public',
        'Private',
        'International',
        'Montessori',
        'Waldorf',
        'Reggio Emilia',
      ];
      
      if (data.schoolType && !validSchoolTypes.includes(data.schoolType)) {
        errors.push('Invalid school type for kindergarten');
      }
      
      if (data.diaperChanging !== undefined && typeof data.diaperChanging !== 'boolean') {
        errors.push('diaperChanging must be a boolean');
      }
      
      if (data.outdoorPlayArea !== undefined && typeof data.outdoorPlayArea !== 'boolean') {
        errors.push('outdoorPlayArea must be a boolean');
      }
      
      return { valid: errors.length === 0, errors };
    };

    it('should validate Kindergarten with valid school type', () => {
      const data = {
        schoolType: 'Montessori',
        diaperChanging: true,
        outdoorPlayArea: true,
      };
      
      const result = validateKindergartenFields(data);
      expect(result.valid).toBe(true);
    });

    it('should accept all valid kindergarten school types', () => {
      const types = ['Public', 'Private', 'International', 'Montessori', 'Waldorf', 'Reggio Emilia'];
      
      types.forEach(type => {
        const result = validateKindergartenFields({ schoolType: type });
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid school type', () => {
      const data = {
        schoolType: 'InvalidType',
      };
      
      const result = validateKindergartenFields(data);
      expect(result.valid).toBe(false);
    });

    it('should validate boolean fields correctly', () => {
      const validData = { diaperChanging: false, outdoorPlayArea: true };
      const invalidData = { diaperChanging: 'yes' };
      
      expect(validateKindergartenFields(validData).valid).toBe(true);
      expect(validateKindergartenFields(invalidData).valid).toBe(false);
    });
  });

  // TS-033: Discriminator schema for Coaching Center
  describe('TS-033: Coaching Center Discriminator Schema', () => {
    const validateCoachingCenterFields = (data) => {
      const errors = [];
      
      const booleanFields = ['placementDrives', 'mockInterviews', 'resumeBuilding'];
      
      booleanFields.forEach(field => {
        if (data[field] !== undefined && typeof data[field] !== 'boolean') {
          errors.push(`${field} must be a boolean`);
        }
      });
      
      return { valid: errors.length === 0, errors };
    };

    it('should validate Coaching Center with all boolean fields', () => {
      const data = {
        placementDrives: true,
        mockInterviews: true,
        resumeBuilding: false,
      };
      
      const result = validateCoachingCenterFields(data);
      expect(result.valid).toBe(true);
    });

    it('should accept fields not provided', () => {
      const result = validateCoachingCenterFields({});
      expect(result.valid).toBe(true);
    });

    it('should reject non-boolean placementDrives', () => {
      const data = { placementDrives: 'yes' };
      
      const result = validateCoachingCenterFields(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('placementDrives must be a boolean');
    });

    it('should reject non-boolean mockInterviews', () => {
      const data = { mockInterviews: 1 };
      
      const result = validateCoachingCenterFields(data);
      expect(result.valid).toBe(false);
    });
  });

  // TS-041: Course schema validation
  describe('TS-041: Course Schema Validation', () => {
    const validateCourseSchema = (data) => {
      const errors = [];
      
      if (!data.institution) {
        errors.push('Institution is required');
      }
      
      if (data.courseName && data.courseName.length > 150) {
        errors.push('Course name must be at most 150 characters');
      }
      
      if (data.aboutCourse && data.aboutCourse.length > 2000) {
        errors.push('About course must be at most 2000 characters');
      }
      
      if (data.priceOfCourse !== undefined && data.priceOfCourse < 0) {
        errors.push('Price must be a positive number');
      }
      
      const validModes = ['Offline', 'Online', 'Hybrid'];
      if (data.mode && !validModes.includes(data.mode)) {
        errors.push('Invalid course mode');
      }
      
      return { valid: errors.length === 0, errors };
    };

    it('should validate course with required institution', () => {
      const data = {
        institution: new mongoose.Types.ObjectId(),
        courseName: 'Test Course',
      };
      
      const result = validateCourseSchema(data);
      expect(result.valid).toBe(true);
    });

    it('should reject course without institution', () => {
      const data = {
        courseName: 'Test Course',
      };
      
      const result = validateCourseSchema(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Institution is required');
    });

    it('should reject course name exceeding 150 characters', () => {
      const data = {
        institution: new mongoose.Types.ObjectId(),
        courseName: 'a'.repeat(151),
      };
      
      const result = validateCourseSchema(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Course name must be at most 150 characters');
    });

    it('should reject negative price', () => {
      const data = {
        institution: new mongoose.Types.ObjectId(),
        priceOfCourse: -100,
      };
      
      const result = validateCourseSchema(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Price must be a positive number');
    });

    it('should accept valid course modes', () => {
      ['Offline', 'Online', 'Hybrid'].forEach(mode => {
        const result = validateCourseSchema({
          institution: new mongoose.Types.ObjectId(),
          mode,
        });
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid course mode', () => {
      const data = {
        institution: new mongoose.Types.ObjectId(),
        mode: 'InvalidMode',
      };
      
      const result = validateCourseSchema(data);
      expect(result.valid).toBe(false);
    });
  });

  // TS-042: Course status enum validation
  describe('TS-042: Course Status Enum Validation', () => {
    const validateStatus = (status) => {
      const validStatuses = ['Active', 'Inactive'];
      return validStatuses.includes(status);
    };

    it('should accept Active status', () => {
      expect(validateStatus('Active')).toBe(true);
    });

    it('should accept Inactive status', () => {
      expect(validateStatus('Inactive')).toBe(true);
    });

    it('should reject invalid status values', () => {
      expect(validateStatus('active')).toBe(false); // case sensitive
      expect(validateStatus('ACTIVE')).toBe(false);
      expect(validateStatus('Pending')).toBe(false);
      expect(validateStatus('Deleted')).toBe(false);
      expect(validateStatus('')).toBe(false);
      expect(validateStatus(null)).toBe(false);
    });
  });

  // TS-043: Ownership check helper function
  describe('TS-043: Ownership Check Helper Function', () => {
    const mockInstitution = {
      _id: new mongoose.Types.ObjectId(),
      instituteName: 'Test Institution',
      institutionAdmin: new mongoose.Types.ObjectId(),
    };

    const checkOwnership = async (institutionId, userId, findInstitution) => {
      const institution = await findInstitution(institutionId);
      
      if (!institution) {
        return { authorized: false, error: 'No institution found with that ID' };
      }
      
      if (institution.institutionAdmin.toString() !== userId.toString()) {
        return { authorized: false, error: 'You are not authorized to perform this action' };
      }
      
      return { authorized: true, institution };
    };

    it('should return authorized for matching admin', async () => {
      const findInstitution = jest.fn().mockResolvedValue(mockInstitution);
      
      const result = await checkOwnership(
        mockInstitution._id,
        mockInstitution.institutionAdmin,
        findInstitution
      );
      
      expect(result.authorized).toBe(true);
      expect(result.institution).toEqual(mockInstitution);
    });

    it('should return not authorized for different admin', async () => {
      const findInstitution = jest.fn().mockResolvedValue(mockInstitution);
      const differentUserId = new mongoose.Types.ObjectId();
      
      const result = await checkOwnership(
        mockInstitution._id,
        differentUserId,
        findInstitution
      );
      
      expect(result.authorized).toBe(false);
      expect(result.error).toBe('You are not authorized to perform this action');
    });

    it('should return error when institution not found', async () => {
      const findInstitution = jest.fn().mockResolvedValue(null);
      
      const result = await checkOwnership(
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        findInstitution
      );
      
      expect(result.authorized).toBe(false);
      expect(result.error).toBe('No institution found with that ID');
    });

    it('should handle ObjectId comparison correctly', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const institution = {
        ...mockInstitution,
        institutionAdmin: adminId,
      };
      
      const findInstitution = jest.fn().mockResolvedValue(institution);
      
      // Using the same ObjectId
      const result = await checkOwnership(institution._id, adminId, findInstitution);
      expect(result.authorized).toBe(true);
      
      // Using string representation of ObjectId
      const resultFromString = await checkOwnership(
        institution._id,
        new mongoose.Types.ObjectId(adminId.toString()),
        findInstitution
      );
      expect(resultFromString.authorized).toBe(true);
    });
  });
});
