'use client';

import { QueryProvider } from './QueryProvider';
import type { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

/** Provider racine combinant tous les providers de l'application */
export function Providers({ children }: ProvidersProps) {
  return <QueryProvider>{children}</QueryProvider>;
}
