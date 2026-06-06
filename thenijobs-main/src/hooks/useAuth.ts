'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import type { UserRole } from '@/lib/types';

// Re-export the core useAuth hook so consumers can import from hooks/
export { useAuth as useAuthContext } from '@/contexts/AuthContext';

/**
 * Access the current authentication state, actions, and role helpers.
 * Thin re-export of the AuthContext hook for convenience.
 */
export const useAuth = useAuthContext;

/**
 * Guard hook – redirects to `/login` when the user is not authenticated
 * or does not have one of the `allowedRoles`.
 *
 * @param allowedRoles - Optional whitelist of roles. If omitted any
 *   authenticated user is allowed.
 * @param redirectTo - Path to redirect unauthenticated users to (default `/login`).
 *
 * @example
 * ```tsx
 * // Only admins
 * useRequireAuth(['admin', 'super_admin']);
 *
 * // Any logged-in user
 * useRequireAuth();
 * ```
 */
export function useRequireAuth(
  allowedRoles?: UserRole[],
  redirectTo = '/login',
) {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  // Memoise allowedRoles so inline arrays don't trigger re-renders
  const rolesRef = useRef(allowedRoles);
  if (
    allowedRoles?.length !== rolesRef.current?.length ||
    allowedRoles?.some((r, i) => r !== rolesRef.current?.[i])
  ) {
    rolesRef.current = allowedRoles;
  }

  useEffect(() => {
    if (loading) return;

    // Not authenticated → redirect to login
    if (!user) {
      router.replace(redirectTo);
      return;
    }

    const roles = rolesRef.current;

    // Role check (if roles were specified)
    if (roles && roles.length > 0 && !roles.includes(user.role)) {
      // Redirect to a safe default based on actual role
      switch (user.role) {
        case 'admin':
        case 'super_admin':
          router.replace('/admin/dashboard');
          break;
        case 'employer':
        case 'business_owner':
          router.replace('/employer/dashboard');
          break;
        default:
          router.replace('/seeker/dashboard');
      }
    }
  }, [user, loading, redirectTo, router]);

  return { user, loading };
}
