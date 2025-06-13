import { useState } from 'react';
import { toast } from 'sonner';

type UploadResult = {
  success: boolean;
  data?: any;
  error?: string;
};

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImages = async (
    propertyId: string, 
    files: File[], 
    options: { 
      isPrimary?: boolean; 
      captions?: Record<string, string>;
    } = {}
  ): Promise<UploadResult> => {
    if (!propertyId || !files?.length) {
      return { 
        success: false, 
        error: 'Property ID and files are required' 
      };
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      
      // Add files to form data
      files.forEach((file, index) => {
        formData.append('files', file);
        
        // Add caption if provided
        const caption = options.captions?.[file.name] || '';
        if (caption) {
          formData.append(`caption_${index}`, caption);
        }
      });
      
      // Add additional options
      if (options.isPrimary) {
        formData.append('isPrimary', 'true');
      }

      const response = await fetch(`/api/properties/${propertyId}/images`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload images');
      }

      setProgress(100);
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload images');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload images' 
      };
    } finally {
      setIsUploading(false);
      
      // Reset progress after a short delay
      setTimeout(() => setProgress(0), 500);
    }
  };

  const deleteImage = async (propertyId: string, imageId: string): Promise<UploadResult> => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/images/${imageId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete image');
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete image' 
      };
    }
  };

  const setPrimaryImage = async (propertyId: string, imageId: string): Promise<UploadResult> => {
    try {
      const response = await fetch(
        `/api/properties/${propertyId}/images/${imageId}/set-primary`,
        { method: 'PUT' }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to set primary image');
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error setting primary image:', error);
      toast.error('Failed to set primary image');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to set primary image' 
      };
    }
  };

  const updateCaption = async (
    propertyId: string, 
    imageId: string, 
    caption: string
  ): Promise<UploadResult> => {
    try {
      const response = await fetch(
        `/api/properties/${propertyId}/images/${imageId}/caption`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ caption }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update caption');
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error updating caption:', error);
      toast.error('Failed to update caption');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update caption' 
      };
    }
  };

  return {
    uploadImages,
    deleteImage,
    setPrimaryImage,
    updateCaption,
    isUploading,
    progress,
  };
}
