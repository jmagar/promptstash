import { prisma } from '@workspace/db';
import { Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/auth';

const router: Router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * GET /api/tags
 * Get all tags
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({
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
 * Get a specific tag by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const tag = await prisma.tag.findUnique({
      where: { id },
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
 * Create a new tag
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        error: 'Missing required field: name',
      });
    }

    // Check if tag with this name already exists
    const existingTag = await prisma.tag.findUnique({
      where: { name },
    });

    if (existingTag) {
      return res.status(400).json({
        error: 'Tag with this name already exists',
      });
    }

    // Create tag
    const tag = await prisma.tag.create({
      data: {
        name,
        color: color || null,
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
 * Update an existing tag
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    // Validate id parameter
    if (!id) {
      return res.status(400).json({ error: 'Tag ID is required' });
    }

    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
      where: { id },
    });

    if (!existingTag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // If name is being changed, check for conflicts
    if (name && name !== existingTag.name) {
      const conflictingTag = await prisma.tag.findUnique({
        where: { name },
      });

      if (conflictingTag) {
        return res.status(400).json({
          error: 'Tag with this name already exists',
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
 * Delete a tag
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if tag exists
    const tag = await prisma.tag.findUnique({
      where: { id },
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
