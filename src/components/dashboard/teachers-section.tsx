'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  UserPlus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  BookOpen,
  Search,
  Users,
  Download,
  Upload,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { Teacher } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/csv-export';
import { TEACHER_IMPORT_COLUMNS } from '@/lib/csv-import';
import ImportDialog from '@/components/dashboard/import-dialog';

// shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

const STATUS_MAP: Record<Teacher['status'], { label: string; className: string }> = {
  active: {
    label: 'نشط',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
  },
  inactive: {
    label: 'غير نشط',
    className: 'bg-rose-500/15 text-rose-400 border-rose-500/20 hover:bg-rose-500/20',
  },
};

const PERMISSION_MAP: Record<Teacher['permissions'], { label: string; className: string }> = {
  admin: {
    label: 'مدير',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  },
  teacher: {
    label: 'معلم',
    className: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  },
  supervisor: {
    label: 'مشرف',
    className: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  },
};

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'active', label: 'نشط' },
  { value: 'inactive', label: 'غير نشط' },
];

const PERMISSION_OPTIONS: { value: Teacher['permissions']; label: string }[] = [
  { value: 'admin', label: 'مدير' },
  { value: 'teacher', label: 'معلم' },
  { value: 'supervisor', label: 'مشرف' },
];

// ---------------------------------------------------------------------------
// Mock Data – 8 Arabic teacher names
// ---------------------------------------------------------------------------

const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'tch-001',
    name: 'محمد بن عبدالله السالم',
    subject: 'الرياضيات',
    status: 'active',
    permissions: 'teacher',
    avatar: '',
    email: 'm.salem@auralab.edu',
    phone: '0501234567',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-09-01T08:00:00.000Z',
    classNames: ['الصف الأول أ', 'الصف الثاني ب'],
  },
  {
    id: 'tch-002',
    name: 'فاطمة علي الحربي',
    subject: 'اللغة العربية',
    status: 'active',
    permissions: 'supervisor',
    avatar: '',
    email: 'f.harbi@auralab.edu',
    phone: '0502345678',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-09-02T10:00:00.000Z',
    classNames: ['الصف الأول أ', 'الصف الثالث أ'],
  },
  {
    id: 'tch-003',
    name: 'خالد إبراهيم الدوسري',
    subject: 'العلوم',
    status: 'active',
    permissions: 'teacher',
    avatar: '',
    email: 'k.dosari@auralab.edu',
    phone: '0503456789',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-09-03T14:00:00.000Z',
    classNames: ['الصف الثاني أ'],
  },
  {
    id: 'tch-004',
    name: 'نورة سعد القحطاني',
    subject: 'اللغة الإنجليزية',
    status: 'inactive',
    permissions: 'teacher',
    avatar: '',
    email: 'n.qahtani@auralab.edu',
    phone: '0504567890',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-10-15T09:00:00.000Z',
    classNames: ['الصف الأول ب'],
  },
  {
    id: 'tch-005',
    name: 'عبدالرحمن يوسف الشمري',
    subject: 'التربية الإسلامية',
    status: 'active',
    permissions: 'admin',
    avatar: '',
    email: 'a.shamri@auralab.edu',
    phone: '0505678901',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-09-10T11:00:00.000Z',
    classNames: ['الصف الثاني ب', 'الصف الثالث أ', 'الصف الثالث ب'],
  },
  {
    id: 'tch-006',
    name: 'سارة ماجد المطيري',
    subject: 'التربية الفنية',
    status: 'active',
    permissions: 'teacher',
    avatar: '',
    email: 's.mutairi@auralab.edu',
    phone: '0506789012',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-09-20T13:00:00.000Z',
    classNames: ['الصف الأول أ', 'الصف الثاني أ'],
  },
  {
    id: 'tch-007',
    name: 'سلطان فهد العتيبي',
    subject: 'الفيزياء',
    status: 'inactive',
    permissions: 'supervisor',
    avatar: '',
    email: 's.otaibi@auralab.edu',
    phone: '0507890123',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-11-01T10:00:00.000Z',
    classNames: ['الصف الثالث ب'],
  },
  {
    id: 'tch-008',
    name: 'هند تركي الزهراني',
    subject: 'الرياضيات',
    status: 'active',
    permissions: 'teacher',
    avatar: '',
    email: 'h.zahrani@auralab.edu',
    phone: '0508901234',
    createdAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-09-15T08:00:00.000Z',
    classNames: ['الصف الثاني ب', 'الصف الثالث أ'],
  },
];

// ---------------------------------------------------------------------------
// Helper: initials from Arabic name
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return parts[0].charAt(0) + parts[1].charAt(0);
  }
  return name.charAt(0);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Status badge */
function TeacherStatusBadge({ status }: { status: Teacher['status'] }) {
  const config = STATUS_MAP[status];
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full', config.className)}
    >
      <span
        className={cn('inline-block h-1.5 w-1.5 rounded-full', {
          'bg-emerald-400': status === 'active',
          'bg-rose-400': status === 'inactive',
        })}
      />
      {config.label}
    </Badge>
  );
}

/** Permission badge */
function PermissionBadge({ permissions }: { permissions: Teacher['permissions'] }) {
  const config = PERMISSION_MAP[permissions];
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium px-2 py-0.5 rounded-full', config.className)}
    >
      {config.label}
    </Badge>
  );
}

/** Empty state */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6">
        <Users className="h-10 w-10 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-300 mb-2">
        لا يوجد معلمون حالياً
      </h3>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
        ابدأ بإضافة معلمين جدد إلى النظام لإدارة بياناتهم وتوزيعهم على الصفوف
      </p>
      <Button
        onClick={onAdd}
        className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold gap-2 rounded-lg px-6"
      >
        <UserPlus className="h-4 w-4" />
        إضافة معلم جديد
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Teacher Card
// ---------------------------------------------------------------------------

function TeacherCard({
  teacher,
  onEdit,
  onDelete,
}: {
  teacher: Teacher;
  onEdit: (t: Teacher) => void;
  onDelete: (t: Teacher) => void;
}) {
  return (
    <div
      className="group card-interactive rounded-xl p-5 transition-all duration-200 hover:bg-white/[0.04] hover-glow-amber"
      style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Top row: avatar + name + actions */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar circle */}
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-[#D4A574]/25 to-[#D4A574]/5 shrink-0 border border-[#D4A574]/15">
            <span className="text-base font-bold text-[#D4A574]">
              {getInitials(teacher.name)}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-100 truncate">
              {teacher.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {teacher.subject}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(teacher)}
            className="h-8 w-8 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg"
            title="تعديل"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(teacher)}
            className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg"
            title="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contact info */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span className="truncate" dir="ltr">{teacher.email}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span dir="ltr">{teacher.phone}</span>
        </div>
      </div>

      {/* Classes badges */}
      {teacher.classNames && teacher.classNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {teacher.classNames.slice(0, 3).map((cls, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="text-[10px] font-medium px-2 py-0 rounded-full bg-white/[0.03] border-white/[0.08] text-slate-400"
            >
              {cls}
            </Badge>
          ))}
          {teacher.classNames.length > 3 && (
            <Badge
              variant="outline"
              className="text-[10px] font-medium px-2 py-0 rounded-full bg-white/[0.03] border-white/[0.08] text-slate-500"
            >
              +{teacher.classNames.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Bottom row: badges */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
        <TeacherStatusBadge status={teacher.status} />
        <PermissionBadge permissions={teacher.permissions} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit form – inner content (mounts only when dialog is open)
// ---------------------------------------------------------------------------

function TeacherFormContent({
  editingTeacher,
  onClose,
}: {
  editingTeacher: Teacher | null;
  onClose: () => void;
}) {
  const { addTeacher, updateTeacher } = useAppStore();
  const isEditing = !!editingTeacher;

  // Form state
  const [name, setName] = useState(editingTeacher?.name ?? '');
  const [subject, setSubject] = useState(editingTeacher?.subject ?? '');
  const [email, setEmail] = useState(editingTeacher?.email ?? '');
  const [phone, setPhone] = useState(editingTeacher?.phone ?? '');
  const [permissions, setPermissions] = useState<Teacher['permissions']>(
    editingTeacher?.permissions ?? 'teacher'
  );
  const [status, setStatus] = useState<Teacher['status']>(
    editingTeacher?.status ?? 'active'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim()) return;

    const now = new Date().toISOString();

    if (isEditing && editingTeacher) {
      updateTeacher(editingTeacher.id, {
        name: name.trim(),
        subject: subject.trim(),
        email: email.trim(),
        phone: phone.trim(),
        permissions,
        status,
        updatedAt: now,
      });
      toast.success('تم تحديث بيانات المعلم');
    } else {
      const newTeacher: Teacher = {
        id: `tch-${Date.now()}`,
        name: name.trim(),
        subject: subject.trim(),
        status,
        permissions,
        avatar: '',
        email: email.trim(),
        phone: phone.trim(),
        createdAt: now,
        updatedAt: now,
        classNames: [],
      };
      addTeacher(newTeacher);
      toast.success('تم إضافة المعلم بنجاح');
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
      {/* Name */}
      <div className="flex flex-col gap-2">
        <Label className="text-slate-300 text-sm">اسم المعلم الكامل</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: محمد بن عبدالله السالم"
          className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
          required
        />
      </div>

      {/* Subject */}
      <div className="flex flex-col gap-2">
        <Label className="text-slate-300 text-sm">المادة الدراسية</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="مثال: الرياضيات"
          className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
          required
        />
      </div>

      {/* Email & Phone row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-slate-300 text-sm">البريد الإلكتروني</Label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني"
            type="email"
            dir="ltr"
            className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-slate-300 text-sm">رقم الهاتف</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="050XXXXXXXX"
            dir="ltr"
            className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
          />
        </div>
      </div>

      {/* Permissions & Status row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Permissions dropdown */}
        <div className="flex flex-col gap-2">
          <Label className="text-slate-300 text-sm">الصلاحيات</Label>
          <Select value={permissions} onValueChange={(val) => setPermissions(val as Teacher['permissions'])}>
            <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20">
              <SelectValue placeholder="اختر الصلاحيات" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              {PERMISSION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status dropdown */}
        <div className="flex flex-col gap-2">
          <Label className="text-slate-300 text-sm">الحالة</Label>
          <Select value={status} onValueChange={(val) => setStatus(val as Teacher['status'])}>
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
            </SelectContent>
          </Select>
        </div>
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
              <UserPlus className="h-4 w-4" />
              إضافة المعلم
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

/** Add / Edit teacher form dialog */
function TeacherFormDialog({
  open,
  onOpenChange,
  editingTeacher,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTeacher: Teacher | null;
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
            {editingTeacher ? 'تعديل بيانات المعلم' : 'إضافة معلم جديد'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {editingTeacher
              ? 'قم بتعديل بيانات المعلم المطلوبة ثم اضغط حفظ التغييرات'
              : 'أدخل بيانات المعلم الجديد لإضافته إلى النظام'}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <TeacherFormContent
            editingTeacher={editingTeacher}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Delete confirmation dialog */
function DeleteTeacherDialog({
  teacher,
  open,
  onOpenChange,
}: {
  teacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { deleteTeacher, addToTrash } = useAppStore();

  const handleDelete = () => {
    if (teacher) {
      addToTrash({
        id: `trash-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        itemType: 'teacher',
        itemId: teacher.id,
        itemName: teacher.name,
        deletedBy: 'المدير',
        dataJson: JSON.stringify(teacher),
        restoredAt: null,
        createdAt: new Date().toISOString(),
      });
      deleteTeacher(teacher.id);
      toast.success('تم حذف المعلم');
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
            تأكيد حذف المعلم
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground leading-relaxed">
            هل أنت متأكد من حذف المعلم{' '}
            <span className="font-semibold text-slate-200">{teacher?.name}</span>؟
            <br />
            لا يمكن التراجع عن هذا الإجراء. سيتم حذف جميع بيانات المعلم بشكل نهائي.
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

export default function TeachersSection() {
  const { teachers, setTeachers } = useAppStore();

  // Local UI state
  const [localSearch, setLocalSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Initialize mock data once
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && teachers.length === 0) {
      initialized.current = true;
      setTeachers(INITIAL_TEACHERS);
    }
  }, []);  

  // Filtered & searched list
  const filteredTeachers = useMemo(() => {
    let result = [...teachers];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Search filter
    if (localSearch.trim()) {
      const query = localSearch.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.subject.toLowerCase().includes(query) ||
          t.email.toLowerCase().includes(query)
      );
    }

    return result;
  }, [teachers, statusFilter, localSearch]);

  // Handlers
  const handleAdd = () => {
    setSelectedTeacher(null);
    setFormOpen(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormOpen(true);
  };

  const handleDelete = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setDeleteOpen(true);
  };

  const handleImportTeachers = (data: Record<string, unknown>[]) => {
    const now = new Date().toISOString();
    data.forEach((row) => {
      const newTeacher: Teacher = {
        id: `tch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: String(row.name ?? ''),
        subject: String(row.subject ?? ''),
        status: (row.status as Teacher['status']) ?? 'active',
        permissions: (row.permissions as Teacher['permissions']) ?? 'teacher',
        avatar: '',
        email: String(row.email ?? ''),
        phone: String(row.phone ?? ''),
        createdAt: now,
        updatedAt: now,
        classNames: [],
      };
      addTeacher(newTeacher);
    });
  };

  const handleExportTeachers = () => {
    const exportData = teachers.map((t) => ({
      name: t.name,
      subject: t.subject,
      status: STATUS_MAP[t.status].label,
      permissions: PERMISSION_MAP[t.permissions].label,
      email: t.email || '',
      phone: t.phone || '',
    }));
    exportToCSV(exportData, 'teachers', [
      { key: 'name', label: 'الاسم' },
      { key: 'subject', label: 'المادة' },
      { key: 'status', label: 'الحالة' },
      { key: 'permissions', label: 'الصلاحية' },
      { key: 'email', label: 'البريد' },
      { key: 'phone', label: 'الهاتف' },
    ]);
    toast.success('تم تصدير بيانات المعلمين بنجاح');
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* ── Page Title ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#D4A574]/10">
            <Users className="h-5 w-5 text-[#D4A574]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl flex items-center gap-3">
              إدارة المعلمين
              <Badge className="bg-[#D4A574]/15 text-[#D4A574] border-[#D4A574]/20 hover:bg-[#D4A574]/20 text-sm px-2.5 py-0.5 rounded-full font-semibold tabular-nums">
                {teachers.length}
              </Badge>
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              إدارة بيانات المعلمين وتوزيعهم على الصفوف الدراسية
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
            className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold gap-2 rounded-lg px-5 h-10 btn-shine"
          >
            <UserPlus className="h-4 w-4" />
            إضافة معلم جديد
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
            onClick={handleExportTeachers}
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
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="بحث بالاسم أو المادة أو البريد..."
              className="pr-10 w-full sm:w-72 bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 h-10"
            />
          </div>

          {/* Filter dropdown */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Teachers Card Grid ── */}
      {filteredTeachers.length === 0 ? (
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
          {filteredTeachers.map((teacher) => (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Dialogs ── */}
      <TeacherFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingTeacher={selectedTeacher}
      />

      <DeleteTeacherDialog
        teacher={selectedTeacher}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        type="teachers"
        columns={TEACHER_IMPORT_COLUMNS}
        onImport={handleImportTeachers}
        templateFilename="teachers-template"
      />
    </div>
  );
}
