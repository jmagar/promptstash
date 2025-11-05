#!/usr/bin/env tsx
/**
 * Validation Script: Check for Duplicate FileVersions
 *
 * This script checks if there are any duplicate version numbers
 * for the same file in the file_version table.
 *
 * Run with: pnpm tsx packages/db/scripts/check-duplicate-versions.ts
 */

import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

interface DuplicateVersion {
  fileId: string;
  version: number;
  count: number;
}

async function checkDuplicateVersions() {
  console.log('🔍 Checking for duplicate file versions...\n');

  try {
    // Query to find duplicate (fileId, version) combinations
    const duplicates = await prisma.$queryRaw<DuplicateVersion[]>`
      SELECT
        "fileId",
        version,
        COUNT(*) as count
      FROM file_version
      GROUP BY "fileId", version
      HAVING COUNT(*) > 1
      ORDER BY "fileId", version
    `;

    if (duplicates.length === 0) {
      console.log('✅ No duplicate versions found!');
      console.log('✅ Database is ready for the unique constraint migration.\n');
      return { hasDuplicates: false, duplicates: [] };
    }

    console.log(`❌ Found ${duplicates.length} duplicate version(s):\n`);

    for (const dup of duplicates) {
      console.log(`File ID: ${dup.fileId}`);
      console.log(`  Version: ${dup.version}`);
      console.log(`  Count: ${dup.count}`);

      // Get detailed info about the duplicates
      const versions = await prisma.fileVersion.findMany({
        where: {
          fileId: dup.fileId,
          version: dup.version,
        },
        include: {
          file: {
            select: {
              name: true,
              path: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      console.log(`  File: ${versions[0]?.file.name} (${versions[0]?.file.path})`);
      console.log(`  Duplicate version IDs:`);
      versions.forEach((v, idx) => {
        console.log(`    ${idx + 1}. ${v.id} (created: ${v.createdAt.toISOString()})`);
      });
      console.log('');
    }

    console.log(
      '⚠️  You must run the cleanup script before applying the unique constraint migration.',
    );
    console.log('⚠️  Run: pnpm tsx packages/db/scripts/cleanup-duplicate-versions.ts\n');

    return { hasDuplicates: true, duplicates };
  } catch (error) {
    console.error('❌ Error checking for duplicates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  checkDuplicateVersions()
    .then(({ hasDuplicates }) => {
      process.exit(hasDuplicates ? 1 : 0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { checkDuplicateVersions };
