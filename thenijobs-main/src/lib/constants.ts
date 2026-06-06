// ============================================================
// THENIJOBS — Application-wide Constants
// ============================================================

import type { SubscriptionPlan } from '@/lib/types';

// ===== SUBSCRIPTION PLANS =====
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_free',
    name: 'Free',
    slug: 'free',
    price: 0,
    period: 'forever',
    features: [
      'Create basic profile',
      'Search & apply to 5 jobs/month',
      'View business listings',
      'Basic job alerts',
    ],
    notIncluded: [
      'Priority application',
      'Resume boost',
      'Direct chat with employers',
      'Analytics dashboard',
      'Featured profile',
    ],
    recommended: false,
    bestFor: 'Casual job seekers exploring opportunities',
    icon: 'Gift',
  },
  {
    id: 'plan_basic',
    name: 'Basic',
    slug: 'basic',
    price: 40,
    period: 'month',
    features: [
      'Everything in Free',
      'Unlimited job applications',
      'Resume upload & share',
      'Advanced job filters',
      'Email + SMS job alerts',
      'Priority support',
    ],
    notIncluded: [
      'Resume boost',
      'Direct chat with employers',
      'Analytics dashboard',
      'Featured profile',
    ],
    recommended: false,
    bestFor: 'Active job seekers looking for their next role',
    icon: 'Zap',
  },
  {
    id: 'plan_premium',
    name: 'Premium',
    slug: 'premium',
    price: 100,
    period: 'month',
    features: [
      'Everything in Basic',
      'Resume boost (2× visibility)',
      'Direct chat with employers',
      'Application analytics',
      'Interview preparation tips',
      'Profile badge',
      'Priority in search results',
    ],
    notIncluded: [
      'Dedicated account manager',
      'Custom branding',
    ],
    recommended: true,
    bestFor: 'Serious candidates who want to stand out',
    icon: 'Crown',
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    price: 190,
    period: 'month',
    features: [
      'Everything in Premium',
      'Featured profile listing',
      'Dedicated account manager',
      'Bulk resume access (employers)',
      'Advanced analytics & reports',
      'API access',
      'Custom branding',
      'Priority customer support',
      'Franchise management tools',
    ],
    notIncluded: [],
    recommended: false,
    bestFor: 'Businesses, agencies & franchise partners',
    icon: 'Building2',
  },
];

// ===== JOB CATEGORIES =====
export const JOB_CATEGORIES = [
  'IT & Software',
  'Healthcare',
  'Education',
  'Agriculture',
  'Construction',
  'Manufacturing',
  'Retail',
  'Finance',
  'Hospitality',
  'Transportation',
  'Textile',
  'Automobile',
  'Real Estate',
  'Media',
  'Government',
  'BPO',
  'Sales & Marketing',
  'Accounting',
  'Legal',
  'HR',
] as const;

export type JobCategory = typeof JOB_CATEGORIES[number];

// ===== SKILLS =====
export const SKILLS = [
  // Tech
  'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Node.js',
  'SQL', 'MongoDB', 'AWS', 'HTML/CSS', 'Flutter', 'Android', 'iOS',
  'Data Entry', 'MS Office', 'Tally', 'AutoCAD',
  // Professional
  'Communication', 'Leadership', 'Teamwork', 'Problem Solving',
  'Time Management', 'Customer Service', 'Sales', 'Negotiation',
  'Accounting', 'Marketing', 'Content Writing', 'Graphic Design',
  // Trades
  'Welding', 'Electrical', 'Plumbing', 'Carpentry', 'Driving',
  'Machine Operation', 'Quality Control', 'Packaging',
  // Tamil Nadu specific
  'Tamil Typing', 'English Typing', 'Tailoring', 'Embroidery',
  'Agriculture Management', 'Silk Weaving', 'Logistics',
] as const;

// ===== EXPERIENCE LEVELS =====
export const EXPERIENCE_LEVELS = [
  'Fresher',
  '1-2 Years',
  '3-5 Years',
  '5-10 Years',
  '10+ Years',
] as const;

export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number];

// ===== SALARY RANGES (INR per month) =====
export const SALARY_RANGES = [
  { label: '₹5,000 – ₹10,000', min: 5000, max: 10000 },
  { label: '₹10,000 – ₹15,000', min: 10000, max: 15000 },
  { label: '₹15,000 – ₹20,000', min: 15000, max: 20000 },
  { label: '₹20,000 – ₹30,000', min: 20000, max: 30000 },
  { label: '₹30,000 – ₹50,000', min: 30000, max: 50000 },
  { label: '₹50,000 – ₹75,000', min: 50000, max: 75000 },
  { label: '₹75,000 – ₹1,00,000', min: 75000, max: 100000 },
  { label: '₹1,00,000+', min: 100000, max: 999999 },
] as const;

// ===== APPLICATION STATUS CONFIG =====
export const APPLICATION_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  applied: {
    label: 'Applied',
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
    icon: 'Send',
  },
  shortlisted: {
    label: 'Shortlisted',
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
    icon: 'Star',
  },
  interview_scheduled: {
    label: 'Interview Scheduled',
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    icon: 'Calendar',
  },
  selected: {
    label: 'Selected',
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    icon: 'CheckCircle',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-400 bg-red-400/10 border-red-400/30',
    icon: 'XCircle',
  },
};

// ===== LEAD STATUS CONFIG =====
export const LEAD_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' },
  contacted: { label: 'Contacted', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  qualified: { label: 'Qualified', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  converted: { label: 'Converted', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  lost: { label: 'Lost', color: 'text-red-400 bg-red-400/10 border-red-400/30' },
};

// NOTE: Navigation items are defined inline in each layout component
// (admin/layout.tsx, employer/layout.tsx, seeker/layout.tsx).
// Centralised nav constants were removed to avoid drift.

// ===== GAMIFICATION CONSTANTS =====

/** Points awarded for each user activity */
export const POINT_VALUES: Record<string, { points: number; description: string }> = {
  profile_complete: { points: 10, description: 'Profile completed' },
  resume_upload: { points: 25, description: 'Resume uploaded' },
  job_apply: { points: 5, description: 'Applied to a job' },
  interview_scheduled: { points: 50, description: 'Interview scheduled' },
  job_offer: { points: 500, description: 'Received job offer' },
  write_review: { points: 15, description: 'Wrote a company review' },
  skill_test: { points: 20, description: 'Completed a skill test' },
  attend_interview: { points: 30, description: 'Attended an interview' },
  share_job: { points: 10, description: 'Shared a job with a friend' },
  referral_converted: { points: 100, description: 'Referral converted to signup' },
  daily_login: { points: 2, description: 'Daily login bonus' },
  profile_view_received: { points: 1, description: 'Profile viewed by employer' },
};

/** Available badges users can earn */
export const BADGE_DEFINITIONS = [
  {
    id: 'hot_talent',
    name: 'Hot Talent',
    icon: '🔥',
    description: '5+ job invites in 1 week',
    requirement: 'Receive 5 job invites in a single week',
  },
  {
    id: 'premium_seeker',
    name: 'Premium Seeker',
    icon: '⭐',
    description: 'Upgraded to Premium plan',
    requirement: 'Subscribe to Premium or Enterprise plan',
  },
  {
    id: 'got_hired',
    name: 'Got Hired',
    icon: '🎯',
    description: 'Accepted a job offer',
    requirement: 'Receive and accept a job offer',
  },
  {
    id: 'skill_builder',
    name: 'Skill Builder',
    icon: '📚',
    description: 'Completed 3 skill tests',
    requirement: 'Complete 3 skill assessment tests',
  },
  {
    id: 'communicator',
    name: 'Communicator',
    icon: '💬',
    description: '20+ messages exchanged',
    requirement: 'Exchange 20+ messages with employers',
  },
  {
    id: 'top_performer',
    name: 'Top Performer',
    icon: '🏆',
    description: 'Ranked in top 10 monthly',
    requirement: 'Reach top 10 on the monthly leaderboard',
  },
  {
    id: 'speedster',
    name: 'Speedster',
    icon: '🚀',
    description: 'Applied to 10 jobs in 1 day',
    requirement: 'Submit 10 job applications in a single day',
  },
  {
    id: 'referral_king',
    name: 'Referral King',
    icon: '🤝',
    description: '3+ successful referrals',
    requirement: 'Refer 3 friends who sign up and complete profiles',
  },
  {
    id: 'profile_star',
    name: 'Profile Star',
    icon: '✨',
    description: '100% profile completion',
    requirement: 'Complete all profile sections including photo and resume',
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    icon: '🐦',
    description: 'First 1000 users',
    requirement: 'Be among the first 1000 registered users',
  },
] as const;

/** Achievement tracking configurations */
export const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'first_application',
    name: 'First Step',
    icon: '👣',
    description: 'Submit your first job application',
    maxProgress: 1,
  },
  {
    id: 'five_applications',
    name: 'Getting Started',
    icon: '📝',
    description: 'Submit 5 job applications',
    maxProgress: 5,
  },
  {
    id: 'twenty_applications',
    name: 'Active Seeker',
    icon: '🎪',
    description: 'Submit 20 job applications',
    maxProgress: 20,
  },
  {
    id: 'first_interview',
    name: 'Interview Ready',
    icon: '🎤',
    description: 'Get your first interview scheduled',
    maxProgress: 1,
  },
  {
    id: 'profile_complete',
    name: 'Profile Pro',
    icon: '👤',
    description: 'Complete your profile to 100%',
    maxProgress: 100,
  },
  {
    id: 'hundred_points',
    name: 'Point Collector',
    icon: '💎',
    description: 'Earn 100 reward points',
    maxProgress: 100,
  },
  {
    id: 'five_hundred_points',
    name: 'Point Master',
    icon: '👑',
    description: 'Earn 500 reward points',
    maxProgress: 500,
  },
  {
    id: 'three_badges',
    name: 'Badge Hunter',
    icon: '🏅',
    description: 'Earn 3 badges',
    maxProgress: 3,
  },
] as const;
