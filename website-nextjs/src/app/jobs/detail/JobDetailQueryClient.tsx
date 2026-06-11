'use client';

import { useSearchParams } from 'next/navigation';
import JobDetailPageClient from '../[id]/JobDetailPageClient';

export default function JobDetailQueryClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';

  return <JobDetailPageClient id={id} />;
}
