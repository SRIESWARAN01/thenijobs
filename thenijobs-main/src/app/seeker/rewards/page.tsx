'use client';

import { BadgeDisplay } from '@/components/ui/BadgeDisplay';
import { LeaderboardWidget } from '@/components/ui/LeaderboardWidget';
import { useGamification } from '@/hooks/useGamification';
import {  Trophy } from 'lucide-react';

export default function SeekerRewardsPage() {
  const { rewards, level, loading } = useGamification();

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      {/* Premium Header */}
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-cyan-500/10 border-violet-500/20 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Trophy size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-gray-150 to-white bg-clip-text text-transparent">
                Rewards & Leaderboard
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Complete profile items, apply to jobs, and engage with the platform to level up and earn badges.
              </p>
            </div>
          </div>

          {/* Quick Level Banner */}
          {!loading && (
            <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
              <div className="text-center border-r border-white/10 pr-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Current Level</p>
                <p className="text-xl font-extrabold text-violet-400 mt-0.5">Lvl {level}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Points</p>
                <p className="text-xl font-extrabold text-cyan-400 mt-0.5">{rewards.current.toLocaleString()} pts</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Badge Showcase & Milestones */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <BadgeDisplay />
          </div>
        </div>

        {/* Right Side: Leaderboard */}
        <div className="lg:col-span-1">
          <LeaderboardWidget />
        </div>
      </div>
    </div>
  );
}
