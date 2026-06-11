"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processJobAutomation = exports.processSubscriptionAutomation = exports.createNotification = exports.validateSubscriptionAccess = exports.createJobPosting = exports.healthCheck = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firebase_functions_1 = require("firebase-functions");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
(0, app_1.initializeApp)();
const REGION = 'asia-south1';
const db = (0, firestore_1.getFirestore)();
const DEFAULT_PLANS = {
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
const PLAN_RANK = {
    free: 0,
    basic: 1,
    premium: 2,
    enterprise: 3,
};
const REMINDER_DAYS = [30, 7, 1];
const JOB_VALIDITY_DAYS = 30;
const JOB_REMINDER_DAYS = [7, 3, 1];
exports.healthCheck = (0, https_1.onCall)({ region: REGION }, () => {
    firebase_functions_1.logger.info('Functions health check called.');
    return {
        ok: true,
        service: 'thenijobs-functions',
    };
});
exports.createJobPosting = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = requireUid(request);
    const authUser = await (0, auth_1.getAuth)().getUser(uid);
    if (!authUser.emailVerified) {
        throw new https_1.HttpsError('failed-precondition', 'Please verify your email address before posting jobs.');
    }
    const userSnap = await db.doc(`users/${uid}`).get();
    const user = userSnap.data();
    if (!user) {
        throw new https_1.HttpsError('permission-denied', 'User profile not found.');
    }
    if (!['employer', 'business_owner'].includes(String(user.role))) {
        throw new https_1.HttpsError('permission-denied', 'Only employers can post jobs.');
    }
    const data = request.data;
    const companyId = getRequiredString(data.companyId, 'companyId');
    const companySnap = await db.doc(`companies/${companyId}`).get();
    const company = companySnap.data();
    if (!company) {
        throw new https_1.HttpsError('not-found', 'Company profile not found.');
    }
    if (company.ownerId !== uid) {
        throw new https_1.HttpsError('permission-denied', 'You can only post jobs for your own company.');
    }
    if (company.deleted === true || company.isActive === false || company.status === 'deleted') {
        throw new https_1.HttpsError('failed-precondition', 'Deleted or inactive companies cannot post jobs.');
    }
    const plans = await getPlanConfigs();
    const plan = await resolveCompanyPlan(companyId, company);
    const limits = plans[plan];
    const activeCount = await countOpenJobs(companyId);
    if (!isUnlimited(limits.maxActiveJobs) && activeCount >= limits.maxActiveJobs) {
        throw new https_1.HttpsError('resource-exhausted', `${limits.slug} plan allows ${limits.maxActiveJobs} open job posting(s).`);
    }
    const isFeatured = getBoolean(data.isFeatured);
    const isUrgent = getBoolean(data.isUrgent);
    const isPremium = getBoolean(data.isPremium);
    if (isFeatured && !limits.canUseFeaturedJobs) {
        throw new https_1.HttpsError('failed-precondition', 'Featured jobs are not enabled for this plan.');
    }
    if (isUrgent && !limits.canUseUrgentJobs) {
        throw new https_1.HttpsError('failed-precondition', 'Urgent jobs are not enabled for this plan.');
    }
    if (isPremium && !limits.canUsePremiumBadge) {
        throw new https_1.HttpsError('failed-precondition', 'Premium job badges are not enabled for this plan.');
    }
    const title = getRequiredString(data.title, 'title');
    const description = getRequiredString(data.description, 'description');
    const district = getRequiredString(data.district, 'district');
    const location = getString(data.location);
    const normalizedTitle = normaliseDuplicateKey(title);
    const duplicate = await hasDuplicateJob(companyId, normalizedTitle, location);
    if (duplicate) {
        throw new https_1.HttpsError('already-exists', 'A matching job is already pending or active for this company and location.');
    }
    const postedAt = new Date();
    const expiresAt = addDays(postedAt, JOB_VALIDITY_DAYS);
    const spamFlags = detectSpamFlags({ title, description });
    const status = spamFlags.length > 0 ? 'reported' : 'pending';
    const now = firestore_1.FieldValue.serverTimestamp();
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
        postedAt: firestore_1.Timestamp.fromDate(postedAt),
        expiresAt: firestore_1.Timestamp.fromDate(expiresAt),
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
        timestamp: firestore_1.FieldValue.serverTimestamp(),
    });
    return {
        jobId: jobRef.id,
        plan,
        remainingJobSlots: isUnlimited(limits.maxActiveJobs)
            ? null
            : Math.max(0, limits.maxActiveJobs - activeCount - 1),
    };
});
exports.validateSubscriptionAccess = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = requireUid(request);
    const companyId = getString(request.data.companyId);
    const feature = getString(request.data.feature);
    const plans = await getPlanConfigs();
    let plan = 'free';
    let subscriptionStatus = 'active';
    if (companyId) {
        const companySnap = await db.doc(`companies/${companyId}`).get();
        const company = companySnap.data();
        if (!company) {
            throw new https_1.HttpsError('not-found', 'Company profile not found.');
        }
        if (company.ownerId !== uid) {
            throw new https_1.HttpsError('permission-denied', 'You can only validate your own company subscription.');
        }
        const state = await resolveCompanyPlanState(companyId, company);
        plan = state.plan;
        subscriptionStatus = state.status;
    }
    else {
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
});
exports.createNotification = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const uid = requireUid(request);
    const data = request.data ?? {};
    const userId = getRequiredString(data.userId, 'userId');
    const type = getString(data.type, 'system').slice(0, 50);
    const title = getRequiredString(data.title, 'title').slice(0, 140);
    const message = getRequiredString(data.message, 'message').slice(0, 600);
    const actionUrl = getString(data.actionUrl).slice(0, 300);
    const allowed = userId === uid ||
        await isAdminRequest(request) ||
        await canNotifyRelatedUser(uid, userId);
    if (!allowed) {
        throw new https_1.HttpsError('permission-denied', 'You do not have permission to notify this user.');
    }
    const notificationRef = await db.collection('notifications').add({
        userId,
        type,
        title,
        message,
        ...(actionUrl ? { actionUrl } : {}),
        read: false,
        isRead: false,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
    return { ok: true, notificationId: notificationRef.id };
});
exports.processSubscriptionAutomation = (0, scheduler_1.onSchedule)({
    region: REGION,
    schedule: 'every 24 hours',
    timeZone: 'Asia/Kolkata',
}, async () => {
    const now = new Date();
    const snapshot = await db.collection('subscriptions')
        .where('status', 'in', ['active', 'pending_renewal'])
        .get();
    firebase_functions_1.logger.info('Processing subscription automation.', { count: snapshot.size });
    for (const subscription of snapshot.docs) {
        const data = subscription.data();
        const expiry = getDate(data.endDate);
        if (!expiry)
            continue;
        const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const reminderDaysSent = getNumberArray(data.expiryReminderDaysSent);
        const updates = {
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
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
});
exports.processJobAutomation = (0, scheduler_1.onSchedule)({
    region: REGION,
    schedule: 'every 24 hours',
    timeZone: 'Asia/Kolkata',
}, async () => {
    const now = new Date();
    const snapshot = await db.collection('jobs')
        .where('status', 'in', ['active', 'paused'])
        .get();
    firebase_functions_1.logger.info('Processing job expiry automation.', { count: snapshot.size });
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
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                }, { merge: true });
                continue;
            }
        }
        const expiry = getDate(data.expiresAt);
        if (!expiry)
            continue;
        const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const reminderDaysSent = getNumberArray(data.expiryReminderDaysSent);
        if (daysUntilExpiry < 0) {
            await job.ref.set({
                status: 'expired',
                isActive: false,
                expiredAt: firestore_1.FieldValue.serverTimestamp(),
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
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
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
        }
    }
});
function requireUid(request) {
    if (!request.auth?.uid) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication is required.');
    }
    return request.auth.uid;
}
async function isAdminRequest(request) {
    const token = request.auth?.token;
    if (token?.admin === true || token?.super_admin === true)
        return true;
    const uid = request.auth?.uid;
    if (!uid)
        return false;
    const userSnap = await db.doc(`users/${uid}`).get();
    const role = getString(userSnap.data()?.role);
    return role === 'admin' || role === 'super_admin';
}
async function canNotifyRelatedUser(senderId, targetUserId) {
    if (await seekerHasApplicationWithCompanyOwner(senderId, targetUserId))
        return true;
    return companyOwnerHasCandidateRelationship(senderId, targetUserId);
}
async function seekerHasApplicationWithCompanyOwner(seekerId, ownerId) {
    const applicationSnap = await db.collection('applications')
        .where('seekerId', '==', seekerId)
        .limit(20)
        .get();
    for (const application of applicationSnap.docs) {
        const companyId = getString(application.data().companyId);
        if (!companyId)
            continue;
        const companySnap = await db.doc(`companies/${companyId}`).get();
        if (companySnap.data()?.ownerId === ownerId)
            return true;
    }
    return false;
}
async function companyOwnerHasCandidateRelationship(ownerId, seekerId) {
    const companySnap = await db.collection('companies')
        .where('ownerId', '==', ownerId)
        .limit(20)
        .get();
    const companyIds = new Set(companySnap.docs.map((company) => company.id));
    if (companyIds.size === 0)
        return false;
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
async function getPlanConfigs() {
    const snap = await db.doc('settings/subscriptionPlans').get();
    const remote = snap.exists ? snap.data() : undefined;
    return {
        free: mergePlan('free', remote?.free),
        basic: mergePlan('basic', remote?.basic),
        premium: mergePlan('premium', remote?.premium),
        enterprise: mergePlan('enterprise', remote?.enterprise),
    };
}
function mergePlan(slug, value) {
    if (!value || typeof value !== 'object')
        return DEFAULT_PLANS[slug];
    const raw = value;
    return {
        ...DEFAULT_PLANS[slug],
        maxActiveJobs: getNumber(raw.maxActiveJobs, DEFAULT_PLANS[slug].maxActiveJobs),
        maxGalleryImages: getNumber(raw.maxGalleryImages, DEFAULT_PLANS[slug].maxGalleryImages),
        maxJobAlerts: getNumber(raw.maxJobAlerts, DEFAULT_PLANS[slug].maxJobAlerts),
        aiRequestsPerMonth: getNumber(raw.aiRequestsPerMonth, DEFAULT_PLANS[slug].aiRequestsPerMonth),
        canUseFeaturedJobs: getBoolean(raw.canUseFeaturedJobs, DEFAULT_PLANS[slug].canUseFeaturedJobs),
        canUseUrgentJobs: getBoolean(raw.canUseUrgentJobs, DEFAULT_PLANS[slug].canUseUrgentJobs),
        canUsePremiumBadge: getBoolean(raw.canUsePremiumBadge, DEFAULT_PLANS[slug].canUsePremiumBadge),
        canUseAdvancedCandidateSearch: getBoolean(raw.canUseAdvancedCandidateSearch, DEFAULT_PLANS[slug].canUseAdvancedCandidateSearch),
        canUseLeadDashboard: getBoolean(raw.canUseLeadDashboard, DEFAULT_PLANS[slug].canUseLeadDashboard),
        slug,
    };
}
async function resolveCompanyPlan(companyId, company) {
    const subSnap = await db.collection('subscriptions')
        .where('companyId', '==', companyId)
        .get();
    const activePlan = getBestActiveSubscriptionPlan(subSnap.docs.map((docSnap) => docSnap.data()));
    if (activePlan) {
        return activePlan;
    }
    if ((company.subscriptionStatus === 'active' || company.subscriptionStatus === 'pending_renewal') &&
        company.subscriptionPlan &&
        isFutureDate(company.subscriptionEndsAt)) {
        return normalizePlanSlug(getString(company.subscriptionPlan, 'free'));
    }
    if (company.plan)
        return normalizePlanSlug(getString(company.plan, 'free'));
    if (company.isPremium === true)
        return 'premium';
    return 'free';
}
async function resolveCompanyPlanState(companyId, company) {
    const subSnap = await db.collection('subscriptions')
        .where('companyId', '==', companyId)
        .get();
    const state = getBestSubscriptionPlanState(subSnap.docs.map((docSnap) => docSnap.data()));
    if (state)
        return state;
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
    if (company.isPremium === true)
        return { plan: 'premium', status: 'active' };
    return { plan: 'free', status: 'active' };
}
async function resolveUserPlanState(userId) {
    const subSnap = await db.collection('subscriptions')
        .where('userId', '==', userId)
        .get();
    return getBestSubscriptionPlanState(subSnap.docs.map((docSnap) => docSnap.data())) ||
        { plan: 'free', status: 'active' };
}
function getBestActiveSubscriptionPlan(subscriptions) {
    const now = Date.now();
    let best = null;
    for (const subscription of subscriptions) {
        const status = getString(subscription.status, 'active');
        if (status !== 'active' && status !== 'pending_renewal')
            continue;
        const expiry = getDate(subscription.endDate);
        if (expiry && expiry.getTime() < now)
            continue;
        const plan = normalizePlanSlug(getString(subscription.plan || subscription.planName, 'free'));
        if (!best || PLAN_RANK[plan] > PLAN_RANK[best]) {
            best = plan;
        }
    }
    return best;
}
function getBestSubscriptionPlanState(subscriptions) {
    let bestActive = null;
    let bestInactive = null;
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
    if (bestActive)
        return bestActive;
    if (bestInactive)
        return { plan: 'free', status: bestInactive.status };
    return null;
}
function getEffectiveSubscriptionStatus(subscription) {
    const rawStatus = getString(subscription.status, 'active');
    if (rawStatus === 'cancelled')
        return 'cancelled';
    const expiry = getDate(subscription.endDate);
    if (expiry) {
        const daysUntilExpiry = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry < 0)
            return 'expired';
        if (daysUntilExpiry <= 30)
            return 'pending_renewal';
    }
    if (rawStatus === 'expired')
        return 'expired';
    if (rawStatus === 'pending_renewal')
        return 'pending_renewal';
    return 'active';
}
function hasActiveSubscriptionBenefits(status) {
    return status === 'active' || status === 'pending_renewal';
}
async function expireSubscription(path, data) {
    const ref = db.doc(path);
    await ref.set({
        status: 'expired',
        expiredAt: firestore_1.FieldValue.serverTimestamp(),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    await syncSubscriptionStatus(data, 'expired');
    await createSubscriptionNotification({
        userId: getString(data.userId),
        title: 'Subscription expired',
        message: `${getString(data.planName, 'Your plan')} has expired. Renew to restore plan benefits.`,
        actionUrl: getString(data.audience) === 'seeker' ? '/seeker/subscription' : '/employer/billing',
    });
}
async function syncSubscriptionStatus(data, status) {
    const companyId = getString(data.companyId);
    const userId = getString(data.userId);
    const plan = normalizePlanSlug(getString(data.plan, 'free'));
    const isExpired = status === 'expired' || status === 'cancelled';
    if (companyId) {
        await db.doc(`companies/${companyId}`).set({
            isPremium: !isExpired && (plan === 'premium' || plan === 'enterprise'),
            subscriptionStatus: status,
            ...(isExpired ? { subscriptionPlan: 'free' } : { subscriptionPlan: plan }),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    if (userId && getString(data.audience) === 'seeker') {
        await db.doc(`seekerProfiles/${userId}`).set({
            isPremium: !isExpired && (plan === 'premium' || plan === 'enterprise'),
            subscriptionStatus: status,
            ...(isExpired ? { subscriptionPlan: 'free' } : { subscriptionPlan: plan }),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
}
async function createSubscriptionNotification(data) {
    if (!data.userId)
        return;
    await db.collection('notifications').add({
        userId: data.userId,
        type: 'subscription',
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        read: false,
        isRead: false,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
}
function featureAllowed(limits, feature) {
    if (feature === 'featured_job')
        return limits.canUseFeaturedJobs;
    if (feature === 'urgent_job')
        return limits.canUseUrgentJobs;
    if (feature === 'premium_badge')
        return limits.canUsePremiumBadge;
    if (feature === 'advanced_candidate_search')
        return limits.canUseAdvancedCandidateSearch;
    if (feature === 'lead_dashboard')
        return limits.canUseLeadDashboard;
    return true;
}
async function countOpenJobs(companyId) {
    const snap = await db.collection('jobs')
        .where('companyId', '==', companyId)
        .where('status', '==', 'active')
        .get();
    return snap.docs.filter((job) => {
        const data = job.data();
        return data.isActive === true && !isPastDate(data.expiresAt);
    }).length;
}
async function hasDuplicateJob(companyId, normalizedTitle, location) {
    const snap = await db.collection('jobs')
        .where('companyId', '==', companyId)
        .where('normalizedTitle', '==', normalizedTitle)
        .limit(20)
        .get();
    return snap.docs.some((job) => {
        const data = job.data();
        const status = getString(data.status, data.isActive ? 'active' : 'pending');
        if (!['pending', 'active', 'paused', 'reported'].includes(status))
            return false;
        if (isPastDate(data.expiresAt))
            return false;
        return getString(data.location) === location;
    });
}
function normaliseDuplicateKey(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function detectSpamFlags(input) {
    const text = `${input.title} ${input.description}`.toLowerCase();
    const flags = [];
    const bannedTerms = ['work from home earn daily', 'registration fee', 'pay first', 'quick money'];
    const urlCount = (text.match(/https?:\/\//g) || []).length;
    if (bannedTerms.some((term) => text.includes(term)))
        flags.push('spam_terms');
    if (urlCount > 2)
        flags.push('too_many_links');
    if (input.title.length > 0 && input.title === input.title.toUpperCase() && input.title.length > 18) {
        flags.push('all_caps_title');
    }
    if (input.description.length < 40)
        flags.push('thin_description');
    return flags;
}
function getWalkInPayload(data) {
    if (!getBoolean(data.isWalkIn))
        return {};
    const walkIn = typeof data.walkIn === 'object' && data.walkIn !== null
        ? data.walkIn
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
function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}
function isPastDate(value) {
    const date = getDate(value);
    return !!date && date.getTime() < Date.now();
}
async function createJobNotification(data) {
    if (!data.userId)
        return;
    await db.collection('notifications').add({
        userId: data.userId,
        type: 'job_alert',
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        read: false,
        isRead: false,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
}
function normalizePlanSlug(value) {
    const normalized = value.toLowerCase().replace(/\s+plan$/, '').trim();
    if (normalized === 'basic' || normalized === 'premium' || normalized === 'enterprise') {
        return normalized;
    }
    return 'free';
}
function isUnlimited(value) {
    return value < 0 || !Number.isFinite(value);
}
function getRequiredString(value, field) {
    const text = getString(value);
    if (!text) {
        throw new https_1.HttpsError('invalid-argument', `${field} is required.`);
    }
    return text;
}
function getString(value, fallback = '') {
    return typeof value === 'string' ? value.trim() : fallback;
}
function getStringArray(value) {
    return Array.isArray(value)
        ? value.map((item) => getString(item)).filter((item) => item.length > 0)
        : [];
}
function getBoolean(value, fallback = false) {
    return typeof value === 'boolean' ? value : fallback;
}
function getNumber(value, fallback) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed))
            return parsed;
    }
    return fallback;
}
function getNullableNumber(value) {
    if (value === null || value === undefined || value === '')
        return null;
    const parsed = getNumber(value, Number.NaN);
    return Number.isFinite(parsed) ? parsed : null;
}
function getDate(value) {
    if (!value)
        return null;
    if (value instanceof Date)
        return value;
    if (value instanceof firestore_1.Timestamp)
        return value.toDate();
    if (typeof value === 'object' && value !== null) {
        const raw = value;
        if (typeof raw.toDate === 'function')
            return raw.toDate();
        if (typeof raw.seconds === 'number')
            return new Date(raw.seconds * 1000);
    }
    if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }
    return null;
}
function isFutureDate(value) {
    const date = getDate(value);
    return !!date && date.getTime() >= Date.now();
}
function getNumberArray(value) {
    return Array.isArray(value)
        ? value.map((item) => getNumber(item, Number.NaN)).filter((item) => Number.isFinite(item))
        : [];
}
function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 72);
}
//# sourceMappingURL=index.js.map