'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
// Placeholder for react-icons
const IconPlaceholder = ({ name, className }: { name: string; className?: string }) => {
  const icons: Record<string, string> = {
    FaSpinner: '⟳',
    FaChartPie: '📊',
    FaCalendarAlt: '📅'
  };
  return <span className={className}>{icons[name] || '•'}</span>;
};
import MainLayout from '../../../components/layout/MainLayout';
// Using local stub components for build
import AnalyticsSummaryCards from '../../../components/host/AnalyticsSummaryCards';
// Placeholder components for build
const BookingStatusChart = ({ bookingStatusData }: { bookingStatusData: any }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-medium mb-4">Booking Status Breakdown</h3>
    <div className="p-4 bg-gray-50 rounded">
      <p className="text-center text-sm text-gray-500">
        {bookingStatusData ? `Chart showing ${Object.keys(bookingStatusData).length} statuses` : '(Booking status chart)'}
      </p>
    </div>
  </div>
);

const RevenueChart = ({ monthlyData }: { monthlyData: any }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-medium mb-4">Monthly Revenue</h3>
    <div className="p-4 bg-gray-50 rounded">
      <p className="text-center text-sm text-gray-500">
        {monthlyData ? `Chart showing ${monthlyData.length} months of data` : '(Revenue chart)'}
      </p>
    </div>
  </div>
);

const PropertyPerformanceTable = ({ properties }: { properties: any[] }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-medium mb-4">Property Performance</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupancy</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {properties && properties.length > 0 ? (
            properties.map((property, index) => (
              <tr key={property.id || index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {property.title || `Property ${index + 1}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {property.bookings || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${property.revenue || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {property.occupancyRate || 0}%
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                (No property performance data available)
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

import useHostAnalytics, { TimeframeOption } from '../../../hooks/useHostAnalytics';
import { format } from 'date-fns';

export default function HostAnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { analyticsData, loading, error, fetchAnalytics } = useHostAnalytics();
  
  const [timeframe, setTimeframe] = useState<TimeframeOption>('last6Months');
  const [propertyId, setPropertyId] = useState<string | undefined>(
    searchParams.get('propertyId') || undefined
  );
  
  // Redirect if not authenticated or not a host
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login' as any);
    } else if (
      status === 'authenticated' && 
      session?.user?.role !== 'HOST' && 
      session?.user?.role !== 'PROPERTY_MANAGER' && 
      session?.user?.role !== 'ADMIN'
    ) {
      router.push('/' as any);
    }
  }, [router, status, session]);
  
  // Fetch analytics data when the component mounts or parameters change
  useEffect(() => {
    if (status === 'authenticated' && 
        (session?.user?.role === 'HOST' || 
         session?.user?.role === 'PROPERTY_MANAGER' || 
         session?.user?.role === 'ADMIN')) {
      fetchAnalytics(timeframe, propertyId);
    }
  }, [status, timeframe, propertyId, session]);
  
  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: TimeframeOption) => {
    setTimeframe(newTimeframe);
  };
  
  // Format date range for display
  const formatDateRange = () => {
    if (!analyticsData) return '';
    
    const startDate = new Date(analyticsData.dateRange.startDate);
    const endDate = new Date(analyticsData.dateRange.endDate);
    
    return `${format(startDate, 'MMMM d, yyyy')} - ${format(endDate, 'MMMM d, yyyy')}`;
  };
  
  // Loading state
  if (status === 'loading' || loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-3xl font-semibold mb-8">Host Analytics</h1>
          <div className="flex items-center justify-center py-12">
            <IconPlaceholder name="FaSpinner" className="animate-spin text-blue-600 text-4xl" />
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // Unauthorized access
  if (status === 'authenticated' && 
      session?.user?.role !== 'HOST' && 
      session?.user?.role !== 'PROPERTY_MANAGER' && 
      session?.user?.role !== 'ADMIN') {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-3xl font-semibold mb-4">Host Analytics</h1>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-yellow-700">
                  You need to be a host to access this page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // Error state
  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-3xl font-semibold mb-4">Host Analytics</h1>
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-red-700">
                  Error loading analytics data: {error}
                </p>
                <button
                  onClick={() => fetchAnalytics(timeframe, propertyId)}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold">Host Analytics</h1>
            <p className="mt-2 text-neutral-500 flex items-center">
              <IconPlaceholder name="FaCalendarAlt" className="mr-2" />
              {formatDateRange()}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <span className="text-sm text-gray-500">Timeframe:</span>
            <div className="inline-flex rounded-md shadow-sm">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                  timeframe === 'thisMonth' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-300`}
                onClick={() => handleTimeframeChange('thisMonth')}
              >
                This Month
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium ${
                  timeframe === 'last3Months' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border-t border-b border-gray-300`}
                onClick={() => handleTimeframeChange('last3Months')}
              >
                3 Months
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium ${
                  timeframe === 'last6Months' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border-t border-b border-gray-300`}
                onClick={() => handleTimeframeChange('last6Months')}
              >
                6 Months
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                  timeframe === 'lastYear' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-300`}
                onClick={() => handleTimeframeChange('lastYear')}
              >
                1 Year
              </button>
            </div>
          </div>
        </div>
        
        {propertyId && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex justify-between items-center">
              <p className="text-blue-700">
                Viewing analytics for a specific property. 
                <span className="font-medium ml-1">
                  {analyticsData?.propertyPerformance.find(p => p.id === propertyId)?.title || 'Property'}
                </span>
              </p>
              <button
                onClick={() => {
                  setPropertyId(undefined);
                  router.push('/host/analytics' as any);
                }}
                className="text-blue-700 hover:text-blue-900 font-medium"
              >
                View All Properties
              </button>
            </div>
          </div>
        )}
        
        {analyticsData ? (
          <>
            {/* Summary Cards */}
            <AnalyticsSummaryCards summary={analyticsData.summary} />
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <RevenueChart monthlyData={analyticsData.monthlyData} />
              <BookingStatusChart bookingStatusData={analyticsData.bookingStatusBreakdown} />
            </div>
            
            {/* Property Performance Table */}
            <div className="mt-6">
              <PropertyPerformanceTable properties={analyticsData.propertyPerformance} />
            </div>
            
            {/* Call-to-action */}
            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-medium mb-2">Want to boost your performance?</h3>
              <p className="text-gray-600 mb-4">
                Improve your property listings, adjust pricing, or get tips on how to attract more guests.
              </p>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
              >
                <IconPlaceholder name="FaChartPie" className="mr-2" />
                Get Optimization Tips
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No analytics data available. Try changing the timeframe.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
