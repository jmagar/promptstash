# Structured Logging Migration Plan

**Issue**: 73 instances of console.log/console.error/console.warn across codebase
**Solution**: Replace with proper structured logging using `@workspace/observability`
**Estimated Time**: 6-8 hours
**Date Created**: 2025-11-05

---

## Table of Contents

1. [Summary of Findings](#summary-of-findings)
2. [Logger API Reference](#logger-api-reference)
3. [Categorized File Inventory](#categorized-file-inventory)
4. [Replacement Patterns](#replacement-patterns)
5. [File-by-File Change Plan](#file-by-file-change-plan)
6. [ESLint Configuration](#eslint-configuration)
7. [Automation Script](#automation-script)
8. [Best Practices](#best-practices)
9. [Testing Procedures](#testing-procedures)
10. [Implementation Timeline](#implementation-timeline)

---

## Summary of Findings

### Total Instances by Environment

| Environment            | Count  | Status                  |
| ---------------------- | ------ | ----------------------- |
| **API (apps/api/src)** | 37     | ❌ Needs replacement    |
| **Web App (apps/web)** | 36     | ❌ Needs replacement    |
| **Packages**           | 22     | ⚠️ Partially acceptable |
| **TOTAL**              | **95** | -                       |

### Breakdown by Type

- **console.error**: 54 instances (57%)
- **console.log**: 38 instances (40%)
- **console.warn**: 3 instances (3%)

### Files Excluded from Migration

These files are acceptable to keep console logging:

- `packages/db/prisma/seed.ts` - Seed script (CLI tool)
- `apps/web/components/__tests__/error-boundary.test.tsx` - Test suppression code
- Documentation files (\*.md)
- Example/demo files (apps/web/app/ui-demo/page.tsx)

---

## Logger API Reference

### Available from `@workspace/observability`

```typescript
import {
  logger, // Default logger instance
  logError, // Error logging with context
  logRequest, // HTTP request logging
  logQuery, // Database query logging
  createChildLogger, // Create contextual logger
} from "@workspace/observability";
```

### Core Logger Methods

```typescript
logger.info(data, message); // Info level logging
logger.warn(data, message); // Warning level logging
logger.error(data, message); // Error level logging
logger.debug(data, message); // Debug level logging
logger.trace(data, message); // Trace level logging
logger.fatal(data, message); // Fatal error logging
```

### Specialized Logging Functions

#### logError(error, context)

```typescript
logError(error, {
  requestId: req.requestId,
  userId: req.user?.id,
  operation: "createFile",
  stashId: stashId,
});
```

#### logRequest(params)

```typescript
logRequest({
  method: req.method,
  url: req.url,
  statusCode: res.statusCode,
  responseTime: duration,
  requestId: req.requestId,
  userId: req.user?.id,
  error: error, // optional
});
```

#### logQuery(params)

```typescript
logQuery({
  query: "findUnique",
  duration: queryTime,
  operation: "findFile",
  model: "File",
  slow: duration > 1000,
});
```

#### createChildLogger(context)

```typescript
const fileLogger = createChildLogger({
  service: "file-service",
  userId: user.id,
});

fileLogger.info("Processing file upload");
```

### Output Format

**Development** (pretty printed):

```
[12:34:56] INFO (app/123): User login successful
  userId: "user_123"
  email: "user@example.com"
```

**Production** (JSON):

```json
{
  "level": "info",
  "time": "2025-11-05T12:34:56.789Z",
  "service": "app",
  "env": "production",
  "pid": 1234,
  "userId": "user_123",
  "msg": "User login successful"
}
```

---

## Categorized File Inventory

### Category 1: API Route Handlers (23 files)

**High Priority** - These handle user requests and need proper request context

| File                                     | Instances | Type                       |
| ---------------------------------------- | --------- | -------------------------- |
| `apps/api/src/routes/file.routes.ts`     | 8         | Error logging in try/catch |
| `apps/api/src/routes/stash.routes.ts`    | 6         | Error logging in try/catch |
| `apps/api/src/routes/folder.routes.ts`   | 4         | Error logging in try/catch |
| `apps/api/src/routes/tag.routes.ts`      | 5         | Error logging in try/catch |
| `apps/api/src/routes/validate.routes.ts` | 5         | Error logging in try/catch |

**Pattern**: All are `console.error()` in catch blocks with error context

### Category 2: API Middleware (3 files)

**High Priority** - Critical for request/response cycle logging

| File                                     | Instances | Type                 |
| ---------------------------------------- | --------- | -------------------- |
| `apps/api/src/middleware/auth.ts`        | 1         | Session error        |
| `apps/api/src/middleware/rate-limit.ts`  | 1         | Rate limit error     |
| `apps/api/src/middleware/performance.ts` | 1         | Slow request warning |

### Category 3: API Configuration & Startup (2 files)

**Medium Priority** - Startup and validation messages

| File                         | Instances | Type                      |
| ---------------------------- | --------- | ------------------------- |
| `apps/api/src/index.ts`      | 3         | Startup info messages     |
| `apps/api/src/config/env.ts` | 4         | Validation success/errors |

### Category 4: Web Components (11 files)

**High Priority** - User-facing error feedback

| File                                              | Instances | Type                     |
| ------------------------------------------------- | --------- | ------------------------ |
| `apps/web/components/error-boundary.tsx`          | 4         | React error boundary     |
| `apps/web/components/new-file-modal.tsx`          | 1         | File creation error      |
| `apps/web/components/new-folder-modal.tsx`        | 1         | Folder creation error    |
| `apps/web/components/file-editor.tsx`             | 1         | File save error          |
| `apps/web/components/delete-account-form.tsx`     | 1         | Account deletion error   |
| `apps/web/components/credentials-form.tsx`        | 1         | Email verification error |
| `apps/web/components/password-form.tsx`           | 2         | Password change errors   |
| `apps/web/components/two-factor-setup.tsx`        | 3         | 2FA setup errors         |
| `apps/web/components/two-factor-verification.tsx` | 1         | 2FA verification error   |
| `apps/web/lib/csrf.ts`                            | 1         | CSRF token fetch error   |
| `apps/web/components/web-vitals.tsx`              | 2         | Performance monitoring   |

### Category 5: Web App Routes (6 files)

**Medium Priority** - Server-side and API routes

| File                                                          | Instances | Type                 |
| ------------------------------------------------------------- | --------- | -------------------- |
| `apps/web/app/(auth)/forgot-password/page.tsx`                | 1         | Password reset error |
| `apps/web/app/(auth)/reset-password/page.tsx`                 | 1         | Password reset error |
| `apps/web/app/(default)/(settings)/settings/general/page.tsx` | 1         | Profile update error |
| `apps/web/app/api/analytics/web-vitals/route.ts`              | 2         | Web vitals logging   |
| `apps/web/app/api/auth/password/route.ts`                     | 2         | API route errors     |
| `apps/web/app/ui-demo/page.tsx`                               | 6         | Demo page (SKIP)     |

### Category 6: Shared Packages (3 files)

**Low Priority** - May need different approach

| File                               | Instances | Type                  |
| ---------------------------------- | --------- | --------------------- |
| `packages/auth/src/server.ts`      | 3         | Rate limit messages   |
| `packages/email/src/send-email.ts` | 5         | Email service logging |
| `packages/db/prisma/seed.ts`       | 14        | Seed script (SKIP)    |

---

## Replacement Patterns

### Pattern 1: API Route Error Handling (Most Common)

**Before:**

```typescript
router.post("/api/files", async (req: Request, res: Response) => {
  try {
    // ... route logic
  } catch (error) {
    console.error("Error creating file:", error);
    res.status(500).json({ error: "Failed to create file" });
  }
});
```

**After:**

```typescript
import { logError } from "@workspace/observability";

router.post("/api/files", async (req: Request, res: Response) => {
  try {
    // ... route logic
  } catch (error) {
    logError(error as Error, {
      operation: "createFile",
      requestId: req.requestId,
      userId: req.user?.id,
      path: req.path,
      method: req.method,
    });
    res.status(500).json({ error: "Failed to create file" });
  }
});
```

### Pattern 2: API Route with Detailed Error Context

**Before:**

```typescript
console.error("Error creating file:", error);
console.error("Error details:", {
  message: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
  requestBody: req.body,
});
```

**After:**

```typescript
logError(error as Error, {
  operation: "createFile",
  requestId: req.requestId,
  userId: req.user?.id,
  requestBody: req.body,
  path: req.path,
});
```

**Note**: `logError` automatically captures message, stack, and error name.

### Pattern 3: Middleware Error Handling

**Before:**

```typescript
export const authMiddleware = async (req, res, next) => {
  try {
    // ... middleware logic
  } catch (error) {
    console.error("Error getting session:", error);
    next(error);
  }
};
```

**After:**

```typescript
import { logError } from "@workspace/observability";

export const authMiddleware = async (req, res, next) => {
  try {
    // ... middleware logic
  } catch (error) {
    logError(error as Error, {
      middleware: "auth",
      requestId: req.requestId,
      path: req.path,
    });
    next(error);
  }
};
```

### Pattern 4: Middleware Warning (Slow Requests)

**Before:**

```typescript
if (duration > threshold) {
  console.warn({
    type: "slow_request",
    duration,
    threshold,
    path: req.path,
  });
}
```

**After:**

```typescript
import { logger } from "@workspace/observability";

if (duration > threshold) {
  logger.warn(
    {
      type: "slow_request",
      duration,
      threshold,
      path: req.path,
      method: req.method,
      requestId: req.requestId,
    },
    `Slow request detected: ${req.method} ${req.path} (${duration}ms)`,
  );
}
```

### Pattern 5: Startup Messages

**Before:**

```typescript
console.log(`🚀 API server running on http://localhost:${PORT}`);
console.log(`📝 Environment: ${env.NODE_ENV}`);
console.log(`🔒 CORS allowed origins: ${env.ALLOWED_ORIGINS.join(", ")}`);
```

**After:**

```typescript
import { logger } from "@workspace/observability";

logger.info(
  {
    port: PORT,
    environment: env.NODE_ENV,
    allowedOrigins: env.ALLOWED_ORIGINS,
    pid: process.pid,
  },
  `API server started on port ${PORT}`,
);
```

### Pattern 6: Environment Validation

**Before:**

```typescript
console.log("✓ Environment variables validated successfully");
```

**After:**

```typescript
import { logger } from "@workspace/observability";

logger.info(
  {
    validatedVars: Object.keys(env),
  },
  "Environment variables validated successfully",
);
```

### Pattern 7: React Component Error Logging (Client-Side)

**Before:**

```typescript
try {
  await createFile(data);
} catch (error) {
  console.error("Error creating file:", error);
  toast.error("Failed to create file");
}
```

**After:**

```typescript
// For client-side components, create a browser-safe logger
// Option 1: Log to external service (future)
// Option 2: Log to server via API (recommended)
// Option 3: Use console in development only

import { logger } from "@workspace/observability";

try {
  await createFile(data);
} catch (error) {
  // In browser context, logger will only work in dev mode
  // For production, we need a different strategy
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.error("Error creating file:", error);
  } else {
    // Send to server logging endpoint
    logToServer({
      level: "error",
      message: "Error creating file",
      error: error instanceof Error ? error.message : String(error),
      component: "NewFileModal",
    });
  }
  toast.error("Failed to create file");
}
```

**Better Pattern for React Components:**

Create a client-side logger utility at `apps/web/lib/client-logger.ts`:

```typescript
type LogLevel = "info" | "warn" | "error";

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

export function logClientError(
  message: string,
  error: unknown,
  context?: LogContext,
) {
  const errorData = {
    message,
    error:
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : String(error),
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };

  // In development, log to console
  if (process.env.NODE_ENV === "development") {
    console.error("[Client Error]", errorData);
  }

  // In production, send to server
  if (process.env.NODE_ENV === "production") {
    fetch("/api/logging/client-errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorData),
    }).catch(() => {
      // Silently fail - don't want logging errors to break the app
    });
  }
}

export function logClientInfo(message: string, context?: LogContext) {
  if (process.env.NODE_ENV === "development") {
    console.log("[Client Info]", message, context);
  }
}
```

**Usage in components:**

```typescript
import { logClientError } from "@/lib/client-logger";

try {
  await createFile(data);
} catch (error) {
  logClientError("Error creating file", error, {
    component: "NewFileModal",
    action: "createFile",
  });
  toast.error("Failed to create file");
}
```

### Pattern 8: React Error Boundary

**Before:**

```typescript
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  console.error('Error:', error);
  console.error('Error Info:', errorInfo);
  console.error('Error Data:', errorData);
}
```

**After:**

```typescript
import { logClientError } from '@/lib/client-logger';

componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  logClientError('React component error', error, {
    component: 'ErrorBoundary',
    componentStack: errorInfo.componentStack,
    errorData: this.state.errorData,
  });
}
```

### Pattern 9: API Route in Next.js (Server Component)

**Before:**

```typescript
export async function POST(request: Request) {
  try {
    // ... logic
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

**After:**

```typescript
import { logError } from "@workspace/observability";

export async function POST(request: Request) {
  try {
    // ... logic
  } catch (error) {
    logError(error as Error, {
      route: "/api/analytics/web-vitals",
      method: "POST",
    });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

### Pattern 10: Package Logging (Email Service)

**Before:**

```typescript
console.log("📧 Email service initializing...");
console.log("✅ Email service ready");
console.error("❌ Failed to send email:", error);
```

**After:**

```typescript
import { logger, logError } from "@workspace/observability";

const emailLogger = createChildLogger({ service: "email" });

emailLogger.info("Email service initializing");
emailLogger.info("Email service ready");
logError(error as Error, {
  service: "email",
  operation: "sendEmail",
  recipient: to,
});
```

---

## File-by-File Change Plan

### API Routes

#### 1. apps/api/src/routes/file.routes.ts

**Changes needed**: 8 instances

**Line 58** - GET /api/files/:id error:

```typescript
// BEFORE
console.error("Error fetching file:", error);

// AFTER
import { logError } from "@workspace/observability";

logError(error as Error, {
  operation: "getFile",
  fileId: req.params.id,
  requestId: req.requestId,
  userId: req.user?.id,
});
```

**Line 127** - POST /api/files auth failure:

```typescript
// BEFORE
console.error("User authentication failed:", {
  user,
  hasSession: !!req.session,
});

// AFTER
logger.error(
  {
    operation: "createFile",
    requestId: req.requestId,
    hasUser: !!user,
    hasSession: !!req.session,
  },
  "User authentication failed",
);
```

**Lines 246-251** - POST /api/files detailed error:

```typescript
// BEFORE
console.error("Error creating file:", error);
console.error("Error details:", {
  message: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
  requestBody: req.body,
});

// AFTER
logError(error as Error, {
  operation: "createFile",
  requestId: req.requestId,
  userId: req.user?.id,
  requestBody: {
    name: req.body.name,
    fileType: req.body.fileType,
    stashId: req.body.stashId,
  },
});
```

**Line 374** - PUT /api/files/:id error:

```typescript
// BEFORE
console.error("Error updating file:", error);

// AFTER
logError(error as Error, {
  operation: "updateFile",
  fileId: req.params.id,
  requestId: req.requestId,
  userId: req.user?.id,
});
```

**Line 412** - DELETE /api/files/:id error:

```typescript
// BEFORE
console.error("Error deleting file:", error);

// AFTER
logError(error as Error, {
  operation: "deleteFile",
  fileId: req.params.id,
  requestId: req.requestId,
  userId: req.user?.id,
});
```

**Line 451** - GET /api/files/:id/versions error:

```typescript
// BEFORE
console.error("Error fetching versions:", error);

// AFTER
logError(error as Error, {
  operation: "getFileVersions",
  fileId: req.params.id,
  requestId: req.requestId,
  userId: req.user?.id,
});
```

**Line 523** - POST /api/files/:id/revert error:

```typescript
// BEFORE
console.error("Error reverting file:", error);

// AFTER
logError(error as Error, {
  operation: "revertFile",
  fileId: req.params.id,
  versionId: req.body.versionId,
  requestId: req.requestId,
  userId: req.user?.id,
});
```

**Import to add at top:**

```typescript
import { logger, logError } from "@workspace/observability";
```

---

#### 2. apps/api/src/routes/stash.routes.ts

**Changes needed**: 6 instances

**Line 99** - GET /api/stashes error:

```typescript
// BEFORE
console.error("Error fetching stashes:", error);

// AFTER
logError(error as Error, {
  operation: "getStashes",
  requestId: req.requestId,
  userId: req.user?.id,
});
```

**Line 160** - GET /api/stashes/:id error:

```typescript
// BEFORE
console.error("Error fetching stash:", error);

// AFTER
logError(error as Error, {
  operation: "getStash",
  stashId: req.params.id,
  requestId: req.requestId,
  userId: req.user?.id,
});
```

**Line 190** - POST /api/stashes error:

```typescript
// BEFORE
console.error("Error creating stash:", error);

// AFTER
logError(error as Error, {
  operation: "createStash",
  requestId: req.requestId,
  userId: req.user?.id,
  stashName: req.body.name,
});
```

**Line 230** - PUT /api/stashes/:id error:

```typescript
// BEFORE
console.error("Error updating stash:", error);

// AFTER
logError(error as Error, {
  operation: "updateStash",
  stashId: req.params.id,
  requestId: req.requestId,
  userId: req.user?.id,
});
```

**Line 264** - DELETE /api/stashes/:id error:

```typescript
// BEFORE
console.error("Error deleting stash:", error);

// AFTER
logError(error as Error, {
  operation: "deleteStash",
  stashId: req.params.id,
  requestId: req.requestId,
  userId: req.user?.id,
});
```

**Line 375** - GET /api/stashes/:id/files error:

```typescript
// BEFORE
console.error("Error fetching files:", error);

// AFTER
logError(error as Error, {
  operation: "getStashFiles",
  stashId: req.params.id,
  requestId: req.requestId,
  userId: req.user?.id,
  query: req.query,
});
```

**Import to add:**

```typescript
import { logError } from "@workspace/observability";
```

---

#### 3. apps/api/src/routes/folder.routes.ts

**Changes needed**: 4 instances

**Line 71** - GET /api/folders/:id error:

```typescript
// BEFORE
console.error("Error fetching folder:", error);

// AFTER
logError(error as Error, {
  operation: "getFolder",
  folderId: req.params.id,
  requestId: req.requestId,
  userId: req.user?.id,
});
```

**Line 146** - POST /api/folders error:

```typescript
// BEFORE
console.error("Error creating folder:", error);

// AFTER
logError(error as Error, {
  operation: "createFolder",
  requestId: req.requestId,
  userId: req.user?.id,
  folderName: req.body.name,
  parentId: req.body.parentId,
});
```

**Line 189** - PUT /api/folders/:id error:

```typescript
// BEFORE
console.error("Error updating folder:", error);

// AFTER
logError(error as Error, {
  operation: "updateFolder",
  folderId: req.params.id,
  requestId: req.requestId,
  userId: req.user?.id,
});
```

**Line 228** - DELETE /api/folders/:id error:

```typescript
// BEFORE
console.error("Error deleting folder:", error);

// AFTER
logError(error as Error, {
  operation: "deleteFolder",
  folderId: req.params.id,
  requestId: req.requestId,
  userId: req.user?.id,
});
```

**Import to add:**

```typescript
import { logError } from "@workspace/observability";
```

---

#### 4. apps/api/src/routes/tag.routes.ts

**Changes needed**: 5 instances

**Line 27** - GET /api/tags error:

```typescript
// BEFORE
console.error("Error fetching tags:", error);

// AFTER
logError(error as Error, {
  operation: "getTags",
  requestId: req.requestId,
  userId: req.user?.id,
});
```

**Line 68** - GET /api/tags/:id error:

```typescript
// BEFORE
console.error("Error fetching tag:", error);

// AFTER
logError(error as Error, {
  operation: "getTag",
  tagId: req.params.id,
  requestId: req.requestId,
  userId: req.user?.id,
});
```

**Line 114** - POST /api/tags error:

```typescript
// BEFORE
console.error("Error creating tag:", error);

// AFTER
logError(error as Error, {
  operation: "createTag",
  requestId: req.requestId,
  userId: req.user?.id,
  tagName: req.body.name,
});
```

**Line 174** - PUT /api/tags/:id error:

```typescript
// BEFORE
console.error("Error updating tag:", error);

// AFTER
logError(error as Error, {
  operation: "updateTag",
  tagId: req.params.id,
  requestId: req.requestId,
  userId: req.user?.id,
});
```

**Line 203** - DELETE /api/tags/:id error:

```typescript
// BEFORE
console.error("Error deleting tag:", error);

// AFTER
logError(error as Error, {
  operation: "deleteTag",
  tagId: req.params.id,
  requestId: req.requestId,
  userId: req.user?.id,
});
```

**Import to add:**

```typescript
import { logError } from "@workspace/observability";
```

---

#### 5. apps/api/src/routes/validate.routes.ts

**Changes needed**: 5 instances

**Line 30** - POST /api/validate/agent error:

```typescript
// BEFORE
console.error("Error validating agent:", error);

// AFTER
logError(error as Error, {
  operation: "validateAgent",
  requestId: req.requestId,
  filename: req.body.filename,
});
```

**Line 53** - POST /api/validate/skill error:

```typescript
// BEFORE
console.error("Error validating skill:", error);

// AFTER
logError(error as Error, {
  operation: "validateSkill",
  requestId: req.requestId,
  path: req.body.path,
});
```

**Line 76** - POST /api/validate/mcp error:

```typescript
// BEFORE
console.error("Error validating MCP config:", error);

// AFTER
logError(error as Error, {
  operation: "validateMCP",
  requestId: req.requestId,
});
```

**Line 99** - POST /api/validate/hooks error:

```typescript
// BEFORE
console.error("Error validating hooks:", error);

// AFTER
logError(error as Error, {
  operation: "validateHooks",
  requestId: req.requestId,
});
```

**Line 122** - POST /api/validate/hook-output error:

```typescript
// BEFORE
console.error("Error validating hook output:", error);

// AFTER
logError(error as Error, {
  operation: "validateHookOutput",
  requestId: req.requestId,
});
```

**Import to add:**

```typescript
import { logError } from "@workspace/observability";
```

---

### API Middleware

#### 6. apps/api/src/middleware/auth.ts

**Changes needed**: 1 instance

**Line 21** - Session error:

```typescript
// BEFORE
console.error("Error getting session:", error);

// AFTER
import { logError } from "@workspace/observability";

logError(error as Error, {
  middleware: "auth",
  requestId: req.requestId,
  path: req.path,
});
```

---

#### 7. apps/api/src/middleware/rate-limit.ts

**Changes needed**: 1 instance

**Line 70** - Rate limit error:

```typescript
// BEFORE
console.error("Rate limit middleware error:", error);

// AFTER
import { logError } from "@workspace/observability";

logError(error as Error, {
  middleware: "rateLimit",
  requestId: req.requestId,
  ip: req.ip,
});
```

---

#### 8. apps/api/src/middleware/performance.ts

**Changes needed**: 1 instance

**Line 69** - Slow request warning:

```typescript
// BEFORE
console.warn({
  type: "slow_request",
  duration,
  threshold: slowRequestThreshold,
  path: req.path,
  method: req.method,
});

// AFTER
import { logger } from "@workspace/observability";

logger.warn(
  {
    type: "slow_request",
    duration,
    threshold: slowRequestThreshold,
    path: req.path,
    method: req.method,
    requestId: req.requestId,
    userId: req.user?.id,
  },
  `Slow request: ${req.method} ${req.path} (${duration}ms)`,
);
```

---

### API Configuration & Startup

#### 9. apps/api/src/index.ts

**Changes needed**: 3 instances

**Lines 17-19** - Startup messages:

```typescript
// BEFORE
console.log(`🚀 API server running on http://localhost:${PORT}`);
console.log(`📝 Environment: ${env.NODE_ENV}`);
console.log(`🔒 CORS allowed origins: ${env.ALLOWED_ORIGINS.join(", ")}`);

// AFTER
import { logger } from "@workspace/observability";

logger.info(
  {
    port: PORT,
    environment: env.NODE_ENV,
    allowedOrigins: env.ALLOWED_ORIGINS,
    pid: process.pid,
    nodeVersion: process.version,
  },
  `API server started on port ${PORT}`,
);
```

---

#### 10. apps/api/src/config/env.ts

**Changes needed**: 4 instances

**Lines 64-70** - Validation logging:

```typescript
// BEFORE
console.log("✓ Environment variables validated successfully");
// ...
console.error("❌ Environment variable validation failed:");
err.errors.forEach((err) => {
  console.error(`  - ${err.path.join(".")}: ${err.message}`);
});

// AFTER
import { logger } from "@workspace/observability";

// Success case
logger.info(
  {
    validatedKeys: Object.keys(parsed.data),
    environment: parsed.data.NODE_ENV,
  },
  "Environment variables validated successfully",
);

// Error case
logger.error(
  {
    errors: err.errors.map((e) => ({
      path: e.path.join("."),
      message: e.message,
    })),
  },
  "Environment variable validation failed",
);

err.errors.forEach((err) => {
  logger.error(`  - ${err.path.join(".")}: ${err.message}`);
});
```

---

### Web Components

#### 11. apps/web/lib/client-logger.ts (CREATE NEW FILE)

**Purpose**: Centralized client-side logging utility

```typescript
/**
 * Client-side logging utility
 *
 * In development: Logs to console
 * In production: Sends to server endpoint
 */

type LogLevel = "info" | "warn" | "error";

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

interface ErrorLogData {
  message: string;
  error:
    | {
        message: string;
        stack?: string;
        name: string;
      }
    | string;
  context?: LogContext;
  timestamp: string;
  userAgent: string;
  url: string;
}

/**
 * Log client-side errors
 */
export function logClientError(
  message: string,
  error: unknown,
  context?: LogContext,
): void {
  const errorData: ErrorLogData = {
    message,
    error:
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : String(error),
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Development: log to console
  if (process.env.NODE_ENV === "development") {
    console.error("[Client Error]", errorData);
  }

  // Production: send to server (fire and forget)
  if (process.env.NODE_ENV === "production") {
    sendToServer("error", errorData);
  }
}

/**
 * Log client-side info messages
 */
export function logClientInfo(message: string, context?: LogContext): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[Client Info]", message, context);
  }

  // Optionally send to server for analytics
  if (process.env.NEXT_PUBLIC_ENABLE_CLIENT_LOGGING === "true") {
    sendToServer("info", {
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Log client-side warnings
 */
export function logClientWarn(message: string, context?: LogContext): void {
  if (process.env.NODE_ENV === "development") {
    console.warn("[Client Warning]", message, context);
  }
}

/**
 * Send log data to server endpoint
 */
function sendToServer(level: LogLevel, data: unknown): void {
  // Use sendBeacon for reliability (especially on page unload)
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify({ level, ...data })], {
      type: "application/json",
    });
    navigator.sendBeacon("/api/logging/client", blob);
  } else {
    // Fallback to fetch
    fetch("/api/logging/client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, ...data }),
      keepalive: true,
    }).catch(() => {
      // Silently fail - don't want logging to break the app
    });
  }
}
```

---

#### 12. apps/web/app/api/logging/client/route.ts (CREATE NEW FILE)

**Purpose**: Server endpoint to receive client logs

```typescript
import { NextResponse } from "next/server";
import { logger } from "@workspace/observability";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { level, message, error, context, timestamp, userAgent, url } = body;

    // Log to server with client context
    const logData = {
      source: "client",
      clientTimestamp: timestamp,
      userAgent,
      url,
      ...context,
    };

    if (level === "error" && error) {
      logger.error(
        {
          ...logData,
          err: error,
        },
        `[Client Error] ${message}`,
      );
    } else if (level === "warn") {
      logger.warn(logData, `[Client Warning] ${message}`);
    } else {
      logger.info(logData, `[Client Info] ${message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Don't log errors from the logging endpoint to avoid infinite loops
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
```

---

#### 13. apps/web/components/error-boundary.tsx

**Changes needed**: 4 instances

**Lines 39-46** - Error boundary logging:

```typescript
// BEFORE
console.error('Error:', error);
console.error('Error Info:', errorInfo);
console.error('Error Data:', errorData);
// ...
console.error('Error caught by boundary:', errorData);

// AFTER
import { logClientError } from '@/lib/client-logger';

componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  const errorData = {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
  };

  this.setState({ error, errorInfo, errorData });

  // Log to client logger
  logClientError('React error boundary caught error', error, {
    component: 'ErrorBoundary',
    componentStack: errorInfo.componentStack,
    errorData,
  });
}

static getDerivedStateFromError(error: Error) {
  logClientError('Error caught by boundary', error, {
    component: 'ErrorBoundary',
  });
  return { error };
}
```

---

#### 14. apps/web/components/new-file-modal.tsx

**Changes needed**: 1 instance

**Line 126** - File creation error:

```typescript
// BEFORE
console.error("Error creating file:", error);

// AFTER
import { logClientError } from "@/lib/client-logger";

logClientError("Error creating file", error, {
  component: "NewFileModal",
  action: "createFile",
  fileType: values.fileType,
});
```

---

#### 15. apps/web/components/new-folder-modal.tsx

**Changes needed**: 1 instance

**Line 85** - Folder creation error:

```typescript
// BEFORE
console.error("Error creating folder:", error);

// AFTER
import { logClientError } from "@/lib/client-logger";

logClientError("Error creating folder", error, {
  component: "NewFolderModal",
  action: "createFolder",
});
```

---

#### 16. apps/web/components/file-editor.tsx

**Changes needed**: 1 instance

**Line 72** - File save error:

```typescript
// BEFORE
console.error("Error saving file:", error);

// AFTER
import { logClientError } from "@/lib/client-logger";

logClientError("Error saving file", error, {
  component: "FileEditor",
  action: "saveFile",
  fileId: file.id,
});
```

---

#### 17. apps/web/components/delete-account-form.tsx

**Changes needed**: 1 instance

**Line 80** - Account deletion error:

```typescript
// BEFORE
console.error("Error deleting account:", error);

// AFTER
import { logClientError } from "@/lib/client-logger";

logClientError("Error deleting account", error, {
  component: "DeleteAccountForm",
  action: "deleteAccount",
});
```

---

#### 18. apps/web/components/credentials-form.tsx

**Changes needed**: 1 instance

**Line 72** - Email verification error:

```typescript
// BEFORE
console.error("Error resending verification email: ", error);

// AFTER
import { logClientError } from "@/lib/client-logger";

logClientError("Error resending verification email", error, {
  component: "CredentialsForm",
  action: "resendVerification",
});
```

---

#### 19. apps/web/components/password-form.tsx

**Changes needed**: 2 instances

**Line 74** - Set password error:

```typescript
// BEFORE
console.error(`Error setting password:`, error);

// AFTER
import { logClientError } from "@/lib/client-logger";

logClientError("Error setting password", error, {
  component: "PasswordForm",
  action: "setPassword",
});
```

**Line 93** - Change password error:

```typescript
// BEFORE
console.error("Error changing password:", error);

// AFTER
logClientError("Error changing password", error, {
  component: "PasswordForm",
  action: "changePassword",
});
```

---

#### 20. apps/web/components/two-factor-setup.tsx

**Changes needed**: 3 instances

**Line 71** - Enable 2FA error:

```typescript
// BEFORE
console.error("Error enabling 2FA:", error);

// AFTER
import { logClientError } from "@/lib/client-logger";

logClientError("Error enabling 2FA", error, {
  component: "TwoFactorSetup",
  action: "enable2FA",
});
```

**Line 89** - Verify 2FA error:

```typescript
// BEFORE
console.error("Error verifying 2FA:", error);

// AFTER
logClientError("Error verifying 2FA", error, {
  component: "TwoFactorSetup",
  action: "verify2FA",
});
```

**Line 110** - Disable 2FA error:

```typescript
// BEFORE
console.error("Error disabling 2FA:", error);

// AFTER
logClientError("Error disabling 2FA", error, {
  component: "TwoFactorSetup",
  action: "disable2FA",
});
```

---

#### 21. apps/web/components/two-factor-verification.tsx

**Changes needed**: 1 instance

**Line 52** - Verify 2FA error:

```typescript
// BEFORE
console.error("Error verifying 2FA:", error);

// AFTER
import { logClientError } from "@/lib/client-logger";

logClientError("Error verifying 2FA", error, {
  component: "TwoFactorVerification",
  action: "verify",
});
```

---

#### 22. apps/web/lib/csrf.ts

**Changes needed**: 1 instance

**Line 44** - CSRF token fetch error:

```typescript
// BEFORE
console.error("[CSRF] Error fetching token:", error);

// AFTER
import { logClientError } from "@/lib/client-logger";

logClientError("Error fetching CSRF token", error, {
  component: "CSRF",
  action: "fetchToken",
});
```

---

#### 23. apps/web/components/web-vitals.tsx

**Changes needed**: 2 instances

**Line 21** - Web vitals logging:

```typescript
// BEFORE
console.log("[Web Vitals]", {
  name: metric.name,
  value: metric.value,
  rating: metric.rating,
});

// AFTER
import { logClientInfo } from "@/lib/client-logger";

logClientInfo("Web vital measured", {
  component: "WebVitals",
  metric: metric.name,
  value: metric.value,
  rating: metric.rating,
});
```

**Line 51** - Send vitals error:

```typescript
// BEFORE
console.error("Failed to send web vitals:", err);

// AFTER
import { logClientError } from "@/lib/client-logger";

logClientError("Failed to send web vitals", err, {
  component: "WebVitals",
  action: "sendVitals",
});
```

---

### Web App Routes

#### 24. apps/web/app/(auth)/forgot-password/page.tsx

**Changes needed**: 1 instance

**Line 63** - Password reset error:

```typescript
// BEFORE
console.error("Error sending password reset email:", error);

// AFTER
import { logClientError } from "@/lib/client-logger";

logClientError("Error sending password reset email", error, {
  component: "ForgotPasswordPage",
  action: "sendResetEmail",
});
```

---

#### 25. apps/web/app/(auth)/reset-password/page.tsx

**Changes needed**: 1 instance

**Line 85** - Password reset error:

```typescript
// BEFORE
console.error("Error resetting password:", error);

// AFTER
import { logClientError } from "@/lib/client-logger";

logClientError("Error resetting password", error, {
  component: "ResetPasswordPage",
  action: "resetPassword",
});
```

---

#### 26. apps/web/app/(default)/(settings)/settings/general/page.tsx

**Changes needed**: 1 instance

**Line 94** - Profile update error:

```typescript
// BEFORE
console.error("Error updating profile:", error);

// AFTER
import { logClientError } from "@/lib/client-logger";

logClientError("Error updating profile", error, {
  component: "GeneralSettingsPage",
  action: "updateProfile",
});
```

---

#### 27. apps/web/app/api/analytics/web-vitals/route.ts

**Changes needed**: 2 instances

**Line 38** - Web vitals logging:

```typescript
// BEFORE
console.log("[Web Vitals API]", {
  metric: body.name,
  value: body.value,
  rating: body.rating,
  path: body.pathname,
});

// AFTER
import { logger } from "@workspace/observability";

logger.info(
  {
    type: "web_vitals",
    metric: body.name,
    value: body.value,
    rating: body.rating,
    path: body.pathname,
    userAgent: request.headers.get("user-agent"),
  },
  `Web Vital: ${body.name}=${body.value} (${body.rating})`,
);
```

**Line 69** - Processing error:

```typescript
// BEFORE
console.error("Error processing web vitals:", error);

// AFTER
import { logError } from "@workspace/observability";

logError(error as Error, {
  operation: "processWebVitals",
  route: "/api/analytics/web-vitals",
});
```

---

#### 28. apps/web/app/api/auth/password/route.ts

**Changes needed**: 2 instances

**Line 28** - Password check error:

```typescript
// BEFORE
console.error("Error checking password status:", error);

// AFTER
import { logError } from "@workspace/observability";

logError(error as Error, {
  operation: "checkPasswordStatus",
  route: "/api/auth/password",
  method: "GET",
});
```

**Line 78** - Set password error:

```typescript
// BEFORE
console.error("Error setting password:", error);

// AFTER
logError(error as Error, {
  operation: "setPassword",
  route: "/api/auth/password",
  method: "POST",
});
```

---

### Shared Packages

#### 29. packages/auth/src/server.ts

**Changes needed**: 3 instances

**Lines 57, 87, 119** - Rate limit messages:

```typescript
// BEFORE
console.log("Rate limit exceeded. Please try again later.");

// AFTER
import { logger } from "@workspace/observability";

logger.warn(
  {
    type: "rate_limit_exceeded",
    service: "auth",
    operation: authOperation, // 'signUp', 'signIn', 'forgotPassword'
  },
  "Rate limit exceeded for auth operation",
);
```

**Add import at top:**

```typescript
import { logger } from "@workspace/observability";
```

---

#### 30. packages/email/src/send-email.ts

**Changes needed**: 5 instances

**Complete refactor:**

```typescript
// BEFORE
console.log("📧 Email service initializing...");
console.log("✅ Email service ready");
console.error("❌ Invalid email parameters:", error);
console.log("📧 Email sent successfully:", emailResponse.data?.id);
console.error("❌ Failed to send email:", error);

// AFTER
import { logger, logError, createChildLogger } from "@workspace/observability";

const emailLogger = createChildLogger({ service: "email" });

// Initialization
emailLogger.info("Email service initializing");
emailLogger.info(
  {
    provider: "resend",
    hasApiKey: !!process.env.RESEND_API_KEY,
  },
  "Email service ready",
);

// Invalid parameters
logger.error(
  {
    service: "email",
    validation: "failed",
    to,
    subject,
  },
  "Invalid email parameters",
);

// Success
emailLogger.info(
  {
    emailId: emailResponse.data?.id,
    to,
    subject,
  },
  "Email sent successfully",
);

// Error
logError(error as Error, {
  service: "email",
  operation: "sendEmail",
  to,
  subject,
});
```

---

### Files to SKIP (Intentionally Keep console)

1. **packages/db/prisma/seed.ts** - CLI seed script, console is appropriate
2. **apps/web/app/ui-demo/page.tsx** - Demo page, console is for demonstration
3. **apps/web/components/**tests**/error-boundary.test.tsx** - Test suppression code
4. **All \*.md files** - Documentation examples

---

## ESLint Configuration

### Add No-Console Rule to Shared ESLint Config

**File**: `/home/user/promptstash/packages/eslint-config/base.js`

```javascript
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import onlyWarn from "eslint-plugin-only-warn";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    // NEW: Prevent console usage
    rules: {
      "no-console": [
        "error",
        {
          allow: [], // No console methods allowed
        },
      ],
    },
  },
  {
    ignores: [
      "dist/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/seed.ts", // Allow console in seed scripts
      "**/ui-demo/**", // Allow console in demo pages
    ],
  },
];
```

### Alternative: Warn Instead of Error (Softer Approach)

If you want to introduce this gradually:

```javascript
rules: {
  "no-console": ["warn", {
    allow: [] // No console methods allowed
  }],
},
```

### Override for Specific Files

Create `.eslintrc.local.json` in directories where console is acceptable:

**packages/db/.eslintrc.local.json**:

```json
{
  "rules": {
    "no-console": "off"
  }
}
```

---

## Automation Script

### Regex-Based Replacement Script

**File**: `/home/user/promptstash/scripts/migrate-logging.sh`

```bash
#!/bin/bash

# Structured Logging Migration Script
# Automates basic console.error -> logError replacements

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting structured logging migration...${NC}\n"

# Function to add import if not exists
add_import_if_missing() {
  local file=$1
  local import_line=$2

  if ! grep -q "$import_line" "$file"; then
    echo -e "${YELLOW}Adding import to $file${NC}"
    # Add import after last import statement
    sed -i "/^import/a\\$import_line" "$file"
  fi
}

# Function to replace console.error in catch blocks
replace_console_error() {
  local file=$1

  echo -e "${YELLOW}Processing: $file${NC}"

  # Add import
  add_import_if_missing "$file" "import { logError } from '@workspace/observability';"

  # This is a simplified replacement - manual review still needed
  # Replace simple console.error patterns
  sed -i "s/console\.error('Error \(.*\):', error);/logError(error as Error, { operation: '\1' });/g" "$file"

  echo -e "${GREEN}✓ Processed $file${NC}"
}

# Process API route files
echo -e "\n${BLUE}Processing API routes...${NC}"
find apps/api/src/routes -name "*.ts" -type f | while read file; do
  replace_console_error "$file"
done

# Process middleware files
echo -e "\n${BLUE}Processing middleware...${NC}"
find apps/api/src/middleware -name "*.ts" -type f | while read file; do
  replace_console_error "$file"
done

echo -e "\n${GREEN}Migration complete!${NC}"
echo -e "${YELLOW}⚠️  IMPORTANT: Manual review required for:${NC}"
echo "  - Adding proper context to logError calls"
echo "  - Handling multi-line console.error statements"
echo "  - Frontend component logging"
echo ""
echo -e "${BLUE}Run 'pnpm lint' to check for remaining console usage${NC}"
```

**Make executable:**

```bash
chmod +x scripts/migrate-logging.sh
```

**Note**: This script handles only the simplest cases. Manual review is essential.

---

## Best Practices

### 1. Always Include Request Context

For API routes, always include:

```typescript
logError(error as Error, {
  operation: "operationName", // Required: What operation failed
  requestId: req.requestId, // Required: For request tracing
  userId: req.user?.id, // Important: Who was affected
  path: req.path, // Helpful: What endpoint
  method: req.method, // Helpful: HTTP method
  // Additional context specific to operation
  resourceId: req.params.id,
});
```

### 2. Use Descriptive Operation Names

```typescript
// ❌ Bad - Too vague
logError(error, { operation: "error" });

// ✅ Good - Specific and actionable
logError(error, { operation: "createFile" });
logError(error, { operation: "updateStash" });
logError(error, { operation: "deleteFolder" });
```

### 3. Don't Log Sensitive Data

```typescript
// ❌ Bad - Logs passwords
logError(error, {
  requestBody: req.body, // Contains password!
});

// ✅ Good - Redact sensitive fields
logError(error, {
  requestBody: {
    email: req.body.email,
    // password field omitted
  },
});
```

### 4. Use Child Loggers for Services

```typescript
// Create service-specific logger
const emailLogger = createChildLogger({ service: "email" });

// All logs automatically include service context
emailLogger.info("Sending welcome email");
emailLogger.error("Failed to send email");
```

### 5. Log at Appropriate Levels

- **error**: Unrecoverable errors, exceptions
- **warn**: Recoverable issues, slow requests, rate limits
- **info**: Normal operations, successful requests, startup
- **debug**: Detailed debugging information (dev only)
- **trace**: Very detailed tracing (dev only)

```typescript
// Error - Something went wrong
logError(error, context);

// Warning - Something unusual but handled
logger.warn({ duration: 5000 }, "Slow database query");

// Info - Normal operation
logger.info({ userId }, "User logged in");

// Debug - Development info
logger.debug({ query }, "Database query executed");
```

### 6. Frontend Logging Strategy

```typescript
// Always use client logger for browser context
import { logClientError } from "@/lib/client-logger";

// Include component and action
logClientError("Operation failed", error, {
  component: "ComponentName",
  action: "specificAction",
});
```

### 7. Don't Log in Loops

```typescript
// ❌ Bad - Logs inside loop
files.forEach((file) => {
  logger.info({ file }, "Processing file");
  processFile(file);
});

// ✅ Good - Single log with summary
logger.info({ fileCount: files.length }, "Processing files");
files.forEach((file) => processFile(file));
logger.info({ fileCount: files.length }, "Completed processing files");
```

### 8. Structure for Searchability

Use consistent field names:

```typescript
// Consistent naming
{
  operation: 'createFile',    // Not 'action', 'task', 'op'
  userId: 'user_123',         // Not 'user', 'uid'
  requestId: 'req_456',       // Not 'reqId', 'rid'
  duration: 123,              // Not 'time', 'elapsed'
}
```

### 9. Log Correlation

Link related logs with consistent IDs:

```typescript
// Start of operation
logger.info(
  {
    operation: "fileUpload",
    uploadId: "upload_123",
  },
  "Starting file upload",
);

// During operation
logger.debug(
  {
    operation: "fileUpload",
    uploadId: "upload_123",
    progress: 50,
  },
  "Upload progress",
);

// End of operation
logger.info(
  {
    operation: "fileUpload",
    uploadId: "upload_123",
    duration: 1234,
  },
  "Upload completed",
);
```

### 10. Error Context Examples

```typescript
// File operations
logError(error, {
  operation: "createFile",
  fileId: file.id,
  fileName: file.name,
  fileType: file.type,
  stashId: file.stashId,
});

// Database operations
logError(error, {
  operation: "queryDatabase",
  model: "User",
  query: "findUnique",
  duration: queryTime,
});

// External API calls
logError(error, {
  operation: "sendEmail",
  provider: "resend",
  recipient: email,
  emailType: "verification",
});

// Authentication
logError(error, {
  operation: "authenticate",
  email: user.email,
  method: "password",
  ipAddress: req.ip,
});
```

---

## Testing Procedures

### 1. Pre-Migration Testing

Before making changes:

```bash
# Ensure all tests pass
pnpm test

# Ensure build succeeds
pnpm build

# Ensure no linting errors
pnpm lint
```

### 2. During Migration Testing

After each file change:

```bash
# Type check the changed file
pnpm check-types

# Lint the changed file
pnpm lint --fix

# Run related tests
pnpm test --testPathPattern=file-routes
```

### 3. Post-Migration Validation

After completing all changes:

```bash
# 1. Verify no console usage remains (should fail with new ESLint rule)
pnpm lint

# 2. Fix any ESLint errors
pnpm lint --fix

# 3. Run all tests
pnpm test

# 4. Test API endpoints
cd apps/api
pnpm test

# 5. Test web components
cd apps/web
pnpm test

# 6. Build everything
pnpm build

# 7. Manual testing
pnpm dev
```

### 4. Manual Testing Checklist

Start dev servers and test:

- [ ] API server starts without errors
- [ ] Check server logs show structured format
- [ ] Trigger API errors (invalid requests)
- [ ] Verify errors logged with context
- [ ] Test frontend errors (React Error Boundary)
- [ ] Verify client errors sent to server
- [ ] Check log output is JSON in production mode
- [ ] Check log output is pretty in development mode

### 5. Log Output Verification

**Development mode** (should be pretty printed):

```bash
NODE_ENV=development pnpm --filter @workspace/api dev
```

Expected output:

```
[12:34:56] INFO (app/1234): API server started on port 3300
  port: 3300
  environment: "development"
```

**Production mode** (should be JSON):

```bash
NODE_ENV=production pnpm --filter @workspace/api start
```

Expected output:

```json
{
  "level": "info",
  "time": "2025-11-05T12:34:56.789Z",
  "service": "app",
  "msg": "API server started on port 3300",
  "port": 3300
}
```

### 6. Error Simulation Tests

Create test cases to verify error logging:

```typescript
// Test file: apps/api/src/__tests__/logging.test.ts

import { logError } from "@workspace/observability";

describe("Structured Logging", () => {
  it("should log errors with context", () => {
    const error = new Error("Test error");
    const context = {
      operation: "testOperation",
      userId: "user_123",
    };

    // This should not throw
    expect(() => logError(error, context)).not.toThrow();
  });

  it("should handle errors without context", () => {
    const error = new Error("Test error");

    expect(() => logError(error)).not.toThrow();
  });
});
```

### 7. Regression Testing

Test critical user flows:

1. **User Sign Up**
   - Trigger error: Invalid email
   - Verify error logged with proper context

2. **File Creation**
   - Trigger error: Missing stash ID
   - Verify error logged with request context

3. **File Update**
   - Trigger error: File not found
   - Verify error logged with file ID

4. **Authentication**
   - Trigger error: Invalid session
   - Verify error logged with session info

---

## Implementation Timeline

### Phase 1: Infrastructure Setup (1 hour)

- [ ] Create `/home/user/promptstash/apps/web/lib/client-logger.ts`
- [ ] Create `/home/user/promptstash/apps/web/app/api/logging/client/route.ts`
- [ ] Update ESLint config to warn on console usage
- [ ] Run initial lint check to confirm baseline

**Deliverable**: Client logging infrastructure + ESLint warnings

---

### Phase 2: API Backend Migration (2-3 hours)

**Priority Order**:

1. **API Routes** (28 instances, ~1.5 hours)
   - [ ] file.routes.ts (8 instances)
   - [ ] stash.routes.ts (6 instances)
   - [ ] folder.routes.ts (4 instances)
   - [ ] tag.routes.ts (5 instances)
   - [ ] validate.routes.ts (5 instances)

2. **Middleware** (3 instances, ~20 minutes)
   - [ ] auth.ts (1 instance)
   - [ ] rate-limit.ts (1 instance)
   - [ ] performance.ts (1 instance)

3. **Configuration** (7 instances, ~30 minutes)
   - [ ] index.ts (3 instances)
   - [ ] config/env.ts (4 instances)

**Testing**: After each route file

- Run type check
- Run lint
- Test API endpoint manually

**Deliverable**: All API backend logging migrated

---

### Phase 3: Frontend Migration (2-3 hours)

**Priority Order**:

1. **Core Components** (11 instances, ~1 hour)
   - [ ] error-boundary.tsx (4 instances)
   - [ ] new-file-modal.tsx (1 instance)
   - [ ] new-folder-modal.tsx (1 instance)
   - [ ] file-editor.tsx (1 instance)
   - [ ] delete-account-form.tsx (1 instance)
   - [ ] credentials-form.tsx (1 instance)
   - [ ] password-form.tsx (2 instances)

2. **Auth Components** (4 instances, ~30 minutes)
   - [ ] two-factor-setup.tsx (3 instances)
   - [ ] two-factor-verification.tsx (1 instance)

3. **Utilities & Routes** (8 instances, ~45 minutes)
   - [ ] lib/csrf.ts (1 instance)
   - [ ] components/web-vitals.tsx (2 instances)
   - [ ] app/(auth)/forgot-password/page.tsx (1 instance)
   - [ ] app/(auth)/reset-password/page.tsx (1 instance)
   - [ ] app/(default)/(settings)/settings/general/page.tsx (1 instance)
   - [ ] app/api/analytics/web-vitals/route.ts (2 instances)
   - [ ] app/api/auth/password/route.ts (2 instances)

**Testing**: After each component

- Verify component compiles
- Test in browser (trigger errors)
- Verify logs appear in dev console
- Verify logs sent to server in production mode

**Deliverable**: All frontend logging migrated

---

### Phase 4: Shared Packages (1 hour)

1. **Auth Package** (3 instances, ~20 minutes)
   - [ ] packages/auth/src/server.ts

2. **Email Package** (5 instances, ~40 minutes)
   - [ ] packages/email/src/send-email.ts

**Testing**:

- Test email sending
- Test auth rate limiting
- Verify structured logs

**Deliverable**: All shared packages migrated

---

### Phase 5: Final Validation (1 hour)

1. **ESLint Configuration** (~15 minutes)
   - [ ] Change ESLint rule from "warn" to "error"
   - [ ] Run `pnpm lint` - should show 0 console errors
   - [ ] Fix any remaining violations

2. **Comprehensive Testing** (~30 minutes)
   - [ ] Run `pnpm test` - all tests pass
   - [ ] Run `pnpm build` - successful build
   - [ ] Start `pnpm dev` - verify startup logs
   - [ ] Test error scenarios in UI
   - [ ] Verify error logs in console (dev mode)
   - [ ] Check log format (JSON vs pretty)

3. **Documentation** (~15 minutes)
   - [ ] Update CLAUDE.md with logging guidelines
   - [ ] Document client-logger usage
   - [ ] Add examples to API documentation

**Deliverable**: Production-ready structured logging

---

### Total Estimated Time: **6-8 hours**

**Breakdown**:

- Infrastructure: 1 hour
- API Backend: 2-3 hours
- Frontend: 2-3 hours
- Shared Packages: 1 hour
- Validation & Documentation: 1 hour

**Risk Buffer**: Add 20% (1-2 hours) for:

- Unexpected edge cases
- Testing and debugging
- Code review iterations

**Recommended Approach**:

- Day 1: Phases 1-2 (Infrastructure + API Backend)
- Day 2: Phases 3-4 (Frontend + Packages)
- Day 3: Phase 5 (Validation & polish)

---

## Summary

### What This Achieves

✅ **Structured, searchable logs** in production
✅ **Consistent logging format** across API and web app
✅ **Request correlation** via requestId
✅ **User attribution** via userId
✅ **Error context** for debugging
✅ **Pretty logs** in development, JSON in production
✅ **Client-side logging** with server endpoint
✅ **ESLint enforcement** to prevent future console usage

### Key Files Created

1. `/home/user/promptstash/apps/web/lib/client-logger.ts` - Client logging utility
2. `/home/user/promptstash/apps/web/app/api/logging/client/route.ts` - Server logging endpoint

### Files Modified

- **28 API route files** - Replace console.error with logError
- **11 React components** - Replace console.error with logClientError
- **3 middleware files** - Add structured logging
- **2 config files** - Add structured startup/validation logs
- **2 shared packages** - Add structured logging
- **1 ESLint config** - Add no-console rule

### Total Changes

- **73 console statements** replaced
- **~50 files** modified
- **2 new files** created
- **1 ESLint rule** added

---

## Next Steps

1. **Review this plan** with the team
2. **Create a feature branch**: `feat/structured-logging-migration`
3. **Start with Phase 1**: Infrastructure setup
4. **Proceed sequentially** through phases
5. **Test thoroughly** after each phase
6. **Create PR** with detailed description
7. **Deploy to staging** first
8. **Monitor logs** in production
9. **Iterate** based on log analysis

---

## Additional Resources

- [Pino Documentation](https://getpino.io/)
- [Structured Logging Best Practices](https://www.datadoghq.com/knowledge-center/structured-logging/)
- [Log Levels Guide](https://betterstack.com/community/guides/logging/log-levels-explained/)
- [Request ID Tracing](https://blog.heroku.com/http_request_id_s_improve_visibility_across_the_application_stack)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-05
**Author**: Claude
**Status**: Ready for Implementation
