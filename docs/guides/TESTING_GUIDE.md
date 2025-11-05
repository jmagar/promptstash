# Testing Guide - Post Session 3 Fixes

**Date:** 2025-11-02

## Quick Start

### 1. Stop All Running Services

```bash
# Kill Next.js dev server
pkill -f "next dev"

# Kill API server
pkill -f "nodemon"

# Kill Prisma Studio
pkill -f "prisma studio"

# Kill Email preview
pkill -f "email dev"

# Or kill all node processes (use with caution)
# pkill -f node
```

### 2. Clean Build Artifacts

```bash
cd /home/jmagar/code/promptstash
pnpm clean
```

### 3. Verify Environment Files

```bash
# Check web app .env.local
cat apps/web/.env.local | grep -E "(PORT|URL|BETTER_AUTH)"

# Should show:
# BETTER_AUTH_URL=http://localhost:3100
# NEXT_PUBLIC_BASE_URL=http://localhost:3100
# NEXT_PUBLIC_API_URL=http://localhost:3300/api

# Check API .env
cat apps/api/.env | grep -E "(PORT|ALLOWED_ORIGINS|UPSTASH)"

# Should show:
# PORT=4100
# ALLOWED_ORIGINS=http://localhost:3100,...
# UPSTASH_REDIS_REST_URL=https://dummy-redis.upstash.io
# UPSTASH_REDIS_REST_TOKEN=dummy-token
```

### 4. Start All Services

```bash
pnpm dev
```

### 5. Verify Services are Running

Open these URLs in your browser:

| Service       | URL                   | Expected Result                     |
| ------------- | --------------------- | ----------------------------------- |
| Web App       | http://localhost:3100 | PromptStash landing page or sign-in |
| API Health    | http://localhost:3300 | JSON response or 404 (expected)     |
| Prisma Studio | http://localhost:3400 | Database admin interface            |
| Email Preview | http://localhost:3200 | Email templates list                |

## Detailed Testing

### Test 1: Check Logs for Warnings

**What to Check:**

- ✅ NO prettier version mismatch warnings
- ✅ NO Upstash Redis missing URL/token warnings
- ✅ NO Better Auth Google provider warnings

**How to Check:**

```bash
# Watch the terminal output when running pnpm dev
# Look for these specific error patterns (should NOT appear):
# - "Package prettier can't be external"
# - "[Upstash Redis] The 'url' property is missing"
# - "[Better Auth]: Social provider google is missing"
```

**Expected Output:**

```
┌─ web#dev
   ▲ Next.js 16.0.0 (Turbopack)
   - Local:        http://localhost:3100
   - Network:      http://10.x.x.x:3100
   ✓ Ready in X.Xs

┌─ api#dev
[dotenv] injecting env (X) from .env
🚀 API server running on http://localhost:3300

┌─ studio#dev
Prisma Studio is up on http://localhost:5100

┌─ email#dev
React Email 4.3.0
Running preview at: http://localhost:3200
```

### Test 2: Port Configuration

**Command:**

```bash
lsof -i :3100 -i :3300 -i :5100 -i :3200
```

**Expected Output:**

```
COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
node    xxxxx jmagar   XX  IPv4 xxxxxx      0t0  TCP *:3100 (LISTEN)
node    xxxxx jmagar   XX  IPv4 xxxxxx      0t0  TCP *:3300 (LISTEN)
node    xxxxx jmagar   XX  IPv4 xxxxxx      0t0  TCP *:5100 (LISTEN)
node    xxxxx jmagar   XX  IPv4 xxxxxx      0t0  TCP *:3200 (LISTEN)
```

### Test 3: API Connectivity

**Test CORS:**

```bash
curl -H "Origin: http://localhost:3100" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     -v \
     http://localhost:3300/api/health 2>&1 | grep -i "access-control"
```

**Expected:**
Should include CORS headers like:

```
< Access-Control-Allow-Origin: http://localhost:3100
< Access-Control-Allow-Credentials: true
```

### Test 4: Database Connection

**Via Prisma Studio:**

1. Open http://localhost:5100
2. You should see the database schema tables:
   - User
   - Session
   - Account
   - Verification
   - TwoFactor
   - Stash
   - Folder
   - File
   - Tag
   - etc.

**Via API:**

```bash
# This should work if database is connected
curl http://localhost:3300/api/stashes
```

### Test 5: Authentication Flow

**1. Sign Up:**
Navigate to: http://localhost:3100/sign-up

Fill in:

- Name: Test User
- Email: test@example.com
- Password: TestPassword123!

**Expected:**

- Should create user
- May show email verification page (if email service configured)
- Or redirect to dashboard

**2. Sign In:**
Navigate to: http://localhost:3100/sign-in

Use credentials from sign-up.

**Expected:**

- Should authenticate successfully
- Redirect to dashboard or home page
- Session cookie should be set

**3. Protected Routes:**
Try accessing:

- http://localhost:3100/dashboard
- http://localhost:3100/stash
- http://localhost:3100/profile

**Expected:**

- If not signed in: Redirect to /sign-in
- If signed in: Show the respective page

### Test 6: Email Templates

**View Templates:**

1. Open http://localhost:3200
2. Should see list of templates:
   - verify-email
   - reset-password
   - change-email
   - welcome (if exists)

**Test Rendering:**

- Click on any template
- Should render preview with sample data
- No console errors

### Test 7: Prisma Client Generation

**Rebuild Prisma Client:**

```bash
pnpm --filter @workspace/db db:generate
```

**Expected:**

```
✔ Generated Prisma Client to ./generated in XXXms
```

**Check Generated Files:**

```bash
ls -la packages/db/generated/
```

Should show Prisma client files.

## Troubleshooting

### Issue: Port Already in Use

**Error:** `Port 3100 is already in use`

**Solution:**

```bash
# Find process using the port
lsof -i :3100

# Kill the process
kill -9 <PID>

# Or kill all node processes
pkill -f node
```

### Issue: Database Connection Error

**Error:** `Can't reach database server at localhost:3500`

**Solution:**

```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# If not running, start it
docker compose -f docker-compose.dev.yml up -d postgres

# Verify connection
psql postgresql://promptstash:promptstash_dev_password@localhost:3500/promptstash -c "SELECT 1;"
```

### Issue: CORS Error in Browser

**Error:** `Access to fetch at 'http://localhost:3300/api/...' from origin 'http://localhost:3100' has been blocked by CORS`

**Check:**

```bash
# Verify ALLOWED_ORIGINS in API .env
cat apps/api/.env | grep ALLOWED_ORIGINS
```

**Should include:** `http://localhost:3100`

**Fix if needed:**

```bash
# Edit apps/api/.env and add:
ALLOWED_ORIGINS=http://localhost:3100,https://your-production-domain.com
```

### Issue: Better Auth Session Not Working

**Symptoms:**

- Can't sign in
- Redirects to sign-in repeatedly
- Session not persisting

**Check:**

1. Verify `BETTER_AUTH_URL` matches in both .env files:

   ```bash
   grep BETTER_AUTH_URL apps/web/.env.local apps/api/.env
   ```

   Both should be: `http://localhost:3100`

2. Verify `BETTER_AUTH_SECRET` matches:

   ```bash
   grep BETTER_AUTH_SECRET apps/web/.env.local apps/api/.env
   ```

   Should be the same 32-byte hex string

3. Clear browser cookies and try again

### Issue: Module Not Found Errors

**Error:** `Module not found: Can't resolve '@workspace/...'`

**Solution:**

```bash
# Reinstall dependencies
pnpm install

# Generate Prisma client
pnpm --filter @workspace/db db:generate

# Clean and rebuild
pnpm clean
pnpm build
```

## Success Criteria

All tests pass when:

- ✅ All services start without warnings
- ✅ No Prettier version mismatch errors
- ✅ No Upstash Redis configuration warnings
- ✅ No Better Auth Google provider warnings
- ✅ All services accessible on correct ports (3100, 4100, 5100, 3200)
- ✅ Prisma Studio shows database schema
- ✅ CORS configured correctly
- ✅ Can sign up and sign in
- ✅ Protected routes require authentication
- ✅ Email templates render in preview

## Next Steps After Successful Testing

1. **Configure Real Services:**
   - Set up real Google OAuth credentials
   - Set up Upstash Redis account
   - Set up Resend email account

2. **Add Test Data:**
   - Create sample stashes
   - Add sample files and folders
   - Test full CRUD operations

3. **UI Development:**
   - Test PromptStash features
   - Verify file grid renders
   - Test file editor
   - Test folder navigation

4. **Performance:**
   - Check HMR (Hot Module Replacement) works
   - Verify Turbopack compilation is fast
   - Check API response times
