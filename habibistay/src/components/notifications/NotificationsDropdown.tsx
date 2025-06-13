'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { format } from 'date-fns';
import Link from 'next/link';
import { NotificationType } from '@prisma/client';

interface NotificationsDropdownProps {
  className?: string;
}

const NotificationsDropdown = ({ className = '' }: NotificationsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    getNotifications, 
    markAsRead,
    markAllAsRead,
    deleteNotification 
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notifications when dropdown is opened
  useEffect(() => {
    if (isOpen) {
      getNotifications({ limit: 10 });
    }
  }, [isOpen, getNotifications]);

  // Initial fetch for unread count
  useEffect(() => {
    getNotifications({ unreadOnly: true, limit: 5 });
  }, [getNotifications]);

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Handle notification click
  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Close dropdown after clicking
    setIsOpen(false);
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hour${Math.floor(diffInHours) === 1 ? '' : 's'} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
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

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification bell icon with badge */}
      <button
        className="relative p-2 text-gray-700 hover:text-blue-600 focus:outline-none"
        onClick={toggleDropdown}
      >
        <i className="fa-solid fa-bell text-xl"></i>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-md shadow-lg z-50">
          <div className="p-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-gray-50 flex items-start ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-1 mr-3 text-lg w-8 text-center">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <Link
                      href={getNotificationRoute(notification) as any}
                      className="block"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </Link>
                  </div>
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                    aria-label="Delete notification"
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="p-2 border-t border-gray-100 text-center">
            <Link
              href={"/notifications" as any}
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
