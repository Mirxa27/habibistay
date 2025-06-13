'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import Link from 'next/link';
import type { Route } from 'next';
// import MainLayout from '@/components/layout/MainLayout';
// import AdminSidebar from '@/components/admin/AdminSidebar';
// import DashboardStats from '@/components/admin/DashboardStats';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingBookings: 0,
    upcomingBookings: 0,
  });

  // Check if user is authenticated and has admin role
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login' as Route);
    } else if (status === 'authenticated' && session.user.role !== UserRole.ADMIN) {
      router.push('/' as Route); // Redirect non-admin users
    } else if (status === 'authenticated' && session.user.role === UserRole.ADMIN) {
      loadDashboardStats();
    }
  }, [status, session, router]);

  // Load dashboard statistics
  const loadDashboardStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to load dashboard stats');
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // For now, set some mock data if we're unable to fetch real data
  useEffect(() => {
    if (!isLoading && stats.totalUsers === 0) {
      setStats({
        totalUsers: 128,
        totalProperties: 74,
        totalBookings: 342,
        totalRevenue: 57650,
        pendingBookings: 15,
        upcomingBookings: 42,
      });
    }
  }, [isLoading, stats]);

  if (status === 'loading' || (status === 'authenticated' && isLoading)) {
    return (
      <div>
        <div className="flex min-h-screen bg-gray-100">
          <div className="w-64 bg-gray-800 text-white p-4">Admin Sidebar Placeholder</div>
          <div className="flex-1 p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'authenticated' && session.user.role !== UserRole.ADMIN) {
    return null; // Will redirect in useEffect
  }

  return (
    <div>
      <div className="flex min-h-screen bg-gray-100">
        <div className="w-64 bg-gray-800 text-white p-4">Admin Sidebar Placeholder</div>
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">Dashboard Stats Placeholder</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-medium">Recent Bookings</h3>
                <Link 
                  href={"/admin/bookings" as Route}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View All
                </Link>
              </div>
              <div className="p-6">
                {/* This would be a component that displays recent bookings */}
                <div className="text-center text-gray-500 py-4">
                  Loading recent bookings...
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-medium">New Users</h3>
                <Link 
                  href={"/admin/users" as Route}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View All
                </Link>
              </div>
              <div className="p-6">
                {/* This would be a component that displays new users */}
                <div className="text-center text-gray-500 py-4">
                  Loading new users...
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-medium">Recent Activities</h3>
                <Link 
                  href={"/admin/activities" as Route}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View All
                </Link>
              </div>
              <div className="p-6">
                {/* This would be a component that displays system activities */}
                <div className="text-center text-gray-500 py-4">
                  Loading recent activities...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
