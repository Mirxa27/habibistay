import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { NotificationType } from '@prisma/client';

// Types for notification data
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export function useNotifications() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });

  // Parse the data field of notifications if it's a string
  const parseNotificationData = (notification: any): Notification => {
    if (notification.data && typeof notification.data === 'string') {
      try {
        return {
          ...notification,
          data: JSON.parse(notification.data)
        };
      } catch (e) {
        // If parsing fails, just return the original
        return notification;
      }
    }
    return notification;
  };

  // Get all notifications for the current user
  const getNotifications = useCallback(async (
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
    } = {}
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.unreadOnly) params.append('unreadOnly', 'true');
      
      const response = await fetch(`/api/notifications?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch notifications');
      }
      
      const data: NotificationsResponse = await response.json();
      
      // Parse notification data JSON strings
      const parsedNotifications = data.notifications.map(parseNotificationData);
      
      setNotifications(parsedNotifications);
      setPagination(data.pagination);
      
      // Update unread count
      setUnreadCount(parsedNotifications.filter(n => !n.isRead).length);
      
      return parsedNotifications;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notifications';
      setError(errorMessage);
      console.error('Error fetching notifications:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get unread count
  const getUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?unreadOnly=true&limit=1');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch unread count');
      }
      
      const data: NotificationsResponse = await response.json();
      setUnreadCount(data.pagination.total);
      return data.pagination.total;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }, []);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark notification as read');
      }
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark notification as read';
      setError(errorMessage);
      console.error('Error marking notification as read:', error);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Get all unread notifications
      const unreadNotifications = await getNotifications({ unreadOnly: true, limit: 100 });
      
      // Mark each as read
      const promises = unreadNotifications.map(notification => 
        fetch(`/api/notifications/${notification.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isRead: true }),
        })
      );
      
      await Promise.all(promises);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, isRead: true }))
      );
      
      // Update unread count
      setUnreadCount(0);
      
      toast.success('All notifications marked as read');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark all notifications as read';
      setError(errorMessage);
      console.error('Error marking all notifications as read:', error);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getNotifications]);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete notification');
      }
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      
      toast.success('Notification deleted');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete notification';
      setError(errorMessage);
      console.error('Error deleting notification:', error);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [notifications]);

  return {
    isLoading,
    error,
    notifications,
    unreadCount,
    pagination,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
