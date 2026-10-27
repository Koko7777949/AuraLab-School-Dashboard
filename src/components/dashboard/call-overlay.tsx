'use client';

/* ============================================================
 * AuraLab — Call Overlay (simulated voice / video calls)
 * ------------------------------------------------------------
 * Trigger from anywhere:
 *   import { useCallStore } from './call-overlay';
 *   useCallStore.getState().startCall({ contactId, contactName, kind: 'voice' | 'video' });
 *
 * Flow: ringing (2.5s) → connecting (1.5s) → active (timer) → ended (1.5s → close)
 * Media APIs are wrapped in try/catch: if getUserMedia is denied or
 * unavailable (e.g. headless), the call gracefully simulates.
 * ============================================================ */

import { useCallback, useEffect, useRef, useState } from 'react';
import { create } from 'zustand';
import { t } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  SwitchCamera,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CallKind = 'voice' | 'video';
export type CallPhase = 'ringing' | 'connecting' | 'active' | 'ended';
export type CallEndReason = 'ended' | 'declined';

export interface CallTarget {
  contactId: string;
  contactName: string;
  contactAvatar?: string;
  kind: CallKind;
}

interface CallOverlayState {
  activeCall: CallTarget | null;
  phase: CallPhase;
  duration: number;
  endedDuration: number;
  endedReason: CallEndReason;
  startCall: (target: CallTarget) => void;
  answerCall: () => void;
  endCall: (reason?: CallEndReason) => void;
  setPhase: (phase: CallPhase) => void;
  setDuration: (seconds: number) => void;
  clearCall: () => void;
}

/* ------------------------------------------------------------------ */
/*  Tiny call store (zustand)                                          */
/* ------------------------------------------------------------------ */

export const useCallStore = create<CallOverlayState>((set, get) => ({
  activeCall: null,
  phase: 'ringing',
  duration: 0,
  endedDuration: 0,
  endedReason: 'ended',
  startCall: (target) =>
    set({
      activeCall: target,
      phase: 'ringing',
      duration: 0,
      endedDuration: 0,
      endedReason: 'ended',
    }),
  answerCall: () => {
    if (get().phase === 'ringing') set({ phase: 'connecting' });
  },
  endCall: (reason: CallEndReason = 'ended') => {
    const { phase, duration } = get();
    if (phase === 'ended' || !get().activeCall) return;
    set({
      phase: 'ended',
      endedDuration: duration,
      endedReason: phase === 'active' ? 'ended' : reason,
    });
  },
  setPhase: (phase) => set({ phase }),
  setDuration: (seconds) => set({ duration: Math.max(0, Math.floor(seconds)) }),
  clearCall: () =>
    set({
      activeCall: null,
      phase: 'ringing',
      duration: 0,
      endedDuration: 0,
      endedReason: 'ended',
    }),
}));

/** Format seconds as MM:SS (00:00 style) */
export function formatCallDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #D4A574, #B07D4F)',
  'linear-gradient(135deg, #34d399, #059669)',
  'linear-gradient(135deg, #38bdf8, #0284c7)',
  'linear-gradient(135deg, #a78bfa, #7c3aed)',
  'linear-gradient(135deg, #f472b6, #db2777)',
];

function gradientForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return parts[0].slice(0, 2);
}

/** Subtle dual-tone ring via WebAudio oscillator. Returns a stop() fn. */
function startRingtone(): (() => void) | null {
  try {
    if (typeof window === 'undefined') return null;
    if (!useAppStore.getState().notificationSettings?.soundEnabled) return null;
    const w = window as typeof globalThis & {
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 440;
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 480;
    osc1.connect(master);
    osc2.connect(master);
    osc1.start();
    osc2.start();
    let ringOn = true;
    const pulse = () => {
      try {
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(ringOn ? 0.03 : 0, now + 0.18);
        ringOn = !ringOn;
      } catch {
        /* ignore audio scheduling errors */
      }
    };
    pulse();
    const pattern = window.setInterval(pulse, 1250);
    return () => {
      try {
        window.clearInterval(pattern);
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.linearRampToValueAtTime(0, now + 0.1);
        window.setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
            void ctx.close();
          } catch {
            /* ignore */
          }
        }, 180);
      } catch {
        /* ignore */
      }
    };
  } catch {
    return null;
  }
}

/** Deterministic floating particles for the simulated remote video scene */
const SCENE_PARTICLES: {
  top: string;
  left: string;
  size: number;
  delay: string;
  duration: string;
  opacity: number;
}[] = [
  { top: '10%', left: '14%', size: 5, delay: '0s', duration: '7s', opacity: 0.45 },
  { top: '22%', left: '78%', size: 4, delay: '1.2s', duration: '8.5s', opacity: 0.4 },
  { top: '38%', left: '8%', size: 6, delay: '0.6s', duration: '9s', opacity: 0.35 },
  { top: '55%', left: '88%', size: 5, delay: '2s', duration: '7.5s', opacity: 0.4 },
  { top: '68%', left: '22%', size: 4, delay: '0.3s', duration: '8s', opacity: 0.3 },
  { top: '80%', left: '64%', size: 6, delay: '1.6s', duration: '9.5s', opacity: 0.35 },
  { top: '15%', left: '48%', size: 3, delay: '2.4s', duration: '6.5s', opacity: 0.5 },
  { top: '45%', left: '34%', size: 3, delay: '0.9s', duration: '7s', opacity: 0.45 },
  { top: '62%', left: '52%', size: 4, delay: '1.8s', duration: '8.2s', opacity: 0.35 },
  { top: '86%', left: '40%', size: 5, delay: '0.4s', duration: '7.8s', opacity: 0.3 },
  { top: '30%', left: '62%', size: 3, delay: '2.8s', duration: '6.8s', opacity: 0.5 },
  { top: '74%', left: '80%', size: 3, delay: '1.1s', duration: '7.2s', opacity: 0.4 },
];

/* Scoped keyframes / animation classes for the call experience */
const CALL_CSS = `
@keyframes call-pop-in { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.animate-call-pop { animation: call-pop-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
@keyframes call-ring-pulse { 0% { transform: scale(1); opacity: 0.55; } 100% { transform: scale(1.8); opacity: 0; } }
.call-ring { position: absolute; inset: 0; border-radius: 9999px; border: 2px solid rgba(212, 165, 116, 0.5); animation: call-ring-pulse 1.8s ease-out infinite; pointer-events: none; }
@keyframes call-wave-key { 0%, 100% { transform: scaleY(0.28); } 50% { transform: scaleY(1); } }
.call-wave-bar { transform-origin: center bottom; animation: call-wave-key 1s ease-in-out infinite; }
@keyframes call-drift-a { from { transform: translate(0, 0) scale(1); } to { transform: translate(9%, 12%) scale(1.18); } }
@keyframes call-drift-b { from { transform: translate(0, 0) scale(1.12); } to { transform: translate(-10%, -9%) scale(0.94); } }
.call-blob { position: absolute; border-radius: 9999px; filter: blur(80px); will-change: transform; pointer-events: none; }
@keyframes call-float-key { 0%, 100% { transform: translateY(0); opacity: var(--po, 0.4); } 50% { transform: translateY(-22px); opacity: 0.9; } }
.call-particle { position: absolute; border-radius: 9999px; background: rgba(255, 255, 255, 0.75); animation-name: call-float-key; animation-timing-function: ease-in-out; animation-iteration-count: infinite; pointer-events: none; }
@keyframes call-dot-key { 0%, 100% { opacity: 0.2; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-3px); } }
.call-dot { animation: call-dot-key 1.1s ease-in-out infinite; }
`;

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ContactAvatar({
  name,
  avatar,
  className,
}: {
  name: string;
  avatar?: string;
  className?: string;
}) {
  const isImage = !!avatar && /^(https?:|data:|\/)/.test(avatar);
  const isGradient = !!avatar && avatar.startsWith('linear-gradient');
  const background = isGradient ? avatar : gradientForName(name);
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-bold text-white overflow-hidden select-none',
        className,
      )}
      style={{ background: isImage ? '#1A1A24' : background }}
    >
      {isImage ? (
        <img src={avatar} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}

type RoundVariant = 'idle' | 'danger' | 'accept' | 'amber';

function RoundCallButton({
  icon: Icon,
  label,
  onClick,
  variant = 'idle',
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: RoundVariant;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex flex-col items-center gap-1.5 outline-none group/btn"
    >
      <span
        className={cn(
          'flex h-[52px] w-[52px] items-center justify-center rounded-full transition-all duration-200 active:scale-90 group-hover/btn:scale-105',
          variant === 'idle' &&
            'bg-white/[0.07] text-slate-200 border border-white/10 hover:bg-white/[0.14]',
          variant === 'danger' &&
            'bg-red-500/90 text-white shadow-[0_4px_24px_rgba(239,68,68,0.45)] hover:bg-red-500',
          variant === 'accept' &&
            'bg-emerald-500/90 text-white shadow-[0_4px_24px_rgba(16,185,129,0.45)] hover:bg-emerald-400',
          variant === 'amber' &&
            'bg-[#D4A574] text-white shadow-[0_4px_24px_rgba(212,165,116,0.4)] hover:bg-[#E8C9A8]',
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="max-w-[72px] truncate text-[10px] font-medium text-slate-400 group-hover/btn:text-slate-200 transition-colors">
        {label}
      </span>
    </button>
  );
}

/** Animated audio-wave bars (voice call "remote audio" indicator) */
function AudioWave({ paused }: { paused?: boolean }) {
  return (
    <div className="flex h-8 items-end justify-center gap-1.5" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <span
          key={i}
          className={cn(
            'call-wave-bar w-1.5 rounded-full bg-gradient-to-t from-[#B07D4F] to-[#E8C9A8]',
            paused && 'opacity-30 [animation-play-state:paused]',
          )}
          style={{
            height: '100%',
            animationDelay: `${i * 120}ms`,
            animationDuration: `${900 + (i % 3) * 170}ms`,
          }}
        />
      ))}
    </div>
  );
}

/** Simulated remote video: animated aurora gradients + floating particles */
function RemoteVideoScene({ name }: { name: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0d0d14]" aria-hidden="true">
      <div
        className="call-blob"
        style={{
          width: '58%',
          height: '58%',
          top: '-14%',
          left: '-10%',
          background:
            'radial-gradient(circle, rgba(212,165,116,0.75), transparent 70%)',
          animation: 'call-drift-a 14s ease-in-out infinite alternate',
        }}
      />
      <div
        className="call-blob"
        style={{
          width: '52%',
          height: '52%',
          bottom: '-16%',
          right: '-8%',
          background:
            'radial-gradient(circle, rgba(56,189,248,0.55), transparent 70%)',
          animation: 'call-drift-b 17s ease-in-out infinite alternate',
        }}
      />
      <div
        className="call-blob"
        style={{
          width: '40%',
          height: '40%',
          top: '32%',
          left: '38%',
          background:
            'radial-gradient(circle, rgba(167,139,250,0.4), transparent 70%)',
          animation: 'call-drift-a 21s ease-in-out infinite alternate-reverse',
        }}
      />
      {SCENE_PARTICLES.map((p, i) => (
        <span
          key={i}
          className="call-particle"
          style={
            {
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.duration,
              '--po': p.opacity,
            } as React.CSSProperties
          }
        />
      ))}
      {/* Soft vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center gap-3 opacity-25">
          <ContactAvatar name={name} className="h-20 w-20 text-xl" />
          <span className="text-sm font-medium text-white">{name}</span>
        </div>
      </div>
    </div>
  );
}

function PulsingAvatar({
  name,
  avatar,
  active,
}: {
  name: string;
  avatar?: string;
  active: boolean;
}) {
  return (
    <div className="relative flex items-center justify-center">
      {active && (
        <>
          <span className="call-ring" />
          <span className="call-ring" style={{ animationDelay: '0.6s' }} />
          <span className="call-ring" style={{ animationDelay: '1.2s' }} />
        </>
      )}
      <ContactAvatar
        name={name}
        avatar={avatar}
        className="relative h-28 w-28 text-2xl shadow-[0_8px_40px_rgba(212,165,116,0.25)] ring-2 ring-[#D4A574]/30"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function CallOverlay() {
  const activeCall = useCallStore((s) => s.activeCall);
  if (!activeCall) return null;
  /* Keyed by call target: mounting a new call remounts CallSession,
     which resets all per-call UI state without any effects. */
  return (
    <CallSession
      key={`${activeCall.contactId}-${activeCall.kind}-${activeCall.contactName}`}
      call={activeCall}
    />
  );
}

function CallSession({ call }: { call: CallTarget }) {
  const locale = useAppStore((s) => s.locale);
  const phase = useCallStore((s) => s.phase);
  const duration = useCallStore((s) => s.duration);
  const endedDuration = useCallStore((s) => s.endedDuration);
  const endedReason = useCallStore((s) => s.endedReason);
  const answerCall = useCallStore((s) => s.answerCall);
  const endCall = useCallStore((s) => s.endCall);
  const setPhase = useCallStore((s) => s.setPhase);
  const clearCall = useCallStore((s) => s.clearCall);

  const [micMuted, setMicMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(call.kind === 'video');
  const [speakerOn, setSpeakerOn] = useState(true);
  const [mirrored, setMirrored] = useState(true);
  const [hasRealMedia, setHasRealMedia] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ringStopRef = useRef<(() => void) | null>(null);
  const mediaRequestedRef = useRef(false);

  const stopRingtone = useCallback(() => {
    ringStopRef.current?.();
    ringStopRef.current = null;
  }, []);

  /* Stop all media tracks and detach the PiP element.
     Deliberately setState-free so it is safe to call inside effects. */
  const releaseStream = useCallback(() => {
    try {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    } catch {
      /* ignore */
    }
    streamRef.current = null;
    if (localVideoRef.current) {
      try {
        localVideoRef.current.srcObject = null;
      } catch {
        /* ignore */
      }
    }
  }, []);

  /* Phase machine: ringing → connecting → active → ended → close */
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let interval: ReturnType<typeof setInterval> | null = null;

    if (phase === 'ringing') {
      stopRingtone();
      ringStopRef.current = startRingtone();
      timers.push(setTimeout(() => setPhase('connecting'), 2500));
    } else if (phase === 'connecting') {
      stopRingtone();
      timers.push(setTimeout(() => setPhase('active'), 1500));
    } else if (phase === 'active') {
      interval = setInterval(() => {
        const state = useCallStore.getState();
        state.setDuration(state.duration + 1);
      }, 1000);
    } else if (phase === 'ended') {
      stopRingtone();
      releaseStream();
      timers.push(setTimeout(() => clearCall(), 1500));
    }

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      if (interval) clearInterval(interval);
    };
  }, [phase, setPhase, clearCall, stopRingtone, releaseStream]);

  /* Request real mic/camera once per call (simulates gracefully on denial) */
  useEffect(() => {
    if (phase !== 'connecting' && phase !== 'active') return;
    if (mediaRequestedRef.current) return;
    mediaRequestedRef.current = true;
    let cancelled = false;
    const request = async () => {
      try {
        if (
          typeof navigator === 'undefined' ||
          !navigator.mediaDevices?.getUserMedia
        ) {
          return;
        }
        const constraints: MediaStreamConstraints =
          call.kind === 'video'
            ? { video: true, audio: true }
            : { audio: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        setHasRealMedia(true);
      } catch {
        /* Permission denied or no device — simulate silently */
        setHasRealMedia(false);
      }
    };
    void request();
    return () => {
      cancelled = true;
    };
  }, [call, phase]);

  /* (Re)attach the local stream to the PiP video element whenever it mounts */
  useEffect(() => {
    if (localVideoRef.current && streamRef.current) {
      try {
        localVideoRef.current.srcObject = streamRef.current;
        void localVideoRef.current.play().catch(() => undefined);
      } catch {
        /* ignore */
      }
    }
  }, [cameraOn, hasRealMedia, phase]);

  /* Safety net: release everything on unmount */
  useEffect(() => {
    return () => {
      stopRingtone();
      releaseStream();
    };
  }, [stopRingtone, releaseStream]);

  /* Lock body scroll while the overlay is open */
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  /* Escape = hang up */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') endCall();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [endCall]);

  const toggleMute = useCallback(() => {
    setMicMuted((prev) => {
      const next = !prev;
      try {
        streamRef.current
          ?.getAudioTracks()
          .forEach((tr) => {
            tr.enabled = !next;
          });
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const toggleCamera = useCallback(() => {
    setCameraOn((prev) => {
      const next = !prev;
      try {
        streamRef.current
          ?.getVideoTracks()
          .forEach((tr) => {
            tr.enabled = next;
          });
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const isVideo = call.kind === 'video';
  const kindLabel = t(
    isVideo ? 'messages.videoCall' : 'messages.voiceCall',
    locale,
  );
  const KindIcon = isVideo ? Video : Phone;
  const statusText =
    phase === 'ringing' || phase === 'connecting'
      ? t('messages.outgoingCall', locale)
      : phase === 'active'
        ? t('messages.callConnected', locale)
        : endedReason === 'declined'
          ? t('messages.callDeclined', locale)
          : t('messages.callEnded', locale);

  /* ── Centered card content (ringing / connecting / ended, and voice always) ── */
  const renderCenterCard = () => (
    <div className="relative z-10 flex w-full max-w-md items-center justify-center p-4">
      <div className="animate-call-pop w-full rounded-3xl border border-white/10 bg-[#1A1A24]/95 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
        {/* Kind chip */}
        <div className="mb-6 flex justify-center">
          <span className="flex items-center gap-1.5 rounded-full bg-[#D4A574]/10 px-3 py-1 text-[11px] font-medium text-[#D4A574]">
            <KindIcon className="h-3 w-3" />
            {kindLabel}
          </span>
        </div>

        {/* Avatar */}
        <div className="mb-6 flex justify-center">
          <PulsingAvatar
            name={call.contactName}
            avatar={call.contactAvatar}
            active={phase === 'ringing' || phase === 'connecting'}
          />
        </div>

        {/* Name + status */}
        <div className="mb-2 text-center">
          <p className="text-[11px] text-slate-500">
            {t('messages.callingFrom', locale)}
          </p>
          <h2 className="mt-0.5 text-xl font-bold text-white">
            {call.contactName}
          </h2>
          <p className="mt-2 flex items-center justify-center gap-1 text-sm text-slate-400">
            {statusText}
            {(phase === 'ringing' || phase === 'connecting') && (
              <span className="inline-flex items-center gap-0.5" aria-hidden="true">
                <span className="call-dot h-1 w-1 rounded-full bg-[#D4A574]" />
                <span
                  className="call-dot h-1 w-1 rounded-full bg-[#D4A574]"
                  style={{ animationDelay: '0.18s' }}
                />
                <span
                  className="call-dot h-1 w-1 rounded-full bg-[#D4A574]"
                  style={{ animationDelay: '0.36s' }}
                />
              </span>
            )}
          </p>
        </div>

        {/* Voice: audio wave + live timer */}
        {call.kind === 'voice' && phase === 'active' && (
          <div className="mt-5 space-y-3">
            <AudioWave paused={micMuted && !hasRealMedia} />
            <p className="text-center text-lg font-semibold tabular-nums text-[#D4A574]">
              {formatCallDuration(duration)}
            </p>
          </div>
        )}

        {/* Ended summary */}
        {phase === 'ended' && endedDuration > 0 && (
          <p className="mt-4 text-center text-sm tabular-nums text-slate-400">
            {t('messages.callDuration', locale)}:{' '}
            <span className="font-semibold text-[#D4A574]">
              {formatCallDuration(endedDuration)}
            </span>
          </p>
        )}

        {/* Actions */}
        <div className="mt-7 flex items-center justify-center gap-10">
          {phase === 'ringing' ? (
            <>
              <RoundCallButton
                icon={Phone}
                label={t('messages.answer', locale)}
                variant="accept"
                onClick={answerCall}
              />
              <RoundCallButton
                icon={PhoneOff}
                label={t('messages.decline', locale)}
                variant="danger"
                onClick={() => endCall('declined')}
              />
            </>
          ) : phase === 'connecting' ? (
            <RoundCallButton
              icon={PhoneOff}
              label={t('messages.decline', locale)}
              variant="danger"
              onClick={() => endCall('declined')}
            />
          ) : phase === 'ended' ? (
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-red-500/15">
              <PhoneOff className="h-5 w-5 text-red-400" />
            </div>
          ) : (
            /* voice active controls */
            <div className="flex items-center gap-7">
              <RoundCallButton
                icon={micMuted ? MicOff : Mic}
                label={t(micMuted ? 'messages.unmute' : 'messages.mute', locale)}
                variant={micMuted ? 'amber' : 'idle'}
                onClick={toggleMute}
              />
              <RoundCallButton
                icon={speakerOn ? Volume2 : VolumeX}
                label={t('messages.speaker', locale)}
                variant="idle"
                onClick={() => setSpeakerOn((v) => !v)}
              />
              <RoundCallButton
                icon={PhoneOff}
                label={t('messages.endCall', locale)}
                variant="danger"
                onClick={() => endCall()}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[100]"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label={kindLabel}
    >
      <style dangerouslySetInnerHTML={{ __html: CALL_CSS }} />

      {/* Dark blurred backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-xl" />

      {/* Video call: full-screen simulated remote scene */}
      {isVideo && <RemoteVideoScene name={call.contactName} />}

      {isVideo && phase === 'active' ? (
        /* ── Full-screen video layout ── */
        <div className="relative h-full w-full">
          {/* Top info bar */}
          <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent p-4 sm:p-6">
            <div>
              <p className="text-[11px] text-slate-400">
                {t('messages.callingFrom', locale)}
              </p>
              <h2 className="text-lg font-bold text-white sm:text-xl">
                {call.contactName}
              </h2>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-emerald-400">
                <span className="status-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {statusText}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-sm font-semibold tabular-nums text-[#D4A574] backdrop-blur-md border border-white/10">
                <KindIcon className="h-3.5 w-3.5" />
                {formatCallDuration(duration)}
              </span>
            </div>
          </div>

          {/* Local PiP thumbnail (mirrored) */}
          <div className="animate-call-pop absolute bottom-[132px] left-4 z-20 h-44 w-32 overflow-hidden rounded-2xl border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.6)] sm:bottom-[124px] sm:left-6 sm:h-48 sm:w-36">
            {cameraOn ? (
              hasRealMedia ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={cn(
                    'h-full w-full bg-[#0d0d14] object-cover',
                    mirrored && '-scale-x-100',
                  )}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#1A1A24] to-[#121218]">
                  <ContactAvatar
                    name={call.contactName}
                    avatar={call.contactAvatar}
                    className="h-12 w-12 text-sm"
                  />
                  <span className="px-2 text-center text-[9px] leading-tight text-slate-500">
                    {t('messages.cameraOn', locale)}
                  </span>
                </div>
              )
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#1A1A24] to-[#121218]">
                <VideoOff className="h-6 w-6 text-slate-500" />
                <span className="px-2 text-center text-[9px] leading-tight text-slate-500">
                  {t('messages.cameraOff', locale)}
                </span>
              </div>
            )}
          </div>

          {/* Control bar */}
          <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-black/70 to-transparent p-4 pb-6 sm:p-6">
            <div className="flex items-end gap-5 rounded-3xl border border-white/10 bg-[#1A1A24]/80 px-6 py-4 backdrop-blur-2xl sm:gap-7 sm:px-8">
              <RoundCallButton
                icon={micMuted ? MicOff : Mic}
                label={t(micMuted ? 'messages.unmute' : 'messages.mute', locale)}
                variant={micMuted ? 'amber' : 'idle'}
                onClick={toggleMute}
              />
              <RoundCallButton
                icon={cameraOn ? Video : VideoOff}
                label={t(
                  cameraOn ? 'messages.cameraOff' : 'messages.cameraOn',
                  locale,
                )}
                variant={cameraOn ? 'idle' : 'amber'}
                onClick={toggleCamera}
              />
              <RoundCallButton
                icon={speakerOn ? Volume2 : VolumeX}
                label={t('messages.speaker', locale)}
                variant="idle"
                onClick={() => setSpeakerOn((v) => !v)}
              />
              <RoundCallButton
                icon={SwitchCamera}
                label={t('messages.switchCamera', locale)}
                variant="idle"
                onClick={() => setMirrored((v) => !v)}
              />
              <RoundCallButton
                icon={PhoneOff}
                label={t('messages.endCall', locale)}
                variant="danger"
                onClick={() => endCall()}
              />
            </div>
          </div>
        </div>
      ) : (
        /* ── Centered card: voice (all phases) / video pre-call & ended ── */
        <div className="flex h-full w-full items-center justify-center">
          {renderCenterCard()}
        </div>
      )}
    </div>
  );
}
