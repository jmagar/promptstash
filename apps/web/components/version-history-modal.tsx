'use client';

import { useFileVersions, useRevertFile } from '@/hooks/use-promptstash';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ScrollArea,
  Separator,
  Skeleton,
  Spinner,
} from '@workspace/ui';
import { AlertCircle, Check, Clock, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface VersionHistoryModalProps {
  fileId: string;
  fileName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VersionHistoryModal({
  fileId,
  fileName,
  open,
  onOpenChange,
}: VersionHistoryModalProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const { data: versions, isLoading, error } = useFileVersions(fileId);
  const revertMutation = useRevertFile();

  const selectedVersion = versions?.find((v) => v.id === selectedVersionId);

  const handleRevert = async () => {
    if (!selectedVersionId) return;

    try {
      toast.loading('Reverting file...', { id: 'revert-file' });

      await revertMutation.mutateAsync({
        id: fileId,
        versionId: selectedVersionId,
      });

      toast.success('File reverted successfully', { id: 'revert-file' });
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to revert file', {
        id: 'revert-file',
        description: err instanceof Error ? err.message : 'Unknown error',
        action: {
          label: 'Retry',
          onClick: () => handleRevert(),
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[80vh] max-w-4xl flex-col"
        aria-describedby="version-history-description"
      >
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription id="version-history-description">
            View and restore previous versions of {fileName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 gap-4">
          {/* Version List */}
          <div className="flex w-64 flex-col border-r pr-4">
            <h3 className="mb-2 text-sm font-semibold">Versions</h3>
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Failed to load versions</span>
                </div>
              ) : !versions || versions.length === 0 ? (
                <div className="text-muted-foreground text-sm">No versions found</div>
              ) : (
                <div className="space-y-1">
                  {versions.map((version, index) => (
                    <button
                      key={version.id}
                      onClick={() => setSelectedVersionId(version.id)}
                      className={`w-full rounded-md p-3 text-left transition-colors ${
                        selectedVersionId === version.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                      aria-label={`Version ${version.version} created ${new Date(version.createdAt).toLocaleString()}`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium">v{version.version}</span>
                        {index === 0 && (
                          <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-xs text-green-600 dark:text-green-400">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(version.createdAt).toLocaleString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Version Preview */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {selectedVersion ? `Version ${selectedVersion.version}` : 'Select a version'}
              </h3>
              {selectedVersion && selectedVersion.id !== versions?.[0]?.id && (
                <Button
                  onClick={handleRevert}
                  disabled={revertMutation.isPending}
                  size="sm"
                  aria-label={`Revert to version ${selectedVersion.version}`}
                >
                  {revertMutation.isPending ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Reverting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Revert to this version
                    </>
                  )}
                </Button>
              )}
              {selectedVersion && selectedVersion.id === versions?.[0]?.id && (
                <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4" />
                  <span>Current version</span>
                </div>
              )}
            </div>

            <Separator className="mb-3" />

            <ScrollArea className="flex-1">
              {selectedVersion ? (
                <div className="prose dark:prose-invert max-w-none">
                  <pre className="bg-muted overflow-x-auto rounded-md p-4 text-sm">
                    <code>{selectedVersion.content}</code>
                  </pre>
                </div>
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                  Select a version to view its content
                </div>
              )}
            </ScrollArea>

            {/* Diff View (if comparing two versions) */}
            {selectedVersion &&
              versions &&
              versions.length > 1 &&
              selectedVersion.id !== versions[0].id && (
                <>
                  <Separator className="my-3" />
                  <div className="text-muted-foreground text-xs">
                    <strong>Changes:</strong> This version is{' '}
                    {selectedVersion.content.length > versions[0].content.length
                      ? `${selectedVersion.content.length - versions[0].content.length} characters longer`
                      : selectedVersion.content.length < versions[0].content.length
                        ? `${versions[0].content.length - selectedVersion.content.length} characters shorter`
                        : 'the same length'}{' '}
                    than the current version
                  </div>
                </>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
