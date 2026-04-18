'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Users,
  PlayCircle,
  CheckCircle2,
  Plus,
  Eye,
  MapPin,
  BookOpen,
  Filter,
  X,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { Session } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SessionStatus = 'upcoming' | 'in-progress' | 'completed';

interface SessionCardData extends Session {
  status: SessionStatus;
  engagementScore: number;
  teacherNameDisplay: string;
  classNameDisplay: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const CLASS_FILTER_MAP: Record<string, string> = {
  'class-1': 'الصف الأول - أ',
  'class-2': 'الصف الأول - ب',
  'class-3': 'الصف الثاني - أ',
  'class-4': 'الصف الثاني - ب',
  'class-5': 'الصف الثالث - أ',
  'class-6': 'الصف الثالث - ب',
};

const MOCK_SESSIONS: SessionCardData[] = [
  {
    id: 'session-001',
    classId: 'class-1',
    teacherId: 'teacher-001',
    date: '2025-01-15',
    startTime: '08:00',
    endTime: '09:30',
    engagementAvg: 88,
    topic: 'مقدمة في الجبر والمعادلات',
    notes: 'شرح تفاعلي مع تمارين تطبيقية',
    createdAt: '2025-01-14T08:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z',
    className: 'الصف الأول - أ',
    teacherName: 'أ. عبدالله السالم',
    status: 'completed',
    engagementScore: 88,
    teacherNameDisplay: 'أ. عبدالله السالم',
    classNameDisplay: 'الصف الأول - أ',
  },
  {
    id: 'session-002',
    classId: 'class-3',
    teacherId: 'teacher-002',
    date: '2025-01-15',
    startTime: '10:00',
    endTime: '11:30',
    engagementAvg: 92,
    topic: 'الفيزياء: قوانين نيوتن',
    notes: 'تجارب معملية عملية',
    createdAt: '2025-01-14T08:00:00.000Z',
    updatedAt: '2025-01-15T12:00:00.000Z',
    className: 'الصف الثاني - أ',
    teacherName: 'أ. سارة المنصور',
    status: 'completed',
    engagementScore: 92,
    teacherNameDisplay: 'أ. سارة المنصور',
    classNameDisplay: 'الصف الثاني - أ',
  },
  {
    id: 'session-003',
    classId: 'class-5',
    teacherId: 'teacher-001',
    date: '2025-01-16',
    startTime: '08:00',
    endTime: '09:30',
    engagementAvg: 76,
    topic: 'الكيمياء العضوية - الجزيئات',
    notes: 'مراجعة عامة للفصل السابق',
    createdAt: '2025-01-15T08:00:00.000Z',
    updatedAt: '2025-01-16T10:00:00.000Z',
    className: 'الصف الثالث - أ',
    teacherName: 'أ. عبدالله السالم',
    status: 'in-progress',
    engagementScore: 76,
    teacherNameDisplay: 'أ. عبدالله السالم',
    classNameDisplay: 'الصف الثالث - أ',
  },
  {
    id: 'session-004',
    classId: 'class-2',
    teacherId: 'teacher-003',
    date: '2025-01-16',
    startTime: '11:00',
    endTime: '12:30',
    engagementAvg: null,
    topic: 'اللغة العربية: النحو والإعراب',
    notes: '',
    createdAt: '2025-01-15T08:00:00.000Z',
    updatedAt: '2025-01-15T08:00:00.000Z',
    className: 'الصف الأول - ب',
    teacherName: 'أ. فهد العتيبي',
    status: 'upcoming',
    engagementScore: 0,
    teacherNameDisplay: 'أ. فهد العتيبي',
    classNameDisplay: 'الصف الأول - ب',
  },
  {
    id: 'session-005',
    classId: 'class-4',
    teacherId: 'teacher-002',
    date: '2025-01-17',
    startTime: '08:00',
    endTime: '09:30',
    engagementAvg: null,
    topic: 'العلوم: الأحياء الخلوية',
    notes: 'شرح جديد مع عروض تقديمية',
    createdAt: '2025-01-16T08:00:00.000Z',
    updatedAt: '2025-01-16T08:00:00.000Z',
    className: 'الصف الثاني - ب',
    teacherName: 'أ. سارة المنصور',
    status: 'upcoming',
    engagementScore: 0,
    teacherNameDisplay: 'أ. سارة المنصور',
    classNameDisplay: 'الصف الثاني - ب',
  },
  {
    id: 'session-006',
    classId: 'class-6',
    teacherId: 'teacher-003',
    date: '2025-01-14',
    startTime: '10:00',
    endTime: '11:30',
    engagementAvg: 65,
    topic: 'التاريخ: الحضارات القديمة',
    notes: 'نقاش جماعي ومشاريع فردية',
    createdAt: '2025-01-13T08:00:00.000Z',
    updatedAt: '2025-01-14T12:00:00.000Z',
    className: 'الصف الثالث - ب',
    teacherName: 'أ. فهد العتيبي',
    status: 'completed',
    engagementScore: 65,
    teacherNameDisplay: 'أ. فهد العتيبي',
    classNameDisplay: 'الصف الثالث - ب',
  },
  {
    id: 'session-007',
    classId: 'class-1',
    teacherId: 'teacher-002',
    date: '2025-01-17',
    startTime: '12:00',
    endTime: '13:30',
    engagementAvg: null,
    topic: 'الرياضيات: الهندسة والقياس',
    notes: 'حصة تطبيقية مع أنشطة تفاعلية',
    createdAt: '2025-01-16T08:00:00.000Z',
    updatedAt: '2025-01-16T08:00:00.000Z',
    className: 'الصف الأول - أ',
    teacherName: 'أ. سارة المنصور',
    status: 'upcoming',
    engagementScore: 0,
    teacherNameDisplay: 'أ. سارة المنصور',
    classNameDisplay: 'الصف الأول - أ',
  },
  {
    id: 'session-008',
    classId: 'class-3',
    teacherId: 'teacher-001',
    date: '2025-01-16',
    startTime: '14:00',
    endTime: '15:30',
    engagementAvg: 81,
    topic: 'اللغة الإنجليزية: المحادثة والمفردات',
    notes: 'أنشطة مجموعات وتطبيقات عملية',
    createdAt: '2025-01-15T08:00:00.000Z',
    updatedAt: '2025-01-16T16:00:00.000Z',
    className: 'الصف الثاني - أ',
    teacherName: 'أ. عبدالله السالم',
    status: 'completed',
    engagementScore: 81,
    teacherNameDisplay: 'أ. عبدالله السالم',
    classNameDisplay: 'الصف الثاني - أ',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  upcoming: {
    label: 'قادمة',
    icon: Calendar,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
  },
  'in-progress': {
    label: 'جارية',
    icon: PlayCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  completed: {
    label: 'مكتملة',
    icon: CheckCircle2,
    color: 'text-slate-400',
    bg: 'bg-slate-500/10 border-slate-500/20',
  },
};

function getStatusColor(status: SessionStatus): string {
  switch (status) {
    case 'upcoming':
      return '#0ea5e9';
    case 'in-progress':
      return '#10b981';
    case 'completed':
      return '#64748b';
  }
}

function getEngagementColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function formatDateArabic(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(time: string | null): string {
  if (!time) return '—';
  return time;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Circular engagement indicator using SVG */
function EngagementRing({
  score,
  size = 52,
  strokeWidth = 4,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const [animated, setAnimated] = useState(false);
  const color = score > 0 ? getEngagementColor(score) : 'rgba(255,255,255,0.1)';

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {score > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            style={{
              strokeDashoffset: animated ? circumference - (score / 100) * circumference : circumference,
              transition: 'stroke-dashoffset 1s ease-out',
            }}
          />
        )}
      </svg>
      <span className="absolute text-xs font-bold text-white tabular-nums select-none">
        {score > 0 ? score : '—'}
      </span>
    </div>
  );
}

/** Status badge */
function StatusBadge({ status }: { status: SessionStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border',
        config.bg,
        config.color,
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

/** Session card */
function SessionCardComponent({
  session,
  onView,
}: {
  session: SessionCardData;
  onView: (s: SessionCardData) => void;
}) {
  const borderColor = getStatusColor(session.status);

  return (
    <div
      className="group relative rounded-xl p-5 transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
      style={{
        backgroundColor: '#1A1A24',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 30px rgba(0,0,0,0.3), 0 0 0 1px ${borderColor}25`;
        e.currentTarget.style.borderColor = `${borderColor}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
      }}
      onClick={() => onView(session)}
    >
      {/* Top row: status + date */}
      <div className="flex items-center justify-between mb-4">
        <StatusBadge status={session.status} />
        <span className="text-xs text-slate-500 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {session.date}
        </span>
      </div>

      {/* Topic */}
      <h4 className="text-sm font-semibold text-white mb-3 truncate">
        {session.topic}
      </h4>

      {/* Info rows */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Users className="h-3.5 w-3.5 text-slate-500" />
          <span>{session.classNameDisplay}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <BookOpen className="h-3.5 w-3.5 text-slate-500" />
          <span>{session.teacherNameDisplay}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="h-3.5 w-3.5 text-slate-500" />
          <span dir="ltr" className="text-left">
            {formatTime(session.startTime)} - {formatTime(session.endTime)}
          </span>
        </div>
      </div>

      {/* Bottom row: engagement + view button */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] text-slate-500">التفاعل</span>
          <EngagementRing score={session.engagementScore} size={40} strokeWidth={3} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-white hover:bg-white/[0.06] gap-1.5 h-8 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onView(session);
          }}
        >
          <Eye className="h-3.5 w-3.5" />
          عرض
        </Button>
      </div>
    </div>
  );
}

/** Session detail dialog */
function SessionDetailDialog({
  session,
  open,
  onOpenChange,
}: {
  session: SessionCardData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!session) return null;

  const config = STATUS_CONFIG[session.status];
  const StatusIcon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        dir="rtl"
        style={{
          backgroundColor: '#1A1A24',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-3">
            تفاصيل الجلسة
            <StatusBadge status={session.status} />
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            عرض كافة تفاصيل الجلسة التعليمية
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 mt-2">
          {/* Topic */}
          <div
            className="rounded-xl p-5 text-center"
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <BookOpen className="h-6 w-6 text-[#D4A574] mx-auto mb-2" />
            <h3 className="text-lg font-bold text-white mb-1">{session.topic}</h3>
            <p className="text-sm text-slate-500">الموضوع الدراسي</p>
          </div>

          {/* Engagement ring - large */}
          <div
            className="rounded-xl p-5 flex items-center justify-center gap-6"
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div className="text-center">
              <EngagementRing score={session.engagementScore} size={90} strokeWidth={6} />
              <p className="text-xs text-slate-500 mt-2">
                {session.engagementScore > 0 ? 'معدل التفاعل' : 'لم يبدأ بعد'}
              </p>
            </div>

            {session.engagementScore > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <div className={cn(
                    'h-2 w-2 rounded-full',
                    session.engagementScore >= 80 ? 'bg-emerald-500' :
                    session.engagementScore >= 60 ? 'bg-amber-500' : 'bg-red-500',
                  )} />
                  <span>
                    {session.engagementScore >= 80 ? 'تفاعل ممتاز' :
                     session.engagementScore >= 60 ? 'تفاعل جيد' : 'يحتاج تحسين'}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  من إجمالي المشاركين في الفصل
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div className="flex flex-col gap-3">
              {[
                { label: 'التاريخ', value: formatDateArabic(session.date), icon: Calendar },
                { label: 'الوقت', value: `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`, icon: Clock },
                { label: 'الفصل', value: session.classNameDisplay, icon: Users },
                { label: 'المعلم', value: session.teacherNameDisplay, icon: BookOpen },
                { label: 'المكان', value: 'القاعة الدراسية الرئيسية', icon: MapPin },
              ].map((field) => (
                <div
                  key={field.label}
                  className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                      <field.icon className="h-4 w-4 text-[#D4A574]" />
                    </div>
                    <span className="text-sm text-muted-foreground">{field.label}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-200">{field.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {session.notes && (
            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <h4 className="text-sm font-semibold text-slate-300 mb-2">ملاحظات</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {session.notes}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Add session dialog */
function AddSessionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [topic, setTopic] = useState('');
  const [classId, setClassId] = useState('class-1');
  const [teacherId, setTeacherId] = useState('teacher-001');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:30');
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (!topic.trim()) return;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        dir="rtl"
        style={{
          backgroundColor: '#1A1A24',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#D4A574]" />
            إضافة جلسة جديدة
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            أضف جلسة تعليمية جديدة للجدول الدراسي
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 mt-2">
          {/* Topic */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-300 font-medium">الموضوع</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثال: مقدمة في الجبر"
              className="w-full rounded-lg px-3.5 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 outline-none transition-colors"
            />
          </div>

          {/* Class & Teacher row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-slate-300 font-medium">الفصل</label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
                  {Object.entries(CLASS_FILTER_MAP).map(([id, name]) => (
                    <SelectItem
                      key={id}
                      value={id}
                      className="text-slate-200 focus:bg-white/[0.05] focus:text-white"
                    >
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-slate-300 font-medium">المعلم</label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
                  <SelectItem value="teacher-001" className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                    أ. عبدالله السالم
                  </SelectItem>
                  <SelectItem value="teacher-002" className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                    أ. سارة المنصور
                  </SelectItem>
                  <SelectItem value="teacher-003" className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                    أ. فهد العتيبي
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-300 font-medium">التاريخ</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg px-3.5 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 outline-none transition-colors"
              dir="ltr"
            />
          </div>

          {/* Time row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-slate-300 font-medium">وقت البداية</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg px-3.5 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 outline-none transition-colors"
                dir="ltr"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-slate-300 font-medium">وقت النهاية</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg px-3.5 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 outline-none transition-colors"
                dir="ltr"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-300 font-medium">ملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف ملاحظات حول الجلسة..."
              rows={3}
              className="w-full rounded-lg px-3.5 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 outline-none transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleAdd}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold gap-2 rounded-lg px-6"
            >
              <Plus className="h-4 w-4" />
              إضافة الجلسة
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-lg px-6"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function SessionsSection() {
  const { classes, teachers } = useAppStore();

  // Local state
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionCardData | null>(null);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    let result = [...MOCK_SESSIONS];

    if (classFilter !== 'all') {
      result = result.filter((s) => s.classId === classFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }

    return result;
  }, [classFilter, statusFilter]);

  // Summary stats
  const stats = useMemo(() => {
    const total = MOCK_SESSIONS.length;
    const completed = MOCK_SESSIONS.filter((s) => s.status === 'completed').length;
    const inProgress = MOCK_SESSIONS.filter((s) => s.status === 'in-progress').length;
    const upcoming = MOCK_SESSIONS.filter((s) => s.status === 'upcoming').length;
    const avgEngagement = MOCK_SESSIONS.filter((s) => s.engagementScore > 0);
    const engagementAvg =
      avgEngagement.length > 0
        ? Math.round(avgEngagement.reduce((sum, s) => sum + s.engagementScore, 0) / avgEngagement.length)
        : 0;

    return { total, completed, inProgress, upcoming, engagementAvg };
  }, []);

  const handleView = (session: SessionCardData) => {
    setSelectedSession(session);
    setDetailOpen(true);
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* ── Page Title ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#D4A574]/10">
            <Calendar className="h-5 w-5 text-[#D4A574]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl flex items-center gap-3">
              إدارة الجلسات
              <Badge className="bg-[#D4A574]/15 text-[#D4A574] border-[#D4A574]/20 hover:bg-[#D4A574]/20 text-sm px-2.5 py-0.5 rounded-full font-semibold tabular-nums">
                {stats.total}
              </Badge>
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              متابعة وإدارة الجلسات التعليمية
            </p>
          </div>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'مكتملة', value: stats.completed, color: '#64748b', bg: 'bg-slate-500/15', icon: CheckCircle2 },
          { label: 'جارية', value: stats.inProgress, color: '#10b981', bg: 'bg-emerald-500/15', icon: PlayCircle },
          { label: 'قادمة', value: stats.upcoming, color: '#0ea5e9', bg: 'bg-sky-500/15', icon: Calendar },
          { label: 'متوسط التفاعل', value: `${stats.engagementAvg}%`, color: '#f59e0b', bg: 'bg-amber-500/15', icon: Users },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5"
            style={{
              backgroundColor: '#1A1A24',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className={cn('flex items-center justify-center h-11 w-11 rounded-xl shrink-0', stat.bg)}>
              <stat.icon className="h-5 w-5 text-white" style={{ color: stat.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">{stat.label}</p>
              <p className="text-xl font-bold text-white tabular-nums leading-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters + Add ── */}
      <div
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl p-4"
        style={{
          backgroundColor: '#1A1A24',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Add button */}
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold gap-2 rounded-lg px-5 h-10"
        >
          <Plus className="h-4 w-4" />
          إضافة جلسة جديدة
        </Button>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            <span>تصفية:</span>
          </div>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36 bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 h-10">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              <SelectItem value="all" className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                كل الحالات
              </SelectItem>
              <SelectItem value="completed" className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                مكتملة
              </SelectItem>
              <SelectItem value="in-progress" className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                جارية
              </SelectItem>
              <SelectItem value="upcoming" className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                قادمة
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Class filter */}
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 h-10">
              <SelectValue placeholder="الفصل" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              <SelectItem value="all" className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                كل الفصول
              </SelectItem>
              {Object.entries(CLASS_FILTER_MAP).map(([id, name]) => (
                <SelectItem
                  key={id}
                  value={id}
                  className="text-slate-200 focus:bg-white/[0.05] focus:text-white"
                >
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Active filter indicators */}
          {(statusFilter !== 'all' || classFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 px-3 text-slate-400 hover:text-white hover:bg-white/[0.06]"
              onClick={() => {
                setStatusFilter('all');
                setClassFilter('all');
              }}
            >
              <X className="h-4 w-4 ml-1" />
              مسح
            </Button>
          )}
        </div>
      </div>

      {/* ── Sessions Grid ── */}
      {filteredSessions.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 px-4 rounded-xl"
          style={{
            backgroundColor: '#1A1A24',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6">
            <Calendar className="h-10 w-10 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">
            لا توجد جلسات
          </h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
            لم يتم العثور على جلسات تطابق معايير البحث المحددة
          </p>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold gap-2 rounded-lg px-6"
          >
            <Plus className="h-4 w-4" />
            إضافة جلسة جديدة
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredSessions.map((session) => (
            <SessionCardComponent
              key={session.id}
              session={session}
              onView={handleView}
            />
          ))}
        </div>
      )}

      {/* ── Dialogs ── */}
      <SessionDetailDialog
        session={selectedSession}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <AddSessionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </div>
  );
}
