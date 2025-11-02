# Database Setup Guide

This guide will help you set up the PostgreSQL database for the PromptStash project.

## Prerequisites

- Docker and Docker Compose installed
- pnpm package manager
- Node.js 20 or higher

## Quick Start

### 1. Start PostgreSQL Container

The project includes a development Docker Compose configuration that sets up PostgreSQL on port 5434 (to avoid conflicts with other local PostgreSQL instances).

```bash
# From the project root
docker compose -f docker-compose.dev.yml up -d
```

This will:
- Create a PostgreSQL 16 container named `promptstash-postgres-dev`
- Expose the database on `localhost:5434`
- Create a database named `promptstash`
- Set up credentials: `promptstash` / `promptstash_dev_password`
- Create a persistent volume `promptstash_postgres_dev_data`

### 2. Run Database Migrations

The `.env` file in `packages/db/` has already been created with the correct connection string:

```env
DATABASE_URL="postgresql://promptstash:promptstash_dev_password@localhost:5434/promptstash"
```

Run the migration to create all tables:

```bash
# From the project root
pnpm --filter @workspace/db db:migrate

# Or from packages/db directory
cd packages/db
pnpm db:migrate
```

### 3. Seed the Database (Optional)

Populate the database with demo data including a sample user, stash, folders, files, and tags:

```bash
# From the project root
pnpm --filter @workspace/db db:seed

# Or from packages/db directory
cd packages/db
pnpm db:seed
```

The seed script creates:
- Demo user: `demo@promptstash.dev`
- Sample stash: "My PromptStash"
- Root folder structure
- Two demo CLAUDE.md files with context
- Tags: "react" and "ui"
- File version history

## Database Schema

The PromptStash database includes the following main models:

### Authentication Models
- **User**: User accounts with email verification
- **Session**: Active user sessions with tokens
- **Account**: OAuth provider integration
- **TwoFactor**: Two-factor authentication data
- **Verification**: Email verification codes

### PromptStash Models
- **Stash**: Top-level container for organizing Claude Code files
  - Scopes: USER, PROJECT, PLUGIN, MARKETPLACE
- **Folder**: Hierarchical folder structure within stashes
- **File**: Claude Code context files (CLAUDE.md, etc.)
  - Types: MARKDOWN, JSON, JSONL, YAML
- **FileVersion**: Version history for files
- **Tag**: Labels for organizing files
- **FileTag**: Many-to-many relationship between files and tags
- **FileShare**: Sharing permissions for files
  - Permissions: VIEW, EDIT, COMMENT

## Available Database Commands

From the `packages/db` directory or using pnpm filter:

```bash
# Generate Prisma Client (required after schema changes)
pnpm db:generate

# Create a new migration
pnpm db:migrate

# Deploy migrations (production)
pnpm db:deploy

# Reset database (⚠️ destructive - deletes all data)
pnpm db:reset

# Seed database with demo data
pnpm db:seed

# Format Prisma schema
pnpm format
```

## Docker Commands

```bash
# Start PostgreSQL
docker compose -f docker-compose.dev.yml up -d

# Stop PostgreSQL (keeps data)
docker compose -f docker-compose.dev.yml stop

# Stop and remove container (keeps data)
docker compose -f docker-compose.dev.yml down

# Stop and remove container + volume (⚠️ deletes all data)
docker compose -f docker-compose.dev.yml down -v

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Access PostgreSQL CLI
docker exec -it promptstash-postgres-dev psql -U promptstash -d promptstash
```

## Connection Details

- **Host**: localhost
- **Port**: 5434
- **Database**: promptstash
- **Username**: promptstash
- **Password**: promptstash_dev_password
- **Connection String**: `postgresql://promptstash:promptstash_dev_password@localhost:5434/promptstash`

## Troubleshooting

### Port Already in Use

If port 5434 is already in use, you can modify the port in `docker-compose.dev.yml`:

```yaml
ports:
  - '5435:5432'  # Change host port to 5435
```

Don't forget to update the `DATABASE_URL` in `packages/db/.env` accordingly.

### Connection Refused

If you get a connection refused error:

1. Ensure the container is running: `docker ps | grep promptstash-postgres`
2. Check the container logs: `docker compose -f docker-compose.dev.yml logs postgres`
3. Verify the container is healthy: `docker inspect promptstash-postgres-dev | grep Health`

### Migration Conflicts

If you encounter migration conflicts after pulling changes:

```bash
# Reset the database (⚠️ deletes all data)
cd packages/db
pnpm db:reset

# Then seed again
pnpm db:seed
```

## Production Setup

For production deployment, use the main `docker-compose.prod.yml` file which includes:
- Web application
- API server
- PostgreSQL database

Make sure to:
1. Set strong passwords in production `.env` files
2. Use proper SSL/TLS certificates
3. Configure backup strategies
4. Set up monitoring and alerting

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
