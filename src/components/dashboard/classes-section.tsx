'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  School,
  Users,
  UserCheck,
  MapPin,
  Pencil,
  Trash2,
  Plus,
  Search,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { ClassRoom } from '@/lib/types';
import { cn } from '@/lib/utils';

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

const MAX_STUDENTS_PER_CLASS = 35;

const GRADE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'جميع المراحل' },
  { value: 'الأول', label: 'الصف الأول' },
  { value: 'الثاني', label: 'الصف الثاني' },
  { value: 'الثالث', label: 'الصف الثالث' },
];

// ---------------------------------------------------------------------------
// Mock Data – 6 classes with Arabic names
// ---------------------------------------------------------------------------

const INITIAL_CLASSES: ClassRoom[] = [
  {
    id: 'cls-1',
    name: 'الصف الأول أ',
    grade: 'الأول',
    room: 'قاعة 101',
    notes: 'صف متقدم في القراءة والكتابة',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-09-01T08:00:00.000Z',
    studentCount: 28,
    teacherNames: ['محمد السالم', 'فاطمة الحربي', 'سارة المطيري'],
  },
  {
    id: 'cls-2',
    name: 'الصف الأول ب',
    grade: 'الأول',
    room: 'قاعة 102',
    notes: 'صف يحتاج دعم إضافي في الرياضيات',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-09-02T10:00:00.000Z',
    studentCount: 32,
    teacherNames: ['نورة القحطاني'],
  },
  {
    id: 'cls-3',
    name: 'الصف الثاني أ',
    grade: 'الثاني',
    room: 'قاعة 201',
    notes: 'صف متميز في الأنشطة العلمية',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-09-03T14:00:00.000Z',
    studentCount: 30,
    teacherNames: ['خالد الدوسري', 'سارة المطيري'],
  },
  {
    id: 'cls-4',
    name: 'الصف الثاني ب',
    grade: 'الثاني',
    room: 'قاعة 202',
    notes: 'صف منتظم ومتميز في السلوك',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-09-10T11:00:00.000Z',
    studentCount: 25,
    teacherNames: ['محمد السالم', 'عبدالرحمن الشمري', 'هند الزهراني'],
  },
  {
    id: 'cls-5',
    name: 'الصف الثالث أ',
    grade: 'الثالث',
    room: 'قاعة 301',
    notes: 'صف التفوق الأكاديمي',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-09-20T13:00:00.000Z',
    studentCount: 22,
    teacherNames: ['فاطمة الحربي', 'عبدالرحمن الشمري', 'هند الزهراني'],
  },
  {
    id: 'cls-6',
    name: 'الصف الثالث ب',
    grade: 'الثالث',
    room: 'قاعة 302',
    notes: 'صف تطبيقي في المشاريع البحثية',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-11-01T10:00:00.000Z',
    studentCount: 27,
    teacherNames: ['سلطان العتيبي'],
  },
];

// ---------------------------------------------------------------------------
// Helper: capacity color
// ---------------------------------------------------------------------------

function getCapacityColor(percentage: number): { bar: string; text: string } {
  if (percentage >= 90) {
    return { bar: 'bg-rose-500', text: 'text-rose-400' };
  }
  if (percentage >= 70) {
    return { bar: 'bg-amber-500', text: 'text-amber-400' };
  }
  return { bar: 'bg-emerald-500', text: 'text-emerald-400' };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Empty state */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6">
        <School className="h-10 w-10 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-300 mb-2">
        لا يوجد صفوف حالياً
      </h3>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
        ابدأ بإضافة صفوف دراسية جديدة إلى النظام لإدارة الطلاب والمعلمين
      </p>
      <Button
        onClick={onAdd}
        className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold gap-2 rounded-lg px-6"
      >
        <Plus className="h-4 w-4" />
        إضافة صف جديد
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Class Card
// ---------------------------------------------------------------------------

function ClassCard({
  cls,
  onEdit,
  onDelete,
}: {
  cls: ClassRoom;
  onEdit: (c: ClassRoom) => void;
  onDelete: (c: ClassRoom) => void;
}) {
  const studentCount = cls.studentCount ?? 0;
  const percentage = Math.min(100, Math.round((studentCount / MAX_STUDENTS_PER_CLASS) * 100));
  const capacityColor = getCapacityColor(percentage);

  return (
    <div
      className="group rounded-xl p-5 transition-all duration-200 hover:bg-white/[0.04]"
      style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Top row: icon + name + actions */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br from-[#D4A574]/20 to-[#D4A574]/5 shrink-0 border border-[#D4A574]/10">
            <School className="h-5 w-5 text-[#D4A574]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-100 truncate">
              {cls.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {cls.room}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(cls)}
            className="h-8 w-8 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg"
            title="تعديل"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(cls)}
            className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg"
            title="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grade badge */}
      <div className="mb-4">
        <Badge
          variant="outline"
          className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#D4A574]/10 text-[#D4A574] border-[#D4A574]/20"
        >
          {cls.grade}
        </Badge>
      </div>

      {/* Student count + capacity bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            عدد الطلاب
          </span>
          <span className={cn('text-xs font-semibold tabular-nums', capacityColor.text)}>
            {studentCount} / {MAX_STUDENTS_PER_CLASS}
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={cn('h-full rounded-full transition-all duration-500', capacityColor.bar)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Assigned teachers */}
      {cls.teacherNames && cls.teacherNames.length > 0 && (
        <div className="pt-3 border-t border-white/[0.05]">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-slate-500" />
            المعلمون المسندون
          </p>
          <div className="flex flex-wrap gap-1.5">
            {cls.teacherNames.slice(0, 3).map((teacher, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="text-[10px] font-medium px-2 py-0 rounded-full bg-sky-500/8 border-sky-500/15 text-sky-300"
              >
                {teacher}
              </Badge>
            ))}
            {cls.teacherNames.length > 3 && (
              <Badge
                variant="outline"
                className="text-[10px] font-medium px-2 py-0 rounded-full bg-white/[0.03] border-white/[0.08] text-slate-500"
              >
                +{cls.teacherNames.length - 3}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit form – inner content (mounts only when dialog is open)
// ---------------------------------------------------------------------------

function ClassFormContent({
  editingClass,
  onClose,
}: {
  editingClass: ClassRoom | null;
  onClose: () => void;
}) {
  const { addClass, updateClass } = useAppStore();
  const isEditing = !!editingClass;

  // Form state
  const [name, setName] = useState(editingClass?.name ?? '');
  const [grade, setGrade] = useState(editingClass?.grade ?? 'الأول');
  const [room, setRoom] = useState(editingClass?.room ?? '');
  const [notes, setNotes] = useState(editingClass?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !room.trim()) return;

    const now = new Date().toISOString();

    if (isEditing && editingClass) {
      updateClass(editingClass.id, {
        name: name.trim(),
        grade,
        room: room.trim(),
        notes: notes.trim(),
        updatedAt: now,
      });
    } else {
      const newClass: ClassRoom = {
        id: `cls-${Date.now()}`,
        name: name.trim(),
        grade,
        room: room.trim(),
        notes: notes.trim(),
        createdAt: now,
        updatedAt: now,
        studentCount: 0,
        teacherNames: [],
      };
      addClass(newClass);
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
      {/* Class name */}
      <div className="flex flex-col gap-2">
        <Label className="text-slate-300 text-sm">اسم الصف</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: الصف الأول أ"
          className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
          required
        />
      </div>

      {/* Grade & Room row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Grade dropdown */}
        <div className="flex flex-col gap-2">
          <Label className="text-slate-300 text-sm">المرحلة الدراسية</Label>
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20">
              <SelectValue placeholder="اختر المرحلة" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              <SelectItem value="الأول" className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                الصف الأول
              </SelectItem>
              <SelectItem value="الثاني" className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                الصف الثاني
              </SelectItem>
              <SelectItem value="الثالث" className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                الصف الثالث
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Room */}
        <div className="flex flex-col gap-2">
          <Label className="text-slate-300 text-sm">رقم القاعة</Label>
          <Input
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="مثال: قاعة 101"
            className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
            required
          />
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-2">
        <Label className="text-slate-300 text-sm">ملاحظات</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="أضف ملاحظات حول الصف الدراسي..."
          className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 min-h-[80px] resize-none"
        />
      </div>

      {/* Actions */}
      <DialogFooter className="flex-row gap-3 sm:justify-start pt-2">
        <Button
          type="submit"
          className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold rounded-lg px-6 gap-2"
        >
          {isEditing ? (
            <>
              <Pencil className="h-4 w-4" />
              حفظ التغييرات
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              إضافة الصف
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

/** Add / Edit class form dialog */
function ClassFormDialog({
  open,
  onOpenChange,
  editingClass,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingClass: ClassRoom | null;
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
            {editingClass ? 'تعديل بيانات الصف' : 'إضافة صف جديد'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {editingClass
              ? 'قم بتعديل بيانات الصف الدراسي ثم اضغط حفظ التغييرات'
              : 'أدخل بيانات الصف الدراسي الجديد لإضافته إلى النظام'}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ClassFormContent
            editingClass={editingClass}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Delete confirmation dialog */
function DeleteClassDialog({
  cls,
  open,
  onOpenChange,
}: {
  cls: ClassRoom | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { deleteClass } = useAppStore();

  const handleDelete = () => {
    if (cls) {
      deleteClass(cls.id);
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
            تأكيد حذف الصف
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground leading-relaxed">
            هل أنت متأكد من حذف الصف{' '}
            <span className="font-semibold text-slate-200">{cls?.name}</span>؟
            <br />
            لا يمكن التراجع عن هذا الإجراء. سيتم إلغاء ارتباط جميع الطلاب والمعلمين بهذا الصف.
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

export default function ClassesSection() {
  const { classes, setClasses } = useAppStore();

  // Local UI state
  const [localSearch, setLocalSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  // Initialize mock data once
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && classes.length === 0) {
      initialized.current = true;
      setClasses(INITIAL_CLASSES);
    }
  }, []);  

  // Filtered & searched list
  const filteredClasses = useMemo(() => {
    let result = [...classes];

    // Grade filter
    if (gradeFilter !== 'all') {
      result = result.filter((c) => c.grade === gradeFilter);
    }

    // Search filter
    if (localSearch.trim()) {
      const query = localSearch.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.grade.toLowerCase().includes(query) ||
          c.room.toLowerCase().includes(query)
      );
    }

    return result;
  }, [classes, gradeFilter, localSearch]);

  // Handlers
  const handleAdd = () => {
    setSelectedClass(null);
    setFormOpen(true);
  };

  const handleEdit = (cls: ClassRoom) => {
    setSelectedClass(cls);
    setFormOpen(true);
  };

  const handleDelete = (cls: ClassRoom) => {
    setSelectedClass(cls);
    setDeleteOpen(true);
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* ── Page Title ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#D4A574]/10">
            <School className="h-5 w-5 text-[#D4A574]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl flex items-center gap-3">
              إدارة الصفوف
              <Badge className="bg-[#D4A574]/15 text-[#D4A574] border-[#D4A574]/20 hover:bg-[#D4A574]/20 text-sm px-2.5 py-0.5 rounded-full font-semibold tabular-nums">
                {classes.length}
              </Badge>
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              إدارة الصفوف الدراسية وتوزيع الطلاب والمعلمين
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
        {/* Add button */}
        <Button
          onClick={handleAdd}
          className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold gap-2 rounded-lg px-5 h-10"
        >
          <Plus className="h-4 w-4" />
          إضافة صف جديد
        </Button>

        {/* Search & Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
            <Input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="بحث بالاسم أو المرحلة أو القاعة..."
              className="pr-10 w-full sm:w-72 bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 h-10"
            />
          </div>

          {/* Filter dropdown */}
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              {GRADE_FILTER_OPTIONS.map((opt) => (
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
        </div>
      </div>

      {/* ── Classes Card Grid ── */}
      {filteredClasses.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Dialogs ── */}
      <ClassFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingClass={selectedClass}
      />

      <DeleteClassDialog
        cls={selectedClass}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
