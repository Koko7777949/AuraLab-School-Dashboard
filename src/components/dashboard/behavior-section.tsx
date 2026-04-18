'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ShieldAlert,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  Star,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Save,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { BehaviorRecord } from '@/lib/types';

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

const ITEMS_PER_PAGE = 10;

const POSITIVE_CATEGORIES = ['مشاركة', 'تميز', 'مساعدة زملاء'];
const NEGATIVE_CATEGORIES = ['تأخر', 'غياب بدون عذر', 'سلوك سيء'];
const ALL_CATEGORIES = [...POSITIVE_CATEGORIES, ...NEGATIVE_CATEGORIES];

const POSITIVE_ACTIONS = ['تكريم', 'شكر وتقدير', 'نقاط إضافية', 'لا يوجد'];
const NEGATIVE_ACTIONS = ['إنذار شفهي', 'اتصال ولي الأمر', 'إنذار كتابي', 'إحالة للمرشد', 'لا يوجد'];

const SEVERITY_LABELS: Record<string, string> = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'مرتفع',
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-rose-500',
};

const TYPE_CONFIG = {
  positive: {
    label: 'إيجابي',
    icon: ThumbsUp,
    color: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    glowColor: 'rgba(16, 185, 129, 0.08)',
  },
  negative: {
    label: 'سلبي',
    icon: ThumbsDown,
    color: 'text-rose-400',
    bgClass: 'bg-rose-500/10 border-rose-500/20',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
    glowColor: 'rgba(244, 63, 94, 0.08)',
  },
} as const;

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

function generateMockBehaviors(): BehaviorRecord[] {
  const students = [
    { id: 'std-001', name: 'أحمد محمد علي', classId: 'class-1', className: 'الصف الأول - أ' },
    { id: 'std-002', name: 'فاطمة أحمد حسن', classId: 'class-2', className: 'الصف الأول - ب' },
    { id: 'std-003', name: 'عبدالله خالد العتيبي', classId: 'class-3', className: 'الصف الثاني - أ' },
    { id: 'std-004', name: 'نورة سعيد القحطاني', classId: 'class-1', className: 'الصف الأول - أ' },
    { id: 'std-005', name: 'محمد عبدالرحمن الدوسري', classId: 'class-5', className: 'الصف الثالث - أ' },
    { id: 'std-006', name: 'ريم فهد المطيري', classId: 'class-4', className: 'الصف الثاني - ب' },
    { id: 'std-007', name: 'سلطان فيصل الشمري', classId: 'class-3', className: 'الصف الثاني - أ' },
    { id: 'std-008', name: 'لطيفة عايض الحربي', classId: 'class-6', className: 'الصف الثالث - ب' },
    { id: 'std-009', name: 'يزيد ناصر البقمي', classId: 'class-2', className: 'الصف الأول - ب' },
    { id: 'std-010', name: 'سارة ماجد العنزي', classId: 'class-5', className: 'الصف الثالث - أ' },
  ];

  const templates: {
    type: 'positive' | 'negative';
    category: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    action: string;
    points: number;
  }[] = [
    { type: 'positive', category: 'مشاركة', severity: 'low', description: 'شارك بنشاط في النقاش الصفي وأبدى رأياً بناءً', action: 'شكر وتقدير', points: 3 },
    { type: 'positive', category: 'تميز', severity: 'high', description: 'حصل على أعلى درجة في اختبار الرياضيات', action: 'تكريم', points: 10 },
    { type: 'positive', category: 'مساعدة زملاء', severity: 'medium', description: 'ساعد زميله في فهم material الدرس', action: 'نقاط إضافية', points: 5 },
    { type: 'positive', category: 'مشاركة', severity: 'medium', description: 'قدم عرضاً مميزاً أمام الصف', action: 'شكر وتقدير', points: 4 },
    { type: 'positive', category: 'تميز', severity: 'low', description: 'أنهى الواجب المنزلي بدقة وإتقان', action: 'لا يوجد', points: 2 },
    { type: 'positive', category: 'مساعدة زملاء', severity: 'high', description: 'تطوع لمساعدة زملائه في تنظيف الفصل', action: 'تكريم', points: 8 },
    { type: 'positive', category: 'مشاركة', severity: 'low', description: 'أجاب على جميع الأسئلة المطروحة', action: 'لا يوجد', points: 3 },
    { type: 'positive', category: 'تميز', severity: 'medium', description: 'أظهر تحسناً ملحوظاً في المستوى الدراسي', action: 'نقاط إضافية', points: 5 },
    { type: 'positive', category: 'مساعدة زملاء', severity: 'low', description: 'شارك أدواته مع زميل نسي حقيبته', action: 'لا يوجد', points: 2 },
    { type: 'positive', category: 'مشاركة', severity: 'medium', description: 'طرح سؤالاً ذكياً خلال الحصة', action: 'شكر وتقدير', points: 4 },
    { type: 'negative', category: 'تأخر', severity: 'low', description: 'تأخر عن الحصة لمدة 10 دقائق', action: 'إنذار شفهي', points: -2 },
    { type: 'negative', category: 'غياب بدون عذر', severity: 'high', description: 'تغيب عن المدرسة بدون عذر رسمي', action: 'اتصال ولي الأمر', points: -8 },
    { type: 'negative', category: 'سلوك سيء', severity: 'medium', description: 'أثار ضجيجاً أثناء الشرح مما أثر على سير الحصة', action: 'إنذار شفهي', points: -3 },
    { type: 'negative', category: 'تأخر', severity: 'low', description: 'تأخر عن تسليم الواجب المنزلي', action: 'إنذار شفهي', points: -2 },
    { type: 'negative', category: 'سلوك سيء', severity: 'high', description: 'تعامل بعدم أدب مع أحد المعلمين', action: 'اتصال ولي الأمر', points: -10 },
    { type: 'negative', category: 'غياب بدون عذر', severity: 'medium', description: 'غاب عن حصتين متتاليتين بدون عذر', action: 'إنذار كتابي', points: -5 },
    { type: 'negative', category: 'سلوك سيء', severity: 'low', description: 'لم يحترم دور زميله في العرض', action: 'إنذار شفهي', points: -2 },
    { type: 'negative', category: 'تأخر', severity: 'medium', description: 'تأخر عن الدخول للفصل عدة مرات هذا الأسبوع', action: 'إنذار كتابي', points: -4 },
    { type: 'negative', category: 'سلوك سيء', severity: 'medium', description: 'استخدام الهاتف المحمول أثناء الحصة', action: 'إنذار شفهي', points: -3 },
    { type: 'negative', category: 'غياب بدون عذر', severity: 'high', description: 'تغيب عن الاختبار بدون عذر مقبول', action: 'إحالة للمرشد', points: -10 },
  ];

  const records: BehaviorRecord[] = [];
  const today = new Date();

  for (let i = 0; i < 20; i++) {
    const tpl = templates[i];
    const student = students[i % students.length];
    const dayOffset = Math.floor(i / 3);
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const hours = 8 + Math.floor(Math.random() * 4);
    const mins = Math.floor(Math.random() * 60);
    date.setHours(hours, mins, 0, 0);

    records.push({
      id: `beh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      studentId: student.id,
      studentName: student.name,
      classId: student.classId,
      className: student.className,
      date: date.toISOString(),
      type: tpl.type,
      category: tpl.category,
      severity: tpl.severity,
      description: tpl.description,
      action: tpl.action,
      points: tpl.points,
      recordedBy: 'المعلم: خالد العمري',
      createdAt: date.toISOString(),
    });
  }

  return records;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  if (date >= todayStart) return 'اليوم';
  if (date >= yesterdayStart) return 'أمس';
  if (date >= weekStart) return 'هذا الأسبوع';
  return 'أقدم';
}

function getAutoPoints(type: 'positive' | 'negative', severity: 'low' | 'medium' | 'high'): number {
  const matrix = {
    positive: { low: 2, medium: 5, high: 10 },
    negative: { low: -2, medium: -5, high: -10 },
  };
  return matrix[type][severity];
}

function exportToCSV(records: BehaviorRecord[]) {
  const headers = ['اسم الطالب', 'الفصل', 'التاريخ', 'النوع', 'الفئة', 'الشدة', 'الوصف', 'الإجراء', 'النقاط', 'بواسطة'];
  const rows = records.map((r) => [
    r.studentName || '',
    r.className || '',
    formatDate(r.date),
    r.type === 'positive' ? 'إيجابي' : 'سلبي',
    r.category,
    SEVERITY_LABELS[r.severity],
    r.description,
    r.action,
    r.points.toString(),
    r.recordedBy,
  ]);

  const BOM = '\uFEFF';
  const csv = BOM + [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `behavior_records_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success('تم تصدير البيانات بنجاح');
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Stat card */
function StatCard({
  icon: Icon,
  label,
  value,
  colorClass,
  bgColor,
}: {
  icon: typeof Star;
  label: string;
  value: string | number;
  colorClass: string;
  bgColor: string;
}) {
  return (
    <div
      className="rounded-xl p-4 transition-all duration-300 hover:scale-[1.02]"
      style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className={cn('flex items-center justify-center h-10 w-10 rounded-xl', bgColor)}>
          <Icon className={cn('h-5 w-5', colorClass)} />
        </div>
        <div>
          <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

/** Category badge */
function CategoryBadge({ category, type }: { category: string; type: 'positive' | 'negative' }) {
  const config = TYPE_CONFIG[type];
  return (
    <Badge variant="outline" className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full', config.badgeClass)}>
      {category}
    </Badge>
  );
}

/** Severity dot indicator */
function SeverityDot({ severity }: { severity: 'low' | 'medium' | 'high' }) {
  return (
    <div className="flex items-center gap-1.5">
      {(['low', 'medium', 'high'] as const).map((level) => (
        <div
          key={level}
          className={cn(
            'h-1.5 w-1.5 rounded-full transition-all',
            SEVERITY_COLORS[level],
            severity === level ? 'opacity-100 scale-125' : 'opacity-20 scale-100'
          )}
        />
      ))}
      <span className="text-[10px] text-muted-foreground mr-1">{SEVERITY_LABELS[severity]}</span>
    </div>
  );
}

/** Points badge */
function PointsBadge({ points }: { points: number }) {
  const isPositive = points > 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full',
        isPositive
          ? 'bg-emerald-500/15 text-emerald-400'
          : 'bg-rose-500/15 text-rose-400'
      )}
    >
      {isPositive ? '+' : ''}{points}
    </span>
  );
}

// ---------------------------------------------------------------------------
// View Dialog
// ---------------------------------------------------------------------------

function ViewBehaviorDialog({
  record,
  open,
  onOpenChange,
}: {
  record: BehaviorRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!record) return null;
  const config = TYPE_CONFIG[record.type];
  const TypeIcon = config.icon;

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
            <Eye className="h-5 w-5 text-[#D4A574]" />
            تفاصيل سجل السلوك
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            عرض تفاصيل سجل سلوك الطالب
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
              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                    <Users className="h-4 w-4 text-[#D4A574]" />
                  </div>
                  <span className="text-sm text-muted-foreground">اسم الطالب</span>
                </div>
                <span className="text-sm font-medium text-slate-200">{record.studentName}</span>
              </div>

              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                    <SchoolIcon />
                  </div>
                  <span className="text-sm text-muted-foreground">الفصل</span>
                </div>
                <span className="text-sm font-medium text-slate-200">{record.className || '—'}</span>
              </div>

              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className={cn('flex items-center justify-center h-8 w-8 rounded-lg', config.bgClass)}>
                    <TypeIcon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <span className="text-sm text-muted-foreground">النوع</span>
                </div>
                <Badge variant="outline" className={cn('text-xs px-2.5 py-0.5 rounded-full', config.badgeClass)}>
                  {config.label}
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                    <AlertTriangle className="h-4 w-4 text-[#D4A574]" />
                  </div>
                  <span className="text-sm text-muted-foreground">الفئة</span>
                </div>
                <CategoryBadge category={record.category} type={record.type} />
              </div>

              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                    <ShieldAlert className="h-4 w-4 text-[#D4A574]" />
                  </div>
                  <span className="text-sm text-muted-foreground">الشدة</span>
                </div>
                <SeverityDot severity={record.severity} />
              </div>

              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                    <Star className="h-4 w-4 text-[#D4A574]" />
                  </div>
                  <span className="text-sm text-muted-foreground">النقاط</span>
                </div>
                <PointsBadge points={record.points} />
              </div>

              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                    <CheckCircle2 className="h-4 w-4 text-[#D4A574]" />
                  </div>
                  <span className="text-sm text-muted-foreground">الإجراء المتخذ</span>
                </div>
                <span className="text-sm font-medium text-slate-200">{record.action}</span>
              </div>

              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                    <Clock className="h-4 w-4 text-[#D4A574]" />
                  </div>
                  <span className="text-sm text-muted-foreground">التاريخ</span>
                </div>
                <span className="text-sm font-medium text-slate-200">{formatDate(record.date)} — {formatTime(record.date)}</span>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <h4 className="text-sm font-semibold text-slate-300 mb-2">الوصف</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{record.description}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SchoolIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#D4A574]">
      <path d="M22 10l-10-7L2 10l10 7z" /><path d="M6 12v5c3 3 6 3 6 3s3 0 6-3v-5" /><path d="M22 10v7" /><path d="M18 12v3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit Dialog
// ---------------------------------------------------------------------------

interface BehaviorFormData {
  studentId: string;
  type: 'positive' | 'negative';
  category: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  action: string;
  points: number;
}

function getDefaultFormData(): BehaviorFormData {
  return {
    studentId: '',
    type: 'positive',
    category: '',
    severity: 'low',
    description: '',
    action: '',
    points: 2,
  };
}

function BehaviorFormDialog({
  record,
  open,
  onOpenChange,
  students,
}: {
  record: BehaviorRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: { id: string; name: string; classId: string | null; className?: string }[];
}) {
  const { addBehavior, updateBehavior } = useAppStore();
  const isEdit = !!record;

  const [form, setForm] = useState<BehaviorFormData>(getDefaultFormData);

  // Reset form when dialog opens
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      requestAnimationFrame(() => {
        if (record) {
          setForm({
            studentId: record.studentId,
            type: record.type,
            category: record.category,
            severity: record.severity,
            description: record.description,
            action: record.action,
            points: record.points,
          });
        } else {
          setForm(getDefaultFormData());
        }
      });
    }
    prevOpenRef.current = open;
  }, [open, record]);

  const categories = form.type === 'positive' ? POSITIVE_CATEGORIES : NEGATIVE_CATEGORIES;
  const actions = form.type === 'positive' ? POSITIVE_ACTIONS : NEGATIVE_ACTIONS;

  const updateField = useCallback(<K extends keyof BehaviorFormData>(key: K, value: BehaviorFormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-calculate points when type or severity changes
      if (key === 'type' || key === 'severity') {
        next.points = getAutoPoints(next.type, next.severity);
        // Reset category when type changes
        if (key === 'type') {
          next.category = '';
          next.action = '';
        }
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.studentId) {
      toast.error('يرجى اختيار الطالب');
      return;
    }
    if (!form.category) {
      toast.error('يرجى اختيار الفئة');
      return;
    }
    if (!form.description.trim()) {
      toast.error('يرجى كتابة الوصف');
      return;
    }

    const student = students.find((s) => s.id === form.studentId);

    if (isEdit && record) {
      updateBehavior(record.id, {
        studentId: form.studentId,
        studentName: student?.name,
        classId: student?.classId || undefined,
        className: student?.className,
        type: form.type,
        category: form.category,
        severity: form.severity,
        description: form.description,
        action: form.action,
        points: form.points,
      });
      toast.success('تم تحديث سجل السلوك بنجاح');
    } else {
      const now = new Date().toISOString();
      addBehavior({
        id: `beh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        studentId: form.studentId,
        studentName: student?.name,
        classId: student?.classId || undefined,
        className: student?.className,
        date: now,
        type: form.type,
        category: form.category,
        severity: form.severity,
        description: form.description,
        action: form.action || 'لا يوجد',
        points: form.points,
        recordedBy: 'المعلم: خالد العمري',
        createdAt: now,
      });
      toast.success('تم تسجيل سلوك جديد بنجاح');
    }
    onOpenChange(false);
  }, [form, isEdit, record, students, addBehavior, updateBehavior, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        dir="rtl"
        style={{
          backgroundColor: '#1A1A24',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#D4A574]" />
            {isEdit ? 'تعديل سجل السلوك' : 'تسجيل سلوك جديد'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEdit ? `تعديل سجل سلوك ${record?.studentName}` : 'أضف سجل سلوك جديد لطالب'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-1 px-1 flex flex-col gap-4 mt-2">
          {/* Student selector */}
          <div className="flex flex-col gap-2">
            <Label className="text-slate-300 text-sm">اسم الطالب</Label>
            <Select
              value={form.studentId}
              onValueChange={(v) => updateField('studentId', v)}
            >
              <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-slate-200">
                <SelectValue placeholder="اختر الطالب..." />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}{s.className ? ` — ${s.className}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type radio */}
          <div className="flex flex-col gap-2">
            <Label className="text-slate-300 text-sm">نوع السلوك</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['positive', 'negative'] as const).map((t) => {
                const config = TYPE_CONFIG[t];
                const Icon = config.icon;
                const isSelected = form.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateField('type', t)}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-xl py-3 px-4 border transition-all duration-200',
                      isSelected
                        ? config.bgClass + ' ' + config.color + ' font-semibold'
                        : 'border-white/[0.06] text-slate-400 hover:bg-white/[0.04] hover:text-slate-300'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category dropdown */}
          <div className="flex flex-col gap-2">
            <Label className="text-slate-300 text-sm">الفئة</Label>
            <Select
              value={form.category}
              onValueChange={(v) => updateField('category', v)}
            >
              <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-slate-200">
                <SelectValue placeholder="اختر الفئة..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Severity selector */}
          <div className="flex flex-col gap-2">
            <Label className="text-slate-300 text-sm">مستوى الشدة</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => {
                const isSelected = form.severity === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updateField('severity', level)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl py-3 px-3 border transition-all duration-200',
                      isSelected
                        ? 'bg-[#D4A574]/10 border-[#D4A574]/30 text-[#D4A574] font-semibold'
                        : 'border-white/[0.06] text-slate-400 hover:bg-white/[0.04] hover:text-slate-300'
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <div className={cn('h-2.5 w-2.5 rounded-full', SEVERITY_COLORS[level])} />
                    </div>
                    <span className="text-xs">{SEVERITY_LABELS[level]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label className="text-slate-300 text-sm">الوصف</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="اكتب وصفاً تفصيلياً للسلوك..."
              className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 min-h-[80px] resize-none"
            />
          </div>

          {/* Action dropdown */}
          <div className="flex flex-col gap-2">
            <Label className="text-slate-300 text-sm">الإجراء المتخذ</Label>
            <Select
              value={form.action}
              onValueChange={(v) => updateField('action', v)}
            >
              <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-slate-200">
                <SelectValue placeholder="اختر الإجراء..." />
              </SelectTrigger>
              <SelectContent>
                {actions.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Points preview */}
          <div
            className="rounded-xl p-3 flex items-center justify-between"
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <span className="text-sm text-muted-foreground">النقاط (تلقائي)</span>
            <PointsBadge points={form.points} />
          </div>
        </div>

        <DialogFooter className="flex-row gap-3 sm:justify-start pt-3 border-t border-white/[0.06] mt-2">
          <Button
            onClick={handleSubmit}
            className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold rounded-lg px-6 gap-2"
          >
            <Save className="h-4 w-4" />
            {isEdit ? 'حفظ التغييرات' : 'تسجيل'}
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

function DeleteBehaviorDialog({
  record,
  open,
  onOpenChange,
}: {
  record: BehaviorRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { deleteBehavior } = useAppStore();

  const handleDelete = useCallback(() => {
    if (record) {
      deleteBehavior(record.id);
      toast.success('تم حذف سجل السلوك بنجاح');
      onOpenChange(false);
    }
  }, [record, deleteBehavior, onOpenChange]);

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
          <AlertDialogTitle className="text-white text-lg">تأكيد حذف سجل السلوك</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground leading-relaxed">
            هل أنت متأكد من حذف سجل سلوك{' '}
            <span className="font-semibold text-slate-200">{record?.studentName}</span>
            {' '}({record?.category})؟
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
// Student Behavior Summary Widget
// ---------------------------------------------------------------------------

function StudentBehaviorSummary({ records }: { records: BehaviorRecord[] }) {
  const positiveByStudent = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    for (const r of records.filter((r) => r.type === 'positive')) {
      const key = r.studentId;
      if (!map.has(key)) {
        map.set(key, { name: r.studentName || 'غير معروف', total: 0, count: 0 });
      }
      const entry = map.get(key)!;
      entry.total += r.points;
      entry.count += 1;
    }
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [records]);

  const negativeByStudent = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    for (const r of records.filter((r) => r.type === 'negative')) {
      const key = r.studentId;
      if (!map.has(key)) {
        map.set(key, { name: r.studentName || 'غير معروف', total: 0, count: 0 });
      }
      const entry = map.get(key)!;
      entry.total += Math.abs(r.points);
      entry.count += 1;
    }
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [records]);

  const maxPositive = positiveByStudent.length > 0 ? positiveByStudent[0].total : 1;
  const maxNegative = negativeByStudent.length > 0 ? negativeByStudent[0].total : 1;

  if (positiveByStudent.length === 0 && negativeByStudent.length === 0) return null;

  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
        <Star className="h-4 w-4 text-[#D4A574]" />
        ملخص سلوك الطلاب
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Positive */}
        {positiveByStudent.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-emerald-400 mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              الأكثر إيجابية
            </h4>
            <div className="flex flex-col gap-2">
              {positiveByStudent.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-300 truncate">{s.name}</span>
                      <span className="text-xs font-bold text-emerald-400 tabular-nums">+{s.total}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500/50 transition-all duration-500"
                        style={{ width: `${Math.max(8, (s.total / maxPositive) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Negative */}
        {negativeByStudent.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-rose-400 mb-3 flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5" />
              الأكثر سلبية
            </h4>
            <div className="flex flex-col gap-2">
              {negativeByStudent.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-300 truncate">{s.name}</span>
                      <span className="text-xs font-bold text-rose-400 tabular-nums">-{s.total}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rose-500/50 transition-all duration-500"
                        style={{ width: `${Math.max(8, (s.total / maxNegative) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline View
// ---------------------------------------------------------------------------

function TimelineView({
  records,
  onView,
  onEdit,
  onDelete,
}: {
  records: BehaviorRecord[];
  onView: (record: BehaviorRecord) => void;
  onEdit: (record: BehaviorRecord) => void;
  onDelete: (record: BehaviorRecord) => void;
}) {
  // Group by date group
  const grouped = useMemo(() => {
    const groups: { label: string; records: BehaviorRecord[] }[] = [];
    const groupOrder = ['اليوم', 'أمس', 'هذا الأسبوع', 'أقدم'];
    const groupMap = new Map<string, BehaviorRecord[]>();

    for (const r of records) {
      const group = getDateGroup(r.date);
      if (!groupMap.has(group)) groupMap.set(group, []);
      groupMap.get(group)!.push(r);
    }

    for (const label of groupOrder) {
      const items = groupMap.get(label);
      if (items && items.length > 0) {
        groups.push({ label, records: items });
      }
    }

    return groups;
  }, [records]);

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6">
          <ShieldAlert className="h-10 w-10 text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">
          لا توجد سجلات سلوك
        </h3>
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
          ابدأ بتسجيل سلوكيات الطلاب لمتابعة أدائهم السلوكي
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {grouped.map((group) => (
        <div key={group.label}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-6 w-1 rounded-full bg-[#D4A574]" />
            <h3 className="text-sm font-semibold text-slate-300">{group.label}</h3>
            <Badge variant="outline" className="text-xs text-muted-foreground border-white/[0.08]">
              {group.records.length}
            </Badge>
          </div>

          <div className="flex flex-col gap-2 mr-3 border-r border-white/[0.06] pr-4">
            {group.records.map((record) => {
              const config = TYPE_CONFIG[record.type];
              const TypeIcon = config.icon;

              return (
                <div
                  key={record.id}
                  className="relative rounded-xl p-4 transition-all duration-200 group cursor-default hover:scale-[1.005]"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = `0 0 20px ${config.glowColor}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      'absolute -right-[21px] top-6 h-3 w-3 rounded-full border-2 border-[#121218]',
                      record.type === 'positive' ? 'bg-emerald-500' : 'bg-rose-500'
                    )}
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Student name + class badge */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-sm font-semibold text-slate-200">{record.studentName}</span>
                        {record.className && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground border-white/[0.08] px-1.5 py-0">
                            {record.className}
                          </Badge>
                        )}
                      </div>

                      {/* Category + severity + points row */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <CategoryBadge category={record.category} type={record.type} />
                        <SeverityDot severity={record.severity} />
                        <PointsBadge points={record.points} />
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground leading-relaxed mb-2">{record.description}</p>

                      {/* Action + time row */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
                        {record.action && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {record.action}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(record.date)}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => onView(record)}
                        className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-[#D4A574] hover:bg-[#D4A574]/10 transition-colors"
                        title="عرض"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEdit(record)}
                        className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        title="تعديل"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(record)}
                        className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center justify-center h-9 w-9 rounded-lg border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      {getPages().map((page, i) =>
        page === '...' ? (
          <span key={`dots-${i}`} className="h-9 w-9 flex items-center justify-center text-sm text-muted-foreground">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={cn(
              'flex items-center justify-center h-9 w-9 rounded-lg text-sm font-medium transition-all duration-200',
              currentPage === page
                ? 'bg-[#D4A574] text-slate-900 font-bold'
                : 'border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.05]'
            )}
          >
            {page}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center h-9 w-9 rounded-lg border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function BehaviorSection() {
  const { students, behaviors, setBehaviors } = useAppStore();

  // Local filter state
  const [localSearch, setLocalSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BehaviorRecord | null>(null);

  // Initialize mock data once
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && behaviors.length === 0) {
      initialized.current = true;
      const mock = generateMockBehaviors();
      requestAnimationFrame(() => setBehaviors(mock));
    }
  }, []);

  // Statistics
  const stats = useMemo(() => {
    const total = behaviors.length;
    const positive = behaviors.filter((b) => b.type === 'positive').length;
    const negative = behaviors.filter((b) => b.type === 'negative').length;
    const totalPoints = behaviors.reduce((sum, b) => sum + b.points, 0);
    return { total, positive, negative, totalPoints };
  }, [behaviors]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    let result = [...behaviors];

    if (localSearch.trim()) {
      const q = localSearch.trim().toLowerCase();
      result = result.filter((r) => r.studentName?.toLowerCase().includes(q));
    }
    if (typeFilter !== 'all') {
      result = result.filter((r) => r.type === typeFilter);
    }
    if (categoryFilter !== 'all') {
      result = result.filter((r) => r.category === categoryFilter);
    }
    if (severityFilter !== 'all') {
      result = result.filter((r) => r.severity === severityFilter);
    }
    if (classFilter !== 'all') {
      result = result.filter((r) => r.classId === classFilter);
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter((r) => new Date(r.date) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((r) => new Date(r.date) <= to);
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [behaviors, localSearch, typeFilter, categoryFilter, severityFilter, classFilter, dateFrom, dateTo]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ITEMS_PER_PAGE));
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Reset page when filters change
  useEffect(() => {
    requestAnimationFrame(() => setCurrentPage(1));
  }, [localSearch, typeFilter, categoryFilter, severityFilter, classFilter, dateFrom, dateTo]);

  // Handlers
  const handleView = useCallback((record: BehaviorRecord) => {
    setSelectedRecord(record);
    setViewOpen(true);
  }, []);

  const handleEdit = useCallback((record: BehaviorRecord) => {
    setSelectedRecord(record);
    setEditOpen(true);
  }, []);

  const handleDelete = useCallback((record: BehaviorRecord) => {
    setSelectedRecord(record);
    setDeleteOpen(true);
  }, []);

  const handleExport = useCallback(() => {
    if (filteredRecords.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }
    exportToCSV(filteredRecords);
  }, [filteredRecords]);

  const hasActiveFilters = typeFilter !== 'all' || categoryFilter !== 'all' || severityFilter !== 'all' || classFilter !== 'all' || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#D4A574]/10">
            <ShieldAlert className="h-5 w-5 text-[#D4A574]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">سلوك الطلاب</h1>
            <p className="text-xs text-muted-foreground">متابعة وتسجيل سلوكيات الطلاب</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold gap-2 rounded-lg px-4 btn-shine"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">تسجيل سلوك</span>
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-lg px-4 gap-2 btn-amber-glow"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">تصدير CSV</span>
          </Button>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? 'default' : 'outline'}
            className={cn(
              'rounded-lg px-4 gap-2',
              showFilters
                ? 'bg-[#D4A574]/20 text-[#D4A574] border border-[#D4A574]/30 hover:bg-[#D4A574]/30'
                : 'border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white'
            )}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">تصفية</span>
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={AlertTriangle}
          label="إجمالي الحوادث"
          value={stats.total}
          colorClass="text-[#D4A574]"
          bgColor="bg-[#D4A574]/10"
        />
        <StatCard
          icon={ThumbsUp}
          label="إيجابي"
          value={stats.positive}
          colorClass="text-emerald-400"
          bgColor="bg-emerald-500/10"
        />
        <StatCard
          icon={ThumbsDown}
          label="سلبي"
          value={stats.negative}
          colorClass="text-rose-400"
          bgColor="bg-rose-500/10"
        />
        <StatCard
          icon={Star}
          label="مجموع النقاط"
          value={stats.totalPoints > 0 ? `+${stats.totalPoints}` : stats.totalPoints}
          colorClass={stats.totalPoints >= 0 ? 'text-emerald-400' : 'text-rose-400'}
          bgColor={stats.totalPoints >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}
        />
      </div>

      {/* Search + Filter bar */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="البحث باسم الطالب..."
            className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 pr-10 rounded-lg h-10"
          />
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Type filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-slate-200 h-9">
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="positive">إيجابي</SelectItem>
                  <SelectItem value="negative">سلبي</SelectItem>
                </SelectContent>
              </Select>

              {/* Category filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-slate-200 h-9">
                  <SelectValue placeholder="الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  {ALL_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Severity filter */}
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-slate-200 h-9">
                  <SelectValue placeholder="الشدة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المستويات</SelectItem>
                  <SelectItem value="low">منخفض</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="high">مرتفع</SelectItem>
                </SelectContent>
              </Select>

              {/* Date from */}
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-white/[0.03] border-white/[0.08] text-slate-200 h-9 rounded-lg"
                placeholder="من تاريخ"
              />

              {/* Date to */}
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-white/[0.03] border-white/[0.08] text-slate-200 h-9 rounded-lg"
                placeholder="إلى تاريخ"
              />
            </div>

            {/* Active filters + clear */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                <span className="text-xs text-muted-foreground">فلاتر نشطة:</span>
                {typeFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs bg-[#D4A574]/10 text-[#D4A574] border-[#D4A574]/20 px-2 py-0.5 rounded-full cursor-pointer" onClick={() => setTypeFilter('all')}>
                    {typeFilter === 'positive' ? 'إيجابي' : 'سلبي'} ✕
                  </Badge>
                )}
                {categoryFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs bg-[#D4A574]/10 text-[#D4A574] border-[#D4A574]/20 px-2 py-0.5 rounded-full cursor-pointer" onClick={() => setCategoryFilter('all')}>
                    {categoryFilter} ✕
                  </Badge>
                )}
                {severityFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs bg-[#D4A574]/10 text-[#D4A574] border-[#D4A574]/20 px-2 py-0.5 rounded-full cursor-pointer" onClick={() => setSeverityFilter('all')}>
                    {SEVERITY_LABELS[severityFilter]} ✕
                  </Badge>
                )}
                {dateFrom && (
                  <Badge variant="outline" className="text-xs bg-[#D4A574]/10 text-[#D4A574] border-[#D4A574]/20 px-2 py-0.5 rounded-full cursor-pointer" onClick={() => setDateFrom('')}>
                    من: {dateFrom} ✕
                  </Badge>
                )}
                {dateTo && (
                  <Badge variant="outline" className="text-xs bg-[#D4A574]/10 text-[#D4A574] border-[#D4A574]/20 px-2 py-0.5 rounded-full cursor-pointer" onClick={() => setDateTo('')}>
                    إلى: {dateTo} ✕
                  </Badge>
                )}
                <button
                  onClick={() => {
                    setTypeFilter('all');
                    setCategoryFilter('all');
                    setSeverityFilter('all');
                    setClassFilter('all');
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 mr-auto transition-colors"
                >
                  مسح الكل
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results count */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {filteredRecords.length} سجل {hasActiveFilters ? '(بعد التصفية)' : ''}
          </span>
        </div>
      </div>

      {/* Content area: Timeline + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline - 2 columns */}
        <div className="lg:col-span-2">
          <TimelineView
            records={paginatedRecords}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Student Summary Widget - 1 column */}
        <div className="lg:col-span-1">
          <StudentBehaviorSummary records={behaviors} />
        </div>
      </div>

      {/* Dialogs */}
      <BehaviorFormDialog
        record={null}
        open={addOpen}
        onOpenChange={setAddOpen}
        students={students}
      />
      <BehaviorFormDialog
        record={selectedRecord}
        open={editOpen}
        onOpenChange={setEditOpen}
        students={students}
      />
      <ViewBehaviorDialog
        record={selectedRecord}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      <DeleteBehaviorDialog
        record={selectedRecord}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
