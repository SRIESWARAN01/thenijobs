'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { BadgeCheck, MapPin, QrCode, ShieldCheck } from 'lucide-react';
import { useDocument } from '@/hooks/useFirestore';

interface PublicProfile {
  name?: string;
  displayName?: string;
  currentRole?: string;
  qualification?: string;
  district?: string;
  photoUrl?: string;
  profilePhotoUrl?: string;
  skills?: string[];
  profileStrength?: number;
  isOpenToWork?: boolean;
}

export default function DigitalIdCardPageClient({ uid }: { uid: string }) {
  const { data: profile, loading } = useDocument<PublicProfile>('publicProfiles', uid);

  const portfolioUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/profile?uid=${uid}`;
    return `${window.location.origin}/profile?uid=${encodeURIComponent(uid)}`;
  }, [uid]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-400" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] px-6 text-center text-white">
        <div>
          <h1 className="text-xl font-bold">Digital ID not available</h1>
          <p className="mt-2 text-sm text-gray-400">Complete the profile first to generate this card.</p>
        </div>
      </main>
    );
  }

  const name = profile.name || profile.displayName || 'THENIJOBS Member';
  const role = profile.currentRole || profile.qualification || 'Job Seeker';
  const photoUrl = profile.photoUrl || profile.profilePhotoUrl || '';
  const uniqueId = `TNI-${uid.slice(0, 8).toUpperCase()}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(portfolioUrl)}`;

  return (
    <main className="min-h-screen bg-[#0a0a1a] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl">
          <div className="bg-[linear-gradient(135deg,#0f766e,#2563eb)] p-5">
            <div className="flex items-center justify-between">
              <Image src="/logo.png" alt="THENIJOBS" width={132} height={34} className="h-8 w-auto object-contain brightness-0 invert" />
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black">DIGITAL ID</span>
            </div>
          </div>
          <div className="space-y-5 p-6">
            <div className="flex items-start gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-3xl border border-white/10 bg-slate-800">
                {photoUrl ? (
                  <Image src={photoUrl} alt={name} fill sizes="96px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-black">
                    {name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-outfit text-2xl font-black">{name}</h1>
                <p className="mt-1 text-sm font-semibold text-cyan-300">{role}</p>
                <p className="mt-3 font-mono text-sm text-gray-400">{uniqueId}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <MapPin size={16} className="text-emerald-300" />
                <p className="mt-2 text-xs text-gray-500">District</p>
                <p className="font-bold">{profile.district || 'Not set'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <ShieldCheck size={16} className="text-cyan-300" />
                <p className="mt-2 text-xs text-gray-500">Verification</p>
                <p className="font-bold">{Number(profile.profileStrength || 0) >= 80 ? 'Profile Complete' : 'Profile Pending'}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(profile.skills || []).slice(0, 6).map((skill) => (
                  <span key={skill} className="rounded-xl bg-white/[0.07] px-3 py-1 text-xs font-bold text-gray-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl">
          <div className="bg-white p-6 text-slate-950">
            <div className="flex items-center justify-between">
              <Image src="/logo.png" alt="THENIJOBS" width={132} height={34} className="h-8 w-auto object-contain" />
              <BadgeCheck size={24} className="text-emerald-600" />
            </div>
            <div className="mt-8 flex justify-center">
              <Image src={qrUrl} alt="Portfolio QR code" width={220} height={220} className="rounded-2xl border border-slate-200" />
            </div>
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                <QrCode size={14} /> Scan to verify portfolio
              </div>
              <p className="mx-auto mt-4 max-w-sm text-sm font-semibold text-slate-600">
                This QR opens the private THENIJOBS portfolio page for {name}. Search engines are blocked from indexing it.
              </p>
              <p className="mt-4 font-mono text-xs text-slate-400 break-all">{portfolioUrl}</p>
            </div>
          </div>
          <div className="space-y-3 p-6">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <span className="text-sm text-gray-400">Membership</span>
              <span className="text-sm font-black">{profile.isOpenToWork !== false ? 'Active' : 'Standard'}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <span className="text-sm text-gray-400">Brand</span>
              <span className="text-sm font-black">THENIJOBS Verified Link</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
