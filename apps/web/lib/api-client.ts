/**
 * API Client for PromptStash Backend
 * 
 * Provides typed functions for interacting with the Express API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Types
export interface Stash {
  id: string;
  name: string;
  scope: 'USER' | 'PROJECT' | 'PLUGIN' | 'MARKETPLACE';
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    files: number;
    folders: number;
  };
}

export interface File {
  id: string;
  name: string;
  path: string;
  content: string;
  fileType: 'MARKDOWN' | 'JSON' | 'JSONL' | 'YAML';
  folderId: string | null;
  stashId: string;
  createdAt: string;
  updatedAt: string;
  tags?: FileTag[];
  folder?: Folder;
}

export interface FileTag {
  id: string;
  tag: Tag;
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
}

export interface Folder {
  id: string;
  name: string;
  path: string;
  parentId: string | null;
  stashId: string;
  createdAt: string;
  updatedAt: string;
  children?: Folder[];
  files?: File[];
}

export interface FileVersion {
  id: string;
  fileId: string;
  content: string;
  version: number;
  createdAt: string;
  createdBy: string;
}

// API Functions
export const apiClient = {
  // Stashes
  async getStashes(): Promise<Stash[]> {
    const res = await fetch(`${API_BASE_URL}/stashes`);
    if (!res.ok) throw new Error('Failed to fetch stashes');
    return res.json();
  },

  async getStash(id: string): Promise<Stash> {
    const res = await fetch(`${API_BASE_URL}/stashes/${id}`);
    if (!res.ok) throw new Error('Failed to fetch stash');
    return res.json();
  },

  async createStash(data: { name: string; scope: string; description?: string }): Promise<Stash> {
    const res = await fetch(`${API_BASE_URL}/stashes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create stash');
    return res.json();
  },

  // Files
  async getFiles(stashId: string, params?: {
    search?: string;
    fileType?: string;
    tags?: string;
    folderId?: string;
  }): Promise<File[]> {
    const searchParams = new URLSearchParams(params as any);
    const res = await fetch(`${API_BASE_URL}/stashes/${stashId}/files?${searchParams}`);
    if (!res.ok) throw new Error('Failed to fetch files');
    return res.json();
  },

  async getFile(id: string): Promise<File> {
    const res = await fetch(`${API_BASE_URL}/files/${id}`);
    if (!res.ok) throw new Error('Failed to fetch file');
    return res.json();
  },

  async createFile(data: {
    name: string;
    path: string;
    content: string;
    fileType: string;
    stashId: string;
    folderId?: string;
    tags?: string[];
  }): Promise<File> {
    const res = await fetch(`${API_BASE_URL}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create file');
    }
    return res.json();
  },

  async updateFile(id: string, data: {
    name?: string;
    content?: string;
    tags?: string[];
  }): Promise<File> {
    const res = await fetch(`${API_BASE_URL}/files/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update file');
    return res.json();
  },

  async deleteFile(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/files/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete file');
  },

  async getFileVersions(id: string): Promise<FileVersion[]> {
    const res = await fetch(`${API_BASE_URL}/files/${id}/versions`);
    if (!res.ok) throw new Error('Failed to fetch versions');
    return res.json();
  },

  async revertFile(id: string, versionId: string): Promise<File> {
    const res = await fetch(`${API_BASE_URL}/files/${id}/revert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId }),
    });
    if (!res.ok) throw new Error('Failed to revert file');
    return res.json();
  },

  // Folders
  async getFolder(id: string): Promise<Folder> {
    const res = await fetch(`${API_BASE_URL}/folders/${id}`);
    if (!res.ok) throw new Error('Failed to fetch folder');
    return res.json();
  },

  async createFolder(data: {
    name: string;
    path: string;
    stashId: string;
    parentId?: string;
  }): Promise<Folder> {
    const res = await fetch(`${API_BASE_URL}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create folder');
    return res.json();
  },

  async updateFolder(id: string, data: {
    name?: string;
    path?: string;
  }): Promise<Folder> {
    const res = await fetch(`${API_BASE_URL}/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update folder');
    return res.json();
  },

  async deleteFolder(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/folders/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete folder');
  },

  // Validation
  async validateAgent(content: string, filename: string) {
    const res = await fetch(`${API_BASE_URL}/validate/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, filename }),
    });
    if (!res.ok) throw new Error('Failed to validate agent');
    return res.json();
  },

  async validateSkill(content: string, path: string) {
    const res = await fetch(`${API_BASE_URL}/validate/skill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, path }),
    });
    if (!res.ok) throw new Error('Failed to validate skill');
    return res.json();
  },

  async validateMCP(content: string) {
    const res = await fetch(`${API_BASE_URL}/validate/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to validate MCP');
    return res.json();
  },

  async validateHooks(config: any, language?: 'typescript' | 'python') {
    const res = await fetch(`${API_BASE_URL}/validate/hooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config, language }),
    });
    if (!res.ok) throw new Error('Failed to validate hooks');
    return res.json();
  },
};
