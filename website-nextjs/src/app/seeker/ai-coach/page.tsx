'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Award, Check, Cpu, Loader2, MessageSquare, Sparkles, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { upsertDocument } from '@/lib/firebase/firestoreService';

type ExperienceLevel = 'fresher' | 'junior' | 'experienced' | 'career_switch';

interface CoachPlan {
  focus: string;
  summary: string;
  steps: string[];
  questions: string[];
  keywords: string[];
}

const EXPERIENCE_OPTIONS: Array<{ value: ExperienceLevel; label: string }> = [
  { value: 'fresher', label: 'Fresher' },
  { value: 'junior', label: '1-3 years' },
  { value: 'experienced', label: '3+ years' },
  { value: 'career_switch', label: 'Career switch' },
];

const PREVIEWS = [
  {
    icon: MessageSquare,
    title: 'Interview Practice',
    desc: 'Role-specific questions, speaking prompts, and concise answer structure.',
    color: 'violet',
  },
  {
    icon: Award,
    title: 'Resume Readiness',
    desc: 'A short checklist for profile strength, keywords, and proof points.',
    color: 'emerald',
  },
  {
    icon: Zap,
    title: 'Action Plan',
    desc: 'Focused next steps for applying, following up, and improving fit.',
    color: 'cyan',
  },
];

function buildCoachPlan(targetRole: string, experience: ExperienceLevel): CoachPlan {
  const role = targetRole.trim() || 'your target role';
  const isFresher = experience === 'fresher';
  const isSwitching = experience === 'career_switch';
  const proofPoint = isFresher
    ? 'projects, internships, coursework, certificates, and volunteer work'
    : 'recent wins, measurable outcomes, tools used, and business impact';

  return {
    focus: isSwitching ? 'Transition readiness' : isFresher ? 'Entry-level readiness' : 'Role fit readiness',
    summary: `Prepare a sharper ${role} pitch with proof from ${proofPoint}.`,
    steps: [
      `Write a 45-second introduction for ${role} with one clear strength and one relevant proof point.`,
      `Match your resume to three common ${role} requirements and add missing keywords naturally.`,
      'Prepare one STAR story for teamwork, one for problem solving, and one for learning quickly.',
      'Apply to five closely matched openings before broad applications, then follow up within two days.',
    ],
    questions: [
      `Why do you want to work as a ${role}?`,
      `Tell me about a time you solved a practical problem related to ${role}.`,
      'How do you handle feedback when your first attempt is not accepted?',
      'What skills will you improve in the next 30 days?',
    ],
    keywords: [
      role,
      isFresher ? 'quick learner' : 'ownership',
      isSwitching ? 'transferable skills' : 'relevant experience',
      'communication',
      'problem solving',
    ],
  };
}

export default function AICoachPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [experience, setExperience] = useState<ExperienceLevel>('fresher');
  const [coachPlan, setCoachPlan] = useState<CoachPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [email, user?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.uid) {
      setError('Please sign in to save your coach plan.');
      return;
    }

    setLoading(true);
    setError(null);

    const plan = buildCoachPlan(targetRole, experience);

    try {
      await upsertDocument('aiCoachWaitlist', user.uid, {
        userId: user.uid,
        email: email.trim() || user.email || '',
        displayName: user.displayName || '',
        status: 'starter_plan_generated',
        targetRole: targetRole.trim(),
        experienceLevel: experience,
        requestedFeatures: ['mock_interviews', 'resume_scanner', 'career_advisor'],
        starterPlan: plan,
      });
      setCoachPlan(plan);
    } catch (err) {
      console.error('AI Coach starter plan error:', err);
      setError('Unable to save your starter plan right now.');
    } finally {
      setLoading(false);
    }
  };

  const iconColorMap: Record<string, string> = {
    violet: 'bg-violet-500/10 text-violet-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
  };

  return (
    <div className="animate-fade-in-up space-y-6 max-w-5xl mx-auto font-outfit text-white py-4">
      <div className="glass-card rounded-2xl p-5 sm:p-6 md:p-8 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">AI Career Coach</h1>
              <p className="text-sm text-gray-400 leading-relaxed mt-2 max-w-xl">
                Build a saved interview and resume starter plan for your next local job application.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs font-semibold text-gray-400">Target Role</span>
                <input
                  type="text"
                  required
                  placeholder="Example: Accountant, Sales Executive"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="search-input w-full px-4 py-3 text-sm bg-[#0a0a1a]"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-gray-400">Experience</span>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value as ExperienceLevel)}
                  className="search-input w-full px-4 py-3 text-sm bg-[#0a0a1a]"
                >
                  {EXPERIENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-gray-400">Email</span>
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="search-input w-full px-4 py-3 text-sm bg-[#0a0a1a]"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="sm:col-span-2 min-h-11 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                Generate Starter Plan
              </button>
            </form>

            {error && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
                {error}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-[#08081a]/60 p-5 min-h-[280px]">
            {coachPlan ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Cpu size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{coachPlan.focus}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{coachPlan.summary}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {coachPlan.steps.map((step) => (
                    <div key={step} className="flex items-start gap-2 text-xs text-gray-300">
                      <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <p className="text-xs font-semibold text-white mb-2">Practice Questions</p>
                  <div className="space-y-2">
                    {coachPlan.questions.map((question) => (
                      <p key={question} className="text-xs text-gray-400 leading-relaxed">
                        {question}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                <Cpu size={34} className="opacity-30 mb-3" />
                <p className="text-sm font-semibold text-white">Starter plan preview</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Your saved plan appears here after generation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {PREVIEWS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="glass-card rounded-2xl p-5 border-white/[0.04] bg-white/[0.01]">
              <div className={`w-10 h-10 rounded-xl ${iconColorMap[item.color]} flex items-center justify-center mb-4`}>
                <Icon size={18} />
              </div>
              <h3 className="text-sm font-semibold text-white">{item.title}</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
