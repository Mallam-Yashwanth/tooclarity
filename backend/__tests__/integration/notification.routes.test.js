/**
 * Notification Integration Tests
 * Test IDs: TS-092 to TS-095
 * 
 * Tests for notification CRUD and Socket.IO integration
 */

const mongoose = require('mongoose');

// Mock stores
const mockDataStore = {
  notifications: new Map(),
};

// Mock Socket.IO
const mockSocketIO = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
};

describe('Notification Integration Tests', () => {

  beforeEach(() => {
    mockDataStore.notifications.clear();
    jest.clearAllMocks();
  });

  // Mock notification service
  const notificationService = {
    create: async ({ title, description, category, recipientType, recipientId, io }) => {
      const notificationId = new mongoose.Types.ObjectId();
      
      // Normalize metadata
      const metadata = {
        type: category?.toUpperCase() === 'USER' ? 'WELCOME' : category,
        route: '/notifications',
      };

      if (metadata.type === 'CALLBACK_REQUEST') {
        metadata.route = '/dashboard/leads';
      }

      const notification = {
        _id: notificationId,
        title,
        description,
        category,
        recipientType,
        [recipientType.toLowerCase()]: recipientId,
        metadata,
        read: false,
        createdAt: new Date(),
      };

      mockDataStore.notifications.set(notificationId.toString(), notification);

      // Emit socket event
      if (io) {
        const room = `${recipientType.toLowerCase()}:${recipientId}`;
        io.to(room).emit('notificationCreated', { notification });
      }

      return notification;
    },

    list: async ({ filter, page = 1, limit = 20, cursor }) => {
      let notifications = Array.from(mockDataStore.notifications.values());

      // Apply filters
      if (filter.recipientType) {
        notifications = notifications.filter(n => n.recipientType === filter.recipientType);
      }

      if (filter.unread !== undefined) {
        notifications = notifications.filter(n => n.read === !filter.unread);
      }

      if (filter.category) {
        notifications = notifications.filter(n => n.category === filter.category);
      }

      // Sort by createdAt desc
      notifications.sort((a, b) => b.createdAt - a.createdAt);

      // Pagination
      const limitedNotifications = notifications.slice(0, limit);
      
      const nextCursor = limitedNotifications.length === limit
        ? `${limitedNotifications[limitedNotifications.length - 1].createdAt.toISOString()}_${limitedNotifications[limitedNotifications.length - 1]._id}`
        : null;

      return {
        items: limitedNotifications,
        nextCursor,
        limit,
      };
    },

    markRead: async (ids, io) => {
      let updatedCount = 0;

      ids.forEach(id => {
        const notification = mockDataStore.notifications.get(id.toString());
        if (notification && !notification.read) {
          notification.read = true;
          notification.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          updatedCount++;

          // Emit socket event
          if (io) {
            io.emit('notificationUpdated', { notificationId: id, read: true });
          }
        }
      });

      return { updated: updatedCount };
    },

    remove: async (ids, io) => {
      let removedCount = 0;

      ids.forEach(id => {
        if (mockDataStore.notifications.has(id.toString())) {
          mockDataStore.notifications.delete(id.toString());
          removedCount++;

          // Emit socket event
          if (io) {
            io.emit('notificationRemoved', { notificationId: id });
          }
        }
      });

      return { removed: removedCount };
    },
  };

  // TS-092: Create notification
  describe('TS-092: Create Notification', () => {
    it('should create notification and emit socket event', async () => {
      const institutionId = new mongoose.Types.ObjectId();

      const notification = await notificationService.create({
        title: 'New Enquiry Received',
        description: 'A student has requested a callback',
        category: 'CALLBACK_REQUEST',
        recipientType: 'INSTITUTION',
        recipientId: institutionId,
        io: mockSocketIO,
      });

      expect(notification._id).toBeDefined();
      expect(notification.title).toBe('New Enquiry Received');
      expect(notification.read).toBe(false);
      expect(mockDataStore.notifications.size).toBe(1);

      expect(mockSocketIO.to).toHaveBeenCalledWith(`institution:${institutionId}`);
      expect(mockSocketIO.emit).toHaveBeenCalledWith('notificationCreated', {
        notification: expect.any(Object),
      });
    });

    it('should normalize metadata with correct route', async () => {
      const studentId = new mongoose.Types.ObjectId();

      const notification = await notificationService.create({
        title: 'Welcome!',
        description: 'Welcome to TooClarity',
        category: 'USER',
        recipientType: 'STUDENT',
        recipientId: studentId,
      });

      expect(notification.metadata.type).toBe('WELCOME');
      expect(notification.metadata.route).toBe('/notifications');
    });

    it('should set leads route for callback notifications', async () => {
      const adminId = new mongoose.Types.ObjectId();

      const notification = await notificationService.create({
        title: 'Callback Request',
        description: 'New callback request',
        category: 'CALLBACK_REQUEST',
        recipientType: 'ADMIN',
        recipientId: adminId,
      });

      expect(notification.metadata.route).toBe('/dashboard/leads');
    });
  });

  // TS-093: List notifications with cursor pagination
  describe('TS-093: List Notifications with Cursor Pagination', () => {
    beforeEach(async () => {
      // Create 25 notifications
      for (let i = 0; i < 25; i++) {
        const id = new mongoose.Types.ObjectId();
        mockDataStore.notifications.set(id.toString(), {
          _id: id,
          title: `Notification ${i + 1}`,
          recipientType: 'INSTITUTION',
          category: i % 2 === 0 ? 'system' : 'user',
          read: i % 3 === 0,
          createdAt: new Date(Date.now() - i * 60000), // Staggered by 1 minute
        });
      }
    });

    it('should return paginated notifications with correct cursor', async () => {
      const result = await notificationService.list({
        filter: {},
        limit: 10,
      });

      expect(result.items).toHaveLength(10);
      expect(result.nextCursor).toBeDefined();
      expect(result.limit).toBe(10);
    });

    it('should filter by unread status', async () => {
      const result = await notificationService.list({
        filter: { unread: true },
        limit: 50,
      });

      // All returned should be unread (read: false)
      expect(result.items.every(n => n.read === false)).toBe(true);
    });

    it('should filter by category', async () => {
      const result = await notificationService.list({
        filter: { category: 'system' },
        limit: 50,
      });

      expect(result.items.every(n => n.category === 'system')).toBe(true);
    });

    it('should return null cursor when no more items', async () => {
      const result = await notificationService.list({
        filter: {},
        limit: 50, // More than available
      });

      expect(result.nextCursor).toBeNull();
    });
  });

  // TS-094: Mark notifications as read
  describe('TS-094: Mark Notifications as Read', () => {
    it('should update read status and set 7-day expiry', async () => {
      const id1 = new mongoose.Types.ObjectId();
      const id2 = new mongoose.Types.ObjectId();

      mockDataStore.notifications.set(id1.toString(), {
        _id: id1,
        title: 'Unread 1',
        read: false,
      });
      mockDataStore.notifications.set(id2.toString(), {
        _id: id2,
        title: 'Unread 2',
        read: false,
      });

      const result = await notificationService.markRead([id1, id2], mockSocketIO);

      expect(result.updated).toBe(2);

      const notification1 = mockDataStore.notifications.get(id1.toString());
      expect(notification1.read).toBe(true);
      expect(notification1.expiresAt).toBeDefined();

      // Check socket events
      expect(mockSocketIO.emit).toHaveBeenCalledTimes(2);
      expect(mockSocketIO.emit).toHaveBeenCalledWith('notificationUpdated', {
        notificationId: id1,
        read: true,
      });
    });

    it('should not increment count for already read notifications', async () => {
      const id = new mongoose.Types.ObjectId();

      mockDataStore.notifications.set(id.toString(), {
        _id: id,
        title: 'Already Read',
        read: true, // Already read
      });

      const result = await notificationService.markRead([id]);

      expect(result.updated).toBe(0);
    });

    it('should handle partial updates (some ids invalid)', async () => {
      const validId = new mongoose.Types.ObjectId();
      const invalidId = new mongoose.Types.ObjectId();

      mockDataStore.notifications.set(validId.toString(), {
        _id: validId,
        title: 'Valid',
        read: false,
      });

      const result = await notificationService.markRead([validId, invalidId]);

      expect(result.updated).toBe(1);
    });
  });

  // TS-095: Delete notifications
  describe('TS-095: Delete Notifications', () => {
    it('should remove notifications and emit socket event', async () => {
      const id1 = new mongoose.Types.ObjectId();
      const id2 = new mongoose.Types.ObjectId();

      mockDataStore.notifications.set(id1.toString(), { _id: id1, title: 'To Delete 1' });
      mockDataStore.notifications.set(id2.toString(), { _id: id2, title: 'To Delete 2' });

      expect(mockDataStore.notifications.size).toBe(2);

      const result = await notificationService.remove([id1, id2], mockSocketIO);

      expect(result.removed).toBe(2);
      expect(mockDataStore.notifications.size).toBe(0);
      expect(mockSocketIO.emit).toHaveBeenCalledWith('notificationRemoved', {
        notificationId: id1,
      });
    });

    it('should handle non-existent notification ids gracefully', async () => {
      const validId = new mongoose.Types.ObjectId();
      const invalidId = new mongoose.Types.ObjectId();

      mockDataStore.notifications.set(validId.toString(), { _id: validId });

      const result = await notificationService.remove([validId, invalidId]);

      expect(result.removed).toBe(1);
    });

    it('should return 0 when no valid ids provided', async () => {
      const result = await notificationService.remove([
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
      ]);

      expect(result.removed).toBe(0);
    });
  });
});
