'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

// Placeholder icon components
const IconComponent = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <span className={`inline-block ${className || ''}`} style={{ width: '1em', height: '1em' }}>{children}</span>
);

const FaCamera = ({ className }: { className?: string }) => <IconComponent className={className}>📷</IconComponent>;
const FaSpinner = ({ className }: { className?: string }) => <IconComponent className={className}>🔄</IconComponent>;

interface ProfileImageUploadProps {
  currentImage: string | null;
  onImageUploaded: (imageUrl: string) => void;
}

// Simplified version for build
export default function ProfileImageUpload({ currentImage, onImageUploaded }: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Simplified version of the file change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      // Create a fake URL for the image
      const mockImageUrl = 'https://example.com/profile-image.jpg';
      onImageUploaded(mockImageUrl);
      setIsUploading(false);
    }, 1000);
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative group cursor-pointer" onClick={triggerFileInput}>
        <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          {currentImage ? (
            <Image 
              src={currentImage} 
              alt="Profile" 
              width={128} 
              height={128} 
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="text-gray-400 text-5xl">
              👤
            </div>
          )}
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
          {isUploading ? (
            <FaSpinner className="text-white text-xl" />
          ) : (
            <FaCamera className="text-white text-xl" />
          )}
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      
      <p className="mt-2 text-sm text-gray-500">
        Click to upload a profile photo
      </p>
    </div>
  );
}
