'use client';

import Link from 'next/link';

export function SkipToContent() {
  return (
    <Link
      href="#main-content"
      className="focus:bg-primary focus:text-primary-foreground focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:outline-none focus:ring-2"
    >
      Skip to main content
    </Link>
  );
}
