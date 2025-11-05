/**
 * Query Performance Test Script
 *
 * Tests query performance before and after adding indexes.
 * Run this script before and after migration to measure improvements.
 *
 * Usage:
 *   npx tsx scripts/test-query-performance.ts > baseline-results.json
 *   # Apply migration
 *   npx tsx scripts/test-query-performance.ts > post-migration-results.json
 */

import { prisma } from '../src/client';

interface TestResults {
  timestamp: string;
  tests: {
    name: string;
    time: number;
    query: string;
  }[];
  summary: {
    total: number;
    average: number;
  };
}

async function setupTestData() {
  console.error('Setting up test data...');

  // Create test user if not exists
  const testUser = await prisma.user.upsert({
    where: { email: 'test-performance@example.com' },
    update: {},
    create: {
      id: 'test-user-perf-001',
      email: 'test-performance@example.com',
      name: 'Performance Test User',
      emailVerified: true,
    },
  });

  // Create test sessions (10 active, 5 expired)
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  for (let i = 0; i < 10; i++) {
    await prisma.session.upsert({
      where: { id: `test-session-active-${i}` },
      update: {},
      create: {
        id: `test-session-active-${i}`,
        token: `test-token-active-${i}`,
        userId: testUser.id,
        expiresAt: oneDayLater,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      },
    });
  }

  for (let i = 0; i < 5; i++) {
    await prisma.session.upsert({
      where: { id: `test-session-expired-${i}` },
      update: {},
      create: {
        id: `test-session-expired-${i}`,
        token: `test-token-expired-${i}`,
        userId: testUser.id,
        expiresAt: oneHourAgo,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      },
    });
  }

  // Create test accounts
  await prisma.account.upsert({
    where: { id: 'test-account-credential' },
    update: {},
    create: {
      id: 'test-account-credential',
      accountId: 'test-credential-001',
      providerId: 'credential',
      userId: testUser.id,
      password: 'hashed-password',
    },
  });

  await prisma.account.upsert({
    where: { id: 'test-account-google' },
    update: {},
    create: {
      id: 'test-account-google',
      accountId: 'test-google-001',
      providerId: 'google',
      userId: testUser.id,
    },
  });

  // Create test verification tokens
  const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);

  await prisma.verification.upsert({
    where: { id: 'test-verification-001' },
    update: {},
    create: {
      id: 'test-verification-001',
      identifier: 'test-performance@example.com',
      value: 'verification-code-123',
      expiresAt: tenMinutesLater,
    },
  });

  console.error('Test data setup complete.\n');
}

async function runTests(): Promise<TestResults> {
  const tests: TestResults['tests'] = [];
  let totalTime = 0;

  console.error('=== QUERY PERFORMANCE TESTS ===\n');

  // Test 1: Session lookup by userId
  console.error('Test 1: Session lookup by userId');
  const test1Start = performance.now();
  await prisma.session.findMany({
    where: { userId: 'test-user-perf-001' },
  });
  const test1Time = performance.now() - test1Start;
  console.error(`  Time: ${test1Time.toFixed(2)}ms`);
  tests.push({
    name: 'session_by_userId',
    time: test1Time,
    query: 'SELECT * FROM session WHERE userId = ?',
  });
  totalTime += test1Time;

  // Test 2: Expired sessions query
  console.error('\nTest 2: Expired sessions query');
  const test2Start = performance.now();
  await prisma.session.findMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  const test2Time = performance.now() - test2Start;
  console.error(`  Time: ${test2Time.toFixed(2)}ms`);
  tests.push({
    name: 'expired_sessions',
    time: test2Time,
    query: 'SELECT * FROM session WHERE expiresAt < NOW()',
  });
  totalTime += test2Time;

  // Test 3: Active sessions for user
  console.error('\nTest 3: Active sessions for user (composite query)');
  const test3Start = performance.now();
  await prisma.session.findMany({
    where: {
      userId: 'test-user-perf-001',
      expiresAt: {
        gt: new Date(),
      },
    },
  });
  const test3Time = performance.now() - test3Start;
  console.error(`  Time: ${test3Time.toFixed(2)}ms`);
  tests.push({
    name: 'active_sessions_for_user',
    time: test3Time,
    query: 'SELECT * FROM session WHERE userId = ? AND expiresAt > NOW()',
  });
  totalTime += test3Time;

  // Test 4: Account lookup by userId
  console.error('\nTest 4: Account lookup by userId');
  const test4Start = performance.now();
  await prisma.account.findMany({
    where: { userId: 'test-user-perf-001' },
  });
  const test4Time = performance.now() - test4Start;
  console.error(`  Time: ${test4Time.toFixed(2)}ms`);
  tests.push({
    name: 'accounts_by_userId',
    time: test4Time,
    query: 'SELECT * FROM account WHERE userId = ?',
  });
  totalTime += test4Time;

  // Test 5: Account lookup by userId + providerId
  console.error('\nTest 5: Account lookup by userId + providerId');
  const test5Start = performance.now();
  await prisma.account.findFirst({
    where: {
      userId: 'test-user-perf-001',
      providerId: 'credential',
    },
  });
  const test5Time = performance.now() - test5Start;
  console.error(`  Time: ${test5Time.toFixed(2)}ms`);
  tests.push({
    name: 'account_by_userId_providerId',
    time: test5Time,
    query: 'SELECT * FROM account WHERE userId = ? AND providerId = ?',
  });
  totalTime += test5Time;

  // Test 6: User lookup by email
  console.error('\nTest 6: User lookup by email');
  const test6Start = performance.now();
  await prisma.user.findUnique({
    where: { email: 'test-performance@example.com' },
  });
  const test6Time = performance.now() - test6Start;
  console.error(`  Time: ${test6Time.toFixed(2)}ms`);
  tests.push({
    name: 'user_by_email',
    time: test6Time,
    query: 'SELECT * FROM user WHERE email = ?',
  });
  totalTime += test6Time;

  // Test 7: Verification token validation
  console.error('\nTest 7: Verification token validation');
  const test7Start = performance.now();
  await prisma.verification.findFirst({
    where: {
      identifier: 'test-performance@example.com',
      value: 'verification-code-123',
    },
  });
  const test7Time = performance.now() - test7Start;
  console.error(`  Time: ${test7Time.toFixed(2)}ms`);
  tests.push({
    name: 'verification_token_validation',
    time: test7Time,
    query: 'SELECT * FROM verification WHERE identifier = ? AND value = ?',
  });
  totalTime += test7Time;

  // Test 8: Expired verification tokens
  console.error('\nTest 8: Expired verification tokens');
  const test8Start = performance.now();
  await prisma.verification.findMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  const test8Time = performance.now() - test8Start;
  console.error(`  Time: ${test8Time.toFixed(2)}ms`);
  tests.push({
    name: 'expired_verification_tokens',
    time: test8Time,
    query: 'SELECT * FROM verification WHERE expiresAt < NOW()',
  });
  totalTime += test8Time;

  console.error('\n=== SUMMARY ===');
  console.error(`Total time: ${totalTime.toFixed(2)}ms`);
  console.error(`Average time: ${(totalTime / tests.length).toFixed(2)}ms`);
  console.error(`Number of tests: ${tests.length}\n`);

  return {
    timestamp: new Date().toISOString(),
    tests,
    summary: {
      total: totalTime,
      average: totalTime / tests.length,
    },
  };
}

async function cleanup() {
  console.error('Cleaning up test data...');

  // Delete test data
  await prisma.session.deleteMany({
    where: {
      userId: 'test-user-perf-001',
    },
  });

  await prisma.account.deleteMany({
    where: {
      userId: 'test-user-perf-001',
    },
  });

  await prisma.verification.deleteMany({
    where: {
      identifier: 'test-performance@example.com',
    },
  });

  await prisma.user
    .delete({
      where: {
        id: 'test-user-perf-001',
      },
    })
    .catch(() => {
      // User might not exist
    });

  console.error('Cleanup complete.\n');
}

// Main execution
async function main() {
  try {
    await setupTestData();
    const results = await runTests();

    // Output JSON to stdout (for redirection to file)
    console.log(JSON.stringify(results, null, 2));

    // Optionally cleanup (comment out if you want to keep data for manual testing)
    // await cleanup();
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
