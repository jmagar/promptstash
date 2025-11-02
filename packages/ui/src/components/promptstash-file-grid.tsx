"use client";

import * as React from "react";
import { PromptStashFileCard, FileType } from "./promptstash-file-card";

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  meta?: string;
  tags?: string[];
}

export interface PromptStashFileGridProps {
  files: FileItem[];
  onFileClick?: (file: FileItem) => void;
  className?: string;
}

export function PromptStashFileGrid({
  files,
  onFileClick,
  className,
}: PromptStashFileGridProps) {
  return (
    <div className={`flex-1 overflow-y-auto bg-muted/30 p-5 ${className || ""}`}>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 animate-in fade-in duration-300">
        {files.map((file) => (
          <PromptStashFileCard
            key={file.id}
            name={file.name}
            type={file.type}
            meta={file.meta}
            tags={file.tags}
            onClick={() => onFileClick?.(file)}
          />
        ))}
      </div>
    </div>
  );
}
