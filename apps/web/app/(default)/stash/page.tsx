'use client';

import { useState } from 'react';
import { useStashes, useFiles } from '@/hooks/use-promptstash';
import {
  PromptStashBreadcrumb,
  PromptStashFileGrid,
  type FileItem,
} from '@workspace/ui';
import { Skeleton } from '@workspace/ui';
import { NewFileModal } from '@/components/new-file-modal';
import { NewFolderModal } from '@/components/new-folder-modal';
import { FileEditor } from '@/components/file-editor';

export default function StashPage() {
  const [selectedStashId, setSelectedStashId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [editorFileId, setEditorFileId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  
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
    setEditorFileId(file.id);
    setEditorOpen(true);
  };

  if (stashesLoading) {
    return (
      <div className="flex flex-1 flex-col">
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
    <div className="flex flex-1 flex-col">
      {/* Main Container - Header is provided by root layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Will be enhanced later */}
        <aside className="w-60 border-r bg-background flex flex-col overflow-hidden">
          <div className="p-3 border-b">
            <div className="h-9 px-3 flex items-center justify-between rounded-md border bg-secondary text-sm font-semibold cursor-pointer hover:bg-accent transition-colors">
              <span>User</span>
              <span>▼</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="text-sm font-medium text-muted-foreground mb-2 px-2">
              {stashes?.[0]?.name || 'My PromptStash'}
            </div>
            <div className="space-y-0.5">
              {['agents', 'commands', 'docs', 'hooks', 'plugins', 'prompts', 'sessions', 'skills'].map((folder) => (
                <div
                  key={folder}
                  className="px-2 py-1.5 rounded text-sm hover:bg-accent cursor-pointer transition-colors"
                >
                  📁 {folder}
                </div>
              ))}
              <div className="px-2 py-1.5 rounded text-sm hover:bg-accent cursor-pointer transition-colors">
                📄 CLAUDE.md
              </div>
              <div className="px-2 py-1.5 rounded text-sm hover:bg-accent cursor-pointer transition-colors">
                📄 AGENTS.md
              </div>
              <div className="px-2 py-1.5 rounded text-sm hover:bg-accent cursor-pointer transition-colors">
                ⚙️ .mcp.json
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="border-b p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeStashId && (
                <>
                  <NewFileModal stashId={activeStashId} />
                  <NewFolderModal stashId={activeStashId} />
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Additional toolbar buttons can go here */}
            </div>
          </div>

          {/* Breadcrumb */}
          <PromptStashBreadcrumb items={breadcrumbItems} />

          {/* File Grid */}
          {filesLoading ? (
            <div className="flex-1 bg-muted/30 p-5">
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

      {/* File Editor */}
      <FileEditor
        fileId={editorFileId}
        open={editorOpen}
        onOpenChange={setEditorOpen}
      />
    </div>
  );
}
