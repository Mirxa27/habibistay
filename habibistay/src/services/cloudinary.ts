import { v2 as cloudinary } from 'cloudinary';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Use HTTPS
});

type UploadOptions = {
  folder?: string;
  public_id?: string;
  overwrite?: boolean;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: any[];
};

export class CloudinaryService {
  private static instance: CloudinaryService;
  private uploadFolder: string;

  private constructor() {
    this.uploadFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'habibistay';
  }

  public static getInstance(): CloudinaryService {
    if (!CloudinaryService.instance) {
      CloudinaryService.instance = new CloudinaryService();
    }
    return CloudinaryService.instance;
  }

  /**
   * Upload a file to Cloudinary
   * @param file - File to upload (Buffer or path to file)
   * @param options - Upload options
   * @returns Promise with the upload result
   */
  public async uploadFile(
    file: Buffer | string,
    options: UploadOptions = {}
  ) {
    try {
      // If it's a buffer, save it to a temporary file first
      let filePath: string;
      
      if (Buffer.isBuffer(file)) {
        const tempDir = tmpdir();
        const fileName = `temp-${Date.now()}`;
        filePath = join(tempDir, fileName);
        await writeFile(filePath, file);
      } else {
        filePath = file;
      }

      const uploadOptions: UploadOptions = {
        folder: this.uploadFolder,
        resource_type: 'auto', // Auto-detect resource type
        overwrite: true,
        ...options,
      };

      // Upload the file
      const result = await cloudinary.uploader.upload(filePath, uploadOptions);
      
      // Clean up temporary file if we created one
      if (Buffer.isBuffer(file)) {
        await unlink(filePath).catch(console.error);
      }

      return {
        success: true,
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          createdAt: result.created_at,
        },
      };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Delete a file from Cloudinary
   * @param publicId - Public ID of the file to delete
   * @param resourceType - Resource type (image, video, raw)
   * @returns Promise with the deletion result
   */
  public async deleteFile(publicId: string, resourceType: string = 'image') {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      return {
        success: result.result === 'ok',
        result,
      };
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate a URL for an image with transformations
   * @param publicId - Public ID of the image
   * @param options - Transformation options
   * @returns URL of the transformed image
   */
  public getImageUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: number | 'auto';
      format?: string;
    } = {}
  ): string {
    const defaultOptions = {
      width: 800,
      quality: 'auto',
      crop: 'limit',
      format: 'webp',
    };

    const transformOptions = { ...defaultOptions, ...options };
    const { width, height, crop, quality, format } = transformOptions;

    // Build transformation string
    const transformations = [];
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (crop) transformations.push(`c_${crop}`);
    if (quality) transformations.push(`q_${quality}`);

    // Add format if specified and not auto
    if (format && format !== 'auto') {
      transformations.push(`f_${format}`);
    }

    // Construct the URL
    const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
    const transformStr = transformations.join(',');

    return `${baseUrl}/${transformStr}/${publicId}${format ? '.' + format : ''}`;
  }
}

// Export a singleton instance
export const cloudinaryService = CloudinaryService.getInstance();

// Export utility functions
export const uploadToCloudinary = cloudinaryService.uploadFile.bind(cloudinaryService);
export const deleteFromCloudinary = cloudinaryService.deleteFile.bind(cloudinaryService);
export const getCloudinaryImageUrl = cloudinaryService.getImageUrl.bind(cloudinaryService);
