import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Global keyboard shortcuts hook
 * Provides keyboard navigation for the application
 */
export function useKeyboardShortcuts() {
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
        // TODO: Open search modal when implemented
        console.log('Search shortcut triggered');
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
        // TODO: Open keyboard shortcuts help modal
        console.log('Keyboard shortcuts help');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}
