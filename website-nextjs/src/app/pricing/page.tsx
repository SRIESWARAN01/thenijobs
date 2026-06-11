import Link from 'next/link';
import { ArrowRight, Check, Crown, Shield, Zap } from 'lucide-react';
import Header from '@/components/navigation/Header';
import { YEARLY_SUBSCRIPTION_PLANS, formatPlanPeriod } from '@/lib/subscriptions';

const iconMap = {
  free: Shield,
  basic: Zap,
  premium: Crown,
};

const toneMap = {
  free: 'border-slate-200 bg-white text-slate-950',
  basic: 'border-cyan-200 bg-cyan-50 text-cyan-950',
  premium: 'border-amber-200 bg-amber-50 text-amber-950',
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fb]">
      <Header />

      <section className="px-4 pb-16 pt-28 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-wider text-teal-700">Yearly Plans Only</p>
            <h1 className="mt-3 font-outfit text-4xl font-black text-slate-950 sm:text-5xl">
              Free, Basic and Premium access
            </h1>
            <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
              THENIJOBS subscriptions run on a yearly model. Paid features unlock only for users with an active plan.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {YEARLY_SUBSCRIPTION_PLANS.map((plan) => {
              const Icon = iconMap[plan.slug];
              return (
                <article
                  key={plan.slug}
                  className={`relative rounded-2xl border p-6 shadow-sm ${toneMap[plan.slug]}`}
                >
                  {plan.recommended && (
                    <span className="absolute right-5 top-5 rounded-full bg-slate-950 px-3 py-1 text-[10px] font-black uppercase text-white">
                      Recommended
                    </span>
                  )}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                    <Icon size={22} />
                  </div>
                  <h2 className="mt-5 text-xl font-black">{plan.name}</h2>
                  <p className="mt-1 text-sm font-semibold opacity-70">{plan.bestFor}</p>
                  <div className="mt-6">
                    <span className="font-outfit text-4xl font-black">{plan.displayPrice}</span>
                    <span className="ml-2 text-sm font-bold opacity-60">/ {plan.durationLabel}</span>
                  </div>
                  <p className="mt-2 text-sm font-bold opacity-70">{plan.statusLabel}</p>

                  <div className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2 text-sm font-semibold">
                        <Check size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-xl bg-white/70 p-4 text-sm font-semibold">
                    <div className="flex justify-between">
                      <span>Active jobs</span>
                      <span>{plan.maxActiveJobs}</span>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <span>Job alerts</span>
                      <span>{plan.maxJobAlerts}</span>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <span>Billing</span>
                      <span>{formatPlanPeriod(plan)}</span>
                    </div>
                  </div>

                  <Link
                    href="/register"
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-teal-800"
                  >
                    Get Started <ArrowRight size={15} />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
