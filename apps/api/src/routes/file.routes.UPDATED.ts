/**
 * UPDATED FILE ROUTES WITH SAFE VERSION CREATOR
 *
 * This file shows the necessary changes to file.routes.ts to use
 * the safe version creator and handle the unique constraint properly.
 *
 * Key changes:
 * 1. Import createFileVersion and createFileVersionInTransaction
 * 2. Remove version fetching from outside transaction in PUT
 * 3. Use safe version creator in all three endpoints
 * 4. Proper error handling for version creation failures
 */

import { prisma, type Prisma } from '@workspace/db';
import { validateAgentFile, validateMCPFile, validateSkillFile } from '@workspace/utils';
import { Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { fileOperationRateLimit, fileUploadRateLimit } from '../middleware/rate-limit';
import type { AuthenticatedRequest } from '../types/express';

// ✅ NEW: Import safe version creator helpers
import { createFileVersionInTransaction } from '@workspace/db/scripts/safe-version-creator';

// Validation result type
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const router: Router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Apply file operation rate limiting to all routes
router.use(fileOperationRateLimit);

/**
 * GET /api/files/:id
 * Get a specific file by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  // ✅ NO CHANGES NEEDED
  try {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;

    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        folder: true,
        stash: {
          select: { userId: true },
        },
      },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify ownership via stash
    if (file.stash.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(file);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

/**
 * Helper function to generate file path based on type
 */
function generateFilePath(name: string, fileType: string): string {
  // ✅ NO CHANGES NEEDED
  const cleanName = name.replace(/\s+/g, '-').toLowerCase();

  switch (fileType) {
    case 'AGENT':
      return `.claude/agents/${cleanName}.md`;
    case 'SKILL':
      return `.claude/skills/${cleanName}/SKILL.md`;
    case 'COMMAND':
      return `.claude/commands/${cleanName}.sh`;
    case 'MCP':
      return `.mcp.json`;
    case 'HOOKS':
      return `.claude/hooks.json`;
    case 'SESSION':
    case 'JSONL':
      return `.docs/sessions/${cleanName}.jsonl`;
    case 'JSON':
      return `${cleanName}.json`;
    case 'MARKDOWN':
    default:
      return `${cleanName}.md`;
  }
}

/**
 * Helper function to map frontend fileType to Prisma FileType enum
 */
function mapToPrismaFileType(fileType: string): 'MARKDOWN' | 'JSON' | 'JSONL' | 'YAML' {
  // ✅ NO CHANGES NEEDED
  switch (fileType) {
    case 'AGENT':
    case 'SKILL':
    case 'COMMAND':
    case 'MARKDOWN':
      return 'MARKDOWN';
    case 'SESSION':
    case 'JSONL':
      return 'JSONL';
    case 'MCP':
    case 'HOOKS':
    case 'JSON':
      return 'JSON';
    case 'YAML':
      return 'YAML';
    default:
      return 'MARKDOWN';
  }
}

/**
 * POST /api/files
 * Create a new file
 */
router.post('/', fileUploadRateLimit, async (req: Request, res: Response) => {
  try {
    const { name, content, fileType, stashId, folderId, tags } = req.body;
    let { path } = req.body;

    // Safe user ID extraction with detailed error logging
    const user = (req as AuthenticatedRequest).user;
    if (!user || !user.id) {
      console.error('User authentication failed:', { user, hasSession: !!req.session });
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'User ID not found in session',
      });
    }
    const userId = user.id;

    // Validate required fields
    if (!name || !content || !fileType || !stashId) {
      return res.status(400).json({
        error: 'Missing required fields: name, content, fileType, stashId',
      });
    }

    // Auto-generate path if not provided
    if (!path) {
      path = generateFilePath(name, fileType);
    }

    // Map frontend fileType to Prisma FileType enum
    const prismaFileType = mapToPrismaFileType(fileType);

    // Verify stash ownership
    const stash = await prisma.stash.findUnique({
      where: { id: stashId },
      select: { userId: true },
    });

    if (!stash) {
      return res.status(404).json({ error: 'Stash not found' });
    }

    if (stash.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // If folderId is provided, verify the folder belongs to the same stash
    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
        select: { stashId: true },
      });

      if (!folder) {
        return res.status(404).json({ error: 'Folder not found' });
      }

      if (folder.stashId !== stashId) {
        return res.status(400).json({ error: 'Folder must belong to the same stash' });
      }
    }

    // Validate file content based on type
    let validation: ValidationResult = { valid: true, errors: [], warnings: [] };

    if (fileType === 'AGENT') {
      const filename = path.split('/').pop() || name;
      validation = validateAgentFile(content, filename);
    } else if (fileType === 'SKILL') {
      validation = validateSkillFile(content, path);
    } else if (fileType === 'MCP') {
      validation = validateMCPFile(content);
    }

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    // ✅ UPDATED: Wrap file creation and version creation in a transaction
    const { file } = await prisma.$transaction(async (tx) => {
      // Create file
      const createdFile = await tx.file.create({
        data: {
          name,
          path,
          content,
          fileType: prismaFileType,
          stashId,
          folderId: folderId || null,
          tags: tags
            ? {
                create: tags
                  .filter((tagId: unknown): tagId is string => typeof tagId === 'string')
                  .map((tagId: string) => ({
                    tagId,
                  })),
              }
            : undefined,
        },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      // ✅ UPDATED: Use safe version creator
      try {
        await createFileVersionInTransaction(tx, {
          fileId: createdFile.id,
          content,
          createdBy: userId,
        });
      } catch (error) {
        console.error('Failed to create initial version:', error);
        throw new Error('Failed to create initial file version');
      }

      return { file: createdFile };
    });

    res.status(201).json({
      file,
      validation: {
        warnings: validation.warnings,
      },
    });
  } catch (error) {
    console.error('Error creating file:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: req.body,
    });
    res.status(500).json({
      error: 'Failed to create file',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/files/:id
 * Update an existing file
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, content, tags } = req.body;
    const userId = (req as AuthenticatedRequest).user.id;

    // Validate id parameter
    if (!id) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    // ✅ UPDATED: Removed version fetching from here (was causing race condition)
    // Get existing file with stash for ownership verification
    const existingFile = await prisma.file.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        content: true,
        path: true,
        fileType: true,
        stash: {
          select: { userId: true },
        },
        // ❌ REMOVED: versions fetching (was outside transaction)
      },
    });

    if (!existingFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify ownership via stash
    if (existingFile.stash.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Validate content if provided
    if (content) {
      let validation: ValidationResult = { valid: true, errors: [], warnings: [] };

      if (existingFile.fileType === 'MARKDOWN' && existingFile.path.includes('/agents/')) {
        validation = validateAgentFile(content, name || existingFile.name);
      } else if (existingFile.fileType === 'MARKDOWN' && existingFile.path.includes('/skills/')) {
        validation = validateSkillFile(content, existingFile.path);
      } else if (existingFile.fileType === 'JSON' && existingFile.name === '.mcp.json') {
        validation = validateMCPFile(content);
      }

      if (!validation.valid) {
        return res.status(400).json({
          error: 'Validation failed',
          errors: validation.errors,
          warnings: validation.warnings,
        });
      }
    }

    const fileId = id; // Store in const to ensure type safety

    // ✅ UPDATED: Use transaction with safe version creator
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update file
      const updatedFile = await tx.file.update({
        where: { id: fileId },
        data: {
          ...(name && { name }),
          ...(content && { content }),
          ...(tags && {
            tags: {
              deleteMany: {},
              create: tags
                .filter((tagId: unknown): tagId is string => typeof tagId === 'string')
                .map((tagId: string) => ({
                  tagId,
                })),
            },
          }),
        },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      // ✅ UPDATED: Create new version if content changed
      // Version number is calculated INSIDE transaction now
      if (content && content !== existingFile.content) {
        try {
          await createFileVersionInTransaction(tx, {
            fileId,
            content,
            createdBy: userId,
          });
        } catch (error) {
          console.error('Failed to create version:', error);
          throw new Error('Failed to create file version');
        }
      }

      return updatedFile;
    });

    res.json(result);
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

/**
 * DELETE /api/files/:id
 * Delete a file
 */
router.delete('/:id', async (req: Request, res: Response) => {
  // ✅ NO CHANGES NEEDED
  try {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;

    // Verify ownership before deleting
    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        stash: {
          select: { userId: true },
        },
      },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.stash.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.file.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

/**
 * GET /api/files/:id/versions
 * Get all versions of a file
 */
router.get('/:id/versions', async (req: Request, res: Response) => {
  // ✅ NO CHANGES NEEDED
  try {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;

    // Verify file ownership before returning versions
    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        stash: {
          select: { userId: true },
        },
      },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.stash.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const versions = await prisma.fileVersion.findMany({
      where: { fileId: id },
      orderBy: { version: 'desc' },
    });

    res.json(versions);
  } catch (error) {
    console.error('Error fetching versions:', error);
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

/**
 * POST /api/files/:id/revert
 * Revert file to a specific version
 */
router.post('/:id/revert', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { versionId } = req.body;
    const userId = (req as AuthenticatedRequest).user.id;

    if (!versionId) {
      return res.status(400).json({ error: 'Version ID is required' });
    }

    // Verify file ownership before reverting
    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        stash: {
          select: { userId: true },
        },
      },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.stash.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get the version to revert to
    const version = await prisma.fileVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.fileId !== id) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // ✅ UPDATED: Wrap in transaction and use safe version creator
    const updatedFile = await prisma.$transaction(async (tx) => {
      // Update file with version content
      const updated = await tx.file.update({
        where: { id },
        data: {
          content: version.content,
        },
      });

      // ✅ UPDATED: Create new version (revert creates a new version)
      // Version number is calculated INSIDE transaction now
      try {
        await createFileVersionInTransaction(tx, {
          fileId: id,
          content: version.content,
          createdBy: userId,
        });
      } catch (error) {
        console.error('Failed to create revert version:', error);
        throw new Error('Failed to create revert version');
      }

      return updated;
    });

    res.json(updatedFile);
  } catch (error) {
    console.error('Error reverting file:', error);
    res.status(500).json({ error: 'Failed to revert file' });
  }
});

export default router;
