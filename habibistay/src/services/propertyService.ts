import { Property, UserRole } from '@prisma/client';

const API_BASE_URL = '/api/properties';

// Common headers for API requests
const getHeaders = () => ({
  'Content-Type': 'application/json',
  // Authorization header will be added by the fetch interceptor
});

// Handle API errors
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Something went wrong');
    (error as any).status = response.status;
    throw error;
  }
  return response.json();
};

// Property type that matches our API
interface PropertyData {
  title: string;
  description: string;
  type: string;
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
  amenities: string[];
  houseRules?: string | null;
  cancellationPolicy?: string | null;
  isPublished?: boolean;
}

export const propertyService = {
  // Get all properties (with optional filters)
  async getProperties(filters: Record<string, any> = {}) {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const url = `${API_BASE_URL}?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    return handleResponse(response);
  },

  // Get a single property by ID
  async getPropertyById(id: string): Promise<Property> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    return handleResponse(response);
  },

  // Create a new property
  async createProperty(propertyData: PropertyData): Promise<Property> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(propertyData),
    });

    return handleResponse(response);
  },

  // Update an existing property
  async updateProperty(
    id: string,
    updates: Partial<PropertyData>
  ): Promise<Property> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });

    return handleResponse(response);
  },

  // Delete a property
  async deleteProperty(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || 'Failed to delete property');
      (error as any).status = response.status;
      throw error;
    }
  },

  // Get properties for the current user (host)
  async getUserProperties(): Promise<Property[]> {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      headers: getHeaders(),
    });

    return handleResponse(response);
  },

  // Toggle property published status
  async togglePublishStatus(id: string, isPublished: boolean): Promise<Property> {
    return this.updateProperty(id, { isPublished });
  },

  // Get property statistics (for host dashboard)
  async getPropertyStats(propertyId: string) {
    const response = await fetch(`${API_BASE_URL}/${propertyId}/stats`, {
      method: 'GET',
      headers: getHeaders(),
    });

    return handleResponse(response);
  },

  // Search properties with filters
  async searchProperties(filters: Record<string, any> = {}) {
    return this.getProperties(filters);
  },
};

export default propertyService;
