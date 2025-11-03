# TypeScript and Authorization Security Fixes

## Investigation Date

2025-11-03

## Problem Statement

1. **TypeScript Build Error**: `req.user` possibly null/undefined at lines 113, 206, 299 in `file.routes.ts`
2. **Critical Security Vulnerability**: Missing authorization checks allowing any authenticated user to access/modify any resource

## Key Findings

### 1. TypeScript Type System Issue

**File**: `apps/api/src/types/express.d.ts`

**Root Cause**:

- Express Request type declared `user` as optional: `user?: Session['user'] | null`
- `requireAuth` middleware guarantees `user` exists at runtime, but TypeScript can't verify this statically

**Solution Applied**:

```typescript
export interface AuthenticatedRequest extends Request {
  user: NonNullable<Session["user"]>;
  session: Session;
}
```

Used type assertions in route handlers:

```typescript
const userId = (req as AuthenticatedRequest).user.id;
```

### 2. Authorization Vulnerabilities

**Affected Files**:

- `apps/api/src/routes/file.routes.ts`
- `apps/api/src/routes/folder.routes.ts`
- `apps/api/src/routes/stash.routes.ts`

**Root Cause**:
Routes only used `requireAuth` (authentication) but didn't verify resource ownership (authorization).

**Example Vulnerability** (`file.routes.ts:20`):

```typescript
// BEFORE: Any authenticated user could access any file by ID
router.get("/:id", async (req: Request, res: Response) => {
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) return res.status(404).json({ error: "File not found" });
  res.json(file); // ❌ No ownership check
});
```

**Fix Applied**:

```typescript
// AFTER: Verify ownership via stash relationship
router.get("/:id", async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user.id;
  const file = await prisma.file.findUnique({
    where: { id },
    include: { stash: { select: { userId: true } } },
  });
  if (!file) return res.status(404).json({ error: "File not found" });
  if (file.stash.userId !== userId)
    return res.status(403).json({ error: "Forbidden" }); // ✅
  res.json(file);
});
```

### 3. Data Model Relationships (Verified)

**File**: `packages/db/prisma/schema.prisma`

```prisma
model Stash {
  id     String @id
  userId String
  user   User   @relation(...)
  files  File[]
  folders Folder[]
}

model Folder {
  id      String @id
  stashId String
  stash   Stash  @relation(...)
}

model File {
  id      String @id
  stashId String
  stash   Stash  @relation(...)
}
```

**Key Finding**: All resources (File, Folder) have a `stash` relationship, and Stash has a `userId`. This enables ownership verification via the stash chain.

## Routes Fixed

### file.routes.ts

- ✅ GET `/api/files/:id` - Lines 20-51
- ✅ POST `/api/files` - Lines 60-164
- ✅ PUT `/api/files/:id` - Lines 173-264
- ✅ DELETE `/api/files/:id` - Lines 271-303
- ✅ GET `/api/files/:id/versions` - Lines 309-345
- ✅ POST `/api/files/:id/revert` - Lines 348-418

### folder.routes.ts

- ✅ GET `/api/folders/:id` - Lines 15-56
- ✅ POST `/api/folders` - Lines 60-115
- ✅ PUT `/api/folders/:id` - Lines 121-163
- ✅ DELETE `/api/folders/:id` - Lines 164-200

### stash.routes.ts

- ✅ GET `/api/stashes` - Lines 15-59 (already filtered by userId, no fix needed)
- ✅ GET `/api/stashes/:id` - Lines 64-108
- ✅ POST `/api/stashes` - Lines 112-136 (creates with userId, no fix needed)
- ✅ PUT `/api/stashes/:id` - Lines 142-180
- ✅ DELETE `/api/stashes/:id` - Lines 182-211
- ✅ GET `/api/stashes/:id/files` - Lines 216-283

## Verification

**Command**: `cd apps/api && pnpm check-types`
**Result**: Exit code 0 (success)

## Authorization Pattern Implemented

```typescript
// 1. Extract authenticated user ID
const userId = (req as AuthenticatedRequest).user.id;

// 2. Fetch resource with stash relationship
const resource = await prisma.resource.findUnique({
  where: { id },
  include: { stash: { select: { userId: true } } },
});

// 3. Verify ownership
if (!resource) return res.status(404).json({ error: "Not found" });
if (resource.stash.userId !== userId)
  return res.status(403).json({ error: "Forbidden" });

// 4. Proceed with authorized operation
```

## Additional Validations Added

### POST /api/files

- Validates stash ownership before file creation
- Validates folder belongs to same stash if `folderId` provided

### POST /api/folders

- Validates stash ownership before folder creation
- Validates parent folder belongs to same stash if `parentId` provided

## Security Impact

**Before**: IDOR (Insecure Direct Object Reference) vulnerability - authenticated users could:

- Read any file/folder/stash by guessing IDs
- Modify any file/folder/stash
- Delete any file/folder/stash

**After**: All operations enforce ownership via stash relationship, returning 403 Forbidden for unauthorized access attempts.
