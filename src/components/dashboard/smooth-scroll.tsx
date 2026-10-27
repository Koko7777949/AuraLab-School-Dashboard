'use client';

/**
 * SmoothScroll — Lenis-powered smooth scrolling provider for the dashboard.
 *
 * The app scrolls inside the main content column (NOT the document body),
 * so Lenis is attached to a dedicated wrapper element rendered here with
 * `h-screen overflow-y-auto` and receives `wrapper` + `content` options.
 * Lenis is direction-agnostic for vertical RTL layouts.
 *
 * - Respects `prefers-reduced-motion` (falls back to native scrolling).
 * - Drives Lenis with the standard requestAnimationFrame loop.
 * - Cleans up (destroy instance + cancel rAF) on unmount.
 * - Exposes the live instance via `useLenis()` context hook and a
 *   module-level `scrollToTopSmooth()` helper.
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Lenis from 'lenis';

// ---------------------------------------------------------------------------
// Context — lets other components access the Lenis instance if needed
// ---------------------------------------------------------------------------

const LenisContext = createContext<Lenis | null>(null);

/** Returns the active Lenis instance (or null when reduced-motion is active). */
export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

// ---------------------------------------------------------------------------
// Module-level instance reference + helper
// ---------------------------------------------------------------------------

let lenisInstance: Lenis | null = null;

/**
 * Smoothly scrolls to the top of the Lenis-managed container.
 * Falls back to native `window.scrollTo` when Lenis is unavailable
 * (e.g. reduced-motion mode or called outside the provider tree).
 */
export function scrollToTopSmooth(): void {
  if (lenisInstance) {
    lenisInstance.scrollTo(0);
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface SmoothScrollProps {
  children: ReactNode;
  /** Extra classes for the scroll wrapper (e.g. layout classes from the parent flex row). */
  className?: string;
}

export default function SmoothScroll({ children, className = '' }: SmoothScrollProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [lenis, setLenis] = useState<Lenis | null>(null);

  // Track prefers-reduced-motion reactively so smoothing can be toggled live.
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  // Initialize Lenis on the wrapper (not the window) with the standard rAF loop.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content || reducedMotion) return;

    const instance = new Lenis({
      wrapper,
      content,
      duration: 1.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      // Vertical only — the dashboard is a vertical RTL layout.
      orientation: 'vertical',
      gestureOrientation: 'vertical',
    });
    lenisInstance = instance;
    setLenis(instance);

    let rafId = 0;
    const raf = (time: number) => {
      instance.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      instance.destroy();
      lenisInstance = null;
      setLenis(null);
    };
  }, [reducedMotion]);

  return (
    <LenisContext.Provider value={lenis}>
      <div
        ref={wrapperRef}
        data-lenis-wrapper
        className={`h-screen overflow-y-auto ${className}`.trim()}
        style={{ overflowAnchor: 'none' }}
      >
        <div ref={contentRef} data-lenis-content>
          {children}
        </div>
      </div>
    </LenisContext.Provider>
  );
}
