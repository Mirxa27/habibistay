import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

/**
 * PATCH /api/properties/[id]/images/[imageId]/set-primary
 * Set an image as the primary image for a property
 */
export async function PATCH(
  _request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const { id: propertyId, imageId } = params;
    
    // 1. Get the current user session
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to update images' },
        { status: 401 }
      );
    }
    
    // 2. Check if the property exists and user has permission
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { 
        id: true, 
        ownerId: true,
        managers: {
          where: { 
            managerId: session.user.id
          },
          select: { id: true }
        },
        images: {
          where: { id: imageId },
          select: { id: true }
        }
      },
    });
    
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }
    
    // Check if the image exists and belongs to this property
    const imageToSetAsPrimary = property.images[0];
    if (!imageToSetAsPrimary) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the owner, a manager, or an admin
    const isOwner = property.ownerId === session.user.id;
    const isManager = property.managers.length > 0;
    const isAdmin = session.user.role === UserRole.ADMIN;
    
    if (!isOwner && !isManager && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to update images for this property' },
        { status: 403 }
      );
    }
    
    // 3. Start a transaction to update the images
    const [_, updatedImage] = await prisma.$transaction([
      // Set all other images as not primary
      prisma.image.updateMany({
        where: {
          propertyId,
          isPrimary: true,
          id: { not: imageId }
        },
        data: { isPrimary: false }
      }),
      
      // Set the requested image as primary
      prisma.image.update({
        where: { id: imageId },
        data: { isPrimary: true },
        select: {
          id: true,
          url: true,
          secureUrl: true,
          isPrimary: true,
        }
      })
    ]);
    
    return NextResponse.json({ 
      message: 'Primary image updated successfully',
      data: updatedImage
    });
    
  } catch (error) {
    console.error('Error setting primary image:', error);
    return NextResponse.json(
      { error: 'An error occurred while setting the primary image' },
      { status: 500 }
    );
  }
}
