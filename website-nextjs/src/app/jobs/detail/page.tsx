import { Suspense } from 'react';
import JobDetailQueryClient from './JobDetailQueryClient';

function JobDetailFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] text-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500/30 border-t-violet-400" />
    </main>
  );
}

export default function JobDetailIndexPage() {
  return (
    <Suspense fallback={<JobDetailFallback />}>
      <JobDetailQueryClient />
    </Suspense>
  );
}
