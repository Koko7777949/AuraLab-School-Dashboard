'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { CSVColumnMapping, ParseError, ParseResult } from '@/lib/csv-import';
import { parseCSV, downloadTemplate } from '@/lib/csv-import';

// shadcn/ui
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImportDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to toggle dialog visibility */
  onOpenChange: (open: boolean) => void;
  /** Import type – determines title and labels */
  type: 'students' | 'teachers';
  /** Column mapping definition for parsing */
  columns: CSVColumnMapping[];
  /** Callback invoked with successfully parsed data rows */
  onImport: (data: Record<string, unknown>[]) => void;
  /** Filename for the downloadable template (without .csv) */
  templateFilename: string;
}

/** One row in the preview table */
interface PreviewRow {
  rowNumber: number;
  data: Record<string, unknown>;
  errors: ParseError[];
  isValid: boolean;
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<ImportDialogProps['type'], { title: string; description: string; item: string }> = {
  students: {
    title: 'استيراد بيانات الطلاب',
    description: 'قم بتحميل ملف CSV يحتوي على بيانات الطلاب لاستيرادها إلى النظام',
    item: 'طالب',
  },
  teachers: {
    title: 'استيراد بيانات المعلمين',
    description: 'قم بتحميل ملف CSV يحتوي على بيانات المعلمين لاستيرادها إلى النظام',
    item: 'معلم',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImportDialog({
  open,
  onOpenChange,
  type,
  columns,
  onImport,
  templateFilename,
}: ImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State machine: idle → previewing → importing → done
  const [step, setStep] = useState<'idle' | 'previewing' | 'importing' | 'done'>('idle');

  // File / drag state
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Parsed data
  const [parseResult, setParseResult] = useState<ParseResult<Record<string, unknown>> | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);

  // Reset all state when dialog closes
  const handleReset = useCallback(() => {
    setStep('idle');
    setIsDragging(false);
    setFileName(null);
    setParseResult(null);
    setPreviewRows([]);
    setImportProgress(0);
    setImportedCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen === false) {
        handleReset();
      }
      onOpenChange(nextOpen);
    },
    [handleReset, onOpenChange],
  );

  // -----------------------------------------------------------------------
  // File reading + parsing
  // -----------------------------------------------------------------------

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        toast.error('يجب أن يكون الملف بصيغة CSV');
        return;
      }

      setFileName(file.name);
      setStep('previewing');

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          toast.error('فشل في قراءة الملف');
          setStep('idle');
          setFileName(null);
          return;
        }

        const result = parseCSV<Record<string, unknown>>(text, columns);
        setParseResult(result);

        // Build preview rows with error associations
        const rows: PreviewRow[] = result.data.map((data, idx) => ({
          rowNumber: idx + 1,
          data,
          errors: [],
          isValid: true,
        }));

        // Add error rows (rows that had validation errors — show as error rows)
        // We need to track which row numbers had errors
        const errorRowNumbers = new Set(result.errors.map((err) => err.row));

        // Since parseCSV only returns valid data rows, we build preview from all
        // We need to re-parse to get error rows too — let's do it differently:
        // Build preview combining both valid and invalid
        const allRows: PreviewRow[] = [];

        // Re-split to count total lines for preview
        const lineCount = text.split('\n').filter((l) => l.trim().length > 0).length - 1; // minus header

        for (let i = 1; i <= Math.min(lineCount, 500); i++) {
          const rowErrors = result.errors.filter((e) => e.row === i);
          const isValidRow = rowErrors.length === 0;
          const dataIdx = i - 1 - result.errors
            .filter((e) => e.row < i)
            .reduce((count, e) => {
              // Deduplicate by row number
              return count;
            }, 0);

          // Simple approach: valid rows come first in result.data
          const validRowIndex = i - 1 - [...new Set(result.errors.map((e) => e.row))].filter((r) => r < i).length;

          if (isValidRow && validRowIndex >= 0 && validRowIndex < result.data.length) {
            allRows.push({
              rowNumber: i,
              data: result.data[validRowIndex],
              errors: [],
              isValid: true,
            });
          } else if (rowErrors.length > 0) {
            allRows.push({
              rowNumber: i,
              data: {},
              errors: rowErrors,
              isValid: false,
            });
          }
        }

        setPreviewRows(allRows);
      };

      reader.onerror = () => {
        toast.error('فشل في قراءة الملف');
        setStep('idle');
        setFileName(null);
      };

      reader.readAsText(file, 'utf-8');
    },
    [columns],
  );

  // -----------------------------------------------------------------------
  // Drag & drop handlers
  // -----------------------------------------------------------------------

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile],
  );

  // -----------------------------------------------------------------------
  // File picker handler
  // -----------------------------------------------------------------------

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile],
  );

  // -----------------------------------------------------------------------
  // Template download
  // -----------------------------------------------------------------------

  const handleDownloadTemplate = useCallback(() => {
    downloadTemplate(columns, templateFilename);
    toast.success('تم تحميل قالب الاستيراد');
  }, [columns, templateFilename]);

  // -----------------------------------------------------------------------
  // Import execution (simulated progress)
  // -----------------------------------------------------------------------

  const handleImport = useCallback(() => {
    if (!parseResult || parseResult.data.length === 0) return;

    setStep('importing');
    setImportProgress(0);
    setImportedCount(0);

    const totalItems = parseResult.data.length;
    const batchSize = Math.max(1, Math.ceil(totalItems / 20));

    let imported = 0;

    const processBatch = () => {
      const end = Math.min(imported + batchSize, totalItems);

      for (let i = imported; i < end; i++) {
        onImport(parseResult.data[i]);
      }

      imported = end;
      setImportedCount(imported);
      setImportProgress(Math.round((imported / totalItems) * 100));

      if (imported < totalItems) {
        setTimeout(processBatch, 80);
      } else {
        setStep('done');
        const label = TYPE_LABELS[type];
        toast.success(`تم استيراد ${totalItems} ${label.item} بنجاح`);
      }
    };

    setTimeout(processBatch, 200);
  }, [parseResult, onImport, type]);

  // -----------------------------------------------------------------------
  // Computed values
  // -----------------------------------------------------------------------

  const validCount = previewRows.filter((r) => r.isValid).length;
  const errorCount = previewRows.filter((r) => !r.isValid).length;
  const labels = TYPE_LABELS[type];

  // Get primary key field for preview display
  const primaryColumn = columns.find((c) => c.jsonKey === 'name') ?? columns[0];

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        dir="rtl"
        style={{
          backgroundColor: '#1A1A24',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            <Upload className="h-5 w-5 text-[#D4A574]" />
            {labels.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {labels.description}
          </DialogDescription>
        </DialogHeader>

        {/* ── Idle Step: Upload Zone ── */}
        {step === 'idle' && (
          <div className="flex flex-col gap-5 mt-2 flex-1">
            {/* Drag-and-drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center gap-4 rounded-xl p-10 cursor-pointer transition-all duration-300 border-2 border-dashed min-h-[200px]',
                isDragging
                  ? 'border-[#D4A574] bg-[#D4A574]/5 shadow-[inset_0_0_40px_rgba(212,165,116,0.05)]'
                  : 'border-white/[0.1] bg-white/[0.01] hover:border-white/[0.2] hover:bg-white/[0.02]',
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center h-16 w-16 rounded-2xl transition-all duration-300',
                  isDragging
                    ? 'bg-[#D4A574]/15 scale-110'
                    : 'bg-white/[0.04]',
                )}
              >
                <FileSpreadsheet
                  className={cn(
                    'h-8 w-8 transition-colors duration-300',
                    isDragging ? 'text-[#D4A574]' : 'text-slate-500',
                  )}
                />
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-slate-300 mb-1">
                  {isDragging ? 'أفلت الملف هنا' : 'اسحب ملف CSV وأفلته هنا'}
                </p>
                <p className="text-xs text-muted-foreground">
                  أو{' '}
                  <span className="text-[#D4A574] hover:underline font-medium">
                    اختر ملفاً من جهازك
                  </span>
                </p>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
              aria-label="اختيار ملف CSV"
            />

            {/* Download template button */}
            <div className="flex items-center justify-between rounded-lg p-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-sky-500/10">
                  <Download className="h-4 w-4 text-sky-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">تحميل قالب الاستيراد</p>
                  <p className="text-xs text-muted-foreground">قم بتحميل القالب وملء البيانات ثم رفعه</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                className="border-sky-500/20 text-sky-400 hover:bg-sky-500/10 gap-2 rounded-lg px-4 h-9"
              >
                <Download className="h-4 w-4" />
                تحميل قالب
              </Button>
            </div>

            {/* Supported columns info */}
            <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-xs font-semibold text-slate-400 mb-3">الأعمدة المدعومة:</p>
              <div className="flex flex-wrap gap-2">
                {columns.map((col) => (
                  <Badge
                    key={col.jsonKey}
                    variant="outline"
                    className={cn(
                      'text-xs px-2.5 py-0.5 rounded-full font-medium',
                      col.required
                        ? 'bg-[#D4A574]/10 border-[#D4A574]/20 text-[#D4A574]'
                        : 'bg-white/[0.03] border-white/[0.08] text-slate-400',
                    )}
                  >
                    {col.csvHeader}
                    {col.required && (
                      <span className="mr-1 text-[10px]">*</span>
                    )}
                  </Badge>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-2">
                * الأعمدة المميزة بنجمة مطلوبة
              </p>
            </div>
          </div>
        )}

        {/* ── Preview Step ── */}
        {step === 'previewing' && parseResult && (
          <div className="flex flex-col gap-4 mt-2 flex-1 overflow-hidden">
            {/* File info bar */}
            <div className="flex items-center justify-between rounded-lg p-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-[#D4A574]" />
                <div>
                  <p className="text-sm font-medium text-slate-200">{fileName}</p>
                  <p className="text-xs text-muted-foreground">{parseResult.totalRows} صف</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3 ml-1" />
                  {validCount} صالح
                </Badge>
                {errorCount > 0 && (
                  <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/20 text-xs px-2.5 py-0.5 rounded-full">
                    <XCircle className="h-3 w-3 ml-1" />
                    {errorCount} خطأ
                  </Badge>
                )}
              </div>
            </div>

            {/* Warning banner if there are errors */}
            {parseResult.errors.length > 0 && (
              <div className="flex items-start gap-3 rounded-lg p-3 bg-amber-500/5 border border-amber-500/15">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-300">تحذير</p>
                  <p className="text-xs text-amber-300/70 mt-0.5">
                    يوجد {errorCount} صف به أخطاء ولن يتم استيراده. يمكنك متابعة استيراد الصفوف الصحيحة فقط.
                  </p>
                </div>
              </div>
            )}

            {/* Preview table */}
            <ScrollArea className="flex-1 max-h-[300px] rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="min-w-full">
                {/* Header */}
                <div
                  className="sticky top-0 grid gap-2 px-4 py-2.5 text-xs font-semibold text-slate-400 bg-[#1A1A24] border-b border-white/[0.06]"
                  style={{
                    gridTemplateColumns: '60px 1fr 60px',
                  }}
                >
                  <span>#</span>
                  <span>البيانات</span>
                  <span className="text-center">الحالة</span>
                </div>

                {/* Rows */}
                {previewRows.map((row) => (
                  <div
                    key={row.rowNumber}
                    className={cn(
                      'grid gap-2 px-4 py-2.5 text-xs border-b border-white/[0.04] last:border-0 transition-colors',
                      row.isValid
                        ? 'bg-transparent hover:bg-white/[0.02]'
                        : 'bg-rose-500/[0.04] hover:bg-rose-500/[0.06]',
                    )}
                    style={{
                      gridTemplateColumns: '60px 1fr 60px',
                    }}
                  >
                    {/* Row number */}
                    <span className="text-muted-foreground tabular-nums font-mono">
                      {row.rowNumber}
                    </span>

                    {/* Data */}
                    {row.isValid ? (
                      <span className="text-slate-300 truncate">
                        {String(row.data[primaryColumn.jsonKey] ?? '')}
                      </span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        {row.errors.map((err, idx) => (
                          <span key={idx} className="text-rose-400 truncate">
                            {err.message}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex justify-center">
                      {row.isValid ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* ── Importing Step ── */}
        {step === 'importing' && (
          <div className="flex flex-col items-center gap-6 mt-6 flex-1">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#D4A574]/20 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-[#D4A574]/10 border border-[#D4A574]/20">
                <Loader2 className="h-8 w-8 text-[#D4A574] animate-spin" />
              </div>
            </div>

            <div className="text-center space-y-2 w-full max-w-sm">
              <p className="text-lg font-semibold text-slate-200">
                جارٍ استيراد البيانات...
              </p>
              <p className="text-sm text-muted-foreground tabular-nums">
                {importedCount} من {parseResult?.data.length ?? 0} {labels.item}
              </p>
            </div>

            <div className="w-full max-w-sm space-y-2">
              <Progress
                value={importProgress}
                className="h-2.5 rounded-full"
              />
              <p className="text-xs text-muted-foreground text-center tabular-nums">
                {importProgress}%
              </p>
            </div>
          </div>
        )}

        {/* ── Done Step ── */}
        {step === 'done' && (
          <div className="flex flex-col items-center gap-6 mt-6 flex-1">
            <div className="flex items-center justify-center h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>

            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-slate-200">
                تم الاستيراد بنجاح!
              </p>
              <p className="text-sm text-muted-foreground">
                تم استيراد{' '}
                <span className="font-semibold text-emerald-400 tabular-nums">{importedCount}</span>{' '}
                {labels.item} إلى النظام
              </p>
            </div>

            {/* Summary card */}
            {parseResult && parseResult.errors.length > 0 && (
              <div className="w-full max-w-sm rounded-lg p-4 bg-amber-500/5 border border-amber-500/15 text-center">
                <p className="text-xs text-amber-300/80">
                  تم تخطي {parseResult.errors.length} صف به أخطاء
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <DialogFooter className="flex-row gap-3 sm:justify-start pt-4 border-t border-white/[0.06] mt-4 flex-shrink-0">
          {/* Idle state */}
          {step === 'idle' && (
            <>
              <Button
                onClick={handleDownloadTemplate}
                variant="outline"
                className="border-sky-500/20 text-sky-400 hover:bg-sky-500/10 gap-2 rounded-lg px-4"
              >
                <Download className="h-4 w-4" />
                تحميل قالب
              </Button>
              <Button
                onClick={() => handleClose(false)}
                variant="outline"
                className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-lg px-6"
              >
                إلغاء
              </Button>
            </>
          )}

          {/* Previewing state */}
          {step === 'previewing' && (
            <>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white gap-2 rounded-lg px-4"
              >
                <Eye className="h-4 w-4" />
                إعادة المعاينة
              </Button>
              {validCount > 0 && (
                <Button
                  onClick={handleImport}
                  className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold gap-2 rounded-lg px-6"
                >
                  <Upload className="h-4 w-4" />
                  استيراد {validCount} سجل
                </Button>
              )}
              <Button
                onClick={() => setStep('idle')}
                variant="ghost"
                className="text-slate-400 hover:text-white hover:bg-white/[0.05] gap-2 rounded-lg px-4"
              >
                <Trash2 className="h-4 w-4" />
                رجوع
              </Button>
            </>
          )}

          {/* Done state */}
          {step === 'done' && (
            <Button
              onClick={() => handleClose(false)}
              className="bg-[#D4A574] hover:bg-[#B8895A] text-slate-900 font-semibold gap-2 rounded-lg px-6"
            >
              <CheckCircle2 className="h-4 w-4" />
              تم
            </Button>
          )}

          {/* Hidden file input for re-upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
            aria-label="اختيار ملف CSV"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
