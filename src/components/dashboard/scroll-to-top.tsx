'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

// ---------------------------------------------------------------------------
// ScrollToTop – floating button that appears when the user scrolls down
// ---------------------------------------------------------------------------

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 left-6 z-50 flex h-10 w-10 items-center justify-center rounded-xl
        bg-[#D4A574] text-slate-900 shadow-lg shadow-[#D4A574]/20
        transition-all duration-300 hover:bg-[#B8895A] hover:scale-105
        active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/50
        animate-fade-in"
      aria-label="العودة إلى الأعلى"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
