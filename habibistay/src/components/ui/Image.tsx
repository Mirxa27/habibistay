'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl, type ImageTransformations } from '@/lib/image-utils';

// Define our custom props that we want to handle separately
interface CustomImageProps {
  /** Additional class name for the image element */
  imgClassName?: string;
  /** Additional class name for the skeleton/placeholder */
  skeletonClassName?: string;
  /** Whether the image should be considered high priority (preload) */
  priority?: boolean;
  /** Image quality (1-100) or 'auto' */
  quality?: number | string;
  /** URL of a blurred version of the image for placeholder */
  blurDataURL?: string;
  /** Type of placeholder to show while loading */
  placeholder?: 'blur' | 'empty';
  /** Whether to skip optimization */
  unoptimized?: boolean;
  /** Callback when image is loaded */
  onLoadingComplete?: () => void;
  /** Image transformations to apply */
  transform?: ImageTransformations;
  /** Whether the image should fill its container */
  fill?: boolean;
  /** Additional styles */
  style?: React.CSSProperties;
}

// Extend the standard img element props with our custom ones
interface ExtendedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'loading' | 'children'> {
  loading?: 'eager' | 'lazy';
  // Add fetchPriority to the interface
  fetchPriority?: 'high' | 'low' | 'auto';
  // Add any other custom props here
}

// Define base image props without the ones we're overriding
type BaseImageProps = Omit<
  ExtendedImageProps,
  | 'src'
  | 'alt'
  | 'width'
  | 'height'
  | 'loading'
  | 'sizes'
  | 'srcSet'
  | keyof CustomImageProps
>;

// Combine with standard img props
export type ImageProps = BaseImageProps &
  CustomImageProps & {
    /** Image source URL */
    src: string | null | undefined;
    /** Alternative text for the image */
    alt: string;
    /** Width of the image in pixels */
    width?: number | string;
    /** Height of the image in pixels */
    height?: number | string;
    /** Loading behavior */
    loading?: 'eager' | 'lazy';
    /** Sizes attribute for responsive images */
    sizes?: string;
    /** Image source set for responsive images */
    srcSet?: string;
  };

import { useMemo } from 'react';
import { getResponsiveSrcSet, getBlurredPlaceholder } from '@/lib/cloudinary';

export function OptimizedImage({
  src: srcProp,
  alt,
  width: widthProp,
  height: heightProp,
  className,
  imgClassName,
  skeletonClassName,
  priority,
  loading: loadingProp = 'lazy',
  quality = 'auto',
  blurDataURL,
  placeholder,
  unoptimized = false,
  onLoadingComplete,
  transform = {},
  fill = false,
  sizes,
  style,
  onLoad,
  onError,
  ...rest
}: ImageProps) {
  // --- LAZY LOADING (Intersection Observer) ---
  const [isInView, setIsInView] = useState(priority || loadingProp === 'eager');
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isInView || priority || loadingProp === 'eager') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px', threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, [isInView, priority, loadingProp]);

  // --- Responsive and WebP srcSet ---
  const srcSetWebP = useMemo(() => srcProp && getResponsiveSrcSet(srcProp, { ...transform, quality, format: 'webp' }), [srcProp, transform, quality]);
  const srcSetDefault = useMemo(() => srcProp && getResponsiveSrcSet(srcProp, { ...transform, quality, format: 'jpg' }), [srcProp, transform, quality]);
  const blurPlaceholder = blurDataURL || (srcProp ? getBlurredPlaceholder(srcProp, 32, 32) : undefined);

  // --- Image rendering ---
  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)} style={{ width: fill ? '100%' : widthProp, height: fill ? '100%' : heightProp, ...style }}>
      {isInView && srcProp ? (
        <picture>
          <source type="image/webp" srcSet={srcSetWebP} sizes={sizes} />
          <source type="image/jpeg" srcSet={srcSetDefault} sizes={sizes} />
          <img
            ref={imgRef}
            src={srcSetDefault?.split(',')[0]?.split(' ')[0] || srcProp}
            alt={alt}
            width={widthProp}
            height={heightProp}
            className={cn('transition-opacity duration-200', isLoading ? 'opacity-0' : 'opacity-100', imgClassName)}
            loading={priority ? 'eager' : loadingProp}
            fetchPriority={priority ? 'high' : undefined}
            sizes={sizes}
            onLoad={handleLoad}
            onError={handleError}
            style={{ objectFit: fill ? 'cover' : 'contain', width: fill ? '100%' : widthProp, height: fill ? '100%' : heightProp }}
            {...rest}
          />
        </picture>
      ) : (
        // Skeleton or blur placeholder
        blurPlaceholder ? (
          <img src={blurPlaceholder} alt="" className="blur-md scale-110 transform w-full h-full object-cover" />
        ) : (
          <div className={cn('absolute inset-0 bg-gray-100 dark:bg-gray-800', skeletonClassName)} />
        )
      )}
      {/* Error fallback */}
      {error && (
        <div className={cn('flex items-center justify-center bg-gray-100 dark:bg-gray-800', className)} style={{ width: widthProp ? `${widthProp}px` : '100%', height: heightProp ? `${heightProp}px` : 'auto', ...style }}>
          <span className="text-gray-400">Image not available</span>
        </div>
      )}
    </div>
  );
}
  const [isLoading, setIsLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState('');
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  
  // Convert width and height to numbers if they're strings
  const width = widthProp ? (typeof widthProp === 'string' ? parseInt(widthProp, 10) : widthProp) : undefined;
  const height = heightProp ? (typeof heightProp === 'string' ? parseInt(heightProp, 10) : heightProp) : undefined;

  // Generate the optimized image URL
  useEffect(() => {
    if (!srcProp) {
      setImgSrc('');
      setIsLoading(false);
      return;
    }

    // If unoptimized is true, use the source URL as is
    if (unoptimized) {
      setImgSrc(srcProp);
      return;
    }

    // Otherwise, generate an optimized URL
    try {
      const optimizedUrl = getOptimizedImageUrl(srcProp, {
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
        quality: (() => {
          if (typeof quality === 'number') return quality;
          if (typeof quality === 'string') {
            const num = parseInt(quality, 10);
            return isNaN(num) ? 'auto' : num;
          }
          return 'auto';
        })(),
        ...transform,
      } as ImageTransformations);
      setImgSrc(optimizedUrl);
    } catch (error) {
      console.error('Error generating optimized image URL:', error);
      setImgSrc(srcProp);
    }
  }, [srcProp, width, height, quality, transform, unoptimized]);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    setError(false);
    onLoadingComplete?.();
    if (onLoad) {
      onLoad(e);
    }
  }, [onLoadingComplete, onLoad]);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    setError(true);
    if (onError) {
      onError(e as React.SyntheticEvent<HTMLImageElement, Event>);
    }
  }, [onError]);
  
  // Handle priority prop (sets loading to 'eager' and adds fetchpriority="high")
  const imgLoading = priority ? 'eager' as const : loadingProp;
  const fetchPriority = priority ? 'high' as const : undefined;

  if (!srcProp) {
    return null;
  }

  // If there's an error, render a placeholder
  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 dark:bg-gray-800',
          className
        )}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'auto',
          ...style,
        }}
      >
        <span className="text-gray-400">Image not available</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        className
      )}
      style={{
        width: fill ? '100%' : width,
        height: fill ? '100%' : height,
        ...style,
      }}
    >
      {imgSrc && (
        <img
          ref={imgRef}
          src={imgSrc}
          alt={alt}
          width={width}
          height={height}
          srcSet={rest.srcSet}
          className={cn(
            'transition-opacity duration-200',
            isLoading ? 'opacity-0' : 'opacity-100',
            imgClassName
          )}
          loading={imgLoading}
          fetchPriority={fetchPriority}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            objectFit: fill ? 'cover' : 'contain',
            width: fill ? '100%' : width,
            height: fill ? '100%' : height,
          }}
          {...rest}
        />
      )}
      
      {/* Loading overlay with blur placeholder */}
      {isLoading && blurDataURL && (
        <div className="absolute inset-0">
          <img
            src={blurDataURL}
            alt=""
            className="blur-md scale-110 transform w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Skeleton loader */}
      {isLoading && !blurDataURL && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-100 dark:bg-gray-800',
            skeletonClassName
          )}
        />
      )}
    </div>
  );
}

// Export a default version for backward compatibility
export default OptimizedImage;
