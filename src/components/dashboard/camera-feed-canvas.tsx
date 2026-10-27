'use client';

// ============================================================
// AuraLab — Shared simulated CCTV camera feed (canvas)
// Used by classroom-camera.tsx and camera-widget-dashboard.tsx
// Realism: moving students, pacing teacher, sensor noise,
// scanlines + sweeping band, vignette, signal glitches on REC cams
// ============================================================

import { useEffect, useRef } from 'react';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';

export type CameraStatus = 'online' | 'offline' | 'recording';

export interface CameraConfig {
  id: string;
  name: string;
  location: string;
  status: CameraStatus;
}

export const CAMERAS: CameraConfig[] = [
  { id: 'cam-1', name: 'كاميرا ١', location: 'قاعة ١٠١ - الصف الأول أ', status: 'online' },
  { id: 'cam-2', name: 'كاميرا ٢', location: 'قاعة ١٠٢ - الصف الأول ب', status: 'recording' },
  { id: 'cam-3', name: 'كاميرا ٣', location: 'قاعة ٢٠١ - الصف الثاني أ', status: 'online' },
  { id: 'cam-4', name: 'كاميرا ٤', location: 'قاعة ٢٠٢ - الصف الثاني ب', status: 'offline' },
  { id: 'cam-5', name: 'كاميرا ٥', location: 'قاعة ٣٠١ - الصف الثالث أ', status: 'online' },
  { id: 'cam-6', name: 'كاميرا ٦', location: 'قاعة ٣٠٢ - الصف الثالث ب', status: 'recording' },
];

const pad2 = (n: number): string => String(n).padStart(2, '0');

// ---------------------------------------------------------------------------
// CameraFeedCanvas — the raw animated canvas feed (no DOM overlays)
// ---------------------------------------------------------------------------

export function CameraFeedCanvas({
  camera,
  width = 480,
  height = 270,
}: {
  camera: CameraConfig;
  width?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const locale = useAppStore((s) => s.locale);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let raf = 0;
    let glitchUntil = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);

      // Read size every frame so attribute changes (fullscreen/resize) apply live
      const w = canvas.width;
      const h = canvas.height;
      const now = performance.now();
      const time = now * 0.001;

      // Base
      ctx.fillStyle = '#0a0a12';
      ctx.fillRect(0, 0, w, h);

      if (camera.status === 'offline') {
        // Heavy analog static
        for (let i = 0; i < 160; i++) {
          ctx.fillStyle = `rgba(190,200,230,${(Math.random() * 0.08).toFixed(3)})`;
          ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
        }
        // Occasional tear line
        if (Math.random() < 0.06) {
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          ctx.fillRect(0, Math.random() * h, w, 1 + Math.random() * 2);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#8b93a7';
        ctx.font = `600 ${Math.round(h * 0.062)}px sans-serif`;
        ctx.fillText(t('camera.offlineMessage', locale), w / 2, h / 2 - 8);
        ctx.font = `${Math.round(h * 0.05)}px sans-serif`;
        ctx.fillStyle = '#565d70';
        ctx.fillText(t('camera.checkConnection', locale), w / 2, h / 2 + 18);
        return;
      }

      // ── Grid pattern backdrop ──
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // ── Floor ──
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(0, h * 0.4, w, h * 0.6);

      // ── Whiteboard ──
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(w * 0.15, h * 0.02, w * 0.7, h * 0.08);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.strokeRect(w * 0.15, h * 0.02, w * 0.7, h * 0.08);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = `${Math.round(h * 0.037)}px sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText('الجبر والمعادلات', w * 0.8, h * 0.07);

      // ── Teacher desk ──
      ctx.fillStyle = 'rgba(212,165,116,0.08)';
      ctx.fillRect(w * 0.3, h * 0.1, w * 0.4, h * 0.15);
      ctx.strokeStyle = 'rgba(212,165,116,0.2)';
      ctx.strokeRect(w * 0.3, h * 0.1, w * 0.4, h * 0.15);

      // ── Pacing teacher ──
      const teacherX = w * 0.5 + Math.sin(time * 0.22) * w * 0.17;
      const teacherY = h * 0.175;
      ctx.fillStyle = 'rgba(212,165,116,0.35)';
      ctx.beginPath();
      ctx.arc(teacherX, teacherY, h * 0.024, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(teacherX - h * 0.026, teacherY + h * 0.018, h * 0.052, h * 0.045);

      // ── Students (3 rows × 4 cols, subtle bob + sway) ──
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
          const x = w * 0.12 + col * w * 0.2;
          const y = h * 0.3 + row * h * 0.2;
          const deskW = w * 0.14;
          const deskH = h * 0.08;

          ctx.fillStyle = 'rgba(255,255,255,0.03)';
          ctx.fillRect(x, y, deskW, deskH);
          ctx.strokeStyle = 'rgba(255,255,255,0.06)';
          ctx.strokeRect(x, y, deskW, deskH);

          const seed = row * 4 + col;
          const bob = Math.sin(time * (1.1 + (seed % 5) * 0.13) + row * 1.5 + col * 0.7);
          const sway = Math.cos(time * 0.5 + col * 0.9 + row) * 1.4;
          const cx = x + deskW / 2 + sway;
          const cy = y - h * 0.03 + bob * 1.6;
          const bodyColor = `rgba(${100 + col * 30}, ${130 + row * 20}, ${160 + col * 20}, 0.3)`;

          ctx.fillStyle = bodyColor;
          ctx.fillRect(cx - 6, cy + 3, 12, 9);
          ctx.beginPath();
          ctx.arc(cx, cy, 5, 0, Math.PI * 2);
          ctx.fill();

          // Occasionally a student raises a hand
          const handPhase = (time * 0.32 + seed * 1.7) % 14;
          if (handPhase < 1.1) {
            ctx.strokeStyle = bodyColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx + 5, cy + 5);
            ctx.lineTo(cx + 9, cy - 6);
            ctx.stroke();
          }
        }
      }

      // ── OSD overlay bar (name + timestamp) ──
      const osdH = Math.max(22, Math.round(h * 0.11));
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, h - osdH, w, osdH);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = `${Math.round(h * 0.041)}px sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(`${camera.name} — ${camera.location}`, w - 10, h - osdH / 2 + 4);

      const d = new Date();
      ctx.textAlign = 'left';
      ctx.fillText(`${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`, 10, h - osdH / 2 + 4);

      // ── Scanlines ──
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
      }

      // ── Smooth sweeping band ──
      const bandY = ((time * 42) % (h + 120)) - 120;
      const band = ctx.createLinearGradient(0, bandY, 0, bandY + 120);
      band.addColorStop(0, 'rgba(255,255,255,0)');
      band.addColorStop(0.5, 'rgba(255,255,255,0.035)');
      band.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = band;
      ctx.fillRect(0, bandY, w, 120);

      // ── Vignette ──
      const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.9);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.38)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      // ── Sensor noise ──
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = `rgba(255,255,255,${(Math.random() * 0.05).toFixed(3)})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
      }

      // ── Signal glitch (occasional, recording cams only) ──
      if (camera.status === 'recording') {
        if (now >= glitchUntil && Math.random() < 0.006) {
          glitchUntil = now + 80 + Math.random() * 180;
        }
        if (now < glitchUntil) {
          const slices = 2 + Math.floor(Math.random() * 3);
          for (let i = 0; i < slices; i++) {
            const sy = Math.random() * (h - 24);
            const sh = 3 + Math.random() * 12;
            const dx = (Math.random() - 0.5) * 26;
            ctx.drawImage(canvas, 0, sy, w, sh, dx, sy, w, sh);
          }
          ctx.fillStyle = `rgba(255,40,80,${(0.03 + Math.random() * 0.07).toFixed(3)})`;
          ctx.fillRect(0, 0, w, h);
          if (Math.random() < 0.4) {
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(0, Math.random() * h, w, 1 + Math.random() * 5);
          }
        }
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [camera, locale]);

  return <canvas ref={canvasRef} width={width} height={height} className="block h-full w-full" />;
}

// ---------------------------------------------------------------------------
// CameraLiveBadges — pulsing LIVE badge (+ REC chip) overlaid top-left
// ---------------------------------------------------------------------------

export function CameraLiveBadges({
  camera,
  showRecording = true,
}: {
  camera: CameraConfig;
  showRecording?: boolean;
}) {
  const locale = useAppStore((s) => s.locale);
  const isLive = camera.status === 'online' || camera.status === 'recording';
  const showRec = showRecording && camera.status === 'recording';
  if (!isLive && !showRec) return null;

  return (
    <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
      {isLive && (
        <span className="flex items-center gap-1.5 rounded-full bg-rose-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-md shadow-rose-950/40">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-80" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          {t('camera.live', locale)}
        </span>
      )}
      {showRec && (
        <span className="flex items-center gap-1.5 rounded-md border border-rose-500/40 bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-rose-400 backdrop-blur-sm">
          <Circle className="h-2 w-2 animate-pulse fill-rose-400 text-rose-400" />
          {t('general.recording', locale)}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CameraStatusBadge — colored status chip (online / recording / offline)
// ---------------------------------------------------------------------------

export function CameraStatusBadge({ status }: { status: CameraStatus }) {
  const locale = useAppStore((s) => s.locale);
  return (
    <Badge
      className={cn(
        'rounded-full border px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm',
        status === 'online' && 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
        status === 'recording' && 'border-rose-500/30 bg-rose-500/15 text-rose-400',
        status === 'offline' && 'border-slate-500/30 bg-slate-500/15 text-slate-400'
      )}
    >
      {status === 'online'
        ? t('general.online', locale)
        : status === 'recording'
          ? t('general.recording', locale)
          : t('general.offline', locale)}
    </Badge>
  );
}
