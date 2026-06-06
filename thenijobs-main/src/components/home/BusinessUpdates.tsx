'use client';

import Link from 'next/link';
import { ArrowRight, Briefcase, Building2, Clock, PackagePlus, TrendingUp } from 'lucide-react';
import { limit, where } from 'firebase/firestore';
import { useCollection } from '@/hooks/useFirestore';

function formatTime(timestamp: any) {
  if (!timestamp) return 'Recently';
  const date = timestamp.toMillis ? timestamp.toMillis() : new Date(timestamp).getTime();
  const seconds = Math.floor((Date.now() - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

export default function BusinessUpdates() {
  const { data: jobs } = useCollection<any>('jobs', [where('status', 'in', ['active', 'approved']), limit(3)]);
  const { data: companies } = useCollection<any>('companies', [where('verificationStatus', '==', 'verified'), limit(3)]);
  const { data: services } = useCollection<any>('services', [where('status', '==', 'active'), limit(3)]);

  const updates = [
    ...jobs.map((job) => ({
      id: `job-${job.id}`,
      type: 'Job',
      title: job.title || 'Untitled job',
      company: job.companyName || job.district || 'Employer',
      time: formatTime(job.createdAt),
      href: `/jobs/${job.id}`,
      icon: Briefcase,
      tone: 'bg-amber-50 text-amber-700',
      createdAt: job.createdAt,
    })),
    ...companies.map((company) => ({
      id: `company-${company.id}`,
      type: 'Business',
      title: company.name || 'Registered business',
      company: company.category || company.district || 'Company',
      time: formatTime(company.createdAt),
      href: `/company/${company.slug || company.id}`,
      icon: Building2,
      tone: 'bg-blue-50 text-blue-700',
      createdAt: company.createdAt,
    })),
    ...services.map((service) => ({
      id: `service-${service.id}`,
      type: 'Service',
      title: service.name || 'Listed service',
      company: service.providerName || service.category || 'Service provider',
      time: formatTime(service.createdAt),
      href: '/services',
      icon: PackagePlus,
      tone: 'bg-emerald-50 text-emerald-700',
      createdAt: service.createdAt,
    })),
  ]
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 4);

  return (
    <section className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <TrendingUp size={18} />
                </span>
                <p className="text-xs font-black uppercase text-teal-700">Business Feed</p>
              </div>
              <h2 className="font-outfit text-2xl font-black text-slate-950 sm:text-3xl">
                Latest company updates
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                New jobs, products, services and business announcements in one feed.
              </p>
            </div>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-800 hover:bg-slate-50"
            >
              View feed <ArrowRight size={15} />
            </Link>
          </div>

          {updates.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {updates.map((update) => {
                const Icon = update.icon;
                return (
                  <Link
                    key={update.id}
                    href={update.href}
                    className="group flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:border-teal-200 hover:bg-teal-50/50"
                  >
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${update.tone}`}>
                      <Icon size={21} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="mb-1 inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-500 ring-1 ring-slate-200">
                        {update.type}
                      </span>
                      <span className="block line-clamp-1 text-sm font-black text-slate-950 group-hover:text-teal-800">
                        {update.title}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-500">
                        <span>{update.company}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {update.time}
                        </span>
                      </span>
                    </span>
                    <ArrowRight size={16} className="mt-1 shrink-0 text-slate-300 group-hover:text-teal-700" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <h3 className="font-outfit text-lg font-black text-slate-950">No updates yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-slate-500">
                Approved jobs, verified businesses, and active services will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
