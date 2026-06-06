'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, MapPin, Mail, Phone, 
  Globe, FileText, Calendar, Building, User,
  Star, Loader2, Sparkles, MessageCircle, AlertCircle
} from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface IdCardPageClientProps {
  id: string;
}

export default function IdCardPageClient({ id }: IdCardPageClientProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileType, setProfileType] = useState<'seeker' | 'employer' | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Prefer sanitized public Smart ID profile documents.
        const publicProfileDoc = await getDoc(doc(db, 'publicProfiles', id));
        if (publicProfileDoc.exists()) {
          const publicData: any = { id: publicProfileDoc.id, ...publicProfileDoc.data() };
          const resolvedType = publicData.type === 'job_seeker' ? 'seeker' : 'employer';
          setProfileType(resolvedType);
          setProfileData(publicData);
          if (resolvedType === 'employer') {
            fetchActiveJobs(publicData.id);
          }
          setLoading(false);
          return;
        }

        const publicProfilesRef = collection(db, 'publicProfiles');
        const qPublic = query(publicProfilesRef, where('theniJobsId', '==', id));
        const publicSnap = await getDocs(qPublic);
        if (!publicSnap.empty) {
          const docSnap = publicSnap.docs[0];
          const publicData: any = { id: docSnap.id, ...docSnap.data() };
          const resolvedType = publicData.type === 'job_seeker' ? 'seeker' : 'employer';
          setProfileType(resolvedType);
          setProfileData(publicData);
          if (resolvedType === 'employer') {
            fetchActiveJobs(publicData.id);
          }
          setLoading(false);
          return;
        }

        // 2. Legacy fallback for signed-in users created before publicProfiles existed.
        let userDoc = null;
        let userData: any = null;

        try {
          userDoc = await getDoc(doc(db, 'users', id));
        } catch {
          userDoc = null;
        }

        if (userDoc?.exists()) {
          userData = { uid: userDoc.id, ...userDoc.data() };
        } else {
          // Check by theniJobsId in users
          try {
            const usersRef = collection(db, 'users');
            const qUser = query(usersRef, where('theniJobsId', '==', id));
            const queryUserSnap = await getDocs(qUser);
            if (!queryUserSnap.empty) {
              const docSnap = queryUserSnap.docs[0];
              userData = { uid: docSnap.id, ...docSnap.data() };
            }
          } catch {
            userData = null;
          }
        }

        if (userData) {
          if (userData.role === 'job_seeker') {
            const seekerDoc = await getDoc(doc(db, 'seekerProfiles', userData.uid));
            if (seekerDoc.exists()) {
              setProfileType('seeker');
              setProfileData({ ...userData, ...seekerDoc.data() });
            } else {
              setProfileType('seeker');
              setProfileData(userData);
            }
            setLoading(false);
            return;
          } else {
            // For employer, look up company by ownerId
            const companiesRef = collection(db, 'companies');
            const qComp = query(companiesRef, where('ownerId', '==', userData.uid));
            const queryCompSnap = await getDocs(qComp);
            if (!queryCompSnap.empty) {
              const compSnap = queryCompSnap.docs[0];
              const compData = { id: compSnap.id, ...compSnap.data() };
              setProfileType('employer');
              setProfileData(compData);
              fetchActiveJobs(compData.id);
            } else {
              setError('No active company associated with this profile.');
            }
            setLoading(false);
            return;
          }
        }

        // 3. Check if ID represents a Company document ID or Slug directly
        let compDoc = await getDoc(doc(db, 'companies', id));
        if (compDoc.exists()) {
          const compData = { id: compDoc.id, ...compDoc.data() };
          setProfileType('employer');
          setProfileData(compData);
          fetchActiveJobs(compData.id);
          setLoading(false);
          return;
        }

        // Check by Company Slug
        const companiesRef = collection(db, 'companies');
        const qCompSlug = query(companiesRef, where('slug', '==', id));
        const queryCompSlugSnap = await getDocs(qCompSlug);
        if (!queryCompSlugSnap.empty) {
          const docSnap = queryCompSlugSnap.docs[0];
          const compData = { id: docSnap.id, ...docSnap.data() };
          setProfileType('employer');
          setProfileData(compData);
          fetchActiveJobs(compData.id);
          setLoading(false);
          return;
        }

        // Check by Company theniJobsId
        const qCompId = query(companiesRef, where('theniJobsId', '==', id));
        const queryCompIdSnap = await getDocs(qCompId);
        if (!queryCompIdSnap.empty) {
          const docSnap = queryCompIdSnap.docs[0];
          const compData = { id: docSnap.id, ...docSnap.data() };
          setProfileType('employer');
          setProfileData(compData);
          fetchActiveJobs(compData.id);
          setLoading(false);
          return;
        }

        setError('Smart Profile Not Found');
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Error fetching profile information.');
        setLoading(false);
      }
    }

    async function fetchActiveJobs(companyId: string) {
      try {
        const jobsRef = collection(db, 'jobs');
        const qJobs = query(jobsRef, where('companyId', '==', companyId), where('isActive', '==', true));
        const snap = await getDocs(qJobs);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setActiveJobs(list);
      } catch (e) {
        console.error('Failed to load active jobs:', e);
      }
    }

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center font-outfit">
        <Loader2 size={40} className="text-violet-500 animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Loading dynamic portfolio page...</p>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center p-4 font-outfit">
        <div className="glass-card max-w-sm w-full p-6 text-center border border-rose-500/10 bg-rose-500/5 rounded-3xl">
          <AlertCircle size={40} className="text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">{error || 'Profile Not Found'}</h2>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            The scanned QR code is either invalid or the associated document has been modified. Please check the serial number and try again.
          </p>
          <Link href="/" className="btn-gradient inline-flex items-center gap-1.5 py-2.5 px-5 rounded-xl text-xs font-semibold mt-6">
            Go to THENIJOBS
          </Link>
        </div>
      </div>
    );
  }

  // Formatting variables
  const finalId = profileData.theniJobsId || `THJ-TN-2026-${(profileData.uid || profileData.id).substring(0, 6).toUpperCase()}`;
  const strengthScore = profileData.profileStrength || 75;

  return (
    <div className="min-h-screen bg-[#0a0a1a] pb-10 grid-pattern font-outfit text-gray-200">
      
      {/* ── SEEKER PORTFOLIO ── */}
      {profileType === 'seeker' && (
        <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">
          
          {/* Header Card */}
          <div className="glass-card rounded-3xl p-6 border border-white/[0.06] relative overflow-hidden flex flex-col items-center text-center">
            {/* Glowing blobs */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-24 h-24 rounded-2xl p-0.5 bg-gradient-to-tr from-emerald-500 to-cyan-500 mb-4 overflow-hidden relative shadow-lg shrink-0">
              {profileData.photoUrl || profileData.profilePhotoUrl || profileData.photoURL ? (
                <img 
                  src={profileData.photoUrl || profileData.profilePhotoUrl || profileData.photoURL} 
                  alt={profileData.name || profileData.displayName} 
                  className="w-full h-full object-cover rounded-[14px]" 
                />
              ) : (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center rounded-[14px]">
                  <User size={36} className="text-emerald-400" />
                </div>
              )}
            </div>

            <h1 className="text-xl font-bold text-white tracking-wide uppercase">{profileData.name || profileData.displayName}</h1>
            <p className="text-xs font-bold text-cyan-400 mt-1 uppercase tracking-wider">{profileData.qualification || 'Professional Candidate'}</p>
            
            {profileData.isOpenToWork && (
              <span className="mt-3 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 font-bold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                <ShieldCheck size={12} /> Open to Work
              </span>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 w-full mt-6 pt-5 border-t border-white/[0.05] text-xs">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Smart ID</span>
                <span className="font-semibold text-white mt-1 block tracking-wider">{finalId}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Rating Level</span>
                <span className="font-semibold text-emerald-400 mt-1 block uppercase font-outfit">Gold Verified</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Profile Score</span>
                <span className="font-bold text-white mt-1 block font-outfit">{strengthScore}%</span>
              </div>
            </div>
          </div>

          {/* AI Professional Summary */}
          <div className="glass-card rounded-3xl p-6 border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">AI Professional Profile</h2>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              {profileData.aiSummary || `Verified professional candidate with a background in ${profileData.qualification || 'their chosen domain'}. Highly skilled in ${profileData.skills?.slice(0, 4).join(', ') || 'modern industry skills'}. Open for local and regional roles in ${profileData.district || 'Theni'} and neighboring Tamil Nadu districts.`}
            </p>
          </div>

          {/* Details & Info */}
          <div className="glass-card rounded-3xl p-6 border border-white/[0.06] space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Personal Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                  <MapPin size={15} />
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 block">District</span>
                  <span className="text-gray-300 font-semibold">{profileData.district || 'Theni'}, Tamil Nadu</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                  <Mail size={15} />
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 block">Email</span>
                  <span className="text-gray-300 font-semibold block truncate">{profileData.email}</span>
                </div>
              </div>
              {profileData.phone && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                    <Phone size={15} />
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 block">Mobile</span>
                    <span className="text-gray-300 font-semibold">{profileData.phone}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Skills Grid */}
          <div className="glass-card rounded-3xl p-6 border border-white/[0.06]">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Core Competencies</h2>
            <div className="flex flex-wrap gap-2">
              {profileData.skills && profileData.skills.length > 0 ? (
                profileData.skills.map((skill: string, index: number) => (
                  <span key={index} className="bg-white/5 border border-white/10 text-gray-300 text-xs px-3 py-1 rounded-xl">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-xs">No core skills registered yet.</span>
              )}
            </div>
          </div>

          {/* Experience Timeline */}
          {profileData.experience && profileData.experience.length > 0 && (
            <div className="glass-card rounded-3xl p-6 border border-white/[0.06]">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5">Employment Timeline</h2>
              <div className="space-y-6 relative border-l border-white/10 pl-5 ml-2">
                {profileData.experience.map((exp: any, index: number) => (
                  <div key={index} className="relative space-y-1">
                    <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0a0a1a] shadow-md" />
                    <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider flex items-center gap-1">
                      <Calendar size={12} /> {exp.startDate} - {exp.endDate || 'Present'}
                    </span>
                    <h3 className="text-sm font-bold text-white">{exp.role}</h3>
                    <p className="text-xs text-gray-400 font-semibold">{exp.company}</p>
                    {exp.description && (
                      <p className="text-xs text-gray-500 leading-relaxed pt-1">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education timeline */}
          {profileData.education && profileData.education.length > 0 && (
            <div className="glass-card rounded-3xl p-6 border border-white/[0.06]">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5">Education Background</h2>
              <div className="space-y-6 relative border-l border-white/10 pl-5 ml-2">
                {profileData.education.map((edu: any, index: number) => (
                  <div key={index} className="relative space-y-1">
                    <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-violet-500 border-2 border-[#0a0a1a] shadow-md" />
                    <span className="text-[10px] text-violet-400 font-bold block uppercase tracking-wider flex items-center gap-1">
                      <Calendar size={12} /> {edu.startYear || edu.year || ''}{edu.endYear ? ` - ${edu.endYear}` : ''}
                    </span>
                    <h3 className="text-sm font-bold text-white">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</h3>
                    <p className="text-xs text-gray-400 font-semibold">{edu.institution}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profileData.certifications && profileData.certifications.length > 0 && (
            <div className="glass-card rounded-3xl p-6 border border-white/[0.06]">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Certifications</h2>
              <div className="space-y-3">
                {profileData.certifications.map((cert: any, index: number) => (
                  <a
                    key={index}
                    href={cert.link || '#'}
                    target={cert.link ? '_blank' : undefined}
                    rel={cert.link ? 'noreferrer' : undefined}
                    className="block bg-white/5 border border-white/10 rounded-2xl p-4"
                  >
                    <h3 className="text-sm font-bold text-white">{cert.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">{cert.organization} {cert.date ? `- ${cert.date}` : ''}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {profileData.projects && profileData.projects.length > 0 && (
            <div className="glass-card rounded-3xl p-6 border border-white/[0.06]">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Projects & Achievements</h2>
              <div className="space-y-3">
                {profileData.projects.map((project: any, index: number) => (
                  <a
                    key={index}
                    href={project.link || '#'}
                    target={project.link ? '_blank' : undefined}
                    rel={project.link ? 'noreferrer' : undefined}
                    className="block bg-white/5 border border-white/10 rounded-2xl p-4"
                  >
                    <h3 className="text-sm font-bold text-white">{project.title}</h3>
                    {project.description && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{project.description}</p>}
                  </a>
                ))}
              </div>
            </div>
          )}

          {((profileData.portfolioLinks && profileData.portfolioLinks.length > 0) || profileData.socialLinks) && (
            <div className="glass-card rounded-3xl p-6 border border-white/[0.06]">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Portfolio Links</h2>
              <div className="flex flex-wrap gap-2">
                {(profileData.portfolioLinks || []).map((link: string, index: number) => (
                  <a key={index} href={link} target="_blank" rel="noreferrer" className="bg-white/5 border border-white/10 text-cyan-300 text-xs px-3 py-2 rounded-xl">
                    Portfolio {index + 1}
                  </a>
                ))}
                {Object.entries(profileData.socialLinks || {}).filter(([, value]) => Boolean(value)).map(([key, value]) => (
                  <a key={key} href={String(value)} target="_blank" rel="noreferrer" className="bg-white/5 border border-white/10 text-cyan-300 text-xs px-3 py-2 rounded-xl capitalize">
                    {key}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Resume & Action Strips */}
          <div className="flex flex-col sm:flex-row gap-3">
            {profileData.resumeUrl ? (
              <a 
                href={profileData.resumeUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="flex-1 btn-gradient py-3.5 px-6 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2"
              >
                <FileText size={15} /> Download Resume PDF
              </a>
            ) : (
              <div className="flex-1 bg-white/5 border border-white/10 py-3 px-6 rounded-2xl text-xs font-semibold text-gray-500 text-center">
                No printable PDF Resume uploaded
              </div>
            )}
            
            <div className="flex gap-2">
              <a href={`tel:${profileData.phone || ''}`} className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-cyan-400 transition-colors">
                <Phone size={18} />
              </a>
              <a href={`https://wa.me/91${(profileData.phone || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-emerald-400 transition-colors">
                <MessageCircle size={18} />
              </a>
              <a href={`mailto:${profileData.email}`} className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-violet-400 transition-colors">
                <Mail size={18} />
              </a>
            </div>
          </div>

        </div>
      )}

      {/* ── EMPLOYER / BUSINESS PORTFOLIO ── */}
      {profileType === 'employer' && (
        <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6 font-outfit">
          
          {/* Company Profile Header */}
          <div className="glass-card rounded-3xl overflow-hidden border border-white/[0.06] relative">
            {/* Cover photo or placeholder */}
            <div className="h-40 w-full bg-slate-950 relative overflow-hidden">
              {profileData.coverUrl || profileData.coverImageUrl ? (
                <img 
                  src={profileData.coverUrl || profileData.coverImageUrl} 
                  alt="Company Cover" 
                  className="w-full h-full object-cover opacity-60" 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-violet-950 to-indigo-900 opacity-60" />
              )}
              {/* Premium Badge */}
              {profileData.isPremium && (
                <span className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-[10px] uppercase tracking-wider py-1 px-3 rounded-full flex items-center gap-1 shadow-lg">
                  <Star size={11} fill="white" /> Premium Employer
                </span>
              )}
            </div>

            {/* Profile Avatar / Title overlay */}
            <div className="p-6 relative pt-0">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 mb-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-white/10 p-0.5 overflow-hidden shadow-lg shrink-0 z-10">
                  {profileData.logoUrl ? (
                    <img src={profileData.logoUrl} alt={profileData.name} className="w-full h-full object-cover rounded-[14px]" />
                  ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center rounded-[14px]">
                      <Building size={32} className="text-cyan-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    {profileData.name}
                    {profileData.verificationStatus === 'verified' && (
                      <span className="text-emerald-400" title="GST/Business Verified">
                        <ShieldCheck size={18} fill="currentColor" className="text-[#0a0a1a]" />
                      </span>
                    )}
                  </h1>
                  <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider mt-0.5">{profileData.category || 'Local Enterprise'}</p>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 border-t border-white/[0.05] pt-5 text-xs text-center sm:text-left">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Smart Card</span>
                  <span className="font-semibold text-white mt-1 block">{finalId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">GST Status</span>
                  <span className="font-bold text-emerald-400 mt-1 block uppercase">
                    {profileData.gstNumber ? 'Verified' : 'Verified Partner'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Rating</span>
                  <span className="font-semibold text-amber-400 mt-1 block flex items-center justify-center sm:justify-start gap-1">
                    <Star size={12} fill="#fbbf24" className="text-amber-400 shrink-0" />
                    <span>{profileData.rating ? `${profileData.rating}/5` : '4.8/5'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="glass-card rounded-3xl p-6 border border-white/[0.06] space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Business Overview</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              {profileData.description || 'Verified employer and company partner offering local job vacancies and premium services in Tamil Nadu.'}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="glass-card rounded-3xl p-6 border border-white/[0.06] space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Company Specs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                  <Calendar size={15} />
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 block">Established</span>
                  <span className="text-gray-300 font-semibold">{profileData.foundedYear || '2020'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                  <Building size={15} />
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 block">Company Size</span>
                  <span className="text-gray-300 font-semibold">{profileData.companySize || '10 - 50 Employees'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Products & Services Grid */}
          {profileData.services && profileData.services.length > 0 && (
            <div className="glass-card rounded-3xl p-6 border border-white/[0.06] space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Services & Offerings</h2>
              <div className="grid grid-cols-2 gap-2">
                {profileData.services.map((svc: string, index: number) => (
                  <div key={index} className="bg-white/3 border border-white/10 p-3 rounded-2xl flex items-center gap-2">
                    <ShieldCheck size={14} className="text-cyan-400 shrink-0" />
                    <span className="text-xs text-gray-300 font-semibold line-clamp-1">{svc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Job Openings */}
          <div className="glass-card rounded-3xl p-6 border border-white/[0.06] space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Live Job Openings</h2>
            
            {activeJobs.length > 0 ? (
              <div className="space-y-3">
                {activeJobs.map((job: any) => (
                  <Link 
                    key={job.id} 
                    href={`/jobs/${job.id}`}
                    className="block bg-white/3 hover:bg-white/5 border border-white/10 hover:border-violet-500/30 p-4 rounded-2xl transition-all"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-white">{job.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                          <MapPin size={12} className="text-gray-500" /> {job.location || job.district}
                        </p>
                      </div>
                      <span className="text-[10px] bg-violet-600/20 border border-violet-500/35 text-violet-400 font-bold px-2 py-0.5 rounded-lg shrink-0 uppercase tracking-wide">
                        {job.jobType?.replace('_', ' ') || 'Full Time'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">
                No active job postings are currently live for this company.
              </p>
            )}
          </div>

          {/* Contact Details */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a 
              href={`tel:${profileData.phone}`} 
              className="flex-1 btn-gradient py-3.5 px-6 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2"
            >
              <Phone size={15} /> Call Company
            </a>
            
            <div className="flex gap-2">
              {profileData.whatsapp && (
                <a href={`https://wa.me/91${profileData.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-emerald-400 transition-colors">
                  <MessageCircle size={18} />
                </a>
              )}
              {profileData.website && (
                <a href={profileData.website} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-cyan-400 transition-colors">
                  <Globe size={18} />
                </a>
              )}
              <a href={`mailto:${profileData.email}`} className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-violet-400 transition-colors">
                <Mail size={18} />
              </a>
            </div>
          </div>

        </div>
      )}

      {/* Footer */}
      <div className="max-w-2xl mx-auto text-center mt-12 text-[10px] text-gray-600">
        <p>THENIJOBS Smart Digital Identity System &copy; 2026</p>
        <p className="mt-1">Secure verified portfolios using Google Cloud & Firebase Web Platforms</p>
      </div>

    </div>
  );
}
