'use client';

import { motion } from 'framer-motion';
import { Lock, CheckCircle2, Trophy } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { BADGE_DEFINITIONS, ACHIEVEMENT_DEFINITIONS } from '@/lib/constants';

/* ------------------------------------------------------------------ */
/*  Badge card component                                                */
/* ------------------------------------------------------------------ */

interface BadgeCardProps {
  badge: (typeof BADGE_DEFINITIONS)[number];
  earned: boolean;
  earnedAt?: string;
  index: number;
}

function BadgeCard({ badge, earned, earnedAt, index }: BadgeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`relative group rounded-2xl p-5 transition-all duration-300 ${
        earned
          ? 'glass-card animate-pulse-glow cursor-default'
          : 'glass-card opacity-40 cursor-default'
      }`}
      style={{
        ...(earned && {
          borderColor: 'rgba(124, 58, 237, 0.3)',
        }),
      }}
    >
      {/* Earned indicator */}
      {earned && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
      )}

      {/* Badge icon */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <motion.div
            whileHover={earned ? { rotate: [0, -8, 8, -4, 4, 0], scale: 1.1 } : {}}
            transition={{ duration: 0.5 }}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
              earned ? '' : 'grayscale'
            }`}
            style={{
              background: earned
                ? 'linear-gradient(145deg, rgba(124,58,237,0.25), rgba(6,182,212,0.15))'
                : 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
              border: earned
                ? '2px solid rgba(124, 58, 237, 0.4)'
                : '2px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            {badge.icon}
          </motion.div>

          {/* Lock overlay for unearned */}
          {!earned && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
                <Lock className="w-3.5 h-3.5 text-white/50" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Badge info */}
      <div className="text-center">
        <h3 className={`text-sm font-bold font-[Outfit] mb-1 ${
          earned
            ? 'bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent'
            : 'text-white/50'
        }`}>
          {badge.name}
        </h3>
        <p className="text-[11px] text-white/40 leading-relaxed mb-2">
          {badge.description}
        </p>

        {earned && earnedAt ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400/80 bg-emerald-400/[0.08] rounded-full px-2 py-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Earned {new Date(earnedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        ) : (
          /* Requirement text on hover for locked badges */
          <div className="h-5 relative overflow-hidden">
            <span className="text-[10px] text-white/25 group-hover:opacity-0 transition-opacity">
              Locked
            </span>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] text-violet-400/70 text-center leading-tight">
                {badge.requirement}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Achievement progress                                                */
/* ------------------------------------------------------------------ */

interface AchievementProgressProps {
  achievement: (typeof ACHIEVEMENT_DEFINITIONS)[number];
  progress: number;
  completed: boolean;
  index: number;
}

function AchievementProgress({ achievement, progress, completed, index }: AchievementProgressProps) {
  const fraction = Math.min(progress, achievement.maxProgress);
  const percent = (fraction / achievement.maxProgress) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.2 + index * 0.05 }}
      className={`flex items-center gap-3 py-3 ${
        index > 0 ? 'border-t border-white/[0.04]' : ''
      }`}
    >
      {/* Icon */}
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg ${
          completed ? '' : 'grayscale-[50%]'
        }`}
        style={{
          background: completed
            ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.1))'
            : 'rgba(255,255,255,0.04)',
        }}
      >
        {achievement.icon}
      </div>

      {/* Info + progress bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-semibold truncate ${
            completed ? 'text-white/90' : 'text-white/60'
          }`}>
            {achievement.name}
          </span>
          <span className={`text-[11px] font-mono flex-shrink-0 ml-2 ${
            completed ? 'text-emerald-400' : 'text-white/40'
          }`}>
            {fraction}/{achievement.maxProgress}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 + index * 0.05 }}
            className="h-full rounded-full"
            style={{
              background: completed
                ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                : 'linear-gradient(90deg, #7c3aed, #06b6d4)',
            }}
          />
        </div>

        <p className="text-[10px] text-white/30 mt-0.5 truncate">
          {achievement.description}
        </p>
      </div>

      {/* Completed badge */}
      {completed && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        </motion.div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                    */
/* ------------------------------------------------------------------ */

function BadgeDisplaySkeleton() {
  return (
    <div className="space-y-8">
      {/* Badge grid skeleton */}
      <div>
        <div className="h-5 w-32 rounded bg-white/[0.06] shimmer mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-white/[0.06] shimmer" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="h-3 w-20 rounded bg-white/[0.06] shimmer" />
                <div className="h-2.5 w-28 rounded bg-white/[0.06] shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement skeleton */}
      <div>
        <div className="h-5 w-36 rounded bg-white/[0.06] shimmer mb-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="w-9 h-9 rounded-lg bg-white/[0.06] shimmer" />
            <div className="flex-1">
              <div className="h-3 w-24 rounded bg-white/[0.06] shimmer mb-2" />
              <div className="h-1.5 w-full rounded-full bg-white/[0.06] shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export function BadgeDisplay() {
  const { badges, achievements, loading, badgeCount } = useGamification();

  if (loading) return <BadgeDisplaySkeleton />;

  // Create a map of earned badges for quick lookup
  const earnedBadgeMap = new Map(
    badges.map((b) => [b.id, b])
  );

  // Create a map of achievements for quick lookup
  const achievementMap = new Map(
    achievements.map((a) => [a.id, a])
  );

  return (
    <div className="space-y-8">
      {/* ── Badge Grid Section ── */}
      <section>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 mb-5"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/15">
            <Trophy className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-[Outfit] text-white">
              Badges
            </h2>
            <p className="text-xs text-white/40">
              {badgeCount} of {BADGE_DEFINITIONS.length} earned
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {BADGE_DEFINITIONS.map((badgeDef, index) => {
            const earnedBadge = earnedBadgeMap.get(badgeDef.id);
            return (
              <BadgeCard
                key={badgeDef.id}
                badge={badgeDef}
                earned={!!earnedBadge}
                earnedAt={earnedBadge?.earnedAt}
                index={index}
              />
            );
          })}
        </div>
      </section>

      {/* ── Achievement Progress Section ── */}
      <section>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3 mb-4"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-500/15">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-[Outfit] text-white">
              Achievements
            </h2>
            <p className="text-xs text-white/40">
              Track your progress milestones
            </p>
          </div>
        </motion.div>

        <div className="glass-card rounded-2xl p-4">
          {ACHIEVEMENT_DEFINITIONS.map((achDef, index) => {
            const userAch = achievementMap.get(achDef.id);
            return (
              <AchievementProgress
                key={achDef.id}
                achievement={achDef}
                progress={userAch?.progress ?? 0}
                completed={userAch?.completed ?? false}
                index={index}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default BadgeDisplay;
