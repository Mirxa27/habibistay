'use client';

import type { BookingStatusBreakdown } from '../../hooks/useHostAnalytics';

interface BookingStatusChartProps {
  bookingStatusData: BookingStatusBreakdown;
}

// Simple placeholder component instead of using Chart.js
export default function BookingStatusChart({ bookingStatusData }: BookingStatusChartProps) {
  const formatLabel = (label: string) => 
    label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
  
  const getTotalBookings = () => {
    return Object.values(bookingStatusData).reduce((sum, count) => sum + count, 0);
  };
  
  const getPercentage = (count: number) => {
    const total = getTotalBookings();
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };
  
  const statusColors = {
    PENDING: 'bg-yellow-500',
    CONFIRMED: 'bg-green-500',
    COMPLETED: 'bg-blue-500',
    CANCELLED: 'bg-red-500',
    REJECTED: 'bg-gray-500',
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 h-80">
      <h3 className="text-lg font-medium mb-4">Booking Status Breakdown</h3>
      <div className="space-y-4">
        {Object.entries(bookingStatusData).map(([status, count]) => (
          <div key={status}>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">{formatLabel(status)}</span>
              <span className="text-sm text-gray-600">
                {count} ({getPercentage(count)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${statusColors[status as keyof typeof statusColors]}`} 
                style={{ width: `${getPercentage(count)}%` }}>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-center text-sm text-gray-500">
        Total: {getTotalBookings()} bookings
      </div>
    </div>
  );
}
