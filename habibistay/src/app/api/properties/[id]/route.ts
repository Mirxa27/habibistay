import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// Define the expected request body type for updates
interface PropertyUpdateRequest {
  title?: string;
  description?: string;
  type?: string;
  price?: number;
  cleaningFee?: number | null;
  serviceFee?: number | null;
  address?: string;
  city?: string;
  state?: string | null;
  zipCode?: string | null;
  country?: string;
  lat?: number | null;
  lng?: number | null;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  maxGuests?: number;
  amenities?: string[];
  houseRules?: string | null;
  cancellationPolicy?: string | null;
  isPublished?: boolean;
}

// Common error responses
const notFoundResponse = () => 
  NextResponse.json({ error: 'Property not found' }, { status: 404 });

const unauthorizedResponse = () => 
  NextResponse.json(
    { error: 'Unauthorized: Authentication required' }, 
    { status: 401 }
  );

const forbiddenResponse = () =>
  NextResponse.json(
    { error: 'Forbidden: Insufficient permissions' },
    { status: 403 }
  );

// Helper to validate property ownership/access
async function validatePropertyAccess(
  propertyId: string,
  userId: string,
  userRole: UserRole
) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { ownerId: true }
  });

  if (!property) return { property: null, error: notFoundResponse() };
  
  // Allow access if user is admin or the property owner
  if (userRole !== UserRole.ADMIN && property.ownerId !== userId) {
    return { property: null, error: forbiddenResponse() };
  }

  return { property, error: null };
}

// GET /api/properties/[id] - Get property by ID
async function handleGet(
  _request: NextRequest, // Unused but required
  { params }: { params: { id: string } }
) {
  try {
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        images: true,
        reviews: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!property) {
      return notFoundResponse();
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    );
  }
}

// PATCH /api/properties/[id] - Update a property
async function handlePatch(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user ID and role from the request headers
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as UserRole;

    // Check if user is authenticated
    if (!userId) {
      return unauthorizedResponse();
    }

    // Check if user has the required role (HOST, PROPERTY_MANAGER, or ADMIN)
    // Need to check as string for the build to pass
    if (!['HOST', 'PROPERTY_MANAGER', 'ADMIN'].includes(userRole as string)) {
      return forbiddenResponse();
    }

    // Parse the request body
    const updates: PropertyUpdateRequest = await request.json();

    // Validate property access
    const { error } = await validatePropertyAccess(params.id, userId, userRole);
    if (error) return error;

    // Additional validation for numeric fields if provided
    if (updates.price !== undefined && updates.price <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      );
    }

    // Update the property in the database
    const updatedProperty = await prisma.property.update({
      where: { id: params.id },
      data: {
        title: updates.title,
        description: updates.description,
        type: updates.type,
        price: updates.price,
        cleaningFee: updates.cleaningFee,
        serviceFee: updates.serviceFee,
        address: updates.address,
        city: updates.city,
        state: updates.state,
        zipCode: updates.zipCode,
        country: updates.country,
        lat: updates.lat,
        lng: updates.lng,
        bedrooms: updates.bedrooms,
        beds: updates.beds,
        bathrooms: updates.bathrooms,
        maxGuests: updates.maxGuests,
        amenities: updates.amenities,
        houseRules: updates.houseRules,
        cancellationPolicy: updates.cancellationPolicy,
        isPublished: updates.isPublished,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedProperty);
  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    );
  }
}

// DELETE /api/properties/[id] - Delete a property
async function handleDelete(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user ID and role from the request headers
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as UserRole;

    // Check if user is authenticated
    if (!userId) {
      return unauthorizedResponse();
    }

    // Check if user has the required role (HOST, PROPERTY_MANAGER, or ADMIN)
    // Need to check as string for the build to pass
    if (!['HOST', 'PROPERTY_MANAGER', 'ADMIN'].includes(userRole as string)) {
      return forbiddenResponse();
    }

    // Validate property access
    const { error } = await validatePropertyAccess(params.id, userId, userRole);
    if (error) return error;

    // Delete the property
    await prisma.property.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}

// Add CORS headers to all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Helper to add CORS headers to responses
function withCors(response: NextResponse) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  return new NextResponse(response.body, { ...response, headers });
}

// Export the handlers with CORS
export async function GET(
  _request: NextRequest, // Unused but required
  params: { params: { id: string } }
) {
  const response = await handleGet(_request, params);
  return withCors(response);
}

export async function PATCH(
  request: NextRequest, // Used in handlePatch
  params: { params: { id: string } }
) {
  const response = await handlePatch(request, params);
  return withCors(response);
}

export async function DELETE(
  request: NextRequest, // Used in handleDelete
  params: { params: { id: string } }
) {
  const response = await handleDelete(request, params);
  return withCors(response);
}
