'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  AlertTriangle,
  Calendar,
  GraduationCap,
  Activity,
  BookOpen,
  Clock,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import SectionCard from './section-card';
import StatCard from './stat-card';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScoreRange {
  label: string;
  value: number;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

interface ClassEngagement {
  label: string;
  value: number;
  color: string;
}

interface WeeklyDay {
  label: string;
  value: number;
  color: string;
}

interface TopStudent {
  rank: number;
  name: string;
  score: number;
  trend: 'up' | 'down' | 'neutral';
}

interface PerformanceAlert {
  id: string;
  name: string;
  className: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const SCORE_DISTRIBUTION: ScoreRange[] = [
  { label: '90-100', value: 15, color: 'bg-emerald-500', gradientFrom: '#10b981', gradientTo: '#34d399' },
  { label: '80-89', value: 25, color: 'bg-sky-500', gradientFrom: '#0ea5e9', gradientTo: '#38bdf8' },
  { label: '70-79', value: 30, color: 'bg-amber-500', gradientFrom: '#f59e0b', gradientTo: '#fbbf24' },
  { label: '60-69', value: 20, color: 'bg-orange-500', gradientFrom: '#f97316', gradientTo: '#fb923c' },
  { label: 'أقل من 60', value: 10, color: 'bg-red-500', gradientFrom: '#ef4444', gradientTo: '#f87171' },
];

const CLASS_ENGAGEMENT: ClassEngagement[] = [
  { label: 'الصف ١-أ', value: 88, color: '#10b981' },
  { label: 'الصف ١-ب', value: 75, color: '#0ea5e9' },
  { label: 'الصف ٢-أ', value: 92, color: '#8b5cf6' },
  { label: 'الصف ٢-ب', value: 68, color: '#f59e0b' },
  { label: 'الصف ٣-أ', value: 85, color: '#ec4899' },
  { label: 'الصف ٣-ب', value: 78, color: '#06b6d4' },
];

const WEEKLY_TREND: WeeklyDay[] = [
  { label: 'الأحد', value: 72, color: '#f59e0b' },
  { label: 'الاثنين', value: 85, color: '#10b981' },
  { label: 'الثلاثاء', value: 68, color: '#0ea5e9' },
  { label: 'الأربعاء', value: 91, color: '#8b5cf6' },
  { label: 'الخميس', value: 78, color: '#ec4899' },
  { label: 'السبت', value: 65, color: '#f97316' },
  { label: 'الجمعة', value: 42, color: '#6b7280' },
];

const TOP_STUDENTS: TopStudent[] = [
  { rank: 1, name: 'سلطان فيصل الشمري', score: 98, trend: 'up' },
  { rank: 2, name: 'أحمد محمد علي', score: 95, trend: 'up' },
  { rank: 3, name: 'فاطمة أحمد حسن', score: 93, trend: 'neutral' },
  { rank: 4, name: 'محمد عبدالرحمن الدوسري', score: 91, trend: 'up' },
  { rank: 5, name: 'لطيفة عايض الحربي', score: 89, trend: 'down' },
];

const PERFORMANCE_ALERTS: PerformanceAlert[] = [
  {
    id: 'alert-1',
    name: 'يزيد ناصر البقمي',
    className: 'الصف الأول - ب',
    issue: 'انخفاض حاد في درجات الرياضيات بنسبة ٢٥٪',
    severity: 'high',
  },
  {
    id: 'alert-2',
    name: 'نورة سعيد القحطاني',
    className: 'الصف الأول - أ',
    issue: 'غياب متكرر (٥ حصص خلال الأسبوعين الماضيين)',
    severity: 'high',
  },
  {
    id: 'alert-3',
    name: 'ريم فهد المطيري',
    className: 'الصف الثاني - ب',
    issue: 'تراجع تدريجي في المشاركة الصفية',
    severity: 'medium',
  },
  {
    id: 'alert-4',
    name: 'عبدالله خالد العتيبي',
    className: 'الصف الثاني - أ',
    issue: 'ضعف في مهارات اللغة العربية',
    severity: 'medium',
  },
  {
    id: 'alert-5',
    name: 'سارة ماجد العنزي',
    className: 'الصف الثالث - أ',
    issue: 'عدم تسليم الواجبات المنزلية بشكل منتظم',
    severity: 'low',
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Animated horizontal bar for score distribution */
function HorizontalBar({
  item,
  maxValue,
  delay,
}: {
  item: ScoreRange;
  maxValue: number;
  delay: number;
}) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const percentage = Math.round((item.value / maxValue) * 100);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-16 text-left shrink-0 font-medium">
        {item.label}
      </span>
      <div className="flex-1 h-8 rounded-lg bg-white/[0.04] overflow-hidden relative">
        <div
          className="h-full rounded-lg transition-all duration-1000 ease-out relative overflow-hidden"
          style={{
            width: animated ? `${percentage}%` : '0%',
            background: `linear-gradient(90deg, ${item.gradientFrom}, ${item.gradientTo})`,
          }}
        >
          {/* Shimmer effect */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              animation: 'shimmer 2s infinite',
            }}
          />
        </div>
      </div>
      <span className="text-sm font-bold text-white tabular-nums w-10 text-center shrink-0">
        {item.value}%
      </span>
    </div>
  );
}

/** Vertical bar with gradient and animation */
function VerticalBar({
  item,
  maxValue,
  delay,
  showLabel = true,
}: {
  item: { label: string; value: number; color: string };
  maxValue: number;
  delay: number;
  showLabel?: boolean;
}) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const height = Math.round((item.value / maxValue) * 100);

  return (
    <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
      {/* Value on top */}
      <span className="text-xs font-bold text-slate-300 tabular-nums">
        {item.value}%
      </span>

      {/* Bar container */}
      <div className="w-full max-w-[40px] h-36 rounded-t-lg bg-white/[0.04] relative overflow-hidden">
        <div
          className="absolute bottom-0 w-full rounded-t-lg transition-all duration-1000 ease-out"
          style={{
            height: animated ? `${height}%` : '0%',
            background: `linear-gradient(180deg, ${item.color}, ${item.color}88)`,
          }}
        >
          {/* Shimmer */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.3), transparent)',
            }}
          />
        </div>
      </div>

      {/* Label below */}
      {showLabel && (
        <span className="text-[10px] text-slate-500 truncate max-w-full text-center leading-tight">
          {item.label}
        </span>
      )}
    </div>
  );
}

/** Trend arrow icon */
function TrendArrow({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-4 w-4 text-emerald-400" />;
    case 'down':
      return <TrendingDown className="h-4 w-4 text-red-400" />;
    case 'neutral':
    default:
      return <Activity className="h-4 w-4 text-slate-400" />;
  }
}

/** Rank medal for top students */
function RankMedal({ rank }: { rank: number }) {
  const colors: Record<number, { bg: string; border: string; text: string }> = {
    1: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400' },
    2: { bg: 'bg-slate-400/20', border: 'border-slate-400/40', text: 'text-slate-300' },
    3: { bg: 'bg-orange-600/20', border: 'border-orange-600/40', text: 'text-orange-400' },
  };

  if (rank > 3) {
    return (
      <span className="flex items-center justify-center h-7 w-7 rounded-full bg-white/[0.06] text-xs font-bold text-slate-400">
        {rank}
      </span>
    );
  }

  const c = colors[rank];
  return (
    <span
      className={cn(
        'flex items-center justify-center h-7 w-7 rounded-full border text-xs font-bold',
        c.bg, c.border, c.text,
      )}
    >
      {rank}
    </span>
  );
}

/** Severity indicator for alerts */
function SeverityBadge({ severity }: { severity: 'high' | 'medium' | 'low' }) {
  const config: Record<string, { text: string; dot: string; bg: string }> = {
    high: { text: 'مرتفع', dot: 'bg-red-500', bg: 'bg-red-500/10 text-red-400' },
    medium: { text: 'متوسط', dot: 'bg-amber-500', bg: 'bg-amber-500/10 text-amber-400' },
    low: { text: 'منخفض', dot: 'bg-sky-500', bg: 'bg-sky-500/10 text-sky-400' },
  };

  const c = config[severity];

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium', c.bg)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
      {c.text}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AnalyticsSection() {
  const { students, exams, classes } = useAppStore();

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* ── Page Title ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#D4A574]/10">
            <BarChart3 className="h-5 w-5 text-[#D4A574]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
              التحليلات والإحصائيات
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              نظرة شاملة على الأداء الأكاديمي والتفاعل الصفي
            </p>
          </div>
        </div>
      </div>

      {/* ── Top Row: 4 Mini Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="متوسط الدرجات"
          value="76.5%"
          status="improved"
          icon={<GraduationCap className="h-5 w-5" />}
          color="#10b981"
          trend="up"
          percentage={76.5}
          subtext="من جميع الاختبارات"
        />
        <StatCard
          label="نسبة الحضور"
          value="94%"
          status="stable"
          icon={<Users className="h-5 w-5" />}
          color="#0ea5e9"
          trend="up"
          percentage={94}
          subtext="خلال الشهر الحالي"
        />
        <StatCard
          label="التفاعل الصفي"
          value="82%"
          status="active"
          icon={<Activity className="h-5 w-5" />}
          color="#8b5cf6"
          trend="up"
          percentage={82}
          subtext="معدل المشاركة العامة"
        />
        <StatCard
          label="عدد الجلسات"
          value={156}
          status="completed"
          icon={<Calendar className="h-5 w-5" />}
          color="#f59e0b"
          trend="neutral"
          subtext="جلسة مكتملة"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution - Full Width on lg:span-2 */}
        <SectionCard
          title="توزيع الدرجات"
          icon={<BarChart3 className="h-4 w-4" />}
          className="lg:col-span-2"
          action={
            <span className="text-xs text-muted-foreground bg-white/[0.04] px-3 py-1.5 rounded-lg">
              إجمالي الطلاب: 120
            </span>
          }
        >
          <div className="flex flex-col gap-3">
            {SCORE_DISTRIBUTION.map((item, index) => (
              <HorizontalBar
                key={item.label}
                item={item}
                maxValue={30}
                delay={200 + index * 120}
              />
            ))}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
              {SCORE_DISTRIBUTION.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span className={cn('h-2.5 w-2.5 rounded-sm', item.color)} />
                  <span className="text-[11px] text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Engagement by Class */}
        <SectionCard
          title="معدل التفاعل حسب الصف"
          icon={<Users className="h-4 w-4" />}
          action={
            <span className="text-xs text-muted-foreground bg-white/[0.04] px-3 py-1.5 rounded-lg">
              ٦ فصول
            </span>
          }
        >
          <div className="flex items-end gap-2 sm:gap-3">
            {CLASS_ENGAGEMENT.map((item, index) => (
              <VerticalBar
                key={item.label}
                item={item}
                maxValue={100}
                delay={300 + index * 100}
              />
            ))}
          </div>
        </SectionCard>

        {/* Weekly Trend */}
        <SectionCard
          title="الاتجاه الأسبوعي"
          icon={<Activity className="h-4 w-4" />}
          action={
            <span className="text-xs text-muted-foreground bg-white/[0.04] px-3 py-1.5 rounded-lg">
              هذا الأسبوع
            </span>
          }
        >
          <div className="flex items-end gap-2 sm:gap-3">
            {WEEKLY_TREND.map((item, index) => (
              <VerticalBar
                key={item.label}
                item={item}
                maxValue={100}
                delay={400 + index * 100}
              />
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Students */}
        <SectionCard
          title="أفضل ٥ طلاب"
          icon={<Award className="h-4 w-4" />}
          action={
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              أداء متميز
            </span>
          }
        >
          <div className="flex flex-col gap-2.5">
            {TOP_STUDENTS.map((student, index) => (
              <div
                key={student.rank}
                className="flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-white/[0.03]"
                style={{
                  backgroundColor: student.rank <= 3 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  border: student.rank <= 3 ? '1px solid rgba(255,255,255,0.04)' : '1px solid transparent',
                }}
              >
                {/* Rank */}
                <RankMedal rank={student.rank} />

                {/* Avatar placeholder */}
                <div
                  className="flex items-center justify-center h-9 w-9 rounded-full shrink-0 text-sm font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${
                      student.rank === 1 ? '#f59e0b33' :
                      student.rank === 2 ? '#94a3b833' :
                      student.rank === 3 ? '#ea580c33' : 'rgba(255,255,255,0.06)'
                    }, transparent)`,
                    color: student.rank === 1 ? '#f59e0b' :
                           student.rank === 2 ? '#94a3b8' :
                           student.rank === 3 ? '#ea580c' : '#9ca3af',
                  }}
                >
                  {student.name.charAt(0)}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {student.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    المركز {student.rank}
                  </p>
                </div>

                {/* Score + Trend */}
                <div className="flex items-center gap-2.5">
                  <TrendArrow trend={student.trend} />
                  <span className="text-sm font-bold text-white tabular-nums min-w-[36px] text-center">
                    {student.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Performance Alerts */}
        <SectionCard
          title="تنبيهات الأداء"
          icon={<AlertTriangle className="h-4 w-4" />}
          action={
            <span className="text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              {PERFORMANCE_ALERTS.length} تنبيهات
            </span>
          }
        >
          <div className="flex flex-col gap-2.5 max-h-[340px] overflow-y-auto scrollbar-thin">
            {PERFORMANCE_ALERTS.map((alert) => (
              <div
                key={alert.id}
                className="rounded-xl p-3.5 transition-all duration-200 hover:bg-white/[0.03] cursor-default"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Severity icon */}
                  <div
                    className={cn(
                      'flex items-center justify-center h-8 w-8 rounded-lg shrink-0 mt-0.5',
                      alert.severity === 'high' ? 'bg-red-500/10' :
                      alert.severity === 'medium' ? 'bg-amber-500/10' : 'bg-sky-500/10',
                    )}
                  >
                    <AlertTriangle
                      className={cn(
                        'h-4 w-4',
                        alert.severity === 'high' ? 'text-red-400' :
                        alert.severity === 'medium' ? 'text-amber-400' : 'text-sky-400',
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-200 truncate">
                        {alert.name}
                      </p>
                      <SeverityBadge severity={alert.severity} />
                    </div>
                    <p className="text-xs text-slate-500 mb-1.5">
                      {alert.className}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {alert.issue}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Shimmer Animation Keyframes ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 9999px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />
    </div>
  );
}
