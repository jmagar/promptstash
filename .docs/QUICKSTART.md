# PromptStash - Quick Start Guide

Welcome to PromptStash! This guide will get you up and running in 5 minutes.

## What is PromptStash?

PromptStash is a web application for managing your Claude Code files (agents, skills, commands, hooks, and settings) with:

- ✅ Real-time validation
- ✅ Automatic versioning
- ✅ Beautiful UI with dark mode
- ✅ Full-text search and tagging
- ✅ Complete version history

---

## Prerequisites

- Node.js 20+ installed
- pnpm 10.4.1+ installed
- Docker and Docker Compose installed
- Git

---

## Quick Start (5 minutes)

### 1. Start the Database

```bash
# Start PostgreSQL container
docker compose -f docker-compose.dev.yml up -d

# Verify it's running
docker ps | grep promptstash
# Should see: promptstash-postgres-dev (healthy)
```

### 2. Install Dependencies

```bash
# Install all dependencies (first time only)
pnpm install

# Generate Prisma Client (first time only)
pnpm --filter @workspace/db db:generate
```

### 3. Seed Demo Data (Optional)

```bash
# Add demo user, stash, files, and tags
pnpm --filter @workspace/db db:seed
```

### 4. Start Development Servers

```bash
# Start everything (web + API)
pnpm dev
```

This starts:

- **Web App**: http://localhost:3000
- **API Server**: http://localhost:4000

---

## 🎉 What's Working Right Now

### ✅ Full End-to-End CRUD (NEW!)

**You can now:**

- ✅ View files from database in a beautiful grid
- ✅ Click "New File" → Create files through modal
- ✅ Click file card → Edit content in slide-out editor
- ✅ Save changes → Auto-versioning works
- ✅ Create folders through "New Folder" modal
- ✅ Toggle dark/light theme
- ✅ See loading states and toast notifications

### ✅ Backend API (Fully Functional)

All API endpoints are working:

```bash
# Test API endpoints
curl http://localhost:4000/api/stashes
curl http://localhost:4000/api/files

# Validate an agent file
curl -X POST http://localhost:4000/api/validate/agent \
  -H "Content-Type: application/json" \
  -d '{
    "content": "---\ndescription: Test agent\n---\nContent",
    "filename": "test-agent.md"
  }'
```

### ✅ Database (Seeded with Demo Data)

- 1 user: demo@promptstash.dev
- 1 stash: "My PromptStash" (USER scope)
- 2 files: CLAUDE.md, Button.md
- 2 folders: Root (/), components/
- 2 tags: "react", "ui"

### ✅ UI Components

Navigate to:

- http://localhost:3000/stash - Main stash page (NEW!)

Components built:

- Header with search and theme toggle
- Toolbar with action buttons
- File grid with type-specific icons
- Breadcrumb navigation
- Loading states

### ⚠️ Known Issue

The Next.js build currently fails on auth-related pages due to a useContext issue in the template. This doesn't affect the development server - everything works in `pnpm dev` mode!

**Workaround**: Use development mode for now. We're working on the build fix.

---

## Project Structure

```
promptstash/
├── apps/
│   ├── web/          # Next.js app (port 3000)
│   └── api/          # Express API (port 4000)
├── packages/
│   ├── db/           # Prisma database layer
│   ├── utils/        # Validators for agents, skills, MCP, hooks
│   └── ui/           # React components
└── docker-compose.dev.yml
```

---

## Available Commands

```bash
# Development
pnpm dev              # Start all dev servers
pnpm --filter web dev # Start web only
pnpm --filter api dev # Start API only

# Database
pnpm --filter @workspace/db db:generate  # Generate Prisma Client
pnpm --filter @workspace/db db:migrate   # Run migrations
pnpm --filter @workspace/db db:seed      # Seed demo data
pnpm --filter @workspace/db db:studio    # Open Prisma Studio

# Build (has known issue, use dev mode)
pnpm build            # Build all packages
pnpm --filter web build

# Lint & Format
pnpm lint             # Lint all code
pnpm format           # Format all code

# Clean
pnpm clean            # Clear Turborepo cache
```

---

## API Endpoints

### Stashes

- `GET /api/stashes` - List all stashes
- `GET /api/stashes/:id` - Get stash with contents
- `POST /api/stashes` - Create new stash
- `GET /api/stashes/:id/files` - List files (with search/filter)

### Files

- `GET /api/files/:id` - Get file with tags
- `POST /api/files` - Create file (with validation)
- `PUT /api/files/:id` - Update file (auto-versioning)
- `DELETE /api/files/:id` - Delete file
- `GET /api/files/:id/versions` - Get version history
- `POST /api/files/:id/revert` - Revert to version

### Validation

- `POST /api/validate/agent` - Validate agent files
- `POST /api/validate/skill` - Validate skill files
- `POST /api/validate/mcp` - Validate MCP config
- `POST /api/validate/hooks` - Validate hooks config

---

## Database Connection

**Connection String:**

```
postgresql://promptstash:promptstash_dev_password@localhost:3500/promptstash
```

**Access with psql:**

```bash
psql postgresql://promptstash:promptstash_dev_password@localhost:3500/promptstash
```

**Prisma Studio:**

```bash
pnpm --filter @workspace/db db:studio
# Opens at http://localhost:5555
```

---

## Troubleshooting

### Database won't start

```bash
# Check if port 5434 is in use
lsof -i :3500

# Stop and restart container
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d
```

### API won't start

```bash
# Check if port 4000 is in use
lsof -i :4000

# Check API logs
pnpm --filter api dev
```

### Web app won't start

```bash
# Check if port 3000 is in use
lsof -i :3000

# Clear Next.js cache
rm -rf apps/web/.next
pnpm --filter web dev
```

### Prisma Client errors

```bash
# Regenerate Prisma Client
pnpm --filter @workspace/db db:generate

# Check database is running
docker ps | grep promptstash
```

---

## Next Steps

### Coming Soon

- ✅ File editors (Markdown, JSON, Session viewer)
- ✅ New File / New Folder modals
- ✅ Hooks Builder UI
- ✅ GitHub Actions generator
- ✅ Search (Cmd+K) with full-text search
- ✅ File sharing with permissions
- ✅ Tag management UI

### Documentation

- **DATABASE_SETUP.md** - Detailed database setup
- **.docs/implementation-progress.md** - Development progress
- **.docs/final-implementation-summary.md** - Complete technical summary

---

## Support

**Issues?** Check:

1. All services running: `docker ps` and `pnpm dev`
2. Database seeded: `pnpm --filter @workspace/db db:seed`
3. Environment files exist: `apps/web/.env.local`, `apps/api/.env`, `packages/db/.env`

**Still stuck?** The codebase is well-documented with inline comments!

---

## What's Built (50% Complete - MVP Done! 🎉)

✅ **Backend**:

- Complete RESTful API with Express
- PostgreSQL database with Prisma ORM
- Comprehensive validators (Agent, Skill, MCP, Hooks)
- Automatic file versioning

✅ **Frontend**:

- Modern React 19 + Next.js 16
- Custom UI components (Header, Toolbar, FileCard, FileGrid, Breadcrumb)
- API client with TypeScript types
- React Query for data fetching
- Dark mode support

✅ **Developer Experience**:

- One-command startup (`pnpm dev`)
- Hot reload for API and web
- Docker-based database
- TypeScript strict mode throughout
- Comprehensive documentation

---

**Happy coding! 🚀**
