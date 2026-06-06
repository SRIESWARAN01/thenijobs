'use client';

import { httpsCallable } from 'firebase/functions';
import { functions } from './config';
import type { PlanSlug } from '@/lib/subscriptions';

export interface CreateJobPostingInput {
  companyId: string;
  title: string;
  description: string;
  jobType: string;
  location?: string;
  district: string;
  openings: number;
  experience?: string;
  education?: string;
  skills: string[];
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryType: string;
  isNegotiable: boolean;
  benefits: string[];
  deadline?: string | null;
  isPremium: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
}

export interface CreateJobPostingResult {
  jobId: string;
  plan: PlanSlug;
  remainingJobSlots: number | null;
}

export interface SyncMobileVerificationResult {
  phone: string;
  mobileVerified: true;
}

export async function createJobPosting(
  input: CreateJobPostingInput,
): Promise<CreateJobPostingResult> {
  const callable = httpsCallable<CreateJobPostingInput, CreateJobPostingResult>(
    functions,
    'createJobPosting',
  );
  const result = await callable(input);
  return result.data;
}

export async function syncMobileVerification(): Promise<SyncMobileVerificationResult> {
  const callable = httpsCallable<Record<string, never>, SyncMobileVerificationResult>(
    functions,
    'syncMobileVerification',
  );
  const result = await callable({});
  return result.data;
}
