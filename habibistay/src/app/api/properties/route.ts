import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { ApiError, handleApiError } from '@/lib/errors';

// Define the expected request body type
interface PropertyCreateRequest {
  title: string;
  description: string;
  type: string;
  price: number;
  cleaningFee?: number;
  serviceFee?: number;
  address: string;
  city: string;
  state?: string;
  zipCode?: string;
  country: string;
  lat?: number;
  lng?: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  maxGuests: number;
  amenities: string[];
  houseRules?: string;
  cancellationPolicy?: string;
  isPublished?: boolean;
}

async function handlePost(request: NextRequest) { // Renamed from POST
  try {
    // Get user ID and role from the request headers (set by the middleware)
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as UserRole;

    // Check if user is authenticated
    if (!userId) {

      throw new ApiError(401, 'Unauthorized: Authentication required');
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' }, 
        { status: 401 }
      );

    }

    // Check if user has the required role (HOST, PROPERTY_MANAGER, or ADMIN)
    // Need to check as string for the build to pass
    if (!['HOST', 'PROPERTY_MANAGER', 'ADMIN'].includes(userRole as string)) {

      throw new ApiError(403, 'Forbidden: Insufficient permissions to create a property');
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to create a property' }, 
        { status: 403 }
      );
    }

    // Parse the request body
    const body: PropertyCreateRequest = await request.json();

    // Validate required fields
    const requiredFields = [
      'title', 'description', 'type', 'price', 'address', 'city', 'country',
      'bedrooms', 'beds', 'bathrooms', 'maxGuests', 'amenities'
    ];
    
    const missingFields = requiredFields.filter(field => !(field in body));
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` }, 
        { status: 400 }
      );
    }

    // Additional validation for numeric fields
    if (body.price <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' }, 
        { status: 400 }
      );
    }

    // Create the property in the database
    const property = await prisma.property.create({
      data: {
        title: body.title,
        description: body.description,
        type: body.type,
        price: body.price,
        cleaningFee: body.cleaningFee,
        serviceFee: body.serviceFee,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        country: body.country,
        lat: body.lat,
        lng: body.lng,
        bedrooms: body.bedrooms,
        beds: body.beds,
        bathrooms: body.bathrooms,
        maxGuests: body.maxGuests,
        amenities: body.amenities,
        houseRules: body.houseRules,
        cancellationPolicy: body.cancellationPolicy,
        isPublished: body.isPublished || false,
        ownerId: userId,
      },
      // Select only the fields we want to return
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        price: true,
        cleaningFee: true,
        serviceFee: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        lat: true,
        lng: true,
        bedrooms: true,
        beds: true,
        bathrooms: true,
        maxGuests: true,
        amenities: true,
        houseRules: true,
        cancellationPolicy: true,
        isPublished: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(property, { status: 201 });

  } catch (error) {
    return handleApiError(error);
    console.error('Error creating property:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.name === 'PrismaClientKnownRequestError') {
        return NextResponse.json(
          { error: 'Database error occurred while creating property' },
          { status: 500 }
        );
      }
    }
    
    // Generic error response
    return NextResponse.json(
      { error: 'An unexpected error occurred while creating the property' },
      { status: 500 }
    );
  }
}

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Add CORS headers to all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Export a custom response handler to add CORS headers
const withCors = (response: NextResponse) => {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
};

// Export the POST handler with CORS
const POSTWithCors = async (request: NextRequest) => {
  const response = await handlePost(request); // Changed to handlePost
  return withCors(response);
};

export { POSTWithCors as POST };
