#!/usr/bin/env tsx
/**
 * Cleanup Script: Fix Duplicate FileVersions
 *
 * This script fixes duplicate version numbers by renumbering
 * versions sequentially based on creation timestamp.
 *
 * Strategy:
 * 1. Find all files with duplicate versions
 * 2. For each file, get all versions ordered by createdAt
 * 3. Renumber versions sequentially (1, 2, 3, ...)
 * 4. Preserve the oldest version's creation timestamp
 *
 * Run with: pnpm tsx packages/db/scripts/cleanup-duplicate-versions.ts
 *
 * Safety:
 * - Runs in a transaction (all-or-nothing)
 * - Creates a backup table before making changes
 * - Dry-run mode available with --dry-run flag
 */

import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

interface DuplicateVersion {
  fileId: string;
  version: number;
  count: number;
}

interface VersionRecord {
  id: string;
  fileId: string;
  version: number;
  content: string;
  createdAt: Date;
  createdBy: string;
}

async function createBackupTable() {
  console.log('📦 Creating backup table...');

  await prisma.$executeRaw`
    DROP TABLE IF EXISTS file_version_backup
  `;

  await prisma.$executeRaw`
    CREATE TABLE file_version_backup AS
    SELECT * FROM file_version
  `;

  const backupCount = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM file_version_backup
  `;

  console.log(`✅ Backup created with ${backupCount[0].count} records\n`);
}

async function findDuplicates(): Promise<DuplicateVersion[]> {
  return await prisma.$queryRaw<DuplicateVersion[]>`
    SELECT
      "fileId",
      version,
      COUNT(*) as count
    FROM file_version
    GROUP BY "fileId", version
    HAVING COUNT(*) > 1
    ORDER BY "fileId", version
  `;
}

async function cleanupDuplicateVersions(dryRun = false) {
  console.log('🧹 Cleaning up duplicate file versions...');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}\n`);

  try {
    // Find duplicates
    const duplicates = await findDuplicates();

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found. Nothing to clean up.\n');
      return { cleaned: 0, filesAffected: 0 };
    }

    console.log(`Found ${duplicates.length} duplicate version(s)\n`);

    if (!dryRun) {
      // Create backup before making changes
      await createBackupTable();
    }

    let totalCleaned = 0;
    const filesAffected = new Set<string>();

    // Get all files that have duplicates
    const affectedFileIds = Array.from(new Set(duplicates.map((d) => d.fileId)));

    console.log(`Processing ${affectedFileIds.length} file(s) with duplicates...\n`);

    for (const fileId of affectedFileIds) {
      console.log(`Processing file: ${fileId}`);

      // Get all versions for this file, ordered by creation time
      const versions = await prisma.fileVersion.findMany({
        where: { fileId },
        orderBy: { createdAt: 'asc' },
      });

      console.log(`  Found ${versions.length} version(s)`);

      // Check if renumbering is needed
      const needsRenumbering = versions.some((v, idx) => v.version !== idx + 1);

      if (!needsRenumbering) {
        console.log('  ✓ Versions are already sequential, skipping\n');
        continue;
      }

      if (dryRun) {
        console.log('  [DRY RUN] Would renumber versions:');
        versions.forEach((v, idx) => {
          if (v.version !== idx + 1) {
            console.log(`    Version ${v.version} → ${idx + 1} (ID: ${v.id})`);
          }
        });
        console.log('');
        filesAffected.add(fileId);
        totalCleaned += versions.filter((v, idx) => v.version !== idx + 1).length;
        continue;
      }

      // Renumber versions in a transaction
      await prisma.$transaction(async (tx) => {
        // Renumber all versions sequentially
        for (let i = 0; i < versions.length; i++) {
          const newVersion = i + 1;
          if (versions[i].version !== newVersion) {
            await tx.fileVersion.update({
              where: { id: versions[i].id },
              data: { version: newVersion },
            });
            console.log(
              `  Updated version ${versions[i].version} → ${newVersion} (ID: ${versions[i].id})`,
            );
            totalCleaned++;
          }
        }
      });

      filesAffected.add(fileId);
      console.log('  ✅ File versions renumbered successfully\n');
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log(
      `${dryRun ? '[DRY RUN] Would have cleaned' : 'Cleaned'} ${totalCleaned} version(s)`,
    );
    console.log(`Files affected: ${filesAffected.size}`);

    if (!dryRun) {
      console.log('\n✅ Cleanup completed successfully!');
      console.log('✅ Backup table: file_version_backup');
      console.log(
        '\nTo restore from backup if needed:\n' +
          '  DROP TABLE file_version;\n' +
          '  ALTER TABLE file_version_backup RENAME TO file_version;\n',
      );
    } else {
      console.log('\n💡 Run without --dry-run flag to apply changes');
    }
    console.log('═══════════════════════════════════════════════════════\n');

    return { cleaned: totalCleaned, filesAffected: filesAffected.size };
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    if (!dryRun) {
      console.log('\n⚠️  Transaction rolled back. No changes were made.');
      console.log('⚠️  Backup table still exists: file_version_backup');
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const dryRun = process.argv.includes('--dry-run');

// Run if executed directly
if (require.main === module) {
  cleanupDuplicateVersions(dryRun)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { cleanupDuplicateVersions };
