'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Circle,
  Video,
  VideoOff,
  Monitor,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ---------------------------------------------------------------------------
// Camera Configuration
// ---------------------------------------------------------------------------

interface CameraConfig {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'recording';
}

const CAMERAS: CameraConfig[] = [
  { id: 'cam-1', name: 'كاميرا ١', location: 'قاعة ١٠١ - الصف الأول أ', status: 'online' },
  { id: 'cam-2', name: 'كاميرا ٢', location: 'قاعة ١٠٢ - الصف الأول ب', status: 'recording' },
  { id: 'cam-3', name: 'كاميرا ٣', location: 'قاعة ٢٠١ - الصف الثاني أ', status: 'online' },
  { id: 'cam-4', name: 'كاميرا ٤', location: 'قاعة ٢٠٢ - الصف الثاني ب', status: 'offline' },
  { id: 'cam-5', name: 'كاميرا ٥', location: 'قاعة ٣٠١ - الصف الثالث أ', status: 'online' },
  { id: 'cam-6', name: 'كاميرا ٦', location: 'قاعة ٣٠٢ - الصف الثالث ب', status: 'recording' },
];

// ---------------------------------------------------------------------------
// Single Camera View
// ---------------------------------------------------------------------------

function CameraFeed({
  camera,
  isFullscreen,
  showRecording,
}: {
  camera: CameraConfig;
  isFullscreen: boolean;
  showRecording: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const draw = () => {
      // Dark background
      ctx.fillStyle = '#0a0a12';
      ctx.fillRect(0, 0, w, h);

      // Simulated grid pattern
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

      if (camera.status === 'offline') {
        // Offline overlay
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('الكاميرا غير متصلة', w / 2, h / 2 - 10);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText('يرجى التحقق من الاتصال', w / 2, h / 2 + 15);
        return;
      }

      // Simulated classroom scene with desks
      const time = Date.now() * 0.001;

      // Floor
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(0, h * 0.4, w, h * 0.6);

      // Teacher desk area
      ctx.fillStyle = 'rgba(212,165,116,0.08)';
      ctx.fillRect(w * 0.3, h * 0.1, w * 0.4, h * 0.15);
      ctx.strokeStyle = 'rgba(212,165,116,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(w * 0.3, h * 0.1, w * 0.4, h * 0.15);

      // Whiteboard
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(w * 0.15, h * 0.02, w * 0.7, h * 0.08);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.strokeRect(w * 0.15, h * 0.02, w * 0.7, h * 0.08);

      // Text on whiteboard
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('الجبر والمعادلات', w * 0.8, h * 0.07);

      // Student desks - 3 rows x 4 columns
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
          const x = w * 0.12 + col * w * 0.2;
          const y = h * 0.3 + row * h * 0.2;
          const deskW = w * 0.14;
          const deskH = h * 0.08;

          // Desk
          ctx.fillStyle = 'rgba(255,255,255,0.03)';
          ctx.fillRect(x, y, deskW, deskH);
          ctx.strokeStyle = 'rgba(255,255,255,0.06)';
          ctx.strokeRect(x, y, deskW, deskH);

          // Student circle (head)
          const studentOffset = Math.sin(time + row * 1.5 + col * 0.7) * 2;
          ctx.beginPath();
          ctx.arc(x + deskW / 2, y - 8 + studentOffset, 5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${100 + col * 30}, ${130 + row * 20}, ${160 + col * 20}, 0.3)`;
          ctx.fill();
        }
      }

      // Camera info overlay
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, h - 30, w, 30);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${camera.name} — ${camera.location}`, w - 10, h - 10);

      // Timestamp
      ctx.textAlign = 'left';
      const now = new Date();
      ctx.fillText(
        now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        10,
        h - 10
      );

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animRef.current);
  }, [camera, isFullscreen]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
      <canvas
        ref={canvasRef}
        width={isFullscreen ? 960 : 480}
        height={isFullscreen ? 540 : 270}
        className="w-full h-full"
      />

      {/* Recording indicator */}
      {showRecording && camera.status === 'recording' && (
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-rose-500/20 border border-rose-500/30 rounded-lg px-2.5 py-1">
          <Circle className="h-3 w-3 text-rose-400 fill-rose-400 animate-pulse" />
          <span className="text-xs font-semibold text-rose-400">REC</span>
        </div>
      )}

      {/* Status indicator */}
      <div className="absolute top-3 right-3">
        <Badge
          className={cn(
            'text-[10px] font-medium px-2 py-0.5 rounded-full',
            camera.status === 'online' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
            camera.status === 'recording' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
            'bg-slate-500/15 text-slate-400 border-slate-500/30'
          )}
        >
          {camera.status === 'online' ? 'متصل' : camera.status === 'recording' ? 'تسجيل' : 'غير متصل'}
        </Badge>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ClassroomCamera() {
  const [selectedCameraId, setSelectedCameraId] = useState(CAMERAS[0].id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRecording, setShowRecording] = useState(true);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const selectedCamera = CAMERAS.find((c) => c.id === selectedCameraId) || CAMERAS[0];

  const goToPrevious = useCallback(() => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : CAMERAS.length - 1;
    setCurrentIndex(newIndex);
    setSelectedCameraId(CAMERAS[newIndex].id);
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    const newIndex = currentIndex < CAMERAS.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    setSelectedCameraId(CAMERAS[newIndex].id);
  }, [currentIndex]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      fullscreenRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const onlineCount = CAMERAS.filter((c) => c.status !== 'offline').length;
  const recordingCount = CAMERAS.filter((c) => c.status === 'recording').length;

  return (
    <div className="flex flex-col gap-6" dir="rtl" ref={fullscreenRef}>
      {/* ── Page header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#D4A574]/10">
            <Camera className="h-5 w-5 text-[#D4A574]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl flex items-center gap-3">
              كاميرات الفصول
              <Badge className="bg-[#D4A574]/15 text-[#D4A574] border-[#D4A574]/20 hover:bg-[#D4A574]/20 text-sm px-2.5 py-0.5 rounded-full font-semibold tabular-nums">
                {onlineCount} متصل
              </Badge>
              {recordingCount > 0 && (
                <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/20 text-sm px-2.5 py-0.5 rounded-full font-semibold tabular-nums flex items-center gap-1.5">
                  <Circle className="h-2.5 w-2.5 fill-rose-400 animate-pulse" />
                  {recordingCount} تسجيل
                </Badge>
              )}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              مراقبة البث المباشر للفصول التعليمية
            </p>
          </div>
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl p-4"
        style={{
          backgroundColor: '#1A1A24',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Camera selector dropdown */}
          <Select value={selectedCameraId} onValueChange={(id) => {
            setSelectedCameraId(id);
            const idx = CAMERAS.findIndex((c) => c.id === id);
            if (idx >= 0) setCurrentIndex(idx);
          }}>
            <SelectTrigger className="w-64 bg-white/[0.03] border-white/[0.08] text-slate-200 focus:border-[#D4A574]/50 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/[0.08]">
              {CAMERAS.map((cam) => (
                <SelectItem key={cam.id} value={cam.id} className="text-slate-200 focus:bg-white/[0.05] focus:text-white">
                  <span className="flex items-center gap-2">
                    <span className={cn(
                      'h-2 w-2 rounded-full',
                      cam.status === 'online' ? 'bg-emerald-400' :
                      cam.status === 'recording' ? 'bg-rose-400' : 'bg-slate-500'
                    )} />
                    {cam.name} — {cam.location}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Previous/Next navigation */}
          <div className="flex items-center gap-1">
            <Button
              onClick={goToPrevious}
              variant="outline"
              size="sm"
              className="h-10 w-10 p-0 border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-lg"
              title="الكاميرا السابقة"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-xs text-slate-400 tabular-nums min-w-[3rem] text-center">
              {currentIndex + 1} / {CAMERAS.length}
            </span>
            <Button
              onClick={goToNext}
              variant="outline"
              size="sm"
              className="h-10 w-10 p-0 border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-lg"
              title="الكاميرا التالية"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <Button
            onClick={() => setViewMode(viewMode === 'single' ? 'grid' : 'single')}
            variant="outline"
            size="sm"
            className={cn(
              'gap-2 h-10 transition-colors rounded-lg',
              viewMode === 'grid'
                ? 'bg-[#D4A574]/10 text-[#D4A574] border-[#D4A574]/30'
                : 'border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white'
            )}
            title={viewMode === 'single' ? 'عرض شبكي' : 'عرض مفرد'}
          >
            <Monitor className="h-4 w-4" />
            {viewMode === 'single' ? 'شبكي' : 'مفرد'}
          </Button>

          {/* Recording indicator toggle */}
          <Button
            onClick={() => setShowRecording(!showRecording)}
            variant="outline"
            size="sm"
            className={cn(
              'gap-2 h-10 transition-colors rounded-lg',
              showRecording
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white'
            )}
            title={showRecording ? 'إخفاء مؤشر التسجيل' : 'إظهار مؤشر التسجيل'}
          >
            {showRecording ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            مؤشر التسجيل
          </Button>

          {/* Fullscreen toggle */}
          <Button
            onClick={toggleFullscreen}
            variant="outline"
            size="sm"
            className="gap-2 h-10 border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-white transition-colors rounded-lg"
            title={isFullscreen ? 'خروج من ملء الشاشة' : 'ملء الشاشة'}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            {isFullscreen ? 'تصغير' : 'ملء الشاشة'}
          </Button>
        </div>
      </div>

      {/* ── Camera feed(s) ── */}
      {viewMode === 'single' ? (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: '#1A1A24',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="p-3">
            <CameraFeed
              camera={selectedCamera}
              isFullscreen={isFullscreen}
              showRecording={showRecording}
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.04]">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-200">{selectedCamera.name}</span>
              <span className="text-xs text-slate-500">{selectedCamera.location}</span>
            </div>
            <Badge
              className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full',
                selectedCamera.status === 'online' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                selectedCamera.status === 'recording' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                'bg-slate-500/15 text-slate-400 border-slate-500/30'
              )}
            >
              {selectedCamera.status === 'online' ? 'متصل' : selectedCamera.status === 'recording' ? 'تسجيل مباشر' : 'غير متصل'}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {CAMERAS.map((camera) => (
            <div
              key={camera.id}
              className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:ring-1 hover:ring-[#D4A574]/30"
              style={{
                backgroundColor: '#1A1A24',
                border: camera.id === selectedCameraId
                  ? '1px solid rgba(212,165,116,0.3)'
                  : '1px solid rgba(255,255,255,0.06)',
              }}
              onClick={() => {
                setSelectedCameraId(camera.id);
                setCurrentIndex(CAMERAS.findIndex((c) => c.id === camera.id));
              }}
            >
              <div className="p-2">
                <CameraFeed
                  camera={camera}
                  isFullscreen={false}
                  showRecording={showRecording}
                />
              </div>
              <div className="flex items-center justify-between px-3 py-2 border-t border-white/[0.04]">
                <span className="text-xs font-medium text-slate-300">{camera.name}</span>
                <span className={cn(
                  'h-2 w-2 rounded-full',
                  camera.status === 'online' ? 'bg-emerald-400' :
                  camera.status === 'recording' ? 'bg-rose-400 animate-pulse' : 'bg-slate-500'
                )} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
