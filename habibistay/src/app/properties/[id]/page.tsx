'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
// Removing unused import: import Link from 'next/link';
import { useSession } from 'next-auth/react';
import MainLayout from '../../../components/layout/MainLayout';
import PropertyImageGallery from '../../../components/property/PropertyImageGallery';
import BookingForm from '../../../components/property/BookingForm';
import { toast } from 'sonner';

// Custom icon component to handle React Icons safely
type IconName = 'map-marker' | 'star' | 'star-o' | 'star-half' | 'info-circle' | 'share';

const Icon = ({ 
  name, 
  className = '',
  size = 5 
}: { 
  name: IconName,
  className?: string,
  size?: number
}) => {
  const sizeClass = `w-${size} h-${size}`;
  
  const icons: Record<IconName, React.ReactNode> = {
    'map-marker': '📍',
    'star': '★',
    'star-o': '☆',
    'star-half': '½',
    'info-circle': 'ⓘ',
    'share': '↗️'
  };

  return (
    <span className={`inline-block ${sizeClass} ${className}`}>
      {icons[name]}
    </span>
  );
};

// Define types for our property data
type Review = {
  id: number;
  user: {
    name: string;
    image: string;
  };
  rating: number;
  date: string;
  comment: string;
}

type Host = {
  name: string;
  avatar: string;
  isSuperhost: boolean;
  joinDate: string;
}

type HouseRule = {
  id: number;
  rule: string;
  icon: string;
}

// Must match ImageType in PropertyImageGallery
type Image = {
  id: string;
  publicId?: string;
  url: string;
  secureUrl: string;
  isPrimary: boolean;
  caption: string | null;
  width: number | null;
  height: number | null;
}

type Property = {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  price: number;
  cleaningFee?: number;
  serviceFee?: number;
  rating?: number;
  reviews?: Review[];
  images: Image[];
  amenities: string[];
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  beds: number;
  host?: Host;
  houseRules?: HouseRule[];
  checkInTime?: string;
  checkOutTime?: string;
  propertyType?: string;
}

// Star rating component with safe icon rendering
const StarRating = ({ rating }: { rating: number }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  // Create star elements with safe fallbacks
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <div key={`full-${i}`} className="text-yellow-400">
        <Icon name="star" className="text-yellow-400" />
      </div>
    );
  }
  
  if (hasHalfStar) {
    stars.push(
      <div key="half" className="text-yellow-400">
        <Icon name="star-half" className="text-yellow-400" />
      </div>
    );
  }
  
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <div key={`empty-${i}`} className="text-gray-300">
        <Icon name="star-o" className="text-gray-300" />
      </div>
    );
  }
  
  return <div className="flex space-x-1">{stars}</div>;
};

// Property details page
export default function PropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = Array.isArray(params?.id) ? params.id[0] : params?.id || '';
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [property, setProperty] = useState<Property | null>(null);
  const { } = useSession(); // Keep session hook for auth state

  useEffect(() => {
    // Function to fetch property data
    const fetchProperty = async () => {
      try {
        // In a real implementation, this would be an API call
        // For now, let's simulate a fetch with mock data
        const response = await fetch(`/api/properties/${propertyId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setProperty(null);
          } else {
            throw new Error('Failed to fetch property');
          }
        } else {
          const data = await response.json();
          setProperty(data);
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        toast.error('Failed to load property data');
      } finally {
        setIsLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  // Mock property data for demonstration (until real API endpoint is integrated)
  useEffect(() => {
    if (isLoading && !property) {
      // This is temporary mock data until we have a real API
      setTimeout(() => {
        setProperty({
          id: propertyId,
          title: 'Luxury Beach Villa',
          description: 'Stunning beachfront villa with panoramic ocean views and private pool. This spacious property features modern amenities, direct beach access, and is perfect for family vacations or special gatherings. Enjoy breathtaking sunsets from your private terrace and fall asleep to the sound of waves.',
          address: '123 Beach Road',
          city: 'Miami',
          country: 'USA',
          price: 299,
          cleaningFee: 150,
          serviceFee: 50,
          rating: 4.9,
          reviews: [
            {
              id: 1,
              user: {
                name: 'John Smith',
                image: '/images/user1.jpg',
              },
              rating: 5,
              date: '2025-04-15',
              comment: 'Amazing property with stunning views. The host was very responsive and accommodating. Would definitely stay here again!',
            },
            {
              id: 2,
              user: {
                name: 'Sarah Johnson',
                image: '/images/user2.jpg',
              },
              rating: 4,
              date: '2025-03-22',
              comment: 'Beautiful villa, great location. The only issue was the air conditioning in one of the bedrooms wasn\'t working properly, but the host quickly sent someone to fix it.',
            },
            {
              id: 3,
              user: {
                name: 'Michael Brown',
                image: '/images/user3.jpg',
              },
              rating: 5,
              date: '2025-02-10',
              comment: 'Perfect vacation spot! The villa is exactly as pictured, and the beach access is incredible. Kitchen was well-stocked and the beds were very comfortable.',
            },
          ],
          images: [
            {
              id: '1',
              url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
              secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
              isPrimary: true,
              caption: null,
              width: 1200,
              height: 800,
            },
            {
              id: '2',
              url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
              secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
              isPrimary: false,
              caption: null,
              width: 1200,
              height: 800,
            },
          ],
          amenities: ['WiFi', 'Pool', 'Parking', 'Air Conditioning', 'TV', 'Kitchen', 'Washer/Dryer', 'Beach Access', 'Balcony', 'BBQ Grill'],
          bedrooms: 4,
          bathrooms: 3,
          maxGuests: 8,
          beds: 4,
          host: {
            name: 'John Doe',
            avatar: '/images/host-avatar.jpg',
            isSuperhost: true,
            joinDate: '2020-05-15',
          },
          houseRules: [
            { id: 1, rule: 'No smoking', icon: 'no-smoking' },
            { id: 2, rule: 'No parties or events', icon: 'party' },
            { id: 3, rule: 'Check-in after 3:00 PM', icon: 'check-in' },
            { id: 4, rule: 'Checkout before 11:00 AM', icon: 'check-out' },
          ],
          checkInTime: '3:00 PM',
          checkOutTime: '11:00 AM',
          propertyType: 'Entire villa',
        });
        setIsLoading(false);
      }, 1000);
    }
  }, [isLoading, propertyId, property]);
  
  // Handle save property
  const handleSaveProperty = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSaved(!isSaved);
    toast(isSaved ? 'Removed from saved properties' : 'Property saved to your wishlist!');
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-[500px] bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div className="md:col-span-2 space-y-6">
                <div className="bg-gray-200 h-64 rounded"></div>
                <div className="bg-gray-200 h-64 rounded"></div>
              </div>
              <div className="bg-gray-200 h-96 rounded"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!property) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Property not found</h1>
          <button 
            onClick={() => router.push('/search' as any)}
            className="text-blue-500 hover:underline mt-4 inline-block bg-transparent border-none cursor-pointer p-0"
          >
            Browse Properties
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        {/* Property header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
          <div className="flex flex-wrap items-center justify-between mt-2">
            <div className="flex items-center mr-6 mt-2">
              {property.rating && (
                <div className="flex items-center text-gray-700">
                  <Icon name="star" className="text-yellow-500 mr-1" size={4} />
                  <span>{property.rating.toFixed(1)}</span>
                  {property.reviews && (
                    <>
                      <span className="mx-1">·</span>
                      <span>{property.reviews.length} reviews</span>
                    </>
                  )}
                </div>
              )}
              <span className="mx-2">•</span>
              <div className="flex items-center text-gray-700">
                <Icon name="map-marker" className="text-gray-500 mr-2" size={4} />
                <span>{property.city}, {property.country}</span>
              </div>
            </div>
            <div className="flex space-x-4 mt-2">
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: property.title,
                      text: `Check out this property in ${property.city}, ${property.country}`,
                      url: window.location.href,
                    }).catch(console.error);
                  } else {
                    // Fallback for browsers that don't support Web Share API
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied to clipboard!');
                  }
                }}
                className="flex items-center text-gray-700 hover:text-gray-900"
                aria-label="Share property"
              >
                <Icon name="share" className="text-gray-500 mr-1" size={4} />
                Share
              </button>
              <button 
                onClick={handleSaveProperty}
                className={`flex items-center ${isSaved ? 'text-red-500' : 'text-gray-700 hover:text-gray-900'}`}
                aria-label={isSaved ? 'Remove from saved' : 'Save property'}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-1" 
                  fill={isSaved ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                  />
                </svg>
                {isSaved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Image gallery */}
        <div className="mb-8">
          <PropertyImageGallery images={property.images} propertyId={property.id} />
        </div>

        {/* Property details */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left column */}
          <div className="md:w-2/3">
            {/* Property info */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">{property.title}</h2>
                {property.rating && (
                  <div className="flex items-center">
                    <Icon name="star" className="text-yellow-500 mr-1" size={4} />
                    <span className="font-semibold">{property.rating.toFixed(1)}</span>
                    {property.reviews && (
                      <span className="text-gray-500 ml-1">({property.reviews.length})</span>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-b border-gray-100 py-6 my-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-gray-500 text-sm">Bedrooms</div>
                    <div className="font-medium">{property.bedrooms}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500 text-sm">Bathrooms</div>
                    <div className="font-medium">{property.bathrooms}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500 text-sm">Guests</div>
                    <div className="font-medium">{property.maxGuests}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500 text-sm">Beds</div>
                    <div className="font-medium">{property.beds}</div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">About this property</h3>
                <p className="text-gray-700">{property.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Amenities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {property.houseRules && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">House rules</h3>
                  <div className="space-y-2">
                    {property.houseRules.map((rule) => (
                      <div key={rule.id} className="flex items-start">
                        <span className="text-gray-500 mr-2">•</span>
                        <span>{rule.rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reviews */}
            {property.reviews && property.reviews.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-2xl font-semibold mb-6">
                  <Icon name="star" className="text-yellow-500 mr-1" size={4} />
                  {property.rating?.toFixed(1)} · {property.reviews.length} reviews
                </h2>

                <div className="space-y-8">
                  {property.reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                      <div className="flex items-center mb-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                          {review.user.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">{review.user.name}</div>
                          <div className="text-sm text-gray-500">{review.date}</div>
                        </div>
                      </div>
                      <div className="mb-2">
                        <StarRating rating={review.rating} />
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Host info */}
            {property.host && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start">
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl text-gray-500 font-medium">
                    {property.host.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">Hosted by {property.host.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">Joined in {property.host.joinDate}</p>
                    {property.host.isSuperhost && (
                      <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Icon name="star" className="mr-1" size={3} />
                        Superhost
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="font-medium mb-2">During your stay</h4>
                  <p className="text-gray-600 text-sm">
                    I'm happy to help with anything you need during your stay. Don't hesitate to reach out if you have any questions or need recommendations!
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="font-medium mb-2">Response rate: 100%</h4>
                  <p className="text-gray-600 text-sm">
                    Typically responds within an hour
                  </p>
                </div>

                <button className="mt-6 w-full bg-white border border-gray-300 rounded-md py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Contact host
                </button>
              </div>
            )}
          </div>

          {/* Right column - Booking widget */}
          <div className="md:w-1/3">
            <BookingForm 
              property={{
                id: property.id,
                title: property.title,
                price: property.price,
                cleaningFee: property.cleaningFee,
                serviceFee: property.serviceFee,
                maxGuests: property.maxGuests
              }} 
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
