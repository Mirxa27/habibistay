import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '../ui/button';
import { useImageUpload } from '../../hooks/useImageUpload';

// Placeholder icon components
const IconComponent = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <span className={`inline-block ${className || ''}`} style={{ width: '1em', height: '1em' }}>{children}</span>
);

const Trash2 = ({ className }: { className?: string }) => <IconComponent className={className}>🗑️</IconComponent>;
const Star = ({ className }: { className?: string }) => <IconComponent className={className}>⭐</IconComponent>;
const Upload = ({ className }: { className?: string }) => <IconComponent className={className}>📤</IconComponent>;
const X = ({ className }: { className?: string }) => <IconComponent className={className}>❌</IconComponent>;
const Edit2 = ({ className }: { className?: string }) => <IconComponent className={className}>✏️</IconComponent>;
const Check = ({ className }: { className?: string }) => <IconComponent className={className}>✅</IconComponent>;

// Mock toast function
const toast = {
  success: (message: string) => console.log(`Success: ${message}`),
  error: (message: string) => console.error(`Error: ${message}`),
};

interface ImageGalleryProps {
  propertyId: string;
  images: Array<{
    id: string;
    url: string;
    isPrimary: boolean;
    caption?: string | null;
  }>;
  onImagesChange?: (images: any[]) => void;
  isOwner?: boolean;
  className?: string;
}

export function ImageGallery({
  propertyId,
  images: initialImages = [],
  onImagesChange,
  isOwner = false,
  className = '',
}: ImageGalleryProps) {
  const [images, setImages] = useState(initialImages);
  const [selectedImage, setSelectedImage] = useState<number | null>(0);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImages, deleteImage, setPrimaryImage, updateCaption, isUploading } = useImageUpload();

  // Sync with parent component when images change
  useEffect(() => {
    setImages(initialImages);
    
    // Reset selected image if it's out of bounds
    if (selectedImage !== null && selectedImage >= initialImages.length) {
      setSelectedImage(initialImages.length > 0 ? 0 : null);
    } else if (initialImages.length === 0) {
      setSelectedImage(null);
    }
  }, [initialImages, selectedImage]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const result = await uploadImages(propertyId, files);
    
    if (result.success && result.data) {
      const newImages = [...images, ...result.data];
      setImages(newImages);
      onImagesChange?.(newImages);
      
      // Select the first new image if this is the first image
      if (images.length === 0 && result.data.length > 0) {
        setSelectedImage(0);
      }
      
      toast.success('Images uploaded successfully');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (imageId: string, index: number | null) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    const result = await deleteImage(propertyId, imageId);
    
    if (result.success) {
      const newImages = images.filter(img => img.id !== imageId);
      setImages(newImages);
      onImagesChange?.(newImages);
      
      // Adjust selected image if needed
      if (selectedImage !== null && index !== null) {
        if (images.length === 1) {
          setSelectedImage(null);
        } else if (selectedImage >= index) {
          setSelectedImage(Math.max(0, selectedImage - 1));
        }
      }
      
      toast.success('Image deleted successfully');
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    const result = await setPrimaryImage(propertyId, imageId);
    
    if (result.success) {
      const newImages = images.map(img => ({
        ...img,
        isPrimary: img.id === imageId,
      }));
      
      setImages(newImages);
      onImagesChange?.(newImages);
      toast.success('Primary image updated');
    }
  };

  const handleUpdateCaption = async () => {
    if (selectedImage === null) return;
    
    const image = images[selectedImage];
    if (!image) return;
    
    const result = await updateCaption(propertyId, image.id, caption);
    
    if (result.success) {
      const newImages = [...images];
      newImages[selectedImage] = { ...image, caption };
      
      setImages(newImages);
      onImagesChange?.(newImages);
      setIsEditingCaption(false);
      toast.success('Caption updated');
    }
  };

  const currentImage = selectedImage !== null ? images[selectedImage] : null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main image display */}
      <div className="relative aspect-video w-full bg-gray-100 rounded-lg overflow-hidden">
        {currentImage ? (
          <>
            <Image
              src={currentImage.url}
              alt={currentImage.caption || 'Property image'}
              fill
              className="object-cover"
              priority
            />
            
            {/* Image actions overlay */}
            {isOwner && (
              <div className="absolute top-2 right-2 flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/80 hover:bg-white/90 text-gray-800"
                  onClick={() => {
                    setCaption(currentImage.caption || '');
                    setIsEditingCaption(true);
                  }}
                  disabled={isUploading}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/80 hover:bg-white/90 text-gray-800"
                  onClick={() => handleSetPrimary(currentImage.id)}
                  disabled={currentImage.isPrimary || isUploading}
                >
                  <Star 
                    className={`h-4 w-4 ${currentImage.isPrimary ? 'fill-yellow-400 text-yellow-400' : ''}`} 
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/80 hover:bg-white/90 text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteImage(currentImage.id, selectedImage)}
                  disabled={isUploading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Caption */}
            {(currentImage.caption || (isOwner && isEditingCaption)) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                {isEditingCaption ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="flex-1 bg-white/20 border border-white/30 rounded px-2 py-1 text-sm text-white placeholder-white/70"
                      placeholder="Add a caption..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateCaption();
                        if (e.key === 'Escape') setIsEditingCaption(false);
                      }}
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={handleUpdateCaption}
                      disabled={isUploading}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={() => setIsEditingCaption(false)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm line-clamp-2">{currentImage.caption}</p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No images available</p>
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  Upload Images
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Thumbnail strip */}
      {images.length > 0 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {images.map((img, index) => (
            <button
              key={img.id}
              className={`relative flex-shrink-0 w-20 h-16 rounded-md overflow-hidden border-2 transition-all ${
                selectedImage === index 
                  ? 'border-primary ring-2 ring-primary ring-offset-1' 
                  : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => setSelectedImage(index)}
              disabled={isUploading}
            >
              <Image
                src={img.url}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
              {img.isPrimary && (
                <div className="absolute top-0 right-0 bg-yellow-400 p-0.5 rounded-bl">
                  <Star className="h-3 w-3 text-yellow-800" />
                </div>
              )}
            </button>
          ))}
          
          {isOwner && (
            <button
              className="flex-shrink-0 w-20 h-16 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  );
}
