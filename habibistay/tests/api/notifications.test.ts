import { NextRequest } from 'next/server';
import { GET, POST } from '@habibistay/app/api/notifications/route';
import { GET as GET_BY_ID, PATCH, DELETE } from '@habibistay/app/api/notifications/[id]/route';
import { prisma } from '@habibistay/lib/prisma';
import { UserRole, NotificationType } from '@prisma/client';

// Mock the Prisma client
jest.mock('@habibistay/lib/prisma', () => ({
  prisma: {
    notification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Notification API', () => {
  let mockRequest: NextRequest;
  const mockUserId = 'test-user-123';
  const mockNotificationId = 'notification-123';
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup basic mock request with auth headers
    mockRequest = {
      headers: new Headers({
        'x-user-id': mockUserId,
        'x-user-role': UserRole.GUEST,
      }),
      json: jest.fn().mockResolvedValue({
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.BOOKING,
      }),
      nextUrl: {
        searchParams: new URLSearchParams(),
      },
    } as unknown as NextRequest;
  });
  
  describe('GET /api/notifications', () => {
    it('should return user notifications', async () => {
      // Mock the Prisma response
      const mockNotifications = [
        {
          id: mockNotificationId,
          userId: mockUserId,
          title: 'Test Notification',
          message: 'This is a test notification',
          type: NotificationType.BOOKING,
          isRead: false,
          data: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);
      (prisma.notification.count as jest.Mock).mockResolvedValue(1);
      
      // Call the API
      const response = await GET(mockRequest);
      const data = await response.json();
      
      // Assert the response
      expect(response.status).toBe(200);
      expect(data.notifications).toHaveLength(1);
      expect(data.notifications[0]).toMatchObject({
        id: mockNotificationId,
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.BOOKING,
        isRead: false,
      });
      expect(data.pagination).toMatchObject({
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });
      
      // Verify Prisma was called with the correct parameters
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: mockUserId,
          },
        })
      );
    });
    
    it('should filter notifications by type', async () => {
      // Update mock request with search params
      mockRequest.nextUrl.searchParams = new URLSearchParams({
        type: NotificationType.BOOKING,
      });
      
      const mockNotifications = [
        {
          id: mockNotificationId,
          userId: mockUserId,
          title: 'Booking Notification',
          message: 'Your booking has been confirmed',
          type: NotificationType.BOOKING,
          isRead: false,
          data: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);
      (prisma.notification.count as jest.Mock).mockResolvedValue(1);
      
      const response = await GET(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.notifications).toHaveLength(1);
      expect(data.notifications[0].type).toBe(NotificationType.BOOKING);
      
      // Verify filter was applied
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: NotificationType.BOOKING,
          }),
        })
      );
    });
    
    it('should return 401 if not authenticated', async () => {
      // Create unauthenticated request
      const unauthenticatedRequest = {
        ...mockRequest,
        headers: new Headers({}),
      } as unknown as NextRequest;
      
      const response = await GET(unauthenticatedRequest);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
      expect(prisma.notification.findMany).not.toHaveBeenCalled();
    });
    
    it('should handle pagination', async () => {
      // Update mock request with pagination params
      mockRequest.nextUrl.searchParams = new URLSearchParams({
        page: '2',
        pageSize: '5',
      });
      
      // Mock notifications for page 2
      const mockNotifications = Array(5).fill(null).map((_, i) => ({
        id: `notification-${i + 6}`, // Items 6-10 (page 2)
        userId: mockUserId,
        title: `Notification ${i + 6}`,
        message: `This is notification ${i + 6}`,
        type: NotificationType.BOOKING,
        isRead: false,
        data: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);
      (prisma.notification.count as jest.Mock).mockResolvedValue(15); // 15 total notifications
      
      const response = await GET(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.notifications).toHaveLength(5);
      expect(data.pagination).toMatchObject({
        total: 15,
        page: 2,
        pageSize: 5,
        totalPages: 3, // 15 ÷ 5 = 3 pages
      });
      
      // Verify pagination was applied
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // Skip first page
          take: 5, // Take 5 items
        })
      );
    });
  });
  
  describe('POST /api/notifications', () => {
    it('should create a notification', async () => {
      // Mock the Prisma response
      const mockCreatedNotification = {
        id: mockNotificationId,
        userId: mockUserId,
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.BOOKING,
        isRead: false,
        data: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.notification.create as jest.Mock).mockResolvedValue(mockCreatedNotification);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: mockUserId }); // User exists
      
      // Call the API
      const response = await POST(mockRequest);
      const data = await response.json();
      
      // Assert the response
      expect(response.status).toBe(201);
      expect(data).toMatchObject({
        id: mockNotificationId,
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.BOOKING,
        isRead: false,
      });
      
      // Verify Prisma was called with the correct data
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          title: 'Test Notification',
          message: 'This is a test notification',
          type: NotificationType.BOOKING,
          isRead: false,
        },
      });
    });
    
    it('should return 400 for missing required fields', async () => {
      // Create request with missing fields
      const invalidRequest = {
        ...mockRequest,
        json: jest.fn().mockResolvedValue({
          // Missing title and message
          type: NotificationType.BOOKING,
        }),
      } as unknown as NextRequest;
      
      const response = await POST(invalidRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
    
    it('should return 404 if user does not exist', async () => {
      // Mock user not found
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toContain('User not found');
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
    
    it('should handle database errors gracefully', async () => {
      // Mock database error
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: mockUserId });
      (prisma.notification.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toContain('unexpected error');
    });
  });
  
  describe('GET /api/notifications/[id]', () => {
    it('should return a notification by ID', async () => {
      // Mock the Prisma response
      const mockNotification = {
        id: mockNotificationId,
        userId: mockUserId,
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.BOOKING,
        isRead: false,
        data: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotification);
      
      // Mock the request context with params
      const { params } = { params: { id: mockNotificationId } };
      
      // Call the API
      const response = await GET_BY_ID(mockRequest, { params });
      const data = await response.json();
      
      // Assert the response
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        id: mockNotificationId,
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.BOOKING,
        isRead: false,
      });
      
      // Verify Prisma was called with the correct parameters
      expect(prisma.notification.findUnique).toHaveBeenCalledWith({
        where: {
          id: mockNotificationId,
        },
      });
    });
    
    it('should return 404 if notification is not found', async () => {
      // Mock notification not found
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Mock the request context with params
      const { params } = { params: { id: 'nonexistent-id' } };
      
      const response = await GET_BY_ID(mockRequest, { params });
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
    
    it('should return 403 if user tries to access another user\'s notification', async () => {
      // Mock notification belonging to another user
      const mockNotification = {
        id: mockNotificationId,
        userId: 'another-user-id', // Different from the authenticated user
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.BOOKING,
        isRead: false,
        data: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotification);
      
      // Mock the request context with params
      const { params } = { params: { id: mockNotificationId } };
      
      const response = await GET_BY_ID(mockRequest, { params });
      const data = await response.json();
      
      expect(response.status).toBe(403);
      expect(data.error).toContain('not authorized');
    });
  });
  
  describe('PATCH /api/notifications/[id]', () => {
    it('should mark a notification as read', async () => {
      // Mock the existing notification
      const mockNotification = {
        id: mockNotificationId,
        userId: mockUserId,
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.BOOKING,
        isRead: false,
        data: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Mock the updated notification
      const mockUpdatedNotification = {
        ...mockNotification,
        isRead: true,
        updatedAt: new Date(),
      };
      
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotification);
      (prisma.notification.update as jest.Mock).mockResolvedValue(mockUpdatedNotification);
      
      // Setup the request with update data
      const patchRequest = {
        ...mockRequest,
        json: jest.fn().mockResolvedValue({
          isRead: true,
        }),
      } as unknown as NextRequest;
      
      // Mock the request context with params
      const { params } = { params: { id: mockNotificationId } };
      
      // Call the API
      const response = await PATCH(patchRequest, { params });
      const data = await response.json();
      
      // Assert the response
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        id: mockNotificationId,
        isRead: true,
      });
      
      // Verify Prisma was called with the correct data
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: {
          id: mockNotificationId,
        },
        data: {
          isRead: true,
        },
      });
    });
    
    it('should return 404 if notification is not found', async () => {
      // Mock notification not found
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Mock the request context with params
      const { params } = { params: { id: 'nonexistent-id' } };
      
      const response = await PATCH(mockRequest, { params });
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });
    
    it('should return 403 if user tries to update another user\'s notification', async () => {
      // Mock notification belonging to another user
      const mockNotification = {
        id: mockNotificationId,
        userId: 'another-user-id', // Different from the authenticated user
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.BOOKING,
        isRead: false,
        data: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotification);
      
      // Mock the request context with params
      const { params } = { params: { id: mockNotificationId } };
      
      const response = await PATCH(mockRequest, { params });
      const data = await response.json();
      
      expect(response.status).toBe(403);
      expect(data.error).toContain('not authorized');
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });
  });
  
  describe('DELETE /api/notifications/[id]', () => {
    it('should delete a notification', async () => {
      // Mock the existing notification
      const mockNotification = {
        id: mockNotificationId,
        userId: mockUserId,
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.BOOKING,
        isRead: false,
        data: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotification);
      (prisma.notification.delete as jest.Mock).mockResolvedValue(mockNotification);
      
      // Mock the request context with params
      const { params } = { params: { id: mockNotificationId } };
      
      // Call the API
      const response = await DELETE(mockRequest, { params });
      
      // Assert the response
      expect(response.status).toBe(204); // No content
      
      // Verify Prisma was called with the correct parameters
      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: {
          id: mockNotificationId,
        },
      });
    });
    
    it('should return 404 if notification is not found', async () => {
      // Mock notification not found
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Mock the request context with params
      const { params } = { params: { id: 'nonexistent-id' } };
      
      const response = await DELETE(mockRequest, { params });
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
      expect(prisma.notification.delete).not.toHaveBeenCalled();
    });
    
    it('should return 403 if user tries to delete another user\'s notification', async () => {
      // Mock notification belonging to another user
      const mockNotification = {
        id: mockNotificationId,
        userId: 'another-user-id', // Different from the authenticated user
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.BOOKING,
        isRead: false,
        data: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue(mockNotification);
      
      // Mock the request context with params
      const { params } = { params: { id: mockNotificationId } };
      
      const response = await DELETE(mockRequest, { params });
      const data = await response.json();
      
      expect(response.status).toBe(403);
      expect(data.error).toContain('not authorized');
      expect(prisma.notification.delete).not.toHaveBeenCalled();
    });
  });
});
