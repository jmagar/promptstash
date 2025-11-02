# Database Setup Summary

## Completed Setup (2025-11-02)

### ✅ What Was Done

1. **PostgreSQL Container Created**
   - Created `docker-compose.dev.yml` for development database
   - PostgreSQL 16 Alpine running on port 5434 (avoids conflicts with other services)
   - Container name: `promptstash-postgres-dev`
   - Database: `promptstash`
   - Credentials: `promptstash` / `promptstash_dev_password`
   - Persistent volume: `promptstash_postgres_dev_data`

2. **Database Configuration**
   - Created `packages/db/.env` with DATABASE_URL
   - Created `apps/web/.env.local` with DATABASE_URL and other configs
   - Created `apps/api/.env` with DATABASE_URL and other configs
   - Connection string: `postgresql://promptstash:promptstash_dev_password@localhost:5434/promptstash`

3. **Initial Migration**
   - Created migration: `20251102074234_init_promptstash_schema`
   - All 13 tables created successfully:
     - Authentication: user, session, account, verification, twoFactor
     - PromptStash: stash, folder, file, tag, file_tag, file_version, file_share
     - System: _prisma_migrations

4. **Database Seeding**
   - Created `packages/db/prisma/seed.ts`
   - Added `db:seed` script to package.json
   - Installed `tsx` for running TypeScript seed files
   - Seeded with demo data:
     - 1 demo user: demo@promptstash.dev
     - 1 stash: "My PromptStash"
     - 2 folders: Root (/) and components (/components)
     - 2 files: CLAUDE.md and Button.md
     - 2 tags: react, ui
     - File tags and version history

5. **Documentation**
   - Created comprehensive `DATABASE_SETUP.md` guide
   - Includes setup instructions, schema overview, commands, and troubleshooting

### 🎯 Database Schema Overview

**Authentication Models**
- User: Email, password, OAuth, 2FA support
- Session: Token-based sessions with expiration
- Account: OAuth provider integration (Google)
- TwoFactor: TOTP secrets and backup codes
- Verification: Email verification and password reset

**PromptStash Models**
- Stash: Top-level containers (USER, PROJECT, PLUGIN, MARKETPLACE scopes)
- Folder: Hierarchical folder structure with path tracking
- File: Context files (MARKDOWN, JSON, JSONL, YAML types)
- FileVersion: Complete version history tracking
- Tag: Organizational labels with colors
- FileTag: Many-to-many file-tag relationships
- FileShare: Granular sharing (VIEW, EDIT, COMMENT permissions)

### 🚀 Quick Start Commands

```bash
# Start the database
docker compose -f docker-compose.dev.yml up -d

# Run migrations
pnpm --filter @workspace/db db:migrate

# Seed demo data
pnpm --filter @workspace/db db:seed

# Access PostgreSQL CLI
docker exec -it promptstash-postgres-dev psql -U promptstash -d promptstash

# Stop the database
docker compose -f docker-compose.dev.yml down
```

### 📊 Verified Database State

```sql
-- User table
demo-user-id | Demo User | demo@promptstash.dev

-- Stash table  
demo-stash-id | My PromptStash | USER

-- File table
CLAUDE.md | /CLAUDE.md | MARKDOWN
Button.md | /components/Button.md | MARKDOWN

-- All tables present and indexed correctly
```

### 🔧 Configuration Details

**Database Connection**
- Host: localhost
- Port: 5434 (chosen to avoid conflicts with ports 5432, 5433 already in use)
- Database: promptstash
- User: promptstash
- Password: promptstash_dev_password

**Container Health Check**
- Command: `pg_isready -U promptstash -d promptstash`
- Interval: 10s
- Timeout: 5s
- Retries: 5

**Environment Files Created**
- `packages/db/.env` - Prisma CLI
- `apps/web/.env.local` - Next.js app with full config
- `apps/api/.env` - Express API with full config

### 📝 Next Steps for Developers

1. **First Time Setup**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   pnpm --filter @workspace/db db:seed
   ```

2. **Configure External Services** (Optional but recommended)
   - Generate BETTER_AUTH_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Set up Google OAuth credentials
   - Get Resend API key for emails
   - Get Upstash Redis credentials for rate limiting

3. **Start Development**
   ```bash
   pnpm dev  # Starts web, api, and email preview
   ```

4. **Verify Database Connection**
   - Web app will use Prisma Client to connect
   - API will use the same database
   - Both apps share the same authentication and data

### ⚠️ Important Notes

- Database runs on port **5434** (not 5432) to avoid conflicts
- Environment files need external service credentials to fully work
- Seeded demo user is for reference only - authentication needs to be configured
- Volume `promptstash_postgres_dev_data` persists data between container restarts
- Use `docker compose -f docker-compose.dev.yml down -v` to completely reset

### 🐛 Troubleshooting

**If port 5434 is taken:**
- Edit `docker-compose.dev.yml` and change port mapping
- Update DATABASE_URL in all three .env files

**If connection fails:**
- Check container: `docker ps | grep promptstash-postgres`
- Check logs: `docker compose -f docker-compose.dev.yml logs postgres`
- Verify health: `docker inspect promptstash-postgres-dev | grep Health`

**If migration conflicts:**
```bash
cd packages/db
pnpm db:reset  # ⚠️ Deletes all data
pnpm db:seed   # Restore demo data
```

### 📚 Additional Resources

See `DATABASE_SETUP.md` in the project root for:
- Detailed schema documentation
- All available commands
- Production deployment guide
- Advanced troubleshooting
- PostgreSQL and Prisma documentation links
