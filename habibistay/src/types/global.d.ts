// Type declarations for modules without types
declare module '@/lib/utils' {
  export function cn(...inputs: any[]): string;
  // Add other utility functions as needed
}

declare module '@/lib/image-utils' {
  export interface ImageTransformations {
    width?: number;
    height?: number;
    quality?: number | string;
    [key: string]: any;
  }
  
  export function getOptimizedImageUrl(
    publicId: string,
    options?: ImageTransformations
  ): string;
  // Add other image utility functions as needed
}
