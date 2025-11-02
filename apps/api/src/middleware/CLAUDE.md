# Middleware Architecture & Design

## Middleware Philosophy
- Modular, composable middleware design
- Clear separation of concerns
- Minimal side effects
- Consistent error handling
- Environment-aware configurations

## Middleware Types
1. **Authentication Middleware**
   - Validates user sessions
   - Attaches user context to request
   - Handles different authentication scenarios

2. **Rate Limiting Middleware**
   - Protects against abuse
   - Implements sliding window algorithm
   - Supports global and user-specific limits

3. **Error Handling Middleware**
   - Centralized error management
   - Prevents information leakage
   - Standardizes error responses

4. **Credentials Middleware**
   - Manages CORS credentials
   - Handles pre-flight requests
   - Secure origin management

## Rate Limiting Design Pattern
```typescript
const createRateLimitMiddleware = (
  limiter: Ratelimit,
  getIdentifier?: (req: Request) => string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = getIdentifier ? getIdentifier(req) : req.ip;
      const { success, limit, remaining, reset } = await limiter.limit(id);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', reset.toString());

      // Handle rate limit exceeded
      if (!success) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil((reset - Date.now()) / 1000)
        });
      }

      next();
    } catch (error) {
      // Fail open strategy
      console.error('Rate limit error:', error);
      next();
    }
  };
};
```

## Authentication Strategy
- JWT or session-based authentication
- Secure token validation
- User context enrichment
- Role-based access control preparation

## Error Handling Principles
- Standardized error response format
- Detailed but secure error messages
- Log errors for debugging
- Prevent sensitive information exposure

## Middleware Composition Example
```typescript
router.get('/protected-route',
  requireAuth,           // Authentication
  userRateLimit,         // User-specific rate limiting
  globalRateLimit,       // Global rate limiting
  (req, res) => {
    // Route handler
  }
);
```

## Performance Considerations
- Minimal middleware overhead
- Efficient identifier extraction
- Fail-open rate limiting
- Low-latency middleware execution

## Security Best Practices
- Validate and sanitize all inputs
- Use secure default configurations
- Implement least-privilege access
- Protect against common web vulnerabilities

## Debugging & Monitoring
- Comprehensive logging
- Detailed rate limit headers
- Error tracking
- Performance metrics

## TODO & Improvements
- [ ] Implement more granular permissions
- [ ] Add distributed rate limiting support
- [ ] Enhanced logging and tracing
- [ ] Implement circuit breaker pattern

## Advanced Configuration
- Dynamic middleware configuration
- Environment-specific middleware chains
- Pluggable middleware architecture

## Gotchas & Best Practices
- Always use `next()` in middleware
- Handle potential errors gracefully
- Be mindful of middleware order
- Use typed middleware for type safety