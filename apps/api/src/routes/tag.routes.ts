import { prisma } from '@workspace/db';
import { Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/auth';

const router: Router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * GET /api/tags
 * Get all tags for the authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tags = await prisma.tag.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        _count: {
          select: { files: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

/**
 * GET /api/tags/:id
 * Get a specific tag by ID (must be owned by user)
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const tag = await prisma.tag.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        files: {
          include: {
            file: {
              select: {
                id: true,
                name: true,
                path: true,
                fileType: true,
                updatedAt: true,
              },
            },
          },
        },
        _count: {
          select: { files: true },
        },
      },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json(tag);
  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({ error: 'Failed to fetch tag' });
  }
});

/**
 * POST /api/tags
 * Create a new tag for the authenticated user
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, color } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        error: 'Missing required field: name',
      });
    }

    // Check if user already has a tag with this name
    const existingTag = await prisma.tag.findFirst({
      where: {
        userId: req.user.id,
        name,
      },
    });

    if (existingTag) {
      return res.status(400).json({
        error: 'You already have a tag with this name',
      });
    }

    // Create tag
    const tag = await prisma.tag.create({
      data: {
        name,
        color: color || null,
        userId: req.user.id,
      },
      include: {
        _count: {
          select: { files: true },
        },
      },
    });

    res.status(201).json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({
      error: 'Failed to create tag',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/tags/:id
 * Update an existing tag (must be owned by user)
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { name, color } = req.body;

    // Validate id parameter
    if (!id) {
      return res.status(400).json({ error: 'Tag ID is required' });
    }

    // Check if tag exists and is owned by user
    const existingTag = await prisma.tag.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingTag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // If name is being changed, check for conflicts with user's other tags
    if (name && name !== existingTag.name) {
      const conflictingTag = await prisma.tag.findFirst({
        where: {
          userId: req.user.id,
          name,
        },
      });

      if (conflictingTag) {
        return res.status(400).json({
          error: 'You already have a tag with this name',
        });
      }
    }

    // Update tag
    const updatedTag = await prisma.tag.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(color !== undefined && { color }),
      },
      include: {
        _count: {
          select: { files: true },
        },
      },
    });

    res.json(updatedTag);
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

/**
 * DELETE /api/tags/:id
 * Delete a tag (must be owned by user)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Check if tag exists and is owned by user
    const tag = await prisma.tag.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Delete tag (cascade will handle FileTag relations)
    await prisma.tag.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

export default router;
