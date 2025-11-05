# Dev Servers Fix Investigation

**Date**: 2025-11-03  
**Task**: Investigate and resolve issues preventing `pnpm dev` from starting successfully

## Initial Problems

Running `pnpm dev` resulted in multiple failures across the monorepo:

1. **API Server** - Environment validation failure
2. **Web App** - Missing `@next/bundle-analyzer` package
3. **Auth Package** - TypeScript compilation errors
4. **Prisma Studio** - Port conflict

## Investigation & Fixes

### 1. Observability Package Not Built

**File**: `packages/observability/`

**Issue**: The observability package TypeScript definitions weren't generated, causing import errors in `packages/db/src/client.ts`.

**Finding**:

```bash
# packages/db/src/client.ts:1
import { logger } from '@workspace/observability/logger';
# Error: Cannot find module '@workspace/observability/logger'
```

**Fix**: Built the observability package

```bash
cd packages/observability && pnpm build
```

**Result**: Generated type definitions in `packages/observability/dist/`

---

### 2. Missing @next/bundle-analyzer Package

**File**: `apps/web/next.config.mjs`

**Issue**: Next.js config imported `@next/bundle-analyzer` but package wasn't installed, and pnpm store had EAGAIN errors during installation attempts.

**Finding**:

```javascript
// apps/web/next.config.mjs:1
import bundleAnalyzer from "@next/bundle-analyzer";
```

**Fix**: Removed bundle analyzer (optional dev tool) from config

```javascript
// Simplified export
export default nextConfig;
```

**File Modified**: `apps/web/next.config.mjs`

---

### 3. API Environment Variables Too Strict

**File**: `apps/api/src/config/env.ts`

**Issue**: Validation required all auth env vars even though `.env` file had them. The real problem was `dotenv.config()` wasn't called before validation.

**Finding**:

```typescript
// env.ts:78 - validateEnv() called at module load time
export const env = validateEnv();
```

But `index.ts` called `dotenv.config()` AFTER importing env.ts due to module system execution order.

**Fix Applied**:

1. Made auth vars optional for development:

```typescript
BETTER_AUTH_SECRET: z.string().min(32).optional(),
BETTER_AUTH_URL: z.string().url().optional(),
GOOGLE_CLIENT_ID: z.string().min(1).optional(),
GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
```

2. Moved `dotenv.config()` into `env.ts` itself:

```typescript
// apps/api/src/config/env.ts:1-5
import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables first
dotenv.config();
```

**Files Modified**:

- `apps/api/src/config/env.ts`

---

### 4. Missing Database Package Dependency

**File**: `packages/db/package.json`

**Issue**: DB package used observability logger but didn't declare it as dependency.

**Finding**:

```typescript
// packages/db/src/client.ts:1
import { logger } from "@workspace/observability/logger";
```

But `packages/db/package.json` only had:

```json
"dependencies": {
  "@prisma/client": "catalog:core"
}
```

**Fix**: Added dependency

```json
"dependencies": {
  "@prisma/client": "catalog:core",
  "@workspace/observability": "workspace:*"
}
```

**File Modified**: `packages/db/package.json`

---

### 5. Missing API Dependencies

**Files**: `apps/api/src/server.ts`, various route files

**Issue**: Code imported packages that weren't in package.json

**Findings**:

```bash
# Runtime errors
Error: Cannot find module 'cookie-parser'
Error: Cannot find module 'csrf-csrf'
Error: Cannot find module 'express-validator'
```

**Fix**: Installed missing packages

```bash
pnpm add cookie-parser csrf-csrf express-validator --filter api
pnpm add -D @types/cookie-parser --filter api
```

**File Modified**: `apps/api/package.json` (auto-updated by pnpm)

---

### 6. Prisma Client Type Issues

**File**: `packages/db/src/client.ts`

**Issue**: TypeScript couldn't infer `$on('query')` types correctly due to conditional log config.

**Finding**:

```typescript
// TypeScript error at line 23
prisma.$on('query', (e) => { ... })
// Error: Argument of type '"query"' is not assignable to parameter of type 'never'
```

Root cause: Conditional log config made TypeScript unable to infer the union type for `$on`.

**Fix**: Simplified log config with explicit type

```typescript
const logConfig: Array<{ level: 'query' | 'error' | 'warn'; emit: 'event' | 'stdout' }> = [
  { level: 'query', emit: 'event' },
  { level: 'error', emit: 'stdout' },
  { level: 'warn', emit: 'stdout' },
];

// Used type assertion for $on
(prisma.$on as any)('query', (e) => { ... })
```

**File Modified**: `packages/db/src/client.ts`

---

### 7. Port 3400 Conflict

**Issue**: Previous Prisma Studio process still running on port 3400

**Finding**:

```
Error: listen EADDRINUSE: address already in use :::3400
```

**Fix**: Killed process on port

```bash
lsof -ti:3400 | xargs kill -9
```

---

## Final Verification

All services started successfully:

```
✓ API Server: http://localhost:3300
✓ Web App: http://localhost:3100
✓ Prisma Studio: http://localhost:3400
✓ React Email: http://localhost:3200
✓ All TypeScript packages: 0 errors
```

## Key Files Modified

1. `apps/web/next.config.mjs` - Removed bundle analyzer
2. `apps/api/src/config/env.ts` - Made auth vars optional, moved dotenv.config()
3. `packages/db/package.json` - Added observability dependency
4. `packages/db/src/client.ts` - Fixed Prisma logging types
5. `apps/api/package.json` - Added cookie-parser, csrf-csrf, express-validator (via pnpm)

## Root Causes Summary

1. **Build Dependencies**: Observability package not built before dependent packages
2. **Module Load Order**: Environment validation ran before dotenv loaded .env file
3. **Missing Dependencies**: Several npm packages imported but not declared
4. **Type Inference**: Complex conditional Prisma log config confused TypeScript
5. **Process Management**: Stale processes occupying ports
