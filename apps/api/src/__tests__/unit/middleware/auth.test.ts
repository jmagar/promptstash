import { describe, expect, it, jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';

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

jest.mock('@workspace/auth', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
  fromNodeHeaders: jest.fn((headers) => headers),
}));

import { requireAuth } from '../../../middleware/auth';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: statusMock as any,
      json: jsonMock as any,
    };
    mockNext = jest.fn() as NextFunction;

    jest.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should call next() when user is authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        twoFactorEnabled: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

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

      await requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockRequest as any).user).toEqual(mockUser);
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetSession.mockResolvedValue(null);

      await requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when session throws an error', async () => {
      mockGetSession.mockRejectedValue(new Error('Session error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should attach user to request object', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'another@example.com',
        name: 'Another User',
        emailVerified: true,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGetSession.mockResolvedValue({
        user: mockUser,
        session: {
          id: 'session-456',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user-456',
          expiresAt: new Date(Date.now() + 86400000),
          token: 'session-token-456',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        },
      });

      await requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).user).toBeDefined();
      expect((mockRequest as any).user.id).toBe('user-456');
      expect((mockRequest as any).user.email).toBe('another@example.com');
    });

    it('should handle missing session data', async () => {
      mockGetSession.mockResolvedValue(null);

      await requireAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
