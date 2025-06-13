'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import NextImage, { ImageProps as NextImageProps } from 'next/image';
import { cn } from '../../lib/utils';

// Simple fallback for getImageUrl if not available
interface ImageUrlOptions {
  width?: number;
  height?: number;
  quality?: number | 'auto';
  crop?: string;
  gravity?: string;
  effect?: string;
}

const getImageUrl = (publicId: string, options: ImageUrlOptions = {}) => {
  // This is a simplified version - replace with your actual implementation
  const baseUrl = 'https://res.cloudinary.com/demo';
  const transformations = [];
  
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.gravity) transformations.push(`g_${options.gravity}`);
  if (options.effect) transformations.push(`e_${options.effect}`);
  
  const transformStr = transformations.join(',');
  return `${baseUrl}/${transformations.length ? transformStr + '/' : ''}${publicId}`;
};

// Next.js will handle responsive image generation automatically

// Simple fallback for getBlurredPlaceholder if not available
const getBlurredPlaceholder = (publicId: string) => {
  return getImageUrl(publicId, {
    width: 20,
    quality: 20,
    effect: 'blur:1000',
  });
};

// Define the props specific to our ResponsiveImage component
interface ResponsiveImageProps extends Omit<NextImageProps, 'src' | 'width' | 'height' | 'srcSet' | 'sizes'> {
  // Required props
  /** The public ID or URL of the image */
  publicId: string;
  /** Width of the image in pixels */
  width: number;
  /** Height of the image in pixels */
  height: number;
  
  // Optional props with defaults
  /** Whether to generate a blurred placeholder */
  withPlaceholder?: boolean;
  /** Breakpoints for responsive images */
  breakpoints?: number[];
  /** Sizes attribute for responsive images */
  sizes?: string;
  /** Image quality (1-100) */
  quality?: number;
  /** Format of the image */
  format?: 'auto' | 'webp' | 'jpg' | 'png' | 'avif';
  /** Crop mode */
  crop?: 'fill' | 'fit' | 'limit' | 'mfit' | 'crop' | 'thumb' | 'scale' | 'pad';
  /** Gravity for cropping */
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'north_east' | 'east' | 'south_east' | 'south' | 'south_west' | 'west' | 'north_west';
  /** Additional image effects */
  effect?: string;
  /** Border radius */
  radius?: number | 'max';
}

const ResponsiveImage = ({
  // Required props
  publicId,
  alt = '',
  width,
  height,
  
  // Optional props with defaults
  withPlaceholder = true,
  breakpoints = [640, 750, 828, 1080, 1200, 1920],
  sizes = '(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75,
  format = 'auto',
  crop = 'fill',
  gravity = 'auto',
  effect,
  radius,
  className,
  style,
  ...props
}: ResponsiveImageProps) => {
  const [blurDataURL, setBlurDataURL] = useState<string>('');
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const imageUrl = useMemo(() => {
    // If publicId is already a URL, return it directly
    if (publicId.startsWith('http')) {
      return publicId;
    }
    
    // For local images, generate the URL with transformations
    return getImageUrl(publicId, {
      width,
      height,
      quality,
      crop,
      gravity,
      effect,
    });
  }, [publicId, width, height, quality, crop, gravity, effect]);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px',
        threshold: 0.1,
      }
    );

    const currentRef = containerRef.current;
    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // Generate blurred placeholder
  useEffect(() => {
    if (withPlaceholder) {
      const placeholder = getBlurredPlaceholder(publicId);
      setBlurDataURL(placeholder);
    }
  }, [publicId, withPlaceholder]);

  // Calculate aspect ratio for the container
  const paddingBottom = useMemo(() => `${(height / width) * 100}%`, [width, height]);

  return (
    <div 
      ref={containerRef}
      className={cn('relative', className)} 
      style={{ 
        width: '100%', 
        height: 0,
        paddingBottom,
        ...style 
      }}
    >
      {isInView ? (
        <NextImage
          src={imageUrl}
          alt={alt}
          width={width}
          height={height}
          className={cn('absolute inset-0 w-full h-full object-cover', className)}
          style={style}
          placeholder={blurDataURL ? 'blur' : 'empty'}
          blurDataURL={blurDataURL || undefined}
          loading="lazy"
          sizes={sizes}
          // Let Next.js handle srcSet generation
          {...props}
        />
      ) : (
        <div 
          className={cn(
            'bg-gray-200 animate-pulse',
            className
          )}
          style={{
            width: '100%',
            height: '100%',
            ...style,
          }}
        />
      )}
    </div>
  );
}

// Export as default
export default ResponsiveImage;
