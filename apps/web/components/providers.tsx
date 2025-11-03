'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { ErrorBoundary } from '@/components/error-boundary';
import { KeyboardShortcutsModal } from '@/components/keyboard-shortcuts-modal';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidebarProvider } from '@workspace/ui/components/sidebar';
import { TooltipProvider } from '@workspace/ui/components/tooltip';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import * as React from 'react';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [showHelp, setShowHelp] = React.useState(false);

  useKeyboardShortcuts({
    onShowHelp: () => setShowHelp(true),
  });

  return (
    <>
      {children}
      <KeyboardShortcutsModal open={showHelp} onOpenChange={setShowHelp} />
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        enableColorScheme
      >
        <QueryClientProvider client={queryClient}>
          <SidebarProvider>
            <TooltipProvider>
              <KeyboardShortcutsProvider>
                <AppSidebar />
                <Toaster richColors />
                {children}
              </KeyboardShortcutsProvider>
            </TooltipProvider>
          </SidebarProvider>
        </QueryClientProvider>
      </NextThemesProvider>
    </ErrorBoundary>
  );
}
