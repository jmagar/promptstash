import { Router, Request, Response } from "express";
import { prisma } from "@workspace/db";
import {
  validateAgentFile,
  validateSkillFile,
  validateMCPFile,
} from "@workspace/utils";

const router: Router = Router();

/**
 * GET /api/files/:id
 * Get a specific file by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        folder: true,
        stash: true,
      },
    });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    res.json(file);
  } catch (error) {
    console.error("Error fetching file:", error);
    res.status(500).json({ error: "Failed to fetch file" });
  }
});

/**
 * POST /api/files
 * Create a new file
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, path, content, fileType, stashId, folderId, tags } = req.body;

    // Validate required fields
    if (!name || !path || !content || !fileType || !stashId) {
      return res.status(400).json({
        error: "Missing required fields: name, path, content, fileType, stashId",
      });
    }

    // Validate file content based on type
    let validation: any = { valid: true, errors: [], warnings: [] };

    if (fileType === "MARKDOWN" && path.includes("/agents/")) {
      validation = validateAgentFile(content, name);
    } else if (fileType === "MARKDOWN" && path.includes("/skills/")) {
      validation = validateSkillFile(content, path);
    } else if (fileType === "JSON" && name === ".mcp.json") {
      validation = validateMCPFile(content);
    }

    if (!validation.valid) {
      return res.status(400).json({
        error: "Validation failed",
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    // Create file
    const file = await prisma.file.create({
      data: {
        name,
        path,
        content,
        fileType,
        stashId,
        folderId: folderId || null,
        tags: tags
          ? {
              create: tags.map((tagId: string) => ({
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

    // Create initial version
    await prisma.fileVersion.create({
      data: {
        fileId: file.id,
        content,
        version: 1,
        createdBy: "user", // TODO: Get from auth context
      },
    });

    res.status(201).json({
      file,
      validation: {
        warnings: validation.warnings,
      },
    });
  } catch (error) {
    console.error("Error creating file:", error);
    res.status(500).json({ error: "Failed to create file" });
  }
});

/**
 * PUT /api/files/:id
 * Update an existing file
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, content, tags } = req.body;

    // Get existing file
    const existingFile = await prisma.file.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    if (!existingFile) {
      return res.status(404).json({ error: "File not found" });
    }

    // Validate content if provided
    if (content) {
      let validation: any = { valid: true, errors: [], warnings: [] };

      if (existingFile.fileType === "MARKDOWN" && existingFile.path.includes("/agents/")) {
        validation = validateAgentFile(content, name || existingFile.name);
      } else if (existingFile.fileType === "MARKDOWN" && existingFile.path.includes("/skills/")) {
        validation = validateSkillFile(content, existingFile.path);
      } else if (existingFile.fileType === "JSON" && existingFile.name === ".mcp.json") {
        validation = validateMCPFile(content);
      }

      if (!validation.valid) {
        return res.status(400).json({
          error: "Validation failed",
          errors: validation.errors,
          warnings: validation.warnings,
        });
      }
    }

    // Update file
    const updatedFile = await prisma.file.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(content && { content }),
        ...(tags && {
          tags: {
            deleteMany: {},
            create: tags.map((tagId: string) => ({
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

    // Create new version if content changed
    if (content && content !== existingFile.content && id) {
      const latestVersion = existingFile.versions[0];
      await prisma.fileVersion.create({
        data: {
          fileId: id,
          content,
          version: (latestVersion?.version || 0) + 1,
          createdBy: "user", // TODO: Get from auth context
        },
      });
    }

    res.json(updatedFile);
  } catch (error) {
    console.error("Error updating file:", error);
    res.status(500).json({ error: "Failed to update file" });
  }
});

/**
 * DELETE /api/files/:id
 * Delete a file
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.file.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

/**
 * GET /api/files/:id/versions
 * Get all versions of a file
 */
router.get("/:id/versions", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const versions = await prisma.fileVersion.findMany({
      where: { fileId: id },
      orderBy: { version: "desc" },
    });

    res.json(versions);
  } catch (error) {
    console.error("Error fetching versions:", error);
    res.status(500).json({ error: "Failed to fetch versions" });
  }
});

/**
 * POST /api/files/:id/revert
 * Revert file to a specific version
 */
router.post("/:id/revert", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { versionId } = req.body;

    if (!versionId) {
      return res.status(400).json({ error: "Version ID is required" });
    }

    // Get the version
    const version = await prisma.fileVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.fileId !== id) {
      return res.status(404).json({ error: "Version not found" });
    }

    // Get current latest version
    const latestVersion = await prisma.fileVersion.findFirst({
      where: { fileId: id },
      orderBy: { version: "desc" },
    });

    // Update file with version content
    const updatedFile = await prisma.file.update({
      where: { id },
      data: {
        content: version.content,
      },
    });

    // Create new version (revert creates a new version)
    await prisma.fileVersion.create({
      data: {
        fileId: id,
        content: version.content,
        version: (latestVersion?.version || 0) + 1,
        createdBy: "user", // TODO: Get from auth context
      },
    });

    res.json(updatedFile);
  } catch (error) {
    console.error("Error reverting file:", error);
    res.status(500).json({ error: "Failed to revert file" });
  }
});

export default router;
