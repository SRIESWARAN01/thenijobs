'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, User, Sparkles } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface LeaderboardEntry {
  id: string;
  uid: string;
  displayName?: string;
  rewards: {
    current: number;
    total: number;
    monthlyPoints: number;
  };
  badges: Array<{ id: string; icon: string }>;
}

/* ------------------------------------------------------------------ */
/*  Animated number counter                                             */
/* ------------------------------------------------------------------ */

function useCountUp(target: number, duration = 800) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();

    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

/* ------------------------------------------------------------------ */
/*  Medal color config                                                  */
/* ------------------------------------------------------------------ */

const PODIUM_STYLES = [
  {
    // 1st — Gold
    gradient: 'linear-gradient(135deg, #FFD700, #FFA500)',
    border: 'rgba(255, 215, 0, 0.5)',
    glow: '0 0 30px rgba(255, 215, 0, 0.3)',
    bg: 'rgba(255, 215, 0, 0.08)',
    text: 'text-amber-300',
    size: 'w-16 h-16',
    icon: Crown,
  },
  {
    // 2nd — Silver
    gradient: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
    border: 'rgba(192, 192, 192, 0.4)',
    glow: '0 0 25px rgba(192, 192, 192, 0.2)',
    bg: 'rgba(192, 192, 192, 0.06)',
    text: 'text-gray-300',
    size: 'w-14 h-14',
    icon: Medal,
  },
  {
    // 3rd — Bronze
    gradient: 'linear-gradient(135deg, #CD7F32, #B87333)',
    border: 'rgba(205, 127, 50, 0.4)',
    glow: '0 0 25px rgba(205, 127, 50, 0.2)',
    bg: 'rgba(205, 127, 50, 0.06)',
    text: 'text-orange-300',
    size: 'w-13 h-13',
    icon: Medal,
  },
];

/* ------------------------------------------------------------------ */
/*  Points display with animated counter                                */
/* ------------------------------------------------------------------ */

function AnimatedPoints({ points }: { points: number }) {
  const animated = useCountUp(points, 1000);
  return <>{animated.toLocaleString()}</>;
}

/* ------------------------------------------------------------------ */
/*  Avatar circle                                                       */
/* ------------------------------------------------------------------ */

function AvatarCircle({
  name,
  style,
  className,
}: {
  name: string;
  style: React.CSSProperties;
  className: string;
}) {
  const initial = (name || '?').charAt(0).toUpperCase();
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold font-[Outfit] text-white ${className}`}
      style={style}
    >
      {initial}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Top 3 podium card                                                   */
/* ------------------------------------------------------------------ */

function PodiumCard({
  entry,
  rank,
  isCurrentUser,
  index,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
  index: number;
}) {
  const config = PODIUM_STYLES[rank - 1];
  const displayName = entry.displayName || `User ${entry.uid.slice(0, 6)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.12, type: 'spring', stiffness: 180 }}
      whileHover={{ y: -4 }}
      className={`glass-card rounded-2xl p-5 text-center relative overflow-hidden ${
        isCurrentUser ? 'ring-1 ring-cyan-500/40' : ''
      }`}
      style={{
        boxShadow: config.glow,
      }}
    >
      {/* Rank indicator */}
      {rank === 1 && (
        <motion.div
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="absolute top-2 right-2"
        >
          <Crown className="w-5 h-5 text-amber-400" />
        </motion.div>
      )}

      {/* Avatar */}
      <div className="flex justify-center mb-3">
        <div className="relative">
          <AvatarCircle
            name={displayName}
            className={`${config.size} text-lg`}
            style={{
              background: config.gradient,
              border: `2px solid ${config.border}`,
              boxShadow: config.glow,
            }}
          />
          {/* Rank badge */}
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-[#0a0a1a]"
            style={{ background: config.gradient }}
          >
            {rank}
          </div>
        </div>
      </div>

      {/* Name */}
      <p className={`text-sm font-bold font-[Outfit] truncate mb-0.5 ${config.text}`}>
        {displayName}
      </p>
      {isCurrentUser && (
        <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-400/[0.08] rounded-full px-2 py-0.5 mb-1">
          <User className="w-2.5 h-2.5" /> You
        </span>
      )}

      {/* Points */}
      <div className="flex items-center justify-center gap-1 mt-1">
        <Sparkles className="w-3 h-3 text-amber-400/70" />
        <span className="text-lg font-bold text-white font-[Outfit]">
          <AnimatedPoints points={entry.rewards.monthlyPoints} />
        </span>
        <span className="text-[10px] text-white/30 self-end mb-0.5">pts</span>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  List row (rank 4–10)                                                */
/* ------------------------------------------------------------------ */

function LeaderboardRow({
  entry,
  rank,
  isCurrentUser,
  index,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
  index: number;
}) {
  const displayName = entry.displayName || `User ${entry.uid.slice(0, 6)}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
      className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-colors duration-200 ${
        isCurrentUser
          ? 'bg-cyan-500/[0.06] border border-cyan-500/20'
          : 'hover:bg-white/[0.02]'
      } ${index > 0 ? '' : ''}`}
    >
      {/* Rank number */}
      <span className={`text-sm font-bold w-6 text-center ${
        isCurrentUser ? 'text-cyan-400' : 'text-white/30'
      }`}>
        {rank}
      </span>

      {/* Avatar */}
      <AvatarCircle
        name={displayName}
        className="w-8 h-8 text-xs flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))',
          border: isCurrentUser
            ? '1.5px solid rgba(6, 182, 212, 0.4)'
            : '1.5px solid rgba(255,255,255,0.08)',
        }}
      />

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium truncate ${
            isCurrentUser ? 'text-white' : 'text-white/70'
          }`}>
            {displayName}
          </span>
          {isCurrentUser && (
            <span className="text-[10px] text-cyan-400 bg-cyan-400/[0.08] rounded-full px-1.5 py-0.5 flex-shrink-0">
              You
            </span>
          )}
        </div>
      </div>

      {/* Points */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className={`text-sm font-bold font-[Outfit] ${
          isCurrentUser ? 'text-cyan-300' : 'text-white/60'
        }`}>
          <AnimatedPoints points={entry.rewards.monthlyPoints} />
        </span>
        <span className="text-[10px] text-white/25">pts</span>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                    */
/* ------------------------------------------------------------------ */

function LeaderboardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-5 w-44 rounded bg-white/[0.06] shimmer" />
        <div className="h-4 w-20 rounded bg-white/[0.06] shimmer" />
      </div>

      {/* Podium */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-5 flex flex-col items-center gap-3">
            <div className={`rounded-full bg-white/[0.06] shimmer ${
              i === 1 ? 'w-16 h-16' : 'w-14 h-14'
            }`} />
            <div className="h-3 w-16 rounded bg-white/[0.06] shimmer" />
            <div className="h-5 w-12 rounded bg-white/[0.06] shimmer" />
          </div>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 px-4">
            <div className="w-6 h-4 rounded bg-white/[0.06] shimmer" />
            <div className="w-8 h-8 rounded-full bg-white/[0.06] shimmer" />
            <div className="flex-1 h-3 rounded bg-white/[0.06] shimmer" />
            <div className="w-12 h-4 rounded bg-white/[0.06] shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export function LeaderboardWidget() {
  const { getLeaderboard } = useGamification();
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      setLoading(true);
      try {
        const data = await getLeaderboard(10);
        if (!cancelled) {
          setEntries(data as LeaderboardEntry[]);
        }
      } catch {
        // error already logged by hook
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLeaderboard();
    return () => { cancelled = true; };
  }, [getLeaderboard]);

  const now = new Date();
  const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (loading) return <LeaderboardSkeleton />;

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3, 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Top gradient accent */}
      <div className="h-[2px] w-full" style={{
        background: 'linear-gradient(90deg, #FFD700, #7c3aed, #06b6d4)',
      }} />

      <div className="p-5">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <motion.div
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
            >
              <Trophy className="w-5 h-5 text-amber-400" />
            </motion.div>
            <h2 className="text-base font-bold font-[Outfit] text-white">
              Monthly Leaderboard 🏆
            </h2>
          </div>
          <span className="text-xs text-white/30 font-medium">
            {monthYear}
          </span>
        </div>

        {/* ── Top 3 Podium ── */}
        {top3.length > 0 && (
          <div className={`grid gap-3 mb-5 ${
            top3.length === 3 ? 'grid-cols-3' : top3.length === 2 ? 'grid-cols-2' : 'grid-cols-1 max-w-[200px] mx-auto'
          }`}>
            {top3.map((entry, index) => (
              <PodiumCard
                key={entry.id || entry.uid}
                entry={entry}
                rank={index + 1}
                isCurrentUser={user?.uid === entry.uid}
                index={index}
              />
            ))}
          </div>
        )}

        {/* ── Remaining list (4–10) ── */}
        {rest.length > 0 && (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="divide-y divide-white/[0.04]">
              {rest.map((entry, index) => (
                <LeaderboardRow
                  key={entry.id || entry.uid}
                  entry={entry}
                  rank={index + 4}
                  isCurrentUser={user?.uid === entry.uid}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {entries.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10"
          >
            <Trophy className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <p className="text-sm text-white/40">
              No leaderboard data yet this month.
            </p>
            <p className="text-xs text-white/25 mt-1">
              Earn points to claim your spot!
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default LeaderboardWidget;
