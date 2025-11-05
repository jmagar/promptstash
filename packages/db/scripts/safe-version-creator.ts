/**
 * Safe Version Creator
 *
 * Helper function to create file versions with proper race condition handling
 * and unique constraint compliance.
 *
 * This should be used instead of manually creating versions in application code.
 */

import { Prisma, PrismaClient } from '../generated/prisma';

interface CreateVersionParams {
  fileId: string;
  content: string;
  createdBy: string;
}

interface CreateVersionOptions {
  maxRetries?: number;
  tx?: Prisma.TransactionClient;
}

/**
 * Safely create a new file version with automatic version numbering
 *
 * Features:
 * - Calculates version number inside transaction
 * - Handles unique constraint violations with retry
 * - Works with or without an existing transaction
 *
 * @param prisma - Prisma client or transaction client
 * @param params - Version creation parameters
 * @param options - Configuration options
 * @returns The created FileVersion
 *
 * @example
 * // Standalone usage
 * const version = await createFileVersion(prisma, {
 *   fileId: 'file-123',
 *   content: 'new content',
 *   createdBy: 'user-123'
 * });
 *
 * @example
 * // Inside a transaction
 * await prisma.$transaction(async (tx) => {
 *   await tx.file.update(...);
 *   await createFileVersion(prisma, {...}, { tx });
 * });
 */
export async function createFileVersion(
  prisma: PrismaClient,
  params: CreateVersionParams,
  options: CreateVersionOptions = {},
): Promise<any> {
  const { fileId, content, createdBy } = params;
  const { maxRetries = 3, tx } = options;

  // Choose the client to use (transaction or main)
  const client = tx || prisma;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get the latest version number INSIDE the operation
      // This minimizes the window for race conditions
      const latestVersion = await client.fileVersion.findFirst({
        where: { fileId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });

      const nextVersion = (latestVersion?.version || 0) + 1;

      // Try to create the version
      const version = await client.fileVersion.create({
        data: {
          fileId,
          content,
          version: nextVersion,
          createdBy,
        },
      });

      return version;
    } catch (error) {
      // Check if it's a unique constraint violation
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        error.meta?.target &&
        Array.isArray(error.meta.target) &&
        error.meta.target.includes('fileId') &&
        error.meta.target.includes('version')
      ) {
        // Unique constraint violation on (fileId, version)
        if (attempt < maxRetries - 1) {
          console.warn(
            `Version creation conflict for file ${fileId}, retrying (attempt ${attempt + 1}/${maxRetries})...`,
          );
          // Small delay before retry to avoid thundering herd
          await new Promise((resolve) => setTimeout(resolve, 10 * (attempt + 1)));
          continue;
        }

        // Max retries exceeded
        throw new Error(
          `Failed to create version for file ${fileId} after ${maxRetries} attempts due to version conflicts`,
        );
      }

      // Other error, rethrow
      throw error;
    }
  }

  throw new Error('Unreachable: loop should have returned or thrown');
}

/**
 * Create a file version within an existing transaction
 *
 * @param tx - Transaction client
 * @param params - Version creation parameters
 * @param options - Configuration options
 * @returns The created FileVersion
 */
export async function createFileVersionInTransaction(
  tx: Prisma.TransactionClient,
  params: CreateVersionParams,
  options: Omit<CreateVersionOptions, 'tx'> = {},
): Promise<any> {
  // Create a wrapper that looks like PrismaClient for compatibility
  const prismaWrapper = {
    fileVersion: tx.fileVersion,
  } as any as PrismaClient;

  return createFileVersion(prismaWrapper, params, { ...options, tx });
}
