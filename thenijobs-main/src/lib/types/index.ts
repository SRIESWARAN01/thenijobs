// ============================================================
// Shared TypeScript types for THENIJOBS platform
// ============================================================

// ===== USER TYPES =====
export type UserRole =
  | 'job_seeker'
  | 'employer'
  | 'business_owner'
  | 'supplier'
  | 'service_provider'
  | 'admin'
  | 'super_admin';

/** Granular admin team roles */
export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'moderator'
  | 'support_executive'
  | 'sales_manager'
  | 'franchise_admin';

/** Granular employer team roles */
export type EmployerRole =
  | 'company_owner'
  | 'hr_manager'
  | 'recruiter'
  | 'branch_manager'
  | 'staff_user';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  role: UserRole;
  adminRole?: AdminRole;
  employerRole?: EmployerRole;
  companyId?: string;
  district?: string;
  preferences?: {
    openToWork?: boolean;
    jobTypes?: string[];
    locations?: string[];
    expectedSalary?: number;
  };
  isVerified: boolean;
  mobileVerified?: boolean;
  phoneVerified?: boolean;
  mobileVerifiedAt?: Date;
  lastLoginAt?: Date;
  theniJobsId?: string;
  smartIdTheme?: unknown;
  verificationLevel?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  profileScore?: {
    total: number;
    skills: number;
    experience: number;
    education: number;
    verification: number;
    activity: number;
  };
  aiSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== JOB SEEKER =====
export interface JobSeekerProfile {
  uid: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  state: string;
  profilePhotoUrl?: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  resumeUrl?: string;
  expectedSalary?: number;
  jobTypePreference: JobType[];
  isOpenToWork: boolean;
  profileStrength: number;
  theniJobsId?: string;
  smartIdTheme?: unknown;
  projects?: {
    id: string;
    title: string;
    description?: string;
    link?: string;
  }[];
  portfolioLinks?: string[];
  socialLinks?: Record<string, string>;
  certifications?: {
    id: string;
    name: string;
    organization?: string;
    date?: string;
    link?: string;
  }[];
  verificationLevel?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  profileScore?: {
    total: number;
    skills: number;
    experience: number;
    education: number;
    verification: number;
    activity: number;
  };
  aiSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number;
  isCurrent: boolean;
}

// ===== COMPANY / EMPLOYER =====
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface VerificationBadges {
  mobileVerified: boolean;
  emailVerified: boolean;
  gstVerified: boolean;
  businessVerified: boolean;
}

export interface Company {
  id: string;
  slug: string;
  ownerId: string;
  theniJobsId?: string;
  smartIdTheme?: unknown;
  subscriptionPlan?: SubscriptionPlanSlug;
  subscriptionStatus?: 'active' | 'expired' | 'cancelled' | 'trial';
  plan?: SubscriptionPlanSlug;
  profileScore?: Record<string, number>;
  // Basic Info
  name: string;
  logoUrl?: string;
  coverImageUrl?: string;
  category: string;
  subcategory?: string;
  foundedYear?: number;
  companySize?: string;
  gstNumber?: string;
  registrationNumber?: string;
  description: string;
  // Contact
  phone: string;
  alternatePhone?: string;
  email: string;
  website?: string;
  whatsapp?: string;
  // Location
  address: string;
  district: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  mapEmbedUrl?: string;
  // Social Media
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  // Gallery
  galleryImages: string[];
  galleryVideos: string[];
  // Services
  services: string[];
  // Verification
  verificationStatus: VerificationStatus;
  verificationBadges: VerificationBadges;
  isActive: boolean;
  isFeatured: boolean;
  isPremium: boolean;
  // Analytics
  viewCount: number;
  enquiryCount: number;
  rating: number;
  reviewCount: number;
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ===== JOB =====
export type JobType =
  | 'full_time'
  | 'part_time'
  | 'internship'
  | 'remote'
  | 'work_from_home'
  | 'fresher'
  | 'contract';

export type ApplicationStatus =
  | 'applied'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'selected'
  | 'rejected';

export interface Job {
  id: string;
  slug: string;
  companyId: string;
  company?: Company;
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  location: string;
  district: string;
  jobType: JobType;
  salaryMin?: number;
  salaryMax?: number;
  experience: string;
  education?: string;
  openings: number;
  deadline?: Date;
  isActive: boolean;
  isPremium: boolean;
  isFeatured: boolean;
  isUrgent: boolean;
  applicationCount: number;
  viewCount: number;
  postedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobApplication {
  id: string;
  jobId: string;
  job?: Job;
  seekerId: string;
  seeker?: JobSeekerProfile;
  resumeUrl?: string;
  coverLetter?: string;
  status: ApplicationStatus;
  employerNote?: string;
  interviewDate?: Date;
  appliedAt: Date;
  updatedAt: Date;
}

// ===== REVIEW =====
export interface Review {
  id: string;
  targetId: string;
  targetType: 'company' | 'employer' | 'service';
  reviewerId: string;
  reviewerName: string;
  reviewerPhoto?: string;
  rating: number;
  title: string;
  content: string;
  isVerified: boolean;
  helpfulCount: number;
  reply?: string;
  createdAt: Date;
}

// ===== LEAD =====
export interface Lead {
  id: string;
  type: 'candidate' | 'business' | 'service';
  source: string;
  companyId?: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  message?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  assignedTo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== SERVICE =====
export interface Service {
  id: string;
  providerId: string;
  providerName: string;
  name: string;
  category: string;
  description: string;
  pricing?: string;
  district: string;
  status: 'active' | 'pending' | 'paused' | 'rejected';
  images: string[];
  rating: number;
  reviewCount: number;
  enquiryCount: number;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceRequest {
  id: string;
  serviceId: string;
  requesterId: string;
  requesterName: string;
  phone: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: Date;
}

// ===== ADVERTISEMENT =====
export interface Advertisement {
  id: string;
  type: 'banner' | 'sponsored' | 'featured';
  title: string;
  imageUrl: string;
  targetUrl: string;
  placement: string;
  startDate: Date;
  endDate: Date;
  impressions: number;
  clicks: number;
  status: 'active' | 'paused' | 'expired' | 'draft';
  createdAt: Date;
}

// ===== SUBSCRIPTION =====
export type SubscriptionPlanSlug = 'free' | 'basic' | 'premium' | 'enterprise';

export interface Subscription {
  id: string;
  userId: string;
  companyId?: string;
  plan: SubscriptionPlanSlug;
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  amount: number;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentMethod?: string;
  createdAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: SubscriptionPlanSlug;
  price: number;
  period: 'month' | 'year' | 'forever';
  features: string[];
  notIncluded: string[];
  recommended: boolean;
  bestFor: string;
  icon: string;
}

// ===== NOTIFICATION =====
export interface Notification {
  id: string;
  userId: string;
  type: 'job_alert' | 'application_update' | 'interview' | 'lead' | 'system' | 'promotion';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}

// ===== ACTIVITY LOG =====
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  targetId: string;
  details?: string;
  ipAddress?: string;
  timestamp: Date;
}

// ===== FRANCHISE =====
export interface Franchise {
  id: string;
  district: string;
  managerId: string;
  managerName: string;
  managerPhone: string;
  status: 'active' | 'inactive' | 'pending';
  revenue: number;
  businesses: number;
  users: number;
  createdAt: Date;
}

// ===== INTERVIEW SCHEDULE =====
export interface InterviewSchedule {
  id: string;
  applicationId: string;
  jobId: string;
  employerId: string;
  seekerId: string;
  date: string;
  time: string;
  mode: 'in_person' | 'phone' | 'video';
  location?: string;
  meetingLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  createdAt: Date;
}

// ===== CHAT =====
export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  message: string;
  type: 'text' | 'image' | 'file';
  read: boolean;
  createdAt: Date;
}

// ===== SUPPORT TICKET =====
export interface SupportTicketMessage {
  senderId: string;
  message: string;
  createdAt: Date;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  messages: SupportTicketMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// ===== CONVERSATION (Real-Time Chat) =====
export interface Conversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantRoles: Record<string, string>;
  participantPhotos?: Record<string, string>;
  jobId?: string;
  jobTitle?: string;
  companyId?: string;
  lastMessage: string;
  lastMessageAt: Date;
  lastMessageSenderId?: string;
  typingUsers: string[];
  unreadCounts: Record<string, number>;
  status: 'active' | 'archived' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: ChatAttachment[];
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface ChatAttachment {
  type: 'image' | 'file' | 'resume';
  url: string;
  name: string;
  size?: number;
}

// ===== GAMIFICATION =====
export interface RewardsPoints {
  current: number;
  total: number;
  monthlyPoints: number;
  monthStartDate: Date;
  lastEarnedAt?: Date;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: Date;
  displayOnProfile: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  requirement: string;
  progress: number;
  maxProgress: number;
  completed: boolean;
  earnedAt?: Date;
}

export interface PointActivity {
  id: string;
  type: string;
  points: number;
  description: string;
  earnedAt: Date;
}

export interface GamificationProfile {
  uid: string;
  rewards: RewardsPoints;
  badges: Badge[];
  achievements: Achievement[];
  recentActivities: PointActivity[];
  leaderboardRank?: number;
}

// ===== ANALYTICS =====
export interface SeekerAnalytics {
  totalApplications: number;
  viewedCount: number;
  respondedCount: number;
  interviewCount: number;
  offerCount: number;
  rejectedCount: number;
  viewRate: number;
  responseRate: number;
  interviewRate: number;
  offerRate: number;
  avgTimeToFirstReply: number;
  profileViews: number;
  weeklyApplicationTrend: number[];
  topMatchedSkills: string[];
  topMissingSkills: string[];
  aiPrediction?: {
    hireProbability: number;
    timeframeDays: number;
    suggestion: string;
  };
}

export interface EmployerAnalytics {
  activeJobs: number;
  totalApplications: number;
  avgApplicationsPerJob: number;
  timeToHire: number;
  offerAcceptanceRate: number;
  costPerHire: number;
  hiringFunnel: {
    applied: number;
    screened: number;
    shortlisted: number;
    interviewed: number;
    offered: number;
    accepted: number;
  };
  jobWiseBreakdown: {
    jobId: string;
    jobTitle: string;
    applications: number;
    qualified: number;
    hired: number;
    qualityScore: number;
  }[];
  candidateSources: Record<string, number>;
}

export interface AdminRevenueAnalytics {
  mrr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  planBreakdown: Record<string, number>;
  churnRate: number;
  mrrTrend: number[];
  districtBreakdown: {
    district: string;
    revenue: number;
    subscriptions: number;
    percentage: number;
  }[];
  cohortRetention: {
    cohort: string;
    retentionRate: number;
    months: number;
  }[];
  userAcquisitionCost: Record<string, number>;
  ltv: number;
  ltvCacRatio: number;
}

// ===== CANDIDATE SUGGESTION (AI Matching) =====
export interface CandidateSuggestion {
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
  inviteSentAt?: Date;
}

// ===== BUSINESS CATEGORIES =====
export const BUSINESS_CATEGORIES = [
  'Agriculture',
  'Construction',
  'Manufacturing',
  'Textile',
  'IT & Software',
  'Education',
  'Healthcare',
  'Retail',
  'Transportation',
  'Real Estate',
  'Finance',
  'Hospitality',
  'Food & Beverage',
  'Automobile',
  'Media & Entertainment',
] as const;

export type BusinessCategory = typeof BUSINESS_CATEGORIES[number];

// ===== DISTRICTS (Tamil Nadu) =====
export const TN_DISTRICTS = [
  'Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem',
  'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul',
  'Thanjavur', 'Ranipet', 'Sivaganga', 'Virudhunagar', 'Namakkal',
  'Theni', 'Villupuram', 'Nagapattinam', 'Kancheepuram', 'Tiruppur',
  'Krishnagiri', 'Dharmapuri', 'Pudukkottai', 'Ramanathapuram',
  'Karur', 'Cuddalore', 'Ariyalur', 'Perambalur', 'Nilgiris',
  'Tiruvannamalai', 'Tiruvarur', 'Tirupathur', 'Chengalpattu',
  'Mayiladuthurai', 'Kallakurichi', 'Tenkasi',
] as const;

export type District = typeof TN_DISTRICTS[number];
