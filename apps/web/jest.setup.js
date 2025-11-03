/* eslint-disable no-undef */
import '@testing-library/jest-dom';

// Mock window.matchMedia
global.matchMedia =
  global.matchMedia ||
  jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock Better Auth
jest.mock('@workspace/auth/client', () => ({
  authClient: {},
  signIn: jest.fn(),
  signOut: jest.fn(),
  signUp: jest.fn(),
  useSession: jest.fn(() => ({ data: null, isPending: false, error: null })),
  getSession: jest.fn(),
  sendVerificationEmail: jest.fn(),
  twoFactor: jest.fn(),
  changePassword: jest.fn(),
  changeEmail: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  forgetPassword: jest.fn(),
  resetPassword: jest.fn(),
}));

jest.mock('next-themes', () => ({
  useTheme: jest.fn(() => ({
    theme: 'light',
    setTheme: jest.fn(),
  })),
  ThemeProvider: ({ children }) => children,
}));

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
