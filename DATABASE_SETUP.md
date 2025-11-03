# Database Setup Guide

Complete guide for setting up and managing the PromptStash PostgreSQL database with Prisma ORM.

## Overview

PromptStash uses:

- **Database**: PostgreSQL 16
- **ORM**: Prisma 6.16.1
- **Migration Tool**: Prisma Migrate
- **Admin Tool**: Prisma Studio

## Quick Setup (Development)

### Option 1: Docker (Recommended)

The fastest way to get started:

```bash
# Start PostgreSQL in Docker
docker compose -f docker-compose.dev.yml up -d

# This creates:
# - Container: promptstash-postgres
# - Database: promptstash
# - User: promptstash
# - Password: promptstash123
# - Port: 5432
```

**Connection String:**

```
postgresql://promptstash:promptstash123@localhost:5432/promptstash
```

### Option 2: Local PostgreSQL Installation

If you have PostgreSQL installed locally:

```bash
# Create database and user
createuser promptstash -P  # Enter password when prompted
createdb promptstash -O promptstash

# Or using psql:
psql postgres
CREATE USER promptstash WITH PASSWORD 'your-password';
CREATE DATABASE promptstash OWNER promptstash;
\q
```

**Connection String:**

```
postgresql://promptstash:your-password@localhost:5432/promptstash
```

## Environment Configuration

You need to set `DATABASE_URL` in **three places**:

### 1. Web App: `apps/web/.env.local`

```bash
DATABASE_URL="postgresql://promptstash:promptstash123@localhost:5432/promptstash"
```

### 2. API Server: `apps/api/.env`

```bash
DATABASE_URL="postgresql://promptstash:promptstash123@localhost:5432/promptstash"
```

### 3. Database Package: `packages/db/.env`

```bash
DATABASE_URL="postgresql://promptstash:promptstash123@localhost:5432/promptstash"
```

**Why three places?**

- `packages/db/.env`: Used by Prisma CLI for migrations and generation
- `apps/web/.env.local`: Used by Next.js for server-side database access
- `apps/api/.env`: Used by Express API for database access

## Database Initialization

### Step 1: Generate Prisma Client

This generates the TypeScript types for database access:

```bash
pnpm --filter @workspace/db db:generate

# Or from packages/db:
cd packages/db
pnpm db:generate
```

This creates:

- `packages/db/generated/prisma/index.d.ts` - Type definitions
- `packages/db/generated/prisma/client/index.js` - Prisma Client

### Step 2: Run Migrations

Apply database schema to PostgreSQL:

```bash
pnpm --filter @workspace/db db:migrate

# Or from packages/db:
cd packages/db
pnpm db:migrate
```

This creates all tables, indexes, and constraints.

### Step 3: Seed Database (Optional)

Populate with sample data:

```bash
pnpm --filter @workspace/db db:seed

# Or from packages/db:
cd packages/db
pnpm db:seed
```

This creates:

- Sample users
- Default stashes
- Example files and folders

## Database Schema

### Authentication Models

#### User

Primary user entity with authentication support.

```prisma
model User {
  id               String      @id
  name             String
  email            String      @unique
  emailVerified    Boolean     @default(false)
  image            String?
  twoFactorEnabled Boolean?    @default(false)
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  sessions         Session[]
  accounts         Account[]
  twofactors       TwoFactor[]
  stashes          Stash[]
}
```

**Indexes:**

- Unique on `email`

#### Session

User authentication sessions with expiry tracking.

```prisma
model Session {
  id        String   @id
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(...)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Indexes:**

- Unique on `token`

#### Account

OAuth provider accounts linked to users.

```prisma
model Account {
  id                    String    @id
  accountId             String
  providerId            String    # "google", "github", etc.
  userId                String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?   # For email/password auth
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}
```

#### Verification

Email verification and password reset tokens.

```prisma
model Verification {
  id         String   @id
  identifier String   # email or user ID
  value      String   # verification code
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

#### TwoFactor

Two-factor authentication (2FA) configuration.

```prisma
model TwoFactor {
  id          String @id
  secret      String        # TOTP secret
  backupCodes String        # Hashed backup codes
  userId      String
  user        User   @relation(...)
}
```

### PromptStash Models

#### Stash

Top-level container for organizing files and folders.

```prisma
model Stash {
  id          String     @id @default(cuid())
  name        String
  scope       StashScope # USER, PROJECT, PLUGIN, MARKETPLACE
  description String?
  userId      String
  user        User       @relation(...)
  folders     Folder[]
  files       File[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}
```

**Scopes:**

- `USER`: Personal stash, visible only to owner
- `PROJECT`: Project-specific stash (future)
- `PLUGIN`: Plugin/extension stash (future)
- `MARKETPLACE`: Shared marketplace stash (future)

**Indexes:**

- `userId`
- `userId, createdAt DESC` (for efficient user stash listing)

#### Folder

Hierarchical folder structure within stashes.

```prisma
model Folder {
  id       String   @id @default(cuid())
  name     String
  path     String          # Full path for quick lookup
  parentId String?
  parent   Folder?  @relation("FolderHierarchy", ...)
  children Folder[] @relation("FolderHierarchy")
  files    File[]
  stashId  String
  stash    Stash    @relation(...)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Indexes:**

- `stashId, parentId`
- `path`

#### File

Individual files (agents, skills, configs, etc.).

```prisma
model File {
  id       String        @id @default(cuid())
  name     String
  path     String        # Logical path (e.g., .claude/agents/test.md)
  content  String        @db.Text
  fileType FileType      # MARKDOWN, JSON, JSONL, YAML
  folderId String?
  folder   Folder?       @relation(...)
  stashId  String
  stash    Stash         @relation(...)
  tags     FileTag[]
  versions FileVersion[]
  shares   FileShare[]
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
}
```

**File Types:**

- `MARKDOWN`: Agents, skills, commands
- `JSON`: MCP configs, hooks
- `JSONL`: Session logs
- `YAML`: Configuration files

**Indexes:**

- `stashId, folderId`
- `stashId, updatedAt DESC` (for recent files)
- `stashId, fileType` (for filtering)
- `path` (for quick path lookups)

#### Tag

Tags for categorizing files.

```prisma
model Tag {
  id    String    @id @default(cuid())
  name  String    @unique
  color String?   # Hex color for UI
  files FileTag[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### FileTag

Many-to-many relationship between files and tags.

```prisma
model FileTag {
  id     String @id @default(cuid())
  fileId String
  file   File   @relation(...)
  tagId  String
  tag    Tag    @relation(...)
  createdAt DateTime @default(now())
}
```

**Indexes:**

- Unique on `fileId, tagId`
- `fileId`
- `tagId`

#### FileVersion

Version history for files (immutable).

```prisma
model FileVersion {
  id        String   @id @default(cuid())
  fileId    String
  file      File     @relation(...)
  content   String   @db.Text
  version   Int               # Sequential version number
  createdBy String            # User ID who created this version
  createdAt DateTime @default(now())
}
```

**Indexes:**

- `fileId, version DESC` (for efficient version lookup)

#### FileShare

File sharing with permissions and expiry.

```prisma
model FileShare {
  id         String          @id @default(cuid())
  fileId     String
  file       File            @relation(...)
  sharedWith String          # User ID or email
  permission SharePermission # VIEW, EDIT, COMMENT
  shareToken String          @unique
  expiresAt  DateTime?
  createdBy  String
  createdAt  DateTime        @default(now())
}
```

**Permissions:**

- `VIEW`: Read-only access
- `EDIT`: Full edit access
- `COMMENT`: Can view and comment

**Indexes:**

- `fileId`
- `sharedWith`
- Unique on `shareToken`

## Database Commands

### Prisma Client Generation

Generate TypeScript types and client:

```bash
pnpm --filter @workspace/db db:generate
```

Run this after:

- Changing the schema
- Pulling the project for the first time
- Switching branches with schema changes

### Migrations

#### Create a New Migration

```bash
# Interactive migration (asks for name)
pnpm --filter @workspace/db db:migrate:create

# This will:
# 1. Detect schema changes
# 2. Generate SQL migration file
# 3. Apply migration to database
# 4. Update Prisma Client
```

#### Apply Existing Migrations

```bash
pnpm --filter @workspace/db db:migrate
```

#### Reset Database (⚠️ Destructive)

```bash
# Drops database, recreates schema, runs seed
pnpm --filter @workspace/db db:reset
```

**Warning:** This deletes ALL data!

### Migration Rollback Strategy

Prisma Migrate **does not** have built-in rollback functionality. You must implement rollbacks manually.

#### Development Rollback (Simple)

For development environments, the easiest rollback is to reset and reapply:

```bash
# ⚠️ This deletes all data!
pnpm --filter @workspace/db db:reset
```

#### Production Rollback (Safe)

For production, follow this multi-step approach:

**1. Always Backup Before Migration**

```bash
# Create timestamped backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "backup_pre_migration_$TIMESTAMP.sql"
```

**2. Create Rollback Migration**

If a migration fails or needs to be reversed, create a reverse migration:

```bash
# Example: Reverting "add_column_to_table"
pnpm --filter @workspace/db db:migrate:create
# Name it: "rollback_add_column_to_table"
```

Edit the generated SQL to reverse the changes:

```sql
-- Original migration added a column:
-- ALTER TABLE "User" ADD COLUMN "phone" TEXT;

-- Rollback migration removes it:
ALTER TABLE "User" DROP COLUMN "phone";
```

Apply the rollback:

```bash
pnpm --filter @workspace/db db:migrate
```

**3. Common Rollback Scenarios**

**Rolling back a new column:**

```sql
-- Original: ALTER TABLE "User" ADD COLUMN "age" INTEGER;
-- Rollback:
ALTER TABLE "User" DROP COLUMN "age";
```

**Rolling back a new table:**

```sql
-- Original: CREATE TABLE "Post" (...);
-- Rollback:
DROP TABLE "Post";
```

**Rolling back a constraint:**

```sql
-- Original: ALTER TABLE "User" ADD CONSTRAINT "email_unique" UNIQUE ("email");
-- Rollback:
ALTER TABLE "User" DROP CONSTRAINT "email_unique";
```

**Rolling back a data migration:**

```sql
-- Original: UPDATE "User" SET "status" = 'active' WHERE "status" IS NULL;
-- Rollback: (restore from backup or recreate original state)
UPDATE "User" SET "status" = NULL WHERE "status" = 'active';
```

**4. Emergency Rollback Procedure**

If a migration causes critical issues:

```bash
# 1. Put application in maintenance mode
# 2. Stop all services accessing the database
# 3. Restore from backup
psql $DATABASE_URL < backup_pre_migration_20250101_120000.sql

# 4. Delete the failed migration from Prisma's tracking
psql $DATABASE_URL
DELETE FROM "_prisma_migrations" WHERE migration_name = 'YYYYMMDDHHMMSS_failed_migration';
\q

# 5. Remove migration folder
rm -rf packages/db/prisma/migrations/YYYYMMDDHHMMSS_failed_migration

# 6. Verify database state
pnpm --filter @workspace/db db:studio

# 7. Restart services
```

**5. Production Rollback Checklist**

Before any production migration:

- [ ] Full database backup created
- [ ] Migration tested in staging environment
- [ ] Rollback plan documented
- [ ] Team notified of maintenance window
- [ ] Monitoring and alerts active
- [ ] Rollback migration prepared (if applicable)
- [ ] Application can handle both old and new schema (for zero-downtime)

**6. Zero-Downtime Migration Strategy**

For critical systems, use a multi-phase approach:

**Phase 1: Add New Schema (Backward Compatible)**

```sql
-- Add new column as nullable
ALTER TABLE "User" ADD COLUMN "full_name" TEXT;
```

**Phase 2: Dual-Write (Application Updated)**

```typescript
// Application writes to both old and new fields
await prisma.user.update({
  data: {
    firstName: "John", // Old
    lastName: "Doe",    // Old
    fullName: "John Doe", // New
  },
});
```

**Phase 3: Data Migration**

```sql
-- Migrate existing data
UPDATE "User" SET "full_name" = CONCAT("firstName", ' ', "lastName") WHERE "full_name" IS NULL;
```

**Phase 4: Make Required & Cleanup**

```sql
-- After all data is migrated
ALTER TABLE "User" ALTER COLUMN "full_name" SET NOT NULL;
ALTER TABLE "User" DROP COLUMN "firstName";
ALTER TABLE "User" DROP COLUMN "lastName";
```

Each phase can be rolled back independently.

### Prisma Studio

Visual database browser:

```bash
pnpm --filter @workspace/db db:studio

# Opens at: http://localhost:5555
```

Features:

- Browse all tables
- View relationships
- Edit data directly
- Run queries

### Database Seeding

```bash
pnpm --filter @workspace/db db:seed
```

Seed script location: `packages/db/prisma/seed.ts`

## Production Setup

### Environment Variables

For production, use a managed PostgreSQL service:

**Recommended Providers:**

- [Supabase](https://supabase.com) - Free tier includes PostgreSQL
- [Railway](https://railway.app) - Easy PostgreSQL hosting
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [AWS RDS](https://aws.amazon.com/rds/) - Enterprise option

**Connection String Format:**

```bash
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

### SSL/TLS Configuration

For production databases with SSL:

```bash
# Add SSL parameters to connection string
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require&sslcert=/path/to/cert.pem"
```

### Connection Pooling

For production, use connection pooling:

**Option 1: Prisma Accelerate**

```bash
# Use Prisma's managed connection pooling
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=your-key"
```

**Option 2: PgBouncer**

```bash
# Self-hosted connection pooler
DATABASE_URL="postgresql://user:password@pgbouncer-host:6432/database"
```

### Running Migrations in Production

```bash
# Apply migrations without prompts
pnpm --filter @workspace/db db:migrate deploy

# Or in CI/CD:
npx prisma migrate deploy
```

## Backup and Restore

### Backup Database

```bash
# Full database backup
pg_dump -h localhost -U promptstash -d promptstash > backup.sql

# Schema only
pg_dump -h localhost -U promptstash -d promptstash --schema-only > schema.sql

# Data only
pg_dump -h localhost -U promptstash -d promptstash --data-only > data.sql
```

### Restore Database

```bash
# Restore from backup
psql -h localhost -U promptstash -d promptstash < backup.sql
```

## Troubleshooting

### Error: "Can't reach database server"

**Check:**

1. Database is running: `docker ps` or `pg_isready`
2. Connection string is correct
3. Firewall allows port 5432
4. Database user has permissions

### Error: "Prisma Client not generated"

**Solution:**

```bash
pnpm --filter @workspace/db db:generate
```

### Error: "Migration failed"

**Solutions:**

1. Check migration SQL:

```bash
# View migrations
ls packages/db/prisma/migrations/
```

2. Reset and retry:

```bash
# ⚠️ Destructive!
pnpm --filter @workspace/db db:reset
```

3. Manual rollback:

```bash
# Rollback last migration
psql -h localhost -U promptstash -d promptstash
DROP TABLE IF EXISTS "new_table";
```

### Error: "Column does not exist"

**Cause:** Prisma Client is out of sync with database

**Solution:**

```bash
# Regenerate client
pnpm --filter @workspace/db db:generate

# If that doesn't work, reset
pnpm --filter @workspace/db db:reset
```

### Slow Queries

**Debug:**

1. Enable query logging in Prisma:

```typescript
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});
```

2. Check indexes:

```sql
SELECT * FROM pg_indexes WHERE tablename = 'file';
```

3. Analyze query plan:

```sql
EXPLAIN ANALYZE SELECT * FROM file WHERE stashId = 'xxx';
```

## Best Practices

### Schema Changes

1. **Always create migrations:**

   ```bash
   pnpm --filter @workspace/db db:migrate:create
   ```

2. **Never edit generated files** in `packages/db/generated/`

3. **Test migrations** on a copy of production data before deploying

### Type Safety

```typescript
import { prisma, type Prisma } from "@workspace/db";

// Use Prisma types for type safety
const where: Prisma.FileWhereInput = {
  stashId: "xxx",
  fileType: "MARKDOWN",
};

const files = await prisma.file.findMany({ where });
```

### Transactions

```typescript
// Use transactions for atomic operations
const result = await prisma.$transaction(async (tx) => {
  const file = await tx.file.create({
    /* ... */
  });
  await tx.fileVersion.create({
    /* ... */
  });
  return file;
});
```

### Efficient Queries

```typescript
// ✅ Good - Use specific includes
const file = await prisma.file.findUnique({
  where: { id },
  include: {
    tags: {
      include: { tag: true },
    },
  },
});

// ❌ Bad - Fetches unnecessary data
const file = await prisma.file.findUnique({
  where: { id },
  include: {
    tags: true,
    versions: true,
    shares: true,
    folder: true,
    stash: true,
  },
});
```

### Soft Deletes (Optional)

Add `deletedAt` for soft deletes:

```prisma
model File {
  // ... existing fields
  deletedAt DateTime?
}
```

Then filter in queries:

```typescript
const files = await prisma.file.findMany({
  where: {
    deletedAt: null, // Only active files
  },
});
```

## Database Monitoring

### Query Performance

```sql
-- Slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Database Size

```sql
-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Connection Count

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;
```

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Database Design Guide](https://www.prisma.io/dataguide/)

## Related Documentation

- **[Quick Start Guide](QUICKSTART.md)**: Get started quickly
- **[Working Demo](DEMO.md)**: Learn by example
- **[API Documentation](API.md)**: REST API reference
- **[Full Documentation](CLAUDE.md)**: Complete technical reference
