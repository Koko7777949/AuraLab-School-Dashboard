'use client'


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

const statusConfig: Record<Status, { text: string; colorClass: string; bgClass: string }> = {
  stable: {
    text: 'مستقر',
    colorClass: 'text-green-400',
    bgClass: 'bg-green-500/10',
  },
  improved: {
    text: 'تحسّن',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10',
  },
  'needs-attention': {
    text: 'يحتاج انتباه',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
  },
  critical: {
    text: 'حرج',
    colorClass: 'text-red-400',
    bgClass: 'bg-red-500/10',
  },
  active: {
    text: 'نشط',
    colorClass: 'text-violet-400',
    bgClass: 'bg-violet-500/10',
  },
  completed: {
    text: 'مكتمل',
    colorClass: 'text-green-400',
    bgClass: 'bg-green-500/10',
  },
}

function ProgressRing({ percentage, color }: { percentage: number; color: string }) {
  const radius = 16
  const stroke = 3
  const normalizedRadius = radius - stroke
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <svg
      height={radius * 2}
      width={radius * 2}
      className="shrink-0"
      style={{ direction: 'ltr' }}
    >
      {/* Background ring */}
      <circle
        stroke="rgba(255,255,255,0.08)"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      {/* Progress ring */}
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        style={{ strokeDashoffset }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        className="transition-all duration-700 ease-out"
      />
      {/* Percentage text */}
      <text
        x={radius}
        y={radius}
        textAnchor="middle"
        dominantBaseline="central"
        fill="rgba(255,255,255,0.7)"
        fontSize="9"
        fontWeight="600"
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
      return <TrendingUp className="h-4 w-4 text-green-400" />
    case 'down':
      return <TrendingDown className="h-4 w-4 text-red-400" />
    case 'neutral':
    default:
      return <Minus className="h-4 w-4 text-slate-400" />
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
      className="group relative rounded-xl bg-[#1A1A24] border border-white/[0.06] p-5 transition-all duration-300 ease-out cursor-default hover:-translate-y-0.5 hover:border-amber-500/20"
      style={{
        backgroundColor: '#1A1A24',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow =
          '0 8px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(245,158,11,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* ── Top row: icon + status badge ── */}
      <div className="flex items-center justify-between mb-4">
        {/* Icon container */}
        <div
          className="flex items-center justify-center h-10 w-10 rounded-full transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${color}15` }}
        >
          <div style={{ color }} className="transition-colors duration-300">
            {icon}
          </div>
        </div>

        {/* Status badge */}
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusInfo.colorClass} ${statusInfo.bgClass}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
          {statusInfo.text}
        </span>
      </div>

      {/* ── Middle: value + trend ── */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-3xl font-bold text-white tracking-tight leading-none">
          {value}
        </span>
        {trend && <TrendIcon trend={trend} />}
      </div>

      {/* ── Bottom: label + subtext + ring ── */}
      <div className="flex items-center justify-between">
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
