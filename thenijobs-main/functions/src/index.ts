import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

initializeApp();

const REGION = 'asia-south1';
const db = getFirestore();

type PlanSlug = 'free' | 'basic' | 'premium' | 'enterprise';

interface PlanConfig {
  slug: PlanSlug;
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

interface CreateJobPostingData {
  companyId?: unknown;
  title?: unknown;
  description?: unknown;
  jobType?: unknown;
  location?: unknown;
  district?: unknown;
  openings?: unknown;
  experience?: unknown;
  education?: unknown;
  skills?: unknown;
  salaryMin?: unknown;
  salaryMax?: unknown;
  salaryType?: unknown;
  isNegotiable?: unknown;
  benefits?: unknown;
  deadline?: unknown;
  isPremium?: unknown;
  isUrgent?: unknown;
  isFeatured?: unknown;
}

const DEFAULT_PLANS: Record<PlanSlug, PlanConfig> = {
  free: {
    slug: 'free',
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
    maxActiveJobs: -1,
    maxGalleryImages: -1,
    maxJobAlerts: -1,
    aiRequestsPerMonth: -1,
    canUseFeaturedJobs: true,
    canUseUrgentJobs: true,
    canUsePremiumBadge: true,
    canUseAdvancedCandidateSearch: true,
    canUseLeadDashboard: true,
  },
};

export const healthCheck = onCall({ region: REGION }, () => {
  logger.info('Functions health check called.');
  return {
    ok: true,
    service: 'thenijobs-functions',
  };
});

export const syncMobileVerification = onCall({ region: REGION }, async (request) => {
  const uid = requireUid(request);
  const authUser = await getAuth().getUser(uid);

  if (!authUser.phoneNumber) {
    throw new HttpsError(
      'failed-precondition',
      'A verified phone number is not linked to this Firebase Auth account.',
    );
  }

  const verifiedAt = FieldValue.serverTimestamp();
  await db.doc(`users/${uid}`).set({
    phone: authUser.phoneNumber,
    mobileVerified: true,
    phoneVerified: true,
    mobileVerifiedAt: verifiedAt,
    updatedAt: verifiedAt,
  }, { merge: true });

  const companies = await db.collection('companies')
    .where('ownerId', '==', uid)
    .limit(25)
    .get();

  if (!companies.empty) {
    const batch = db.batch();
    companies.docs.forEach((company) => {
      batch.set(company.ref, {
        'verification.mobile': true,
        'verificationBadges.mobileVerified': true,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    });
    await batch.commit();
  }

  return {
    phone: authUser.phoneNumber,
    mobileVerified: true as const,
  };
});

export const createJobPosting = onCall(
  { region: REGION },
  async (request: CallableRequest<CreateJobPostingData>) => {
    const uid = requireUid(request);
    const userSnap = await db.doc(`users/${uid}`).get();
    const user = userSnap.data();

    if (!user) {
      throw new HttpsError('permission-denied', 'User profile not found.');
    }
    if (!['employer', 'business_owner'].includes(String(user.role))) {
      throw new HttpsError('permission-denied', 'Only employers can post jobs.');
    }
    if (user.mobileVerified !== true && user.phoneVerified !== true) {
      throw new HttpsError(
        'failed-precondition',
        'Please verify your mobile number before posting jobs.',
      );
    }

    const data = request.data;
    const companyId = getRequiredString(data.companyId, 'companyId');
    const companySnap = await db.doc(`companies/${companyId}`).get();
    const company = companySnap.data();

    if (!company) {
      throw new HttpsError('not-found', 'Company profile not found.');
    }
    if (company.ownerId !== uid) {
      throw new HttpsError('permission-denied', 'You can only post jobs for your own company.');
    }

    const plans = await getPlanConfigs();
    const plan = await resolveCompanyPlan(companyId, company);
    const limits = plans[plan];
    const activeCount = await countOpenJobs(companyId);

    if (!isUnlimited(limits.maxActiveJobs) && activeCount >= limits.maxActiveJobs) {
      throw new HttpsError(
        'resource-exhausted',
        `${limits.slug} plan allows ${limits.maxActiveJobs} open job posting(s).`,
      );
    }

    const isFeatured = getBoolean(data.isFeatured);
    const isUrgent = getBoolean(data.isUrgent);
    const isPremium = getBoolean(data.isPremium);

    if (isFeatured && !limits.canUseFeaturedJobs) {
      throw new HttpsError('failed-precondition', 'Featured jobs are not enabled for this plan.');
    }
    if (isUrgent && !limits.canUseUrgentJobs) {
      throw new HttpsError('failed-precondition', 'Urgent jobs are not enabled for this plan.');
    }
    if (isPremium && !limits.canUsePremiumBadge) {
      throw new HttpsError('failed-precondition', 'Premium job badges are not enabled for this plan.');
    }

    const title = getRequiredString(data.title, 'title');
    const description = getRequiredString(data.description, 'description');
    const district = getRequiredString(data.district, 'district');
    const now = FieldValue.serverTimestamp();
    const jobRef = db.collection('jobs').doc();

    await jobRef.set({
      title,
      slug: slugify(title),
      description,
      jobType: getString(data.jobType, 'full_time'),
      location: getString(data.location),
      district,
      openings: Math.max(1, Math.floor(getNumber(data.openings, 1) || 1)),
      experience: getString(data.experience),
      education: getString(data.education),
      skills: getStringArray(data.skills).slice(0, 50),
      salaryMin: getNullableNumber(data.salaryMin),
      salaryMax: getNullableNumber(data.salaryMax),
      salaryType: getString(data.salaryType, 'monthly'),
      isNegotiable: getBoolean(data.isNegotiable),
      benefits: getStringArray(data.benefits).slice(0, 30),
      deadline: getString(data.deadline) || null,
      isPremium,
      isUrgent,
      isFeatured,
      companyId,
      companyName: getString(company.name, 'Verified Employer'),
      companySlug: getString(company.slug),
      companyLogoUrl: getString(company.logoUrl),
      postedBy: uid,
      status: 'pending',
      isActive: false,
      viewCount: 0,
      applicationCount: 0,
      planAtCreation: plan,
      createdAt: now,
      updatedAt: now,
    });

    await db.collection('activityLogs').add({
      userId: uid,
      userName: getString(user.displayName || user.email, 'Employer'),
      action: 'Posted a job listing',
      target: title,
      targetId: jobRef.id,
      timestamp: FieldValue.serverTimestamp(),
    });

    return {
      jobId: jobRef.id,
      plan,
      remainingJobSlots: isUnlimited(limits.maxActiveJobs)
        ? null
        : Math.max(0, limits.maxActiveJobs - activeCount - 1),
    };
  },
);

function requireUid(request: CallableRequest<unknown>): string {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }
  return request.auth.uid;
}

async function getPlanConfigs(): Promise<Record<PlanSlug, PlanConfig>> {
  const snap = await db.doc('settings/subscriptionPlans').get();
  const remote = snap.exists ? snap.data() : undefined;

  return {
    free: mergePlan('free', remote?.free),
    basic: mergePlan('basic', remote?.basic),
    premium: mergePlan('premium', remote?.premium),
    enterprise: mergePlan('enterprise', remote?.enterprise),
  };
}

function mergePlan(slug: PlanSlug, value: unknown): PlanConfig {
  if (!value || typeof value !== 'object') return DEFAULT_PLANS[slug];
  const raw = value as Partial<PlanConfig>;
  return {
    ...DEFAULT_PLANS[slug],
    maxActiveJobs: getNumber(raw.maxActiveJobs, DEFAULT_PLANS[slug].maxActiveJobs),
    maxGalleryImages: getNumber(raw.maxGalleryImages, DEFAULT_PLANS[slug].maxGalleryImages),
    maxJobAlerts: getNumber(raw.maxJobAlerts, DEFAULT_PLANS[slug].maxJobAlerts),
    aiRequestsPerMonth: getNumber(
      raw.aiRequestsPerMonth,
      DEFAULT_PLANS[slug].aiRequestsPerMonth,
    ),
    canUseFeaturedJobs: getBoolean(raw.canUseFeaturedJobs, DEFAULT_PLANS[slug].canUseFeaturedJobs),
    canUseUrgentJobs: getBoolean(raw.canUseUrgentJobs, DEFAULT_PLANS[slug].canUseUrgentJobs),
    canUsePremiumBadge: getBoolean(raw.canUsePremiumBadge, DEFAULT_PLANS[slug].canUsePremiumBadge),
    canUseAdvancedCandidateSearch: getBoolean(
      raw.canUseAdvancedCandidateSearch,
      DEFAULT_PLANS[slug].canUseAdvancedCandidateSearch,
    ),
    canUseLeadDashboard: getBoolean(raw.canUseLeadDashboard, DEFAULT_PLANS[slug].canUseLeadDashboard),
    slug,
  };
}

async function resolveCompanyPlan(
  companyId: string,
  company: Record<string, unknown>,
): Promise<PlanSlug> {
  const subSnap = await db.collection('subscriptions')
    .where('companyId', '==', companyId)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (!subSnap.empty) {
    const sub = subSnap.docs[0].data();
    return normalizePlanSlug(getString(sub.plan || sub.planName, 'free'));
  }

  if (company.subscriptionStatus === 'active' && company.subscriptionPlan) {
    return normalizePlanSlug(getString(company.subscriptionPlan, 'free'));
  }
  if (company.plan) return normalizePlanSlug(getString(company.plan, 'free'));
  if (company.isPremium === true) return 'premium';
  return 'free';
}

async function countOpenJobs(companyId: string): Promise<number> {
  const snap = await db.collection('jobs')
    .where('companyId', '==', companyId)
    .where('status', 'in', ['pending', 'active', 'paused'])
    .get();
  return snap.size;
}

function normalizePlanSlug(value: string): PlanSlug {
  const normalized = value.toLowerCase().replace(/\s+plan$/, '').trim();
  if (normalized === 'basic' || normalized === 'premium' || normalized === 'enterprise') {
    return normalized;
  }
  return 'free';
}

function isUnlimited(value: number): boolean {
  return value < 0 || !Number.isFinite(value);
}

function getRequiredString(value: unknown, field: string): string {
  const text = getString(value);
  if (!text) {
    throw new HttpsError('invalid-argument', `${field} is required.`);
  }
  return text;
}

function getString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => getString(item)).filter((item) => item.length > 0)
    : [];
}

function getBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function getNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function getNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = getNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}
