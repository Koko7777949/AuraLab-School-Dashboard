'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { localeDir } from '@/lib/i18n';

/**
 * LocaleProvider — reads the locale from the Zustand store and applies
 * the correct `dir` and `lang` attributes on <html>. Also swaps the
 * font family for optimal Arabic / Latin rendering.
 */
export default function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useAppStore((s) => s.locale);

  useEffect(() => {
    const html = document.documentElement;
    const rtl = localeDir(locale) === 'rtl';

    html.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    html.setAttribute('lang', locale);

    // Swap font: Noto Sans Arabic for AR, Geist for Latin scripts
    if (rtl) {
      html.style.setProperty('font-family', "'Noto Sans Arabic', 'Geist', system-ui, sans-serif");
    } else {
      html.style.setProperty('font-family', "'Geist', system-ui, sans-serif");
    }
  }, [locale]);

  return <>{children}</>;
}
