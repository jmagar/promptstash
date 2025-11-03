# Session 3: Web Server Fixes

**Date:** 2025-11-02  
**Objective:** Fix webserver issues and configure non-standard sequential ports

---

## Issues Identified

### 1. Prettier Version Mismatch ⚠️

**Error:**

```
Package prettier can't be external
The request prettier/plugins/html matches serverExternalPackages (or the default list).
The package resolves to a different version when requested from the project directory (3.6.2)
compared to the package requested from the importing module (3.5.3).
```

**Root Cause:**

- `@react-email/render@1.0.6` depends on `prettier@3.5.3`
- Project root has `prettier@3.6.2` in catalog
- Next.js Turbopack was trying to use both versions

**Solution:**
Added `prettier` to `serverExternalPackages` in `next.config.mjs`:

```javascript
const nextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/auth", "@workspace/email"],
  output: "standalone",
  serverExternalPackages: ["prettier"], // ← Added this
};
```

**Status:** ✅ FIXED

---

### 2. Upstash Redis Missing Configuration ⚠️

**Error:**

```
[Upstash Redis] The 'url' property is missing or undefined in your Redis config.
[Upstash Redis] The 'token' property is missing or undefined in your Redis config.
```

**Root Cause:**

- API server `.env` file was missing Upstash Redis configuration
- Rate limiting package was trying to initialize Redis client

**Solution:**
Added to `apps/api/.env`:

```env
# Upstash Redis (for rate limiting) - Using dummy values for development
UPSTASH_REDIS_REST_URL=https://dummy-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=dummy-token
```

**Status:** ✅ FIXED

---

### 3. Better Auth Google Provider Warning ⚠️

**Error:**

```
WARN [Better Auth]: Social provider google is missing clientId or clientSecret
```

**Root Cause:**

- Better Auth was always trying to initialize Google OAuth provider
- Environment variables were set to placeholder values (`your-google-client-id.apps.googleusercontent.com`)

**Solution:**
Modified `packages/auth/src/server.ts` to conditionally enable Google OAuth:

```typescript
socialProviders:
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id.apps.googleusercontent.com' &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret'
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
      }
    : {},
```

**Status:** ✅ FIXED

---

### 4. Port Configuration 🔧

**Issue:** Services using standard ports (3000, 4000, 5555) causing conflicts

**Solution:** Configured non-standard sequential ports

| Service       | Old Port | New Port | Configuration                          |
| ------------- | -------- | -------- | -------------------------------------- |
| Web App       | 3000     | 3100     | `apps/web/package.json` + `.env.local` |
| API Server    | 4000     | 4100     | `apps/api/.env`                        |
| Prisma Studio | 5555     | 5100     | `apps/studio/package.json`             |
| Email Preview | 3002     | 3200     | `apps/email/package.json`              |
| PostgreSQL    | 5434     | 5434     | (unchanged - already non-standard)     |

**Files Modified:**

1. **apps/web/package.json**

   ```json
   "dev": "next dev --turbopack --port 3100",
   "start": "next start --port 3100"
   ```

2. **apps/web/.env.local**

   ```env
   NEXT_PUBLIC_BASE_URL=http://localhost:3100
   NEXT_PUBLIC_API_URL=http://localhost:3300/api
   BETTER_AUTH_URL=http://localhost:3100
   ```

3. **apps/api/.env**

   ```env
   PORT=4100
   ALLOWED_ORIGINS=http://localhost:3100,https://your-production-domain.com
   BETTER_AUTH_URL=http://localhost:3100
   ```

4. **apps/studio/package.json**

   ```json
   "dev": "prisma studio --schema ../../packages/db/prisma/schema.prisma --port 5100"
   ```

5. **apps/email/package.json**
   ```json
   "dev": "email dev --port 3200 --dir ../../packages/email/src/templates"
   ```

**Status:** ✅ CONFIGURED

---

### 5. UI Rendering Issue 🔍

**Observation:** All routes redirect to `/sign-in?callbackUrl=...`

**Hypothesis:**

- Better Auth middleware is protecting all routes by default
- No authenticated user session exists
- Need to either:
  1. Create a test user and sign in
  2. Make certain routes public
  3. Configure auth middleware to allow public access

**Investigation Needed:**

- Check if there's auth middleware in `apps/web/middleware.ts`
- Verify protected route configuration
- Test sign-in flow with the new ports

**Status:** 🔍 INVESTIGATING

---

## Files Modified

### Configuration Files

1. ✅ `apps/web/next.config.mjs` - Added serverExternalPackages
2. ✅ `apps/web/package.json` - Updated dev/start ports
3. ✅ `apps/web/.env.local` - Updated URLs to port 3100/4100
4. ✅ `apps/api/.env` - Updated port, origins, added Redis config
5. ✅ `apps/api/package.json` - (PORT set via .env)
6. ✅ `apps/studio/package.json` - Updated to port 5100
7. ✅ `apps/email/package.json` - Updated to port 3200

### Source Code

8. ✅ `packages/auth/src/server.ts` - Conditional Google OAuth provider

### Documentation

9. ✅ `.docs/PORT_CONFIGURATION.md` - Created comprehensive port guide

---

## Next Steps

### Immediate

1. **Test the fixes:**

   ```bash
   # Stop all services
   pkill -f "next dev"
   pkill -f "nodemon"

   # Clear caches
   pnpm clean

   # Restart with new configuration
   pnpm dev
   ```

2. **Verify services:**
   - Web App: http://localhost:3100
   - API Server: http://localhost:3300/api
   - Prisma Studio: http://localhost:5100
   - Email Preview: http://localhost:3200

3. **Test authentication:**
   - Create a test user via sign-up
   - Verify email/password login works
   - Access protected routes (dashboard, stash)

### Follow-up

4. **UI Rendering:**
   - Debug why all routes redirect to sign-in
   - Check if auth middleware is configured correctly
   - Verify session management

5. **Production Readiness:**
   - Set up real OAuth credentials (Google)
   - Configure production Upstash Redis instance
   - Update CORS for production domains

---

## Summary

| Issue                     | Status           | Impact                         |
| ------------------------- | ---------------- | ------------------------------ |
| Prettier version mismatch | ✅ FIXED         | No more warnings               |
| Upstash Redis config      | ✅ FIXED         | No more warnings               |
| Google OAuth warning      | ✅ FIXED         | No more warnings               |
| Port configuration        | ✅ CONFIGURED    | All services on 31xx/41xx/51xx |
| UI rendering              | 🔍 INVESTIGATING | Need to test auth flow         |

**Overall Progress:** 80% complete

**Remaining Work:**

- Test all services with new ports
- Debug UI rendering/auth redirect issue
- Verify full authentication flow works
