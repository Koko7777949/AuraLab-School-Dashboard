'use client';


import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  /** Card visual variant — 'default' keeps original styling */
  variant?: 'default' | 'glass' | 'gradient';
}

export default function SectionCard({
  title,
  icon,
  children,
  className,
  action,
  variant = 'default',
}: SectionCardProps) {
  // Determine wrapper classes based on variant
  const variantClasses =
    variant === 'glass'
      ? 'glass-card-hover hover-lift'
      : variant === 'gradient'
        ? 'glass-card-gradient hover-lift border-0'
        : '';

  return (
    <div
      className={cn(
        'group relative rounded-xl transition-all duration-300 ease-out',
        // Default variant styles
        variant === 'default' &&
          'bg-[#1A1A24] border border-white/[0.06] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3),0_0_0_1px_rgba(212,165,116,0.15)] hover:border-[rgba(212,165,116,0.2)]',
        variantClasses,
        className,
      )}
      style={
        variant === 'default'
          ? { backgroundColor: '#1A1A24' }
          : undefined
      }
    >
      {/* ── Subtle gradient overlay at the top ── */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-xl opacity-60"
        style={{
          background:
            'linear-gradient(180deg, rgba(212,165,116,0.04) 0%, transparent 100%)',
        }}
      />

      {/* ── Header ── */}
      <div
        className="relative flex items-center justify-between gap-3 border-b px-5 py-3.5"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        {/* Right side (RTL): icon + title */}
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="flex shrink-0 items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10 text-[#D4A574] transition-transform duration-300 group-hover:scale-110">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-white truncate">
            {title}
          </h3>
        </div>

        {/* Left side (RTL): optional action with improved spacing */}
        {action && (
          <div className="shrink-0 flex items-center gap-2 pl-2 border-s border-white/[0.06]">
            {action}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="relative p-5">{children}</div>
    </div>
  );
}
