import { FolderKanban, Home, Settings, User } from 'lucide-react';
import { Metadata } from 'next';

export const siteConfig: Metadata = {
  title: 'PromptStash',
  description:
    'Manage and organize your Claude Code prompts, agents, skills, commands, hooks, and settings.',
  icons: {
    icon: [{ url: '/favicon.ico' }],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  keywords: [
    'promptstash',
    'claude code',
    'prompts',
    'agents',
    'skills',
    'turborepo',
    'typescript',
    'nextjs',
    'tailwindcss',
    'prisma',
    'postgresql',
    'shadcn/ui',
    'better-auth',
  ],
  openGraph: {
    title: 'PromptStash',
    description:
      'Manage and organize your Claude Code prompts, agents, skills, commands, hooks, and settings.',
    url: process.env.NEXT_PUBLIC_BASE_URL ?? 'https://promptstash.dev',
    siteName: 'PromptStash',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PromptStash',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptStash',
    description:
      'Manage and organize your Claude Code prompts, agents, skills, commands, hooks, and settings.',
    images: ['/og-image.png'],
  },
};

export const config = {
  name: 'PromptStash',
  description: siteConfig.description,
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? 'https://promptstash.dev',
  domain: process.env.NEXT_PUBLIC_DOMAIN ?? 'promptstash.dev',
  nav: [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      title: 'Stash',
      href: '/stash',
      icon: FolderKanban,
    },
    {
      title: 'Profile',
      href: '/profile',
      icon: User,
    },
    {
      title: 'Settings',
      href: '/settings/general',
      icon: Settings,
    },
  ],
};
