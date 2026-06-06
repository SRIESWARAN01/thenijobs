'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Users2, Search, Eye, Download, CheckCircle, XCircle,
  Calendar, Clock, Briefcase,
  Star, X, Mail, Phone, ExternalLink, Loader2, Save, GraduationCap,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useDocument } from '@/hooks/useFirestore';
import { updateApplicationStatus, createDocument, createNotification } from '@/lib/firebase/firestoreService';
import { collection, documentId, getDocs, orderBy, query, where } from 'firebase/firestore';
import ApplicationPipeline from '@/components/ui/ApplicationPipeline';
import CandidateSuggestionCard from '@/components/ui/CandidateSuggestionCard';
import { useToast } from '@/contexts/ToastContext';
import { db } from '@/lib/firebase/config';

type PipelineStatus = 'all' | 'applied' | 'shortlisted' | 'interview_scheduled' | 'selected' | 'rejected' | 'ai_recommended';

const PIPELINE_TABS: { label: string; value: PipelineStatus; color: string }[] = [
  { label: 'All', value: 'all', color: 'gray' },
  { label: 'New', value: 'applied', color: 'cyan' },
  { label: 'Shortlisted', value: 'shortlisted', color: 'violet' },
  { label: 'Interview', value: 'interview_scheduled', color: 'amber' },
  { label: 'Selected / Hired', value: 'selected', color: 'emerald' },
  { label: 'Rejected', value: 'rejected', color: 'rose' },
  { label: 'AI Recommended 🤖', value: 'ai_recommended', color: 'violet' },
];

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  applied: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', label: 'New' },
  shortlisted: { bg: 'bg-violet-500/10', text: 'text-violet-400', label: 'Shortlisted' },
  interview_scheduled: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Interview' },
  selected: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Selected' },
  rejected: { bg: 'bg-rose-500/10', text: 'text-rose-400', label: 'Rejected' },
};

function CandidateDetailPanel({
  seekerId,
  applicationId,
  currentStatus,
  initialNotes,
  companyId,
  companyName,
  jobId,
  jobTitle,
  seekerName,
  statusTimestamps,
  onNotesUpdated,
  onUpdateStatus,
  onStatusUpdated
}: {
  seekerId: string;
  applicationId: string;
  currentStatus: string;
  initialNotes?: string;
  companyId: string;
  companyName: string;
  jobId: string;
  jobTitle: string;
  seekerName: string;
  statusTimestamps?: Record<string, any>;
  onNotesUpdated: (notes: string) => void;
  onUpdateStatus: (newStatus: string) => Promise<void>;
  onStatusUpdated: (status: string) => void;
}) {
  const { data: profile, loading: profileLoading } = useDocument<any>('seekerProfiles', seekerId);
  const { data: userDoc, loading: userLoading } = useDocument<any>('users', seekerId);
  const { showToast } = useToast();

  const [savingNotes, setSavingNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState(initialNotes || '');
  
  // Interview Form State
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewMode, setInterviewMode] = useState('Phone');
  const [scheduling, setScheduling] = useState(false);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await updateApplicationStatus(applicationId, currentStatus, localNotes);
      onNotesUpdated(localNotes);
      showToast('Notes updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update notes', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewDate || !interviewTime) {
      showToast('Please fill in both date and time.', 'warning');
      return;
    }
    setScheduling(true);
    try {
      // Create Interview document
      await createDocument('interviews', {
        companyId,
        companyName,
        seekerId,
        seekerName,
        jobId,
        jobTitle,
        date: interviewDate,
        time: interviewTime,
        mode: interviewMode,
        status: 'scheduled',
      });

      // Update Application status
      await updateApplicationStatus(applicationId, 'interview_scheduled');
      onStatusUpdated('interview_scheduled');

      // Create seeker notification
      await createNotification({
        userId: seekerId,
        type: 'interview',
        title: 'Interview Scheduled! 📅',
        message: `An interview has been scheduled for "${jobTitle}" on ${interviewDate} at ${interviewTime} via ${interviewMode}.`,
        actionUrl: '/seeker/interviews',
      });

      showToast('Interview scheduled successfully!', 'success');
      setShowScheduleForm(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to schedule interview', 'error');
    } finally {
      setScheduling(false);
    }
  };

  if (profileLoading || userLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="animate-spin text-cyan-400" size={20} />
      </div>
    );
  }

  const email = profile?.email || userDoc?.email || 'N/A';
  const phone = profile?.phone || userDoc?.phone || 'N/A';
  const experienceList = profile?.experience || [];
  const educationList = profile?.education || [];
  const skillsList = profile?.skills || [];
  // Calculate profile strength
  const strengthItems = [
    { label: 'Photo uploaded', done: !!profile?.photoUrl },
    { label: 'Contact details', done: !!phone && phone !== 'N/A' && !!email && email !== 'N/A' },
    { label: 'Education added', done: educationList.length > 0 },
    { label: 'Experience added', done: experienceList.length > 0 },
    { label: 'Skills added', done: skillsList.length >= 3 },
  ];
  const profileStrength = Math.round((strengthItems.filter(i => i.done).length / strengthItems.length) * 100);

  // Helper to parse Firestore timestamps
  const parseTimestamps = (timestamps?: Record<string, any>): Record<string, Date> | undefined => {
    if (!timestamps) return undefined;
    const parsed: Record<string, Date> = {};
    for (const [key, val] of Object.entries(timestamps)) {
      if (val && typeof val.toDate === 'function') {
        parsed[key] = val.toDate();
      } else if (val && val.seconds) {
        parsed[key] = new Date(val.seconds * 1000);
      } else if (val instanceof Date) {
        parsed[key] = val;
      } else if (typeof val === 'string' || typeof val === 'number') {
        parsed[key] = new Date(val);
      }
    }
    return parsed;
  };

  return (
    <div className="px-5 pb-5 pt-0 border-t border-white/[0.06] animate-fade-in">
      <div className="pt-4 mb-2 overflow-x-auto no-scrollbar">
        <ApplicationPipeline
          currentStatus={currentStatus as any}
          timestamps={parseTimestamps(statusTimestamps)}
          readonly={false}
          onStatusChange={onUpdateStatus}
        />
      </div>
      <div className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Contact Info & Notes */}
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-400 mb-3">Contact Info</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone size={13} className="text-cyan-400" />
                <span className="text-gray-300">{phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail size={13} className="text-cyan-400" />
                <span className="text-gray-300 truncate">{email}</span>
              </div>
              {profile?.portfolio && profile.portfolio.length > 0 && (
                <div className="pt-2 border-t border-white/[0.06] space-y-1">
                  <p className="text-[10px] text-gray-500 font-semibold">Links</p>
                  {profile.portfolio.map((link: string, i: number) => (
                    <a key={i} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-cyan-400 hover:underline">
                      <ExternalLink size={10} /> {link.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Employer Notes */}
          <div className="glass-card rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">Employer Notes</h4>
            <textarea
              className="w-full bg-[#111124] border border-white/10 rounded-lg p-2 text-xs text-white placeholder:text-gray-600 focus:border-cyan-500/40 focus:outline-none resize-none"
              rows={3}
              placeholder="Add review notes, assessment scores, etc..."
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
            />
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-500 transition-colors disabled:opacity-50"
            >
              {savingNotes ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save Notes
            </button>
          </div>
        </div>

        {/* Education & Experience */}
        <div className="glass-card rounded-xl p-4 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
              <Briefcase size={12} className="text-violet-400" /> Experience
            </h4>
            {experienceList.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No experience documented</p>
            ) : (
              <div className="space-y-3">
                {experienceList.map((exp: any, i: number) => (
                  <div key={i} className="text-xs border-l-2 border-violet-500/20 pl-2">
                    <p className="font-semibold text-white">{exp.role}</p>
                    <p className="text-gray-400">{exp.company} ({exp.startDate} - {exp.endDate})</p>
                    {exp.description && <p className="text-gray-500 text-[10px] mt-1">{exp.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/[0.06]">
            <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
              <GraduationCap size={12} className="text-emerald-400" /> Education
            </h4>
            {educationList.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No education documented</p>
            ) : (
              <div className="space-y-3">
                {educationList.map((edu: any, i: number) => (
                  <div key={i} className="text-xs border-l-2 border-emerald-500/20 pl-2">
                    <p className="font-semibold text-white">{edu.degree} {edu.field && `in ${edu.field}`}</p>
                    <p className="text-gray-400">{edu.institution} ({edu.year})</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Profile Strength & Schedule Interview */}
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-400 mb-3">Profile Strength</h4>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                  style={{ width: `${profileStrength}%` }}
                />
              </div>
              <span className="text-xs font-bold text-cyan-400">{profileStrength}%</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {skillsList.map((s: string) => (
                <span key={s} className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[9px] text-gray-400 border border-white/[0.06]">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Schedule Interview section */}
          {currentStatus !== 'rejected' && currentStatus !== 'selected' && (
            <div className="glass-card rounded-xl p-4">
              {!showScheduleForm ? (
                <button
                  onClick={() => setShowScheduleForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition-all"
                >
                  <Calendar size={14} />
                  Schedule Interview
                </button>
              ) : (
                <form onSubmit={handleScheduleInterview} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-2">
                    <span className="text-xs font-semibold text-amber-400">Schedule Interview</span>
                    <button type="button" onClick={() => setShowScheduleForm(false)} className="text-gray-500 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full bg-[#111124] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Time</label>
                    <input
                      type="time"
                      required
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="w-full bg-[#111124] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Mode</label>
                    <select
                      value={interviewMode}
                      onChange={(e) => setInterviewMode(e.target.value)}
                      className="w-full bg-[#111124] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                    >
                      <option value="Phone">Phone Call</option>
                      <option value="Video">Video Call (Google Meet)</option>
                      <option value="In-Person">In-Person Office Interview</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={scheduling}
                    className="w-full py-2 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    {scheduling ? 'Scheduling...' : 'Confirm Date & Time'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function calculateMatch(job: any, seeker: any) {
  if (!job || !seeker) return null;
  
  const jobSkills = (job.skills || []).map((s: string) => s.toLowerCase());
  const seekerSkills = (seeker.skills || []).map((s: string) => s.toLowerCase());
  
  if (jobSkills.length === 0) return null;
  
  const matchingSkills = seekerSkills.filter((s: string) => jobSkills.includes(s));
  const missingSkills = jobSkills.filter((s: string) => !seekerSkills.includes(s));
  
  const skillsScore = Math.round((matchingSkills.length / jobSkills.length) * 100);
  
  // Location match
  const locationMatch = job.district?.toLowerCase() === seeker.district?.toLowerCase();
  const locationScore = locationMatch ? 100 : 40;
  
  // Experience match
  const jobMinExp = job.experienceMin || 0;
  const seekerExpYrs = seeker.experienceYears || (seeker.experience || []).length * 1.5;
  const expScore = seekerExpYrs >= jobMinExp ? 100 : Math.round((seekerExpYrs / (jobMinExp || 1)) * 100);
  
  // Overall weighted score
  const matchScore = Math.round((skillsScore * 0.5) + (expScore * 0.3) + (locationScore * 0.2));
  
  return {
    candidateId: seeker.id,
    candidateName: seeker.name || 'Candidate',
    candidatePhoto: seeker.photoUrl || '',
    candidateHeadline: seeker.currentRole || 'Job Seeker',
    matchScore,
    matchBreakdown: {
      skills: skillsScore,
      experience: expScore,
      location: locationScore,
      engagement: seeker.profileCompletion || 75,
    },
    matchingSkills: matchingSkills.map((s: string) => s.toUpperCase()),
    missingSkills: missingSkills.map((s: string) => s.toUpperCase()),
    experienceYears: seekerExpYrs,
    location: seeker.district || 'Theni',
    profileCompletion: seeker.profileCompletion || 80,
    inviteStatus: 'none' as const,
  };
}

export default function CandidatesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // 1. Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  // 2. Fetch applications matching company
  const { data: applications, loading: appsLoading } = useCollection<any>('applications', [
    where('companyId', '==', companyId || ''),
    orderBy('createdAt', 'desc')
  ], { skip: !companyId });

  // 3. Fetch company's jobs
  const { data: companyJobs } = useCollection<any>('jobs', [
    where('companyId', '==', companyId || ''),
    where('isActive', '==', true)
  ], { skip: !companyId });

  const applicantIds = useMemo(() => (
    Array.from(new Set(applications.map((a: any) => a.seekerId).filter(Boolean)))
  ), [applications]);

  const [seekerProfiles, setSeekerProfiles] = useState<any[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);

  // 4. Fetch only profiles for candidates who applied to this employer's jobs.
  useEffect(() => {
    if (!companyId || applicantIds.length === 0) {
      setSeekerProfiles([]);
      setProfilesLoading(false);
      return;
    }

    let cancelled = false;

    const fetchApplicantProfiles = async () => {
      setProfilesLoading(true);
      try {
        const chunks: string[][] = [];
        for (let i = 0; i < applicantIds.length; i += 30) {
          chunks.push(applicantIds.slice(i, i + 30));
        }

        const snapshots = await Promise.all(
          chunks.map((ids) => getDocs(query(
            collection(db, 'seekerProfiles'),
            where(documentId(), 'in', ids),
          ))),
        );

        if (!cancelled) {
          setSeekerProfiles(snapshots.flatMap((snap) => (
            snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          )));
        }
      } catch (err) {
        console.error('Fetch applicant profiles error:', err);
        if (!cancelled) {
          setSeekerProfiles([]);
          showToast('Could not load candidate profile recommendations.', 'error');
        }
      } finally {
        if (!cancelled) {
          setProfilesLoading(false);
        }
      }
    };

    fetchApplicantProfiles();

    return () => {
      cancelled = true;
    };
  }, [applicantIds, companyId, showToast]);

  const [pipelineTab, setPipelineTab] = useState<PipelineStatus>('all');
  const [search, setSearch] = useState('');
  const [jobFilter, setJobFilter] = useState('All Jobs');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sentInvites, setSentInvites] = useState<Record<string, boolean>>({});

  // Calculate matching candidates
  const matchingCandidates = useMemo(() => {
    if (!seekerProfiles || seekerProfiles.length === 0 || !companyJobs || companyJobs.length === 0) return [];
    
    // Determine target job
    let targetJob = companyJobs[0];
    if (jobFilter !== 'All Jobs') {
      targetJob = companyJobs.find((j: any) => j.title === jobFilter) || companyJobs[0];
    }
    
    return seekerProfiles
      .map((seeker: any) => {
        const match = calculateMatch(targetJob, seeker);
        if (match) {
          return {
            ...match,
            inviteStatus: sentInvites[seeker.id] ? 'sent' : 'none'
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(0, 10);
  }, [seekerProfiles, companyJobs, jobFilter, sentInvites]);

  const handleSendInvite = async (candidateId: string, candidateName: string) => {
    let targetJob = companyJobs[0];
    if (jobFilter !== 'All Jobs') {
      targetJob = companyJobs.find((j: any) => j.title === jobFilter) || companyJobs[0];
    }
    
    if (!targetJob) {
      showToast('You need to post an active job first before inviting candidates.', 'warning');
      return;
    }

    try {
      await createNotification({
        userId: candidateId,
        type: 'job_alert',
        title: 'Job Invitation! 💼',
        message: `${company?.name || 'A company'} has invited you to apply for their job: "${targetJob.title}".`,
        actionUrl: `/jobs/${targetJob.id}`,
      });
      
      setSentInvites(prev => ({ ...prev, [candidateId]: true }));
      showToast(`Invitation sent to ${candidateName}!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to send invitation.', 'error');
    }
  };

  // Helper: get initials
  const getInitials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'C';
  };

  const handleUpdateStatus = async (appId: string, status: string, seekerId: string, jobTitle: string) => {
    setActionLoading(appId);
    try {
      await updateApplicationStatus(appId, status);
      
      // Notify candidate
      let notifyMessage = '';
      if (status === 'shortlisted') {
        notifyMessage = `Congratulations! You have been shortlisted for "${jobTitle}".`;
      } else if (status === 'selected') {
        notifyMessage = `Great news! You have been selected for "${jobTitle}".`;
      } else if (status === 'rejected') {
        notifyMessage = `Thank you for your interest in "${jobTitle}". Unfortunately, the company has decided to move forward with other candidates.`;
      }

      if (notifyMessage) {
        await createNotification({
          userId: seekerId,
          type: 'application_update',
          title: `Application Update: ${status.toUpperCase()}!`,
          message: notifyMessage,
          actionUrl: '/seeker/applications',
        });
      }
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const counts = {
    all: applications.length,
    applied: applications.filter((c) => c.status === 'applied' || !c.status).length,
    shortlisted: applications.filter((c) => c.status === 'shortlisted').length,
    interview_scheduled: applications.filter((c) => c.status === 'interview_scheduled').length,
    selected: applications.filter((c) => c.status === 'selected').length,
    rejected: applications.filter((c) => c.status === 'rejected').length,
    ai_recommended: matchingCandidates.length,
  };

  const jobOptions = ['All Jobs', ...Array.from(new Set(applications.map((a: any) => a.jobTitle).filter(Boolean)))];

  const filtered = applications.filter((c) => {
    const candidateStatus = c.status || 'applied';
    if (pipelineTab !== 'all' && candidateStatus !== pipelineTab) return false;
    if (search && !c.seekerName.toLowerCase().includes(search.toLowerCase())) return false;
    if (jobFilter !== 'All Jobs' && c.jobTitle !== jobFilter) return false;
    return true;
  });

  const loading = companyLoading || appsLoading || profilesLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit">
        <Users2 size={48} className="text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold text-white">No Company Profile</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Please register your company profile first to view and manage candidate applications.</p>
        <Link href="/employer/company-profile" className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold hover:opacity-90">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-outfit">Candidate Management</h1>
        <p className="text-sm text-gray-400 mt-1">Track and manage your recruitment pipeline</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-cyan-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading candidate applications...</p>
        </div>
      ) : (
        <>
          {/* Pipeline Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-white/[0.03] rounded-xl p-1 border border-white/[0.06]">
            {PIPELINE_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setPipelineTab(t.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  pipelineTab === t.value
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {t.label}
                <span className="ml-1.5 text-[10px]">({counts[t.value as keyof typeof counts]})</span>
              </button>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
              />
            </div>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-cyan-500/40 outline-none transition-all"
            >
              {jobOptions.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>

          {/* Candidate Cards */}
          <div className="space-y-3">
            {pipelineTab === 'ai_recommended' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchingCandidates.length === 0 ? (
                  <div className="col-span-2 glass-card rounded-2xl p-12 text-center">
                    <Sparkles size={32} className="text-gray-600 mx-auto mb-3 animate-pulse" />
                    <p className="text-sm text-gray-400">No matching candidates recommended</p>
                    <p className="text-xs text-gray-600 mt-1">Make sure you have active jobs with skills configured and applicants in your pipeline</p>
                  </div>
                ) : (
                  matchingCandidates.map((c: any) => (
                    <CandidateSuggestionCard
                      key={c.candidateId}
                      candidate={c}
                      onSendInvite={() => handleSendInvite(c.candidateId, c.candidateName)}
                      onViewProfile={() => {
                        const seeker = seekerProfiles.find((sp: any) => sp.id === c.candidateId);
                        if (seeker) {
                          showToast(`Skills: ${seeker.skills?.join(', ') || 'None'} | District: ${seeker.district || 'Unknown'}`, 'info', 6000);
                        }
                      }}
                    />
                  ))
                )}
              </div>
            ) : (
              filtered.map((candidate) => {
                const status = statusConfig[candidate.status || 'applied'] || statusConfig.applied;
                const isExpanded = expandedId === candidate.id;
                return (
                  <div
                    key={candidate.id}
                    className="glass-card rounded-2xl overflow-hidden hover:border-white/15 transition-all"
                  >
                    {/* Main Row */}
                    <div className="p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Avatar + Info */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-white">{getInitials(candidate.seekerName)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-white">{candidate.seekerName || 'Candidate'}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${status.bg} ${status.text}`}>
                                {status.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Briefcase size={11} /> {candidate.jobTitle}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={11} /> Applied {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : 'Recently'}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {actionLoading === candidate.id ? (
                            <Loader2 size={16} className="text-cyan-400 animate-spin" />
                          ) : (
                            <>
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : candidate.id)}
                                className="p-2 rounded-lg bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white transition-all"
                                title="View Details"
                              >
                                <Eye size={14} />
                              </button>
                              {candidate.resumeUrl && candidate.resumeUrl !== '#' && (
                                <a
                                  href={candidate.resumeUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all flex items-center justify-center"
                                  title="Download Resume"
                                >
                                  <Download size={14} />
                                </a>
                              )}
                              {candidate.status !== 'shortlisted' && candidate.status !== 'selected' && (
                                <button
                                  onClick={() => handleUpdateStatus(candidate.id, 'shortlisted', candidate.seekerId, candidate.jobTitle)}
                                  className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                  title="Shortlist"
                                >
                                  <CheckCircle size={14} />
                                </button>
                              )}
                              {candidate.status !== 'selected' && (
                                <button
                                  onClick={() => handleUpdateStatus(candidate.id, 'selected', candidate.seekerId, candidate.jobTitle)}
                                  className="p-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all"
                                  title="Select / Hire"
                                >
                                  <Star size={14} />
                                </button>
                              )}
                              {candidate.status !== 'rejected' && (
                                <button
                                  onClick={() => handleUpdateStatus(candidate.id, 'rejected', candidate.seekerId, candidate.jobTitle)}
                                  className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all"
                                  title="Reject"
                                >
                                  <XCircle size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <CandidateDetailPanel
                        seekerId={candidate.seekerId}
                        applicationId={candidate.id}
                        currentStatus={candidate.status || 'applied'}
                        initialNotes={candidate.employerNote}
                        companyId={companyId}
                        companyName={company?.name || 'Company'}
                        jobId={candidate.jobId}
                        jobTitle={candidate.jobTitle}
                        seekerName={candidate.seekerName}
                        statusTimestamps={candidate.statusTimestamps}
                        onNotesUpdated={(newNotes) => {
                          candidate.employerNote = newNotes;
                        }}
                        onUpdateStatus={async (newStatus) => {
                          await handleUpdateStatus(candidate.id, newStatus, candidate.seekerId, candidate.jobTitle);
                        }}
                        onStatusUpdated={(newStatus) => {
                          candidate.status = newStatus;
                          setExpandedId(null);
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}

            {pipelineTab !== 'ai_recommended' && filtered.length === 0 && (
              <div className="glass-card rounded-2xl p-12 text-center">
                <Users2 size={32} className="text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No candidates found</p>
                <p className="text-xs text-gray-600 mt-1">Adjust filters or wait for new applications</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
