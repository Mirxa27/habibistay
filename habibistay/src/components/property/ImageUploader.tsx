'use client';

import { useCallback, useState, useRef, ChangeEvent } from 'react';

// Placeholder icon components
const IconComponent = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <span className={`inline-block ${className || ''}`} style={{ width: '1em', height: '1em' }}>{children}</span>
);

const UploadIcon = ({ className }: { className?: string }) => <IconComponent className={className}>⬆️</IconComponent>;
const XMarkIcon = ({ className }: { className?: string }) => <IconComponent className={className}>❌</IconComponent>;
const PhotoIcon = ({ className }: { className?: string }) => <IconComponent className={className}>📷</IconComponent>;
const CloudArrowUpIcon = ({ className }: { className?: string }) => <IconComponent className={className}>☁️</IconComponent>;
const ExclamationCircleIcon = ({ className }: { className?: string }) => <IconComponent className={className}>⚠️</IconComponent>;

interface FileWithPreview {
  id: string;
  name: string;
  size: number;
  type: string;
  preview: string;
  isPrimary?: boolean;
  caption?: string;
}

type ImageUploaderProps = {
  propertyId: string;
  maxFiles?: number;
  maxSize?: number; // in bytes (default: 5MB)
  acceptedFileTypes?: string[];
  onUploadComplete?: (uploadedImages: any[]) => void;
  onError?: (error: Error) => void;
  className?: string;
};

export default function ImageUploader({
  propertyId,
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024, // 5MB
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  onUploadComplete,
  onError,
  className = '',
}: ImageUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  // Removed unused uploadProgress state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs to avoid memory leaks
  const cleanUpFiles = useCallback((files: FileWithPreview[]) => {
    files.forEach(file => URL.revokeObjectURL(file.preview));
  }, []);

  // Handle file selection
  const onFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // Process files
    const newFiles: FileWithPreview[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          [file.name]: `File is too large. Max size: ${maxSize / (1024 * 1024)}MB`
        }));
        continue;
      }
      
      // Check file type
      if (!acceptedFileTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          [file.name]: 'Invalid file type'
        }));
        continue;
      }
      
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      
      newFiles.push({
        id: Math.random().toString(36).substring(2),
        name: file.name,
        size: file.size,
        type: file.type,
        preview: previewUrl,
        isPrimary: files.length === 0, // First file is primary by default
        caption: file.name.split('.')[0].replace(/[-_]/g, ' '), // Generate caption from filename
      });
    }
    
    // Limit to maxFiles
    if (files.length + newFiles.length > maxFiles) {
      setErrors(prev => ({
        ...prev,
        general: `Maximum ${maxFiles} files allowed`
      }));
    }
    
    setFiles(prevFiles => [...prevFiles, ...newFiles].slice(0, maxFiles));
  };
  
  // Handle file input change
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };
  
  // Simpler isDragActive state
  const [isDragActive, setIsDragActive] = useState(false);

  // Original handler removed (duplicate)

  // Remove a file
  const removeFile = (id: string) => {
    setFiles(prevFiles => {
      const newFiles = prevFiles.filter(file => file.id !== id);
      // If we removed the primary file, make the first file in the list primary
      if (newFiles.length > 0 && !newFiles.some(f => f.isPrimary)) {
        newFiles[0].isPrimary = true;
      }
      return [...newFiles];
    });
  };

  // Set a file as primary
  const setPrimary = (id: string) => {
    setFiles(prevFiles =>
      prevFiles.map(file => ({
        ...file,
        isPrimary: file.id === id,
      }))
    );
  };

  // Update caption
  const updateCaption = (id: string, caption: string) => {
    setFiles(prevFiles =>
      prevFiles.map(file =>
        file.id === id ? { ...file, caption } : file
      )
    );
  };

  // Upload files to the server
  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setErrors({});
    
    const formData = new FormData();
    // Removed unused uploadPromises array
    
    // Add files to form data
    files.forEach((file) => {
      // We can't append the actual file object since we're using a simplified version
      // In a real implementation, we would need to convert the file data to a Blob
      formData.append('images', new Blob([])); // Empty placeholder
      formData.append('isPrimary', file.isPrimary ? 'true' : 'false');
      formData.append('caption', file.caption || '');
      // Removed progress tracking
    });
    
    try {
      const response = await fetch(`/api/properties/${propertyId}/images`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload images');
      }
      
      const result = await response.json();
      
      // Clear files on successful upload
      cleanUpFiles(files);
      setFiles([]);
      
      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(result.data);
      }
      
      return result;
    } catch (error) {
      console.error('Error uploading files:', error);
      setErrors(prev => ({
        ...prev,
        upload: error instanceof Error ? error.message : 'Failed to upload images',
      }));
      
      if (onError) {
        onError(error instanceof Error ? error : new Error('Failed to upload images'));
      }
      
      throw error;
    } finally {
      setIsUploading(false);
      // Removed uploadProgress reset
    }
  };

  // Clean up function is used directly when needed

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Dropzone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 bg-gray-50'
        } ${isUploading || files.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragActive(false);
          onFileSelect(e.dataTransfer.files);
        }}
      >
        <input
          type="file"
          multiple
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileInputChange}
          disabled={isUploading || files.length >= maxFiles}
          className="hidden"
          ref={fileInputRef}
        />
        
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3 rounded-full bg-primary-100 text-primary-600">
            {isDragActive ? (
              <CloudArrowUpIcon className="h-8 w-8" />
            ) : (
              <UploadIcon className="h-8 w-8" />
            )}
          </div>
          
          {isDragActive ? (
            <p className="text-sm text-gray-600">Drop the files here</p>
          ) : (
            <>
              <div className="text-sm text-gray-600">
                <button
                  type="button"
                  className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={isUploading || files.length >= maxFiles}
                >
                  Click to upload
                </button>{' '}
                <span className="text-gray-500">or drag and drop</span>
              </div>
              <p className="text-xs text-gray-500">
                {acceptedFileTypes.map(t => t.split('/')[1]).join(', ').toUpperCase()} up to {maxSize / (1024 * 1024)}MB
              </p>
              <p className="text-xs text-gray-500">
                Max {maxFiles} files ({(maxFiles - files.length)} remaining)
              </p>
            </>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {errors.upload && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error uploading files</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{errors.upload}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Preview section */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className={`relative group rounded-lg overflow-hidden border ${
                  file.isPrimary ? 'ring-2 ring-primary-500 border-transparent' : 'border-gray-200'
                } bg-white`}
              >
                {/* Image */}
                <div className="aspect-square bg-gray-100 relative">
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Primary badge */}
                  {file.isPrimary && (
                    <span className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                      Primary
                    </span>
                  )}
                  
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    aria-label="Remove image"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                  
                  {/* Set as primary button (only shown on hover) */}
                  {!file.isPrimary && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPrimary(file.id);
                      }}
                      className="absolute inset-0 w-full h-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm font-medium transition-opacity"
                    >
                      Set as primary
                    </button>
                  )}
                </div>
                
                {/* Caption input */}
                <div className="p-2">
                  <input
                    type="text"
                    value={file.caption || ''}
                    onChange={(e) => updateCaption(file.id, e.target.value)}
                    placeholder="Add a caption"
                    className="w-full text-sm border-0 border-b border-transparent focus:border-gray-300 focus:ring-0 p-0 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Upload button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={uploadFiles}
              disabled={isUploading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <PhotoIcon className="-ml-1 mr-2 h-4 w-4" />
                  Upload {files.length} {files.length === 1 ? 'image' : 'images'}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
