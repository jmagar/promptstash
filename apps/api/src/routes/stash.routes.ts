import { Router, Request, Response } from "express";
import { prisma, type Prisma } from "@workspace/db";
import { requireAuth } from "../middleware/auth";
import type { AuthenticatedRequest } from "../types/express";

const router: Router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * GET /api/stashes
 * Get all stashes for the authenticated user
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;

    let stashes = await prisma.stash.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            files: true,
            folders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Auto-create default stash for users who don't have one yet
    // NOTE: This check happens on every GET request, which is inefficient.
    // Ideally, this should be handled during user registration/onboarding,
    // but requires deeper integration with Better Auth lifecycle hooks.
    // For now, this ensures every user has at least one stash to work with.
    if (stashes.length === 0) {
      const defaultStash = await prisma.stash.create({
        data: {
          name: "My PromptStash",
          scope: "USER",
          description: "Default stash for organizing prompts, agents, and skills",
          userId,
        },
        include: {
          _count: {
            select: {
              files: true,
              folders: true,
            },
          },
        },
      });
      stashes = [defaultStash];
    }

    res.json(stashes);
  } catch (error) {
    console.error("Error fetching stashes:", error);
    res.status(500).json({ error: "Failed to fetch stashes" });
  }
});

/**
 * GET /api/stashes/:id
 * Get a specific stash with its contents
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;

    const stash = await prisma.stash.findUnique({
      where: { id },
      include: {
        files: {
          where: {
            folderId: null, // Root level files
          },
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
        folders: {
          where: {
            parentId: null, // Root level folders
          },
          select: {
            id: true,
            name: true,
            path: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!stash) {
      return res.status(404).json({ error: "Stash not found" });
    }

    // Verify ownership
    if (stash.userId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json(stash);
  } catch (error) {
    console.error("Error fetching stash:", error);
    res.status(500).json({ error: "Failed to fetch stash" });
  }
});

/**
 * POST /api/stashes
 * Create a new stash
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, scope, description } = req.body;

    if (!name || !scope) {
      return res.status(400).json({ error: "Name and scope are required" });
    }

    const userId = (req as AuthenticatedRequest).user.id;

    const stash = await prisma.stash.create({
      data: {
        name,
        scope,
        description,
        userId,
      },
    });

    res.status(201).json(stash);
  } catch (error) {
    console.error("Error creating stash:", error);
    res.status(500).json({ error: "Failed to create stash" });
  }
});

/**
 * PUT /api/stashes/:id
 * Update a stash
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, scope } = req.body;
    const userId = (req as AuthenticatedRequest).user.id;

    // Verify ownership before updating
    const existingStash = await prisma.stash.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingStash) {
      return res.status(404).json({ error: "Stash not found" });
    }

    if (existingStash.userId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const stash = await prisma.stash.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(scope && { scope }),
      },
    });

    res.json(stash);
  } catch (error) {
    console.error("Error updating stash:", error);
    res.status(500).json({ error: "Failed to update stash" });
  }
});

/**
 * DELETE /api/stashes/:id
 * Delete a stash
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;

    // Verify ownership before deleting
    const stash = await prisma.stash.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!stash) {
      return res.status(404).json({ error: "Stash not found" });
    }

    if (stash.userId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.stash.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting stash:", error);
    res.status(500).json({ error: "Failed to delete stash" });
  }
});

/**
 * GET /api/stashes/:id/files
 * Get all files in a stash with optional filtering and pagination
 */
router.get("/:id/files", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { search, fileType, tags, folderId, page = "1", limit = "50" } = req.query;
    const userId = (req as AuthenticatedRequest).user.id;

    // Verify stash ownership before returning files
    const stash = await prisma.stash.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!stash) {
      return res.status(404).json({ error: "Stash not found" });
    }

    if (stash.userId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Parse pagination params
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.FileWhereInput = {
      stashId: id,
    };

    // Filter by folder
    if (folderId === "root") {
      where.folderId = null;
    } else if (folderId && typeof folderId === "string") {
      where.folderId = folderId;
    }

    // Filter by file type
    if (fileType && typeof fileType === "string") {
      // Validate fileType is a valid enum value
      const validFileTypes = ["MARKDOWN", "JSON", "JSONL", "YAML"];
      if (validFileTypes.includes(fileType.toUpperCase())) {
        where.fileType = fileType.toUpperCase() as Prisma.FileWhereInput['fileType'];
      }
    }

    // Filter by tags
    if (tags) {
      const tagArray = (tags as string).split(",");
      where.tags = {
        some: {
          tag: {
            name: {
              in: tagArray,
            },
          },
        },
      };
    }

    // Search by name or content
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { content: { contains: search as string, mode: "insensitive" } },
      ];
    }

    // Execute query with pagination
    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          folder: {
            select: {
              id: true,
              name: true,
              path: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.file.count({ where }),
    ]);

    res.json({
      files,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

export default router;
