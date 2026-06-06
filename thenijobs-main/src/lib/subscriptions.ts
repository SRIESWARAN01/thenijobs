export type PlanSlug = 'free' | 'basic' | 'premium' | 'enterprise';

export interface PlanLimits {
  slug: PlanSlug;
  name: string;
  maxActiveJobs: number;
  maxGalleryImages: number;
  maxJobAlerts: number;
  aiRequestsPerMonth: number;
  canUseFeaturedJobs: boolean;
  canUseUrgentJobs: boolean;
  canUsePremiumBadge: boolean;
  canUseAdvancedCandidateSearch: boolean;
  canUseLeadDashboard: boolean;
}

export const PLAN_LIMITS: Record<PlanSlug, PlanLimits> = {
  free: {
    slug: 'free',
    name: 'Free',
    maxActiveJobs: 1,
    maxGalleryImages: 2,
    maxJobAlerts: 2,
    aiRequestsPerMonth: 3,
    canUseFeaturedJobs: false,
    canUseUrgentJobs: false,
    canUsePremiumBadge: false,
    canUseAdvancedCandidateSearch: false,
    canUseLeadDashboard: false,
  },
  basic: {
    slug: 'basic',
    name: 'Basic',
    maxActiveJobs: 3,
    maxGalleryImages: 5,
    maxJobAlerts: 10,
    aiRequestsPerMonth: 15,
    canUseFeaturedJobs: false,
    canUseUrgentJobs: false,
    canUsePremiumBadge: false,
    canUseAdvancedCandidateSearch: true,
    canUseLeadDashboard: false,
  },
  premium: {
    slug: 'premium',
    name: 'Premium',
    maxActiveJobs: 15,
    maxGalleryImages: 20,
    maxJobAlerts: 50,
    aiRequestsPerMonth: 100,
    canUseFeaturedJobs: true,
    canUseUrgentJobs: true,
    canUsePremiumBadge: true,
    canUseAdvancedCandidateSearch: true,
    canUseLeadDashboard: true,
  },
  enterprise: {
    slug: 'enterprise',
    name: 'Enterprise',
    maxActiveJobs: Number.POSITIVE_INFINITY,
    maxGalleryImages: Number.POSITIVE_INFINITY,
    maxJobAlerts: Number.POSITIVE_INFINITY,
    aiRequestsPerMonth: Number.POSITIVE_INFINITY,
    canUseFeaturedJobs: true,
    canUseUrgentJobs: true,
    canUsePremiumBadge: true,
    canUseAdvancedCandidateSearch: true,
    canUseLeadDashboard: true,
  },
};

export function normalizePlanSlug(plan?: string | null): PlanSlug {
  const key = (plan || 'free').toLowerCase().replace(/\s+plan$/, '') as PlanSlug;
  return key in PLAN_LIMITS ? key : 'free';
}

export function getPlanLimits(plan?: string | null): PlanLimits {
  return PLAN_LIMITS[normalizePlanSlug(plan)];
}

export function getCompanyPlan(company?: Record<string, any> | null): PlanSlug {
  if (!company) return 'free';
  if (company.subscriptionStatus === 'active' && company.subscriptionPlan) {
    return normalizePlanSlug(company.subscriptionPlan);
  }
  if (company.plan) return normalizePlanSlug(company.plan);
  if (company.isPremium) return 'premium';
  return 'free';
}

export function canUseJobBoosts(plan: PlanSlug): boolean {
  const limits = PLAN_LIMITS[plan];
  return limits.canUseFeaturedJobs && limits.canUseUrgentJobs && limits.canUsePremiumBadge;
}
