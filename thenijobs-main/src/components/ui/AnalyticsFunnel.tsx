'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingDown, BarChart3 } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FunnelStage {
  label: string;
  count: number;
  color: string;
}

interface AnalyticsFunnelProps {
  title: string;
  stages: FunnelStage[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getDropOff(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round((current / previous) * 100);
}

function getOverallConversion(stages: FunnelStage[]): number {
  if (stages.length < 2 || stages[0].count === 0) return 0;
  return Math.round((stages[stages.length - 1].count / stages[0].count) * 100);
}

/* ------------------------------------------------------------------ */
/*  Tooltip                                                            */
/* ------------------------------------------------------------------ */

function FunnelTooltip({
  stage,
  prevStage,
  firstStage,
  position,
}: {
  stage: FunnelStage;
  prevStage?: FunnelStage;
  firstStage: FunnelStage;
  position: { x: number; y: number };
}) {
  const fromPrev = prevStage ? getDropOff(stage.count, prevStage.count) : 100;
  const fromFirst =
    firstStage.count > 0
      ? Math.round((stage.count / firstStage.count) * 100)
      : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute z-50 pointer-events-none"
      style={{
        left: position.x,
        top: position.y - 8,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="bg-[#12122a]/95 backdrop-blur-xl border border-white/[0.12] rounded-xl px-4 py-3 shadow-2xl min-w-[180px]">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <span className="text-sm font-semibold text-white">{stage.label}</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-[11px] text-white/40">Count</span>
            <span className="text-[11px] font-semibold text-white">
              {stage.count.toLocaleString()}
            </span>
          </div>
          {prevStage && (
            <div className="flex justify-between">
              <span className="text-[11px] text-white/40">
                From {prevStage.label}
              </span>
              <span className="text-[11px] font-semibold text-cyan-400">
                {fromPrev}%
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[11px] text-white/40">Overall</span>
            <span className="text-[11px] font-semibold text-violet-400">
              {fromFirst}%
            </span>
          </div>
        </div>
        {/* Tooltip arrow */}
        <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-[#12122a]/95 border-r border-b border-white/[0.12] rotate-45" />
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Single funnel stage bar                                            */
/* ------------------------------------------------------------------ */

function FunnelBar({
  stage,
  index,
  total,
  maxCount,
  prevStage,
  firstStage,
}: {
  stage: FunnelStage;
  index: number;
  total: number;
  maxCount: number;
  prevStage?: FunnelStage;
  firstStage: FunnelStage;
}) {
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Width narrows progressively (minimum 20%)
  const widthPct = maxCount > 0 ? Math.max(20, (stage.count / maxCount) * 100) : 20;
  const prevPct = prevStage
    ? getDropOff(stage.count, prevStage.count)
    : 100;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: 0,
    });
  }

  return (
    <div className="relative" style={{ zIndex: hovered ? 20 : 1 }}>
      <AnimatePresence>
        {hovered && (
          <FunnelTooltip
            stage={stage}
            prevStage={prevStage}
            firstStage={firstStage}
            position={tooltipPos}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{
          delay: index * 0.12,
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="origin-left"
      >
        <div
          className="flex items-center gap-4 group cursor-default"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onMouseMove={handleMouseMove}
        >
          {/* Label */}
          <div className="w-24 shrink-0 text-right">
            <span
              className={`text-xs font-medium transition-colors duration-200 ${
                hovered ? 'text-white' : 'text-white/50'
              }`}
            >
              {stage.label}
            </span>
          </div>

          {/* Bar */}
          <div className="flex-1 relative">
            <div className="h-10 bg-white/[0.03] rounded-lg overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${widthPct}%` }}
                transition={{
                  delay: index * 0.12 + 0.15,
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`h-full rounded-lg relative overflow-hidden transition-all duration-200 ${
                  hovered ? 'brightness-125' : ''
                }`}
                style={{
                  backgroundColor: stage.color,
                  opacity: 0.85,
                }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{
                    delay: index * 0.12 + 0.8,
                    duration: 1.2,
                    ease: 'easeInOut',
                  }}
                />

                {/* Inner gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
              </motion.div>
            </div>
          </div>

          {/* Count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.12 + 0.4 }}
            className="w-14 shrink-0 text-right"
          >
            <span className="text-sm font-bold text-white font-outfit">
              {stage.count.toLocaleString()}
            </span>
          </motion.div>

          {/* Conversion from previous */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.12 + 0.5 }}
            className="w-14 shrink-0"
          >
            {prevStage ? (
              <div className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-white/20" />
                <span
                  className={`text-xs font-semibold ${
                    prevPct >= 60
                      ? 'text-emerald-400'
                      : prevPct >= 30
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {prevPct}%
                </span>
              </div>
            ) : (
              <span className="text-xs text-white/20">—</span>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Connecting line between bars */}
      {index < total - 1 && (
        <div className="flex items-center ml-28 pl-4">
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: index * 0.12 + 0.3, duration: 0.3 }}
            className="w-px h-2 bg-white/[0.06] origin-top"
          />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function AnalyticsFunnel({ title, stages }: AnalyticsFunnelProps) {
  const maxCount = stages.length > 0 ? Math.max(...stages.map((s) => s.count)) : 0;
  const overallConversion = getOverallConversion(stages);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass-card rounded-2xl p-6 md:p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-violet-500/15 rounded-xl p-2.5">
            <BarChart3 className="w-5 h-5 text-violet-400" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white font-outfit">
              {title}
            </h3>
            <p className="text-xs text-white/30 mt-0.5">
              Conversion funnel analysis
            </p>
          </div>
        </div>

        {/* Overall conversion badge */}
        {stages.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-xl px-3 py-2"
          >
            <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
              Overall
            </span>
            <span
              className={`text-lg font-bold font-outfit ${
                overallConversion >= 5
                  ? 'text-emerald-400'
                  : overallConversion >= 2
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {overallConversion}%
            </span>
          </motion.div>
        )}
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-4 mb-3 text-[10px] text-white/20 uppercase tracking-wider font-medium">
        <div className="w-24 shrink-0 text-right">Stage</div>
        <div className="flex-1">Distribution</div>
        <div className="w-14 shrink-0 text-right">Count</div>
        <div className="w-14 shrink-0">Rate</div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06] mb-4" />

      {/* Funnel bars */}
      <div className="space-y-0">
        {stages.map((stage, idx) => (
          <FunnelBar
            key={`${stage.label}-${idx}`}
            stage={stage}
            index={idx}
            total={stages.length}
            maxCount={maxCount}
            prevStage={idx > 0 ? stages[idx - 1] : undefined}
            firstStage={stages[0]}
          />
        ))}
      </div>

      {/* Summary */}
      {stages.length >= 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: stages.length * 0.12 + 0.5 }}
          className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: stages[0].color }}
              />
              <span className="text-xs text-white/30">
                {stages[0].label}:{' '}
                <span className="text-white/60 font-medium">
                  {stages[0].count.toLocaleString()}
                </span>
              </span>
            </div>
            <span className="text-white/10">→</span>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: stages[stages.length - 1].color }}
              />
              <span className="text-xs text-white/30">
                {stages[stages.length - 1].label}:{' '}
                <span className="text-white/60 font-medium">
                  {stages[stages.length - 1].count.toLocaleString()}
                </span>
              </span>
            </div>
          </div>

          <span className="text-[10px] text-white/20">
            {stages.length} stages
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

export default AnalyticsFunnel;
