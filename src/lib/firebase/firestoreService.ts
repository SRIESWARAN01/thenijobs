'use client';

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './config';

// ============================================================
// HELPERS
// ============================================================

/** Convert Firestore Timestamp fields to JS Date for safe serialisation */
function normaliseTimestamps<T extends DocumentData>(data: T): T {
  const result: DocumentData = { ...data };
  for (const key of Object.keys(result)) {
    if (result[key] instanceof Timestamp) {
      result[key] = (result[key] as Timestamp).toDate();
    }
  }
  return result as T;
}

/** Fetch documents from a collection with optional constraints */
async function fetchCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
): Promise<T[]> {
  const q = constraints.length > 0
    ? query(collection(db, collectionName), ...constraints)
    : collection(db, collectionName);

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...normaliseTimestamps(d.data()) }) as unknown as T,
  );
}

/** Fetch a single document by ID */
async function fetchDocument<T>(
  collectionName: string,
  docId: string,
): Promise<T | null> {
  const snap = await getDoc(doc(db, collectionName, docId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...normaliseTimestamps(snap.data()) } as unknown as T;
}

/** Get count of documents matching constraints */
async function getCount(
  collectionName: string,
  constraints: QueryConstraint[] = [],
): Promise<number> {
  const q = constraints.length > 0
    ? query(collection(db, collectionName), ...constraints)
    : collection(db, collectionName);
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

// ============================================================
// PLATFORM STATS (Admin Dashboard)
// ============================================================

export interface PlatformStats {
  totalUsers: number;
  totalBusinesses: number;
  activeJobs: number;
  totalApplications: number;
  totalLeads: number;
  totalRevenue: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const [
    totalUsers,
    totalBusinesses,
    activeJobs,
    totalApplications,
    totalLeads,
  ] = await Promise.all([
    getCount('users'),
    getCount('companies', [where('verificationStatus', '==', 'verified')]),
    getCount('jobs', [where('isActive', '==', true)]),
    getCount('applications'),
    getCount('leads'),
  ]);

  // Revenue: sum active subscriptions
  let totalRevenue = 0;
  try {
    const subs = await fetchCollection<{ amount: number; status: string }>(
      'subscriptions',
      [where('status', '==', 'active')],
    );
    totalRevenue = subs.reduce((sum, s) => sum + (s.amount || 0), 0);
  } catch {
    // subscriptions collection may not exist yet
  }

  return {
    totalUsers,
    totalBusinesses,
    activeJobs,
    totalApplications,
    totalLeads,
    totalRevenue,
  };
}

// ============================================================
// EMPLOYER STATS
// ============================================================

export interface EmployerStats {
  activeJobs: number;
  totalApplications: number;
  shortlisted: number;
  interviews: number;
  hired: number;
  profileViews: number;
}

export async function getEmployerStats(
  companyId: string,
): Promise<EmployerStats> {
  const [activeJobs, totalApplications, shortlisted, interviews, hired] =
    await Promise.all([
      getCount('jobs', [
        where('companyId', '==', companyId),
        where('isActive', '==', true),
      ]),
      getCount('applications', [where('companyId', '==', companyId)]),
      getCount('applications', [
        where('companyId', '==', companyId),
        where('status', '==', 'shortlisted'),
      ]),
      getCount('interviews', [where('companyId', '==', companyId)]),
      getCount('applications', [
        where('companyId', '==', companyId),
        where('status', '==', 'selected'),
      ]),
    ]);

  // Profile views from company document
  let profileViews = 0;
  try {
    const company = await fetchDocument<{ viewCount?: number }>(
      'companies',
      companyId,
    );
    profileViews = company?.viewCount || 0;
  } catch {
    // ignore
  }

  return {
    activeJobs,
    totalApplications,
    shortlisted,
    interviews,
    hired,
    profileViews,
  };
}

// ============================================================
// SEEKER STATS
// ============================================================

export interface SeekerStats {
  appliedJobs: number;
  savedJobs: number;
  interviews: number;
  profileViews: number;
}

export async function getSeekerStats(seekerId: string): Promise<SeekerStats> {
  const [appliedJobs, savedJobs, interviews] = await Promise.all([
    getCount('applications', [where('seekerId', '==', seekerId)]),
    getCount('savedJobs', [where('userId', '==', seekerId)]),
    getCount('interviews', [where('seekerId', '==', seekerId)]),
  ]);

  let profileViews = 0;
  try {
    const profile = await fetchDocument<{ viewCount?: number }>(
      'seekerProfiles',
      seekerId,
    );
    profileViews = profile?.viewCount || 0;
  } catch {
    // ignore
  }

  return { appliedJobs, savedJobs, interviews, profileViews };
}

// ============================================================
// COMPANIES
// ============================================================

export async function getCompanies(filters?: {
  status?: string;
  category?: string;
  district?: string;
  isFeatured?: boolean;
  search?: string;
  limitCount?: number;
}) {
  const constraints: QueryConstraint[] = [];

  if (filters?.status) {
    constraints.push(where('verificationStatus', '==', filters.status));
  }
  if (filters?.category) {
    constraints.push(where('category', '==', filters.category));
  }
  if (filters?.district) {
    constraints.push(where('district', '==', filters.district));
  }
  if (filters?.isFeatured !== undefined) {
    constraints.push(where('isFeatured', '==', filters.isFeatured));
  }
  if (filters?.limitCount) {
    constraints.push(limit(filters.limitCount));
  }

  return fetchCollection<DocumentData>('companies', constraints);
}

export async function getCompanyBySlug(slug: string) {
  const results = await fetchCollection<DocumentData>('companies', [
    where('slug', '==', slug),
    limit(1),
  ]);
  return results[0] || null;
}

// ============================================================
// JOBS
// ============================================================

export async function getJobs(filters?: {
  isActive?: boolean;
  companyId?: string;
  category?: string;
  district?: string;
  jobType?: string;
  isFeatured?: boolean;
  isUrgent?: boolean;
  limitCount?: number;
}) {
  const constraints: QueryConstraint[] = [];

  if (filters?.isActive !== undefined) {
    constraints.push(where('isActive', '==', filters.isActive));
  }
  if (filters?.companyId) {
    constraints.push(where('companyId', '==', filters.companyId));
  }
  if (filters?.category) {
    constraints.push(where('category', '==', filters.category));
  }
  if (filters?.district) {
    constraints.push(where('district', '==', filters.district));
  }
  if (filters?.jobType) {
    constraints.push(where('jobType', '==', filters.jobType));
  }
  if (filters?.isFeatured !== undefined) {
    constraints.push(where('isFeatured', '==', filters.isFeatured));
  }
  if (filters?.limitCount) {
    constraints.push(limit(filters.limitCount));
  }

  return fetchCollection<DocumentData>('jobs', constraints);
}

export async function getJobById(jobId: string) {
  return fetchDocument<DocumentData>('jobs', jobId);
}

// ============================================================
// APPLICATIONS
// ============================================================

export async function getApplications(filters?: {
  seekerId?: string;
  companyId?: string;
  jobId?: string;
  status?: string;
}) {
  const constraints: QueryConstraint[] = [];

  if (filters?.seekerId) {
    constraints.push(where('seekerId', '==', filters.seekerId));
  }
  if (filters?.companyId) {
    constraints.push(where('companyId', '==', filters.companyId));
  }
  if (filters?.jobId) {
    constraints.push(where('jobId', '==', filters.jobId));
  }
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }

  return fetchCollection<DocumentData>('applications', constraints);
}

export async function applyToJob(data: {
  jobId: string;
  companyId: string;
  seekerId: string;
  seekerName: string;
  resumeUrl?: string;
  coverLetter?: string;
}) {
  const docRef = await addDoc(collection(db, 'applications'), {
    ...data,
    status: 'applied',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Log activity
  await logActivity({
    userId: data.seekerId,
    userName: data.seekerName,
    action: 'Applied to job',
    target: data.jobId,
    targetId: data.jobId,
  });

  // Create notification for employer
  await createNotification({
    userId: data.companyId, // will need to resolve to company owner
    type: 'application_update',
    title: 'New Job Application',
    message: `${data.seekerName} applied to your job posting`,
    actionUrl: `/employer/candidates`,
  });

  return docRef.id;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string,
  note?: string,
) {
  await updateDoc(doc(db, 'applications', applicationId), {
    status,
    ...(note ? { employerNote: note } : {}),
    updatedAt: serverTimestamp(),
  });
}

// ============================================================
// SAVED JOBS
// ============================================================

export async function saveJob(userId: string, jobId: string) {
  await addDoc(collection(db, 'savedJobs'), {
    userId,
    jobId,
    createdAt: serverTimestamp(),
  });
}

export async function unsaveJob(userId: string, jobId: string) {
  const results = await fetchCollection<{ id: string }>('savedJobs', [
    where('userId', '==', userId),
    where('jobId', '==', jobId),
  ]);
  for (const result of results) {
    await deleteDoc(doc(db, 'savedJobs', result.id));
  }
}

export async function getSavedJobs(userId: string) {
  return fetchCollection<DocumentData>('savedJobs', [
    where('userId', '==', userId),
  ]);
}

// ============================================================
// LEADS
// ============================================================

export async function getLeads(filters?: {
  companyId?: string;
  status?: string;
}) {
  const constraints: QueryConstraint[] = [];
  if (filters?.companyId) {
    constraints.push(where('companyId', '==', filters.companyId));
  }
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  return fetchCollection<DocumentData>('leads', constraints);
}

export async function updateLeadStatus(leadId: string, status: string, notes?: string) {
  await updateDoc(doc(db, 'leads', leadId), {
    status,
    ...(notes ? { notes } : {}),
    updatedAt: serverTimestamp(),
  });
}

// ============================================================
// REVIEWS
// ============================================================

export async function getReviews(targetId?: string) {
  const constraints: QueryConstraint[] = [];
  if (targetId) {
    constraints.push(where('targetId', '==', targetId));
  }
  return fetchCollection<DocumentData>('reviews', constraints);
}

// ============================================================
// INTERVIEWS
// ============================================================

export async function getInterviews(filters?: {
  seekerId?: string;
  employerId?: string;
  companyId?: string;
}) {
  const constraints: QueryConstraint[] = [];
  if (filters?.seekerId) {
    constraints.push(where('seekerId', '==', filters.seekerId));
  }
  if (filters?.employerId) {
    constraints.push(where('employerId', '==', filters.employerId));
  }
  if (filters?.companyId) {
    constraints.push(where('companyId', '==', filters.companyId));
  }
  return fetchCollection<DocumentData>('interviews', constraints);
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
}) {
  return addDoc(collection(db, 'notifications'), {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function getNotifications(userId: string) {
  return fetchCollection<DocumentData>('notifications', [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50),
  ]);
}

export async function markNotificationRead(notificationId: string) {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
}

export async function markAllNotificationsRead(userId: string) {
  const notifications = await fetchCollection<{ id: string }>('notifications', [
    where('userId', '==', userId),
    where('read', '==', false),
  ]);
  await Promise.all(
    notifications.map((n) =>
      updateDoc(doc(db, 'notifications', n.id), { read: true }),
    ),
  );
}

// ============================================================
// ADMIN ACTIONS
// ============================================================

export async function approveCompany(companyId: string, adminId: string) {
  await updateDoc(doc(db, 'companies', companyId), {
    verificationStatus: 'verified',
    isActive: true,
    updatedAt: serverTimestamp(),
  });

  const company = await fetchDocument<{ ownerId?: string; name?: string }>(
    'companies',
    companyId,
  );

  if (company?.ownerId) {
    await createNotification({
      userId: company.ownerId,
      type: 'system',
      title: 'Business Approved! 🎉',
      message: `Your business "${company.name}" has been approved and is now live on THENIJOBS.`,
      actionUrl: `/employer/company-profile`,
    });
  }

  await logActivity({
    userId: adminId,
    userName: 'Admin',
    action: 'Business approved',
    target: company?.name || companyId,
    targetId: companyId,
  });
}

export async function rejectCompany(
  companyId: string,
  adminId: string,
  reason?: string,
) {
  await updateDoc(doc(db, 'companies', companyId), {
    verificationStatus: 'rejected',
    isActive: false,
    rejectionReason: reason || '',
    updatedAt: serverTimestamp(),
  });

  const company = await fetchDocument<{ ownerId?: string; name?: string }>(
    'companies',
    companyId,
  );

  if (company?.ownerId) {
    await createNotification({
      userId: company.ownerId,
      type: 'system',
      title: 'Business Review Update',
      message: `Your business "${company.name}" requires changes. ${reason || ''}`,
      actionUrl: `/employer/company-profile`,
    });
  }

  await logActivity({
    userId: adminId,
    userName: 'Admin',
    action: 'Business rejected',
    target: company?.name || companyId,
    targetId: companyId,
  });
}

export async function featureCompany(companyId: string, isFeatured: boolean) {
  await updateDoc(doc(db, 'companies', companyId), {
    isFeatured,
    updatedAt: serverTimestamp(),
  });
}

export async function verifyCompany(companyId: string) {
  await updateDoc(doc(db, 'companies', companyId), {
    'verificationBadges.businessVerified': true,
    updatedAt: serverTimestamp(),
  });
}

export async function approveJob(jobId: string, adminId: string) {
  await updateDoc(doc(db, 'jobs', jobId), {
    isActive: true,
    status: 'active',
    updatedAt: serverTimestamp(),
  });

  const job = await fetchDocument<{ postedBy?: string; title?: string }>(
    'jobs',
    jobId,
  );

  if (job?.postedBy) {
    await createNotification({
      userId: job.postedBy,
      type: 'system',
      title: 'Job Approved! ✅',
      message: `Your job posting "${job.title}" is now live.`,
      actionUrl: `/employer/jobs`,
    });
  }

  await logActivity({
    userId: adminId,
    userName: 'Admin',
    action: 'Job approved',
    target: job?.title || jobId,
    targetId: jobId,
  });
}

export async function rejectJob(jobId: string, adminId: string) {
  await updateDoc(doc(db, 'jobs', jobId), {
    isActive: false,
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });

  await logActivity({
    userId: adminId,
    userName: 'Admin',
    action: 'Job rejected',
    target: jobId,
    targetId: jobId,
  });
}

export async function updateUserRole(
  uid: string,
  role: string,
  adminId: string,
) {
  await updateDoc(doc(db, 'users', uid), {
    role,
    updatedAt: serverTimestamp(),
  });

  await logActivity({
    userId: adminId,
    userName: 'Admin',
    action: `User role updated to ${role}`,
    target: uid,
    targetId: uid,
  });
}

export async function verifyUser(uid: string, adminId: string) {
  await updateDoc(doc(db, 'users', uid), {
    isVerified: true,
    updatedAt: serverTimestamp(),
  });

  await createNotification({
    userId: uid,
    type: 'system',
    title: 'Account Verified! ✅',
    message: 'Your account has been verified by the THENIJOBS team.',
  });

  await logActivity({
    userId: adminId,
    userName: 'Admin',
    action: 'User verified',
    target: uid,
    targetId: uid,
  });
}

// ============================================================
// USERS
// ============================================================

export async function getUsers(filters?: {
  role?: string;
  isVerified?: boolean;
  limitCount?: number;
}) {
  const constraints: QueryConstraint[] = [];
  if (filters?.role) {
    constraints.push(where('role', '==', filters.role));
  }
  if (filters?.isVerified !== undefined) {
    constraints.push(where('isVerified', '==', filters.isVerified));
  }
  if (filters?.limitCount) {
    constraints.push(limit(filters.limitCount));
  }
  return fetchCollection<DocumentData>('users', constraints);
}

// ============================================================
// SERVICES
// ============================================================

export async function getServices(filters?: {
  status?: string;
  category?: string;
  district?: string;
  providerId?: string;
}) {
  const constraints: QueryConstraint[] = [];
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters?.category) {
    constraints.push(where('category', '==', filters.category));
  }
  if (filters?.district) {
    constraints.push(where('district', '==', filters.district));
  }
  if (filters?.providerId) {
    constraints.push(where('providerId', '==', filters.providerId));
  }
  return fetchCollection<DocumentData>('services', constraints);
}

// ============================================================
// SUBSCRIPTIONS
// ============================================================

export async function getSubscriptions(filters?: {
  userId?: string;
  status?: string;
}) {
  const constraints: QueryConstraint[] = [];
  if (filters?.userId) {
    constraints.push(where('userId', '==', filters.userId));
  }
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  return fetchCollection<DocumentData>('subscriptions', constraints);
}

// ============================================================
// ADVERTISEMENTS
// ============================================================

export async function getAdvertisements(filters?: { status?: string }) {
  const constraints: QueryConstraint[] = [];
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  return fetchCollection<DocumentData>('advertisements', constraints);
}

// ============================================================
// ACTIVITY LOG
// ============================================================

export async function logActivity(data: {
  userId: string;
  userName: string;
  action: string;
  target: string;
  targetId: string;
  details?: string;
}) {
  return addDoc(collection(db, 'activityLogs'), {
    ...data,
    timestamp: serverTimestamp(),
  });
}

export async function getActivityLogs(limitCount = 20) {
  return fetchCollection<DocumentData>('activityLogs', [
    orderBy('timestamp', 'desc'),
    limit(limitCount),
  ]);
}

// ============================================================
// GENERIC DOCUMENT OPERATIONS
// ============================================================

export async function createDocument(
  collectionName: string,
  data: DocumentData,
) {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>,
) {
  await updateDoc(doc(db, collectionName, docId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(collectionName: string, docId: string) {
  await deleteDoc(doc(db, collectionName, docId));
}

export { fetchCollection, fetchDocument, getCount };
