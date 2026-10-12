'use client';

import { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileJson,
  Printer,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  exportToCSV,
  exportToJSON,
  exportToPrint,
  type ExportColumn,
} from '@/lib/data-export';

interface ExportButtonProps<T extends Record<string, unknown>> {
  /** Data array to export */
  data: T[];
  /** Column configuration with Arabic headers */
  columns: ExportColumn[];
  /** Base filename (without extension) */
  filename: string;
  /** Title shown in print view */
  printTitle?: string;
  /** Button label text (Arabic) */
  label?: string;
  /** Optional className for the trigger button */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

export default function ExportButton<T extends Record<string, unknown>>({
  data,
  columns,
  filename,
  printTitle,
  label = 'تصدير',
  className = '',
  disabled = false,
}: ExportButtonProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExportCSV = () => {
    exportToCSV(data, columns, filename);
    setIsOpen(false);
  };

  const handleExportJSON = () => {
    exportToJSON(data, columns, filename);
    setIsOpen(false);
  };

  const handlePrint = () => {
    exportToPrint(data, columns, printTitle || filename);
    setIsOpen(false);
  };

  return (
    <DropdownMenu dir="rtl" onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          disabled={disabled || data.length === 0}
          className={`inline-flex items-center gap-2 rounded-lg
            border border-[#2A2A38] bg-[#1A1A24]/80 px-3 py-2
            text-sm font-medium text-[#C4C4D4]
            transition-all duration-200
            hover:scale-[1.02] hover:border-[#D4A574]/40 hover:text-[#D4A574]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/50
            active:scale-[0.98]
            disabled:opacity-40 disabled:cursor-not-allowed
            ${className}`}
        >
          <Download size={16} strokeWidth={1.8} />
          <span>{label}</span>
          <ChevronDown
            size={14}
            strokeWidth={2}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-52 rounded-xl border-[#2A2A38] bg-[#1A1A24] p-1.5 shadow-2xl"
      >
        <DropdownMenuLabel className="px-3 py-1.5 text-xs text-[#8B8B9E]">
          تنسيق التصدير
        </DropdownMenuLabel>

        {/* CSV */}
        <DropdownMenuItem
          onClick={handleExportCSV}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#C4C4D4]
            transition-colors duration-150 hover:bg-[#22222E] hover:text-[#D4A574]
            focus:bg-[#22222E] focus:text-[#D4A574] cursor-pointer"
        >
          <FileSpreadsheet size={16} strokeWidth={1.8} className="text-emerald-400" />
          <div className="flex flex-col">
            <span className="font-medium">CSV</span>
            <span className="text-[10px] text-[#8B8B9E]">متوافق مع Excel</span>
          </div>
        </DropdownMenuItem>

        {/* JSON */}
        <DropdownMenuItem
          onClick={handleExportJSON}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#C4C4D4]
            transition-colors duration-150 hover:bg-[#22222E] hover:text-[#D4A574]
            focus:bg-[#22222E] focus:text-[#D4A574] cursor-pointer"
        >
          <FileJson size={16} strokeWidth={1.8} className="text-sky-400" />
          <div className="flex flex-col">
            <span className="font-medium">JSON</span>
            <span className="text-[10px] text-[#8B8B9E]">تنسيق بيانات منظم</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[#2A2A38]" />

        {/* Print */}
        <DropdownMenuItem
          onClick={handlePrint}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#C4C4D4]
            transition-colors duration-150 hover:bg-[#22222E] hover:text-[#D4A574]
            focus:bg-[#22222E] focus:text-[#D4A574] cursor-pointer"
        >
          <Printer size={16} strokeWidth={1.8} className="text-[#D4A574]" />
          <div className="flex flex-col">
            <span className="font-medium">طباعة</span>
            <span className="text-[10px] text-[#8B8B9E]">تقرير للطباعة</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
