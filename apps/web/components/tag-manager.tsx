'use client';

import { useCreateTag, useDeleteTag, useTags, useUpdateTag } from '@/hooks/use-promptstash';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  ScrollArea,
  Separator,
  Skeleton,
  Spinner,
} from '@workspace/ui';
import { AlertCircle, Edit2, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface TagManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTag?: (tagId: string) => void;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
  '#64748b', // slate
];

export function TagManager({ open, onOpenChange, onSelectTag }: TagManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState('');

  const { data: tags, isLoading, error } = useTags();
  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();

  const handleCreate = async () => {
    if (!newTagName.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      toast.loading('Creating tag...', { id: 'create-tag' });

      await createMutation.mutateAsync({
        name: newTagName.trim(),
        color: newTagColor,
      });

      toast.success('Tag created successfully', { id: 'create-tag' });
      setNewTagName('');
      setNewTagColor(PRESET_COLORS[0]);
      setIsCreating(false);
    } catch (err) {
      toast.error('Failed to create tag', {
        id: 'create-tag',
        description: err instanceof Error ? err.message : 'Unknown error',
        action: {
          label: 'Retry',
          onClick: () => handleCreate(),
        },
      });
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editTagName.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      toast.loading('Updating tag...', { id: 'update-tag' });

      await updateMutation.mutateAsync({
        id,
        data: {
          name: editTagName.trim(),
          color: editTagColor,
        },
      });

      toast.success('Tag updated successfully', { id: 'update-tag' });
      setEditingId(null);
      setEditTagName('');
      setEditTagColor('');
    } catch (err) {
      toast.error('Failed to update tag', {
        id: 'update-tag',
        description: err instanceof Error ? err.message : 'Unknown error',
        action: {
          label: 'Retry',
          onClick: () => handleUpdate(id),
        },
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the tag "${name}"?`)) {
      return;
    }

    try {
      toast.loading('Deleting tag...', { id: 'delete-tag' });

      await deleteMutation.mutateAsync(id);

      toast.success('Tag deleted successfully', { id: 'delete-tag' });
    } catch (err) {
      toast.error('Failed to delete tag', {
        id: 'delete-tag',
        description: err instanceof Error ? err.message : 'Unknown error',
        action: {
          label: 'Retry',
          onClick: () => handleDelete(id, name),
        },
      });
    }
  };

  const startEditing = (id: string, name: string, color: string | null) => {
    setEditingId(id);
    setEditTagName(name);
    setEditTagColor(color || PRESET_COLORS[0]);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTagName('');
    setEditTagColor('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[80vh] max-w-2xl flex-col"
        aria-describedby="tag-manager-description"
      >
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription id="tag-manager-description">
            Create, edit, and organize tags for your files
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          {/* Create New Tag */}
          {isCreating ? (
            <div className="bg-muted/30 space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">New Tag</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsCreating(false);
                    setNewTagName('');
                    setNewTagColor(PRESET_COLORS[0]);
                  }}
                  aria-label="Cancel creating tag"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-tag-name">Name</Label>
                <Input
                  id="new-tag-name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Enter tag name..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreate();
                    }
                  }}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTagColor(color)}
                      className={`h-8 w-8 rounded-md transition-all ${
                        newTagColor === color
                          ? 'ring-offset-background ring-primary scale-110 ring-2 ring-offset-2'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreating(false);
                    setNewTagName('');
                    setNewTagColor(PRESET_COLORS[0]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={createMutation.isPending || !newTagName.trim()}
                >
                  {createMutation.isPending ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Creating...
                    </>
                  ) : (
                    'Create Tag'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsCreating(true)}
              className="w-full"
              aria-label="Create new tag"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Tag
            </Button>
          )}

          <Separator />

          {/* Tags List */}
          <div className="min-h-0 flex-1">
            <h3 className="mb-3 text-sm font-semibold">Existing Tags</h3>
            <ScrollArea className="h-full">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Failed to load tags</span>
                </div>
              ) : !tags || tags.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center text-sm">
                  No tags created yet. Create your first tag above!
                </div>
              ) : (
                <div className="space-y-2">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="hover:bg-muted/50 rounded-lg border p-3 transition-colors"
                    >
                      {editingId === tag.id ? (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor={`edit-tag-name-${tag.id}`}>Name</Label>
                            <Input
                              id={`edit-tag-name-${tag.id}`}
                              value={editTagName}
                              onChange={(e) => setEditTagName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdate(tag.id);
                                } else if (e.key === 'Escape') {
                                  cancelEditing();
                                }
                              }}
                              autoFocus
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex flex-wrap gap-2">
                              {PRESET_COLORS.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => setEditTagColor(color)}
                                  className={`h-6 w-6 rounded transition-all ${
                                    editTagColor === color
                                      ? 'ring-offset-background ring-primary scale-110 ring-2 ring-offset-2'
                                      : 'hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: color }}
                                  aria-label={`Select color ${color}`}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={cancelEditing}>
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleUpdate(tag.id)}
                              disabled={updateMutation.isPending || !editTagName.trim()}
                            >
                              {updateMutation.isPending ? (
                                <>
                                  <Spinner className="mr-2 h-4 w-4" />
                                  Saving...
                                </>
                              ) : (
                                'Save'
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <Badge
                              style={{
                                backgroundColor: tag.color || '#64748b',
                                color: '#fff',
                              }}
                            >
                              {tag.name}
                            </Badge>
                            <span className="text-muted-foreground text-xs">
                              {tag._count?.files || 0} files
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {onSelectTag && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  onSelectTag(tag.id);
                                  onOpenChange(false);
                                }}
                                aria-label={`Filter by tag ${tag.name}`}
                              >
                                Filter
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(tag.id, tag.name, tag.color)}
                              aria-label={`Edit tag ${tag.name}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(tag.id, tag.name)}
                              disabled={deleteMutation.isPending}
                              aria-label={`Delete tag ${tag.name}`}
                            >
                              {deleteMutation.isPending ? (
                                <Spinner className="h-4 w-4" />
                              ) : (
                                <Trash2 className="text-destructive h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
