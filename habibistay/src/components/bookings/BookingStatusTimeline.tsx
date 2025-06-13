'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { BookingStatus } from '@prisma/client';
// Temporarily comment out for build to pass
// import { 
//   FaRegClock, 
//   FaRegCheckCircle, 
//   FaRegTimesCircle,
//   FaRegCalendarCheck,
//   FaRegStar
// } from 'react-icons/fa';

// Placeholder icons for build
const IconMap: Record<string, string> = {
  FaRegClock: '🕒',
  FaRegCheckCircle: '✓',
  FaRegTimesCircle: '✗',
  FaRegCalendarCheck: '📅',
  FaRegStar: '⭐'
};

interface TimelineEvent {
  status: string;
  date: Date;
  iconName: string; // Changed from React.ElementType to string for build
  color: string;
  label: string;
  description: string;
  completed: boolean;
  current: boolean;
}

interface BookingStatusTimelineProps {
  booking: any; // Use specific booking type from your application
}

const BookingStatusTimeline = ({ booking }: BookingStatusTimelineProps) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  
  useEffect(() => {
    if (!booking) return;
    
    // Create timeline events based on booking
    const timelineEvents: TimelineEvent[] = [];
    const now = new Date();
    
    // Created event (always present)
    timelineEvents.push({
      status: 'created',
      date: new Date(booking.createdAt),
      iconName: 'FaRegClock',
      color: 'bg-blue-500',
      label: 'Booking Requested',
      description: `Booking created on ${format(new Date(booking.createdAt), 'MMMM d, yyyy')}`,
      completed: true,
      current: false
    });
    
    // Add status events based on booking status
    if (booking.status === BookingStatus.CONFIRMED || 
        booking.status === BookingStatus.COMPLETED) {
      // Find when the booking was confirmed
      const confirmedDate = booking.updatedAt 
        ? new Date(booking.updatedAt) 
        : new Date(booking.createdAt);
      
      timelineEvents.push({
        status: 'confirmed',
        date: confirmedDate,
        iconName: 'FaRegCheckCircle',
        color: 'bg-green-500',
        label: 'Booking Confirmed',
        description: `Your booking was confirmed on ${format(confirmedDate, 'MMMM d, yyyy')}`,
        completed: true,
        current: booking.status === BookingStatus.CONFIRMED
      });
    }
    
    if (booking.status === BookingStatus.CANCELLED) {
      // Add cancellation event
      const cancelledDate = booking.updatedAt 
        ? new Date(booking.updatedAt) 
        : new Date();
      
      timelineEvents.push({
        status: 'cancelled',
        date: cancelledDate,
        iconName: 'FaRegTimesCircle',
        color: 'bg-red-500',
        label: 'Booking Cancelled',
        description: `Booking was cancelled on ${format(cancelledDate, 'MMMM d, yyyy')}`,
        completed: true,
        current: true
      });
    } else if (booking.status === BookingStatus.REJECTED) {
      // Add rejection event
      const rejectedDate = booking.updatedAt 
        ? new Date(booking.updatedAt) 
        : new Date();
      
      timelineEvents.push({
        status: 'rejected',
        date: rejectedDate,
        iconName: 'FaRegTimesCircle',
        color: 'bg-red-500',
        label: 'Booking Rejected',
        description: `Booking was rejected by the host on ${format(rejectedDate, 'MMMM d, yyyy')}`,
        completed: true,
        current: true
      });
    } else {
      // Add check-in event for non-cancelled bookings
      const checkInDate = new Date(booking.checkInDate);
      const isCheckInCompleted = now > checkInDate;
      
      timelineEvents.push({
        status: 'check-in',
        date: checkInDate,
        iconName: 'FaRegCalendarCheck',
        color: 'bg-purple-500',
        label: 'Check-in',
        description: `Check-in on ${format(checkInDate, 'MMMM d, yyyy')}`,
        completed: isCheckInCompleted,
        current: now >= checkInDate && now < new Date(booking.checkOutDate) && booking.status !== BookingStatus.COMPLETED
      });
      
      // Add check-out event
      const checkOutDate = new Date(booking.checkOutDate);
      const isCheckOutCompleted = now > checkOutDate;
      
      timelineEvents.push({
        status: 'check-out',
        date: checkOutDate,
        iconName: 'FaRegCalendarCheck',
        color: 'bg-yellow-500',
        label: 'Check-out',
        description: `Check-out on ${format(checkOutDate, 'MMMM d, yyyy')}`,
        completed: isCheckOutCompleted,
        current: isCheckOutCompleted && booking.status !== BookingStatus.COMPLETED
      });
      
      // Add completed event if booking is completed
      if (booking.status === BookingStatus.COMPLETED) {
        const completedDate = booking.updatedAt 
          ? new Date(booking.updatedAt) 
          : new Date(checkOutDate);
        
        timelineEvents.push({
          status: 'completed',
          date: completedDate,
          iconName: 'FaRegStar',
          color: 'bg-blue-500',
          label: 'Stay Completed',
          description: `Your stay was completed on ${format(completedDate, 'MMMM d, yyyy')}`,
          completed: true,
          current: true
        });
      }
    }
    
    // Sort events by date
    timelineEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    setEvents(timelineEvents);
  }, [booking]);
  
  if (!booking || events.length === 0) return null;
  
  return (
    <div className="bg-white rounded-lg shadow px-6 py-4">
      <h3 className="text-lg font-semibold mb-4">Booking Timeline</h3>
      <div className="relative">
        {events.map((event, index) => (
          <div key={index} className="flex mb-6 last:mb-0">
            {/* Timeline line */}
            {index < events.length - 1 && (
              <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-gray-200 h-full"></div>
            )}
            
            {/* Event icon */}
            <div className={`relative flex-shrink-0 z-10 w-8 h-8 rounded-full ${event.color} flex items-center justify-center text-white`}>
              {IconMap[event.iconName] || '•'}
            </div>
            
            {/* Event content */}
            <div className="ml-4">
              <div className="flex items-center">
                <h4 className={`font-medium ${event.current ? 'text-gray-900' : 'text-gray-700'}`}>{event.label}</h4>
                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  {format(event.date, 'MMM d, yyyy')}
                </span>
              </div>
              <p className={`text-sm mt-1 ${event.current ? 'text-gray-600' : 'text-gray-500'}`}>
                {event.description}
              </p>
              {event.status === 'check-in' && event.completed && !event.current && (
                <p className="text-sm text-green-600 mt-1">Checked in</p>
              )}
              {event.status === 'check-out' && event.completed && !event.current && (
                <p className="text-sm text-green-600 mt-1">Checked out</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingStatusTimeline;
