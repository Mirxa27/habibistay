import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import env from '@habibistay/env.mjs';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true, // Use HTTPS
});

// Extend the Cloudinary upload response with our custom fields
export type CloudinaryUploadResult = UploadApiResponse & {
  thumbnail_url?: string;
  path?: string;
};

// Define types for Cloudinary deletion result
export type CloudinaryDeleteResult = {
  result: string;
};

/**
 * Uploads an image to Cloudinary
 * @param file - The file to upload (can be a path, data URL, or Buffer)
 * @param folder - The folder in Cloudinary where the image should be stored
 * @param publicId - Optional public ID for the image
 * @returns Promise with the upload result
 */
export const uploadImage = async (
  file: string | Buffer,
  folder: string = 'habibistay/properties',
  publicId?: string
): Promise<CloudinaryUploadResult> => {
  try {
    const options: {
      folder: string;
      resource_type: 'image' | 'video' | 'raw' | 'auto';
      quality_analysis?: boolean;
      invalidate?: boolean;
      public_id?: string;
      [key: string]: any;
    } = {
      folder,
      resource_type: 'image',
      quality_analysis: true,
      invalidate: true, // Force CDN invalidation
    };

    if (publicId) {
      options.public_id = publicId;
    }

    // Handle both string and Buffer types
    const result = await (typeof file === 'string'
      ? cloudinary.uploader.upload(file, options)
      : cloudinary.uploader.upload_stream(options).end(file));
      
    return { ...result } as CloudinaryUploadResult;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
};

/**
 * Deletes an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Promise with the deletion result
 */
export const deleteImage = async (
  publicId: string
): Promise<CloudinaryDeleteResult> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true, // Force CDN invalidation
    });
    return result as CloudinaryDeleteResult;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw new Error('Failed to delete image');
  }
};

/**
 * Generates a Cloudinary URL with transformations
 * @param publicId - The public ID of the image
 * @param options - Transformation options
 * @returns The transformed image URL
 */
export const getImageUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
    effect?: string;
    gravity?: string;
    radius?: number;
    border?: string;
    background?: string;
    overlay?: string;
    underlay?: string;
    opacity?: number;
    angle?: number;
    fetchFormat?: string;
    dpr?: string | number;
  } = {}
): string => {
  const defaultOptions = {
    quality: 'auto',
    fetch_format: 'auto',
    crop: 'fill',
    ...options,
  };

  return cloudinary.url(publicId, defaultOptions);
};

export default cloudinary;
