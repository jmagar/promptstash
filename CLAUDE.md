# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# PromptStash - Architecture & Development Guide

Modern TypeScript monorepo for managing Claude Code files (agents, skills, commands, hooks, MCP configs).

**Stack:** Next.js 16 (React 19) + Express 5 + PostgreSQL + Prisma + Better Auth
**Ports:** Web 3100, API 3300, DB 5432
**Package Manager:** pnpm 10.4.1 with workspaces

## Quick Start

```bash
# Start database
docker compose -f docker-compose.dev.yml up -d

# Setup
pnpm install
pnpm db:generate
pnpm db:seed

# Start dev servers
pnpm dev

# URLs
# Web: http://localhost:3100/stash
# API: http://localhost:3300
```

See @docs/guides/QUICKSTART.md for detailed setup.

---

## Project Structure

```
apps/
├── web/          # Next.js 16 (port 3100) - React 19, App Router, Turbopack
├── api/          # Express 5 (port 3300) - REST API with factory pattern
└── email/        # React Email preview server

packages/
├── db/           # Prisma schema, migrations, shared client
├── auth/         # Better Auth (multi-env: client/server/Next.js/Express)
├── ui/           # shadcn/ui components (Radix + Tailwind)
├── utils/        # File validation utilities
├── email/        # React Email templates + Resend
├── rate-limit/   # Upstash Redis rate limiting
└── observability/# Logging, metrics, health checks
```

**Import convention:** `@workspace/<package-name>`

---

## Key Architectural Patterns

### 1. Multi-Environment Auth Architecture

The `@workspace/auth` package provides environment-specific exports:

```typescript
// Client-side React (hooks)
import { useSession } from "@workspace/auth/client";

// Server-side Next.js (Server Components, API Routes)
import { auth } from "@workspace/auth/server";

// Express middleware
import { authMiddleware } from "@workspace/auth/node-handlers";
```

**Critical:** Never use server-side auth in client components - this will cause hydration errors.

### 2. Next.js Route Groups (URL-Independent Organization)

Routes are organized by feature using parentheses syntax, which groups routes logically without affecting URLs:

```
app/
├── (auth)/         # Auth routes: /sign-in, /sign-up, /forgot-password
├── (default)/      # Protected routes requiring auth
│   ├── dashboard/  # /dashboard
│   ├── profile/    # /profile
│   ├── stash/      # /stash (main file management UI)
│   └── (settings)/
│       └── settings/
│           ├── general/   # /settings/general
│           └── security/  # /settings/security
├── layout.tsx      # Root layout with provider composition
└── page.tsx        # Home page
```

**Why this matters:** The `(groupName)` syntax allows feature-based organization without route nesting. Files/folders in PromptStash are managed through modals, not separate routes.

### 3. Provider Composition Pattern

All React contexts are composed in `apps/web/app/providers.tsx`:

```typescript
<QueryClientProvider>
  <ThemeProvider>
    <TooltipProvider>
      <SidebarProvider>
        {children}
      </SidebarProvider>
    </TooltipProvider>
  </ThemeProvider>
</QueryClientProvider>
```

This ensures proper context layering for TanStack Query, dark mode, tooltips, and sidebar state.

### 4. Express Factory Pattern for Testing

`apps/api/src/server.ts` exports `createServer()` instead of a singleton:

```typescript
export const createServer = (): Express => {
  const app = express();
  // ... configure middleware
  return app;
};
```

**Benefits:**

- Multiple server instances for parallel testing
- Dependency injection for middleware
- Separation of creation from startup

### 5. Ordered Middleware Chain

Middleware execution order in Express is critical:

```
1. Request ID       → Tracking
2. Performance      → Monitoring
3. Morgan           → Logging
4. Compression      → gzip/deflate
5. Cookie Parser    → CSRF support
6. Body Parsers     → JSON/URL-encoded
7. Input Sanitizer  → Security
8. Credentials      → CORS setup
9. CORS             → Cross-origin
10. Session Extract → req.user
11. ETag            → Caching
12. CSRF Token      → GET /api/csrf-token
13. Health Checks   → /health/live, /health/ready
14. API Docs        → /api-docs (Swagger)
15. CSRF Protection → State-changing ops
16. Routes          → /api/*
17. 404 Handler
18. CSRF Error      → CSRF failures
19. Error Handler   → Centralized errors
```

**Why order matters:** Credentials must come before CORS. Session extraction must happen before routes. CSRF protection must come after CSRF token endpoint. Error handlers must be last.

### 6. Database Access Layer (Single Source of Truth)

Prisma client is generated and shared from `@workspace/db`:

```typescript
// packages/db/src/client.ts
export { PrismaClient, Prisma } from "../generated/prisma";
export const prisma = new PrismaClient();
```

**Important:**

- Schema: `packages/db/prisma/schema.prisma`
- Generated client: `packages/db/generated/prisma/`
- Shared across Next.js, Express, and background jobs
- Must run `pnpm db:generate` after schema changes

### 7. File Path Auto-Generation

Paths are automatically generated based on file type to match Claude Code conventions:

```typescript
switch (fileType) {
  case "AGENT":
    return `.claude/agents/${name}.md`;
  case "SKILL":
    return `.claude/skills/${name}/SKILL.md`;
  case "COMMAND":
    return `.claude/commands/${name}.sh`;
  case "MCP":
    return `.mcp.json`;
  case "HOOKS":
    return `.claude/hooks.json`;
  case "SESSION":
    return `.docs/sessions/${name}.jsonl`;
  // ...
}
```

**Why this matters:** Users don't need to know Claude Code file conventions - the system enforces them automatically.

### 8. Automatic Versioning with Transactions

Every file content change creates an immutable version:

```typescript
await prisma.$transaction(async (tx) => {
  const updatedFile = await tx.file.update({
    /* ... */
  });

  if (content !== existingFile.content) {
    await tx.fileVersion.create({
      data: {
        fileId,
        content,
        version: (latestVersion?.version || 0) + 1,
        createdBy: userId,
      },
    });
  }
});
```

**Why transactions:** Ensures file and version are updated atomically - no partial updates.

---

## Common Commands

```bash
# Development
pnpm dev              # Start all dev servers (web + api + email)
pnpm build            # Build all apps and packages
pnpm test             # Run all tests
pnpm lint             # Lint monorepo
pnpm format           # Format with Prettier
pnpm check-types      # TypeScript validation

# Database
pnpm db:generate      # Generate Prisma client (required after schema changes)
pnpm db:migrate       # Run migrations
pnpm db:migrate:create # Create new migration
pnpm db:studio        # Open Prisma Studio GUI
pnpm db:seed          # Seed database with sample data
pnpm db:reset         # ⚠️ Reset database (destructive)

# Per-App (using Turborepo filtering)
pnpm --filter @workspace/web dev
pnpm --filter @workspace/api test
pnpm --filter @workspace/db db:generate

# shadcn/ui components
pnpm dlx shadcn@latest add button -c apps/web
# This adds components to packages/ui/src/components/
# Import as: import { Button } from "@workspace/ui/components/button"
```

---

## Environment Configuration

Three `.env` files are required:

**1. `apps/web/.env.local`**

```env
DATABASE_URL=postgresql://promptstash:promptstash123@localhost:5432/promptstash
BETTER_AUTH_SECRET=<32-byte-hex>  # Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
BETTER_AUTH_URL=http://localhost:3100
NEXT_PUBLIC_BASE_URL=http://localhost:3100

# Optional (can skip for local dev)
GOOGLE_CLIENT_ID=<google-oauth-id>
GOOGLE_CLIENT_SECRET=<google-oauth-secret>
RESEND_API_KEY=<resend-key>
UPSTASH_REDIS_REST_URL=<upstash-url>
UPSTASH_REDIS_REST_TOKEN=<upstash-token>
```

**2. `apps/api/.env`**

```env
NODE_ENV=development
PORT=3300
DATABASE_URL=postgresql://promptstash:promptstash123@localhost:5432/promptstash
ALLOWED_ORIGINS=http://localhost:3100

# Must match web app values
BETTER_AUTH_SECRET=<same-as-web>
BETTER_AUTH_URL=http://localhost:3100
```

**3. `packages/db/.env`**

```env
DATABASE_URL=postgresql://promptstash:promptstash123@localhost:5432/promptstash
```

**Critical:** `BETTER_AUTH_SECRET` must be identical in web and API.

---

## Turborepo Task Pipeline

From `turbo.json`:

```
db:generate → ^build → build/lint/check-types
```

**Key behaviors:**

- `build` depends on `db:generate` completing first
- `^build` means "all upstream package builds"
- `dev` depends on `^db:generate` and runs persistently
- Cached outputs: `.next/**`, `dist/**`, `generated/**/*`
- Environment variables tracked: `DATABASE_URL`

**Why this matters:** Running `pnpm build` will automatically generate Prisma client first. Changes to `DATABASE_URL` invalidate cache.

---

## Database Schema (Key Models)

### Authentication

- **User**: Email/password, OAuth accounts, 2FA support
- **Session**: Cookie-based sessions (7-day expiry)
- **Account**: OAuth provider linking
- **Verification**: Email verification tokens
- **TwoFactor**: TOTP secrets and backup codes

### PromptStash

- **Stash**: Top-level container (USER/PROJECT/PLUGIN/MARKETPLACE scopes)
- **Folder**: Hierarchical folders with path caching
- **File**: Individual files (MARKDOWN/JSON/JSONL/YAML)
- **FileVersion**: Immutable version history
- **Tag**: Many-to-many file categorization
- **FileShare**: Share permissions (VIEW/EDIT/COMMENT)

**See @docs/guides/DATABASE_SETUP.md for complete schema documentation.**

---

## Common Workflows

### Adding a New API Endpoint

1. Create route file: `apps/api/src/routes/feature.routes.ts`
2. Register in: `apps/api/src/routes/index.ts`
3. Add tests: `apps/api/src/__tests__/integration/feature.routes.test.ts`
4. Apply middleware as needed (auth, rate limiting)

### Modifying Database Schema

1. Edit: `packages/db/prisma/schema.prisma`
2. Create migration: `pnpm db:migrate:create`
3. Generate client: `pnpm db:generate`
4. Rebuild apps: `pnpm build`

### Adding a New Page in Next.js

1. Create: `apps/web/app/(group)/page-name/page.tsx`
2. Optional: `apps/web/app/(group)/page-name/layout.tsx`
3. Use route groups `(groupName)` for organization without URL changes

### Adding a Shared Package

1. Create: `packages/new-package/`
2. Add `package.json`: `"name": "@workspace/new-package"`
3. Auto-included via `pnpm-workspace.yaml` (uses `packages/*` glob)
4. Import: `import { thing } from "@workspace/new-package"`
5. Add to Turborepo pipeline if it needs building

---

## Critical Configuration Notes

### Next.js Turbopack

Development uses Turbopack for faster HMR:

```json
"dev": "next dev --turbopack"
```

If you encounter issues: `pnpm --filter @workspace/web dev -- --no-turbopack`

### Next.js Standalone Output

Configured in `next.config.mjs`:

```javascript
output: "standalone";
```

Creates minimal production build with bundled dependencies for Docker deployment.

### Package Transpilation

`next.config.mjs` transpiles workspace packages:

```javascript
transpilePackages: ["@workspace/ui", "@workspace/auth", "@workspace/email"];
```

Required for Next.js to process shared packages correctly.

### CORS Configuration

Update `apps/api/src/config/allowedOrigins.ts` when deploying:

```typescript
const allowedOrigins = ["http://localhost:3100", "https://yourdomain.com"];
```

### Port Selection

- **Web**: 3100 (not 3000 - commonly in use)
- **API**: 3300 (consistent spacing for memorability)
- **DB**: 5432 (PostgreSQL default)

---

## File Validation System

The `@workspace/utils` package validates Claude Code file formats:

```typescript
import {
  validateAgentFile,
  validateSkillFile,
  validateMCPFile,
  validateHooksConfig,
} from "@workspace/utils";

const result = validateAgentFile(content, filename);
if (!result.valid) {
  console.error(result.errors);
}
```

**Validators:**

- `validateAgentFile()`: Agent markdown files
- `validateSkillFile()`: Skill markdown files
- `validateMCPFile()`: MCP JSON configurations
- `validateHooksConfig()`: Hooks JSON configurations
- `validateHookOutput()`: Hook output validation

---

## Testing

Tests are organized within each app:

```
apps/api/src/__tests__/
├── unit/                # Unit tests
│   └── server.test.ts
└── integration/         # Integration tests
    └── user.routes.test.ts
```

```bash
pnpm test                # All tests
pnpm --filter @workspace/api test  # Specific app
pnpm test:watch          # Watch mode
```

- **Jest**: Testing framework with ts-jest
- **Supertest**: HTTP endpoint testing
- **Coverage**: Reports in `coverage/` directory

---

## CI/CD Pipeline

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR:

**Parallel jobs:**

1. `lint`: ESLint validation
2. `type-check`: TypeScript validation
3. `test`: Jest tests with coverage
4. `build`: Production build
5. `format-check`: Prettier validation

**Optimizations:**

- pnpm cache via GitHub Actions
- Node 20 with pnpm 10.4.1
- 5-15 minute job timeouts

---

## Rate Limiting

Uses Upstash Redis with `@upstash/ratelimit`:

**Global API limit** (`apps/api/src/middleware/rate-limit.ts`):

- 100 requests/minute per IP
- Applied to all `/api/*` routes
- Sliding window algorithm

**Auth-specific limits** (`packages/rate-limit/src/auth.ts`):

- Separate limits for sensitive endpoints
- Used in Better Auth configuration

**Required env vars:**

```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

---

## Authentication Flows

### Email/Password Sign Up

1. User provides email/password
2. Verification email sent with code
3. User verifies email to activate account

### OAuth (Google)

1. Redirect to Google OAuth
2. Better Auth handles callback
3. Creates or links account

### Two-Factor Authentication

1. User enables 2FA in settings
2. QR code generated for TOTP app
3. Backup codes provided for recovery
4. Required on subsequent sign-ins

### Password Reset

1. User requests reset
2. Email sent with reset token
3. User creates new password

**Protected routes:** All routes in `apps/web/app/(default)/` require authentication. Unauthorized users redirected to `/sign-in`.

---

## Docker Deployment

Multi-stage builds for production:

1. **base**: Node.js 22 Alpine
2. **builder**: Install pnpm + Turbo, prune workspace
3. **installer**: Install deps, generate Prisma client, build
4. **runner**: Production image with non-root user

```bash
pnpm docker:prod
# Starts:
# - web: http://localhost:3000
# - api: http://localhost:3300
# - postgres: localhost:5432
```

**Security features:**

- Non-root users (`nextjs:1001`, `expressjs:1001`)
- Alpine Linux minimal base
- Only production dependencies in final image

---

## API Documentation

Complete API reference: @docs/reference/API.md

**Main routes:**

- `/api/users` - User session management
- `/api/stashes` - Stash CRUD operations
- `/api/files` - File CRUD and versioning
- `/api/folders` - Folder management
- `/api/validate` - File validation endpoints (public)

**Live API docs:** http://localhost:3300/api-docs (Swagger UI)

---

## Further Reading

- **@docs/guides/QUICKSTART.md** - Detailed setup instructions
- **@docs/guides/DEMO.md** - Working demo walkthrough
- **@docs/reference/API.md** - Complete API documentation
- **@docs/guides/DATABASE_SETUP.md** - Database setup and management
- **@docs/architecture/** - Architecture decision records

---

## Catalog-Based Dependencies

This monorepo uses pnpm catalogs for version management. See `pnpm-workspace.yaml` for version definitions:

- `catalog:web` - React 19, Next.js 16, TanStack Query, shadcn/ui
- `catalog:server` - Express 5, CORS, Helmet, Morgan
- `catalog:core` - Turbo, Zod, Prisma, Upstash
- `catalog:dev` - TypeScript, Jest, Testing Library, Playwright
- `catalog:eslint` - ESLint 9 with flat config
- `catalog:prettier` - Prettier with plugins

This ensures consistent versions across all packages while allowing per-package overrides when needed.
