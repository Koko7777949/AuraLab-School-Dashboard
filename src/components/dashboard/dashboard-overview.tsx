'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BookOpen,
  Eye,
  MessageSquare,
  Users,
  Award,
  Video,
  Bell,
  Map,
  UserCheck,
  BookMarked,
  UserPlus,
  FileText,
  BarChart3,
  X,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  UserX,
  Timer,
  ChevronLeft,
  GraduationCap,
} from 'lucide-react';
import StatCard from './stat-card';
import SectionCard from './section-card';
import SessionTimer from './session-timer';
import { useAppStore } from '@/lib/store';
import type { DashboardStats } from '@/lib/types';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const weeklyInteractionData = [
  { day: 'السبت', value: 72, color: 'from-amber-500 to-amber-400' },
  { day: 'الأحد', value: 85, color: 'from-amber-500 to-amber-400' },
  { day: 'الاثنين', value: 64, color: 'from-amber-500 to-amber-400' },
  { day: 'الثلاثاء', value: 91, color: 'from-amber-500 to-amber-400' },
  { day: 'الأربعاء', value: 78, color: 'from-amber-500 to-amber-400' },
  { day: 'الخميس', value: 56, color: 'from-amber-500 to-amber-400' },
  { day: 'الجمعة', value: 30, color: 'from-amber-500/40 to-amber-400/40' },
];

const notificationsData = [
  {
    id: 1,
    text: 'تم تسجيل حضور 28 طالب من أصل 32 في حصة الرياضيات',
    time: 'منذ 5 دقائق',
    status: 'success' as const,
  },
  {
    id: 2,
    text: 'تنبيه: الطالب أحمد محمد غاب عن 3 حصص متتالية',
    time: 'منذ 20 دقيقة',
    status: 'warning' as const,
  },
  {
    id: 3,
    text: 'نتائج اختبار العلوم متاحة الآن للمراجعة',
    time: 'منذ ساعة',
    status: 'info' as const,
  },
  {
    id: 4,
    text: 'تم تحديث المنهج الدراسي لمادة اللغة العربية',
    time: 'منذ ساعتين',
    status: 'info' as const,
  },
  {
    id: 5,
    text: 'موعد اجتماع أولياء الأمور يوم الخميس القادم',
    time: 'منذ 3 ساعات',
    status: 'neutral' as const,
  },
];

const attendanceData = [
  { label: 'حاضر', percentage: 85, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
  { label: 'متأخر', percentage: 8, color: 'bg-amber-500', textColor: 'text-amber-400' },
  { label: 'غائب', percentage: 7, color: 'bg-rose-500', textColor: 'text-rose-400' },
];

const notificationStatusStyles = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  info: 'bg-sky-500',
  neutral: 'bg-slate-500',
};

// Attendance Quick Tracker pill data
const attendancePills = [
  {
    id: 'present',
    label: 'حاضر',
    percentage: 85,
    count: 27,
    color: '#10b981',
    borderColor: 'border-emerald-500/60',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    icon: UserCheck,
  },
  {
    id: 'late',
    label: 'متأخر',
    percentage: 8,
    count: 3,
    color: '#f59e0b',
    borderColor: 'border-amber-500/60',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    icon: Clock,
  },
  {
    id: 'absent',
    label: 'غائب',
    percentage: 7,
    count: 2,
    color: '#f43f5e',
    borderColor: 'border-rose-500/60',
    bgColor: 'bg-rose-500/10',
    textColor: 'text-rose-400',
    icon: UserX,
  },
  {
    id: 'excused',
    label: 'مستأذن',
    percentage: 3,
    count: 1,
    color: '#38bdf8',
    borderColor: 'border-sky-500/60',
    bgColor: 'bg-sky-500/10',
    textColor: 'text-sky-400',
    icon: AlertTriangle,
  },
];

// Today's schedule mock data
const todaySchedule = [
  {
    id: 1,
    time: '07:30 - 08:15',
    subject: 'اللغة العربية',
    teacher: 'أ. فاطمة الحربي',
    room: 'قاعة 101',
    status: 'completed' as const,
  },
  {
    id: 2,
    time: '08:30 - 09:15',
    subject: 'الرياضيات',
    teacher: 'أ. خالد العتيبي',
    room: 'قاعة 204',
    status: 'current' as const,
  },
  {
    id: 3,
    time: '09:30 - 10:15',
    subject: 'العلوم',
    teacher: 'أ. سارة القحطاني',
    room: 'مختبر 3',
    status: 'upcoming' as const,
  },
  {
    id: 4,
    time: '10:30 - 11:15',
    subject: 'التربية البدنية',
    teacher: 'أ. ماجد الدوسري',
    room: 'الملعب',
    status: 'upcoming' as const,
  },
];

// Student performance (grade distribution) data
const gradeDistribution = [
  { label: 'ممتاز', range: '90+', count: 8, maxCount: 12, color: '#10b981', gradientFrom: '#10b981', gradientTo: '#34d399' },
  { label: 'جيد جدا', range: '80-89', count: 10, maxCount: 12, color: '#38bdf8', gradientFrom: '#38bdf8', gradientTo: '#7dd3fc' },
  { label: 'جيد', range: '70-79', count: 7, maxCount: 12, color: '#f59e0b', gradientFrom: '#f59e0b', gradientTo: '#fbbf24' },
  { label: 'مقبول', range: '60-69', count: 5, maxCount: 12, color: '#f97316', gradientFrom: '#f97316', gradientTo: '#fb923c' },
  { label: 'راسب', range: '<60', count: 2, maxCount: 12, color: '#f43f5e', gradientFrom: '#f43f5e', gradientTo: '#fb7185' },
];

// Upcoming events mock data
const upcomingEvents = [
  {
    id: 1,
    title: 'اجتماع أولياء الأمور',
    description: 'الخميس 10:00 صباحاً',
    icon: Calendar,
    borderColor: 'border-r-amber-500',
    bgColor: 'bg-amber-500/8',
    iconColor: 'text-amber-400',
  },
  {
    id: 2,
    title: 'اختبار نهاية الفصل',
    description: 'الأحد الأسبوع القادم',
    icon: Timer,
    borderColor: 'border-r-rose-500',
    bgColor: 'bg-rose-500/8',
    iconColor: 'text-rose-400',
  },
  {
    id: 3,
    title: 'نشاط رياضي مدرسي',
    description: 'الثلاثاء 2:00 مساءً',
    icon: Trophy,
    borderColor: 'border-r-emerald-500',
    bgColor: 'bg-emerald-500/8',
    iconColor: 'text-emerald-400',
  },
  {
    id: 4,
    title: 'ورشة عمل تربوية',
    description: 'الأربعاء 11:00 صباحاً',
    icon: GraduationCap,
    borderColor: 'border-r-sky-500',
    bgColor: 'bg-sky-500/8',
    iconColor: 'text-sky-400',
  },
];

// ---------------------------------------------------------------------------
// Quick action buttons config (expanded to 6)
// ---------------------------------------------------------------------------

const QUICK_ACTIONS = [
  {
    id: 'students' as const,
    label: 'إضافة طالب جديد',
    icon: UserPlus,
    description: 'تسجيل طالب جديد في النظام',
  },
  {
    id: 'exams' as const,
    label: 'إنشاء امتحان',
    icon: FileText,
    description: 'إعداد امتحان جديد للطلاب',
  },
  {
    id: 'analytics' as const,
    label: 'عرض التقارير',
    icon: BarChart3,
    description: 'مراجعة التقارير والتحليلات',
  },
  {
    id: 'notifications' as const,
    label: 'إرسال إشعار',
    icon: Bell,
    description: 'إرسال إشعار للمعلمين والطلاب',
  },
  {
    id: 'sessions' as const,
    label: 'تسجيل حضور',
    icon: UserCheck,
    description: 'تسجيل حضور الطلاب للحصة',
  },
  {
    id: 'notifications' as const,
    label: 'إدارة الإشعارات',
    icon: Bell,
    description: 'عرض وإدارة جميع الإشعارات',
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function WeeklyBarChart() {
  const maxValue = 100;

  return (
    <div className="flex items-end justify-between gap-2 h-48 px-1">
      {weeklyInteractionData.map((item) => {
        const height = (item.value / maxValue) * 100;
        return (
          <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
            {/* Value tooltip */}
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">
              {item.value}%
            </span>
            {/* Bar */}
            <div className="relative w-full flex items-end" style={{ height: '140px' }}>
              <div
                className={`w-full rounded-t-lg bg-gradient-to-t ${item.color} transition-all duration-500 ease-out`}
                style={{ height: `${height}%` }}
              />
            </div>
            {/* Day label */}
            <span className="text-[11px] font-medium text-muted-foreground/70 whitespace-nowrap">
              {item.day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function NotificationItem({
  text,
  time,
  status,
}: {
  text: string;
  time: string;
  status: keyof typeof notificationStatusStyles;
}) {
  return (
    <div className="flex items-start gap-3 py-3 transition-colors duration-200 hover:bg-white/[0.02] rounded-lg px-2 -mx-2">
      {/* Status dot */}
      <div className="mt-1.5 shrink-0">
        <span
          className={`block h-2.5 w-2.5 rounded-full ${notificationStatusStyles[status]}`}
        />
      </div>
      {/* Content */}
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-sm leading-relaxed text-slate-300 line-clamp-2">{text}</p>
        <span className="text-[11px] text-muted-foreground/50 font-medium">{time}</span>
      </div>
    </div>
  );
}

function ClassroomMapPlaceholder() {
  // Simulated 4x5 classroom grid
  const rows = 5;
  const cols = 4;
  const occupiedSeats = new Set([1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 18, 19, 20, 22, 24]);

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      {/* Teacher desk */}
      <div className="rounded-lg bg-[#D4A574]/15 border border-[#D4A574]/20 px-8 py-2">
        <span className="text-xs font-medium text-[#D4A574]">منصة المعلم</span>
      </div>

      {/* Seats grid */}
      <div className="grid gap-2 w-full" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: rows * cols }, (_, i) => {
          const isOccupied = occupiedSeats.has(i);
          return (
            <div
              key={i}
              className={`aspect-square rounded-md flex items-center justify-center transition-all duration-300 ${
                isOccupied
                  ? 'bg-emerald-500/15 border border-emerald-500/20'
                  : 'bg-white/[0.03] border border-white/[0.06]'
              }`}
            >
              {isOccupied ? (
                <UserCheck className="h-3.5 w-3.5 text-emerald-400/60" />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground/60">
        <div className="flex items-center gap-1.5">
          <span className="block h-2 w-2 rounded-sm bg-emerald-500/40" />
          حاضر
        </div>
        <div className="flex items-center gap-1.5">
          <span className="block h-2 w-2 rounded-sm bg-white/10" />
          غائب
        </div>
      </div>
    </div>
  );
}

function AttendanceDistribution() {
  return (
    <div className="flex flex-col gap-5">
      {attendanceData.map((item) => (
        <div key={item.label} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">{item.label}</span>
            <span className={`text-sm font-semibold tabular-nums ${item.textColor}`}>
              {item.percentage}%
            </span>
          </div>
          {/* Bar track */}
          <div className="h-3 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full ${item.color} transition-all duration-700 ease-out`}
              style={{ width: `${item.percentage}%` }}
            />
          </div>
        </div>
      ))}

      {/* Summary */}
      <div
        className="mt-1 rounded-lg p-3"
        style={{
          backgroundColor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground/60">إجمالي الطلاب المسجلين</span>
          <span className="text-sm font-bold text-white tabular-nums">32 طالب</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NEW: Attendance Quick Tracker Pill
// ---------------------------------------------------------------------------

function AttendancePill({
  label,
  percentage,
  count,
  color,
  borderColor,
  bgColor,
  textColor,
  icon: Icon,
  onClick,
  isActive,
}: {
  label: string;
  percentage: number;
  count: number;
  color: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  icon: React.ElementType;
  onClick: () => void;
  isActive: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-xl border-r-[3px] ${borderColor} ${bgColor} px-4 py-3
        transition-all duration-300 ease-out cursor-pointer
        hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)]
        active:translate-y-0 active:shadow-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/50
        ${isActive ? 'ring-1 ring-white/10 bg-opacity-100' : ''}`}
    >
      {/* Icon */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{label}</span>
          <span className={`text-sm font-bold tabular-nums ${textColor}`}>{percentage}%</span>
        </div>
        {/* Mini progress track */}
        <div className="h-1.5 w-24 rounded-full bg-white/[0.08] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${percentage}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>

      {/* Count on click */}
      {isActive && (
        <div
          className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-lg animate-scale-in"
          style={{ backgroundColor: color }}
        >
          {count}
        </div>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// NEW: Today's Schedule Widget
// ---------------------------------------------------------------------------

function TodayScheduleWidget() {
  const statusConfig = {
    completed: {
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      lineColor: 'bg-emerald-500/30',
      dotColor: 'bg-emerald-500',
      label: 'مكتمل',
      icon: CheckCircle2,
    },
    current: {
      color: 'text-[#D4A574]',
      bgColor: 'bg-[#D4A574]/10',
      borderColor: 'border-[#D4A574]/30',
      lineColor: 'bg-[#D4A574]/20',
      dotColor: 'bg-[#D4A574]',
      label: 'جارٍ حالياً',
      icon: Clock,
    },
    upcoming: {
      color: 'text-slate-400',
      bgColor: 'bg-white/[0.03]',
      borderColor: 'border-white/[0.06]',
      lineColor: 'bg-white/[0.06]',
      dotColor: 'bg-white/20',
      label: 'قادم',
      icon: ChevronLeft,
    },
  };

  return (
    <div className="flex flex-col gap-0">
      {todaySchedule.map((period, index) => {
        const config = statusConfig[period.status];
        const StatusIcon = config.icon;
        const isCurrent = period.status === 'current';

        return (
          <div key={period.id} className="flex gap-4">
            {/* Timeline column */}
            <div className="flex flex-col items-center">
              {/* Dot */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`h-3 w-3 rounded-full ${config.dotColor} z-10
                    ${isCurrent ? 'animate-pulse-glow' : ''}`}
                />
                {isCurrent && (
                  <div
                    className="absolute h-3 w-3 rounded-full animate-ping opacity-40"
                    style={{ backgroundColor: '#D4A574' }}
                  />
                )}
              </div>
              {/* Connector line */}
              {index < todaySchedule.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-[40px] ${config.lineColor}`} />
              )}
            </div>

            {/* Content card */}
            <div
              className={`flex-1 rounded-lg border ${config.borderColor} ${config.bgColor} px-4 py-3 mb-3
                transition-all duration-300
                ${isCurrent ? 'shadow-[0_0_20px_rgba(212,165,116,0.08)]' : ''}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{period.subject}</span>
                  {isCurrent && (
                    <span className="flex items-center gap-1 rounded-full bg-[#D4A574]/15 px-2 py-0.5 text-[10px] font-medium text-[#D4A574]">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4A574] opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#D4A574]" />
                      </span>
                      {config.label}
                    </span>
                  )}
                </div>
                <span className="text-[11px] tabular-nums text-muted-foreground/60">{period.time}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
                <span className="flex items-center gap-1">
                  <BookMarked className="h-3 w-3" />
                  {period.teacher}
                </span>
                <span className="flex items-center gap-1">
                  <Map className="h-3 w-3" />
                  {period.room}
                </span>
              </div>
              {period.status === 'completed' && (
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500/60" />
                  <span className="text-[10px] text-emerald-500/60 font-medium">تم التنفيذ</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NEW: Student Performance Summary (Grade Distribution Bar Chart)
// ---------------------------------------------------------------------------

function StudentPerformanceChart() {
  return (
    <div className="flex flex-col gap-4">
      {/* Bars */}
      <div className="flex flex-col gap-3">
        {gradeDistribution.map((grade, index) => {
          const barWidth = (grade.count / grade.maxCount) * 100;
          return (
            <div key={grade.label} className="flex items-center gap-3">
              {/* Label */}
              <div className="w-20 shrink-0 text-right">
                <span className="text-xs font-semibold text-slate-300">{grade.label}</span>
                <span className="block text-[10px] text-muted-foreground/50 tabular-nums">{grade.range}</span>
              </div>
              {/* Bar */}
              <div className="flex-1 h-6 rounded-md bg-white/[0.04] overflow-hidden relative">
                <div
                  className="h-full rounded-md transition-all duration-1000 ease-out relative overflow-hidden"
                  style={{
                    width: `${barWidth}%`,
                    background: `linear-gradient(to left, ${grade.gradientFrom}, ${grade.gradientTo})`,
                    transitionDelay: `${index * 150}ms`,
                  }}
                >
                  {/* Shimmer overlay */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: 'linear-gradient(to left, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                    }}
                  />
                </div>
              </div>
              {/* Count */}
              <span
                className="w-6 text-left text-xs font-bold tabular-nums"
                style={{ color: grade.color }}
              >
                {grade.count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div
        className="rounded-lg p-3 flex items-center justify-between"
        style={{
          backgroundColor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span className="text-xs text-muted-foreground/60">إجمالي الطلاب</span>
        <span className="text-sm font-bold text-white tabular-nums">
          {gradeDistribution.reduce((sum, g) => sum + g.count, 0)} طالب
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NEW: Upcoming Events Section
// ---------------------------------------------------------------------------

function UpcomingEventsList() {
  return (
    <div className="flex flex-col gap-2.5">
      {upcomingEvents.map((event) => {
        const EventIcon = event.icon;
        return (
          <div
            key={event.id}
            className={`group flex items-center gap-3 rounded-lg border-r-[3px] ${event.borderColor} ${event.bgColor}
              px-4 py-3 transition-all duration-300
              hover:bg-white/[0.04] hover:-translate-x-0.5 cursor-pointer`}
          >
            {/* Icon */}
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110"
              style={{
                backgroundColor: `${event.iconColor === 'text-amber-400' ? 'rgba(245,158,11,0.1)' : event.iconColor === 'text-rose-400' ? 'rgba(244,63,94,0.1)' : event.iconColor === 'text-emerald-400' ? 'rgba(16,185,129,0.1)' : 'rgba(56,189,248,0.1)'}`,
              }}
            >
              <EventIcon className={`h-4 w-4 ${event.iconColor}`} />
            </div>

            {/* Content */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-semibold text-white group-hover:text-[#D4A574] transition-colors duration-200">
                {event.title}
              </span>
              <span className="text-xs text-muted-foreground/60">{event.description}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton placeholder
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse" dir="rtl">
      {/* Title skeleton */}
      <div className="flex flex-col gap-3">
        <div className="h-8 w-56 rounded-lg bg-white/[0.06]" />
        <div className="h-5 w-80 rounded-lg bg-white/[0.04]" />
      </div>
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-[#1A1A24] border border-white/[0.06] p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-full bg-white/[0.06]" />
              <div className="h-5 w-16 rounded-full bg-white/[0.04]" />
            </div>
            <div className="h-8 w-20 rounded-lg bg-white/[0.06] mb-2" />
            <div className="h-4 w-32 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Welcome Banner
// ---------------------------------------------------------------------------

function WelcomeBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-5 animate-fade-in-up"
      style={{
        background: 'linear-gradient(135deg, rgba(212,165,116,0.15) 0%, rgba(212,165,116,0.05) 100%)',
        border: '1px solid rgba(212,165,116,0.15)',
        borderRight: '4px solid rgba(212,165,116,0.6)',
      }}
    >
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        aria-label="إغلاق"
        className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-md text-[#8B8B9E] transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
      >
        <X size={16} strokeWidth={2} />
      </button>

      {/* Content */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            مرحباً، أحمد محمد 👋
          </h2>
          <p className="text-sm text-[#C4C4D4] mt-1">
            يوم دراسي جديد — لديك 3 حصص اليوم و 12 تنبيه جديد
          </p>
        </div>
      </div>

      {/* Decorative gradient orb */}
      <div
        className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #D4A574, transparent 70%)' }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick Action Button
// ---------------------------------------------------------------------------

function QuickActionButton({
  label,
  description,
  icon: Icon,
  onClick,
}: {
  label: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-[#1A1A24] p-4 text-right
        transition-all duration-300 ease-out
        hover:border-[#D4A574]/20 hover:bg-[#1E1E2A] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.25)]
        active:translate-y-0 active:shadow-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/50"
    >
      {/* Icon */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-110"
        style={{ backgroundColor: 'rgba(212,165,116,0.1)' }}
      >
        <Icon className="h-5 w-5 text-[#D4A574]" size={20} strokeWidth={1.8} />
      </div>

      {/* Text */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-semibold text-white group-hover:text-[#D4A574] transition-colors duration-200">
          {label}
        </span>
        <span className="text-xs text-muted-foreground/60 truncate">
          {description}
        </span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// KPI Card Data
// ---------------------------------------------------------------------------

interface KpiCardConfig {
  label: string;
  value: string;
  percentage?: number;
  status: 'stable' | 'improved' | 'needs-attention' | 'active' | 'completed' | 'critical';
  icon: React.ReactNode;
  color: string;
  subtext: string;
}

function buildKpiCards(stats: DashboardStats | null): KpiCardConfig[] {
  const totalStudents = stats?.totalStudents ?? 320;
  const topStudentsCount = stats?.topStudents?.length ?? 24;

  return [
    {
      label: 'التحصيل الأكاديمي',
      value: stats ? `${Math.round(stats.avgScore)}%` : '87%',
      percentage: stats ? Math.round(stats.avgScore) : 87,
      status: 'stable',
      icon: <BookOpen className="h-5 w-5" />,
      color: '#10b981',
      subtext: 'مقارنة بالفصل السابق',
    },
    {
      label: 'التركيز والانتباه',
      value: stats ? `${Math.round(stats.avgFocus)}%` : '78%',
      percentage: stats ? Math.round(stats.avgFocus) : 78,
      status: 'improved',
      icon: <Eye className="h-5 w-5" />,
      color: '#38bdf8',
      subtext: '+5% عن الأسبوع الماضي',
    },
    {
      label: 'التفاعل الصفي',
      value: stats ? `${Math.round(stats.avgEngagement)}%` : '65%',
      percentage: stats ? Math.round(stats.avgEngagement) : 65,
      status: 'needs-attention',
      icon: <MessageSquare className="h-5 w-5" />,
      color: '#f59e0b',
      subtext: 'يحتاج متابعة إضافية',
    },
    {
      label: 'المشاركة',
      value: '82%',
      percentage: 82,
      status: 'improved',
      icon: <Users className="h-5 w-5" />,
      color: '#8b5cf6',
      subtext: '+3% عن الأسبوع الماضي',
    },
    {
      label: 'الطلاب المتفوقون',
      value: String(topStudentsCount),
      status: 'active',
      icon: <Award className="h-5 w-5" />,
      color: '#f43f5e',
      subtext: `من إجمالي ${totalStudents} طالب`,
    },
    {
      label: 'الحصص المسجلة',
      value: String(stats?.totalSessions ?? 156),
      status: 'completed',
      icon: <Video className="h-5 w-5" />,
      color: '#10b981',
      subtext: 'منذ بداية الفصل الدراسي',
    },
  ];
}

// ---------------------------------------------------------------------------
// Main DashboardOverview Component
// ---------------------------------------------------------------------------

export default function DashboardOverview() {
  const { students, teachers, setActiveSection } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [activePill, setActivePill] = useState<string | null>(null);
  const [lastUpdated] = useState(() => new Date().toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  }));

  const dismissBanner = useCallback(() => setShowBanner(false), []);

  // ── Fetch dashboard stats from API ──
  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) throw new Error('فشل في جلب البيانات');
        const json = await res.json();
        if (cancelled) return;
        if (json.success && json.data) {
          // Map API response to DashboardStats shape
          const d = json.data;
          const mapped: DashboardStats = {
            totalStudents: d.overview?.totalStudents ?? 0,
            activeStudents: d.studentStats?.byStatus?.active ?? 0,
            totalTeachers: d.overview?.totalTeachers ?? 0,
            totalClasses: d.overview?.totalClasses ?? 0,
            avgEngagement: d.engagement?.averageScore ?? 0,
            avgFocus: d.engagement?.averageScore ?? 0,
            avgScore: d.examStats?.averageScore ?? 0,
            attendanceRate: d.attendance?.rate ?? 0,
            totalExams: d.overview?.totalExams ?? 0,
            totalSessions: d.overview?.totalSessions ?? 0,
            alertsCount: d.overview?.unreadNotifications ?? 0,
            topStudents: [],
          };
          setStats(mapped);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Derived values ──
  const totalStudents = stats?.totalStudents || students.length || 320;
  const totalTeachers = stats?.totalTeachers || teachers.length || 24;
  const kpiCards = buildKpiCards(stats);

  // ── Loading state ──
  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8" dir="rtl">
      {/* ── Welcome Banner ── */}
      {showBanner && <WelcomeBanner onDismiss={dismissBanner} />}

      {/* ── Page Title Area ── */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0ms', opacity: 0 }}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
              لوحة تحكم المدرسة
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base leading-relaxed">
              نظرة عامة على {totalStudents} طالب و{totalTeachers} معلم — الأسبوع الدراسي الحالي
            </p>
            {error && (
              <p className="mt-1 text-xs text-amber-400/80">
                ⚠️ تعذر تحديث البيانات من الخادم — يتم عرض بيانات محفوظة
              </p>
            )}
          </div>
          {/* Last updated timestamp */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground/50 shrink-0 mt-1">
            <div className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </div>
            <span>آخر تحديث: {lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* ── Session Timer (centered) ── */}
      <div className="flex justify-center">
        <SessionTimer />
      </div>

      {/* ── KPI Cards Grid (with staggered animation) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map((card, index) => (
          <div
            key={card.label}
            className="animate-fade-in-up opacity-0"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <StatCard
              label={card.label}
              value={card.value}
              percentage={card.percentage}
              status={card.status}
              icon={card.icon}
              color={card.color}
              subtext={card.subtext}
            />
          </div>
        ))}
      </div>

      {/* ── Attendance Quick Tracker ── */}
      <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '600ms' }}>
        <div className="flex items-center gap-2 mb-3">
          <UserCheck className="h-4 w-4 text-[#D4A574]" />
          <h3 className="text-sm font-semibold text-muted-foreground">متابعة الحضور السريعة</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {attendancePills.map((pill) => (
            <AttendancePill
              key={pill.id}
              label={pill.label}
              percentage={pill.percentage}
              count={pill.count}
              color={pill.color}
              borderColor={pill.borderColor}
              bgColor={pill.bgColor}
              textColor={pill.textColor}
              icon={pill.icon}
              isActive={activePill === pill.id}
              onClick={() => setActivePill(activePill === pill.id ? null : pill.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Quick Actions Row (expanded to 6) ── */}
      <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '700ms' }}>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">إجراءات سريعة</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {QUICK_ACTIONS.map((action) => (
            <QuickActionButton
              key={`${action.id}-${action.label}`}
              label={action.label}
              description={action.description}
              icon={action.icon}
              onClick={() => setActiveSection(action.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Analytics Row ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 animate-fade-in-up opacity-0" style={{ animationDelay: '800ms' }}>
        {/* Weekly Interaction Chart — takes 3 cols */}
        <SectionCard
          title="تحليل التفاعل الأسبوعي"
          icon={<MessageSquare className="h-4 w-4" />}
          className="lg:col-span-3"
          action={
            <span className="text-xs text-muted-foreground/50 font-medium">هذا الأسبوع</span>
          }
        >
          <WeeklyBarChart />
        </SectionCard>

        {/* Recent Notifications — takes 2 cols */}
        <SectionCard
          title="آخر التنبيهات"
          icon={<Bell className="h-4 w-4" />}
          className="lg:col-span-2"
          action={
            <span className="flex items-center gap-1.5 text-xs font-medium text-[#D4A574]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D4A574]" />
              {notificationsData.length} جديد
            </span>
          }
        >
          <div className="flex flex-col divide-y divide-white/[0.04]">
            {notificationsData.map((n) => (
              <NotificationItem
                key={n.id}
                text={n.text}
                time={n.time}
                status={n.status}
              />
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Today's Schedule + Student Performance Row ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-fade-in-up opacity-0" style={{ animationDelay: '900ms' }}>
        {/* Today's Schedule Widget */}
        <SectionCard
          title="جدول اليوم"
          icon={<Clock className="h-4 w-4" />}
          action={
            <span className="flex items-center gap-1.5 text-xs font-medium text-[#D4A574]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4A574] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#D4A574]" />
              </span>
              4 حصص
            </span>
          }
        >
          <TodayScheduleWidget />
        </SectionCard>

        {/* Student Performance Summary */}
        <SectionCard
          title="توزيع الدرجات - الصف الثالث"
          icon={<BarChart3 className="h-4 w-4" />}
          action={
            <span className="text-xs text-muted-foreground/50 font-medium">الفصل الحالي</span>
          }
        >
          <StudentPerformanceChart />
        </SectionCard>
      </div>

      {/* ── Bottom Row: Classroom Map + Attendance + Upcoming Events ── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in-up opacity-0" style={{ animationDelay: '1000ms' }}>
        {/* Classroom Map */}
        <SectionCard
          title="خريطة الفصل التفاعلية"
          icon={<Map className="h-4 w-4" />}
          action={
            <span className="text-xs text-emerald-400 font-medium">18 / 20 حاضر</span>
          }
        >
          <ClassroomMapPlaceholder />
        </SectionCard>

        {/* Attendance Distribution */}
        <SectionCard
          title="توزيع الحضور"
          icon={<UserCheck className="h-4 w-4" />}
          action={
            <span className="text-xs text-muted-foreground/50 font-medium">اليوم</span>
          }
        >
          <AttendanceDistribution />
        </SectionCard>

        {/* Upcoming Events */}
        <SectionCard
          title="الأحداث القادمة"
          icon={<Calendar className="h-4 w-4" />}
          className="md:col-span-2 lg:col-span-1"
          action={
            <span className="flex items-center gap-1.5 text-xs font-medium text-sky-400">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              {upcomingEvents.length} أحداث
            </span>
          }
        >
          <UpcomingEventsList />
        </SectionCard>
      </div>
    </div>
  );
}
