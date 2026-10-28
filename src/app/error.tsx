'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

/**
 * Global error boundary.
 *
 * In addition to showing a friendly Arabic recovery card, it auto-recovers
 * from transient asset/chunk failures: when the dev server restarts (or gets
 * OOM-killed and respawns), the browser may still reference stale chunk URLs,
 * producing ChunkLoadError / "Failed to fetch dynamically imported module".
 * Those errors are fixed by one full page reload — guarded via sessionStorage
 * so we never loop.
 */
const RELOAD_GUARD_KEY = 'auralab:autoReloadGuard';

function isChunkLoadError(err: Error & { digest?: string }): boolean {
  const msg = (err.message || '').toLowerCase();
  return (
    msg.includes('chunkloaderror') ||
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('loading chunk') ||
    msg.includes('failed to load chunk') ||
    msg.includes('importing a module script') ||
    msg.includes('load failed') ||
    msg.includes('networkerror') ||
    msg.includes('server closed') ||
    // Next.js production digest for missing chunks (generic fallback)
    msg.includes('missing required error components')
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [autoRecovering, setAutoRecovering] = useState(false);

  // Deferred setter: keeps the synchronous effect body free of setState
  // (react-hooks/set-state-in-effect) while still flipping the flag promptly.
  const setAutoRecoveringSafe = () => {
    setTimeout(() => setAutoRecovering(true), 0);
  };

  useEffect(() => {
    // Log the error for debugging
    console.error('[AuraLab] Client-side error:', error);

    // Auto-recover from stale-chunk / network failures with ONE full reload.
    if (isChunkLoadError(error)) {
      let guard: { ts: number } | null = null;
      try {
        guard = JSON.parse(sessionStorage.getItem(RELOAD_GUARD_KEY) || 'null');
      } catch {
        guard = null;
      }
      const now = Date.now();
      if (!guard || now - guard.ts > 15_000) {
        try {
          sessionStorage.setItem(RELOAD_GUARD_KEY, JSON.stringify({ ts: now }));
        } catch {
          /* ignore */
        }
        setAutoRecoveringSafe();
        const timer = setTimeout(() => window.location.reload(), 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: '#121218' }}
      dir="rtl"
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 flex flex-col items-center gap-6 text-center"
        style={{
          backgroundColor: '#1A1A24',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 0 60px rgba(212,165,116,0.08)',
        }}
      >
        {/* Error icon with amber glow */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'radial-gradient(circle, rgba(244,63,94,0.15) 0%, transparent 70%)',
              filter: 'blur(12px)',
            }}
          />
          <div className="relative flex items-center justify-center h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <AlertTriangle className="h-8 w-8 text-rose-400" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-white mb-2">
            {autoRecovering ? 'جارٍ استعادة الاتصال…' : 'حدث خطأ غير متوقع'}
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            {autoRecovering
              ? 'تم انقطاع مؤقت في الاتصال بالخادم. نقوم بإعادة التحميل تلقائياً الآن.'
              : 'نعتذر عن هذا الإزعاج. حدث خطأ أثناء تحميل الصفحة. يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية.'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-semibold text-sm transition-all duration-200 bg-[#D4A574] hover:bg-[#B8895A] text-slate-900"
          >
            <RotateCcw className="h-4 w-4" />
            إعادة المحاولة
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-semibold text-sm transition-all duration-200 border border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white"
          >
            <Home className="h-4 w-4" />
            الصفحة الرئيسية
          </button>
        </div>

        {/* Error details toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-slate-500 hover:text-slate-400 transition-colors underline underline-offset-2"
        >
          {showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل التقنية'}
        </button>

        {/* Error details */}
        {showDetails && (
          <div
            className="w-full rounded-lg p-3 text-left"
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <p className="text-xs text-rose-400 font-mono break-all leading-relaxed" dir="ltr">
              {error.message || 'Unknown error'}
            </p>
            {error.digest && (
              <p className="text-xs text-slate-600 font-mono mt-2" dir="ltr">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Brand */}
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: 'linear-gradient(135deg, #D4A574, #B07D4F)' }}
          />
          <span>AuraLab v2.7.0</span>
        </div>
      </div>
    </div>
  );
}
