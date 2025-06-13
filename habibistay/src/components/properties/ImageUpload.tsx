'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import Image from 'next/image';

// Placeholder icon components
const IconComponent = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <span className={`inline-block ${className || ''}`} style={{ width: '1em', height: '1em' }}>{children}</span>
);

const Upload = ({ className }: { className?: string }) => <IconComponent className={className}>📤</IconComponent>;
const Loader2 = ({ className }: { className?: string }) => <IconComponent className={className}>🔄</IconComponent>;

// Mock toast function
const toast = {
  success: (message: string) => console.log(`Success: ${message}`),
  error: (message: string) => console.error(`Error: ${message}`)
};

interface ImageUploadProps {
  propertyId: string;
  maxFiles?: number;
  onUploadComplete?: () => void;
}

// Simplified placeholder component
export const ImageUpload: React.FC<ImageUploadProps> = ({
  propertyId: _propertyId, // Prefix with underscore to indicate unused
  maxFiles = 10,
  onUploadComplete,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  
  // Simplified mock data
  const uploadedImages = [
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914',
      caption: 'Modern house with garden',
      isPrimary: true
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1576941089067-2de3c901e126',
      caption: 'Living room',
      isPrimary: false
    },
  ];

  const hasImages = uploadedImages.length > 0;
  const canUploadMore = uploadedImages.length < maxFiles;
  
  // Mock handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsUploading(true);
    
    // Simulate upload
    setTimeout(() => {
      setIsUploading(false);
      toast.success('Images uploaded successfully');
      onUploadComplete?.();
    }, 1500);
  };
  
  return (
    <div className="space-y-4">
      {/* Uploaded Images Grid */}
      {hasImages && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {uploadedImages.map((image) => (
            <div 
              key={image.id} 
              className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                image.isPrimary ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'
              }`}
            >
              <Image
                src={image.url}
                alt={image.caption || 'Property image'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33.33vw, 20vw"
              />
              {image.isPrimary && (
                <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {canUploadMore && (
        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors border-gray-300 hover:border-blue-500">
            <div className="flex flex-col items-center justify-center space-y-2">
              <Upload className="h-10 w-10 text-gray-400" />
              <p className="text-sm text-gray-500">
                Drag & drop images here, or click to select ({maxFiles - uploadedImages.length} remaining)
              </p>
              <p className="text-xs text-gray-400">
                JPEG, PNG, WEBP (max 10MB)
              </p>
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleFileChange}
                className="hidden" 
                id="file-upload"
              />
              <label htmlFor="file-upload" className="mt-2">
                <Button
                  disabled={isUploading}
                  className="cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2" /> Uploading...
                    </>
                  ) : (
                    'Select Images'
                  )}
                </Button>
              </label>
            </div>
          </div>
        </div>
      )}

      {!canUploadMore && (
        <div className="p-4 bg-gray-100 rounded-lg text-center">
          <p className="text-sm text-gray-500">
            Maximum number of images ({maxFiles}) reached. Remove some images to upload new ones.
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
