'use client';

import { useState } from 'react';
import { useStashes, useFiles } from '@/hooks/use-promptstash';
import {
  PromptStashHeader,
  PromptStashToolbar,
  PromptStashBreadcrumb,
  PromptStashFileGrid,
  type FileItem,
} from '@workspace/ui';
import { Skeleton } from '@workspace/ui';

export default function StashPage() {
  const [selectedStashId] = useState<string | null>(null);
  const [, setCurrentPath] = useState<string>('/');
  
  // Fetch stashes
  const { data: stashes, isLoading: stashesLoading } = useStashes();
  
  // Select first stash by default
  const activeStashId = selectedStashId || stashes?.[0]?.id;
  
  // Fetch files for active stash
  const { data: files, isLoading: filesLoading } = useFiles(
    activeStashId || '',
    { folderId: 'root' }
  );

  // Convert API files to FileItem format
  const fileItems: FileItem[] = (files || []).map((file) => {
    // Determine file type based on path and fileType
    let type: FileItem['type'] = 'markdown';
    
    if (file.path.includes('/agents/')) type = 'agent';
    else if (file.path.includes('/skills/')) type = 'skill';
    else if (file.path.includes('/commands/')) type = 'command';
    else if (file.fileType === 'JSON') type = 'json';
    else if (file.fileType === 'JSONL') type = 'session';
    
    return {
      id: file.id,
      name: file.name,
      type,
      tags: file.tags?.map(ft => ft.tag.name) || [],
    };
  });

  // Breadcrumb items
  const breadcrumbItems = [
    {
      label: stashes?.find(s => s.id === activeStashId)?.name || 'User',
      onClick: () => setCurrentPath('/'),
    },
    {
      label: '.claude',
      active: true,
    },
  ];

  // Handlers
  const handleFileClick = (file: FileItem) => {
    console.log('File clicked:', file);
    // TODO: Open file editor
  };

  const handleNewFile = () => {
    console.log('New file clicked');
    // TODO: Open new file modal
  };

  const handleNewFolder = () => {
    console.log('New folder clicked');
    // TODO: Open new folder modal
  };

  const handleSearch = () => {
    console.log('Search clicked');
    // TODO: Open search modal
  };

  const handleSettings = () => {
    console.log('Settings clicked');
    // TODO: Navigate to settings
  };

  if (stashesLoading) {
    return (
      <div className="flex h-screen flex-col">
        <div className="h-[52px] border-b" />
        <div className="flex flex-1">
          <div className="w-60 border-r p-4 space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="flex-1 p-5">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <PromptStashHeader
        onSearchClick={handleSearch}
        onSettingsClick={handleSettings}
        userEmail="demo@promptstash.dev"
      />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 border-r bg-background flex flex-col overflow-hidden">
          <div className="p-3 border-b">
            <div className="h-9 px-3 flex items-center justify-between rounded-md border bg-secondary text-[13px] font-semibold cursor-pointer hover:bg-accent hover:border-muted-foreground/20 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <span className="flex items-center gap-2">
                <span>👤</span>
                <span>User</span>
              </span>
              <span className="text-xs">▼</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5">
            <div className="space-y-0.5">
              {['agents', 'commands', 'docs', 'hooks', 'plugins', 'prompts', 'sessions', 'skills'].map((folder) => (
                <div
                  key={folder}
                  className="px-2.5 py-1.5 rounded-[5px] text-[13px] font-medium hover:bg-accent cursor-pointer transition-all flex items-center gap-2"
                >
                  <span className="text-[#03A9F4]">📁</span>
                  <span>{folder}</span>
                </div>
              ))}
              <div className="px-2.5 py-1.5 rounded-[5px] text-[13px] font-medium hover:bg-accent cursor-pointer transition-all flex items-center gap-2">
                <span>📄</span>
                <span>CLAUDE.md</span>
              </div>
              <div className="px-2.5 py-1.5 rounded-[5px] text-[13px] font-medium hover:bg-accent cursor-pointer transition-all flex items-center gap-2">
                <span>📄</span>
                <span>AGENTS.md</span>
              </div>
              <div className="px-2.5 py-1.5 rounded-[5px] text-[13px] font-medium hover:bg-accent cursor-pointer transition-all flex items-center gap-2">
                <span>⚙️</span>
                <span>.mcp.json</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <PromptStashToolbar
            onNewFile={handleNewFile}
            onNewFolder={handleNewFolder}
          />

          {/* Breadcrumb */}
          <PromptStashBreadcrumb items={breadcrumbItems} />

          {/* File Grid */}
          {filesLoading ? (
            <div className="flex-1 bg-muted/30 dark:bg-muted/30 p-5">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
                {[...Array(12)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square" />
                ))}
              </div>
            </div>
          ) : (
            <PromptStashFileGrid
              files={fileItems}
              onFileClick={handleFileClick}
            />
          )}
        </main>
      </div>
    </div>
  );
}
