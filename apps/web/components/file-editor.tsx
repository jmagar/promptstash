'use client';

import { useFile, useUpdateFile } from '@/hooks/use-promptstash';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@workspace/ui/components/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import { Button } from '@workspace/ui/components/button';
import { Textarea } from '@workspace/ui/components/textarea';
import { Badge } from '@workspace/ui/components/badge';
import { Spinner } from '@workspace/ui/components/spinner';
import { AlertCircle, Clock, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface FileEditorProps {
  fileId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FileEditor({ fileId, open, onOpenChange }: FileEditorProps) {
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const { data: file, isLoading } = useFile(fileId || '');
  const updateFile = useUpdateFile();

  // Update content when file loads
  useEffect(() => {
    if (file) {
      setContent(file.content || '');
      setHasChanges(false);
    }
  }, [file]);

  // Track changes
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasChanges(newContent !== (file?.content || ''));
  };

  // Save file
  async function handleSave() {
    if (!file || !hasChanges) return;

    try {
      await updateFile.mutateAsync({
        id: file.id,
        data: {
          content,
        },
      });

      toast.success('File saved successfully!');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error('Failed to save file. Please try again.');
    }
  }

  // Handle close request
  const handleCloseRequest = (shouldOpen: boolean) => {
    if (!shouldOpen && hasChanges) {
      // Show confirmation dialog if there are unsaved changes
      setShowCloseConfirm(true);
    } else {
      // Close directly if no unsaved changes
      onOpenChange(shouldOpen);
    }
  };

  // Confirm close with unsaved changes
  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    onOpenChange(false);
  };

  if (!fileId) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={handleCloseRequest}>
      <SheetContent side="right" className="w-full sm:w-[55%] sm:max-w-none">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <SheetTitle className="flex items-center gap-2">
                {isLoading ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <>
                    {file?.name}
                    {hasChanges && (
                      <Badge variant="outline" className="ml-2">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Unsaved
                      </Badge>
                    )}
                  </>
                )}
              </SheetTitle>
              {file && (
                <SheetDescription className="mt-1 flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Badge variant="secondary">{file.fileType}</Badge>
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    Updated {new Date(file.updatedAt).toLocaleDateString()}
                  </span>
                </SheetDescription>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleCloseRequest(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 flex h-[calc(100vh-12rem)] flex-col gap-4">
          {/* File Description */}
          {file?.description && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-muted-foreground text-sm">{file.description}</p>
            </div>
          )}

          {/* Editor */}
          <div className="flex flex-1 flex-col gap-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Start typing..."
              className="flex-1 resize-none font-mono text-sm"
              disabled={isLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateFile.isPending}
              className="flex-1"
            >
              {updateFile.isPending ? (
                <>
                  <Spinner />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => handleCloseRequest(false)}>
              Close
            </Button>
          </div>

          {/* Version Info */}
          {file && (
            <div className="text-muted-foreground border-t pt-2 text-xs">
              <p>Version: {file.version || 1}</p>
              <p className="mt-1">Created: {new Date(file.createdAt).toLocaleString()}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>

    {/* Confirmation Dialog for Unsaved Changes */}
    <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Are you sure you want to close without saving?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmClose}>
            Close Without Saving
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
