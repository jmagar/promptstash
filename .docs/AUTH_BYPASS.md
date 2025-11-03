# Authentication Bypass for Development

**Updated:** 2025-11-02

## Quick Toggle

### Disable Authentication (Current Setting)
```bash
# In apps/web/.env.local
NEXT_PUBLIC_DISABLE_AUTH=true
```

When enabled, all protected routes will use a mock user:
- **ID:** `dev-user-123`
- **Name:** Dev User
- **Email:** dev@promptstash.local
- **Email Verified:** Yes

### Re-enable Authentication
```bash
# In apps/web/.env.local
NEXT_PUBLIC_DISABLE_AUTH=false
# or simply remove/comment out the line
```

## How It Works

The bypass is implemented in `apps/web/hooks/use-auth-user.ts`:

```typescript
export function useRequiredAuthUser() {
  // AUTH BYPASS for development - remove in production!
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
    const mockUser = {
      id: 'dev-user-123',
      name: 'Dev User',
      email: 'dev@promptstash.local',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return {
      user: mockUser,
      isLoading: false,
      error: null,
      refetch: async () => ({ data: null }),
    };
  }
  
  // ... normal auth flow continues
}
```

## When to Use

### ✅ Use Auth Bypass When:
- Developing UI/UX without needing real auth
- Testing protected routes quickly
- Working on features that don't involve user-specific data
- Running integration tests
- Demonstrating features without sign-in

### ❌ Don't Use Auth Bypass When:
- Testing actual authentication flows (sign-up, sign-in, password reset)
- Testing user-specific permissions
- Working on multi-user features
- Testing OAuth integration
- Preparing for production deployment

## Affected Routes

When auth is bypassed, these routes become accessible without sign-in:

### Protected Routes
- `/dashboard` - User dashboard
- `/profile` - User profile page
- `/stash` - PromptStash file manager
- `/settings/general` - General settings
- `/settings/security` - Security settings (2FA, password)

### Still Public Routes
- `/` - Landing page
- `/sign-in` - Sign in page (still accessible, but not required)
- `/sign-up` - Sign up page (still accessible, but not required)
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset form

## API Considerations

⚠️ **Important:** This bypass only affects the **frontend** authentication checks.

The **API server** still requires proper authentication for protected endpoints.

### What This Means:

1. **Frontend routes work** - You can access protected pages
2. **UI components render** - User-dependent UI shows mock user
3. **API calls may fail** - Backend still validates real sessions

### To Fully Bypass Auth (Not Recommended):

If you need to bypass API auth too (e.g., for testing):

1. Comment out auth middleware in API routes
2. Or add a similar bypass in `packages/auth/src/server.ts`
3. **NEVER commit this to production!**

## Testing Authentication

When you're ready to test real authentication:

1. **Disable the bypass:**
   ```bash
   # apps/web/.env.local
   NEXT_PUBLIC_DISABLE_AUTH=false
   ```

2. **Restart the dev server:**
   ```bash
   pkill -f "next dev"
   pnpm --filter web dev
   ```

3. **Create a test user:**
   - Navigate to http://localhost:3100/sign-up
   - Fill in details
   - Complete email verification (if configured)

4. **Test sign-in flow:**
   - Navigate to http://localhost:3100/sign-in
   - Use created credentials
   - Verify redirect to dashboard

5. **Test protected routes:**
   - While signed in, access /dashboard, /stash, /profile
   - Sign out and verify redirect to /sign-in

## Production Deployment

🚨 **CRITICAL:** Before deploying to production:

### Checklist:

- [ ] Set `NEXT_PUBLIC_DISABLE_AUTH=false` (or remove it)
- [ ] Test authentication flow in production environment
- [ ] Verify all protected routes require sign-in
- [ ] Test with multiple user accounts
- [ ] Verify session persistence
- [ ] Test sign-out functionality
- [ ] Review `apps/web/hooks/use-auth-user.ts` for any dev-only code

### Verification Command:

```bash
# Check that bypass is disabled
grep NEXT_PUBLIC_DISABLE_AUTH apps/web/.env.production

# Should return nothing or "false"
```

### Optional: Remove Bypass Code Entirely

For production, you may want to remove the bypass code completely:

```typescript
// In apps/web/hooks/use-auth-user.ts
export function useRequiredAuthUser() {
  // Delete the entire if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') block
  
  const { user, isLoading, isAuthenticated, error, refetch } = useAuthUser({
    redirectOnUnauthenticated: true,
  });
  
  // ... rest of the function
}
```

## Troubleshooting

### Issue: Auth bypass not working

**Symptoms:** Still redirecting to /sign-in even with `NEXT_PUBLIC_DISABLE_AUTH=true`

**Solutions:**

1. **Restart the dev server:**
   ```bash
   pkill -f "next dev"
   pnpm --filter web dev
   ```

2. **Verify environment variable:**
   ```bash
   grep NEXT_PUBLIC_DISABLE_AUTH apps/web/.env.local
   # Should show: NEXT_PUBLIC_DISABLE_AUTH=true
   ```

3. **Check browser console:**
   - Open DevTools
   - Check if `process.env.NEXT_PUBLIC_DISABLE_AUTH` is 'true'
   - Add console.log in the hook to debug

4. **Clear Next.js cache:**
   ```bash
   rm -rf apps/web/.next
   pnpm --filter web dev
   ```

### Issue: API calls failing with auth bypass

**Symptoms:** Frontend loads but API requests return 401 Unauthorized

**Explanation:** Frontend bypass doesn't affect backend authentication

**Solutions:**

**Option 1: Create a real user and sign in**
- Most realistic approach
- Tests full auth flow
- Best for integration testing

**Option 2: Mock API responses (for pure UI dev)**
- Use MSW (Mock Service Worker)
- Or create mock API client
- Good for isolated frontend development

**Option 3: Temporarily disable API auth (dangerous!)**
- Only for local development
- Never commit to git
- Re-enable before testing or deploying

### Issue: Mock user doesn't have required properties

**Symptoms:** Components expecting user data show errors or undefined

**Solution:** Update the mock user in `use-auth-user.ts`:

```typescript
const mockUser: AuthUser = {
  id: 'dev-user-123',
  name: 'Dev User',
  email: 'dev@promptstash.local',
  emailVerified: true,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  // Add any additional properties your app needs
  role: 'admin',  // example
  preferences: {}, // example
};
```

## Best Practices

1. **Use bypass for UI development only**
2. **Test with real auth before merging to main**
3. **Document when bypass is active in your team**
4. **Set bypass to false in production .env files**
5. **Consider removing bypass code before production release**
6. **Use feature flags for more granular control** (optional)

## Alternative: Feature Flags

For more sophisticated control, consider using a feature flag system:

```typescript
// config/features.ts
export const features = {
  authBypass: process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true',
  debugMode: process.env.NEXT_PUBLIC_DEBUG === 'true',
  // ... other flags
};

// In your hook
import { features } from '@/config/features';

if (features.authBypass) {
  // ... bypass logic
}
```

## Summary

| Setting | Routes Accessible | API Auth | Use Case |
|---------|-------------------|----------|----------|
| `NEXT_PUBLIC_DISABLE_AUTH=true` | All | ❌ Still enforced | UI development |
| `NEXT_PUBLIC_DISABLE_AUTH=false` | Public only | ✅ Enforced | Normal development |
| Production | Public only | ✅ Enforced | Live app |

**Current Status:** ✅ Auth bypass **ENABLED** (`NEXT_PUBLIC_DISABLE_AUTH=true`)
