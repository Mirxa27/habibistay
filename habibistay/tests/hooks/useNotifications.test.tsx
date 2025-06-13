import { renderHook, act } from '@testing-library/react-hooks';
import { useNotifications } from '@habibistay/hooks/useNotifications';
import { NotificationType } from '@prisma/client';

// Mock fetch globally
global.fetch = jest.fn();

describe('useNotifications', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock fetch default response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ notifications: [], pagination: { total: 0, page: 1, pageSize: 10 } }),
    });
  });
  
  it('should fetch notifications', async () => {
    const mockNotifications = [
      {
        id: 'notification-1',
        title: 'New Booking',
        message: 'You have a new booking request',
        type: NotificationType.BOOKING,
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'notification-2',
        title: 'Payment Received',
        message: 'Payment for booking #123 was received',
        type: NotificationType.PAYMENT,
        isRead: true,
        createdAt: new Date().toISOString(),
      },
    ];
    
    // Mock fetch response for getNotifications
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        notifications: mockNotifications,
        pagination: {
          total: 2,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        },
      }),
    });
    
    // Render the hook
    const { result, waitForNextUpdate } = renderHook(() => useNotifications());
    
    // Initial state
    expect(result.current.notifications).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    
    // Call getNotifications method
    act(() => {
      result.current.getNotifications();
    });
    
    // Loading state
    expect(result.current.loading).toBe(true);
    
    // Wait for async update
    await waitForNextUpdate();
    
    // Verify state after fetch
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.notifications).toEqual(mockNotifications);
    expect(result.current.pagination).toEqual({
      total: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });
    
    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/notifications?page=1&pageSize=10',
      expect.objectContaining({ method: 'GET' })
    );
  });
  
  it('should handle API errors', async () => {
    // Mock fetch error response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    });
    
    // Render the hook
    const { result, waitForNextUpdate } = renderHook(() => useNotifications());
    
    // Call getNotifications method
    act(() => {
      result.current.getNotifications();
    });
    
    // Wait for async update
    await waitForNextUpdate();
    
    // Verify error state
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Failed to fetch notifications: Internal server error');
    expect(result.current.notifications).toEqual([]);
  });
  
  it('should mark a notification as read', async () => {
    // Mock notification
    const notificationId = 'notification-1';
    
    // Setup initial hook state with notifications
    const initialNotifications = [
      {
        id: notificationId,
        title: 'New Booking',
        message: 'You have a new booking request',
        type: NotificationType.BOOKING,
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ];
    
    // Mock fetch for getNotifications
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        notifications: initialNotifications,
        pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
      }),
    });
    
    // Mock fetch for markAsRead
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: notificationId,
        isRead: true,
      }),
    });
    
    // Render the hook
    const { result, waitForNextUpdate } = renderHook(() => useNotifications());
    
    // Call getNotifications to load initial data
    act(() => {
      result.current.getNotifications();
    });
    
    // Wait for async update
    await waitForNextUpdate();
    
    // Verify initial state
    expect(result.current.notifications[0].isRead).toBe(false);
    
    // Call markAsRead method
    act(() => {
      result.current.markAsRead(notificationId);
    });
    
    // Wait for async update
    await waitForNextUpdate();
    
    // Verify notification was marked as read
    expect(result.current.notifications[0].isRead).toBe(true);
    
    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/notifications/${notificationId}`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ isRead: true }),
      })
    );
  });
  
  it('should delete a notification', async () => {
    // Mock notification
    const notificationId = 'notification-1';
    
    // Setup initial hook state with notifications
    const initialNotifications = [
      {
        id: notificationId,
        title: 'New Booking',
        message: 'You have a new booking request',
        type: NotificationType.BOOKING,
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ];
    
    // Mock fetch for getNotifications
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        notifications: initialNotifications,
        pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
      }),
    });
    
    // Mock fetch for deleteNotification
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
    });
    
    // Render the hook
    const { result, waitForNextUpdate } = renderHook(() => useNotifications());
    
    // Call getNotifications to load initial data
    act(() => {
      result.current.getNotifications();
    });
    
    // Wait for async update
    await waitForNextUpdate();
    
    // Verify initial state
    expect(result.current.notifications).toHaveLength(1);
    
    // Call deleteNotification method
    act(() => {
      result.current.deleteNotification(notificationId);
    });
    
    // Wait for async update
    await waitForNextUpdate();
    
    // Verify notification was removed
    expect(result.current.notifications).toHaveLength(0);
    
    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/notifications/${notificationId}`,
      expect.objectContaining({ method: 'DELETE' })
    );
  });
  
  it('should filter notifications by type', async () => {
    // Mock notifications of different types
    const mockNotifications = [
      {
        id: 'notification-1',
        title: 'New Booking',
        message: 'You have a new booking request',
        type: NotificationType.BOOKING,
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'notification-2',
        title: 'Payment Received',
        message: 'Payment for booking #123 was received',
        type: NotificationType.PAYMENT,
        isRead: true,
        createdAt: new Date().toISOString(),
      },
    ];
    
    // Mock fetch response for all notifications
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        notifications: mockNotifications,
        pagination: { total: 2, page: 1, pageSize: 10, totalPages: 1 },
      }),
    });
    
    // Mock fetch response for filtered notifications
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        notifications: [mockNotifications[0]], // Only booking notification
        pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
      }),
    });
    
    // Render the hook
    const { result, waitForNextUpdate } = renderHook(() => useNotifications());
    
    // Call getNotifications to load all notifications
    act(() => {
      result.current.getNotifications();
    });
    
    // Wait for async update
    await waitForNextUpdate();
    
    // Verify initial state
    expect(result.current.notifications).toHaveLength(2);
    
    // Call getNotifications with type filter
    act(() => {
      result.current.getNotifications({ type: NotificationType.BOOKING });
    });
    
    // Wait for async update
    await waitForNextUpdate();
    
    // Verify filtered notifications
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].type).toBe(NotificationType.BOOKING);
    
    // Verify fetch was called with correct params
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/notifications?page=1&pageSize=10&type=${NotificationType.BOOKING}`,
      expect.anything()
    );
  });
});
