import { NextApiRequest } from 'next';
import { IncomingForm, Fields, Files } from 'formidable';
import { readFileSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

// Promisify the parse method of IncomingForm
const parseForm = (req: NextApiRequest): Promise<{ fields: Fields; files: Files }> => {
  const form = new IncomingForm();
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
};

type UploadedFile = {
  fieldName: string;
  originalFilename: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  extension: string;
};

/**
 * Parse and validate file uploads from a Next.js API route
 * @param req - Next.js API request object
 * @returns Array of uploaded files with their metadata and buffers
 */
export const parseFiles = async (req: NextApiRequest): Promise<UploadedFile[]> => {
  try {
    const { files } = await parseForm(req);
    
    return Object.entries(files).map(([fieldName, fileArray]) => {
      const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
      
      // Read the file into a buffer
      const buffer = readFileSync(file.filepath);
      
      // Get file extension
      const extension = file.originalFilename?.split('.').pop()?.toLowerCase() || '';
      
      return {
        fieldName,
        originalFilename: file.originalFilename || 'unknown',
        mimetype: file.mimetype || 'application/octet-stream',
        size: file.size,
        buffer,
        extension,
      };
    });
  } catch (error) {
    console.error('Error parsing files:', error);
    throw new Error('Failed to parse uploaded files');
  }
};

/**
 * Validate file type based on MIME type and extension
 * @param file - Uploaded file object
 * @param allowedTypes - Array of allowed MIME types
 * @param allowedExtensions - Array of allowed file extensions (without dot)
 * @returns Boolean indicating if the file is valid
 */
export const validateFileType = (
  file: UploadedFile,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowedExtensions: string[] = ['jpg', 'jpeg', 'png', 'webp', 'gif']
): boolean => {
  // Check MIME type
  const isValidMime = allowedTypes.includes(file.mimetype.toLowerCase());
  
  // Check file extension
  const isValidExtension = allowedExtensions.includes(file.extension.toLowerCase());
  
  return isValidMime && isValidExtension;
};

/**
 * Validate file size
 * @param file - Uploaded file object
 * @param maxSizeInMB - Maximum file size in MB (default: 5MB)
 * @returns Boolean indicating if the file size is within limits
 */
export const validateFileSize = (
  file: UploadedFile,
  maxSizeInMB: number = 5
): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024; // Convert MB to bytes
  return file.size <= maxSizeInBytes;
};

/**
 * Generate a unique filename with extension
 * @param originalName - Original filename
 * @param prefix - Optional prefix for the generated filename
 * @returns Unique filename with extension
 */
export const generateUniqueFilename = (
  originalName: string,
  prefix: string = 'file'
): string => {
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  const uniqueId = uuidv4();
  return `${prefix}-${uniqueId}${extension ? '.' + extension : ''}`;
};

export default {
  parseFiles,
  validateFileType,
  validateFileSize,
  generateUniqueFilename,
};
