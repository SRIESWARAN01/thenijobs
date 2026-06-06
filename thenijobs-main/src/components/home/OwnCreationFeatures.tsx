'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Filter,
  Gauge,
  Gift,
  Languages,
  ListChecks,
  Megaphone,
  MessageSquareText,
  PhoneCall,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  UserRoundCheck,
  Users,
} from 'lucide-react';

type Language = 'en' | 'ta';

type Journey = {
  role: string;
  roleTa: string;
  title: string;
  titleTa: string;
  proof: string;
  proofTa: string;
  icon: LucideIcon;
  theme: {
    badge: string;
    border: string;
    dot: string;
    icon: string;
  };
  steps: Array<{
    label: string;
    labelTa: string;
    icon: LucideIcon;
  }>;
};

const copy = {
  en: {
    eyebrow: 'Full own creation update',
    title: 'THENIJOBS as a complete mobile-first local career app',
    intro:
      'This section now presents the original product idea clearly: jobs, businesses, leads, interviews, rewards and admin approvals in one practical Theni-focused mobile workflow.',
    languageLabel: 'Language',
    mobileTitle: 'Mobile app flow',
    mobileText: 'Search, filter, apply, call, WhatsApp and track rewards without leaving the main journey.',
    proofTitle: 'Made for Theni proof',
    proofText: 'Live stats, area filters, verified business trust and recent activity can prove the platform is built for local use.',
    primaryCta: 'Create account',
    secondaryCta: 'Post a job',
  },
  ta: {
    eyebrow: 'முழு own creation update',
    title: 'THENIJOBS ஒரு mobile-first local career app',
    intro:
      'Jobs, business pages, leads, interviews, rewards, admin approvals எல்லாமே Theni users காக ஒரே mobile workflow-ல் காட்டப்படுகிறது.',
    languageLabel: 'மொழி',
    mobileTitle: 'Mobile app flow',
    mobileText: 'Search, filter, apply, call, WhatsApp, rewards track எல்லாம் easy mobile journey.',
    proofTitle: 'Theni காக உருவாக்கியது',
    proofText: 'Live stats, area filters, verified business badge, recent activity மூலம் local trust அதிகமாகும்.',
    primaryCta: 'Account உருவாக்க',
    secondaryCta: 'Job post செய்ய',
  },
} satisfies Record<Language, Record<string, string>>;

const journeys: Journey[] = [
  {
    role: 'Job seeker',
    roleTa: 'வேலை தேடுபவர்',
    title: 'Search job to rewards',
    titleTa: 'Job search முதல் rewards வரை',
    proof: '92% match + 120 reward points',
    proofTa: '92% match + 120 reward points',
    icon: UserRoundCheck,
    theme: {
      badge: 'bg-teal-50 text-teal-800 ring-teal-100',
      border: 'border-teal-200 bg-teal-50/60',
      dot: 'bg-teal-700',
      icon: 'bg-teal-700 text-white',
    },
    steps: [
      { label: 'Search job', labelTa: 'Job தேடு', icon: Search },
      { label: 'Match score', labelTa: 'Match score', icon: Gauge },
      { label: 'Apply', labelTa: 'Apply', icon: Send },
      { label: 'Interview', labelTa: 'Interview', icon: CalendarCheck },
      { label: 'Rewards', labelTa: 'Rewards', icon: Gift },
    ],
  },
  {
    role: 'Employer',
    roleTa: 'Employer',
    title: 'Post job to hire',
    titleTa: 'Job post முதல் hire வரை',
    proof: 'Shortlist, message and hire faster',
    proofTa: 'Shortlist, message, hire வேகமாக',
    icon: BriefcaseBusiness,
    theme: {
      badge: 'bg-blue-50 text-blue-800 ring-blue-100',
      border: 'border-blue-200 bg-blue-50/60',
      dot: 'bg-blue-700',
      icon: 'bg-blue-700 text-white',
    },
    steps: [
      { label: 'Post job', labelTa: 'Job post', icon: ClipboardCheck },
      { label: 'Candidates', labelTa: 'Candidates', icon: Users },
      { label: 'Shortlist', labelTa: 'Shortlist', icon: CheckCircle2 },
      { label: 'Message', labelTa: 'Message', icon: MessageSquareText },
      { label: 'Hire', labelTa: 'Hire', icon: BadgeCheck },
    ],
  },
  {
    role: 'Business owner',
    roleTa: 'Business owner',
    title: 'Public page to leads',
    titleTa: 'Public page முதல் leads வரை',
    proof: 'Calls, WhatsApp leads and offers',
    proofTa: 'Calls, WhatsApp leads, offers',
    icon: Building2,
    theme: {
      badge: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
      border: 'border-emerald-200 bg-emerald-50/60',
      dot: 'bg-emerald-700',
      icon: 'bg-emerald-700 text-white',
    },
    steps: [
      { label: 'Create page', labelTa: 'Page create', icon: Building2 },
      { label: 'Get calls', labelTa: 'Calls', icon: PhoneCall },
      { label: 'WhatsApp leads', labelTa: 'WhatsApp leads', icon: MessageSquareText },
      { label: 'Manage offers', labelTa: 'Offers manage', icon: Megaphone },
    ],
  },
  {
    role: 'Admin',
    roleTa: 'Admin',
    title: 'Approvals to subscriptions',
    titleTa: 'Approvals முதல் subscriptions வரை',
    proof: 'Jobs, businesses, reviews and ads timeline',
    proofTa: 'Jobs, businesses, reviews, ads timeline',
    icon: BarChart3,
    theme: {
      badge: 'bg-amber-50 text-amber-800 ring-amber-100',
      border: 'border-amber-200 bg-amber-50/60',
      dot: 'bg-amber-700',
      icon: 'bg-amber-600 text-white',
    },
    steps: [
      { label: 'Approve', labelTa: 'Approve', icon: ShieldCheck },
      { label: 'Track leads', labelTa: 'Leads track', icon: ListChecks },
      { label: 'Reports', labelTa: 'Reports', icon: BarChart3 },
      { label: 'Subscriptions', labelTa: 'Subscriptions', icon: CreditCard },
    ],
  },
];

const featureCards = [
  {
    title: 'Tamil + English toggle',
    titleTa: 'Tamil + English toggle',
    text: 'Let local users switch copy, actions and labels into the language they are comfortable using.',
    textTa: 'Users English/Tamil language easy-ஆ switch பண்ணி use செய்யலாம்.',
    icon: Languages,
    color: 'bg-teal-50 text-teal-800 ring-teal-100',
  },
  {
    title: 'Smart job match score',
    titleTa: 'Smart job match score',
    text: 'Show a match percentage using skills, area, salary expectation and experience fit.',
    textTa: 'Skills, area, salary, experience வைத்து match percentage காட்டலாம்.',
    icon: Gauge,
    color: 'bg-blue-50 text-blue-800 ring-blue-100',
  },
  {
    title: 'Verified business badge',
    titleTa: 'Verified business badge',
    text: 'Build trust with verified local companies, documents, contact checks and visible badges.',
    textTa: 'Verified companies badge மூலம் local trust அதிகமாகும்.',
    icon: ShieldCheck,
    color: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
  },
  {
    title: 'WhatsApp lead tracking',
    titleTa: 'WhatsApp lead tracking',
    text: 'Track who called, messaged, clicked WhatsApp or asked for a service from a business page.',
    textTa: 'Call, WhatsApp, inquiry எல்லா leads-யும் track செய்யலாம்.',
    icon: MessageSquareText,
    color: 'bg-amber-50 text-amber-800 ring-amber-100',
  },
  {
    title: 'Resume builder templates',
    titleTa: 'Resume builder templates',
    text: 'Give local job-ready resume formats for freshers, experienced workers and service roles.',
    textTa: 'Freshers, experienced, service jobs காக resume templates.',
    icon: ClipboardCheck,
    color: 'bg-rose-50 text-rose-800 ring-rose-100',
  },
  {
    title: 'Hiring urgency badges',
    titleTa: 'Hiring urgency badges',
    text: 'Feature employers with labels like urgent hiring, walk-in, verified salary and immediate joining.',
    textTa: 'Urgent hiring, walk-in, salary verified badges employer list-ல்.',
    icon: Star,
    color: 'bg-violet-50 text-violet-800 ring-violet-100',
  },
];

const ownershipPoints = [
  { en: 'Village/area filters: Theni, Periyakulam, Cumbum, Bodinayakanur', ta: 'Area filters: Theni, Periyakulam, Cumbum, Bodinayakanur' },
  { en: 'Admin approval timeline for jobs, businesses, reviews and ads', ta: 'Jobs, businesses, reviews, ads காக admin approval timeline' },
  { en: 'Reward points for profile completion, applications, referrals and interviews', ta: 'Profile, apply, referral, interview காக reward points' },
  { en: 'Live activity proof from Firebase-backed platform data', ta: 'Firebase live data மூலம் platform activity proof' },
];

const areaFilters = ['Theni', 'Periyakulam', 'Cumbum', 'Bodinayakanur', 'Andipatti', 'Uthamapalayam'];

const proofStats = [
  { value: '92%', label: 'Match score', labelTa: 'Match score' },
  { value: '48', label: 'WhatsApp leads', labelTa: 'WhatsApp leads' },
  { value: '120', label: 'Reward points', labelTa: 'Reward points' },
];

export default function OwnCreationFeatures() {
  const [language, setLanguage] = useState<Language>('en');
  const t = copy[language];

  return (
    <section className="overflow-x-hidden bg-white px-4 py-12 text-slate-950 sm:px-6 lg:py-16">
      <div className="mx-auto w-full min-w-0 max-w-7xl">
        <div className="grid min-w-0 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="min-w-0 lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-black uppercase text-teal-800">
              <Sparkles size={15} />
              {t.eyebrow}
            </div>

            <h2 className="mt-4 break-words font-outfit text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              {t.title}
            </h2>

            <p className="mt-4 max-w-xl break-words text-sm leading-7 text-slate-600 sm:text-base">
              {t.intro}
            </p>

            <div className="mt-5 inline-flex w-full max-w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1 sm:w-auto">
              <span className="px-3 text-xs font-black uppercase text-slate-500">{t.languageLabel}</span>
              <div className="grid flex-1 grid-cols-2 gap-1 sm:w-48 sm:flex-none">
                {(['en', 'ta'] as Language[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={language === option}
                    onClick={() => setLanguage(option)}
                    className={`min-h-10 rounded-md px-3 text-sm font-black transition-colors ${
                      language === option ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    {option === 'en' ? 'English' : 'தமிழ்'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal-400 text-slate-950">
                  <Smartphone size={21} />
                </span>
                <div>
                  <h3 className="text-sm font-black">{t.mobileTitle}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    {t.mobileText}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              {ownershipPoints.map((point) => (
                <div key={point.en} className="flex items-start gap-2 text-sm font-bold leading-6 text-slate-700">
                  <BadgeCheck size={17} className="shrink-0 text-teal-700" />
                  <span className="min-w-0 break-words">{language === 'en' ? point.en : point.ta}</span>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 text-sm font-black text-white transition-colors hover:bg-teal-800"
              >
                {t.primaryCta}
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/employer/post-job"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-800 transition-colors hover:bg-slate-50"
              >
                {t.secondaryCta}
              </Link>
            </div>
          </div>

          <div className="grid w-full min-w-0 max-w-full gap-4 overflow-hidden">
            <div className="w-full min-w-0 max-w-full rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm">
              <div className="w-full min-w-0 max-w-full rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-teal-700">THENIJOBS App</p>
                    <h3 className="truncate text-base font-black text-slate-950">{t.mobileTitle}</h3>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                    Live
                  </span>
                </div>

                <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-[1fr_220px]">
                  <div className="grid min-w-0 gap-2">
                    <div className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3">
                      <Search size={17} className="shrink-0 text-slate-400" />
                      <span className="truncate text-sm font-bold text-slate-500">
                        {language === 'en' ? 'Search job, company or service' : 'Job, company, service தேடு'}
                      </span>
                    </div>
                    <div className="no-scrollbar flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1">
                      {areaFilters.map((area, index) => (
                        <span
                          key={area}
                          className={`shrink-0 rounded-full px-3 py-2 text-xs font-black ring-1 ${
                            index === 0
                              ? 'bg-slate-950 text-white ring-slate-950'
                              : 'bg-white text-slate-700 ring-slate-200'
                          }`}
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                    <div className="grid min-w-0 gap-2 sm:grid-cols-3">
                      {proofStats.map((stat) => (
                        <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="text-xl font-black text-slate-950">{stat.value}</div>
                          <div className="mt-1 text-xs font-bold text-slate-500">
                            {language === 'en' ? stat.label : stat.labelTa}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-teal-100 bg-teal-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase text-teal-800">
                          {language === 'en' ? 'Featured employer' : 'Featured employer'}
                        </p>
                        <h4 className="mt-1 text-sm font-black text-slate-950">Theni Textile Hub</h4>
                      </div>
                      <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-rose-700 ring-1 ring-rose-100">
                        Urgent
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-2">
                          <Gauge size={14} className="text-teal-700" />
                          Match score
                        </span>
                        <span>92%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full w-[92%] rounded-full bg-teal-700" />
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-teal-700 ring-1 ring-teal-100">
                          Verified salary
                        </span>
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-blue-700 ring-1 ring-blue-100">
                          Walk-in
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {journeys.map((journey) => {
                const Icon = journey.icon;
                return (
                  <article key={journey.role} className={`min-w-0 rounded-lg border p-4 ${journey.theme.border}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${journey.theme.icon}`}>
                          <Icon size={21} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase text-slate-500">
                            {language === 'en' ? journey.role : journey.roleTa}
                          </p>
                          <h3 className="truncate text-base font-black text-slate-950">
                            {language === 'en' ? journey.title : journey.titleTa}
                          </h3>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ring-1 ${journey.theme.badge}`}>
                        Mobile
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2">
                      {journey.steps.map((step, index) => {
                        const StepIcon = step.icon;
                        return (
                          <div key={step.label} className="flex items-center gap-3 rounded-lg bg-white/80 p-2 ring-1 ring-white">
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white ${journey.theme.dot}`}>
                              <StepIcon size={15} />
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-black text-slate-800">
                              {language === 'en' ? step.label : step.labelTa}
                            </span>
                            <span className="text-xs font-black text-slate-400">{String(index + 1).padStart(2, '0')}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-100">
                      <CheckCircle2 size={15} className="shrink-0 text-emerald-700" />
                      <span className="min-w-0 truncate">{language === 'en' ? journey.proof : journey.proofTa}</span>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featureCards.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-teal-200 hover:bg-slate-50"
                  >
                    <span className={`flex h-11 w-11 items-center justify-center rounded-lg ring-1 ${feature.color}`}>
                      <Icon size={21} />
                    </span>
                    <h3 className="mt-3 break-words text-sm font-black text-slate-950">
                      {language === 'en' ? feature.title : feature.titleTa}
                    </h3>
                    <p className="mt-2 break-words text-sm leading-6 text-slate-600">
                      {language === 'en' ? feature.text : feature.textTa}
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-950 p-4 text-white">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-black">{t.proofTitle}</h3>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">{t.proofText}</p>
                </div>
                <Link
                  href="/businesses"
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-black text-slate-950 transition-colors hover:bg-teal-50"
                >
                  <Filter size={16} />
                  {language === 'en' ? 'Explore local proof' : 'Local proof பார்க்க'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
