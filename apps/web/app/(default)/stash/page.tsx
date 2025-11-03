'use client';

import { FileEditor } from '@/components/file-editor';
import { NewFileModal } from '@/components/new-file-modal';
import { NewFolderModal } from '@/components/new-folder-modal';
import { SearchModal } from '@/components/search-modal';
import { useFiles, useStashes } from '@/hooks/use-promptstash';
import {
  PromptStashBreadcrumb,
  PromptStashFileGrid,
  PromptStashHeader,
  PromptStashToolbar,
  Skeleton,
  type FileItem,
} from '@workspace/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function StashPage() {
  const router = useRouter();
  const [selectedStashId] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [fileEditorOpen, setFileEditorOpen] = useState(false);
  const [newFileModalOpen, setNewFileModalOpen] = useState(false);
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Fetch stashes
  const { data: stashes, isLoading: stashesLoading } = useStashes();

  // Select first stash by default
  const activeStashId = selectedStashId || stashes?.[0]?.id;

  // Fetch files for active stash with pagination
  const {
    data: filesData,
    isLoading: filesLoading,
    refetch: refetchFiles,
  } = useFiles(activeStashId || '', {
    folderId: 'root',
    page: 1,
    limit: 50,
  });

  // Extract files from paginated response
  const files = filesData?.files || [];

  // Convert API files to FileItem format
  const fileItems: FileItem[] = files.map((file) => {
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
      tags: file.tags?.map((ft) => ft.tag.name) || [],
    };
  });

  // Breadcrumb items
  const breadcrumbItems = [
    {
      label: stashes?.find((s) => s.id === activeStashId)?.name || 'User',
      onClick: () => {
        // TODO: Navigate to root
      },
    },
    {
      label: '.claude',
      active: true,
    },
  ];

  // Handlers
  const handleFileClick = (file: FileItem) => {
    setSelectedFileId(file.id);
    setFileEditorOpen(true);
  };

  const handleNewFile = () => {
    setNewFileModalOpen(true);
  };

  const handleNewFolder = () => {
    setNewFolderModalOpen(true);
  };

  const handleSearch = () => {
    setSearchModalOpen(true);
  };

  const handleSearchFileSelect = (fileId: string) => {
    setSelectedFileId(fileId);
    setFileEditorOpen(true);
    setSearchModalOpen(false);
  };

  const handleSettings = () => {
    router.push('/settings/general');
  };

  const handleFileEditorClose = () => {
    setFileEditorOpen(false);
    setSelectedFileId(null);
  };

  const handleFileCreated = () => {
    refetchFiles();
    setNewFileModalOpen(false);
  };

  const handleFolderCreated = () => {
    refetchFiles();
    setNewFolderModalOpen(false);
  };

  if (stashesLoading) {
    return (
      <div className="flex h-screen flex-col">
        <div className="h-[52px] border-b" />
        <div className="flex flex-1">
          <div className="w-60 space-y-2 border-r p-4">
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
    <>
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
          <aside className="bg-background flex w-60 flex-col overflow-hidden border-r">
            <div className="border-b p-3">
              <div className="bg-secondary hover:bg-accent hover:border-muted-foreground/20 flex h-9 cursor-pointer items-center justify-between rounded-md border px-3 text-[13px] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all">
                <span className="flex items-center gap-2">
                  <span>👤</span>
                  <span>User</span>
                </span>
                <span className="text-xs">▼</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5">
              <div className="space-y-0.5">
                {[
                  'agents',
                  'commands',
                  'docs',
                  'hooks',
                  'plugins',
                  'prompts',
                  'sessions',
                  'skills',
                ].map((folder) => (
                  <div
                    key={folder}
                    className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-[13px] font-medium transition-all"
                  >
                    <span className="text-[#03A9F4]">📁</span>
                    <span>{folder}</span>
                  </div>
                ))}
                <div className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-[13px] font-medium transition-all">
                  <span>📄</span>
                  <span>CLAUDE.md</span>
                </div>
                <div className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-[13px] font-medium transition-all">
                  <span>📄</span>
                  <span>AGENTS.md</span>
                </div>
                <div className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-[13px] font-medium transition-all">
                  <span>⚙️</span>
                  <span>.mcp.json</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <main className="flex flex-1 flex-col overflow-hidden">
            {/* Toolbar */}
            <PromptStashToolbar onNewFile={handleNewFile} onNewFolder={handleNewFolder} />

            {/* Breadcrumb */}
            <PromptStashBreadcrumb items={breadcrumbItems} />

            {/* File Grid */}
            {filesLoading ? (
              <div className="bg-muted/30 dark:bg-muted/30 flex-1 p-5">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
                  {[...Array(12)].map((_, i) => (
                    <Skeleton key={i} className="aspect-square" />
                  ))}
                </div>
              </div>
            ) : (
              <PromptStashFileGrid files={fileItems} onFileClick={handleFileClick} />
            )}
          </main>
        </div>
      </div>

      {/* File Editor Modal */}
      <FileEditor
        fileId={selectedFileId}
        open={fileEditorOpen}
        onOpenChange={handleFileEditorClose}
      />

      {/* New File Modal */}
      {activeStashId && newFileModalOpen && (
        <NewFileModal
          stashId={activeStashId}
          onSuccess={handleFileCreated}
          open={newFileModalOpen}
          onOpenChange={setNewFileModalOpen}
        />
      )}

      {/* New Folder Modal */}
      {activeStashId && newFolderModalOpen && (
        <NewFolderModal
          stashId={activeStashId}
          onSuccess={handleFolderCreated}
          open={newFolderModalOpen}
          onOpenChange={setNewFolderModalOpen}
        />
      )}

      {/* Search Modal */}
      <SearchModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
        onFileSelect={handleSearchFileSelect}
      />
    </>
  );
}
