'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Wallet,
  DollarSign,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Eye,
  Pencil,
  Trash2,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  FileDown,
  ArrowUpDown,
  TrendingUp,
  Receipt,
  CalendarClock,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { FeeRecord } from '@/lib/types';
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

const FEE_TYPE_LABELS: Record<FeeRecord['feeType'], string> = {
  tuition: 'رسوم دراسية',
  transportation: 'نقل',
  books: 'كتب',
  activities: 'أنشطة',
  lab: 'مختبر',
  other: 'أخرى',
};

const FEE_TYPE_OPTIONS: { value: FeeRecord['feeType']; label: string }[] = [
  { value: 'tuition', label: 'رسوم دراسية' },
  { value: 'transportation', label: 'نقل' },
  { value: 'books', label: 'كتب' },
  { value: 'activities', label: 'أنشطة' },
  { value: 'lab', label: 'مختبر' },
  { value: 'other', label: 'أخرى' },
];

const STATUS_LABELS: Record<FeeRecord['status'], string> = {
  paid: 'مدفوع',
  partial: 'جزئي',
  unpaid: 'غير مدفوع',
  overdue: 'متأخر',
};

const STATUS_COLORS: Record<FeeRecord['status'], string> = {
  paid: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20',
  partial: 'bg-amber-500/15 text-amber-400 ring-amber-500/20',
  unpaid: 'bg-sky-500/15 text-sky-400 ring-sky-500/20',
  overdue: 'bg-rose-500/15 text-rose-400 ring-rose-500/20',
};

const STATUS_DOT_COLORS: Record<FeeRecord['status'], string> = {
  paid: 'bg-emerald-400',
  partial: 'bg-amber-400',
  unpaid: 'bg-sky-400',
  overdue: 'bg-rose-400',
};

const ITEMS_PER_PAGE = 10;

// Sort icon rendered as a function (not a component) to avoid static-component lint rule
function renderSortIcon(activeField: string, field: string, sortDir: 'asc' | 'desc') {
  if (activeField !== field) return <ArrowUpDown size={14} className="text-[#6B6B76]" />;
  return sortDir === 'asc' ? (
    <ChevronLeft size={14} className="text-[#D4A574]" />
  ) : (
    <ChevronRight size={14} className="text-[#D4A574]" />
  );
}

const STUDENT_NAMES = [
  'أحمد محمد العلي',
  'فاطمة سعيد الحربي',
  'عبدالله خالد القحطاني',
  'نورة إبراهيم الشمري',
  'سعود عبدالرحمن الدوسري',
  'ريم فهد العتيبي',
  'محمد ناصر السبيعي',
  'لمياء عبدالعزيز المطيري',
  'خالد سلطان الحميدي',
  'سارة يوسف الغامدي',
  'عمر حسن الزهراني',
  'هند ماجد البلوي',
  'ياسر عايض العنزي',
  'منيرة صالح الرشيدي',
  'تركي فصيل العمري',
  'أمل عطالله السلمي',
  'بدر فيصل الشهري',
  'وجدان راشد المالكي',
];

const CLASS_NAMES = [
  'الصف الأول - أ',
  'الصف الثاني - ب',
  'الصف الثالث - أ',
  'الصف الرابع - ج',
  'الصف الخامس - ب',
  'الصف السادس - أ',
];

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

function generateMockFees(): FeeRecord[] {
  const feeTypes: FeeRecord['feeType'][] = ['tuition', 'transportation', 'books', 'activities', 'lab', 'other'];
  const statuses: FeeRecord['status'][] = ['paid', 'partial', 'unpaid', 'overdue'];

  return [
    { id: 'fee-001', studentId: 's-01', studentName: STUDENT_NAMES[0], classId: 'c-1', className: CLASS_NAMES[0], feeType: 'tuition', amount: 15000, paidAmount: 15000, status: 'paid', dueDate: '2025-01-15', paidDate: '2025-01-10', notes: 'دفع كامل الفصل الأول', createdAt: '2024-12-20T10:00:00Z' },
    { id: 'fee-002', studentId: 's-02', studentName: STUDENT_NAMES[1], classId: 'c-1', className: CLASS_NAMES[0], feeType: 'tuition', amount: 15000, paidAmount: 7500, status: 'partial', dueDate: '2025-01-15', paidDate: '2025-01-14', notes: 'القسط الأول', createdAt: '2024-12-20T10:05:00Z' },
    { id: 'fee-003', studentId: 's-03', studentName: STUDENT_NAMES[2], classId: 'c-2', className: CLASS_NAMES[1], feeType: 'transportation', amount: 3000, paidAmount: 0, status: 'overdue', dueDate: '2024-12-01', paidDate: null, notes: 'رسوم النقل الفصلي', createdAt: '2024-11-15T09:00:00Z' },
    { id: 'fee-004', studentId: 's-04', studentName: STUDENT_NAMES[3], classId: 'c-2', className: CLASS_NAMES[1], feeType: 'books', amount: 2500, paidAmount: 2500, status: 'paid', dueDate: '2025-02-01', paidDate: '2025-01-28', notes: 'كتب المنهج الجديد', createdAt: '2025-01-10T08:30:00Z' },
    { id: 'fee-005', studentId: 's-05', studentName: STUDENT_NAMES[4], classId: 'c-3', className: CLASS_NAMES[2], feeType: 'tuition', amount: 18000, paidAmount: 9000, status: 'partial', dueDate: '2025-02-01', paidDate: '2025-01-30', notes: 'رسوم فصلين - القسط الأول', createdAt: '2025-01-05T11:00:00Z' },
    { id: 'fee-006', studentId: 's-06', studentName: STUDENT_NAMES[5], classId: 'c-3', className: CLASS_NAMES[2], feeType: 'activities', amount: 1200, paidAmount: 0, status: 'unpaid', dueDate: '2025-03-01', paidDate: null, notes: 'أنشطة رياضية وثقافية', createdAt: '2025-02-01T09:15:00Z' },
    { id: 'fee-007', studentId: 's-07', studentName: STUDENT_NAMES[6], classId: 'c-4', className: CLASS_NAMES[3], feeType: 'lab', amount: 2000, paidAmount: 2000, status: 'paid', dueDate: '2025-01-20', paidDate: '2025-01-18', notes: 'رسوم المختبر العلمي', createdAt: '2025-01-08T14:00:00Z' },
    { id: 'fee-008', studentId: 's-08', studentName: STUDENT_NAMES[7], classId: 'c-4', className: CLASS_NAMES[3], feeType: 'tuition', amount: 15000, paidAmount: 0, status: 'overdue', dueDate: '2024-11-15', paidDate: null, notes: 'رسوم متأخرة - تم التواصل مع ولي الأمر', createdAt: '2024-10-20T10:30:00Z' },
    { id: 'fee-009', studentId: 's-09', studentName: STUDENT_NAMES[8], classId: 'c-5', className: CLASS_NAMES[4], feeType: 'transportation', amount: 3000, paidAmount: 3000, status: 'paid', dueDate: '2025-02-15', paidDate: '2025-02-12', notes: 'نقل الفصل الثاني', createdAt: '2025-01-25T08:00:00Z' },
    { id: 'fee-010', studentId: 's-10', studentName: STUDENT_NAMES[9], classId: 'c-5', className: CLASS_NAMES[4], feeType: 'other', amount: 500, paidAmount: 500, status: 'paid', dueDate: '2025-01-25', paidDate: '2025-01-24', notes: 'رسوم إصدار شهادة', createdAt: '2025-01-20T16:00:00Z' },
    { id: 'fee-011', studentId: 's-11', studentName: STUDENT_NAMES[10], classId: 'c-6', className: CLASS_NAMES[5], feeType: 'tuition', amount: 16000, paidAmount: 4000, status: 'partial', dueDate: '2025-02-20', paidDate: '2025-02-18', notes: 'دفعات مقسطة', createdAt: '2025-02-01T07:45:00Z' },
    { id: 'fee-012', studentId: 's-12', studentName: STUDENT_NAMES[11], classId: 'c-1', className: CLASS_NAMES[0], feeType: 'books', amount: 1800, paidAmount: 0, status: 'unpaid', dueDate: '2025-03-15', paidDate: null, notes: 'كتب إضافية للغة الإنجليزية', createdAt: '2025-02-10T12:00:00Z' },
    { id: 'fee-013', studentId: 's-13', studentName: STUDENT_NAMES[12], classId: 'c-3', className: CLASS_NAMES[2], feeType: 'activities', amount: 2000, paidAmount: 2000, status: 'paid', dueDate: '2025-01-30', paidDate: '2025-01-25', notes: 'رحلة علمية ومصروفات النشاط', createdAt: '2025-01-15T13:30:00Z' },
    { id: 'fee-014', studentId: 's-14', studentName: STUDENT_NAMES[13], classId: 'c-2', className: CLASS_NAMES[1], feeType: 'tuition', amount: 15000, paidAmount: 0, status: 'overdue', dueDate: '2024-12-20', paidDate: null, notes: 'لم يتم السداد بعد - إرسال إنذار', createdAt: '2024-12-01T10:00:00Z' },
    { id: 'fee-015', studentId: 's-15', studentName: STUDENT_NAMES[14], classId: 'c-4', className: CLASS_NAMES[3], feeType: 'lab', amount: 1500, paidAmount: 1500, status: 'paid', dueDate: '2025-02-10', paidDate: '2025-02-08', notes: 'مختبر الحاسب الآلي', createdAt: '2025-02-01T09:00:00Z' },
    { id: 'fee-016', studentId: 's-16', studentName: STUDENT_NAMES[15], classId: 'c-6', className: CLASS_NAMES[5], feeType: 'transportation', amount: 3500, paidAmount: 1750, status: 'partial', dueDate: '2025-02-25', paidDate: '2025-02-23', notes: 'مسار بعيد - رسوم إضافية', createdAt: '2025-02-15T11:00:00Z' },
    { id: 'fee-017', studentId: 's-01', studentName: STUDENT_NAMES[0], classId: 'c-1', className: CLASS_NAMES[0], feeType: 'tuition', amount: 15000, paidAmount: 0, status: 'unpaid', dueDate: '2025-04-01', paidDate: null, notes: 'رسوم الفصل الثاني', createdAt: '2025-03-01T08:00:00Z' },
    { id: 'fee-018', studentId: 's-17', studentName: STUDENT_NAMES[16], classId: 'c-5', className: CLASS_NAMES[4], feeType: 'other', amount: 800, paidAmount: 800, status: 'paid', dueDate: '2025-01-28', paidDate: '2025-01-27', notes: 'رسوم زي زي المدرسة', createdAt: '2025-01-22T10:00:00Z' },
  ];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EPS = 1e-9;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FeesSection() {
  const { fees, setFees, addFee, updateFee, deleteFee, addToTrash, students, classes } = useAppStore();

  // Mock data seeding with useRef guard
  const seededRef = useRef(false);
  useEffect(() => {
    if (!seededRef.current && fees.length === 0) {
      seededRef.current = true;
      setFees(generateMockFees());
    }
  }, [fees.length, setFees]);

  // ---- Local State ----
  const [searchQuery, setSearchQuery] = useState('');
  const [feeTypeFilter, setFeeTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'studentName' | 'feeType' | 'amount' | 'paidAmount' | 'status' | 'dueDate'>('dueDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    classId: '',
    className: '',
    feeType: 'tuition' as FeeRecord['feeType'],
    amount: '',
    paidAmount: '0',
    status: 'unpaid' as FeeRecord['status'],
    dueDate: '',
    notes: '',
  });

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState('');

  // ---- Computed values ----
  const totalFees = useMemo(
    () => fees.reduce((sum, f) => sum + f.amount, 0),
    [fees],
  );

  const totalCollected = useMemo(
    () => fees.reduce((sum, f) => sum + f.paidAmount, 0),
    [fees],
  );

  const totalOutstanding = useMemo(
    () => Math.max(EPS, totalFees - totalCollected),
    [totalFees, totalCollected],
  );

  const overdueCount = useMemo(
    () => fees.filter((f) => f.status === 'overdue').length,
    [fees],
  );

  const collectionPercent = useMemo(
    () => totalFees > 0 ? Math.round(Math.max(EPS, (totalCollected / Math.max(EPS, totalFees)) * 100) * 100) / 100 : 0,
    [totalCollected, totalFees],
  );

  // Unique classes list from fees
  const uniqueClasses = useMemo(() => {
    const set = new Set<string>();
    fees.forEach((f) => { if (f.className) set.add(f.className); });
    return Array.from(set).sort();
  }, [fees]);

  // ---- Filtering & Sorting ----
  const filteredFees = useMemo(() => {
    let result = [...fees];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (f) =>
          f.studentName?.toLowerCase().includes(q) ||
          f.className?.toLowerCase().includes(q) ||
          f.notes.toLowerCase().includes(q) ||
          FEE_TYPE_LABELS[f.feeType].includes(q) ||
          STATUS_LABELS[f.status].includes(q),
      );
    }

    // Fee type filter
    if (feeTypeFilter !== 'all') {
      result = result.filter((f) => f.feeType === feeTypeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((f) => f.status === statusFilter);
    }

    // Class filter
    if (classFilter !== 'all') {
      result = result.filter((f) => f.className === classFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'studentName':
          cmp = (a.studentName ?? '').localeCompare(b.studentName ?? '', 'ar');
          break;
        case 'feeType':
          cmp = FEE_TYPE_LABELS[a.feeType].localeCompare(FEE_TYPE_LABELS[b.feeType], 'ar');
          break;
        case 'amount':
          cmp = a.amount - b.amount;
          break;
        case 'paidAmount':
          cmp = a.paidAmount - b.paidAmount;
          break;
        case 'status':
          cmp = STATUS_LABELS[a.status].localeCompare(STATUS_LABELS[b.status], 'ar');
          break;
        case 'dueDate':
          cmp = a.dueDate.localeCompare(b.dueDate);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [fees, searchQuery, feeTypeFilter, statusFilter, classFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredFees.length / ITEMS_PER_PAGE));

  // Clamp current page if filters reduced result count
  const effectivePage = Math.min(currentPage, Math.max(1, totalPages));

  const paginatedFees = useMemo(
    () => filteredFees.slice((effectivePage - 1) * ITEMS_PER_PAGE, effectivePage * ITEMS_PER_PAGE),
    [filteredFees, effectivePage],
  );

  // ---- Handlers ----
  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  }, []);
  const handleFeeTypeChange = useCallback((v: string) => { setFeeTypeFilter(v); setCurrentPage(1); }, []);
  const handleStatusChange = useCallback((v: string) => { setStatusFilter(v); setCurrentPage(1); }, []);
  const handleClassChange = useCallback((v: string) => { setClassFilter(v); setCurrentPage(1); }, []);
  const handleSort = useCallback((field: typeof sortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return field;
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      studentId: '',
      studentName: '',
      classId: '',
      className: '',
      feeType: 'tuition',
      amount: '',
      paidAmount: '0',
      status: 'unpaid',
      dueDate: '',
      notes: '',
    });
  }, []);

  const openAddDialog = useCallback(() => {
    resetForm();
    setShowAddDialog(true);
  }, [resetForm]);

  const openEditDialog = useCallback((fee: FeeRecord) => {
    setSelectedFee(fee);
    setFormData({
      studentId: fee.studentId,
      studentName: fee.studentName ?? '',
      classId: fee.classId ?? '',
      className: fee.className ?? '',
      feeType: fee.feeType,
      amount: String(fee.amount),
      paidAmount: String(fee.paidAmount),
      status: fee.status,
      dueDate: fee.dueDate,
      notes: fee.notes,
    });
    setShowEditDialog(true);
  }, []);

  const openViewDialog = useCallback((fee: FeeRecord) => {
    setSelectedFee(fee);
    setShowViewDialog(true);
  }, []);

  const openPaymentDialog = useCallback((fee: FeeRecord) => {
    setSelectedFee(fee);
    setPaymentAmount('');
    setShowPaymentDialog(true);
  }, []);

  const openDeleteDialog = useCallback((fee: FeeRecord) => {
    setSelectedFee(fee);
    setShowDeleteDialog(true);
  }, []);

  const handleAddSubmit = useCallback(() => {
    const amount = parseFloat(formData.amount);
    if (!formData.studentName || isNaN(amount) || amount <= 0 || !formData.dueDate) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    const paidAmt = parseFloat(formData.paidAmount) || 0;
    const newStatus: FeeRecord['status'] = paidAmt >= amount
      ? 'paid'
      : paidAmt > 0
        ? 'partial'
        : formData.status === 'overdue'
          ? 'overdue'
          : 'unpaid';

    const newFee: FeeRecord = {
      id: `fee-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      studentId: formData.studentId || `s-auto-${Date.now()}`,
      studentName: formData.studentName,
      classId: formData.classId || null,
      className: formData.className || null,
      feeType: formData.feeType,
      amount,
      paidAmount: paidAmt,
      status: newStatus,
      dueDate: formData.dueDate,
      paidDate: paidAmt >= amount ? new Date().toISOString().split('T')[0] : null,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };
    addFee(newFee);
    setShowAddDialog(false);
    resetForm();
    toast.success('تمت إضافة الرسوم بنجاح');
  }, [formData, addFee, resetForm]);

  const handleEditSubmit = useCallback(() => {
    if (!selectedFee) return;
    const amount = parseFloat(formData.amount);
    if (!formData.studentName || isNaN(amount) || amount <= 0 || !formData.dueDate) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    const paidAmt = parseFloat(formData.paidAmount) || 0;
    const newStatus: FeeRecord['status'] = paidAmt >= amount
      ? 'paid'
      : paidAmt > 0
        ? 'partial'
        : formData.status === 'overdue'
          ? 'overdue'
          : 'unpaid';

    updateFee(selectedFee.id, {
      studentId: formData.studentId,
      studentName: formData.studentName,
      classId: formData.classId || null,
      className: formData.className || null,
      feeType: formData.feeType,
      amount,
      paidAmount: paidAmt,
      status: newStatus,
      dueDate: formData.dueDate,
      paidDate: paidAmt >= amount ? (selectedFee.paidDate ?? new Date().toISOString().split('T')[0]) : selectedFee.paidDate,
      notes: formData.notes,
    });
    setShowEditDialog(false);
    setSelectedFee(null);
    toast.success('تم تحديث الرسوم بنجاح');
  }, [selectedFee, formData, updateFee]);

  const handlePaymentSubmit = useCallback(() => {
    if (!selectedFee) return;
    const payment = parseFloat(paymentAmount);
    if (isNaN(payment) || payment <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    const remaining = selectedFee.amount - selectedFee.paidAmount;
    if (payment > remaining + 0.01) {
      toast.error(`المبلغ أكبر من المتبقي (${formatCurrency(remaining)})`);
      return;
    }
    const newPaid = selectedFee.paidAmount + payment;
    const newStatus: FeeRecord['status'] = newPaid >= selectedFee.amount
      ? 'paid'
      : 'partial';

    updateFee(selectedFee.id, {
      paidAmount: newPaid,
      status: newStatus,
      paidDate: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : (selectedFee.paidDate ?? new Date().toISOString().split('T')[0]),
    });
    setShowPaymentDialog(false);
    setSelectedFee(null);
    setPaymentAmount('');
    toast.success(`تم تسجيل دفعة بقيمة ${formatCurrency(payment)} بنجاح`);
  }, [selectedFee, paymentAmount, updateFee]);

  const handleDelete = useCallback(() => {
    if (!selectedFee) return;
    addToTrash({
      id: `trash-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      itemType: 'library-book',
      itemId: selectedFee.id,
      itemName: selectedFee.studentName ?? 'رسوم',
      deletedBy: 'المدير',
      dataJson: JSON.stringify(selectedFee),
      restoredAt: null,
      createdAt: new Date().toISOString(),
    });
    deleteFee(selectedFee.id);
    setShowDeleteDialog(false);
    setSelectedFee(null);
    toast.success('تم حذف الرسوم بنجاح');
  }, [selectedFee, deleteFee, addToTrash]);

  const handleExportCSV = useCallback(() => {
    exportToCSV(
      fees.map((f) => ({
        studentName: f.studentName ?? '',
        className: f.className ?? '',
        feeType: FEE_TYPE_LABELS[f.feeType],
        amount: f.amount,
        paidAmount: f.paidAmount,
        remaining: Math.max(0, f.amount - f.paidAmount),
        status: STATUS_LABELS[f.status],
        dueDate: f.dueDate,
        paidDate: f.paidDate ?? '—',
        notes: f.notes,
      })),
      'fees-export',
      [
        { key: 'studentName', label: 'اسم الطالب' },
        { key: 'className', label: 'الصف' },
        { key: 'feeType', label: 'نوع الرسوم' },
        { key: 'amount', label: 'المبلغ' },
        { key: 'paidAmount', label: 'المدفوع' },
        { key: 'remaining', label: 'المتبقي' },
        { key: 'status', label: 'الحالة' },
        { key: 'dueDate', label: 'تاريخ الاستحقاق' },
        { key: 'paidDate', label: 'تاريخ الدفع' },
        { key: 'notes', label: 'ملاحظات' },
      ],
    );
    toast.success('تم تصدير بيانات الرسوم بنجاح');
  }, [fees]);

  // ---- Render ----
  return (
    <div dir="rtl" className="space-y-6">
      {/* ===== Section Header ===== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#E8E8ED] flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4A574]/10 text-[#D4A574]">
              <Wallet size={22} />
            </span>
            إدارة الرسوم والمدفوعات
          </h1>
          <p className="mt-1 text-sm text-[#6B6B76]">تتبع الرسوم الدراسية والمدفوعات والحسابات المالية</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-[#D4A574]/30 text-[#D4A574] hover:bg-[#D4A574]/10 gap-2"
            onClick={handleExportCSV}
          >
            <FileDown size={16} />
            تصدير CSV
          </Button>
          <Button
            size="sm"
            className="btn-amber-glow gap-2 bg-[#D4A574] text-[#121218] hover:bg-[#C49564] font-semibold"
            onClick={openAddDialog}
          >
            <Plus size={16} />
            إضافة رسوم جديدة
          </Button>
        </div>
      </div>

      {/* ===== Summary Stat Cards ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Fees */}
        <div className="glass-card-elevated rounded-2xl p-5 card-interactive animate-fade-in-up" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4A574]/10 text-[#D4A574]">
              <DollarSign size={20} />
            </span>
            <span className="text-xs text-[#6B6B76] bg-[#1A1A24] px-2 py-0.5 rounded-full">إجمالي</span>
          </div>
          <p className="text-sm text-[#6B6B76] mb-1">إجمالي الرسوم</p>
          <p className="text-xl font-bold text-[#E8E8ED]">{formatCurrency(totalFees)}</p>
        </div>

        {/* Collected */}
        <div className="glass-card-elevated rounded-2xl p-5 card-interactive animate-fade-in-up" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle size={20} />
            </span>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {collectionPercent}%
            </span>
          </div>
          <p className="text-sm text-[#6B6B76] mb-1">المحصل</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalCollected)}</p>
        </div>

        {/* Outstanding */}
        <div className="glass-card-elevated rounded-2xl p-5 card-interactive animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <CreditCard size={20} />
            </span>
            <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">متبقي</span>
          </div>
          <p className="text-sm text-[#6B6B76] mb-1">غير المحصل</p>
          <p className="text-xl font-bold text-amber-400">{formatCurrency(totalOutstanding)}</p>
        </div>

        {/* Overdue */}
        <div className="glass-card-elevated rounded-2xl p-5 card-interactive animate-fade-in-up" style={{ animationDelay: '180ms' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
              <AlertCircle size={20} />
            </span>
            <span className="text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">تنبيه</span>
          </div>
          <p className="text-sm text-[#6B6B76] mb-1">متأخرات</p>
          <p className="text-xl font-bold text-rose-400">{overdueCount} <span className="text-sm font-normal text-[#6B6B76]">سجل</span></p>
        </div>
      </div>

      {/* ===== Collection Progress Bar ===== */}
      <div className="glass-card-elevated rounded-2xl p-5 corner-accent">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[#D4A574]" />
            <span className="text-sm font-semibold text-[#E8E8ED]">نسبة التحصيل</span>
          </div>
          <span className="text-sm font-bold text-[#D4A574]">{collectionPercent}%</span>
        </div>
        <div className="relative h-4 w-full overflow-hidden rounded-full bg-[#121218]">
          <div
            className="absolute inset-y-0 right-0 rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.min(100, collectionPercent)}%`,
              background: 'linear-gradient(to left, #D4A574, #E8C9A8, #D4A574)',
              boxShadow: '0 0 12px rgba(212, 165, 116, 0.3)',
            }}
          />
          {/* Shimmer effect */}
          <div
            className="absolute inset-y-0 right-0 rounded-full opacity-30"
            style={{
              width: `${Math.min(100, collectionPercent)}%`,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite',
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-[#6B6B76]">
          <span>المحصل: {formatCurrency(totalCollected)}</span>
          <span>الإجمالي: {formatCurrency(totalFees)}</span>
        </div>
      </div>

      {/* ===== Filter Bar ===== */}
      <div className="glass-card-elevated rounded-2xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B76] pointer-events-none" />
            <input
              type="text"
              placeholder="بحث عن طالب أو صف..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#121218] py-2.5 pr-10 pl-4 text-sm text-[#E8E8ED] placeholder:text-[#6B6B76] outline-none transition-all focus:border-[#D4A574]/40 focus:ring-2 focus:ring-[#D4A574]/15"
            />
          </div>

          {/* Fee Type Filter */}
          <Select value={feeTypeFilter} onValueChange={handleFeeTypeChange}>
            <SelectTrigger className="rounded-xl border-[rgba(255,255,255,0.06)] bg-[#121218] text-sm text-[#E8E8ED]">
              <SelectValue placeholder="نوع الرسوم" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-[rgba(255,255,255,0.08)]">
              <SelectItem value="all">كل الأنواع</SelectItem>
              {FEE_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="rounded-xl border-[rgba(255,255,255,0.06)] bg-[#121218] text-sm text-[#E8E8ED]">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-[rgba(255,255,255,0.08)]">
              <SelectItem value="all">كل الحالات</SelectItem>
              {(Object.keys(STATUS_LABELS) as FeeRecord['status'][]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Class Filter */}
          <Select value={classFilter} onValueChange={handleClassChange}>
            <SelectTrigger className="rounded-xl border-[rgba(255,255,255,0.06)] bg-[#121218] text-sm text-[#E8E8ED]">
              <SelectValue placeholder="الصف" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-[rgba(255,255,255,0.08)]">
              <SelectItem value="all">كل الصفوف</SelectItem>
              {uniqueClasses.map((cls) => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ===== Fees Table ===== */}
      <div className="glass-card-elevated rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[rgba(255,255,255,0.06)] hover:bg-transparent">
                <TableHead className="text-[#6B6B76] font-semibold text-xs">
                  <button className="flex items-center gap-1.5 hover:text-[#D4A574] transition-colors" onClick={() => handleSort('studentName')}>
                    الطالب {renderSortIcon(sortField, 'studentName', sortDir)}
                  </button>
                </TableHead>
                <TableHead className="text-[#6B6B76] font-semibold text-xs">
                  <button className="flex items-center gap-1.5 hover:text-[#D4A574] transition-colors" onClick={() => handleSort('feeType')}>
                    النوع {renderSortIcon(sortField, 'feeType', sortDir)}
                  </button>
                </TableHead>
                <TableHead className="text-[#6B6B76] font-semibold text-xs">
                  <button className="flex items-center gap-1.5 hover:text-[#D4A574] transition-colors" onClick={() => handleSort('amount')}>
                    المبلغ {renderSortIcon(sortField, 'amount', sortDir)}
                  </button>
                </TableHead>
                <TableHead className="text-[#6B6B76] font-semibold text-xs">
                  <button className="flex items-center gap-1.5 hover:text-[#D4A574] transition-colors" onClick={() => handleSort('paidAmount')}>
                    المدفوع {renderSortIcon(sortField, 'paidAmount', sortDir)}
                  </button>
                </TableHead>
                <TableHead className="text-[#6B6B76] font-semibold text-xs">
                  <button className="flex items-center gap-1.5 hover:text-[#D4A574] transition-colors" onClick={() => handleSort('status')}>
                    الحالة {renderSortIcon(sortField, 'status', sortDir)}
                  </button>
                </TableHead>
                <TableHead className="text-[#6B6B76] font-semibold text-xs">
                  <button className="flex items-center gap-1.5 hover:text-[#D4A574] transition-colors" onClick={() => handleSort('dueDate')}>
                    الاستحقاق {renderSortIcon(sortField, 'dueDate', sortDir)}
                  </button>
                </TableHead>
                <TableHead className="text-[#6B6B76] font-semibold text-xs text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="data-empty-state">
                      <div className="data-empty-state-icon">
                        <Receipt size={48} strokeWidth={1.2} />
                      </div>
                      <h3 className="data-empty-state-title">لا توجد سجلات رسوم</h3>
                      <p className="data-empty-state-desc">لم يتم العثور على سجلات تطابق معايير البحث</p>
                      <button
                        className="data-empty-state-btn mt-2"
                        onClick={() => { handleSearchChange(''); handleFeeTypeChange('all'); handleStatusChange('all'); handleClassChange('all'); }}
                      >
                        إعادة تعيين الفلاتر
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFees.map((fee) => {
                  const remaining = Math.max(0, fee.amount - fee.paidAmount);
                  const payPercent = fee.amount > 0 ? Math.round(Math.max(EPS, (fee.paidAmount / Math.max(EPS, fee.amount)) * 100)) : 0;
                  return (
                    <TableRow key={fee.id} className="data-row-hover border-b border-[rgba(255,255,255,0.03)]">
                      <TableCell className="py-3.5">
                        <div>
                          <p className="text-sm font-medium text-[#E8E8ED]">{fee.studentName ?? '—'}</p>
                          <p className="text-xs text-[#6B6B76]">{fee.className ?? '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className="text-sm text-[#C4C4D4]">{FEE_TYPE_LABELS[fee.feeType]}</span>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className="text-sm font-semibold text-[#E8E8ED]">{formatCurrency(fee.amount)}</span>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="space-y-1">
                          <span className={cn(
                            'text-sm font-medium',
                            fee.status === 'paid' ? 'text-emerald-400' : fee.status === 'partial' ? 'text-amber-400' : 'text-[#6B6B76]',
                          )}>
                            {formatCurrency(fee.paidAmount)}
                          </span>
                          {fee.status === 'partial' && (
                            <div className="flex items-center gap-1.5">
                              <div className="h-1 w-16 rounded-full bg-[#121218] overflow-hidden">
                                <div className="h-full rounded-full bg-amber-400/60" style={{ width: `${payPercent}%` }} />
                              </div>
                              <span className="text-[10px] text-[#6B6B76]">{payPercent}%</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge variant="outline" className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full gap-1.5', STATUS_COLORS[fee.status])}>
                          <span className={cn('inline-block h-1.5 w-1.5 rounded-full', STATUS_DOT_COLORS[fee.status])} />
                          {STATUS_LABELS[fee.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1.5 text-sm text-[#C4C4D4]">
                          <CalendarClock size={14} className="text-[#6B6B76]" />
                          {formatDate(fee.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openViewDialog(fee)}
                            title="عرض"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6B76] hover:text-sky-400 hover:bg-sky-500/10 transition-all"
                          >
                            <Eye size={15} />
                          </button>
                          {(fee.status === 'unpaid' || fee.status === 'partial' || fee.status === 'overdue') && (
                            <button
                              onClick={() => openPaymentDialog(fee)}
                              title="تسجيل دفعة"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6B76] hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                            >
                              <CreditCard size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => openEditDialog(fee)}
                            title="تعديل"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6B76] hover:text-[#D4A574] hover:bg-[#D4A574]/10 transition-all"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => openDeleteDialog(fee)}
                            title="حذف"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6B76] hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* ===== Pagination ===== */}
        {filteredFees.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[rgba(255,255,255,0.06)]">
            <span className="text-xs text-[#6B6B76]">
              عرض {((effectivePage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(effectivePage * ITEMS_PER_PAGE, filteredFees.length)} من {filteredFees.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={effectivePage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6B76] hover:text-[#E8E8ED] hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-all',
                    effectivePage === page
                      ? 'bg-[#D4A574] text-[#121218]'
                      : 'text-[#6B6B76] hover:text-[#E8E8ED] hover:bg-[rgba(255,255,255,0.04)]',
                  )}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={effectivePage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6B76] hover:text-[#E8E8ED] hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== Add/Edit Fee Dialog ===== */}
      <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) { setShowAddDialog(false); setShowEditDialog(false); setSelectedFee(null); resetForm(); }
      }}>
        <DialogContent className="bg-[#1A1A24] border-[rgba(255,255,255,0.08)] text-[#E8E8ED] max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#E8E8ED] flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4A574]/10 text-[#D4A574]">
                <Wallet size={18} />
              </span>
              {showEditDialog ? 'تعديل الرسوم' : 'إضافة رسوم جديدة'}
            </DialogTitle>
            <DialogDescription className="text-[#6B6B76]">
              {showEditDialog ? 'قم بتعديل بيانات الرسوم' : 'أدخل بيانات الرسوم الجديدة'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Student Name */}
            <div className="space-y-2">
              <Label className="text-sm text-[#C4C4D4]">اسم الطالب *</Label>
              <Input
                value={formData.studentName}
                onChange={(e) => setFormData((prev) => ({ ...prev, studentName: e.target.value }))}
                placeholder="أدخل اسم الطالب"
                className="border-[rgba(255,255,255,0.06)] bg-[#121218] text-[#E8E8ED] placeholder:text-[#6B6B76] rounded-xl"
              />
            </div>

            {/* Class */}
            <div className="space-y-2">
              <Label className="text-sm text-[#C4C4D4]">الصف</Label>
              <Input
                value={formData.className}
                onChange={(e) => setFormData((prev) => ({ ...prev, className: e.target.value }))}
                placeholder="أدخل اسم الصف"
                className="border-[rgba(255,255,255,0.06)] bg-[#121218] text-[#E8E8ED] placeholder:text-[#6B6B76] rounded-xl"
              />
            </div>

            {/* Fee Type + Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm text-[#C4C4D4]">نوع الرسوم *</Label>
                <Select
                  value={formData.feeType}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, feeType: v as FeeRecord['feeType'] }))}
                >
                  <SelectTrigger className="rounded-xl border-[rgba(255,255,255,0.06)] bg-[#121218] text-[#E8E8ED]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A24] border-[rgba(255,255,255,0.08)]">
                    {FEE_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-[#C4C4D4]">المبلغ (ر.س) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="0"
                  className="border-[rgba(255,255,255,0.06)] bg-[#121218] text-[#E8E8ED] placeholder:text-[#6B6B76] rounded-xl"
                />
              </div>
            </div>

            {/* Paid Amount + Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm text-[#C4C4D4]">المدفوع (ر.س)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, paidAmount: e.target.value }))}
                  placeholder="0"
                  className="border-[rgba(255,255,255,0.06)] bg-[#121218] text-[#E8E8ED] placeholder:text-[#6B6B76] rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-[#C4C4D4]">تاريخ الاستحقاق *</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="border-[rgba(255,255,255,0.06)] bg-[#121218] text-[#E8E8ED] placeholder:text-[#6B6B76] rounded-xl"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm text-[#C4C4D4]">ملاحظات</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="أضف ملاحظات..."
                rows={3}
                className="border-[rgba(255,255,255,0.06)] bg-[#121218] text-[#E8E8ED] placeholder:text-[#6B6B76] rounded-xl resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => { setShowAddDialog(false); setShowEditDialog(false); setSelectedFee(null); resetForm(); }}
              className="text-[#6B6B76] hover:text-[#E8E8ED] hover:bg-[rgba(255,255,255,0.04)]"
            >
              إلغاء
            </Button>
            <Button
              onClick={showEditDialog ? handleEditSubmit : handleAddSubmit}
              className="btn-amber-glow bg-[#D4A574] text-[#121218] hover:bg-[#C49564] font-semibold"
            >
              {showEditDialog ? 'حفظ التعديلات' : 'إضافة الرسوم'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== View Fee Dialog ===== */}
      <Dialog open={showViewDialog} onOpenChange={(open) => { if (!open) { setShowViewDialog(false); setSelectedFee(null); } }}>
        <DialogContent className="bg-[#1A1A24] border-[rgba(255,255,255,0.08)] text-[#E8E8ED] max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#E8E8ED] flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                <Eye size={18} />
              </span>
              تفاصيل الرسوم
            </DialogTitle>
          </DialogHeader>
          {selectedFee && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-[#6B6B76]">الطالب</span>
                  <p className="text-sm font-medium text-[#E8E8ED]">{selectedFee.studentName ?? '—'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-[#6B6B76]">الصف</span>
                  <p className="text-sm font-medium text-[#E8E8ED]">{selectedFee.className ?? '—'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-[#6B6B76]">نوع الرسوم</span>
                  <p className="text-sm font-medium text-[#E8E8ED]">{FEE_TYPE_LABELS[selectedFee.feeType]}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-[#6B6B76]">الحالة</span>
                  <Badge variant="outline" className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full gap-1.5 mt-0.5', STATUS_COLORS[selectedFee.status])}>
                    <span className={cn('inline-block h-1.5 w-1.5 rounded-full', STATUS_DOT_COLORS[selectedFee.status])} />
                    {STATUS_LABELS[selectedFee.status]}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-[#6B6B76]">المبلغ</span>
                  <p className="text-sm font-bold text-[#E8E8ED]">{formatCurrency(selectedFee.amount)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-[#6B6B76]">المدفوع</span>
                  <p className="text-sm font-bold text-emerald-400">{formatCurrency(selectedFee.paidAmount)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-[#6B6B76]">المتبقي</span>
                  <p className="text-sm font-bold text-amber-400">{formatCurrency(Math.max(0, selectedFee.amount - selectedFee.paidAmount))}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-[#6B6B76]">تاريخ الاستحقاق</span>
                  <p className="text-sm font-medium text-[#E8E8ED]">{formatDate(selectedFee.dueDate)}</p>
                </div>
              </div>

              {/* Payment progress */}
              <div className="space-y-2 rounded-xl bg-[#121218] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B6B76]">نسبة السداد</span>
                  <span className="text-xs font-bold text-[#D4A574]">
                    {selectedFee.amount > 0 ? Math.round(Math.max(EPS, (selectedFee.paidAmount / Math.max(EPS, selectedFee.amount)) * 100)) : 0}%
                  </span>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-[#1A1A24]">
                  <div
                    className="absolute inset-y-0 right-0 rounded-full transition-all duration-500"
                    style={{
                      width: `${selectedFee.amount > 0 ? Math.min(100, Math.round(Math.max(EPS, (selectedFee.paidAmount / Math.max(EPS, selectedFee.amount)) * 100))) : 0}%`,
                      background: selectedFee.status === 'paid'
                        ? 'linear-gradient(to left, #10b981, #34d399)'
                        : 'linear-gradient(to left, #D4A574, #E8C9A8)',
                    }}
                  />
                </div>
              </div>

              {selectedFee.paidDate && (
                <div className="space-y-1">
                  <span className="text-xs text-[#6B6B76]">تاريخ الدفع</span>
                  <p className="text-sm font-medium text-emerald-400">{formatDate(selectedFee.paidDate)}</p>
                </div>
              )}

              {selectedFee.notes && (
                <div className="space-y-1">
                  <span className="text-xs text-[#6B6B76]">ملاحظات</span>
                  <p className="text-sm text-[#C4C4D4] leading-relaxed">{selectedFee.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => { setShowViewDialog(false); setSelectedFee(null); }}
              className="text-[#6B6B76] hover:text-[#E8E8ED] hover:bg-[rgba(255,255,255,0.04)]"
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Record Payment Dialog ===== */}
      <Dialog open={showPaymentDialog} onOpenChange={(open) => { if (!open) { setShowPaymentDialog(false); setSelectedFee(null); setPaymentAmount(''); } }}>
        <DialogContent className="bg-[#1A1A24] border-[rgba(255,255,255,0.08)] text-[#E8E8ED] max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#E8E8ED] flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <CreditCard size={18} />
              </span>
              تسجيل دفعة
            </DialogTitle>
            <DialogDescription className="text-[#6B6B76]">
              سجل دفعة جديدة لهذه الرسوم
            </DialogDescription>
          </DialogHeader>
          {selectedFee && (
            <div className="space-y-4 py-2">
              {/* Summary box */}
              <div className="rounded-xl bg-[#121218] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B6B76]">الطالب</span>
                  <span className="text-sm font-medium text-[#E8E8ED]">{selectedFee.studentName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B6B76]">نوع الرسوم</span>
                  <span className="text-sm text-[#C4C4D4]">{FEE_TYPE_LABELS[selectedFee.feeType]}</span>
                </div>
                <div className="h-px bg-[rgba(255,255,255,0.06)]" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B6B76]">إجمالي الرسوم</span>
                  <span className="text-sm font-bold text-[#E8E8ED]">{formatCurrency(selectedFee.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B6B76]">المدفوع سابقاً</span>
                  <span className="text-sm font-medium text-emerald-400">{formatCurrency(selectedFee.paidAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B6B76]">المتبقي</span>
                  <span className="text-sm font-bold text-amber-400">{formatCurrency(Math.max(0, selectedFee.amount - selectedFee.paidAmount))}</span>
                </div>
              </div>

              {/* Payment amount input */}
              <div className="space-y-2">
                <Label className="text-sm text-[#C4C4D4]">مبلغ الدفعة (ر.س) *</Label>
                <Input
                  type="number"
                  min="0"
                  max={selectedFee.amount - selectedFee.paidAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0"
                  className="border-[rgba(255,255,255,0.06)] bg-[#121218] text-[#E8E8ED] placeholder:text-[#6B6B76] rounded-xl text-lg font-semibold text-center"
                />
                <div className="flex items-center justify-center gap-2 mt-1">
                  {[0.25, 0.5, 0.75, 1].map((ratio) => {
                    const suggested = Math.round((selectedFee.amount - selectedFee.paidAmount) * ratio);
                    if (suggested <= 0) return null;
                    return (
                      <button
                        key={ratio}
                        onClick={() => setPaymentAmount(String(suggested))}
                        className="px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.04)] text-xs text-[#6B6B76] hover:text-[#D4A574] hover:bg-[#D4A574]/10 transition-all"
                      >
                        {formatCurrency(suggested)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* New status preview */}
              {paymentAmount && !isNaN(parseFloat(paymentAmount)) && parseFloat(paymentAmount) > 0 && (
                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3 text-center">
                  <p className="text-xs text-[#6B6B76] mb-1">بعد الدفع ستكون الحالة:</p>
                  <Badge variant="outline" className={cn(
                    'text-sm font-medium px-3 py-0.5 rounded-full gap-1.5',
                    (selectedFee.paidAmount + parseFloat(paymentAmount)) >= selectedFee.amount
                      ? STATUS_COLORS.paid
                      : STATUS_COLORS.partial,
                  )}>
                    <span className={cn(
                      'inline-block h-1.5 w-1.5 rounded-full',
                      (selectedFee.paidAmount + parseFloat(paymentAmount)) >= selectedFee.amount
                        ? STATUS_DOT_COLORS.paid
                        : STATUS_DOT_COLORS.partial,
                    )} />
                    {(selectedFee.paidAmount + parseFloat(paymentAmount)) >= selectedFee.amount ? 'مدفوع' : 'جزئي'}
                  </Badge>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => { setShowPaymentDialog(false); setSelectedFee(null); setPaymentAmount(''); }}
              className="text-[#6B6B76] hover:text-[#E8E8ED] hover:bg-[rgba(255,255,255,0.04)]"
            >
              إلغاء
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              className="bg-emerald-500 text-white hover:bg-emerald-600 font-semibold"
            >
              تسجيل الدفعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Confirmation Dialog ===== */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => { if (!open) { setShowDeleteDialog(false); setSelectedFee(null); } }}>
        <AlertDialogContent className="bg-[#1A1A24] border-[rgba(255,255,255,0.08)] text-[#E8E8ED]" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-[#E8E8ED] flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                <Trash2 size={18} />
              </span>
              تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#6B6B76]">
              هل أنت متأكد من حذف هذه الرسوم؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedFee && (
            <div className="rounded-xl bg-rose-500/5 border border-rose-500/10 p-4 my-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B6B76]">الطالب</span>
                <span className="text-sm font-medium text-[#E8E8ED]">{selectedFee.studentName}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-[#6B6B76]">المبلغ</span>
                <span className="text-sm font-bold text-rose-400">{formatCurrency(selectedFee.amount)}</span>
              </div>
            </div>
          )}
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="text-[#6B6B76] hover:text-[#E8E8ED] hover:bg-[rgba(255,255,255,0.04)]">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-500 text-white hover:bg-rose-600 font-semibold"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
