'use client';

import type { MonthlyData } from '../../hooks/useHostAnalytics';

interface RevenueChartProps {
  monthlyData: MonthlyData[];
}

// Simple placeholder component instead of using Chart.js
export default function RevenueChart({ monthlyData }: RevenueChartProps) {
  // Sort by month chronologically
  const sortedData = [...monthlyData].sort((a, b) => {
    const dateA = new Date(`1 ${a.month}`);
    const dateB = new Date(`1 ${b.month}`);
    return dateA.getTime() - dateB.getTime();
  });
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  const maxRevenue = Math.max(...sortedData.map(item => item.revenue), 1);
  const maxBookings = Math.max(...sortedData.map(item => item.bookings), 1);
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 h-80">
      <h3 className="text-lg font-medium mb-4">Revenue & Bookings Trend</h3>
      <div className="h-[calc(100%-80px)] overflow-y-auto">
        {sortedData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No data available</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center mb-2">
              <div className="w-4 h-4 bg-blue-500 mr-2"></div>
              <span className="text-sm">Revenue</span>
              <div className="w-4 h-4 bg-green-500 ml-6 mr-2"></div>
              <span className="text-sm">Bookings</span>
            </div>
            {sortedData.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="font-medium text-sm">{item.month}</div>
                <div className="text-sm">Revenue: {formatCurrency(item.revenue)}</div>
                <div className="text-sm mb-1">Bookings: {item.bookings}</div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full" 
                    style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full" 
                    style={{ width: `${(item.bookings / maxBookings) * 100}%` }}>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
