'use client';

// ============================================================
// AuraLab — Compact live-cameras widget for the main dashboard
// One cycling canvas feed (6s, crossfade), pauses when tab hidden.
// "View all" jumps to the full camera section via setActiveSection.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { CAMERAS, CameraFeedCanvas, CameraLiveBadges } from './camera-feed-canvas';

const ROTATE_MS = 6000;
const FADE_MS = 700;

const ONLINE_CAMERAS = CAMERAS.filter((c) => c.status !== 'offline');

export default function CameraWidgetDashboard() {
  const locale = useAppStore((s) => s.locale);
  const setActiveSection = useAppStore((s) => s.setActiveSection);

  const [currentPos, setCurrentPos] = useState(0);
  const [prevPos, setPrevPos] = useState<number | null>(null);
  const currentPosRef = useRef(0);
  const accRef = useRef(0);
  const fadeTimerRef = useRef<number | null>(null);

  // Swap feeds with a crossfade (old layer fades out on top of the new one)
  const swapTo = useCallback((nextPos: number) => {
    setPrevPos(currentPosRef.current);
    currentPosRef.current = nextPos;
    setCurrentPos(nextPos);
    accRef.current = 0;
    if (fadeTimerRef.current !== null) window.clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = window.setTimeout(() => setPrevPos(null), FADE_MS);
  }, []);

  const advance = useCallback(() => {
    if (ONLINE_CAMERAS.length === 0) return;
    swapTo((currentPosRef.current + 1) % ONLINE_CAMERAS.length);
  }, [swapTo]);

  const jumpToCamera = useCallback(
    (cameraId: string) => {
      const pos = ONLINE_CAMERAS.findIndex((c) => c.id === cameraId);
      if (pos < 0 || pos === currentPosRef.current) return;
      swapTo(pos);
    },
    [swapTo]
  );

  // Auto-advance every 6s — paused while the document is hidden
  useEffect(() => {
    if (ONLINE_CAMERAS.length <= 1) return undefined;

    let raf = 0;
    let last = performance.now();

    const onVisibility = () => {
      // Re-baseline the clock so returning to the tab doesn't fire a burst
      last = performance.now();
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(now - last, 250);
      last = now;
      if (document.hidden) return;
      accRef.current += dt;
      if (accRef.current >= ROTATE_MS) advance();
    };

    document.addEventListener('visibilitychange', onVisibility);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      if (fadeTimerRef.current !== null) window.clearTimeout(fadeTimerRef.current);
    };
  }, [advance]);

  const current = ONLINE_CAMERAS[currentPos] ?? CAMERAS[0];
  const prev = prevPos !== null ? ONLINE_CAMERAS[prevPos] : undefined;

  return (
    <div
      dir="rtl"
      className="w-full overflow-hidden rounded-xl border border-white/[0.06] bg-[#1A1A24] transition-colors duration-300 hover:border-[#D4A574]/40"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: '@keyframes cam-widget-fade-out { from { opacity: 1; } to { opacity: 0; } }',
        }}
      />

      {/* ── Header row ── */}
      <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D4A574]/10">
            <Video className="h-4 w-4 text-[#D4A574]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-white">
                {t('dashboard.liveCameras', locale)}
              </span>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-rose-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                <span className="relative flex h-1 w-1">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-80" />
                  <span className="relative inline-flex h-1 w-1 rounded-full bg-white" />
                </span>
                {t('camera.live', locale)}
              </span>
            </div>
            <span className="block truncate text-xs text-slate-500">
              {current.name} — {current.location}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveSection('camera')}
          className="shrink-0 gap-1 rounded-lg px-2 text-xs font-medium text-[#D4A574] hover:bg-[#D4A574]/10 hover:text-[#D4A574]"
          title={t('camera.viewAll', locale)}
        >
          <span className="hidden sm:inline">{t('camera.viewAll', locale)}</span>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ── Cycling feed (16:9) with crossfade ── */}
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        <div className="absolute inset-0">
          <CameraFeedCanvas camera={current} width={640} height={360} />
        </div>
        {prev && (
          <div
            key={`prev-${prev.id}`}
            className="pointer-events-none absolute inset-0"
            style={{ animation: `cam-widget-fade-out ${FADE_MS}ms ease-in-out forwards` }}
          >
            <CameraFeedCanvas camera={prev} width={640} height={360} />
          </div>
        )}
        <CameraLiveBadges camera={current} />
      </div>

      {/* ── Footer: mini dots, one per camera ── */}
      <div className="flex items-center justify-center gap-2 border-t border-white/[0.04] px-4 py-2.5">
        {CAMERAS.map((cam) => {
          const isOnline = cam.status !== 'offline';
          const isActive = cam.id === current.id;
          if (!isOnline) {
            return (
              <span
                key={cam.id}
                title={`${cam.name} — ${t('general.offline', locale)}`}
                className="h-1.5 w-1.5 rounded-full bg-white/10"
              />
            );
          }
          return (
            <button
              key={cam.id}
              type="button"
              onClick={() => jumpToCamera(cam.id)}
              title={cam.name}
              aria-label={cam.name}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                isActive ? 'w-5 bg-[#D4A574]' : 'w-1.5 bg-white/25 hover:bg-white/50'
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
