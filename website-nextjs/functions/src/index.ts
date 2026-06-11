import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';

initializeApp();

const REGION = 'asia-south1';
const db = getFirestore();

type PlanSlug = 'free' | 'basic' | 'premium' | 'enterprise';
type SubscriptionStatus = 'active' | 'pending_renewal' | 'expired' | 'cancelled';

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
  category?: unknown;
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
  isWalkIn?: unknown;
  walkIn?: unknown;
  walkInDate?: unknown;
  walkInTime?: unknown;
  walkInVenue?: unknown;
  walkInContactPerson?: unknown;
  walkInContactMobile?: unknown;
}

interface ValidateSubscriptionAccessData {
  companyId?: unknown;
  feature?: unknown;
}

interface CreateNotificationData {
  userId?: unknown;
  type?: unknown;
  title?: unknown;
  message?: unknown;
  actionUrl?: unknown;
}

interface ResolvedSubscriptionState {
  plan: PlanSlug;
  status: SubscriptionStatus;
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
    maxActiveJobs: 2,
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
    maxActiveJobs: 5,
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

const PLAN_RANK: Record<PlanSlug, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  enterprise: 3,
};

const REMINDER_DAYS = [30, 7, 1] as const;
const JOB_VALIDITY_DAYS = 30;
const JOB_REMINDER_DAYS = [7, 3, 1] as const;

export const healthCheck = onCall({ region: REGION }, () => {
  logger.info('Functions health check called.');
  return {
    ok: true,
    service: 'thenijobs-functions',
  };
});

export const createJobPosting = onCall(
  { region: REGION },
  async (request: CallableRequest<CreateJobPostingData>) => {
    const uid = requireUid(request);
    const authUser = await getAuth().getUser(uid);
    if (!authUser.emailVerified) {
      throw new HttpsError(
        'failed-precondition',
        'Please verify your email address before posting jobs.',
      );
    }

    const userSnap = await db.doc(`users/${uid}`).get();
    const user = userSnap.data();

    if (!user) {
      throw new HttpsError('permission-denied', 'User profile not found.');
    }
    if (!['employer', 'business_owner'].includes(String(user.role))) {
      throw new HttpsError('permission-denied', 'Only employers can post jobs.');
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
    if (company.deleted === true || company.isActive === false || company.status === 'deleted') {
      throw new HttpsError('failed-precondition', 'Deleted or inactive companies cannot post jobs.');
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
    const location = getString(data.location);
    const normalizedTitle = normaliseDuplicateKey(title);
    const duplicate = await hasDuplicateJob(companyId, normalizedTitle, location);
    if (duplicate) {
      throw new HttpsError(
        'already-exists',
        'A matching job is already pending or active for this company and location.',
      );
    }

    const postedAt = new Date();
    const expiresAt = addDays(postedAt, JOB_VALIDITY_DAYS);
    const spamFlags = detectSpamFlags({ title, description });
    const status = spamFlags.length > 0 ? 'reported' : 'pending';
    const now = FieldValue.serverTimestamp();
    const jobRef = db.collection('jobs').doc();

    await jobRef.set({
      title,
      normalizedTitle,
      slug: slugify(title),
      category: getString(data.category),
      description,
      jobType: getString(data.jobType, 'full_time'),
      location,
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
      isWalkIn: getBoolean(data.isWalkIn),
      ...getWalkInPayload(data),
      isPremium,
      isUrgent,
      isFeatured,
      companyId,
      companyName: getString(company.name, 'Verified Employer'),
      companySlug: getString(company.slug),
      companyLogoUrl: getString(company.logoUrl),
      companyIsActive: company.isActive !== false,
      companyDeleted: false,
      companyStatus: getString(company.status),
      companyVerificationStatus: getString(company.verificationStatus),
      postedBy: uid,
      status,
      isActive: false,
      viewCount: 0,
      applicationsCount: 0,
      walkInApplicationsCount: 0,
      planAtCreation: plan,
      planType: plan,
      validityDays: JOB_VALIDITY_DAYS,
      postedAt: Timestamp.fromDate(postedAt),
      expiresAt: Timestamp.fromDate(expiresAt),
      expiryReminderDaysSent: [],
      spamFlags,
      spamFlagged: spamFlags.length > 0,
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

export const validateSubscriptionAccess = onCall(
  { region: REGION },
  async (request: CallableRequest<ValidateSubscriptionAccessData>) => {
    const uid = requireUid(request);
    const companyId = getString(request.data.companyId);
    const feature = getString(request.data.feature);
    const plans = await getPlanConfigs();

    let plan: PlanSlug = 'free';
    let subscriptionStatus: SubscriptionStatus = 'active';
    if (companyId) {
      const companySnap = await db.doc(`companies/${companyId}`).get();
      const company = companySnap.data();
      if (!company) {
        throw new HttpsError('not-found', 'Company profile not found.');
      }
      if (company.ownerId !== uid) {
        throw new HttpsError('permission-denied', 'You can only validate your own company subscription.');
      }
      const state = await resolveCompanyPlanState(companyId, company);
      plan = state.plan;
      subscriptionStatus = state.status;
    } else {
      const state = await resolveUserPlanState(uid);
      plan = state.plan;
      subscriptionStatus = state.status;
    }

    const effectivePlan = hasActiveSubscriptionBenefits(subscriptionStatus) ? plan : 'free';
    const limits = plans[effectivePlan];

    return {
      plan: effectivePlan,
      status: subscriptionStatus,
      limits,
      allowed: feature ? featureAllowed(limits, feature) : true,
    };
  },
);

export const createNotification = onCall(
  { region: REGION },
  async (request: CallableRequest<CreateNotificationData>) => {
    const uid = requireUid(request);
    const data = request.data ?? {};
    const userId = getRequiredString(data.userId, 'userId');
    const type = getString(data.type, 'system').slice(0, 50);
    const title = getRequiredString(data.title, 'title').slice(0, 140);
    const message = getRequiredString(data.message, 'message').slice(0, 600);
    const actionUrl = getString(data.actionUrl).slice(0, 300);

    const allowed =
      userId === uid ||
      await isAdminRequest(request) ||
      await canNotifyRelatedUser(uid, userId);

    if (!allowed) {
      throw new HttpsError(
        'permission-denied',
        'You do not have permission to notify this user.',
      );
    }

    const notificationRef = await db.collection('notifications').add({
      userId,
      type,
      title,
      message,
      ...(actionUrl ? { actionUrl } : {}),
      read: false,
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { ok: true, notificationId: notificationRef.id };
  },
);

export const processSubscriptionAutomation = onSchedule(
  {
    region: REGION,
    schedule: 'every 24 hours',
    timeZone: 'Asia/Kolkata',
  },
  async () => {
    const now = new Date();
    const snapshot = await db.collection('subscriptions')
      .where('status', 'in', ['active', 'pending_renewal'])
      .get();

    logger.info('Processing subscription automation.', { count: snapshot.size });

    for (const subscription of snapshot.docs) {
      const data = subscription.data();
      const expiry = getDate(data.endDate);
      if (!expiry) continue;

      const daysUntilExpiry = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      const reminderDaysSent = getNumberArray(data.expiryReminderDaysSent);
      const updates: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (daysUntilExpiry < 0) {
        await expireSubscription(subscription.ref.path, data);
        continue;
      }

      if (daysUntilExpiry <= 30 && data.status === 'active') {
        updates.status = 'pending_renewal';
        await syncSubscriptionStatus(data, 'pending_renewal');
      }

      for (const reminderDay of REMINDER_DAYS) {
        if (daysUntilExpiry <= reminderDay && daysUntilExpiry >= 0 && !reminderDaysSent.includes(reminderDay)) {
          await createSubscriptionNotification({
            userId: getString(data.userId),
            title: `Subscription expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`,
            message: `${getString(data.planName, 'Your plan')} expires on ${expiry.toLocaleDateString('en-IN')}. Renew to keep benefits active.`,
            actionUrl: getString(data.audience) === 'seeker' ? '/seeker/subscription' : '/employer/billing',
          });
          reminderDaysSent.push(reminderDay);
        }
      }

      updates.expiryReminderDaysSent = reminderDaysSent;
      await subscription.ref.set(updates, { merge: true });
    }
  },
);

export const processJobAutomation = onSchedule(
  {
    region: REGION,
    schedule: 'every 24 hours',
    timeZone: 'Asia/Kolkata',
  },
  async () => {
    const now = new Date();
    const snapshot = await db.collection('jobs')
      .where('status', 'in', ['active', 'paused'])
      .get();

    logger.info('Processing job expiry automation.', { count: snapshot.size });

    for (const job of snapshot.docs) {
      const data = job.data();
      const companyId = getString(data.companyId);
      if (companyId) {
        const companySnap = await db.doc(`companies/${companyId}`).get();
        const company = companySnap.data();
        if (!company || company.deleted === true || company.isActive === false || company.status === 'deleted') {
          await job.ref.set({
            status: 'closed',
            isActive: false,
            companyDeleted: true,
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });
          continue;
        }
      }

      const expiry = getDate(data.expiresAt);
      if (!expiry) continue;

      const daysUntilExpiry = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      const reminderDaysSent = getNumberArray(data.expiryReminderDaysSent);

      if (daysUntilExpiry < 0) {
        await job.ref.set({
          status: 'expired',
          isActive: false,
          expiredAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        await createJobNotification({
          userId: getString(data.postedBy),
          title: 'Job expired',
          message: `${getString(data.title, 'Your job')} has expired after 30 days and is no longer public.`,
          actionUrl: '/employer/jobs',
        });
        continue;
      }

      let reminderSent = false;
      for (const reminderDay of JOB_REMINDER_DAYS) {
        if (daysUntilExpiry <= reminderDay && daysUntilExpiry >= 0 && !reminderDaysSent.includes(reminderDay)) {
          await createJobNotification({
            userId: getString(data.postedBy),
            title: `Job expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`,
            message: `${getString(data.title, 'Your job')} expires on ${expiry.toLocaleDateString('en-IN')}. Renew it to keep accepting applications.`,
            actionUrl: '/employer/jobs',
          });
          reminderDaysSent.push(reminderDay);
          reminderSent = true;
        }
      }

      if (reminderSent) {
        await job.ref.set({
          expiryReminderDaysSent: reminderDaysSent,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    }
  },
);

function requireUid(request: CallableRequest<unknown>): string {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }
  return request.auth.uid;
}

async function isAdminRequest(request: CallableRequest<unknown>): Promise<boolean> {
  const token = request.auth?.token as Record<string, unknown> | undefined;
  if (token?.admin === true || token?.super_admin === true) return true;

  const uid = request.auth?.uid;
  if (!uid) return false;

  const userSnap = await db.doc(`users/${uid}`).get();
  const role = getString(userSnap.data()?.role);
  return role === 'admin' || role === 'super_admin';
}

async function canNotifyRelatedUser(senderId: string, targetUserId: string): Promise<boolean> {
  if (await seekerHasApplicationWithCompanyOwner(senderId, targetUserId)) return true;
  return companyOwnerHasCandidateRelationship(senderId, targetUserId);
}

async function seekerHasApplicationWithCompanyOwner(
  seekerId: string,
  ownerId: string,
): Promise<boolean> {
  const applicationSnap = await db.collection('applications')
    .where('seekerId', '==', seekerId)
    .limit(20)
    .get();

  for (const application of applicationSnap.docs) {
    const companyId = getString(application.data().companyId);
    if (!companyId) continue;

    const companySnap = await db.doc(`companies/${companyId}`).get();
    if (companySnap.data()?.ownerId === ownerId) return true;
  }

  return false;
}

async function companyOwnerHasCandidateRelationship(
  ownerId: string,
  seekerId: string,
): Promise<boolean> {
  const companySnap = await db.collection('companies')
    .where('ownerId', '==', ownerId)
    .limit(20)
    .get();
  const companyIds = new Set(companySnap.docs.map((company) => company.id));
  if (companyIds.size === 0) return false;

  const applicationSnap = await db.collection('applications')
    .where('seekerId', '==', seekerId)
    .limit(50)
    .get();
  if (applicationSnap.docs.some((application) => companyIds.has(getString(application.data().companyId)))) {
    return true;
  }

  const interviewSnap = await db.collection('interviews')
    .where('seekerId', '==', seekerId)
    .limit(50)
    .get();
  return interviewSnap.docs.some((interview) => companyIds.has(getString(interview.data().companyId)));
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
    .get();

  const activePlan = getBestActiveSubscriptionPlan(
    subSnap.docs.map((docSnap) => docSnap.data()),
  );
  if (activePlan) {
    return activePlan;
  }

  if (
    (company.subscriptionStatus === 'active' || company.subscriptionStatus === 'pending_renewal') &&
    company.subscriptionPlan &&
    isFutureDate(company.subscriptionEndsAt)
  ) {
    return normalizePlanSlug(getString(company.subscriptionPlan, 'free'));
  }
  if (company.plan) return normalizePlanSlug(getString(company.plan, 'free'));
  if (company.isPremium === true) return 'premium';
  return 'free';
}

async function resolveCompanyPlanState(
  companyId: string,
  company: Record<string, unknown>,
): Promise<ResolvedSubscriptionState> {
  const subSnap = await db.collection('subscriptions')
    .where('companyId', '==', companyId)
    .get();

  const state = getBestSubscriptionPlanState(subSnap.docs.map((docSnap) => docSnap.data()));
  if (state) return state;

  if (company.subscriptionPlan) {
    const status = getEffectiveSubscriptionStatus({
      status: company.subscriptionStatus,
      endDate: company.subscriptionEndsAt,
    });
    return {
      plan: hasActiveSubscriptionBenefits(status)
        ? normalizePlanSlug(getString(company.subscriptionPlan, 'free'))
        : 'free',
      status,
    };
  }

  if (company.plan) {
    return { plan: normalizePlanSlug(getString(company.plan, 'free')), status: 'active' };
  }
  if (company.isPremium === true) return { plan: 'premium', status: 'active' };
  return { plan: 'free', status: 'active' };
}

async function resolveUserPlanState(userId: string): Promise<ResolvedSubscriptionState> {
  const subSnap = await db.collection('subscriptions')
    .where('userId', '==', userId)
    .get();

  return getBestSubscriptionPlanState(subSnap.docs.map((docSnap) => docSnap.data())) ||
    { plan: 'free', status: 'active' };
}

function getBestActiveSubscriptionPlan(subscriptions: Array<Record<string, unknown>>): PlanSlug | null {
  const now = Date.now();
  let best: PlanSlug | null = null;

  for (const subscription of subscriptions) {
    const status = getString(subscription.status, 'active') as SubscriptionStatus;
    if (status !== 'active' && status !== 'pending_renewal') continue;

    const expiry = getDate(subscription.endDate);
    if (expiry && expiry.getTime() < now) continue;

    const plan = normalizePlanSlug(getString(subscription.plan || subscription.planName, 'free'));
    if (!best || PLAN_RANK[plan] > PLAN_RANK[best]) {
      best = plan;
    }
  }

  return best;
}

function getBestSubscriptionPlanState(
  subscriptions: Array<Record<string, unknown>>,
): ResolvedSubscriptionState | null {
  let bestActive: ResolvedSubscriptionState | null = null;
  let bestInactive: ResolvedSubscriptionState | null = null;

  for (const subscription of subscriptions) {
    const status = getEffectiveSubscriptionStatus(subscription);
    const plan = normalizePlanSlug(getString(subscription.plan || subscription.planName, 'free'));
    const state = { plan, status };

    if (hasActiveSubscriptionBenefits(status)) {
      if (!bestActive || PLAN_RANK[plan] > PLAN_RANK[bestActive.plan]) {
        bestActive = state;
      }
      continue;
    }

    if (!bestInactive || PLAN_RANK[plan] > PLAN_RANK[bestInactive.plan]) {
      bestInactive = state;
    }
  }

  if (bestActive) return bestActive;
  if (bestInactive) return { plan: 'free', status: bestInactive.status };
  return null;
}

function getEffectiveSubscriptionStatus(subscription: Record<string, unknown>): SubscriptionStatus {
  const rawStatus = getString(subscription.status, 'active') as SubscriptionStatus;
  if (rawStatus === 'cancelled') return 'cancelled';

  const expiry = getDate(subscription.endDate);
  if (expiry) {
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'pending_renewal';
  }

  if (rawStatus === 'expired') return 'expired';
  if (rawStatus === 'pending_renewal') return 'pending_renewal';
  return 'active';
}

function hasActiveSubscriptionBenefits(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'pending_renewal';
}

async function expireSubscription(path: string, data: Record<string, unknown>) {
  const ref = db.doc(path);
  await ref.set({
    status: 'expired',
    expiredAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await syncSubscriptionStatus(data, 'expired');
  await createSubscriptionNotification({
    userId: getString(data.userId),
    title: 'Subscription expired',
    message: `${getString(data.planName, 'Your plan')} has expired. Renew to restore plan benefits.`,
    actionUrl: getString(data.audience) === 'seeker' ? '/seeker/subscription' : '/employer/billing',
  });
}

async function syncSubscriptionStatus(
  data: Record<string, unknown>,
  status: SubscriptionStatus,
) {
  const companyId = getString(data.companyId);
  const userId = getString(data.userId);
  const plan = normalizePlanSlug(getString(data.plan, 'free'));
  const isExpired = status === 'expired' || status === 'cancelled';

  if (companyId) {
    await db.doc(`companies/${companyId}`).set({
      isPremium: !isExpired && (plan === 'premium' || plan === 'enterprise'),
      subscriptionStatus: status,
      ...(isExpired ? { subscriptionPlan: 'free' } : { subscriptionPlan: plan }),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  if (userId && getString(data.audience) === 'seeker') {
    await db.doc(`seekerProfiles/${userId}`).set({
      isPremium: !isExpired && (plan === 'premium' || plan === 'enterprise'),
      subscriptionStatus: status,
      ...(isExpired ? { subscriptionPlan: 'free' } : { subscriptionPlan: plan }),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }
}

async function createSubscriptionNotification(data: {
  userId: string;
  title: string;
  message: string;
  actionUrl: string;
}) {
  if (!data.userId) return;

  await db.collection('notifications').add({
    userId: data.userId,
    type: 'subscription',
    title: data.title,
    message: data.message,
    actionUrl: data.actionUrl,
    read: false,
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

function featureAllowed(limits: PlanConfig, feature: string): boolean {
  if (feature === 'featured_job') return limits.canUseFeaturedJobs;
  if (feature === 'urgent_job') return limits.canUseUrgentJobs;
  if (feature === 'premium_badge') return limits.canUsePremiumBadge;
  if (feature === 'advanced_candidate_search') return limits.canUseAdvancedCandidateSearch;
  if (feature === 'lead_dashboard') return limits.canUseLeadDashboard;
  return true;
}

async function countOpenJobs(companyId: string): Promise<number> {
  const snap = await db.collection('jobs')
    .where('companyId', '==', companyId)
    .where('status', '==', 'active')
    .get();
  return snap.docs.filter((job) => {
    const data = job.data();
    return data.isActive === true && !isPastDate(data.expiresAt);
  }).length;
}

async function hasDuplicateJob(companyId: string, normalizedTitle: string, location: string): Promise<boolean> {
  const snap = await db.collection('jobs')
    .where('companyId', '==', companyId)
    .where('normalizedTitle', '==', normalizedTitle)
    .limit(20)
    .get();

  return snap.docs.some((job) => {
    const data = job.data();
    const status = getString(data.status, data.isActive ? 'active' : 'pending');
    if (!['pending', 'active', 'paused', 'reported'].includes(status)) return false;
    if (isPastDate(data.expiresAt)) return false;
    return getString(data.location) === location;
  });
}

function normaliseDuplicateKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectSpamFlags(input: { title: string; description: string }): string[] {
  const text = `${input.title} ${input.description}`.toLowerCase();
  const flags: string[] = [];
  const bannedTerms = ['work from home earn daily', 'registration fee', 'pay first', 'quick money'];
  const urlCount = (text.match(/https?:\/\//g) || []).length;

  if (bannedTerms.some((term) => text.includes(term))) flags.push('spam_terms');
  if (urlCount > 2) flags.push('too_many_links');
  if (input.title.length > 0 && input.title === input.title.toUpperCase() && input.title.length > 18) {
    flags.push('all_caps_title');
  }
  if (input.description.length < 40) flags.push('thin_description');
  return flags;
}

function getWalkInPayload(data: CreateJobPostingData): Record<string, unknown> {
  if (!getBoolean(data.isWalkIn)) return {};
  const walkIn = typeof data.walkIn === 'object' && data.walkIn !== null
    ? data.walkIn as Record<string, unknown>
    : {};

  const date = getString(data.walkInDate || walkIn.date);
  const time = getString(data.walkInTime || walkIn.time);
  const venue = getString(data.walkInVenue || walkIn.venue);
  const contactPerson = getString(data.walkInContactPerson || walkIn.contactPerson);
  const contactMobile = getString(data.walkInContactMobile || walkIn.contactMobile);

  return {
    walkIn: { date, time, venue, contactPerson, contactMobile },
    walkInDate: date,
    walkInTime: time,
    walkInVenue: venue,
    walkInContactPerson: contactPerson,
    walkInContactMobile: contactMobile,
  };
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isPastDate(value: unknown): boolean {
  const date = getDate(value);
  return !!date && date.getTime() < Date.now();
}

async function createJobNotification(data: {
  userId: string;
  title: string;
  message: string;
  actionUrl: string;
}) {
  if (!data.userId) return;

  await db.collection('notifications').add({
    userId: data.userId,
    type: 'job_alert',
    title: data.title,
    message: data.message,
    actionUrl: data.actionUrl,
    read: false,
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
  });
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

function getDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'object' && value !== null) {
    const raw = value as { toDate?: () => Date; seconds?: number };
    if (typeof raw.toDate === 'function') return raw.toDate();
    if (typeof raw.seconds === 'number') return new Date(raw.seconds * 1000);
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function isFutureDate(value: unknown): boolean {
  const date = getDate(value);
  return !!date && date.getTime() >= Date.now();
}

function getNumberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.map((item) => getNumber(item, Number.NaN)).filter((item) => Number.isFinite(item))
    : [];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}
