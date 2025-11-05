import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Prisma, PrismaClient } from '../../generated/prisma';
import { createFileVersion, createFileVersionInTransaction } from '../safe-version-creator';

// Mock Prisma client
const mockFileVersion = {
  findFirst: jest.fn(),
  create: jest.fn(),
};

const mockPrisma = {
  fileVersion: mockFileVersion,
  $transaction: jest.fn((callback: any) => callback(mockPrisma)),
} as any as PrismaClient;

describe('Safe Version Creator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createFileVersion', () => {
    it('should create version 1 for a new file', async () => {
      // No existing versions
      mockFileVersion.findFirst.mockResolvedValue(null);

      mockFileVersion.create.mockResolvedValue({
        id: 'version-1',
        fileId: 'file-123',
        version: 1,
        content: 'content',
        createdBy: 'user-123',
        createdAt: new Date(),
      });

      const result = await createFileVersion(mockPrisma, {
        fileId: 'file-123',
        content: 'content',
        createdBy: 'user-123',
      });

      expect(result.version).toBe(1);
      expect(mockFileVersion.findFirst).toHaveBeenCalledWith({
        where: { fileId: 'file-123' },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      expect(mockFileVersion.create).toHaveBeenCalledWith({
        data: {
          fileId: 'file-123',
          content: 'content',
          version: 1,
          createdBy: 'user-123',
        },
      });
    });

    it('should create incremental version numbers', async () => {
      // Existing version 5
      mockFileVersion.findFirst.mockResolvedValue({ version: 5 });

      mockFileVersion.create.mockResolvedValue({
        id: 'version-6',
        fileId: 'file-123',
        version: 6,
        content: 'new content',
        createdBy: 'user-123',
        createdAt: new Date(),
      });

      const result = await createFileVersion(mockPrisma, {
        fileId: 'file-123',
        content: 'new content',
        createdBy: 'user-123',
      });

      expect(result.version).toBe(6);
      expect(mockFileVersion.create).toHaveBeenCalledWith({
        data: {
          fileId: 'file-123',
          content: 'new content',
          version: 6,
          createdBy: 'user-123',
        },
      });
    });

    it('should retry on unique constraint violation', async () => {
      // First call: latest version is 5
      // Second call (after retry): latest version is 6
      mockFileVersion.findFirst
        .mockResolvedValueOnce({ version: 5 })
        .mockResolvedValueOnce({ version: 6 });

      // First create fails with unique constraint violation
      const uniqueError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
        meta: { target: ['fileId', 'version'] },
      });

      mockFileVersion.create.mockRejectedValueOnce(uniqueError).mockResolvedValueOnce({
        id: 'version-7',
        fileId: 'file-123',
        version: 7,
        content: 'content',
        createdBy: 'user-123',
        createdAt: new Date(),
      });

      const result = await createFileVersion(mockPrisma, {
        fileId: 'file-123',
        content: 'content',
        createdBy: 'user-123',
      });

      expect(result.version).toBe(7);
      expect(mockFileVersion.findFirst).toHaveBeenCalledTimes(2);
      expect(mockFileVersion.create).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      mockFileVersion.findFirst.mockResolvedValue({ version: 5 });

      const uniqueError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
        meta: { target: ['fileId', 'version'] },
      });

      mockFileVersion.create.mockRejectedValue(uniqueError);

      await expect(
        createFileVersion(
          mockPrisma,
          {
            fileId: 'file-123',
            content: 'content',
            createdBy: 'user-123',
          },
          { maxRetries: 3 },
        ),
      ).rejects.toThrow('Failed to create version for file file-123 after 3 attempts');

      expect(mockFileVersion.create).toHaveBeenCalledTimes(3);
    });

    it('should rethrow non-constraint errors immediately', async () => {
      mockFileVersion.findFirst.mockResolvedValue({ version: 5 });

      const otherError = new Error('Database connection failed');
      mockFileVersion.create.mockRejectedValue(otherError);

      await expect(
        createFileVersion(mockPrisma, {
          fileId: 'file-123',
          content: 'content',
          createdBy: 'user-123',
        }),
      ).rejects.toThrow('Database connection failed');

      // Should fail immediately, not retry
      expect(mockFileVersion.create).toHaveBeenCalledTimes(1);
    });

    it('should work within a transaction', async () => {
      const mockTx = {
        fileVersion: mockFileVersion,
      } as any as Prisma.TransactionClient;

      mockFileVersion.findFirst.mockResolvedValue({ version: 2 });
      mockFileVersion.create.mockResolvedValue({
        id: 'version-3',
        fileId: 'file-123',
        version: 3,
        content: 'content',
        createdBy: 'user-123',
        createdAt: new Date(),
      });

      const result = await createFileVersion(
        mockPrisma,
        {
          fileId: 'file-123',
          content: 'content',
          createdBy: 'user-123',
        },
        { tx: mockTx },
      );

      expect(result.version).toBe(3);
    });

    it('should handle concurrent version creation', async () => {
      // Simulate race condition:
      // Both requests see version 5, try to create version 6
      // First succeeds, second gets unique constraint error and retries
      let callCount = 0;

      mockFileVersion.findFirst.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve({ version: 5 });
        if (callCount === 2) return Promise.resolve({ version: 5 }); // Race condition
        if (callCount === 3) return Promise.resolve({ version: 6 }); // After retry
        return Promise.resolve({ version: 6 });
      });

      let createCallCount = 0;
      mockFileVersion.create.mockImplementation((args: any) => {
        createCallCount++;
        if (createCallCount === 2) {
          // Second call gets unique constraint error
          const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: '5.0.0',
            meta: { target: ['fileId', 'version'] },
          });
          return Promise.reject(error);
        }
        return Promise.resolve({
          id: `version-${args.data.version}`,
          fileId: args.data.fileId,
          version: args.data.version,
          content: args.data.content,
          createdBy: args.data.createdBy,
          createdAt: new Date(),
        });
      });

      // Simulate two concurrent requests
      const [result1, result2] = await Promise.all([
        createFileVersion(mockPrisma, {
          fileId: 'file-123',
          content: 'content 1',
          createdBy: 'user-123',
        }),
        createFileVersion(mockPrisma, {
          fileId: 'file-123',
          content: 'content 2',
          createdBy: 'user-123',
        }),
      ]);

      // Both should succeed but with different version numbers
      expect(result1.version).toBe(6);
      expect(result2.version).toBe(7);
    });
  });

  describe('createFileVersionInTransaction', () => {
    it('should work with transaction client', async () => {
      const mockTx = {
        fileVersion: mockFileVersion,
      } as any as Prisma.TransactionClient;

      mockFileVersion.findFirst.mockResolvedValue({ version: 1 });
      mockFileVersion.create.mockResolvedValue({
        id: 'version-2',
        fileId: 'file-123',
        version: 2,
        content: 'content',
        createdBy: 'user-123',
        createdAt: new Date(),
      });

      const result = await createFileVersionInTransaction(mockTx, {
        fileId: 'file-123',
        content: 'content',
        createdBy: 'user-123',
      });

      expect(result.version).toBe(2);
    });

    it('should handle retries within transaction', async () => {
      const mockTx = {
        fileVersion: mockFileVersion,
      } as any as Prisma.TransactionClient;

      mockFileVersion.findFirst
        .mockResolvedValueOnce({ version: 3 })
        .mockResolvedValueOnce({ version: 4 });

      const uniqueError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
        meta: { target: ['fileId', 'version'] },
      });

      mockFileVersion.create.mockRejectedValueOnce(uniqueError).mockResolvedValueOnce({
        id: 'version-5',
        fileId: 'file-123',
        version: 5,
        content: 'content',
        createdBy: 'user-123',
        createdAt: new Date(),
      });

      const result = await createFileVersionInTransaction(mockTx, {
        fileId: 'file-123',
        content: 'content',
        createdBy: 'user-123',
      });

      expect(result.version).toBe(5);
      expect(mockFileVersion.create).toHaveBeenCalledTimes(2);
    });
  });
});
