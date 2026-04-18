'use client';


import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export default function SectionCard({
  title,
  icon,
  children,
  className,
  action,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-[#1A1A24] border border-white/[0.06] transition-all duration-300 ease-out hover:-translate-y-0.5',
        'hover:shadow-[0_8px_30px_rgba(0,0,0,0.3),0_0_0_1px_rgba(212,165,116,0.15)]',
        'hover:border-[rgba(212,165,116,0.2)]',
        className,
      )}
      style={{
        backgroundColor: '#1A1A24',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between gap-3 border-b px-5 py-3.5"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        {/* Right side (RTL): icon + title */}
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="flex shrink-0 items-center justify-center h-8 w-8 rounded-lg bg-[#D4A574]/10 text-[#D4A574]">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-white truncate">
            {title}
          </h3>
        </div>

        {/* Left side (RTL): optional action */}
        {action && (
          <div className="shrink-0">{action}</div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="p-5">{children}</div>
    </div>
  );
}
