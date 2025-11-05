# Structured Logging Quick Reference

**Quick guide for developers** - Bookmark this page!

---

## Import Statements

### Backend (API, Server-side)

```typescript
import {
  logger,
  logError,
  logRequest,
  logQuery,
} from "@workspace/observability";
```

### Frontend (React Components)

```typescript
import { logClientError, logClientInfo } from "@/lib/client-logger";
```

---

## Common Patterns

### 1. API Route Error Handling

```typescript
router.post("/api/resource", async (req: Request, res: Response) => {
  try {
    // Your route logic
  } catch (error) {
    logError(error as Error, {
      operation: "createResource",
      requestId: req.requestId,
      userId: req.user?.id,
      path: req.path,
      method: req.method,
    });
    res.status(500).json({ error: "Failed to create resource" });
  }
});
```

### 2. Frontend Component Error

```typescript
async function handleSubmit() {
  try {
    await saveData();
  } catch (error) {
    logClientError("Error saving data", error, {
      component: "MyComponent",
      action: "saveData",
    });
    toast.error("Failed to save");
  }
}
```

### 3. Startup/Info Logging

```typescript
logger.info(
  {
    port: PORT,
    environment: process.env.NODE_ENV,
  },
  `Server started on port ${PORT}`,
);
```

### 4. Warning Logging

```typescript
logger.warn(
  {
    duration: 5000,
    threshold: 3000,
    path: req.path,
  },
  "Slow request detected",
);
```

### 5. Debug Logging (Dev Only)

```typescript
logger.debug(
  {
    query: "findMany",
    model: "User",
  },
  "Database query executed",
);
```

---

## Context Fields

### API Routes - Always Include

| Field       | Type   | Example         | Required        |
| ----------- | ------ | --------------- | --------------- |
| `operation` | string | `'createFile'`  | ✅ Yes          |
| `requestId` | string | `req.requestId` | ✅ Yes          |
| `userId`    | string | `req.user?.id`  | ⚠️ If available |
| `path`      | string | `req.path`      | ✅ Yes          |
| `method`    | string | `req.method`    | ✅ Yes          |

### Frontend - Always Include

| Field       | Type   | Example          | Required |
| ----------- | ------ | ---------------- | -------- |
| `component` | string | `'NewFileModal'` | ✅ Yes   |
| `action`    | string | `'createFile'`   | ✅ Yes   |

### Additional Context (Operation-Specific)

```typescript
// File operations
{
  fileId: file.id,
  fileName: file.name,
  stashId: stash.id,
}

// Authentication
{
  email: user.email,
  method: 'password',
}

// Database queries
{
  model: 'User',
  query: 'findUnique',
  duration: 123,
}
```

---

## Log Levels

| Level     | When to Use          | Example                           |
| --------- | -------------------- | --------------------------------- |
| **fatal** | Application crash    | Database connection lost          |
| **error** | Unhandled exceptions | API request failed                |
| **warn**  | Recoverable issues   | Slow query, rate limit hit        |
| **info**  | Normal operations    | Request succeeded, user logged in |
| **debug** | Development info     | Query details, variable values    |
| **trace** | Very detailed        | Function entry/exit               |

---

## Anti-Patterns (Don't Do This!)

### ❌ Bad: Using console.log

```typescript
console.log("User logged in:", userId);
```

### ✅ Good: Using logger

```typescript
logger.info({ userId }, "User logged in");
```

---

### ❌ Bad: Missing context

```typescript
logError(error, {});
```

### ✅ Good: Rich context

```typescript
logError(error, {
  operation: "createFile",
  requestId: req.requestId,
  userId: req.user?.id,
});
```

---

### ❌ Bad: Logging sensitive data

```typescript
logError(error, {
  password: req.body.password, // ⚠️ Never log passwords!
});
```

### ✅ Good: Redacting sensitive data

```typescript
logError(error, {
  email: req.body.email,
  // password omitted
});
```

---

### ❌ Bad: Logging in loops

```typescript
items.forEach((item) => {
  logger.info({ item }, "Processing item");
});
```

### ✅ Good: Summary logging

```typescript
logger.info({ itemCount: items.length }, "Processing items");
// ... process items ...
logger.info({ itemCount: items.length }, "Completed processing");
```

---

## Environment-Specific Behavior

### Development Mode

- Pretty printed, colorized output
- All log levels visible
- Includes stack traces

```
[12:34:56] ERROR (app/1234): Error creating file
  operation: "createFile"
  userId: "user_123"
  err: {
    message: "File already exists"
    stack: "Error: File already exists\n  at ..."
  }
```

### Production Mode

- JSON output for log aggregation
- Info level and above (configurable)
- Structured for parsing

```json
{
  "level": "error",
  "time": "2025-11-05T12:34:56.789Z",
  "service": "app",
  "operation": "createFile",
  "userId": "user_123",
  "err": {
    "message": "File already exists"
  },
  "msg": "Error creating file"
}
```

---

## Special Cases

### React Error Boundary

```typescript
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  logClientError('React error boundary', error, {
    component: 'ErrorBoundary',
    componentStack: errorInfo.componentStack,
  });
}
```

### Next.js API Route

```typescript
export async function POST(request: Request) {
  try {
    // ...
  } catch (error) {
    logError(error as Error, {
      route: "/api/endpoint",
      method: "POST",
    });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

### Middleware

```typescript
export const myMiddleware = async (req, res, next) => {
  try {
    // ...
  } catch (error) {
    logError(error as Error, {
      middleware: "myMiddleware",
      requestId: req.requestId,
      path: req.path,
    });
    next(error);
  }
};
```

---

## Testing Logs

### View Logs in Development

```bash
# Start API server
pnpm --filter @workspace/api dev

# Logs will appear in console (pretty format)
```

### View Logs in Production

```bash
# Start in production mode
NODE_ENV=production pnpm --filter @workspace/api start

# Logs will be JSON format
# Pipe to jq for pretty viewing:
NODE_ENV=production pnpm --filter @workspace/api start | jq
```

### Check for Console Usage

```bash
# ESLint will catch console usage
pnpm lint

# Should show errors if console.log/error/warn used
```

---

## Configuration

### Set Log Level

```bash
# .env
LOG_LEVEL=debug  # trace | debug | info | warn | error | fatal
```

### Enable Client Logging (Production)

```bash
# apps/web/.env.local
NEXT_PUBLIC_ENABLE_CLIENT_LOGGING=true
```

---

## Useful Commands

```bash
# Check for remaining console usage
grep -r "console\." apps/ packages/ --include="*.ts" --include="*.tsx"

# Count console usage
grep -r "console\." apps/ packages/ --include="*.ts" --include="*.tsx" | wc -l

# Run migration script (dry run)
./scripts/migrate-logging.sh --dry-run

# Lint check
pnpm lint

# Type check
pnpm check-types

# Test everything
pnpm test
```

---

## Troubleshooting

### Import Error: Cannot find module '@workspace/observability'

**Solution**: Ensure package is built

```bash
pnpm --filter @workspace/observability build
```

### Import Error in Frontend: Cannot find '@/lib/client-logger'

**Solution**: Create the client logger file first

```bash
# See migration plan for full file content
touch apps/web/lib/client-logger.ts
```

### Logs Not Appearing

**Check**:

1. LOG_LEVEL environment variable
2. Logger is imported correctly
3. Development vs production mode
4. Console output vs file output

---

## Complete Examples

### API Route with Full Context

```typescript
import { logError, logger } from "@workspace/observability";

router.post("/api/files", async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { name, content, fileType, stashId } = req.body;
    const userId = req.user?.id;

    logger.info(
      {
        operation: "createFile",
        userId,
        fileType,
        requestId: req.requestId,
      },
      "Creating file",
    );

    // ... create file logic ...

    const duration = Date.now() - startTime;

    logger.info(
      {
        operation: "createFile",
        userId,
        fileId: file.id,
        duration,
        requestId: req.requestId,
      },
      `File created successfully (${duration}ms)`,
    );

    res.status(201).json({ file });
  } catch (error) {
    const duration = Date.now() - startTime;

    logError(error as Error, {
      operation: "createFile",
      userId: req.user?.id,
      requestId: req.requestId,
      duration,
      requestBody: {
        name: req.body.name,
        fileType: req.body.fileType,
        // content omitted for size
      },
    });

    res.status(500).json({ error: "Failed to create file" });
  }
});
```

### React Component with Full Error Handling

```typescript
'use client';

import { useState } from 'react';
import { logClientError, logClientInfo } from '@/lib/client-logger';
import { toast } from 'sonner';

export function FileUploadComponent() {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);

    logClientInfo('Starting file upload', {
      component: 'FileUploadComponent',
      action: 'uploadStart',
      fileName: file.name,
      fileSize: file.size,
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      logClientInfo('File upload successful', {
        component: 'FileUploadComponent',
        action: 'uploadComplete',
        fileName: file.name,
      });

      toast.success('File uploaded successfully!');

    } catch (error) {
      logClientError('File upload failed', error, {
        component: 'FileUploadComponent',
        action: 'upload',
        fileName: file.name,
        fileSize: file.size,
      });

      toast.error('Failed to upload file. Please try again.');

    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {/* Upload UI */}
    </div>
  );
}
```

---

## Migration Checklist

When replacing console statements:

- [ ] Import correct logger (`logger` or `logClientError`)
- [ ] Add `operation` field (API) or `component` field (frontend)
- [ ] Add `requestId` and `userId` (API routes)
- [ ] Add `action` field (frontend)
- [ ] Include relevant resource IDs
- [ ] Remove sensitive data (passwords, tokens)
- [ ] Use appropriate log level
- [ ] Test the endpoint/component
- [ ] Verify logs appear in console
- [ ] Verify logs have correct structure

---

**Pro Tip**: Use logger.child() for service-specific logging

```typescript
import { createChildLogger } from "@workspace/observability";

const emailLogger = createChildLogger({ service: "email" });

// All logs automatically include service: 'email'
emailLogger.info("Sending email");
emailLogger.error("Email failed");
```

---

**Full Documentation**: See `.docs/STRUCTURED_LOGGING_MIGRATION_PLAN.md`

**Last Updated**: 2025-11-05
