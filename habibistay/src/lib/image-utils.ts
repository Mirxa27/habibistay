/**
 * Image utilities for generating optimized image URLs with Cloudinary
 * 
 * This module provides helper functions for generating optimized image URLs
 * with various transformations using Cloudinary's URL-based API.
 * 
 * @see https://cloudinary.com/documentation/image_transformation_reference
 */

// Base URL for Cloudinary transformations
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo'}/image/upload`;

// Type definitions for image transformations
type ImageTransformations = {
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Crop mode: 'fill', 'fit', 'scale', 'crop', or 'thumb' */
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb';
  /** Gravity for cropping: 'auto', 'face', 'faces', or 'center' */
  gravity?: 'auto' | 'face' | 'faces' | 'center';
  /** Image quality */
  quality?: number | 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | 'auto:low';
  /** Output format */
  format?: 'auto' | 'webp' | 'jpg' | 'jpeg' | 'png' | 'gif' | 'avif';
  /** Visual effects */
  effect?: {
    name: 'blur' | 'grayscale' | 'sharpen' | 'sepia';
    value?: number;
  };
  /** Border radius in pixels or 'max' for maximum */
  radius?: number | 'max';
  /** Background color (e.g., 'white', 'rgb:ff0000') */
  background?: string;
  /** Opacity (0-100) */
  opacity?: number;
  /** Border style (e.g., '5px_solid_rgb:00390b') */
  border?: string;
  /** Rotation angle in degrees */
  angle?: number;
};

/**
 * Type guard to check if a value is a number
 */
const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

/**
 * Helper to build transformation parameters
 */
const buildTransformationParams = (options: ImageTransformations): string => {
  const params: string[] = [];

  // Handle width and height
  if (options.width || options.height) {
    const width = options.width ? `w_${options.width}` : '';
    const height = options.height ? `,h_${options.height}` : '';
    const crop = options.crop ? `,c_${options.crop}` : '';
    const gravity = options.gravity ? `,g_${options.gravity}` : '';
    params.push(`${width}${height}${crop}${gravity}`.replace(/^,/, ''));
  }

  // Handle quality
  if (options.quality) {
    const q = options.quality === 'auto' ? 'auto:good' : options.quality;
    params.push(`q_${q}`);
  }

  // Handle format
  if (options.format) {
    params.push(`f_${options.format}`);
  }

  // Handle effects
  if (options.effect) {
    const { name, value } = options.effect;
    switch (name) {
      case 'blur':
        params.push(`e_blur:${value || 800}`);
        break;
      case 'grayscale':
        params.push('e_grayscale');
        break;
      case 'sharpen':
        params.push(`e_sharpen:${value || 100}`);
        break;
      case 'sepia':
        params.push('e_sepia');
        break;
    }
  }

  // Handle radius
  if (options.radius) {
    params.push(`r_${options.radius === 'max' ? 'max' : options.radius}`);
  }

  // Handle background
  if (options.background) {
    params.push(`b_${options.background}`);
  }

  // Handle opacity
  if (options.opacity !== undefined) {
    params.push(`o_${options.opacity}`);
  }

  // Handle border
  if (options.border) {
    params.push(`bo_${options.border}`);
  }

  // Handle rotation
  if (options.angle) {
    params.push(`a_${options.angle}`);
  }

  return params.join(',');
};

/**
 * Generate a Cloudinary URL with transformations
 * @param publicId - The public ID or URL of the image
 * @param options - Transformation options
 * @returns Transformed image URL
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: ImageTransformations = {}
): string {
  try {
    // If it's already a URL, return it as is
    if (publicId.startsWith('http')) {
      return publicId;
    }

    // Build the transformation parameters
    const transforms = buildTransformationParams(options);
    
    // Construct the URL
    const url = [
      CLOUDINARY_BASE_URL,
      transforms ? transforms : '',
      publicId.replace(/^https?:\/\//, '') // Remove http(s):// if present
    ].filter(Boolean).join('/');
    
    return url;
  } catch (error) {
    console.error('Error generating optimized image URL:', error);
    // Fallback to the original publicId if there's an error
    return publicId.startsWith('http') ? publicId : `${CLOUDINARY_BASE_URL}/${publicId}`;
  }
}

/**
 * Generate responsive image srcset
 * @param publicId - The public ID or URL of the image
 * @param options - Base transformation options
 * @param breakpoints - Array of breakpoint widths
 * @returns srcset string
 */
export function generateSrcSet(
  publicId: string,
  options: Omit<ImageTransformations, 'width'> = {},
  breakpoints: number[] = [640, 768, 1024, 1280, 1536]
): string {
  return breakpoints
    .map(width => {
      const url = getOptimizedImageUrl(publicId, {
        ...options,
        width,
        crop: options.crop || 'scale',
      });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Get a blurred placeholder image
 * @param publicId - The public ID or URL of the image
 * @param width - Width of the placeholder
 * @param height - Height of the placeholder
 * @returns URL for a blurred placeholder image
 */
export function getBlurredPlaceholder(
  publicId: string,
  width: number = 20,
  height?: number
): string {
  // If it's already a URL, we can't apply transformations, so return a data URL
  if (publicId.startsWith('http')) {
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU1ZTUiLz48L3N2Zz4=';
  }
  
  return getOptimizedImageUrl(publicId, {
    width,
    height,
    effect: { name: 'blur', value: 1000 },
    quality: 1,
  });
}

/**
 * Get a dominant color placeholder
 * @param publicId - The public ID of the image
 * @returns CSS color string
 */
export async function getDominantColor(publicId: string): Promise<string> {
  try {
    // In a real implementation, you would analyze the image and return its dominant color
    // For now, we'll return a light gray color as a fallback
    return '#e5e7eb';
  } catch (error) {
    console.error('Error getting dominant color:', error);
    return '#e5e7eb';
  }
}
