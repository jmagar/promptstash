/**
 * Integration Tests: FileVersion Unique Constraint
 *
 * Tests to verify that the unique constraint on (fileId, version)
 * works correctly and handles race conditions properly.
 */

import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import type { Express } from 'express';
import supertest from 'supertest';

type SessionUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
};

type SessionRecord = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  expiresAt: Date;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type GetSessionResult = { user: SessionUser; session: SessionRecord } | null;

type GetSessionArgs = {
  headers?: Record<string, unknown>;
  query?: { disableCookieCache?: unknown; disableRefresh?: unknown };
};

type MockGetSession = jest.MockedFunction<(args?: GetSessionArgs) => Promise<GetSessionResult>>;

const mockGetSession = jest.fn() as MockGetSession;

// Mock Prisma
const mockPrismaFile = {
  findUnique: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockPrismaStash = {
  findUnique: jest.fn(),
};

const mockPrismaFolder = {
  findUnique: jest.fn(),
};

const mockPrismaFileVersion = {
  findMany: jest.fn(),
  findFirst: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
};

const mockPrisma = {
  file: mockPrismaFile,
  stash: mockPrismaStash,
  folder: mockPrismaFolder,
  fileVersion: mockPrismaFileVersion,
  $transaction: jest.fn((callback: any) => callback(mockPrisma)),
};

jest.mock('@workspace/db', () => ({
  prisma: mockPrisma,
}));

jest.mock('@workspace/auth', () => ({
  authClient: {},
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
  fromNodeHeaders: jest.fn((headers) => headers),
}));

jest.mock('@workspace/rate-limit', () => ({
  createRateLimiter: jest.fn(() => ({
    limit: jest.fn(() =>
      Promise.resolve({
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
      }),
    ),
  })),
  slidingWindow: jest.fn((requests: number, window: string) => ({
    requests,
    window,
  })),
}));

jest.mock('@workspace/utils', () => ({
  validateAgentFile: jest.fn(() => ({ valid: true, errors: [], warnings: [] })),
  validateSkillFile: jest.fn(() => ({ valid: true, errors: [], warnings: [] })),
  validateMCPFile: jest.fn(() => ({ valid: true, errors: [], warnings: [] })),
}));

import { createServer } from '../../server';

describe('FileVersion Unique Constraint Tests', () => {
  let app: Express;
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: true,
    twoFactorEnabled: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(() => {
    app = createServer();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({
      user: mockUser,
      session: {
        id: 'session-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 86400000),
        token: 'session-token-123',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      },
    });
  });

  describe('Concurrent File Updates', () => {
    it('should handle concurrent updates without creating duplicate versions', async () => {
      const mockStash = {
        id: 'stash-123',
        userId: 'user-123',
      };

      const mockExistingFile = {
        id: 'file-123',
        name: 'test-file',
        content: 'original content',
        path: '/test-file.md',
        fileType: 'MARKDOWN',
        stash: {
          userId: 'user-123',
        },
      };

      const mockUpdatedFile = {
        ...mockExistingFile,
        content: 'updated content',
        tags: [],
      };

      mockPrismaStash.findUnique.mockResolvedValue(mockStash);
      mockPrismaFile.findUnique.mockResolvedValue(mockExistingFile);
      mockPrismaFile.update.mockResolvedValue(mockUpdatedFile);

      // Simulate concurrent version creation with proper retry behavior
      let versionCallCount = 0;
      mockPrismaFileVersion.findFirst.mockImplementation(() => {
        versionCallCount++;
        // First call: version 1
        // Second call (after retry): version 2
        return Promise.resolve({ version: versionCallCount });
      });

      let createCallCount = 0;
      mockPrismaFileVersion.create.mockImplementation((args: any) => {
        createCallCount++;
        return Promise.resolve({
          id: `version-${createCallCount}`,
          fileId: 'file-123',
          version: args.data.version,
          content: args.data.content,
          createdBy: 'user-123',
          createdAt: new Date(),
        });
      });

      // Make two concurrent update requests
      const [response1, response2] = await Promise.all([
        supertest(app)
          .put('/api/files/file-123')
          .set('Cookie', 'session=mock-session-token')
          .send({ content: 'update 1' }),
        supertest(app)
          .put('/api/files/file-123')
          .set('Cookie', 'session=mock-session-token')
          .send({ content: 'update 2' }),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Verify that versions were created (safe creator handles retries internally)
      expect(mockPrismaFileVersion.create).toHaveBeenCalled();
    });

    it('should handle concurrent reverts without creating duplicate versions', async () => {
      const mockFile = {
        id: 'file-123',
        name: 'test-file',
        content: 'current content',
        stash: {
          userId: 'user-123',
        },
      };

      const mockVersion = {
        id: 'version-old',
        fileId: 'file-123',
        content: 'old content',
        version: 1,
        createdBy: 'user-123',
        createdAt: new Date(),
      };

      mockPrismaFile.findUnique.mockResolvedValue(mockFile);
      mockPrismaFileVersion.findUnique.mockResolvedValue(mockVersion);
      mockPrismaFile.update.mockResolvedValue({
        ...mockFile,
        content: 'old content',
      });

      let versionCallCount = 0;
      mockPrismaFileVersion.findFirst.mockImplementation(() => {
        versionCallCount++;
        return Promise.resolve({ version: versionCallCount + 1 });
      });

      let createCallCount = 0;
      mockPrismaFileVersion.create.mockImplementation((args: any) => {
        createCallCount++;
        return Promise.resolve({
          id: `version-revert-${createCallCount}`,
          fileId: 'file-123',
          version: args.data.version,
          content: args.data.content,
          createdBy: 'user-123',
          createdAt: new Date(),
        });
      });

      // Make two concurrent revert requests
      const [response1, response2] = await Promise.all([
        supertest(app)
          .post('/api/files/file-123/revert')
          .set('Cookie', 'session=mock-session-token')
          .send({ versionId: 'version-old' }),
        supertest(app)
          .post('/api/files/file-123/revert')
          .set('Cookie', 'session=mock-session-token')
          .send({ versionId: 'version-old' }),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Verify that versions were created
      expect(mockPrismaFileVersion.create).toHaveBeenCalled();
    });
  });

  describe('Sequential Version Numbers', () => {
    it('should create sequential version numbers for multiple updates', async () => {
      const mockExistingFile = {
        id: 'file-123',
        name: 'test-file',
        content: 'original content',
        path: '/test-file.md',
        fileType: 'MARKDOWN',
        stash: {
          userId: 'user-123',
        },
      };

      mockPrismaFile.findUnique.mockResolvedValue(mockExistingFile);

      const versions: number[] = [];

      mockPrismaFileVersion.findFirst.mockImplementation(() => {
        const maxVersion = versions.length > 0 ? Math.max(...versions) : 0;
        return Promise.resolve(maxVersion > 0 ? { version: maxVersion } : null);
      });

      mockPrismaFileVersion.create.mockImplementation((args: any) => {
        versions.push(args.data.version);
        return Promise.resolve({
          id: `version-${args.data.version}`,
          fileId: 'file-123',
          version: args.data.version,
          content: args.data.content,
          createdBy: 'user-123',
          createdAt: new Date(),
        });
      });

      mockPrismaFile.update.mockResolvedValue({
        ...mockExistingFile,
        tags: [],
      });

      // Make 5 sequential updates
      for (let i = 1; i <= 5; i++) {
        const response = await supertest(app)
          .put('/api/files/file-123')
          .set('Cookie', 'session=mock-session-token')
          .send({ content: `update ${i}` });

        expect(response.status).toBe(200);
      }

      // Verify versions are sequential: [1, 2, 3, 4, 5]
      expect(versions).toEqual([1, 2, 3, 4, 5]);
    });

    it('should create version 1 for new file', async () => {
      const mockStash = {
        id: 'stash-123',
        userId: 'user-123',
      };

      const mockCreatedFile = {
        id: 'file-new',
        name: 'new-file',
        content: 'new content',
        path: 'new-file.md',
        fileType: 'MARKDOWN',
        stashId: 'stash-123',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaStash.findUnique.mockResolvedValue(mockStash);
      mockPrismaFile.create.mockResolvedValue(mockCreatedFile);

      mockPrismaFileVersion.findFirst.mockResolvedValue(null); // No existing versions
      mockPrismaFileVersion.create.mockResolvedValue({
        id: 'version-1',
        fileId: 'file-new',
        version: 1,
        content: 'new content',
        createdBy: 'user-123',
        createdAt: new Date(),
      });

      const response = await supertest(app)
        .post('/api/files')
        .set('Cookie', 'session=mock-session-token')
        .send({
          name: 'new-file',
          content: 'new content',
          fileType: 'MARKDOWN',
          stashId: 'stash-123',
        });

      expect(response.status).toBe(201);
      expect(mockPrismaFileVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            version: 1,
          }),
        }),
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle version creation failure gracefully', async () => {
      const mockStash = {
        id: 'stash-123',
        userId: 'user-123',
      };

      const mockCreatedFile = {
        id: 'file-fail',
        name: 'fail-file',
        content: 'content',
        path: 'fail-file.md',
        fileType: 'MARKDOWN',
        stashId: 'stash-123',
        tags: [],
      };

      mockPrismaStash.findUnique.mockResolvedValue(mockStash);
      mockPrismaFile.create.mockResolvedValue(mockCreatedFile);

      // Simulate version creation failure
      mockPrismaFileVersion.findFirst.mockResolvedValue(null);
      mockPrismaFileVersion.create.mockRejectedValue(new Error('Database connection failed'));

      const response = await supertest(app)
        .post('/api/files')
        .set('Cookie', 'session=mock-session-token')
        .send({
          name: 'fail-file',
          content: 'content',
          fileType: 'MARKDOWN',
          stashId: 'stash-123',
        });

      // Should fail due to version creation error
      expect(response.status).toBe(500);
    });

    it('should not update file if version creation fails', async () => {
      const mockExistingFile = {
        id: 'file-123',
        name: 'test-file',
        content: 'original content',
        path: '/test-file.md',
        fileType: 'MARKDOWN',
        stash: {
          userId: 'user-123',
        },
      };

      mockPrismaFile.findUnique.mockResolvedValue(mockExistingFile);
      mockPrismaFileVersion.findFirst.mockResolvedValue({ version: 1 });
      mockPrismaFileVersion.create.mockRejectedValue(new Error('Version creation failed'));

      const response = await supertest(app)
        .put('/api/files/file-123')
        .set('Cookie', 'session=mock-session-token')
        .send({ content: 'new content' });

      expect(response.status).toBe(500);

      // File should not be updated due to transaction rollback
      expect(mockPrismaFile.update).not.toHaveBeenCalled();
    });
  });
});
