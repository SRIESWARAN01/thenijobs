'use client';

import { useState } from 'react';
import { Check, Crown, Loader2, Shield, Star, Zap } from 'lucide-react';
import { where } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { createPaymentRequest } from '@/lib/firebase/firestoreService';
import { YEARLY_SUBSCRIPTION_PLANS, formatPlanPeriod, selectBestSubscription } from '@/lib/subscriptions';

const iconMap = {
  free: Shield,
  basic: Zap,
  premium: Crown,
};

export default function SeekerSubscriptionPage() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [requestingPlan, setRequestingPlan] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);

  const { data: subscriptions, loading } = useCollection<any>('subscriptions', [
    where('userId', '==', uid || ''),
  ], { skip: !uid });
  const { data: pendingRequests } = useCollection<any>('paymentRequests', [
    where('userId', '==', uid || ''),
    where('status', '==', 'pending'),
  ], { skip: !uid });

  const activeSub = selectBestSubscription(subscriptions);
  const currentPlan = activeSub?.plan || 'free';

  const handleUpgrade = async (plan: typeof YEARLY_SUBSCRIPTION_PLANS[number]) => {
    if (!uid || plan.slug === 'free') return;
    setRequestingPlan(plan.slug);
    setRequestMessage(null);
    try {
      await createPaymentRequest({
        userId: uid,
        audience: 'seeker',
        plan: plan.slug,
        planName: plan.name,
        amount: plan.price,
        period: 'year',
        requesterName: user.displayName || user.email || 'Candidate',
        requesterEmail: user.email,
        requesterPhone: user.phone,
      });
      setRequestMessage(`${plan.name} yearly upgrade request submitted.`);
    } catch (err) {
      console.error('Seeker payment request error:', err);
      setRequestMessage('Unable to submit upgrade request.');
    } finally {
      setRequestingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-outfit text-white">
        <Loader2 size={36} className="text-emerald-400 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading plan details...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6 max-w-6xl mx-auto font-outfit text-white">
      <div className="text-center max-w-xl mx-auto py-4">
        <h1 className="text-2xl font-bold text-white">Choose Your Yearly Plan</h1>
        <p className="text-sm text-gray-400 mt-2">Unlock candidate tools based on your active THENIJOBS subscription.</p>
      </div>

      {requestMessage && (
        <div className="mx-auto max-w-xl rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center text-sm font-semibold text-emerald-300">
          {requestMessage}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {YEARLY_SUBSCRIPTION_PLANS.map((plan) => {
          const Icon = iconMap[plan.slug];
          const isCurrent = currentPlan === plan.slug;
          const hasPendingRequest = pendingRequests.some((request) => request.plan === plan.slug);
          return (
            <div key={plan.slug} className={`glass-card rounded-2xl p-6 ${plan.recommended ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-white/[0.06] bg-white/[0.01]'}`}>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05]">
                  <Icon size={20} className={plan.slug === 'premium' ? 'text-amber-300' : 'text-emerald-300'} />
                </div>
                {isCurrent && (
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-300">
                    Active
                  </span>
                )}
                {plan.recommended && !isCurrent && (
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-300">
                    Popular
                  </span>
                )}
              </div>

              <h2 className="mt-5 text-xl font-bold text-white">{plan.name}</h2>
              <p className="mt-2 text-xs text-gray-400">{plan.bestFor}</p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{plan.displayPrice}</span>
                <span className="text-xs text-gray-500">/ {plan.durationLabel}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{formatPlanPeriod(plan)}</p>

              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5 text-xs text-gray-300">
                    <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(plan)}
                disabled={plan.slug === 'free' || isCurrent || hasPendingRequest || requestingPlan === plan.slug}
                className="mt-8 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 py-3.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {requestingPlan === plan.slug ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} />}
                {isCurrent ? 'Current Plan' : hasPendingRequest ? 'Request Pending' : plan.slug === 'free' ? 'Included' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
