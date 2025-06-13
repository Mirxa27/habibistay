import { NextRequest, NextResponse } from 'next/server';
import prisma from '@habibistay/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { BookingStatus, PaymentStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: User ID not found in request' }, { status: 401 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeframeParam = searchParams.get('timeframe') || 'last6Months';
    const propertyId = searchParams.get('propertyId');
    
    // Get analytics data
    const analyticsData = await generateAnalytics(userId, timeframeParam, propertyId);
    
    return NextResponse.json(analyticsData, { status: 200 });
  } catch (error) {
    console.error('Error fetching host analytics:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching analytics.' },
      { status: 500 }
    );
  }
}

async function generateAnalytics(userId: string, timeframe: string, propertyId: string | null) {
  // Determine date range based on timeframe
  let startDate: Date, endDate: Date;
  const now = new Date();
  
  switch (timeframe) {
    case 'thisMonth':
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    case 'last3Months':
      startDate = startOfMonth(subMonths(now, 2));
      endDate = endOfMonth(now);
      break;
    case 'last6Months':
      startDate = startOfMonth(subMonths(now, 5));
      endDate = endOfMonth(now);
      break;
    case 'lastYear':
      startDate = startOfMonth(subMonths(now, 11));
      endDate = endOfMonth(now);
      break;
    default:
      startDate = startOfMonth(subMonths(now, 5));
      endDate = endOfMonth(now);
  }
  
  // Base query conditions for properties owned by this host
  const whereConditions: any = {
    userId,
  };
  
  // Add property filter if specified
  if (propertyId) {
    whereConditions.id = propertyId;
  }
  
  // Get host properties
  const properties = await prisma.property.findMany({
    where: whereConditions,
    select: {
      id: true,
      title: true,
    },
  });
  
  const propertyIds = properties.map(property => property.id);
  
  // Query total bookings and revenue
  const bookings = await prisma.booking.findMany({
    where: {
      propertyId: {
        in: propertyIds,
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      payments: true,
      property: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
  
  // Calculate monthly revenue and bookings
  const monthlyData: Record<string, { revenue: number; bookings: number; }> = {};
  
  // Initialize months in the range
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const monthKey = format(currentDate, 'MMM yyyy');
    monthlyData[monthKey] = { revenue: 0, bookings: 0 };
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }
  
  // Fill in the actual data
  bookings.forEach(booking => {
    const monthKey = format(new Date(booking.createdAt), 'MMM yyyy');
    
    // Count all bookings
    monthlyData[monthKey].bookings += 1;
    
    // Only count revenue from completed or confirmed bookings with successful payments
    const successfulPayment = booking.payments.some(payment => 
      payment.status === PaymentStatus.COMPLETED
    );
    
    if ((booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.COMPLETED) 
        && successfulPayment) {
      monthlyData[monthKey].revenue += Number(booking.totalPrice);
    }
  });
  
  // Calculate booking status breakdown
  const bookingStatusCounts = {
    [BookingStatus.PENDING]: 0,
    [BookingStatus.CONFIRMED]: 0,
    [BookingStatus.COMPLETED]: 0,
    [BookingStatus.CANCELLED]: 0,
    [BookingStatus.REJECTED]: 0,
  };
  
  bookings.forEach(booking => {
    bookingStatusCounts[booking.status] += 1;
  });
  
  // Calculate property performance
  const propertyPerformance = propertyIds.map(propId => {
    const propertyBookings = bookings.filter(booking => booking.propertyId === propId);
    const propertyRevenue = propertyBookings
      .filter(booking => 
        (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.COMPLETED) &&
        booking.payments.some(payment => payment.status === PaymentStatus.COMPLETED)
      )
      .reduce((sum, booking) => sum + Number(booking.totalPrice), 0);
      
    const property = properties.find(p => p.id === propId);
    
    return {
      id: propId,
      title: property?.title || 'Unknown Property',
      bookings: propertyBookings.length,
      revenue: propertyRevenue,
      occupancyRate: calculateOccupancyRate(propertyBookings, startDate, endDate),
    };
  }).sort((a, b) => b.revenue - a.revenue); // Sort by revenue, highest first
  
  // Calculate overall stats
  const totalBookings = bookings.length;
  const totalRevenue = bookings
    .filter(booking => 
      (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.COMPLETED) &&
      booking.payments.some(payment => payment.status === PaymentStatus.COMPLETED)
    )
    .reduce((sum, booking) => sum + Number(booking.totalPrice), 0);
  
  const confirmedBookings = bookings.filter(
    booking => booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.COMPLETED
  ).length;
  
  const averageBookingValue = totalBookings > 0 ? totalRevenue / confirmedBookings : 0;
  
  return {
    summary: {
      totalBookings,
      totalRevenue,
      confirmedBookings,
      cancelledBookings: bookingStatusCounts[BookingStatus.CANCELLED],
      averageBookingValue,
      occupancyRate: calculateAverageOccupancyRate(bookings, propertyIds.length, startDate, endDate),
    },
    monthlyData: Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
    })),
    bookingStatusBreakdown: bookingStatusCounts,
    propertyPerformance,
    dateRange: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
  };
}

// Helper function to calculate occupancy rate for a single property
function calculateOccupancyRate(bookings: any[], startDate: Date, endDate: Date): number {
  // This is a simplified calculation - in a real system you'd consider actual day-by-day availability
  const confirmedBookings = bookings.filter(booking => 
    booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.COMPLETED
  );
  
  if (confirmedBookings.length === 0) return 0;
  
  // Calculate total nights booked
  let totalNightsBooked = 0;
  confirmedBookings.forEach(booking => {
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    
    // Get number of nights
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    totalNightsBooked += nights;
  });
  
  // Calculate total available nights in the period
  const totalDaysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Cap at 100% since our simplified calculation might exceed that in some cases
  return Math.min(100, (totalNightsBooked / totalDaysInPeriod) * 100);
}

// Helper function to calculate average occupancy rate across all properties
function calculateAverageOccupancyRate(bookings: any[], propertyCount: number, startDate: Date, endDate: Date): number {
  if (propertyCount === 0) return 0;
  
  const occupancyRate = calculateOccupancyRate(bookings, startDate, endDate);
  return occupancyRate / propertyCount;
}
