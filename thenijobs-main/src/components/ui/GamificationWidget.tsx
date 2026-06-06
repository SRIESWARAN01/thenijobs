'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, ChevronRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { useGamification } from '@/hooks/useGamification';

/* ------------------------------------------------------------------ */
/*  Animated number counter                                            */
/* ------------------------------------------------------------------ */

function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const from = 0;

    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (target - from) * eased);
      setCount(current);

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
/*  Loading skeleton                                                    */
/* ------------------------------------------------------------------ */

function GamificationSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-white/[0.06] shimmer" />
        <div>
          <div className="h-4 w-16 rounded bg-white/[0.06] shimmer mb-2" />
          <div className="h-3 w-24 rounded bg-white/[0.06] shimmer" />
        </div>
      </div>
      {!compact && (
        <>
          <div className="h-2.5 w-full rounded-full bg-white/[0.06] shimmer mb-4" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 w-9 rounded-full bg-white/[0.06] shimmer" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface GamificationWidgetProps {
  compact?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function GamificationWidget({ compact = false }: GamificationWidgetProps) {
  const {
    rewards,
    badges,
    level,
    progressToNextLevel,
    loading,
  } = useGamification();

  const animatedPoints = useCountUp(loading ? 0 : rewards.current, 1200);
  const animatedTotal = useCountUp(loading ? 0 : rewards.total, 1200);

  if (loading) return <GamificationSkeleton compact={compact} />;

  const latestBadges = badges.slice(-3).reverse();
  const pointsToNext = 100 - progressToNextLevel;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="glass-card rounded-2xl overflow-hidden relative group"
      style={{
        boxShadow: '0 0 40px rgba(124, 58, 237, 0.08), 0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Subtle violet glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 60px rgba(124, 58, 237, 0.06), 0 0 50px rgba(124, 58, 237, 0.12)',
        }}
      />

      {/* Top gradient accent line */}
      <div className="h-[2px] w-full gradient-purple-cyan" />

      <div className="p-5 relative z-10">
        {/* ── Level + Points ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Level badge */}
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              className="relative flex items-center justify-center w-11 h-11 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(79,70,229,0.15))',
              }}
            >
              <Sparkles className="w-5 h-5 text-violet-400" />
              {/* Level number floating badge */}
              <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white bg-gradient-to-br from-violet-500 to-indigo-600 ring-2 ring-[#0a0a1a]">
                {level}
              </span>
            </motion.div>

            <div>
              {/* Level text with gradient */}
              <p className="text-sm font-bold font-[Outfit] bg-gradient-to-r from-violet-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
                Level {level}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="text-xs text-white/50">
                  <span className="text-white/90 font-semibold">{animatedPoints.toLocaleString()}</span>
                  {' / '}
                  <span className="text-white/40">{animatedTotal.toLocaleString()} pts</span>
                </span>
              </div>
            </div>
          </div>

          {compact && (
            <Link
              href="/seeker/rewards"
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* ── Compact mode stops here ── */}
        <AnimatePresence>
          {!compact && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {/* ── Progress bar ── */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-white/40 uppercase tracking-wider font-medium">
                    Next Level
                  </span>
                  <span className="text-[11px] text-white/40">
                    {pointsToNext} pts away
                  </span>
                </div>

                <div className="h-2.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressToNextLevel}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                    className="h-full rounded-full relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(90deg, #7c3aed, #6d28d9, #06b6d4)',
                    }}
                  >
                    {/* Shimmer on progress bar */}
                    <div
                      className="absolute inset-0 shimmer"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                        backgroundSize: '200% 100%',
                      }}
                    />
                  </motion.div>
                </div>
              </div>

              {/* ── Badges showcase ── */}
              {latestBadges.length > 0 && (
                <div className="mb-4">
                  <p className="text-[11px] text-white/40 uppercase tracking-wider font-medium mb-2">
                    Recent Badges
                  </p>
                  <div className="flex items-center gap-2">
                    {latestBadges.map((badge, i) => (
                      <motion.div
                        key={badge.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4 + i * 0.1, type: 'spring', stiffness: 260, damping: 18 }}
                        whileHover={{ scale: 1.15, y: -2 }}
                        className="relative group/badge"
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-lg cursor-default animate-pulse-glow"
                          style={{
                            background: 'linear-gradient(145deg, rgba(124,58,237,0.2), rgba(79,70,229,0.1))',
                            border: '1px solid rgba(124, 58, 237, 0.3)',
                          }}
                        >
                          {badge.icon}
                        </div>

                        {/* Tooltip */}
                        <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover/badge:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                          <div className="glass-card rounded-lg px-2 py-1 whitespace-nowrap">
                            <span className="text-[10px] text-white/80">{badge.name}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Show total badge count */}
                    {badges.length > 3 && (
                      <span className="text-xs text-white/30 ml-1">
                        +{badges.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── View all link ── */}
              <Link
                href="/seeker/rewards"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-violet-300 hover:text-white bg-violet-500/[0.08] hover:bg-violet-500/[0.15] border border-violet-500/[0.12] hover:border-violet-500/[0.25] transition-all duration-300"
              >
                <Trophy className="w-4 h-4" />
                View All Rewards
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default GamificationWidget;
