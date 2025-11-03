'use client';

import { useFiles, useStashes } from '@/hooks/use-promptstash';
import type { File } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Input } from '@workspace/ui/components/input';
import { Spinner } from '@workspace/ui/components/spinner';
import Fuse from 'fuse.js';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelect: (fileId: string) => void;
}

export function SearchModal({ open, onOpenChange, onFileSelect }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fetch stashes and files
  const { data: stashes } = useStashes();
  const activeStashId = stashes?.[0]?.id;
  const { data: filesResponse, isLoading } = useFiles(activeStashId || '', {});

  // Extract files from paginated response
  const files = useMemo(() => filesResponse?.files || [], [filesResponse?.files]);

  // Configure Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    if (!files || files.length === 0) return null;

    return new Fuse(files, {
      keys: [
        { name: 'name', weight: 2 },
        { name: 'content', weight: 1 },
        { name: 'path', weight: 1.5 },
        { name: 'description', weight: 1 },
      ],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 2,
    });
  }, [files]);

  // Perform search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !fuse) {
      return files.slice(0, 10);
    }

    const results = fuse.search(searchQuery);
    return results.map((result) => result.item).slice(0, 10);
  }, [searchQuery, fuse, files]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            handleSelect(searchResults[selectedIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, searchResults, selectedIndex, handleSelect]);

  // Add Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const handleSelect = useCallback(
    (file: File) => {
      onFileSelect(file.id);
      onOpenChange(false);
    },
    [onFileSelect, onOpenChange],
  );

  const getFileIcon = (file: File) => {
    if (file.path.includes('/agents/')) return '🤖';
    if (file.path.includes('/skills/')) return '⚡';
    if (file.path.includes('/commands/')) return '⌨️';
    if (file.fileType === 'JSON') return '📋';
    if (file.fileType === 'JSONL') return '📊';
    return '📄';
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => (
      <span
        key={i}
        className={
          part.toLowerCase() === query.toLowerCase() ? 'bg-yellow-200 dark:bg-yellow-800' : ''
        }
      >
        {part}
      </span>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Files
          </DialogTitle>
          <DialogDescription>
            Search by filename, content, or tags. Use ↑↓ to navigate, Enter to select.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Search Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-6 w-6" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center text-sm">
                {searchQuery.trim() ? 'No files found' : 'Start typing to search'}
              </div>
            ) : (
              <div className="space-y-1">
                {searchResults.map((file, index) => (
                  <button
                    key={file.id}
                    onClick={() => handleSelect(file)}
                    className={`hover:bg-accent flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors ${
                      index === selectedIndex ? 'bg-accent' : ''
                    }`}
                  >
                    <span className="text-2xl">{getFileIcon(file)}</span>
                    <div className="flex-1 overflow-hidden">
                      <div className="font-medium">{highlightMatch(file.name, searchQuery)}</div>
                      <div className="text-muted-foreground truncate text-xs">{file.path}</div>
                      {file.description && (
                        <div className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                          {file.description}
                        </div>
                      )}
                      {file.tags && file.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {file.tags.map((ft) => (
                            <span
                              key={ft.id}
                              className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs"
                            >
                              {ft.tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="border-muted-foreground/20 text-muted-foreground flex items-center justify-between border-t pt-2 text-xs">
            <div className="flex items-center gap-4">
              <span>
                <kbd className="bg-muted rounded px-1.5 py-0.5">↑↓</kbd> Navigate
              </span>
              <span>
                <kbd className="bg-muted rounded px-1.5 py-0.5">Enter</kbd> Select
              </span>
              <span>
                <kbd className="bg-muted rounded px-1.5 py-0.5">Esc</kbd> Close
              </span>
            </div>
            <span>
              <kbd className="bg-muted rounded px-1.5 py-0.5">⌘K</kbd> Toggle
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
