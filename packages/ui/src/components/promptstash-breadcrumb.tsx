"use client";

import * as React from "react";
import { Home, ChevronRight, Folder } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

export interface PromptStashBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function PromptStashBreadcrumb({
  items,
  className,
}: PromptStashBreadcrumbProps) {
  return (
    <div className={`flex h-10 items-center gap-2 border-b bg-background px-5 ${className || ""}`}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <button
            onClick={item.onClick}
            disabled={item.active}
            className={`flex items-center gap-1.5 text-[13px] font-medium transition-colors ${
              item.active
                ? "text-foreground font-semibold cursor-default"
                : "text-muted-foreground hover:text-foreground cursor-pointer"
            }`}
          >
            {index === 0 && <Home className="h-4 w-4" />}
            <span>{item.label}</span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
