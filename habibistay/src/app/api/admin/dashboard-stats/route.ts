import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole, BookingStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Get user ID and role from the request headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as UserRole;
    
    // Check if user is authenticated and has admin role
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' }, 
        { status: 401 }
      );
    }
    
    if (userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' }, 
        { status: 403 }
      );
    }
    
    // Get total users count
    const totalUsers = await prisma.user.count();
    
    // Get total properties count
    const totalProperties = await prisma.property.count();
    
    // Get total bookings count
    const totalBookings = await prisma.booking.count();
    
    // Get pending bookings count
    const pendingBookings = await prisma.booking.count({
      where: {
        status: BookingStatus.PENDING
      }
    });
    
    // Get upcoming bookings count (confirmed bookings with future check-in date)
    const today = new Date();
    const upcomingBookings = await prisma.booking.count({
      where: {
        status: BookingStatus.CONFIRMED,
        checkInDate: {
          gte: today
        }
      }
    });
    
    // Get total revenue (sum of completed booking payments)
    const paymentsAggregate = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED'
      },
      _sum: {
        amount: true
      }
    });
    
    const totalRevenue = paymentsAggregate._sum.amount || 0;
    
    return NextResponse.json({
      totalUsers,
      totalProperties,
      totalBookings,
      pendingBookings,
      upcomingBookings,
      totalRevenue: Number(totalRevenue)
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching dashboard statistics' },
      { status: 500 }
    );
  }
}
