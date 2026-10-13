'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  Filter,
  ChevronLeft,
  ChevronRight,
  Save,
  BookCopy,
  ArrowRightLeft,
  Library,
  MapPin,
  Calendar,
  Hash,
  Building2,
  User,
  CircleDot,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { LibraryBook } from '@/lib/types';

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

const ITEMS_PER_PAGE = 12;

const CATEGORIES = [
  'أدب',
  'علوم',
  'رياضيات',
  'تاريخ',
  'جغرافيا',
  'لغة عربية',
  'لغة إنجليزية',
  'دين',
  'فن',
  'تقنية',
] as const;

const COVER_COLORS = [
  '#D4A574',
  '#E07A5F',
  '#81B29A',
  '#3D85C6',
  '#9B59B6',
  '#F39C12',
  '#E74C3C',
  '#1ABC9C',
] as const;

type ViewMode = 'grid' | 'list';
type AvailabilityFilter = 'all' | 'available' | 'borrowed';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

function generateMockBooks(): LibraryBook[] {
  const books: Omit<LibraryBook, 'id' | 'createdAt'>[] = [
    {
      title: 'ألف ليلة وليلة',
      author: 'مجهول',
      isbn: '978-977-01-1001-1',
      category: 'أدب',
      publisher: 'دار المعارف',
      year: 2005,
      totalCopies: 5,
      availableCopies: 3,
      location: 'الرف A-1',
      coverColor: '#D4A574',
      description: 'مجموعة من القصص الشعبية العربية التي تروي حكايات شهرزاد الساحرة عبر ألف ليلة.',
      addedBy: 'المدير: أحمد محمد',
    },
    {
      title: 'الفيزياء المسلية',
      author: 'ياكوف بيرلمان',
      isbn: '978-977-01-1002-8',
      category: 'علوم',
      publisher: 'دار الهلال',
      year: 2012,
      totalCopies: 4,
      availableCopies: 2,
      location: 'الرف B-3',
      coverColor: '#81B29A',
      description: 'كتاب يشرح مبادئ الفيزياء بطريقة مبسطة ومسلية مع أمثلة من الحياة اليومية.',
      addedBy: 'المدير: أحمد محمد',
    },
    {
      title: 'الرياضيات للمرحلة الثانوية',
      author: 'د. فهد العتيبي',
      isbn: '978-977-01-1003-5',
      category: 'رياضيات',
      publisher: 'وزارة التعليم',
      year: 2023,
      totalCopies: 30,
      availableCopies: 18,
      location: 'الرف C-1',
      coverColor: '#3D85C6',
      description: 'كتاب منهجي شامل للرياضيات للصف الثالث الثانوي يشمل الجبر والهندسة والتحليل.',
      addedBy: 'المعلم: خالد العمري',
    },
    {
      title: 'تاريخ الحضارة الإسلامية',
      author: 'د. حسن إبراهيم حسن',
      isbn: '978-977-01-1004-2',
      category: 'تاريخ',
      publisher: 'دار الفكر العربي',
      year: 2018,
      totalCopies: 6,
      availableCopies: 6,
      location: 'الرف D-2',
      coverColor: '#E07A5F',
      description: 'دراسة شاملة لتاريخ الحضارة الإسلامية من نشأتها حتى العصر الحديث.',
      addedBy: 'المدير: أحمد محمد',
    },
    {
      title: 'جغرافيا العالم',
      author: 'د. سارة القحطاني',
      isbn: '978-977-01-1005-9',
      category: 'جغرافيا',
      publisher: 'دار العلم',
      year: 2020,
      totalCopies: 8,
      availableCopies: 5,
      location: 'الرف D-4',
      coverColor: '#1ABC9C',
      description: 'استكشاف شامل للجغرافيا الطبيعية والبشرية لقارات العالم المختلفة.',
      addedBy: 'المعلم: خالد العمري',
    },
    {
      title: 'النحو الواضح',
      author: 'علي الجارم',
      isbn: '978-977-01-1006-6',
      category: 'لغة عربية',
      publisher: 'دار المعارف',
      year: 2015,
      totalCopies: 20,
      availableCopies: 12,
      location: 'الرف A-3',
      coverColor: '#F39C12',
      description: 'كتاب في قواعد النحو العربي يشرح القواعد بطريقة واضحة وسهلة الفهم.',
      addedBy: 'المعلم: خالد العمري',
    },
    {
      title: 'English Grammar in Use',
      author: 'Raymond Murphy',
      isbn: '978-1-107-61404-5',
      category: 'لغة إنجليزية',
      publisher: 'Cambridge University Press',
      year: 2019,
      totalCopies: 15,
      availableCopies: 0,
      location: 'الرف E-1',
      coverColor: '#9B59B6',
      description: 'A self-study reference and practice book for intermediate learners of English.',
      addedBy: 'المدير: أحمد محمد',
    },
    {
      title: 'تفسير ابن كثير',
      author: 'الإمام ابن كثير',
      isbn: '978-977-01-1007-3',
      category: 'دين',
      publisher: 'دار الفكر',
      year: 2010,
      totalCopies: 10,
      availableCopies: 7,
      location: 'الرف F-1',
      coverColor: '#E74C3C',
      description: 'تفسير شامل للقرآن الكريم مع الأحاديث والآثار المرتبطة بالآيات.',
      addedBy: 'المدير: أحمد محمد',
    },
    {
      title: 'فن الخط العربي',
      author: 'د. محمد عبد القادر',
      isbn: '978-977-01-1008-0',
      category: 'فن',
      publisher: 'دار الفنون',
      year: 2017,
      totalCopies: 4,
      availableCopies: 4,
      location: 'الرف G-1',
      coverColor: '#D4A574',
      description: 'دليل شامل لتعلم فنون الخط العربي بأنواعها المختلفة من النسخ إلى الديواني.',
      addedBy: 'المعلم: خالد العمري',
    },
    {
      title: 'مقدمة في البرمجة',
      author: 'د. نورة الشمري',
      isbn: '978-977-01-1009-7',
      category: 'تقنية',
      publisher: 'دار التقنية',
      year: 2024,
      totalCopies: 12,
      availableCopies: 8,
      location: 'الرف H-1',
      coverColor: '#3D85C6',
      description: 'مقدمة في أساسيات البرمجة باستخدام لغة بايثون مع مشاريع عملية تطبيقية.',
      addedBy: 'المعلم: خالد العمري',
    },
    {
      title: 'أسرار الكون',
      author: 'ستيفن هوكينج',
      isbn: '978-977-01-1010-3',
      category: 'علوم',
      publisher: 'دار الشروق',
      year: 2016,
      totalCopies: 3,
      availableCopies: 1,
      location: 'الرف B-1',
      coverColor: '#81B29A',
      description: 'رحلة مذهلة عبر الكون من الثقوب السوداء إلى النسبية العامة بطريقة مبسطة.',
      addedBy: 'المدير: أحمد محمد',
    },
    {
      title: 'ألف باء الإعراب',
      author: 'محيي الدين بن عبد الظاهر',
      isbn: '978-977-01-1011-0',
      category: 'لغة عربية',
      publisher: 'دار الكتب العلمية',
      year: 2008,
      totalCopies: 7,
      availableCopies: 5,
      location: 'الرف A-2',
      coverColor: '#E07A5F',
      description: 'كتاب مصغر في علم النحو والصرف يقدم القواعد الأساسية بطريقة مختصرة.',
      addedBy: 'المعلم: خالد العمري',
    },
    {
      title: 'قصص الأنبياء',
      author: 'ابن كثير',
      isbn: '978-977-01-1012-7',
      category: 'دين',
      publisher: 'دار المعرفة',
      year: 2013,
      totalCopies: 9,
      availableCopies: 9,
      location: 'الرف F-2',
      coverColor: '#F39C12',
      description: 'مجموعة من قصص الأنبياء والمرسلين مستندة إلى المصادر الأصلية.',
      addedBy: 'المدير: أحمد محمد',
    },
    {
      title: 'الطريق إلى التفوق',
      author: 'د. عبدالله العنزي',
      isbn: '978-977-01-1013-4',
      category: 'أدب',
      publisher: 'دار الإبداع',
      year: 2021,
      totalCopies: 5,
      availableCopies: 3,
      location: 'الرف A-4',
      coverColor: '#9B59B6',
      description: 'كتاب تحفيزي يقدم استراتيجيات وطرق للتفوق الدراسي والشخصي.',
      addedBy: 'المعلم: خالد العمري',
    },
    {
      title: 'أساسيات التصميم الجرافيكي',
      author: 'د. ليلى الحربي',
      isbn: '978-977-01-1014-1',
      category: 'تقنية',
      publisher: 'دار الإبداع الرقمي',
      year: 2022,
      totalCopies: 6,
      availableCopies: 2,
      location: 'الرف H-2',
      coverColor: '#E74C3C',
      description: 'مقدمة شاملة في مبادئ التصميم الجرافيكي وأدواته الحديثة.',
      addedBy: 'المعلم: خالد العمري',
    },
    {
      title: 'الهندسة الفراغية',
      author: 'د. سلطان المطيري',
      isbn: '978-977-01-1015-8',
      category: 'رياضيات',
      publisher: 'دار العلوم',
      year: 2023,
      totalCopies: 10,
      availableCopies: 6,
      location: 'الرف C-3',
      coverColor: '#1ABC9C',
      description: 'كتاب في الهندسة الفراغية يشمل الأشكال ثلاثية الأبعاد والمجسمات والتحويلات.',
      addedBy: 'المدير: أحمد محمد',
    },
  ];

  return books.map((book, i) => ({
    ...book,
    id: `book-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${i}`,
    createdAt: new Date(2024, 0, 1 + i).toISOString(),
  }));
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

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  colorClass,
  bgColor,
}: {
  icon: typeof BookOpen;
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

// ---------------------------------------------------------------------------
// View Dialog
// ---------------------------------------------------------------------------

function ViewBookDialog({
  book,
  open,
  onOpenChange,
}: {
  book: LibraryBook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { updateLibraryBook } = useAppStore();

  const handleBorrow = useCallback(() => {
    if (!book) return;
    if (book.availableCopies <= 0) {
      toast.error('لا توجد نسخ متاحة للاستعارة');
      return;
    }
    updateLibraryBook(book.id, { availableCopies: book.availableCopies - 1 });
    toast.success(`تم استعارة كتاب "${book.title}" بنجاح`);
  }, [book, updateLibraryBook]);

  const handleReturn = useCallback(() => {
    if (!book) return;
    if (book.availableCopies >= book.totalCopies) {
      toast.error('جميع النسخ موجودة في المكتبة بالفعل');
      return;
    }
    updateLibraryBook(book.id, { availableCopies: book.availableCopies + 1 });
    toast.success(`تم إرجاع كتاب "${book.title}" بنجاح`);
  }, [book, updateLibraryBook]);

  if (!book) return null;

  const borrowed = book.totalCopies - book.availableCopies;
  const isAvailable = book.availableCopies > 0;
  const isAllReturned = book.availableCopies >= book.totalCopies;

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
            تفاصيل الكتاب
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            عرض تفاصيل الكتاب والمعلومات الكاملة
          </DialogDescription>
        </DialogHeader>

        {/* Cover strip */}
        <div
          className="h-2 rounded-full w-full"
          style={{ backgroundColor: book.coverColor }}
        />

        <div className="flex flex-col gap-4 mt-2">
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            {/* Title & Author */}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white mb-1">{book.title}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {book.author}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                    <Hash className="h-4 w-4 text-[#D4A574]" />
                  </div>
                  <span className="text-sm text-muted-foreground">ISBN</span>
                </div>
                <span className="text-sm font-medium text-slate-200 font-mono" dir="ltr">{book.isbn}</span>
              </div>

              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                    <BookOpen className="h-4 w-4 text-[#D4A574]" />
                  </div>
                  <span className="text-sm text-muted-foreground">التصنيف</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs px-2.5 py-0.5 rounded-full bg-[#D4A574]/10 text-[#D4A574] border-[#D4A574]/20"
                >
                  {book.category}
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                    <Building2 className="h-4 w-4 text-[#D4A574]" />
                  </div>
                  <span className="text-sm text-muted-foreground">دار النشر</span>
                </div>
                <span className="text-sm font-medium text-slate-200">{book.publisher}</span>
              </div>

              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                    <Calendar className="h-4 w-4 text-[#D4A574]" />
                  </div>
                  <span className="text-sm text-muted-foreground">سنة النشر</span>
                </div>
                <span className="text-sm font-medium text-slate-200">{book.year}</span>
              </div>

              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                    <MapPin className="h-4 w-4 text-[#D4A574]" />
                  </div>
                  <span className="text-sm text-muted-foreground">الموقع</span>
                </div>
                <span className="text-sm font-medium text-slate-200">{book.location}</span>
              </div>

              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                    <BookCopy className="h-4 w-4 text-[#D4A574]" />
                  </div>
                  <span className="text-sm text-muted-foreground">النسخ</span>
                </div>
                <span className="text-sm font-medium text-slate-200">
                  {book.availableCopies}/{book.totalCopies}
                  <span className="text-xs text-muted-foreground mr-2">
                    (متاح / إجمالي)
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                    <ArrowRightLeft className="h-4 w-4 text-[#D4A574]" />
                  </div>
                  <span className="text-sm text-muted-foreground">مستعار</span>
                </div>
                <span className="text-sm font-medium text-slate-200">{borrowed} نسخة</span>
              </div>

              <div className="flex items-center justify-between gap-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10">
                    <CircleDot className="h-4 w-4 text-[#D4A574]" />
                  </div>
                  <span className="text-sm text-muted-foreground">الحالة</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-2.5 w-2.5 rounded-full',
                      isAvailable ? 'bg-emerald-500' : 'bg-red-500',
                    )}
                  />
                  <span className={cn('text-sm font-medium', isAvailable ? 'text-emerald-400' : 'text-red-400')}>
                    {isAvailable ? 'متاح' : 'غير متاح'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <h4 className="text-sm font-semibold text-slate-300 mb-2">الوصف</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{book.description}</p>
          </div>

          {/* Borrow / Return buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleBorrow}
              disabled={!isAvailable}
              className={cn(
                'flex-1 font-semibold rounded-lg gap-2',
                isAvailable
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-white/[0.03] text-muted-foreground cursor-not-allowed',
              )}
            >
              <BookCopy className="h-4 w-4" />
              استعارة
            </Button>
            <Button
              onClick={handleReturn}
              disabled={isAllReturned}
              className={cn(
                'flex-1 font-semibold rounded-lg gap-2',
                !isAllReturned
                  ? 'bg-[#D4A574] hover:bg-[#B8895A] text-slate-900'
                  : 'bg-white/[0.03] text-muted-foreground cursor-not-allowed',
              )}
            >
              <ArrowRightLeft className="h-4 w-4" />
              إرجاع
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit Dialog
// ---------------------------------------------------------------------------

interface BookFormData {
  title: string;
  author: string;
  isbn: string;
  category: string;
  publisher: string;
  year: string;
  totalCopies: string;
  location: string;
  coverColor: string;
  description: string;
}

function getDefaultFormData(): BookFormData {
  return {
    title: '',
    author: '',
    isbn: '',
    category: '',
    publisher: '',
    year: new Date().getFullYear().toString(),
    totalCopies: '1',
    location: '',
    coverColor: COVER_COLORS[0],
    description: '',
  };
}

function BookFormDialog({
  book,
  open,
  onOpenChange,
}: {
  book: LibraryBook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addLibraryBook, updateLibraryBook } = useAppStore();
  const isEdit = !!book;

  const [form, setForm] = useState<BookFormData>(getDefaultFormData);

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      requestAnimationFrame(() => {
        if (book) {
          setForm({
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            category: book.category,
            publisher: book.publisher,
            year: book.year.toString(),
            totalCopies: book.totalCopies.toString(),
            location: book.location,
            coverColor: book.coverColor,
            description: book.description,
          });
        } else {
          setForm(getDefaultFormData());
        }
      });
    }
    prevOpenRef.current = open;
  }, [open, book]);

  const updateField = useCallback(<K extends keyof BookFormData>(key: K, value: BookFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.title.trim()) {
      toast.error('يرجى إدخال عنوان الكتاب');
      return;
    }
    if (!form.author.trim()) {
      toast.error('يرجى إدخال اسم المؤلف');
      return;
    }
    if (!form.category) {
      toast.error('يرجى اختيار التصنيف');
      return;
    }
    if (!form.isbn.trim()) {
      toast.error('يرجى إدخال رقم ISBN');
      return;
    }

    const totalCopies = parseInt(form.totalCopies, 10) || 1;
    const year = parseInt(form.year, 10) || new Date().getFullYear();
    const now = new Date().toISOString();

    if (isEdit && book) {
      updateLibraryBook(book.id, {
        title: form.title.trim(),
        author: form.author.trim(),
        isbn: form.isbn.trim(),
        category: form.category,
        publisher: form.publisher.trim(),
        year,
        totalCopies,
        location: form.location.trim(),
        coverColor: form.coverColor,
        description: form.description.trim(),
      });
      toast.success('تم تحديث الكتاب بنجاح');
    } else {
      addLibraryBook({
        id: `book-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: form.title.trim(),
        author: form.author.trim(),
        isbn: form.isbn.trim(),
        category: form.category,
        publisher: form.publisher.trim(),
        year,
        totalCopies,
        availableCopies: totalCopies,
        location: form.location.trim(),
        coverColor: form.coverColor,
        description: form.description.trim(),
        addedBy: 'المدير: أحمد محمد',
        createdAt: now,
      });
      toast.success('تم إضافة الكتاب بنجاح');
    }
    onOpenChange(false);
  }, [form, isEdit, book, addLibraryBook, updateLibraryBook, onOpenChange]);

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
            {isEdit ? 'تعديل الكتاب' : 'إضافة كتاب جديد'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEdit ? `تعديل بيانات كتاب: ${book?.title}` : 'أضف كتاباً جديداً إلى المكتبة'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-1 px-1 flex flex-col gap-4 mt-2">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label className="text-slate-300 text-sm">عنوان الكتاب *</Label>
            <Input
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="أدخل عنوان الكتاب..."
              className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
            />
          </div>

          {/* Author */}
          <div className="flex flex-col gap-2">
            <Label className="text-slate-300 text-sm">المؤلف *</Label>
            <Input
              value={form.author}
              onChange={(e) => updateField('author', e.target.value)}
              placeholder="اسم المؤلف..."
              className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
            />
          </div>

          {/* ISBN */}
          <div className="flex flex-col gap-2">
            <Label className="text-slate-300 text-sm">رقم ISBN *</Label>
            <Input
              value={form.isbn}
              onChange={(e) => updateField('isbn', e.target.value)}
              placeholder="978-..."
              dir="ltr"
              className="text-right bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
            />
          </div>

          {/* Category & Publisher */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label className="text-slate-300 text-sm">التصنيف *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => updateField('category', v)}
              >
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-slate-200">
                  <SelectValue placeholder="اختر التصنيف..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-slate-300 text-sm">دار النشر</Label>
              <Input
                value={form.publisher}
                onChange={(e) => updateField('publisher', e.target.value)}
                placeholder="دار النشر..."
                className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
              />
            </div>
          </div>

          {/* Year & Total Copies */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label className="text-slate-300 text-sm">سنة النشر</Label>
              <Input
                type="number"
                value={form.year}
                onChange={(e) => updateField('year', e.target.value)}
                placeholder="2024"
                dir="ltr"
                className="text-right bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-slate-300 text-sm">عدد النسخ الإجمالي</Label>
              <Input
                type="number"
                min={1}
                value={form.totalCopies}
                onChange={(e) => updateField('totalCopies', e.target.value)}
                placeholder="1"
                dir="ltr"
                className="text-right bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
              />
            </div>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-2">
            <Label className="text-slate-300 text-sm">الموقع / الرف</Label>
            <Input
              value={form.location}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder="مثال: الرف A-1"
              className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
            />
          </div>

          {/* Cover Color */}
          <div className="flex flex-col gap-2">
            <Label className="text-slate-300 text-sm">لون الغلاف</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {COVER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => updateField('coverColor', color)}
                  className={cn(
                    'h-8 w-8 rounded-full transition-all duration-200 border-2',
                    form.coverColor === color
                      ? 'scale-110 border-white shadow-lg'
                      : 'border-transparent hover:scale-105',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label className="text-slate-300 text-sm">الوصف</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="اكتب وصفاً مختصراً للكتاب..."
              className="bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20 min-h-[80px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex-row gap-3 sm:justify-start pt-3 border-t border-white/[0.06] mt-2">
          <Button
            onClick={handleSubmit}
            className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold rounded-lg px-6 gap-2"
          >
            <Save className="h-4 w-4" />
            {isEdit ? 'حفظ التغييرات' : 'إضافة'}
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

function DeleteBookDialog({
  book,
  open,
  onOpenChange,
}: {
  book: LibraryBook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { deleteLibraryBook, addToTrash } = useAppStore();

  const handleDelete = useCallback(() => {
    if (book) {
      addToTrash({
        id: `trash-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        itemType: 'library-book',
        itemId: book.id,
        itemName: book.title,
        deletedBy: 'المدير',
        dataJson: JSON.stringify(book),
        restoredAt: null,
        createdAt: new Date().toISOString(),
      });
      deleteLibraryBook(book.id);
      toast.success('تم حذف الكتاب بنجاح');
      onOpenChange(false);
    }
  }, [book, deleteLibraryBook, addToTrash, onOpenChange]);

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
          <AlertDialogTitle className="text-white text-lg">تأكيد حذف الكتاب</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground leading-relaxed">
            هل أنت متأكد من حذف كتاب{' '}
            <span className="font-semibold text-slate-200">{book?.title}</span>
            {' '}لـ <span className="font-semibold text-slate-200">{book?.author}</span>؟
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
// Book Card (Grid view)
// ---------------------------------------------------------------------------

function BookCard({
  book,
  onView,
  onEdit,
}: {
  book: LibraryBook;
  onView: () => void;
  onEdit: () => void;
}) {
  const isAvailable = book.availableCopies > 0;

  return (
    <div
      className="group relative rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 cursor-pointer"
      style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Cover color strip */}
      <div
        className="h-2 rounded-t-xl w-full"
        style={{ backgroundColor: book.coverColor }}
      />

      <div className="p-4">
        {/* Availability dot */}
        <div className="flex items-center justify-between mb-3">
          <Badge
            variant="outline"
            className="text-xs px-2 py-0.5 rounded-full bg-[#D4A574]/10 text-[#D4A574] border-[#D4A574]/20"
          >
            {book.category}
          </Badge>
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                'h-2 w-2 rounded-full transition-all',
                isAvailable ? 'bg-emerald-500' : 'bg-red-500',
              )}
            />
            <span className={cn('text-xs', isAvailable ? 'text-emerald-400' : 'text-red-400')}>
              {isAvailable ? 'متاح' : 'مستعار بالكامل'}
            </span>
          </div>
        </div>

        {/* Title & Author */}
        <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2 leading-relaxed">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground mb-3 truncate">{book.author}</p>

        {/* Copies count */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <BookCopy className="h-3 w-3" />
            {book.availableCopies}/{book.totalCopies}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {book.location}
          </span>
        </div>

        {/* Action buttons on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-b-xl"
          style={{ backgroundColor: 'rgba(26,26,36,0.95)' }}
        >
          <Button
            onClick={(e) => { e.stopPropagation(); onView(); }}
            size="sm"
            className="flex-1 bg-[#D4A574]/20 hover:bg-[#D4A574]/30 text-[#D4A574] text-xs rounded-lg gap-1 h-8"
          >
            <Eye className="h-3 w-3" />
            عرض
          </Button>
          <Button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            size="sm"
            className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs rounded-lg gap-1 h-8"
          >
            <Pencil className="h-3 w-3" />
            تعديل
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Book Row (List view)
// ---------------------------------------------------------------------------

function BookRow({
  book,
  onView,
  onEdit,
  onDelete,
}: {
  book: LibraryBook;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isAvailable = book.availableCopies > 0;

  return (
    <tr
      className="border-b border-white/[0.04] transition-colors duration-200 hover:bg-white/[0.02] cursor-pointer"
      onClick={onView}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="h-2 w-8 rounded-full shrink-0" style={{ backgroundColor: book.coverColor }} />
          <span className="text-sm font-medium text-white truncate max-w-[200px]">{book.title}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-slate-300">{book.author}</td>
      <td className="py-3 px-4">
        <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full bg-[#D4A574]/10 text-[#D4A574] border-[#D4A574]/20">
          {book.category}
        </Badge>
      </td>
      <td className="py-3 px-4 text-sm text-slate-300 font-mono" dir="ltr">{book.isbn}</td>
      <td className="py-3 px-4 text-sm text-slate-300">{book.year}</td>
      <td className="py-3 px-4 text-sm text-slate-300">{book.location}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className={cn('h-2 w-2 rounded-full', isAvailable ? 'bg-emerald-500' : 'bg-red-500')} />
          <span className="text-sm text-slate-300 tabular-nums">{book.availableCopies}/{book.totalCopies}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <Button
            onClick={(e) => { e.stopPropagation(); onView(); }}
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-[#D4A574] hover:bg-[#D4A574]/10"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-rose-400 hover:bg-rose-400/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-[#D4A574]/10">
        <Library className="h-10 w-10 text-[#D4A574]/60" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-300 mb-1">المكتبة فارغة</h3>
        <p className="text-sm text-muted-foreground">لم تتم إضافة أي كتب بعد. ابدأ بإضافة كتاب جديد.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Library Section
// ---------------------------------------------------------------------------

export default function LibrarySection() {
  const { libraryBooks, setLibraryBooks } = useAppStore();

  const initialized = useRef(false);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('title');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Dialogs
  const [viewBook, setViewBook] = useState<LibraryBook | null>(null);
  const [editBook, setEditBook] = useState<LibraryBook | null>(null);
  const [deleteBook, setDeleteBook] = useState<LibraryBook | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Init mock data
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      if (libraryBooks.length === 0) {
        setLibraryBooks(generateMockBooks());
      }
    }
  }, [libraryBooks.length, setLibraryBooks]);

  // Filter handlers (reset page)
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  }, []);

  const handleAvailabilityChange = useCallback((value: AvailabilityFilter) => {
    setAvailabilityFilter(value);
    setCurrentPage(1);
  }, []);

  // Filtered & sorted
  const filteredBooks = useMemo(() => {
    let result = [...libraryBooks];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.isbn.toLowerCase().includes(q),
      );
    }

    // Category
    if (categoryFilter !== 'all') {
      result = result.filter((b) => b.category === categoryFilter);
    }

    // Availability
    if (availabilityFilter === 'available') {
      result = result.filter((b) => b.availableCopies > 0);
    } else if (availabilityFilter === 'borrowed') {
      result = result.filter((b) => b.availableCopies < b.totalCopies);
    }

    // Sort (list mode)
    if (viewMode === 'list') {
      result.sort((a, b) => {
        let cmp = 0;
        const fieldA = a[sortField as keyof LibraryBook];
        const fieldB = b[sortField as keyof LibraryBook];
        if (typeof fieldA === 'string' && typeof fieldB === 'string') {
          cmp = fieldA.localeCompare(fieldB, 'ar');
        } else if (typeof fieldA === 'number' && typeof fieldB === 'number') {
          cmp = fieldA - fieldB;
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [libraryBooks, searchQuery, categoryFilter, availabilityFilter, viewMode, sortField, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / ITEMS_PER_PAGE));
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBooks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBooks, currentPage]);

  // Stats
  const stats = useMemo(() => {
    const total = libraryBooks.length;
    const available = libraryBooks.filter((b) => b.availableCopies > 0).length;
    const borrowed = total - available;
    const categories = new Set(libraryBooks.map((b) => b.category)).size;
    return { total, available, borrowed, categories };
  }, [libraryBooks]);

  // Sort handler
  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }, [sortField]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Library className="h-6 w-6 text-[#D4A574]" />
            المكتبة
          </h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة الكتب والموارد المكتبية</p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold rounded-lg gap-2"
        >
          <Plus className="h-4 w-4" />
          إضافة كتاب
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="إجمالي الكتب"
          value={stats.total}
          colorClass="text-[#D4A574]"
          bgColor="bg-[#D4A574]/10"
        />
        <StatCard
          icon={BookCopy}
          label="كتب متاحة"
          value={stats.available}
          colorClass="text-emerald-400"
          bgColor="bg-emerald-500/10"
        />
        <StatCard
          icon={ArrowRightLeft}
          label="كتب مستعارة"
          value={stats.borrowed}
          colorClass="text-amber-400"
          bgColor="bg-amber-500/10"
        />
        <StatCard
          icon={Filter}
          label="التصنيفات"
          value={stats.categories}
          colorClass="text-purple-400"
          bgColor="bg-purple-500/10"
        />
      </div>

      {/* Filter Bar */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="ابحث بالعنوان، المؤلف، أو ISBN..."
              className="pr-9 bg-white/[0.03] border-white/[0.08] text-slate-200 placeholder:text-muted-foreground/50 focus:border-[#D4A574]/50 focus:ring-[#D4A574]/20"
            />
          </div>

          {/* Category filter */}
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full md:w-[160px] bg-white/[0.03] border-white/[0.08] text-slate-200">
              <SelectValue placeholder="التصنيف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع التصنيفات</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Availability filter */}
          <Select value={availabilityFilter} onValueChange={(v) => handleAvailabilityChange(v as AvailabilityFilter)}>
            <SelectTrigger className="w-full md:w-[140px] bg-white/[0.03] border-white/[0.08] text-slate-200">
              <SelectValue placeholder="التوفر" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="available">متاح</SelectItem>
              <SelectItem value="borrowed">مستعار</SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-1 border border-white/[0.06]">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'flex items-center justify-center h-8 w-8 rounded-md transition-all duration-200',
                viewMode === 'grid'
                  ? 'bg-[#D4A574]/15 text-[#D4A574]'
                  : 'text-muted-foreground hover:text-slate-300',
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center justify-center h-8 w-8 rounded-md transition-all duration-200',
                viewMode === 'list'
                  ? 'bg-[#D4A574]/15 text-[#D4A574]'
                  : 'text-muted-foreground hover:text-slate-300',
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {libraryBooks.length === 0 ? (
        <EmptyState />
      ) : filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Search className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">لا توجد نتائج مطابقة للبحث</p>
        </div>
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onView={() => setViewBook(book)}
                onEdit={() => setEditBook(book)}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full" dir="rtl">
                <thead>
                  <tr className="border-b border-white/[0.06]" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    {[
                      { key: 'title', label: 'العنوان' },
                      { key: 'author', label: 'المؤلف' },
                      { key: 'category', label: 'التصنيف' },
                      { key: 'isbn', label: 'ISBN' },
                      { key: 'year', label: 'السنة' },
                      { key: 'location', label: 'الموقع' },
                      { key: 'availableCopies', label: 'النسخ' },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="py-3 px-4 text-xs font-medium text-muted-foreground text-right cursor-pointer hover:text-[#D4A574] transition-colors select-none"
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          {sortField === col.key && (
                            <ChevronLeft className={cn('h-3 w-3 transition-transform', sortDir === 'desc' && 'rotate-180')} />
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="py-3 px-4 text-xs font-medium text-muted-foreground text-right">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBooks.map((book) => (
                    <BookRow
                      key={book.id}
                      book={book}
                      onView={() => setViewBook(book)}
                      onEdit={() => setEditBook(book)}
                      onDelete={() => setDeleteBook(book)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            variant="outline"
            className="h-9 px-3 border-white/[0.08] text-slate-300 hover:bg-white/[0.05] rounded-lg disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // Show first, last, current, and adjacent pages
                if (page === 1 || page === totalPages) return true;
                if (Math.abs(page - currentPage) <= 1) return true;
                return false;
              })
              .reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
                if (idx > 0) {
                  const prev = arr[idx - 1];
                  if (page - prev > 1) acc.push('ellipsis');
                }
                acc.push(page);
                return acc;
              }, [])
              .map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">...</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setCurrentPage(item)}
                    className={cn(
                      'h-9 w-9 rounded-lg text-sm font-medium transition-all duration-200',
                      currentPage === item
                        ? 'bg-[#D4A574] text-slate-900'
                        : 'text-slate-300 hover:bg-white/[0.05]',
                    )}
                  >
                    {item}
                  </button>
                ),
              )}
          </div>

          <Button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
            className="h-9 px-3 border-white/[0.08] text-slate-300 hover:bg-white/[0.05] rounded-lg disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* View Dialog */}
      <ViewBookDialog
        book={viewBook}
        open={!!viewBook}
        onOpenChange={(open) => { if (!open) setViewBook(null); }}
      />

      {/* Add Dialog */}
      <BookFormDialog
        book={null}
        open={addOpen}
        onOpenChange={setAddOpen}
      />

      {/* Edit Dialog */}
      <BookFormDialog
        book={editBook}
        open={!!editBook}
        onOpenChange={(open) => { if (!open) setEditBook(null); }}
      />

      {/* Delete Dialog */}
      <DeleteBookDialog
        book={deleteBook}
        open={!!deleteBook}
        onOpenChange={(open) => { if (!open) setDeleteBook(null); }}
      />
    </div>
  );
}
