# PromptStash Web Application

This is the Next.js web application for PromptStash, managed in a Turborepo monorepo setup. It provides a modern UI for managing Claude Code prompts, agents, skills, commands, and settings.

## Features

- 🎨 Modern UI with shadcn/ui components
- 🌙 Dark mode support with next-themes
- 🔐 Complete authentication with Better Auth
- 📱 Responsive design for all devices
- ⌨️ Keyboard shortcuts for quick navigation
- ♿ Accessibility features (skip links, ARIA labels, screen reader support)
- 🛡️ Error boundaries for graceful error handling
- 🔒 Protected routes with authentication checks

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Then, update the variables in your `.env.local` file:

#### Database

Set your database connection URL:

```env
DATABASE_URL=your-database-connection-string
```

For example, a PostgreSQL URL:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/promptstash
```

> [!NOTE]
> You also need to update the same DATABASE_URL in the packages/db/.env file (by copying the contents of .env.example in the packages/db/ directory), as Prisma reads it from there.

#### Better Auth Secret

Set your Better Auth development secret:

```env
BETTER_AUTH_SECRET=your-dev-secret
```

You can generate a random secret using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### API URL

Set the API base URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 3. Database Setup

Run migrations or generate the client:

- Navigate to the `packages/db` directory and run:

```bash
pnpm db:generate
pnpm db:migrate
```

### 4. Run the App

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app running.

## Keyboard Shortcuts

PromptStash supports the following keyboard shortcuts for quick navigation:

- `Ctrl/Cmd + K` - Open search (coming soon)
- `Ctrl/Cmd + D` - Navigate to Dashboard
- `Ctrl/Cmd + S` - Navigate to Stash
- `Ctrl/Cmd + P` - Navigate to Profile
- `Ctrl/Cmd + ,` - Navigate to Settings
- `?` - Show keyboard shortcuts help (coming soon)

## Architecture

### Route Structure

```
app/
├── (auth)/              # Authentication routes (public)
│   ├── sign-in/
│   ├── sign-up/
│   ├── forgot-password/
│   ├── reset-password/
│   └── two-factor/
├── (default)/           # Protected routes (authenticated users only)
│   ├── dashboard/
│   ├── stash/
│   ├── profile/
│   └── (settings)/
│       └── settings/
│           ├── general/
│           └── security/
└── layout.tsx           # Root layout with providers
```

### Key Components

- **Providers**: Wraps the app with theme, query client, sidebar, and error boundary providers
- **ErrorBoundary**: Catches and displays errors gracefully
- **SkipToContent**: Accessibility feature for keyboard navigation
- **AppSidebar**: Main navigation sidebar
- **Header**: Mobile-responsive header

### API Integration

The app uses TanStack Query (React Query) for data fetching and caching. All API calls go through the `apiClient` in `lib/api-client.ts`, which provides:

- Type-safe API methods
- Consistent error handling
- Automatic retries
- Request/response caching

## Development

### Linting

```bash
pnpm lint
```

### Type Checking

```bash
pnpm check-types
```

### Building

```bash
pnpm build
```

### Production

```bash
pnpm start
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Better Auth Documentation](https://www.better-auth.com)
