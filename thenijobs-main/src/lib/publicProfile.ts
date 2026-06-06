import { generateTheniJobsId, normalizeSmartIdTheme, type SmartIdProfileType } from './smartId';

function compactArray<T>(items: T[] | undefined | null): T[] {
  return Array.isArray(items) ? items.filter(Boolean) : [];
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

interface PublicResumeRef {
  url?: string;
  isDefault?: boolean;
}

export function buildPublicSeekerProfile(
  uid: string,
  profile: Record<string, any>,
  user?: Record<string, any> | null,
) {
  const theniJobsId =
    cleanString(profile.theniJobsId) ||
    cleanString(user?.theniJobsId) ||
    generateTheniJobsId(uid, 'job_seeker');
  const photoUrl = cleanString(profile.photoUrl || profile.profilePhotoUrl || user?.photoURL);
  const resumes = compactArray<PublicResumeRef>(profile.resumes);
  const defaultResume = resumes.find((resume) => resume?.isDefault) || resumes[0];

  return {
    id: uid,
    ownerId: uid,
    type: 'job_seeker' as SmartIdProfileType,
    theniJobsId,
    name: cleanString(profile.name || user?.displayName),
    displayName: cleanString(profile.name || user?.displayName),
    currentRole: cleanString(profile.currentRole || profile.qualification),
    qualification: cleanString(profile.currentRole || profile.qualification || 'Job Seeker'),
    district: cleanString(profile.district || user?.district),
    email: cleanString(profile.email || user?.email),
    phone: cleanString(profile.phone || user?.phone),
    photoUrl,
    profilePhotoUrl: photoUrl,
    isOpenToWork: profile.isOpenToWork !== false,
    isVerified: Boolean(user?.isVerified || profile.isVerified),
    skills: compactArray(profile.skills).slice(0, 20),
    languages: compactArray(profile.languages).slice(0, 10),
    education: compactArray(profile.education).slice(0, 10),
    experience: compactArray(profile.experience).slice(0, 10),
    certifications: compactArray(profile.certifications).slice(0, 10),
    projects: compactArray(profile.projects).slice(0, 10),
    portfolioLinks: compactArray(profile.portfolio || profile.portfolioLinks).slice(0, 12),
    socialLinks: profile.socialLinks || {},
    resumeUrl: cleanString(profile.resumeUrl || defaultResume?.url),
    profileStrength: profile.profileStrength || profile.profileScore?.total || 0,
    profileScore: profile.profileScore || null,
    aiSummary: cleanString(profile.aiSummary || user?.aiSummary),
    smartIdTheme: normalizeSmartIdTheme(profile.smartIdTheme || user?.smartIdTheme),
    updatedAt: profile.updatedAt,
  };
}

export function buildPublicCompanyProfile(
  companyId: string,
  company: Record<string, any>,
) {
  const theniJobsId =
    cleanString(company.theniJobsId) ||
    generateTheniJobsId(companyId || company.ownerId || company.name, company.type === 'business_owner' ? 'business_owner' : 'employer');
  const gallery = compactArray(company.galleryImages || company.gallery);
  const coverUrl = cleanString(company.coverUrl || company.coverImageUrl);

  return {
    id: companyId,
    ownerId: cleanString(company.ownerId),
    type: 'employer' as SmartIdProfileType,
    theniJobsId,
    slug: cleanString(company.slug),
    name: cleanString(company.name),
    tagline: cleanString(company.tagline),
    category: cleanString(company.category || 'General'),
    district: cleanString(company.district),
    state: cleanString(company.state || 'Tamil Nadu'),
    country: cleanString(company.country || 'India'),
    phone: cleanString(company.phone),
    email: cleanString(company.email),
    whatsapp: cleanString(company.whatsapp),
    website: cleanString(company.website),
    address: cleanString(company.address),
    description: cleanString(company.description),
    logoUrl: cleanString(company.logoUrl),
    coverUrl,
    coverImageUrl: coverUrl,
    gallery,
    galleryImages: gallery,
    services: compactArray(company.services).slice(0, 20),
    socialLinks: {
      facebook: cleanString(company.facebook),
      instagram: cleanString(company.instagram),
      linkedin: cleanString(company.linkedin),
      youtube: cleanString(company.youtube),
    },
    verificationStatus: cleanString(company.verificationStatus || 'pending'),
    verificationBadges: company.verificationBadges || company.verification || {},
    isVerified: company.verificationStatus === 'verified',
    isPremium: Boolean(company.isPremium),
    rating: company.rating || 0,
    reviewCount: company.reviewCount || 0,
    profileScore: company.profileScore || null,
    smartIdTheme: normalizeSmartIdTheme(company.smartIdTheme),
    updatedAt: company.updatedAt,
  };
}
