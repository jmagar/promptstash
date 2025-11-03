import { renderHook, waitFor } from '@testing-library/react';
import { useAuthUser, useRequiredAuthUser } from '../use-auth-user';

// Mock the auth client
const mockSession = {
  data: null,
  isPending: false,
  error: null,
  refetch: jest.fn(),
};

jest.mock('@workspace/auth/client', () => ({
  useSession: () => mockSession,
}));

// Mock Next.js navigation
const mockPush = jest.fn();
const mockPathname = '/';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
}));

describe('useAuthUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_DISABLE_AUTH;
    mockSession.data = null;
    mockSession.isPending = false;
    mockSession.error = null;
  });

  it('should return null user when not authenticated', () => {
    const { result } = renderHook(() => useAuthUser());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return user when authenticated', () => {
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      twoFactorEnabled: false,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockSession.data = { user: mockUser, session: {} as any };

    const { result } = renderHook(() => useAuthUser());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should show loading state when session is pending', () => {
    mockSession.isPending = true;

    const { result } = renderHook(() => useAuthUser());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('should not redirect by default', async () => {
    const { result } = renderHook(() => useAuthUser());

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should redirect when redirectOnUnauthenticated is true', async () => {
    renderHook(() =>
      useAuthUser({
        redirectOnUnauthenticated: true,
      }),
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/sign-in');
    });
  });

  it('should redirect to custom path when specified', async () => {
    renderHook(() =>
      useAuthUser({
        redirectOnUnauthenticated: true,
        redirectTo: '/custom-login',
      }),
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/custom-login');
    });
  });

  it('should return mock user when auth bypass is enabled', () => {
    process.env.NEXT_PUBLIC_DISABLE_AUTH = 'true';

    const { result } = renderHook(() => useAuthUser());

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.id).toBe('dev-user-123');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should throw error if auth bypass is enabled in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_DISABLE_AUTH = 'true';

    expect(() => {
      renderHook(() => useAuthUser());
    }).toThrow('Auth bypass cannot be enabled in production');

    process.env.NODE_ENV = originalEnv;
  });

  it('should not redirect if already on auth pages', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const usePathname = require('next/navigation').usePathname;
    usePathname.mockReturnValue('/sign-in');

    renderHook(() =>
      useAuthUser({
        redirectOnUnauthenticated: true,
      }),
    );

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});

describe('useRequiredAuthUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_DISABLE_AUTH;
    mockSession.data = null;
    mockSession.isPending = false;
    mockSession.error = null;
  });

  it('should return loading state when not authenticated', () => {
    const { result } = renderHook(() => useRequiredAuthUser());

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('should return user when authenticated', () => {
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      twoFactorEnabled: false,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockSession.data = { user: mockUser, session: {} as any };

    const { result } = renderHook(() => useRequiredAuthUser());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return loading state when session is pending', () => {
    mockSession.isPending = true;

    const { result } = renderHook(() => useRequiredAuthUser());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('should return mock user when auth bypass is enabled', () => {
    process.env.NEXT_PUBLIC_DISABLE_AUTH = 'true';

    const { result } = renderHook(() => useRequiredAuthUser());

    expect(result.current.user).not.toBeNull();
    expect(result.current.user.id).toBe('dev-user-123');
    expect(result.current.isLoading).toBe(false);
  });

  it('should automatically trigger redirect', async () => {
    renderHook(() => useRequiredAuthUser());

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/sign-in');
    });
  });
});
