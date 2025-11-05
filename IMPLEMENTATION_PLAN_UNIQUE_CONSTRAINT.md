# Implementation Plan: Add Unique Constraint on FileVersion (fileId, version)

## Executive Summary

**Goal:** Add a unique constraint on FileVersion(fileId, version) to prevent duplicate version numbers and fix race conditions.

**Impact:** Low-to-medium risk change requiring database migration and code updates.

**Time Estimate:** 4-6 hours total

- Planning & scripts: 2 hours ✅ (COMPLETED)
- Code updates: 1-2 hours
- Testing: 1-2 hours
- Documentation: 1 hour

---

## 1. Problem Analysis

### Current Issues

1. **No Unique Constraint**
   - Schema allows duplicate (fileId, version) combinations
   - Nothing prevents two versions with the same number for a file

2. **Race Condition Vulnerability**
   - Multiple concurrent updates can create duplicate versions
   - Version number calculated OUTSIDE transaction in PUT endpoint (line 286-293)
   - TOCTOU (Time-of-Check-Time-of-Use) vulnerability

3. **Locations Affected**
   - `POST /api/files` (line 230-237): Creates version 1
   - `PUT /api/files/:id` (line 359-366): Creates incremental versions
   - `POST /api/files/:id/revert` (line 512-519): Creates revert versions
   - Seed script (line 159-166): Creates demo data

### Race Condition Example

```
Time    Request A                  Request B
----    ---------                  ---------
T1      Read: latest version = 5
T2                                 Read: latest version = 5
T3      Create: version = 6
T4                                 Create: version = 6  ❌ DUPLICATE!
```

---

## 2. Solution Overview

### Schema Change

```prisma
model FileVersion {
  // ... existing fields ...

  @@unique([fileId, version])  // ← NEW: Prevents duplicates
  @@index([fileId, version(sort: Desc)])  // ← EXISTING: Keep for performance
}
```

### Code Changes Strategy

1. **Calculate version number INSIDE transaction**
2. **Handle unique constraint violations with retry logic**
3. **Use optimistic concurrency control**

---

## 3. Pre-Migration Steps

### Step 3.1: Check for Existing Duplicates

**Script:** `/home/user/promptstash/packages/db/scripts/check-duplicate-versions.ts`

```bash
# Run validation
pnpm tsx packages/db/scripts/check-duplicate-versions.ts

# Exit codes:
# 0 = No duplicates found (safe to migrate)
# 1 = Duplicates found (must clean up first)
```

**What it does:**

- Queries for duplicate (fileId, version) combinations
- Lists all duplicates with file details
- Recommends cleanup if duplicates found

### Step 3.2: Clean Up Duplicates (if needed)

**Script:** `/home/user/promptstash/packages/db/scripts/cleanup-duplicate-versions.ts`

```bash
# Dry run (preview changes)
pnpm tsx packages/db/scripts/cleanup-duplicate-versions.ts --dry-run

# Apply changes
pnpm tsx packages/db/scripts/cleanup-duplicate-versions.ts
```

**What it does:**

1. Creates backup table: `file_version_backup`
2. For each file with duplicates:
   - Gets all versions ordered by `createdAt` (oldest first)
   - Renumbers sequentially: 1, 2, 3, ...
   - Preserves creation timestamps
3. All changes in a single transaction

**Safety:**

- Backup created before any changes
- All-or-nothing transaction
- Dry-run mode for preview

**Rollback (if needed):**

```sql
DROP TABLE file_version;
ALTER TABLE file_version_backup RENAME TO file_version;
```

---

## 4. Schema Migration

### Step 4.1: Update Schema File

**File:** `/home/user/promptstash/packages/db/prisma/schema.prisma`

**Change:**

```diff
model FileVersion {
  id        String   @id @default(cuid())
  fileId    String
  file      File     @relation(fields: [fileId], references: [id], onDelete: Cascade)
  content   String   @db.Text
  version   Int
  createdAt DateTime @default(now())
  createdBy String

+ @@unique([fileId, version])
  @@index([fileId, version(sort: Desc)])
  @@map("file_version")
}
```

**Status:** ✅ COMPLETED

### Step 4.2: Generate Migration

```bash
cd /home/user/promptstash/packages/db
pnpm db:migrate:create
# When prompted, name it: "add_unique_constraint_fileversion"
```

This creates: `packages/db/prisma/migrations/YYYYMMDDHHMMSS_add_unique_constraint_fileversion/migration.sql`

**Expected SQL:**

```sql
-- CreateIndex
CREATE UNIQUE INDEX "file_version_fileId_version_key" ON "file_version"("fileId", "version");
```

### Step 4.3: Review Migration

Before applying, verify:

- [ ] SQL creates unique index
- [ ] Index name is descriptive
- [ ] No other unexpected changes

### Step 4.4: Apply Migration

```bash
# Development
pnpm db:migrate

# Production
pnpm db:deploy
```

---

## 5. Code Updates

### Step 5.1: Create Safe Version Creator Helper

**File:** `/home/user/promptstash/packages/db/scripts/safe-version-creator.ts`

**Status:** ✅ COMPLETED

**Features:**

- Calculates version inside transaction
- Handles unique constraint violations
- Automatic retry with exponential backoff
- Works with or without existing transaction

### Step 5.2: Update POST /api/files

**File:** `/home/user/promptstash/apps/api/src/routes/file.routes.ts`

**Current (lines 229-237):**

```typescript
// Create initial version
await prisma.fileVersion.create({
  data: {
    fileId: file.id,
    content,
    version: 1,
    createdBy: userId,
  },
});
```

**Updated:**

```typescript
import { createFileVersion } from "@workspace/db/scripts/safe-version-creator";

// Create initial version with retry logic
try {
  await createFileVersion(prisma, {
    fileId: file.id,
    content,
    createdBy: userId,
  });
} catch (error) {
  // Version creation failed after retries
  // Clean up the file we just created
  await prisma.file.delete({ where: { id: file.id } });
  throw new Error("Failed to create initial file version");
}
```

### Step 5.3: Update PUT /api/files/:id

**File:** `/home/user/promptstash/apps/api/src/routes/file.routes.ts`

**Current issue (lines 286-293):**

```typescript
// ❌ PROBLEM: Fetches version OUTSIDE transaction
const existingFile = await prisma.file.findUnique({
  where: { id },
  select: {
    // ...
    versions: {
      orderBy: { version: "desc" },
      take: 1,
      select: { version: true },
    },
  },
});

// ... later, inside transaction (lines 359-366):
const latestVersion = existingFile.versions[0];
await tx.fileVersion.create({
  data: {
    version: (latestVersion?.version || 0) + 1, // ❌ Race condition!
  },
});
```

**Updated:**

```typescript
import { createFileVersionInTransaction } from '@workspace/db/scripts/safe-version-creator';

// Remove version fetching from initial query (lines 286-293)
const existingFile = await prisma.file.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    content: true,
    path: true,
    fileType: true,
    stash: {
      select: { userId: true },
    },
    // ❌ REMOVE: versions: { ... }
  },
});

// Inside transaction (lines 329-370):
const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
  // Update file
  const updatedFile = await tx.file.update({ ... });

  // Create new version if content changed
  if (content && content !== existingFile.content) {
    // ✅ SAFE: Version calculated inside transaction
    await createFileVersionInTransaction(tx, {
      fileId: id,
      content,
      createdBy: userId,
    });
  }

  return updatedFile;
});
```

### Step 5.4: Update POST /api/files/:id/revert

**File:** `/home/user/promptstash/apps/api/src/routes/file.routes.ts`

**Current (lines 497-519):**

```typescript
// Get current latest version
const latestVersion = await prisma.fileVersion.findFirst({
  where: { fileId: id },
  orderBy: { version: 'desc' },
});

// Update file with version content
const updatedFile = await prisma.file.update({ ... });

// Create new version (revert creates a new version)
await prisma.fileVersion.create({
  data: {
    version: (latestVersion?.version || 0) + 1,  // ❌ Race condition!
  },
});
```

**Updated:**

```typescript
import { createFileVersion } from "@workspace/db/scripts/safe-version-creator";

// Wrap in transaction
const updatedFile = await prisma.$transaction(async (tx) => {
  // Update file with version content
  const updated = await tx.file.update({
    where: { id },
    data: { content: version.content },
  });

  // Create new version with safe creator
  await createFileVersionInTransaction(tx, {
    fileId: id,
    content: version.content,
    createdBy: userId,
  });

  return updated;
});
```

### Step 5.5: Export Helper from @workspace/db

**File:** `/home/user/promptstash/packages/db/src/index.ts`

**Add:**

```typescript
export {
  createFileVersion,
  createFileVersionInTransaction,
} from "../scripts/safe-version-creator";
```

---

## 6. Testing

### Step 6.1: Unit Tests for Safe Version Creator

**File:** `/home/user/promptstash/packages/db/scripts/__tests__/safe-version-creator.test.ts`

**Test cases:**

- ✅ Creates version 1 for new file
- ✅ Creates incremental versions
- ✅ Handles unique constraint violations
- ✅ Retries on conflict
- ✅ Fails after max retries
- ✅ Works inside transaction
- ✅ Concurrent version creation (stress test)

### Step 6.2: Integration Tests for File Routes

**File:** `/home/user/promptstash/apps/api/src/__tests__/integration/file.routes.test.ts`

**New test cases:**

```typescript
describe("Version creation with unique constraint", () => {
  it("should handle concurrent file updates", async () => {
    // Create file
    const file = await createFile();

    // Simulate concurrent updates
    const updates = Array(10)
      .fill(null)
      .map((_, i) => updateFile(file.id, { content: `Update ${i}` }));

    await Promise.all(updates);

    // Verify versions are sequential
    const versions = await getVersions(file.id);
    expect(versions.map((v) => v.version)).toEqual([
      10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
    ]);
  });

  it("should handle concurrent reverts", async () => {
    // Similar test for revert endpoint
  });
});
```

### Step 6.3: Manual Testing Checklist

- [ ] Create new file → version 1 created
- [ ] Update file content → version 2 created
- [ ] Update file name only → no new version
- [ ] Revert to previous version → new version created
- [ ] Concurrent updates (use tool like Apache Bench) → no duplicate versions
- [ ] Check error handling for version creation failures

---

## 7. Deployment Procedure

### Development Environment

```bash
# 1. Check for duplicates
pnpm tsx packages/db/scripts/check-duplicate-versions.ts

# 2. Clean up if needed
pnpm tsx packages/db/scripts/cleanup-duplicate-versions.ts --dry-run
pnpm tsx packages/db/scripts/cleanup-duplicate-versions.ts

# 3. Generate Prisma client
pnpm --filter @workspace/db db:generate

# 4. Create migration
pnpm --filter @workspace/db db:migrate:create
# Name: "add_unique_constraint_fileversion"

# 5. Apply migration
pnpm --filter @workspace/db db:migrate

# 6. Run tests
pnpm test

# 7. Start dev servers
pnpm dev
```

### Production Environment

```bash
# 1. Create database backup
pg_dump $DATABASE_URL > backup_pre_unique_constraint_$(date +%Y%m%d_%H%M%S).sql

# 2. Check for duplicates (in production database)
NODE_ENV=production pnpm tsx packages/db/scripts/check-duplicate-versions.ts

# 3. Clean up if needed (DRY RUN first!)
NODE_ENV=production pnpm tsx packages/db/scripts/cleanup-duplicate-versions.ts --dry-run
NODE_ENV=production pnpm tsx packages/db/scripts/cleanup-duplicate-versions.ts

# 4. Deploy migration
pnpm --filter @workspace/db db:deploy

# 5. Restart application servers
# (deployment-specific command)

# 6. Monitor for errors
# Check application logs for version creation failures
```

---

## 8. Rollback Procedures

### If Migration Fails

```bash
# 1. Restore from pg_dump backup
psql $DATABASE_URL < backup_pre_unique_constraint_TIMESTAMP.sql

# 2. Revert schema.prisma
git checkout HEAD^ -- packages/db/prisma/schema.prisma

# 3. Regenerate Prisma client
pnpm --filter @workspace/db db:generate

# 4. Redeploy application
```

### If Cleanup Created Issues

```sql
-- Restore from backup table (created by cleanup script)
DROP TABLE file_version;
ALTER TABLE file_version_backup RENAME TO file_version;
```

### If Application Errors After Deployment

1. Check error logs for unique constraint violations
2. If widespread issues:
   ```bash
   # Emergency rollback
   git revert <migration-commit>
   pnpm --filter @workspace/db db:migrate
   ```

---

## 9. Monitoring & Validation

### Post-Deployment Checks

```sql
-- Verify unique constraint exists
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'file_version'
  AND indexname LIKE '%unique%';

-- Check for any duplicate versions (should be 0)
SELECT
  "fileId",
  version,
  COUNT(*) as count
FROM file_version
GROUP BY "fileId", version
HAVING COUNT(*) > 1;

-- Verify version sequences
SELECT
  f.id,
  f.name,
  COUNT(fv.id) as version_count,
  MAX(fv.version) as max_version
FROM file f
LEFT JOIN file_version fv ON f.id = fv."fileId"
GROUP BY f.id, f.name
HAVING COUNT(fv.id) != MAX(fv.version);
-- Should return 0 rows if all versions are sequential
```

### Application Logs to Monitor

```bash
# Look for version creation conflicts (should see retries, not failures)
grep "Version creation conflict" /var/log/app.log

# Look for failures after retries (should be rare/none)
grep "Failed to create version" /var/log/app.log
```

---

## 10. Risk Assessment

### Low Risk

- ✅ Schema change is backward compatible (only adds constraint)
- ✅ Cleanup script has dry-run mode
- ✅ Backup created before cleanup
- ✅ All changes in transactions

### Medium Risk

- ⚠️ Code changes required in 3 endpoints
- ⚠️ Potential for transient errors during high concurrency
- ⚠️ Retry logic adds slight performance overhead

### Mitigation

- ✅ Comprehensive testing (unit + integration)
- ✅ Safe version creator with retry logic
- ✅ Rollback procedures documented
- ✅ Monitoring plan in place

---

## 11. Success Criteria

### Migration Success

- [ ] No duplicate versions exist
- [ ] Unique constraint added successfully
- [ ] All tests pass
- [ ] Application starts without errors

### Runtime Success

- [ ] File creation works correctly
- [ ] File updates create sequential versions
- [ ] File reverts work correctly
- [ ] No version creation failures in logs
- [ ] Concurrent updates handled gracefully

---

## 12. Time Estimates

| Phase                             | Time         | Status         |
| --------------------------------- | ------------ | -------------- |
| Analysis & Planning               | 1 hour       | ✅ DONE        |
| Create validation script          | 30 min       | ✅ DONE        |
| Create cleanup script             | 1 hour       | ✅ DONE        |
| Create safe version creator       | 1 hour       | ✅ DONE        |
| Update schema                     | 10 min       | ✅ DONE        |
| Create migration                  | 10 min       | ⏳ PENDING     |
| Update POST /api/files            | 20 min       | ⏳ PENDING     |
| Update PUT /api/files/:id         | 30 min       | ⏳ PENDING     |
| Update POST /api/files/:id/revert | 20 min       | ⏳ PENDING     |
| Write unit tests                  | 1 hour       | ⏳ PENDING     |
| Write integration tests           | 1 hour       | ⏳ PENDING     |
| Manual testing                    | 30 min       | ⏳ PENDING     |
| Documentation                     | 30 min       | 🔄 IN PROGRESS |
| **TOTAL**                         | **~6 hours** | **~50% DONE**  |

---

## 13. Dependencies

### Must Complete Before Migration

1. ✅ Create validation script
2. ✅ Create cleanup script
3. ⏳ Run validation on production data
4. ⏳ Clean up any duplicates found

### Must Complete Before Code Deploy

1. ✅ Update schema
2. ⏳ Apply migration
3. ⏳ Update all 3 affected endpoints
4. ⏳ Pass all tests

---

## 14. Communication Plan

### Before Migration

- Notify team of planned change
- Share this implementation plan
- Schedule maintenance window if needed

### During Migration

- Monitor application logs
- Be ready to rollback if issues arise
- Keep team updated on progress

### After Migration

- Confirm success criteria met
- Document any issues encountered
- Share lessons learned

---

## 15. Next Steps

### Immediate (Complete Implementation)

1. ⏳ Create migration file
2. ⏳ Update file.routes.ts with safe version creator
3. ⏳ Write and run tests
4. ⏳ Test in development environment

### Before Production Deploy

1. ⏳ Run validation script on production data
2. ⏳ Clean up any duplicates
3. ⏳ Create production database backup
4. ⏳ Schedule deployment window

### Post-Deployment

1. ⏳ Monitor application logs for 24 hours
2. ⏳ Run validation queries
3. ⏳ Mark task as complete
4. ⏳ Update documentation

---

## Appendix A: SQL Queries for Manual Verification

```sql
-- Find files with non-sequential versions
WITH version_gaps AS (
  SELECT
    fv."fileId",
    fv.version,
    LAG(fv.version) OVER (PARTITION BY fv."fileId" ORDER BY fv.version) as prev_version
  FROM file_version fv
)
SELECT
  f.name,
  f.path,
  vg."fileId",
  vg.prev_version,
  vg.version,
  (vg.version - vg.prev_version) as gap
FROM version_gaps vg
JOIN file f ON f.id = vg."fileId"
WHERE vg.prev_version IS NOT NULL
  AND (vg.version - vg.prev_version) > 1
ORDER BY vg."fileId", vg.version;

-- Verify version creation timestamps are sequential
SELECT
  fv."fileId",
  fv.version,
  fv."createdAt",
  LAG(fv."createdAt") OVER (PARTITION BY fv."fileId" ORDER BY fv.version) as prev_created_at
FROM file_version fv
WHERE fv."createdAt" < LAG(fv."createdAt") OVER (PARTITION BY fv."fileId" ORDER BY fv.version)
ORDER BY fv."fileId", fv.version;
-- Should return 0 rows if all versions created in order
```

## Appendix B: Error Codes

| Error Code | Description                 | Action                                                |
| ---------- | --------------------------- | ----------------------------------------------------- |
| P2002      | Unique constraint violation | Retry with new version number (handled automatically) |
| P2025      | Record not found            | File was deleted during version creation              |
| P2034      | Transaction conflict        | Retry operation                                       |
