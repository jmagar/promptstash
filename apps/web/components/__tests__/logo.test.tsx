import { render, screen } from '@testing-library/react';
import Logo from '../logo';

// Mock the sidebar hook
jest.mock('@workspace/ui/components/sidebar', () => ({
  useSidebar: () => ({ state: 'expanded' }),
}));

// Mock the config
jest.mock('@/config/site', () => ({
  config: { name: 'PromptStash' },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Logo', () => {
  describe('Sidebar variant', () => {
    it('should render logo with text when sidebar is expanded', () => {
      render(<Logo variant="sidebar" />);
      expect(screen.getByText('PromptStash')).toBeInTheDocument();
    });

    it('should not show text when sidebar is collapsed', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const useSidebar = require('@workspace/ui/components/sidebar').useSidebar;
      useSidebar.mockReturnValue({ state: 'collapsed' });

      render(<Logo variant="sidebar" />);
      expect(screen.queryByText('PromptStash')).not.toBeInTheDocument();
    });
  });

  describe('Header variant', () => {
    it('should render logo with text', () => {
      render(<Logo variant="header" />);
      expect(screen.getByText('PromptStash')).toBeInTheDocument();
    });
  });

  describe('Auth-form variant', () => {
    it('should render logo with text', () => {
      render(<Logo variant="auth-form" />);
      expect(screen.getByText('PromptStash')).toBeInTheDocument();
    });
  });

  describe('NotFound variant', () => {
    it('should render logo without text', () => {
      render(<Logo variant="notFound" />);
      expect(screen.queryByText('PromptStash')).not.toBeInTheDocument();
    });
  });

  describe('Custom classes', () => {
    it('should apply custom classes', () => {
      const { container } = render(
        <Logo
          variant="default"
          classes={{
            container: 'custom-container',
            logo: 'custom-logo',
            icon: 'custom-icon',
            text: 'custom-text',
          }}
        />,
      );
      expect(container.firstChild).toHaveClass('custom-container');
    });
  });
});
