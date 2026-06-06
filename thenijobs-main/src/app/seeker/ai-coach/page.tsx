'use client';

import { useState } from 'react';
import { Sparkles, MessageSquare, FileText, Loader2, Award, Zap, Lightbulb, Send, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { useToast } from '@/contexts/ToastContext';

const AI_MODES = [
  { id: 'career_coach', label: 'Career Coach', icon: MessageSquare },
  { id: 'resume_review', label: 'Resume Review', icon: FileText },
  { id: 'resume_summary', label: 'Resume Summary', icon: Award },
  { id: 'interview_prep', label: 'Interview Prep', icon: Zap },
  { id: 'skill_suggestions', label: 'Skill Suggestions', icon: Lightbulb },
  { id: 'career_guidance', label: 'Career Guidance', icon: Sparkles },
  { id: 'profile_optimization', label: 'Profile Optimization', icon: CheckCircle },
] as const;

type AiMode = typeof AI_MODES[number]['id'];

export default function AICoachPage() {
  const { firebaseUser, user } = useAuth();
  const { showToast } = useToast();
  const { data: profile } = useDocument<any>('seekerProfiles', user?.uid);
  const [mode, setMode] = useState<AiMode>('career_coach');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<{ used: number; limit: number | null } | null>(null);

  const runAiCoach = async () => {
    if (!firebaseUser) {
      showToast('Please log in again to use AI Coach.', 'warning');
      return;
    }
    if (prompt.trim().length < 8) {
      showToast('Please add a little more detail for useful AI guidance.', 'warning');
      return;
    }

    setLoading(true);
    setResult('');
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode,
          prompt,
          profile,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'AI request failed.');
      }
      setResult(data.text);
      setUsage({ used: data.used, limit: data.limit });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'AI request failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up space-y-6 max-w-5xl mx-auto font-outfit text-white py-4">
      <div className="glass-card rounded-2xl p-6 md:p-8 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 mb-4">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">AI Career Coach</h1>
            <p className="text-sm text-gray-400 leading-relaxed mt-2 max-w-2xl">
              Get personalized resume feedback, interview prep, skill suggestions, career guidance, and profile optimization from Gemini.
            </p>
          </div>
          {usage && (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-xs text-gray-300">
              AI usage: <span className="font-bold text-emerald-400">{usage.used}</span>
              {usage.limit ? ` / ${usage.limit}` : ' / Unlimited'} this month
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px,1fr] gap-5">
        <div className="glass-card rounded-2xl p-4 space-y-2 h-fit">
          {AI_MODES.map(item => {
            const Icon = item.icon;
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setMode(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-3">
              What do you want help with?
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={8}
              placeholder="Example: Review my resume for a sales executive role in Theni, suggest missing skills, and give interview questions..."
              className="search-input w-full px-4 py-3 text-sm bg-[#0e0e22] resize-none leading-relaxed"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={runAiCoach}
                disabled={loading}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {loading ? 'Generating...' : 'Generate Guidance'}
              </button>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 min-h-[260px]">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">AI Response</h2>
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <Loader2 size={28} className="text-emerald-400 animate-spin mb-3" />
                <p className="text-sm">Gemini is preparing your guidance...</p>
              </div>
            ) : result ? (
              <div className="whitespace-pre-wrap text-sm leading-7 text-gray-300">{result}</div>
            ) : (
              <div className="text-center py-16 text-gray-600">
                <Sparkles size={34} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Choose a tool, describe your goal, and generate personalized guidance.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
