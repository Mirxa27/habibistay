import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { signIn as nextSignIn, signOut as nextSignOut } from 'next-auth/react';

// Wrapper around NextAuth's getServerSession so other modules can simply call `auth()`
export async function auth() {
  return getServerSession(authOptions);
}

// Re-export signIn/signOut from next-auth for client side usage
export const signIn = nextSignIn;
export const signOut = nextSignOut;
