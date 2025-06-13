import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Property, PropertyType, Amenity } from '@prisma/client';
import { propertyService } from '@/services/propertyService';

interface PropertyFormData {
  title: string;
  description: string;
  type: PropertyType;
  price: number;
  cleaningFee?: number | null;
  serviceFee?: number | null;
  address: string;
  city: string;
  state?: string | null;
  zipCode?: string | null;
  country: string;
  lat?: number | null;
  lng?: number | null;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  maxGuests: number;
  amenities: Amenity[];
  houseRules?: string | null;
  cancellationPolicy?: string | null;
  isPublished: boolean;
}

const initialFormData: PropertyFormData = {
  title: '',
  description: '',
  type: 'APARTMENT',
  price: 0,
  cleaningFee: null,
  serviceFee: null,
  address: '',
  city: '',
  state: null,
  zipCode: null,
  country: '',
  lat: null,
  lng: null,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  maxGuests: 1,
  amenities: [],
  houseRules: null,
  cancellationPolicy: null,
  isPublished: false,
};

export const usePropertyForm = (initialProperty?: Partial<Property>) => {
  const router = useRouter();
  const [formData, setFormData] = useState<PropertyFormData>({
    ...initialFormData,
    ...initialProperty,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(!!initialProperty?.id);

  // Update form data when initialProperty changes
  useEffect(() => {
    if (initialProperty?.id) {
      setFormData(prev => ({
        ...initialFormData,
        ...initialProperty,
        // Ensure numeric fields are numbers
        price: Number(initialProperty.price) || 0,
        cleaningFee: initialProperty.cleaningFee ? Number(initialProperty.cleaningFee) : null,
        serviceFee: initialProperty.serviceFee ? Number(initialProperty.serviceFee) : null,
        bedrooms: Number(initialProperty.bedrooms) || 1,
        beds: Number(initialProperty.beds) || 1,
        bathrooms: Number(initialProperty.bathrooms) || 1,
        maxGuests: Number(initialProperty.maxGuests) || 1,
        // Ensure arrays are properly typed
        amenities: Array.isArray(initialProperty.amenities) 
          ? initialProperty.amenities 
          : [],
      }));
      setIsEditMode(true);
    }
  }, [initialProperty]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      
      // Handle different input types
      let parsedValue: any = value;
      
      if (type === 'number') {
        parsedValue = value === '' ? null : Number(value);
      } else if (type === 'checkbox') {
        const target = e.target as HTMLInputElement;
        parsedValue = target.checked;
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: parsedValue,
      }));
    },
    []
  );

  const handleAmenityChange = useCallback((amenity: Amenity, isChecked: boolean) => {
    setFormData(prev => {
      const amenities = new Set(prev.amenities || []);
      
      if (isChecked) {
        amenities.add(amenity);
      } else {
        amenities.delete(amenity);
      }
      
      return {
        ...prev,
        amenities: Array.from(amenities),
      };
    });
  }, []);

  const handleLocationChange = useCallback((address: string, lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      address,
      lat,
      lng,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError(null);

      try {
        // Basic validation
        if (!formData.title || !formData.description || !formData.address) {
          throw new Error('Please fill in all required fields');
        }

        if (formData.price <= 0) {
          throw new Error('Price must be greater than 0');
        }

        // Prepare the data for submission
        const submissionData = {
          ...formData,
          // Ensure numeric fields are numbers
          price: Number(formData.price),
          cleaningFee: formData.cleaningFee ? Number(formData.cleaningFee) : null,
          serviceFee: formData.serviceFee ? Number(formData.serviceFee) : null,
          bedrooms: Number(formData.bedrooms) || 1,
          beds: Number(formData.beds) || 1,
          bathrooms: Number(formData.bathrooms) || 1,
          maxGuests: Number(formData.maxGuests) || 1,
        };

        let result;
        
        if (isEditMode && initialProperty?.id) {
          // Update existing property
          result = await propertyService.updateProperty(initialProperty.id, submissionData);
        } else {
          // Create new property
          result = await propertyService.createProperty(submissionData);
        }

        // Redirect to the property page or dashboard
        router.push(`/host/properties/${result.id}`);
        
        return result;
      } catch (err) {
        console.error('Error saving property:', err);
        setError(err instanceof Error ? err.message : 'Failed to save property');
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, isEditMode, initialProperty, router]
  );

  const handleDelete = useCallback(async () => {
    if (!isEditMode || !initialProperty?.id) return;
    
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await propertyService.deleteProperty(initialProperty.id);
      
      // Redirect to properties list after deletion
      router.push('/host/properties');
    } catch (err) {
      console.error('Error deleting property:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete property');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [isEditMode, initialProperty, router]);

  return {
    formData,
    isSubmitting,
    error,
    isEditMode,
    handleChange,
    handleAmenityChange,
    handleLocationChange,
    handleSubmit,
    handleDelete,
    setFormData,
  };
};

export default usePropertyForm;
