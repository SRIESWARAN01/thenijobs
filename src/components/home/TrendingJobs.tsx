'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Briefcase,
  Clock,
  MapPin,
  Sprout,
  Star,
  Zap,
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { where, limit } from 'firebase/firestore';

interface TrendingJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  posted: string;
  category: string;
  isUrgent: boolean;
  isPremium: boolean;
  skills: string[];
}

const MOCK_JOBS: TrendingJob[] = [
  {
    id: '1',
    title: 'Tractor Driver',
    company: 'Arasu Pandi Farm Services',
    location: 'Theni',
    salary: 'Rs.15,000 - Rs.20,000',
    type: 'Full Time',
    posted: '2 hours ago',
    category: 'Agriculture',
    isUrgent: true,
    isPremium: false,
    skills: ['Driving License', 'Agriculture'],
  },
  {
    id: '2',
    title: 'Farm Supervisor',
    company: 'GreenField Agro',
    location: 'Dindigul',
    salary: 'Rs.20,000 - Rs.28,000',
    type: 'Full Time',
    posted: '5 hours ago',
    category: 'Agriculture',
    isUrgent: false,
    isPremium: true,
    skills: ['Farm Management', 'Team Lead'],
  },
  {
    id: '3',
    title: 'School Teacher - Math',
    company: 'SBOA Matriculation',
    location: 'Theni',
    salary: 'Rs.18,000 - Rs.25,000',
    type: 'Full Time',
    posted: '1 day ago',
    category: 'Education',
    isUrgent: false,
    isPremium: false,
    skills: ['Mathematics', 'B.Ed'],
  },
  {
    id: '4',
    title: 'Accounts Executive',
    company: 'Theni Textiles Ltd',
    location: 'Theni',
    salary: 'Rs.16,000 - Rs.22,000',
    type: 'Full Time',
    posted: '2 days ago',
    category: 'Finance',
    isUrgent: true,
    isPremium: false,
    skills: ['Tally', 'GST', 'Excel'],
  },
  {
    id: '6',
    title: 'Web Developer',
    company: 'Digital Theni Solutions',
    location: 'Remote',
    salary: 'Rs.25,000 - Rs.45,000',
    type: 'Remote',
    posted: '4 hours ago',
    category: 'IT & Software',
    isUrgent: false,
    isPremium: true,
    skills: ['React', 'Next.js', 'Node.js'],
  },
  {
    id: '8',
    title: 'Field Sales Officer',
    company: 'Theni Agro Products',
    location: 'Theni',
    salary: 'Rs.14,000 - Rs.20,000 + Incentives',
    type: 'Full Time',
    posted: '12 hours ago',
    category: 'Sales',
    isUrgent: false,
    isPremium: false,
    skills: ['Sales', 'Two Wheeler'],
  },
];

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

const getCategoryIcon = (category?: string) => {
  switch (category?.toLowerCase()) {
    case 'agriculture':
      return Sprout;
    case 'finance':
    case 'accounts':
      return Banknote;
    case 'education':
      return BadgeCheck;
    case 'it & software':
      return Briefcase;
    default:
      return Briefcase;
  }
};

export default function TrendingJobs() {
  const { data: dbJobs, loading } = useCollection<any>('jobs', [
    where('status', 'in', ['active', 'approved']),
    limit(6)
  ]);

  const jobsList: TrendingJob[] = dbJobs && dbJobs.length > 0
    ? dbJobs.map((d: any) => {
        const salaryStr = d.salaryMin && d.salaryMax 
          ? `₹${Number(d.salaryMin).toLocaleString('en-IN')} - ₹${Number(d.salaryMax).toLocaleString('en-IN')}`
          : 'Salary Negotiable';
          
        const typeStr = d.jobType 
          ? d.jobType.replace('_', ' ').split(' ').map((w: string) => w[0].toUpperCase() + w.substring(1)).join(' ')
          : 'Full Time';

        return {
          id: d.id,
          title: d.title || '',
          company: d.companyName || 'Verified Employer',
          location: d.location || d.district || 'Theni',
          salary: salaryStr,
          type: typeStr,
          posted: formatTime(d.createdAt),
          isUrgent: d.isUrgent || false,
          isPremium: d.isPremium || false,
          category: d.category || '',
          skills: d.skills || [],
        };
      })
    : MOCK_JOBS;

  return (
    <section className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-teal-700">Latest Jobs</p>
            <h2 className="mt-1 font-outfit text-2xl font-black text-slate-950 sm:text-3xl">
              இன்று வந்த வேலை வாய்ப்புகள்
            </h2>
            <p className="mt-1 text-sm text-slate-500">Verified local employers-லிருந்து fresh openings.</p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50"
          >
            View all jobs <ArrowRight size={15} />
          </Link>
        </div>

        {loading && dbJobs.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobsList.map((job) => {
              const Icon = getCategoryIcon(job.category);
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50/30"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                        <Icon size={22} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="line-clamp-1 text-base font-black text-slate-950 group-hover:text-teal-800">
                          {job.title}
                        </h3>
                        <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-500">{job.company}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {job.isUrgent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-700 ring-1 ring-amber-100">
                          <Zap size={10} className="fill-current" /> Urgent
                        </span>
                      )}
                      {job.isPremium && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700 ring-1 ring-blue-100">
                          <Star size={10} className="fill-current" /> Premium
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="grid gap-2 border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-2">
                      <MapPin size={14} className="text-teal-700" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-2">
                      <Banknote size={14} className="text-emerald-700" />
                      {job.salary}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock size={14} />
                      {job.posted} - {job.type}
                    </span>
                  </div>

                  <div className="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white transition-colors group-hover:bg-teal-800">
                    Apply Now
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
