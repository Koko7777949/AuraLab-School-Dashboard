'use client';

import { useEffect, useState } from 'react';
import { Database, CheckCircle2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// PersistenceIndicator – fixed-position indicator showing data is saved locally
// ---------------------------------------------------------------------------

function checkLocalStorage(): boolean {
  try {
    const keys = Object.keys(localStorage);
    return keys.some(
      (k) =>
        k.startsWith('app-') ||
        k.includes('students') ||
        k.includes('teachers') ||
        k.includes('classes') ||
        k.includes('exams') ||
        k.includes('grades') ||
        k.includes('library') ||
        k.includes('fees') ||
        k.includes('settings') ||
        k.includes('app-store'),
    );
  } catch {
    return false;
  }
}

export default function PersistenceIndicator() {
  // Initialize from localStorage on mount (client-only to avoid hydration mismatch)
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only init to avoid hydration mismatch
    setHasData(checkLocalStorage());
  }, []);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 px-3 py-1.5
        rounded-lg bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm
        text-[11px] text-muted-foreground/60 transition-all duration-300
        hover:bg-white/[0.06] hover:text-muted-foreground/80"
      title={hasData ? 'البيانات محفوظة محلياً في المتصفح' : 'لا توجد بيانات محفوظة'}
    >
      {hasData ? (
        <>
          <CheckCircle2 className="h-3 w-3 text-emerald-500/70" />
          <span>محفوظ محلياً</span>
        </>
      ) : (
        <>
          <Database className="h-3 w-3" />
          <span>تخزين محلي</span>
        </>
      )}
    </div>
  );
}
