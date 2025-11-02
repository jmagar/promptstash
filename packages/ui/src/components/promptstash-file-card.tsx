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
    gradient: "from-blue-500 to-blue-600",
  },
  agent: {
    icon: <UserCog className="h-6 w-6" />,
    gradient: "from-orange-500 to-orange-600",
  },
  skill: {
    icon: <Lightbulb className="h-6 w-6" />,
    gradient: "from-cyan-500 to-cyan-600",
  },
  command: {
    icon: <Terminal className="h-6 w-6" />,
    gradient: "from-green-500 to-green-600",
  },
  json: {
    icon: <Braces className="h-6 w-6" />,
    gradient: "from-amber-500 to-amber-600",
  },
  session: {
    icon: <MessageSquare className="h-6 w-6" />,
    gradient: "from-purple-500 to-purple-600",
  },
  markdown: {
    icon: <FileText className="h-6 w-6" />,
    gradient: "from-blue-500 to-blue-600",
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
      className={`group aspect-square cursor-pointer border bg-card p-4 transition-all hover:-translate-y-0.5 hover:bg-accent hover:border-muted-foreground/20 ${className || ""}`}
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
