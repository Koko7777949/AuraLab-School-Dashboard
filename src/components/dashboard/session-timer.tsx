'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// SessionTimer Component
// ---------------------------------------------------------------------------

export default function SessionTimer() {
  const {
    sessionRunning,
    setSessionRunning,
    sessionStartTime,
    setSessionStartTime,
  } = useAppStore();

  const [elapsed, setElapsed] = useState(0);
  const accumulatedRef = useRef(0);

  // Timer tick
  useEffect(() => {
    if (!sessionRunning || sessionStartTime === null) return;

    const tick = () => {
      setElapsed(accumulatedRef.current + (Date.now() - sessionStartTime));
    };

    tick(); // immediate first paint
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [sessionRunning, sessionStartTime]);

  // ── Handlers ──

  const handleStart = useCallback(() => {
    if (sessionRunning) return;
    if (sessionStartTime === null) {
      // Fresh start
      accumulatedRef.current = 0;
    }
    setSessionStartTime(Date.now());
    setSessionRunning(true);
  }, [sessionRunning, sessionStartTime, setSessionStartTime, setSessionRunning]);

  const handlePause = useCallback(() => {
    if (!sessionRunning || sessionStartTime === null) return;
    accumulatedRef.current += Date.now() - sessionStartTime;
    setSessionRunning(false);
  }, [sessionRunning, sessionStartTime, setSessionRunning]);

  const handleReset = useCallback(() => {
    accumulatedRef.current = 0;
    setElapsed(0);
    setSessionRunning(false);
    setSessionStartTime(null);
  }, [setSessionRunning, setSessionStartTime]);

  // ── Status label ──

  const statusText =
    sessionStartTime === null
      ? 'لم تبدأ بعد'
      : sessionRunning
        ? 'جارية...'
        : 'متوقفة';

  const statusColor = sessionRunning
    ? 'text-green-400'
    : sessionStartTime === null
      ? 'text-slate-500'
      : 'text-amber-400';

  return (
    <div
      className="relative mx-auto w-full max-w-md rounded-2xl p-6"
      dir="rtl"
    >
      {/* Subtle gradient border wrapper */}
      <div
        className="absolute -inset-[1px] rounded-2xl"
        style={{
          background:
            'linear-gradient(135deg, rgba(212,165,116,0.3) 0%, rgba(212,165,116,0.05) 40%, rgba(212,165,116,0.02) 60%, rgba(212,165,116,0.25) 100%)',
        }}
      />
      {/* Inner card */}
      <div
        className="relative flex flex-col items-center gap-5 rounded-2xl px-6 py-8"
        style={{
          backgroundColor: '#1A1A24',
        }}
      >
        {/* ── Status badge ── */}
        <div className="flex items-center gap-2">
          {/* Pulsing green dot when running */}
          {sessionRunning && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
          )}
          <span className={`text-sm font-medium ${statusColor}`}>
            {statusText}
          </span>
        </div>

        {/* ── Timer display ── */}
        <div className="select-none" dir="ltr">
          <span
            className="text-4xl font-bold tabular-nums tracking-wider"
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
              color: elapsed > 0 || sessionRunning ? '#E4E4EC' : '#4A4A5A',
            }}
          >
            {formatTime(elapsed)}
          </span>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex items-center gap-3">
          {/* Start — amber */}
          <Button
            size="sm"
            onClick={handleStart}
            disabled={sessionRunning}
            className="gap-1.5 rounded-lg px-5 font-medium shadow-none"
            style={{
              backgroundColor: sessionRunning ? '' : '#D4A574',
              color: sessionRunning ? '' : '#1A1A24',
            }}
          >
            <Play size={15} strokeWidth={2.2} />
            ابدأ
          </Button>

          {/* Pause — outlined */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePause}
            disabled={!sessionRunning}
            className="gap-1.5 rounded-lg border-[#2A2A38] bg-transparent px-5 font-medium text-[#C4C4D4] hover:border-[#D4A574]/40 hover:text-[#D4A574] hover:bg-transparent shadow-none"
          >
            <Pause size={15} strokeWidth={2.2} />
            إيقاف
          </Button>

          {/* Reset — ghost */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={sessionStartTime === null && elapsed === 0}
            className="gap-1.5 rounded-lg px-5 font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 shadow-none"
          >
            <RotateCcw size={15} strokeWidth={2.2} />
            إعادة
          </Button>
        </div>
      </div>
    </div>
  );
}
