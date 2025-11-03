'use client';

import { Bell, HelpCircle, Layers, Moon, Search, Settings, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

export interface PromptStashHeaderProps {
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
  onHelpClick?: () => void;
  onSettingsClick?: () => void;
  userEmail?: string;
  userImage?: string;
}

export function PromptStashHeader({
  onSearchClick,
  onNotificationsClick,
  onHelpClick,
  onSettingsClick,
  userEmail = 'user@example.com',
  userImage,
}: PromptStashHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const userInitials =
    userEmail
      .split('@')[0]
      ?.split('.')
      .map((n) => n?.[0] || '')
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  return (
    <header className="bg-background z-50 h-[52px] border-b">
      <div className="grid h-full grid-cols-[200px_1fr_200px] items-center gap-5 px-5">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[#03A9F4] to-[#0288D1] text-white shadow-[0_2px_4px_rgba(3,169,244,0.3)]">
            <Layers className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold tracking-tight">PromptStash</span>
        </div>

        {/* Search */}
        <div className="flex justify-center">
          <button
            onClick={onSearchClick}
            className="bg-secondary text-muted-foreground hover:bg-accent hover:border-muted-foreground/20 flex h-9 w-full max-w-[500px] items-center gap-2 rounded-md border px-3 text-[13px] transition-all"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search files and folders...</span>
            <kbd className="bg-muted text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[11px]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNotificationsClick}
            className="text-muted-foreground hover:text-foreground h-9 w-9 transition-all"
          >
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>

          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-muted-foreground hover:text-foreground h-9 w-9 transition-all"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onHelpClick}
            className="text-muted-foreground hover:text-foreground h-9 w-9 transition-all"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="sr-only">Help</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            className="text-muted-foreground hover:text-foreground h-9 w-9 transition-all"
          >
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                <Avatar className="h-7 w-7">
                  {userImage && <AvatarImage src={userImage} alt={userEmail} />}
                  <AvatarFallback className="bg-gradient-to-br from-[#03A9F4] to-[#0288D1] text-xs font-semibold text-white shadow-[0_2px_4px_rgba(3,169,244,0.3)] transition-all hover:shadow-[0_3px_6px_rgba(3,169,244,0.4)]">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>{userEmail}</DropdownMenuItem>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
