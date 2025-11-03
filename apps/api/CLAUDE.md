# API Architecture & Workflow

## Core Architecture Overview

- **Framework**: Express.js (v5)
- **Runtime**: Node.js
- **Type System**: TypeScript with strict type checking
- **Environment**: Supports both development and production modes

## Server Configuration Philosophy

- Dynamically configures middleware based on environment
- Prioritizes security (helmet, CORS)
- Implements comprehensive logging
- Provides standardized error handling
- Includes built-in health check endpoint

## Middleware Strategy

- Layered middleware approach with clear separation of concerns
- Middleware execution order is crucial:
  1. Security Headers (helmet)
  2. Logging (morgan)
  3. Body Parsing (json, urlencoded)
  4. Credentials
  5. CORS
  6. Rate Limiting
  7. Authentication
  8. Routes
  9. Error Handling

## Rate Limiting Architecture

- Two-tier rate limiting strategy:
  1. Global IP-based rate limit (100 requests/minute)
  2. User-specific rate limit (60 requests/minute)
- Fail-open strategy: Allows requests if rate limiting fails
- Detailed rate limit headers returned:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Error Handling Principles

- Centralized error middleware
- Consistent error response format
- Prevents information leakage in production
- Logs errors for debugging

## Common Workflow Scenarios

### Deploying New Routes

1. Create route file in `src/routes/`
2. Import and register in `src/routes/index.ts`
3. Add appropriate middleware
4. Write comprehensive unit and integration tests

### Adding Authentication to a Route

```typescript
import { requireAuth } from '../middleware/auth';
import { userRateLimit } from '../middleware/rate-limit';

router.get(
  '/protected-route',
  requireAuth, // Ensures user is authenticated
  userRateLimit, // Applies user-specific rate limiting
  (req, res) => {
    // Route handler
  },
);
```

### Debugging Rate Limit Issues

- Check rate limit headers in response
- Verify rate limit configuration
- Confirm Redis connection
- Monitor server logs

## Performance Considerations

- Uses sliding window rate limiting
- Minimal overhead with in-memory rate limiting
- Graceful degradation under high load

## Security Best Practices

- No sensitive data exposed in health check
- CORS configured with strict origin validation
- Rate limiting prevents potential DoS attacks
- Helmet adds multiple security headers

## Environment Configuration

- Dynamically adjusts based on `NODE_ENV`
- Different logging levels in production vs development
- Configurable through environment variables

## Observability

- Morgan middleware for request logging
- Comprehensive health check endpoint
- Rate limit headers for client-side awareness

## TODO & Future Improvements

- [ ] Implement more granular rate limiting per route
- [ ] Add request tracing
- [ ] Enhanced error tracking without exposing internals
