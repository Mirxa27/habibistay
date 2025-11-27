import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

/**
 * Production-ready Cloudinary Service
 * Handles image and video uploads to Cloudinary with optimization
 */
export class CloudinaryService {
  constructor() {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn('Cloudinary credentials not fully configured. Image uploads may fail.');
    }
  }

  /**
   * Upload an image to Cloudinary
   */
  async uploadImage(params: {
    file: string | Buffer; // File path or buffer
    folder?: string;
    publicId?: string;
    tags?: string[];
    context?: Record<string, string>;
    transformation?: any;
  }): Promise<{
    publicId: string;
    url: string;
    secureUrl: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
  }> {
    try {
      const uploadOptions: any = {
        folder: params.folder || 'habibistay',
        resource_type: 'image',
        quality: 'auto:good',
        fetch_format: 'auto',
        flags: 'progressive',
      };

      if (params.publicId) {
        uploadOptions.public_id = params.publicId;
      }

      if (params.tags && params.tags.length > 0) {
        uploadOptions.tags = params.tags;
      }

      if (params.context) {
        uploadOptions.context = params.context;
      }

      if (params.transformation) {
        uploadOptions.transformation = params.transformation;
      }

      const result: UploadApiResponse = await cloudinary.uploader.upload(
        params.file as string,
        uploadOptions
      );

      return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (error) {
      console.error('Cloudinary image upload failed:', error);
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload a video to Cloudinary
   */
  async uploadVideo(params: {
    file: string | Buffer;
    folder?: string;
    publicId?: string;
    tags?: string[];
    context?: Record<string, string>;
  }): Promise<{
    publicId: string;
    url: string;
    secureUrl: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
    duration: number;
  }> {
    try {
      const uploadOptions: any = {
        folder: params.folder || 'habibistay/videos',
        resource_type: 'video',
        quality: 'auto:good',
        eager: [
          { width: 1080, height: 1920, crop: 'fill', quality: 'auto:good', format: 'mp4' },
          { width: 720, height: 1280, crop: 'fill', quality: 'auto:good', format: 'mp4' },
        ],
        eager_async: true,
      };

      if (params.publicId) {
        uploadOptions.public_id = params.publicId;
      }

      if (params.tags && params.tags.length > 0) {
        uploadOptions.tags = params.tags;
      }

      if (params.context) {
        uploadOptions.context = params.context;
      }

      const result: UploadApiResponse = await cloudinary.uploader.upload(
        params.file as string,
        uploadOptions
      );

      return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        duration: result.duration || 0,
      };
    } catch (error) {
      console.error('Cloudinary video upload failed:', error);
      throw new Error(`Failed to upload video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload multiple images at once
   */
  async uploadMultipleImages(params: {
    files: (string | Buffer)[];
    folder?: string;
    tags?: string[];
  }): Promise<Array<{
    publicId: string;
    url: string;
    secureUrl: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
  }>> {
    try {
      const uploadPromises = params.files.map(file =>
        this.uploadImage({
          file,
          folder: params.folder,
          tags: params.tags,
        })
      );

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Failed to upload multiple images:', error);
      throw new Error(`Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
      });

      return result.result === 'ok';
    } catch (error) {
      console.error('Failed to delete image:', error);
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a video from Cloudinary
   */
  async deleteVideo(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'video',
      });

      return result.result === 'ok';
    } catch (error) {
      console.error('Failed to delete video:', error);
      throw new Error(`Failed to delete video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete multiple images at once
   */
  async deleteMultipleImages(publicIds: string[]): Promise<{ deleted: string[]; failed: string[] }> {
    try {
      const result = await cloudinary.api.delete_resources(publicIds, {
        resource_type: 'image',
      });

      const deleted: string[] = [];
      const failed: string[] = [];

      Object.entries(result.deleted).forEach(([publicId, status]) => {
        if (status === 'deleted') {
          deleted.push(publicId);
        } else {
          failed.push(publicId);
        }
      });

      return { deleted, failed };
    } catch (error) {
      console.error('Failed to delete multiple images:', error);
      throw new Error(`Failed to delete images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a thumbnail from a video
   */
  async generateVideoThumbnail(publicId: string): Promise<string> {
    try {
      const thumbnailUrl = cloudinary.url(publicId, {
        resource_type: 'video',
        format: 'jpg',
        transformation: [
          { width: 1080, height: 1920, crop: 'fill' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      });

      return thumbnailUrl;
    } catch (error) {
      console.error('Failed to generate video thumbnail:', error);
      throw new Error(`Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get optimized image URL with transformations
   */
  getOptimizedImageUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | 'limit' | 'pad';
    quality?: string;
    format?: string;
  }): string {
    const transformation: any = {
      quality: options?.quality || 'auto:good',
      fetch_format: options?.format || 'auto',
    };

    if (options?.width) {
      transformation.width = options.width;
    }

    if (options?.height) {
      transformation.height = options.height;
    }

    if (options?.crop) {
      transformation.crop = options.crop;
    }

    return cloudinary.url(publicId, {
      transformation,
      secure: true,
    });
  }

  /**
   * Get responsive image URLs for different screen sizes
   */
  getResponsiveImageUrls(publicId: string): {
    mobile: string;
    tablet: string;
    desktop: string;
    original: string;
  } {
    return {
      mobile: this.getOptimizedImageUrl(publicId, { width: 640, crop: 'fill' }),
      tablet: this.getOptimizedImageUrl(publicId, { width: 1024, crop: 'fill' }),
      desktop: this.getOptimizedImageUrl(publicId, { width: 1920, crop: 'fill' }),
      original: cloudinary.url(publicId, { secure: true }),
    };
  }

  /**
   * Upload image from base64 string
   */
  async uploadBase64Image(params: {
    base64: string;
    folder?: string;
    publicId?: string;
    tags?: string[];
  }): Promise<{
    publicId: string;
    url: string;
    secureUrl: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
  }> {
    try {
      // Ensure base64 string has proper data URI format
      const base64Data = params.base64.includes('base64,')
        ? params.base64
        : `data:image/jpeg;base64,${params.base64}`;

      return await this.uploadImage({
        file: base64Data,
        folder: params.folder,
        publicId: params.publicId,
        tags: params.tags,
      });
    } catch (error) {
      console.error('Failed to upload base64 image:', error);
      throw new Error(`Failed to upload base64 image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: 'image',
      });

      return {
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        url: result.url,
        secureUrl: result.secure_url,
        createdAt: result.created_at,
        tags: result.tags,
      };
    } catch (error) {
      console.error('Failed to get image metadata:', error);
      throw new Error(`Failed to get image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search images by tag
   */
  async searchImagesByTag(tag: string, maxResults: number = 50): Promise<any[]> {
    try {
      const result = await cloudinary.search
        .expression(`tags:${tag}`)
        .max_results(maxResults)
        .execute();

      return result.resources;
    } catch (error) {
      console.error('Failed to search images by tag:', error);
      throw new Error(`Failed to search images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update image tags
   */
  async updateImageTags(publicId: string, tags: string[]): Promise<boolean> {
    try {
      await cloudinary.uploader.add_tag(tags.join(','), [publicId], {
        resource_type: 'image',
      });

      return true;
    } catch (error) {
      console.error('Failed to update image tags:', error);
      throw new Error(`Failed to update tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
