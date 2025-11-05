# Structured Logging Migration - Implementation Checklist

**Use this checklist to track progress during implementation**

---

## Pre-Flight Checks

- [ ] Read `.docs/STRUCTURED_LOGGING_MIGRATION_PLAN.md` (complete guide)
- [ ] Review `.docs/LOGGING_QUICK_REFERENCE.md` (developer reference)
- [ ] Review `.docs/LOGGING_MIGRATION_SUMMARY.md` (overview)
- [ ] Create feature branch: `feat/structured-logging-migration`
- [ ] Ensure all tests pass: `pnpm test`
- [ ] Ensure build succeeds: `pnpm build`

---

## Phase 1: Infrastructure Setup ⏱️ 1 hour

### Create Client Logger Utility

- [ ] Create file: `apps/web/lib/client-logger.ts`
  - [ ] Copy implementation from migration plan
  - [ ] Add TypeScript types
  - [ ] Export `logClientError`, `logClientInfo`, `logClientWarn`
  - [ ] Test: `pnpm --filter @workspace/web check-types`

### Create Server Logging Endpoint

- [ ] Create file: `apps/web/app/api/logging/client/route.ts`
  - [ ] Copy implementation from migration plan
  - [ ] Import `@workspace/observability`
  - [ ] Handle POST requests
  - [ ] Test: `pnpm --filter @workspace/web check-types`

### Update ESLint Configuration (Warning Mode)

- [ ] Edit: `packages/eslint-config/base.js`
  - [ ] Add no-console rule with "warn" level
  - [ ] Add ignore patterns for seed.ts and tests
  - [ ] Test: `pnpm lint` (should show warnings)

### Verify Infrastructure

- [ ] Start dev servers: `pnpm dev`
- [ ] Test client logger in browser console
- [ ] Trigger test error in component
- [ ] Verify log appears in browser console (dev)
- [ ] Check server endpoint receives logs

**Phase 1 Deliverable**: ✅ Working client logging system

---

## Phase 2: API Backend Migration ⏱️ 2-3 hours

### API Routes (28 instances)

#### file.routes.ts (8 instances)

- [ ] Line 58: GET error → `logError` with fileId context
- [ ] Line 127: POST auth failure → `logger.error` with auth context
- [ ] Lines 246-251: POST error → `logError` with requestBody context
- [ ] Line 374: PUT error → `logError` with fileId context
- [ ] Line 412: DELETE error → `logError` with fileId context
- [ ] Line 451: GET versions error → `logError` with fileId context
- [ ] Line 523: POST revert error → `logError` with versionId context
- [ ] Add import: `import { logger, logError } from '@workspace/observability';`
- [ ] Test: Manual API testing for each endpoint
- [ ] Verify: Check logs include requestId, userId, operation

#### stash.routes.ts (6 instances)

- [ ] Line 99: GET all → `logError` with userId context
- [ ] Line 160: GET one → `logError` with stashId context
- [ ] Line 190: POST → `logError` with stashName context
- [ ] Line 230: PUT → `logError` with stashId context
- [ ] Line 264: DELETE → `logError` with stashId context
- [ ] Line 375: GET files → `logError` with query context
- [ ] Add import: `import { logError } from '@workspace/observability';`
- [ ] Test: Manual API testing
- [ ] Verify: Logs include proper context

#### folder.routes.ts (4 instances)

- [ ] Line 71: GET → `logError` with folderId context
- [ ] Line 146: POST → `logError` with folderName, parentId context
- [ ] Line 189: PUT → `logError` with folderId context
- [ ] Line 228: DELETE → `logError` with folderId context
- [ ] Add import: `import { logError } from '@workspace/observability';`
- [ ] Test: Manual API testing
- [ ] Verify: Logs include proper context

#### tag.routes.ts (5 instances)

- [ ] Line 27: GET all → `logError` with userId context
- [ ] Line 68: GET one → `logError` with tagId context
- [ ] Line 114: POST → `logError` with tagName context
- [ ] Line 174: PUT → `logError` with tagId context
- [ ] Line 203: DELETE → `logError` with tagId context
- [ ] Add import: `import { logError } from '@workspace/observability';`
- [ ] Test: Manual API testing
- [ ] Verify: Logs include proper context

#### validate.routes.ts (5 instances)

- [ ] Line 30: POST agent → `logError` with filename context
- [ ] Line 53: POST skill → `logError` with path context
- [ ] Line 76: POST MCP → `logError` with operation context
- [ ] Line 99: POST hooks → `logError` with operation context
- [ ] Line 122: POST hook output → `logError` with operation context
- [ ] Add import: `import { logError } from '@workspace/observability';`
- [ ] Test: Call validation endpoints
- [ ] Verify: Logs include proper context

### Middleware (3 instances)

#### auth.ts (1 instance)

- [ ] Line 21: Session error → `logError` with requestId, path context
- [ ] Add import: `import { logError } from '@workspace/observability';`
- [ ] Test: Trigger auth error
- [ ] Verify: Log includes middleware name

#### rate-limit.ts (1 instance)

- [ ] Line 70: Rate limit error → `logError` with requestId, ip context
- [ ] Add import: `import { logError } from '@workspace/observability';`
- [ ] Test: Trigger rate limit
- [ ] Verify: Log includes middleware name

#### performance.ts (1 instance)

- [ ] Line 69: Slow request → `logger.warn` with duration, threshold context
- [ ] Add import: `import { logger } from '@workspace/observability';`
- [ ] Test: Trigger slow request (if possible)
- [ ] Verify: Log includes request details

### Configuration (7 instances)

#### index.ts (3 instances)

- [ ] Lines 17-19: Startup messages → `logger.info` with port, env, origins
- [ ] Add import: `import { logger } from '@workspace/observability';`
- [ ] Test: Restart server
- [ ] Verify: Single structured startup log

#### config/env.ts (4 instances)

- [ ] Line 64: Success → `logger.info` with validatedKeys
- [ ] Lines 68-70: Validation errors → `logger.error` with errors array
- [ ] Add import: `import { logger } from '@workspace/observability';`
- [ ] Test: Restart with invalid env (temporarily)
- [ ] Verify: Structured error logs

### Phase 2 Testing

- [ ] Run: `pnpm --filter @workspace/api test`
- [ ] Run: `pnpm --filter @workspace/api build`
- [ ] Manual testing: Test each API endpoint
- [ ] Check logs: Verify structured format
- [ ] Check context: Verify requestId, userId present
- [ ] Run: `pnpm lint` (check warnings decreased)

**Phase 2 Deliverable**: ✅ All API backend logging migrated

---

## Phase 3: Frontend Migration ⏱️ 2-3 hours

### Core Components (11 instances)

#### error-boundary.tsx (4 instances)

- [ ] Lines 39-46: Component errors → `logClientError`
- [ ] Add import: `import { logClientError } from '@/lib/client-logger';`
- [ ] Test: Trigger React error
- [ ] Verify: Log sent to server endpoint

#### new-file-modal.tsx (1 instance)

- [ ] Line 126: Create error → `logClientError` with fileType context
- [ ] Add import: `import { logClientError } from '@/lib/client-logger';`
- [ ] Test: Trigger file creation error
- [ ] Verify: Log includes component, action

#### new-folder-modal.tsx (1 instance)

- [ ] Line 85: Create error → `logClientError`
- [ ] Add import: `import { logClientError } from '@/lib/client-logger';`
- [ ] Test: Trigger folder creation error
- [ ] Verify: Log includes component, action

#### file-editor.tsx (1 instance)

- [ ] Line 72: Save error → `logClientError` with fileId context
- [ ] Add import: `import { logClientError } from '@/lib/client-logger';`
- [ ] Test: Trigger save error
- [ ] Verify: Log includes fileId

#### delete-account-form.tsx (1 instance)

- [ ] Line 80: Delete error → `logClientError`
- [ ] Add import: `import { logClientError } from '@/lib/client-logger';`
- [ ] Test: Trigger deletion error
- [ ] Verify: Log sent to server

#### credentials-form.tsx (1 instance)

- [ ] Line 72: Verification error → `logClientError`
- [ ] Add import: `import { logClientError } from '@/lib/client-logger';`
- [ ] Test: Trigger verification error
- [ ] Verify: Log sent to server

#### password-form.tsx (2 instances)

- [ ] Line 74: Set password error → `logClientError`
- [ ] Line 93: Change password error → `logClientError`
- [ ] Add import: `import { logClientError } from '@/lib/client-logger';`
- [ ] Test: Trigger password errors
- [ ] Verify: Both actions logged separately

#### two-factor-setup.tsx (3 instances)

- [ ] Line 71: Enable 2FA → `logClientError`
- [ ] Line 89: Verify 2FA → `logClientError`
- [ ] Line 110: Disable 2FA → `logClientError`
- [ ] Add import: `import { logClientError } from '@/lib/client-logger';`
- [ ] Test: Trigger 2FA errors
- [ ] Verify: All actions logged

#### two-factor-verification.tsx (1 instance)

- [ ] Line 52: Verify error → `logClientError`
- [ ] Add import: `import { logClientError } from '@/lib/client-logger';`
- [ ] Test: Trigger verification error
- [ ] Verify: Log sent to server

#### lib/csrf.ts (1 instance)

- [ ] Line 44: CSRF error → `logClientError`
- [ ] Add import: `import { logClientError } from '@/lib/client-logger';`
- [ ] Test: Trigger CSRF error (if possible)
- [ ] Verify: Log includes action

#### web-vitals.tsx (2 instances)

- [ ] Line 21: Metrics → `logClientInfo`
- [ ] Line 51: Send error → `logClientError`
- [ ] Add imports: `import { logClientError, logClientInfo } from '@/lib/client-logger';`
- [ ] Test: Trigger page load
- [ ] Verify: Vitals logged

### Web App Routes (8 instances)

#### (auth)/forgot-password/page.tsx (1 instance)

- [ ] Line 63: Reset email error → `logClientError`
- [ ] Add import: `import { logClientError } from '@/lib/client-logger';`
- [ ] Test: Trigger reset error
- [ ] Verify: Log sent to server

#### (auth)/reset-password/page.tsx (1 instance)

- [ ] Line 85: Reset error → `logClientError`
- [ ] Add import: `import { logClientError } from '@/lib/client-logger';`
- [ ] Test: Trigger reset error
- [ ] Verify: Log sent to server

#### (default)/(settings)/settings/general/page.tsx (1 instance)

- [ ] Line 94: Update error → `logClientError`
- [ ] Add import: `import { logClientError } from '@/lib/client-logger';`
- [ ] Test: Trigger update error
- [ ] Verify: Log sent to server

#### api/analytics/web-vitals/route.ts (2 instances)

- [ ] Line 38: Metrics logging → `logger.info`
- [ ] Line 69: Processing error → `logError`
- [ ] Add import: `import { logger, logError } from '@workspace/observability';`
- [ ] Test: Send web vitals
- [ ] Verify: Structured logs

#### api/auth/password/route.ts (2 instances)

- [ ] Line 28: Check error → `logError`
- [ ] Line 78: Set error → `logError`
- [ ] Add import: `import { logError } from '@workspace/observability';`
- [ ] Test: Trigger password errors
- [ ] Verify: Logs include route, method

### Phase 3 Testing

- [ ] Run: `pnpm --filter @workspace/web test`
- [ ] Run: `pnpm --filter @workspace/web build`
- [ ] Manual testing: Test each component in browser
- [ ] Check browser console: Verify logs in dev mode
- [ ] Check server logs: Verify client logs received
- [ ] Run: `pnpm lint` (check warnings decreased)

**Phase 3 Deliverable**: ✅ All frontend logging migrated

---

## Phase 4: Shared Packages ⏱️ 1 hour

### Auth Package (3 instances)

#### packages/auth/src/server.ts

- [ ] Lines 57, 87, 119: Rate limit messages → `logger.warn`
- [ ] Add import: `import { logger } from '@workspace/observability';`
- [ ] Test: Trigger rate limits
- [ ] Verify: Structured logs with operation context

### Email Package (5 instances)

#### packages/email/src/send-email.ts

- [ ] Complete refactor to use `createChildLogger`
- [ ] Initialization logs → `emailLogger.info`
- [ ] Success logs → `emailLogger.info` with emailId
- [ ] Error logs → `logError` with recipient context
- [ ] Add imports: `import { logger, logError, createChildLogger } from '@workspace/observability';`
- [ ] Test: Send test email
- [ ] Verify: All logs include service: 'email'

### Phase 4 Testing

- [ ] Run: `pnpm --filter @workspace/auth test`
- [ ] Run: `pnpm --filter @workspace/email test`
- [ ] Run: `pnpm build` (all packages)
- [ ] Manual testing: Test email sending
- [ ] Manual testing: Test auth rate limiting
- [ ] Run: `pnpm lint` (should show minimal warnings)

**Phase 4 Deliverable**: ✅ All shared packages migrated

---

## Phase 5: Final Validation ⏱️ 1 hour

### ESLint Configuration (Enable Error Mode)

- [ ] Edit: `packages/eslint-config/base.js`
- [ ] Change no-console rule from "warn" to "error"
- [ ] Run: `pnpm lint` (should show 0 errors)
- [ ] Fix any remaining violations manually
- [ ] Commit ESLint config change

### Comprehensive Testing

- [ ] Run: `pnpm test` (all tests pass)
- [ ] Run: `pnpm build` (successful build)
- [ ] Run: `pnpm check-types` (no type errors)
- [ ] Run: `pnpm lint` (0 console usage errors)
- [ ] Start: `pnpm dev` (verify startup)

### Manual Validation

#### API Server

- [ ] Start API server
- [ ] Check startup logs (structured format)
- [ ] Trigger API error
- [ ] Verify error log has requestId, userId, operation
- [ ] Check log is JSON in production mode
- [ ] Check log is pretty in dev mode

#### Web App

- [ ] Start web app
- [ ] Trigger component error
- [ ] Check browser console (dev mode)
- [ ] Check server logs (client log received)
- [ ] Verify log has component, action fields
- [ ] Test in production mode (logs sent to server)

### Log Format Verification

- [ ] Development mode:

  ```bash
  NODE_ENV=development pnpm --filter @workspace/api dev
  # Expect: Pretty printed, colorized logs
  ```

- [ ] Production mode:
  ```bash
  NODE_ENV=production pnpm --filter @workspace/api start
  # Expect: JSON logs
  ```

### Regression Testing

Critical user flows to test:

- [ ] User sign up
- [ ] User sign in
- [ ] Create stash
- [ ] Create file
- [ ] Edit file
- [ ] Delete file
- [ ] Create folder
- [ ] Delete folder
- [ ] Update profile
- [ ] Change password
- [ ] Enable 2FA
- [ ] Trigger validation errors

All should work AND produce structured logs.

### Documentation Updates

- [ ] Update `CLAUDE.md` with logging guidelines reference
- [ ] Update `apps/api/CLAUDE.md` with logging patterns
- [ ] Update `apps/web/CLAUDE.md` with client logger usage
- [ ] Add link to quick reference in README (optional)

**Phase 5 Deliverable**: ✅ Production-ready structured logging

---

## Post-Migration Checklist

### Code Quality

- [ ] All tests passing
- [ ] Build successful
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Code formatted with Prettier

### Git

- [ ] All changes committed
- [ ] Meaningful commit messages
- [ ] Branch pushed to remote

### Pull Request

- [ ] Create PR with detailed description
- [ ] Link to migration plan in PR description
- [ ] Add before/after examples
- [ ] Request code review
- [ ] Add screenshots of log output

### Review Checklist (for Reviewer)

- [ ] All console statements removed
- [ ] Proper imports added
- [ ] Context fields appropriate
- [ ] No sensitive data logged
- [ ] Operation names descriptive
- [ ] RequestId included in API logs
- [ ] UserId included where available
- [ ] Component/action in frontend logs
- [ ] Tests still passing
- [ ] Build still succeeds

### Deployment

- [ ] Merge to main branch
- [ ] Deploy to staging
- [ ] Monitor staging logs
- [ ] Verify structured format
- [ ] Check log aggregation (if configured)
- [ ] Deploy to production
- [ ] Monitor production logs
- [ ] Verify no errors

### Monitoring Setup (Optional)

- [ ] Configure log aggregation service
- [ ] Set up dashboards
- [ ] Configure alerts for errors
- [ ] Set up slow request alerts
- [ ] Configure error rate alerts

---

## Rollback Plan

If issues arise:

1. **Immediate**: Revert PR
2. **Short-term**: Fix issues in new PR
3. **Long-term**: Keep migration plan for future attempt

---

## Success Criteria

✅ Migration is successful when:

- [ ] Zero console.log/error/warn in codebase (except excluded files)
- [ ] All logs are structured (JSON in production)
- [ ] All API logs include requestId, userId, operation
- [ ] All frontend logs include component, action
- [ ] ESLint prevents new console usage
- [ ] All tests passing
- [ ] Build successful
- [ ] Logs visible and searchable
- [ ] Documentation updated

---

## Estimated Completion Time

| Phase                   | Estimated Time | Your Actual Time |
| ----------------------- | -------------- | ---------------- |
| Phase 1: Infrastructure | 1 hour         | **\_**           |
| Phase 2: API Backend    | 2-3 hours      | **\_**           |
| Phase 3: Frontend       | 2-3 hours      | **\_**           |
| Phase 4: Packages       | 1 hour         | **\_**           |
| Phase 5: Validation     | 1 hour         | **\_**           |
| **Total**               | **6-8 hours**  | ****\_****       |

---

## Notes & Issues Encountered

Use this section to track any issues or deviations:

```
[Date] [Phase] [Issue]
Example:
2025-11-05 Phase 2 - Found additional console.error in user.routes.ts not in plan

[Your notes here]
```

---

## Final Sign-off

- [ ] Implementation complete
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Deployed to staging
- [ ] Deployed to production
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Team notified

**Completed By**: ******\_\_\_******
**Date**: ******\_\_\_******
**Total Time**: ******\_\_\_******

---

**Reference Documents**:

- Full plan: `.docs/STRUCTURED_LOGGING_MIGRATION_PLAN.md`
- Quick reference: `.docs/LOGGING_QUICK_REFERENCE.md`
- Summary: `.docs/LOGGING_MIGRATION_SUMMARY.md`

**Good luck! 🚀**
