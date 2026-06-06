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
  isVerified: boolean;
  lastLoginAt?: Date;
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
