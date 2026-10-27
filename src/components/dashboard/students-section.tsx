'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  UserPlus,
  Pencil,
  Trash2,
  Eye,
  Search,
  GraduationCap,
  Users,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Download,
  Upload,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import type { Student } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { exportToCSV, formatCsvDate } from '@/lib/csv-export';
import { STUDENT_IMPORT_COLUMNS } from '@/lib/csv-import';
import ImportDialog from '@/components/dashboard/import-dialog';
import StudentProfile from '@/components/dashboard/student-profile';

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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ITEMS_PER_PAGE = 10;

type SortField = 'name' | 'studentId' | 'className' | 'status' | 'notes';
type SortDir = 'asc' | 'desc';

const STATUS_MAP: Record<Student['status'], { label: string; className: string }> = {
  active: {
    label: 'نشط',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
  },
  inactive: {
    label: 'غير نشط',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
  },
  graduated: {
    label: 'متخرج',
    className: 'bg-sky-500/15 text-sky-400 border-sky-500/20 hover:bg-sky-500/20',
  },
};

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'active', label: 'نشط' },
  { value: 'inactive', label: 'غير نشط' },
  { value: 'graduated', label: 'متخرج' },
];

const CLASS_OPTIONS = [
  { value: 'class-1', label: 'الصف الأول - أ' },
  { value: 'class-2', label: 'الصف الأول - ب' },
  { value: 'class-3', label: 'الصف الثاني - أ' },
  { value: 'class-4', label: 'الصف الثاني - ب' },
  { value: 'class-5', label: 'الصف الثالث - أ' },
  { value: 'class-6', label: 'الصف الثالث - ب' },
];

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-001',
    name: 'أحمد محمد علي',
    studentId: 'STU-2401',
    classId: 'class-1',
    status: 'active',
    notes: 'طالب متفوق في الرياضيات',
    psychBackground: 'متوازن نفسياً، يتمتع بذكاء اجتماعي عالي',
    avatar: '',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-09-01T08:00:00.000Z',
  },
  {
    id: 'std-002',
    name: 'فاطمة أحمد حسن',
    studentId: 'STU-2402',
    classId: 'class-2',
    status: 'active',
    notes: 'مشاركة نشطة في الأنشطة المدرسية',
    psychBackground: 'هادئة ومركزة، تحتاج تشجيع إضافي في العروض',
    avatar: '',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-09-02T10:00:00.000Z',
  },
  {
    id: 'std-003',
    name: 'عبدالله خالد العتيبي',
    studentId: 'STU-2403',
    classId: 'class-3',
    status: 'active',
    notes: 'قائد فريق المنافسات العلمية',
    psychBackground: 'مبادر وقيادي، يحتاج تنمية مهارات الاستماع',
    avatar: '',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-09-03T14:00:00.000Z',
  },
  {
    id: 'std-004',
    name: 'نورة سعيد القحطاني',
    studentId: 'STU-2404',
    classId: 'class-1',
    status: 'inactive',
    notes: 'متغيب بسبب ظروف عائلية',
    psychBackground: 'حساسة، تحتاج دعم نفسي مستمر',
    avatar: '',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-10-15T09:00:00.000Z',
  },
  {
    id: 'std-005',
    name: 'محمد عبدالرحمن الدوسري',
    studentId: 'STU-2405',
    classId: 'class-5',
    status: 'active',
    notes: 'موهوب في الرسم والتصميم',
    psychBackground: 'إبداعي، يميل للعزلة أحياناً',
    avatar: '',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-09-10T11:00:00.000Z',
  },
  {
    id: 'std-006',
    name: 'ريم فهد المطيري',
    studentId: 'STU-2406',
    classId: 'class-4',
    status: 'graduated',
    notes: 'تخرجت بتقدير ممتاز',
    psychBackground: 'طموحة ومثابرة',
    avatar: '',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-06-01T08:00:00.000Z',
  },
  {
    id: 'std-007',
    name: 'سلطان فيصل الشمري',
    studentId: 'STU-2407',
    classId: 'class-3',
    status: 'active',
    notes: 'مشارك في برنامج القراءة الحرة',
    psychBackground: 'اجتماعي ومحب للتعلم',
    avatar: '',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-09-05T08:00:00.000Z',
  },
  {
    id: 'std-008',
    name: 'لطيفة عايض الحربي',
    studentId: 'STU-2408',
    classId: 'class-6',
    status: 'active',
    notes: 'أفضل طالبة في مادة العلوم',
    psychBackground: 'واثقة من نفسها، تحتاج تحديات إضافية',
    avatar: '',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-09-20T13:00:00.000Z',
  },
  {
    id: 'std-009',
    name: 'يزيد ناصر البقمي',
    studentId: 'STU-2409',
    classId: 'class-2',
    status: 'inactive',
    notes: 'محال للعلاج الطبي',
    psychBackground: 'يحتاج متابعة خاصة بعد العودة',
    avatar: '',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-11-01T10:00:00.000Z',
  },
  {
    id: 'std-010',
    name: 'سارة ماجد العنزي',
    studentId: 'STU-2410',
    classId: 'class-5',
    status: 'active',
    notes: 'رئيسة نادي البيئة المدرسي',
    psychBackground: 'قيادية ومسؤولة',
    avatar: '',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-09-15T08:00:00.000Z',
  },
  {
    id: 'std-011',
    name: 'عمر إبراهيم الزهراني',
    studentId: 'STU-2411',
    classId: 'class-4',
    status: 'active',
    notes: 'متفوق في اللغة الإنجليزية',
    psychBackground: 'منفتح ومحب للحوار',
    avatar: '',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-09-18T15:00:00.000Z',
  },
  {
    id: 'std-012',
    name: 'هند تركي السبيعي',
    studentId: 'STU-2412',
    classId: 'class-6',
    status: 'graduated',
    notes: 'تخرجت بمرتبة الشرف',
    psychBackground: 'مستقرة وناجحة أكاديمياً',
    avatar: '',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-06-01T08:00:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Helper: get class name
// ---------------------------------------------------------------------------

function getClassName(classId: string | null): string {
  if (!classId) return '—';
  const found = CLASS_OPTIONS.find((c) => c.value === classId);
  return found ? found.label : '—';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Status badge with colored dot + text */
function StatusBadge({ status }: { status: Student['status'] }) {
  const config = STATUS_MAP[status];
  const dotColor = status === 'active' ? '#34d399' : status === 'inactive' ? '#fbbf24' : '#38bdf8';
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: dotColor, boxShadow: `0 0 6px ${dotColor}40` }}
      />
      <Badge
        variant="outline"
        className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full', config.className)}
      >
        {config.label}
      </Badge>
    </span>
  );
}

/** Empty state */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  const locale = useAppStore((s) => s.locale);
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6">
        <Users className="h-10 w-10 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-300 mb-2">
        لا يوجد طلاب حالياً
      </h3>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
        ابدأ بإضافة طلاب جدد إلى النظام لإدارة بياناتهم ومتابعة تقدمهم الأكاديمي
      </p>
      <Button
        onClick={onAdd}
        className="bg-emerald-500/90 hover:bg-emerald-500 text-white border-transparent font-semibold gap-2 rounded-lg px-6"
      >
        <UserPlus className="h-4 w-4" />
        {t('crud.addStudent', locale)}
      </Button>
    </div>
  );
}

/** Student view dialog */
function ViewStudentDialog({
  student,
  open,
  onOpenChange,
}: {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!student) return null;

  const fields = [
    { label: 'الاسم الكامل', value: student.name, icon: Users },
    { label: 'الرقم التعريفي', value: student.studentId, icon: BookOpen },
    { label: 'الفصل', value: getClassName(student.classId), icon: GraduationCap },
    {
      label: 'الحالة',
      value: STATUS_MAP[student.status].label,
      icon: Eye,
      badge: true,
      status: student.status,
    },
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
          <DialogTitle className="text-white text-xl">
            بيانات الطالب
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            عرض تفاصيل بيانات الطالب والتاريخ الأكاديمي
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Info fields */}
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="grid grid-cols-1 gap-4">
              {fields.map((field) => (
                <div key={field.label} className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                      <field.icon className="h-4 w-4 text-[#D4A574]" />
                    </div>
                    <span className="text-sm text-muted-foreground">{field.label}</span>
                  </div>
                  {field.badge ? (
                    <StatusBadge status={field.status as Student['status']} />
                  ) : (
                    <span className="text-sm font-medium text-slate-200">{field.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {student.notes && (
            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <h4 className="text-sm font-semibold text-slate-300 mb-2">ملاحظات</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{student.notes}</p>
            </div>
          )}

          {/* Psychological background */}
          {student.psychBackground && (
            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <h4 className="text-sm font-semibold text-slate-300 mb-2">الخلفية النفسية</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{student.psychBackground}</p>
            </div>
          )}

          {/* Dates */}
          <div className="flex items-center gap-6 text-xs text-muted-foreground/60">
            <span>تاريخ التسجيل: {new Date(student.createdAt).toLocaleDateString('ar-SA')}</span>
            <span>آخر تحديث: {new Date(student.updatedAt).toLocaleDateString('ar-SA')}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit form – inner content (mounts only when dialog is open)
// ---------------------------------------------------------------------------

function StudentFormContent({
  editingStudent,
  onClose,
}: {
  editingStudent: Student | null;
  onClose: () => void;
}) {
  const { addStudent, updateStudent, locale } = useAppStore();
  const isEditing = !!editingStudent;

  // Form state – initialised from props on mount
  const [name, setName] = useState(editingStudent?.name ?? '');
  const [studentId, setStudentId] = useState(editingStudent?.studentId ?? '');
  const [classId, setClassId] = useState<string>(editingStudent?.classId ?? 'class-1');
  const [status, setStatus] = useState<Student['status']>(editingStudent?.status ?? 'active');
  const [notes, setNotes] = useState(editingStudent?.notes ?? '');
  const [psychBackground, setPsychBackground] = useState(editingStudent?.psychBackground ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !studentId.trim()) return;

    const now = new Date().toISOString();

    if (isEditing && editingStudent) {
      updateStudent(editingStudent.id, {
        name: name.trim(),
        studentId: studentId.trim(),
        classId,
        status,
        notes: notes.trim(),
        psychBackground: psychBackground.trim(),
        updatedAt: now,
      });
      toast.success('تم تحديث بيانات الطالب');
    } else {
      const newStudent: Student = {
        id: `std-${Date.now()}`,
        name: name.trim(),
        studentId: studentId.trim(),
        classId,
        status,
        notes: notes.trim(),
        psychBackground: psychBackground.trim(),
        avatar: '',
        createdAt: now,
        updatedAt: now,
      };
      addStudent(newStudent);
      toast.success('تم إضافة الطالب بنجاح');
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
      {/* Name */}
      <div className="flex flex-col gap-2">
        <Label className="text-slate-300 text-sm">اسم الطالب الكامل</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: أحمد محمد علي"
          className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
          required
        />
      </div>

      {/* Student ID */}
      <div className="flex flex-col gap-2">
        <Label className="text-slate-300 text-sm">الرقم التعريفي</Label>
        <Input
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="مثال: STU-2413"
          className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
          dir="ltr"
          required
        />
      </div>

      {/* Class & Status row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Class dropdown */}
        <div className="flex flex-col gap-2">
          <Label className="text-slate-300 text-sm">الفصل</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20">
              <SelectValue placeholder="اختر الفصل" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              {CLASS_OPTIONS.map((cls) => (
                <SelectItem key={cls.value} value={cls.value} className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                  {cls.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status dropdown */}
        <div className="flex flex-col gap-2">
          <Label className="text-slate-300 text-sm">الحالة</Label>
          <Select
            value={status}
            onValueChange={(val) => setStatus(val as Student['status'])}
          >
            <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20">
              <SelectValue placeholder="اختر الحالة" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              <SelectItem value="active" className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                نشط
              </SelectItem>
              <SelectItem value="inactive" className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                غير نشط
              </SelectItem>
              <SelectItem value="graduated" className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                متخرج
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-2">
        <Label className="text-slate-300 text-sm">ملاحظات</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="أضف ملاحظات حول الطالب..."
          className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 min-h-[80px] resize-none"
        />
      </div>

      {/* Psychological background */}
      <div className="flex flex-col gap-2">
        <Label className="text-slate-300 text-sm">الخلفية النفسية</Label>
        <Textarea
          value={psychBackground}
          onChange={(e) => setPsychBackground(e.target.value)}
          placeholder="أضف معلومات عن الخلفية النفسية للطالب..."
          className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 min-h-[80px] resize-none"
        />
      </div>

      {/* Actions */}
      <DialogFooter className="flex-row gap-3 sm:justify-start pt-2">
        <Button
          type="submit"
          className="bg-emerald-500/90 hover:bg-emerald-500 text-white border-transparent font-semibold rounded-lg px-6 gap-2"
        >
          {isEditing ? (
            <>
              <Pencil className="h-4 w-4" />
              {t('general.save', locale)}
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              {t('general.add', locale)}
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-lg px-6"
        >
          {t('general.cancel', locale)}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Add / Edit student form dialog – conditionally mounts form to avoid stale state */
function StudentFormDialog({
  open,
  onOpenChange,
  editingStudent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingStudent: Student | null;
}) {
  const locale = useAppStore((s) => s.locale);
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
            {editingStudent ? t('crud.editStudent', locale) : t('crud.addStudent', locale)}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {editingStudent
              ? 'قم بتعديل بيانات الطالب المطلوبة ثم اضغط حفظ التغييرات'
              : 'أدخل بيانات الطالب الجديد لإضافته إلى النظام'}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <StudentFormContent
            editingStudent={editingStudent}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Delete confirmation dialog */
function DeleteStudentDialog({
  student,
  open,
  onOpenChange,
}: {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { deleteStudent, addToTrash, locale } = useAppStore();

  const handleDelete = () => {
    if (student) {
      addToTrash({
        id: `trash-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        itemType: 'student',
        itemId: student.id,
        itemName: student.name,
        deletedBy: 'المدير',
        dataJson: JSON.stringify(student),
        restoredAt: null,
        createdAt: new Date().toISOString(),
      });
      deleteStudent(student.id);
      toast.success('تم حذف الطالب');
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
            {t('general.confirmDelete', locale)}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground leading-relaxed">
            {t('general.deleteWarning', locale)}
            <br />
            <span className="font-semibold text-slate-200">{student?.name}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-3 sm:justify-start mt-2">
          <AlertDialogCancel
            className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-lg px-6 mt-0"
          >
            {t('general.cancel', locale)}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg px-6 gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {t('general.delete', locale)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/** Avatar initials circle */
function AvatarInitials({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map(w => w.charAt(0)).join('');
  return (
    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br from-[#D4A574]/25 to-[#D4A574]/8 shrink-0 border border-[#D4A574]/15">
      <span className="text-sm font-bold text-[#D4A574]">{initials}</span>
    </div>
  );
}

/** Sortable column header */
function SortableHeader({ label, field, sortField, sortDir, onSort }: { label: string; field: SortField; sortField: SortField; sortDir: SortDir; onSort: (f: SortField) => void }) {
  const isActive = sortField === field;
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-slate-400 font-semibold text-xs uppercase tracking-wider hover:text-[#D4A574] transition-colors"
    >
      {label}
      {isActive ? (
        sortDir === 'asc' ? <ArrowUp className="h-3 w-3 text-[#D4A574]" /> : <ArrowDown className="h-3 w-3 text-[#D4A574]" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-30" />
      )}
    </button>
  );
}

export default function StudentsSection() {
  const { students, setStudents, addStudent, locale } = useAppStore();

  // Local UI state
  const [localSearch, setLocalSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetStudent, setSheetStudent] = useState<Student | null>(null);

  // Initialize mock data once
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && students.length === 0) {
      initialized.current = true;
      setStudents(INITIAL_STUDENTS);
    }
  }, []);  

  // Sort handler
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }, [sortField]);

  // Filtered, searched & sorted list
  const filteredStudents = useMemo(() => {
    let result = [...students];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }

    // Search filter
    if (localSearch.trim()) {
      const query = localSearch.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.studentId.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name, 'ar'); break;
        case 'studentId': cmp = a.studentId.localeCompare(b.studentId); break;
        case 'className': cmp = getClassName(a.classId).localeCompare(getClassName(b.classId), 'ar'); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
        case 'notes': cmp = (a.notes || '').localeCompare(b.notes || '', 'ar'); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [students, statusFilter, localSearch, sortField, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Handlers
  const handleAdd = () => {
    setSelectedStudent(null);
    setFormOpen(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setFormOpen(true);
  };

  const handleView = (student: Student) => {
    setSelectedStudent(student);
    setViewOpen(true);
  };

  const handleRowClick = (student: Student) => {
    setSheetStudent(student);
    setSheetOpen(true);
  };

  const handleCloseProfile = useCallback(() => {
    setViewOpen(false);
    setSelectedStudent(null);
  }, []);

  const handleDelete = (student: Student) => {
    setSelectedStudent(student);
    setDeleteOpen(true);
  };

  const handleImportStudents = (data: Record<string, unknown>[]) => {
    const now = new Date().toISOString();
    data.forEach((row) => {
      const newStudent: Student = {
        id: `std-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: String(row.name ?? ''),
        studentId: String(row.studentId ?? ''),
        classId: String(row.classId ?? '') || null,
        status: (row.status as Student['status']) ?? 'active',
        notes: String(row.notes ?? ''),
        psychBackground: String(row.psychBackground ?? ''),
        avatar: '',
        createdAt: now,
        updatedAt: now,
      };
      addStudent(newStudent);
    });
  };

  const handleExportStudents = () => {
    const exportData = students.map((s) => ({
      name: s.name,
      studentId: s.studentId,
      classId: getClassName(s.classId),
      status: STATUS_MAP[s.status].label,
      notes: s.notes || '',
      createdAt: formatCsvDate(s.createdAt),
    }));
    exportToCSV(exportData, 'students', [
      { key: 'name', label: 'الاسم' },
      { key: 'studentId', label: 'الرقم التعريفي' },
      { key: 'classId', label: 'الفصل' },
      { key: 'status', label: 'الحالة' },
      { key: 'notes', label: 'الملاحظات' },
      { key: 'createdAt', label: 'تاريخ التسجيل' },
    ]);
    toast.success('تم تصدير بيانات الطلاب بنجاح');
  };

  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  };

  return (
    <div className="flex flex-col gap-6 hover-glow-amber" dir="rtl">
      {/* ── Page Title ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#D4A574]/10">
            <Users className="h-5 w-5 text-[#D4A574]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl flex items-center gap-3">
              {t('sections.students', locale)}
              <Badge className="bg-[#D4A574]/15 text-[#D4A574] border-[#D4A574]/20 hover:bg-[#D4A574]/20 text-sm px-2.5 py-0.5 rounded-full font-semibold tabular-nums">
                {students.length}
              </Badge>
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t('sections.studentsSub', locale)}
            </p>
          </div>
        </div>
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
            className="bg-emerald-500/90 hover:bg-emerald-500 text-white border-transparent font-semibold gap-2 rounded-lg px-5 h-10 btn-shine"
          >
            <UserPlus className="h-4 w-4" />
            {t('crud.addStudent', locale)}
          </Button>
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
            className="border-[#D4A574]/30 text-[#D4A574] hover:bg-[#D4A574]/10 gap-2 rounded-lg px-4 h-10"
          >
            <Upload className="h-4 w-4" />
            استيراد CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleExportStudents}
            className="border-[#D4A574]/30 text-[#D4A574] hover:bg-[#D4A574]/10 gap-2 rounded-lg px-4 h-10 btn-amber-glow"
          >
            <Download className="h-4 w-4" />
            تصدير CSV
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
            <Input
              value={localSearch}
              onChange={(e) => { setLocalSearch(e.target.value); setCurrentPage(1); }}
              placeholder={t('general.search', locale)}
              className="pr-10 w-full sm:w-72 bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 h-10"
            />
          </div>

          {/* Filter dropdown */}
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-36 bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              {FILTER_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-slate-200 focus:bg-white/[0.05] focus:text-white"
                >
                  {opt.value === 'all' ? t('general.all', locale) : opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Students Table ── */}
      {filteredStudents.length === 0 ? (
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
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
                <TableHead className="py-3.5 px-4">
                  <SortableHeader label={t('general.name', locale)} field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </TableHead>
                <TableHead className="py-3.5 px-4">
                  <SortableHeader label="الرقم التعريفي" field="studentId" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </TableHead>
                <TableHead className="py-3.5 px-4 hidden md:table-cell">
                  <SortableHeader label="الفصل" field="className" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </TableHead>
                <TableHead className="py-3.5 px-4">
                  <SortableHeader label={t('general.status', locale)} field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </TableHead>
                <TableHead className="py-3.5 px-4 hidden lg:table-cell">
                  <SortableHeader label="الملاحظات" field="notes" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </TableHead>
                <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-3.5 px-4 text-center">
                  {t('general.actions', locale)}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map((student, index) => (
                <TableRow
                  key={student.id}
                  className={cn(
                    'border-b border-white/[0.04] transition-all duration-200 cursor-pointer',
                    'hover:bg-[#D4A574]/5',
                    index % 2 === 1 ? 'bg-white/[0.015]' : 'bg-transparent',
                  )}
                  onClick={() => handleRowClick(student)}
                >
                  {/* Name */}
                  <TableCell className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <AvatarInitials name={student.name} />
                      <span className="text-sm font-medium text-slate-200 truncate max-w-[160px]">
                        {student.name}
                      </span>
                    </div>
                  </TableCell>

                  {/* Student ID */}
                  <TableCell className="py-3.5 px-4">
                    <span className="text-sm text-muted-foreground font-mono tabular-nums" dir="ltr">
                      {student.studentId}
                    </span>
                  </TableCell>

                  {/* Class */}
                  <TableCell className="py-3.5 px-4 hidden md:table-cell">
                    <span className="text-sm text-slate-300">
                      {getClassName(student.classId)}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3.5 px-4">
                    <StatusBadge status={student.status} />
                  </TableCell>

                  {/* Notes */}
                  <TableCell className="py-3.5 px-4 hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground truncate block max-w-[200px]">
                      {student.notes || '—'}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3.5 px-4">
                    <div className="flex items-center justify-center gap-1">
                      {/* View */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); handleView(student); }}
                        className="h-8 w-8 text-slate-300 hover:bg-white/5 rounded-lg"
                        title={t('general.view', locale)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Edit */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); handleEdit(student); }}
                        className="h-8 w-8 text-[#D4A574] hover:bg-[#D4A574]/10 rounded-lg"
                        title={t('general.edit', locale)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); handleDelete(student); }}
                        className="h-8 w-8 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                        title={t('general.delete', locale)}
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
              {/* Info */}
              <div className="text-xs text-muted-foreground/60">
                عرض{' '}
                <span className="font-semibold text-slate-300 tabular-nums">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>
                {' '}-{' '}
                <span className="font-semibold text-slate-300 tabular-nums">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)}
                </span>
                {' '}من{' '}
                <span className="font-semibold text-slate-300 tabular-nums">
                  {filteredStudents.length}
                </span>
                {' '}طالب
              </div>

              {/* Page controls */}
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

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                ))}

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
        </div>
      )}

      {/* ── Student Quick View Sheet ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="left"
          dir="rtl"
          className="bg-[#1A1A24] border-r border-white/[0.06] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="text-white text-lg">الملف السريع للطالب</SheetTitle>
            <SheetDescription className="text-muted-foreground text-sm">نظرة سريعة على بيانات الطالب</SheetDescription>
          </SheetHeader>
          {sheetStudent && (
            <div className="flex flex-col gap-5 px-4 pb-6">
              {/* Avatar + Name */}
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-[#D4A574]/30 to-[#D4A574]/10 border-2 border-[#D4A574]/20 shrink-0">
                  <span className="text-2xl font-bold text-[#D4A574]">
                    {sheetStudent.name.split(' ').slice(0, 2).map(w => w.charAt(0)).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{sheetStudent.name}</h3>
                  <p className="text-sm text-muted-foreground font-mono" dir="ltr">{sheetStudent.studentId}</p>
                </div>
              </div>

              {/* Class + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] text-muted-foreground mb-1">الفصل</p>
                  <p className="text-sm font-semibold text-slate-200">{getClassName(sheetStudent.classId)}</p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] text-muted-foreground mb-1">الحالة</p>
                  <StatusBadge status={sheetStudent.status} />
                </div>
              </div>

              {/* Grades summary (mock) */}
              <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h4 className="text-sm font-semibold text-slate-300 mb-3">ملخص الدرجات</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xl font-bold text-[#D4A574]">87%</p>
                    <p className="text-[10px] text-muted-foreground">المعدل</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-emerald-400">92</p>
                    <p className="text-[10px] text-muted-foreground">أعلى درجة</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-sky-400">5</p>
                    <p className="text-[10px] text-muted-foreground">مواد</p>
                  </div>
                </div>
              </div>

              {/* Recent attendance (mock) */}
              <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h4 className="text-sm font-semibold text-slate-300 mb-3">الحضور الأخير</h4>
                <div className="flex gap-1.5">
                  {['ح', 'ح', 'ح', 'غ', 'ح', 'ح', 'م', 'ح', 'ح', 'ح', 'ح', 'ح', 'م', 'ح'].map((d, i) => (
                    <span
                      key={i}
                      className={cn(
                        'inline-flex items-center justify-center h-6 w-6 rounded text-[10px] font-bold',
                        d === 'ح' ? 'bg-emerald-500/15 text-emerald-400' :
                        d === 'غ' ? 'bg-rose-500/15 text-rose-400' :
                        'bg-amber-500/15 text-amber-400'
                      )}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {sheetStudent.notes && (
                <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h4 className="text-sm font-semibold text-slate-300 mb-2">ملاحظات</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{sheetStudent.notes}</p>
                </div>
              )}

              {/* Quick action buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => { setSheetOpen(false); handleEdit(sheetStudent); }}
                  className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold gap-2 rounded-lg w-full"
                >
                  <Pencil className="h-4 w-4" />
                  تعديل البيانات
                </Button>
                <Button
                  variant="outline"
                  className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white gap-2 rounded-lg w-full"
                >
                  <MessageSquare className="h-4 w-4" />
                  إرسال رسالة
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setSheetOpen(false); handleView(sheetStudent); }}
                  className="border-[#D4A574]/30 text-[#D4A574] hover:bg-[#D4A574]/10 gap-2 rounded-lg w-full"
                >
                  <Eye className="h-4 w-4" />
                  عرض الملف الكامل
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Dialogs ── */}
      <StudentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingStudent={selectedStudent}
      />

      {/* Student Profile Dialog (replaces simple ViewStudentDialog) */}
      {viewOpen && selectedStudent && (
        <StudentProfile
          student={selectedStudent}
          onClose={handleCloseProfile}
        />
      )}

      <DeleteStudentDialog
        student={selectedStudent}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        type="students"
        columns={STUDENT_IMPORT_COLUMNS}
        onImport={handleImportStudents}
        templateFilename="students-template"
      />
    </div>
  );
}
