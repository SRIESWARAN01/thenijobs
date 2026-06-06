'use client';

import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { useToast } from '@/contexts/ToastContext';
import { where } from 'firebase/firestore';
import { CreditCard, Check, ShieldCheck, Zap, Shield, Crown, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function EmployerBillingPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // 1. Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  // 2. Fetch active subscriptions
  const { data: subscriptions, loading: subLoading } = useCollection<any>('subscriptions', [
    where('companyId', '==', companyId || ''),
    where('status', '==', 'active')
  ], { skip: !companyId });

  const activeSub = subscriptions[0];
  const currentPlan = activeSub ? activeSub.planName || 'Free Plan' : (company?.isPremium ? 'Premium Plan' : 'Free Plan');

  const plans = [
    {
      name: 'Free Plan',
      price: '₹0',
      period: 'forever',
      features: [
        'Post up to 3 active jobs',
        'Basic candidate search',
        'Standard job listing placement',
        'Email notifications'
      ],
      icon: Shield,
      color: 'gray'
    },
    {
      name: 'Basic Plan',
      price: '₹40',
      period: 'month',
      features: [
        'Post up to 10 active jobs',
        'Advanced candidate search',
        'Priority job listing placement',
        'Email & SMS notifications',
        'Trust badge verification assistance'
      ],
      icon: Zap,
      color: 'cyan'
    },
    {
      name: 'Premium Plan',
      price: '₹100',
      period: 'month',
      features: [
        'Post unlimited active jobs',
        'Premium candidate search & filter',
        'Featured home page job placement',
        'Direct WhatsApp contact triggers',
        'Verified Premium Employer status',
        'Dedicated account support'
      ],
      icon: Crown,
      color: 'violet'
    }
  ];

  const loading = companyLoading || subLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit text-white">
        <CreditCard size={48} className="text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold text-white">No Company Profile</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Please register your company profile first to view pricing plans and subscriptions.</p>
        <Link href="/employer/company-profile" className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold hover:opacity-90">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Pricing & Plans</h1>
        <p className="text-sm text-gray-400 mt-1">Upgrade your recruitment campaign with subscription options</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-cyan-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading plans...</p>
        </div>
      ) : (
        <>
          {/* Current plan status banner */}
          <div className="glass-card rounded-2xl p-5 border border-cyan-500/20 bg-cyan-500/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                <CreditCard size={18} className="text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Current Plan: <span className="text-cyan-400">{currentPlan}</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {activeSub
                    ? `Renews on ${new Date(activeSub.endDate?.seconds * 1000).toLocaleDateString()}`
                    : 'Lifetime access. Upgrade for extra perks.'}
                </p>
              </div>
            </div>
            {activeSub && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck size={14} />
                Subscription Active
              </span>
            )}
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isCurrent = currentPlan.toLowerCase().includes(plan.name.split(' ')[0].toLowerCase());
              
              const borderColors: Record<string, string> = {
                gray: 'border-white/10',
                cyan: 'border-cyan-500/20',
                violet: 'border-violet-500/40 bg-gradient-to-b from-violet-950/20 to-transparent'
              };

              const colorsMap: Record<string, string> = {
                gray: 'text-gray-400 bg-white/5',
                cyan: 'text-cyan-400 bg-cyan-500/10',
                violet: 'text-violet-400 bg-violet-500/10'
              };

              return (
                <div
                  key={plan.name}
                  className={`glass-card rounded-3xl p-6 flex flex-col justify-between border relative ${
                    borderColors[plan.color]
                  } ${isCurrent ? 'ring-2 ring-cyan-500' : ''}`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-600 text-white text-[10px] font-bold uppercase tracking-wider">
                      Current Plan
                    </span>
                  )}
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl ${colorsMap[plan.color]} flex items-center justify-center`}>
                        <Icon size={20} />
                      </div>
                      <span className="text-xs text-gray-500 capitalize">{plan.period}</span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                        {plan.price !== '₹0' && <span className="text-xs text-gray-500">/{plan.period}</span>}
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 pt-4 border-t border-white/[0.06] text-xs text-gray-400">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/[0.06]">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl bg-white/[0.04] text-gray-500 text-xs font-semibold"
                      >
                        Plan Active
                      </button>
                    ) : (
                      <button
                        onClick={() => showToast('Payment gateway integration coming soon!', 'info')}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        Upgrade to {plan.name.split(' ')[0]}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
