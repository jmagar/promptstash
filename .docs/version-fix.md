# Version Mismatch Fix - Zod

**Date:** 2025-11-02

## Issue

The web app had a zod version mismatch:
- **apps/web/package.json:** `zod: ^4.1.12` (manually added)
- **pnpm-workspace.yaml catalog:** `zod: ^3.25.76`

This caused dependency conflicts and potential runtime issues.

## Root Cause

When zod was added to the web app during Session 2, it was added with version `^4.1.12` instead of using the catalog reference.

## Fix

Changed in `apps/web/package.json`:

```diff
- "zod": "^4.1.12"
+ "zod": "catalog:core"
```

## Verification

```bash
cd /home/jmagar/code/promptstash
pnpm install
pnpm --filter web list zod

# Should show: zod 3.25.76
```

## Impact

- ✅ Consistent zod version across workspace
- ✅ No more version conflicts
- ✅ Better compatibility with other packages using zod

## Prevention

Always use catalog references when adding dependencies:

```json
{
  "dependencies": {
    "zod": "catalog:core",  // ✅ Good - uses catalog
    "zod": "^4.1.12"        // ❌ Bad - hardcoded version
  }
}
```

## Related Files

- `apps/web/package.json` - Fixed
- `pnpm-workspace.yaml` - Catalog definition
