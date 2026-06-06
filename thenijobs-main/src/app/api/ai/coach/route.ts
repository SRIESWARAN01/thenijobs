import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getPlanLimits, normalizePlanSlug } from '@/lib/subscriptions';

export const runtime = 'nodejs';

const MODES = {
  career_coach: 'AI Career Coach',
  resume_review: 'Resume Review',
  resume_summary: 'Resume Summary',
  interview_prep: 'Interview Preparation',
  skill_suggestions: 'Skill Suggestions',
  career_guidance: 'Career Guidance',
  profile_optimization: 'Profile Optimization',
} as const;

type AiMode = keyof typeof MODES;

function isMode(value: unknown): value is AiMode {
  return typeof value === 'string' && value in MODES;
}

function monthKey() {
  return new Date().toISOString().slice(0, 7);
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Gemini API key is not configured on the server.' },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let uid = '';
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid session token.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !isMode(body.mode) || typeof body.prompt !== 'string') {
    return NextResponse.json({ error: 'Invalid AI request.' }, { status: 400 });
  }

  const mode = body.mode as AiMode;
  const prompt = body.prompt.trim();
  if (prompt.length < 8) {
    return NextResponse.json({ error: 'Please provide more detail for AI guidance.' }, { status: 400 });
  }
  if (prompt.length > 8000) {
    return NextResponse.json({ error: 'Prompt is too long. Keep it under 8000 characters.' }, { status: 400 });
  }

  const db = adminDb();
  const [userSnap, profileSnap] = await Promise.all([
    db.doc(`users/${uid}`).get(),
    db.doc(`seekerProfiles/${uid}`).get(),
  ]);

  const user = userSnap.data() || {};
  const profile = profileSnap.data() || {};
  if (user.mobileVerified !== true && user.phoneVerified !== true) {
    return NextResponse.json(
      { error: 'Please verify your mobile number before using AI tools.' },
      { status: 403 },
    );
  }

  const plan = normalizePlanSlug(
    String(profile.subscriptionPlan || user.subscriptionPlan || (profile.isPremium ? 'premium' : 'free')),
  );
  const planSettingsSnap = await db.doc('settings/subscriptionPlans').get();
  const dynamicPlanLimits = planSettingsSnap.data()?.[plan] || {};
  const limits = { ...getPlanLimits(plan), ...dynamicPlanLimits };
  const usageRef = db.doc(`aiUsage/${uid}_${monthKey()}`);
  const usageSnap = await usageRef.get();
  const used = Number(usageSnap.data()?.count || 0);
  const aiLimit = Number(limits.aiRequestsPerMonth);
  const hasUnlimitedAi = aiLimit < 0 || !Number.isFinite(aiLimit);

  if (!hasUnlimitedAi && used >= aiLimit) {
    return NextResponse.json(
      { error: `${limits.name} plan AI limit reached for this month.` },
      { status: 429 },
    );
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const modeName = MODES[mode];
  const profileContext = {
    name: profile.name || user.displayName || 'Candidate',
    district: profile.district || user.district || 'Tamil Nadu',
    currentRole: profile.currentRole || '',
    skills: profile.skills || [],
    education: profile.education || [],
    experience: profile.experience || [],
    certifications: profile.certifications || [],
    projects: profile.projects || [],
    profileScore: profile.profileScore || profile.profileStrength || null,
  };

  const aiPrompt = [
    'You are THENIJOBS AI Career Coach for Tamil Nadu job seekers.',
    `Task: ${modeName}.`,
    'Give practical, specific, safe career guidance. Use concise bullets. Avoid inventing unverifiable credentials.',
    'When useful, include Tamil Nadu/local hiring context. Do not ask for sensitive identity documents.',
    `Candidate profile JSON: ${JSON.stringify(profileContext)}`,
    `User request: ${prompt}`,
  ].join('\n\n');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: aiPrompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1200,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: 'Gemini request failed.', details: errorText.slice(0, 500) },
      { status: 502 },
    );
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || '')
    .join('')
    .trim();

  if (!text) {
    return NextResponse.json({ error: 'Gemini returned an empty response.' }, { status: 502 });
  }

  await usageRef.set({
    uid,
    month: monthKey(),
    plan,
    count: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return NextResponse.json({
    text,
    mode,
    plan,
    used: used + 1,
    limit: hasUnlimitedAi ? null : aiLimit,
  });
}
