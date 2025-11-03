# PromptStash Port Configuration

**Updated:** 2025-11-02

## Overview

All services now run on sequential ports in the 3xxx range (3100, 3200, 3300, 3400, 3500) for clean organization and to avoid conflicts with common development tools.

## Port Assignments

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **Web App** | 3100 | http://localhost:3100 | Next.js frontend application |
| **API Server** | 3300 | http://localhost:3300 | Express backend API |
| **Prisma Studio** | 3400 | http://localhost:3400 | Database admin interface |
| **Email Preview** | 3200 | http://localhost:3200 | React Email preview server |
| **PostgreSQL** | 3500 | postgresql://localhost:3500 | Database server |

## Configuration Files

### Web App (`apps/web`)

**package.json:**
```json
{
  "scripts": {
    "dev": "next dev --turbopack --port 3100",
    "start": "next start --port 3100"
  }
}
```

**.env.local:**
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3100
NEXT_PUBLIC_API_URL=http://localhost:3300/api
BETTER_AUTH_URL=http://localhost:3100
```

### API Server (`apps/api`)

**package.json:**
```json
{
  "scripts": {
    "dev": "nodemon --exec \"node -r esbuild-register ./src/index.ts\" -e .ts"
  }
}
```

**.env:**
```env
PORT=3300
ALLOWED_ORIGINS=http://localhost:3100,https://your-production-domain.com
BETTER_AUTH_URL=http://localhost:3100
```

### Prisma Studio (`apps/studio`)

**package.json:**
```json
{
  "scripts": {
    "dev": "prisma studio --schema ../../packages/db/prisma/schema.prisma --port 3400"
  }
}
```

### Email Preview (`apps/email`)

**package.json:**
```json
{
  "scripts": {
    "dev": "email dev --port 3200 --dir ../../packages/email/src/templates"
  }
}
```

## Starting Services

### Development (All Services)
```bash
pnpm dev
```

This starts:
- ✅ Web App on port 3100
- ✅ API Server on port 3300
- ✅ Prisma Studio on port 3400
- ✅ Email Preview on port 3200
- ✅ All workspace packages in watch mode

### Individual Services

```bash
# Web App only
pnpm --filter web dev

# API Server only
pnpm --filter api dev

# Prisma Studio only
pnpm --filter studio dev

# Email Preview only
pnpm --filter email dev
```

## Accessing Services

| Service | Access URL | Notes |
|---------|-----------|-------|
| Web Application | http://localhost:3100 | Main user interface |
| API Documentation | http://localhost:3300/api | REST API endpoints |
| Database Admin | http://localhost:3400 | Prisma Studio UI |
| Email Templates | http://localhost:3200 | Email preview |

## Docker Configuration

### Development
Database runs on host port **3500** to maintain sequential port scheme:

```yaml
services:
  postgres:
    ports:
      - "3500:5432"
```

### Production
Production Docker containers use internal ports and expose through reverse proxy or load balancer.

## Troubleshooting

### Port Already in Use

If you see "Port XXXX is already in use":

1. **Check what's using the port:**
   ```bash
   lsof -i :3100  # For web app
   lsof -i :3300  # For API
   lsof -i :3400  # For Prisma Studio
   ```

2. **Kill the process:**
   ```bash
   kill -9 <PID>
   ```

3. **Or use different ports** by updating the respective `.env` files and `package.json` scripts.

### CORS Errors

If you see CORS errors:

1. Verify `ALLOWED_ORIGINS` in `apps/api/.env` includes the web app URL
2. Ensure `BETTER_AUTH_URL` matches in both web and API `.env` files
3. Check that `NEXT_PUBLIC_API_URL` points to the correct API port

### Database Connection Errors

If Prisma can't connect:

1. Verify PostgreSQL is running:
   ```bash
   docker compose -f docker-compose.dev.yml ps
   ```

2. Check `DATABASE_URL` in:
   - `apps/web/.env.local`
   - `apps/api/.env`
   - `packages/db/.env`

   All should be: `postgresql://promptstash:promptstash_dev_password@localhost:3500/promptstash`

## Notes

- **Why sequential 3xxx ports?** This scheme keeps all services in a single range (3100-3500) for easy memorization and avoids common conflicts:
  - 3000: Standard Next.js/React dev server
  - 4000: Standard Express/API server
  - 5432: Standard PostgreSQL port
  
- **Production:** In production, services typically run on standard ports (80/443) behind a reverse proxy (Nginx, Caddy, etc.)

- **Consistency:** Always keep `BETTER_AUTH_URL` and `NEXT_PUBLIC_BASE_URL` in sync across all environment files.
