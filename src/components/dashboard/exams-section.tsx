'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  Award,
  TrendingUp,
  TrendingDown,
  Download,
  BarChart3,
  Target,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { Exam } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { exportToCSV, formatCsvDate } from '@/lib/csv-export';

// shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
// Constants
// ---------------------------------------------------------------------------

const SUBJECT_OPTIONS = [
  { value: 'all', label: 'كل المواد' },
  { value: 'رياضيات', label: 'رياضيات' },
  { value: 'علوم', label: 'علوم' },
  { value: 'لغة عربية', label: 'لغة عربية' },
  { value: 'لغة إنجليزية', label: 'لغة إنجليزية' },
  { value: 'فيزياء', label: 'فيزياء' },
  { value: 'كيمياء', label: 'كيمياء' },
  { value: 'تاريخ', label: 'تاريخ' },
  { value: 'جغرافيا', label: 'جغرافيا' },
];

const CLASS_OPTIONS = [
  { value: 'all', label: 'كل الفصول' },
  { value: 'class-1', label: 'الصف الأول - أ' },
  { value: 'class-2', label: 'الصف الأول - ب' },
  { value: 'class-3', label: 'الصف الثاني - أ' },
  { value: 'class-4', label: 'الصف الثاني - ب' },
  { value: 'class-5', label: 'الصف الثالث - أ' },
  { value: 'class-6', label: 'الصف الثالث - ب' },
];

const CLASS_FILTER_MAP: Record<string, string> = {
  'class-1': 'الصف الأول - أ',
  'class-2': 'الصف الأول - ب',
  'class-3': 'الصف الثاني - أ',
  'class-4': 'الصف الثاني - ب',
  'class-5': 'الصف الثالث - أ',
  'class-6': 'الصف الثالث - ب',
};

const STUDENT_NAMES: Record<string, string> = {
  'std-001': 'أحمد محمد علي',
  'std-002': 'فاطمة أحمد حسن',
  'std-003': 'عبدالله خالد العتيبي',
  'std-004': 'نورة سعيد القحطاني',
  'std-005': 'محمد عبدالرحمن الدوسري',
  'std-006': 'ريم فهد المطيري',
  'std-007': 'سلطان فيصل الشمري',
  'std-008': 'لطيفة عايض الحربي',
  'std-009': 'يزيد ناصر البقمي',
  'std-010': 'سارة ماجد العنزي',
};

const STUDENT_DROPDOWN = Object.entries(STUDENT_NAMES).map(([id, name]) => ({
  value: id,
  label: name,
}));

const CLASS_DROPDOWN = Object.entries(CLASS_FILTER_MAP).map(([id, name]) => ({
  value: id,
  label: name,
}));

const SUBJECT_DROPDOWN = SUBJECT_OPTIONS.filter((s) => s.value !== 'all');

// ---------------------------------------------------------------------------
// Score helpers
// ---------------------------------------------------------------------------

function getScoreColor(score: number | null, maxScore: number): { bar: string; text: string; bg: string } {
  if (score === null) return { bar: 'bg-slate-500', text: 'text-slate-400', bg: '' };
  const pct = (score / maxScore) * 100;
  if (pct >= 70) return { bar: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' };
  if (pct >= 50) return { bar: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' };
  return { bar: 'bg-rose-500', text: 'text-rose-400', bg: 'bg-rose-500/10' };
}

function getScoreLabel(score: number | null, maxScore: number): string {
  if (score === null) return 'لم يُحدد';
  const pct = (score / maxScore) * 100;
  if (pct >= 90) return 'ممتاز';
  if (pct >= 70) return 'جيد جداً';
  if (pct >= 50) return 'مقبول';
  return 'يحتاج تحسين';
}

// ---------------------------------------------------------------------------
// Subject Analysis Helpers (pure functions)
// ---------------------------------------------------------------------------

interface SubjectAvg {
  subject: string;
  avg: number;
  count: number;
  color: string;
}

interface AnalysisStats {
  highest: { pct: number; subject: string };
  lowest: { pct: number; subject: string };
  overallAvg: number;
  passRate: number;
}

function getBarColorHex(avg: number): string {
  if (avg >= 85) return '#10b981';
  if (avg >= 70) return '#f59e0b';
  if (avg >= 50) return '#0ea5e9';
  return '#f43f5e';
}

function computeSubjectAverages(exams: Exam[]): SubjectAvg[] {
  const groups: Record<string, { total: number; count: number }> = {};

  for (const exam of exams) {
    if (exam.score === null) continue;
    const pct = (exam.score / Math.max(0.001, exam.maxScore)) * 100;
    if (!groups[exam.subject]) {
      groups[exam.subject] = { total: 0, count: 0 };
    }
    groups[exam.subject] = {
      total: groups[exam.subject].total + pct,
      count: groups[exam.subject].count + 1,
    };
  }

  return Object.entries(groups)
    .map(([subject, data]) => ({
      subject,
      avg: Math.round((data.total / Math.max(0.001, data.count)) * 10) / 10,
      count: data.count,
      color: getBarColorHex(data.total / Math.max(0.001, data.count)),
    }))
    .sort((a, b) => b.avg - a.avg);
}

function computeAnalysisStats(exams: Exam[]): AnalysisStats {
  const scoredExams = exams.filter((e) => e.score !== null);

  if (scoredExams.length === 0) {
    return {
      highest: { pct: 0, subject: '—' },
      lowest: { pct: 0, subject: '—' },
      overallAvg: 0,
      passRate: 0,
    };
  }

  const result = scoredExams.reduce(
    (acc, exam) => {
      const pct = (exam.score! / Math.max(0.001, exam.maxScore)) * 100;
      return {
        totalPct: acc.totalPct + pct,
        passCount: acc.passCount + (pct >= 50 ? 1 : 0),
        highestPct: Math.max(acc.highestPct, pct),
        highestSubject: pct > acc.highestPct ? exam.subject : acc.highestSubject,
        lowestPct: Math.min(acc.lowestPct, pct),
        lowestSubject: pct < acc.lowestPct ? exam.subject : acc.lowestSubject,
      };
    },
    { totalPct: 0, passCount: 0, highestPct: -1, highestSubject: '', lowestPct: 101, lowestSubject: '' },
  );

  const count = Math.max(0.001, scoredExams.length);
  return {
    highest: { pct: Math.round(result.highestPct * 10) / 10, subject: result.highestSubject },
    lowest: { pct: Math.round(result.lowestPct * 10) / 10, subject: result.lowestSubject },
    overallAvg: Math.round((result.totalPct / count) * 10) / 10,
    passRate: Math.round(((result.passCount / count) * 100) * 10) / 10,
  };
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam-001',
    title: 'اختبار نهاية الفصل الأول',
    subject: 'رياضيات',
    studentId: 'std-001',
    classId: 'class-1',
    teacherId: null,
    score: 92,
    maxScore: 100,
    date: '2024-12-15',
    notes: 'أداء ممتاز في الهندسة والجبر',
    createdAt: '2024-12-15T08:00:00.000Z',
    updatedAt: '2024-12-15T10:00:00.000Z',
    studentName: 'أحمد محمد علي',
    className: 'الصف الأول - أ',
  },
  {
    id: 'exam-002',
    title: 'اختبار نصفي في العلوم',
    subject: 'علوم',
    studentId: 'std-002',
    classId: 'class-2',
    teacherId: null,
    score: 78,
    maxScore: 100,
    date: '2024-12-10',
    notes: 'حصلت على درجة جيدة في التجارب العملية',
    createdAt: '2024-12-10T08:00:00.000Z',
    updatedAt: '2024-12-10T12:00:00.000Z',
    studentName: 'فاطمة أحمد حسن',
    className: 'الصف الأول - ب',
  },
  {
    id: 'exam-003',
    title: 'اختبار قواعد اللغة العربية',
    subject: 'لغة عربية',
    studentId: 'std-003',
    classId: 'class-3',
    teacherId: null,
    score: 65,
    maxScore: 100,
    date: '2024-12-08',
    notes: 'يحتاج تحسين في الإعراب',
    createdAt: '2024-12-08T08:00:00.000Z',
    updatedAt: '2024-12-08T11:00:00.000Z',
    studentName: 'عبدالله خالد العتيبي',
    className: 'الصف الثاني - أ',
  },
  {
    id: 'exam-004',
    title: 'اختبار مفردات اللغة الإنجليزية',
    subject: 'لغة إنجليزية',
    studentId: 'std-004',
    classId: 'class-1',
    teacherId: null,
    score: 45,
    maxScore: 100,
    date: '2024-12-05',
    notes: 'تحتاج متابعة إضافية في المفردات الجديدة',
    createdAt: '2024-12-05T08:00:00.000Z',
    updatedAt: '2024-12-05T09:00:00.000Z',
    studentName: 'نورة سعيد القحطاني',
    className: 'الصف الأول - أ',
  },
  {
    id: 'exam-005',
    title: 'اختبار الفيزياء - القوى والحركة',
    subject: 'فيزياء',
    studentId: 'std-005',
    classId: 'class-5',
    teacherId: null,
    score: 88,
    maxScore: 100,
    date: '2024-12-01',
    notes: 'فهم ممتاز لقوانين نيوتن',
    createdAt: '2024-12-01T08:00:00.000Z',
    updatedAt: '2024-12-01T14:00:00.000Z',
    studentName: 'محمد عبدالرحمن الدوسري',
    className: 'الصف الثالث - أ',
  },
  {
    id: 'exam-006',
    title: 'اختبار الكيمياء العضوية',
    subject: 'كيمياء',
    studentId: 'std-006',
    classId: 'class-4',
    teacherId: null,
    score: 72,
    maxScore: 100,
    date: '2024-11-28',
    notes: 'أداء جيد مع بعض الأخطاء في التسمية',
    createdAt: '2024-11-28T08:00:00.000Z',
    updatedAt: '2024-11-28T10:00:00.000Z',
    studentName: 'ريم فهد المطيري',
    className: 'الصف الثاني - ب',
  },
  {
    id: 'exam-007',
    title: 'اختبار تاريخ الحضارات القديمة',
    subject: 'تاريخ',
    studentId: 'std-007',
    classId: 'class-3',
    teacherId: null,
    score: 95,
    maxScore: 100,
    date: '2024-11-25',
    notes: 'أفضل طالب في القسم',
    createdAt: '2024-11-25T08:00:00.000Z',
    updatedAt: '2024-11-25T12:00:00.000Z',
    studentName: 'سلطان فيصل الشمري',
    className: 'الصف الثاني - أ',
  },
  {
    id: 'exam-008',
    title: 'اختبار جغرافيا - المناخ والبيئة',
    subject: 'جغرافيا',
    studentId: 'std-008',
    classId: 'class-6',
    teacherId: null,
    score: 83,
    maxScore: 100,
    date: '2024-11-20',
    notes: 'مشاركة مميزة في تحليل الخرائط',
    createdAt: '2024-11-20T08:00:00.000Z',
    updatedAt: '2024-11-20T13:00:00.000Z',
    studentName: 'لطيفة عايض الحربي',
    className: 'الصف الثالث - ب',
  },
  {
    id: 'exam-009',
    title: 'اختبار رياضيات - التفاضل والتكامل',
    subject: 'رياضيات',
    studentId: 'std-009',
    classId: 'class-2',
    teacherId: null,
    score: 38,
    maxScore: 100,
    date: '2024-11-18',
    notes: 'يحتاج دعم إضافي ومتابعة مكثفة',
    createdAt: '2024-11-18T08:00:00.000Z',
    updatedAt: '2024-11-18T10:00:00.000Z',
    studentName: 'يزيد ناصر البقمي',
    className: 'الصف الأول - ب',
  },
  {
    id: 'exam-010',
    title: 'اختبار علوم - الأحياء الخلوية',
    subject: 'علوم',
    studentId: 'std-010',
    classId: 'class-5',
    teacherId: null,
    score: 71,
    maxScore: 100,
    date: '2024-11-15',
    notes: 'تحسن ملحوظ مقارنة بالاختبار السابق',
    createdAt: '2024-11-15T08:00:00.000Z',
    updatedAt: '2024-11-15T11:00:00.000Z',
    studentName: 'سارة ماجد العنزي',
    className: 'الصف الثالث - أ',
  },
];

// ---------------------------------------------------------------------------
// Helper: get student/class names
// ---------------------------------------------------------------------------

function getStudentName(studentId: string | null): string {
  if (!studentId) return '—';
  return STUDENT_NAMES[studentId] ?? '—';
}

function getClassName(classId: string | null): string {
  if (!classId) return '—';
  return CLASS_FILTER_MAP[classId] ?? '—';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Score cell with progress bar */
function ScoreCell({ score, maxScore }: { score: number | null; maxScore: number }) {
  const colors = getScoreColor(score, maxScore);
  const pct = score !== null ? Math.round((score / maxScore) * 100) : 0;

  return (
    <div className="flex flex-col gap-1.5 min-w-[120px]">
      <div className="flex items-center justify-between gap-2">
        <span className={cn('text-sm font-bold tabular-nums', colors.text)}>
          {score !== null ? `${score}/${maxScore}` : '—'}
        </span>
        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', colors.bg, colors.text)}>
          {getScoreLabel(score, maxScore)}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors.bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Subject Comparison Bar Chart */
function SubjectComparisonChart({ data }: { data: SubjectAvg[] }) {
  const [animProgress, setAnimProgress] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const duration = 800;

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimProgress(eased);
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="glass-card-elevated rounded-2xl p-6 animate-fade-in-up">
        <div className="flex flex-col items-center justify-center py-8">
          <BarChart3 className="h-10 w-10 text-slate-500 mb-3" />
          <p className="text-sm text-slate-400">لا توجد بيانات كافية لعرض التحليل</p>
        </div>
      </div>
    );
  }

  const barHeight = 12;
  const barY = (28 - barHeight) / 2;

  return (
    <div className="glass-card-elevated rounded-2xl p-5 sm:p-6 corner-accent animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-[#D4A574]/10">
          <BarChart3 className="h-5 w-5 text-[#D4A574]" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">تحليل نتائج الامتحانات حسب المادة</h3>
          <p className="text-xs text-muted-foreground mt-0.5">متوسط الدرجات لكل مادة</p>
        </div>
      </div>

      {/* Color Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#10b981' }} />
          <span>≥ 85%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
          <span>≥ 70%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#0ea5e9' }} />
          <span>≥ 50%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#f43f5e' }} />
          <span>&lt; 50%</span>
        </div>
      </div>

      {/* Bars */}
      <div className="flex flex-col gap-2.5">
        {data.map((item, idx) => {
          const animWidth = item.avg * animProgress;
          return (
            <div
              key={item.subject}
              className="flex items-center gap-3 group cursor-default"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Subject name */}
              <div className="w-24 sm:w-28 text-right shrink-0">
                <span
                  className={cn(
                    'text-sm font-medium truncate block transition-colors',
                    hoveredIdx === idx ? 'text-white' : 'text-slate-300',
                  )}
                >
                  {item.subject}
                </span>
              </div>

              {/* Bar */}
              <div className="flex-1 relative h-7">
                <svg
                  viewBox="0 0 100 28"
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  {/* Track */}
                  <rect x="0" y={barY} width="100" height={barHeight} rx="6" fill="rgba(255,255,255,0.04)" />
                  {/* Animated bar (grows from right for RTL) */}
                  <rect
                    x={100 - animWidth}
                    y={barY}
                    width={animWidth}
                    height={barHeight}
                    rx="6"
                    fill={item.color}
                    opacity={hoveredIdx !== null && hoveredIdx !== idx ? 0.3 : 0.8}
                    style={{ transition: 'opacity 0.2s ease' }}
                  />
                  {/* Glow on hover */}
                  {hoveredIdx === idx && (
                    <rect
                      x={100 - animWidth}
                      y={barY - 2}
                      width={animWidth}
                      height={barHeight + 4}
                      rx="8"
                      fill={item.color}
                      opacity="0.12"
                      style={{ animation: 'scale-in 0.15s ease-out' }}
                    />
                  )}
                </svg>

                {/* Tooltip on hover */}
                {hoveredIdx === idx && (
                  <div
                    className="absolute -top-11 left-1/2 -translate-x-1/2 z-10 rounded-lg px-3 py-1.5 text-xs shadow-xl border pointer-events-none whitespace-nowrap"
                    style={{
                      backgroundColor: 'rgba(20,20,28,0.95)',
                      borderColor: 'rgba(255,255,255,0.1)',
                      animation: 'animate-pop-in 0.15s ease-out',
                    }}
                  >
                    <span className="font-semibold text-white">{item.subject}</span>
                    <span className="text-slate-500 mx-1.5">·</span>
                    <span className="font-bold" style={{ color: item.color }}>{item.avg}%</span>
                    <span className="text-slate-500 mx-1.5">·</span>
                    <span className="text-slate-300">
                      {item.count} {item.count === 1 ? 'امتحان' : 'امتحانات'}
                    </span>
                  </div>
                )}
              </div>

              {/* Score label */}
              <div className="w-16 sm:w-20 text-left shrink-0 tabular-nums">
                <span
                  className={cn(
                    'text-sm font-bold transition-colors',
                    hoveredIdx === idx ? 'text-white' : 'text-slate-400',
                  )}
                >
                  {Math.round(item.avg)}%
                </span>
                <span className="text-[10px] text-slate-500 mr-1">({item.count})</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Summary stat mini card */
function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  accentClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
  accentClass: string;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-xl p-4"
      style={{
        backgroundColor: '#1A1A24',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className={cn('flex items-center justify-center h-11 w-11 rounded-xl shrink-0', accentClass)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-xl font-bold text-white tabular-nums leading-tight">{value}</p>
        {subtext && <p className="text-[11px] text-muted-foreground/60 mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}

/** Empty state */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6">
        <FileText className="h-10 w-10 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-300 mb-2">
        لا توجد امتحانات حالياً
      </h3>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
        ابدأ بإضافة امتحانات جديدة لمتابعة أداء الطلاب وتقييم مستواهم الأكاديمي
      </p>
      <Button
        onClick={onAdd}
        className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold gap-2 rounded-lg px-6"
      >
        <Plus className="h-4 w-4" />
        إضافة امتحان جديد
      </Button>
    </div>
  );
}

/** View exam dialog */
function ViewExamDialog({
  exam,
  open,
  onOpenChange,
}: {
  exam: Exam | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!exam) return null;

  const colors = getScoreColor(exam.score, exam.maxScore);
  const pct = exam.score !== null ? Math.round((exam.score / exam.maxScore) * 100) : 0;

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
          <DialogTitle className="text-white text-xl">
            تفاصيل الامتحان
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            عرض كافة تفاصيل الامتحان ونتيجة الطالب
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Visual score indicator */}
          <div
            className="flex flex-col items-center justify-center rounded-xl p-6"
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <p className="text-xs text-muted-foreground mb-3">الدرجة المحصلة</p>
            {/* Circular indicator */}
            <div className="relative h-28 w-28 mb-3">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke={exam.score !== null && pct >= 70 ? '#10b981' : exam.score !== null && pct >= 50 ? '#f59e0b' : '#f43f5e'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 327} 327`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-2xl font-bold tabular-nums', colors.text)}>
                  {exam.score ?? '—'}
                </span>
                <span className="text-xs text-muted-foreground">من {exam.maxScore}</span>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn('text-xs font-medium px-3 py-1 rounded-full', colors.text, colors.bg, 'border-transparent')}
            >
              {getScoreLabel(exam.score, exam.maxScore)}
            </Badge>
          </div>

          {/* Info fields */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: 'عنوان الامتحان', value: exam.title, icon: FileText },
                { label: 'المادة', value: exam.subject, icon: Award },
                { label: 'الطالب', value: getStudentName(exam.studentId), icon: Eye },
                { label: 'الفصل', value: getClassName(exam.classId), icon: Search },
                { label: 'التاريخ', value: exam.date ? new Date(exam.date).toLocaleDateString('ar-SA') : '—', icon: TrendingUp },
              ].map((field) => (
                <div key={field.label} className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04] last:border-0">
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
          {exam.notes && (
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <h4 className="text-sm font-semibold text-slate-300 mb-2">ملاحظات</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{exam.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit form content
// ---------------------------------------------------------------------------

function ExamFormContent({
  editingExam,
  onClose,
}: {
  editingExam: Exam | null;
  onClose: () => void;
}) {
  const { addExam, updateExam } = useAppStore();
  const isEditing = !!editingExam;

  const [title, setTitle] = useState(editingExam?.title ?? '');
  const [subject, setSubject] = useState(editingExam?.subject ?? 'رياضيات');
  const [studentId, setStudentId] = useState<string>(editingExam?.studentId ?? STUDENT_DROPDOWN[0]?.value ?? '');
  const [classId, setClassId] = useState<string>(editingExam?.classId ?? CLASS_DROPDOWN[0]?.value ?? '');
  const [score, setScore] = useState<string>(editingExam?.score !== null ? String(editingExam.score) : '');
  const [maxScore, setMaxScore] = useState<string>(String(editingExam?.maxScore ?? 100));
  const [date, setDate] = useState(editingExam?.date ?? new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(editingExam?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const now = new Date().toISOString();
    const scoreNum = score.trim() ? Number(score) : null;
    const maxScoreNum = maxScore.trim() ? Number(maxScore) : 100;

    if (isEditing && editingExam) {
      updateExam(editingExam.id, {
        title: title.trim(),
        subject,
        studentId,
        classId,
        score: scoreNum,
        maxScore: maxScoreNum,
        date,
        notes: notes.trim(),
        studentName: getStudentName(studentId),
        className: getClassName(classId),
        updatedAt: now,
      });
      toast.success('تم تحديث بيانات الامتحان');
    } else {
      const newExam: Exam = {
        id: `exam-${Date.now()}`,
        title: title.trim(),
        subject,
        studentId,
        classId,
        teacherId: null,
        score: scoreNum,
        maxScore: maxScoreNum,
        date,
        notes: notes.trim(),
        createdAt: now,
        updatedAt: now,
        studentName: getStudentName(studentId),
        className: getClassName(classId),
      };
      addExam(newExam);
      toast.success('تم إضافة الامتحان بنجاح');
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <Label className="text-slate-300 text-sm">عنوان الامتحان</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="مثال: اختبار نهاية الفصل"
          className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
          required
        />
      </div>

      {/* Subject & Date row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-slate-300 text-sm">المادة</Label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20">
              <SelectValue placeholder="اختر المادة" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              {SUBJECT_DROPDOWN.map((sub) => (
                <SelectItem key={sub.value} value={sub.value} className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                  {sub.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-slate-300 text-sm">التاريخ</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
            dir="ltr"
          />
        </div>
      </div>

      {/* Student & Class row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-slate-300 text-sm">الطالب</Label>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20">
              <SelectValue placeholder="اختر الطالب" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              {STUDENT_DROPDOWN.map((stu) => (
                <SelectItem key={stu.value} value={stu.value} className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                  {stu.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-slate-300 text-sm">الفصل</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20">
              <SelectValue placeholder="اختر الفصل" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              {CLASS_DROPDOWN.map((cls) => (
                <SelectItem key={cls.value} value={cls.value} className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                  {cls.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Score & Max score row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-slate-300 text-sm">الدرجة</Label>
          <Input
            type="number"
            min={0}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="مثال: 85"
            className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
            dir="ltr"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-slate-300 text-sm">الدرجة العظمى</Label>
          <Input
            type="number"
            min={1}
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            placeholder="100"
            className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
            dir="ltr"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-2">
        <Label className="text-slate-300 text-sm">ملاحظات</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="أضف ملاحظات حول الامتحان..."
          className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 min-h-[80px] resize-none"
        />
      </div>

      {/* Actions */}
      <DialogFooter className="flex-row gap-3 sm:justify-start pt-2">
        <Button
          type="submit"
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg px-6 gap-2"
        >
          {isEditing ? (
            <>
              <Pencil className="h-4 w-4" />
              حفظ التغييرات
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              إضافة الامتحان
            </>
          )}
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

/** Add / Edit exam dialog */
function ExamFormDialog({
  open,
  onOpenChange,
  editingExam,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingExam: Exam | null;
}) {
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
          <DialogTitle className="text-white text-xl">
            {editingExam ? 'تعديل الامتحان' : 'إضافة امتحان جديد'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {editingExam
              ? 'قم بتعديل بيانات الامتحان المطلوبة ثم اضغط حفظ التغييرات'
              : 'أدخل بيانات الامتحان الجديد لإضافته إلى النظام'}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ExamFormContent
            editingExam={editingExam}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Delete confirmation dialog */
function DeleteExamDialog({
  exam,
  open,
  onOpenChange,
}: {
  exam: Exam | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { deleteExam } = useAppStore();

  const handleDelete = () => {
    if (exam) {
      deleteExam(exam.id);
      toast.success('تم حذف الامتحان');
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
          <AlertDialogTitle className="text-white text-lg">
            تأكيد حذف الامتحان
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground leading-relaxed">
            هل أنت متأكد من حذف الامتحان{' '}
            <span className="font-semibold text-slate-200">{exam?.title}</span>؟
            <br />
            لا يمكن التراجع عن هذا الإجراء. سيتم حذف جميع بيانات الامتحان بشكل نهائي.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-3 sm:justify-start mt-2">
          <AlertDialogCancel
            className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-lg px-6 mt-0"
          >
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
// Main Component
// ---------------------------------------------------------------------------

export default function ExamsSection() {
  const { exams, setExams } = useAppStore();

  // Local UI state
  const [localSearch, setLocalSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');

  // Initialize mock data once
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && exams.length === 0) {
      initialized.current = true;
      setExams(INITIAL_EXAMS);
    }
  }, []);

  // Summary stats
  const stats = useMemo(() => {
    const scoredExams = exams.filter((e) => e.score !== null);
    const totalExams = exams.length;
    const avgScore = scoredExams.length > 0
      ? Math.round(scoredExams.reduce((sum, e) => sum + (e.score ?? 0), 0) / scoredExams.length)
      : 0;
    const highestScore = scoredExams.length > 0
      ? Math.max(...scoredExams.map((e) => e.score ?? 0))
      : 0;
    return { avgScore, highestScore, totalExams };
  }, [exams]);

  // Subject averages for comparison chart
  const subjectAverages = useMemo(() => computeSubjectAverages(exams), [exams]);

  // Analysis stats (highest/lowest/avg/pass rate)
  const analysisStats = useMemo(() => computeAnalysisStats(exams), [exams]);

  // Filtered & searched list
  const filteredExams = useMemo(() => {
    let result = [...exams];

    // Subject filter
    if (subjectFilter !== 'all') {
      result = result.filter((e) => e.subject === subjectFilter);
    }

    // Class filter
    if (classFilter !== 'all') {
      result = result.filter((e) => e.classId === classFilter);
    }

    // Search filter
    if (localSearch.trim()) {
      const query = localSearch.trim().toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.subject.toLowerCase().includes(query) ||
          (e.studentName ?? '').toLowerCase().includes(query) ||
          (e.className ?? '').toLowerCase().includes(query)
      );
    }

    return result;
  }, [exams, subjectFilter, classFilter, localSearch]);

  // Handlers
  const handleAdd = () => {
    setSelectedExam(null);
    setFormOpen(true);
  };

  const handleEdit = (exam: Exam) => {
    setSelectedExam(exam);
    setFormOpen(true);
  };

  const handleView = (exam: Exam) => {
    setSelectedExam(exam);
    setViewOpen(true);
  };

  const handleDelete = (exam: Exam) => {
    setSelectedExam(exam);
    setDeleteOpen(true);
  };

  const handleExportExams = () => {
    const exportData = exams.map((e) => ({
      title: e.title,
      subject: e.subject,
      score: e.score !== null ? String(e.score) : '',
      maxScore: String(e.maxScore),
      percentage: e.score !== null ? `${Math.round((e.score / e.maxScore) * 100)}%` : '',
      date: formatCsvDate(e.date),
      notes: e.notes || '',
    }));
    exportToCSV(exportData, 'exams', [
      { key: 'title', label: 'العنوان' },
      { key: 'subject', label: 'المادة' },
      { key: 'score', label: 'الدرجة' },
      { key: 'maxScore', label: 'الدرجة القصوى' },
      { key: 'percentage', label: 'النسبة' },
      { key: 'date', label: 'التاريخ' },
      { key: 'notes', label: 'الملاحظات' },
    ]);
    toast.success('تم تصدير بيانات الامتحانات بنجاح');
  };

  return (
    <div className="flex flex-col gap-6 card-depth-2" dir="rtl">
      {/* ── Page Title ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#D4A574]/10">
            <FileText className="h-5 w-5 text-[#D4A574]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl flex items-center gap-3">
              إدارة الامتحانات
              <Badge className="bg-[#D4A574]/15 text-[#D4A574] border-[#D4A574]/20 hover:bg-[#D4A574]/20 text-sm px-2.5 py-0.5 rounded-full font-semibold tabular-nums">
                {exams.length}
              </Badge>
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              إدارة الامتحانات ومتابعة نتائج الطلاب
            </p>
          </div>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={TrendingUp}
          label="متوسط الدرجات"
          value={`${stats.avgScore}%`}
          subtext="من جميع الامتحانات"
          accentClass="bg-emerald-500/15"
        />
        <StatCard
          icon={Award}
          label="أعلى درجة"
          value={`${stats.highestScore}`}
          subtext="من بين جميع الطلاب"
          accentClass="bg-amber-500/15"
        />
        <StatCard
          icon={FileText}
          label="إجمالي الامتحانات"
          value={stats.totalExams}
          subtext="امتحان مسجل"
          accentClass="bg-sky-500/15"
        />
      </div>

      {/* ── Action Bar ── */}
      <div
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl p-4"
        style={{
          backgroundColor: '#1A1A24',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Add & Export buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleAdd}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold gap-2 rounded-lg px-5 h-10 btn-shine"
          >
            <Plus className="h-4 w-4" />
            إضافة امتحان جديد
          </Button>
          <Button
            variant="outline"
            onClick={handleExportExams}
            className="border-[#D4A574]/30 text-[#D4A574] hover:bg-[#D4A574]/10 gap-2 rounded-lg px-4 h-10 btn-amber-glow"
          >
            <Download className="h-4 w-4" />
            تصدير CSV
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
            <Input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="بحث بالعنوان أو المادة أو الطالب..."
              className="pr-10 w-full sm:w-64 bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 h-10"
            />
          </div>

          {/* Subject filter */}
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-full sm:w-36 bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              {SUBJECT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
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
              {CLASS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Subject Comparison Chart ── */}
      <SubjectComparisonChart data={subjectAverages} />

      {/* ── Exam Statistics Summary Pills ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: TrendingUp,
            label: 'أعلى نسبة',
            value: `${analysisStats.highest.pct}%`,
            sub: analysisStats.highest.subject,
            color: '#10b981',
            bg: 'rgba(16,185,129,0.08)',
          },
          {
            icon: TrendingDown,
            label: 'أقل نسبة',
            value: `${analysisStats.lowest.pct}%`,
            sub: analysisStats.lowest.subject,
            color: '#f43f5e',
            bg: 'rgba(244,63,94,0.08)',
          },
          {
            icon: Target,
            label: 'متوسط عام',
            value: `${analysisStats.overallAvg}%`,
            sub: 'جميع المواد',
            color: '#D4A574',
            bg: 'rgba(212,165,116,0.08)',
          },
          {
            icon: Award,
            label: 'نسبة النجاح',
            value: `${analysisStats.passRate}%`,
            sub: 'درجة ≥ 50%',
            color: '#0ea5e9',
            bg: 'rgba(14,165,233,0.08)',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:scale-[1.02]"
            style={{
              backgroundColor: stat.bg,
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div
              className="flex items-center justify-center h-9 w-9 rounded-lg shrink-0"
              style={{ backgroundColor: `${stat.color}15` }}
            >
              <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              <p className="text-base font-bold text-white tabular-nums leading-tight">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground/60 truncate">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Exams Table ── */}
      {filteredExams.length === 0 ? (
        <div
          className="rounded-xl"
          style={{
            backgroundColor: '#1A1A24',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <EmptyState onAdd={handleAdd} />
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: '#1A1A24',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3.5 px-4">
                    عنوان الامتحان
                  </TableHead>
                  <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3.5 px-4">
                    المادة
                  </TableHead>
                  <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3.5 px-4 hidden md:table-cell">
                    الطالب
                  </TableHead>
                  <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3.5 px-4 hidden lg:table-cell">
                    الفصل
                  </TableHead>
                  <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3.5 px-4">
                    الدرجة
                  </TableHead>
                  <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3.5 px-4 hidden sm:table-cell">
                    التاريخ
                  </TableHead>
                  <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3.5 px-4 text-center">
                    إجراءات
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam, index) => (
                  <TableRow
                    key={exam.id}
                    className={cn(
                      'border-b border-white/[0.04] transition-all duration-200',
                      'hover:bg-white/[0.04]',
                      index % 2 === 1 ? 'bg-white/[0.015]' : 'bg-transparent',
                    )}
                  >
                    {/* Title */}
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br from-[#D4A574]/20 to-[#D4A574]/5 shrink-0 border border-[#D4A574]/10">
                          <FileText className="h-4 w-4 text-[#D4A574]" />
                        </div>
                        <span className="text-sm font-medium text-slate-200 truncate max-w-[180px]">
                          {exam.title}
                        </span>
                      </div>
                    </TableCell>

                    {/* Subject */}
                    <TableCell className="py-3.5 px-4">
                      <Badge
                        variant="outline"
                        className="bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/15 text-xs px-2 py-0.5 rounded-full"
                      >
                        {exam.subject}
                      </Badge>
                    </TableCell>

                    {/* Student */}
                    <TableCell className="py-3.5 px-4 hidden md:table-cell">
                      <span className="text-sm text-slate-300 truncate block max-w-[140px]">
                        {getStudentName(exam.studentId)}
                      </span>
                    </TableCell>

                    {/* Class */}
                    <TableCell className="py-3.5 px-4 hidden lg:table-cell">
                      <span className="text-sm text-slate-300">
                        {getClassName(exam.classId)}
                      </span>
                    </TableCell>

                    {/* Score */}
                    <TableCell className="py-3.5 px-4">
                      <ScoreCell score={exam.score} maxScore={exam.maxScore} />
                    </TableCell>

                    {/* Date */}
                    <TableCell className="py-3.5 px-4 hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {exam.date ? new Date(exam.date).toLocaleDateString('ar-SA') : '—'}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {/* View */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(exam)}
                          className="h-8 w-8 text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg"
                          title="عرض"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Edit */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(exam)}
                          className="h-8 w-8 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg"
                          title="تعديل"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(exam)}
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
          </div>
        </div>
      )}

      {/* ── Dialogs ── */}
      <ExamFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingExam={selectedExam}
      />

      <ViewExamDialog
        exam={selectedExam}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />

      <DeleteExamDialog
        exam={selectedExam}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
