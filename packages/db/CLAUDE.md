# Database Management Package

## Overview

Database management package utilizing Prisma ORM with PostgreSQL, designed for type-safe, scalable data interactions.

## Prisma Configuration

- ORM: Prisma Client
- Database: PostgreSQL
- Binary Targets:
  - `native`
  - `linux-musl`
  - `linux-musl-openssl-3.0.x`

## Database Schema

The schema supports:

- User management
- Session tracking
- Account linking
- Two-Factor Authentication
- Email verification

### Key Models

- `User`: Primary user entity
- `Session`: User authentication sessions
- `Account`: External account providers
- `Verification`: Email verification tokens
- `TwoFactor`: Two-factor authentication management

## Environment Configuration

- Uses `.env` for database connection
- Supports multiple environments
- Generates client in `../generated/prisma`

## Workflow Best Practices

1. Database Schema Updates

```bash
npx prisma generate  # Generate Prisma Client
npx prisma migrate dev  # Create database migrations
```

2. Typical Database Interaction

```typescript
import { prisma } from '@/packages/db/client';

// Example user creation
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
  },
});
```

## Integration Points

- Tightly coupled with `/packages/auth`
- Provides data models for authentication flows
- Supports complex relational queries

## Security Considerations

- Use prepared statements
- Implement row-level security
- Validate and sanitize all inputs
- Use Prisma's built-in protection against SQL injection

## Notes

- Keep database schema DRY and normalized
- Use database migrations for schema changes
- Regularly update Prisma and database dependencies
- Monitor query performance
