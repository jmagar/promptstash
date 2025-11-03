import { render, screen } from '@testing-library/react';
import { SkipToContent } from '../skip-to-content';

describe('SkipToContent', () => {
  it('should render the skip to content link', () => {
    render(<SkipToContent />);
    const link = screen.getByText('Skip to main content');
    expect(link).toBeInTheDocument();
  });

  it('should have correct href attribute', () => {
    render(<SkipToContent />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('should have sr-only class for accessibility', () => {
    render(<SkipToContent />);
    const link = screen.getByRole('link');
    expect(link).toHaveClass('sr-only');
  });

  it('should have focus styles applied', () => {
    render(<SkipToContent />);
    const link = screen.getByRole('link');
    expect(link.className).toContain('focus:not-sr-only');
    expect(link.className).toContain('focus:absolute');
  });
});
