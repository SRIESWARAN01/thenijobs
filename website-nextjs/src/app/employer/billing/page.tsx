'use client';

import { useState } from 'react';
import Link from 'next/link';
import { where } from 'firebase/firestore';
import {
  CalendarClock,
  Check,
  CreditCard,
  Crown,
  Loader2,
  Shield,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { createPaymentRequest } from '@/lib/firebase/firestoreService';
import {
  YEARLY_SUBSCRIPTION_PLANS,
  getEffectiveSubscriptionStatus,
  selectBestSubscription,
  toDate,
} from '@/lib/subscriptions';

const iconMap = {
  Shield,
  Zap,
  Crown,
};

const colorMap = {
  free: 'border-white/10',
  basic: 'border-cyan-500/20',
  premium: 'border-amber-500/35 bg-gradient-to-b from-amber-500/10 to-transparent',
};

function formatDate(value?: unknown) {
  const date = toDate(value);
  if (!date) return 'Not set';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function EmployerBillingPage() {
  const { user } = useAuth();
  const [requestingPlan, setRequestingPlan] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);

  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || ''),
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  const { data: subscriptions, loading: subLoading } = useCollection<any>('subscriptions', [
    where('companyId', '==', companyId || ''),
  ], { skip: !companyId });

  const activeSub = selectBestSubscription(subscriptions);
  const currentPlanSlug = activeSub?.plan || 'free';
  const currentStatus = activeSub ? getEffectiveSubscriptionStatus(activeSub as any) : 'active';

  const { data: pendingRequests } = useCollection<any>('paymentRequests', [
    where('companyId', '==', companyId || ''),
    where('status', '==', 'pending'),
  ], { skip: !companyId });

  const loading = companyLoading || subLoading;

  const handleUpgradeRequest = async (plan: typeof YEARLY_SUBSCRIPTION_PLANS[number]) => {
    if (!user?.uid || !companyId || plan.slug === 'free') return;
    setRequestingPlan(plan.slug);
    setRequestMessage(null);

    try {
      await createPaymentRequest({
        userId: user.uid,
        companyId,
        audience: 'employer',
        plan: plan.slug,
        planName: plan.name,
        amount: plan.price,
        period: 'year',
        businessName: company?.name || company?.businessName || company?.companyName || 'Business',
        companyName: company?.name || company?.businessName || company?.companyName || 'Business',
        requesterName: user.displayName || company?.name || 'Employer',
        requesterEmail: user.email,
        requesterPhone: user.phone,
      });
      setRequestMessage(`${plan.name} yearly upgrade request submitted.`);
    } catch (err) {
      console.error('Payment request error:', err);
      setRequestMessage('Unable to submit upgrade request.');
    } finally {
      setRequestingPlan(null);
    }
  };

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit text-white">
        <CreditCard size={48} className="mb-4 text-gray-600" />
        <h2 className="text-lg font-semibold text-white">No Company Profile</h2>
        <p className="mt-2 max-w-sm text-sm text-gray-400">
          Please register your company profile first to view yearly plans and subscriptions.
        </p>
        <Link href="/employer/company-profile" className="mt-4 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 px-5 py-2.5 font-semibold text-white hover:opacity-90">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      <div>
        <h1 className="text-2xl font-bold">Yearly Pricing & Plans</h1>
        <p className="mt-1 text-sm text-gray-400">Only yearly plans are available. All upgrades are valid for 1 year.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="mb-4 animate-spin text-cyan-400" />
          <p className="text-sm text-gray-400">Loading plans...</p>
        </div>
      ) : (
        <>
          <div className="glass-card rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10">
                  <CreditCard size={18} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Current Plan:{' '}
                    <span className="text-cyan-300">
                      {activeSub?.planName || `${currentPlanSlug[0].toUpperCase()}${currentPlanSlug.slice(1)} Plan`}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {activeSub
                      ? `Expires on ${formatDate(activeSub.endDate)}`
                      : 'Free yearly access. Upgrade for extra employer tools.'}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold capitalize text-emerald-400">
                <ShieldCheck size={14} />
                {currentStatus.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-3">
            {YEARLY_SUBSCRIPTION_PLANS.map((plan) => {
              const Icon = iconMap[plan.icon as keyof typeof iconMap] || Shield;
              const isCurrent = plan.slug === currentPlanSlug;
              const hasPendingRequest = pendingRequests.some((request) => request.plan === plan.slug);

              return (
                <article
                  key={plan.slug}
                  className={`glass-card relative flex flex-col justify-between rounded-3xl border p-6 ${colorMap[plan.slug]} ${isCurrent ? 'ring-2 ring-cyan-500' : ''}`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      Current Plan
                    </span>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-cyan-300">
                        <Icon size={20} />
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <CalendarClock size={13} />
                        1 year
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-white">{plan.displayPrice}</span>
                        <span className="text-xs text-gray-500">/ year</span>
                      </div>
                    </div>

                    <ul className="space-y-2.5 border-t border-white/[0.06] pt-4 text-xs text-gray-400">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check size={14} className="mt-0.5 shrink-0 text-cyan-400" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 border-t border-white/[0.06] pt-6">
                    {isCurrent || plan.slug === 'free' ? (
                      <button disabled className="w-full rounded-xl bg-white/[0.04] py-2.5 text-xs font-semibold text-gray-500">
                        {isCurrent ? 'Plan Active' : 'Free Included'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpgradeRequest(plan)}
                        disabled={requestingPlan === plan.slug || hasPendingRequest}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {requestingPlan === plan.slug && <Loader2 size={12} className="animate-spin" />}
                        {hasPendingRequest ? 'Request Pending' : `Request ${plan.name}`}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {requestMessage && (
            <p className="text-center text-xs font-semibold text-cyan-300">{requestMessage}</p>
          )}
        </>
      )}
    </div>
  );
}
