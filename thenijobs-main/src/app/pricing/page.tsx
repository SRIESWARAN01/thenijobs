'use client';

import { useState } from 'react';
import { Check, X, Zap, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

const PLANS = [
  {
    name: 'Free Plan',
    slug: 'free',
    icon: '🆓',
    price: 0,
    period: 'Forever',
    description: 'Perfect to get started',
    color: 'gray',
    popular: false,
    cta: 'Get Started Free',
    features: [
      'Company Registration',
      '1 Company Profile Submission',
      'Business Directory Application',
      'WhatsApp Contact',
      'Basic Company Profile',
      'Pending Admin Approval',
    ],
    notIncluded: [
      'Featured Listing',
      'Premium Badge',
      'Job Posting',
      'Analytics Dashboard',
    ],
    note: 'Company profile will NOT be visible publicly until approved by Admin.',
    bestFor: 'Getting started',
  },
  {
    name: 'Basic Plan',
    slug: 'basic',
    icon: '⭐',
    price: 40,
    period: 'Month',
    description: 'For small businesses and startups',
    color: 'cyan',
    popular: false,
    cta: 'Start Basic',
    features: [
      'Verified Company Profile',
      'Up to 3 Job Postings / Month',
      'Business Directory Listing',
      'WhatsApp Button',
      'Call Button',
      'Company Gallery (Up to 5 Photos)',
      'Priority Approval',
      'Basic Analytics',
      'Customer Enquiry Form',
    ],
    notIncluded: [
      'Premium Badge',
      'Featured Listing',
      'Lead Dashboard',
      'Social Media Links',
    ],
    bestFor: 'Small businesses and startups',
  },
  {
    name: 'Premium Plan',
    slug: 'premium',
    icon: '👑',
    price: 100,
    period: 'Month',
    description: 'For growing businesses and recruiters',
    color: 'violet',
    popular: true,
    cta: 'Go Premium',
    features: [
      'Everything in Basic +',
      'Up to 15 Job Postings / Month',
      'Premium Badge',
      'Featured Business Listing',
      'Priority Search Placement',
      'Advanced Analytics',
      'Unlimited Gallery Photos',
      'Urgent Job Badge',
      'Lead Management Dashboard',
      'Social Media Links',
    ],
    notIncluded: [],
    bestFor: 'Growing businesses and recruiters',
  },
  {
    name: 'Enterprise Plan',
    slug: 'enterprise',
    icon: '🏢',
    price: 190,
    period: 'Month',
    description: 'For large businesses and agencies',
    color: 'amber',
    popular: false,
    cta: 'Contact Sales',
    features: [
      'Everything in Premium +',
      'Unlimited Job Postings',
      'Multiple Branch Profiles',
      'Dedicated Support',
      'Advanced Lead Tracking',
      'Business Performance Reports',
      'Homepage Featured Placement',
      'Supplier & Service Marketplace Access',
      'Franchise/Branch Management',
      'Custom Business URL',
    ],
    notIncluded: [],
    bestFor: 'Large businesses, agencies, and multi-branch companies',
  },
];

const FAQS = [
  { q: 'Can I switch plans anytime?', a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.' },
  { q: 'Is there a refund policy?', a: 'We offer a 7-day money-back guarantee on all paid plans. No questions asked.' },
  { q: 'What payment methods do you accept?', a: 'We accept UPI, Debit/Credit cards, Net Banking, and popular wallets via Razorpay.' },
  { q: 'Do I need a GST number?', a: 'GST number is optional but recommended for business verification badge.' },
  { q: 'How does the approval process work?', a: 'After registration, our admin team reviews your company profile within 24-48 hours. Paid plans get priority approval.' },
];

const colorMap: Record<string, { bg: string; text: string; border: string; badge: string; glow: string }> = {
  gray: { bg: 'bg-gray-500/5', text: 'text-gray-400', border: 'border-gray-500/15', badge: 'bg-gray-500/10 text-gray-400', glow: '' },
  cyan: { bg: 'bg-cyan-500/5', text: 'text-cyan-400', border: 'border-cyan-500/15', badge: 'bg-cyan-500/10 text-cyan-400', glow: 'shadow-cyan-500/10' },
  violet: { bg: 'bg-violet-500/5', text: 'text-violet-400', border: 'border-violet-500/15', badge: 'bg-violet-500/10 text-violet-400', glow: 'shadow-violet-500/20' },
  amber: { bg: 'bg-amber-500/5', text: 'text-amber-400', border: 'border-amber-500/15', badge: 'bg-amber-500/10 text-amber-400', glow: 'shadow-amber-500/10' },
};

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a1a] blob-bg">
      {/* Header */}
      <div className="relative pt-24 pb-16 px-4 text-center">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-400 font-semibold mb-6">
            <Zap size={12} /> Choose Your Growth Plan
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold text-white font-outfit mb-4">
            Simple, Transparent
            <span className="gradient-text"> Pricing</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
            Join businesses, employers, and service providers on THENIJOBS. Start free and grow at your own pace.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium ${!annual ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-violet-600' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${annual ? 'left-7' : 'left-1'}`} />
            </button>
            <span className={`text-sm font-medium ${annual ? 'text-white' : 'text-gray-500'}`}>
              Annual <span className="text-emerald-400 text-xs font-bold">Save 20%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {PLANS.map((plan) => {
            const colors = colorMap[plan.color];
            const price = annual && plan.price > 0 ? Math.round(plan.price * 0.8) : plan.price;
            return (
              <div
                key={plan.slug}
                className={`relative glass-card rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-4px] ${plan.popular ? `border-violet-500/30 shadow-lg ${colors.glow}` : 'hover:border-white/15'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <span className="text-3xl">{plan.icon}</span>
                  <h3 className="text-lg font-bold text-white font-outfit mt-2">{plan.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm text-gray-400">₹</span>
                    <span className="text-4xl font-bold text-white font-outfit">{price}</span>
                    <span className="text-sm text-gray-500">/ {plan.price === 0 ? 'Forever' : plan.period}</span>
                  </div>
                  {annual && plan.price > 0 && (
                    <p className="text-[10px] text-emerald-400 mt-1">
                      Save ₹{(plan.price - price) * 12}/year
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-2.5 mb-6">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Check size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-gray-300">{feature}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5 opacity-40">
                      <X size={14} className="text-gray-600 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-gray-600 line-through">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Note */}
                {plan.note && (
                  <div className="px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10 mb-4">
                    <p className="text-[10px] text-amber-400/80">{plan.note}</p>
                  </div>
                )}

                {/* Best For */}
                <p className="text-[10px] text-gray-600 text-center mb-4">
                  Best for: {plan.bestFor}
                </p>

                {/* CTA */}
                <button
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${plan.popular
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-violet-500/20'
                      : plan.price === 0
                        ? 'bg-white/[0.06] text-white hover:bg-white/[0.1] border border-white/[0.08]'
                        : `${colors.bg} ${colors.text} border ${colors.border} hover:bg-opacity-80`
                    } flex items-center justify-center gap-2`}
                >
                  {plan.cta}
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>

        {/* All Plans Include */}
        <div className="mt-12 glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white text-center mb-4">All Plans Include</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              'Company Registration',
              'Admin Review Process',
              'WhatsApp Support',
              'SSL Security',
              'Mobile Responsive',
              'SEO Optimization',
              'Tamil & English Support',
              'Data Backup',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <Check size={12} className="text-emerald-400 flex-shrink-0" />
                <span className="text-xs text-gray-400">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white font-outfit text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="glass-card rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-white">{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-400">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
