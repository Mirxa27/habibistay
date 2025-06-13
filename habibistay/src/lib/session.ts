import { auth } from './auth';

// Helper to obtain the current authenticated user from the server session
export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}
