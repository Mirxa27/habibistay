'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';

// Define types that would normally come from Prisma
type PropertyType = 
  | 'APARTMENT' | 'HOUSE' | 'VILLA' | 'CABIN' 
  | 'BEACH_HOUSE' | 'COUNTRY_HOUSE' | 'LOFT' | 'TINY_HOUSE' 
  | 'BED_AND_BREAKFAST' | 'BOAT' | 'CAMPER' | 'LUXURY';

type Amenity = 
  | 'WIFI' | 'KITCHEN' | 'WASHER' | 'DRYER' 
  | 'AIR_CONDITIONING' | 'HEATING' | 'TV' | 'IRON'
  | 'WORKSPACE' | 'POOL' | 'HOT_TUB' | 'PARKING'
  | 'GRILL' | 'GYM' | 'BREAKFAST' | 'SMOKE_ALARM'
  | 'FIRST_AID_KIT' | 'FIRE_EXTINGUISHER' | 'CARBON_MONOXIDE_ALARM';

// Placeholder icon components
const IconComponent = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <span className={`inline-block ${className || ''}`} style={{ width: '1em', height: '1em' }}>{children}</span>
);

const Loader2 = ({ className }: { className?: string }) => <IconComponent className={className}>🔄</IconComponent>;
const MapPin = ({ className }: { className?: string }) => <IconComponent className={className}>📍</IconComponent>;
const Trash2 = ({ className }: { className?: string }) => <IconComponent className={className}>🗑️</IconComponent>;

// Define the property types
const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'HOUSE', label: 'House' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'CABIN', label: 'Cabin' },
  { value: 'BEACH_HOUSE', label: 'Beach House' },
  { value: 'COUNTRY_HOUSE', label: 'Country House' },
  { value: 'LOFT', label: 'Loft' },
  { value: 'TINY_HOUSE', label: 'Tiny House' },
  { value: 'BED_AND_BREAKFAST', label: 'Bed & Breakfast' },
  { value: 'BOAT', label: 'Boat' },
  { value: 'CAMPER', label: 'Camper/RV' },
  { value: 'LUXURY', label: 'Luxury' },
];

// Define the amenities
const AMENITIES: { value: Amenity; label: string }[] = [
  { value: 'WIFI', label: 'WiFi' },
  { value: 'KITCHEN', label: 'Kitchen' },
  { value: 'WASHER', label: 'Washer' },
  { value: 'DRYER', label: 'Dryer' },
  { value: 'AIR_CONDITIONING', label: 'Air Conditioning' },
  { value: 'HEATING', label: 'Heating' },
  { value: 'TV', label: 'TV' },
  { value: 'IRON', label: 'Iron' },
  { value: 'WORKSPACE', label: 'Workspace' },
  { value: 'POOL', label: 'Pool' },
  { value: 'HOT_TUB', label: 'Hot Tub' },
  { value: 'PARKING', label: 'Free Parking' },
  { value: 'GRILL', label: 'BBQ Grill' },
  { value: 'GYM', label: 'Gym' },
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'SMOKE_ALARM', label: 'Smoke Alarm' },
  { value: 'FIRST_AID_KIT', label: 'First Aid Kit' },
  { value: 'FIRE_EXTINGUISHER', label: 'Fire Extinguisher' },
  { value: 'CARBON_MONOXIDE_ALARM', label: 'Carbon Monoxide Alarm' },
];

// Simple placeholder components for form elements
const Label = ({ htmlFor, children, className }: { htmlFor?: string, children: React.ReactNode, className?: string }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 ${className || ''}`}>{children}</label>
);

const Input = ({ id, type = 'text', error, ...props }: { id?: string, type?: string, error?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    id={id}
    type={type}
    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${error ? 'border-red-500' : ''}`}
    {...props}
  />
);

const Textarea = ({ id, rows = 3, error, ...props }: { id?: string, rows?: number, error?: boolean } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    id={id}
    rows={rows}
    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${error ? 'border-red-500' : ''}`}
    {...props}
  />
);

const Checkbox = ({ id, checked, onCheckedChange, ...props }: { id?: string, checked?: boolean, onCheckedChange?: (checked: boolean) => void } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    type="checkbox"
    id={id}
    checked={checked}
    onChange={(e) => onCheckedChange?.(e.target.checked)}
    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
    {...props}
  />
);

// Simplified form types
type PropertyFormValues = {
  title: string;
  description: string;
  type: PropertyType;
  price: number;
  cleaningFee: number | null;
  serviceFee: number | null;
  address: string;
  city: string;
  state: string | null;
  zipCode: string | null;
  country: string;
  lat: number | null;
  lng: number | null;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  maxGuests: number;
  amenities: Amenity[];
  houseRules: string | null;
  cancellationPolicy: string | null;
  isPublished: boolean;
};

interface Property {
  id: string;
  [key: string]: any;
}

interface PropertyFormProps {
  property?: Partial<Property>;
  onSubmit?: (data: PropertyFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}

export const PropertyForm: React.FC<PropertyFormProps> = ({
  property,
  onSubmit: onSubmitProp,
  onDelete: onDeleteProp,
  isSubmitting: isSubmittingProp = false,
  error: errorProp = null,
}) => {
  // Simplified state management instead of react-hook-form
  const [formData, setFormData] = useState<PropertyFormValues>({
    title: property?.title || '',
    description: property?.description || '',
    type: property?.type as PropertyType || 'APARTMENT',
    price: property?.price || 0,
    cleaningFee: property?.cleaningFee || null,
    serviceFee: property?.serviceFee || null,
    address: property?.address || '',
    city: property?.city || '',
    state: property?.state || null,
    zipCode: property?.zipCode || null,
    country: property?.country || '',
    lat: property?.lat || null,
    lng: property?.lng || null,
    bedrooms: property?.bedrooms || 1,
    beds: property?.beds || 1,
    bathrooms: property?.bathrooms || 1,
    maxGuests: property?.maxGuests || 1,
    amenities: (property?.amenities as Amenity[]) || [],
    houseRules: property?.houseRules || null,
    cancellationPolicy: property?.cancellationPolicy || null,
    isPublished: property?.isPublished || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditMode = !!property?.id;

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: any = value;
    
    // Handle numeric values
    if (type === 'number') {
      parsedValue = value ? Number(value) : 0;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  // Handle checkbox change
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle amenity change
  const handleAmenityChange = (amenity: Amenity, checked: boolean) => {
    setFormData(prev => {
      const currentAmenities = [...(prev.amenities || [])];
      
      if (checked && !currentAmenities.includes(amenity)) {
        return { ...prev, amenities: [...currentAmenities, amenity] };
      } else if (!checked && currentAmenities.includes(amenity)) {
        return { 
          ...prev, 
          amenities: currentAmenities.filter(a => a !== amenity) 
        };
      }
      
      return prev;
    });
  };

  // Simplified validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.country) newErrors.country = 'Country is required';
    if (!formData.bedrooms || formData.bedrooms < 1) newErrors.bedrooms = 'At least 1 bedroom is required';
    if (!formData.beds || formData.beds < 1) newErrors.beds = 'At least 1 bed is required';
    if (!formData.bathrooms || formData.bathrooms < 1) newErrors.bathrooms = 'At least 1 bathroom is required';
    if (!formData.maxGuests || formData.maxGuests < 1) newErrors.maxGuests = 'At least 1 guest is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (onSubmitProp) {
      await onSubmitProp(formData);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (onDeleteProp) {
      await onDeleteProp();
    }
  };

  // We've removed the Maps API loading for simplification

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorProp && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{errorProp}</p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Beautiful apartment in the city center"
              error={!!errors.title}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div className="col-span-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe your property in detail..."
              error={!!errors.description}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="type">Property Type *</Label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {PROPERTY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="price">Price per night ($) *</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="1"
              value={formData.price}
              onChange={handleChange}
              error={!!errors.price}
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price}</p>
            )}
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Location</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="address">Address *</Label>
            <div className="relative">
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter a location"
                error={!!errors.address}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">
                {errors.address}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                error={!!errors.city}
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.city}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                name="state"
                value={formData.state || ''}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="zipCode">ZIP/Postal Code</Label>
              <Input
                id="zipCode"
                name="zipCode"
                value={formData.zipCode || ''}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                error={!!errors.country}
              />
              {errors.country && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.country}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="bedrooms">Bedrooms *</Label>
            <Input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min="1"
              step="1"
              value={formData.bedrooms}
              onChange={handleChange}
              error={!!errors.bedrooms}
            />
            {errors.bedrooms && (
              <p className="mt-1 text-sm text-red-600">
                {errors.bedrooms}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="beds">Beds *</Label>
            <Input
              id="beds"
              name="beds"
              type="number"
              min="1"
              step="1"
              value={formData.beds}
              onChange={handleChange}
              error={!!errors.beds}
            />
            {errors.beds && (
              <p className="mt-1 text-sm text-red-600">
                {errors.beds}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="bathrooms">Bathrooms *</Label>
            <Input
              id="bathrooms"
              name="bathrooms"
              type="number"
              min="1"
              step="0.5"
              value={formData.bathrooms}
              onChange={handleChange}
              error={!!errors.bathrooms}
            />
            {errors.bathrooms && (
              <p className="mt-1 text-sm text-red-600">
                {errors.bathrooms}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="maxGuests">Max Guests *</Label>
            <Input
              id="maxGuests"
              name="maxGuests"
              type="number"
              min="1"
              step="1"
              value={formData.maxGuests}
              onChange={handleChange}
              error={!!errors.maxGuests}
            />
            {errors.maxGuests && (
              <p className="mt-1 text-sm text-red-600">
                {errors.maxGuests}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Amenities</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {AMENITIES.map((amenity) => (
            <div key={amenity.value} className="flex items-center space-x-2">
              <Checkbox
                id={`amenity-${amenity.value}`}
                checked={formData.amenities?.includes(amenity.value)}
                onCheckedChange={(checked) =>
                  handleAmenityChange(amenity.value, checked)
                }
              />
              <Label htmlFor={`amenity-${amenity.value}`} className="text-sm">
                {amenity.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">
          Additional Information
        </h2>
        
        <div className="space-y-6">
          <div>
            <Label htmlFor="cleaningFee">Cleaning Fee ($)</Label>
            <Input
              id="cleaningFee"
              name="cleaningFee"
              type="number"
              min="0"
              step="1"
              value={formData.cleaningFee || ''}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label htmlFor="serviceFee">Service Fee ($)</Label>
            <Input
              id="serviceFee"
              name="serviceFee"
              type="number"
              min="0"
              step="1"
              value={formData.serviceFee || ''}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label htmlFor="houseRules">House Rules</Label>
            <Textarea
              id="houseRules"
              name="houseRules"
              value={formData.houseRules || ''}
              onChange={handleChange}
              rows={3}
              placeholder="Any house rules guests should know about..."
            />
          </div>

          <div>
            <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
            <Textarea
              id="cancellationPolicy"
              name="cancellationPolicy"
              value={formData.cancellationPolicy || ''}
              onChange={handleChange}
              rows={3}
              placeholder="Your cancellation policy..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublished"
              checked={formData.isPublished}
              onCheckedChange={(checked) =>
                handleCheckboxChange('isPublished', checked)
              }
            />
            <Label htmlFor="isPublished" className="text-sm">
              Publish this listing
            </Label>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-between items-center pt-6">
        <div>
          {isEditMode && (
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded flex items-center"
              onClick={handleDelete}
              disabled={isSubmittingProp}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Property
            </Button>
          )}
        </div>
        
        <div className="flex space-x-4">
          <Button
            type="button"
            className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-4 py-2 rounded"
            onClick={() => window.history.back()}
            disabled={isSubmittingProp}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmittingProp}
            className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded flex items-center"
          >
            {isSubmittingProp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : isEditMode ? (
              'Update Property'
            ) : (
              'Create Property'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default PropertyForm;
