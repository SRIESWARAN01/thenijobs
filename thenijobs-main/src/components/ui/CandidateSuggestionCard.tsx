'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Send,
  Eye,
  MapPin,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCircle,
  MailCheck,
  MailX,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CandidateData {
  candidateId: string;
  candidateName: string;
  candidatePhoto?: string;
  candidateHeadline?: string;
  matchScore: number;
  matchBreakdown: {
    skills: number;
    experience: number;
    location: number;
    engagement: number;
  };
  matchingSkills: string[];
  missingSkills: string[];
  experienceYears: number;
  location: string;
  profileCompletion: number;
  inviteStatus: 'none' | 'sent' | 'accepted' | 'declined';
}

interface CandidateSuggestionCardProps {
  candidate: CandidateData;
  onSendInvite?: () => void;
  onViewProfile?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const BREAKDOWN_BARS: {
  key: keyof CandidateData['matchBreakdown'];
  label: string;
  color: string;
  barColor: string;
}[] = [
  {
    key: 'skills',
    label: 'Skills',
    color: 'text-cyan-400',
    barColor: 'from-cyan-500 to-blue-500',
  },
  {
    key: 'experience',
    label: 'Experience',
    color: 'text-violet-400',
    barColor: 'from-violet-500 to-indigo-500',
  },
  {
    key: 'location',
    label: 'Location',
    color: 'text-emerald-400',
    barColor: 'from-emerald-500 to-teal-500',
  },
  {
    key: 'engagement',
    label: 'Engagement',
    color: 'text-amber-400',
    barColor: 'from-amber-500 to-orange-500',
  },
];

const INVITE_STATUS_CONFIG: Record<
  CandidateData['inviteStatus'],
  { label: string; color: string; icon: React.ElementType } | null
> = {
  none: null,
  sent: { label: 'Invite Sent', color: 'text-amber-400', icon: Clock },
  accepted: { label: 'Accepted', color: 'text-emerald-400', icon: MailCheck },
  declined: { label: 'Declined', color: 'text-rose-400', icon: MailX },
};

function getScoreColor(score: number): string {
  if (score >= 85) return 'from-emerald-400 to-cyan-400';
  if (score >= 70) return 'from-cyan-400 to-blue-400';
  if (score >= 50) return 'from-amber-400 to-orange-400';
  return 'from-rose-400 to-red-400';
}

function getScoreGlow(score: number): string {
  if (score >= 85) return 'rgba(16,185,129,0.3)';
  if (score >= 70) return 'rgba(6,182,212,0.3)';
  if (score >= 50) return 'rgba(245,158,11,0.3)';
  return 'rgba(244,63,94,0.3)';
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function MatchScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 38;
  const filled = (score / 100) * circumference;

  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 84 84" className="w-full h-full -rotate-90">
        {/* Background ring */}
        <circle
          cx="42"
          cy="42"
          r="38"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="4"
        />
        {/* Filled arc */}
        <motion.circle
          cx="42"
          cy="42"
          r="38"
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - filled }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>
      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className={`text-2xl font-bold bg-gradient-to-br ${getScoreColor(
            score
          )} bg-clip-text text-transparent font-outfit`}
        >
          {score}%
        </motion.span>
        <span className="text-[9px] text-white/30 uppercase tracking-wider font-medium">
          Match
        </span>
      </div>
    </div>
  );
}

function BreakdownBar({
  label,
  value,
  color,
  barColor,
  index,
}: {
  label: string;
  value: number;
  color: string;
  barColor: string;
  index: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-medium ${color}`}>{label}</span>
        <span className="text-[11px] text-white/40">{value}%</span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay: 0.4 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
        />
      </div>
    </div>
  );
}

function SkillPill({
  label,
  variant,
  index,
}: {
  label: string;
  variant: 'match' | 'missing';
  index: number;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6 + index * 0.05 }}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border ${
        variant === 'match'
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      }`}
    >
      {variant === 'match' ? (
        <CheckCircle2 className="w-2.5 h-2.5" />
      ) : (
        <AlertCircle className="w-2.5 h-2.5" />
      )}
      {label}
    </motion.span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function CandidateSuggestionCard({
  candidate,
  onSendInvite,
  onViewProfile,
}: CandidateSuggestionCardProps) {
  const inviteConfig = INVITE_STATUS_CONFIG[candidate.inviteStatus];
  const hasInvite = candidate.inviteStatus !== 'none';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      whileHover={{
        y: -4,
        boxShadow: `0 8px 40px ${getScoreGlow(candidate.matchScore)}`,
      }}
      className="glass-card rounded-2xl p-6 transition-all duration-300 relative overflow-hidden"
    >
      {/* AI badge */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-4 right-4 flex items-center gap-1.5 bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-violet-500/20 rounded-full px-2.5 py-1"
      >
        <Sparkles className="w-3 h-3 text-violet-400" />
        <span className="text-[10px] font-semibold text-violet-300 uppercase tracking-wider">
          AI Match
        </span>
      </motion.div>

      {/* Top section: avatar + info + score ring */}
      <div className="flex items-start gap-4 mb-5">
        {/* Avatar */}
        <div className="relative shrink-0">
          {candidate.candidatePhoto ? (
            <Image
              src={candidate.candidatePhoto}
              alt={candidate.candidateName}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover border-2 border-white/[0.08]"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border-2 border-white/[0.08] flex items-center justify-center">
              <UserCircle className="w-7 h-7 text-white/30" />
            </div>
          )}
          {/* Profile completion ring */}
          <div
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#0a0a1a] flex items-center justify-center"
            title={`${candidate.profileCompletion}% profile`}
          >
            <span className="text-[8px] font-bold text-cyan-400">
              {candidate.profileCompletion}
            </span>
          </div>
        </div>

        {/* Name & headline */}
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="text-base font-semibold text-white truncate font-outfit">
            {candidate.candidateName}
          </h3>
          {candidate.candidateHeadline && (
            <p className="text-xs text-white/40 truncate mt-0.5">
              {candidate.candidateHeadline}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/30">
            <span className="flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {candidate.experienceYears} yrs
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {candidate.location}
            </span>
          </div>
        </div>

        {/* Match score ring */}
        <MatchScoreRing score={candidate.matchScore} />
      </div>

      {/* Breakdown bars */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-5">
        {BREAKDOWN_BARS.map((bar, i) => (
          <BreakdownBar
            key={bar.key}
            label={bar.label}
            value={candidate.matchBreakdown[bar.key]}
            color={bar.color}
            barColor={bar.barColor}
            index={i}
          />
        ))}
      </div>

      {/* Skills */}
      <div className="mb-5 space-y-2">
        {candidate.matchingSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {candidate.matchingSkills.map((skill, i) => (
              <SkillPill key={skill} label={skill} variant="match" index={i} />
            ))}
          </div>
        )}
        {candidate.missingSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {candidate.missingSkills.slice(0, 3).map((skill, i) => (
              <SkillPill key={skill} label={skill} variant="missing" index={i} />
            ))}
            {candidate.missingSkills.length > 3 && (
              <span className="text-[10px] text-white/20 self-center ml-1">
                +{candidate.missingSkills.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Invite status indicator */}
      {inviteConfig && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`flex items-center gap-1.5 mb-4 ${inviteConfig.color}`}
        >
          <inviteConfig.icon className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{inviteConfig.label}</span>
        </motion.div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onSendInvite}
          disabled={hasInvite}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            hasInvite
              ? 'bg-white/[0.04] text-white/20 cursor-not-allowed'
              : 'btn-gradient text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30'
          }`}
        >
          <Send className="w-4 h-4" />
          {hasInvite ? 'Invite Sent' : 'Send Invite'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onViewProfile}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold btn-outline-glass text-white transition-all duration-200"
        >
          <Eye className="w-4 h-4" />
          View Profile
        </motion.button>
      </div>
    </motion.div>
  );
}

export default CandidateSuggestionCard;
