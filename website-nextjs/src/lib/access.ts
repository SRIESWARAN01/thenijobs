import type { UserRole } from '@/lib/types';

const EMPLOYER_PORTAL_ROLES: UserRole[] = [
  'employer',
  'business_owner',
  'supplier',
  'service_provider',
  'entrepreneur',
];

export function isAdminRole(role?: UserRole | null) {
  return role === 'admin' || role === 'super_admin';
}

export function isEmployerPortalRole(role?: UserRole | null) {
  return !!role && EMPLOYER_PORTAL_ROLES.includes(role);
}

export function getDashboardPathForRole(role?: UserRole | null) {
  if (isAdminRole(role)) return '/admin/dashboard';
  if (role === 'service_provider') return '/service/dashboard';
  if (role === 'business_owner' || role === 'supplier' || role === 'entrepreneur') {
    return '/business/dashboard';
  }
  if (role === 'employer') return '/employer/dashboard';
  return '/seeker/dashboard';
}

export function getSafePostLoginRedirect(
  requestedPath: string | null | undefined,
  role?: UserRole | null,
) {
  const dashboardPath = getDashboardPathForRole(role);
  if (!requestedPath || !requestedPath.startsWith('/')) return dashboardPath;
  if (requestedPath.startsWith('//')) return dashboardPath;

  if (isAdminRole(role) && requestedPath.startsWith('/admin/')) return requestedPath;
  if (role === 'employer' && requestedPath.startsWith('/employer/')) {
    return requestedPath;
  }
  if (role === 'business_owner' || role === 'supplier' || role === 'entrepreneur') {
    if (requestedPath.startsWith('/business/')) return requestedPath;
    if (requestedPath.startsWith('/employer/') && requestedPath !== '/employer/dashboard') {
      return requestedPath;
    }
  }
  if (role === 'service_provider') {
    if (requestedPath.startsWith('/service/')) return requestedPath;
    if (requestedPath.startsWith('/employer/') && requestedPath !== '/employer/dashboard') {
      return requestedPath;
    }
  }
  if (role === 'job_seeker' && requestedPath.startsWith('/seeker/')) {
    return requestedPath;
  }

  return dashboardPath;
}
