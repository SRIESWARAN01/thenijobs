import { Suspense } from 'react';
import CompanyProfileQueryClient from './CompanyProfileQueryClient';

function ProfileFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] text-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-400" />
    </main>
  );
}

export default function CompanyProfileIndexPage() {
  return (
    <Suspense fallback={<ProfileFallback />}>
      <CompanyProfileQueryClient />
    </Suspense>
  );
}
