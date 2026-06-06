'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase, Calendar, Eye, Clock, CheckCircle,
  XCircle, ChevronRight, Star,
  Plus, Send, FileText, Loader2, UserCheck, Building2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { useEmployerStats } from '@/hooks/useRealtimeStats';
import { updateApplicationStatus } from '@/lib/firebase/firestoreService';
import { where, limit, orderBy } from 'firebase/firestore';
import AnalyticsFunnel from '@/components/ui/AnalyticsFunnel';

export default function EmployerDashboard() {
  const { user } = useAuth();

  const getApplicationCount = (job: any) => job.applicationCount ?? job.applicationsCount ?? 0;

  // 1. Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  // 2. Fetch live stats
  const { stats, loading: statsLoading } = useEmployerStats(companyId);

  // 3. Fetch recent applications
  const { data: applications, loading: appsLoading } = useCollection<any>('applications', [
    where('companyId', '==', companyId || ''),
    orderBy('createdAt', 'desc'),
    limit(5)
  ], { skip: !companyId });

  // 4. Fetch active jobs
  const { data: activeJobs, loading: jobsLoading } = useCollection<any>('jobs', [
    where('companyId', '==', companyId || ''),
    where('isActive', '==', true),
    limit(5)
  ], { skip: !companyId });

  // 5. Fetch upcoming interviews
  const { data: interviews, loading: interviewsLoading } = useCollection<any>('interviews', [
    where('companyId', '==', companyId || ''),
    limit(5)
  ], { skip: !companyId });

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAppStatus = async (appId: string, status: string) => {
    setActionLoading(appId);
    try {
      await updateApplicationStatus(appId, status);
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getInitials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'C';
  };

  const statusColors: Record<string, string> = {
    applied: 'bg-cyan-500/10 text-cyan-400',
    shortlisted: 'bg-violet-500/10 text-violet-400',
    interview_scheduled: 'bg-amber-500/10 text-amber-400',
    selected: 'bg-emerald-500/10 text-emerald-400',
    rejected: 'bg-rose-500/10 text-rose-400',
    active: 'bg-emerald-500/10 text-emerald-400',
    paused: 'bg-amber-500/10 text-amber-400',
  };

  const colorMap: Record<string, { bg: string; text: string }> = {
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400' },
  };

  const statItems = [
    { label: 'Active Jobs', value: stats.activeJobs, icon: Briefcase, color: 'cyan' },
    { label: 'Applications', value: stats.totalApplications, icon: FileText, color: 'violet' },
    { label: 'Shortlisted', value: stats.shortlisted, icon: UserCheck, color: 'emerald' },
    { label: 'Interviews', value: stats.interviews, icon: Calendar, color: 'amber' },
    { label: 'Hired', value: stats.hired, icon: Star, color: 'purple' },
    { label: 'Profile Views', value: company?.viewCount || 0, icon: Eye, color: 'rose' },
  ];

  const loading = companyLoading || statsLoading || appsLoading || jobsLoading || interviewsLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit">
        <Building2 size={48} className="text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold text-white">No Company Registered</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Please register your company profile first to access the dashboard and post jobs.</p>
        <Link href="/employer/company-profile" className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold hover:opacity-90">
          Create Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Employer Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">{company?.name || 'Recruitment Hub'} — manage your pipeline</p>
        </div>
        <Link
          href="/employer/post-job"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Post New Job
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-cyan-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {statItems.map((stat) => {
              const colors = colorMap[stat.color];
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="glass-card rounded-2xl p-4 hover:border-white/15 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                      <Icon size={18} className={colors.text} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-white">{stat.value.toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Recent Applications */}
            <div className="xl:col-span-2">
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Send size={16} className="text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">Recent Applications</h2>
                      <p className="text-[10px] text-gray-500">Latest candidate submissions</p>
                    </div>
                  </div>
                  <Link href="/employer/candidates" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
                    View All →
                  </Link>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {applications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-500">No applications received yet.</div>
                  ) : (
                    applications.map((app) => (
                      <div key={app.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{getInitials(app.seekerName)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">{app.seekerName || 'Candidate'}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusColors[app.status || 'applied']}`}>
                              {app.status || 'applied'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Applied to job · {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Recent'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {actionLoading === app.id ? (
                            <Loader2 size={14} className="text-cyan-400 animate-spin" />
                          ) : (
                            <>
                              {app.status === 'applied' && (
                                <>
                                  <button
                                    onClick={() => handleAppStatus(app.id, 'shortlisted')}
                                    className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                    title="Shortlist"
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleAppStatus(app.id, 'rejected')}
                                    className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                                    title="Reject"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                </>
                              )}
                              <Link href={`/jobs/${app.jobId}`} className="p-2 rounded-lg bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] transition-colors" title="View Job">
                                <Eye size={14} />
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming Interviews */}
            <div className="xl:col-span-1">
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Calendar size={16} className="text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">Upcoming Interviews</h2>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {interviews.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-500">No scheduled interviews.</div>
                  ) : (
                    interviews.map((interview) => (
                      <div key={interview.id} className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-white">{interview.seekerName || 'Candidate'}</p>
                          <span className="text-[10px] text-amber-400 font-medium capitalize">{interview.mode || 'Phone'}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                          <Clock size={12} />
                          <span>{interview.date} at {interview.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-5 py-3 border-t border-white/[0.06]">
                  <Link href="/employer/interviews" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1">
                    View all interviews <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Active Jobs */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Briefcase size={16} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Active Jobs</h2>
                  <p className="text-[10px] text-gray-500">Your current job postings</p>
                </div>
              </div>
              <Link href="/employer/jobs" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
                Manage Jobs →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Job Title</th>
                    <th className="text-left px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold hidden sm:table-cell">Type</th>
                    <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Applications</th>
                    <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold hidden md:table-cell">Views</th>
                    <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {activeJobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-xs text-gray-500">No active job listings.</td>
                    </tr>
                  ) : (
                    activeJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{job.title}</p>
                            {job.isUrgent && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-500/10 text-rose-400 uppercase">Urgent</span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}</p>
                        </td>
                        <td className="px-3 py-3.5 hidden sm:table-cell">
                          <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 uppercase">{job.jobType || 'Full Time'}</span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="text-sm font-bold text-white">{getApplicationCount(job)}</span>
                        </td>
                        <td className="px-3 py-3.5 text-center hidden md:table-cell">
                          <span className="text-sm text-gray-400">{job.viewCount || 0}</span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recruitment Funnel */}
          <AnalyticsFunnel
            title="Recruitment Pipeline Funnel"
            stages={[
              { label: 'Applied', count: stats.totalApplications, color: '#06b6d4' },
              { label: 'Shortlisted', count: stats.shortlisted, color: '#7c3aed' },
              { label: 'Interviewed', count: stats.interviews, color: '#f59e0b' },
              { label: 'Selected / Hired', count: stats.hired, color: '#10b981' },
            ]}
          />
        </>
      )}
    </div>
  );
}
