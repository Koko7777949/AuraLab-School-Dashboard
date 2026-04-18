'use client';


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
} from 'lucide-react';
import StatCard from './stat-card';
import SectionCard from './section-card';
import SessionTimer from './session-timer';
import { useAppStore } from '@/lib/store';

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
    text: 'نتائج اختبار العلون متاحة الآن للمراجعة',
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

function CurrentLessonDetails() {
  return (
    <div className="flex flex-col gap-5">
      {/* Lesson badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#D4A574]/10">
          <BookMarked className="h-4.5 w-4.5 text-[#D4A574]" />
        </div>
        <div>
          <h4 className="text-base font-semibold text-white">الرياضيات - الوحدة الثالثة</h4>
          <p className="text-xs text-muted-foreground/60 mt-0.5">الصف الثالث المتوسط / الفصل أ</p>
        </div>
      </div>

      {/* Info rows */}
      {[
        { label: 'المعلم', value: 'أ. خالد العتيبي' },
        { label: 'الوقت', value: '08:30 - 09:15 صباحاً' },
        { label: 'الغرفة', value: 'قاعة 204' },
        { label: 'التقدم', value: '65%' },
      ].map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
        >
          <span className="text-sm text-muted-foreground">{row.label}</span>
          <span
            className={`text-sm font-medium text-slate-200 ${
              row.label === 'التقدم' ? 'tabular-nums text-emerald-400' : ''
            }`}
          >
            {row.value}
          </span>
        </div>
      ))}

      {/* Progress bar for lesson */}
      <div>
        <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-emerald-500 transition-all duration-700 ease-out"
            style={{ width: '65%' }}
          />
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs font-medium text-emerald-400">الدرس جارٍ حالياً</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main DashboardOverview Component
// ---------------------------------------------------------------------------

export default function DashboardOverview() {
  const { students, teachers } = useAppStore();

  const totalStudents = students.length || 320;
  const totalTeachers = teachers.length || 24;

  return (
    <div className="flex flex-col gap-8" dir="rtl">
      {/* ── Page Title Area ── */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
          لوحة تحكم المدرسة
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          نظرة عامة على {totalStudents} طالب و{totalTeachers} معلم — الأسبوع الدراسي الحالي
        </p>
      </div>

      {/* ── Session Timer (centered) ── */}
      <div className="flex justify-center">
        <SessionTimer />
      </div>

      {/* ── KPI Cards Grid ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="التحصيل الأكاديمي"
          value="87%"
          percentage={87}
          status="stable"
          icon={<BookOpen className="h-5 w-5" />}
          color="#10b981"
          subtext="مقارنة بالفصل السابق"
        />
        <StatCard
          label="التركيز والانتباه"
          value="78%"
          percentage={78}
          status="improved"
          icon={<Eye className="h-5 w-5" />}
          color="#38bdf8"
          subtext="+5% عن الأسبوع الماضي"
        />
        <StatCard
          label="التفاعل الصفي"
          value="65%"
          percentage={65}
          status="needs-attention"
          icon={<MessageSquare className="h-5 w-5" />}
          color="#f59e0b"
          subtext="يحتاج متابعة إضافية"
        />
        <StatCard
          label="المشاركة"
          value="82%"
          percentage={82}
          status="improved"
          icon={<Users className="h-5 w-5" />}
          color="#8b5cf6"
          subtext="+3% عن الأسبوع الماضي"
        />
        <StatCard
          label="الطلاب المتفوقون"
          value="24"
          status="active"
          icon={<Award className="h-5 w-5" />}
          color="#f43f5e"
          subtext="من إجمالي 320 طالب"
        />
        <StatCard
          label="الحصص المسجلة"
          value="156"
          status="completed"
          icon={<Video className="h-5 w-5" />}
          color="#10b981"
          subtext="منذ بداية الفصل الدراسي"
        />
      </div>

      {/* ── Analytics Row ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
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

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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

        {/* Current Lesson Details */}
        <SectionCard
          title="تفاصيل الدرس الحالي"
          icon={<BookMarked className="h-4 w-4" />}
          className="md:col-span-2 lg:col-span-1"
          action={
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              جارٍ
            </span>
          }
        >
          <CurrentLessonDetails />
        </SectionCard>
      </div>
    </div>
  );
}
