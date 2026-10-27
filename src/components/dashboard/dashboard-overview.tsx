'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  CheckCircle,
  Megaphone,
  Target,
  Medal,
  DollarSign,
} from 'lucide-react';
import StatCard from './stat-card';
import SectionCard from './section-card';
import BlurText from '@/components/reactbits/BlurText/BlurText';
import SessionTimer from './session-timer';
import CalendarWidget from './calendar-widget';
import WidgetContainer from './widget-container';
import ActivityFeed from './activity-feed';
import ExportButton from './export-button';
import CameraWidgetDashboard from './camera-widget-dashboard';
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

// (quickStatsData removed — QuickStatsRibbon now builds stats dynamically from store)

// Sparkline data for KPI cards (last 7 days trend)
const KPI_SPARKLINES: number[][] = [
  [82, 85, 79, 87, 90, 86, 87],   // التحصيل الأكاديمي
  [70, 72, 75, 78, 76, 80, 78],   // التركيز والانتباه
  [58, 60, 63, 65, 62, 67, 65],   // التفاعل الصفي
  [80, 82, 84, 83, 86, 84, 85],   // نسبة الحضور
  [20, 21, 22, 23, 22, 24, 24],   // الطلاب المتفوقون
  [140, 142, 148, 150, 152, 155, 156], // الحصص المسجلة
];

// Activity Feed mock data
const activityFeedData = [
  { id: 1, type: 'registration' as const, description: 'تم تسجيل الطالبة نورا أحمد في الصف الثالث', time: 'منذ 5 دقائق', icon: UserPlus, color: '#10b981', bgColor: 'bg-emerald-500/15' },
  { id: 2, type: 'grade' as const, description: 'تم رفع درجات اختبار الرياضيات للصف الثاني', time: 'منذ 15 دقيقة', icon: CheckCircle, color: '#38bdf8', bgColor: 'bg-sky-500/15' },
  { id: 3, type: 'attendance' as const, description: 'تم تسجيل حضور حصة العلوم - 28 حاضر من 32', time: 'منذ 30 دقيقة', icon: UserCheck, color: '#f59e0b', bgColor: 'bg-amber-500/15' },
  { id: 4, type: 'message' as const, description: 'أ. خالد العتيبي أرسل رسالة لولي أمر الطالب أحمد', time: 'منذ 45 دقيقة', icon: MessageSquare, color: '#A78BFA', bgColor: 'bg-violet-500/15' },
  { id: 5, type: 'announcement' as const, description: 'إعلان: موعد اختبار نهاية الفصل تم تأكيده', time: 'منذ ساعة', icon: Megaphone, color: '#f43f5e', bgColor: 'bg-rose-500/15' },
  { id: 6, type: 'exam' as const, description: 'تم إنشاء اختبار جديد لمادة اللغة الإنجليزية', time: 'منذ ساعتين', icon: FileText, color: '#38bdf8', bgColor: 'bg-sky-500/15' },
  { id: 7, type: 'attendance' as const, description: 'تنبيه: 3 طلاب غابوا عن حصلتين متتاليتين', time: 'منذ 3 ساعات', icon: AlertTriangle, color: '#f59e0b', bgColor: 'bg-amber-500/15' },
  { id: 8, type: 'grade' as const, description: 'تم مراجعة وتأكيد درجات اختبار القراءة', time: 'منذ 4 ساعات', icon: CheckCircle, color: '#10b981', bgColor: 'bg-emerald-500/15' },
];

// Weekly Goals data
const weeklyGoalsData = [
  { label: 'نسبة الحضور', current: 85, target: 95, unit: '%', color: '#10b981', bgColor: 'bg-emerald-500' },
  { label: 'تكليفات التصحيح', current: 12, target: 15, unit: '', color: '#f59e0b', bgColor: 'bg-amber-500' },
  { label: 'اجتماعات أولياء الأمور', current: 2, target: 3, unit: '', color: '#38bdf8', bgColor: 'bg-sky-500' },
  { label: 'تقارير الدرجات', current: 5, target: 8, unit: '', color: '#A78BFA', bgColor: 'bg-violet-500' },
];

// Top Students leaderboard data
const topStudentsData = [
  { rank: 1, name: 'سارة القحطاني', score: 98, initial: 'س' },
  { rank: 2, name: 'أحمد العتيبي', score: 96, initial: 'أ' },
  { rank: 3, name: 'نورة الدوسري', score: 94, initial: 'ن' },
  { rank: 4, name: 'خالد الحربي', score: 91, initial: 'خ' },
  { rank: 5, name: 'فاطمة الشمري', score: 89, initial: 'ف' },
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
    id: 'attendance' as const,
    label: 'تسجيل حضور',
    icon: UserCheck,
    description: 'تسجيل حضور الطلاب للحصة',
  },
  {
    id: 'announcements' as const,
    label: 'إدارة الإعلانات',
    icon: Megaphone,
    description: 'عرض وإدارة جميع الإعلانات',
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
            <span className="text-[11px] font-medium text-[#B0B0C0] whitespace-nowrap">
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
    <div className="flex items-start gap-3 py-3 transition-colors duration-200 hover:bg-white/[0.02] rounded-lg px-2 -mx-2 data-row-hover">
      {/* Status dot */}
      <div className="mt-1.5 shrink-0">
        <span
          className={`block h-3.5 w-3.5 rounded-full ${notificationStatusStyles[status]}`}
        />
      </div>
      {/* Content */}
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-sm leading-relaxed text-slate-300 line-clamp-2">{text}</p>
        <span className="text-[11px] text-[#A0A0B8] font-medium">{time}</span>
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
      <div className="flex items-center gap-4 text-[11px] text-[#B0B0C0]">
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

function AttendanceDistribution({ apiAttendance }: { apiAttendance: { rate: number; present: number; absent: number; late: number; excused: number; total: number } | null }) {
  const total = apiAttendance?.total || 32;
  const presentPct = apiAttendance && total > 0 ? Math.round((apiAttendance.present / total) * 100) : 85;
  const latePct = apiAttendance && total > 0 ? Math.round((apiAttendance.late / total) * 100) : 8;
  const absentPct = apiAttendance && total > 0 ? Math.round((apiAttendance.absent / total) * 100) : 7;

  const localAttendanceData = [
    { label: 'حاضر', percentage: presentPct, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    { label: 'متأخر', percentage: latePct, color: 'bg-amber-500', textColor: 'text-amber-400' },
    { label: 'غائب', percentage: absentPct, color: 'bg-rose-500', textColor: 'text-rose-400' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {localAttendanceData.map((item) => (
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
          <span className="text-xsB0B0C0">إجمالي الطلاب المسجلين</span>
          <span className="text-sm font-bold text-white tabular-nums">{total} طالب</span>
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
                <span className="text-[11px] tabular-nums text-[#B0B0C0]">{period.time}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#B0B0C0]">
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

function StudentPerformanceChart({ apiScoreDistribution }: { apiScoreDistribution: { excellent: number; veryGood: number; good: number; pass: number; fail: number } | null }) {
  const totalGraded = apiScoreDistribution
    ? apiScoreDistribution.excellent + apiScoreDistribution.veryGood + apiScoreDistribution.good + apiScoreDistribution.pass + apiScoreDistribution.fail
    : 0;
  const maxCount = apiScoreDistribution
    ? Math.max(apiScoreDistribution.excellent, apiScoreDistribution.veryGood, apiScoreDistribution.good, apiScoreDistribution.pass, apiScoreDistribution.fail, 1)
    : 12;

  const localGradeDistribution = apiScoreDistribution
    ? [
        { label: 'ممتاز', range: '90+', count: apiScoreDistribution.excellent, maxCount, color: '#10b981', gradientFrom: '#10b981', gradientTo: '#34d399' },
        { label: 'جيد جدا', range: '80-89', count: apiScoreDistribution.veryGood, maxCount, color: '#38bdf8', gradientFrom: '#38bdf8', gradientTo: '#7dd3fc' },
        { label: 'جيد', range: '70-79', count: apiScoreDistribution.good, maxCount, color: '#f59e0b', gradientFrom: '#f59e0b', gradientTo: '#fbbf24' },
        { label: 'مقبول', range: '50-69', count: apiScoreDistribution.pass, maxCount, color: '#f97316', gradientFrom: '#f97316', gradientTo: '#fb923c' },
        { label: 'راسب', range: '<50', count: apiScoreDistribution.fail, maxCount, color: '#f43f5e', gradientFrom: '#f43f5e', gradientTo: '#fb7185' },
      ]
    : gradeDistribution;

  const totalCount = totalGraded > 0 ? totalGraded : localGradeDistribution.reduce((sum, g) => sum + g.count, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Bars */}
      <div className="flex flex-col gap-3">
        {localGradeDistribution.map((grade, index) => {
          const barWidth = (grade.count / grade.maxCount) * 100;
          return (
            <div key={grade.label} className="flex items-center gap-3">
              {/* Label */}
              <div className="w-20 shrink-0 text-right">
                <span className="text-xs font-semibold text-slate-300">{grade.label}</span>
                <span className="block text-[10px] text-[#A0A0B8] tabular-nums">{grade.range}</span>
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
        <span className="text-xs text-[#B0B0C0]">إجمالي الطلاب</span>
        <span className="text-sm font-bold text-white tabular-nums">
          {totalCount} طالب
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
              px-4 py-3 transition-all duration-300 glass-card-hover
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
              <span className="text-xs text-[#B0B0C0]">{event.description}</span>
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
  // Dynamic date and day of week in Arabic
  const now = new Date();
  const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const dayName = arabicDays[now.getDay()];
  const dateStr = `${now.getDate()} ${arabicMonths[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div
      className="relative overflow-hidden rounded-xl p-6 animate-fade-in-up animate-border-glow"
      style={{
        background: 'linear-gradient(135deg, rgba(212,165,116,0.22) 0%, rgba(212,165,116,0.08) 40%, rgba(212,165,116,0.03) 70%, rgba(212,165,116,0.12) 100%)',
        border: '1px solid rgba(212,165,116,0.25)',
        borderRight: '4px solid rgba(212,165,116,0.7)',
      }}
    >
      {/* Animated shimmer overlay */}
      <div
        className="absolute inset-0 pointer-events-none animate-shimmer"
        style={{
          background: 'linear-gradient(110deg, transparent 30%, rgba(212,165,116,0.08) 45%, rgba(255,255,255,0.06) 50%, rgba(212,165,116,0.08) 55%, transparent 70%)',
          backgroundSize: '300% 100%',
        }}
      />

      {/* Sparkle/particle effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <span className="absolute top-4 right-12 h-1.5 w-1.5 rounded-full bg-[#D4A574]/60 animate-sparkle-1" />
        <span className="absolute top-8 right-[40%] h-1 w-1 rounded-full bg-[#E8C9A8]/50 animate-sparkle-2" />
        <span className="absolute bottom-6 right-[60%] h-1.5 w-1.5 rounded-full bg-[#D4A574]/40 animate-sparkle-3" />
        <span className="absolute top-3 right-[75%] h-1 w-1 rounded-full bg-white/30 animate-sparkle-1" style={{ animationDelay: '0.5s' }} />
        <span className="absolute bottom-4 right-[20%] h-1 w-1 rounded-full bg-[#E8C9A8]/40 animate-sparkle-2" style={{ animationDelay: '0.8s' }} />
      </div>

      {/* Dismiss button — elegant with hover animation */}
      <button
        onClick={onDismiss}
        aria-label="إغلاق"
        className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-lg text-[#8B8B9E]
          transition-all duration-300
          hover:bg-[#D4A574]/15 hover:text-[#D4A574] hover:rotate-90 hover:scale-110
          active:scale-95"
      >
        <X size={16} strokeWidth={2} />
      </button>

      {/* Content */}
      <div className="relative flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
        <div>
          <BlurText
            text="مرحباً، أحمد محمد 👋"
            animateBy="words"
            direction="top"
            delay={90}
            trigger="load"
            className="text-xl font-bold text-white"
          />
          <p className="text-sm text-[#D0D0E0] mt-1">
            {dayName}، {dateStr} — لديك 3 حصص اليوم و 12 تنبيه جديد
          </p>
        </div>
      </div>

      {/* Decorative gradient orbs */}
      <div
        className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #D4A574, transparent 70%)' }}
      />
      <div
        className="absolute -top-8 -right-8 h-28 w-28 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #E8C9A8, transparent 60%)' }}
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
        transition-all duration-300 ease-out btn-shine
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
        <span className="text-xs text-[#B0B0C0] truncate">
          {description}
        </span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Quick Stats Ribbon
// ---------------------------------------------------------------------------

function QuickStatsRibbon({ apiStats }: { apiStats: DashboardStats | null }) {
  const { students, teachers, classes, exams, messages, setActiveSection } = useAppStore();

  const unreadMessages = messages.filter(m => !m.isRead && !m.isArchived).length;
  const outstandingFees = students.filter(s => s.status === 'inactive').length;

  const statsData = [
    { label: 'طالب', value: String(apiStats?.totalStudents || students.length || 320), icon: GraduationCap, color: '#D4A574', section: 'students' as const },
    { label: 'معلم', value: String(apiStats?.totalTeachers || teachers.length || 24), icon: Users, color: '#D4A574', section: 'teachers' as const },
    { label: 'فصل', value: String(apiStats?.totalClasses || classes.length || 12), icon: BookOpen, color: '#D4A574', section: 'classes' as const },
    { label: 'امتحان', value: String(apiStats?.totalExams || exams.length || 156), icon: FileText, color: '#D4A574', section: 'exams' as const },
    { label: 'الرسوم المستحقة', value: String(outstandingFees || 8), icon: DollarSign, color: '#f59e0b', section: 'students' as const },
    { label: 'الرسائل الجديدة', value: String(apiStats?.alertsCount || unreadMessages || 5), icon: MessageSquare, color: '#38bdf8', section: 'notifications' as const },
  ];

  return (
    <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '550ms' }}>
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-[#D4A574]" />
        <h3 className="text-sm font-semibold text-muted-foreground">إحصائيات سريعة</h3>
      </div>
      <div className="scroll-snap-x hide-scrollbar flex gap-3 overflow-x-auto pb-2">
        {statsData.map((stat) => {
          const StatIcon = stat.icon;
          return (
            <button
              key={stat.label}
              onClick={() => setActiveSection(stat.section)}
              className="scroll-snap-x shrink-0 w-[130px] sm:w-auto sm:shrink sm:flex-1 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 flex flex-col items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.05] hover:border-white/[0.1] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/50"
            >
              <StatIcon className="h-5 w-5" style={{ color: stat.color }} />
              <span className="text-lg font-bold text-white tabular-nums">{stat.value}</span>
              <span className="text-[11px] text-muted-foreground font-medium">{stat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity Feed Widget (imported from activity-feed.tsx)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Weekly Goals Progress
// ---------------------------------------------------------------------------

function WeeklyGoalsProgress() {
  return (
    <div className="glass-card-elevated rounded-xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <Target className="h-4 w-4 text-[#D4A574]" />
        <h3 className="text-sm font-semibold text-white">أهداف الأسبوع</h3>
      </div>
      <div className="flex flex-col gap-5">
        {weeklyGoalsData.map((goal, index) => {
          const percentage = Math.round((goal.current / goal.target) * 100);
          return (
            <div key={goal.label} className="animate-fade-in-up opacity-0" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-300">{goal.label}</span>
                <span className="text-xs font-semibold tabular-nums" style={{ color: goal.color }}>
                  {goal.current}/{goal.target}{goal.unit}
                  <span className="text-[#A0A0B8] mr-1">({percentage}%)</span>
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full ${goal.bgColor} transition-all duration-1000 ease-out`}
                  style={{ width: `${percentage}%`, transitionDelay: `${300 + index * 150}ms` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Student Leaderboard Widget
// ---------------------------------------------------------------------------

function StudentLeaderboard() {
  const rankColors: Record<number, { bg: string; text: string; border: string }> = {
    1: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
    2: { bg: 'bg-slate-400/15', text: 'text-slate-300', border: 'border-slate-400/30' },
    3: { bg: 'bg-amber-700/15', text: 'text-amber-600', border: 'border-amber-700/30' },
  };

  return (
    <div className="flex flex-col gap-1.5">
      {topStudentsData.map((student) => {
        const rankStyle = rankColors[student.rank];
        const isTop3 = !!rankStyle;
        return (
          <div
            key={student.rank}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 data-row-hover cursor-default ${isTop3 ? `${rankStyle.bg} border ${rankStyle.border}` : 'hover:bg-white/[0.03]'}`}
          >
            {/* Rank badge */}
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isTop3 ? `${rankStyle.bg} ${rankStyle.text}` : 'bg-white/[0.04] text-muted-foreground'}`}>
              {student.rank <= 3 ? (
                <Medal className="h-3.5 w-3.5" />
              ) : (
                <span className="tabular-nums">{student.rank}</span>
              )}
            </div>

            {/* Avatar */}
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isTop3 ? 'bg-[#D4A574]/15 text-[#D4A574]' : 'bg-white/[0.06] text-muted-foreground'}`}>
              {student.initial}
            </div>

            {/* Name & Score */}
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-white truncate block group-hover:text-[#D4A574] transition-colors duration-200">
                {student.name}
              </span>
            </div>

            {/* Score */}
            <span className={`text-sm font-bold tabular-nums shrink-0 ${isTop3 ? rankStyle.text : 'text-muted-foreground'}`}>
              {student.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NEW: Recent Students Data Table
// ---------------------------------------------------------------------------

const studentStatusConfig = {
  active: { label: 'نشط', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  inactive: { label: 'غير نشط', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  graduated: { label: 'متخرّج', bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
};

function RecentStudentsTable({ students, onViewAll }: { students: { id: string; name: string; className?: string; status: 'active' | 'inactive' | 'graduated'; createdAt: string }[]; onViewAll: () => void }) {
  const recentStudents = [...students]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (recentStudents.length === 0) {
    return (
      <div className="data-empty-state flex flex-col items-center justify-center py-10">
        <Users className="h-10 w-10 text-[#A0A0B8] mb-3" />
        <p className="text-sm text-[#B0B0C0]">لا يوجد طلاب مسجلين بعد</p>
        <button
          onClick={onViewAll}
          className="mt-3 text-xs font-medium text-[#D4A574] hover:text-[#E8C9A8] transition-colors duration-200 cursor-pointer"
        >
          إضافة طالب جديد
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto hide-scrollbar">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-right text-[11px] font-semibold text-muted-foreground pb-3 pr-2">الاسم</th>
              <th className="text-right text-[11px] font-semibold text-muted-foreground pb-3 pr-2">الفصل</th>
              <th className="text-right text-[11px] font-semibold text-muted-foreground pb-3 pr-2">الحالة</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground pb-3 pl-2">تاريخ التسجيل</th>
            </tr>
          </thead>
          <tbody>
            {recentStudents.map((student) => {
              const status = studentStatusConfig[student.status];
              return (
                <tr key={student.id} className="data-row-hover transition-colors duration-200">
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D4A574]/15 text-[10px] font-bold text-[#D4A574]">
                        {student.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-white truncate max-w-[140px]">{student.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-2 text-sm text-slate-400">{student.className || '—'}</td>
                  <td className="py-2.5 pr-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.bg} ${status.text} border ${status.border}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="py-2.5 pl-2 text-xs text-[#B0B0C0] tabular-nums">
                    {new Date(student.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button
        onClick={onViewAll}
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#D4A574] hover:text-[#E8C9A8] transition-colors duration-200 cursor-pointer mr-auto"
      >
        عرض الكل
        <ChevronLeft className="h-3 w-3" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NEW: Today's Attendance Overview (percentage rings)
// ---------------------------------------------------------------------------

function TodayAttendanceOverview({ pills, onClick }: {
  pills: typeof attendancePills;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-right cursor-pointer group"
    >
      <div className="grid grid-cols-4 gap-2">
        {pills.map((item) => {
          const Icon = item.icon;
          const radius = 22;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (item.percentage / 100) * circumference;

          return (
            <div
              key={item.id}
              className="flex flex-col items-center gap-1.5 transition-transform duration-300 group-hover:scale-105"
            >
              {/* SVG percentage ring */}
              <div className="relative">
                <svg width="56" height="56" viewBox="0 0 56 56">
                  {/* Background track */}
                  <circle
                    cx="28" cy="28" r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="3.5"
                  />
                  {/* Progress arc */}
                  <circle
                    cx="28" cy="28" r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 28 28)"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                </div>
              </div>
              {/* Label + percentage */}
              <div className="text-center">
                <span className="block text-[11px] font-semibold text-white">{item.label}</span>
                <span className={`block text-[10px] font-bold tabular-nums ${item.textColor}`}>
                  {item.percentage}%
                </span>
              </div>
            </div>
          );
        })}
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
  const attendanceRate = stats?.attendanceRate ?? 85;

  return [
    {
      label: 'التحصيل الأكاديمي',
      value: stats ? `${Math.round(stats.avgScore)}%` : '87%',
      percentage: stats ? Math.round(stats.avgScore) : 87,
      status: (stats ? stats.avgScore : 87) >= 80 ? 'stable' : 'needs-attention',
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
      status: (stats ? stats.avgEngagement : 65) < 70 ? 'needs-attention' : 'improved',
      icon: <MessageSquare className="h-5 w-5" />,
      color: '#f59e0b',
      subtext: (stats ? stats.avgEngagement : 65) < 70 ? 'يحتاج متابعة إضافية' : 'تحسن ملحوظ',
    },
    {
      label: 'نسبة الحضور',
      value: `${Math.round(attendanceRate)}%`,
      percentage: Math.round(attendanceRate),
      status: attendanceRate >= 90 ? 'improved' : attendanceRate >= 80 ? 'stable' : 'needs-attention',
      icon: <Users className="h-5 w-5" />,
      color: '#8b5cf6',
      subtext: attendanceRate >= 90 ? 'ممتاز هذا الأسبوع' : '+3% عن الأسبوع الماضي',
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
  const { students, teachers, classes, exams, messages, setActiveSection, setStudents } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [activePill, setActivePill] = useState<string | null>(null);
  const [lastUpdated] = useState(() => new Date().toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  }));

  // Seed mock students if store is empty (so RecentStudentsTable shows data)
  const studentsSeeded = useRef(false);
  useEffect(() => {
    if (!studentsSeeded.current && students.length === 0) {
      studentsSeeded.current = true;
      setStudents([
        { id: 's1', name: 'أحمد العتيبي', studentId: 'STD-001', classId: 'c1', status: 'active', notes: '', psychBackground: '', avatar: '', className: 'الصف الأول أ', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString() },
        { id: 's2', name: 'سارة القحطاني', studentId: 'STD-002', classId: 'c2', status: 'active', notes: '', psychBackground: '', avatar: '', className: 'الصف الثاني ب', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString() },
        { id: 's3', name: 'نورة الدوسري', studentId: 'STD-003', classId: 'c1', status: 'active', notes: '', psychBackground: '', avatar: '', className: 'الصف الأول أ', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString() },
        { id: 's4', name: 'خالد الحربي', studentId: 'STD-004', classId: 'c3', status: 'inactive', notes: '', psychBackground: '', avatar: '', className: 'الصف الثالث', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString() },
        { id: 's5', name: 'فاطمة الشمري', studentId: 'STD-005', classId: 'c2', status: 'graduated', notes: '', psychBackground: '', avatar: '', className: 'الصف الثاني أ', createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString() },
        { id: 's6', name: 'محمد الغامدي', studentId: 'STD-006', classId: 'c1', status: 'active', notes: '', psychBackground: '', avatar: '', className: 'الصف الأول ب', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString() },
      ]);
    }
  }, []);

  const dismissBanner = useCallback(() => setShowBanner(false), []);

  // ── Extended API stats for attendance, score distribution, etc. ──
  const [apiAttendance, setApiAttendance] = useState<{ rate: number; present: number; absent: number; late: number; excused: number; total: number } | null>(null);
  const [apiScoreDistribution, setApiScoreDistribution] = useState<{ excellent: number; veryGood: number; good: number; pass: number; fail: number } | null>(null);

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
            avgFocus: d.engagement?.averageFocus ?? Math.round((d.engagement?.averageScore ?? 78) * 0.93),
            avgScore: d.examStats?.averageScore ?? 0,
            attendanceRate: d.attendance?.rate ?? 0,
            totalExams: d.overview?.totalExams ?? 0,
            totalSessions: d.overview?.totalSessions ?? 0,
            alertsCount: d.overview?.unreadNotifications ?? 0,
            topStudents: [],
          };
          setStats(mapped);

          // Store extended data for sub-components
          if (d.attendance) {
            setApiAttendance({
              rate: d.attendance.rate ?? 0,
              present: d.attendance.present ?? 0,
              absent: d.attendance.absent ?? 0,
              late: d.attendance.late ?? 0,
              excused: d.attendance.excused ?? 0,
              total: d.attendance.total ?? 0,
            });
          }
          if (d.examStats?.scoreDistribution) {
            setApiScoreDistribution(d.examStats.scoreDistribution);
          }
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
          <div className="flex items-center gap-2 text-xs text-[#A0A0B8] shrink-0 mt-1">
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

      {/* ── Quick Stats Ribbon ── */}
      <QuickStatsRibbon apiStats={stats} />

      {/* ── Live Cameras + Recent Students (responsive 2-col) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 animate-fade-in-up opacity-0" style={{ animationDelay: '420ms' }}>
          <CameraWidgetDashboard />
        </div>
        <div className="lg:col-span-2 glass-card-elevated rounded-xl p-5 animate-fade-in-up opacity-0" style={{ animationDelay: '470ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#D4A574]" />
              <h3 className="text-sm font-semibold text-white">آخر الطلاب المسجلين</h3>
            </div>
            <span className="text-xs text-[#A0A0B8] font-medium tabular-nums">{students.length} طالب</span>
          </div>
          <RecentStudentsTable
            students={students}
            onViewAll={() => setActiveSection('students')}
          />
        </div>
      </div>

      {/* ── KPI Cards Grid (responsive CSS Grid with staggered animation) ── */}
      <div
        className="aurora-bg glass-medium rounded-2xl p-1 grid gap-4"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        }}
      >
        {kpiCards.map((card, index) => (
          <div
            key={card.label}
            className="animate-pop-in animate-fade-in-up opacity-0 hover-lift rounded-xl"
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
              sparklineData={KPI_SPARKLINES[index]}
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
          {(() => {
            const attTotal = apiAttendance?.total || 32;
            const dynamicPills = apiAttendance ? [
              { ...attendancePills[0], percentage: attTotal > 0 ? Math.round((apiAttendance.present / attTotal) * 100) : 85, count: apiAttendance.present },
              { ...attendancePills[1], percentage: attTotal > 0 ? Math.round((apiAttendance.late / attTotal) * 100) : 8, count: apiAttendance.late },
              { ...attendancePills[2], percentage: attTotal > 0 ? Math.round((apiAttendance.absent / attTotal) * 100) : 7, count: apiAttendance.absent },
              { ...attendancePills[3], percentage: attTotal > 0 ? Math.round((apiAttendance.excused / attTotal) * 100) : 3, count: apiAttendance.excused },
            ] : attendancePills;
            return dynamicPills.map((pill) => (
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
            ));
          })()}
        </div>
      </div>

      {/* ── Ornamental Divider ── */}
      <div className="divider-ornament animate-fade-in opacity-0" style={{ animationDelay: '650ms' }} />

      {/* ── Quick Actions Row (expanded to 6) ── */}
      <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '700ms' }}>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 smooth-underline cursor-pointer" onClick={() => setActiveSection('students')}>إجراءات سريعة</h3>
        <div className="stagger-grid corner-accent grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {QUICK_ACTIONS.map((action) => (
            <div key={`${action.id}-${action.label}`} className="animate-fade-in-up opacity-0">
            <QuickActionButton
              label={action.label}
              description={action.description}
              icon={action.icon}
              onClick={() => setActiveSection(action.id)}
            />
            </div>
          ))}
        </div>
      </div>

      {/* ── Weekly Goals Progress ── */}
      <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '750ms' }}>
        <WeeklyGoalsProgress />
      </div>

      {/* ── Export Button ── */}
      <div className="flex justify-end animate-fade-in-up opacity-0" style={{ animationDelay: '780ms' }}>
        <ExportButton
          data={students as unknown as Record<string, unknown>[]}
          columns={[
            { header: 'الاسم', key: 'name' },
            { header: 'رقم الطالب', key: 'studentId' },
            { header: 'الفصل', key: 'className' },
            { header: 'الحالة', key: 'status' },
            { header: 'تاريخ التسجيل', key: 'createdAt', format: (v: unknown) => { try { return new Date(String(v)).toLocaleDateString('ar-EG'); } catch { return String(v); } } },
          ]}
          filename="طلاب_أورالاب"
          printTitle="تقرير الطلاب — AuraLab"
          label="تصدير بيانات الطلاب"
        />
      </div>

      {/* ── Analytics Row (responsive CSS Grid) ── */}
      <div
        className="grid gap-6 animate-fade-in-up opacity-0"
        style={{ animationDelay: '800ms', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
      >
        {/* Weekly Interaction Chart — takes 3 cols */}
        <WidgetContainer
          title="تحليل التفاعل الأسبوعي"
          icon={<MessageSquare className="h-4 w-4" />}
          className="min-[960px]:col-span-2"
          onRefresh={() => setStats(null)}
          badge={weeklyInteractionData.length}
        >
          <WeeklyBarChart />
        </WidgetContainer>

        {/* Recent Notifications — takes 2 cols */}
        <WidgetContainer
          title="آخر التنبيهات"
          icon={<Bell className="h-4 w-4" />}
          className="min-[960px]:col-span-1"
          badge={notificationsData.length}
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
        </WidgetContainer>
      </div>

      {/* ── Activity Feed + Student Leaderboard Row ── */}
      <div
        className="grid gap-6 animate-fade-in-up opacity-0"
        style={{ animationDelay: '850ms', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
      >
        <WidgetContainer
          title="آخر الأنشطة"
          icon={<Megaphone className="h-4 w-4" />}
          className="min-[960px]:col-span-1"
          onRefresh={() => {}}
          badge={8}
        >
          <ActivityFeed maxItems={8} />
        </WidgetContainer>

        {/* Student Leaderboard */}
        <WidgetContainer
          title="أفضل الطلاب"
          icon={<Trophy className="h-4 w-4" />}
          badge={topStudentsData.length}
        >
          <StudentLeaderboard />
        </WidgetContainer>
      </div>

      {/* ── Ornamental Divider ── */}
      <div className="divider-ornament animate-fade-in opacity-0" style={{ animationDelay: '900ms' }} />

      {/* ── Today's Schedule + Student Performance Row ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-fade-in-up opacity-0" style={{ animationDelay: '950ms' }}>
        {/* Today's Schedule Widget */}
        <div className="card-tilt">
        <WidgetContainer
          title="جدول اليوم"
          icon={<Clock className="h-4 w-4" />}
          onRefresh={() => {}}
          badge={todaySchedule.length}
        >
          <TodayScheduleWidget />
        </WidgetContainer>
        </div>

        {/* Student Performance Summary */}
        <WidgetContainer
          title="توزيع الدرجات - الصف الثالث"
          icon={<BarChart3 className="h-4 w-4" />}
          onRefresh={() => {}}
        >
          <div className="shimmer-loading p-1 rounded-lg" style={{ animationDuration: '1.2s', animationIterationCount: '1' }}>
          <StudentPerformanceChart apiScoreDistribution={apiScoreDistribution} />
          </div>
          {/* Performance Trend Sparkline */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs font-semibold text-[#B0B0C0]">الاتجاه:</span>
            <svg viewBox="0 0 120 30" className="w-28 h-7 sparkline-trend" style={{ direction: 'ltr' }}>
              <defs>
                <linearGradient id="sparkline-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#D4A574" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#D4A574" stopOpacity="1" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke="url(#sparkline-grad)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,22 20,18 40,20 60,12 80,15 100,8 120,5"
              />
              {/* Glow duplicate for depth */}
              <polyline
                fill="none"
                stroke="#D4A574"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,22 20,18 40,20 60,12 80,15 100,8 120,5"
                opacity="0.2"
                filter="blur(2px)"
              />
              {/* Data points */}
              {[
                [0,22],[20,18],[40,20],[60,12],[80,15],[100,8],[120,5]
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="2.5" fill="#D4A574" opacity={i === 6 ? 1 : 0.6} />
              ))}
            </svg>
            <span className="text-xs font-bold text-emerald-400">+12%</span>
            <span className="text-[10px] text-[#A0A0B8]">عن الفصل الماضي</span>
          </div>
        </WidgetContainer>
      </div>

      {/* ── Ornamental Divider ── */}
      <div className="divider-ornament animate-fade-in opacity-0" style={{ animationDelay: '1000ms' }} />

      {/* ── Bottom Row: Classroom Map + Attendance + Upcoming Events ── */}
      <div
        className="grid gap-6 animate-fade-in-up opacity-0"
        style={{ animationDelay: '1050ms', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
      >
        {/* Classroom Map */}
        <WidgetContainer
          title="خريطة الفصل التفاعلية"
          icon={<Map className="h-4 w-4" />}
        >
          <ClassroomMapPlaceholder />
        </WidgetContainer>

        {/* Attendance Distribution */}
        <WidgetContainer
          title="توزيع الحضور"
          icon={<UserCheck className="h-4 w-4" />}
          onRefresh={() => {}}
        >
          <AttendanceDistribution apiAttendance={apiAttendance} />
        </WidgetContainer>

        {/* Today's Attendance Overview — percentage rings */}
        <WidgetContainer
          title="ملخص حضور اليوم"
          icon={<CheckCircle className="h-4 w-4" />}
        >
          <TodayAttendanceOverview
            pills={(() => {
              const attTotal = apiAttendance?.total || 32;
              return apiAttendance ? [
                { ...attendancePills[0], percentage: attTotal > 0 ? Math.round((apiAttendance.present / attTotal) * 100) : 85, count: apiAttendance.present },
                { ...attendancePills[1], percentage: attTotal > 0 ? Math.round((apiAttendance.late / attTotal) * 100) : 8, count: apiAttendance.late },
                { ...attendancePills[2], percentage: attTotal > 0 ? Math.round((apiAttendance.absent / attTotal) * 100) : 7, count: apiAttendance.absent },
                { ...attendancePills[3], percentage: attTotal > 0 ? Math.round((apiAttendance.excused / attTotal) * 100) : 3, count: apiAttendance.excused },
              ] : attendancePills;
            })()}
            onClick={() => setActiveSection('attendance')}
          />
        </WidgetContainer>
      </div>

      {/* ── Calendar + Upcoming Events Row ── */}
      <div
        className="grid gap-6 animate-fade-in-up opacity-0"
        style={{ animationDelay: '1150ms', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
      >
        {/* Calendar Widget */}
        <div className="flex items-start justify-center">
          <CalendarWidget />
        </div>

        {/* Upcoming Events */}
        <WidgetContainer
          title="الأحداث القادمة"
          icon={<Calendar className="h-4 w-4" />}
          badge={upcomingEvents.length}
        >
          <UpcomingEventsList />
        </WidgetContainer>
      </div>
    </div>
  );
}
