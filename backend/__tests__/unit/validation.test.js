/**
 * Validation Unit Tests
 * Test IDs: TS-130 to TS-133
 * 
 * Tests for email, phone, password validation and L3 institution details
 */

describe('Validation Unit Tests', () => {

  // TS-130: Email format validation
  describe('TS-130: Email Format Validation', () => {
    const isValidEmail = (email) => {
      if (!email || typeof email !== 'string') return false;
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email.toLowerCase().trim());
    };

    it('should accept valid email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
      expect(isValidEmail('a@b.co')).toBe(true);
    });

    it('should reject emails without @ symbol', () => {
      expect(isValidEmail('testexample.com')).toBe(false);
    });

    it('should reject emails without domain', () => {
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('test@.')).toBe(false);
    });

    it('should reject emails without TLD', () => {
      expect(isValidEmail('test@example')).toBe(false);
    });

    it('should reject emails with spaces', () => {
      expect(isValidEmail('test @example.com')).toBe(false);
      expect(isValidEmail('test@ example.com')).toBe(false);
      expect(isValidEmail(' test@example.com')).toBe(true); // trimmed
    });

    it('should reject null or undefined', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('should handle case-insensitive validation', () => {
      expect(isValidEmail('TEST@EXAMPLE.COM')).toBe(true);
      expect(isValidEmail('Test@Example.Com')).toBe(true);
    });
  });

  // TS-131: Phone number format validation
  describe('TS-131: Phone Number Format Validation', () => {
    const isValidPhone = (phone) => {
      if (!phone || typeof phone !== 'string') return false;
      
      // Indian phone number format: exactly 10 digits
      const phoneRegex = /^\d{10}$/;
      return phoneRegex.test(phone.trim());
    };

    it('should accept 10-digit phone numbers', () => {
      expect(isValidPhone('9876543210')).toBe(true);
      expect(isValidPhone('1234567890')).toBe(true);
    });

    it('should reject phone numbers with less than 10 digits', () => {
      expect(isValidPhone('123456789')).toBe(false);
      expect(isValidPhone('12345')).toBe(false);
    });

    it('should reject phone numbers with more than 10 digits', () => {
      expect(isValidPhone('12345678901')).toBe(false);
      expect(isValidPhone('123456789012')).toBe(false);
    });

    it('should reject phone numbers with non-numeric characters', () => {
      expect(isValidPhone('98765-43210')).toBe(false);
      expect(isValidPhone('(987) 654-3210')).toBe(false);
      expect(isValidPhone('+919876543210')).toBe(false);
      expect(isValidPhone('98765 43210')).toBe(false);
    });

    it('should reject phone numbers with letters', () => {
      expect(isValidPhone('98765abcde')).toBe(false);
      expect(isValidPhone('callme1234')).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(isValidPhone(null)).toBe(false);
      expect(isValidPhone(undefined)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidPhone('')).toBe(false);
    });

    it('should handle trimmed input', () => {
      expect(isValidPhone(' 9876543210 ')).toBe(true);
    });
  });

  // TS-132: Password strength validation
  describe('TS-132: Password Strength Validation', () => {
    const isValidPassword = (password, options = {}) => {
      const { minLength = 8 } = options;
      
      if (!password || typeof password !== 'string') return false;
      
      return password.length >= minLength;
    };

    const isStrongPassword = (password) => {
      if (!password || typeof password !== 'string') return { valid: false, errors: ['Password is required'] };
      
      const errors = [];
      
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
      }
      
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      
      if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
      }
      
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
      }
      
      return { valid: errors.length === 0, errors };
    };

    it('should accept passwords with 8 or more characters', () => {
      expect(isValidPassword('12345678')).toBe(true);
      expect(isValidPassword('abcdefghij')).toBe(true);
      expect(isValidPassword('P@ssword123!')).toBe(true);
    });

    it('should reject passwords with less than 8 characters', () => {
      expect(isValidPassword('1234567')).toBe(false);
      expect(isValidPassword('short')).toBe(false);
      expect(isValidPassword('a')).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(isValidPassword(null)).toBe(false);
      expect(isValidPassword(undefined)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidPassword('')).toBe(false);
    });

    it('should validate strong password with all requirements', () => {
      const result = isStrongPassword('Test@1234');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should report missing uppercase letter', () => {
      const result = isStrongPassword('test@1234');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should report missing lowercase letter', () => {
      const result = isStrongPassword('TEST@1234');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should report missing number', () => {
      const result = isStrongPassword('Password@');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should report missing special character', () => {
      const result = isStrongPassword('Password123');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should report all missing requirements', () => {
      const result = isStrongPassword('abc');
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });
  });

  // TS-133: L3 institution details validation
  describe('TS-133: L3 Institution Details Validation', () => {
    const validateKindergartenL3 = (data) => {
      const required = ['schoolType', 'ageGroup', 'diaperChanging', 'outdoorPlayArea'];
      const errors = [];
      
      required.forEach(field => {
        if (data[field] === undefined || data[field] === null) {
          errors.push(`${field} is required for Kindergarten`);
        }
      });
      
      const validSchoolTypes = ['Public', 'Private', 'International', 'Montessori', 'Waldorf', 'Reggio Emilia'];
      if (data.schoolType && !validSchoolTypes.includes(data.schoolType)) {
        errors.push('Invalid school type');
      }
      
      return { valid: errors.length === 0, errors };
    };

    const validateSchoolL3 = (data) => {
      const required = ['schoolType', 'educationType', 'hostelFacility', 'playground', 'busService'];
      const errors = [];
      
      required.forEach(field => {
        if (data[field] === undefined || data[field] === null) {
          errors.push(`${field} is required for School`);
        }
      });
      
      return { valid: errors.length === 0, errors };
    };

    const validateCoachingCenterL3 = (data) => {
      const errors = [];
      
      // Coaching centers have optional fields, just validate types
      if (data.placementDrives !== undefined && typeof data.placementDrives !== 'boolean') {
        errors.push('placementDrives must be a boolean');
      }
      
      if (data.mockInterviews !== undefined && typeof data.mockInterviews !== 'boolean') {
        errors.push('mockInterviews must be a boolean');
      }
      
      return { valid: errors.length === 0, errors };
    };

    const validateUgPgL3 = (data) => {
      const required = ['ownershipType', 'collegeCategory'];
      const errors = [];
      
      required.forEach(field => {
        if (!data[field]) {
          errors.push(`${field} is required for UG/PG University`);
        }
      });
      
      const validOwnership = ['Government', 'Private', 'Public-Private Partnership'];
      if (data.ownershipType && !validOwnership.includes(data.ownershipType)) {
        errors.push('Invalid ownership type');
      }
      
      return { valid: errors.length === 0, errors };
    };

    describe('Kindergarten L3 Validation', () => {
      it('should validate complete kindergarten data', () => {
        const data = {
          schoolType: 'Montessori',
          ageGroup: '2-4 years',
          diaperChanging: true,
          outdoorPlayArea: true,
        };
        
        const result = validateKindergartenL3(data);
        expect(result.valid).toBe(true);
      });

      it('should reject missing required fields', () => {
        const data = {
          schoolType: 'Private',
        };
        
        const result = validateKindergartenL3(data);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should reject invalid school type', () => {
        const data = {
          schoolType: 'InvalidType',
          ageGroup: '2-4 years',
          diaperChanging: true,
          outdoorPlayArea: true,
        };
        
        const result = validateKindergartenL3(data);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Invalid school type');
      });
    });

    describe('School L3 Validation', () => {
      it('should validate complete school data', () => {
        const data = {
          schoolType: 'CBSE',
          educationType: 'Co-ed',
          hostelFacility: true,
          playground: true,
          busService: true,
        };
        
        const result = validateSchoolL3(data);
        expect(result.valid).toBe(true);
      });

      it('should reject missing required fields', () => {
        const data = {
          schoolType: 'CBSE',
        };
        
        const result = validateSchoolL3(data);
        expect(result.valid).toBe(false);
      });
    });

    describe('Coaching Center L3 Validation', () => {
      it('should validate coaching center with boolean fields', () => {
        const data = {
          placementDrives: true,
          mockInterviews: false,
        };
        
        const result = validateCoachingCenterL3(data);
        expect(result.valid).toBe(true);
      });

      it('should reject non-boolean values for boolean fields', () => {
        const data = {
          placementDrives: 'yes',
        };
        
        const result = validateCoachingCenterL3(data);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('placementDrives must be a boolean');
      });
    });

    describe('UG/PG University L3 Validation', () => {
      it('should validate complete university data', () => {
        const data = {
          ownershipType: 'Private',
          collegeCategory: 'Engineering',
        };
        
        const result = validateUgPgL3(data);
        expect(result.valid).toBe(true);
      });

      it('should reject invalid ownership type', () => {
        const data = {
          ownershipType: 'Invalid',
          collegeCategory: 'Engineering',
        };
        
        const result = validateUgPgL3(data);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Invalid ownership type');
      });
    });
  });
});
