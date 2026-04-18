'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Trophy,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  Download,
  TrendingUp,
  BarChart3,
  Award,
  FileBarChart,
  Printer,
  Star,
  BookOpen,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Target,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { GradeRecord, ReportCard } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { exportToCSV, formatCsvDate } from '@/lib/csv-export';

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
// Constants
// ---------------------------------------------------------------------------

const ITEMS_PER_PAGE = 10;

const SUBJECT_OPTIONS = [
  { value: 'all', label: 'كل المواد' },
  { value: 'الرياضيات', label: 'الرياضيات' },
  { value: 'العلوم', label: 'العلوم' },
  { value: 'اللغة العربية', label: 'اللغة العربية' },
  { value: 'اللغة الإنجليزية', label: 'اللغة الإنجليزية' },
  { value: 'التاريخ', label: 'التاريخ' },
  { value: 'الجغرافيا', label: 'الجغرافيا' },
  { value: 'الفيزياء', label: 'الفيزياء' },
  { value: 'الكيمياء', label: 'الكيمياء' },
  { value: 'الأحياء', label: 'الأحياء' },
  { value: 'الحاسب الآلي', label: 'الحاسب الآلي' },
  { value: 'التربية الإسلامية', label: 'التربية الإسلامية' },
  { value: 'التربية الفنية', label: 'التربية الفنية' },
];

const TERM_OPTIONS = [
  { value: 'all', label: 'كل الفصول' },
  { value: 'الفصل الأول', label: 'الفصل الأول' },
  { value: 'الفصل الثاني', label: 'الفصل الثاني' },
];

const EXAM_TYPE_OPTIONS = [
  { value: 'all', label: 'كل الأنواع' },
  { value: 'اختبار شهري', label: 'اختبار شهري' },
  { value: 'اختبار نصفي', label: 'اختبار نصفي' },
  { value: 'واجب', label: 'واجب' },
  { value: 'مشاركة', label: 'مشاركة' },
  { value: 'اختبار نهائي', label: 'اختبار نهائي' },
];

const SUBJECTS = SUBJECT_OPTIONS.filter((s) => s.value !== 'all');
const TERMS = TERM_OPTIONS.filter((t) => t.value !== 'all');
const EXAM_TYPES = EXAM_TYPE_OPTIONS.filter((e) => e.value !== 'all');

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
  'std-011': 'عمر إبراهيم الزهراني',
  'std-012': 'هند تركي السبيعي',
};

const STUDENT_DROPDOWN = Object.entries(STUDENT_NAMES).map(([id, name]) => ({
  value: id,
  label: name,
}));

const CLASS_MAP: Record<string, string> = {
  'class-1': 'الصف الأول - أ',
  'class-2': 'الصف الأول - ب',
  'class-3': 'الصف الثاني - أ',
  'class-4': 'الصف الثاني - ب',
  'class-5': 'الصف الثالث - أ',
  'class-6': 'الصف الثالث - ب',
};

const BEHAVIOR_GRADES = ['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'يحتاج تحسين'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStudentName(studentId: string): string {
  return STUDENT_NAMES[studentId] ?? '—';
}

function getScoreColor(pct: number): { bar: string; text: string; bg: string; badge: string } {
  if (pct >= 90) return {
    bar: 'bg-emerald-500',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  };
  if (pct >= 70) return {
    bar: 'bg-amber-500',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  };
  return {
    bar: 'bg-rose-500',
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  };
}

function getGpaColor(gpa: number): string {
  if (gpa >= 3.5) return 'text-emerald-400';
  if (gpa >= 2.5) return 'text-amber-400';
  return 'text-rose-400';
}

function getGpaLabel(gpa: number): string {
  if (gpa >= 3.5) return 'ممتاز';
  if (gpa >= 3.0) return 'جيد جداً';
  if (gpa >= 2.5) return 'جيد';
  if (gpa >= 2.0) return 'مقبول';
  return 'يحتاج تحسين';
}

function calculateGpa(score: number, maxScore: number): number {
  const pct = (score / maxScore) * 100;
  if (pct >= 90) return 4.0;
  if (pct >= 85) return 3.75;
  if (pct >= 80) return 3.5;
  if (pct >= 75) return 3.25;
  if (pct >= 70) return 3.0;
  if (pct >= 65) return 2.75;
  if (pct >= 60) return 2.5;
  if (pct >= 55) return 2.25;
  if (pct >= 50) return 2.0;
  return 1.0;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const INITIAL_GRADES: GradeRecord[] = [
  {
    id: 'gr-001', studentId: 'std-001', studentName: 'أحمد محمد علي', classId: 'class-1', className: 'الصف الأول - أ',
    subject: 'الرياضيات', term: 'الفصل الأول', examType: 'اختبار نهائي', score: 95, maxScore: 100, weight: 30,
    date: '2024-12-15', notes: 'أداء ممتاز في الجبر والهندسة', createdAt: '2024-12-15T08:00:00.000Z',
  },
  {
    id: 'gr-002', studentId: 'std-001', studentName: 'أحمد محمد علي', classId: 'class-1', className: 'الصف الأول - أ',
    subject: 'الرياضيات', term: 'الفصل الأول', examType: 'اختبار نصفي', score: 88, maxScore: 100, weight: 20,
    date: '2024-11-10', notes: 'حل معظم المسائل بشكل صحيح', createdAt: '2024-11-10T08:00:00.000Z',
  },
  {
    id: 'gr-003', studentId: 'std-001', studentName: 'أحمد محمد علي', classId: 'class-1', className: 'الصف الأول - أ',
    subject: 'اللغة العربية', term: 'الفصل الأول', examType: 'اختبار نهائي', score: 82, maxScore: 100, weight: 30,
    date: '2024-12-14', notes: 'إعراب جيد مع بعض الأخطاء في النحو', createdAt: '2024-12-14T08:00:00.000Z',
  },
  {
    id: 'gr-004', studentId: 'std-002', studentName: 'فاطمة أحمد حسن', classId: 'class-2', className: 'الصف الأول - ب',
    subject: 'العلوم', term: 'الفصل الأول', examType: 'اختبار نهائي', score: 91, maxScore: 100, weight: 30,
    date: '2024-12-13', notes: 'فهم ممتاز للتجارب العملية', createdAt: '2024-12-13T08:00:00.000Z',
  },
  {
    id: 'gr-005', studentId: 'std-002', studentName: 'فاطمة أحمد حسن', classId: 'class-2', className: 'الصف الأول - ب',
    subject: 'اللغة الإنجليزية', term: 'الفصل الأول', examType: 'اختبار نصفي', score: 76, maxScore: 100, weight: 20,
    date: '2024-11-08', notes: 'تحسن واضح في الكتابة', createdAt: '2024-11-08T08:00:00.000Z',
  },
  {
    id: 'gr-006', studentId: 'std-003', studentName: 'عبدالله خالد العتيبي', classId: 'class-3', className: 'الصف الثاني - أ',
    subject: 'الفيزياء', term: 'الفصل الأول', examType: 'اختبار شهري', score: 65, maxScore: 100, weight: 10,
    date: '2024-10-20', notes: 'يحتاج تحسين في حل المسائل', createdAt: '2024-10-20T08:00:00.000Z',
  },
  {
    id: 'gr-007', studentId: 'std-003', studentName: 'عبدالله خالد العتيبي', classId: 'class-3', className: 'الصف الثاني - أ',
    subject: 'التربية الإسلامية', term: 'الفصل الأول', examType: 'واجب', score: 92, maxScore: 100, weight: 10,
    date: '2024-11-05', notes: 'حفظ ممتاز للآيات', createdAt: '2024-11-05T08:00:00.000Z',
  },
  {
    id: 'gr-008', studentId: 'std-004', studentName: 'نورة سعيد القحطاني', classId: 'class-1', className: 'الصف الأول - أ',
    subject: 'الرياضيات', term: 'الفصل الأول', examType: 'اختبار نهائي', score: 58, maxScore: 100, weight: 30,
    date: '2024-12-15', notes: 'تحتاج دعم إضافي في التفاضل', createdAt: '2024-12-15T08:00:00.000Z',
  },
  {
    id: 'gr-009', studentId: 'std-004', studentName: 'نورة سعيد القحطاني', classId: 'class-1', className: 'الصف الأول - أ',
    subject: 'الأحياء', term: 'الفصل الأول', examType: 'مشاركة', score: 85, maxScore: 100, weight: 10,
    date: '2024-11-25', notes: 'مشاركة فعّالة في المناقشات', createdAt: '2024-11-25T08:00:00.000Z',
  },
  {
    id: 'gr-010', studentId: 'std-005', studentName: 'محمد عبدالرحمن الدوسري', classId: 'class-5', className: 'الصف الثالث - أ',
    subject: 'الكيمياء', term: 'الفصل الأول', examType: 'اختبار نصفي', score: 73, maxScore: 100, weight: 20,
    date: '2024-11-12', notes: 'أداء جيد مع تحسن ملموس', createdAt: '2024-11-12T08:00:00.000Z',
  },
  {
    id: 'gr-011', studentId: 'std-005', studentName: 'محمد عبدالرحمن الدوسري', classId: 'class-5', className: 'الصف الثالث - أ',
    subject: 'الحاسب الآلي', term: 'الفصل الأول', examType: 'واجب', score: 97, maxScore: 100, weight: 10,
    date: '2024-11-20', notes: 'مبدع في البرمجة', createdAt: '2024-11-20T08:00:00.000Z',
  },
  {
    id: 'gr-012', studentId: 'std-006', studentName: 'ريم فهد المطيري', classId: 'class-4', className: 'الصف الثاني - ب',
    subject: 'التاريخ', term: 'الفصل الثاني', examType: 'اختبار شهري', score: 88, maxScore: 100, weight: 10,
    date: '2025-01-18', notes: 'استيعاب ممتاز للأحداث التاريخية', createdAt: '2025-01-18T08:00:00.000Z',
  },
  {
    id: 'gr-013', studentId: 'std-006', studentName: 'ريم فهد المطيري', classId: 'class-4', className: 'الصف الثاني - ب',
    subject: 'الجغرافيا', term: 'الفصل الثاني', examType: 'مشاركة', score: 80, maxScore: 100, weight: 10,
    date: '2025-01-25', notes: 'تحليل جيد للخرائط', createdAt: '2025-01-25T08:00:00.000Z',
  },
  {
    id: 'gr-014', studentId: 'std-007', studentName: 'سلطان فيصل الشمري', classId: 'class-3', className: 'الصف الثاني - أ',
    subject: 'اللغة العربية', term: 'الفصل الأول', examType: 'اختبار نهائي', score: 42, maxScore: 100, weight: 30,
    date: '2024-12-14', notes: 'يحتاج متابعة مكثفة في النحو والصرف', createdAt: '2024-12-14T08:00:00.000Z',
  },
  {
    id: 'gr-015', studentId: 'std-007', studentName: 'سلطان فيصل الشمري', classId: 'class-3', className: 'الصف الثاني - أ',
    subject: 'التربية الفنية', term: 'الفصل الأول', examType: 'واجب', score: 90, maxScore: 100, weight: 10,
    date: '2024-11-15', notes: 'إنتاج فني متميز', createdAt: '2024-11-15T08:00:00.000Z',
  },
  {
    id: 'gr-016', studentId: 'std-008', studentName: 'لطيفة عايض الحربي', classId: 'class-6', className: 'الصف الثالث - ب',
    subject: 'الرياضيات', term: 'الفصل الثاني', examType: 'اختبار شهري', score: 78, maxScore: 100, weight: 10,
    date: '2025-02-10', notes: 'تحسن واضح منذ الفصل الماضي', createdAt: '2025-02-10T08:00:00.000Z',
  },
  {
    id: 'gr-017', studentId: 'std-009', studentName: 'يزيد ناصر البقمي', classId: 'class-2', className: 'الصف الأول - ب',
    subject: 'الفيزياء', term: 'الفصل الأول', examType: 'اختبار نهائي', score: 87, maxScore: 100, weight: 30,
    date: '2024-12-16', notes: 'فهم قوي لقوانين نيوتن', createdAt: '2024-12-16T08:00:00.000Z',
  },
  {
    id: 'gr-018', studentId: 'std-010', studentName: 'سارة ماجد العنزي', classId: 'class-5', className: 'الصف الثالث - أ',
    subject: 'اللغة الإنجليزية', term: 'الفصل الأول', examType: 'اختبار نهائي', score: 93, maxScore: 100, weight: 30,
    date: '2024-12-17', notes: 'مستوى ممتاز في المحادثة والكتابة', createdAt: '2024-12-17T08:00:00.000Z',
  },
  {
    id: 'gr-019', studentId: 'std-011', studentName: 'عمر إبراهيم الزهراني', classId: 'class-4', className: 'الصف الثاني - ب',
    subject: 'العلوم', term: 'الفصل الثاني', examType: 'اختبار نصفي', score: 69, maxScore: 100, weight: 20,
    date: '2025-01-22', notes: 'أداء مقبول يحتاج مراجعة', createdAt: '2025-01-22T08:00:00.000Z',
  },
  {
    id: 'gr-020', studentId: 'std-012', studentName: 'هند تركي السبيعي', classId: 'class-6', className: 'الصف الثالث - ب',
    subject: 'التربية الإسلامية', term: 'الفصل الأول', examType: 'اختبار شهري', score: 96, maxScore: 100, weight: 10,
    date: '2024-10-25', notes: 'حفظ وإتقان ممتاز', createdAt: '2024-10-25T08:00:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Score badge component */
function ScoreBadge({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = Math.round((score / maxScore) * 100);
  const colors = getScoreColor(pct);
  return (
    <Badge variant="outline" className={cn('text-xs font-bold px-2.5 py-0.5 rounded-full tabular-nums', colors.badge)}>
      {score}/{maxScore}
      <span className="mr-1 opacity-70">({pct}%)</span>
    </Badge>
  );
}

/** Stat card for the stats row */
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
    <div className="hover-lift animate-fade-in-up rounded-xl p-4 stagger-grid" style={{ backgroundColor: '#1A1A24', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-4">
        <div className={cn('flex items-center justify-center h-11 w-11 rounded-xl shrink-0', accentClass)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-[#8B8B9E] mb-0.5">{label}</p>
          <p className="text-xl font-bold text-[#F1F1F6] tabular-nums leading-tight">{value}</p>
          {subtext && <p className="text-[11px] text-[#8B8B9E] mt-0.5">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}

/** Empty state */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6">
        <Trophy className="h-10 w-10 text-[#8B8B9E]" />
      </div>
      <h3 className="text-lg font-semibold text-[#C4C4D4] mb-2">لا توجد سجلات درجات</h3>
      <p className="text-sm text-[#8B8B9E] mb-6 text-center max-w-sm">
        ابدأ بإضافة درجات الطلاب لمتابعة أدائهم الأكاديمي وإنشاء كشوف الدرجات
      </p>
      <Button onClick={onAdd} className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold gap-2 rounded-lg px-6">
        <Plus className="h-4 w-4" />
        إضافة درجة جديدة
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add/Edit Grade Dialog
// ---------------------------------------------------------------------------

function GradeFormContent({
  editingGrade,
  onClose,
}: {
  editingGrade: GradeRecord | null;
  onClose: () => void;
}) {
  const { addGrade, updateGrade } = useAppStore();
  const isEditing = !!editingGrade;

  const [studentId, setStudentId] = useState(editingGrade?.studentId ?? STUDENT_DROPDOWN[0]?.value ?? '');
  const [subject, setSubject] = useState(editingGrade?.subject ?? 'الرياضيات');
  const [term, setTerm] = useState(editingGrade?.term ?? 'الفصل الأول');
  const [examType, setExamType] = useState(editingGrade?.examType ?? 'اختبار شهري');
  const [score, setScore] = useState(editingGrade ? String(editingGrade.score) : '');
  const [maxScore, setMaxScore] = useState(editingGrade ? String(editingGrade.maxScore) : '100');
  const [weight, setWeight] = useState(editingGrade ? String(editingGrade.weight) : '10');
  const [date, setDate] = useState(editingGrade?.date ?? new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(editingGrade?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!score.trim()) return;

    const now = new Date().toISOString();
    const scoreNum = Number(score);
    const maxScoreNum = Number(maxScore) || 100;
    const weightNum = Number(weight) || 10;

    const baseData = {
      studentId,
      studentName: getStudentName(studentId),
      subject,
      term,
      examType,
      score: scoreNum,
      maxScore: maxScoreNum,
      weight: weightNum,
      date,
      notes: notes.trim(),
    };

    if (isEditing && editingGrade) {
      updateGrade(editingGrade.id, baseData);
      toast.success('تم تحديث الدرجة بنجاح');
    } else {
      const newGrade: GradeRecord = {
        id: `gr-${Date.now()}`,
        ...baseData,
        createdAt: now,
      };
      addGrade(newGrade);
      toast.success('تم إضافة الدرجة بنجاح');
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
      {/* Student */}
      <div className="flex flex-col gap-2">
        <Label className="text-[#C4C4D4] text-sm">اسم الطالب</Label>
        <Select value={studentId} onValueChange={setStudentId}>
          <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-[#C4C4D4] focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20">
            <SelectValue placeholder="اختر الطالب" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
            {STUDENT_DROPDOWN.map((stu) => (
              <SelectItem key={stu.value} value={stu.value} className="text-[#C4C4D4] focus:bg-white/[0.05] focus:text-white">
                {stu.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subject, Term, Exam Type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-[#C4C4D4] text-sm">المادة</Label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-[#C4C4D4] focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20">
              <SelectValue placeholder="اختر المادة" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              {SUBJECTS.map((sub) => (
                <SelectItem key={sub.value} value={sub.value} className="text-[#C4C4D4] focus:bg-white/[0.05] focus:text-white">
                  {sub.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-[#C4C4D4] text-sm">الفصل</Label>
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-[#C4C4D4] focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              {TERMS.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-[#C4C4D4] focus:bg-white/[0.05] focus:text-white">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-[#C4C4D4] text-sm">نوع التقييم</Label>
          <Select value={examType} onValueChange={setExamType}>
            <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-[#C4C4D4] focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              {EXAM_TYPES.map((et) => (
                <SelectItem key={et.value} value={et.value} className="text-[#C4C4D4] focus:bg-white/[0.05] focus:text-white">
                  {et.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Score, Max Score, Weight */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-[#C4C4D4] text-sm">الدرجة</Label>
          <Input
            type="number" min={0} value={score} onChange={(e) => setScore(e.target.value)}
            placeholder="مثال: 85"
            className="bg-white/[0.03] border-white/[0.08] text-[#C4C4D4] placeholder:text-[#8B8B9E]/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
            dir="ltr" required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-[#C4C4D4] text-sm">الدرجة القصوى</Label>
          <Input
            type="number" min={1} value={maxScore} onChange={(e) => setMaxScore(e.target.value)}
            placeholder="100"
            className="bg-white/[0.03] border-white/[0.08] text-[#C4C4D4] placeholder:text-[#8B8B9E]/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
            dir="ltr"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-[#C4C4D4] text-sm">الوزن (%)</Label>
          <Input
            type="number" min={0} max={100} value={weight} onChange={(e) => setWeight(e.target.value)}
            placeholder="10"
            className="bg-white/[0.03] border-white/[0.08] text-[#C4C4D4] placeholder:text-[#8B8B9E]/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
            dir="ltr"
          />
        </div>
      </div>

      {/* Date */}
      <div className="flex flex-col gap-2">
        <Label className="text-[#C4C4D4] text-sm">التاريخ</Label>
        <Input
          type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="bg-white/[0.03] border-white/[0.08] text-[#C4C4D4] focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
          dir="ltr"
        />
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-2">
        <Label className="text-[#C4C4D4] text-sm">ملاحظات</Label>
        <Textarea
          value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="أضف ملاحظات حول أداء الطالب..."
          className="bg-white/[0.03] border-white/[0.08] text-[#C4C4D4] placeholder:text-[#8B8B9E]/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 min-h-[80px] resize-none"
        />
      </div>

      {/* Actions */}
      <DialogFooter className="flex-row gap-3 sm:justify-start pt-2">
        <Button type="submit" className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold rounded-lg px-6 gap-2">
          {isEditing ? (<><Pencil className="h-4 w-4" />حفظ التغييرات</>) : (<><Plus className="h-4 w-4" />إضافة الدرجة</>)}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} className="border-white/[0.08] text-[#C4C4D4] hover:bg-white/[0.05] hover:text-white rounded-lg px-6">
          إلغاء
        </Button>
      </DialogFooter>
    </form>
  );
}

function GradeFormDialog({
  open,
  onOpenChange,
  editingGrade,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGrade: GradeRecord | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl" style={{ backgroundColor: '#1A1A24', border: '1px solid rgba(255,255,255,0.06)' }}>
        <DialogHeader>
          <DialogTitle className="text-[#F1F1F6] text-xl">{editingGrade ? 'تعديل الدرجة' : 'إضافة درجة جديدة'}</DialogTitle>
          <DialogDescription className="text-[#8B8B9E]">
            {editingGrade ? 'قم بتعديل بيانات الدرجة ثم اضغط حفظ التغييرات' : 'أدخل بيانات الدرجة الجديدة لإضافتها'}
          </DialogDescription>
        </DialogHeader>
        {open && <GradeFormContent editingGrade={editingGrade} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// View Grade Dialog
// ---------------------------------------------------------------------------

function ViewGradeDialog({
  grade,
  open,
  onOpenChange,
}: {
  grade: GradeRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!grade) return null;

  const pct = Math.round((grade.score / grade.maxScore) * 100);
  const colors = getScoreColor(pct);
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (pct / 100) * circumference;

  const fields = [
    { label: 'الطالب', value: grade.studentName ?? '—', icon: User },
    { label: 'المادة', value: grade.subject, icon: BookOpen },
    { label: 'الفصل', value: grade.term, icon: Calendar },
    { label: 'نوع التقييم', value: grade.examType, icon: Target },
    { label: 'الوزن', value: `${grade.weight}%`, icon: BarChart3 },
    { label: 'التاريخ', value: new Date(grade.date).toLocaleDateString('ar-SA'), icon: Calendar },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir="rtl" style={{ backgroundColor: '#1A1A24', border: '1px solid rgba(255,255,255,0.06)' }}>
        <DialogHeader>
          <DialogTitle className="text-[#F1F1F6] text-xl">تفاصيل الدرجة</DialogTitle>
          <DialogDescription className="text-[#8B8B9E]">عرض كافة تفاصيل سجل الدرجة</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Score circular indicator */}
          <div className="flex flex-col items-center justify-center rounded-xl p-6" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-xs text-[#8B8B9E] mb-3">الدرجة المحصلة</p>
            <div className="relative h-28 w-28 mb-3">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke={pct >= 90 ? '#10b981' : pct >= 70 ? '#f59e0b' : '#f43f5e'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${offset} ${circumference}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-2xl font-bold tabular-nums', colors.text)}>{grade.score}</span>
                <span className="text-xs text-[#8B8B9E]">من {grade.maxScore}</span>
              </div>
            </div>
            <ScoreBadge score={grade.score} maxScore={grade.maxScore} />
          </div>

          {/* Info fields */}
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="grid grid-cols-1 gap-0">
              {fields.map((field) => (
                <div key={field.label} className="flex items-center justify-between gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                      <field.icon className="h-4 w-4 text-[#D4A574]" />
                    </div>
                    <span className="text-sm text-[#8B8B9E]">{field.label}</span>
                  </div>
                  <span className="text-sm font-medium text-[#C4C4D4]">{field.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {grade.notes && (
            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <h4 className="text-sm font-semibold text-[#C4C4D4] mb-2">ملاحظات</h4>
              <p className="text-sm text-[#8B8B9E] leading-relaxed">{grade.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirmation
// ---------------------------------------------------------------------------

function DeleteGradeDialog({
  grade,
  open,
  onOpenChange,
}: {
  grade: GradeRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { deleteGrade } = useAppStore();

  const handleDelete = () => {
    if (grade) {
      deleteGrade(grade.id);
      toast.success('تم حذف الدرجة');
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl" style={{ backgroundColor: '#1A1A24', border: '1px solid rgba(255,255,255,0.06)' }}>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#F1F1F6] text-lg">تأكيد حذف الدرجة</AlertDialogTitle>
          <AlertDialogDescription className="text-[#8B8B9E] leading-relaxed">
            هل أنت متأكد من حذف درجة{' '}
            <span className="font-semibold text-[#C4C4D4]">{grade?.studentName}</span> في مادة{' '}
            <span className="font-semibold text-[#C4C4D4]">{grade?.subject}</span>؟
            <br />
            لا يمكن التراجع عن هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-3 sm:justify-start mt-2">
          <AlertDialogCancel className="border-white/[0.08] text-[#C4C4D4] hover:bg-white/[0.05] hover:text-white rounded-lg px-6 mt-0">
            إلغاء
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg px-6 gap-2">
            <Trash2 className="h-4 w-4" />
            نعم، احذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Pure helper: compute class averages for performance comparison chart
// ---------------------------------------------------------------------------

function computeClassAverages(grades: GradeRecord[]): { className: string; average: number; count: number }[] {
  const classMap = new Map<string, { totalWeighted: number; totalWeight: number; count: number }>();
  for (const grade of grades) {
    const className = grade.className ?? grade.classId ?? 'غير محدد';
    const existing = classMap.get(className) ?? { totalWeighted: 0, totalWeight: 0, count: 0 };
    const eps = 0.001;
    const pct = (grade.score / Math.max(eps, grade.maxScore)) * 100;
    classMap.set(className, {
      totalWeighted: existing.totalWeighted + (pct * grade.weight),
      totalWeight: existing.totalWeight + grade.weight,
      count: existing.count + 1,
    });
  }
  const result: { className: string; average: number; count: number }[] = [];
  classMap.forEach((val, key) => {
    result.push({
      className: key,
      average: val.totalWeight > 0 ? Math.round(val.totalWeighted / val.totalWeight) : 0,
      count: val.count,
    });
  });
  return result.sort((a, b) => b.average - a.average);
}

// ---------------------------------------------------------------------------
// Pure helper: compute grade distribution counts
// ---------------------------------------------------------------------------

function computeGradeDistribution(grades: GradeRecord[]): { excellent: number; veryGood: number; good: number; weak: number } {
  const eps = 0.001;
  let excellent = 0;
  let veryGood = 0;
  let good = 0;
  let weak = 0;
  for (const grade of grades) {
    const pct = (grade.score / Math.max(eps, grade.maxScore)) * 100;
    if (pct >= 90) excellent++;
    else if (pct >= 75) veryGood++;
    else if (pct >= 60) good++;
    else weak++;
  }
  return { excellent, veryGood, good, weak };
}

// ---------------------------------------------------------------------------
// Class Performance Comparison Chart
// ---------------------------------------------------------------------------

function getBarColor(pct: number): string {
  if (pct >= 90) return '#34D399';
  if (pct >= 75) return '#D4A574';
  if (pct >= 60) return '#38BDF8';
  return '#F472B6';
}

function ClassPerformanceChart({ classData }: { classData: { className: string; average: number; count: number }[] }) {
  const [animated, setAnimated] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  if (classData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <BarChart3 className="h-10 w-10 text-[#8B8B9E]/40 mb-3" />
        <p className="text-sm text-[#8B8B9E]">لا توجد بيانات كافية لعرض المقارنة</p>
      </div>
    );
  }

  const maxAvg = Math.max(...classData.map((c) => c.average), 1);
  const eps = 0.001;

  return (
    <div className="flex flex-col gap-4">
      {/* Chart */}
      <div className="flex flex-col gap-3">
        {classData.map((item, idx) => {
          const barWidth = Math.max(eps, (item.average / maxAvg) * 100);
          const color = getBarColor(item.average);
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={item.className}
              className="group relative flex items-center gap-3 cursor-default"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Class name label */}
              <div className="w-36 sm:w-44 shrink-0 text-left">
                <span className={cn(
                  'text-sm font-medium transition-colors duration-200',
                  isHovered ? 'text-[#E8E8ED]' : 'text-[#C4C4D4]'
                )}>
                  {item.className}
                </span>
              </div>

              {/* Bar */}
              <div className="flex-1 h-8 rounded-lg overflow-hidden relative" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 100 32"
                  preserveAspectRatio="none"
                >
                  <rect
                    x="100"
                    y="0"
                    width={barWidth}
                    height="32"
                    rx="6"
                    fill={color}
                    fillOpacity={isHovered ? 0.35 : 0.22}
                    style={{
                      transform: `translateX(-${barWidth}%) scaleX(${animated ? 1 : 0})`,
                      transformOrigin: 'left center',
                      transition: `transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 80}ms, fill-opacity 0.2s ease`,
                    }}
                  />
                </svg>
                <div
                  className="absolute inset-y-0 right-0 rounded-lg transition-all duration-200"
                  style={{
                    width: animated ? `${barWidth}%` : '0%',
                    backgroundColor: color,
                    opacity: isHovered ? 0.9 : 0.7,
                    transition: `width 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 80}ms, opacity 0.2s ease`,
                  }}
                />
              </div>

              {/* Score label */}
              <div className="w-16 shrink-0 text-left">
                <span className={cn(
                  'text-sm font-bold tabular-nums transition-colors duration-200',
                  isHovered ? 'text-[#E8E8ED]' : 'text-[#C4C4D4]'
                )}>
                  {item.average}%
                </span>
              </div>

              {/* Tooltip on hover */}
              {isHovered && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-lg text-xs font-medium text-[#E8E8ED] whitespace-nowrap animate-fade-in"
                  style={{
                    backgroundColor: 'rgba(26,26,36,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  <span>{item.className}: </span>
                  <span style={{ color }}>{item.average}%</span>
                  <span className="text-[#8B8B9E]"> ({item.count} سجل)</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-white/[0.04]">
        {[
          { label: 'ممتاز ≥90%', color: '#34D399' },
          { label: 'جيد جداً ≥75%', color: '#D4A574' },
          { label: 'جيد ≥60%', color: '#38BDF8' },
          { label: 'ضعيف <60%', color: '#F472B6' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[11px] text-[#8B8B9E]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grade Distribution Summary Pills
// ---------------------------------------------------------------------------

function GradeDistributionPills({ distribution, total }: { distribution: { excellent: number; veryGood: number; good: number; weak: number }; total: number }) {
  const pills = [
    { label: 'ممتاز', count: distribution.excellent, color: '#34D399', bgColor: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.2)' },
    { label: 'جيد جداً', count: distribution.veryGood, color: '#D4A574', bgColor: 'rgba(212,165,116,0.1)', borderColor: 'rgba(212,165,116,0.2)' },
    { label: 'جيد', count: distribution.good, color: '#38BDF8', bgColor: 'rgba(56,189,248,0.1)', borderColor: 'rgba(56,189,248,0.2)' },
    { label: 'ضعيف', count: distribution.weak, color: '#F472B6', bgColor: 'rgba(244,114,182,0.1)', borderColor: 'rgba(244,114,182,0.2)' },
  ];

  const eps = 0.001;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pills.map((pill) => {
        const pct = total > 0 ? Math.round((pill.count / Math.max(eps, total)) * 100) : 0;
        return (
          <div
            key={pill.label}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: pill.bgColor,
              border: `1px solid ${pill.borderColor}`,
              color: pill.color,
            }}
          >
            <span>{pill.label}</span>
            <span className="font-bold tabular-nums">{pill.count}</span>
            <span className="opacity-60 tabular-nums">({pct}%)</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pure helper: compute subject averages for report card
// ---------------------------------------------------------------------------

function computeSubjectAverages(grades: GradeRecord[]): { subject: string; average: number }[] {
  const subjectMap = new Map<string, { totalWeighted: number; totalWeight: number }>();
  for (const grade of grades) {
    const existing = subjectMap.get(grade.subject) ?? { totalWeighted: 0, totalWeight: 0 };
    const pct = (grade.score / grade.maxScore) * 100;
    subjectMap.set(grade.subject, {
      totalWeighted: existing.totalWeighted + (pct * grade.weight),
      totalWeight: existing.totalWeight + grade.weight,
    });
  }
  const result: { subject: string; average: number }[] = [];
  subjectMap.forEach((val, key) => {
    result.push({
      subject: key,
      average: val.totalWeight > 0 ? Math.round(val.totalWeighted / val.totalWeight) : 0,
    });
  });
  return result.sort((a, b) => b.average - a.average);
}

// ---------------------------------------------------------------------------
// Report Card Dialog
// ---------------------------------------------------------------------------

function ReportCardDialog({
  reportCard,
  open,
  onOpenChange,
}: {
  reportCard: ReportCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const handlePrint = () => {
    window.print();
  };

  if (!reportCard) return null;

  const subjectAverages = computeSubjectAverages(reportCard.grades);

  const gpaColor = getGpaColor(reportCard.gpa);
  const circumference = 2 * Math.PI * 48;
  const gpaOffset = circumference - ((reportCard.gpa / 4.0) * 100 / 100) * circumference;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl" style={{ backgroundColor: '#1A1A24', border: '1px solid rgba(255,255,255,0.06)' }}>
        <DialogHeader>
          <DialogTitle className="text-[#F1F1F6] text-xl flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-[#D4A574]" />
            كشف درجات الطالب
          </DialogTitle>
          <DialogDescription className="text-[#8B8B9E]">تقرير أداء الطالب الشامل</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Student info header */}
          <div className="glass-card-elevated rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-[#D4A574]/20 to-[#D4A574]/5 border border-[#D4A574]/10">
                  <GraduationCap className="h-6 w-6 text-[#D4A574]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#F1F1F6]">{reportCard.studentName ?? '—'}</h3>
                  <p className="text-sm text-[#8B8B9E]">{reportCard.className ?? '—'} — {reportCard.term}</p>
                </div>
              </div>

              {/* GPA circular indicator */}
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20">
                  <svg className="h-20 w-20 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    <circle
                      cx="60" cy="60" r="48" fill="none"
                      stroke={reportCard.gpa >= 3.5 ? '#10b981' : reportCard.gpa >= 2.5 ? '#f59e0b' : '#f43f5e'}
                      strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={`${gpaOffset} ${circumference}`}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn('text-xl font-bold tabular-nums gradient-text-amber', gpaColor)}>{reportCard.gpa.toFixed(2)}</span>
                    <span className="text-[9px] text-[#8B8B9E]">من 4.0</span>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className={cn('text-sm font-bold', gpaColor)}>{getGpaLabel(reportCard.gpa)}</span>
                  <span className="text-xs text-[#8B8B9E]">المعدل التراكمي</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row: rank, attendance, behavior */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <Star className="h-5 w-5 text-[#D4A574] mx-auto mb-1" />
              <p className="text-lg font-bold text-[#F1F1F6] tabular-nums">{reportCard.rank}<span className="text-[#8B8B9E] text-sm font-normal">/{reportCard.totalStudents}</span></p>
              <p className="text-[10px] text-[#8B8B9E]">الترتيب في الفصل</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-emerald-400 tabular-nums">{reportCard.attendanceRate}%</p>
              <p className="text-[10px] text-[#8B8B9E]">نسبة الحضور</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <Info className="h-5 w-5 text-amber-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-amber-400">{reportCard.behaviorGrade}</p>
              <p className="text-[10px] text-[#8B8B9E]">السلوك</p>
            </div>
          </div>

          {/* Subject grades table */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="px-4 py-3 border-b border-white/[0.04]">
              <h4 className="text-sm font-semibold text-[#C4C4D4] flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#D4A574]" />
                الدرجات حسب المادة
              </h4>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/[0.04] hover:bg-transparent">
                  <TableHead className="text-[#8B8B9E] font-semibold text-xs py-2.5 px-3">المادة</TableHead>
                  <TableHead className="text-[#8B8B9E] font-semibold text-xs py-2.5 px-3 text-center">المتوسط المرجح</TableHead>
                  <TableHead className="text-[#8B8B9E] font-semibold text-xs py-2.5 px-3 text-center">التقدير</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjectAverages.map((item, idx) => {
                  const colors = getScoreColor(item.average);
                  return (
                    <TableRow key={item.subject} className={cn('border-b border-white/[0.02]', idx % 2 === 0 ? '' : 'bg-white/[0.01]', 'hover:bg-white/[0.03]')}>
                      <TableCell className="py-2.5 px-3 text-sm text-[#C4C4D4]">{item.subject}</TableCell>
                      <TableCell className="py-2.5 px-3 text-center">
                        <Badge variant="outline" className={cn('text-xs font-bold px-2 py-0.5 rounded-full tabular-nums', colors.badge)}>
                          {item.average}%
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-center">
                        <span className={cn('text-xs font-medium', colors.text)}>
                          {item.average >= 90 ? 'ممتاز' : item.average >= 80 ? 'جيد جداً' : item.average >= 70 ? 'جيد' : item.average >= 60 ? 'مقبول' : 'ضعيف'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Teacher comment */}
          {reportCard.teacherComment && (
            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <h4 className="text-sm font-semibold text-[#C4C4D4] mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-[#D4A574]" />
                تعليق المعلم
              </h4>
              <p className="text-sm text-[#8B8B9E] leading-relaxed">{reportCard.teacherComment}</p>
            </div>
          )}

          {/* Print button */}
          <DialogFooter className="flex-row gap-3 sm:justify-start pt-2">
            <Button onClick={handlePrint} className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold rounded-lg px-6 gap-2">
              <Printer className="h-4 w-4" />
              طباعة الكشف
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/[0.08] text-[#C4C4D4] hover:bg-white/[0.05] hover:text-white rounded-lg px-6">
              إغلاق
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function GradesSection() {
  const { grades, setGrades, students } = useAppStore();

  // Local UI state
  const [localSearch, setLocalSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [termFilter, setTermFilter] = useState<string>('all');
  const [examTypeFilter, setExamTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reportCardOpen, setReportCardOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<GradeRecord | null>(null);
  const [currentReportCard, setCurrentReportCard] = useState<ReportCard | null>(null);

  // Initialize mock data once
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && grades.length === 0) {
      initialized.current = true;
      requestAnimationFrame(() => setGrades(INITIAL_GRADES));
    }
  }, []);

  // Statistics
  const stats = useMemo(() => {
    if (grades.length === 0) return { avgGpa: 0, highestPct: 0, highestSubject: '—', avgPct: 0, total: 0 };

    const totalWeightedPct = grades.reduce((sum, g) => sum + ((g.score / g.maxScore) * 100 * g.weight), 0);
    const totalWeight = grades.reduce((sum, g) => sum + g.weight, 0);
    const avgPct = totalWeight > 0 ? Math.round(totalWeightedPct / totalWeight) : 0;

    const avgGpa = grades.reduce((sum, g) => sum + calculateGpa(g.score, g.maxScore), 0) / grades.length;

    const highestGrade = grades.reduce((best, g) => ((g.score / g.maxScore) * 100) > ((best.score / best.maxScore) * 100) ? g : best, grades[0]);
    const highestPct = Math.round((highestGrade.score / highestGrade.maxScore) * 100);

    return {
      avgGpa: Math.round(avgGpa * 100) / 100,
      highestPct,
      highestSubject: highestGrade.subject,
      avgPct,
      total: grades.length,
    };
  }, [grades]);

  // Class averages for comparison chart
  const classAverages = useMemo(() => computeClassAverages(grades), [grades]);

  // Grade distribution for summary pills
  const gradeDistribution = useMemo(() => computeGradeDistribution(grades), [grades]);

  // Filtered grades
  const filteredGrades = useMemo(() => {
    let result = [...grades];

    if (subjectFilter !== 'all') {
      result = result.filter((g) => g.subject === subjectFilter);
    }
    if (termFilter !== 'all') {
      result = result.filter((g) => g.term === termFilter);
    }
    if (examTypeFilter !== 'all') {
      result = result.filter((g) => g.examType === examTypeFilter);
    }
    if (localSearch.trim()) {
      const query = localSearch.trim().toLowerCase();
      result = result.filter((g) =>
        (g.studentName ?? '').toLowerCase().includes(query) ||
        g.subject.toLowerCase().includes(query) ||
        g.examType.toLowerCase().includes(query)
      );
    }

    // Sort by date descending
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  }, [grades, subjectFilter, termFilter, examTypeFilter, localSearch]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredGrades.length / ITEMS_PER_PAGE));
  const paginatedGrades = filteredGrades.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Handlers
  const handleAdd = () => {
    setSelectedGrade(null);
    setFormOpen(true);
  };

  const handleEdit = (grade: GradeRecord) => {
    setSelectedGrade(grade);
    setFormOpen(true);
  };

  const handleView = (grade: GradeRecord) => {
    setSelectedGrade(grade);
    setViewOpen(true);
  };

  const handleDelete = (grade: GradeRecord) => {
    setSelectedGrade(grade);
    setDeleteOpen(true);
  };

  const handleExportCSV = useCallback(() => {
    const exportData = grades.map((g) => ({
      studentName: g.studentName ?? '',
      subject: g.subject,
      term: g.term,
      examType: g.examType,
      score: String(g.score),
      maxScore: String(g.maxScore),
      percentage: `${Math.round((g.score / g.maxScore) * 100)}%`,
      weight: `${g.weight}%`,
      date: formatCsvDate(g.date),
      notes: g.notes ?? '',
    }));
    exportToCSV(exportData, 'grades', [
      { key: 'studentName', label: 'الطالب' },
      { key: 'subject', label: 'المادة' },
      { key: 'term', label: 'الفصل' },
      { key: 'examType', label: 'نوع التقييم' },
      { key: 'score', label: 'الدرجة' },
      { key: 'maxScore', label: 'الدرجة القصوى' },
      { key: 'percentage', label: 'النسبة' },
      { key: 'weight', label: 'الوزن' },
      { key: 'date', label: 'التاريخ' },
      { key: 'notes', label: 'ملاحظات' },
    ]);
    toast.success('تم تصدير بيانات الدرجات بنجاح');
  }, [grades]);

  const handleGenerateReportCard = useCallback(() => {
    if (grades.length === 0) {
      toast.error('لا توجد درجات لإنشاء كشف');
      return;
    }

    // Find student with most grades, or first student
    const studentGradeCount = new Map<string, { count: number; grades: GradeRecord[] }>();
    for (const g of grades) {
      const existing = studentGradeCount.get(g.studentId) ?? { count: 0, grades: [] };
      studentGradeCount.set(g.studentId, { count: existing.count + 1, grades: [...existing.grades, g] });
    }

    // Sort by count descending
    const sortedStudents = [...studentGradeCount.entries()].sort((a, b) => b[1].count - a[1].count);
    const [topStudentId, topStudentData] = sortedStudents[0];

    const studentGrades = topStudentData.grades;
    const totalWeightedPct = studentGrades.reduce((sum, g) => sum + ((g.score / g.maxScore) * 100 * g.weight), 0);
    const totalWeight = studentGrades.reduce((sum, g) => sum + g.weight, 0);
    const avgPct = totalWeight > 0 ? totalWeightedPct / totalWeight : 0;

    const gpa = studentGrades.reduce((sum, g) => sum + calculateGpa(g.score, g.maxScore), 0) / studentGrades.length;

    const reportCard: ReportCard = {
      id: `rc-${Date.now()}`,
      studentId: topStudentId,
      studentName: getStudentName(topStudentId),
      className: studentGrades[0]?.className ?? '—',
      term: studentGrades[0]?.term ?? 'الفصل الأول',
      gpa: Math.round(gpa * 100) / 100,
      totalScore: Math.round(avgPct),
      rank: 2,
      totalStudents: sortedStudents.length,
      grades: studentGrades,
      behaviorGrade: gpa >= 3.5 ? 'ممتاز' : gpa >= 3.0 ? 'جيد جداً' : gpa >= 2.5 ? 'جيد' : 'مقبول',
      attendanceRate: gpa >= 3.5 ? 95 : gpa >= 3.0 ? 90 : gpa >= 2.5 ? 85 : 75,
      teacherComment: gpa >= 3.5
        ? 'طالب متميز يُظهر تفانياً عالياً في الدراسة ومشاركة فعّالة في الصف. يستحق التقدير وال encouragement.'
        : gpa >= 2.5
          ? 'أداء جيد مع إمكانية التحسين. يُنصح بالتركيز أكثر على المواد التي تظهر فيها نقاط الضعف.'
          : 'يحتاج المتابعة والدعم الإضافي. يُنصح بعقد اجتماع مع ولي الأمر لوضع خطة تحسين.',
      createdAt: new Date().toISOString(),
    };

    setCurrentReportCard(reportCard);
    setReportCardOpen(true);
  }, [grades]);

  // Reset page when filter changes
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* ── Page Title ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#D4A574]/10">
            <Trophy className="h-5 w-5 text-[#D4A574]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#F1F1F6] tracking-tight sm:text-3xl flex items-center gap-3">
              سجل الدرجات
              <Badge className="bg-[#D4A574]/15 text-[#D4A574] border-[#D4A574]/20 hover:bg-[#D4A574]/20 text-sm px-2.5 py-0.5 rounded-full font-semibold tabular-nums">
                {grades.length}
              </Badge>
            </h1>
            <p className="mt-0.5 text-sm text-[#8B8B9E]">
              إدارة وتتبع درجات الطلاب وإنشاء كشوف الأداء
            </p>
          </div>
        </div>
      </div>

      {/* ── Statistics Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Award}
          label="المعدل العام"
          value={stats.avgGpa.toFixed(2)}
          subtext="من 4.0 نقاط"
          accentClass="bg-[#D4A574]/15"
        />
        <StatCard
          icon={TrendingUp}
          label="أعلى درجة"
          value={`${stats.highestPct}%`}
          subtext={stats.highestSubject}
          accentClass="bg-emerald-500/15"
        />
        <StatCard
          icon={BarChart3}
          label="متوسط الدرجات"
          value={`${stats.avgPct}%`}
          subtext="مرجح بالوزن"
          accentClass="bg-amber-500/15"
        />
        <StatCard
          icon={BookOpen}
          label="عدد السجلات"
          value={stats.total}
          subtext="سجل درجة"
          accentClass="bg-sky-500/15"
        />
      </div>

      {/* ── Class Performance Comparison ── */}
      <div className="glass-card-elevated rounded-xl p-5 animate-fade-in-up relative overflow-hidden">
        {/* Corner accent decoration */}
        <div className="corner-accent pointer-events-none" />

        {/* Card header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#D4A574]/10 border border-[#D4A574]/15">
              <BarChart3 className="h-5 w-5 text-[#D4A574]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F1F1F6]">مقارنة أداء الصفوف</h3>
              <p className="text-[11px] text-[#8B8B9E]">المتوسط المرجح لكل صف</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-[#34D399]" />
            <span className="text-xs text-[#8B8B9E]">
              {classAverages.length} صفوف
            </span>
          </div>
        </div>

        {/* Chart */}
        <ClassPerformanceChart classData={classAverages} />

        {/* Grade Distribution Summary Pills */}
        <div className="mt-5 pt-4 border-t border-white/[0.04]">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-[#D4A574]" />
            <span className="text-xs font-semibold text-[#C4C4D4]">توزيع الدرجات</span>
          </div>
          <GradeDistributionPills distribution={gradeDistribution} total={grades.length} />
        </div>
      </div>

      {/* ── Action Bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl p-4" style={{ backgroundColor: '#1A1A24', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleAdd} className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold gap-2 rounded-lg px-5 h-10">
            <Plus className="h-4 w-4" />
            إضافة درجة
          </Button>
          <Button variant="outline" onClick={handleExportCSV} className="border-[#D4A574]/30 text-[#D4A574] hover:bg-[#D4A574]/10 gap-2 rounded-lg px-4 h-10">
            <Download className="h-4 w-4" />
            تصدير CSV
          </Button>
          <Button variant="outline" onClick={handleGenerateReportCard} className="border-[#D4A574]/30 text-[#D4A574] hover:bg-[#D4A574]/10 gap-2 rounded-lg px-4 h-10">
            <FileBarChart className="h-4 w-4" />
            إنشاء كشف درجات
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B8B9E]/50 pointer-events-none" />
            <Input
              value={localSearch} onChange={(e) => { setLocalSearch(e.target.value); setCurrentPage(1); }}
              placeholder="بحث باسم الطالب..."
              className="pr-10 w-full sm:w-52 bg-white/[0.03] border-white/[0.08] text-[#C4C4D4] placeholder:text-[#8B8B9E]/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 h-10"
            />
          </div>

          <Select value={subjectFilter} onValueChange={(v) => { setSubjectFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-36 bg-white/[0.03] border-white/[0.08] text-[#C4C4D4] focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              {SUBJECT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-[#C4C4D4] focus:bg-white/[0.05] focus:text-white">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={termFilter} onValueChange={(v) => { setTermFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-36 bg-white/[0.03] border-white/[0.08] text-[#C4C4D4] focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              {TERM_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-[#C4C4D4] focus:bg-white/[0.05] focus:text-white">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={examTypeFilter} onValueChange={(v) => { setExamTypeFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-36 bg-white/[0.03] border-white/[0.08] text-[#C4C4D4] focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              {EXAM_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-[#C4C4D4] focus:bg-white/[0.05] focus:text-white">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Grades Table ── */}
      {filteredGrades.length === 0 ? (
        <div className="rounded-xl" style={{ backgroundColor: '#1A1A24', border: '1px solid rgba(255,255,255,0.06)' }}>
          <EmptyState onAdd={handleAdd} />
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#1A1A24', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-[#8B8B9E] font-semibold text-xs uppercase tracking-wider py-3.5 px-4">الطالب</TableHead>
                  <TableHead className="text-[#8B8B9E] font-semibold text-xs uppercase tracking-wider py-3.5 px-4">المادة</TableHead>
                  <TableHead className="text-[#8B8B9E] font-semibold text-xs uppercase tracking-wider py-3.5 px-4 hidden md:table-cell">نوع التقييم</TableHead>
                  <TableHead className="text-[#8B8B9E] font-semibold text-xs uppercase tracking-wider py-3.5 px-4">الدرجة</TableHead>
                  <TableHead className="text-[#8B8B9E] font-semibold text-xs uppercase tracking-wider py-3.5 px-4 hidden lg:table-cell">الوزن</TableHead>
                  <TableHead className="text-[#8B8B9E] font-semibold text-xs uppercase tracking-wider py-3.5 px-4 hidden sm:table-cell">التاريخ</TableHead>
                  <TableHead className="text-[#8B8B9E] font-semibold text-xs uppercase tracking-wider py-3.5 px-4 text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedGrades.map((grade, idx) => {
                  const pct = Math.round((grade.score / grade.maxScore) * 100);
                  return (
                    <TableRow
                      key={grade.id}
                      className={cn(
                        'border-b border-white/[0.03] transition-colors duration-150',
                        idx % 2 === 0 ? '' : 'bg-white/[0.01]',
                        'hover:bg-white/[0.03]'
                      )}
                    >
                      {/* Student */}
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-[#D4A574]/20 to-[#D4A574]/5 border border-[#D4A574]/10 shrink-0">
                            <span className="text-xs font-bold text-[#D4A574]">
                              {(grade.studentName ?? '—').charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-[#C4C4D4] truncate max-w-[140px]">
                            {grade.studentName ?? '—'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Subject */}
                      <TableCell className="py-3 px-4">
                        <span className="text-sm text-[#C4C4D4]">{grade.subject}</span>
                      </TableCell>

                      {/* Exam Type */}
                      <TableCell className="py-3 px-4 hidden md:table-cell">
                        <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full bg-white/[0.03] border-white/[0.08] text-[#8B8B9E]">
                          {grade.examType}
                        </Badge>
                      </TableCell>

                      {/* Score */}
                      <TableCell className="py-3 px-4">
                        <ScoreBadge score={grade.score} maxScore={grade.maxScore} />
                      </TableCell>

                      {/* Weight */}
                      <TableCell className="py-3 px-4 hidden lg:table-cell">
                        <span className="text-xs text-[#8B8B9E] tabular-nums">{grade.weight}%</span>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="py-3 px-4 hidden sm:table-cell">
                        <span className="text-xs text-[#8B8B9E]">{new Date(grade.date).toLocaleDateString('ar-SA')}</span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleView(grade)}
                            className="flex items-center justify-center h-8 w-8 rounded-lg text-[#8B8B9E] hover:text-[#D4A574] hover:bg-[#D4A574]/10 transition-all duration-200"
                            title="عرض"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleEdit(grade)}
                            className="flex items-center justify-center h-8 w-8 rounded-lg text-[#8B8B9E] hover:text-amber-400 hover:bg-amber-400/10 transition-all duration-200"
                            title="تعديل"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(grade)}
                            className="flex items-center justify-center h-8 w-8 rounded-lg text-[#8B8B9E] hover:text-rose-400 hover:bg-rose-400/10 transition-all duration-200"
                            title="حذف"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <span className="text-xs text-[#8B8B9E]">
              عرض {(currentPage - 1) * ITEMS_PER_PAGE + 1} – {Math.min(currentPage * ITEMS_PER_PAGE, filteredGrades.length)} من {filteredGrades.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center h-8 w-8 rounded-lg text-[#8B8B9E] hover:text-[#C4C4D4] hover:bg-white/[0.05] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={cn(
                    'flex items-center justify-center h-8 w-8 rounded-lg text-xs font-medium transition-all duration-200',
                    page === currentPage
                      ? 'bg-[#D4A574] text-slate-900'
                      : 'text-[#8B8B9E] hover:text-[#C4C4D4] hover:bg-white/[0.05]'
                  )}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center h-8 w-8 rounded-lg text-[#8B8B9E] hover:text-[#C4C4D4] hover:bg-white/[0.05] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialogs ── */}
      <GradeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingGrade={selectedGrade}
      />
      <ViewGradeDialog
        grade={selectedGrade}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      <DeleteGradeDialog
        grade={selectedGrade}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
      <ReportCardDialog
        reportCard={currentReportCard}
        open={reportCardOpen}
        onOpenChange={setReportCardOpen}
      />
    </div>
  );
}
