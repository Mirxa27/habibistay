import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/properties/featured - Fetch featured properties
 * 
 * Retrieves a list of properties marked as featured for the Sara chatbot
 */
export async function GET(request: NextRequest) {
  try {
    // Get limit query parameter with default of 5
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);
    
    // Fetch featured properties from database
    const featuredProperties = await prisma.property.findMany({
      where: {
        isPublished: true,
        isFeatured: true,
      },
      include: {
        images: {
          where: {
            isPrimary: true
          },
          take: 1,
        },
        reviews: {
          select: {
            rating: true,
          }
        },
      },
      take: limit,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Calculate average rating for each property
    const propertiesWithRatings = featuredProperties.map(property => {
      const totalRatings = property.reviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating = property.reviews.length > 0 ? totalRatings / property.reviews.length : 0;
      
      // Get primary image URL or first image if no primary
      const primaryImageUrl = property.images[0]?.secureUrl || null;

      // Transform the data for the frontend
      return {
        id: property.id,
        name: property.title,
        description: property.description,
        location: `${property.city}, ${property.state || property.country}`,
        price: parseFloat(property.price.toString()),
        image: primaryImageUrl,
        rating: parseFloat(avgRating.toFixed(1)),
        amenities: property.amenities,
        bedrooms: property.bedrooms,
        beds: property.beds,
        bathrooms: property.bathrooms,
        maxGuests: property.maxGuests,
      };
    });

    return NextResponse.json(propertiesWithRatings);
  } catch (error) {
    console.error('Error fetching featured properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured properties' },
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Add CORS headers to all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Export a custom response handler to add CORS headers
function withCors(response: NextResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// Export the GET handler with CORS
const GETWithCors = async (request: NextRequest) => {
  const response = await GET(request);
  return withCors(response);
};

export { GETWithCors as GET };
