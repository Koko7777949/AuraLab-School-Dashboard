'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ClipboardCheck,
  Pencil,
  Trash2,
  Eye,
  Search,
  CalendarDays,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Save,
  BarChart3,
  Flame,
} from 'lucide-react';
import { create } from 'zustand';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ---------------------------------------------------------------------------
// Types (local)
// ---------------------------------------------------------------------------

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string | null;
  date: string;
  status: AttendanceStatus;
  notes: string;
  createdAt: string;
  studentName: string;
}

interface ClassOption {
  value: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ITEMS_PER_PAGE = 10;

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: typeof CheckCircle2; color: string; bgClass: string; badgeClass: string }> = {
  present: {
    label: 'حاضر',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
  },
  absent: {
    label: 'غائب',
    icon: XCircle,
    color: 'text-rose-400',
    bgClass: 'bg-rose-500/10 border-rose-500/20',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/20 hover:bg-rose-500/20',
  },
  late: {
    label: 'متأخر',
    icon: Clock,
    color: 'text-amber-400',
    bgClass: 'bg-amber-500/10 border-amber-500/20',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
  },
  excused: {
    label: 'مستأذن',
    icon: ShieldAlert,
    color: 'text-sky-400',
    bgClass: 'bg-sky-500/10 border-sky-500/20',
    badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/20 hover:bg-sky-500/20',
  },
};

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: 'حاضر' },
  { value: 'absent', label: 'غائب' },
  { value: 'late', label: 'متأخر' },
  { value: 'excused', label: 'مستأذن' },
];

const FILTER_STATUS_OPTIONS = [
  { value: 'all', label: 'جميع الحالات' },
  ...STATUS_OPTIONS,
];

const CLASS_OPTIONS: ClassOption[] = [
  { value: 'class-1', label: 'الصف الأول - أ' },
  { value: 'class-2', label: 'الصف الأول - ب' },
  { value: 'class-3', label: 'الصف الثاني - أ' },
  { value: 'class-4', label: 'الصف الثاني - ب' },
  { value: 'class-5', label: 'الصف الثالث - أ' },
  { value: 'class-6', label: 'الصف الثالث - ب' },
];

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const ARABIC_DAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

function generateMockAttendance(): AttendanceRecord[] {
  const students = [
    { id: 'std-001', name: 'أحمد محمد علي', classId: 'class-1' },
    { id: 'std-002', name: 'فاطمة أحمد حسن', classId: 'class-2' },
    { id: 'std-003', name: 'عبدالله خالد العتيبي', classId: 'class-3' },
    { id: 'std-004', name: 'نورة سعيد القحطاني', classId: 'class-1' },
    { id: 'std-005', name: 'محمد عبدالرحمن الدوسري', classId: 'class-5' },
    { id: 'std-006', name: 'ريم فهد المطيري', classId: 'class-4' },
    { id: 'std-007', name: 'سلطان فيصل الشمري', classId: 'class-3' },
    { id: 'std-008', name: 'لطيفة عايض الحربي', classId: 'class-6' },
    { id: 'std-009', name: 'يزيد ناصر البقمي', classId: 'class-2' },
    { id: 'std-010', name: 'سارة ماجد العنزي', classId: 'class-5' },
    { id: 'std-011', name: 'عمر إبراهيم الزهراني', classId: 'class-4' },
    { id: 'std-012', name: 'هند تركي السبيعي', classId: 'class-6' },
  ];

  const statuses: AttendanceStatus[] = ['present', 'present', 'present', 'present', 'present', 'absent', 'late', 'excused', 'present', 'present'];
  const notesMap: Record<string, string[]> = {
    present: ['', '', ''],
    absent: ['لم يحضر بدون عذر', 'غياب مرضي'],
    late: ['تأخر 15 دقيقة', 'تأخر بسبب النقل'],
    excused: ['إذن مرضي', 'إذن عائلي'],
  };

  const records: AttendanceRecord[] = [];
  const today = new Date();

  for (let dayOffset = 0; dayOffset < 15; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);

    // Skip weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) continue;

    // 6-8 students per day
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const dailyStudents = shuffled.slice(0, 6 + Math.floor(Math.random() * 3));

    for (const student of dailyStudents) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const noteOptions = notesMap[status];
      const notes = noteOptions[Math.floor(Math.random() * noteOptions.length)];

      records.push({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        studentId: student.id,
        classId: student.classId,
        date: date.toISOString(),
        status,
        notes,
        createdAt: date.toISOString(),
        studentName: student.name,
      });
    }
  }

  return records;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClassName(classId: string | null): string {
  if (!classId) return '—';
  const found = CLASS_OPTIONS.find((c) => c.value === classId);
  return found ? found.label : '—';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
}

function getStatusLabel(status: AttendanceStatus): string {
  return STATUS_CONFIG[status].label;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Attendance status badge */
function StatusBadge({ status }: { status: AttendanceStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full gap-1', config.badgeClass)}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

/** Stat summary card */
function StatCard({
  icon: Icon,
  label,
  count,
  total,
  colorClass,
  bgColor,
  borderColor,
}: {
  icon: typeof CheckCircle2;
  label: string;
  count: number;
  total: number;
  colorClass: string;
  bgColor: string;
  borderColor: string;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div
      className="rounded-xl p-4 transition-all duration-200 hover:scale-[1.02]"
      style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn('flex items-center justify-center h-10 w-10 rounded-xl', bgColor)}>
            <Icon className={cn('h-5 w-5', colorClass)} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white tabular-nums">{count}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
        <span className={cn('text-lg font-bold tabular-nums', colorClass)}>{percentage}%</span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', bgColor.replace('/10', '/60'))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/** Empty state */
function EmptyState({ onMark }: { onMark: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6">
        <ClipboardCheck className="h-10 w-10 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-300 mb-2">
        لا توجد سجلات حضور
      </h3>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
        ابدأ بتسجيل حضور الطلاب يومياً لمتابعة انتظامهم ومعدلات حضورهم
      </p>
      <Button
        onClick={onMark}
        className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold gap-2 rounded-lg px-6 btn-shine"
      >
        <ClipboardCheck className="h-4 w-4" />
        تسجيل حضور
      </Button>
    </div>
  );
}

/** View attendance dialog */
function ViewAttendanceDialog({
  record,
  open,
  onOpenChange,
}: {
  record: AttendanceRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!record) return null;

  const config = STATUS_CONFIG[record.status];
  const StatusIcon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        dir="rtl"
        style={{
          backgroundColor: '#1A1A24',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-white text-xl">تفاصيل سجل الحضور</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            عرض تفاصيل سجل حضور الطالب
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div className="grid grid-cols-1 gap-4">
              {/* Student name */}
              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                    <Users className="h-4 w-4 text-[#D4A574]" />
                  </div>
                  <span className="text-sm text-muted-foreground">اسم الطالب</span>
                </div>
                <span className="text-sm font-medium text-slate-200">{record.studentName}</span>
              </div>

              {/* Date */}
              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                    <CalendarDays className="h-4 w-4 text-[#D4A574]" />
                  </div>
                  <span className="text-sm text-muted-foreground">التاريخ</span>
                </div>
                <span className="text-sm font-medium text-slate-200">{formatDate(record.date)}</span>
              </div>

              {/* Class */}
              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                    <Users className="h-4 w-4 text-[#D4A574]" />
                  </div>
                  <span className="text-sm text-muted-foreground">الفصل</span>
                </div>
                <span className="text-sm font-medium text-slate-200">{getClassName(record.classId)}</span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className={cn('flex items-center justify-center h-8 w-8 rounded-lg', config.bgClass)}>
                    <StatusIcon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <span className="text-sm text-muted-foreground">الحالة</span>
                </div>
                <StatusBadge status={record.status} />
              </div>
            </div>
          </div>

          {/* Notes */}
          {record.notes && (
            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <h4 className="text-sm font-semibold text-slate-300 mb-2">ملاحظات</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{record.notes}</p>
            </div>
          )}

          {/* Created at */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
            <span>تاريخ التسجيل: {new Date(record.createdAt).toLocaleDateString('ar-SA')}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Edit form content
// ---------------------------------------------------------------------------

function EditFormContent({
  record,
  onClose,
}: {
  record: AttendanceRecord | null;
  onClose: () => void;
}) {
  const { updateAttendanceRecord } = useAttendanceStore();
  const [status, setStatus] = useState<AttendanceStatus>(record?.status ?? 'present');
  const [notes, setNotes] = useState(record?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

    updateAttendanceRecord(record.id, { status, notes });
    toast.success('تم تحديث سجل الحضور');
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
      {/* Status radio buttons */}
      <div className="flex flex-col gap-2">
        <Label className="text-slate-300 text-sm">حالة الحضور</Label>
        <div className="grid grid-cols-2 gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const config = STATUS_CONFIG[opt.value];
            const Icon = config.icon;
            const isSelected = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl py-3 px-4 border transition-all duration-200',
                  isSelected
                    ? config.bgClass + ' ' + config.color + ' font-semibold'
                    : 'border-white/[0.06] text-slate-400 hover:bg-white/[0.04] hover:text-slate-300'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-2">
        <Label className="text-slate-300 text-sm">ملاحظات</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="أضف ملاحظات حول الحضور..."
          className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 min-h-[80px] resize-none"
        />
      </div>

      <DialogFooter className="flex-row gap-3 sm:justify-start pt-2">
        <Button
          type="submit"
          className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold rounded-lg px-6 gap-2"
        >
          <Save className="h-4 w-4" />
          حفظ التغييرات
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-lg px-6"
        >
          إلغاء
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditAttendanceDialog({
  record,
  open,
  onOpenChange,
}: {
  record: AttendanceRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        dir="rtl"
        style={{
          backgroundColor: '#1A1A24',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-white text-xl">تعديل سجل الحضور</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {record ? `تعديل حضور ${record.studentName}` : ''}
          </DialogDescription>
        </DialogHeader>
        {open && record && (
          <EditFormContent record={record} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Delete confirmation dialog */
function DeleteAttendanceDialog({
  record,
  open,
  onOpenChange,
}: {
  record: AttendanceRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { deleteAttendanceRecord } = useAttendanceStore();

  const handleDelete = () => {
    if (record) {
      deleteAttendanceRecord(record.id);
      toast.success('تم حذف سجل الحضور');
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        dir="rtl"
        style={{
          backgroundColor: '#1A1A24',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white text-lg">تأكيد حذف سجل الحضور</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground leading-relaxed">
            هل أنت متأكد من حذف سجل حضور{' '}
            <span className="font-semibold text-slate-200">{record?.studentName}</span>
            {' '}بتاريخ{' '}
            <span className="font-semibold text-slate-200">{record ? formatDate(record.date) : ''}</span>؟
            <br />
            لا يمكن التراجع عن هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-3 sm:justify-start mt-2">
          <AlertDialogCancel className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-lg px-6 mt-0">
            إلغاء
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg px-6 gap-2"
          >
            <Trash2 className="h-4 w-4" />
            نعم، احذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Attendance Marking Mode (class roster with radio buttons)
// ---------------------------------------------------------------------------

interface MarkingStudent {
  id: string;
  name: string;
  classId: string;
}

function MarkAttendanceDialog({
  open,
  onOpenChange,
  students,
  selectedClass,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: MarkingStudent[];
  selectedClass: string;
}) {
  const { addAttendanceRecords } = useAttendanceStore();
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  // Initialize all as present when dialog opens (use key-based reset pattern)
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      const init: Record<string, AttendanceStatus> = {};
      const initNotes: Record<string, string> = {};
      students.forEach((s) => {
        init[s.id] = 'present';
        initNotes[s.id] = '';
      });
      // Use rAF to avoid synchronous setState in effect
      requestAnimationFrame(() => {
        setAttendanceMap(init);
        setNoteMap(initNotes);
      });
    }
    prevOpenRef.current = open;
  }, [open, students]);

  const handleStatusChange = useCallback((studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  }, []);

  const handleNoteChange = useCallback((studentId: string, note: string) => {
    setNoteMap((prev) => ({ ...prev, [studentId]: note }));
  }, []);

  const handleSubmit = () => {
    const today = new Date().toISOString().split('T')[0];
    const records: AttendanceRecord[] = students.map((s) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      studentId: s.id,
      classId: s.classId,
      date: today,
      status: attendanceMap[s.id] || 'present',
      notes: noteMap[s.id] || '',
      createdAt: new Date().toISOString(),
      studentName: s.name,
    }));

    addAttendanceRecords(records);
    toast.success(`تم تسجيل حضور ${students.length} طالب بنجاح`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        dir="rtl"
        style={{
          backgroundColor: '#1A1A24',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-[#D4A574]" />
            تسجيل حضور — {getClassName(selectedClass)}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </DialogDescription>
        </DialogHeader>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto max-h-[55vh] -mx-1 px-1">
          <div className="flex flex-col gap-2">
            {students.map((student) => {
              const currentStatus = attendanceMap[student.id] || 'present';
              return (
                <div
                  key={student.id}
                  className={cn(
                    'rounded-xl p-3 transition-all duration-200',
                    'hover:bg-white/[0.04]',
                    STATUS_CONFIG[currentStatus].bgClass.replace('/10', '/5'),
                    'border border-white/[0.04]',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Student name + avatar */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-[#D4A574]/20 to-[#D4A574]/5 shrink-0 border border-[#D4A574]/10">
                        <span className="text-xs font-bold text-[#D4A574]">
                          {student.name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-200 truncate">
                        {student.name}
                      </span>
                    </div>

                    {/* Status radio buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {STATUS_OPTIONS.map((opt) => {
                        const isSelected = currentStatus === opt.value;
                        const config = STATUS_CONFIG[opt.value];
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleStatusChange(student.id, opt.value)}
                            title={opt.label}
                            className={cn(
                              'flex items-center justify-center h-8 w-8 rounded-lg border transition-all duration-200',
                              isSelected
                                ? config.bgClass + ' ' + config.color
                                : 'border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                            )}
                          >
                            <config.icon className="h-3.5 w-3.5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Note input (expandable) */}
                  {currentStatus !== 'present' && (
                    <div className="mt-2 mr-11">
                      <input
                        type="text"
                        value={noteMap[student.id] || ''}
                        onChange={(e) => handleNoteChange(student.id, e.target.value)}
                        placeholder="أضف سبب أو ملاحظة..."
                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#D4A574]/40"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex-row gap-3 sm:justify-start pt-3 border-t border-white/[0.06] mt-2">
          <Button
            onClick={handleSubmit}
            className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold rounded-lg px-6 gap-2"
          >
            <Save className="h-4 w-4" />
            حفظ الحضور
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-lg px-6"
          >
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Attendance Heatmap Calendar
// ---------------------------------------------------------------------------

function AttendanceHeatmap({
  records,
  currentMonth,
  currentYear,
  onMonthChange,
  onYearChange,
}: {
  records: AttendanceRecord[];
  currentMonth: number;
  currentYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}) {
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Group records by date for this month
  const dateMap = new Map<string, AttendanceRecord[]>();
  for (const rec of records) {
    const d = new Date(rec.date);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      const key = d.getDate().toString();
      if (!dateMap.has(key)) dateMap.set(key, []);
      dateMap.get(key)!.push(rec);
    }
  }

  const getCellColor = (day: number) => {
    const dayRecords = dateMap.get(day.toString());
    if (!dayRecords || dayRecords.length === 0) return 'bg-white/[0.02]';
    const presentCount = dayRecords.filter((r) => r.status === 'present').length;
    const ratio = presentCount / dayRecords.length;
    if (ratio >= 0.9) return 'bg-emerald-500/40';
    if (ratio >= 0.7) return 'bg-emerald-500/25';
    if (ratio >= 0.5) return 'bg-amber-500/25';
    if (ratio > 0) return 'bg-rose-500/25';
    return 'bg-rose-500/40';
  };

  const getDaySummary = (day: number) => {
    const dayRecords = dateMap.get(day.toString());
    if (!dayRecords || dayRecords.length === 0) return null;
    const present = dayRecords.filter((r) => r.status === 'present').length;
    const absent = dayRecords.filter((r) => r.status === 'absent').length;
    const late = dayRecords.filter((r) => r.status === 'late').length;
    const excused = dayRecords.filter((r) => r.status === 'excused').length;
    return { total: dayRecords.length, present, absent, late, excused };
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      onMonthChange(11);
      onYearChange(currentYear - 1);
    } else {
      onMonthChange(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      onMonthChange(0);
      onYearChange(currentYear + 1);
    } else {
      onMonthChange(currentMonth + 1);
    }
  };

  // Build calendar grid (6 rows × 7 columns)
  const cells: (number | null)[] = [];
  // Add empty cells for offset (Saturday-first week: shift by (firstDay + 1) % 7)
  const offset = (firstDayOfMonth + 1) % 7;
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#D4A574]" />
          خريطة الحضور الشهرية
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-slate-200 min-w-[120px] text-center">
            {ARABIC_MONTHS[currentMonth]} {currentYear}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {ARABIC_DAYS.map((day) => (
          <div key={day} className="text-center text-[10px] font-semibold text-muted-foreground/60 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }

          const summary = getDaySummary(day);
          const isToday =
            day === new Date().getDate() &&
            currentMonth === new Date().getMonth() &&
            currentYear === new Date().getFullYear();

          return (
            <div
              key={day}
              className={cn(
                'aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative transition-all duration-200 cursor-default',
                getCellColor(day),
                isToday && 'ring-1 ring-[#D4A574]/60 ring-offset-1 ring-offset-[#121218]'
              )}
              title={summary ? `حاضر: ${summary.present}, غائب: ${summary.absent}, متأخر: ${summary.late}, مستأذن: ${summary.excused}` : 'لا توجد بيانات'}
            >
              <span className={cn(
                'font-medium tabular-nums',
                summary ? 'text-slate-200' : 'text-muted-foreground/40'
              )}>
                {day}
              </span>
              {summary && summary.total > 0 && (
                <span className="text-[9px] text-muted-foreground/50 mt-0.5">
                  {summary.total}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-emerald-500/40" />
          <span className="text-[10px] text-muted-foreground">ممتاز</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-emerald-500/25" />
          <span className="text-[10px] text-muted-foreground">جيد</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-amber-500/25" />
          <span className="text-[10px] text-muted-foreground">متوسط</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-rose-500/25" />
          <span className="text-[10px] text-muted-foreground">ضعيف</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-rose-500/40" />
          <span className="text-[10px] text-muted-foreground">حرج</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Local Zustand Store for Attendance Records
// ---------------------------------------------------------------------------

interface AttendanceState {
  records: AttendanceRecord[];
  setRecords: (records: AttendanceRecord[]) => void;
  addAttendanceRecords: (records: AttendanceRecord[]) => void;
  updateAttendanceRecord: (id: string, data: Partial<AttendanceRecord>) => void;
  deleteAttendanceRecord: (id: string) => void;
}

const useAttendanceStore = create<AttendanceState>((set) => ({
  records: [],
  setRecords: (records) => set({ records }),
  addAttendanceRecords: (newRecords) =>
    set((state) => ({ records: [...newRecords, ...state.records] })),
  updateAttendanceRecord: (id, data) =>
    set((state) => ({
      records: state.records.map((r) => (r.id === id ? { ...r, ...data } : r)),
    })),
  deleteAttendanceRecord: (id) =>
    set((state) => ({
      records: state.records.filter((r) => r.id !== id),
    })),
}));

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AttendanceSection() {
  const { students } = useAppStore();
  const { records, setRecords } = useAttendanceStore();

  // Local UI state
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialogs
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [markOpen, setMarkOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Calendar state
  const today = new Date();
  const [heatmapMonth, setHeatmapMonth] = useState(today.getMonth());
  const [heatmapYear, setHeatmapYear] = useState(today.getFullYear());

  // Initialize mock data once
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && records.length === 0) {
      initialized.current = true;
      const mock = generateMockAttendance();
      requestAnimationFrame(() => setRecords(mock));
    }
  }, []);

  // Statistics
  const stats = useMemo(() => {
    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const excused = records.filter((r) => r.status === 'excused').length;
    const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, absent, late, excused, attendanceRate };
  }, [records]);

  // Filtered & searched records
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Class filter
    if (classFilter !== 'all') {
      result = result.filter((r) => r.classId === classFilter);
    }

    // Date filter
    if (dateFilter) {
      result = result.filter((r) => {
        const d = new Date(r.date);
        const filterDate = new Date(dateFilter);
        return (
          d.getFullYear() === filterDate.getFullYear() &&
          d.getMonth() === filterDate.getMonth() &&
          d.getDate() === filterDate.getDate()
        );
      });
    }

    // Search filter
    if (localSearch.trim()) {
      const query = localSearch.trim().toLowerCase();
      result = result.filter((r) => r.studentName.toLowerCase().includes(query));
    }

    // Sort by date descending
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  }, [records, statusFilter, classFilter, dateFilter, localSearch]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ITEMS_PER_PAGE));
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Get students for the selected class (for marking mode)
  const classStudents = useMemo(() => {
    if (classFilter === 'all') {
      // If no class filter, use first class with students
      const activeClass = CLASS_OPTIONS.find((c) =>
        students.some((s) => s.classId === c.value)
      );
      if (!activeClass) return [];
      return students
        .filter((s) => s.classId === activeClass.value && s.status === 'active')
        .map((s) => ({ id: s.id, name: s.name, classId: s.classId! }));
    }
    return students
      .filter((s) => s.classId === classFilter && s.status === 'active')
      .map((s) => ({ id: s.id, name: s.name, classId: s.classId! }));
  }, [students, classFilter]);

  // Handlers
  const handleMarkAttendance = () => {
    if (classStudents.length === 0) {
      toast.error('لا يوجد طلاب في الفصل المحدد. اختر فصلاً يحتوي على طلاب.');
      return;
    }
    setMarkOpen(true);
  };

  const handleView = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setViewOpen(true);
  };

  const handleEdit = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setEditOpen(true);
  };

  const handleDelete = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setDeleteOpen(true);
  };

  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  // Reset page on filter changes (tracked via ref to avoid setState in effect)
  const prevFiltersRef = useRef({ statusFilter, classFilter, dateFilter, localSearch });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (
      prev.statusFilter !== statusFilter ||
      prev.classFilter !== classFilter ||
      prev.dateFilter !== dateFilter ||
      prev.localSearch !== localSearch
    ) {
      prevFiltersRef.current = { statusFilter, classFilter, dateFilter, localSearch };
      requestAnimationFrame(() => setCurrentPage(1));
    }
  }, [statusFilter, classFilter, dateFilter, localSearch]);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* ── Page Title ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#D4A574]/10">
            <ClipboardCheck className="h-5 w-5 text-[#D4A574]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl flex items-center gap-3">
              إدارة الحضور
              <Badge className="bg-[#D4A574]/15 text-[#D4A574] border-[#D4A574]/20 hover:bg-[#D4A574]/20 text-sm px-2.5 py-0.5 rounded-full font-semibold tabular-nums">
                {records.length}
              </Badge>
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              متابعة حضور الطلاب وانتظامهم اليومي
            </p>
          </div>
        </div>
      </div>

      {/* ── Statistics Summary Cards ── */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Overall rate */}
          <div
            className="rounded-xl p-4 flex items-center gap-3 transition-all duration-200 hover:scale-[1.02]"
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-[#D4A574]/20 to-[#D4A574]/5 border border-[#D4A574]/10">
              <Flame className="h-6 w-6 text-[#D4A574]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white tabular-nums">{stats.attendanceRate}%</p>
              <p className="text-xs text-muted-foreground">معدل الحضور</p>
            </div>
          </div>

          <StatCard
            icon={CheckCircle2}
            label="حاضر"
            count={stats.present}
            total={stats.total}
            colorClass="text-emerald-400"
            bgColor="bg-emerald-500/10"
            borderColor="border-emerald-500/20"
          />

          <StatCard
            icon={XCircle}
            label="غائب"
            count={stats.absent}
            total={stats.total}
            colorClass="text-rose-400"
            bgColor="bg-rose-500/10"
            borderColor="border-rose-500/20"
          />

          <StatCard
            icon={Clock}
            label="متأخر"
            count={stats.late}
            total={stats.total}
            colorClass="text-amber-400"
            bgColor="bg-amber-500/10"
            borderColor="border-amber-500/20"
          />

          <StatCard
            icon={ShieldAlert}
            label="مستأذن"
            count={stats.excused}
            total={stats.total}
            colorClass="text-sky-400"
            bgColor="bg-sky-500/10"
            borderColor="border-sky-500/20"
          />
        </div>
      )}

      {/* ── Action Bar ── */}
      <div
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl p-4"
        style={{
          backgroundColor: '#1A1A24',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleMarkAttendance}
            className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold gap-2 rounded-lg px-5 h-10"
          >
            <ClipboardCheck className="h-4 w-4" />
            تسجيل حضور
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
            <Input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="بحث باسم الطالب..."
              className="pr-10 w-full sm:w-56 bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 h-10"
            />
          </div>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36 bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              {FILTER_STATUS_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-slate-200 focus:bg-white/[0.05] focus:text-white"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Class filter */}
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              <SelectItem value="all" className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                جميع الصفوف
              </SelectItem>
              {CLASS_OPTIONS.map((cls) => (
                <SelectItem
                  key={cls.value}
                  value={cls.value}
                  className="text-slate-200 focus:bg-white/[0.05] focus:text-white"
                >
                  {cls.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full sm:w-auto bg-white/[0.03] border border-white/[0.08] text-slate-200 text-sm rounded-lg px-3 py-2 focus:border-[#D4A574]/50 focus:outline-none focus:ring-1 focus:ring-[#D4A574]/20 [color-scheme:dark] h-10"
          />
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      {filteredRecords.length === 0 && !dateFilter && !statusFilter && !classFilter && !localSearch ? (
        <div
          className="rounded-xl"
          style={{
            backgroundColor: '#1A1A24',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <EmptyState onMark={handleMarkAttendance} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Attendance Table (2/3 width) ── */}
          <div
            className="lg:col-span-2 rounded-xl overflow-hidden"
            style={{
              backgroundColor: '#1A1A24',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Search className="h-8 w-8 text-slate-600 mb-3" />
                <p className="text-sm text-muted-foreground">لا توجد نتائج مطابقة للبحث</p>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setLocalSearch('');
                    setStatusFilter('all');
                    setClassFilter('all');
                    setDateFilter('');
                  }}
                  className="mt-3 text-[#D4A574] hover:text-[#B8895A] hover:bg-[#D4A574]/10 text-sm"
                >
                  مسح الفلاتر
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
                      <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3.5 px-4">
                        التاريخ
                      </TableHead>
                      <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3.5 px-4">
                        الطالب
                      </TableHead>
                      <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3.5 px-4 hidden md:table-cell">
                        الفصل
                      </TableHead>
                      <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3.5 px-4">
                        الحالة
                      </TableHead>
                      <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3.5 px-4 hidden lg:table-cell">
                        ملاحظات
                      </TableHead>
                      <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3.5 px-4 text-center">
                        إجراءات
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecords.map((record, index) => (
                      <TableRow
                        key={record.id}
                        className={cn(
                          'border-b border-white/[0.04] transition-all duration-200',
                          'hover:bg-white/[0.04]',
                          index % 2 === 1 ? 'bg-white/[0.015]' : 'bg-transparent',
                        )}
                      >
                        {/* Date */}
                        <TableCell className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/50" />
                            <span className="text-sm text-slate-300">{formatDateShort(record.date)}</span>
                          </div>
                        </TableCell>

                        {/* Student */}
                        <TableCell className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-[#D4A574]/20 to-[#D4A574]/5 shrink-0 border border-[#D4A574]/10">
                              <span className="text-xs font-bold text-[#D4A574]">
                                {record.studentName.charAt(0)}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-slate-200 truncate max-w-[140px]">
                              {record.studentName}
                            </span>
                          </div>
                        </TableCell>

                        {/* Class */}
                        <TableCell className="py-3.5 px-4 hidden md:table-cell">
                          <span className="text-sm text-slate-300">
                            {getClassName(record.classId)}
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-3.5 px-4">
                          <StatusBadge status={record.status} />
                        </TableCell>

                        {/* Notes */}
                        <TableCell className="py-3.5 px-4 hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground truncate block max-w-[180px]">
                            {record.notes || '—'}
                          </span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(record)}
                              className="h-8 w-8 text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg"
                              title="عرض"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(record)}
                              className="h-8 w-8 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg"
                              title="تعديل"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(record)}
                              className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                  <div
                    className="flex items-center justify-between px-4 py-3 border-t"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                  >
                    <div className="text-xs text-muted-foreground/60">
                      عرض{' '}
                      <span className="font-semibold text-slate-300 tabular-nums">
                        {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                      </span>
                      {' - '}
                      <span className="font-semibold text-slate-300 tabular-nums">
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredRecords.length)}
                      </span>
                      {' '}من{' '}
                      <span className="font-semibold text-slate-300 tabular-nums">
                        {filteredRecords.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed rounded-lg"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>

                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let page: number;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'outline' : 'ghost'}
                            size="icon"
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              'h-8 w-8 text-sm font-medium tabular-nums rounded-lg transition-all',
                              currentPage === page
                                ? 'bg-[#D4A574]/15 text-[#D4A574] border-[#D4A574]/30 hover:bg-[#D4A574]/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                            )}
                          >
                            {page}
                          </Button>
                        );
                      })}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed rounded-lg"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Heatmap Calendar (1/3 width) ── */}
          <div>
            <AttendanceHeatmap
              records={records}
              currentMonth={heatmapMonth}
              currentYear={heatmapYear}
              onMonthChange={setHeatmapMonth}
              onYearChange={setHeatmapYear}
            />
          </div>
        </div>
      )}

      {/* ── Dialogs ── */}
      <ViewAttendanceDialog
        record={selectedRecord}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />

      <EditAttendanceDialog
        record={selectedRecord}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <DeleteAttendanceDialog
        record={selectedRecord}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />

      <MarkAttendanceDialog
        open={markOpen}
        onOpenChange={setMarkOpen}
        students={classStudents}
        selectedClass={classFilter !== 'all' ? classFilter : CLASS_OPTIONS.find((c) => students.some((s) => s.classId === c.value))?.value || 'class-1'}
      />
    </div>
  );
}
