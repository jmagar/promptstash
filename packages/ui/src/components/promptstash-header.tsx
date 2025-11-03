"use client";

import * as React from "react";
import { Search, Bell, Moon, Sun, HelpCircle, Settings, Layers } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

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
  userEmail = "user@example.com",
  userImage,
}: PromptStashHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const userInitials = userEmail
    .split("@")[0]
    ?.split(".")
    .map((n) => n?.[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <header className="h-[52px] border-b bg-background z-50">
      <div className="grid h-full grid-cols-[200px_1fr_200px] items-center gap-5 px-5">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
            <Layers className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold tracking-tight">PromptStash</span>
        </div>

        {/* Search */}
        <div className="flex justify-center">
          <button
            onClick={onSearchClick}
            className="flex h-9 w-full max-w-[500px] items-center gap-2 rounded-md border bg-secondary px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:border-muted-foreground/20"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search files and folders...</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
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
            className="h-9 w-9"
          >
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>

          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onHelpClick}
            className="h-9 w-9"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="sr-only">Help</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            className="h-9 w-9"
          >
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                <Avatar className="h-7 w-7">
                  {userImage && <AvatarImage src={userImage} alt={userEmail} />}
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-semibold text-white">
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
