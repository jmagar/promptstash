/**
 * API Client for PromptStash Backend
 *
 * Provides typed functions for interacting with the Express API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Helper function for better error handling
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

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
    return handleResponse<Stash[]>(res);
  },

  async getStash(id: string): Promise<Stash> {
    const res = await fetch(`${API_BASE_URL}/stashes/${id}`);
    return handleResponse<Stash>(res);
  },

  async createStash(data: { name: string; scope: string; description?: string }): Promise<Stash> {
    const res = await fetch(`${API_BASE_URL}/stashes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Stash>(res);
  },

  // Files
  async getFiles(
    stashId: string,
    params?: {
      search?: string;
      fileType?: string;
      tags?: string;
      folderId?: string;
    },
  ): Promise<File[]> {
    const searchParams = new URLSearchParams(params as Record<string, string>);
    const res = await fetch(`${API_BASE_URL}/stashes/${stashId}/files?${searchParams}`);
    return handleResponse<File[]>(res);
  },

  async getFile(id: string): Promise<File> {
    const res = await fetch(`${API_BASE_URL}/files/${id}`);
    return handleResponse<File>(res);
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
    return handleResponse<File>(res);
  },

  async updateFile(
    id: string,
    data: {
      name?: string;
      content?: string;
      tags?: string[];
    },
  ): Promise<File> {
    const res = await fetch(`${API_BASE_URL}/files/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<File>(res);
  },

  async deleteFile(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/files/${id}`, {
      method: 'DELETE',
    });
    // For void responses, just check if response is ok
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
    }
  },

  async getFileVersions(id: string): Promise<FileVersion[]> {
    const res = await fetch(`${API_BASE_URL}/files/${id}/versions`);
    return handleResponse<FileVersion[]>(res);
  },

  async revertFile(id: string, versionId: string): Promise<File> {
    const res = await fetch(`${API_BASE_URL}/files/${id}/revert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId }),
    });
    return handleResponse<File>(res);
  },

  // Folders
  async getFolder(id: string): Promise<Folder> {
    const res = await fetch(`${API_BASE_URL}/folders/${id}`);
    return handleResponse<Folder>(res);
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
    return handleResponse<Folder>(res);
  },

  async updateFolder(
    id: string,
    data: {
      name?: string;
      path?: string;
    },
  ): Promise<Folder> {
    const res = await fetch(`${API_BASE_URL}/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Folder>(res);
  },

  async deleteFolder(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/folders/${id}`, {
      method: 'DELETE',
    });
    // For void responses, just check if response is ok
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
    }
  },

  // Validation
  async validateAgent(content: string, filename: string) {
    const res = await fetch(`${API_BASE_URL}/validate/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, filename }),
    });
    return handleResponse(res);
  },

  async validateSkill(content: string, path: string) {
    const res = await fetch(`${API_BASE_URL}/validate/skill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, path }),
    });
    return handleResponse(res);
  },

  async validateMCP(content: string) {
    const res = await fetch(`${API_BASE_URL}/validate/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return handleResponse(res);
  },

  async validateHooks(config: unknown, language?: 'typescript' | 'python') {
    const res = await fetch(`${API_BASE_URL}/validate/hooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config, language }),
    });
    return handleResponse(res);
  },
};
