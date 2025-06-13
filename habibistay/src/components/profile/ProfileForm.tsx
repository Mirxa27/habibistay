'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Placeholder icon components
const IconComponent = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <span className={`inline-block ${className || ''}`} style={{ width: '1em', height: '1em' }}>{children}</span>
);

const FaSave = ({ className }: { className?: string }) => <IconComponent className={className}>💾</IconComponent>;
const FaSpinner = ({ className }: { className?: string }) => <IconComponent className={className}>🔄</IconComponent>;

// Simplified placeholder component for build purposes
export default function ProfileForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: 'User Name',
    email: 'user@example.com',
    phone: '+1234567890',
    bio: 'This is a placeholder bio',
    address: '123 Main St',
    city: 'Example City',
    country: 'Country'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      alert('Profile updated successfully');
      router.refresh();
    }, 1000);
  };
  
  // Placeholder UI component
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-gray-200 w-32 h-32 rounded-full mb-4 flex items-center justify-center">
          <span className="text-4xl">👤</span>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md">Upload Image</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email (cannot be changed)
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="country" className="block text-sm font-medium text-gray-700">
            Country
          </label>
          <input
            id="country"
            name="country"
            type="text"
            value={formData.country}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            City
          </label>
          <input
            id="city"
            name="city"
            type="text"
            value={formData.city}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <input
            id="address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            value={formData.bio}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className={`
            flex items-center px-4 py-2 rounded-md text-white
            ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
          `}
        >
          {saving ? (
            <>
              <FaSpinner className="mr-2" /> Saving...
            </>
          ) : (
            <>
              <FaSave className="mr-2" /> Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}
