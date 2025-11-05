# PromptStash Quick Start Guide

Get PromptStash up and running in 5 minutes!

## Prerequisites

Before you begin, make sure you have:

- **Node.js** >= 20.0.0
- **pnpm** 10.4.1 or later
- **Docker** (for PostgreSQL database)
- **Git** (to clone the repository)

## Quick Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/promptstash.git
cd promptstash

# Install dependencies (this may take a few minutes)
pnpm install
```

### 2. Start the Database

```bash
# Start PostgreSQL in Docker
docker compose -f docker-compose.dev.yml up -d

# Wait a few seconds for the database to be ready
```

This starts PostgreSQL on `localhost:5432` with:

- Database: `promptstash`
- Username: `promptstash`
- Password: `promptstash123`

### 3. Set Up Environment Variables

Create environment files with the required configuration:

**Create `apps/web/.env.local`:**

```bash
# Database
DATABASE_URL="postgresql://promptstash:promptstash123@localhost:5432/promptstash"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3100"

# Optional: Google OAuth (can skip for local development)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Optional: Email (can skip for local development)
RESEND_API_KEY=""
RESEND_FROM_EMAIL="noreply@localhost"

# Optional: Rate Limiting (can skip for local development)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Next.js
NEXT_PUBLIC_BASE_URL="http://localhost:3100"
NODE_ENV="development"
```

**Create `apps/api/.env`:**

```bash
NODE_ENV=development
PORT=3300
DATABASE_URL="postgresql://promptstash:promptstash123@localhost:5432/promptstash"
ALLOWED_ORIGINS="http://localhost:3100"

# Better Auth (must match web app)
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3100"
```

**Create `packages/db/.env`:**

```bash
DATABASE_URL="postgresql://promptstash:promptstash123@localhost:5432/promptstash"
```

**Generate a secret key:**

```bash
# Run this to generate BETTER_AUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it for `BETTER_AUTH_SECRET` in both `.env.local` and `apps/api/.env`.

### 4. Initialize the Database

```bash
# Generate Prisma client
pnpm --filter @workspace/db db:generate

# Run database migrations
pnpm --filter @workspace/db db:migrate

# Seed the database with sample data (optional)
pnpm --filter @workspace/db db:seed
```

### 5. Start the Development Servers

```bash
# Start all development servers (web + api)
pnpm dev
```

This will start:

- **Web App**: http://localhost:3100
- **API Server**: http://localhost:3300

### 6. Open PromptStash

Open your browser and navigate to:

**http://localhost:3100**

You should see the PromptStash landing page!

## First Steps

1. **Sign Up**: Create a new account at http://localhost:3100/sign-up
2. **Sign In**: Log in at http://localhost:3100/sign-in
3. **Go to Stash**: Navigate to http://localhost:3100/stash to see your files
4. **Create a File**: Click "New File" to create your first prompt/agent

## Common Issues

### Database Connection Failed

**Problem**: Cannot connect to PostgreSQL

**Solution**:

```bash
# Check if Docker container is running
docker ps

# If not running, start it
docker compose -f docker-compose.dev.yml up -d

# Check logs
docker compose -f docker-compose.dev.yml logs
```

### Port Already in Use

**Problem**: Port 3100 or 3300 is already in use

**Solution**:

```bash
# Find and kill the process using the port
lsof -ti:3100 | xargs kill -9
lsof -ti:3300 | xargs kill -9

# Or change the port in package.json
```

### Prisma Client Not Generated

**Problem**: Error about `@prisma/client` not found

**Solution**:

```bash
# Regenerate the Prisma client
pnpm --filter @workspace/db db:generate
```

### Authentication Errors

**Problem**: Cannot sign up or sign in

**Solution**:

1. Make sure `BETTER_AUTH_SECRET` is set and identical in both `.env.local` and `apps/api/.env`
2. Check that `BETTER_AUTH_URL` matches your web app URL (http://localhost:3100)
3. Clear browser cookies and try again

## Next Steps

- **[Working Demo Guide](DEMO.md)**: Learn how to use PromptStash features
- **[Database Setup Guide](DATABASE_SETUP.md)**: Advanced database configuration
- **[API Documentation](API.md)**: Explore the REST API
- **[Full Documentation](CLAUDE.md)**: Complete technical reference

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format

# Type check
pnpm check-types

# Open Prisma Studio (database GUI)
pnpm --filter @workspace/db db:studio
```

## Getting Help

If you run into issues:

1. Check the **[DEMO.md](DEMO.md)** for usage examples
2. Review **[DATABASE_SETUP.md](DATABASE_SETUP.md)** for database issues
3. Check **[API.md](API.md)** for API documentation
4. Open an issue on GitHub

Happy prompting! 🚀
