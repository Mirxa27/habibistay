'use client'; // This hook is for client-side components

import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client'; // For explicit typing if needed

// The Session type from next-auth/react should already be augmented by next-auth.d.ts
// to include user.id and user.role.

interface CurrentSessionInfo {
  user: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: UserRole | null; 
  } | null;
  role: UserRole | null | undefined;
  userId: string | null | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionStatus: ReturnType<typeof useSession>['status'];
}

/**
 * Custom hook to retrieve current user session information,
 * including authentication status, user details, and role.
 * Leverages NextAuth's useSession hook.
 */
export function useCurrentSessionInfo(): CurrentSessionInfo {
  const { data: session, status } = useSession();

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

  // The user object structure comes from the extended Session interface in next-auth.d.ts
  const user = session?.user ?? null;
  const userId = session?.user?.id ?? null;
  const role = session?.user?.role ?? null;

  return {
    user,
    userId,
    role,
    isAuthenticated,
    isLoading,
    sessionStatus: status,
  };
}
