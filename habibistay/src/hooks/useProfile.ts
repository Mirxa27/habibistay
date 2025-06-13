'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface ProfileData {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  role: string;
  phone: string | null;
  bio: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  createdAt: Date;
  updatedAt: Date;
  isInvestor: boolean;
}

interface ProfileUpdate {
  name?: string;
  phone?: string;
  bio?: string;
  address?: string;
  city?: string;
  country?: string;
  image?: string;
}

export default function useProfile() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchProfile = async () => {
    if (!session?.user) {
      setError('You must be logged in to view your profile');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/users/profile');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load profile');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateProfile = async (profileData: ProfileUpdate) => {
    if (!session?.user) {
      setError('You must be logged in to update your profile');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const data = await response.json();
      setProfile(data);
      
      // If name or image was updated, also update the session
      if (profileData.name || profileData.image) {
        await updateSession({
          ...session,
          user: {
            ...session.user,
            name: profileData.name || session.user.name,
            image: profileData.image || session.user.image,
          }
        });
      }
      
      return data;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update profile');
      console.error('Error updating profile:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
  };
}
