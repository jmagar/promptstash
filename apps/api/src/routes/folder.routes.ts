import { Router, Request, Response } from "express";
import { prisma } from "@workspace/db";

const router: Router = Router();

/**
 * GET /api/folders/:id
 * Get a specific folder with its contents
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        children: true,
        files: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
        parent: true,
      },
    });

    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    res.json(folder);
  } catch (error) {
    console.error("Error fetching folder:", error);
    res.status(500).json({ error: "Failed to fetch folder" });
  }
});

/**
 * POST /api/folders
 * Create a new folder
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, path, stashId, parentId } = req.body;

    if (!name || !path || !stashId) {
      return res.status(400).json({
        error: "Name, path, and stashId are required",
      });
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
    console.error("Error creating folder:", error);
    res.status(500).json({ error: "Failed to create folder" });
  }
});

/**
 * PUT /api/folders/:id
 * Update a folder (rename)
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, path } = req.body;

    const folder = await prisma.folder.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(path && { path }),
      },
    });

    res.json(folder);
  } catch (error) {
    console.error("Error updating folder:", error);
    res.status(500).json({ error: "Failed to update folder" });
  }
});

/**
 * DELETE /api/folders/:id
 * Delete a folder and all its contents
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Prisma will cascade delete files and subfolders
    await prisma.folder.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({ error: "Failed to delete folder" });
  }
});

export default router;
