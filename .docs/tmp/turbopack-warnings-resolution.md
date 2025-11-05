# Turbopack Warnings Resolution - Next.js 16 pnpm Monorepo

**Date:** 2025-11-03  
**Issue:** Multiple warnings and errors when running `pnpm dev` with Next.js 16 Turbopack

---

## Issues Fixed

### 1. Thread-Stream Worker Module Error ✅

**Error:**

```
Error: Cannot find module '/ROOT/node_modules/.pnpm/thread-stream@3.1.0/node_modules/thread-stream/lib/worker.js'
Error: the worker thread exited
```

**Root Cause:**

- Known Turbopack issue (#84766) - doesn't trace worker thread dependencies correctly
- Pino logger uses thread-stream with worker threads
- In pnpm monorepo, thread-stream only installed in `packages/observability/node_modules`
- Turbopack requires externalized packages to be resolvable from project root

**Investigation:**

```bash
# Verified file exists
find node_modules/.pnpm -name "worker.js" -path "*thread-stream*"
# Output: node_modules/.pnpm/thread-stream@3.1.0/node_modules/thread-stream/lib/worker.js

# Confirmed observability not imported in web app
rg "@workspace/observability" packages/ui packages/auth packages/email apps/web
# Only found in: apps/web/next.config.mjs (serverExternalPackages)
```

**Solution:**
Created `.npmrc` with pnpm hoisting patterns:

```ini
# Force hoist pino dependencies to root
public-hoist-pattern[]=*pino*
public-hoist-pattern[]=*thread-stream*
public-hoist-pattern[]=*real-require*
```

**Verification:**

```bash
ls node_modules/ | grep -E "pino|thread-stream"
# Output shows packages now at root level
```

**Files Modified:**

- `.npmrc` (new file)

---

### 2. Prettier Version Conflict ✅

**Warning:**

```
Package prettier can't be external
The package resolves to a different version when requested from the project directory (3.6.2)
compared to the package requested from the importing module (3.5.3).
```

**Root Cause:**

- `@react-email/render@1.0.6` has hard dependency on `prettier@3.5.3`
- Workspace catalog manages `prettier@3.6.2`
- Turbopack detects version mismatch when trying to externalize

**Investigation:**

```bash
# Found version conflict in lockfile
grep -A5 "@react-email/render@1.0.6" pnpm-lock.yaml | head -20
# Shows: prettier: 3.5.3

# Workspace catalog has
grep "prettier:" pnpm-workspace.yaml
# Shows: prettier: ^3.6.2
```

**Solution:**
Added pnpm override in `package.json`:

```json
"pnpm": {
  "overrides": {
    "prettier": "catalog:prettier"
  }
}
```

Forces all prettier instances to use 3.6.2 (compatible - minor version bump).

**Files Modified:**

- `package.json` (root)

---

### 3. Database Connection Error ✅

**Error:**

```
Can't reach database server at `localhost:5432`
```

**Root Cause:**
Database port mismatch - actual container on port 3500, configs had 5432 or 5434

**Investigation:**

```bash
docker ps -a | grep -i postgres
# Output showed: 0.0.0.0:3500->5432/tcp  promptstash-postgres-dev
```

**Solution:**
Updated DATABASE_URL in:

- `apps/web/.env.local`
- `apps/api/.env`
- `packages/db/.env`

Changed: `localhost:5434` → `localhost:3500`

**Files Modified:**

- `apps/web/.env.local`
- `apps/api/.env`
- `packages/db/.env`

---

### 4. Missing ScrollArea Component ✅

**Error:**

```
Export ScrollArea doesn't exist in target module
```

**Root Cause:**
`apps/web/components/keyboard-shortcuts-modal.tsx` imports ScrollArea from `@workspace/ui`, but component didn't exist.

**Investigation:**

```bash
# Confirmed missing
grep "ScrollArea" packages/ui/src/index.ts
# No output

# Found usage
rg "ScrollArea" apps/web/components/
# keyboard-shortcuts-modal.tsx:10:  ScrollArea,
```

**Solution:**
Created shadcn/ui ScrollArea component:

- `packages/ui/src/components/scroll-area.tsx` (new)
- Added export to `packages/ui/src/index.ts`
- Installed peer dependency: `pnpm add @radix-ui/react-scroll-area --filter @workspace/ui`

**Files Modified:**

- `packages/ui/src/components/scroll-area.tsx` (new)
- `packages/ui/src/index.ts`

---

### 5. Cross-Origin Request Warning ✅

**Warning:**

```
Blocked cross-origin request from promptstash.tootie.tv to /_next/* resource
```

**Root Cause:**
Custom domain configured but not in Next.js allowedDevOrigins

**Solution:**
Added to `apps/web/next.config.mjs`:

```javascript
allowedDevOrigins: ["https://promptstash.tootie.tv"];
```

**Files Modified:**

- `apps/web/next.config.mjs`

---

### 6. MetadataBase Warning ✅

**Warning:**

```
metadataBase property in metadata export is not set
```

**Solution:**
Added to `apps/web/config/site.ts`:

```javascript
export const siteConfig: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3100'),
  // ... rest of config
}
```

**Files Modified:**

- `apps/web/config/site.ts`

---

### 7. StatisticsSection Runtime Error ✅

**Error:**

```
Cannot read properties of undefined (reading 'toString')
components/sidebar/StatisticsSection.tsx (21:14)
```

**Root Cause:**
Stale Next.js build cache. Component didn't exist in codebase but was cached.

**Investigation:**

```bash
# Searched for component
find . -name "*.tsx" | xargs grep -l "StatisticsSection"
# No results (excluding node_modules)

# Stack trace showed non-existent files:
# - components/layout/LeftSidebar.tsx
# - components/layout/ClientLayout.tsx
```

**Solution:**
Cleared Next.js caches:

```bash
rm -rf apps/web/.next apps/web/.turbo apps/web/node_modules/.cache
```

---

## Research Sources

Dispatched 3 parallel research agents via `research-specialist`:

1. **Next.js 16 Turbopack + thread-stream issue**
   - Found: GitHub Issue #84766 (known bug)
   - Confirmed: Turbopack doesn't trace worker thread dependencies
   - Solution: pnpm hoisting patterns

2. **Turbopack prettier @react-email conflict**
   - Found: GitHub Issue #2426 (react-email)
   - Confirmed: @react-email/render will remove prettier dependency
   - Solution: pnpm overrides for version unification

3. **Turbopack monorepo workspace packages**
   - Confirmed: serverExternalPackages must be resolvable from project root
   - Clarified: transpilePackages vs serverExternalPackages behavior
   - Verified: observability not imported (only in config)

---

## Final Configuration

### `/home/jmagar/code/promptstash/.npmrc` (new)

```ini
public-hoist-pattern[]=*pino*
public-hoist-pattern[]=*thread-stream*
public-hoist-pattern[]=*real-require*
```

### `/home/jmagar/code/promptstash/package.json`

```json
{
  "pnpm": {
    "overrides": {
      "prettier": "catalog:prettier"
    }
  }
}
```

### `/home/jmagar/code/promptstash/apps/web/next.config.mjs`

```javascript
{
  serverExternalPackages: [
    'pino',
    'pino-pretty',
    'thread-stream',
    '@workspace/observability',
  ],
  allowedDevOrigins: ['https://promptstash.tootie.tv'],
}
```

---

## Verification Commands

```bash
# No warnings in dev server logs
pnpm dev 2>&1 | grep -E "(thread-stream|prettier.*can't|metadataBase|Cross origin)"
# Output: (empty - no warnings)

# Packages hoisted correctly
ls node_modules/ | grep -E "pino|thread-stream"
# Output: pino, pino-pretty, thread-stream, etc.

# All services running
pnpm dev
# Web: http://localhost:3100 ✓
# API: http://localhost:3300 ✓
# Email: http://localhost:3200 ✓
# Studio: http://localhost:3400 ✓
```

---

## Key Learnings

1. **Turbopack Strictness**: More strict than Webpack about dependency resolution
2. **pnpm Monorepo**: External packages must be hoisted for Turbopack worker thread compatibility
3. **Cache Issues**: Always clear `.next` cache when encountering phantom errors
4. **Research Value**: GitHub issues provided exact solutions (84766, 2426, 68805)
5. **Version Conflicts**: pnpm overrides with catalog references work perfectly

---

## Status: ✅ All Issues Resolved

Development environment fully operational with Next.js 16 Turbopack enabled.
