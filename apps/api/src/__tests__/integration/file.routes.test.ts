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

describe('File Routes', () => {
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

  describe('GET /api/files/:id', () => {
    it('should return file when user is authorized', async () => {
      const mockFile = {
        id: 'file-123',
        name: 'test-file',
        content: 'test content',
        path: '/test-file.md',
        fileType: 'MARKDOWN',
        stashId: 'stash-123',
        stash: {
          userId: 'user-123',
        },
        tags: [],
        folder: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaFile.findUnique.mockResolvedValue(mockFile);

      const response = await supertest(app)
        .get('/api/files/file-123')
        .set('Cookie', 'session=mock-session-token')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'file-123');
      expect(response.body).toHaveProperty('name', 'test-file');
    });

    it('should return 404 when file not found', async () => {
      mockPrismaFile.findUnique.mockResolvedValue(null);

      const response = await supertest(app)
        .get('/api/files/nonexistent')
        .set('Cookie', 'session=mock-session-token')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'File not found');
    });

    it('should return 403 when user does not own file', async () => {
      const mockFile = {
        id: 'file-123',
        name: 'test-file',
        stash: {
          userId: 'different-user',
        },
      };

      mockPrismaFile.findUnique.mockResolvedValue(mockFile);

      const response = await supertest(app)
        .get('/api/files/file-123')
        .set('Cookie', 'session=mock-session-token')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden');
    });
  });

  describe('POST /api/files', () => {
    it('should create a file successfully', async () => {
      const mockStash = {
        id: 'stash-123',
        userId: 'user-123',
      };

      const mockCreatedFile = {
        id: 'file-123',
        name: 'new-file',
        content: '# Test Content',
        path: 'new-file.md',
        fileType: 'MARKDOWN',
        stashId: 'stash-123',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaStash.findUnique.mockResolvedValue(mockStash);
      mockPrismaFile.create.mockResolvedValue(mockCreatedFile);
      mockPrismaFileVersion.create.mockResolvedValue({
        id: 'version-123',
        fileId: 'file-123',
        content: '# Test Content',
        version: 1,
        createdBy: 'user-123',
      });

      const response = await supertest(app)
        .post('/api/files')
        .set('Cookie', 'session=mock-session-token')
        .send({
          name: 'new-file',
          content: '# Test Content',
          fileType: 'MARKDOWN',
          stashId: 'stash-123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('file');
      expect(response.body.file).toHaveProperty('id', 'file-123');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await supertest(app)
        .post('/api/files')
        .set('Cookie', 'session=mock-session-token')
        .send({
          name: 'new-file',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 when stash not found', async () => {
      mockPrismaStash.findUnique.mockResolvedValue(null);

      const response = await supertest(app)
        .post('/api/files')
        .set('Cookie', 'session=mock-session-token')
        .send({
          name: 'new-file',
          content: '# Test',
          fileType: 'MARKDOWN',
          stashId: 'nonexistent',
        })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Stash not found');
    });

    it('should return 403 when user does not own stash', async () => {
      mockPrismaStash.findUnique.mockResolvedValue({
        id: 'stash-123',
        userId: 'different-user',
      });

      const response = await supertest(app)
        .post('/api/files')
        .set('Cookie', 'session=mock-session-token')
        .send({
          name: 'new-file',
          content: '# Test',
          fileType: 'MARKDOWN',
          stashId: 'stash-123',
        })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden');
    });
  });

  describe('PUT /api/files/:id', () => {
    it('should update file successfully', async () => {
      const mockExistingFile = {
        id: 'file-123',
        name: 'old-name',
        content: 'old content',
        path: '/old-name.md',
        fileType: 'MARKDOWN',
        stash: {
          userId: 'user-123',
        },
        versions: [{ version: 1 }],
      };

      const mockUpdatedFile = {
        ...mockExistingFile,
        name: 'new-name',
        content: 'new content',
        tags: [],
      };

      mockPrismaFile.findUnique.mockResolvedValue(mockExistingFile);
      mockPrismaFile.update.mockResolvedValue(mockUpdatedFile);
      mockPrismaFileVersion.create.mockResolvedValue({
        id: 'version-124',
        fileId: 'file-123',
        content: 'new content',
        version: 2,
        createdBy: 'user-123',
      });

      const response = await supertest(app)
        .put('/api/files/file-123')
        .set('Cookie', 'session=mock-session-token')
        .send({
          name: 'new-name',
          content: 'new content',
        })
        .expect(200);

      expect(response.body).toHaveProperty('name', 'new-name');
    });

    it('should return 404 when file not found', async () => {
      mockPrismaFile.findUnique.mockResolvedValue(null);

      const response = await supertest(app)
        .put('/api/files/nonexistent')
        .set('Cookie', 'session=mock-session-token')
        .send({
          name: 'new-name',
        })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'File not found');
    });
  });

  describe('DELETE /api/files/:id', () => {
    it('should delete file successfully', async () => {
      const mockFile = {
        id: 'file-123',
        stash: {
          userId: 'user-123',
        },
      };

      mockPrismaFile.findUnique.mockResolvedValue(mockFile);
      mockPrismaFile.delete.mockResolvedValue(mockFile);

      await supertest(app)
        .delete('/api/files/file-123')
        .set('Cookie', 'session=mock-session-token')
        .expect(204);
    });

    it('should return 404 when file not found', async () => {
      mockPrismaFile.findUnique.mockResolvedValue(null);

      const response = await supertest(app)
        .delete('/api/files/nonexistent')
        .set('Cookie', 'session=mock-session-token')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'File not found');
    });
  });

  describe('GET /api/files/:id/versions', () => {
    it('should return file versions', async () => {
      const mockFile = {
        id: 'file-123',
        stash: {
          userId: 'user-123',
        },
      };

      const mockVersions = [
        {
          id: 'version-2',
          fileId: 'file-123',
          content: 'content v2',
          version: 2,
          createdBy: 'user-123',
          createdAt: new Date(),
        },
        {
          id: 'version-1',
          fileId: 'file-123',
          content: 'content v1',
          version: 1,
          createdBy: 'user-123',
          createdAt: new Date(),
        },
      ];

      mockPrismaFile.findUnique.mockResolvedValue(mockFile);
      mockPrismaFileVersion.findMany.mockResolvedValue(mockVersions);

      const response = await supertest(app)
        .get('/api/files/file-123/versions')
        .set('Cookie', 'session=mock-session-token')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('version', 2);
    });
  });
});
