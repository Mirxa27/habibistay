'use client';

import { useState } from 'react';
import Image from 'next/image';

// Simple stub component for the image gallery
const ImageGallery = ({ 
  propertyId, 
  images, 
  onImagesChange,
  isOwner 
}: { 
  propertyId: string;
  images: {
    id: string;
    url: string;
    isPrimary: boolean;
    caption?: string | null;
  }[];
  onImagesChange: (images: any[]) => void;
  isOwner: boolean;
}) => {
  return (
    <div className="border rounded-lg shadow-sm p-4" data-property-id={propertyId}>
      <h3 className="text-lg font-medium mb-4">Property Images for {propertyId}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map(image => (
          <div key={image.id} className="relative h-40 rounded-lg overflow-hidden">
            <Image 
              src={image.url} 
              alt={image.caption || 'Property image'} 
              fill
              className="object-cover"
            />
            {image.isPrimary && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                Primary
              </div>
            )}
          </div>
        ))}
      </div>
      {isOwner && (
        <div className="mt-4">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => {
              // Example usage of onImagesChange to add a new image
              const newImage = {
                id: `new-${Date.now()}`,
                url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
                isPrimary: false,
                caption: 'New image'
              };
              onImagesChange([...images, newImage]);
            }}
          >
            Add Images
          </button>
        </div>
      )}
    </div>
  );
};

const TestGalleryPage = () => {
  const [images, setImages] = useState([
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      isPrimary: true,
      caption: 'Beautiful living room',
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      isPrimary: false,
      caption: 'Cozy bedroom',
    },
  ]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Image Gallery Test</h1>
      
      <div className="max-w-4xl mx-auto">
        <ImageGallery 
          propertyId="test-property" 
          images={images} 
          onImagesChange={setImages}
          isOwner={true}
        />
      </div>
      
      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Current Images State:</h2>
        <pre className="bg-gray-800 text-white p-4 rounded overflow-auto text-sm">
          {JSON.stringify(images, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TestGalleryPage;
