# Observability Quick Reference

Fast reference guide for common observability tasks.

## Environment Variables

```bash
# Logging
LOG_LEVEL=debug|info|warn|error         # Log level (default: info)
NODE_ENV=development|production          # Environment mode

# Database Query Logging
ENABLE_QUERY_LOGGING=true|false         # Enable query logging (default: false)
SLOW_QUERY_THRESHOLD=1000               # Slow query threshold in ms (default: 1000)
```

## Endpoints

```bash
# Health Checks
GET /health                             # Legacy health check with DB status
GET /health/live                        # Kubernetes liveness probe
GET /health/ready                       # Kubernetes readiness probe

# Metrics
GET /metrics                            # Prometheus metrics endpoint

# Web Vitals
POST /api/analytics/web-vitals          # Web Vitals reporting endpoint
```

## Logging

### Basic Usage

```typescript
import { logger } from "@workspace/observability";

logger.info("Server started");
logger.warn("High memory usage");
logger.error("Database connection failed");
```

### Structured Logging

```typescript
logger.info({ userId: "123", action: "login" }, "User logged in");
```

### Child Logger

```typescript
import { createChildLogger } from "@workspace/observability";

const reqLogger = createChildLogger({ requestId: req.requestId });
reqLogger.info("Processing request");
```

### Error Logging

```typescript
import { logError } from "@workspace/observability";

try {
  // ...
} catch (error) {
  logError(error, { userId, operation: "payment" });
}
```

## Metrics

### Initialize (once at startup)

```typescript
import { initializeMetrics } from "@workspace/observability";

initializeMetrics({ prefix: "api_", collectInterval: 10000 });
```

### Record HTTP Request

```typescript
import { recordHttpRequest } from "@workspace/observability";

recordHttpRequest({
  method: "GET",
  route: "/api/users",
  statusCode: 200,
  duration: 150, // ms
});
```

### Record Database Query

```typescript
import { recordDbQuery } from "@workspace/observability";

recordDbQuery({
  operation: "findMany",
  model: "User",
  duration: 45, // ms
});
```

### Custom Metrics

```typescript
import { httpRequestTotal } from "@workspace/observability";

httpRequestTotal.inc({ method: "POST", route: "/api/users", status_code: 201 });
```

## Health Checks

### Setup

```typescript
import {
  createDefaultHealthCheckManager,
  createDatabaseHealthCheck,
} from "@workspace/observability";
import { db } from "@workspace/db";

const healthManager = createDefaultHealthCheckManager();

healthManager.registerCheck(
  "database",
  createDatabaseHealthCheck(async () => {
    await db.$queryRaw`SELECT 1`;
  }),
);
```

### Run Checks

```typescript
// Readiness (comprehensive)
const result = await healthManager.readiness();
// { status: 'healthy'|'degraded'|'unhealthy', checks: {...}, timestamp, uptime }

// Liveness (simple)
const liveness = await healthManager.liveness();
// { status: 'pass' }
```

## Common PromQL Queries

```promql
# Request rate (req/s)
rate(http_requests_total[5m])

# Error rate
rate(http_request_errors_total[5m])

# P95 response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# P99 query duration
histogram_quantile(0.99, rate(db_query_duration_seconds_bucket[5m]))

# Memory usage percentage
(nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes) * 100

# CPU usage
rate(process_cpu_user_seconds_total[5m]) * 100
```

## Common LogQL Queries

```logql
# All errors
{service="api"} | json | level="error"

# Slow queries
{service="api"} | json | type="database" | slow="true"

# Requests by user
{service="api"} | json | userId="user-123"

# Errors for specific request
{service="api"} | json | requestId="abc-123" | level="error"
```

## Testing Commands

```bash
# Test health endpoints
curl http://localhost:4000/health
curl http://localhost:4000/health/live
curl http://localhost:4000/health/ready

# View metrics
curl http://localhost:4000/metrics

# Generate test load
ab -n 1000 -c 10 http://localhost:4000/api/users

# Test error handling
curl http://localhost:4000/api/nonexistent
```

## Alert Thresholds

| Alert              | Threshold         | Severity |
| ------------------ | ----------------- | -------- |
| Service Down       | > 1 min           | Critical |
| High Error Rate    | > 10 err/s for 5m | Critical |
| Database Down      | > 2 min           | Critical |
| High Response Time | P95 > 2s for 10m  | Critical |
| High Memory        | > 85% for 15m     | Warning  |
| Slow Queries       | P99 > 1s for 10m  | Warning  |
| Event Loop Lag     | > 100ms for 5m    | Warning  |

## Troubleshooting Checklist

- [ ] Check service status
- [ ] Review logs (last 100 lines)
- [ ] Check /health endpoint
- [ ] Review recent deployments
- [ ] Verify environment variables
- [ ] Check database connectivity
- [ ] Review system resources
- [ ] Check external dependencies
- [ ] Review metrics dashboard
- [ ] Check error tracking

## Quick Links

- [Full Observability Guide](./OBSERVABILITY.md)
- [Setup Guide](./OBSERVABILITY_SETUP.md)
- [Package README](../packages/observability/README.md)
