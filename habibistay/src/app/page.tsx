import Link from 'next/link';
import Image from 'next/image';
import { FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaUser, FaStar, FaHeart, FaShieldAlt, FaHeadset, FaGlobe } from 'react-icons/fa';
import MainLayout from '@/components/layout/MainLayout';

// Types
interface FeaturedProperty {
  id: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  amenities: string[];
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
}

// Hero section with search functionality
const HeroSection = () => {
  return (
    <section className="relative h-[600px] w-full">
      <div className="absolute inset-0">
        <Image
          src="/images/hero-image.jpg"
          alt="Beautiful vacation rental with modern amenities"
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
          <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaMapMarkerAlt className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Where are you going?"
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-[#2957c3] focus:ring-[#2957c3]"
                aria-label="Destination"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaCalendarAlt className="text-gray-400" />
              </div>
              <input
                type="date"
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-[#2957c3] focus:ring-[#2957c3]"
                aria-label="Check-in date"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaCalendarAlt className="text-gray-400" />
              </div>
              <input
                type="date"
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-[#2957c3] focus:ring-[#2957c3]"
                aria-label="Check-out date"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-400" />
              </div>
              <select
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-[#2957c3] focus:ring-[#2957c3]"
                aria-label="Number of guests"
              >
                <option value="">Guests</option>
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
                <option value="5+">5+ Guests</option>
              </select>
            </div>
          </form>
          <div className="mt-4">
            <Link 
              href="/search"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#2957c3] hover:bg-[#1e3c8a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2957c3] transition-colors duration-200"
            >
              <FaSearch className="mr-2" /> Search
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

// Featured properties section
const FeaturedProperties = () => {
  const featuredProperties: FeaturedProperty[] = [
    {
      id: '1',
      title: 'Luxury Beach Villa',
      location: 'Miami, Florida',
      price: 299,
      rating: 4.9,
      reviews: 128,
      image: '/images/property-1.jpg',
      amenities: ['WiFi', 'Pool', 'Kitchen', 'Beach Access'],
    },
    {
      id: '2',
      title: 'Mountain Retreat Cabin',
      location: 'Aspen, Colorado',
      price: 189,
      rating: 4.8,
      reviews: 95,
      image: '/images/property-2.jpg',
      amenities: ['Fireplace', 'Mountain View', 'Hiking Trails'],
    },
    {
      id: '3',
      title: 'Modern Downtown Loft',
      location: 'New York City, New York',
      price: 249,
      rating: 4.7,
      reviews: 112,
      image: '/images/property-3.jpg',
      amenities: ['City View', 'Gym', 'Doorman', 'Balcony'],
    },
    {
      id: '4',
      title: 'Seaside Cottage',
      location: 'Cape Cod, Massachusetts',
      price: 159,
      rating: 4.8,
      reviews: 87,
      image: '/images/property-4.jpg',
      amenities: ['Ocean View', 'Deck', 'BBQ', 'Bike Rental'],
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Featured Properties</h2>
          <p className="mt-4 text-xl text-gray-600">
            Discover our handpicked selection of exceptional accommodations
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProperties.map((property) => (
            <article key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="relative h-48">
                <Image
                  src={property.image}
                  alt={property.title}
                  fill
                  className="object-cover"
                />
                <button
                  className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors duration-200"
                  aria-label="Add to wishlist"
                >
                  <FaHeart className="text-gray-400 hover:text-red-500" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{property.title}</h3>
                <p className="text-gray-600 flex items-center mb-2">
                  <FaMapMarkerAlt className="mr-1 text-gray-400" />
                  {property.location}
                </p>
                <div className="flex items-center mb-3">
                  <FaStar className="text-yellow-500 mr-1" />
                  <span className="text-gray-700 font-medium">
                    {property.rating} ({property.reviews} reviews)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {property.amenities.slice(0, 3).map((amenity, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-[#2957c3] font-semibold">
                    ${property.price} <span className="text-gray-500 font-normal">/ night</span>
                  </div>
                  <Link
                    href={`/properties/${property.id}`}
                    className="px-4 py-2 bg-[#2957c3] text-white text-sm font-medium rounded-md hover:bg-[#1e3c8a] transition-colors duration-200"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/search"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#2957c3] hover:bg-[#1e3c8a] transition-colors duration-200"
          >
            Explore All Properties
          </Link>
        </div>
      </div>
    </section>
  );
};

// How it works section
const HowItWorks = () => {
  const steps = [
    {
      id: 1,
      title: 'Search',
      description: 'Find your perfect accommodation from our curated selection',
      icon: FaSearch,
    },
    {
      id: 2,
      title: 'Book',
      description: 'Secure your stay with our easy booking process',
      icon: FaShieldAlt,
    },
    {
      id: 3,
      title: 'Enjoy',
      description: 'Experience unforgettable moments in your chosen destination',
      icon: FaHeart,
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
          <p className="mt-4 text-xl text-gray-600">
            Get started in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.id} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2957c3] text-white rounded-full mb-4">
                <step.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Sara AI Assistant section
const SaraAssistant = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#2957c3] to-[#1e3c8a] text-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Meet Sara, Your AI Travel Assistant</h2>
            <p className="text-xl mb-6">
              Get personalized recommendations, instant answers, and expert travel advice powered by artificial intelligence.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <FaHeadset className="mr-3" />
                24/7 instant support
              </li>
              <li className="flex items-center">
                <FaGlobe className="mr-3" />
                Multi-language assistance
              </li>
              <li className="flex items-center">
                <FaHeart className="mr-3" />
                Personalized recommendations
              </li>
            </ul>
            <Link
              href="/ai-assistant"
              className="inline-flex items-center px-6 py-3 bg-white text-[#2957c3] font-medium rounded-md hover:bg-gray-100 transition-colors duration-200"
            >
              Start Chatting with Sara
            </Link>
          </div>
          <div className="relative">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-[#2957c3] rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold">S</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Sara</h3>
                  <p className="text-sm text-gray-500">AI Assistant</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-gray-800">Hello! I'm Sara, your personal travel assistant. How can I help you find your perfect stay today?</p>
                </div>
                <div className="bg-[#2957c3] rounded-lg p-3 ml-8">
                  <p className="text-white">I'm looking for a beachfront property in Miami for next month.</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-gray-800">Great choice! I found 15 beachfront properties in Miami. Would you like me to show you the best options based on your preferences?</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Investor section
const InvestorSection = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Invest in the Future of Travel</h2>
        <p className="text-xl mb-8 max-w-3xl mx-auto">
          Join our growing community of investors and be part of the next generation of hospitality technology.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-semibold mb-2">High Returns</h3>
            <p className="text-gray-300">Earn competitive returns on your investment</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Diversified Portfolio</h3>
            <p className="text-gray-300">Spread risk across multiple properties</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Professional Management</h3>
            <p className="text-gray-300">Hands-off investment with expert oversight</p>
          </div>
        </div>
        <Link
          href="/investors"
          className="inline-flex items-center px-6 py-3 bg-[#2957c3] text-white font-medium rounded-md hover:bg-[#1e3c8a] transition-colors duration-200"
        >
          Learn More About Investing
        </Link>
      </div>
    </section>
  );
};

// Testimonials section
const Testimonials = () => {
  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'Traveler',
      content: 'Amazing experience! The property was exactly as described and the booking process was seamless.',
      rating: 5,
      avatar: '/images/avatar-1.jpg',
    },
    {
      id: '2',
      name: 'Michael Chen',
      role: 'Business Traveler',
      content: 'Perfect for my business trips. Clean, comfortable, and great location.',
      rating: 5,
      avatar: '/images/avatar-2.jpg',
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      role: 'Family Traveler',
      content: 'Our family had the best vacation thanks to Habibistay. Highly recommended!',
      rating: 5,
      avatar: '/images/avatar-3.jpg',
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">What Our Guests Say</h2>
          <p className="mt-4 text-xl text-gray-600">
            Real experiences from real travelers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-4">
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  width={48}
                  height={48}
                  className="rounded-full mr-4"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex items-center mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <FaStar key={i} className="text-yellow-500" />
                ))}
              </div>
              <p className="text-gray-700 italic">"{testimonial.content}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default function HomePage() {
  return (
    <MainLayout>
      <main>
        <HeroSection />
        <FeaturedProperties />
        <HowItWorks />
        <SaraAssistant />
        <Testimonials />
        <InvestorSection />
      </main>
    </MainLayout>
  );
}
