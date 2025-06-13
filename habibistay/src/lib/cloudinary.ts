import { v2 as cloudinary } from 'cloudinary';
// Stub environment variables for build
const env = {
  CLOUDINARY_CLOUD_NAME: 'demo',
  CLOUDINARY_API_KEY: '123456789012345',
  CLOUDINARY_API_SECRET: 'abcdefghijklmnopqrstuvwxyz',
};

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true, // Use HTTPS
});

type ImageTransformationOptions = {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'limit' | 'mfit' | 'crop' | 'thumb' | 'scale' | 'pad';
  gravity?: 'face' | 'center' | 'north' | 'north_east' | 'east' | 'south_east' | 'south' | 'south_west' | 'west' | 'north_west' | 'auto';
  quality?: number | 'auto';
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'gif' | 'avif';
  effect?: string;
  radius?: number | 'max';
  background?: string;
  opacity?: number;
  border?: string;
  overlay?: string;
  underlay?: string;
  fetchFormat?: 'auto' | 'webp' | 'jpg' | 'png' | 'gif' | 'avif';
  dpr?: number | 'auto';
  aspectRatio?: string;
};

/**
 * Generate a Cloudinary URL with the specified transformations
 * @param publicId The public ID of the image in Cloudinary
 * @param options Transformation options
 * @returns Transformed image URL
 */
export function getImageUrl(publicId: string, options: ImageTransformationOptions = {}): string {
  const {
    width,
    height,
    crop = 'fill',
    gravity = 'auto',
    quality = 'auto',
    format = 'auto',
    effect,
    radius,
    background,
    opacity,
    border,
    overlay,
    underlay,
    fetchFormat = 'auto',
    dpr = 'auto',
    aspectRatio,
  } = options;

  const transformations: string[] = [];

  // Add width and height if provided
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  
  // Add other transformations
  if (crop) transformations.push(`c_${crop}`);
  if (gravity) transformations.push(`g_${gravity}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);
  if (effect) transformations.push(`e_${effect}`);
  if (radius !== undefined) transformations.push(`r_${radius}`);
  if (background) transformations.push(`b_${background}`);
  if (opacity !== undefined) transformations.push(`o_${opacity}`);
  if (border) transformations.push(`bo_${border}`);
  if (overlay) transformations.push(`l_${overlay}`);
  if (underlay) transformations.push(`u_${underlay}`);
  if (fetchFormat) transformations.push(`f_${fetchFormat}`);
  if (dpr) transformations.push(`dpr_${dpr}`);
  if (aspectRatio) transformations.push(`ar_${aspectRatio}`);

  // Generate the URL
  return cloudinary.url(publicId, {
    transformation: [
      {
        ...(transformations.length > 0 && { transformation: transformations.join(',') }),
      },
    ],
  });
}

/**
 * Generate a responsive image srcset for different screen sizes
 * @param publicId The public ID of the image in Cloudinary
 * @param options Base transformation options
 * @param breakpoints Array of breakpoints in pixels
 * @returns srcset string
 */
export function getResponsiveSrcSet(
  publicId: string,
  options: Omit<ImageTransformationOptions, 'width'> = {},
  breakpoints: number[] = [640, 768, 1024, 1280, 1536]
): string {
  return breakpoints
    .map((width) => {
      const url = getImageUrl(publicId, { ...options, width });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Generate a blurred placeholder image URL
 * @param publicId The public ID of the image in Cloudinary
 * @param width Width of the placeholder
 * @param height Height of the placeholder
 * @returns Blurred placeholder URL
 */
export function getBlurredPlaceholder(
  publicId: string,
  width = 100,
  height = 100
): string {
  return getImageUrl(publicId, {
    width,
    height,
    crop: 'fill',
    quality: 1,
    effect: 'blur:1000',
    fetchFormat: 'auto',
  });
}

export default cloudinary;
