'use client';

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

export function SessionManager({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    // @ts-ignore
    if (session?.user?.error === "RefreshAccessTokenError") {
      signOut();
    }
  }, [session]);

  return <>{children}</>;
}
