'use client';

// ============================================================
// AuraLab — Classroom Cameras section (overhauled)
// Canvas-simulated feeds + auto-rotation + grid/single views
// Entrance animation via GSAP, all strings via i18n t(key, locale)
// ============================================================

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Monitor,
  Pause,
  Play,
  Video,
  VideoOff,
} from 'lucide-react';
import gsap from 'gsap';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CAMERAS,
  CameraFeedCanvas,
  CameraLiveBadges,
  CameraStatusBadge,
  type CameraConfig,
} from './camera-feed-canvas';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const ROTATE_SPEED_OPTIONS: readonly number[] = [5, 8, 15];

const ONLINE_COUNT = CAMERAS.filter((c) => c.status !== 'offline').length;
const RECORDING_COUNT = CAMERAS.filter((c) => c.status === 'recording').length;
const OFFLINE_COUNT = CAMERAS.length - ONLINE_COUNT;

// ---------------------------------------------------------------------------
// CameraStage — canvas feed + LIVE/REC badges + status chip, 16:9
// ---------------------------------------------------------------------------

function CameraStage({
  camera,
  size,
  showRecording,
}: {
  camera: CameraConfig;
  size: 'grid' | 'single' | 'fullscreen';
  showRecording: boolean;
}) {
  const res =
    size === 'fullscreen'
      ? { w: 960, h: 540 }
      : size === 'single'
        ? { w: 640, h: 360 }
        : { w: 480, h: 270 };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-white/[0.05] bg-black">
      <CameraFeedCanvas camera={camera} width={res.w} height={res.h} />
      <CameraLiveBadges camera={camera} showRecording={showRecording} />
      <div className={cn('absolute right-2 top-2', size !== 'grid' && 'right-3 top-3')}>
        <CameraStatusBadge status={camera.status} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ClassroomCamera() {
  const locale = useAppStore((s) => s.locale);
  const cameraAutoRotate = useAppStore((s) => s.cameraAutoRotate);
  const setCameraAutoRotate = useAppStore((s) => s.setCameraAutoRotate);
  const cameraRotateSeconds = useAppStore((s) => s.cameraRotateSeconds);
  const setCameraRotateSeconds = useAppStore((s) => s.setCameraRotateSeconds);
  const animationsEnabled = useAppStore((s) => s.displaySettings.animationsEnabled);

  const [selectedCameraId, setSelectedCameraId] = useState(CAMERAS[0].id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRecording, setShowRecording] = useState(true);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');

  const rootRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const currentIndexRef = useRef(0);
  const rotateAccRef = useRef(0);

  const rotateSeconds = ROTATE_SPEED_OPTIONS.includes(cameraRotateSeconds) ? cameraRotateSeconds : 8;
  const selectedCamera = CAMERAS[currentIndex] ?? CAMERAS[0];

  // ── Navigation ──

  const selectCamera = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(CAMERAS.length - 1, index));
    currentIndexRef.current = clamped;
    setCurrentIndex(clamped);
    setSelectedCameraId(CAMERAS[clamped].id);
    // Manual jumps reset the auto-rotate countdown
    rotateAccRef.current = 0;
  }, []);

  // Advance to the next ONLINE camera (used by auto-rotation only)
  const goToNextOnline = useCallback(() => {
    for (let step = 1; step <= CAMERAS.length; step++) {
      const idx = (currentIndexRef.current + step) % CAMERAS.length;
      if (CAMERAS[idx].status !== 'offline') {
        currentIndexRef.current = idx;
        setCurrentIndex(idx);
        setSelectedCameraId(CAMERAS[idx].id);
        return;
      }
    }
  }, []);

  const goToPrevious = useCallback(() => {
    selectCamera((currentIndexRef.current - 1 + CAMERAS.length) % CAMERAS.length);
  }, [selectCamera]);

  const goToNext = useCallback(() => {
    selectCamera((currentIndexRef.current + 1) % CAMERAS.length);
  }, [selectCamera]);

  // ── Auto-rotation loop + countdown progress bar ──

  useEffect(() => {
    if (!cameraAutoRotate) return undefined;

    rotateAccRef.current = 0;
    let raf = 0;
    let last = performance.now();
    const total = rotateSeconds * 1000;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(now - last, 250);
      last = now;
      if (document.hidden) return;

      rotateAccRef.current += dt;
      const remaining = Math.max(0, total - rotateAccRef.current);

      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${(1 - remaining / total).toFixed(4)})`;
      }
      if (remaining <= 0) {
        rotateAccRef.current = 0;
        goToNextOnline();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cameraAutoRotate, rotateSeconds, goToNextOnline]);

  // ── Fullscreen ──

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      if (rootRef.current) {
        void rootRef.current.requestFullscreen().catch(() => undefined);
      }
    } else {
      void document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ── GSAP entrance: stagger fade-up of cards on mount ──

  useIsomorphicLayoutEffect(() => {
    if (!animationsEnabled) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-anim="cam-card"]',
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.08, overwrite: 'auto' }
      );
    }, rootRef);
    return () => ctx.revert();
  }, [animationsEnabled]);

  // ── Stats bar data ──

  const stats = [
    { count: ONLINE_COUNT, label: t('general.online', locale), dot: 'bg-emerald-400', pulse: false },
    { count: RECORDING_COUNT, label: t('general.recording', locale), dot: 'bg-rose-400', pulse: true },
    { count: OFFLINE_COUNT, label: t('general.offline', locale), dot: 'bg-slate-500', pulse: false },
  ];

  return (
    <div ref={rootRef} dir="rtl" className="flex flex-col gap-6">
      {/* ── Page header + stats bar ── */}
      <div data-anim="cam-card" className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4A574]/10">
            <Camera className="h-5 w-5 text-[#D4A574]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {t('camera.title', locale)}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{t('camera.subtitle', locale)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stats.map((stat) => (
            <span
              key={stat.label}
              className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#1A1A24] px-3 py-1.5 text-sm text-slate-300"
            >
              <span className={cn('h-2 w-2 rounded-full', stat.dot, stat.pulse && 'animate-pulse')} />
              <span className="font-semibold tabular-nums text-white">{stat.count}</span>
              {stat.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Controls bar (wraps on mobile) ── */}
      <div
        data-anim="cam-card"
        className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-[#1A1A24] p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Auto-rotate play/pause */}
          <Button
            onClick={() => {
              if (!cameraAutoRotate) setViewMode('single');
              setCameraAutoRotate(!cameraAutoRotate);
            }}
            variant="outline"
            size="sm"
            className={cn(
              'h-10 gap-2 rounded-lg transition-colors',
              cameraAutoRotate
                ? 'border-[#D4A574]/30 bg-[#D4A574]/10 text-[#D4A574] hover:bg-[#D4A574]/15 hover:text-[#D4A574]'
                : 'border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white'
            )}
            title={t('camera.autoRotate', locale)}
          >
            {cameraAutoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {t('camera.autoRotate', locale)}
          </Button>

          {/* Rotation speed selector */}
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-500 lg:inline">{t('camera.rotateSpeed', locale)}</span>
            <Select
              value={String(rotateSeconds)}
              onValueChange={(v) => setCameraRotateSeconds(Number(v))}
            >
              <SelectTrigger className="h-10 w-[5.5rem] rounded-lg border-white/[0.08] bg-white/[0.03] text-slate-200 focus:border-[#D4A574]/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/[0.08] bg-[#1A1A24]">
                {ROTATE_SPEED_OPTIONS.map((s) => (
                  <SelectItem
                    key={s}
                    value={String(s)}
                    className="text-slate-200 focus:bg-white/[0.05] focus:text-white"
                  >
                    <span dir="ltr" className="tabular-nums">{s}s</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden h-6 w-px bg-white/[0.08] sm:block" />

          {/* Camera selector dropdown */}
          <Select
            value={selectedCameraId}
            onValueChange={(id) => {
              const idx = CAMERAS.findIndex((c) => c.id === id);
              if (idx >= 0) selectCamera(idx);
            }}
          >
            <SelectTrigger className="h-10 w-full rounded-lg border-white/[0.08] bg-white/[0.03] text-slate-200 focus:border-[#D4A574]/50 sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/[0.08] bg-[#1A1A24]">
              {CAMERAS.map((cam) => (
                <SelectItem
                  key={cam.id}
                  value={cam.id}
                  className="text-slate-200 focus:bg-white/[0.05] focus:text-white"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        cam.status === 'online' && 'bg-emerald-400',
                        cam.status === 'recording' && 'bg-rose-400',
                        cam.status === 'offline' && 'bg-slate-500'
                      )}
                    />
                    {cam.name} — {cam.location}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Previous/Next navigation (resets rotation timer) */}
          <div className="flex items-center gap-1">
            <Button
              onClick={goToPrevious}
              variant="outline"
              size="sm"
              className="h-10 w-10 rounded-lg border-white/[0.08] p-0 text-slate-300 hover:bg-white/[0.05] hover:text-white"
              title={t('camera.prev', locale)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span dir="ltr" className="min-w-[3rem] text-center text-xs tabular-nums text-slate-400">
              {currentIndex + 1} / {CAMERAS.length}
            </span>
            <Button
              onClick={goToNext}
              variant="outline"
              size="sm"
              className="h-10 w-10 rounded-lg border-white/[0.08] p-0 text-slate-300 hover:bg-white/[0.05] hover:text-white"
              title={t('camera.next', locale)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <Button
            onClick={() => setViewMode(viewMode === 'single' ? 'grid' : 'single')}
            variant="outline"
            size="sm"
            className={cn(
              'h-10 gap-2 rounded-lg transition-colors',
              viewMode === 'grid'
                ? 'border-[#D4A574]/30 bg-[#D4A574]/10 text-[#D4A574] hover:bg-[#D4A574]/15 hover:text-[#D4A574]'
                : 'border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white'
            )}
            title={viewMode === 'single' ? t('camera.grid', locale) : t('camera.single', locale)}
          >
            <Monitor className="h-4 w-4" />
            {viewMode === 'single' ? t('camera.grid', locale) : t('camera.single', locale)}
          </Button>

          {/* Recording indicator toggle */}
          <Button
            onClick={() => setShowRecording(!showRecording)}
            variant="outline"
            size="sm"
            className={cn(
              'h-10 gap-2 rounded-lg transition-colors',
              showRecording
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/15 hover:text-rose-400'
                : 'border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white'
            )}
            title={t('camera.recordingIndicator', locale)}
          >
            {showRecording ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            {t('camera.recordingIndicator', locale)}
          </Button>

          {/* Fullscreen toggle */}
          <Button
            onClick={toggleFullscreen}
            variant="outline"
            size="sm"
            className="h-10 gap-2 rounded-lg border-white/[0.08] text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white"
            title={isFullscreen ? t('camera.exitFullscreen', locale) : t('camera.fullscreen', locale)}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            {isFullscreen ? t('camera.exitFullscreen', locale) : t('camera.fullscreen', locale)}
          </Button>
        </div>
      </div>

      {/* ── Camera feed(s) ── */}
      {viewMode === 'single' ? (
        <div
          data-anim="cam-card"
          className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#1A1A24]"
        >
          {/* Auto-rotate countdown progress */}
          {cameraAutoRotate && (
            <div className="h-1 w-full overflow-hidden bg-white/[0.05]">
              <div
                ref={progressRef}
                className="h-full w-full origin-right bg-[#D4A574] will-change-transform"
                style={{ transform: 'scaleX(0)' }}
              />
            </div>
          )}
          <div className="p-3">
            <CameraStage
              camera={selectedCamera}
              size={isFullscreen ? 'fullscreen' : 'single'}
              showRecording={showRecording}
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-white/[0.04] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="truncate text-sm font-semibold text-slate-200">{selectedCamera.name}</span>
              <span className="truncate text-xs text-slate-500">{selectedCamera.location}</span>
            </div>
            <CameraStatusBadge status={selectedCamera.status} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CAMERAS.map((camera, index) => (
            <div
              key={camera.id}
              data-anim="cam-card"
              role="button"
              tabIndex={0}
              onClick={() => {
                selectCamera(index);
                setViewMode('single');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectCamera(index);
                  setViewMode('single');
                }
              }}
              className="cursor-pointer overflow-hidden rounded-xl border bg-[#1A1A24] outline-none transition-all duration-200 hover:ring-1 hover:ring-[#D4A574]/30 focus-visible:ring-2 focus-visible:ring-[#D4A574]/50"
              style={{
                borderColor:
                  camera.id === selectedCameraId
                    ? 'rgba(212,165,116,0.3)'
                    : 'rgba(255,255,255,0.06)',
              }}
            >
              <div className="p-2">
                <CameraStage camera={camera} size="grid" showRecording={showRecording} />
              </div>
              <div className="flex items-center justify-between border-t border-white/[0.04] px-3 py-2">
                <span className="text-xs font-medium text-slate-300">{camera.name}</span>
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    camera.status === 'online' && 'bg-emerald-400',
                    camera.status === 'recording' && 'animate-pulse bg-rose-400',
                    camera.status === 'offline' && 'bg-slate-500'
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
