'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Star,
  Calendar,
  CheckCircle,
  XCircle,
  Check,
  ChevronRight,
} from 'lucide-react';
import { APPLICATION_STATUS_CONFIG } from '@/lib/constants';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ApplicationStatus =
  | 'applied'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'selected'
  | 'rejected';

interface ApplicationPipelineProps {
  currentStatus: ApplicationStatus;
  timestamps?: Record<string, Date>;
  onStatusChange?: (newStatus: string) => void;
  readonly?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Pipeline stage definitions                                         */
/* ------------------------------------------------------------------ */

const MAIN_STAGES: {
  key: ApplicationStatus;
  label: string;
  icon: React.ElementType;
  gradient: string;
  glow: string;
}[] = [
  {
    key: 'applied',
    label: 'Applied',
    icon: Send,
    gradient: 'from-cyan-500 to-blue-500',
    glow: 'rgba(6,182,212,0.45)',
  },
  {
    key: 'shortlisted',
    label: 'Shortlisted',
    icon: Star,
    gradient: 'from-purple-500 to-indigo-500',
    glow: 'rgba(124,58,237,0.45)',
  },
  {
    key: 'interview_scheduled',
    label: 'Interview',
    icon: Calendar,
    gradient: 'from-amber-500 to-orange-500',
    glow: 'rgba(245,158,11,0.45)',
  },
  {
    key: 'selected',
    label: 'Selected',
    icon: CheckCircle,
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'rgba(16,185,129,0.45)',
  },
];

const REJECTED_STAGE = {
  key: 'rejected' as ApplicationStatus,
  label: 'Rejected',
  icon: XCircle,
  gradient: 'from-rose-500 to-red-600',
  glow: 'rgba(244,63,94,0.45)',
};

const STATUS_ORDER: ApplicationStatus[] = [
  'applied',
  'shortlisted',
  'interview_scheduled',
  'selected',
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getStageIndex(status: ApplicationStatus): number {
  return STATUS_ORDER.indexOf(status);
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function PipelineNode({
  stage,
  state,
  index,
  timestamp,
  onClick,
  interactive,
}: {
  stage: (typeof MAIN_STAGES)[number] | typeof REJECTED_STAGE;
  state: 'completed' | 'current' | 'future' | 'rejected';
  index: number;
  timestamp?: Date;
  onClick?: () => void;
  interactive: boolean;
}) {
  const Icon = stage.icon;
  const isClickable = interactive && state === 'future';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.45, ease: 'easeOut' }}
      className="flex flex-col items-center gap-2 relative"
    >
      {/* Glow ring for current */}
      {state === 'current' && (
        <motion.div
          className="absolute -inset-2 rounded-full z-0"
          animate={{
            boxShadow: [
              `0 0 12px 2px ${stage.glow}`,
              `0 0 24px 6px ${stage.glow}`,
              `0 0 12px 2px ${stage.glow}`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Node circle */}
      <motion.button
        type="button"
        disabled={!isClickable}
        onClick={onClick}
        whileHover={isClickable ? { scale: 1.12, y: -2 } : undefined}
        whileTap={isClickable ? { scale: 0.95 } : undefined}
        className={`
          relative z-10 w-12 h-12 rounded-full flex items-center justify-center
          transition-all duration-300 border-2 shrink-0
          ${
            state === 'completed'
              ? 'bg-gradient-to-br from-emerald-500 to-teal-500 border-emerald-400/50 shadow-lg shadow-emerald-500/20'
              : state === 'current'
              ? `bg-gradient-to-br ${stage.gradient} border-white/30 shadow-lg`
              : state === 'rejected'
              ? 'bg-gradient-to-br from-rose-500 to-red-600 border-rose-400/50 shadow-lg shadow-rose-500/20'
              : 'bg-white/[0.04] border-white/[0.12]'
          }
          ${isClickable ? 'cursor-pointer hover:border-white/30 hover:bg-white/[0.08]' : 'cursor-default'}
        `}
      >
        {state === 'completed' ? (
          <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
        ) : (
          <Icon
            className={`w-5 h-5 ${
              state === 'current' || state === 'rejected'
                ? 'text-white'
                : 'text-white/30'
            }`}
            strokeWidth={1.8}
          />
        )}

        {/* Pulse ring for current */}
        {state === 'current' && (
          <motion.span
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${stage.gradient}`}
            animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </motion.button>

      {/* Label */}
      <span
        className={`text-xs font-medium whitespace-nowrap ${
          state === 'completed'
            ? 'text-emerald-400'
            : state === 'current'
            ? 'text-white'
            : state === 'rejected'
            ? 'text-rose-400'
            : 'text-white/30'
        }`}
      >
        {stage.label}
      </span>

      {/* Timestamp */}
      {timestamp && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] text-white/25 whitespace-nowrap"
        >
          {formatTimestamp(timestamp)}
        </motion.span>
      )}
    </motion.div>
  );
}

function ConnectorLine({
  state,
  index,
}: {
  state: 'completed' | 'active' | 'future' | 'rejected';
  index: number;
}) {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ delay: index * 0.1 + 0.05, duration: 0.4, ease: 'easeOut' }}
      className="flex-1 flex items-center justify-center min-w-[32px] origin-left"
      style={{ marginTop: '-18px' }} // align to node center
    >
      <div
        className={`h-[2px] w-full rounded-full relative overflow-hidden ${
          state === 'completed'
            ? 'bg-emerald-500/60'
            : state === 'active'
            ? 'bg-gradient-to-r from-emerald-500/60 to-white/10'
            : state === 'rejected'
            ? 'bg-rose-500/40'
            : 'bg-white/[0.08]'
        }`}
      >
        {state === 'active' && (
          <motion.div
            className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-32px', '200px'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>
      {state !== 'rejected' && (
        <ChevronRight
          className={`w-3 h-3 shrink-0 -ml-1 ${
            state === 'completed'
              ? 'text-emerald-500/60'
              : state === 'active'
              ? 'text-white/20'
              : 'text-white/[0.08]'
          }`}
        />
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ApplicationPipeline({
  currentStatus,
  timestamps,
  onStatusChange,
  readonly = true,
}: ApplicationPipelineProps) {
  const isRejected = currentStatus === 'rejected';
  const currentIdx = isRejected
    ? STATUS_ORDER.length // treat as past-the-end
    : getStageIndex(currentStatus);

  // Determine the rejection branch-off point: the last completed stage before rejection
  // If rejected and we have timestamps, figure out which stages were completed
  const rejectedAfterIdx = useMemo(() => {
    if (!isRejected) return -1;
    // Find the latest main stage that has a timestamp
    if (timestamps) {
      for (let i = STATUS_ORDER.length - 1; i >= 0; i--) {
        if (timestamps[STATUS_ORDER[i]]) return i;
      }
    }
    // Default: rejected right after applied
    return 0;
  }, [isRejected, timestamps]);

  function getNodeState(
    stageIdx: number
  ): 'completed' | 'current' | 'future' {
    if (isRejected) {
      return stageIdx <= rejectedAfterIdx ? 'completed' : 'future';
    }
    if (stageIdx < currentIdx) return 'completed';
    if (stageIdx === currentIdx) return 'current';
    return 'future';
  }

  function getLineState(
    afterIdx: number
  ): 'completed' | 'active' | 'future' {
    if (isRejected) {
      return afterIdx <= rejectedAfterIdx ? 'completed' : 'future';
    }
    if (afterIdx < currentIdx) return 'completed';
    if (afterIdx === currentIdx) return 'active';
    return 'future';
  }

  const interactive = !readonly && !!onStatusChange;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card rounded-2xl p-6 md:p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">
          Application Pipeline
        </h3>
        {!readonly && (
          <span className="text-[10px] text-white/25 bg-white/[0.04] rounded-full px-2.5 py-1">
            Click a stage to advance
          </span>
        )}
      </div>

      {/* Pipeline row */}
      <div className="flex items-start">
        {MAIN_STAGES.map((stage, idx) => {
          const nodeState = getNodeState(idx);
          return (
            <React.Fragment key={stage.key}>
              <PipelineNode
                stage={stage}
                state={nodeState}
                index={idx}
                timestamp={timestamps?.[stage.key]}
                interactive={interactive}
                onClick={
                  interactive && nodeState === 'future'
                    ? () => onStatusChange?.(stage.key)
                    : undefined
                }
              />
              {idx < MAIN_STAGES.length - 1 && (
                <ConnectorLine state={getLineState(idx)} index={idx} />
              )}
            </React.Fragment>
          );
        })}

        {/* Rejected branch */}
        {isRejected && (
          <>
            {/* Diagonal connector */}
            <div className="flex items-start ml-2 mt-1" style={{ marginTop: '-18px' }}>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.35 }}
                className="origin-left"
              >
                <svg
                  width="40"
                  height="48"
                  viewBox="0 0 40 48"
                  fill="none"
                  className="shrink-0"
                >
                  <path
                    d="M0 6 Q20 6 32 30 L38 44"
                    stroke="rgba(244,63,94,0.5)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </motion.div>
            </div>
            <div className="mt-5">
              <PipelineNode
                stage={REJECTED_STAGE}
                state="rejected"
                index={5}
                timestamp={timestamps?.rejected}
                interactive={false}
              />
            </div>
          </>
        )}
      </div>

      {/* Status summary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-3"
      >
        <div
          className={`w-2 h-2 rounded-full ${
            isRejected
              ? 'bg-rose-400'
              : currentStatus === 'selected'
              ? 'bg-emerald-400'
              : 'bg-cyan-400'
          }`}
        />
        <span className="text-sm text-white/60">
          Current status:{' '}
          <span
            className={`font-semibold ${
              isRejected
                ? 'text-rose-400'
                : currentStatus === 'selected'
                ? 'text-emerald-400'
                : 'text-white'
            }`}
          >
            {APPLICATION_STATUS_CONFIG[currentStatus]?.label ?? currentStatus}
          </span>
        </span>
      </motion.div>
    </motion.div>
  );
}

export default ApplicationPipeline;
