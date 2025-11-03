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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { Button } from '@workspace/ui/components/button';
import { Spinner } from '@workspace/ui/components/spinner';
import { useCreateFile } from '@/hooks/use-promptstash';
import { FilePlus } from 'lucide-react';

const fileTypes = [
  { value: 'AGENT', label: 'Agent (.claude/agents/*.md)' },
  { value: 'SKILL', label: 'Skill (.claude/skills/*/SKILL.md)' },
  { value: 'COMMAND', label: 'Command (.claude/commands/*.sh)' },
  { value: 'MCP', label: 'MCP Config (.mcp.json)' },
  { value: 'HOOKS', label: 'Hooks Config (.claude/hooks.json)' },
  { value: 'MARKDOWN', label: 'Markdown Document' },
  { value: 'JSON', label: 'JSON File' },
  { value: 'SESSION', label: 'Session Log (.jsonl)' },
] as const;

const formSchema = z.object({
  name: z.string().min(1, 'File name is required').max(255),
  fileType: z.enum([
    'AGENT',
    'SKILL',
    'COMMAND',
    'MCP',
    'HOOKS',
    'MARKDOWN',
    'JSON',
    'JSONL',
    'SESSION',
  ]),
  description: z.string().optional(),
  content: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewFileModalProps {
  stashId: string;
  folderId?: string;
  onSuccess?: () => void;
}

export function NewFileModal({ stashId, folderId, onSuccess }: NewFileModalProps) {
  const [open, setOpen] = useState(false);
  const createFile = useCreateFile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      fileType: 'MARKDOWN',
      description: '',
      content: '',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await createFile.mutateAsync({
        stashId,
        folderId: folderId || undefined,
        name: values.name,
        fileType: values.fileType,
        description: values.description || undefined,
        content: values.content || getDefaultContent(values.fileType),
        metadata: {},
      });

      toast.success('File created successfully!');
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating file:', error);
      toast.error('Failed to create file. Please try again.');
    }
  }

  function getDefaultContent(fileType: string): string {
    switch (fileType) {
      case 'AGENT':
        return `---
description: Your agent description here
model: inherit
---

# Agent Instructions

Add your agent instructions here.
`;
      case 'SKILL':
        return `# Skill Name

## Description

Describe what this skill does.

## Usage

\`\`\`bash
# Example usage
\`\`\`
`;
      case 'MCP':
        return `{
  "mcpServers": {
    "example": {
      "command": "node",
      "args": ["path/to/server.js"]
    }
  }
}`;
      case 'HOOKS':
        return `{
  "hooks": []
}`;
      case 'JSON':
        return '{\n  \n}';
      case 'SESSION':
      case 'JSONL':
        return '';
      default:
        return '# New Document\n\nStart writing here...';
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
          <FilePlus className="h-4 w-4" />
          New File
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New File</DialogTitle>
          <DialogDescription>
            Add a new file to your stash. Choose the file type and provide a name.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fileType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select file type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fileTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type determines validation rules and default content.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Name</FormLabel>
                  <FormControl>
                    <Input placeholder="my-file" {...field} />
                  </FormControl>
                  <FormDescription>
                    Use kebab-case for agent/skill names. File extension added automatically.
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
                      placeholder="Brief description of this file..."
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
                disabled={createFile.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createFile.isPending}>
                {createFile.isPending ? (
                  <>
                    <Spinner />
                    Creating...
                  </>
                ) : (
                  'Create File'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
