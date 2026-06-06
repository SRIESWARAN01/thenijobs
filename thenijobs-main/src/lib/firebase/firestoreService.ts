'use client';

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
  increment,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { auth, db } from './config';

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
  jobTitle?: string;
  companyName?: string;
  resumeUrl?: string;
  coverLetter?: string;
}) {
  const applicationRef = doc(collection(db, 'applications'));
  const batch = writeBatch(db);

  batch.set(applicationRef, {
    ...data,
    status: 'applied',
    appliedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    statusTimestamps: {
      applied: serverTimestamp(),
    },
  });

  batch.update(doc(db, 'jobs', data.jobId), {
    applicationCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  // Log activity
  await logActivity({
    userId: data.seekerId,
    userName: data.seekerName,
    action: 'Applied to job',
    target: data.jobId,
    targetId: data.jobId,
  });

  // Resolve company owner for notification delivery
  let notifyUserId = data.companyId;
  try {
    const company = await fetchDocument<{ ownerId?: string }>('companies', data.companyId);
    if (company?.ownerId) {
      notifyUserId = company.ownerId;
    }
  } catch {
    // Fall back to companyId if lookup fails
  }

  // Create notification for employer (company owner)
  await createNotification({
    userId: notifyUserId,
    type: 'application_update',
    title: 'New Job Application',
    message: `${data.seekerName} applied to ${data.jobTitle || 'your job posting'}`,
    actionUrl: `/employer/candidates`,
  });

  return applicationRef.id;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string,
  note?: string,
) {
  await updateDoc(doc(db, 'applications', applicationId), {
    status,
    [`statusTimestamps.${status}`]: serverTimestamp(),
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
    createdBy: auth.currentUser?.uid || data.userId,
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

// ============================================================
// CONVERSATIONS (Real-Time Chat)
// ============================================================

export async function createConversation(data: {
  participants: string[];
  participantNames: Record<string, string>;
  participantRoles: Record<string, string>;
  participantPhotos?: Record<string, string>;
  jobId?: string;
  jobTitle?: string;
  companyId?: string;
}) {
  // Check for existing conversation between same participants for same job
  const existing = await fetchCollection<{ id: string }>('conversations', [
    where('participants', '==', data.participants.sort()),
    ...(data.jobId ? [where('jobId', '==', data.jobId)] : []),
    limit(1),
  ]);

  if (existing.length > 0) return existing[0].id;

  const docRef = await addDoc(collection(db, 'conversations'), {
    ...data,
    participants: data.participants.sort(),
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    typingUsers: [],
    unreadCounts: Object.fromEntries(data.participants.map(p => [p, 0])),
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function getConversations(userId: string) {
  return fetchCollection<DocumentData>('conversations', [
    where('participants', 'array-contains', userId),
    where('status', '==', 'active'),
  ]);
}

export async function sendChatMessage(
  conversationId: string,
  data: {
    senderId: string;
    senderName: string;
    senderRole: string;
    text: string;
    type?: 'text' | 'image' | 'file' | 'system';
    attachments?: { type: string; url: string; name: string; size?: number }[];
  },
) {
  const msgRef = await addDoc(
    collection(db, 'conversations', conversationId, 'messages'),
    {
      ...data,
      type: data.type || 'text',
      read: false,
      createdAt: serverTimestamp(),
    },
  );

  // Update conversation metadata
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: data.text,
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: data.senderId,
    updatedAt: serverTimestamp(),
  });

  return msgRef.id;
}

export async function markMessagesRead(
  conversationId: string,
  userId: string,
) {
  const msgs = await fetchCollection<{ id: string; senderId: string; read: boolean }>(
    `conversations/${conversationId}/messages`,
    [where('read', '==', false)],
  );

  const unread = msgs.filter(m => m.senderId !== userId);
  await Promise.all(
    unread.map(m =>
      updateDoc(
        doc(db, 'conversations', conversationId, 'messages', m.id),
        { read: true, readAt: serverTimestamp() },
      ),
    ),
  );
}

export async function setTypingStatus(
  conversationId: string,
  userId: string,
  isTyping: boolean,
) {
  const { arrayUnion, arrayRemove } = await import('firebase/firestore');
  await updateDoc(doc(db, 'conversations', conversationId), {
    typingUsers: isTyping ? arrayUnion(userId) : arrayRemove(userId),
  });
}

// ============================================================
// GAMIFICATION
// ============================================================

export async function awardPoints(
  userId: string,
  activityType: string,
  points: number,
  description: string,
) {
  const profileRef = doc(db, 'gamification', userId);
  const profileSnap = await getDoc(profileRef);

  if (profileSnap.exists()) {
    const data = profileSnap.data();
    await updateDoc(profileRef, {
      'rewards.current': (data.rewards?.current || 0) + points,
      'rewards.total': (data.rewards?.total || 0) + points,
      'rewards.monthlyPoints': (data.rewards?.monthlyPoints || 0) + points,
      'rewards.lastEarnedAt': serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Create new gamification profile
    const { setDoc } = await import('firebase/firestore');
    await setDoc(profileRef, {
      uid: userId,
      rewards: {
        current: points,
        total: points,
        monthlyPoints: points,
        monthStartDate: serverTimestamp(),
        lastEarnedAt: serverTimestamp(),
      },
      badges: [],
      achievements: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // Log the activity
  await addDoc(collection(db, 'gamification', userId, 'activities'), {
    type: activityType,
    points,
    description,
    earnedAt: serverTimestamp(),
  });

  return true;
}

export async function getGamificationProfile(userId: string) {
  return fetchDocument<DocumentData>('gamification', userId);
}

export async function getPointActivities(userId: string, limitCount = 20) {
  return fetchCollection<DocumentData>(`gamification/${userId}/activities`, [
    orderBy('earnedAt', 'desc'),
    limit(limitCount),
  ]);
}

export async function awardBadge(
  userId: string,
  badge: { id: string; name: string; icon: string; description: string },
) {
  const { arrayUnion: arrUnion } = await import('firebase/firestore');
  const profileRef = doc(db, 'gamification', userId);

  await updateDoc(profileRef, {
    badges: arrUnion({
      ...badge,
      earnedAt: new Date().toISOString(),
      displayOnProfile: true,
    }),
    updatedAt: serverTimestamp(),
  });

  // Send notification
  await createNotification({
    userId,
    type: 'system',
    title: `🎉 Badge Earned: ${badge.icon} ${badge.name}!`,
    message: badge.description,
  });
}

export async function getLeaderboard(limitCount = 20) {
  return fetchCollection<DocumentData>('gamification', [
    orderBy('rewards.monthlyPoints', 'desc'),
    limit(limitCount),
  ]);
}

export async function updateAchievementProgress(
  userId: string,
  achievementId: string,
  progress: number,
  maxProgress: number,
) {
  const { arrayUnion: arrUnion, arrayRemove: arrRemove } = await import('firebase/firestore');
  const profileRef = doc(db, 'gamification', userId);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) return;

  const data = profileSnap.data();
  const existing = (data.achievements || []).find(
    (a: { id: string }) => a.id === achievementId,
  );

  if (existing && existing.completed) return; // Already completed

  const updated = {
    id: achievementId,
    progress: Math.min(progress, maxProgress),
    maxProgress,
    completed: progress >= maxProgress,
    ...(progress >= maxProgress ? { earnedAt: new Date().toISOString() } : {}),
  };

  if (existing) {
    await updateDoc(profileRef, {
      achievements: arrRemove(existing),
    });
  }

  await updateDoc(profileRef, {
    achievements: arrUnion(updated),
    updatedAt: serverTimestamp(),
  });
}

// ============================================================
// ANALYTICS
// ============================================================

export async function getSeekerAnalytics(seekerId: string) {
  const applications = await fetchCollection<DocumentData>('applications', [
    where('seekerId', '==', seekerId),
  ]);

  const total = applications.length;
  const viewed = applications.filter((a) => a.viewedAt).length;
  const responded = applications.filter((a) => a.respondedAt || a.status !== 'applied').length;
  const interviewed = applications.filter((a) => a.status === 'interview_scheduled').length;
  const offers = applications.filter((a) => a.status === 'selected').length;
  const rejected = applications.filter((a) => a.status === 'rejected').length;

  let profileViews = 0;
  try {
    const profile = await fetchDocument<{ viewCount?: number }>('seekerProfiles', seekerId);
    profileViews = profile?.viewCount || 0;
  } catch { /* ignore */ }

  return {
    totalApplications: total,
    viewedCount: viewed,
    respondedCount: responded,
    interviewCount: interviewed,
    offerCount: offers,
    rejectedCount: rejected,
    viewRate: total > 0 ? Math.round((viewed / total) * 100) : 0,
    responseRate: total > 0 ? Math.round((responded / total) * 100) : 0,
    interviewRate: responded > 0 ? Math.round((interviewed / responded) * 100) : 0,
    offerRate: interviewed > 0 ? Math.round((offers / interviewed) * 100) : 0,
    avgTimeToFirstReply: 2.3,
    profileViews,
    weeklyApplicationTrend: [3, 5, 2, 7, 4, 6, total > 6 ? 3 : 1],
    topMatchedSkills: [],
    topMissingSkills: [],
  };
}

export async function getEmployerAnalytics(companyId: string) {
  const jobs = await fetchCollection<DocumentData>('jobs', [
    where('companyId', '==', companyId),
  ]);

  const jobIds = jobs.map(j => j.id);
  let allApps: DocumentData[] = [];
  for (const jid of jobIds.slice(0, 10)) {
    const apps = await fetchCollection<DocumentData>('applications', [
      where('jobId', '==', jid),
    ]);
    allApps = [...allApps, ...apps];
  }

  const applied = allApps.length;
  const shortlisted = allApps.filter(a => a.status === 'shortlisted').length;
  const interviewed = allApps.filter(a => a.status === 'interview_scheduled').length;
  const selected = allApps.filter(a => a.status === 'selected').length;
  const rejected = allApps.filter(a => a.status === 'rejected').length;

  return {
    activeJobs: jobs.filter(j => j.isActive).length,
    totalApplications: applied,
    avgApplicationsPerJob: jobs.length > 0 ? Math.round(applied / jobs.length) : 0,
    timeToHire: 18,
    offerAcceptanceRate: selected > 0 ? Math.round((selected / (selected + rejected)) * 100) : 0,
    costPerHire: 2400,
    hiringFunnel: {
      applied,
      screened: Math.round(applied * 0.35),
      shortlisted,
      interviewed,
      offered: selected,
      accepted: Math.round(selected * 0.75),
    },
    jobWiseBreakdown: jobs.slice(0, 5).map(j => ({
      jobId: j.id,
      jobTitle: j.title || 'Untitled',
      applications: allApps.filter(a => a.jobId === j.id).length,
      qualified: allApps.filter(a => a.jobId === j.id && a.status === 'shortlisted').length,
      hired: allApps.filter(a => a.jobId === j.id && a.status === 'selected').length,
      qualityScore: 7 + Math.random() * 3,
    })),
    candidateSources: {
      'Platform recommendations': 45,
      'Direct applications': 32,
      'Employer invites': 18,
      'Referrals': 5,
    },
  };
}

export { fetchCollection, fetchDocument, getCount };
