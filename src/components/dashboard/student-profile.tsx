'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  X,
  Pencil,
  Printer,
  Send,
  StickyNote,
  User,
  BookOpen,
  GraduationCap,
  Calendar,
  Clock,
  FileText,
  Brain,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Download,
  CheckCircle2,
  XCircle,
  Plus,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { Student, GradeRecord } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { exportToCSV, formatCsvDate } from '@/lib/csv-export';

// shadcn/ui
import { Button } from '@/components/ui/button';
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<Student['status'], { label: string; className: string; color: string }> = {
  active: {
    label: 'نشط',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    color: '#34d399',
  },
  inactive: {
    label: 'غير نشط',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    color: '#fbbf24',
  },
  graduated: {
    label: 'متخرج',
    className: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
    color: '#38bdf8',
  },
};

// Class display names are resolved from the store's classes via useClassOptions().

const ATTENDANCE_STATUS_MAP: Record<string, { label: string; className: string; color: string }> = {
  present: { label: 'حاضر', className: 'bg-emerald-500/15 text-emerald-400', color: '#34d399' },
  absent: { label: 'غائب', className: 'bg-rose-500/15 text-rose-400', color: '#fb7185' },
  late: { label: 'متأخر', className: 'bg-amber-500/15 text-amber-400', color: '#fbbf24' },
  excused: { label: 'مستأذن', className: 'bg-sky-500/15 text-sky-400', color: '#38bdf8' },
};

// Mock attendance records (seeded via useRef pattern)
function generateMockAttendance(studentId: string) {
  const statuses: Array<'present' | 'absent' | 'late' | 'excused'> = ['present', 'present', 'present', 'present', 'present', 'present', 'present', 'late', 'absent', 'excused', 'present', 'present', 'present', 'late', 'present'];
  const records: Array<{ id: string; date: string; status: 'present' | 'absent' | 'late' | 'excused'; notes: string }> = [];
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    // Skip weekends (Friday=5, Saturday=6)
    if (d.getDay() === 5 || d.getDay() === 6) continue;
    const statusIdx = i % statuses.length;
    records.push({
      id: `att-${studentId}-${i}`,
      date: d.toISOString().split('T')[0],
      status: statuses[statusIdx],
      notes: '',
    });
  }
  return records;
}

// Mock psychological notes
function generateMockPsychNotes(studentId: string) {
  return [
    { id: `pn-${studentId}-1`, date: '2024-11-15', content: 'الطالب يظهر تفاعلاً إيجابياً مع زملائه في الفصل. يشارك بنشاط في الأنشطة الجماعية ويظهر قدرات قيادية واعدة.', author: 'الأخصائي النفسي' },
    { id: `pn-${studentId}-2`, date: '2024-10-20', content: 'تم إجراء مقابلة فردية مع الطالب. أظهر الطالب تحسناً ملحوظاً في التركيز والمشاركة. يُنصح بتكليفه بمهام قيادية ضمن الفريق.', author: 'المرشد التربوي' },
    { id: `pn-${studentId}-3`, date: '2024-09-25', content: 'في بداية الفصل، لوحظ أن الطالب يحتاج إلى وقت للتكيف مع البيئة الصفية. تم وضع خطة متابعة أسبوعية.', author: 'الأخصائي النفسي' },
  ];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClassName(classId: string | null, classes: { id: string; name: string }[]): string {
  if (!classId) return '—';
  return classes.find((c) => c.id === classId)?.name ?? '—';
}

function getGradeColor(percentage: number): string {
  if (percentage >= 90) return '#34d399';
  if (percentage >= 80) return '#D4A574';
  if (percentage >= 70) return '#fbbf24';
  if (percentage >= 60) return '#fb923c';
  return '#fb7185';
}

function getGradeLabel(percentage: number): string {
  if (percentage >= 90) return 'ممتاز';
  if (percentage >= 80) return 'جيد جداً';
  if (percentage >= 70) return 'جيد';
  if (percentage >= 60) return 'مقبول';
  return 'ضعيف';
}



// ---------------------------------------------------------------------------
// SVG Sparkline Component (pure SVG, no external libs)
// ---------------------------------------------------------------------------

function SparklineChart({ data, width = 200, height = 50 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) {
    return (
      <svg width={width} height={height} className="block">
        <text x={width / 2} y={height / 2} textAnchor="middle" dominantBaseline="central" fill="#64748b" fontSize="10">
          لا توجد بيانات كافية
        </text>
      </svg>
    );
  }

  const padding = 4;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => ({
    x: padding + (i / (data.length - 1)) * chartW,
    y: padding + chartH - ((v - min) / range) * chartH,
  }));

  // Build smooth path using catmull-rom to bezier
  const pathD = points.reduce((acc, point, idx) => {
    if (idx === 0) return `M ${point.x} ${point.y}`;
    const prev = points[idx - 1];
    const cpx1 = prev.x + (point.x - prev.x) * 0.4;
    const cpx2 = prev.x + (point.x - prev.x) * 0.6;
    return `${acc} C ${cpx1} ${prev.y}, ${cpx2} ${point.y}, ${point.x} ${point.y}`;
  }, '');

  // Area fill path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  const gradientId = `sparkline-grad-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <svg width={width} height={height} className="block" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4A574" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#D4A574" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path d={areaD} fill={`url(#${gradientId})`} />
      {/* Line */}
      <path d={pathD} fill="none" stroke="#D4A574" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* End dot */}
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill="#D4A574" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="5" fill="#D4A574" opacity="0.3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Grade Distribution Bar (pure SVG)
// ---------------------------------------------------------------------------

function GradeDistributionBar({ grades }: { grades: GradeRecord[] }) {
  const distribution = useMemo(() => {
    const counts = { excellent: 0, veryGood: 0, good: 0, pass: 0, fail: 0 };
    for (const g of grades) {
      const pct = (g.score / g.maxScore) * 100;
      if (pct >= 90) counts.excellent++;
      else if (pct >= 80) counts.veryGood++;
      else if (pct >= 70) counts.good++;
      else if (pct >= 60) counts.pass++;
      else counts.fail++;
    }
    return counts;
  }, [grades]);

  const total = grades.length || 1;
  const segments = [
    { label: 'ممتاز', count: distribution.excellent, color: '#34d399' },
    { label: 'جيد جداً', count: distribution.veryGood, color: '#D4A574' },
    { label: 'جيد', count: distribution.good, color: '#fbbf24' },
    { label: 'مقبول', count: distribution.pass, color: '#fb923c' },
    { label: 'ضعيف', count: distribution.fail, color: '#fb7185' },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex rounded-full overflow-hidden h-3 w-full">
        {segments.map((seg) => (
          <div
            key={seg.label}
            style={{
              width: `${(seg.count / total) * 100}%`,
              backgroundColor: seg.color,
              minWidth: seg.count > 0 ? 4 : 0,
            }}
            className="transition-all duration-500"
            title={`${seg.label}: ${seg.count}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5 text-xs">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="text-slate-300 font-semibold tabular-nums">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Attendance Heatmap (last 30 days, pure SVG)
// ---------------------------------------------------------------------------

function AttendanceHeatmap({ records }: { records: Array<{ date: string; status: string }> }) {
  const today = new Date();
  const days: Array<{ date: string; dayOfWeek: number; day: number; status: string | null }> = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const record = records.find((r) => r.date === dateStr);
    days.push({
      date: dateStr,
      dayOfWeek: d.getDay(),
      day: d.getDate(),
      status: record?.status ?? null,
    });
  }

  const cellSize = 16;
  const gap = 2;
  const cols = 7; // Mon-Sun (Sat-first for Arabic, but 7 cols grid)

  return (
    <div className="glass-card-elevated rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-[#D4A574]" />
        خريطة الحضور - آخر 30 يوم
      </h3>
      <div className="flex gap-1 justify-center flex-wrap">
        {days.map((day) => {
          const isWeekend = day.dayOfWeek === 5 || day.dayOfWeek === 6;
          const statusInfo = day.status ? ATTENDANCE_STATUS_MAP[day.status] : null;
          const bgColor = isWeekend
            ? 'rgba(255,255,255,0.02)'
            : statusInfo
              ? `${statusInfo.color}30`
              : 'rgba(255,255,255,0.04)';
          const dotColor = statusInfo?.color ?? (isWeekend ? 'transparent' : 'rgba(255,255,255,0.08)');

          return (
            <div
              key={day.date}
              className="flex flex-col items-center gap-0.5"
              title={`${day.date}: ${statusInfo?.label ?? (isWeekend ? 'عطلة' : 'لا بيانات')}`}
            >
              <span className="text-[9px] text-muted-foreground/50 tabular-nums">{day.day}</span>
              <div
                className="rounded-sm flex items-center justify-center"
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: bgColor,
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                {!isWeekend && (
                  <div
                    className="rounded-full"
                    style={{
                      width: 6,
                      height: 6,
                      backgroundColor: dotColor,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3">
        {Object.values(ATTENDANCE_STATUS_MAP).map((s) => (
          <div key={s.label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: `${s.color}30` }} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function StudentProfile({ student, onClose }: { student: Student; onClose: () => void }) {
  const { grades, updateStudent, classes } = useAppStore();

  // Local state
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState(student.notes);
  const [editPsychBackground, setEditPsychBackground] = useState(student.psychBackground);
  const [newPsychNote, setNewPsychNote] = useState('');

  // Seed mock attendance and psych notes via lazy state initializer (runs once)
  const [attendanceRecords] = useState(() => generateMockAttendance(student.id));
  const [psychNotes, setPsychNotes] = useState(() => generateMockPsychNotes(student.id));

  // Get student grades from store
  const studentGrades = useMemo(() => {
    return grades.filter((g) => g.studentId === student.studentId || g.studentId === student.id);
  }, [grades, student.studentId, student.id]);

  // If no grades in store, show placeholder
  const displayGrades = studentGrades;

  // Attendance stats
  const attendanceStats = useMemo(() => {
    const records = attendanceRecords;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const excused = records.filter((r) => r.status === 'excused').length;
    const total = present + absent + late + excused;
    return {
      total,
      present,
      absent,
      late,
      excused,
      presentRate: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  }, [attendanceRecords]);

  // Grade stats
  const gradeStats = useMemo(() => {
    if (displayGrades.length === 0) {
      return { avg: 0, highest: 0, lowest: 0, trend: [] as number[] };
    }
    const percentages = displayGrades.map((g) => (g.score / g.maxScore) * 100);
    const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    const highest = Math.max(...percentages);
    const lowest = Math.min(...percentages);
    return { avg: Math.round(avg), highest: Math.round(highest), lowest: Math.round(lowest), trend: percentages };
  }, [displayGrades]);

  // Handlers
  const handleSavePersonal = useCallback(() => {
    updateStudent(student.id, {
      notes: editNotes,
      psychBackground: editPsychBackground,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
    toast.success('تم حفظ الملاحظات بنجاح');
  }, [student.id, editNotes, editPsychBackground, updateStudent]);

  const handleCancelEdit = useCallback(() => {
    setEditNotes(student.notes);
    setEditPsychBackground(student.psychBackground);
    setIsEditing(false);
  }, [student.notes, student.psychBackground]);

  const handleAddPsychNote = useCallback(() => {
    if (!newPsychNote.trim()) return;
    const note = {
      id: `pn-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      content: newPsychNote.trim(),
      author: 'المستخدم الحالي',
    };
    setPsychNotes((prev) => [note, ...prev]);
    setNewPsychNote('');
    toast.success('تم إضافة الملاحظة النفسية');
  }, [newPsychNote]);

  const handleExportGrades = useCallback(() => {
    if (displayGrades.length === 0) {
      toast.error('لا توجد درجات للتصدير');
      return;
    }
    const exportData = displayGrades.map((g) => ({
      subject: g.subject,
      examType: g.examType,
      score: g.score,
      maxScore: g.maxScore,
      percentage: `${Math.round((g.score / g.maxScore) * 100)}%`,
      date: formatCsvDate(g.date),
      notes: g.notes,
    }));
    exportToCSV(exportData, `grades-${student.studentId}`, [
      { key: 'subject', label: 'المادة' },
      { key: 'examType', label: 'نوع الاختبار' },
      { key: 'score', label: 'الدرجة' },
      { key: 'maxScore', label: 'الدرجة القصوى' },
      { key: 'percentage', label: 'النسبة' },
      { key: 'date', label: 'التاريخ' },
      { key: 'notes', label: 'ملاحظات' },
    ]);
    toast.success('تم تصدير الدرجات بنجاح');
  }, [displayGrades, student.studentId]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleSendMessage = useCallback(() => {
    toast.info('سيتم إرسال رسالة إلى ولي الأمر');
  }, []);

  const handleAddNote = useCallback(() => {
    setIsEditing(true);
    setActiveTab('personal');
  }, []);

  const statusConfig = STATUS_MAP[student.status];

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="max-w-4xl w-[95vw] max-h-[92vh] overflow-hidden p-0"
        dir="rtl"
        lang="ar"
        style={{
          backgroundColor: '#121218',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* ── Profile Header ── */}
          <div className="relative p-6 pb-4">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 left-4 h-8 w-8 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg z-10"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Avatar */}
              <div
                className="flex items-center justify-center h-20 w-20 rounded-full shrink-0 text-2xl font-bold border-2"
                style={{
                  background: `linear-gradient(135deg, ${statusConfig.color}25, ${statusConfig.color}08)`,
                  borderColor: `${statusConfig.color}30`,
                  color: statusConfig.color,
                }}
              >
                {student.name.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-white truncate">
                    {student.name}
                  </h2>
                  <Badge
                    variant="outline"
                    className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-300 border-white/[0.1]"
                    dir="ltr"
                  >
                    {student.studentId}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn('text-xs px-2.5 py-0.5 rounded-full', statusConfig.className)}
                  >
                    <span className={cn('inline-block h-1.5 w-1.5 rounded-full mr-1', {
                      'bg-emerald-400': student.status === 'active',
                      'bg-amber-400': student.status === 'inactive',
                      'bg-sky-400': student.status === 'graduated',
                    })} />
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-[#D4A574]" />
                    {getClassName(student.classId, classes)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#D4A574]" />
                    تاريخ التسجيل: {new Date(student.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendMessage}
                  className="border-white/[0.08] text-slate-300 hover:bg-white/[0.06] hover:text-white rounded-lg gap-1.5 h-9 text-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  إرسال رسالة
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddNote}
                  className="border-white/[0.08] text-slate-300 hover:bg-white/[0.06] hover:text-white rounded-lg gap-1.5 h-9 text-xs"
                >
                  <StickyNote className="h-3.5 w-3.5" />
                  إضافة ملاحظة
                </Button>
                <Separator orientation="vertical" className="h-6 mx-1 bg-white/[0.06]" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrint}
                  className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg"
                  title="طباعة"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator className="mt-4 bg-white/[0.06]" />
          </div>

          {/* ── Tab Navigation ── */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 px-6 pb-6">
            <TabsList className="bg-white/[0.04] p-1 rounded-xl h-auto w-full mb-4">
              <TabsTrigger
                value="personal"
                className={cn(
                  'flex-1 rounded-lg py-2.5 text-xs font-medium transition-all gap-1.5',
                  activeTab === 'personal'
                    ? 'bg-[#D4A574]/15 text-[#D4A574] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                )}
              >
                <User className="h-3.5 w-3.5" />
                المعلومات الشخصية
              </TabsTrigger>
              <TabsTrigger
                value="grades"
                className={cn(
                  'flex-1 rounded-lg py-2.5 text-xs font-medium transition-all gap-1.5',
                  activeTab === 'grades'
                    ? 'bg-[#D4A574]/15 text-[#D4A574] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                )}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                الدرجات والأداء
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className={cn(
                  'flex-1 rounded-lg py-2.5 text-xs font-medium transition-all gap-1.5',
                  activeTab === 'attendance'
                    ? 'bg-[#D4A574]/15 text-[#D4A574] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                الحضور
              </TabsTrigger>
              <TabsTrigger
                value="psych"
                className={cn(
                  'flex-1 rounded-lg py-2.5 text-xs font-medium transition-all gap-1.5',
                  activeTab === 'psych'
                    ? 'bg-[#D4A574]/15 text-[#D4A574] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                )}
              >
                <Brain className="h-3.5 w-3.5" />
                ملاحظات نفسية
              </TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Personal Info ── */}
            <TabsContent value="personal">
              <div className="glass-card-elevated rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#D4A574]" />
                    المعلومات الشخصية
                  </h3>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="border-[#D4A574]/30 text-[#D4A574] hover:bg-[#D4A574]/10 rounded-lg gap-1.5 h-8 text-xs"
                    >
                      <Pencil className="h-3 w-3" />
                      تعديل
                    </Button>
                  )}
                </div>

                {/* Read-only fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {[
                    { label: 'الاسم الكامل', value: student.name, icon: User },
                    { label: 'الرقم التعريفي', value: student.studentId, icon: BookOpen },
                    { label: 'الفصل', value: getClassName(student.classId, classes), icon: GraduationCap },
                    { label: 'الحالة', value: statusConfig.label, icon: ShieldCheck },
                    { label: 'تاريخ التسجيل', value: new Date(student.createdAt).toLocaleDateString('ar-SA'), icon: Calendar },
                    { label: 'آخر تحديث', value: new Date(student.updatedAt).toLocaleDateString('ar-SA'), icon: Clock },
                  ].map((field) => (
                    <div
                      key={field.label}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                    >
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10 shrink-0">
                        <field.icon className="h-4 w-4 text-[#D4A574]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground mb-0.5">{field.label}</p>
                        <p className="text-sm font-medium text-slate-200 truncate">{field.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Editable fields */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-slate-300 text-sm flex items-center gap-2">
                      <StickyNote className="h-3.5 w-3.5 text-[#D4A574]" />
                      ملاحظات عامة
                    </Label>
                    <Textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      disabled={!isEditing}
                      placeholder="أضف ملاحظات عامة حول الطالب..."
                      className="bg-white/[0.02] border-white/[0.06] text-slate-200 placeholder:text-muted-foreground/40 focus:border-[#D4A574]/40 focus:ring-[#D4A574]/15 min-h-[80px] resize-none disabled:opacity-70"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-slate-300 text-sm flex items-center gap-2">
                      <Brain className="h-3.5 w-3.5 text-[#D4A574]" />
                      الخلفية النفسية
                    </Label>
                    <Textarea
                      value={editPsychBackground}
                      onChange={(e) => setEditPsychBackground(e.target.value)}
                      disabled={!isEditing}
                      placeholder="أضف معلومات عن الخلفية النفسية للطالب..."
                      className="bg-white/[0.02] border-white/[0.06] text-slate-200 placeholder:text-muted-foreground/40 focus:border-[#D4A574]/40 focus:ring-[#D4A574]/15 min-h-[80px] resize-none disabled:opacity-70"
                    />
                  </div>

                  {/* Save/Cancel buttons */}
                  {isEditing && (
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        onClick={handleSavePersonal}
                        className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold rounded-lg px-5 h-9 text-sm gap-1.5"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        حفظ التغييرات
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-lg px-5 h-9 text-sm"
                      >
                        إلغاء
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 2: Grades & Performance ── */}
            <TabsContent value="grades">
              <div className="space-y-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="glass-card-elevated rounded-xl p-4 text-center">
                    <p className="text-[11px] text-muted-foreground mb-1">المعدل العام</p>
                    <p className="text-2xl font-bold text-[#D4A574] tabular-nums">
                      {displayGrades.length > 0 ? `${gradeStats.avg}%` : '—'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {displayGrades.length > 0 ? getGradeLabel(gradeStats.avg) : 'لا توجد بيانات'}
                    </p>
                  </div>
                  <div className="glass-card-elevated rounded-xl p-4 text-center">
                    <p className="text-[11px] text-muted-foreground mb-1">أعلى درجة</p>
                    <p className="text-2xl font-bold text-emerald-400 tabular-nums">
                      {displayGrades.length > 0 ? `${gradeStats.highest}%` : '—'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      أداء مميز
                    </p>
                  </div>
                  <div className="glass-card-elevated rounded-xl p-4 text-center">
                    <p className="text-[11px] text-muted-foreground mb-1">أقل درجة</p>
                    <p className="text-2xl font-bold text-rose-400 tabular-nums">
                      {displayGrades.length > 0 ? `${gradeStats.lowest}%` : '—'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      {gradeStats.lowest >= 60 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {displayGrades.length > 0 ? (gradeStats.lowest >= 60 ? 'مقبول' : 'يحتاج تحسين') : ''}
                    </p>
                  </div>
                  <div className="glass-card-elevated rounded-xl p-4 text-center">
                    <p className="text-[11px] text-muted-foreground mb-1">عدد الاختبارات</p>
                    <p className="text-2xl font-bold text-sky-400 tabular-nums">{displayGrades.length}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">إجمالي السجلات</p>
                  </div>
                </div>

                {/* Grade Distribution + Sparkline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-card-elevated rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#D4A574]" />
                      توزيع الدرجات
                    </h3>
                    {displayGrades.length > 0 ? (
                      <GradeDistributionBar grades={displayGrades} />
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">لا توجد درجات مسجلة</p>
                    )}
                  </div>
                  <div className="glass-card-elevated rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#D4A574]" />
                      اتجاه الأداء
                    </h3>
                    {gradeStats.trend.length > 0 ? (
                      <div className="flex flex-col items-center gap-2">
                        <SparklineChart data={gradeStats.trend} width={280} height={60} />
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <div className="h-1 w-4 bg-[#D4A574] rounded-full" />
                            نسبة الدرجات
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات كافية</p>
                    )}
                  </div>
                </div>

                {/* Grades Table */}
                <div className="glass-card-elevated rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 pb-0">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[#D4A574]" />
                      سجل الدرجات
                    </h3>
                    {displayGrades.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportGrades}
                        className="border-[#D4A574]/30 text-[#D4A574] hover:bg-[#D4A574]/10 rounded-lg gap-1.5 h-8 text-xs"
                      >
                        <Download className="h-3 w-3" />
                        تصدير
                      </Button>
                    )}
                  </div>

                  {displayGrades.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
                            <TableHead className="text-slate-400 font-semibold text-xs py-3 px-4">المادة</TableHead>
                            <TableHead className="text-slate-400 font-semibold text-xs py-3 px-4">نوع الاختبار</TableHead>
                            <TableHead className="text-slate-400 font-semibold text-xs py-3 px-4 text-center">الدرجة</TableHead>
                            <TableHead className="text-slate-400 font-semibold text-xs py-3 px-4 text-center">النسبة</TableHead>
                            <TableHead className="text-slate-400 font-semibold text-xs py-3 px-4 hidden sm:table-cell">التاريخ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayGrades.map((grade, idx) => {
                            const pct = Math.round((grade.score / grade.maxScore) * 100);
                            const color = getGradeColor(pct);
                            return (
                              <TableRow
                                key={grade.id}
                                className={cn(
                                  'border-b border-white/[0.04] transition-colors duration-200',
                                  'hover:bg-white/[0.03]',
                                  idx % 2 === 1 ? 'bg-white/[0.01]' : '',
                                )}
                              >
                                <TableCell className="py-2.5 px-4 text-sm text-slate-200">{grade.subject}</TableCell>
                                <TableCell className="py-2.5 px-4 text-sm text-muted-foreground">{grade.examType}</TableCell>
                                <TableCell className="py-2.5 px-4 text-center">
                                  <span className="text-sm font-medium tabular-nums text-slate-200">
                                    {grade.score}<span className="text-muted-foreground/50">/{grade.maxScore}</span>
                                  </span>
                                </TableCell>
                                <TableCell className="py-2.5 px-4 text-center">
                                  <Badge
                                    variant="outline"
                                    className="text-xs px-2 py-0 rounded-full"
                                    style={{
                                      backgroundColor: `${color}15`,
                                      color,
                                      borderColor: `${color}25`,
                                    }}
                                  >
                                    {pct}%
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-2.5 px-4 text-sm text-muted-foreground hidden sm:table-cell" dir="ltr">
                                  {new Date(grade.date).toLocaleDateString('ar-SA')}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
                        <BookOpen className="h-7 w-7 text-slate-500" />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        لا توجد درجات مسجلة لهذا الطالب بعد
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1 text-center">
                        يمكن إضافة درجات من قسم الاختبارات أو الامتحانات
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 3: Attendance ── */}
            <TabsContent value="attendance">
              <div className="space-y-4">
                {/* Attendance Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="glass-card-elevated rounded-xl p-4 text-center">
                    <p className="text-[11px] text-muted-foreground mb-1">نسبة الحضور</p>
                    <p className="text-2xl font-bold text-emerald-400 tabular-nums">{attendanceStats.presentRate}%</p>
                    <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                        style={{ width: `${attendanceStats.presentRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="glass-card-elevated rounded-xl p-4 text-center">
                    <p className="text-[11px] text-muted-foreground mb-1">أيام الغياب</p>
                    <p className="text-2xl font-bold text-rose-400 tabular-nums">{attendanceStats.absent}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <XCircle className="h-3 w-3 text-rose-400/60" />
                      من {attendanceStats.total} يوم
                    </p>
                  </div>
                  <div className="glass-card-elevated rounded-xl p-4 text-center">
                    <p className="text-[11px] text-muted-foreground mb-1">أيام التأخير</p>
                    <p className="text-2xl font-bold text-amber-400 tabular-nums">{attendanceStats.late}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3 text-amber-400/60" />
                      تأخر عن الدوام
                    </p>
                  </div>
                  <div className="glass-card-elevated rounded-xl p-4 text-center">
                    <p className="text-[11px] text-muted-foreground mb-1">أيام الإذن</p>
                    <p className="text-2xl font-bold text-sky-400 tabular-nums">{attendanceStats.excused}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-sky-400/60" />
                      إذن رسمي
                    </p>
                  </div>
                </div>

                {/* Heatmap */}
                <AttendanceHeatmap records={attendanceRecords} />

                {/* Attendance Table */}
                <div className="glass-card-elevated rounded-xl overflow-hidden">
                  <h3 className="text-sm font-semibold text-slate-300 p-4 pb-0 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#D4A574]" />
                    سجل الحضور التفصيلي
                  </h3>
                  <div className="max-h-72 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
                          <TableHead className="text-slate-400 font-semibold text-xs py-3 px-4">التاريخ</TableHead>
                          <TableHead className="text-slate-400 font-semibold text-xs py-3 px-4 text-center">الحالة</TableHead>
                          <TableHead className="text-slate-400 font-semibold text-xs py-3 px-4">اليوم</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceRecords.map((record, idx) => {
                          const statusInfo = ATTENDANCE_STATUS_MAP[record.status];
                          const dateObj = new Date(record.date);
                          const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                          return (
                            <TableRow
                              key={record.id}
                              className={cn(
                                'border-b border-white/[0.04] transition-colors duration-200',
                                'hover:bg-white/[0.03]',
                                idx % 2 === 1 ? 'bg-white/[0.01]' : '',
                              )}
                            >
                              <TableCell className="py-2.5 px-4 text-sm text-slate-200 tabular-nums" dir="ltr">
                                {dateObj.toLocaleDateString('ar-SA')}
                              </TableCell>
                              <TableCell className="py-2.5 px-4 text-center">
                                <Badge
                                  variant="outline"
                                  className={cn('text-xs px-2 py-0 rounded-full', statusInfo.className)}
                                >
                                  {statusInfo.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2.5 px-4 text-sm text-muted-foreground">
                                {dayNames[dateObj.getDay()]}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 4: Psychological Notes ── */}
            <TabsContent value="psych">
              <div className="space-y-4">
                {/* Confidential Warning */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/15">
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-amber-500/15 shrink-0">
                    <ShieldCheck className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-300">معلومات سرية</p>
                    <p className="text-xs text-amber-400/70 mt-0.5">
                      هذه المعلومات خاصة بالأخصائي النفسي والمرشد التربوي. يُمنع مشاركتها مع أطراف غير مخولة.
                    </p>
                  </div>
                </div>

                {/* Psych Background */}
                <div className="glass-card-elevated rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-[#D4A574]" />
                    الخلفية النفسية العامة
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {student.psychBackground || 'لم يتم تسجيل خلفية نفسية للطالب بعد.'}
                  </p>
                </div>

                {/* Add New Note */}
                <div className="glass-card-elevated rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-[#D4A574]" />
                    إضافة ملاحظة جديدة
                  </h3>
                  <div className="space-y-3">
                    <Textarea
                      value={newPsychNote}
                      onChange={(e) => setNewPsychNote(e.target.value)}
                      placeholder="اكتب الملاحظة النفسية هنا..."
                      className="bg-white/[0.02] border-white/[0.06] text-slate-200 placeholder:text-muted-foreground/40 focus:border-[#D4A574]/40 focus:ring-[#D4A574]/15 min-h-[80px] resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleAddPsychNote}
                        disabled={!newPsychNote.trim()}
                        className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold rounded-lg px-5 h-9 text-sm gap-1.5 disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        إضافة الملاحظة
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Notes Timeline */}
                <div className="glass-card-elevated rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#D4A574]" />
                    سجل الملاحظات النفسية
                    <Badge className="bg-[#D4A574]/15 text-[#D4A574] border-[#D4A574]/20 text-xs px-2 py-0 rounded-full tabular-nums">
                      {psychNotes.length}
                    </Badge>
                  </h3>

                  {psychNotes.length > 0 ? (
                    <div className="relative space-y-0">
                      {/* Timeline line */}
                      <div className="absolute top-3 bottom-3 right-[17px] w-px bg-white/[0.06]" />

                      {psychNotes.map((note, idx) => (
                        <div key={note.id} className="flex gap-4 pb-6 relative">
                          {/* Timeline dot */}
                          <div className="flex flex-col items-center shrink-0 mt-0.5">
                            <div
                              className={cn(
                                'h-[9px] w-[9px] rounded-full border-2 shrink-0',
                                idx === 0
                                  ? 'bg-[#D4A574] border-[#D4A574]/30'
                                  : 'bg-white/[0.08] border-white/[0.12]'
                              )}
                            />
                          </div>
                          {/* Note content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1.5">
                              <span className="text-xs text-muted-foreground tabular-nums" dir="ltr">
                                {new Date(note.date).toLocaleDateString('ar-SA')}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] px-2 py-0 rounded-full bg-white/[0.03] text-muted-foreground border-white/[0.06]"
                              >
                                {note.author}
                              </Badge>
                            </div>
                            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                              <p className="text-sm text-slate-300 leading-relaxed">{note.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-3">
                        <Brain className="h-6 w-6 text-slate-500" />
                      </div>
                      <p className="text-sm text-muted-foreground">لا توجد ملاحظات نفسية مسجلة</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
