'use client';

import { useCreateFolder } from '@/hooks/use-promptstash';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Spinner } from '@workspace/ui/components/spinner';
import { Textarea } from '@workspace/ui/components/textarea';
import { FolderPlus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(255),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewFolderModalProps {
  stashId: string;
  parentFolderId?: string;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewFolderModal({
  stashId,
  parentFolderId,
  onSuccess,
  open: controlledOpen,
  onOpenChange,
}: NewFolderModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const createFolder = useCreateFolder();

  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await createFolder.mutateAsync({
        stashId,
        parentId: parentFolderId || undefined,
        name: values.name,
        description: values.description || undefined,
        path: parentFolderId ? undefined : '/', // Let backend compute path
      });

      toast.success('Folder created successfully!');
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder. Please try again.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline">
            <FolderPlus className="h-4 w-4" />
            New Folder
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>Add a new folder to organize your files.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder Name</FormLabel>
                  <FormControl>
                    <Input placeholder="my-folder" {...field} />
                  </FormControl>
                  <FormDescription>Use lowercase and hyphens for folder names.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this folder..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createFolder.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createFolder.isPending}>
                {createFolder.isPending ? (
                  <>
                    <Spinner />
                    Creating...
                  </>
                ) : (
                  'Create Folder'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
