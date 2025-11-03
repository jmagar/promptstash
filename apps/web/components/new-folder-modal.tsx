'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
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
import { Textarea } from '@workspace/ui/components/textarea';
import { Button } from '@workspace/ui/components/button';
import { Spinner } from '@workspace/ui/components/spinner';
import { useCreateFolder } from '@/hooks/use-promptstash';
import { FolderPlus } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(255),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewFolderModalProps {
  stashId: string;
  parentFolderId?: string;
  onSuccess?: () => void;
}

export function NewFolderModal({
  stashId,
  parentFolderId,
  onSuccess,
}: NewFolderModalProps) {
  const [open, setOpen] = useState(false);
  const createFolder = useCreateFolder();

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
      <DialogTrigger asChild>
        <Button variant="outline">
          <FolderPlus className="h-4 w-4" />
          New Folder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Add a new folder to organize your files.
          </DialogDescription>
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
                  <FormDescription>
                    Use lowercase and hyphens for folder names.
                  </FormDescription>
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
