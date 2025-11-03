'use client';

import { useState } from 'react';
import {
  PromptStashHeader,
  PromptStashToolbar,
  PromptStashBreadcrumb,
  PromptStashFileGrid,
  type FileItem,
} from '@workspace/ui';

export default function DemoUIPage() {
  const [currentPath, setCurrentPath] = useState<string>('/');
  
  // Sample files to display
  const fileItems: FileItem[] = [
    { id: '1', name: 'agents', type: 'folder', meta: '2 files' },
    { id: '2', name: 'skills', type: 'folder', meta: '2 folders' },
    { id: '3', name: 'commands', type: 'folder', meta: '5 files' },
    { id: '4', name: 'docs', type: 'folder', meta: '1 folder' },
    { id: '5', name: 'hooks', type: 'folder', meta: 'Empty' },
    { id: '6', name: 'plugins', type: 'folder', meta: 'Empty' },
    { id: '7', name: 'prompts', type: 'folder', meta: 'Empty' },
    { id: '8', name: 'sessions', type: 'folder', meta: '1 file' },
    { id: '9', name: 'security-reviewer.md', type: 'agent', tags: ['agent', 'security'] },
    { id: '10', name: 'code-review', type: 'skill', tags: ['skill', 'review'] },
    { id: '11', name: 'deploy-prod.md', type: 'command', tags: ['command', 'deploy'] },
    { id: '12', name: 'session-2025-01-02.jsonl', type: 'session' },
    { id: '13', name: 'CLAUDE.md', type: 'markdown', tags: ['config'] },
    { id: '14', name: 'AGENTS.md', type: 'markdown', tags: ['config'] },
    { id: '15', name: '.mcp.json', type: 'json', tags: ['config'] },
    { id: '16', name: 'marketplace.json', type: 'json', tags: ['config'] },
    { id: '17', name: 'settings.local.json', type: 'json', tags: ['config'] },
    { id: '18', name: 'settings.json', type: 'json', tags: ['config'] },
  ];

  // Breadcrumb items
  const breadcrumbItems = [
    {
      label: 'User',
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
  };

  const handleNewFile = () => {
    console.log('New file clicked');
  };

  const handleNewFolder = () => {
    console.log('New folder clicked');
  };

  const handleSearch = () => {
    console.log('Search clicked');
  };

  const handleSettings = () => {
    console.log('Settings clicked');
  };

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
          <PromptStashFileGrid
            files={fileItems}
            onFileClick={handleFileClick}
          />
        </main>
      </div>
    </div>
  );
}
