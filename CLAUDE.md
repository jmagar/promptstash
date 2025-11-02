# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**build-elevate** is a production-ready, full-stack TypeScript monorepo template for building modern SaaS applications. It combines Next.js 16 (with React 19) for the frontend and Express v5 for the backend API, featuring complete authentication, database integration, email services, and Docker deployment support.

## Technology Stack

### Core Frameworks
- **Next.js 16.0.0** with App Router and Turbopack (port 3000)
- **React 19.2.0** with modern hooks and Server Components
- **Express 5.1.0** API server (port 4000)
- **TypeScript 5.9.2** with strict type checking throughout

### Build System
- **Turborepo 2.5.5**: Monorepo orchestration with intelligent caching
- **pnpm 10.4.1**: Package manager with workspace support and catalog feature
- **Node.js ≥20**: Required minimum version

### Database & ORM
- **PostgreSQL**: Primary database (port 5432)
- **Prisma 6.16.1**: ORM with migrations and client generation
  - Binary targets include: `native`, `linux-musl`, `linux-musl-openssl-3.0.x` for Docker support

### Authentication
- **Better Auth 1.3.27**: Modern authentication framework
- OAuth providers: Google Sign-In
- Two-factor authentication (2FA) with QR codes and backup codes
- Email verification and password reset flows

### UI & Styling
- **Tailwind CSS 4.1.11**: Utility-first styling
- **shadcn/ui**: Component library built on Radix UI primitives
- **next-themes 0.4.6**: Dark mode support
- **Lucide React 0.475.0**: Icon library

### Additional Services
- **TanStack Query 5.87.4**: Server state management
- **React Hook Form 7.62.0** + **Zod 3.25.76**: Form handling and validation
- **React Email 4.3.0** + **Resend 4.5.1**: Email templates and delivery
- **Upstash Rate Limit 2.0.6**: API rate limiting with Redis

## Monorepo Architecture

### Directory Structure

```
/
├── apps/                      # Deployable applications
│   ├── web/                   # Next.js web app (port 3000)
│   ├── api/                   # Express API server (port 4000)
│   ├── email/                 # React Email preview server
│   └── studio/                # Prisma Studio
├── packages/                  # Shared libraries
│   ├── auth/                  # Authentication logic (Better Auth)
│   ├── db/                    # Database layer (Prisma)
│   ├── email/                 # Email templates and sender
│   ├── rate-limit/            # Rate limiting utilities
│   ├── ui/                    # Shared UI components
│   ├── utils/                 # Common utilities and types
│   ├── eslint-config/         # ESLint configurations
│   ├── prettier-config/       # Prettier config
│   ├── typescript-config/     # TypeScript base configs
│   └── jest-presets/          # Jest configurations
└── docker-compose.prod.yml    # Production Docker Compose
```

### Workspace Dependencies

Internal packages use the `workspace:*` protocol. Packages are referenced as:
```typescript
import { Button } from "@workspace/ui/components/button";
import { db } from "@workspace/db";
import { auth } from "@workspace/auth";
```

### pnpm Catalog Pattern

This monorepo uses pnpm's catalog feature for centralized dependency management across workspaces:
- `catalog:web`: Frontend-specific dependencies
- `catalog:server`: Backend-specific dependencies
- `catalog:core`: Shared dependencies
- `catalog:dev`: Development tools
- `catalog:eslint`: ESLint plugins
- `catalog:prettier`: Prettier plugins

## Key Architectural Patterns

### 1. Next.js Route Organization

The web app uses **route groups** for logical organization without affecting URLs:

```
app/
├── (auth)/              # Authentication routes (grouped)
│   ├── sign-in/
│   ├── sign-up/
│   ├── forgot-password/
│   ├── reset-password/
│   └── two-factor/
├── (default)/           # Protected routes (grouped)
│   ├── dashboard/
│   ├── profile/
│   └── (settings)/
│       └── settings/
│           ├── general/
│           └── security/
├── layout.tsx           # Root layout with providers
└── page.tsx             # Home page
```

**Important**: Routes are organized by feature, not by visibility. The `(groupName)` syntax creates logical groupings without affecting the URL structure.

### 2. Provider Pattern

All React context providers are composed in `apps/web/app/providers.tsx`:
- `ThemeProvider`: Dark mode support
- `QueryClientProvider`: TanStack Query for server state
- `SidebarProvider`: Sidebar state management
- `TooltipProvider`: Global tooltip context

### 3. Express Middleware Stack

The API server uses a carefully ordered middleware chain in `apps/api/src/server.ts`:

1. **Helmet**: Security headers
2. **Morgan**: HTTP request logging
3. **Body parsers**: JSON and URL-encoded
4. **Credentials**: CORS credential handling
5. **CORS**: Cross-origin resource sharing
6. **Global rate limiting**: Applied to all `/api` routes
7. **Routes**: Application endpoints
8. **Error handler**: Centralized error handling

### 4. Shared Authentication

The `@workspace/auth` package exports different interfaces for different environments:

```typescript
// Client-side (React hooks)
import { useSession } from "@workspace/auth/client";

// Server-side Next.js (API routes, Server Components)
import { auth } from "@workspace/auth/server";

// Express middleware
import { authMiddleware } from "@workspace/auth/node-handlers";
```

### 5. Factory Pattern for Server Creation

The Express server uses a factory function (`createServer()`) in `apps/api/src/server.ts` that:
- Enables easy testing with multiple server instances
- Separates server creation from server startup
- Allows dependency injection for middleware

### 6. Database Access Layer

Prisma client is centralized in `@workspace/db`:
- Schema: `packages/db/prisma/schema.prisma`
- Generated client: `packages/db/generated/`
- Single source of truth for all database operations
- Shared across Next.js and Express applications

## Build & Development Commands

### Root-Level Commands (pnpm)

```bash
pnpm install          # Install all dependencies
pnpm dev              # Start all dev servers (web, api, email)
pnpm build            # Build all apps and packages
pnpm lint             # Lint entire monorepo
pnpm format           # Format code with Prettier
pnpm check-types      # TypeScript type checking
pnpm test             # Run all tests
pnpm clean            # Clear Turborepo cache
pnpm docker:prod      # Build and run production Docker containers
```

### Database Commands

Navigate to `packages/db/` or use Turborepo:

```bash
# Generate Prisma client (required before first build)
pnpm --filter @workspace/db db:generate

# Run migrations
pnpm --filter @workspace/db db:migrate

# Create a new migration
pnpm --filter @workspace/db db:migrate:create

# Open Prisma Studio
pnpm --filter @workspace/db db:studio

# Reset database (⚠️ destructive)
pnpm --filter @workspace/db db:reset
```

**Important**: The `DATABASE_URL` environment variable must be set in both:
1. `apps/web/.env.local` (for Next.js)
2. `packages/db/.env` (for Prisma CLI)

### Adding UI Components (shadcn/ui)

Run from the monorepo root:

```bash
# Add a component to the UI package
pnpm dlx shadcn@latest add button -c apps/web

# This places components in: packages/ui/src/components/
# Components are then imported as: @workspace/ui/components/button
```

### Per-App Commands

```bash
# Web app (Next.js)
pnpm --filter @workspace/web dev     # Development server (port 3000)
pnpm --filter @workspace/web build   # Production build
pnpm --filter @workspace/web start   # Start production server

# API server (Express)
pnpm --filter @workspace/api dev     # Development server (port 4000)
pnpm --filter @workspace/api build   # Build TypeScript to dist/
pnpm --filter @workspace/api start   # Start production server
pnpm --filter @workspace/api test    # Run Jest tests with coverage
```

## Environment Configuration

### Required Environment Variables

**Web App** (`apps/web/.env.local`):
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# Better Auth
BETTER_AUTH_SECRET=<random-32-byte-hex>
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# Email (Resend)
RESEND_API_KEY=<your-resend-api-key>
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=<your-upstash-url>
UPSTASH_REDIS_REST_TOKEN=<your-upstash-token>

# Next.js
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
```

**API Server** (`apps/api/.env`):
```env
NODE_ENV=development
PORT=4000
ALLOWED_ORIGINS=http://localhost:3000

# Better Auth (same as web app)
BETTER_AUTH_SECRET=<same-as-web-app>
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<same-as-web-app>
GOOGLE_CLIENT_SECRET=<same-as-web-app>
```

**Database Package** (`packages/db/.env`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
```

### Generating Secrets

```bash
# Generate BETTER_AUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Testing

### Test Organization

Tests are organized within each application:

```
apps/api/src/__tests__/
├── unit/                 # Unit tests
│   ├── server.test.ts
│   └── rate-limit.test.ts
└── integration/          # Integration tests
    └── user.routes.test.ts
```

### Running Tests

```bash
# Run all tests in monorepo
pnpm test

# Run tests for specific app with coverage
pnpm --filter @workspace/api test

# Run tests in watch mode (if configured)
pnpm --filter @workspace/api test -- --watch
```

### Test Configuration

- **Jest preset**: `packages/jest-presets/node/jest-preset.js`
- **ts-jest**: Compiles TypeScript on the fly
- **Supertest**: HTTP endpoint testing
- **Coverage**: Reports stored in `coverage/` directory

## Turborepo Task Pipeline

From `turbo.json`, the task dependency graph:

```
db:generate → ^build → build/lint/check-types
```

**Key behaviors**:
- `build` depends on `db:generate` and all upstream package builds (`^build`)
- `dev` depends on `^db:generate` and runs persistently
- Outputs are cached: `.next/**`, `dist/**`, `generated/**/*`
- Environment variables tracked: `DATABASE_URL`

## Docker Deployment

### Multi-Stage Build Architecture

Both `apps/web/Dockerfile.prod` and `apps/api/Dockerfile.prod` use multi-stage builds:

1. **base**: Node.js 22 Alpine
2. **builder**: Install pnpm, Turborepo, prune workspace
3. **installer**: Install dependencies, generate Prisma client, build app
4. **runner**: Production image with non-root user

**Security features**:
- Non-root users (`nextjs:1001`, `expressjs:1001`)
- Alpine Linux base for minimal attack surface
- Only production dependencies in final image

### Docker Compose

```bash
# Build and start all services
pnpm docker:prod

# This starts:
# - web: http://localhost:3000
# - api: http://localhost:4000
# - postgres: localhost:5432
```

**Network**: Custom bridge network `app_network` enables service-to-service communication by container name.

**Volumes**: `build-elevate-app_postgres_data` for database persistence.

**Health checks**: PostgreSQL container includes health check for database readiness.

### Production Environment Files

Ensure these exist before running `pnpm docker:prod`:
- `apps/web/.env.production`
- `apps/api/.env.production`
- `packages/db/.env`

## Prisma Schema Key Models

### User Model
- Email/password authentication with hashing
- Email verification status
- Image URL for profile picture
- Created/updated timestamps

### Session Model
- User relationship (one-to-many)
- Token and expiration
- IP address and user agent tracking

### Account Model
- OAuth provider integration
- Links social accounts to users

### Verification Model
- Email verification codes
- Password reset tokens
- Expiration handling

### TwoFactor Model
- TOTP secrets
- Backup codes (hashed)
- User relationship

## Code Quality & Linting

### ESLint (v9 with Flat Config)

Base configuration in `packages/eslint-config/base.js`:
- TypeScript ESLint parser and recommended rules
- `only-warn` plugin converts all errors to warnings
- Separate configs for React and Next.js apps

**Running lint**:
```bash
pnpm lint              # Lint entire monorepo
pnpm lint --fix        # Auto-fix issues
```

### Prettier

Configuration in `packages/prettier-config/index.js`:
- Single quotes
- 100 character line width
- Trailing commas (ES5)
- Tab width: 2 spaces

**Plugins**:
- `prettier-plugin-organize-imports`: Auto-sort imports
- `prettier-plugin-tailwindcss`: Sort Tailwind classes
- `prettier-plugin-packagejson`: Format package.json

**Running format**:
```bash
pnpm format            # Format entire monorepo
```

### TypeScript Configuration

Base config in `packages/typescript-config/base.json`:
- Strict mode enabled
- Modern module resolution (`NodeNext`)
- `esModuleInterop` and `skipLibCheck` enabled
- Target: `ES2022`

Apps and packages extend the base config:
```json
{
  "extends": "@workspace/typescript-config/base.json"
}
```

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push and PR:

**Jobs** (run in parallel):
1. **lint**: ESLint check across monorepo
2. **type-check**: TypeScript type validation
3. **test**: Jest tests with coverage
4. **build**: Full production build
5. **format-check**: Prettier formatting validation

**Optimizations**:
- pnpm cache using GitHub Actions cache
- Node 20 with pnpm 10.4.1
- Timeouts: 5-15 minutes per job

## Rate Limiting Architecture

### Implementation

Rate limiting uses Upstash Redis with the `@upstash/ratelimit` package:

**Global API rate limit** (`apps/api/src/middleware/rate-limit.ts`):
- Applied to all `/api/*` routes
- Uses IP address as identifier
- Configured in middleware chain before routes

**Auth-specific limits** (`packages/rate-limit/src/auth.ts`):
- Separate rate limiters for sensitive authentication endpoints
- Used in Better Auth configuration

### Upstash Redis

Requires environment variables:
```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

## Authentication Architecture

### Better Auth Configuration

Configuration is in `packages/auth/src/server.ts`:

**Plugins enabled**:
- Generic OAuth (Google)
- Two-factor authentication
- Organization/multi-tenancy (prepared)

**Session management**:
- Cookie-based sessions
- Expires: 7 days
- Update age: 1 day

**Email integration**:
- Uses `@workspace/email` for sending verification and password reset emails
- Resend as email delivery service

### Authentication Flows

1. **Email/Password Sign Up**:
   - User provides email and password
   - Verification email sent with code
   - User verifies email to activate account

2. **OAuth (Google)**:
   - Redirect to Google OAuth
   - Better Auth handles callback
   - Creates or links account

3. **Two-Factor Authentication**:
   - User enables 2FA in settings
   - QR code generated for TOTP app
   - Backup codes provided for recovery
   - Required on subsequent sign-ins

4. **Password Reset**:
   - User requests reset
   - Email sent with reset token
   - User creates new password

### Protected Routes

In `apps/web/app/(default)/`, routes are protected by Better Auth middleware. Unauthorized users are redirected to `/sign-in`.

## Email System

### React Email Templates

Templates in `packages/email/src/templates/`:
- Built with React components
- Preview server at `apps/email/` for development
- Compiled to HTML for delivery

### Sending Emails

Using `@workspace/email`:

```typescript
import { sendEmail } from "@workspace/email/send-email";

await sendEmail({
  to: "user@example.com",
  subject: "Welcome!",
  templateId: "welcome",
  templateData: { name: "John" }
});
```

### Email Service

**Resend** is used for email delivery:
- Requires `RESEND_API_KEY` in environment
- From address: `RESEND_FROM_EMAIL`

## Common Workflows

### Adding a New Shared Package

1. Create directory: `packages/new-package/`
2. Add `package.json` with `"name": "@workspace/new-package"`
3. Add to `pnpm-workspace.yaml` (automatic with `packages/*`)
4. Import in apps: `import { thing } from "@workspace/new-package"`
5. Add to Turborepo pipeline if it needs building

### Adding a New API Endpoint

1. Create route handler in `apps/api/src/routes/`
2. Register route in `apps/api/src/routes/index.ts`
3. Apply middleware as needed (auth, rate limiting)
4. Add tests in `apps/api/src/__tests__/`

### Modifying Database Schema

1. Edit `packages/db/prisma/schema.prisma`
2. Create migration: `pnpm --filter @workspace/db db:migrate:create`
3. Generate client: `pnpm --filter @workspace/db db:generate`
4. Rebuild apps that depend on `@workspace/db`

### Adding a New Page in Next.js

1. Create route directory in `apps/web/app/`
2. Add `page.tsx` for the route component
3. Optionally add `layout.tsx` for nested layout
4. Use route groups `(groupName)` for organization without URL changes

## Important Notes

### Next.js Turbopack

The web app uses Turbopack in development:
```json
"dev": "next dev --turbopack"
```

This provides faster HMR and build times. If you encounter issues, fallback to webpack:
```bash
pnpm --filter @workspace/web dev -- --no-turbopack
```

### Standalone Output Mode

Next.js is configured for standalone output in `next.config.mjs`:
```javascript
output: 'standalone'
```

This creates a minimal production build for Docker deployment with all dependencies bundled.

### Package Transpilation

The web app transpiles workspace packages in `next.config.mjs`:
```javascript
transpilePackages: ['@workspace/ui', '@workspace/auth', '@workspace/email']
```

This ensures shared packages work correctly in the Next.js build.

### Better Auth Client/Server Split

Never use server-side auth functions in client components:
```typescript
// ❌ Don't do this in a Client Component
import { auth } from "@workspace/auth/server";

// ✅ Use client hooks instead
import { useSession } from "@workspace/auth/client";
```

### Port Configuration

- **Web**: 3000 (configurable via `NEXT_PUBLIC_BASE_URL`)
- **API**: 4000 (configurable via `PORT` in `apps/api/.env`)
- **Database**: 5432 (standard PostgreSQL)
- **Prisma Studio**: 5555

### CORS Configuration

The API server allows requests from origins specified in `apps/api/src/config/allowedOrigins.ts`:
```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'https://yourdomain.com'
];
```

Update this list when deploying to production or adding new frontends.
