import { Router, Request, Response } from "express";
import { prisma } from "@workspace/db";

const router: Router = Router();

/**
 * GET /api/stashes
 * Get all stashes for the authenticated user
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    // TODO: Get userId from auth context
    const userId = "user-id-placeholder";

    const stashes = await prisma.stash.findMany({
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

    const stash = await prisma.stash.findUnique({
      where: { id },
      include: {
        files: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
          where: {
            folderId: null, // Root level files
          },
        },
        folders: {
          where: {
            parentId: null, // Root level folders
          },
        },
      },
    });

    if (!stash) {
      return res.status(404).json({ error: "Stash not found" });
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

    // TODO: Get userId from auth context
    const userId = "user-id-placeholder";

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
 * Get all files in a stash with optional filtering
 */
router.get("/:id/files", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { search, fileType, tags, folderId } = req.query;

    const where: any = {
      stashId: id,
    };

    // Filter by folder
    if (folderId === "root") {
      where.folderId = null;
    } else if (folderId) {
      where.folderId = folderId;
    }

    // Filter by file type
    if (fileType) {
      where.fileType = fileType;
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

    const files = await prisma.file.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        folder: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

export default router;
