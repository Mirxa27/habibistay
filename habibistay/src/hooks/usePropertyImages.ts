import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

type ImageType = {
  id: string;
  url: string;
  secureUrl: string;
  width: number | null;
  height: number | null;
  caption: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

type UploadImageResponse = {
  data: ImageType[];
  message: string;
};

type UpdateImageData = {
  caption?: string | null;
  isPrimary?: boolean;
};

const API_BASE = '/api/properties';

export function usePropertyImages(propertyId: string) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [error, setError] = useState<string | null>(null);

  // Get all images for a property
  const {
    data: images = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<ImageType[]>({
    queryKey: ['propertyImages', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      
      const res = await fetch(`${API_BASE}/${propertyId}/images`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch images');
      }
      
      const data = await res.json();
      return data.data || [];
    },
    enabled: !!propertyId,
  });

  // Upload images
  const uploadImages = useMutation<UploadImageResponse, Error, { images: File[]; isPrimaryIndex?: number }>({
    mutationFn: async ({ images, isPrimaryIndex = 0 }) => {
      if (!propertyId) throw new Error('Property ID is required');
      if (!session) throw new Error('You must be logged in to upload images');
      
      const formData = new FormData();
      
      // Add files to form data
      images.forEach((file, index) => {
        formData.append('images', file);
        formData.append('isPrimary', index === isPrimaryIndex ? 'true' : 'false');
        formData.append('caption', file.name.split('.')[0].replace(/[-_]/g, ' '));
      });
      
      const res = await fetch(`${API_BASE}/${propertyId}/images`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload images');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['propertyImages', propertyId] });
      setError(null);
      return data;
    },
    onError: (error: Error) => {
      console.error('Error uploading images:', error);
      setError(error.message);
    },
  });

  // Update an image (caption, isPrimary, etc.)
  const updateImage = useMutation<ImageType, Error, { imageId: string; data: UpdateImageData }>({
    mutationFn: async ({ imageId, data }) => {
      if (!propertyId) throw new Error('Property ID is required');
      if (!session) throw new Error('You must be logged in to update images');
      
      const res = await fetch(`${API_BASE}/${propertyId}/images/${imageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update image');
      }
      
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['propertyImages', propertyId] });
      setError(null);
    },
    onError: (error: Error) => {
      console.error('Error updating image:', error);
      setError(error.message);
    },
  });

  // Set an image as primary
  const setPrimaryImage = useCallback(
    (imageId: string) => {
      return updateImage.mutateAsync({
        imageId,
        data: { isPrimary: true },
      });
    },
    [updateImage]
  );

  // Delete an image
  const deleteImage = useMutation<void, Error, string>({
    mutationFn: async (imageId) => {
      if (!propertyId) throw new Error('Property ID is required');
      if (!session) throw new Error('You must be logged in to delete images');
      
      const res = await fetch(`${API_BASE}/${propertyId}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete image');
      }
      
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['propertyImages', propertyId] });
      setError(null);
    },
    onError: (error: Error) => {
      console.error('Error deleting image:', error);
      setError(error.message);
    },
  });

  // Reorder images
  const reorderImages = useMutation<ImageType[], Error, { imageIds: string[] }>({
    mutationFn: async ({ imageIds }) => {
      if (!propertyId) throw new Error('Property ID is required');
      if (!session) throw new Error('You must be logged in to reorder images');
      
      const res = await fetch(`${API_BASE}/${propertyId}/images/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ imageIds }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reorder images');
      }
      
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['propertyImages', propertyId] });
      setError(null);
    },
    onError: (error: Error) => {
      console.error('Error reordering images:', error);
      setError(error.message);
    },
  });

  return {
    images,
    isLoading,
    isError,
    error,
    refetch,
    uploadImages: uploadImages.mutateAsync,
    isUploading: uploadImages.isPending,
    updateImage: updateImage.mutateAsync,
    isUpdating: updateImage.isPending,
    setPrimaryImage,
    deleteImage: deleteImage.mutateAsync,
    isDeleting: deleteImage.isPending,
    reorderImages: reorderImages.mutateAsync,
    isReordering: reorderImages.isPending,
  };
}
