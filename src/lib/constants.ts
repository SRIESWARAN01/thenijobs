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

// ===== NAVIGATION ITEMS =====

export interface NavItem {
  label: string;
  tamilLabel: string;
  icon: string;
  href: string;
}

/** Admin dashboard sidebar navigation */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', tamilLabel: 'டாஷ்போர்ட்', icon: 'LayoutDashboard', href: '/admin/dashboard' },
  { label: 'Users', tamilLabel: 'பயனர்கள்', icon: 'Users', href: '/admin/users' },
  { label: 'Companies', tamilLabel: 'நிறுவனங்கள்', icon: 'Building2', href: '/admin/companies' },
  { label: 'Jobs', tamilLabel: 'வேலைகள்', icon: 'Briefcase', href: '/admin/jobs' },
  { label: 'Applications', tamilLabel: 'விண்ணப்பங்கள்', icon: 'FileText', href: '/admin/applications' },
  { label: 'Leads', tamilLabel: 'லீட்கள்', icon: 'Target', href: '/admin/leads' },
  { label: 'Services', tamilLabel: 'சேவைகள்', icon: 'Wrench', href: '/admin/services' },
  { label: 'Subscriptions', tamilLabel: 'சந்தாக்கள்', icon: 'CreditCard', href: '/admin/subscriptions' },
  { label: 'Advertisements', tamilLabel: 'விளம்பரங்கள்', icon: 'Megaphone', href: '/admin/advertisements' },
  { label: 'Franchises', tamilLabel: 'பிராஞ்சைஸ்', icon: 'MapPin', href: '/admin/franchises' },
  { label: 'Support Tickets', tamilLabel: 'ஆதரவு டிக்கெட்', icon: 'LifeBuoy', href: '/admin/support' },
  { label: 'Analytics', tamilLabel: 'பகுப்பாய்வு', icon: 'BarChart3', href: '/admin/analytics' },
  { label: 'Activity Log', tamilLabel: 'செயல்பாடு பதிவு', icon: 'ScrollText', href: '/admin/activity' },
  { label: 'Settings', tamilLabel: 'அமைப்புகள்', icon: 'Settings', href: '/admin/settings' },
];

/** Employer dashboard sidebar navigation */
export const EMPLOYER_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', tamilLabel: 'டாஷ்போர்ட்', icon: 'LayoutDashboard', href: '/employer/dashboard' },
  { label: 'Post Job', tamilLabel: 'வேலை பதிவிடு', icon: 'PlusCircle', href: '/employer/post-job' },
  { label: 'My Jobs', tamilLabel: 'எனது வேலைகள்', icon: 'Briefcase', href: '/employer/jobs' },
  { label: 'Applications', tamilLabel: 'விண்ணப்பங்கள்', icon: 'FileText', href: '/employer/applications' },
  { label: 'Interviews', tamilLabel: 'நேர்காணல்கள்', icon: 'Video', href: '/employer/interviews' },
  { label: 'Candidates', tamilLabel: 'விண்ணப்பதாரர்கள்', icon: 'Users', href: '/employer/candidates' },
  { label: 'Company Profile', tamilLabel: 'நிறுவன விவரம்', icon: 'Building2', href: '/employer/company' },
  { label: 'Leads', tamilLabel: 'லீட்கள்', icon: 'Target', href: '/employer/leads' },
  { label: 'Messages', tamilLabel: 'செய்திகள்', icon: 'MessageSquare', href: '/employer/messages' },
  { label: 'Subscription', tamilLabel: 'சந்தா', icon: 'CreditCard', href: '/employer/subscription' },
  { label: 'Analytics', tamilLabel: 'பகுப்பாய்வு', icon: 'BarChart3', href: '/employer/analytics' },
  { label: 'Settings', tamilLabel: 'அமைப்புகள்', icon: 'Settings', href: '/employer/settings' },
];

/** Job seeker dashboard sidebar navigation */
export const SEEKER_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', tamilLabel: 'டாஷ்போர்ட்', icon: 'LayoutDashboard', href: '/seeker/dashboard' },
  { label: 'My Profile', tamilLabel: 'எனது சுயவிவரம்', icon: 'UserCircle', href: '/seeker/profile' },
  { label: 'Search Jobs', tamilLabel: 'வேலை தேடு', icon: 'Search', href: '/jobs' },
  { label: 'My Applications', tamilLabel: 'எனது விண்ணப்பங்கள்', icon: 'FileText', href: '/seeker/applications' },
  { label: 'Saved Jobs', tamilLabel: 'சேமித்த வேலைகள்', icon: 'Bookmark', href: '/seeker/saved' },
  { label: 'Interviews', tamilLabel: 'நேர்காணல்கள்', icon: 'Video', href: '/seeker/interviews' },
  { label: 'Messages', tamilLabel: 'செய்திகள்', icon: 'MessageSquare', href: '/seeker/messages' },
  { label: 'Notifications', tamilLabel: 'அறிவிப்புகள்', icon: 'Bell', href: '/seeker/notifications' },
  { label: 'Subscription', tamilLabel: 'சந்தா', icon: 'CreditCard', href: '/seeker/subscription' },
  { label: 'Settings', tamilLabel: 'அமைப்புகள்', icon: 'Settings', href: '/seeker/settings' },
];
