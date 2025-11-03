"use client";

import * as React from "react";
import {
  Folder,
  FileText,
  UserCog,
  Lightbulb,
  Terminal,
  Braces,
  MessageSquare,
} from "lucide-react";
import { Card } from "./card";
import { Badge } from "./badge";

export type FileType = "folder" | "agent" | "skill" | "command" | "json" | "session" | "markdown";

export interface PromptStashFileCardProps {
  name: string;
  type: FileType;
  meta?: string;
  tags?: string[];
  onClick?: () => void;
  className?: string;
}

const fileTypeConfig: Record<
  FileType,
  { icon: React.ReactNode; gradient: string }
> = {
  folder: {
    icon: <Folder className="h-6 w-6" />,
    gradient: "from-[#03A9F4] to-[#0288D1]",
  },
  agent: {
    icon: <UserCog className="h-6 w-6" />,
    gradient: "from-[#FF5722] to-[#E64A19]",
  },
  skill: {
    icon: <Lightbulb className="h-6 w-6" />,
    gradient: "from-[#00BCD4] to-[#0097A7]",
  },
  command: {
    icon: <Terminal className="h-6 w-6" />,
    gradient: "from-[#4CAF50] to-[#388E3C]",
  },
  json: {
    icon: <Braces className="h-6 w-6" />,
    gradient: "from-[#FF9800] to-[#F57C00]",
  },
  session: {
    icon: <MessageSquare className="h-6 w-6" />,
    gradient: "from-[#9C27B0] to-[#7B1FA2]",
  },
  markdown: {
    icon: <FileText className="h-6 w-6" />,
    gradient: "from-[#03A9F4] to-[#0288D1]",
  },
};

export function PromptStashFileCard({
  name,
  type,
  meta,
  tags = [],
  onClick,
  className,
}: PromptStashFileCardProps) {
  const config = fileTypeConfig[type];

  return (
    <Card
      className={`group aspect-square cursor-pointer border bg-card dark:bg-card p-4 transition-all hover:-translate-y-0.5 hover:bg-accent dark:hover:bg-accent hover:border-muted-foreground/20 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)] dark:border-border ${className || ""}`}
      onClick={onClick}
    >
      <div className="flex h-full flex-col items-center justify-center gap-2.5">
        {/* Icon */}
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${config.gradient} text-white shadow-sm`}
        >
          {config.icon}
        </div>

        {/* Name */}
        <div className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-xs font-semibold leading-tight tracking-tight">
          {name}
        </div>

        {/* Meta */}
        {meta && (
          <div className="text-[11px] font-medium text-muted-foreground">
            {meta}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="h-5 px-1.5 text-[10px] font-semibold uppercase"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
