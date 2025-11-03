import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeSwitcher from '../theme-switcher';

// Mock the hooks
jest.mock('@/hooks/useMounted', () => ({
  __esModule: true,
  default: () => true,
}));

const mockSetTheme = jest.fn();
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
  }),
}));

jest.mock('@workspace/ui/components/sidebar', () => ({
  useSidebar: () => ({ state: 'expanded' }),
}));

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render theme switcher button', () => {
    render(<ThemeSwitcher />);
    const button = screen.getByRole('button', { name: /select theme/i });
    expect(button).toBeInTheDocument();
  });

  it('should display current theme', () => {
    render(<ThemeSwitcher />);
    expect(screen.getByText('light')).toBeInTheDocument();
  });

  it('should render dark theme icon when theme is dark', () => {
    const useTheme = require('next-themes').useTheme;
    useTheme.mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    });

    render(<ThemeSwitcher />);
    expect(screen.getByText('dark')).toBeInTheDocument();
  });

  it('should render system theme icon when theme is system', () => {
    const useTheme = require('next-themes').useTheme;
    useTheme.mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
    });

    render(<ThemeSwitcher />);
    expect(screen.getByText('system')).toBeInTheDocument();
  });

  it('should open dropdown menu when clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);

    const button = screen.getByRole('button', { name: /select theme/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
    });
  });

  it('should call setTheme when a theme option is selected', async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);

    const button = screen.getByRole('button', { name: /select theme/i });
    await user.click(button);

    await waitFor(async () => {
      const darkOption = screen.getByRole('menuitemradio', { name: /Dark/i });
      await user.click(darkOption);
    });

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('should not render when not mounted', () => {
    const useMounted = require('@/hooks/useMounted').default;
    useMounted.mockReturnValue(false);

    const { container } = render(<ThemeSwitcher />);
    expect(container.firstChild).toBeNull();
  });

  it('should adjust button size based on sidebar state', () => {
    const useSidebar = require('@workspace/ui/components/sidebar').useSidebar;
    useSidebar.mockReturnValue({ state: 'collapsed' });

    render(<ThemeSwitcher />);
    const button = screen.getByRole('button', { name: /select theme/i });

    // When collapsed, text shouldn't be visible
    expect(screen.queryByText('light')).not.toBeInTheDocument();
  });
});
