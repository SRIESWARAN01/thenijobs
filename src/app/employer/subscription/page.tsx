'use client';

import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { Crown, CreditCard, ChevronRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function EmployerSubscriptionPage() {
  const { user } = useAuth();

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

  const loading = companyLoading || subLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit text-white">
        <Crown size={48} className="text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold text-white">No Company Profile</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Please register your company profile first to view subscription details.</p>
        <Link href="/employer/company-profile" className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold hover:opacity-90">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Portal Subscription</h1>
        <p className="text-sm text-gray-400 mt-1">Manage and monitor your employer subscription</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-cyan-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading subscription details...</p>
        </div>
      ) : (
        <div className="max-w-xl space-y-6">
          {/* Card detailing plan */}
          <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                <Crown size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  {currentPlan} <Sparkles size={14} className="text-amber-400" />
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Active Listing Campaign Plan</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-500">Plan Type</p>
                <p className="text-white font-semibold mt-0.5">{company?.isPremium ? 'Premium (Pro)' : 'Standard (Free)'}</p>
              </div>
              <div>
                <p className="text-gray-500">Billing Period</p>
                <p className="text-white font-semibold mt-0.5">{activeSub ? 'Monthly' : 'Lft (N/A)'}</p>
              </div>
            </div>

            {/* Link to change plans */}
            <div className="pt-4 border-t border-white/[0.06]">
              <Link
                href="/employer/billing"
                className="w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-cyan-400"
              >
                Change Pricing Plan <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* Usage Stats details */}
          <div className="glass-card rounded-2xl p-6 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Features Included</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-gray-400">Direct Candidate Search</span>
                <span className="text-white font-semibold">{company?.isPremium ? 'Unlimited' : 'Restricted'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-gray-400">WhatsApp Notification Alerts</span>
                <span className="text-white font-semibold">{company?.isPremium ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Featured Placement Badge</span>
                <span className="text-white font-semibold">{company?.isPremium ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
