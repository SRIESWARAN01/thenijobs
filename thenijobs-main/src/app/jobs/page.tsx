'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import {
  Search, MapPin, X, Briefcase, Clock, Banknote,
  Zap, Star, BookmarkPlus, SlidersHorizontal,
  Building2, ArrowRight, BadgeCheck, Loader2
} from 'lucide-react';

import { collection, getDocs, query, where, addDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';

const JOB_TYPES = ['Full Time', 'Part Time', 'Remote', 'WFH', 'Internship', 'Fresher', 'Contract'];
const CATEGORIES = ['Agriculture', 'Education', 'IT & Software', 'Healthcare', 'Construction', 'Textiles', 'Transport', 'Finance'];

interface Job {
  id: string;
  title: string;
  company: string;
  companySlug: string;
  companyId: string;
  location: string;
  salary: string;
  salaryMin?: number;
  salaryMax?: number;
  type: string;
  posted: string;
  postedTimestamp: number;
  logo: string;
  isUrgent: boolean;
  isPremium: boolean;
  isVerified: boolean;
  category: string;
  skills: string[];
  openings: number;
  deadline?: any;
}

function formatTime(timestamp: any) {
  if (!timestamp) return 'Recently';
  const date = timestamp.toMillis ? timestamp.toMillis() : new Date(timestamp).getTime();
  const seconds = Math.floor((Date.now() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + ' yr ago';
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + ' mo ago';
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + ' d ago';
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + ' hr ago';
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + ' min ago';
  return 'Just now';
}

export default function JobsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('latest');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize search and location from URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get('search');
      const locationParam = params.get('location');
      if (searchParam) setSearch(searchParam);
      if (locationParam) setLocation(locationParam);
    }
  }, []);

  // Fetch jobs from Firestore
  useEffect(() => {
    async function loadJobs() {
      try {
        const q = query(collection(db, 'jobs'), where('status', 'in', ['active', 'approved']));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          const salaryStr = d.salaryMin && d.salaryMax 
            ? `₹${Number(d.salaryMin).toLocaleString('en-IN')} - ₹${Number(d.salaryMax).toLocaleString('en-IN')}`
            : 'Salary Negotiable';
            
          const typeStr = d.jobType 
            ? d.jobType.replace('_', ' ').split(' ').map((w: string) => w[0].toUpperCase() + w.substring(1)).join(' ')
            : 'Full Time';

          return {
            id: doc.id,
            title: d.title || '',
            company: d.companyName || 'Verified Employer',
            companySlug: d.companySlug || d.companyId || '',
            companyId: d.companyId || '',
            location: d.location || d.district || 'Theni',
            salary: salaryStr,
            salaryMin: d.salaryMin || 0,
            salaryMax: d.salaryMax || 0,
            type: typeStr,
            posted: formatTime(d.createdAt),
            postedTimestamp: d.createdAt ? (d.createdAt.toMillis ? d.createdAt.toMillis() : new Date(d.createdAt).getTime()) : 0,
            logo: d.logo || (d.companyName ? d.companyName.substring(0, 2).toUpperCase() : '💼'),
            isUrgent: d.isUrgent || false,
            isPremium: d.isPremium || false,
            isVerified: d.isVerified || false,
            category: d.category || '',
            skills: d.skills || [],
            openings: d.openings ? Number(d.openings) : 1,
            deadline: d.deadline || null,
          } as Job;
        });
        setJobs(data);
      } catch (err) {
        console.error('Error loading jobs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  // Fetch saved jobs for the user
  useEffect(() => {
    const userId = user?.uid;
    if (!userId) {
      setSavedJobs([]);
      return;
    }
    async function loadSavedJobs() {
      try {
        const q = query(collection(db, 'savedJobs'), where('userId', '==', userId));
        const snap = await getDocs(q);
        const ids = snap.docs.map(doc => doc.data().jobId);
        setSavedJobs(ids);
      } catch (err) {
        console.error('Error loading saved jobs:', err);
      }
    }
    loadSavedJobs();
  }, [user?.uid]);

  const toggleType = (t: string) => setSelectedTypes(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
  const toggleCategory = (c: string) => setSelectedCategories(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);

  const toggleSave = async (job: Job) => {
    if (!user?.uid) {
      showToast('Please login to save jobs.', 'warning');
      return;
    }
    const isCurrentlySaved = savedJobs.includes(job.id);
    try {
      if (isCurrentlySaved) {
        const q = query(
          collection(db, 'savedJobs'),
          where('userId', '==', user.uid),
          where('jobId', '==', job.id)
        );
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        setSavedJobs(p => p.filter(x => x !== job.id));
      } else {
        await addDoc(collection(db, 'savedJobs'), {
          userId: user.uid,
          jobId: job.id,
          jobTitle: job.title,
          companyName: job.company,
          description: `Positions available at ${job.company}. Required skills: ${job.skills.join(', ')}`,
          district: job.location,
          jobType: job.type,
          salaryMin: job.salaryMin || 0,
          salaryMax: job.salaryMax || 0,
          skills: job.skills,
          deadline: job.deadline || null,
          savedAt: serverTimestamp()
        });
        setSavedJobs(p => [...p, job.id]);
        showToast('Job saved successfully.', 'success');
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
      showToast('Failed to save job.', 'error');
    }
  };

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchSearch = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.skills.some(s => s.toLowerCase().includes(q));
    const matchLoc = !location || j.location.toLowerCase().includes(location.toLowerCase());
    const matchType = selectedTypes.length === 0 || selectedTypes.includes(j.type);
    const matchCat = selectedCategories.length === 0 || selectedCategories.includes(j.category);
    return matchSearch && matchLoc && matchType && matchCat;
  });

  // Apply sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'salary':
        return (b.salaryMax || 0) - (a.salaryMax || 0);
      case 'relevance': {
        if (!search) return 0;
        const q = search.toLowerCase();
        const scoreA = (a.title.toLowerCase().includes(q) ? 2 : 0) + (a.skills.some(s => s.toLowerCase().includes(q)) ? 1 : 0);
        const scoreB = (b.title.toLowerCase().includes(q) ? 2 : 0) + (b.skills.some(s => s.toLowerCase().includes(q)) ? 1 : 0);
        return scoreB - scoreA;
      }
      default: // 'latest'
        return (b.postedTimestamp || 0) - (a.postedTimestamp || 0);
    }
  });

  const activeFilters = selectedTypes.length + selectedCategories.length;


  return (
    <main className="min-h-screen bg-[#0a0a1a]">
      <Header />

      {/* Search Bar – Sticky */}
      <div className="sticky top-16 z-40 glass-nav border-b border-white/5 px-4 sm:px-6 py-3">
        <div className="mx-auto flex max-w-5xl flex-wrap gap-2 sm:flex-nowrap">
          <div className="flex min-w-0 flex-1 basis-full items-center gap-2 search-input px-4 py-2.5 sm:basis-auto">
            <Search size={15} className="text-gray-500 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              type="text" placeholder="Job title, skill, company..."
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none" />
            {search && <button onClick={() => setSearch('')}><X size={13} className="text-gray-500" /></button>}
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2 search-input px-3 py-2.5 sm:flex-none">
            <MapPin size={14} className="text-violet-400 shrink-0" />
            <select value={location} onChange={e => setLocation(e.target.value)}
              className="bg-transparent text-sm text-gray-300 outline-none pr-1 w-24">
              <option value="">All Areas</option>
              {['Theni', 'Madurai', 'Dindigul', 'Coimbatore', 'Remote'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex shrink-0 items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all border
              ${showFilters || activeFilters > 0 ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'bg-white/5 border-white/10 text-gray-400'}`}>
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters > 0 && <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">{activeFilters}</span>}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="max-w-5xl mx-auto mt-3 glass-card rounded-2xl p-4 border border-white/10">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Job Type</p>
                <div className="flex flex-wrap gap-2">
                  {JOB_TYPES.map(t => (
                    <button key={t} onClick={() => toggleType(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                        ${selectedTypes.includes(t) ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => toggleCategory(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                        ${selectedCategories.includes(c) ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {activeFilters > 0 && (
              <button onClick={() => { setSelectedTypes([]); setSelectedCategories([]); }}
                className="mt-3 text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1">
                <X size={11} /> Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-outfit font-bold text-xl text-white">
              {filtered.length} Jobs Found
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {search ? `Results for "${search}"` : 'All available positions'}
              {location ? ` in ${location}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="hidden sm:inline text-xs">Sort:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300 outline-none">
              <option value="latest">Latest</option>
              <option value="salary">Salary</option>
              <option value="relevance">Relevance</option>
            </select>
          </div>
        </div>

        {/* Job Cards */}
        <div className="space-y-3">
          {loading ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Loader2 size={32} className="animate-spin text-violet-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Loading jobs...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-white mb-2">No jobs found</h3>
              <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
              <button onClick={() => { setSearch(''); setSelectedTypes([]); setSelectedCategories([]); setLocation(''); }}
                className="mt-4 btn-outline-glass px-5 py-2 rounded-xl text-sm font-medium">
                Clear Filters
              </button>
            </div>
          ) : (
            sorted.map(job => (
              <div key={job.id} className="premium-card rounded-2xl p-5 group">
                <div className="flex gap-4">
                  {/* Logo */}
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shrink-0">
                    {job.logo}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title + Badges */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <Link href={`/jobs/${job.id}`}>
                          <h2 className="font-semibold text-white text-base hover:text-violet-400 transition-colors cursor-pointer leading-tight">
                            {job.title}
                          </h2>
                        </Link>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Link href={`/company/${job.companySlug || job.companyId}`} className="text-sm text-gray-400 hover:text-violet-400 transition-colors">
                            {job.company}
                          </Link>
                          {job.isVerified && <BadgeCheck size={14} className="text-emerald-400" />}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 items-end shrink-0">
                        {job.isUrgent && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                            <Zap size={9} className="fill-current" /> URGENT
                          </span>
                        )}
                        {job.isPremium && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-full border border-violet-400/20">
                            <Star size={9} className="fill-current" /> PREMIUM
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><MapPin size={11} className="text-violet-400" />{job.location}</span>
                      <span className="flex items-center gap-1"><Banknote size={11} className="text-emerald-400" />{job.salary}</span>
                      <span className="flex items-center gap-1"><Briefcase size={11} className="text-cyan-400" />{job.type}</span>
                      <span className="flex items-center gap-1"><Clock size={11} />{job.posted}</span>
                      <span className="text-violet-400">{job.openings} opening{job.openings > 1 ? 's' : ''}</span>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {job.skills.map(skill => (
                        <span key={skill} className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 border border-white/8">
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                      <Link href={`/jobs/${job.id}`}
                        className="flex-1 sm:flex-none btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold relative z-10 text-center flex items-center justify-center gap-2">
                        Apply Now <ArrowRight size={14} />
                      </Link>
                      <button onClick={() => toggleSave(job)}
                        className={`p-2.5 rounded-xl border transition-all
                          ${savedJobs.includes(job.id)
                            ? 'bg-violet-500/20 border-violet-500/40 text-violet-400'
                            : 'bg-white/5 border-white/10 text-gray-500 hover:text-violet-400 hover:border-violet-500/30'}`}>
                        <BookmarkPlus size={16} className={savedJobs.includes(job.id) ? 'fill-current' : ''} />
                      </button>
                      <Link href={`/company/${job.companySlug || job.companyId}`}
                        className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-xl btn-outline-glass text-sm font-medium">
                        <Building2 size={14} /> Company
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
