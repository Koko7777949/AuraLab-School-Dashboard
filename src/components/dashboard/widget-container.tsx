'use client';

import { useState, useCallback, type ReactNode } from 'react';
import {
  GripVertical,
  Minus,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WidgetContainerProps {
  /** Widget title (Arabic) */
  title: string;
  /** Widget content */
  children: ReactNode;
  /** Optional icon for the header */
  icon?: ReactNode;
  /** Optional className */
  className?: string;
  /** Optional onRefresh callback */
  onRefresh?: () => void;
  /** Default minimized state */
  defaultMinimized?: boolean;
  /** Optional badge count */
  badge?: number;
}

/* ------------------------------------------------------------------ */
/*  Widget Container                                                   */
/* ------------------------------------------------------------------ */

export default function WidgetContainer({
  title,
  children,
  icon,
  className = '',
  onRefresh,
  defaultMinimized = false,
  badge,
}: WidgetContainerProps) {
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    onRefresh();
    // Simulate refresh delay for visual feedback
    setTimeout(() => setIsRefreshing(false), 800);
  }, [onRefresh, isRefreshing]);

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-300',
        className,
      )}
      style={{
        backgroundColor: '#1A1A24',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Widget Header ── */}
      <div className="flex items-center justify-between gap-3 p-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Drag handle (visual only) */}
          <div className="cursor-grab active:cursor-grabbing text-[#3A3A4A] hover:text-[#6A6A7A] transition-colors shrink-0">
            <GripVertical size={14} strokeWidth={2} />
          </div>

          {/* Icon */}
          {icon && (
            <div className="shrink-0 text-[#D4A574]">
              {icon}
            </div>
          )}

          {/* Title */}
          <h3 className="text-sm font-semibold text-slate-200 truncate">
            {title}
          </h3>

          {/* Badge */}
          {badge !== undefined && badge > 0 && (
            <span className="shrink-0 inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-[#D4A574]/15 text-[10px] font-bold text-[#D4A574] px-1.5 tabular-nums">
              {badge}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Refresh */}
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center h-7 w-7 rounded-md text-[#6A6A7A] transition-all duration-200 hover:text-[#D4A574] hover:bg-white/[0.04] disabled:opacity-40"
              title="تحديث"
              aria-label={`تحديث ${title}`}
            >
              <RefreshCw
                size={13}
                strokeWidth={2}
                className={isRefreshing ? 'animate-spin' : ''}
              />
            </button>
          )}

          {/* Minimize/Maximize toggle */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="flex items-center justify-center h-7 w-7 rounded-md text-[#6A6A7A] transition-all duration-200 hover:text-[#D4A574] hover:bg-white/[0.04]"
            title={isMinimized ? 'توسيع' : 'تصغير'}
            aria-label={isMinimized ? `توسيع ${title}` : `تصغير ${title}`}
          >
            {isMinimized ? (
              <Maximize2 size={13} strokeWidth={2} />
            ) : (
              <Minus size={13} strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* ── Widget Content ── */}
      {!isMinimized && (
        <div className="px-4 pb-4 animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
          {children}
        </div>
      )}

      {/* ── Minimized indicator line ── */}
      {isMinimized && (
        <div className="px-4 pb-3">
          <div className="h-1 w-16 rounded-full bg-white/[0.04]" />
        </div>
      )}
    </div>
  );
}
