import { prisma } from '@workspace/db';
import { Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../types/express';

const router: Router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * GET /api/folders/:id
 * Get a specific folder with its contents
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;

    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        stash: {
          select: { userId: true },
        },
        children: {
          select: {
            id: true,
            name: true,
            path: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        files: {
          include: {
            tags: {
              include: {
                tag: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  },
                },
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
      },
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Verify ownership via stash
    if (folder.stash.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(folder);
  } catch (error) {
    console.error('Error fetching folder:', error);
    res.status(500).json({ error: 'Failed to fetch folder' });
  }
});

/**
 * POST /api/folders
 * Create a new folder
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, stashId, parentId } = req.body;
    let { path } = req.body;
    const userId = (req as AuthenticatedRequest).user.id;

    if (!name || !stashId) {
      return res.status(400).json({
        error: 'Name and stashId are required',
      });
    }

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

    // If parentId is provided, verify the parent folder belongs to the same stash
    // and build path from parent path
    if (parentId) {
      const parentFolder = await prisma.folder.findUnique({
        where: { id: parentId },
        select: { stashId: true, path: true },
      });

      if (!parentFolder) {
        return res.status(404).json({ error: 'Parent folder not found' });
      }

      if (parentFolder.stashId !== stashId) {
        return res.status(400).json({ error: 'Parent folder must belong to the same stash' });
      }

      // Auto-generate path if not provided
      if (!path) {
        const cleanName = name.replace(/\s+/g, '-').toLowerCase();
        path = `${parentFolder.path}/${cleanName}`;
      }
    } else {
      // Root level folder - use simple path
      if (!path) {
        const cleanName = name.replace(/\s+/g, '-').toLowerCase();
        path = `/${cleanName}`;
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        path,
        stashId,
        parentId: parentId || null,
      },
    });

    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

/**
 * PUT /api/folders/:id
 * Update a folder (rename)
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, path } = req.body;
    const userId = (req as AuthenticatedRequest).user.id;

    // Verify ownership before updating
    const existingFolder = await prisma.folder.findUnique({
      where: { id },
      include: {
        stash: {
          select: { userId: true },
        },
      },
    });

    if (!existingFolder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    if (existingFolder.stash.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const folder = await prisma.folder.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(path && { path }),
      },
    });

    res.json(folder);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

/**
 * DELETE /api/folders/:id
 * Delete a folder and all its contents
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;

    // Verify ownership before deleting
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        stash: {
          select: { userId: true },
        },
      },
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    if (folder.stash.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Prisma will cascade delete files and subfolders
    await prisma.folder.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

export default router;
