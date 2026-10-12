'use client'

import { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type Status = 'stable' | 'improved' | 'needs-attention' | 'active' | 'completed' | 'critical'
type Trend = 'up' | 'down' | 'neutral'

interface StatCardProps {
  label: string
  value: string | number
  percentage?: number
  status: Status
  icon: React.ReactNode
  color: string
  trend?: Trend
  subtext?: string
}

const statusConfig: Record<Status, { text: string; colorClass: string; bgClass: string; dotColor: string }> = {
  stable: {
    text: 'مستقر',
    colorClass: 'text-green-400',
    bgClass: 'bg-green-500/10',
    dotColor: '#4ADE80',
  },
  improved: {
    text: 'تحسّن',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10',
    dotColor: '#38BDF8',
  },
  'needs-attention': {
    text: 'يحتاج انتباه',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
    dotColor: '#FBBF24',
  },
  critical: {
    text: 'حرج',
    colorClass: 'text-red-400',
    bgClass: 'bg-red-500/10',
    dotColor: '#EF4444',
  },
  active: {
    text: 'نشط',
    colorClass: 'text-violet-400',
    bgClass: 'bg-violet-500/10',
    dotColor: '#A78BFA',
  },
  completed: {
    text: 'مكتمل',
    colorClass: 'text-green-400',
    bgClass: 'bg-green-500/10',
    dotColor: '#4ADE80',
  },
}

/** Animated number counter — counts from 0 to target */
function AnimatedValue({ value }: { value: string | number }) {
  const numericValue = typeof value === 'number' ? value : parseInt(value, 10)
  const isNumeric = typeof value === 'number' || (!isNaN(numericValue) && String(value) === String(numericValue))
  const [displayed, setDisplayed] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isNumeric || hasAnimated.current) return
    hasAnimated.current = true

    const duration = 800
    const startTime = performance.now()
    const target = numericValue

    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * target))
      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }
    requestAnimationFrame(step)
  }, [isNumeric, numericValue])

  if (!isNumeric) {
    return <span className="animate-number-pop">{value}</span>
  }

  return (
    <span className="animate-number-pop tabular-nums">
      {displayed}
    </span>
  )
}

/** Enhanced progress ring with gradient stroke */
function ProgressRing({ percentage, color }: { percentage: number; color: string }) {
  const radius = 20
  const stroke = 3.5
  const normalizedRadius = radius - stroke
  const circumference = normalizedRadius * 2 * Math.PI
  const [mounted, setMounted] = useState(false)
  const gradientId = `progress-${color.replace('#', '')}`

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const animatedOffset = mounted
    ? circumference - (percentage / 100) * circumference
    : circumference

  return (
    <svg
      height={radius * 2}
      width={radius * 2}
      className="shrink-0"
      style={{ direction: 'ltr' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {/* Background ring */}
      <circle
        stroke="rgba(255,255,255,0.06)"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      {/* Progress ring with gradient */}
      <circle
        stroke={`url(#${gradientId})`}
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        style={{ strokeDashoffset: animatedOffset }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        className="transition-all duration-1000 ease-out"
      />
      {/* Glow filter for the progress ring */}
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        style={{ strokeDashoffset: animatedOffset, filter: `drop-shadow(0 0 4px ${color}40)` }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        className="transition-all duration-1000 ease-out opacity-50"
      />
      {/* Percentage text */}
      <text
        x={radius}
        y={radius}
        textAnchor="middle"
        dominantBaseline="central"
        fill="rgba(255,255,255,0.8)"
        fontSize="10"
        fontWeight="700"
        className="select-none"
      >
        {Math.round(percentage)}%
      </text>
    </svg>
  )
}

function TrendIcon({ trend }: { trend: Trend }) {
  switch (trend) {
    case 'up':
      return (
        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
          <TrendingUp className="h-3.5 w-3.5" />
          صعود
        </span>
      )
    case 'down':
      return (
        <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-400">
          <TrendingDown className="h-3.5 w-3.5" />
          هبوط
        </span>
      )
    case 'neutral':
    default:
      return (
        <span className="flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
          <Minus className="h-3.5 w-3.5" />
        </span>
      )
  }
}

export default function StatCard({
  label,
  value,
  percentage,
  status,
  icon,
  color,
  trend,
  subtext,
}: StatCardProps) {
  const statusInfo = statusConfig[status]

  return (
    <div
      className="group relative rounded-xl bg-[#1A1A24] border border-white/[0.06] p-5 cursor-default
        transition-all duration-300 ease-out
        hover:-translate-y-1 hover:shadow-xl hover:shadow-black/25
        hover:border-[#D4A574]/20"
      style={{
        backgroundColor: '#1A1A24',
      }}
    >
      {/* ── Animated gradient border on hover ── */}
      <div
        className="pointer-events-none absolute -inset-[1px] rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `conic-gradient(from 0deg, ${color}40, transparent 30%, transparent 70%, ${color}40)`,
          zIndex: -1,
        }}
      />

      {/* ── Subtle gradient overlay at top ── */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-20 rounded-t-xl opacity-50"
        style={{
          background: `linear-gradient(180deg, ${color}08 0%, transparent 100%)`,
        }}
      />

      {/* ── Top row: icon container with gradient + status badge with pulse dot ── */}
      <div className="relative flex items-center justify-between mb-4">
        {/* Icon container with gradient background and glow */}
        <div
          className="flex items-center justify-center h-11 w-11 rounded-xl transition-all duration-300 group-hover:scale-110 animate-icon-glow"
          style={{
            background: `linear-gradient(135deg, ${color}18, ${color}08)`,
            boxShadow: `0 2px 12px ${color}15`,
            '--glow-color': `${color}25`,
          } as React.CSSProperties}
        >
          <div style={{ color }} className="transition-colors duration-300">
            {icon}
          </div>
        </div>

        {/* Status badge with pulse dot */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusInfo.colorClass} ${statusInfo.bgClass}`}
        >
          <span
            className="status-dot h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: statusInfo.dotColor }}
          />
          {statusInfo.text}
        </span>
      </div>

      {/* ── Middle: animated value + trend ── */}
      <div className="relative flex items-center gap-2 mb-2">
        <span className="text-3xl font-bold text-white tracking-tight leading-none shimmer-card inline-block py-1 px-2 -mx-2 rounded stat-value-glow">
          <AnimatedValue value={value} />
        </span>
        {trend && <TrendIcon trend={trend} />}
      </div>

      {/* ── Bottom: label + subtext + enhanced progress ring ── */}
      <div className="relative flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-muted-foreground font-medium">
            {label}
          </span>
          {subtext && (
            <span className="text-xs text-muted-foreground/60 leading-relaxed">
              {subtext}
            </span>
          )}
        </div>

        {percentage !== undefined && (
          <ProgressRing percentage={percentage} color={color} />
        )}
      </div>

      {/* Subtle gradient shine on hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 0%), rgba(255,255,255,0.03), transparent 60%)',
        }}
      />
    </div>
  )
}
