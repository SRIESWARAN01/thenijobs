'use client';

import { useState } from 'react';
import { Sparkles, MessageSquare, ShieldAlert, Cpu, Check, ArrowRight, Loader2, Award, Zap } from 'lucide-react';

export default function AICoachPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setEmail('');
    }, 1000);
  };

  const PREVIEWS = [
    {
      icon: MessageSquare,
      title: 'Mock Interviews',
      desc: 'Practice speaking with our conversational AI recruiter. Receive instantaneous grading on confidence, grammar, and key technical answers.',
      color: 'violet'
    },
    {
      icon: Award,
      title: 'Resume Scanner',
      desc: 'Upload your resume and match it against specific local jobs. Know your score and how to optimize bullet points before you apply.',
      color: 'emerald'
    },
    {
      icon: Zap,
      title: 'Career Advisor',
      desc: 'Unsure about your career path? Get personalized, locale-focused recommendations based on your educational background and current skills.',
      color: 'cyan'
    }
  ];

  return (
    <div className="animate-fade-in-up space-y-6 max-w-4xl mx-auto font-outfit text-white py-4">
      {/* Hero Header */}
      <div className="glass-card rounded-2xl p-6 md:p-10 relative overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 text-center">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="relative z-10 space-y-4 max-w-xl mx-auto">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
            <Sparkles size={24} className="animate-pulse" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">AI Career Coach</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Your personal, 24/7 mock interviewer and resume analyzer is currently in development. Prepare to ace your next job application.
          </p>

          {/* Waitlist Form */}
          <div className="pt-4 max-w-md mx-auto">
            {submitted ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs font-semibold">
                🎉 Thanks! You will be the first to know when AI Coach launches.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter email to join the waitlist..."
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="search-input flex-1 px-4 py-3 text-xs bg-[#0a0a1a]"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 shrink-0"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
                  Notify Me
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Feature Previews */}
      <div className="grid md:grid-cols-3 gap-4">
        {PREVIEWS.map((item, idx) => {
          const Icon = item.icon;
          const iconColorMap: Record<string, string> = {
            violet: 'bg-violet-500/10 text-violet-400',
            emerald: 'bg-emerald-500/10 text-emerald-400',
            cyan: 'bg-cyan-500/10 text-cyan-400',
          };
          return (
            <div key={idx} className="glass-card rounded-2xl p-5 border-white/[0.04] bg-white/[0.01] flex flex-col justify-between hover:border-white/[0.12] transition-all">
              <div>
                <div className={`w-10 h-10 rounded-xl ${iconColorMap[item.color]} flex items-center justify-center mb-4`}>
                  <Icon size={18} />
                </div>
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{item.desc}</p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                <Cpu size={12} /> Beta Coming soon
              </div>
            </div>
          );
        })}
      </div>

      {/* How it works details */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2 mb-4">
          <Cpu size={15} className="text-emerald-400" /> AI Coach Features Preview
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            'Voice-enabled mock recruiters matching local business roles',
            'Granular sentence-by-sentence feedback on your answers',
            'Visual match rating score against any job posting',
            'Step-by-step guidance on structural resume updates',
            'Tamil and English multi-lingual mock conversations',
            'Interview tips, cheat sheets, and body language advice'
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-400">
              <Check size={14} className="text-emerald-450 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
