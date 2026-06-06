'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  getCountFromServer,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ============================================================
// useRealtimeCount — Live document count listener
// ============================================================

interface UseRealtimeCountOptions {
  /** Skip listening (e.g. if user isn't admin) */
  skip?: boolean;
}

/**
 * Real-time count of documents matching constraints.
 * Uses `getCountFromServer()` on mount and refreshes via `onSnapshot`.
 *
 * @example
 * ```ts
 * const { count, loading } = useRealtimeCount('users');
 * const { count: pendingBiz } = useRealtimeCount('companies', [
 *   where('verificationStatus', '==', 'pending'),
 * ]);
 * ```
 */
export function useRealtimeCount(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  options: UseRealtimeCountOptions = {},
) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(!options.skip);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (options.skip) return;

    setLoading(true);
    setError(null);

    const q = constraints.length > 0
      ? query(collection(db, collectionName), ...constraints)
      : collection(db, collectionName);

    // Listen for changes and re-count
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCount(snapshot.size);
        setLoading(false);
      },
      (err) => {
        console.error(`[useRealtimeCount] ${collectionName}:`, err);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, options.skip]);

  return { count, loading, error };
}

// ============================================================
// usePlatformStats — All admin dashboard stats
// ============================================================

export interface PlatformStatsData {
  totalUsers: number;
  totalBusinesses: number;
  activeJobs: number;
  totalApplications: number;
  totalLeads: number;
  totalRevenue: number;
  pendingBusinesses: number;
  pendingJobs: number;
  pendingUsers: number;
}

/**
 * Platform-wide stats for the admin dashboard.
 * Uses `getCountFromServer()` for lightweight counts (no full-doc downloads)
 * and `onSnapshot` only for revenue aggregation which needs doc values.
 * Counts refresh every 30 seconds.
 */
export function usePlatformStats(skip = false) {
  const [stats, setStats] = useState<PlatformStatsData>({
    totalUsers: 0,
    totalBusinesses: 0,
    activeJobs: 0,
    totalApplications: 0,
    totalLeads: 0,
    totalRevenue: 0,
    pendingBusinesses: 0,
    pendingJobs: 0,
    pendingUsers: 0,
  });
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (skip) return;

    let cancelled = false;

    const fetchCounts = async () => {
      try {
        const countQueries: {
          key: keyof PlatformStatsData;
          q: ReturnType<typeof query> | ReturnType<typeof collection>;
        }[] = [
          { key: 'totalUsers', q: collection(db, 'users') },
          { key: 'totalBusinesses', q: query(collection(db, 'companies'), where('verificationStatus', '==', 'verified')) },
          { key: 'activeJobs', q: query(collection(db, 'jobs'), where('isActive', '==', true)) },
          { key: 'totalApplications', q: collection(db, 'applications') },
          { key: 'totalLeads', q: collection(db, 'leads') },
          { key: 'pendingBusinesses', q: query(collection(db, 'companies'), where('verificationStatus', '==', 'pending')) },
          { key: 'pendingJobs', q: query(collection(db, 'jobs'), where('isActive', '==', false)) },
          { key: 'pendingUsers', q: query(collection(db, 'users'), where('isVerified', '==', false)) },
        ];

        const results = await Promise.allSettled(
          countQueries.map(async ({ key, q }) => {
            const snapshot = await getCountFromServer(q);
            return { key, count: snapshot.data().count };
          }),
        );

        if (cancelled) return;

        const updates: Partial<PlatformStatsData> = {};
        for (const result of results) {
          if (result.status === 'fulfilled') {
            updates[result.value.key] = result.value.count;
          }
        }
        setStats((prev) => ({ ...prev, ...updates }));
        setLoading(false);
      } catch (err: any) {
        if (!cancelled) {
          console.error('[usePlatformStats] count fetch error:', err);
          setError(err.message);
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchCounts();

    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30_000);

    // Revenue still needs onSnapshot because we sum document values
    const revQ = query(
      collection(db, 'subscriptions'),
      where('status', '==', 'active'),
    );
    const revUnsub = onSnapshot(
      revQ,
      (snapshot) => {
        const total = snapshot.docs.reduce(
          (sum, d) => sum + (d.data().amount || 0),
          0,
        );
        if (!cancelled) {
          setStats((prev) => ({ ...prev, totalRevenue: total }));
        }
      },
      () => {
        // subscriptions collection may not exist yet
      },
    );

    return () => {
      cancelled = true;
      clearInterval(interval);
      revUnsub();
    };
  }, [skip]);

  return { stats, loading, error };
}

// ============================================================
// useEmployerStats — Employer dashboard stats
// ============================================================

export interface EmployerStatsData {
  activeJobs: number;
  totalApplications: number;
  shortlisted: number;
  interviews: number;
  hired: number;
}

export function useEmployerStats(companyId: string | undefined) {
  const [stats, setStats] = useState<EmployerStatsData>({
    activeJobs: 0,
    totalApplications: 0,
    shortlisted: 0,
    interviews: 0,
    hired: 0,
  });
  const [loading, setLoading] = useState(!!companyId);

  useEffect(() => {
    if (!companyId) return;

    const unsubscribers: (() => void)[] = [];

    const listen = (
      col: string,
      key: keyof EmployerStatsData,
      constraints: QueryConstraint[],
    ) => {
      const q = query(collection(db, col), ...constraints);
      const unsub = onSnapshot(q, (snapshot) => {
        setStats((prev) => ({ ...prev, [key]: snapshot.size }));
      });
      unsubscribers.push(unsub);
    };

    listen('jobs', 'activeJobs', [
      where('companyId', '==', companyId),
      where('isActive', '==', true),
    ]);
    listen('applications', 'totalApplications', [
      where('companyId', '==', companyId),
    ]);
    listen('applications', 'shortlisted', [
      where('companyId', '==', companyId),
      where('status', '==', 'shortlisted'),
    ]);
    listen('interviews', 'interviews', [
      where('companyId', '==', companyId),
    ]);
    listen('applications', 'hired', [
      where('companyId', '==', companyId),
      where('status', '==', 'selected'),
    ]);

    setLoading(false);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [companyId]);

  return { stats, loading };
}

// ============================================================
// useSeekerStats — Seeker dashboard stats
// ============================================================

export interface SeekerStatsData {
  appliedJobs: number;
  savedJobs: number;
  interviews: number;
  profileViews: number;
}

export function useSeekerStats(seekerId: string | undefined) {
  const [stats, setStats] = useState<SeekerStatsData>({
    appliedJobs: 0,
    savedJobs: 0,
    interviews: 0,
    profileViews: 0,
  });
  const [loading, setLoading] = useState(!!seekerId);

  useEffect(() => {
    if (!seekerId) return;

    const unsubscribers: (() => void)[] = [];

    const listen = (
      col: string,
      key: keyof SeekerStatsData,
      constraints: QueryConstraint[],
    ) => {
      const q = query(collection(db, col), ...constraints);
      const unsub = onSnapshot(q, (snapshot) => {
        setStats((prev) => ({ ...prev, [key]: snapshot.size }));
      });
      unsubscribers.push(unsub);
    };

    listen('applications', 'appliedJobs', [
      where('seekerId', '==', seekerId),
    ]);
    listen('savedJobs', 'savedJobs', [where('userId', '==', seekerId)]);
    listen('interviews', 'interviews', [where('seekerId', '==', seekerId)]);

    setLoading(false);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [seekerId]);

  return { stats, loading };
}
