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

/** Session duration: 45 minutes in ms */
const SESSION_DURATION = 45 * 60 * 1000;

// ---------------------------------------------------------------------------
// Circular Progress Ring (SVG)
// ---------------------------------------------------------------------------

function CircularProgress({ progress, isRunning }: { progress: number; isRunning: boolean }) {
  const size = 200;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0 pointer-events-none"
      style={{ transform: 'rotate(-90deg)' }}
    >
      <defs>
        <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4A574" />
          <stop offset="100%" stopColor="#E8C9A0" />
        </linearGradient>
        {/* Glow filter */}
        <filter id="timerGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#timerGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        className="transition-all duration-500 ease-out"
        filter={isRunning ? 'url(#timerGlow)' : undefined}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sound Wave Visualization
// ---------------------------------------------------------------------------

function SoundWave() {
  return (
    <div className="flex items-center justify-center gap-[3px] h-5" dir="ltr">
      <div className="w-[3px] rounded-full bg-[#D4A574]/60 animate-sound-wave-1 origin-center" />
      <div className="w-[3px] rounded-full bg-[#D4A574]/80 animate-sound-wave-2 origin-center" />
      <div className="w-[3px] rounded-full bg-[#D4A574] animate-sound-wave-3 origin-center" />
      <div className="w-[3px] rounded-full bg-[#D4A574]/80 animate-sound-wave-2 origin-center" style={{ animationDelay: '0.15s' }} />
      <div className="w-[3px] rounded-full bg-[#D4A574]/60 animate-sound-wave-1 origin-center" style={{ animationDelay: '0.3s' }} />
    </div>
  );
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

  // ── Progress (capped at 100%) ──
  const progress = Math.min((elapsed / SESSION_DURATION) * 100, 100);

  // ── Handlers ──

  const handleStart = useCallback(() => {
    if (sessionRunning) return;
    if (sessionStartTime === null) {
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
      {/* Subtle gradient border wrapper with pulsing glow when running */}
      <div
        className={`absolute -inset-[1px] rounded-2xl transition-shadow duration-700 ${
          sessionRunning ? 'animate-timer-glow' : ''
        }`}
        style={{
          background: sessionRunning
            ? 'linear-gradient(135deg, rgba(212,165,116,0.4) 0%, rgba(212,165,116,0.08) 40%, rgba(212,165,116,0.04) 60%, rgba(212,165,116,0.3) 100%)'
            : 'linear-gradient(135deg, rgba(212,165,116,0.3) 0%, rgba(212,165,116,0.05) 40%, rgba(212,165,116,0.02) 60%, rgba(212,165,116,0.25) 100%)',
        }}
      />
      {/* Inner card */}
      <div
        className="relative flex flex-col items-center gap-5 rounded-2xl px-6 py-8"
        style={{
          backgroundColor: '#1A1A24',
        }}
      >
        {/* ── Timer label ── */}
        <span className="text-xs font-semibold text-[#B0B0C0] tracking-wide">
          مؤقت الجلسة
        </span>

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

        {/* ── Timer display with circular progress ── */}
        <div className="relative flex items-center justify-center select-none" dir="ltr">
          <CircularProgress progress={progress} isRunning={sessionRunning} />
          <span
            className="relative text-5xl font-extrabold tracking-[0.08em]"
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
              color: elapsed > 0 || sessionRunning ? '#E4E4EC' : '#4A4A5A',
            }}
          >
            {formatTime(elapsed)}
          </span>
        </div>

        {/* ── Sound wave visualization when running ── */}
        {sessionRunning && <SoundWave />}

        {/* ── Session progress label ── */}
        <span className="text-xs text-[#B0B0C0] font-medium tabular-nums">
          {Math.round(progress)}% من الحصة (45 دقيقة)
        </span>

        {/* ── Action buttons ── */}
        <div className="flex items-center gap-3">
          {/* Start — gradient amber */}
          <Button
            size="sm"
            onClick={handleStart}
            disabled={sessionRunning}
            className="gap-1.5 rounded-lg px-5 font-semibold shadow-none transition-all duration-300 hover:shadow-lg hover:shadow-[#D4A574]/25 active:scale-95 disabled:opacity-50 hover:translate-y-[-1px]"
            style={{
              background: sessionRunning
                ? undefined
                : 'linear-gradient(135deg, #D4A574 0%, #E8C9A0 50%, #D4A574 100%)',
              color: sessionRunning ? undefined : '#1A1A24',
            }}
          >
            <Play size={15} strokeWidth={2.2} />
            ابدأ
          </Button>

          {/* Pause — outlined with better hover */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePause}
            disabled={!sessionRunning}
            className="gap-1.5 rounded-lg border-[#2A2A38] bg-transparent px-5 font-medium text-[#C4C4D4] shadow-none
              transition-all duration-300
              hover:border-[#D4A574]/40 hover:text-[#D4A574] hover:bg-[#D4A574]/5 hover:translate-y-[-1px]
              active:scale-95 active:translate-y-0
              disabled:opacity-40 disabled:hover:translate-y-0"
          >
            <Pause size={15} strokeWidth={2.2} />
            إيقاف
          </Button>

          {/* Reset — ghost with red accent */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={sessionStartTime === null && elapsed === 0}
            className="gap-1.5 rounded-lg px-5 font-medium text-slate-500 shadow-none
              transition-all duration-300
              hover:text-red-400 hover:bg-red-500/10 hover:translate-y-[-1px]
              active:scale-95 active:translate-y-0
              disabled:opacity-30 disabled:hover:translate-y-0"
          >
            <RotateCcw size={15} strokeWidth={2.2} />
            إعادة
          </Button>
        </div>
      </div>

      {/* Pulsing glow animation (only when running) */}
      {sessionRunning && (
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes timer-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(212, 165, 116, 0.1), 0 0 60px rgba(212, 165, 116, 0.05); }
            50% { box-shadow: 0 0 35px rgba(212, 165, 116, 0.22), 0 0 90px rgba(212, 165, 116, 0.1); }
          }
          .animate-timer-glow {
            animation: timer-glow 2.5s ease-in-out infinite;
          }
        `}} />
      )}
    </div>
  );
}
