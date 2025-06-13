'use client';

import type { AnalyticsSummary } from '../../hooks/useHostAnalytics';

// Placeholder icon components since we're having issues with react-icons
const IconComponent = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <span className={`inline-block ${className || ''}`} style={{ width: '1em', height: '1em' }}>{children}</span>
);

const FaCalendarCheck = ({ className }: { className?: string }) => <IconComponent className={className}>📅</IconComponent>;
const FaChartLine = ({ className }: { className?: string }) => <IconComponent className={className}>📈</IconComponent>;
const FaDollarSign = ({ className }: { className?: string }) => <IconComponent className={className}>💲</IconComponent>;
const FaBan = ({ className }: { className?: string }) => <IconComponent className={className}>🚫</IconComponent>;
const FaPercentage = ({ className }: { className?: string }) => <IconComponent className={className}>%</IconComponent>;
const FaMoneyBillWave = ({ className }: { className?: string }) => <IconComponent className={className}>💵</IconComponent>;

interface AnalyticsSummaryCardsProps {
  summary: AnalyticsSummary;
}

export default function AnalyticsSummaryCards({ summary }: AnalyticsSummaryCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm uppercase text-gray-500 font-medium">Total Bookings</p>
            <p className="mt-2 text-3xl font-semibold">{summary.totalBookings}</p>
          </div>
          <span className="bg-blue-100 p-3 rounded-full">
            <FaCalendarCheck className="h-6 w-6 text-blue-600" />
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          {summary.confirmedBookings} confirmed ({Math.round((summary.confirmedBookings / Math.max(1, summary.totalBookings)) * 100)}%)
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm uppercase text-gray-500 font-medium">Total Revenue</p>
            <p className="mt-2 text-3xl font-semibold">{formatCurrency(summary.totalRevenue)}</p>
          </div>
          <span className="bg-green-100 p-3 rounded-full">
            <FaDollarSign className="h-6 w-6 text-green-600" />
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Avg. ${Math.round(summary.averageBookingValue)} per booking
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm uppercase text-gray-500 font-medium">Avg. Booking Value</p>
            <p className="mt-2 text-3xl font-semibold">{formatCurrency(summary.averageBookingValue)}</p>
          </div>
          <span className="bg-purple-100 p-3 rounded-full">
            <FaMoneyBillWave className="h-6 w-6 text-purple-600" />
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Per confirmed booking
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm uppercase text-gray-500 font-medium">Occupancy Rate</p>
            <p className="mt-2 text-3xl font-semibold">{Math.round(summary.occupancyRate)}%</p>
          </div>
          <span className="bg-indigo-100 p-3 rounded-full">
            <FaPercentage className="h-6 w-6 text-indigo-600" />
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Average across all properties
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm uppercase text-gray-500 font-medium">Confirmed Bookings</p>
            <p className="mt-2 text-3xl font-semibold">{summary.confirmedBookings}</p>
          </div>
          <span className="bg-teal-100 p-3 rounded-full">
            <FaChartLine className="h-6 w-6 text-teal-600" />
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          CONFIRMED or COMPLETED status
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm uppercase text-gray-500 font-medium">Cancelled Bookings</p>
            <p className="mt-2 text-3xl font-semibold">{summary.cancelledBookings}</p>
          </div>
          <span className="bg-red-100 p-3 rounded-full">
            <FaBan className="h-6 w-6 text-red-600" />
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          {summary.totalBookings > 0 
            ? `${Math.round((summary.cancelledBookings / summary.totalBookings) * 100)}% cancellation rate` 
            : 'No bookings yet'}
        </p>
      </div>
    </div>
  );
}
