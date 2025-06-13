'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { format } from 'date-fns';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MainLayout from '../../components/layout/MainLayout';
import { NotificationType } from '@prisma/client';

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [filter, setFilter] = useState<string>('all');
  
  const { 
    notifications, 
    isLoading, 
    pagination,
    getNotifications, 
    markAsRead,
    markAllAsRead,
    deleteNotification 
  } = useNotifications();

  // Check if user is authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login' as any);
    }
  }, [status, router]);

  // Fetch notifications
  useEffect(() => {
    if (status === 'authenticated') {
      loadNotifications();
    }
  }, [status, filter]);

  // Load notifications with filter
  const loadNotifications = async (page = 1) => {
    const options: any = { 
      page, 
      limit: 20,
    };
    
    if (filter === 'unread') {
      options.unreadOnly = true;
    }
    
    await getNotifications(options);
  };

  // Handle notification click
  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'BOOKING_UPDATE':
        return <span className="text-blue-500"><i className="fa-solid fa-calendar-check"></i></span>;
      case 'PAYMENT_UPDATE':
        return <span className="text-green-500"><i className="fa-solid fa-money-bill"></i></span>;
      case 'BOOKING_REMINDER':
        return <span className="text-yellow-500"><i className="fa-solid fa-bell"></i></span>;
      case 'MESSAGE':
        return <span className="text-purple-500"><i className="fa-solid fa-envelope"></i></span>;
      case 'REVIEW':
        return <span className="text-orange-500"><i className="fa-solid fa-star"></i></span>;
      case 'SYSTEM':
        return <span className="text-gray-500"><i className="fa-solid fa-cog"></i></span>;
      default:
        return <span className="text-gray-500"><i className="fa-solid fa-bell"></i></span>;
    }
  };

  // Get route based on notification data
  const getNotificationRoute = (notification: any) => {
    try {
      const data = notification.data && typeof notification.data === 'string' 
        ? JSON.parse(notification.data) 
        : notification.data;

      switch (notification.type) {
        case 'BOOKING_UPDATE':
          return `/bookings?bookingId=${data?.bookingId}`;
        case 'PAYMENT_UPDATE':
          return `/bookings?bookingId=${data?.bookingId}`;
        case 'BOOKING_REMINDER':
          return `/bookings?bookingId=${data?.bookingId}`;
        case 'MESSAGE':
          return `/messages`;
        case 'REVIEW':
          return `/properties/${data?.propertyId}`;
        default:
          return '#';
      }
    } catch (e) {
      return '#';
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    loadNotifications(page);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Notifications</h1>
            <div className="flex items-center space-x-4">
              <div className="border rounded-md overflow-hidden">
                <button
                  className={`px-4 py-2 text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button
                  className={`px-4 py-2 text-sm ${filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                  onClick={() => setFilter('unread')}
                >
                  Unread
                </button>
              </div>
              <button
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-lg shadow">
              <div className="text-5xl text-gray-300 mb-4">
                <i className="fa-solid fa-bell-slash"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
              <p className="text-gray-500">
                {filter === 'unread' 
                  ? 'You have no unread notifications'
                  : 'You do not have any notifications yet'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl mr-4">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-grow min-w-0">
                        <Link
                          href={getNotificationRoute(notification) as any}
                          className="block"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatDate(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {notification.message}
                          </p>
                        </Link>
                      </div>
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="ml-4 text-gray-400 hover:text-gray-600"
                        aria-label="Delete notification"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {pagination.page} of {pagination.pages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`px-3 py-1 rounded text-sm ${
                        pagination.page === 1
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className={`px-3 py-1 rounded text-sm ${
                        pagination.page === pagination.pages
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
