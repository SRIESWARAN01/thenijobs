'use client';

import Link from 'next/link';
import { ArrowRight, Briefcase, Building2, Crown, TrendingUp, Users } from 'lucide-react';
import { where } from 'firebase/firestore';
import { useRequireAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';

export default function BusinessDashboardPage() {
  const { user, loading: authLoading } = useRequireAuth(['business_owner', 'supplier', 'entrepreneur']);
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || ''),
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  const { data: jobs } = useCollection<any>('jobs', [
    where('companyId', '==', companyId || ''),
    where('isActive', '==', true),
  ], { skip: !companyId });
  const { data: leads } = useCollection<any>('leads', [
    where('companyId', '==', companyId || ''),
  ], { skip: !companyId });

  if (authLoading || companyLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/30 border-t-emerald-400" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a1a] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-cyan-500/5 p-6">
          <p className="text-xs font-black uppercase tracking-wider text-emerald-300">Business Dashboard</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-outfit text-3xl font-black">{company?.name || 'Business Portfolio'}</h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-400">
                Manage your company portfolio, leads, services, active jobs and subscription visibility.
              </p>
            </div>
            <Link href="/employer/company-profile" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-white">
              <Building2 size={16} /> Company Profile
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Company Profiles', value: companies.length, icon: Building2, tone: 'text-emerald-300' },
            { label: 'Active Jobs', value: jobs.length, icon: Briefcase, tone: 'text-cyan-300' },
            { label: 'Leads', value: leads.length, icon: TrendingUp, tone: 'text-amber-300' },
            { label: 'Plan', value: company?.isPremium ? 'Premium' : 'Free', icon: Crown, tone: 'text-violet-300' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <Icon size={19} className={item.tone} />
                <div className="mt-4 text-2xl font-black">{item.value}</div>
                <div className="text-sm text-gray-500">{item.label}</div>
              </div>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {[
            { label: 'Build Portfolio', detail: 'Upload logo, cover, gallery, services and social links.', href: '/employer/company-profile', icon: Building2 },
            { label: 'Post Jobs', detail: 'Publish hiring requirements from your business profile.', href: '/employer/post-job', icon: Briefcase },
            { label: 'Manage Leads', detail: 'Track customer enquiries and business requests.', href: '/employer/leads', icon: Users },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-emerald-500/30 hover:bg-white/[0.05]">
                <Icon size={20} className="text-emerald-300" />
                <h2 className="mt-4 text-lg font-bold">{action.label}</h2>
                <p className="mt-2 text-sm text-gray-500">{action.detail}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-300">
                  Open <ArrowRight size={14} />
                </span>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
