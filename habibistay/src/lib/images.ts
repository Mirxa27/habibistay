import { Image } from '@prisma/client';
import { prisma } from './prisma';

/**
 * Get all images for a property
 */
export async function getPropertyImages(propertyId: string): Promise<Image[]> {
  return prisma.image.findMany({
    where: { propertyId },
    orderBy: { isPrimary: 'desc' },
  });
}

/**
 * Get a single image by ID with property verification
 */
export async function getPropertyImage(
  imageId: string,
  propertyId: string
): Promise<Image | null> {
  return prisma.image.findFirst({
    where: { 
      id: imageId,
      propertyId 
    },
  });
}

/**
 * Delete an image and its associated file
 */
export async function deletePropertyImage(
  imageId: string,
  propertyId: string
): Promise<boolean> {
  // Find the image first to get the publicId for cloudinary
  const image = await prisma.image.findUnique({
    where: { id: imageId },
  });

  if (!image || image.propertyId !== propertyId) {
    return false;
  }

  // Delete from database
  await prisma.image.delete({
    where: { id: imageId },
  });

  return true;
}

/**
 * Set an image as primary for a property
 */
export async function setPrimaryImage(
  imageId: string,
  propertyId: string
): Promise<boolean> {
  // First verify the image belongs to the property
  const image = await prisma.image.findUnique({
    where: { id: imageId },
    select: { propertyId: true }
  });

  if (!image || image.propertyId !== propertyId) {
    return false;
  }

  // Use a transaction to ensure data consistency
  await prisma.$transaction([
    // Set all images for this property to not primary
    prisma.image.updateMany({
      where: { 
        propertyId,
        isPrimary: true
      },
      data: { isPrimary: false }
    }),
    
    // Set the specified image as primary
    prisma.image.update({
      where: { id: imageId },
      data: { isPrimary: true }
    })
  ]);

  return true;
}
