export interface ProfileScoreBreakdown {
  total: number;
  photo: number;
  resume: number;
  skills: number;
  education: number;
  experience: number;
  contact: number;
  certificates: number;
  projects: number;
  portfolio: number;
  social: number;
}

export interface CompanyScoreBreakdown {
  total: number;
  logo: number;
  banner: number;
  gallery: number;
  details: number;
  contact: number;
  location: number;
  services: number;
  social: number;
  verification: number;
}

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.filter(Boolean).length > 0;
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function ratioScore(done: number, total: number, weight: number): number {
  if (total <= 0) return 0;
  return (Math.max(0, Math.min(done, total)) / total) * weight;
}

export function calculateSeekerProfileScore(profile: Record<string, any>): ProfileScoreBreakdown {
  const resumes = Array.isArray(profile.resumes) ? profile.resumes : [];
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const education = Array.isArray(profile.education) ? profile.education : [];
  const experience = Array.isArray(profile.experience) ? profile.experience : [];
  const certifications = Array.isArray(profile.certifications) ? profile.certifications : [];
  const projects = Array.isArray(profile.projects) ? profile.projects : [];
  const portfolio = Array.isArray(profile.portfolio)
    ? profile.portfolio
    : Array.isArray(profile.portfolioLinks)
      ? profile.portfolioLinks
      : [];
  const socialLinks = profile.socialLinks && typeof profile.socialLinks === 'object'
    ? Object.values(profile.socialLinks)
    : [];

  const contactFields = [
    profile.name || profile.displayName,
    profile.email,
    profile.phone,
    profile.district,
    profile.address,
  ];

  const score: ProfileScoreBreakdown = {
    photo: hasValue(profile.photoUrl || profile.profilePhotoUrl || profile.photoURL) ? 10 : 0,
    resume: hasValue(profile.resumeUrl) || resumes.length > 0 ? 15 : 0,
    skills: ratioScore(Math.min(skills.length, 5), 5, 15),
    education: education.length > 0 ? 10 : 0,
    experience: experience.length > 0 ? 10 : 0,
    contact: ratioScore(contactFields.filter(hasValue).length, contactFields.length, 15),
    certificates: certifications.length > 0 ? 8 : 0,
    projects: projects.length > 0 ? 7 : 0,
    portfolio: portfolio.filter(hasValue).length > 0 ? 7 : 0,
    social: socialLinks.filter(hasValue).length > 0 ? 3 : 0,
    total: 0,
  };

  score.total = clampScore(
    score.photo +
    score.resume +
    score.skills +
    score.education +
    score.experience +
    score.contact +
    score.certificates +
    score.projects +
    score.portfolio +
    score.social,
  );

  return score;
}

export function calculateCompanyProfileScore(company: Record<string, any>): CompanyScoreBreakdown {
  const gallery = Array.isArray(company.gallery)
    ? company.gallery
    : Array.isArray(company.galleryImages)
      ? company.galleryImages
      : [];
  const services = Array.isArray(company.services) ? company.services : [];
  const social = [
    company.facebook,
    company.instagram,
    company.linkedin,
    company.youtube,
    company.website,
  ];
  const verification = company.verification || company.verificationBadges || {};
  const detailFields = [
    company.name,
    company.category,
    company.description,
    company.tagline,
  ];
  const contactFields = [
    company.phone,
    company.email,
    company.whatsapp,
  ];
  const locationFields = [
    company.address,
    company.district,
    company.state,
  ];

  const score: CompanyScoreBreakdown = {
    logo: hasValue(company.logoUrl) ? 12 : 0,
    banner: hasValue(company.coverUrl || company.coverImageUrl) ? 8 : 0,
    gallery: ratioScore(gallery.filter(hasValue).length, 4, 10),
    details: ratioScore(detailFields.filter(hasValue).length, detailFields.length, 20),
    contact: ratioScore(contactFields.filter(hasValue).length, contactFields.length, 15),
    location: ratioScore(locationFields.filter(hasValue).length, locationFields.length, 10),
    services: ratioScore(Math.min(services.length, 3), 3, 10),
    social: social.filter(hasValue).length > 0 ? 5 : 0,
    verification: Object.values(verification).filter(Boolean).length > 0 ? 10 : 0,
    total: 0,
  };

  score.total = clampScore(
    score.logo +
    score.banner +
    score.gallery +
    score.details +
    score.contact +
    score.location +
    score.services +
    score.social +
    score.verification,
  );

  return score;
}
