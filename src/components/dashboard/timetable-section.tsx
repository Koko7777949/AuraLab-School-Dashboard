'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  CalendarRange,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Printer,
  LayoutGrid,
  List,
  BookOpen,
  User,
  DoorOpen,
  Clock,
  FileText,
  Info,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ScheduleBlock } from '@/lib/types';

// shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
// Constants
// ---------------------------------------------------------------------------

type DayOfWeek = 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu';

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'sat', label: 'السبت' },
  { value: 'sun', label: 'الأحد' },
  { value: 'mon', label: 'الإثنين' },
  { value: 'tue', label: 'الثلاثاء' },
  { value: 'wed', label: 'الأربعاء' },
  { value: 'thu', label: 'الخميس' },
];

const PERIODS: { value: number; label: string; time: string }[] = [
  { value: 1, label: 'الحصة 1', time: '7:30 - 8:15' },
  { value: 2, label: 'الحصة 2', time: '8:20 - 9:05' },
  { value: 3, label: 'الحصة 3', time: '9:10 - 9:55' },
  { value: 4, label: 'الحصة 4', time: '10:10 - 10:55' },
  { value: 5, label: 'الحصة 5', time: '11:00 - 11:45' },
  { value: 6, label: 'الحصة 6', time: '11:50 - 12:35' },
  { value: 7, label: 'الحصة 7', time: '12:40 - 1:25' },
];

const COLOR_PALETTE = [
  { value: '#D4A574', label: 'عنبري' },
  { value: '#60A5FA', label: 'أزرق' },
  { value: '#34D399', label: 'أخضر' },
  { value: '#F87171', label: 'أحمر' },
  { value: '#A78BFA', label: 'بنفسجي' },
  { value: '#FBBF24', label: 'أصفر' },
  { value: '#F472B6', label: 'وردي' },
  { value: '#2DD4BF', label: 'تركوازي' },
];

const SUBJECTS = [
  'الرياضيات',
  'اللغة العربية',
  'اللغة الإنجليزية',
  'العلوم',
  'الفيزياء',
  'الكيمياء',
  'الأحياء',
  'التاريخ',
  'الجغرافيا',
  'التربية الإسلامية',
  'الحاسب الآلي',
  'التربية الفنية',
  'التربية البدنية',
  'الإملاء',
  'الخط العربي',
];

// ---------------------------------------------------------------------------
// Mock Data Generator
// ---------------------------------------------------------------------------

function generateMockSchedule(): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [];
  let idCounter = 1;

  const teacherPool = [
    { id: 'tch-1', name: 'أحمد الغامدي' },
    { id: 'tch-2', name: 'فاطمة الزهراني' },
    { id: 'tch-3', name: 'محمد القحطاني' },
    { id: 'tch-4', name: 'نورة العتيبي' },
    { id: 'tch-5', name: 'خالد الشمري' },
    { id: 'tch-6', name: 'سارة المطيري' },
    { id: 'tch-7', name: 'عبدالله الدوسري' },
    { id: 'tch-8', name: 'هند الحربي' },
  ];

  const classPool = [
    { id: 'cls-1', name: 'الصف الأول - أ' },
    { id: 'cls-2', name: 'الصف الأول - ب' },
    { id: 'cls-3', name: 'الصف الثاني - أ' },
    { id: 'cls-4', name: 'الصف الثالث - أ' },
  ];

  const roomPool = ['101', '102', '103', '201', '202', '203', '301', 'مختبر العلوم', 'مختبر الحاسب'];

  const scheduleTemplate: { day: DayOfWeek; period: number; subject: string; teacherIdx: number; classIdx: number; roomIdx: number; colorIdx: number }[] = [
    // Saturday
    { day: 'sat', period: 1, subject: 'الرياضيات', teacherIdx: 0, classIdx: 0, roomIdx: 0, colorIdx: 0 },
    { day: 'sat', period: 2, subject: 'اللغة العربية', teacherIdx: 1, classIdx: 1, roomIdx: 1, colorIdx: 1 },
    { day: 'sat', period: 3, subject: 'العلوم', teacherIdx: 2, classIdx: 2, roomIdx: 7, colorIdx: 2 },
    { day: 'sat', period: 4, subject: 'اللغة الإنجليزية', teacherIdx: 3, classIdx: 0, roomIdx: 2, colorIdx: 3 },
    { day: 'sat', period: 5, subject: 'التربية الإسلامية', teacherIdx: 4, classIdx: 3, roomIdx: 3, colorIdx: 4 },
    // Sunday
    { day: 'sun', period: 1, subject: 'الفيزياء', teacherIdx: 5, classIdx: 2, roomIdx: 7, colorIdx: 5 },
    { day: 'sun', period: 2, subject: 'الرياضيات', teacherIdx: 0, classIdx: 1, roomIdx: 0, colorIdx: 0 },
    { day: 'sun', period: 3, subject: 'التاريخ', teacherIdx: 6, classIdx: 3, roomIdx: 4, colorIdx: 6 },
    { day: 'sun', period: 4, subject: 'الكيمياء', teacherIdx: 7, classIdx: 0, roomIdx: 7, colorIdx: 7 },
    { day: 'sun', period: 5, subject: 'اللغة العربية', teacherIdx: 1, classIdx: 2, roomIdx: 1, colorIdx: 1 },
    // Monday
    { day: 'mon', period: 1, subject: 'الأحياء', teacherIdx: 2, classIdx: 3, roomIdx: 7, colorIdx: 2 },
    { day: 'mon', period: 2, subject: 'الحاسب الآلي', teacherIdx: 5, classIdx: 0, roomIdx: 8, colorIdx: 3 },
    { day: 'mon', period: 3, subject: 'الرياضيات', teacherIdx: 0, classIdx: 2, roomIdx: 0, colorIdx: 0 },
    { day: 'mon', period: 4, subject: 'اللغة الإنجليزية', teacherIdx: 3, classIdx: 1, roomIdx: 2, colorIdx: 4 },
    { day: 'mon', period: 5, subject: 'الجغرافيا', teacherIdx: 6, classIdx: 0, roomIdx: 3, colorIdx: 5 },
    // Tuesday
    { day: 'tue', period: 1, subject: 'التربية الفنية', teacherIdx: 7, classIdx: 1, roomIdx: 5, colorIdx: 6 },
    { day: 'tue', period: 2, subject: 'العلوم', teacherIdx: 2, classIdx: 0, roomIdx: 7, colorIdx: 2 },
    { day: 'tue', period: 3, subject: 'اللغة العربية', teacherIdx: 1, classIdx: 3, roomIdx: 1, colorIdx: 1 },
    { day: 'tue', period: 4, subject: 'التربية البدنية', teacherIdx: 4, classIdx: 2, roomIdx: 6, colorIdx: 7 },
    { day: 'tue', period: 5, subject: 'الفيزياء', teacherIdx: 5, classIdx: 1, roomIdx: 7, colorIdx: 5 },
    // Wednesday
    { day: 'wed', period: 1, subject: 'الرياضيات', teacherIdx: 0, classIdx: 3, roomIdx: 0, colorIdx: 0 },
    { day: 'wed', period: 2, subject: 'الكيمياء', teacherIdx: 7, classIdx: 2, roomIdx: 7, colorIdx: 7 },
    { day: 'wed', period: 3, subject: 'الإملاء', teacherIdx: 1, classIdx: 0, roomIdx: 1, colorIdx: 3 },
    { day: 'wed', period: 4, subject: 'الأحياء', teacherIdx: 2, classIdx: 1, roomIdx: 7, colorIdx: 2 },
    { day: 'wed', period: 5, subject: 'التاريخ', teacherIdx: 6, classIdx: 2, roomIdx: 4, colorIdx: 6 },
    // Thursday
    { day: 'thu', period: 1, subject: 'اللغة الإنجليزية', teacherIdx: 3, classIdx: 3, roomIdx: 2, colorIdx: 4 },
    { day: 'thu', period: 2, subject: 'التربية الإسلامية', teacherIdx: 4, classIdx: 0, roomIdx: 3, colorIdx: 5 },
    { day: 'thu', period: 3, subject: 'الجغرافيا', teacherIdx: 6, classIdx: 1, roomIdx: 0, colorIdx: 6 },
    { day: 'thu', period: 4, subject: 'الحاسب الآلي', teacherIdx: 5, classIdx: 3, roomIdx: 8, colorIdx: 7 },
    { day: 'thu', period: 5, subject: 'الخط العربي', teacherIdx: 1, classIdx: 2, roomIdx: 1, colorIdx: 0 },
  ];

  for (const tpl of scheduleTemplate) {
    const periodDef = PERIODS.find((p) => p.value === tpl.period);
    const [start, end] = periodDef ? periodDef.time.split(' - ') : ['7:30', '8:15'];

    blocks.push({
      id: `sch-${idCounter++}`,
      dayOfWeek: tpl.day,
      period: tpl.period,
      subject: tpl.subject,
      teacherId: teacherPool[tpl.teacherIdx].id,
      teacherName: teacherPool[tpl.teacherIdx].name,
      classId: classPool[tpl.classIdx].id,
      className: classPool[tpl.classIdx].name,
      room: roomPool[tpl.roomIdx],
      startTime: start,
      endTime: end,
      color: COLOR_PALETTE[tpl.colorIdx].value,
      notes: '',
    });
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDayLabel(day: DayOfWeek): string {
  return DAYS.find((d) => d.value === day)?.label ?? day;
}

function getPeriodLabel(period: number): string {
  const p = PERIODS.find((pr) => pr.value === period);
  return p ? `${p.label} (${p.time})` : `الحصة ${period}`;
}

function getPeriodTime(period: number): string {
  const p = PERIODS.find((pr) => pr.value === period);
  return p ? p.time : '';
}

// ---------------------------------------------------------------------------
// View Dialog (read-only)
// ---------------------------------------------------------------------------

function ViewBlockDialog({
  block,
  open,
  onOpenChange,
}: {
  block: ScheduleBlock | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!block) return null;

  const fields: { label: string; icon: React.ElementType; value: string; color: string }[] = [
    { label: 'المادة', icon: BookOpen, value: block.subject, color: 'text-[#D4A574]' },
    { label: 'اليوم', icon: CalendarRange, value: getDayLabel(block.dayOfWeek), color: 'text-[#60A5FA]' },
    { label: 'الحصة', icon: Clock, value: getPeriodLabel(block.period), color: 'text-[#34D399]' },
    { label: 'المعلم', icon: User, value: block.teacherName ?? '—', color: 'text-[#A78BFA]' },
    { label: 'الفصل', icon: DoorOpen, value: block.className ?? '—', color: 'text-[#FBBF24]' },
    { label: 'القاعة', icon: DoorOpen, value: block.room, color: 'text-[#F472B6]' },
    { label: 'من', icon: Clock, value: block.startTime, color: 'text-[#2DD4BF]' },
    { label: 'إلى', icon: Clock, value: block.endTime, color: 'text-[#2DD4BF]' },
  ];

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
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${block.color}20` }}
            >
              <BookOpen className="h-4 w-4" style={{ color: block.color }} />
            </div>
            تفاصيل الحصة
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            عرض تفاصيل حصة {block.subject}
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
            <div className="grid grid-cols-1 gap-3">
              {fields.map((field) => {
                const Icon = field.icon;
                return (
                  <div
                    key={field.label}
                    className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04] last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center h-8 w-8 rounded-lg"
                        style={{ backgroundColor: `${field.color}15` }}
                      >
                        <Icon className={cn('h-4 w-4', field.color)} />
                      </div>
                      <span className="text-sm text-muted-foreground">{field.label}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-200">{field.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          {block.notes && (
            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#D4A574]" />
                ملاحظات
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{block.notes}</p>
            </div>
          )}

          {/* Color indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div
              className="h-4 w-4 rounded-full border border-white/10"
              style={{ backgroundColor: block.color }}
            />
            <span>لون التصنيف</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit Dialog
// ---------------------------------------------------------------------------

function AddEditBlockDialog({
  block,
  open,
  onOpenChange,
  defaultDay,
  defaultPeriod,
}: {
  block: ScheduleBlock | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDay?: DayOfWeek;
  defaultPeriod?: number;
}) {
  const { addScheduleBlock, updateScheduleBlock, teachers, classes } = useAppStore();
  const isEdit = !!block;

  const [day, setDay] = useState<DayOfWeek>(defaultDay ?? 'sat');
  const [period, setPeriod] = useState<number>(defaultPeriod ?? 1);
  const [subject, setSubject] = useState('');
  const [teacherId, setTeacherId] = useState<string>('');
  const [classId, setClassId] = useState<string>('');
  const [room, setRoom] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [color, setColor] = useState<string>(COLOR_PALETTE[0].value);
  const [notes, setNotes] = useState('');
  const [subjectSuggestionsOpen, setSubjectSuggestionsOpen] = useState(false);

  // Populate fields when editing or when dialog opens for adding
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      if (block) {
        requestAnimationFrame(() => {
          setDay(block.dayOfWeek);
          setPeriod(block.period);
          setSubject(block.subject);
          setTeacherId(block.teacherId ?? '');
          setClassId(block.classId ?? '');
          setRoom(block.room);
          setStartTime(block.startTime);
          setEndTime(block.endTime);
          setColor(block.color);
          setNotes(block.notes);
        });
      } else {
        const defDay = defaultDay ?? 'sat';
        const defPeriod = defaultPeriod ?? 1;
        const pDef = PERIODS.find((p) => p.value === defPeriod);
        const [s, e] = pDef ? pDef.time.split(' - ') : ['7:30', '8:15'];
        requestAnimationFrame(() => {
          setDay(defDay);
          setPeriod(defPeriod);
          setSubject('');
          setTeacherId('');
          setClassId('');
          setRoom('');
          setStartTime(s);
          setEndTime(e);
          setColor(COLOR_PALETTE[0].value);
          setNotes('');
        });
      }
      requestAnimationFrame(() => setSubjectSuggestionsOpen(false));
    }
    prevOpenRef.current = open;
  }, [open, block, defaultDay, defaultPeriod]);

  // Update times when period changes
  const handlePeriodChange = useCallback((val: string) => {
    const num = parseInt(val, 10);
    setPeriod(num);
    const pDef = PERIODS.find((p) => p.value === num);
    if (pDef) {
      const [s, e] = pDef.time.split(' - ');
      setStartTime(s);
      setEndTime(e);
    }
  }, []);

  // Filter subject suggestions
  const subjectSuggestions = useMemo(() => {
    if (!subject.trim() || subjectSuggestionsOpen === false) return [];
    return SUBJECTS.filter((s) => s.includes(subject.trim())).slice(0, 6);
  }, [subject, subjectSuggestionsOpen]);

  const handleSubmit = useCallback(() => {
    if (!subject.trim()) {
      toast.error('يرجى إدخال اسم المادة');
      return;
    }

    const teacher = teachers.find((t) => t.id === teacherId);
    const cls = classes.find((c) => c.id === classId);

    if (isEdit && block) {
      updateScheduleBlock(block.id, {
        dayOfWeek: day,
        period,
        subject: subject.trim(),
        teacherId: teacherId || null,
        teacherName: teacher?.name,
        classId: classId || null,
        className: cls?.name,
        room: room.trim() || '—',
        startTime,
        endTime,
        color,
        notes: notes.trim(),
      });
      toast.success('تم تحديث الحصة بنجاح');
    } else {
      addScheduleBlock({
        id: `sch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        dayOfWeek: day,
        period,
        subject: subject.trim(),
        teacherId: teacherId || null,
        teacherName: teacher?.name,
        classId: classId || null,
        className: cls?.name,
        room: room.trim() || '—',
        startTime,
        endTime,
        color,
        notes: notes.trim(),
      });
      toast.success('تمت إضافة الحصة بنجاح');
    }
    onOpenChange(false);
  }, [subject, day, period, teacherId, classId, room, startTime, endTime, color, notes, isEdit, block, teachers, classes, addScheduleBlock, updateScheduleBlock, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[85vh] overflow-y-auto"
        dir="rtl"
        style={{
          backgroundColor: '#1A1A24',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            {isEdit ? 'تعديل الحصة' : 'إضافة حصة جديدة'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEdit ? 'قم بتعديل بيانات الحصة الدراسية' : 'أدخل بيانات الحصة الدراسية الجديدة'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Day + Period */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label className="text-slate-300 text-sm">اليوم</Label>
              <Select value={day} onValueChange={(v) => setDay(v as DayOfWeek)}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-slate-300 text-sm">الحصة</Label>
              <Select value={String(period)} onValueChange={handlePeriodChange}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p.value} value={String(p.value)}>
                      {p.label} ({p.time})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subject with autocomplete */}
          <div className="flex flex-col gap-2 relative">
            <Label className="text-slate-300 text-sm">المادة</Label>
            <Input
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setSubjectSuggestionsOpen(true);
              }}
              onFocus={() => setSubjectSuggestionsOpen(true)}
              onBlur={() => setTimeout(() => setSubjectSuggestionsOpen(false), 200)}
              placeholder="أدخل اسم المادة..."
              className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
            />
            {subjectSuggestions.length > 0 && subjectSuggestionsOpen && (
              <div className="absolute top-[68px] right-0 left-0 z-20 rounded-lg border border-white/[0.08] bg-[#1A1A24] shadow-lg overflow-hidden">
                {subjectSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={() => {
                      setSubject(s);
                      setSubjectSuggestionsOpen(false);
                    }}
                    className="w-full text-right px-3 py-2 text-sm text-slate-200 hover:bg-white/[0.06] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Teacher + Class */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label className="text-slate-300 text-sm">المعلم</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-slate-200">
                  <SelectValue placeholder="اختر المعلم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">بدون معلم</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-slate-300 text-sm">الفصل</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-slate-200">
                  <SelectValue placeholder="اختر الفصل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">بدون فصل</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Room */}
          <div className="flex flex-col gap-2">
            <Label className="text-slate-300 text-sm">القاعة</Label>
            <Input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="رقم أو اسم القاعة..."
              className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
            />
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label className="text-slate-300 text-sm">وقت البداية</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-slate-300 text-sm">وقت النهاية</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
              />
            </div>
          </div>

          {/* Color picker */}
          <div className="flex flex-col gap-2">
            <Label className="text-slate-300 text-sm">اللون</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  className={cn(
                    'h-8 w-8 rounded-full border-2 transition-all duration-200 hover:scale-110',
                    color === c.value
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-transparent'
                  )}
                  style={{ backgroundColor: c.value, boxShadow: color === c.value ? `0 0 12px ${c.value}60` : undefined }}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <Label className="text-slate-300 text-sm">ملاحظات</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف ملاحظات (اختياري)..."
              className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 min-h-[70px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex-row gap-3 sm:justify-start pt-2">
          <Button
            onClick={handleSubmit}
            className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold rounded-lg px-6 gap-2"
          >
            {isEdit ? (
              <>
                <Pencil className="h-4 w-4" />
                حفظ التغييرات
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                إضافة الحصة
              </>
            )}
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
// Delete Dialog
// ---------------------------------------------------------------------------

function DeleteBlockDialog({
  block,
  open,
  onOpenChange,
}: {
  block: ScheduleBlock | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { deleteScheduleBlock, addToTrash } = useAppStore();

  const handleDelete = useCallback(() => {
    if (block) {
      addToTrash({
        id: `trash-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        itemType: 'schedule',
        itemId: block.id,
        itemName: block.subject,
        deletedBy: 'المدير',
        dataJson: JSON.stringify(block),
        restoredAt: null,
        createdAt: new Date().toISOString(),
      });
      deleteScheduleBlock(block.id);
      toast.success('تم حذف الحصة بنجاح');
      onOpenChange(false);
    }
  }, [block, deleteScheduleBlock, addToTrash, onOpenChange]);

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
          <AlertDialogTitle className="text-white text-lg">تأكيد حذف الحصة</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground leading-relaxed">
            هل أنت متأكد من حذف حصة{' '}
            <span className="font-semibold text-slate-200">{block?.subject}</span>
            {' '}في يوم{' '}
            <span className="font-semibold text-slate-200">{block ? getDayLabel(block.dayOfWeek) : ''}</span>
            {' '}— {block ? getPeriodLabel(block.period) : ''}
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
// Stats Bar
// ---------------------------------------------------------------------------

function StatsBar({ blocks }: { blocks: ScheduleBlock[] }) {
  const totalBlocks = blocks.length;
  const uniqueSubjects = new Set(blocks.map((b) => b.subject)).size;
  const uniqueTeachers = new Set(blocks.filter((b) => b.teacherName).map((b) => b.teacherName)).size;
  const uniqueRooms = new Set(blocks.map((b) => b.room)).size;

  const stats = [
    { label: 'إجمالي الحصص', value: totalBlocks, icon: CalendarRange, color: '#D4A574' },
    { label: 'المواد الدراسية', value: uniqueSubjects, icon: BookOpen, color: '#60A5FA' },
    { label: 'المعلمون', value: uniqueTeachers, icon: User, color: '#34D399' },
    { label: 'القاعات', value: uniqueRooms, icon: DoorOpen, color: '#A78BFA' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="rounded-xl p-4 transition-all duration-200 hover:scale-[1.02]"
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center h-10 w-10 rounded-xl"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <Icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Week View Grid
// ---------------------------------------------------------------------------

function WeekViewGrid({
  blocks,
  onCellClick,
  onBlockClick,
}: {
  blocks: ScheduleBlock[];
  onCellClick: (day: DayOfWeek, period: number) => void;
  onBlockClick: (block: ScheduleBlock) => void;
}) {
  // Build a lookup map
  const blockMap = useMemo(() => {
    const map = new Map<string, ScheduleBlock>();
    for (const b of blocks) {
      map.set(`${b.dayOfWeek}-${b.period}`, b);
    }
    return map;
  }, [blocks]);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Day headers */}
          <div className="grid grid-cols-[100px_repeat(6,1fr)]" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <div className="p-3 text-xs text-muted-foreground font-semibold border-b border-l border-white/[0.06] flex items-center justify-center">
              الفترة
            </div>
            {DAYS.map((day) => (
              <div
                key={day.value}
                className="p-3 text-center text-sm font-semibold text-[#D4A574] border-b border-l border-white/[0.06] last:border-l-0"
              >
                {day.label}
              </div>
            ))}
          </div>

          {/* Period rows */}
          {PERIODS.map((p) => (
            <div key={p.value} className="grid grid-cols-[100px_repeat(6,1fr)]">
              {/* Period header */}
              <div className="p-3 border-b border-l border-white/[0.06] flex flex-col items-center justify-center gap-1" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                <span className="text-xs font-semibold text-slate-300">{p.label}</span>
                <span className="text-[10px] text-muted-foreground">{p.time}</span>
              </div>

              {/* Day cells */}
              {DAYS.map((day) => {
                const block = blockMap.get(`${day.value}-${p.value}`);
                return (
                  <div
                    key={`${day.value}-${p.value}`}
                    className="p-1.5 border-b border-l border-white/[0.04] last:border-l-0 min-h-[72px] transition-colors hover:bg-white/[0.02]"
                  >
                    {block ? (
                      <button
                        onClick={() => onBlockClick(block)}
                        className="w-full h-full rounded-lg p-2 text-right transition-all duration-200 hover:scale-[1.03] hover:shadow-md"
                        style={{
                          backgroundColor: `${block.color}12`,
                          border: `1px solid ${block.color}25`,
                        }}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <div
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: block.color }}
                          />
                          <span
                            className="text-xs font-semibold truncate"
                            style={{ color: block.color }}
                          >
                            {block.subject}
                          </span>
                        </div>
                        {block.teacherName && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {block.teacherName}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/60 truncate">
                          🏫 {block.room}
                        </p>
                      </button>
                    ) : (
                      <button
                        onClick={() => onCellClick(day.value, p.value)}
                        className="w-full h-full rounded-lg flex items-center justify-center text-muted-foreground/30 hover:text-[#D4A574]/60 hover:bg-white/[0.02] transition-all duration-200"
                        title={`إضافة حصة - ${day.label} - ${p.label}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// List View
// ---------------------------------------------------------------------------

function ListView({
  blocks,
  onBlockClick,
  filterDay,
  setFilterDay,
  filterSubject,
  setFilterSubject,
}: {
  blocks: ScheduleBlock[];
  onBlockClick: (block: ScheduleBlock) => void;
  filterDay: string;
  setFilterDay: (d: string) => void;
  filterSubject: string;
  setFilterSubject: (s: string) => void;
}) {
  const uniqueSubjects = useMemo(() => {
    return Array.from(new Set(blocks.map((b) => b.subject))).sort();
  }, [blocks]);

  const filteredBlocks = useMemo(() => {
    let result = [...blocks];
    if (filterDay !== 'all') {
      result = result.filter((b) => b.dayOfWeek === filterDay);
    }
    if (filterSubject !== 'all') {
      result = result.filter((b) => b.subject === filterSubject);
    }
    // Sort by day then period
    const dayOrder: Record<string, number> = { sat: 0, sun: 1, mon: 2, tue: 3, wed: 4, thu: 5 };
    result.sort((a, b) => {
      const dayDiff = (dayOrder[a.dayOfWeek] ?? 0) - (dayOrder[b.dayOfWeek] ?? 0);
      if (dayDiff !== 0) return dayDiff;
      return a.period - b.period;
    });
    return result;
  }, [blocks, filterDay, filterSubject]);

  // Group by day
  const groupedByDay = useMemo(() => {
    const groups: Record<string, ScheduleBlock[]> = {};
    for (const b of filteredBlocks) {
      const dayLabel = getDayLabel(b.dayOfWeek);
      if (!groups[dayLabel]) groups[dayLabel] = [];
      groups[dayLabel].push(b);
    }
    return groups;
  }, [filteredBlocks]);

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label className="text-slate-300 text-sm">تصفية حسب اليوم</Label>
          <Select value={filterDay} onValueChange={setFilterDay}>
            <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأيام</SelectItem>
              {DAYS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-slate-300 text-sm">تصفية حسب المادة</Label>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المواد</SelectItem>
              {uniqueSubjects.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grouped list */}
      <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
        {Object.entries(groupedByDay).map(([dayLabel, dayBlocks]) => (
          <div key={dayLabel}>
            <div className="flex items-center gap-2 mb-2">
              <CalendarRange className="h-4 w-4 text-[#D4A574]" />
              <h3 className="text-sm font-semibold text-[#D4A574]">{dayLabel}</h3>
              <Badge variant="outline" className="text-[10px] border-[#D4A574]/20 text-[#D4A574]">
                {dayBlocks.length} حصة
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              {dayBlocks.map((block) => (
                <button
                  key={block.id}
                  onClick={() => onBlockClick(block)}
                  className="w-full text-right rounded-xl p-3 transition-all duration-200 hover:scale-[1.01] hover:shadow-md"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${block.color}15` }}
                      >
                        <BookOpen className="h-5 w-5" style={{ color: block.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-slate-200 truncate">{block.subject}</span>
                          <Badge
                            variant="outline"
                            className="text-[10px] shrink-0"
                            style={{
                              borderColor: `${block.color}30`,
                              color: block.color,
                              backgroundColor: `${block.color}10`,
                            }}
                          >
                            {getPeriodTime(block.period)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {block.teacherName && <span>👨‍🏫 {block.teacherName}</span>}
                          {block.className && <span>🏫 {block.className}</span>}
                          <span>📍 {block.room}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Eye className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {filteredBlocks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Info className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">لا توجد حصص مطابقة للتصفية</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TimetableSection() {
  const { scheduleBlocks, setScheduleBlocks } = useAppStore();

  // View mode
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week');

  // List view filters
  const [filterDay, setFilterDay] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');

  // Dialogs
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(null);
  const [prefillDay, setPrefillDay] = useState<DayOfWeek | undefined>();
  const [prefillPeriod, setPrefillPeriod] = useState<number | undefined>();

  // Initialize mock data
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && scheduleBlocks.length === 0) {
      initialized.current = true;
      const mock = generateMockSchedule();
      requestAnimationFrame(() => setScheduleBlocks(mock));
    }
  }, []);

  // Handlers
  const handleCellClick = useCallback((day: DayOfWeek, period: number) => {
    setPrefillDay(day);
    setPrefillPeriod(period);
    setSelectedBlock(null);
    setAddEditOpen(true);
  }, []);

  const handleBlockClick = useCallback((block: ScheduleBlock) => {
    setSelectedBlock(block);
    setViewOpen(true);
  }, []);

  const handleEditFromView = useCallback(() => {
    setViewOpen(false);
    setTimeout(() => {
      setAddEditOpen(true);
    }, 200);
  }, []);

  const handleDeleteFromView = useCallback(() => {
    setViewOpen(false);
    setTimeout(() => {
      setDeleteOpen(true);
    }, 200);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleAddManual = useCallback(() => {
    setSelectedBlock(null);
    setPrefillDay(undefined);
    setPrefillPeriod(undefined);
    setAddEditOpen(true);
  }, []);

  return (
    <section className="flex flex-col gap-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center h-12 w-12 rounded-xl"
            style={{ backgroundColor: 'rgba(212,165,116,0.1)' }}
          >
            <CalendarRange className="h-6 w-6 text-[#D4A574]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">الجدول الدراسي</h1>
            <p className="text-sm text-muted-foreground">إدارة الجدول الأسبوعي للحصص الدراسية</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div
            className="flex items-center rounded-lg overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <button
              onClick={() => setViewMode('week')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200',
                viewMode === 'week'
                  ? 'bg-[#D4A574]/15 text-[#D4A574]'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-white/[0.03]'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              أسبوعي
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200',
                viewMode === 'list'
                  ? 'bg-[#D4A574]/15 text-[#D4A574]'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-white/[0.03]'
              )}
            >
              <List className="h-4 w-4" />
              قائمة
            </button>
          </div>

          {/* Add button */}
          <Button
            onClick={handleAddManual}
            className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold rounded-lg gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">إضافة حصة</span>
          </Button>

          {/* Print button */}
          <Button
            onClick={handlePrint}
            variant="outline"
            className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-lg gap-2"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">طباعة</span>
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <StatsBar blocks={scheduleBlocks} />

      {/* Content */}
      {viewMode === 'week' ? (
        <WeekViewGrid
          blocks={scheduleBlocks}
          onCellClick={handleCellClick}
          onBlockClick={handleBlockClick}
        />
      ) : (
        <ListView
          blocks={scheduleBlocks}
          onBlockClick={handleBlockClick}
          filterDay={filterDay}
          setFilterDay={setFilterDay}
          filterSubject={filterSubject}
          setFilterSubject={setFilterSubject}
        />
      )}

      {/* Empty state */}
      {scheduleBlocks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div
            className="flex items-center justify-center h-20 w-20 rounded-2xl mb-6"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <CalendarRange className="h-10 w-10 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">
            لا توجد حصص في الجدول
          </h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
            ابدأ بإضافة حصص دراسية لبناء الجدول الأسبوعي
          </p>
          <Button
            onClick={handleAddManual}
            className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold gap-2 rounded-lg px-6"
          >
            <Plus className="h-4 w-4" />
            إضافة حصة
          </Button>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent
          className="sm:max-w-lg"
          dir="rtl"
          style={{
            backgroundColor: '#1A1A24',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${selectedBlock?.color ?? '#D4A574'}20` }}
              >
                <BookOpen className="h-4 w-4" style={{ color: selectedBlock?.color ?? '#D4A574' }} />
              </div>
              {selectedBlock?.subject ?? 'تفاصيل الحصة'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedBlock
                ? `${getDayLabel(selectedBlock.dayOfWeek)} — ${getPeriodLabel(selectedBlock.period)}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedBlock && (
            <div className="flex flex-col gap-4 mt-2">
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div className="grid grid-cols-1 gap-3">
                  {/* Subject with color badge */}
                  <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center h-8 w-8 rounded-lg"
                        style={{ backgroundColor: `${selectedBlock.color}15` }}
                      >
                        <BookOpen className="h-4 w-4" style={{ color: selectedBlock.color }} />
                      </div>
                      <span className="text-sm text-muted-foreground">المادة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedBlock.color }} />
                      <span className="text-sm font-medium text-slate-200">{selectedBlock.subject}</span>
                    </div>
                  </div>

                  {/* Day */}
                  <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#60A5FA]/10">
                        <CalendarRange className="h-4 w-4 text-[#60A5FA]" />
                      </div>
                      <span className="text-sm text-muted-foreground">اليوم</span>
                    </div>
                    <span className="text-sm font-medium text-slate-200">{getDayLabel(selectedBlock.dayOfWeek)}</span>
                  </div>

                  {/* Period */}
                  <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#34D399]/10">
                        <Clock className="h-4 w-4 text-[#34D399]" />
                      </div>
                      <span className="text-sm text-muted-foreground">الحصة</span>
                    </div>
                    <span className="text-sm font-medium text-slate-200">{getPeriodLabel(selectedBlock.period)}</span>
                  </div>

                  {/* Teacher */}
                  <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#A78BFA]/10">
                        <User className="h-4 w-4 text-[#A78BFA]" />
                      </div>
                      <span className="text-sm text-muted-foreground">المعلم</span>
                    </div>
                    <span className="text-sm font-medium text-slate-200">{selectedBlock.teacherName ?? '—'}</span>
                  </div>

                  {/* Class */}
                  <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#FBBF24]/10">
                        <DoorOpen className="h-4 w-4 text-[#FBBF24]" />
                      </div>
                      <span className="text-sm text-muted-foreground">الفصل</span>
                    </div>
                    <span className="text-sm font-medium text-slate-200">{selectedBlock.className ?? '—'}</span>
                  </div>

                  {/* Room */}
                  <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#F472B6]/10">
                        <DoorOpen className="h-4 w-4 text-[#F472B6]" />
                      </div>
                      <span className="text-sm text-muted-foreground">القاعة</span>
                    </div>
                    <span className="text-sm font-medium text-slate-200">{selectedBlock.room}</span>
                  </div>

                  {/* Time */}
                  <div className="flex items-center justify-between gap-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#2DD4BF]/10">
                        <Clock className="h-4 w-4 text-[#2DD4BF]" />
                      </div>
                      <span className="text-sm text-muted-foreground">الوقت</span>
                    </div>
                    <span className="text-sm font-medium text-slate-200">
                      {selectedBlock.startTime} — {selectedBlock.endTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedBlock.notes && (
                <div
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#D4A574]" />
                    ملاحظات
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedBlock.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-row gap-3 sm:justify-start pt-2">
            <Button
              onClick={handleEditFromView}
              className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold rounded-lg px-6 gap-2"
            >
              <Pencil className="h-4 w-4" />
              تعديل
            </Button>
            <Button
              onClick={handleDeleteFromView}
              variant="outline"
              className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg px-6 gap-2"
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewOpen(false)}
              className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-lg px-6"
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <AddEditBlockDialog
        block={selectedBlock}
        open={addEditOpen}
        onOpenChange={setAddEditOpen}
        defaultDay={prefillDay}
        defaultPeriod={prefillPeriod}
      />

      {/* Delete Dialog */}
      <DeleteBlockDialog
        block={selectedBlock}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </section>
  );
}
