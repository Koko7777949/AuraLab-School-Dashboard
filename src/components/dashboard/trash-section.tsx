'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Trash2,
  RotateCcw,
  X,
  AlertTriangle,
  GraduationCap,
  Users,
  School,
  FileText,
  Clock,
  Delete,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { TrashItem } from '@/lib/types';
import { cn } from '@/lib/utils';

// shadcn/ui
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

// ---------------------------------------------------------------------------
// Type config
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<
  TrashItem['itemType'],
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeClass: string;
    iconBg: string;
    color: string;
  }
> = {
  student: {
    label: 'طالب',
    icon: GraduationCap,
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    iconBg: 'bg-emerald-500/10',
    color: '#10b981',
  },
  teacher: {
    label: 'معلم',
    icon: Users,
    badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
    iconBg: 'bg-sky-500/10',
    color: '#38bdf8',
  },
  class: {
    label: 'فصل',
    icon: School,
    badgeClass: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    iconBg: 'bg-violet-500/10',
    color: '#8b5cf6',
  },
  exam: {
    label: 'امتحان',
    icon: FileText,
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    iconBg: 'bg-amber-500/10',
    color: '#f59e0b',
  },
};

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const INITIAL_TRASH: TrashItem[] = [
  {
    id: 'trash-001',
    itemType: 'student',
    itemId: 'std-del-001',
    itemName: 'خالد محمد الأحمد',
    deletedBy: 'المدير',
    dataJson: '{}',
    restoredAt: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'trash-002',
    itemType: 'teacher',
    itemId: 'tch-del-001',
    itemName: 'أ. سعاد عبدالله المنصور',
    deletedBy: 'المدير',
    dataJson: '{}',
    restoredAt: null,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'trash-003',
    itemType: 'class',
    itemId: 'cls-del-001',
    itemName: 'الصف الرابع - أ',
    deletedBy: 'المشرف',
    dataJson: '{}',
    restoredAt: null,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'trash-004',
    itemType: 'exam',
    itemId: 'exam-del-001',
    itemName: 'اختبار نصفي في الرياضيات',
    deletedBy: 'المعلم',
    dataJson: '{}',
    restoredAt: null,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'trash-005',
    itemType: 'student',
    itemId: 'std-del-002',
    itemName: 'ريم عبدالرحمن السالم',
    deletedBy: 'المدير',
    dataJson: '{}',
    restoredAt: null,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'trash-006',
    itemType: 'exam',
    itemId: 'exam-del-002',
    itemName: 'اختبار قصير في العلوم',
    deletedBy: 'المعلم',
    dataJson: '{}',
    restoredAt: null,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'trash-007',
    itemType: 'teacher',
    itemId: 'tch-del-002',
    itemName: 'أ. فيصل ناصر الحربي',
    deletedBy: 'المشرف',
    dataJson: '{}',
    restoredAt: null,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 60) return `منذ ${minutes} دقائق`;
  if (hours < 24) return `منذ ${hours} ساعات`;
  if (days === 1) return 'أمس';
  if (days < 7) return `منذ ${days} أيام`;
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Type badge */
function TypeBadge({ type }: { type: TrashItem['itemType'] }) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full border',
        config.badgeClass,
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

/** Empty state */
function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-4 rounded-xl"
      style={{
        backgroundColor: '#1A1A24',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="relative mb-6">
        <div className="flex items-center justify-center h-24 w-24 rounded-3xl bg-white/[0.03] border border-white/[0.06]">
          <Trash2 className="h-12 w-12 text-slate-500" />
        </div>
        <div className="absolute -bottom-1 -left-1 flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500/15 border border-emerald-500/30">
          <RotateCcw className="h-4 w-4 text-emerald-400" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-slate-300 mb-2">
        سلة المحذوفات فارغة
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed">
        لا توجد عناصر محذوفة.
        <br />
        العناصر التي تقوم بحذفها ستظهر هنا ويمكنك استعادتها.
      </p>
    </div>
  );
}

/** Confirm empty trash dialog */
function EmptyTrashDialog({
  open,
  onOpenChange,
  onConfirm,
  itemCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  itemCount: number;
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
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-rose-500/15 border border-rose-500/20">
              <AlertTriangle className="h-6 w-6 text-rose-400" />
            </div>
            <div>
              <AlertDialogTitle className="text-white text-lg">
                تأكيد تفريغ سلة المحذوفات
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground mt-1 leading-relaxed">
                هل أنت متأكد من تفريغ سلة المحذوفات بالكامل؟
              </AlertDialogDescription>
            </div>
          </div>
          <div
            className="rounded-lg p-3 mt-2"
            style={{
              backgroundColor: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.15)',
            }}
          >
            <p className="text-sm text-rose-300 leading-relaxed">
              ⚠️ سيتم حذف <span className="font-bold text-white tabular-nums">{itemCount}</span> عنصراً بشكل نهائي ولا يمكن استعادتها أبداً.
            </p>
          </div>
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
            نعم، حذف نهائي
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Confirm permanent delete dialog */
function PermanentDeleteDialog({
  item,
  open,
  onOpenChange,
  onConfirm,
}: {
  item: TrashItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const config = item ? TYPE_CONFIG[item.itemType] : null;
  const Icon = config ? config.icon : null;

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
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-rose-500/15 border border-rose-500/20">
              <Delete className="h-6 w-6 text-rose-400" />
            </div>
            <div>
              <AlertDialogTitle className="text-white text-lg">
                تأكيد الحذف النهائي
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground mt-1">
                سيتم حذف هذا العنصر بشكل نهائي
              </AlertDialogDescription>
            </div>
          </div>

          {item && config && (
            <div
              className="rounded-lg p-4 mt-2"
              style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className={cn('flex items-center justify-center h-10 w-10 rounded-xl shrink-0', config.iconBg)}>
                  {Icon && <Icon className="h-5 w-5" style={{ color: config.color }} />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-white truncate block">
                    {item.itemName}
                  </span>
                  <TypeBadge type={item.itemType} />
                </div>
              </div>
            </div>
          )}

          <div
            className="rounded-lg p-3 mt-2"
            style={{
              backgroundColor: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.15)',
            }}
          >
            <p className="text-sm text-rose-300 leading-relaxed">
              ⚠️ لا يمكن التراجع عن هذا الإجراء أبداً. سيتم حذف العنصر بشكل نهائي من النظام.
            </p>
          </div>
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
            <Delete className="h-4 w-4" />
            حذف نهائي
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Single trash item row */
function TrashItemRow({
  item,
  onRestore,
  onPermanentDelete,
}: {
  item: TrashItem;
  onRestore: (item: TrashItem) => void;
  onPermanentDelete: (item: TrashItem) => void;
}) {
  const config = TYPE_CONFIG[item.itemType];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl transition-all duration-200 group',
      )}
      style={{
        backgroundColor: 'rgba(255,255,255,0.015)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.015)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
      }}
    >
      {/* Icon + info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn('flex items-center justify-center h-10 w-10 rounded-xl shrink-0', config.iconBg)}>
          <Icon className="h-5 w-5" style={{ color: config.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-slate-200 truncate">
              {item.itemName}
            </span>
            <TypeBadge type={item.itemType} />
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {relativeTime(item.createdAt)}
            </span>
            <span className="text-white/10">•</span>
            <span>بواسطة: {item.deletedBy}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 sm:justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRestore(item)}
          className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30 rounded-lg px-4 gap-2 h-9 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          استعادة
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPermanentDelete(item)}
          className="border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 hover:border-rose-500/30 rounded-lg px-4 gap-2 h-9 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          حذف نهائي
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TrashSection() {
  const { trashItems, setTrashItems, restoreFromTrash, removeFromTrash } = useAppStore();

  // Local UI state
  const [emptyTrashOpen, setEmptyTrashOpen] = useState(false);
  const [permanentDeleteOpen, setPermanentDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TrashItem | null>(null);

  // Initialize mock data once
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && trashItems.length === 0) {
      initialized.current = true;
      setTrashItems(INITIAL_TRASH);
    }
  }, []);

  // Group by type for display
  const groupedItems = useMemo(() => {
    const groups: Record<string, TrashItem[]> = {};
    for (const item of trashItems) {
      if (!groups[item.itemType]) groups[item.itemType] = [];
      groups[item.itemType].push(item);
    }
    return groups;
  }, [trashItems]);

  // Handlers
  const handleRestore = (item: TrashItem) => {
    restoreFromTrash(item.id);
  };

  const handlePermanentDelete = (item: TrashItem) => {
    setSelectedItem(item);
    setPermanentDeleteOpen(true);
  };

  const confirmPermanentDelete = () => {
    if (selectedItem) {
      removeFromTrash(selectedItem.id);
      setSelectedItem(null);
      setPermanentDeleteOpen(false);
    }
  };

  const handleEmptyTrash = () => {
    setEmptyTrashOpen(true);
  };

  const confirmEmptyTrash = () => {
    // Remove all items
    for (const item of trashItems) {
      removeFromTrash(item.id);
    }
    setEmptyTrashOpen(false);
  };

  const handleRestoreAll = () => {
    for (const item of trashItems) {
      restoreFromTrash(item.id);
    }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* ── Page Title ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-rose-500/10">
            <Trash2 className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl flex items-center gap-3">
              سلة المحذوفات
              {trashItems.length > 0 && (
                <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 text-sm px-2.5 py-0.5 rounded-full font-semibold tabular-nums">
                  {trashItems.length} عنصر
                </Badge>
              )}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              العناصر المحذوفة مؤخراً - يمكنك استعادتها أو حذفها نهائياً
            </p>
          </div>
        </div>
      </div>

      {/* ── Action Bar ── */}
      {trashItems.length > 0 && (
        <div
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl p-4"
          style={{
            backgroundColor: '#1A1A24',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span>
              يوجد <span className="font-semibold text-slate-200 tabular-nums">{trashItems.length}</span> عنصر محذوف في السلة
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRestoreAll}
              className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 font-semibold gap-2 rounded-lg px-5 h-10 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              استعادة الكل
            </Button>
            <Button
              variant="destructive"
              onClick={handleEmptyTrash}
              className="bg-rose-500 hover:bg-rose-600 text-white font-semibold gap-2 rounded-lg px-5 h-10"
            >
              <Trash2 className="h-4 w-4" />
              إفراغ سلة المحذوفات
            </Button>
          </div>
        </div>
      )}

      {/* ── Trash Items List ── */}
      {trashItems.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: '#1A1A24',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Group by type */}
          {Object.entries(groupedItems).map(([type, items]) => {
            const config = TYPE_CONFIG[type as TrashItem['itemType']];
            const Icon = config.icon;
            return (
              <div key={type} className="mb-6 last:mb-0">
                {/* Group header */}
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-4 w-4" style={{ color: config.color }} />
                  <span className="text-sm font-semibold text-slate-300">
                    {config.label}
                  </span>
                  <Badge variant="outline" className="bg-white/[0.04] text-muted-foreground border-white/[0.06] text-xs px-2 py-0 rounded-full tabular-nums">
                    {items.length}
                  </Badge>
                  <div className="h-px flex-1 bg-white/[0.04]" />
                </div>

                {/* Items */}
                <div className="flex flex-col gap-2">
                  {items.map((item) => (
                    <TrashItemRow
                      key={item.id}
                      item={item}
                      onRestore={handleRestore}
                      onPermanentDelete={handlePermanentDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Dialogs ── */}
      <EmptyTrashDialog
        open={emptyTrashOpen}
        onOpenChange={setEmptyTrashOpen}
        onConfirm={confirmEmptyTrash}
        itemCount={trashItems.length}
      />

      <PermanentDeleteDialog
        item={selectedItem}
        open={permanentDeleteOpen}
        onOpenChange={setPermanentDeleteOpen}
        onConfirm={confirmPermanentDelete}
      />
    </div>
  );
}
