# Image Upload Functionality

This document outlines the image upload functionality for the HabibiStay application, including API endpoints, components, and usage examples.

## Features

- Upload multiple images to a property
- Set a primary image
- Add/edit captions for images
- Delete images
- Responsive image gallery with thumbnails
- Role-based access control
- Image optimization and resizing

## API Endpoints

### 1. Upload Images

**Endpoint:** `POST /api/properties/:propertyId/images`

Upload one or more images to a property.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: 
  - `files`: One or more image files
  - `isPrimary` (optional): Set to `true` to mark an image as primary
  - `caption_0`, `caption_1`, etc. (optional): Captions for each image

**Response:**
```json
{
  "message": "Images uploaded successfully",
  "data": [
    {
      "id": "image-123",
      "url": "https://res.cloudinary.com/.../image.jpg",
      "isPrimary": true,
      "caption": "Living room view"
    }
  ]
}
```

### 2. Get Property Images

**Endpoint:** `GET /api/properties/:propertyId/images`

Get all images for a property.

**Response:**
```json
{
  "data": [
    {
      "id": "image-123",
      "url": "https://res.cloudinary.com/.../image.jpg",
      "isPrimary": true,
      "caption": "Living room view",
      "width": 1200,
      "height": 800,
      "format": "jpg",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### 3. Delete Image

**Endpoint:** `DELETE /api/properties/:propertyId/images/:imageId`

Delete an image from a property.

**Response:**
```json
{
  "message": "Image deleted successfully"
}
```

### 4. Set Primary Image

**Endpoint:** `PUT /api/properties/:propertyId/images/:imageId/set-primary`

Set an image as the primary image for a property.

**Response:**
```json
{
  "message": "Primary image updated successfully"
}
```

### 5. Update Image Caption

**Endpoint:** `PATCH /api/properties/:propertyId/images/:imageId/caption`

Update the caption for an image.

**Request:**
```json
{
  "caption": "Updated caption text"
}
```

**Response:**
```json
{
  "message": "Image caption updated successfully",
  "data": {
    "id": "image-123",
    "caption": "Updated caption text",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

## React Components

### ImageGallery

A reusable component for displaying and managing property images.

```tsx
import { ImageGallery } from '@/components/properties/ImageGallery';

function PropertyPage({ property }) {
  const [images, setImages] = useState(property.images || []);
  
  return (
    <div>
      <ImageGallery
        propertyId={property.id}
        images={images}
        onImagesChange={setImages}
        isOwner={isPropertyOwner}
      />
    </div>
  );
}
```

#### Props

- `propertyId` (string, required): ID of the property
- `images` (array, required): Array of image objects
- `onImagesChange` (function): Callback when images are updated
- `isOwner` (boolean): Whether the current user is the property owner
- `className` (string): Additional CSS classes

### useImageUpload Hook

A custom hook for handling image uploads and management.

```tsx
import { useImageUpload } from '@/hooks/useImageUpload';

function MyComponent() {
  const { 
    uploadImages, 
    deleteImage, 
    setPrimaryImage, 
    updateCaption,
    isUploading,
    progress 
  } = useImageUpload();
  
  // Example usage:
  const handleUpload = async (files) => {
    const result = await uploadImages('property-123', files);
    if (result.success) {
      console.log('Upload successful', result.data);
    }
  };
}
```

## Environment Variables

Make sure these environment variables are set in your `.env.local` file:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_FOLDER=habibistay/properties
```

## Error Handling

All API endpoints return appropriate HTTP status codes and error messages in the response body:

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User doesn't have permission
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Security Considerations

- File type validation is performed on the server
- Images are stored in a secure Cloudinary folder
- Only property owners and admins can modify images
- File size limits are enforced
- Image URLs are served over HTTPS

## Performance

- Images are automatically optimized and resized by Cloudinary
- Lazy loading is implemented for better performance
- Responsive images with appropriate sizes
- Caching headers are set for optimal performance
