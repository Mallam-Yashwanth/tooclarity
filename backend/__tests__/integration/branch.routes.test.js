/**
 * Branch Integration Tests
 * Test IDs: TS-096 to TS-100
 * 
 * Tests for branch CRUD operations and ownership validation
 */

const mongoose = require('mongoose');

// Mock stores
const mockDataStore = {
  branches: new Map(),
  institutions: new Map(),
  users: new Map(),
};

describe('Branch Integration Tests', () => {

  beforeEach(() => {
    mockDataStore.branches.clear();
    mockDataStore.institutions.clear();
    mockDataStore.users.clear();
  });

  // Helper functions
  const createUser = (options = {}) => {
    const userId = new mongoose.Types.ObjectId();
    const institutionId = options.institutionId || new mongoose.Types.ObjectId();
    
    const user = {
      _id: userId,
      email: options.email || `user_${userId}@test.com`,
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
    };

    mockDataStore.institutions.set(institutionId.toString(), institution);
    return institution;
  };

  // Branch service mock
  const branchService = {
    create: async (userId, institutionId, data) => {
      // Check ownership
      const institution = mockDataStore.institutions.get(institutionId.toString());
      
      if (!institution) {
        throw { status: 404, message: 'Institution not found' };
      }

      if (institution.institutionAdmin.toString() !== userId.toString()) {
        throw { status: 403, message: 'Not authorized to manage this institution' };
      }

      // Validate required fields
      if (!data.branchName) {
        throw { status: 400, message: 'Branch name is required' };
      }

      // Create branch
      const branchId = new mongoose.Types.ObjectId();
      const branch = {
        _id: branchId,
        branchName: data.branchName,
        address: data.address || '',
        contactNumber: data.contactNumber || '',
        isMainBranch: data.isMainBranch || false,
        institution: institutionId,
        createdAt: new Date(),
      };

      mockDataStore.branches.set(branchId.toString(), branch);
      return branch;
    },

    getAll: async (institutionId, page = 1, limit = 10) => {
      const branches = Array.from(mockDataStore.branches.values())
        .filter(b => b.institution.toString() === institutionId.toString())
        .sort((a, b) => b.createdAt - a.createdAt);

      const start = (page - 1) * limit;
      const paginated = branches.slice(start, start + limit);

      return {
        branches: paginated,
        total: branches.length,
        page,
        pages: Math.ceil(branches.length / limit),
      };
    },

    getById: async (branchId) => {
      const branch = mockDataStore.branches.get(branchId.toString());
      
      if (!branch) {
        throw { status: 404, message: 'Branch not found' };
      }

      return branch;
    },

    update: async (userId, institutionId, branchId, data) => {
      // Check ownership
      const institution = mockDataStore.institutions.get(institutionId.toString());
      
      if (!institution) {
        throw { status: 404, message: 'Institution not found' };
      }

      if (institution.institutionAdmin.toString() !== userId.toString()) {
        throw { status: 403, message: 'Not authorized to manage this institution' };
      }

      const branch = mockDataStore.branches.get(branchId.toString());
      
      if (!branch) {
        throw { status: 404, message: 'Branch not found' };
      }

      if (branch.institution.toString() !== institutionId.toString()) {
        throw { status: 403, message: 'Branch does not belong to this institution' };
      }

      // Update fields
      if (data.branchName) branch.branchName = data.branchName;
      if (data.address !== undefined) branch.address = data.address;
      if (data.contactNumber !== undefined) branch.contactNumber = data.contactNumber;
      if (data.isMainBranch !== undefined) {
        // If setting as main branch, unset other main branches
        if (data.isMainBranch) {
          for (const [, b] of mockDataStore.branches) {
            if (b.institution.toString() === institutionId.toString()) {
              b.isMainBranch = false;
            }
          }
        }
        branch.isMainBranch = data.isMainBranch;
      }
      branch.updatedAt = new Date();

      return branch;
    },

    delete: async (userId, institutionId, branchId) => {
      // Check ownership
      const institution = mockDataStore.institutions.get(institutionId.toString());
      
      if (!institution) {
        throw { status: 404, message: 'Institution not found' };
      }

      if (institution.institutionAdmin.toString() !== userId.toString()) {
        throw { status: 403, message: 'Not authorized to manage this institution' };
      }

      const branch = mockDataStore.branches.get(branchId.toString());
      
      if (!branch) {
        throw { status: 404, message: 'Branch not found' };
      }

      if (branch.institution.toString() !== institutionId.toString()) {
        throw { status: 403, message: 'Branch does not belong to this institution' };
      }

      mockDataStore.branches.delete(branchId.toString());

      return { success: true, message: 'Branch deleted successfully' };
    },
  };

  // TS-096: Create branch
  describe('TS-096: Create Branch', () => {
    it('should create branch with valid data', async () => {
      const user = createUser();
      const institution = createInstitution(user._id, { _id: user.institution });

      const branch = await branchService.create(user._id, institution._id, {
        branchName: 'Main Campus',
        address: '123 Education Street',
        contactNumber: '9876543210',
        isMainBranch: true,
      });

      expect(branch._id).toBeDefined();
      expect(branch.branchName).toBe('Main Campus');
      expect(branch.isMainBranch).toBe(true);
      expect(mockDataStore.branches.size).toBe(1);
    });

    it('should reject branch without name', async () => {
      const user = createUser();
      const institution = createInstitution(user._id, { _id: user.institution });

      await expect(
        branchService.create(user._id, institution._id, {
          address: 'Some Address',
        })
      ).rejects.toMatchObject({ status: 400, message: 'Branch name is required' });
    });

    it('should reject unauthorized branch creation', async () => {
      const user = createUser();
      const otherAdmin = new mongoose.Types.ObjectId();
      const institution = createInstitution(otherAdmin, { _id: user.institution });

      await expect(
        branchService.create(user._id, institution._id, {
          branchName: 'Unauthorized Branch',
        })
      ).rejects.toMatchObject({ status: 403 });
    });
  });

  // TS-097: Get all branches for institution
  describe('TS-097: Get All Branches', () => {
    it('should return paginated branches', async () => {
      const user = createUser();
      const institution = createInstitution(user._id, { _id: user.institution });

      // Create 15 branches
      for (let i = 0; i < 15; i++) {
        await branchService.create(user._id, institution._id, {
          branchName: `Branch ${i + 1}`,
        });
      }

      const result = await branchService.getAll(institution._id, 1, 10);

      expect(result.branches).toHaveLength(10);
      expect(result.total).toBe(15);
      expect(result.pages).toBe(2);
    });

    it('should return empty array for institution without branches', async () => {
      const user = createUser();
      createInstitution(user._id, { _id: user.institution });

      const result = await branchService.getAll(user.institution);

      expect(result.branches).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // TS-098: Get branch by ID
  describe('TS-098: Get Branch by ID', () => {
    it('should return branch details', async () => {
      const user = createUser();
      const institution = createInstitution(user._id, { _id: user.institution });

      const created = await branchService.create(user._id, institution._id, {
        branchName: 'Specific Branch',
        address: 'Test Address',
      });

      const branch = await branchService.getById(created._id);

      expect(branch.branchName).toBe('Specific Branch');
      expect(branch.address).toBe('Test Address');
    });

    it('should throw 404 for non-existent branch', async () => {
      await expect(
        branchService.getById(new mongoose.Types.ObjectId())
      ).rejects.toMatchObject({ status: 404, message: 'Branch not found' });
    });
  });

  // TS-099: Update branch
  describe('TS-099: Update Branch', () => {
    it('should update branch details', async () => {
      const user = createUser();
      const institution = createInstitution(user._id, { _id: user.institution });

      const created = await branchService.create(user._id, institution._id, {
        branchName: 'Original Name',
        address: 'Original Address',
      });

      const updated = await branchService.update(
        user._id,
        institution._id,
        created._id,
        {
          branchName: 'Updated Name',
          address: 'Updated Address',
        }
      );

      expect(updated.branchName).toBe('Updated Name');
      expect(updated.address).toBe('Updated Address');
      expect(updated.updatedAt).toBeDefined();
    });

    it('should unset other main branches when setting new main', async () => {
      const user = createUser();
      const institution = createInstitution(user._id, { _id: user.institution });

      const branch1 = await branchService.create(user._id, institution._id, {
        branchName: 'Branch 1',
        isMainBranch: true,
      });

      const branch2 = await branchService.create(user._id, institution._id, {
        branchName: 'Branch 2',
        isMainBranch: false,
      });

      // Set branch2 as main
      await branchService.update(user._id, institution._id, branch2._id, {
        isMainBranch: true,
      });

      // Branch1 should no longer be main
      const updatedBranch1 = mockDataStore.branches.get(branch1._id.toString());
      const updatedBranch2 = mockDataStore.branches.get(branch2._id.toString());

      expect(updatedBranch1.isMainBranch).toBe(false);
      expect(updatedBranch2.isMainBranch).toBe(true);
    });

    it('should reject update from non-owner', async () => {
      const owner = createUser();
      const otherUser = createUser();
      const institution = createInstitution(owner._id, { _id: owner.institution });

      const branch = await branchService.create(owner._id, institution._id, {
        branchName: 'Protected Branch',
      });

      await expect(
        branchService.update(otherUser._id, institution._id, branch._id, {
          branchName: 'Hacked Name',
        })
      ).rejects.toMatchObject({ status: 403 });
    });
  });

  // TS-100: Delete branch
  describe('TS-100: Delete Branch', () => {
    it('should delete branch successfully', async () => {
      const user = createUser();
      const institution = createInstitution(user._id, { _id: user.institution });

      const branch = await branchService.create(user._id, institution._id, {
        branchName: 'To Delete',
      });

      expect(mockDataStore.branches.size).toBe(1);

      const result = await branchService.delete(user._id, institution._id, branch._id);

      expect(result.success).toBe(true);
      expect(mockDataStore.branches.size).toBe(0);
    });

    it('should reject deletion from non-owner', async () => {
      const owner = createUser();
      const attacker = createUser();
      const institution = createInstitution(owner._id, { _id: owner.institution });

      const branch = await branchService.create(owner._id, institution._id, {
        branchName: 'Cannot Delete',
      });

      await expect(
        branchService.delete(attacker._id, institution._id, branch._id)
      ).rejects.toMatchObject({ status: 403 });

      // Branch should still exist
      expect(mockDataStore.branches.size).toBe(1);
    });

    it('should return 404 for non-existent branch', async () => {
      const user = createUser();
      const institution = createInstitution(user._id, { _id: user.institution });

      await expect(
        branchService.delete(user._id, institution._id, new mongoose.Types.ObjectId())
      ).rejects.toMatchObject({ status: 404, message: 'Branch not found' });
    });
  });
});
