/**
 * Lazy-loaded components for code splitting
 * This improves initial bundle size by loading heavy components only when needed
 */

import { Spinner } from '@workspace/ui/components/spinner';
import dynamic from 'next/dynamic';
import { ComponentType, Suspense } from 'react';

// Lazy load modals - they are typically large and not needed on initial page load
export const FileEditor = dynamic(
  () => import('./file-editor').then((mod) => ({ default: mod.FileEditor })),
  {
    loading: () => (
      <div className="flex h-96 items-center justify-center">
        <Spinner />
      </div>
    ),
    ssr: false, // Editor should only render on client
  },
);

export const NewFileModal = dynamic(
  () => import('./new-file-modal').then((mod) => ({ default: mod.NewFileModal })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-4">
        <Spinner />
      </div>
    ),
  },
);

export const NewFolderModal = dynamic(
  () => import('./new-folder-modal').then((mod) => ({ default: mod.NewFolderModal })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-4">
        <Spinner />
      </div>
    ),
  },
);

export const SearchModal = dynamic(
  () => import('./search-modal').then((mod) => ({ default: mod.SearchModal })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-4">
        <Spinner />
      </div>
    ),
  },
);

export const VersionHistoryModal = dynamic(
  () => import('./version-history-modal').then((mod) => ({ default: mod.VersionHistoryModal })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-4">
        <Spinner />
      </div>
    ),
  },
);

export const KeyboardShortcutsModal = dynamic(
  () =>
    import('./keyboard-shortcuts-modal').then((mod) => ({ default: mod.KeyboardShortcutsModal })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-4">
        <Spinner />
      </div>
    ),
  },
);

/**
 * Generic wrapper for lazy loading any component with a loading fallback
 * @param importFn - Dynamic import function
 * @param fallback - Loading fallback component
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: React.ReactNode = <Spinner />,
) {
  return dynamic(importFn, {
    loading: () => <>{fallback}</>,
  });
}

/**
 * Wrapper component that provides a Suspense boundary
 * Use this to wrap lazy-loaded components for better error handling
 */
export function LazyBoundary({
  children,
  fallback = <Spinner />,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
