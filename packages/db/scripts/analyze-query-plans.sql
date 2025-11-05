-- PostgreSQL Query Plan Analysis
-- Run this script to analyze query execution plans before and after adding indexes
--
-- Usage:
--   psql $DATABASE_URL < scripts/analyze-query-plans.sql > query-plans-before.txt
--   # Apply migration
--   psql $DATABASE_URL < scripts/analyze-query-plans.sql > query-plans-after.txt
--   # Compare files to see index usage

\echo '=== QUERY PLAN ANALYSIS ==='
\echo ''

-- Setup test data
\echo 'Setting up test user...'
INSERT INTO "user" (id, email, name, "emailVerified", "createdAt", "updatedAt")
VALUES ('test-user-perf-001', 'test-performance@example.com', 'Performance Test User', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

\echo 'Setting up test sessions...'
INSERT INTO "session" (id, token, "userId", "expiresAt", "ipAddress", "userAgent", "createdAt", "updatedAt")
VALUES
  ('test-session-1', 'test-token-1', 'test-user-perf-001', NOW() + INTERVAL '1 day', '127.0.0.1', 'Test', NOW(), NOW()),
  ('test-session-2', 'test-token-2', 'test-user-perf-001', NOW() - INTERVAL '1 hour', '127.0.0.1', 'Test', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

\echo 'Setting up test accounts...'
INSERT INTO "account" (id, "accountId", "providerId", "userId", "createdAt", "updatedAt")
VALUES
  ('test-account-1', 'test-acc-1', 'credential', 'test-user-perf-001', NOW(), NOW()),
  ('test-account-2', 'test-acc-2', 'google', 'test-user-perf-001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

\echo 'Setting up test verifications...'
INSERT INTO "verification" (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
VALUES ('test-verification-1', 'test-performance@example.com', 'code-123', NOW() + INTERVAL '10 minutes', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

\echo ''
\echo '=== TEST 1: Session lookup by userId ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM "session" WHERE "userId" = 'test-user-perf-001';

\echo ''
\echo '=== TEST 2: Expired sessions query ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM "session" WHERE "expiresAt" < NOW();

\echo ''
\echo '=== TEST 3: Active sessions for user (composite) ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM "session"
WHERE "userId" = 'test-user-perf-001'
AND "expiresAt" > NOW();

\echo ''
\echo '=== TEST 4: Account lookup by userId ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM "account" WHERE "userId" = 'test-user-perf-001';

\echo ''
\echo '=== TEST 5: Account lookup by userId + providerId ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM "account"
WHERE "userId" = 'test-user-perf-001'
AND "providerId" = 'credential';

\echo ''
\echo '=== TEST 6: User lookup by email ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM "user" WHERE "email" = 'test-performance@example.com';

\echo ''
\echo '=== TEST 7: Verification token validation ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM "verification"
WHERE "identifier" = 'test-performance@example.com'
AND "value" = 'code-123';

\echo ''
\echo '=== TEST 8: Expired verification tokens ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM "verification" WHERE "expiresAt" < NOW();

\echo ''
\echo '=== INDEX INFORMATION ==='
\echo ''
\echo 'Current indexes on session table:'
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'session'
ORDER BY indexname;

\echo ''
\echo 'Current indexes on account table:'
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'account'
ORDER BY indexname;

\echo ''
\echo 'Current indexes on user table:'
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'user'
ORDER BY indexname;

\echo ''
\echo 'Current indexes on verification table:'
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'verification'
ORDER BY indexname;

\echo ''
\echo '=== ANALYSIS COMPLETE ==='
\echo ''
\echo 'Look for "Index Scan" vs "Seq Scan" in query plans above.'
\echo 'After adding indexes, you should see:'
\echo '  - "Index Scan using session_userId_idx" instead of "Seq Scan"'
\echo '  - "Index Scan using session_expiresAt_idx" instead of "Seq Scan"'
\echo '  - Lower execution times'
\echo '  - Fewer buffer reads'
\echo ''
