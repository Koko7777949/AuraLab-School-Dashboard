'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Search,
  Pin,
  PinOff,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  AlertTriangle,
  X,
  CalendarDays,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
// Types
// ---------------------------------------------------------------------------

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'academic' | 'event' | 'urgent' | 'parent';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  author: string;
  pinned: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ITEMS_PER_PAGE = 10;

const CATEGORY_CONFIG: Record<Announcement['category'], { label: string; color: string; bgClass: string; borderClass: string; textClass: string }> = {
  general: {
    label: 'عام',
    color: '#D4A574',
    bgClass: 'bg-amber-500/15',
    borderClass: 'border-amber-500/20',
    textClass: 'text-amber-400',
  },
  academic: {
    label: 'أكاديمي',
    color: '#10b981',
    bgClass: 'bg-emerald-500/15',
    borderClass: 'border-emerald-500/20',
    textClass: 'text-emerald-400',
  },
  event: {
    label: 'فعاليات',
    color: '#38bdf8',
    bgClass: 'bg-sky-500/15',
    borderClass: 'border-sky-500/20',
    textClass: 'text-sky-400',
  },
  urgent: {
    label: 'عاجل',
    color: '#f43f5e',
    bgClass: 'bg-rose-500/15',
    borderClass: 'border-rose-500/20',
    textClass: 'text-rose-400',
  },
  parent: {
    label: 'أولياء الأمور',
    color: '#8b5cf6',
    bgClass: 'bg-violet-500/15',
    borderClass: 'border-violet-500/20',
    textClass: 'text-violet-400',
  },
};

const PRIORITY_CONFIG: Record<Announcement['priority'], { label: string; bgClass: string; textClass: string; dotClass: string; pulse?: boolean }> = {
  low: {
    label: 'منخفض',
    bgClass: 'bg-slate-500/15',
    textClass: 'text-slate-400',
    dotClass: 'bg-slate-400',
  },
  normal: {
    label: 'عادي',
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-400',
    dotClass: 'bg-amber-400',
  },
  high: {
    label: 'مرتفع',
    bgClass: 'bg-orange-500/15',
    textClass: 'text-orange-400',
    dotClass: 'bg-orange-400',
  },
  urgent: {
    label: 'عاجل',
    bgClass: 'bg-rose-500/15',
    textClass: 'text-rose-400',
    dotClass: 'bg-rose-400',
    pulse: true,
  },
};

const CATEGORY_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'general', label: 'عام' },
  { value: 'academic', label: 'أكاديمي' },
  { value: 'event', label: 'فعاليات' },
  { value: 'urgent', label: 'عاجل' },
  { value: 'parent', label: 'أولياء الأمور' },
];

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-001',
    title: 'بداية الفصل الدراسي الثاني',
    content: 'نود إبلاغ أولياء الأمور والطلاب بأن الفصل الدراسي الثاني سيبدأ يوم الأحد ١٤ يناير ٢٠٢٥. يرجى التأكد من تجهيز الكتب والأدوات المدرسية. نتطلع لاستقبال أبنائنا الطلاب بكل حفاوة وترحيب.',
    category: 'general',
    priority: 'high',
    author: 'المدير العام',
    pinned: true,
    expiresAt: '2025-02-01T00:00:00.000Z',
    createdAt: '2025-01-05T08:00:00.000Z',
    updatedAt: '2025-01-05T08:00:00.000Z',
  },
  {
    id: 'ann-002',
    title: 'مواعيد الامتحانات النهائية',
    content: 'تم تحديد مواعيد الامتحانات النهائية للفصل الأول. تبدأ الامتحانات يوم الأحد ٢٠ ديسمبر وتستمر حتى الخميس ٣١ ديسمبر. يرجى الاطلاع على الجدول المفصل المنشور على لوحة الإعلانات.',
    category: 'academic',
    priority: 'urgent',
    author: 'قسم الشؤون الأكاديمية',
    pinned: true,
    expiresAt: '2025-01-15T00:00:00.000Z',
    createdAt: '2025-01-03T10:00:00.000Z',
    updatedAt: '2025-01-03T10:00:00.000Z',
  },
  {
    id: 'ann-003',
    title: 'أنشطة اليوم الوطني',
    content: 'تتشرف إدارة المدرسة بدعوتكم لحضور فعاليات اليوم الوطني التي ستقام يوم الخميس القادم. تتضمن الفعاليات عروضًا ثقافية ومعارض فنية ومسابقات للطلاب.',
    category: 'event',
    priority: 'normal',
    author: 'لجنة الأنشطة',
    pinned: false,
    expiresAt: null,
    createdAt: '2025-01-02T12:00:00.000Z',
    updatedAt: '2025-01-02T12:00:00.000Z',
  },
  {
    id: 'ann-004',
    title: 'تعليق الدراسة بسبب الأحوال الجوية',
    content: 'بناءً على توجيهات وزارة التعليم وتنسيقًا مع الأرصاد الجوية، يُعلن عن تعليق الدراسة غدًا الثلاثاء بسبب توقع هطول أمطار غزيرة. سيتم تعويض اليوم الدراسي لاحقًا.',
    category: 'urgent',
    priority: 'urgent',
    author: 'إدارة المدرسة',
    pinned: true,
    expiresAt: '2025-01-10T00:00:00.000Z',
    createdAt: '2025-01-06T18:00:00.000Z',
    updatedAt: '2025-01-06T18:00:00.000Z',
  },
  {
    id: 'ann-005',
    title: 'نتائج المسابقة العلمية',
    content: 'تهنئ إدارة المدرسة الطلاب الفائزين في المسابقة العلمية الإقليمية. حصلت مدرستنا على المركز الأول في فرق البحث العلمي والمركز الثاني في المسابقة الرياضية. شكرًا لجميع المشاركين والمشرفين على جهودهم المتميزة.',
    category: 'academic',
    priority: 'normal',
    author: 'المشرف الأكاديمي',
    pinned: false,
    expiresAt: null,
    createdAt: '2025-01-01T09:00:00.000Z',
    updatedAt: '2025-01-01T09:00:00.000Z',
  },
  {
    id: 'ann-006',
    title: 'اجتماع أولياء الأمور',
    content: 'يدعو مجلس المعلمين أولياء أمور الطلاب لحضور الاجتماع الدوري الذي سيُعقد يوم الأربعاء القادم في قاعة المحاضرات. سيتم مناقشة نتائج الفصل الدراسي الأول والخطط المستقبلية.',
    category: 'parent',
    priority: 'high',
    author: 'مجلس المعلمين',
    pinned: false,
    expiresAt: '2025-01-20T00:00:00.000Z',
    createdAt: '2025-01-04T14:00:00.000Z',
    updatedAt: '2025-01-04T14:00:00.000Z',
  },
  {
    id: 'ann-007',
    title: 'تحديثات النظام المدرسي',
    content: 'تم تحديث نظام الإدارة المدرسية بإضافة ميزات جديدة تشمل: متابعة الحضور الإلكتروني، التقارير الأكاديمية التفصيلية، ونظام الإشعارات الفوري. يرجى تسجيل الدخول وتجربة الميزات الجديدة.',
    category: 'general',
    priority: 'low',
    author: 'قسم التقنية',
    pinned: false,
    expiresAt: null,
    createdAt: '2024-12-28T11:00:00.000Z',
    updatedAt: '2024-12-28T11:00:00.000Z',
  },
  {
    id: 'ann-008',
    title: 'رحلة علمية لمتحف العلوم',
    content: 'تنظم إدارة المدرسة رحلة علمية لزيارة المتحف الوطني للعلوم والتكنولوجيا يوم الأحد القادم. الرحلة مخصصة لطلاب الصفوف العليا. يرجى التسجيل لدى مشرف النشاط قبل يوم الخميس.',
    category: 'event',
    priority: 'normal',
    author: 'قسم الأنشطة الطلابية',
    pinned: false,
    expiresAt: '2025-01-12T00:00:00.000Z',
    createdAt: '2024-12-30T08:30:00.000Z',
    updatedAt: '2024-12-30T08:30:00.000Z',
  },
  {
    id: 'ann-009',
    title: 'برنامج دعم الطلاب المتعثرين',
    content: 'تُعلن إدارة المدرسة عن إطلاق برنامج دعم أكاديمي خاص للطلاب المتعثرين في بعض المواد. سيبدأ البرنامج الأسبوع القادم ويشمل حصصًا تقوية يومية بعد الدوام.',
    category: 'parent',
    priority: 'normal',
    author: 'المرشد التربوي',
    pinned: false,
    expiresAt: null,
    createdAt: '2024-12-27T10:00:00.000Z',
    updatedAt: '2024-12-27T10:00:00.000Z',
  },
  {
    id: 'ann-010',
    title: 'ملاحظات بخصوص الزي المدرسي',
    content: 'نود تذكير أولياء الأمور بأهمية الالتزام بالزي المدرسي الرسمي. سيتم تطبيق لائحة الانضباط بدءًا من الأسبوع القادم على الطلاب غير الملتزمين بالزي المدرسي.',
    category: 'general',
    priority: 'normal',
    author: 'إدارة الشؤون الطلابية',
    pinned: false,
    expiresAt: '2025-02-01T00:00:00.000Z',
    createdAt: '2024-12-25T09:00:00.000Z',
    updatedAt: '2024-12-25T09:00:00.000Z',
  },
  {
    id: 'ann-011',
    title: 'نتائج مسابقة القرآن الكريم',
    content: 'تهنئة خاصة بالطلاب المشاركين في مسابقة حفظ القرآن الكريم التي أقيمت الأسبوع الماضي. تم تكريم الفائزين في حفل صباحي بحضور مدير التعليم. بارك الله في جهود الجميع.',
    category: 'academic',
    priority: 'normal',
    author: 'قسم التربية الإسلامية',
    pinned: false,
    expiresAt: null,
    createdAt: '2024-12-20T15:00:00.000Z',
    updatedAt: '2024-12-20T15:00:00.000Z',
  },
  {
    id: 'ann-012',
    title: 'صيانة المرافق المدرسية',
    content: 'سيتم إجراء أعمال صيانة في مبنى الصفوف الثانوية يوم الجمعة. يرجى عدم دخول المنطقة المخصصة للصيانة. سيتم الانتهاء من الأعمال بحلول مساء يوم السبت إن شاء الله.',
    category: 'general',
    priority: 'low',
    author: 'قسم الصيانة',
    pinned: false,
    expiresAt: '2025-01-10T00:00:00.000Z',
    createdAt: '2024-12-18T07:00:00.000Z',
    updatedAt: '2024-12-18T07:00:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'منذ لحظات';
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return new Date(dateString).toLocaleDateString('ar-SA');
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Category badge */
function CategoryBadge({ category }: { category: Announcement['category'] }) {
  const config = CATEGORY_CONFIG[category];
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium px-2.5 py-0.5 rounded-full',
        config.bgClass,
        config.textClass,
        config.borderClass,
      )}
    >
      {config.label}
    </Badge>
  );
}

/** Priority indicator */
function PriorityIndicator({ priority }: { priority: Announcement['priority'] }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] font-medium px-2 py-0.5 rounded-full gap-1.5',
        config.bgClass,
        config.textClass,
        'border-transparent',
      )}
    >
      <span
        className={cn('inline-block h-1.5 w-1.5 rounded-full', config.dotClass, {
          'animate-pulse': config.pulse,
        })}
      />
      {config.label}
    </Badge>
  );
}

/** Empty state */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6">
        <Megaphone className="h-10 w-10 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-300 mb-2">
        لا توجد إعلانات حالياً
      </h3>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
        ابدأ بإضافة إعلانات جديدة لإبقاء الجميع على اطلاع بأحدث الأخبار والفعاليات
      </p>
      <Button
        onClick={onAdd}
        className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold gap-2 rounded-lg px-6 btn-shine"
      >
        <Plus className="h-4 w-4" />
        إضافة إعلان
      </Button>
    </div>
  );
}

/** Announcement detail view dialog */
function ViewAnnouncementDialog({
  announcement,
  open,
  onOpenChange,
}: {
  announcement: Announcement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!announcement) return null;

  const catConfig = CATEGORY_CONFIG[announcement.category];
  const priConfig = PRIORITY_CONFIG[announcement.priority];
  const expired = isExpired(announcement.expiresAt);

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
          <div className="flex items-center gap-3 flex-wrap">
            <DialogTitle className="text-white text-xl flex-1">
              {announcement.title}
            </DialogTitle>
            {announcement.pinned && (
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-xs px-2 py-0.5 rounded-full gap-1">
                <Pin className="h-3 w-3" />
                مثبت
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <CategoryBadge category={announcement.category} />
            <PriorityIndicator priority={announcement.priority} />
            {expired && (
              <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/20 text-xs px-2 py-0.5 rounded-full gap-1">
                <X className="h-3 w-3" />
                منتهي
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Content */}
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: `1px solid ${catConfig.color}15`,
            }}
          >
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {announcement.content}
            </p>
          </div>

          {/* Meta info */}
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between gap-3 py-1.5 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                    <User className="h-4 w-4 text-[#D4A574]" />
                  </div>
                  <span className="text-sm text-muted-foreground">الكاتب</span>
                </div>
                <span className="text-sm font-medium text-slate-200">{announcement.author}</span>
              </div>
              <div className="flex items-center justify-between gap-3 py-1.5 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                    <Clock className="h-4 w-4 text-[#D4A574]" />
                  </div>
                  <span className="text-sm text-muted-foreground">تاريخ النشر</span>
                </div>
                <span className="text-sm text-slate-300">
                  {new Date(announcement.createdAt).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {announcement.expiresAt && (
                <div className="flex items-center justify-between gap-3 py-1.5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-rose-500/10">
                      <CalendarDays className="h-4 w-4 text-rose-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">تاريخ الانتهاء</span>
                  </div>
                  <span className={cn('text-sm', expired ? 'text-rose-400' : 'text-slate-300')}>
                    {new Date(announcement.expiresAt).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Last updated */}
          <div className="text-xs text-muted-foreground/60 text-center">
            آخر تحديث: {new Date(announcement.updatedAt).toLocaleDateString('ar-SA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Create / Edit form — inner content (mounts only when dialog is open)
// ---------------------------------------------------------------------------

function AnnouncementFormContent({
  editingAnnouncement,
  onClose,
  onSubmit,
}: {
  editingAnnouncement: Announcement | null;
  onClose: () => void;
  onSubmit: (data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) => void;
}) {
  const isEditing = !!editingAnnouncement;

  const [title, setTitle] = useState(editingAnnouncement?.title ?? '');
  const [content, setContent] = useState(editingAnnouncement?.content ?? '');
  const [category, setCategory] = useState<string>(editingAnnouncement?.category ?? 'general');
  const [priority, setPriority] = useState<string>(editingAnnouncement?.priority ?? 'normal');
  const [author, setAuthor] = useState(editingAnnouncement?.author ?? 'المدير');
  const [expiresAt, setExpiresAt] = useState(
    editingAnnouncement?.expiresAt
      ? new Date(editingAnnouncement.expiresAt).toISOString().split('T')[0]
      : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error('يرجى ملء العنوان والمحتوى');
      return;
    }

    onSubmit({
      title: title.trim(),
      content: content.trim(),
      category: category as Announcement['category'],
      priority: priority as Announcement['priority'],
      author: author.trim() || 'المدير',
      pinned: editingAnnouncement?.pinned ?? false,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    });

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <Label className="text-slate-300 text-sm">عنوان الإعلان</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="مثال: إعلان هام بخصوص الامتحانات"
          className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
          required
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2">
        <Label className="text-slate-300 text-sm">محتوى الإعلان</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="اكتب محتوى الإعلان بالتفصيل..."
          className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 min-h-[120px] resize-y"
          required
        />
      </div>

      {/* Category & Priority row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Category */}
        <div className="flex flex-col gap-2">
          <Label className="text-slate-300 text-sm">التصنيف</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20">
              <SelectValue placeholder="اختر التصنيف" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              {CATEGORY_TABS.filter((t) => t.value !== 'all').map((tab) => (
                <SelectItem
                  key={tab.value}
                  value={tab.value}
                  className="text-slate-200 focus:bg-white/[0.05] focus:text-white"
                >
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-2">
          <Label className="text-slate-300 text-sm">الأولوية</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20">
              <SelectValue placeholder="اختر الأولوية" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              <SelectItem value="low" className="text-slate-200 focus:bg-white/[0.05] focus:text-white">منخفض</SelectItem>
              <SelectItem value="normal" className="text-slate-200 focus:bg-white/[0.05] focus:text-white">عادي</SelectItem>
              <SelectItem value="high" className="text-slate-200 focus:bg-white/[0.05] focus:text-white">مرتفع</SelectItem>
              <SelectItem value="urgent" className="text-rose-400 focus:bg-white/[0.05] focus:text-white">عاجل</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Author & Expiry row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Author */}
        <div className="flex flex-col gap-2">
          <Label className="text-slate-300 text-sm">اسم الكاتب</Label>
          <Input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="اسم الكاتب"
            className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
          />
        </div>

        {/* Expiry date */}
        <div className="flex flex-col gap-2">
          <Label className="text-slate-300 text-sm">تاريخ الانتهاء (اختياري)</Label>
          <Input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 [color-scheme:dark]"
            dir="ltr"
          />
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
              <Plus className="h-4 w-4" />
              نشر الإعلان
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

/** Create / Edit dialog */
function AnnouncementFormDialog({
  open,
  onOpenChange,
  editingAnnouncement,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAnnouncement: Announcement | null;
  onSubmit: (data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) => void;
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
            {editingAnnouncement ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {editingAnnouncement
              ? 'قم بتعديل بيانات الإعلان ثم اضغط حفظ التغييرات'
              : 'أدخل بيانات الإعلان الجديد لإضافته إلى لوحة الإعلانات'}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <AnnouncementFormContent
            editingAnnouncement={editingAnnouncement}
            onClose={() => onOpenChange(false)}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Delete confirmation dialog */
function DeleteAnnouncementDialog({
  announcement,
  open,
  onOpenChange,
  onConfirm,
}: {
  announcement: Announcement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
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
            تأكيد حذف الإعلان
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground leading-relaxed">
            هل أنت متأكد من حذف الإعلان{' '}
            <span className="font-semibold text-slate-200">{announcement?.title}</span>؟
            <br />
            لا يمكن التراجع عن هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-3 sm:justify-start mt-2">
          <AlertDialogCancel
            className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-lg px-6 mt-0"
          >
            إلغاء
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
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
// Announcement Card
// ---------------------------------------------------------------------------

function AnnouncementCard({
  announcement,
  onPin,
  onEdit,
  onDelete,
  onView,
}: {
  announcement: Announcement;
  onPin: (id: string) => void;
  onEdit: (ann: Announcement) => void;
  onDelete: (ann: Announcement) => void;
  onView: (ann: Announcement) => void;
}) {
  const catConfig = CATEGORY_CONFIG[announcement.category];
  const expired = isExpired(announcement.expiresAt);

  return (
    <div
      className={cn(
        'group rounded-xl p-5 transition-all duration-300 cursor-pointer',
        announcement.pinned
          ? 'glass-card-elevated'
          : 'hover:bg-white/[0.02]',
      )}
      style={{
        backgroundColor: announcement.pinned ? 'rgba(212, 165, 116, 0.04)' : 'rgba(255,255,255,0.015)',
        border: announcement.pinned
          ? `1px solid ${catConfig.color}25`
          : '1px solid rgba(255,255,255,0.06)',
        boxShadow: announcement.pinned
          ? `0 0 20px ${catConfig.color}08`
          : 'none',
      }}
      onClick={() => onView(announcement)}
    >
      {/* Top row: badges + actions */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {announcement.pinned && (
            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-xs px-2 py-0.5 rounded-full gap-1 shrink-0">
              <Pin className="h-3 w-3" />
              مثبت 📌
            </Badge>
          )}
          <CategoryBadge category={announcement.category} />
          <PriorityIndicator priority={announcement.priority} />
          {expired && (
            <Badge className="bg-rose-500/10 text-rose-400/70 border-rose-500/15 text-[10px] px-2 py-0.5 rounded-full gap-1">
              <X className="h-3 w-3" />
              منتهي
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pin toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPin(announcement.id)}
            className={cn(
              'h-8 w-8 rounded-lg transition-all duration-200',
              announcement.pinned
                ? 'text-amber-400 hover:bg-amber-400/10'
                : 'text-slate-500 hover:text-amber-400 hover:bg-amber-400/10',
            )}
            title={announcement.pinned ? 'إلغاء التثبيت' : 'تثبيت'}
          >
            {announcement.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </Button>

          {/* Edit */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(announcement)}
            className="h-8 w-8 text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg"
            title="تعديل"
          >
            <Pencil className="h-4 w-4" />
          </Button>

          {/* Delete */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(announcement)}
            className="h-8 w-8 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg"
            title="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Title */}
      <h3
        className="text-base font-semibold text-white mb-2 line-clamp-1 group-hover:text-[#D4A574] transition-colors duration-200"
        style={{
          borderRight: `3px solid ${catConfig.color}`,
          paddingRight: '12px',
        }}
      >
        {announcement.title}
      </h3>

      {/* Content preview */}
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
        {announcement.content}
      </p>

      {/* Footer: author + time */}
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground/60">
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" />
          <span>{announcement.author}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>{getRelativeTime(announcement.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AnnouncementsSection() {
  // Local state for announcements (managed in-memory like other sections)
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // UI state
  const [localSearch, setLocalSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Initialize mock data once (useRef guard pattern)
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && announcements.length === 0) {
      initialized.current = true;
      requestAnimationFrame(() => setAnnouncements(INITIAL_ANNOUNCEMENTS));
    }
  }, []);

  // Split into pinned and unpinned
  const { pinned, unpinned } = useMemo(() => {
    const allFiltered = announcements.filter((a) => {
      // Category filter
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      // Search filter
      if (localSearch.trim()) {
        const query = localSearch.trim().toLowerCase();
        if (
          !a.title.toLowerCase().includes(query) &&
          !a.content.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });

    return {
      pinned: allFiltered.filter((a) => a.pinned),
      unpinned: allFiltered.filter((a) => !a.pinned),
    };
  }, [announcements, categoryFilter, localSearch]);

  // Pagination — only for unpinned (pinned always shown)
  const totalUnpinned = unpinned.length;
  const totalPages = Math.max(1, Math.ceil(totalUnpinned / ITEMS_PER_PAGE));
  const paginatedUnpinned = unpinned.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Reset to page 1 when filters change
  const prevFiltersRef = useRef({ categoryFilter, localSearch });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (prev.categoryFilter !== categoryFilter || prev.localSearch !== localSearch) {
      prevFiltersRef.current = { categoryFilter, localSearch };
      requestAnimationFrame(() => setCurrentPage(1));
    }
  }, [categoryFilter, localSearch]);

  // Handlers
  const handleAdd = useCallback(() => {
    setSelectedAnnouncement(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((ann: Announcement) => {
    setSelectedAnnouncement(ann);
    setFormOpen(true);
  }, []);

  const handleView = useCallback((ann: Announcement) => {
    setSelectedAnnouncement(ann);
    setViewOpen(true);
  }, []);

  const handleDelete = useCallback((ann: Announcement) => {
    setSelectedAnnouncement(ann);
    setDeleteOpen(true);
  }, []);

  const handlePin = useCallback((id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, pinned: !a.pinned } : a)),
    );
    const target = announcements.find((a) => a.id === id);
    toast.success(target?.pinned ? 'تم إلغاء تثبيت الإعلان' : 'تم تثبيت الإعلان');
  }, [announcements]);

  const handleSubmit = useCallback(
    (data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();

      if (selectedAnnouncement) {
        // Update existing
        setAnnouncements((prev) =>
          prev.map((a) =>
            a.id === selectedAnnouncement.id
              ? { ...a, ...data, updatedAt: now }
              : a,
          ),
        );
        toast.success('تم تحديث الإعلان بنجاح');
      } else {
        // Create new
        const newAnn: Announcement = {
          ...data,
          id: `ann-${Date.now()}`,
          createdAt: now,
          updatedAt: now,
        };
        setAnnouncements((prev) => [newAnn, ...prev]);
        toast.success('تم نشر الإعلان بنجاح');
      }
    },
    [selectedAnnouncement],
  );

  const handleConfirmDelete = useCallback(() => {
    if (selectedAnnouncement) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== selectedAnnouncement.id));
      toast.success('تم حذف الإعلان');
      setDeleteOpen(false);
    }
  }, [selectedAnnouncement]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  }, [totalPages]);

  // Count of all items after filter
  const totalFiltered = pinned.length + totalUnpinned;
  const totalPinnedCount = announcements.filter((a) => a.pinned).length;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* ── Page Title ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#D4A574]/10">
            <Megaphone className="h-5 w-5 text-[#D4A574]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl flex items-center gap-3">
              لوحة الإعلانات
              <Badge className="bg-[#D4A574]/15 text-[#D4A574] border-[#D4A574]/20 hover:bg-[#D4A574]/20 text-sm px-2.5 py-0.5 rounded-full font-semibold tabular-nums">
                {announcements.length}
              </Badge>
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              إدارة الإعلانات والملاحظات الموجهة للطلاب والمعلمين وأولياء الأمور
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
        <div className="flex items-center gap-2">
          <Button
            onClick={handleAdd}
            className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold gap-2 rounded-lg px-5 h-10"
          >
            <Plus className="h-4 w-4" />
            إضافة إعلان
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="بحث في العناوين والمحتوى..."
            className="pr-10 w-full sm:w-72 bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 h-10"
          />
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-muted-foreground/50 shrink-0" />
        {CATEGORY_TABS.map((tab) => {
          const isActive = categoryFilter === tab.value;
          const tabCategory = tab.value !== 'all' ? CATEGORY_CONFIG[tab.value as Announcement['category']] : null;
          return (
            <button
              key={tab.value}
              onClick={() => setCategoryFilter(tab.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-200 border',
                isActive
                  ? tabCategory
                    ? `${tabCategory.bgClass} ${tabCategory.textClass} ${tabCategory.borderClass}`
                    : 'bg-[#D4A574]/15 text-[#D4A574] border-[#D4A574]/30'
                  : 'bg-white/[0.02] text-muted-foreground border-white/[0.06] hover:bg-white/[0.05] hover:text-slate-300',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Content Area ── */}
      {totalFiltered === 0 ? (
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
        <div className="flex flex-col gap-6">
          {/* ── Pinned Section ── */}
          {pinned.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Pin className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-amber-400">
                  الإعلانات المثبتة
                </h2>
                <span className="text-xs text-muted-foreground/50">
                  ({totalPinnedCount})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pinned.map((ann) => (
                  <AnnouncementCard
                    key={ann.id}
                    announcement={ann}
                    onPin={handlePin}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Separator ── */}
          {pinned.length > 0 && paginatedUnpinned.length > 0 && (
            <div
              className="h-px"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(212,165,116,0.15) 30%, rgba(212,165,116,0.15) 70%, transparent 100%)',
              }}
            />
          )}

          {/* ── All Announcements Grid ── */}
          {paginatedUnpinned.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <h2 className="text-sm font-semibold text-slate-400 mb-4">
                  جميع الإعلانات
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedUnpinned.map((ann) => (
                  <AnnouncementCard
                    key={ann.id}
                    announcement={ann}
                    onPin={handlePin}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{
                backgroundColor: '#1A1A24',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Info */}
              <div className="text-xs text-muted-foreground/60">
                عرض{' '}
                <span className="font-semibold text-slate-300 tabular-nums">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>
                {' '}-{' '}
                <span className="font-semibold text-slate-300 tabular-nums">
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalUnpinned)}
                </span>
                {' '}من{' '}
                <span className="font-semibold text-slate-300 tabular-nums">
                  {totalUnpinned}
                </span>
                {' '}إعلان
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
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]',
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

      {/* ── Dialogs ── */}
      <AnnouncementFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingAnnouncement={selectedAnnouncement}
        onSubmit={handleSubmit}
      />

      <ViewAnnouncementDialog
        announcement={selectedAnnouncement}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />

      <DeleteAnnouncementDialog
        announcement={selectedAnnouncement}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
