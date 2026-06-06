'use client';

import WorkflowPage, { type WorkflowItem, type WorkflowMetric, type WorkflowTab } from '@/components/portal/WorkflowPage';
import {
  Bell,
  Briefcase,
  Calendar,
  CheckCircle,
  MessageSquare,
  Phone,
  Reply,
  Send,
} from 'lucide-react';

const metrics: WorkflowMetric[] = [
  { label: 'Threads', value: 6, description: 'Employer conversations', icon: MessageSquare, color: 'cyan' },
  { label: 'Unread', value: 3, description: 'Need response', icon: Bell, color: 'amber' },
  { label: 'Interview Chats', value: 2, description: 'Scheduled rounds', icon: Calendar, color: 'violet' },
  { label: 'Resolved', value: 11, description: 'Closed conversations', icon: CheckCircle, color: 'emerald' },
];

const tabs: WorkflowTab[] = [
  { label: 'All', value: 'all' },
  { label: 'unread', value: 'unread' },
  { label: 'active', value: 'active' },
  { label: 'interview', value: 'interview' },
  { label: 'closed', value: 'closed' },
];

const threads: WorkflowItem[] = [
  {
    id: 'msg-1',
    title: 'Digital Theni Solutions',
    subtitle: 'React Developer application',
    description: 'HR asked for interview availability and portfolio links. Last message: Today at 9:20 AM.',
    status: 'unread',
    meta: ['2 unread messages', 'Shortlisted', 'Last active today'],
    tags: ['React Developer', 'Portfolio', 'Interview'],
    actions: [
      { label: 'Reply', icon: Reply, tone: 'primary' },
      { label: 'View Application', icon: Briefcase, href: '/seeker/applications', tone: 'neutral' },
    ],
  },
  {
    id: 'msg-2',
    title: 'GreenField Agro Exports',
    subtitle: 'Accountant interview',
    description: 'Employer confirmed office address and requested documents for the Jun 8 interview.',
    status: 'interview',
    meta: ['Jun 8 at 2:30 PM', 'Dindigul branch', '1 unread message'],
    tags: ['Tally', 'GST', 'Documents'],
    actions: [
      { label: 'Reply', icon: Reply, tone: 'primary' },
      { label: 'Call', icon: Phone, href: 'tel:+919876543210', tone: 'neutral' },
    ],
  },
  {
    id: 'msg-3',
    title: 'Arasu Pandi Farm Services',
    subtitle: 'Marketing Executive role',
    description: 'Recruiter shared travel expectations and district coverage information.',
    status: 'active',
    meta: ['Last message yesterday', 'Under review', 'WhatsApp opted in'],
    tags: ['Sales', 'Field Work', 'Theni'],
    actions: [
      { label: 'Reply', icon: Reply, tone: 'primary' },
      { label: 'Application', icon: Send, href: '/seeker/applications', tone: 'neutral' },
    ],
  },
  {
    id: 'msg-4',
    title: 'HelpDesk Pro',
    subtitle: 'Customer support role',
    description: 'Conversation closed after the job was filled. You can keep the thread for reference.',
    status: 'closed',
    meta: ['Closed Jun 1', 'Role filled', 'No action needed'],
    tags: ['Support', 'Remote'],
    actions: [
      { label: 'Find Similar', icon: Briefcase, href: '/jobs', tone: 'primary' },
    ],
  },
];

const statusConfig = {
  unread: { label: 'Unread', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  active: { label: 'Active', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  interview: { label: 'Interview', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  closed: { label: 'Closed', color: 'bg-white/[0.06] text-gray-300 border-white/[0.08]' },
};

export default function SeekerMessagesPage() {
  return (
    <WorkflowPage
      title="Messages"
      eyebrow="Employer Inbox"
      description="Central place for recruiter replies, interview coordination, and application follow-ups."
      accent="cyan"
      metrics={metrics}
      tabs={tabs}
      items={threads}
      searchPlaceholder="Search employers, jobs, messages..."
      emptyTitle="No messages match"
      emptyDescription="Try another thread status or search term."
      primaryAction={{ label: 'Applications', icon: Briefcase, href: '/seeker/applications' }}
      statusConfig={statusConfig}
    />
  );
}
