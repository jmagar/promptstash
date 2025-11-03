'use client';

import { useAuthUser } from '@/hooks/use-auth-user';
import { Spinner } from '@workspace/ui/components/spinner';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

export default function DefaultLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthUser({
    redirectOnUnauthenticated: true,
    redirectTo: `/sign-in?redirectTo=${encodeURIComponent(pathname)}`,
  });

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Only render children if authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return <>{children}</>;
}
