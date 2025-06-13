import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

interface AvailabilityRequest {
  dates: Array<{
    date: string;           // ISO date string (YYYY-MM-DD)
    isAvailable: boolean;
    price?: number;         // Optional custom price for this date
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = params.id;
    
    // Get user ID and role from the request headers
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as UserRole;

    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' }, 
        { status: 401 }
      );
    }

    // Fetch the property to check ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        managers: {
          select: { managerId: true }
        }
      }
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' }, 
        { status: 404 }
      );
    }

    // Check if user is the property owner, a manager, or an admin
    const isOwner = property.ownerId === userId;
    const isManager = property.managers.some(m => m.managerId === userId);
    const isAdmin = userRole === UserRole.ADMIN;
    
    if (!isOwner && !isManager && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to update this property\'s availability' }, 
        { status: 403 }
      );
    }

    // Parse the request body
    const body: AvailabilityRequest = await request.json();

    // Validate request body
    if (!body.dates || !Array.isArray(body.dates) || body.dates.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: dates array is required and cannot be empty' }, 
        { status: 400 }
      );
    }

    // Process each date entry
    const results = await Promise.all(
      body.dates.map(async (dateEntry) => {
        // Validate date format
        const date = new Date(dateEntry.date);
        if (isNaN(date.getTime())) {
          return {
            date: dateEntry.date,
            status: 'error',
            message: 'Invalid date format',
          };
        }

        // Set time to midnight for consistent handling
        date.setHours(0, 0, 0, 0);

        try {
          // Note: We're using upsert below, so no need to check for existing record separately
          // We'll skip this check to pass the build

          // Check if there are any bookings for this date
          const conflictingBookings = await prisma.booking.findMany({
            where: {
              propertyId,
              status: {
                in: ['PENDING', 'CONFIRMED']
              },
              checkInDate: { lte: date },
              checkOutDate: { gt: date },
            },
          });

          // If we're marking as unavailable and there are bookings, return an error
          if (!dateEntry.isAvailable && conflictingBookings.length > 0) {
            return {
              date: dateEntry.date,
              status: 'error',
              message: 'Cannot mark as unavailable: date has existing bookings',
            };
          }

          // Prepare data for upsert
          const availabilityData = {
            propertyId,
            date,
            isAvailable: dateEntry.isAvailable,
            price: dateEntry.price !== undefined ? dateEntry.price : undefined,
          };

          // Update or create the availability record
          const availability = await prisma.availability.upsert({
            where: {
              propertyId_date: {
                propertyId,
                date,
              },
            },
            update: {
              isAvailable: dateEntry.isAvailable,
              price: dateEntry.price !== undefined ? dateEntry.price : undefined,
            },
            create: availabilityData,
          });

          return {
            date: dateEntry.date,
            status: 'success',
            availability,
          };
        } catch (error) {
          console.error(`Error updating availability for ${dateEntry.date}:`, error);
          return {
            date: dateEntry.date,
            status: 'error',
            message: 'Database error while updating availability',
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error updating property availability:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating property availability' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = params.id;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    // Validate date parameters
    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'Both startDate and endDate parameters are required' }, 
        { status: 400 }
      );
    }
    
    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO date strings (YYYY-MM-DD)' }, 
        { status: 400 }
      );
    }
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' }, 
        { status: 400 }
      );
    }
    
    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, price: true },
    });
    
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' }, 
        { status: 404 }
      );
    }
    
    // Get availability records for the date range
    const availabilityRecords = await prisma.availability.findMany({
      where: {
        propertyId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
    
    // Get bookings for the date range to check conflicts
    const bookings = await prisma.booking.findMany({
      where: {
        propertyId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            checkInDate: { lte: endDate },
            checkOutDate: { gt: startDate },
          },
        ],
      },
      select: {
        id: true,
        checkInDate: true,
        checkOutDate: true,
        status: true,
      },
    });
    
    // Create a map of dates with booking information
    const bookedDatesMap = new Map();
    
    bookings.forEach(booking => {
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      
      // Iterate through each day of the booking
      const currentDate = new Date(checkIn);
      while (currentDate < checkOut) {
        const dateStr = currentDate.toISOString().split('T')[0];
        bookedDatesMap.set(dateStr, booking.id);
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    
    // Create a map of dates with availability information
    const availabilityMap = new Map();
    availabilityRecords.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      availabilityMap.set(dateStr, record);
    });
    
    // Generate the full date range with availability info
    const result = [];
    const currentDate = new Date(startDate);
    
    while (currentDate < endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const availabilityRecord = availabilityMap.get(dateStr);
      const bookingId = bookedDatesMap.get(dateStr);
      
      result.push({
        date: dateStr,
        isAvailable: availabilityRecord ? availabilityRecord.isAvailable : true,
        price: availabilityRecord?.price || property.price,
        isBooked: bookingId ? true : false,
        bookingId: bookingId || null,
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return NextResponse.json({ 
      propertyId,
      startDate: startDateParam,
      endDate: endDateParam,
      basePrice: property.price,
      availability: result,
    });
  } catch (error) {
    console.error('Error fetching property availability:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching property availability' },
      { status: 500 }
    );
  }
}
