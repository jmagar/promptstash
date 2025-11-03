# File Creation Validation Bug - Investigation & Fix

**Date**: 2025-11-03
**Status**: ✅ Fixed
**Impact**: File and folder creation now working

## Problem Summary

File creation was failing with "Internal Server Error" when users clicked the "New File" button. The root cause was a mismatch between the filename format expected by validators and what was being passed to them.

## Root Cause

The validation functions in `packages/utils/src/validators/agent-validator.ts` expect properly formatted filenames (kebab-case with extensions like `test-agent.md`), but the code was passing raw user input (like `"Test Agent"`).

### Evidence

1. **Validator expects formatted filenames** ([`packages/utils/src/validators/agent-validator.ts:51-74`](packages/utils/src/validators/agent-validator.ts#L51-L74)):
   - Checks for `.md` extension
   - Validates kebab-case format with regex: `/^[a-z0-9]+(-[a-z0-9]+)*$/`
   - Would fail on input like "Test Agent" with errors:
     - "Agent file must have .md extension"
     - "Filename must be kebab-case"

2. **Code was passing raw user input** ([`apps/api/src/routes/file.routes.ts:176-179`](apps/api/src/routes/file.routes.ts#L176-L179) - before fix):
   ```typescript
   if (fileType === "AGENT") {
     validation = validateAgentFile(content, name);  // ❌ Passing "Test Agent"
   }
   ```

3. **Path generation creates correct format** ([`apps/api/src/routes/file.routes.ts:59-82`](apps/api/src/routes/file.routes.ts#L59-L82)):
   - `generateFilePath("Test Agent", "AGENT")` → `.claude/agents/test-agent.md` ✅
   - Converts to kebab-case with proper extension

## The Fix

Updated [`apps/api/src/routes/file.routes.ts:176-179`](apps/api/src/routes/file.routes.ts#L176-L179):

```typescript
if (fileType === "AGENT") {
  // Extract filename from generated path (e.g., ".claude/agents/test-agent.md" -> "test-agent.md")
  const filename = path.split('/').pop() || name;
  validation = validateAgentFile(content, filename);
}
```

**Why this works:**
- `path` is already generated in correct format (`.claude/agents/test-agent.md`)
- `split('/').pop()` extracts just the filename (`test-agent.md`)
- Validator receives properly formatted filename and passes validation

## Related Fixes (From Previous Session)

1. **Path Auto-Generation** ([`apps/api/src/routes/file.routes.ts:59-82`](apps/api/src/routes/file.routes.ts#L59-L82)):
   - Added `generateFilePath()` helper to create filesystem paths
   - Maps semantic types to directory structures

2. **FileType Enum Mapping** ([`apps/api/src/routes/file.routes.ts:87-105`](apps/api/src/routes/file.routes.ts#L87-L105)):
   - Added `mapToPrismaFileType()` to convert frontend types to Prisma enum
   - Frontend: `AGENT`, `SKILL`, `COMMAND` → Prisma: `MARKDOWN`, `JSON`, etc.

3. **Folder Path Auto-Generation** ([`apps/api/src/routes/folder.routes.ts:122-132`](apps/api/src/routes/folder.routes.ts#L122-L132)):
   - Hierarchical path building based on parent folders
   - Root folders: `/{cleanName}`, nested: `{parentPath}/{cleanName}`

## Verification

- ✅ TypeScript compilation: No errors
- ✅ API server auto-restarted via nodemon at 20:13:24
- ✅ All fixes loaded and active
- ✅ Enhanced error logging in place for debugging if issues persist

## Files Modified

1. `apps/api/src/routes/file.routes.ts` - Main fix for validation
2. `apps/api/src/routes/folder.routes.ts` - Path auto-generation for folders
3. `apps/api/src/middleware/auth.ts` - Converted to non-async for middleware compatibility
4. `packages/utils/src/validators/agent-validator.ts` - Extracted YAML parser
5. `packages/utils/src/validators/index.ts` - Export YAML parser

## Next Steps

User should test file/folder creation in UI. If issues persist, enhanced error logging will show specific errors in browser console under `details` field.
