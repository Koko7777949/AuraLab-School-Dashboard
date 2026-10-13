'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Keyboard, Command } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { ActiveSection } from '@/lib/types';

// ---------------------------------------------------------------------------
// Shortcuts Configuration
// ---------------------------------------------------------------------------

interface ShortcutConfig {
  keys: string[];
  label: string;
  section?: ActiveSection;
  requiresNoInput?: boolean;
}

const SHORTCUTS: ShortcutConfig[] = [
  {
    keys: ['Ctrl', 'K'],
    label: 'فتح اختصارات لوحة المفاتيح',
    requiresNoInput: false,
  },
  {
    keys: ['D'],
    label: 'لوحة التحكم',
    section: 'dashboard',
    requiresNoInput: true,
  },
  {
    keys: ['S'],
    label: 'الطلاب',
    section: 'students',
    requiresNoInput: true,
  },
  {
    keys: ['T'],
    label: 'المعلمون',
    section: 'teachers',
    requiresNoInput: true,
  },
  {
    keys: ['C'],
    label: 'الصفوف',
    section: 'classes',
    requiresNoInput: true,
  },
  {
    keys: ['E'],
    label: 'الامتحانات',
    section: 'exams',
    requiresNoInput: true,
  },
  {
    keys: ['N'],
    label: 'الإشعارات',
    section: 'notifications',
    requiresNoInput: true,
  },
  {
    keys: ['A'],
    label: 'المساعد الذكي',
    section: 'ai-assistant',
    requiresNoInput: true,
  },
  {
    keys: ['Esc'],
    label: 'إغلاق',
    requiresNoInput: false,
  },
];

// ---------------------------------------------------------------------------
// Helper: Check if active element is an input
// ---------------------------------------------------------------------------

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || (el as HTMLElement).isContentEditable;
}

// ---------------------------------------------------------------------------
// KeyboardShortcuts Component
// ---------------------------------------------------------------------------

export default function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);
  const { setActiveSection } = useAppStore();
  const overlayRef = useRef<HTMLDivElement>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // ── Global keyboard listener ──
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+K opens the overlay (but skip if command palette is handling it)
      if (e.ctrlKey && e.key === 'k') {
        // Command palette handles Ctrl+K, so we don't intercept it here
        // to avoid conflicts. The command palette will handle this shortcut.
        return;
      }

      // Escape closes
      if (e.key === 'Escape') {
        if (isOpen) {
          e.preventDefault();
          close();
        }
        return;
      }

      // If overlay is open, don't process navigation shortcuts
      if (isOpen) return;

      // ? opens the overlay (no input focused)
      if (e.key === '?' && !isInputFocused()) {
        e.preventDefault();
        open();
        return;
      }

      // Navigation shortcuts (only when no input focused)
      if (isInputFocused()) return;

      const key = e.key.toUpperCase();
      const matchedShortcut = SHORTCUTS.find(
        (s) => s.requiresNoInput && s.keys.includes(key) && s.section,
      );

      if (matchedShortcut && matchedShortcut.section) {
        e.preventDefault();
        setActiveSection(matchedShortcut.section);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, open, close, toggle, setActiveSection]);

  // Close on click outside the modal content
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current) {
        close();
      }
    },
    [close],
  );

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 animate-fade-in"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="اختصارات لوحة المفاتيح"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal Content */}
      <div
        className="relative z-10 w-full max-w-lg rounded-xl animate-scale-in"
        style={{
          backgroundColor: 'rgba(26, 26, 36, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow:
            '0 0 0 1px rgba(0, 0, 0, 0.3), 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 80px rgba(212, 165, 116, 0.05)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between gap-3 px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D4A574]/10">
              <Keyboard className="h-5 w-5 text-[#D4A574]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">اختصارات لوحة المفاتيح</h2>
              <p className="text-xs text-muted-foreground/60 mt-0.5">استخدم الاختصارات للتنقل السريع</p>
            </div>
          </div>

          <button
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500
              transition-all duration-200 hover:bg-white/[0.06] hover:text-white
              active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/50"
            aria-label="إغلاق"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Shortcuts Grid ── */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 gap-2">
            {SHORTCUTS.map((shortcut) => (
              <div
                key={shortcut.label}
                className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5
                  transition-colors duration-200 hover:bg-white/[0.03]"
              >
                {/* Label */}
                <span className="text-sm text-slate-300">{shortcut.label}</span>

                {/* Key badges */}
                <div className="flex items-center gap-1.5">
                  {shortcut.keys.map((key, i) => (
                    <span key={i}>
                      {/* Plus separator between keys */}
                      {i > 0 && (
                        <span className="text-slate-600 text-xs mx-0.5">+</span>
                      )}
                      {/* Key badge */}
                      <kbd
                        className="inline-flex items-center justify-center min-w-[28px] h-7 px-2
                          rounded-md text-[12px] font-bold tabular-nums
                          shadow-[0_2px_0_rgba(0,0,0,0.3)]"
                        style={{
                          backgroundColor:
                            key === 'Ctrl' || key === 'Esc'
                              ? 'rgba(212, 165, 116, 0.12)'
                              : 'rgba(255, 255, 255, 0.06)',
                          border: `1px solid ${
                            key === 'Ctrl' || key === 'Esc'
                              ? 'rgba(212, 165, 116, 0.25)'
                              : 'rgba(255, 255, 255, 0.1)'
                          }`,
                          color:
                            key === 'Ctrl' || key === 'Esc'
                              ? '#D4A574'
                              : '#C4C4D4',
                        }}
                      >
                        {key}
                      </kbd>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="px-6 py-3 flex items-center justify-center gap-2"
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
        >
          <span className="text-[11px] text-muted-foreground/50">
            اضغط <kbd className="inline-flex items-center justify-center h-5 px-1.5 rounded text-[10px] font-bold text-[#D4A574] bg-[#D4A574]/10 border border-[#D4A574]/20 mx-0.5">Esc</kbd> أو انقر خارج النافذة للإغلاق
          </span>
        </div>

        {/* Decorative gradient orb */}
        <div
          className="absolute -top-16 -left-16 h-32 w-32 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #D4A574, transparent 70%)' }}
        />
      </div>
    </div>
  );
}
