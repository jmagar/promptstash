'use client';

import { FileType, PromptStashFileCard } from './promptstash-file-card';

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

export function PromptStashFileGrid({ files, onFileClick, className }: PromptStashFileGridProps) {
  return (
    <div className={`bg-muted/30 dark:bg-muted/30 flex-1 overflow-y-auto p-5 ${className || ''}`}>
      <div className="animate-in fade-in grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 duration-300">
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
