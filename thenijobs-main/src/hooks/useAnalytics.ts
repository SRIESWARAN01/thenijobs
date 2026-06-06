'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getSeekerAnalytics,
  getEmployerAnalytics,
} from '@/lib/firebase/firestoreService';

/**
 * Hook for fetching analytics data for the current user's role.
 */
export function useAnalytics() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [seekerData, setSeekerData] = useState<any>(null);
  const [employerData, setEmployerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSeekerAnalytics = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSeekerAnalytics(uid);
      setSeekerData(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  const fetchEmployerAnalytics = useCallback(async (companyId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmployerAnalytics(companyId);
      setEmployerData(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    seekerData,
    employerData,
    loading,
    error,
    fetchSeekerAnalytics,
    fetchEmployerAnalytics,
  };
}
