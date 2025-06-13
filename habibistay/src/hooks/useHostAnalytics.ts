'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export interface AnalyticsSummary {
  totalBookings: number;
  totalRevenue: number;
  confirmedBookings: number;
  cancelledBookings: number;
  averageBookingValue: number;
  occupancyRate: number;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  bookings: number;
}

export interface BookingStatusBreakdown {
  PENDING: number;
  CONFIRMED: number;
  COMPLETED: number;
  CANCELLED: number;
  REJECTED: number;
}

export interface PropertyPerformance {
  id: string;
  title: string;
  bookings: number;
  revenue: number;
  occupancyRate: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  monthlyData: MonthlyData[];
  bookingStatusBreakdown: BookingStatusBreakdown;
  propertyPerformance: PropertyPerformance[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export type TimeframeOption = 'thisMonth' | 'last3Months' | 'last6Months' | 'lastYear';

export default function useHostAnalytics() {
  const { data: session } = useSession();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchAnalytics = async (timeframe: TimeframeOption = 'last6Months', propertyId?: string) => {
    if (!session?.user) {
      setError('You must be logged in to access analytics');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Build query string
      const params = new URLSearchParams();
      params.append('timeframe', timeframe);
      if (propertyId) {
        params.append('propertyId', propertyId);
      }
      
      const response = await fetch(`/api/host/analytics?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const data = await response.json();
      setAnalyticsData(data);
      return data;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load analytics data');
      console.error('Error fetching analytics:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    analyticsData,
    loading,
    error,
    fetchAnalytics,
  };
}
