'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import MainLayout from '../../components/layout/MainLayout';

// Placeholder for react-icons
const FaUser = ({ className }: { className?: string }) => <span className={className || ''}>👤</span>;
const FaLock = ({ className }: { className?: string }) => <span className={className || ''}>🔒</span>;
const FaHistory = ({ className }: { className?: string }) => <span className={className || ''}>⏱️</span>;
const FaWallet = ({ className }: { className?: string }) => <span className={className || ''}>💰</span>;
const FaSpinner = ({ className }: { className?: string }) => <span className={className || ''}>⏳</span>;

// Placeholder for ProfileForm component
const ProfileForm = () => (
  <div className="bg-white p-6 shadow-sm rounded-lg">
    <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
    <p className="text-gray-500 mb-4">
      Update your personal information and how we can reach you.
    </p>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Full Name</label>
        <input
          type="text"
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          placeholder="Your full name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email Address</label>
        <input
          type="email"
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          placeholder="Your email address"
        />
      </div>
    </div>
  </div>
);

export default function ProfilePage() {
  const { status } = useSession();
  const [activeTab, setActiveTab] = useState('profile');
  
  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <FaSpinner className="animate-spin text-blue-600 text-4xl" />
        </div>
      </MainLayout>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to view and manage your profile.
          </p>
          <a 
            href="/login" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
      </MainLayout>
    );
  }
  
  const tabClass = (tab: string) => 
    `flex items-center px-4 py-3 border-b-2 text-sm font-medium ${
      activeTab === tab
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Profile</h1>
          
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('profile')}
                className={tabClass('profile')}
              >
                <FaUser className="mr-2" />
                Personal Information
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={tabClass('security')}
              >
                <FaLock className="mr-2" />
                Security
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={tabClass('payment')}
              >
                <FaWallet className="mr-2" />
                Payment Methods
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={tabClass('activity')}
              >
                <FaHistory className="mr-2" />
                Account Activity
              </button>
            </nav>
          </div>
          
          <div className="py-8">
            {activeTab === 'profile' && (
              <ProfileForm />
            )}
            
            {activeTab === 'security' && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      The security settings section is coming soon.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'payment' && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      The payment methods section is coming soon.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'activity' && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      The account activity section is coming soon.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
