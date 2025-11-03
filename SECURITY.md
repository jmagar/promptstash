# Security Implementation Guide

This document outlines the comprehensive security measures implemented in the application.

## Table of Contents

1. [CORS Configuration](#cors-configuration)
2. [CSRF Protection](#csrf-protection)
3. [Input Validation](#input-validation)
4. [Content Security Policy](#content-security-policy)
5. [Environment Variable Validation](#environment-variable-validation)
6. [Rate Limiting](#rate-limiting)
7. [Dependency Scanning](#dependency-scanning)
8. [Security Best Practices](#security-best-practices)

---

## CORS Configuration

### Implementation

CORS (Cross-Origin Resource Sharing) is configured using environment variables to support multiple origins across development and production environments.

**Location**: `apps/api/src/config/allowedOrigins.ts`

```typescript
const allowedOriginsString: string = process.env.ALLOWED_ORIGINS ?? "";
const allowedOrigins: string[] = allowedOriginsString
  .split(",")
  .map((origin) => origin.trim());
```

### Configuration

Set the `ALLOWED_ORIGINS` environment variable with comma-separated origins:

```bash
ALLOWED_ORIGINS=http://localhost:3100,https://yourdomain.com,https://www.yourdomain.com
```

### Security Features

- Dynamic origin validation
- Credentials support
- Pre-flight request handling
- Environment-specific configuration

---

## CSRF Protection

### Implementation

CSRF (Cross-Site Request Forgery) protection uses the double-submit cookie pattern with the `csrf-csrf` package.

**Location**: `apps/api/src/middleware/csrf.ts`

### Features

- Double-submit cookie pattern
- Secure, HTTP-only cookies
- Token validation on state-changing operations (POST, PUT, DELETE, PATCH)
- Multiple token sources (headers, body, query)

### Configuration

Generate a CSRF secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set in environment:

```bash
CSRF_SECRET=your-generated-secret-min-32-chars
```

### Usage

**Get CSRF Token** (Client-side):

```javascript
const response = await fetch("http://localhost:3300/api/csrf-token");
const { csrfToken } = await response.json();
```

**Include Token in Requests**:

```javascript
fetch("http://localhost:3300/api/protected-route", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-CSRF-Token": csrfToken,
  },
  body: JSON.stringify(data),
});
```

### Protected Routes

All `/api/*` routes with state-changing methods (POST, PUT, DELETE, PATCH) require CSRF tokens. GET and HEAD requests are exempt.

---

## Input Validation

### Implementation

Input validation uses both `express-validator` and `Zod` for comprehensive validation.

**Location**: `apps/api/src/middleware/validation.ts`

### Features

1. **Express Validator Chains**: Pre-built validation rules
2. **Zod Schema Validation**: Type-safe validation with TypeScript
3. **Input Sanitization**: Removes dangerous characters
4. **File Upload Validation**: Size and MIME type checks

### Common Validation Rules

```typescript
import {
  emailValidation,
  passwordValidation,
  idValidation,
  paginationValidation,
  validate,
} from "./middleware/validation";

// Use in routes
router.post(
  "/signup",
  validate([emailValidation, passwordValidation]),
  handler,
);
```

### Zod Schema Validation

```typescript
import { z } from "zod";
import { validateZod } from "./middleware/validation";

const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().positive(),
});

router.post("/user", validateZod(userSchema, "body"), handler);
```

### Input Sanitization

Automatically applied to all requests:

- Removes null bytes
- Strips control characters
- Recursively sanitizes objects and arrays

---

## Content Security Policy

### Implementation

CSP (Content Security Policy) is configured using Helmet middleware with environment-specific settings.

**Location**: `apps/api/src/server.ts`

### Production Configuration

```typescript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
}
```

### Additional Security Headers

- **HSTS**: Enforces HTTPS with 1-year max-age
- **X-Frame-Options**: Prevents clickjacking with `DENY`
- **X-Content-Type-Options**: Prevents MIME sniffing with `nosniff`
- **X-XSS-Protection**: Enables XSS filter

---

## Environment Variable Validation

### Implementation

Environment variables are validated on server startup using Zod schemas.

**Location**: `apps/api/src/config/env.ts`

### Validated Variables

- `NODE_ENV`: Must be 'development', 'production', or 'test'
- `PORT`: Must be a valid port number
- `ALLOWED_ORIGINS`: Must be a non-empty string
- `BETTER_AUTH_SECRET`: Must be at least 32 characters
- `BETTER_AUTH_URL`: Must be a valid URL
- `CSRF_SECRET`: Must be at least 32 characters (optional, with default)
- All other service-specific variables

### Usage

```typescript
import { env } from "./config/env";

// Use validated environment variables
const port = env.PORT; // Type-safe, validated
const origins = env.ALLOWED_ORIGINS; // Array of strings
```

### Startup Validation

The server will not start if environment validation fails:

```
❌ Environment variable validation failed:
  - BETTER_AUTH_SECRET: String must contain at least 32 character(s)
  - ALLOWED_ORIGINS: Required
```

---

## Rate Limiting

### Implementation

Multi-tiered rate limiting using Upstash Redis with sliding window algorithm.

**Location**: `apps/api/src/middleware/rate-limit.ts`

### Rate Limit Tiers

1. **Global API Limiter**: 100 requests per minute (IP-based)
2. **User API Limiter**: 60 requests per minute (user-based)
3. **Auth Strict Limiter**: 5 requests per 15 minutes (IP-based)
4. **File Upload Limiter**: 10 uploads per hour (user or IP-based)
5. **File Operation Limiter**: 30 operations per minute (user or IP-based)

### Configuration

Set Upstash Redis credentials:

```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### Usage in Routes

```typescript
import {
  globalRateLimit,
  userRateLimit,
  authStrictRateLimit,
  fileUploadRateLimit,
  fileOperationRateLimit,
} from "../middleware/rate-limit";

// Apply to specific routes
router.post("/auth/login", authStrictRateLimit, handler);
router.post("/files", fileUploadRateLimit, handler);
```

### Rate Limit Headers

All rate-limited responses include headers:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Timestamp when limit resets

### Rate Limit Exceeded Response

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 120
}
```

---

## Dependency Scanning

### Dependabot Configuration

**Location**: `.github/dependabot.yml`

Dependabot automatically scans for:

- npm package vulnerabilities
- GitHub Actions updates
- Docker base image updates

**Schedule**: Weekly on Mondays at 6:00 AM

**Features**:

- Groups minor and patch updates
- Separates production and development dependencies
- Auto-labels PRs with `dependencies` and `security`
- Limits open PRs to prevent noise

### CI Security Audit

**Location**: `.github/workflows/ci.yml`

The CI pipeline includes a dedicated `security-audit` job that:

1. Runs `pnpm audit --audit-level=high` (continues on error for visibility)
2. Fails the build on critical vulnerabilities: `pnpm audit --audit-level=critical`

### Manual Security Audit

Run locally:

```bash
# Check for all vulnerabilities
pnpm audit

# Check for high and critical only
pnpm audit --audit-level=high

# Automatically fix issues
pnpm audit --fix
```

---

## Security Best Practices

### 1. Secret Management

- **Never commit secrets** to version control
- Use `.env` files (gitignored) for local development
- Use secret management services (AWS Secrets Manager, HashiCorp Vault) in production
- Rotate secrets regularly (at least every 90 days)

### 2. Authentication & Authorization

- Always verify user ownership before allowing access to resources
- Use `requireAuth` middleware on protected routes
- Implement role-based access control (RBAC) where appropriate
- Never trust client-provided user IDs

### 3. Input Validation

- Validate all user inputs on the server side
- Use allowlists over denylists when possible
- Sanitize inputs to prevent injection attacks
- Validate file uploads (size, type, content)

### 4. Error Handling

- Never expose stack traces or internal errors to clients in production
- Log errors securely for debugging
- Return generic error messages to clients
- Use structured error responses

### 5. HTTPS & Transport Security

- Always use HTTPS in production
- Enable HSTS with long max-age
- Use secure cookies (`secure: true`, `httpOnly: true`, `sameSite: 'strict'`)
- Implement certificate pinning for mobile apps

### 6. Database Security

- Use parameterized queries (Prisma does this automatically)
- Never concatenate user input into SQL queries
- Implement least-privilege access for database users
- Regularly backup databases and test restoration

### 7. Monitoring & Logging

- Log security-relevant events (authentication, authorization, input validation failures)
- Monitor for suspicious patterns (repeated failed logins, unusual traffic)
- Set up alerts for security incidents
- Regularly review logs

### 8. Regular Updates

- Keep all dependencies up to date
- Apply security patches immediately
- Monitor security advisories for used packages
- Test updates in staging before production

---

## Security Checklist

Before deploying to production:

- [ ] All environment variables are set and validated
- [ ] CSRF protection is enabled
- [ ] CORS origins are properly configured
- [ ] Rate limiting is active on all routes
- [ ] HTTPS is enforced
- [ ] Security headers are configured correctly
- [ ] Input validation is applied to all routes
- [ ] Database credentials are secure and rotated
- [ ] Secrets are not hardcoded or committed
- [ ] Logging is configured and monitored
- [ ] Dependency audit shows no critical vulnerabilities
- [ ] Backup and disaster recovery plans are in place

---

## Reporting Security Issues

If you discover a security vulnerability, please email security@yourdomain.com. Do not create public GitHub issues for security vulnerabilities.

### Response Time

- **Critical vulnerabilities**: Response within 24 hours
- **High vulnerabilities**: Response within 72 hours
- **Medium vulnerabilities**: Response within 1 week
- **Low vulnerabilities**: Response within 2 weeks

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [CSRF Protection Guide](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
