# Schema Update: Add Unique Constraint on FileVersion

## Current Schema (BEFORE)

```prisma
model FileVersion {
  id        String   @id @default(cuid())
  fileId    String
  file      File     @relation(fields: [fileId], references: [id], onDelete: Cascade)
  content   String   @db.Text
  version   Int
  createdAt DateTime @default(now())
  createdBy String

  @@index([fileId, version(sort: Desc)])
  @@map("file_version")
}
```

## Updated Schema (AFTER)

```prisma
model FileVersion {
  id        String   @id @default(cuid())
  fileId    String
  file      File     @relation(fields: [fileId], references: [id], onDelete: Cascade)
  content   String   @db.Text
  version   Int
  createdAt DateTime @default(now())
  createdBy String

  @@unique([fileId, version])
  @@index([fileId, version(sort: Desc)])
  @@map("file_version")
}
```

## Changes

**Added:**

- `@@unique([fileId, version])` - Ensures each file can only have one version with a given version number

**Kept:**

- `@@index([fileId, version(sort: Desc)])` - For efficient version lookup (latest first)

## SQL Migration

```sql
-- Add unique constraint on (fileId, version)
CREATE UNIQUE INDEX "file_version_fileId_version_key" ON "file_version"("fileId", "version");
```

## Impact

### Prevents

- Duplicate version numbers for the same file
- Race conditions in concurrent version creation

### Database Behavior

- INSERT with duplicate (fileId, version) will fail with unique constraint violation
- Application must handle this error and retry with the next version number

### Index Benefits

- The unique constraint creates an index automatically
- Efficient for checking version existence
- Complements the existing DESC index for latest-first queries
