'use client';

import { useEffect, useState } from 'react';
import CompanyProfilePageClient from './[slug]/CompanyProfilePageClient';

export default function CompanyProfileQueryClient() {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    setSlug(new URLSearchParams(window.location.search).get('slug') || '');
  }, []);

  if (slug === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-400" />
      </main>
    );
  }

  return <CompanyProfilePageClient slug={slug} />;
}
