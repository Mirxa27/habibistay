import Link from 'next/link';
import Image from 'next/image';
import MainLayout from '../components/layout/MainLayout';
// Placeholder for react-icons
const FaSearch = ({ className }: { className?: string }) => (
  <span className={className || ''}>🔍</span>
);

const FaMapMarkerAlt = ({ className }: { className?: string }) => (
  <span className={className || ''}>📍</span>
);

const FaCalendarAlt = ({ className }: { className?: string }) => (
  <span className={className || ''}>📅</span>
);

const FaUser = ({ className }: { className?: string }) => (
  <span className={className || ''}>👤</span>
);

// Hero section with search functionality
const HeroSection = () => {
  return (
    <div className="relative h-[600px] w-full">
      <div className="absolute inset-0">
        <Image
          src="/images/hero-image.jpg"
          alt="Beautiful vacation rental"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      </div>
      <div className="relative flex flex-col items-center justify-center h-full text-white px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
          Find Your Perfect Stay with Habibistay
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-center max-w-3xl">
          Discover unique accommodations and experiences around the world
        </p>
        
        {/* Search form */}
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaMapMarkerAlt className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Where are you going?"
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-[#2957c3] focus:ring-[#2957c3]"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaCalendarAlt className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Check in"
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-[#2957c3] focus:ring-[#2957c3]"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaCalendarAlt className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Check out"
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-[#2957c3] focus:ring-[#2957c3]"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Guests"
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-[#2957c3] focus:ring-[#2957c3]"
              />
            </div>
          </div>
          <div className="mt-4">
            <Link 
              href={'/search' as any}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#2957c3] hover:bg-[#1e3c8a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2957c3]"
            >
              <FaSearch className="mr-2" /> Search
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Featured properties section
const FeaturedProperties = () => {
  // Mock data for featured properties
  const featuredProperties = [
    {
      id: 1,
      title: 'Luxury Beach Villa',
      location: 'Miami, Florida',
      price: 299,
      rating: 4.9,
      reviews: 128,
      image: '/images/property-1.jpg',
    },
    {
      id: 2,
      title: 'Mountain Retreat Cabin',
      location: 'Aspen, Colorado',
      price: 189,
      rating: 4.8,
      reviews: 95,
      image: '/images/property-2.jpg',
    },
    {
      id: 3,
      title: 'Modern Downtown Loft',
      location: 'New York City, New York',
      price: 249,
      rating: 4.7,
      reviews: 112,
      image: '/images/property-3.jpg',
    },
    {
      id: 4,
      title: 'Seaside Cottage',
      location: 'Cape Cod, Massachusetts',
      price: 159,
      rating: 4.8,
      reviews: 87,
      image: '/images/property-4.jpg',
    },
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Featured Properties</h2>
          <p className="mt-4 text-xl text-gray-600">
            Discover our handpicked selection of exceptional accommodations
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProperties.map((property) => (
            <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative h-48">
                <Image
                  src={property.image}
                  alt={property.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900">{property.title}</h3>
                <p className="text-gray-600 flex items-center mt-1">
                  <FaMapMarkerAlt className="mr-1 text-gray-400" />
                  {property.location}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-[#2957c3] font-semibold">
                    ${property.price} <span className="text-gray-500 font-normal">/ night</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 text-gray-700">
                      {property.rating} ({property.reviews})
                    </span>
                  </div>
                </div>
                <Link
                  href={`/properties/${property.id}` as any}
                  className="mt-4 block w-full text-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-[#2957c3] hover:bg-[#1e3c8a]"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href={'/search' as any}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#2957c3] hover:bg-[#1e3c8a]"
          >
            Explore All Properties
          </Link>
        </div>
      </div>
    </div>
  );
};

// How it works section
const HowItWorks = () => {
  const steps = [
    {
      id: 1,
      title: 'Find the Perfect Stay',
      description: 'Search through thousands of listings to find your ideal accommodation.',
      icon: '🔍',
    },
    {
      id: 2,
      title: 'Book with Confidence',
      description: 'Secure your reservation with our safe and easy booking system.',
      icon: '📅',
    },
    {
      id: 3,
      title: 'Enjoy Your Experience',
      description: 'Arrive and enjoy a comfortable, memorable stay at your chosen property.',
      icon: '🏠',
    },
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
          <p className="mt-4 text-xl text-gray-600">
            Your journey to the perfect stay is just three simple steps away
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.id} className="text-center">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-[#eef2ff] text-3xl">
                {step.icon}
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Sara AI Assistant section
const SaraAssistant = () => {
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 bg-[#2957c3] text-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
        <div className="md:w-1/2 mb-8 md:mb-0">
          <h2 className="text-3xl font-bold">Meet Sara, Your AI Travel Assistant</h2>
          <p className="mt-4 text-lg text-blue-100">
            Sara helps you find the perfect property, answer your questions, and guide you through the booking process.
          </p>
          <button className="mt-6 px-6 py-3 bg-white text-[#2957c3] font-semibold rounded-md hover:bg-gray-100 transition-colors">
            Chat with Sara
          </button>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <div className="relative w-64 h-64 rounded-full bg-blue-700 flex items-center justify-center">
            <span className="text-6xl">👩‍💼</span>
            <div className="absolute -bottom-4 left-0 right-0 mx-auto w-48 bg-white text-[#2957c3] text-center py-2 rounded-full font-semibold">
              How can I help you?
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Investor section
const InvestorSection = () => {
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Invest in Habibistay Properties</h2>
          <p className="mt-4 text-xl text-gray-300">
            Earn up to 17% ROI with our curated property investment opportunities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-4xl font-bold text-[#FFA726] mb-2">17%</div>
            <div className="text-gray-300">Average ROI</div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-4xl font-bold text-[#FFA726] mb-2">100%</div>
            <div className="text-gray-300">End-to-End Management</div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-4xl font-bold text-[#FFA726] mb-2">500+</div>
            <div className="text-gray-300">Properties in Portfolio</div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-4xl font-bold text-[#FFA726] mb-2">24/7</div>
            <div className="text-gray-300">Transparency & Support</div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href={'/investor' as any}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-gray-900 bg-[#FFA726] hover:bg-yellow-500"
          >
            Learn About Investing
          </Link>
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  return (
    <MainLayout>
      <HeroSection />
      <FeaturedProperties />
      <HowItWorks />
      <SaraAssistant />
      <InvestorSection />
    </MainLayout>
  );
}
