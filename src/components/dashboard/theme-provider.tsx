'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

export default function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider> & { children: ReactNode }) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}
