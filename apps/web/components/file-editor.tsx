'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@workspace/ui/components/sheet';
import { Button } from '@workspace/ui/components/button';
import { Textarea } from '@workspace/ui/components/textarea';
import { Badge } from '@workspace/ui/components/badge';
import { Spinner } from '@workspace/ui/components/spinner';
import { useFile, useUpdateFile } from '@/hooks/use-promptstash';
import { Save, X, Clock, AlertCircle } from 'lucide-react';

interface FileEditorProps {
  fileId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FileEditor({ fileId, open, onOpenChange }: FileEditorProps) {
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

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
          metadata: file.metadata || {},
        },
      });

      toast.success('File saved successfully!');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error('Failed to save file. Please try again.');
    }
  }

  // Warn before closing with unsaved changes
  const handleClose = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmed) return;
    }
    onOpenChange(false);
  };

  if (!fileId) return null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
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
                <SheetDescription className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1">
                    <Badge variant="secondary">{file.fileType}</Badge>
                  </span>
                  <span className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Updated {new Date(file.updatedAt).toLocaleDateString()}
                  </span>
                </SheetDescription>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-4 h-[calc(100vh-12rem)]">
          {/* File Description */}
          {file?.description && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">{file.description}</p>
            </div>
          )}

          {/* Editor */}
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Start typing..."
              className="flex-1 font-mono text-sm resize-none"
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
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>

          {/* Version Info */}
          {file && (
            <div className="text-xs text-muted-foreground border-t pt-2">
              <p>Version: {file.version || 1}</p>
              <p className="mt-1">
                Created: {new Date(file.createdAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
