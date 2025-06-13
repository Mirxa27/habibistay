'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
// Placeholder for heroicons
const XMarkIcon = ({ className }: { className?: string }) => <span className={className}>✕</span>;
const ChevronLeftIcon = ({ className }: { className?: string }) => <span className={className}>←</span>;
const ChevronRightIcon = ({ className }: { className?: string }) => <span className={className}>→</span>;

import { getImageUrl } from '../../lib/cloudinary';

type ImageType = {
  id: string;
  url: string;
  secureUrl: string;
  width: number | null;
  height: number | null;
  caption: string | null;
  isPrimary: boolean;
};

type PropertyImageGalleryProps = {
  images: ImageType[];
  propertyId: string;
  className?: string;
  showThumbnails?: boolean;
  autoPlay?: boolean;
  showFullscreen?: boolean;
  enableLightbox?: boolean;
};

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export default function PropertyImageGallery({
  images,
  propertyId,
  className = '',
  showThumbnails = true,
  autoPlay = false,
  showFullscreen = true,
  enableLightbox = true,
}: PropertyImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Removed unused isLoading state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Filter out any images without URLs
  const validImages = images.filter(img => img.url || img.secureUrl);
  
  // If no valid images, return null or a placeholder
  if (validImages.length === 0) {
    return (
      <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-w-16 aspect-h-9 flex items-center justify-center">
          <span className="text-gray-400">No images available</span>
        </div>
      </div>
    );
  }

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && validImages.length > 1) {
      intervalRef.current = setInterval(() => {
        navigate(1);
      }, 5000);
    }
    
    // Always return cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoPlay, validImages.length]);

  // Pause auto-play on hover
  const handleMouseEnter = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (autoPlay && validImages.length > 1) {
      intervalRef.current = setInterval(() => {
        navigate(1);
      }, 5000);
    }
  }, [autoPlay, validImages.length]);

  // Navigation functions
  const navigate = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + newDirection;
      
      if (nextIndex >= validImages.length) {
        return 0;
      } else if (nextIndex < 0) {
        return validImages.length - 1;
      }
      
      return nextIndex;
    });
  }, [validImages.length]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isLightboxOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowRight') {
        navigate(1);
      } else if (e.key === 'ArrowLeft') {
        navigate(-1);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, navigate]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(console.error);
    }
  }, []);

  // Get optimized image URL with Cloudinary transformations
  const getOptimizedImageUrl = useCallback((image: ImageType, options = {}) => {
    const publicId = image.url.split('/').pop()?.split('.')[0] || '';
    return getImageUrl(publicId, {
      width: 1200,
      height: 800,
      crop: 'fill',
      quality: 'auto',
      fetchFormat: 'auto',
      ...options,
    });
  }, []);

  const currentImage = validImages[currentIndex];
  const imageUrl = getOptimizedImageUrl(currentImage);
  const thumbnailSize = 80;

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-property-id={propertyId} // Using propertyId in a data attribute
    >
      {/* Main image */}
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);
              if (swipe < -swipeConfidenceThreshold) {
                navigate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                navigate(-1);
              }
            }}
            className="w-full h-full absolute inset-0"
          >
            <Image
              src={currentImage.secureUrl || currentImage.url}
              alt={currentImage.caption || `Property image ${currentIndex + 1}`}
              fill
              className="object-cover"
              priority={currentIndex === 0}
              sizes="(max-width: 768px) 100vw, 80vw"
              onClick={() => enableLightbox && setIsLightboxOpen(true)}
              style={{
                cursor: enableLightbox ? 'zoom-in' : 'default',
              }}
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation arrows */}
        {validImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(-1);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(1);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
              aria-label="Next image"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </>
        )}
        
        {/* Image counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full z-10">
          {currentIndex + 1} / {validImages.length}
        </div>
        
        {/* Fullscreen button */}
        {showFullscreen && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
          >
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0-4h-4m4 0l-5 5" />
              </svg>
            )}
          </button>
        )}
      </div>
      
      {/* Thumbnails */}
      {showThumbnails && validImages.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
          {validImages.map((img, index) => {
            const thumbnailUrl = getOptimizedImageUrl(img, {
              width: thumbnailSize,
              height: thumbnailSize,
              crop: 'fill',
              quality: 'auto',
            });
            
            return (
              <button
                key={img.id}
                onClick={() => {
                  const newDirection = index > currentIndex ? 1 : -1;
                  setDirection(newDirection);
                  setCurrentIndex(index);
                }}
                className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                  index === currentIndex 
                    ? 'border-primary-500 ring-2 ring-primary-200' 
                    : 'border-transparent hover:border-gray-300'
                }`}
                aria-label={`View image ${index + 1}`}
              >
                <Image
                  src={img.secureUrl || img.url}
                  alt=""
                  width={thumbnailSize}
                  height={thumbnailSize}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
      
      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(false);
              }}
              aria-label="Close lightbox"
            >
              <XMarkIcon className="h-8 w-8" />
            </button>
            
            <div className="relative w-full max-w-6xl h-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: 'spring', stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                  }}
                  className="w-full h-full absolute inset-0"
                >
                  <Image
                    src={currentImage.secureUrl || currentImage.url}
                    alt={currentImage.caption || `Property image ${currentIndex + 1}`}
                    fill
                    className="object-contain"
                    priority
                    sizes="90vw"
                  />
                </motion.div>
              </AnimatePresence>
              
              {/* Navigation arrows */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(-1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors z-10"
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors z-10"
                aria-label="Next image"
              >
                <ChevronRightIcon className="h-8 w-8" />
              </button>
              
              {/* Image caption */}
              {currentImage.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white text-sm">
                  {currentImage.caption}
                </div>
              )}
              
              {/* Image counter */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                {currentIndex + 1} / {validImages.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
