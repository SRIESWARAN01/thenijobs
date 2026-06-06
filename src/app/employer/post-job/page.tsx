'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase, MapPin, Banknote, FileText, Users, Clock,
  ArrowLeft, ArrowRight, Check, Loader2, Plus, X, Zap
} from 'lucide-react';
import { TN_DISTRICTS } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { createDocument, logActivity } from '@/lib/firebase/firestoreService';
import { where } from 'firebase/firestore';
import Link from 'next/link';

const STEPS = [
  { id: 1, label: 'Job Details' },
  { id: 2, label: 'Requirements' },
  { id: 3, label: 'Compensation' },
  { id: 4, label: 'Preview & Post' },
];

const JOB_TYPES = [
  { id: 'full_time', label: 'Full Time' },
  { id: 'part_time', label: 'Part Time' },
  { id: 'internship', label: 'Internship' },
  { id: 'remote', label: 'Remote' },
  { id: 'work_from_home', label: 'Work From Home' },
  { id: 'fresher', label: 'Fresher' },
  { id: 'contract', label: 'Contract' },
];

const EXPERIENCE_LEVELS = ['Fresher (0 yrs)', '0–1 years', '1–2 years', '2–5 years', '5–10 years', '10+ years'];
const EDUCATION_LEVELS = ['8th Pass', '10th Pass', '12th Pass', 'Diploma', 'Any Degree', 'B.E / B.Tech', 'MBA', 'Post Graduate'];
const OPENINGS_OPTIONS = ['1', '2', '3', '4', '5', '10', '15', '20', '20+'];
const BENEFITS_OPTIONS = ['PF', 'ESI', 'Health Insurance', 'Food Allowance', 'Travel Allowance', 'Bonus', 'Accommodation', 'Paid Leave'];

export default function PostJobPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [benefits, setBenefits] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    jobType: 'full_time',
    location: '',
    district: '',
    openings: '1',
    experience: '',
    education: '',
    salaryMin: '',
    salaryMax: '',
    salaryType: 'monthly',
    isNegotiable: false,
    deadline: '',
    isPremium: false,
    isUrgent: false,
    isFeatured: false,
  });

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  
  const addSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills((s) => [...s, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const toggleBenefit = (b: string) =>
    setBenefits((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b]));

  const handlePost = async () => {
    if (!companyId) {
      alert('You must have a registered company profile to post a job.');
      return;
    }
    
    setLoading(true);
    try {
      const jobData = {
        title: form.title,
        description: form.description,
        jobType: form.jobType,
        location: form.location,
        district: form.district,
        openings: parseInt(form.openings) || 1,
        experience: form.experience,
        education: form.education,
        skills,
        salaryMin: form.salaryMin ? parseFloat(form.salaryMin) : null,
        salaryMax: form.salaryMax ? parseFloat(form.salaryMax) : null,
        salaryType: form.salaryType,
        isNegotiable: form.isNegotiable,
        benefits,
        isPremium: form.isPremium,
        isUrgent: form.isUrgent,
        isFeatured: form.isFeatured,
        companyId,
        companyName: company.name,
        companyLogoUrl: company.logoUrl || '',
        postedBy: user?.uid,
        status: 'pending', // Pending admin approval
        isActive: false,   // Not active until admin approves
        viewCount: 0,
        applicationsCount: 0,
      };

      const jobId = await createDocument('jobs', jobData);

      await logActivity({
        userId: user?.uid || '',
        userName: user?.displayName || user?.email || 'Employer',
        action: 'Posted a job listing',
        target: form.title,
        targetId: jobId,
      });

      alert('Job posted successfully! It has been submitted for admin approval.');
      router.push('/employer/jobs');
    } catch (err) {
      console.error('Post job error:', err);
      alert('Failed to post job listing.');
    } finally {
      setLoading(false);
    }
  };

  if (companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-outfit">
        <Loader2 size={36} className="text-cyan-400 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading details...</p>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit">
        <Briefcase size={48} className="text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold text-white">No Company Profile Found</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Please register your company profile first to post job opportunities.</p>
        <Link href="/employer/company-profile" className="mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold hover:opacity-90 transition-opacity">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  const isFormValidStep1 = form.title && form.description && form.district && form.openings;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 font-outfit">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white">
          Post a <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Job Opportunity</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">Reach thousands of qualified local candidates</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
              ${step > s.id ? 'bg-emerald-500 text-white' : step === s.id ? 'bg-cyan-600 text-white' : 'bg-white/10 text-gray-500'}`}>
              {step > s.id ? <Check size={12} /> : s.id}
            </div>
            <span className={`text-xs hidden sm:block font-medium transition-colors
              ${step === s.id ? 'text-white' : step > s.id ? 'text-emerald-400' : 'text-gray-600'}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full ml-1 ${step > s.id ? 'bg-emerald-500' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8">
        {/* STEP 1 — Job Details */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Briefcase size={16} className="text-cyan-400" /> Job Details
            </h2>

            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Job Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="e.g. Tractor Driver, School Teacher, Accounts Executive"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 focus:bg-white/[0.06] outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 font-medium block mb-2">Job Type *</label>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => update('jobType', t.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all
                      ${form.jobType === t.id
                        ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Job Description *</label>
              <textarea
                rows={6}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Describe job responsibilities, working hours, day-to-day tasks, work environment..."
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 focus:bg-white/[0.06] outline-none transition-all resize-none leading-relaxed"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">District *</label>
                <select
                  value={form.district}
                  onChange={(e) => update('district', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-cyan-500/40 outline-none transition-all"
                >
                  <option value="">Select district</option>
                  {TN_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Location (Area / Town)</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  placeholder="e.g. Periyakulam, Bodinayakanur"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Number of Openings *</label>
                <select
                  value={form.openings}
                  onChange={(e) => update('openings', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-cyan-500/40 outline-none transition-all"
                >
                  {OPENINGS_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Application Deadline</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => update('deadline', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-cyan-500/40 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Requirements */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Users size={16} className="text-cyan-400" /> Candidate Requirements
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Experience Required</label>
                <select
                  value={form.experience}
                  onChange={(e) => update('experience', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-cyan-500/40 outline-none transition-all"
                >
                  <option value="">Select experience</option>
                  {EXPERIENCE_LEVELS.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Minimum Education Qualification</label>
                <select
                  value={form.education}
                  onChange={(e) => update('education', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-cyan-500/40 outline-none transition-all"
                >
                  <option value="">Select education</option>
                  {EDUCATION_LEVELS.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-medium block mb-2">Required Skills</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="e.g. Tractor Driving, Tally, Excel..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => addSkill()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 text-xs font-semibold"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => setSkills((p) => p.filter((_, idx) => idx !== i))}
                        className="hover:text-rose-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3 — Compensation */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Banknote size={16} className="text-cyan-400" /> Salary & Benefits
            </h2>

            <div>
              <label className="text-xs text-gray-400 font-medium block mb-2">Salary Rate</label>
              <div className="flex gap-2">
                {['monthly', 'yearly', 'daily', 'hourly'].map((t) => (
                  <button
                    key={t}
                    onClick={() => update('salaryType', t)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border capitalize transition-all
                      ${form.salaryType === t
                        ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-gray-400'
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Minimum Salary (₹)</label>
                <input
                  type="number"
                  value={form.salaryMin}
                  onChange={(e) => update('salaryMin', e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Maximum Salary (₹)</label>
                <input
                  type="number"
                  value={form.salaryMax}
                  onChange={(e) => update('salaryMax', e.target.value)}
                  placeholder="e.g. 20000"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => update('isNegotiable', !form.isNegotiable)}
                className={`w-10 h-6 rounded-full relative transition-all cursor-pointer ${form.isNegotiable ? 'bg-cyan-500' : 'bg-white/20'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${form.isNegotiable ? 'left-5' : 'left-1'}`} />
              </div>
              <span className="text-xs text-gray-300 font-medium">Salary is negotiable</span>
            </label>

            <div>
              <label className="text-xs text-gray-400 font-medium block mb-2">Benefits / Perks</label>
              <div className="flex flex-wrap gap-2">
                {BENEFITS_OPTIONS.map((b) => (
                  <button
                    key={b}
                    onClick={() => toggleBenefit(b)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                      ${benefits.includes(b)
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}
                  >
                    {benefits.includes(b) ? '✓ ' : ''}
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Boost Options */}
            <div className="space-y-2.5 pt-4 border-t border-white/[0.06]">
              <p className="text-xs font-semibold text-gray-400">Boost Options (Optional)</p>
              {[
                { key: 'isUrgent', label: '⚡ Mark as Urgent Hiring', desc: 'Get 3× more visibility on listings', color: 'amber' },
                { key: 'isFeatured', label: '⭐ Featured Job Listing', desc: 'Positioned prominently on the homepage', color: 'violet' },
                { key: 'isPremium', label: '👑 Premium Badge', desc: 'Highlighted list styling for more views', color: 'cyan' },
              ].map(({ key, label, desc, color }) => {
                const isChecked = (form as any)[key];
                return (
                  <div
                    key={key}
                    onClick={() => update(key, !isChecked)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all
                      ${isChecked
                        ? `bg-[#0a1f2d] border-${color}-500/30`
                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                      }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">{label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                    </div>
                    <div
                      className={`w-10 h-6 rounded-full relative transition-all ${isChecked ? 'bg-cyan-500' : 'bg-white/20'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${isChecked ? 'left-5' : 'left-1'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4 — Preview & Post */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FileText size={16} className="text-cyan-400" /> Preview & Post
            </h2>

            <div className="glass-card rounded-2xl p-5 border border-white/15">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white text-base">{form.title || 'Untitled Job'}</h3>
                    {form.isUrgent && (
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 flex items-center gap-0.5">
                        <Zap size={9} className="fill-current" />
                        URGENT
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mt-1">{company.name} • {form.district || 'Location'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Briefcase size={11} />
                  {JOB_TYPES.find((t) => t.id === form.jobType)?.label}
                </span>
                {form.salaryMin && (
                  <span className="flex items-center gap-1">
                    <Banknote size={11} />
                    ₹{form.salaryMin}–₹{form.salaryMax}/{form.salaryType}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users size={11} />
                  {form.openings} opening{parseInt(form.openings) > 1 ? 's' : ''}
                </span>
                {form.experience && (
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {form.experience}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap mt-2">{form.description || 'Job description will appear here...'}</p>
              
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t border-white/[0.06]">
                  {skills.map((s) => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-gray-400 border border-white/[0.08]">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card rounded-2xl p-4 border border-cyan-500/20 bg-cyan-500/5">
              <p className="text-xs text-cyan-400 font-semibold mb-1">✅ Ready for Review</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                By clicking "Post Job Now", your listing will be submitted to the THENIJOBS administration for approval.
                Once approved, it will be visible in public search and alerts.
              </p>
            </div>
          </div>
        )}

        {/* Nav Buttons */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-white/[0.06]">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-5 py-3 rounded-2xl text-xs font-bold border border-white/10 hover:bg-white/[0.04] text-gray-300 flex items-center gap-2"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <button
            onClick={step === 4 ? handlePost : () => setStep((s) => s + 1)}
            disabled={loading || (step === 1 && !isFormValidStep1)}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {step === 4 ? 'Post Job Now' : 'Continue'}
            {!loading && <ArrowRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
