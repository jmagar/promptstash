/**
 * React Query Hooks for PromptStash API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Query Keys
export const queryKeys = {
  stashes: ['stashes'] as const,
  stash: (id: string) => ['stashes', id] as const,
  files: (stashId: string, params?: any) => ['files', stashId, params] as const,
  file: (id: string) => ['files', id] as const,
  fileVersions: (id: string) => ['files', id, 'versions'] as const,
  folder: (id: string) => ['folders', id] as const,
};

// Stash Hooks
export function useStashes() {
  return useQuery({
    queryKey: queryKeys.stashes,
    queryFn: () => apiClient.getStashes(),
  });
}

export function useStash(id: string) {
  return useQuery({
    queryKey: queryKeys.stash(id),
    queryFn: () => apiClient.getStash(id),
    enabled: !!id,
  });
}

export function useCreateStash() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiClient.createStash,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stashes });
    },
  });
}

// File Hooks
export function useFiles(stashId: string, params?: {
  search?: string;
  fileType?: string;
  tags?: string;
  folderId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.files(stashId, params),
    queryFn: () => apiClient.getFiles(stashId, params),
    enabled: !!stashId,
  });
}

export function useFile(id: string) {
  return useQuery({
    queryKey: queryKeys.file(id),
    queryFn: () => apiClient.getFile(id),
    enabled: !!id,
  });
}

export function useCreateFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiClient.createFile,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.files(variables.stashId)
      });
    },
  });
}

export function useUpdateFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiClient.updateFile(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.file(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.files(data.stashId) });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiClient.deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

export function useFileVersions(id: string) {
  return useQuery({
    queryKey: queryKeys.fileVersions(id),
    queryFn: () => apiClient.getFileVersions(id),
    enabled: !!id,
  });
}

export function useRevertFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, versionId }: { id: string; versionId: string }) =>
      apiClient.revertFile(id, versionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.file(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.fileVersions(data.id) });
    },
  });
}

// Folder Hooks
export function useFolder(id: string) {
  return useQuery({
    queryKey: queryKeys.folder(id),
    queryFn: () => apiClient.getFolder(id),
    enabled: !!id,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiClient.createFolder,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.files(variables.stashId)
      });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.updateFolder(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folder(data.id) });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiClient.deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}
