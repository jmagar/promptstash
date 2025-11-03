'use client';

import {
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ScrollArea,
  Separator,
} from '@workspace/ui';
import { Command, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Ctrl', 'D'], description: 'Go to Dashboard' },
      { keys: ['Ctrl', 'S'], description: 'Go to Stash' },
      { keys: ['Ctrl', 'P'], description: 'Go to Profile' },
      { keys: ['Ctrl', ','], description: 'Go to Settings' },
    ],
  },
  {
    title: 'Search & Actions',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Open Search' },
      { keys: ['Ctrl', 'N'], description: 'Create New File' },
      { keys: ['Ctrl', 'Shift', 'N'], description: 'Create New Folder' },
    ],
  },
  {
    title: 'File Operations',
    shortcuts: [
      { keys: ['Ctrl', 'S'], description: 'Save Current File' },
      { keys: ['Esc'], description: 'Close Modal/Dialog' },
      { keys: ['Ctrl', 'Enter'], description: 'Submit Form' },
    ],
  },
  {
    title: 'Help',
    shortcuts: [{ keys: ['?'], description: 'Show Keyboard Shortcuts' }],
  },
];

function KeyBadge({ keyName }: { keyName: string }) {
  const isMac =
    typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Replace Ctrl with Cmd on Mac
  const displayKey = isMac && keyName === 'Ctrl' ? '⌘' : keyName;

  return (
    <Badge variant="outline" className="px-2 py-1 font-mono text-xs">
      {displayKey}
    </Badge>
  );
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  const isMac =
    typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[80vh] max-w-2xl flex-col"
        aria-describedby="keyboard-shortcuts-description"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription id="keyboard-shortcuts-description">
            Master these shortcuts to navigate PromptStash more efficiently
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Platform Note */}
            <div className="bg-muted flex items-start gap-2 rounded-lg p-3 text-sm">
              <Command className="text-muted-foreground mt-0.5 h-4 w-4" />
              <div>
                <p className="mb-1 font-medium">
                  {isMac ? 'macOS Shortcuts' : 'Windows/Linux Shortcuts'}
                </p>
                <p className="text-muted-foreground">
                  {isMac
                    ? 'Press ⌘ (Command) instead of Ctrl for most shortcuts'
                    : 'Press Ctrl for most shortcuts'}
                </p>
              </div>
            </div>

            {/* Shortcut Groups */}
            {SHORTCUT_GROUPS.map((group, groupIndex) => (
              <div key={group.title}>
                <h3 className="mb-3 text-sm font-semibold">{group.title}</h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-3 transition-colors"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <div key={keyIndex} className="flex items-center gap-1">
                            <KeyBadge keyName={key} />
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-muted-foreground text-xs">+</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {groupIndex < SHORTCUT_GROUPS.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}

            {/* Pro Tips */}
            <div className="bg-primary/5 border-primary/20 mt-6 rounded-lg border p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span className="text-lg">💡</span>
                Pro Tips
              </h3>
              <ul className="text-muted-foreground space-y-1.5 text-sm">
                <li>• Most shortcuts work globally across the application</li>
                <li>• Shortcuts are disabled when typing in input fields</li>
                <li>
                  • Press <KeyBadge keyName="Esc" /> to close any open modal or dialog
                </li>
                <li>
                  • Use <KeyBadge keyName="Tab" /> to navigate between form fields
                </li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
