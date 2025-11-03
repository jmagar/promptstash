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
const mockPrismaFolder = {
  findUnique: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockPrismaStash = {
  findUnique: jest.fn(),
};

const mockPrisma = {
  folder: mockPrismaFolder,
  stash: mockPrismaStash,
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

import { createServer } from '../../server';

describe('Folder Routes', () => {
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

  describe('GET /api/folders/:id', () => {
    it('should return folder with contents when authorized', async () => {
      const mockFolder = {
        id: 'folder-123',
        name: 'test-folder',
        path: '/test-folder',
        stashId: 'stash-123',
        parentId: null,
        stash: {
          userId: 'user-123',
        },
        children: [],
        files: [],
        parent: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaFolder.findUnique.mockResolvedValue(mockFolder);

      const response = await supertest(app)
        .get('/api/folders/folder-123')
        .set('Cookie', 'session=mock-session-token')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'folder-123');
      expect(response.body).toHaveProperty('name', 'test-folder');
      expect(response.body).toHaveProperty('children');
      expect(response.body).toHaveProperty('files');
    });

    it('should return 404 when folder not found', async () => {
      mockPrismaFolder.findUnique.mockResolvedValue(null);

      const response = await supertest(app)
        .get('/api/folders/nonexistent')
        .set('Cookie', 'session=mock-session-token')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Folder not found');
    });

    it('should return 403 when user does not own folder', async () => {
      const mockFolder = {
        id: 'folder-123',
        stash: {
          userId: 'different-user',
        },
      };

      mockPrismaFolder.findUnique.mockResolvedValue(mockFolder);

      const response = await supertest(app)
        .get('/api/folders/folder-123')
        .set('Cookie', 'session=mock-session-token')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden');
    });
  });

  describe('POST /api/folders', () => {
    it('should create a root folder successfully', async () => {
      const mockStash = {
        id: 'stash-123',
        userId: 'user-123',
      };

      const mockCreatedFolder = {
        id: 'folder-123',
        name: 'new-folder',
        path: '/new-folder',
        stashId: 'stash-123',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaStash.findUnique.mockResolvedValue(mockStash);
      mockPrismaFolder.create.mockResolvedValue(mockCreatedFolder);

      const response = await supertest(app)
        .post('/api/folders')
        .set('Cookie', 'session=mock-session-token')
        .send({
          name: 'new-folder',
          stashId: 'stash-123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'folder-123');
      expect(response.body).toHaveProperty('path', '/new-folder');
    });

    it('should create a nested folder with parent', async () => {
      const mockStash = {
        id: 'stash-123',
        userId: 'user-123',
      };

      const mockParentFolder = {
        id: 'parent-123',
        stashId: 'stash-123',
        path: '/parent',
      };

      const mockCreatedFolder = {
        id: 'folder-123',
        name: 'child-folder',
        path: '/parent/child-folder',
        stashId: 'stash-123',
        parentId: 'parent-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaStash.findUnique.mockResolvedValue(mockStash);
      mockPrismaFolder.findUnique.mockResolvedValue(mockParentFolder);
      mockPrismaFolder.create.mockResolvedValue(mockCreatedFolder);

      const response = await supertest(app)
        .post('/api/folders')
        .set('Cookie', 'session=mock-session-token')
        .send({
          name: 'child-folder',
          stashId: 'stash-123',
          parentId: 'parent-123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('path', '/parent/child-folder');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await supertest(app)
        .post('/api/folders')
        .set('Cookie', 'session=mock-session-token')
        .send({
          name: 'new-folder',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 when stash not found', async () => {
      mockPrismaStash.findUnique.mockResolvedValue(null);

      const response = await supertest(app)
        .post('/api/folders')
        .set('Cookie', 'session=mock-session-token')
        .send({
          name: 'new-folder',
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
        .post('/api/folders')
        .set('Cookie', 'session=mock-session-token')
        .send({
          name: 'new-folder',
          stashId: 'stash-123',
        })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden');
    });
  });

  describe('PUT /api/folders/:id', () => {
    it('should update folder successfully', async () => {
      const mockExistingFolder = {
        id: 'folder-123',
        name: 'old-name',
        path: '/old-name',
        stash: {
          userId: 'user-123',
        },
      };

      const mockUpdatedFolder = {
        ...mockExistingFolder,
        name: 'new-name',
        path: '/new-name',
      };

      mockPrismaFolder.findUnique.mockResolvedValue(mockExistingFolder);
      mockPrismaFolder.update.mockResolvedValue(mockUpdatedFolder);

      const response = await supertest(app)
        .put('/api/folders/folder-123')
        .set('Cookie', 'session=mock-session-token')
        .send({
          name: 'new-name',
          path: '/new-name',
        })
        .expect(200);

      expect(response.body).toHaveProperty('name', 'new-name');
    });

    it('should return 404 when folder not found', async () => {
      mockPrismaFolder.findUnique.mockResolvedValue(null);

      const response = await supertest(app)
        .put('/api/folders/nonexistent')
        .set('Cookie', 'session=mock-session-token')
        .send({
          name: 'new-name',
        })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Folder not found');
    });
  });

  describe('DELETE /api/folders/:id', () => {
    it('should delete folder successfully', async () => {
      const mockFolder = {
        id: 'folder-123',
        stash: {
          userId: 'user-123',
        },
      };

      mockPrismaFolder.findUnique.mockResolvedValue(mockFolder);
      mockPrismaFolder.delete.mockResolvedValue(mockFolder);

      await supertest(app)
        .delete('/api/folders/folder-123')
        .set('Cookie', 'session=mock-session-token')
        .expect(204);
    });

    it('should return 404 when folder not found', async () => {
      mockPrismaFolder.findUnique.mockResolvedValue(null);

      const response = await supertest(app)
        .delete('/api/folders/nonexistent')
        .set('Cookie', 'session=mock-session-token')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Folder not found');
    });
  });
});
