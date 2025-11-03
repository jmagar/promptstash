import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onShowHelp?: () => void;
  onNewFile?: () => void;
  onNewFolder?: () => void;
  onSave?: () => void;
  onEscape?: () => void;
}

/**
 * Global keyboard shortcuts hook
 * Provides keyboard navigation for the application
 */
export function useKeyboardShortcuts(options?: KeyboardShortcutsOptions) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Ctrl/Cmd + K - Search (common pattern)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // TODO: Implement search modal
      }

      // Ctrl/Cmd + D - Dashboard
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        router.push('/dashboard');
      }

      // Ctrl/Cmd + S - Stash
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        router.push('/stash');
      }

      // Ctrl/Cmd + P - Profile
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        router.push('/profile');
      }

      // Ctrl/Cmd + , - Settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        router.push('/settings/general');
      }

      // ? - Show keyboard shortcuts help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        options?.onShowHelp?.();
      }

      // Ctrl/Cmd + N - New File
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        options?.onNewFile?.();
      }

      // Ctrl/Cmd + Shift + N - New Folder
      if ((e.ctrlKey || e.metaKey) && e.key === 'N' && e.shiftKey) {
        e.preventDefault();
        options?.onNewFolder?.();
      }

      // Ctrl/Cmd + S - Save (override default)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        // Only prevent default and call handler if we have a save handler
        if (options?.onSave) {
          e.preventDefault();
          options.onSave();
        }
      }

      // Esc - Close modals/dialogs
      if (e.key === 'Escape') {
        options?.onEscape?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, options]);
}
