'use client';

import React, { useState } from 'react';
import { Star, StarOff } from 'lucide-react';

interface FeaturedPropertyToggleProps {
  propertyId: string;
  initialFeatured: boolean;
}

/**
 * Toggle button for admins to mark properties as featured for the Sara chatbot
 */
export default function FeaturedPropertyToggle({ propertyId, initialFeatured }: FeaturedPropertyToggleProps) {
  const [isFeatured, setIsFeatured] = useState(initialFeatured);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFeatured = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/properties/featured', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          isFeatured: !isFeatured,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update featured status');
      }

      setIsFeatured(!isFeatured);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error toggling featured status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="inline-flex items-center">
      <button
        onClick={toggleFeatured}
        disabled={isLoading}
        className={`relative p-2 rounded-full transition-colors ${
          isFeatured 
            ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isFeatured ? 'Remove from featured properties' : 'Add to featured properties'}
      >
        {isFeatured ? <Star className="w-5 h-5 fill-amber-500" /> : <StarOff className="w-5 h-5" />}
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 rounded-full">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
        )}
      </button>
      
      {error && (
        <div className="ml-2 text-xs text-red-500">{error}</div>
      )}
    </div>
  );
}
