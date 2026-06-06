'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { POINT_VALUES, BADGE_DEFINITIONS, ACHIEVEMENT_DEFINITIONS } from '@/lib/constants';
import {
  awardPoints,
  getGamificationProfile,
  getPointActivities,
  awardBadge,
  getLeaderboard as fetchLeaderboard,
  updateAchievementProgress,
} from '@/lib/firebase/firestoreService';

interface RewardsPoints {
  current: number;
  total: number;
  monthlyPoints: number;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: string;
  displayOnProfile: boolean;
}

interface Achievement {
  id: string;
  progress: number;
  maxProgress: number;
  completed: boolean;
  earnedAt?: string;
}

interface PointActivity {
  id: string;
  type: string;
  points: number;
  description: string;
  earnedAt: any;
}

interface LeaderboardEntry {
  id: string;
  uid: string;
  rewards: RewardsPoints;
  badges: Badge[];
  displayName?: string;
}

/**
 * Hook for managing the gamification system.
 * Handles points, badges, achievements, and leaderboard.
 */
export function useGamification() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [rewards, setRewards] = useState<RewardsPoints>({ current: 0, total: 0, monthlyPoints: 0 });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activities, setActivities] = useState<PointActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Load gamification profile
  const loadProfile = useCallback(async () => {
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const profile = await getGamificationProfile(uid);
      if (profile) {
        setRewards(profile.rewards || { current: 0, total: 0, monthlyPoints: 0 });
        setBadges(profile.badges || []);
        setAchievements(profile.achievements || []);
      }

      const acts = await getPointActivities(uid, 20);
      setActivities(acts as PointActivity[]);
    } catch (err) {
      console.error('[useGamification] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Award points for an activity
  const earnPoints = useCallback(
    async (activityType: string) => {
      if (!uid) return;

      const config = POINT_VALUES[activityType];
      if (!config) {
        console.warn(`[useGamification] Unknown activity: ${activityType}`);
        return;
      }

      try {
        await awardPoints(uid, activityType, config.points, config.description);
        // Refresh profile
        await loadProfile();
      } catch (err) {
        console.error('[useGamification] award error:', err);
      }
    },
    [uid, loadProfile]
  );

  // Check and award a badge
  const checkBadge = useCallback(
    async (badgeId: string) => {
      if (!uid) return;

      // Check if already earned
      if (badges.find((b) => b.id === badgeId)) return;

      const badgeDef = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
      if (!badgeDef) return;

      try {
        await awardBadge(uid, {
          id: badgeDef.id,
          name: badgeDef.name,
          icon: badgeDef.icon,
          description: badgeDef.description,
        });
        await loadProfile();
      } catch (err) {
        console.error('[useGamification] badge error:', err);
      }
    },
    [uid, badges, loadProfile]
  );

  // Update achievement progress
  const trackAchievement = useCallback(
    async (achievementId: string, currentProgress: number) => {
      if (!uid) return;

      const achDef = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achievementId);
      if (!achDef) return;

      try {
        await updateAchievementProgress(
          uid,
          achievementId,
          currentProgress,
          achDef.maxProgress
        );
        await loadProfile();
      } catch (err) {
        console.error('[useGamification] achievement error:', err);
      }
    },
    [uid, loadProfile]
  );

  // Get leaderboard
  const getLeaderboard = useCallback(async (limit = 20) => {
    try {
      const entries = await fetchLeaderboard(limit);
      return entries as LeaderboardEntry[];
    } catch (err) {
      console.error('[useGamification] leaderboard error:', err);
      return [];
    }
  }, []);

  // Computed values
  const level = Math.floor(rewards.total / 100) + 1;
  const progressToNextLevel = rewards.total % 100;
  const badgeCount = badges.length;
  const completedAchievements = achievements.filter((a) => a.completed).length;
  const totalAchievements = ACHIEVEMENT_DEFINITIONS.length;

  return {
    rewards,
    badges,
    achievements,
    activities,
    loading,
    level,
    progressToNextLevel,
    badgeCount,
    completedAchievements,
    totalAchievements,
    earnPoints,
    checkBadge,
    trackAchievement,
    getLeaderboard,
    refresh: loadProfile,
  };
}
