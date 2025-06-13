'use client';

import { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Image from 'next/image';
import Link from 'next/link';

// Placeholder for react-icons
const FaSearch = ({ className }: { className?: string }) => <span className={className || ''}>🔍</span>;
const FaMapMarkerAlt = ({ className }: { className?: string; size?: number }) => <span className={className || ''}>📍</span>;
const FaStar = ({ className }: { className?: string }) => <span className={className || ''}>★</span>;
const FaBed = ({ className }: { className?: string }) => <span className={className || ''}>🛏️</span>;
const FaBath = ({ className }: { className?: string }) => <span className={className || ''}>🛁</span>;
const FaUsers = ({ className }: { className?: string }) => <span className={className || ''}>👥</span>;
const FaWifi = ({ className }: { className?: string }) => <span className={className || ''}>📶</span>;
const FaSwimmingPool = ({ className }: { className?: string }) => <span className={className || ''}>🏊</span>;
const FaParking = ({ className }: { className?: string }) => <span className={className || ''}>🅿️</span>;
const FaTv = ({ className }: { className?: string }) => <span className={className || ''}>📺</span>;
const MdPets = ({ className }: { className?: string }) => <span className={className || ''}>🐾</span>;
const MdOutlineAir = ({ className }: { className?: string }) => <span className={className || ''}>❄️</span>;

// Mock property data
const mockProperties = [
  {
    id: 1,
    title: 'Luxury Beach Villa',
    description: 'Stunning beachfront villa with panoramic ocean views and private pool.',
    location: 'Miami, Florida',
    price: 299,
    rating: 4.9,
    reviews: 128,
    beds: 4,
    baths: 3,
    guests: 8,
    amenities: ['WiFi', 'Pool', 'Parking', 'Air Conditioning', 'TV'],
    image: '/images/property-1.jpg',
  },
  {
    id: 2,
    title: 'Mountain Retreat Cabin',
    description: 'Cozy cabin nestled in the mountains with breathtaking views and hot tub.',
    location: 'Aspen, Colorado',
    price: 189,
    rating: 4.8,
    reviews: 95,
    beds: 3,
    baths: 2,
    guests: 6,
    amenities: ['WiFi', 'Parking', 'Air Conditioning', 'TV'],
    image: '/images/property-2.jpg',
  },
  {
    id: 3,
    title: 'Modern Downtown Loft',
    description: 'Stylish loft in the heart of downtown with city views and modern amenities.',
    location: 'New York City, New York',
    price: 249,
    rating: 4.7,
    reviews: 112,
    beds: 2,
    baths: 2,
    guests: 4,
    amenities: ['WiFi', 'Parking', 'Air Conditioning', 'TV'],
    image: '/images/property-3.jpg',
  },
  {
    id: 4,
    title: 'Seaside Cottage',
    description: 'Charming cottage by the sea with direct beach access and beautiful sunsets.',
    location: 'Cape Cod, Massachusetts',
    price: 159,
    rating: 4.8,
    reviews: 87,
    beds: 2,
    baths: 1,
    guests: 4,
    amenities: ['WiFi', 'Parking', 'TV'],
    image: '/images/property-4.jpg',
  },
  {
    id: 5,
    title: 'Desert Oasis Villa',
    description: 'Modern villa with private pool and stunning desert views.',
    location: 'Palm Springs, California',
    price: 279,
    rating: 4.9,
    reviews: 76,
    beds: 3,
    baths: 2,
    guests: 6,
    amenities: ['WiFi', 'Pool', 'Parking', 'Air Conditioning', 'TV'],
    image: '/images/property-5.jpg',
  },
  {
    id: 6,
    title: 'Lakefront Cabin',
    description: 'Rustic cabin on the lake with private dock and beautiful views.',
    location: 'Lake Tahoe, Nevada',
    price: 199,
    rating: 4.7,
    reviews: 92,
    beds: 3,
    baths: 2,
    guests: 6,
    amenities: ['WiFi', 'Parking', 'TV'],
    image: '/images/property-6.jpg',
  },
];

// Define filter types
interface FilterState {
  location: string;
  price: { min: number; max: number };
  beds: number;
  baths: number;
  guests: number;
  amenities: string[];
  rating: number;
}

// Filter sidebar component
const FilterSidebar = ({ 
  filters, 
  setFilters 
}: { 
  filters: FilterState; 
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}) => {
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
    setFilters({
      ...filters,
      price: {
        ...filters.price,
        [type]: parseInt(e.target.value) || 0,
      },
    });
  };

  const handleAmenityChange = (amenity: string) => {
    const updatedAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter((a) => a !== amenity)
      : [...filters.amenities, amenity];

    setFilters({
      ...filters,
      amenities: updatedAmenities,
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>
      
      {/* Price Range */}
      <div className="mb-6">
        <h3 className="text-md font-medium mb-2">Price Range</h3>
        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="minPrice" className="block text-sm text-gray-600 mb-1">Min ($)</label>
            <input
              type="number"
              id="minPrice"
              value={filters.price.min}
              onChange={(e) => handlePriceChange(e, 'min')}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label htmlFor="maxPrice" className="block text-sm text-gray-600 mb-1">Max ($)</label>
            <input
              type="number"
              id="maxPrice"
              value={filters.price.max}
              onChange={(e) => handlePriceChange(e, 'max')}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
      </div>
      
      {/* Beds & Baths */}
      <div className="mb-6">
        <h3 className="text-md font-medium mb-2">Rooms</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="beds" className="block text-sm text-gray-600 mb-1">Beds</label>
            <select
              id="beds"
              value={filters.beds}
              onChange={(e) => setFilters({ ...filters, beds: parseInt(e.target.value) })}
              className="w-full p-2 border rounded-md"
            >
              <option value="0">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
            </select>
          </div>
          <div>
            <label htmlFor="baths" className="block text-sm text-gray-600 mb-1">Baths</label>
            <select
              id="baths"
              value={filters.baths}
              onChange={(e) => setFilters({ ...filters, baths: parseInt(e.target.value) })}
              className="w-full p-2 border rounded-md"
            >
              <option value="0">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Guests */}
      <div className="mb-6">
        <h3 className="text-md font-medium mb-2">Guests</h3>
        <select
          id="guests"
          value={filters.guests}
          onChange={(e) => setFilters({ ...filters, guests: parseInt(e.target.value) })}
          className="w-full p-2 border rounded-md"
        >
          <option value="0">Any</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="4">4+</option>
          <option value="6">6+</option>
          <option value="8">8+</option>
          <option value="10">10+</option>
        </select>
      </div>
      
      {/* Amenities */}
      <div className="mb-6">
        <h3 className="text-md font-medium mb-2">Amenities</h3>
        <div className="space-y-2">
          {['WiFi', 'Pool', 'Parking', 'Air Conditioning', 'TV', 'Pets Allowed'].map((amenity) => (
            <div key={amenity} className="flex items-center">
              <input
                type="checkbox"
                id={`amenity-${amenity}`}
                checked={filters.amenities.includes(amenity)}
                onChange={() => handleAmenityChange(amenity)}
                className="h-4 w-4 text-[#2957c3] focus:ring-[#2957c3] border-gray-300 rounded"
              />
              <label htmlFor={`amenity-${amenity}`} className="ml-2 block text-sm text-gray-600">
                {amenity}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Rating */}
      <div className="mb-6">
        <h3 className="text-md font-medium mb-2">Minimum Rating</h3>
        <select
          id="rating"
          value={filters.rating}
          onChange={(e) => setFilters({ ...filters, rating: parseFloat(e.target.value) })}
          className="w-full p-2 border rounded-md"
        >
          <option value="0">Any</option>
          <option value="3">3+</option>
          <option value="3.5">3.5+</option>
          <option value="4">4+</option>
          <option value="4.5">4.5+</option>
        </select>
      </div>
      
      {/* Reset Filters */}
      <button
        onClick={() => setFilters({
          location: '',
          price: { min: 0, max: 1000 },
          beds: 0,
          baths: 0,
          guests: 0,
          amenities: [],
          rating: 0,
        })}
        className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 font-medium"
      >
        Reset Filters
      </button>
    </div>
  );
};

// Property type interface
interface Property {
  id: number;
  title: string;
  description: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  beds: number;
  baths: number;
  guests: number;
  amenities: string[];
  image: string;
}

// Property card component
const PropertyCard = ({ property }: { property: Property }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative h-48">
        <Image
          src={property.image}
          alt={property.title}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900">{property.title}</h3>
          <div className="flex items-center">
            <FaStar className="text-yellow-500 mr-1" />
            <span className="text-gray-700">
              {property.rating} ({property.reviews})
            </span>
          </div>
        </div>
        
        <p className="text-gray-600 flex items-center mt-1">
          <FaMapMarkerAlt className="mr-1 text-gray-400" size={14} />
          {property.location}
        </p>
        
        <p className="mt-2 text-gray-600 line-clamp-2">{property.description}</p>
        
        <div className="mt-3 flex items-center text-gray-600 text-sm space-x-4">
          <div className="flex items-center">
            <FaBed className="mr-1" />
            <span>{property.beds} beds</span>
          </div>
          <div className="flex items-center">
            <FaBath className="mr-1" />
            <span>{property.baths} baths</span>
          </div>
          <div className="flex items-center">
            <FaUsers className="mr-1" />
            <span>{property.guests} guests</span>
          </div>
        </div>
        
        <div className="mt-3 flex flex-wrap gap-2">
          {property.amenities.slice(0, 3).map((amenity) => (
            <span key={amenity} className="inline-flex items-center px-2 py-1 bg-gray-100 text-xs rounded-full">
              {amenity === 'WiFi' && <FaWifi className="mr-1" />}
              {amenity === 'Pool' && <FaSwimmingPool className="mr-1" />}
              {amenity === 'Parking' && <FaParking className="mr-1" />}
              {amenity === 'Air Conditioning' && <MdOutlineAir className="mr-1" />}
              {amenity === 'TV' && <FaTv className="mr-1" />}
              {amenity === 'Pets Allowed' && <MdPets className="mr-1" />}
              {amenity}
            </span>
          ))}
          {property.amenities.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-xs rounded-full">
              +{property.amenities.length - 3} more
            </span>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-[#2957c3] font-semibold">
            ${property.price} <span className="text-gray-500 font-normal">/ night</span>
          </div>
          <Link
            href={`/properties/${property.id}` as any}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-[#2957c3] hover:bg-[#1e3c8a]"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    location: '',
    price: { min: 0, max: 1000 },
    beds: 0,
    baths: 0,
    guests: 0,
    amenities: [],
    rating: 0,
  });

  // Filter properties based on filters
  const filteredProperties = mockProperties.filter((property) => {
    // Filter by search query (location or title)
    if (
      searchQuery &&
      !property.location.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !property.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Filter by price range
    if (
      property.price < filters.price.min ||
      (filters.price.max > 0 && property.price > filters.price.max)
    ) {
      return false;
    }

    // Filter by beds
    if (filters.beds > 0 && property.beds < filters.beds) {
      return false;
    }

    // Filter by baths
    if (filters.baths > 0 && property.baths < filters.baths) {
      return false;
    }

    // Filter by guests
    if (filters.guests > 0 && property.guests < filters.guests) {
      return false;
    }

    // Filter by amenities
    if (
      filters.amenities.length > 0 &&
      !filters.amenities.every((amenity) => property.amenities.includes(amenity))
    ) {
      return false;
    }

    // Filter by rating
    if (filters.rating > 0 && property.rating < filters.rating) {
      return false;
    }

    return true;
  });

  return (
    <MainLayout>
      <div className="bg-gray-100 min-h-screen">
        {/* Search Header */}
        <div className="bg-[#2957c3] py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
              <div className="relative flex-grow mb-4 md:mb-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by location or property name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="py-2 px-4 bg-white text-[#2957c3] font-medium rounded-md hover:bg-gray-50"
              >
                Clear Search
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <div className="md:w-1/4">
              <FilterSidebar filters={filters} setFilters={setFilters} />
            </div>

            {/* Property Listings */}
            <div className="md:w-3/4">
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {filteredProperties.length} {filteredProperties.length === 1 ? 'Property' : 'Properties'} Found
                </h2>
                <div className="flex items-center">
                  <label htmlFor="sort" className="mr-2 text-gray-600">Sort by:</label>
                  <select
                    id="sort"
                    className="p-2 border rounded-md"
                    defaultValue="recommended"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rating</option>
                  </select>
                </div>
              </div>

              {filteredProperties.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties found</h3>
                  <p className="text-gray-600">
                    Try adjusting your filters or search criteria to find more properties.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
