# Observability Guide

Complete guide for monitoring, alerting, and troubleshooting the application.

## Table of Contents

- [Overview](#overview)
- [Monitoring Stack](#monitoring-stack)
- [Metrics & Dashboards](#metrics--dashboards)
- [Logging](#logging)
- [Alerting Strategy](#alerting-strategy)
- [Runbooks](#runbooks)
- [Troubleshooting](#troubleshooting)

## Overview

The application includes comprehensive observability features:

- **Structured Logging** - JSON logs with request tracing
- **Metrics Collection** - Prometheus-compatible metrics
- **Health Checks** - Liveness and readiness probes
- **Performance Monitoring** - Response time tracking and slow query detection
- **Web Vitals** - Frontend performance monitoring

## Monitoring Stack

### Components

1. **Application Metrics** - Built-in Prometheus metrics at `/metrics`
2. **Health Checks** - Kubernetes-style probes at `/health/live` and `/health/ready`
3. **Structured Logs** - JSON logs via Pino (production) or pretty logs (development)
4. **Database Monitoring** - Prisma query logging with slow query detection

### Recommended External Services

For production deployments, consider integrating:

- **Prometheus** - Metrics collection and storage
- **Grafana** - Metrics visualization and dashboards
- **Loki** - Log aggregation and querying
- **Alertmanager** - Alert routing and notification
- **Sentry** - Error tracking and performance monitoring (optional)
- **Datadog** - All-in-one observability platform (alternative)

## Metrics & Dashboards

### Available Metrics

#### HTTP Request Metrics

```promql
# Request duration histogram
http_request_duration_seconds{method="GET", route="/api/users", status_code="200"}

# Total request count
http_requests_total{method="GET", route="/api/users", status_code="200"}

# Error count
http_request_errors_total{method="GET", route="/api/users", error_type="TypeError"}
```

#### Database Query Metrics

```promql
# Query duration histogram
db_query_duration_seconds{operation="findMany", model="User"}

# Total query count
db_queries_total{operation="findMany", model="User"}

# Query error count
db_query_errors_total{operation="findMany", model="User", error_type="PrismaClientKnownRequestError"}
```

#### System Metrics (Default)

```promql
# CPU usage
process_cpu_user_seconds_total

# Memory usage
process_resident_memory_bytes
nodejs_heap_size_used_bytes
nodejs_heap_size_total_bytes

# Event loop lag
nodejs_eventloop_lag_seconds

# Garbage collection
nodejs_gc_duration_seconds
```

#### Business Metrics

```promql
# Authentication attempts
auth_attempts_total{type="email", status="success"}

# Rate limit hits
rate_limit_hits_total{endpoint="/api/users", identifier_type="ip"}

# Active users
active_users_total{action="login"}
```

### Sample Grafana Dashboards

#### API Performance Dashboard

**Panels:**

1. Request Rate (req/s) - `rate(http_requests_total[5m])`
2. Error Rate - `rate(http_request_errors_total[5m])`
3. P95 Response Time - `histogram_quantile(0.95, http_request_duration_seconds)`
4. Top 10 Slowest Endpoints - `topk(10, http_request_duration_seconds)`

#### Database Performance Dashboard

**Panels:**

1. Query Rate (queries/s) - `rate(db_queries_total[5m])`
2. Query Error Rate - `rate(db_query_errors_total[5m])`
3. P99 Query Duration - `histogram_quantile(0.99, db_query_duration_seconds)`
4. Slow Queries by Model - `db_queries_total{operation="findMany"}`

#### System Health Dashboard

**Panels:**

1. CPU Usage - `rate(process_cpu_user_seconds_total[5m])`
2. Memory Usage - `process_resident_memory_bytes / 1024 / 1024` (MB)
3. Event Loop Lag - `nodejs_eventloop_lag_seconds`
4. GC Pause Time - `rate(nodejs_gc_duration_seconds_sum[5m])`

## Logging

### Log Levels

- `trace` - Very detailed debugging information
- `debug` - Debugging information, including all database queries
- `info` - General informational messages (default)
- `warn` - Warning messages for non-critical issues
- `error` - Error messages for failures
- `fatal` - Critical errors that may cause the application to crash

### Log Structure

All logs follow a consistent JSON structure:

```json
{
  "level": "info",
  "time": "2025-01-15T10:30:45.123Z",
  "service": "api",
  "env": "production",
  "pid": 12345,
  "type": "http",
  "method": "GET",
  "url": "/api/users",
  "statusCode": 200,
  "responseTime": 150,
  "requestId": "abc-123-def-456",
  "userId": "user-789",
  "msg": "GET /api/users 200 - 150ms"
}
```

### Query Logs

```json
{
  "level": "warn",
  "time": "2025-01-15T10:30:45.123Z",
  "type": "database",
  "query": "SELECT * FROM users WHERE ...",
  "duration": 1500,
  "operation": "findMany",
  "model": "User",
  "slow": true,
  "msg": "Slow database query (1500ms): findMany"
}
```

### Log Aggregation

**Using Loki (Recommended):**

```yaml
# promtail-config.yaml
server:
  http_listen_port: 9080

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: api
    static_configs:
      - targets:
          - localhost
        labels:
          job: api
          __path__: /var/log/api/*.log
```

**Query Examples:**

```logql
# All errors in the last hour
{service="api"} | json | level="error" | line_format "{{.msg}}"

# Slow queries
{service="api"} | json | type="database" | slow="true"

# Requests by user
{service="api"} | json | type="http" | userId="user-123"

# Errors by request ID
{service="api"} | json | requestId="abc-123" | level="error"
```

## Alerting Strategy

### Critical Alerts (Page Immediately)

These alerts indicate severe issues requiring immediate attention:

#### 1. Service Down

```yaml
alert: ServiceDown
expr: up{job="api"} == 0
for: 1m
labels:
  severity: critical
annotations:
  summary: "API service is down"
  description: "The API service has been down for more than 1 minute"
```

**Action:** Check service health, review logs, restart if necessary.

#### 2. High Error Rate

```yaml
alert: HighErrorRate
expr: rate(http_request_errors_total[5m]) > 10
for: 5m
labels:
  severity: critical
annotations:
  summary: "High error rate detected"
  description: "Error rate is {{ $value }} errors/second"
```

**Action:** Investigate error logs, check for recent deployments, review application health.

#### 3. Database Connection Failure

```yaml
alert: DatabaseConnectionFailure
expr: up{job="postgres"} == 0
for: 2m
labels:
  severity: critical
annotations:
  summary: "Database connection failed"
  description: "Cannot connect to PostgreSQL database"
```

**Action:** Check database service, verify credentials, check network connectivity.

#### 4. High Response Time

```yaml
alert: HighResponseTime
expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
for: 10m
labels:
  severity: critical
annotations:
  summary: "P95 response time is high"
  description: "95th percentile response time is {{ $value }}s"
```

**Action:** Check for slow queries, review system resources, analyze performance bottlenecks.

### Warning Alerts (Notify, Investigate)

These alerts indicate potential issues that should be investigated:

#### 5. Memory Usage High

```yaml
alert: HighMemoryUsage
expr: (nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes) > 0.85
for: 15m
labels:
  severity: warning
annotations:
  summary: "Memory usage is high"
  description: "Heap usage is at {{ $value }}%"
```

**Action:** Check for memory leaks, review recent changes, consider scaling.

#### 6. Slow Database Queries

```yaml
alert: SlowDatabaseQueries
expr: histogram_quantile(0.99, rate(db_query_duration_seconds_bucket[5m])) > 1
for: 10m
labels:
  severity: warning
annotations:
  summary: "Slow database queries detected"
  description: "P99 query duration is {{ $value }}s"
```

**Action:** Identify slow queries in logs, add indexes, optimize queries.

#### 7. High Rate Limit Hits

```yaml
alert: HighRateLimitHits
expr: rate(rate_limit_hits_total[5m]) > 100
for: 10m
labels:
  severity: warning
annotations:
  summary: "High rate of rate limit hits"
  description: "Rate limit is being hit {{ $value }} times/second"
```

**Action:** Investigate potential abuse, review rate limit thresholds, check for bots.

#### 8. Event Loop Lag

```yaml
alert: HighEventLoopLag
expr: nodejs_eventloop_lag_seconds > 0.1
for: 5m
labels:
  severity: warning
annotations:
  summary: "Event loop lag is high"
  description: "Event loop lag is {{ $value }}s"
```

**Action:** Check for CPU-intensive synchronous operations, review recent code changes.

### Notification Channels

**Alertmanager Configuration:**

```yaml
route:
  group_by: ["alertname", "severity"]
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: "default"
  routes:
    - match:
        severity: critical
      receiver: "pagerduty"
    - match:
        severity: warning
      receiver: "slack"

receivers:
  - name: "pagerduty"
    pagerduty_configs:
      - service_key: "<your-pagerduty-key>"
  - name: "slack"
    slack_configs:
      - api_url: "<your-slack-webhook>"
        channel: "#alerts"
  - name: "default"
    email_configs:
      - to: "ops@example.com"
```

## Runbooks

### Service Down

**Symptoms:**

- `/health` endpoint returns 503 or times out
- Application is not responding to requests

**Investigation Steps:**

1. Check service status: `systemctl status api` (or Docker/K8s equivalent)
2. Review recent logs: `tail -f /var/log/api/error.log`
3. Check system resources: `htop`, `df -h`
4. Verify database connectivity: `psql -h localhost -U user -d database`

**Resolution:**

1. If crashed, restart service: `systemctl restart api`
2. If out of resources, scale up or clear disk space
3. If database issue, check database runbook
4. If persists, rollback to previous version

**Prevention:**

- Enable auto-restart on crash
- Set up proper resource limits
- Implement gradual rollouts
- Add pre-deployment health checks

### High Error Rate

**Symptoms:**

- Error rate above normal baseline
- Multiple error logs appearing
- Users reporting issues

**Investigation Steps:**

1. Check error logs for common patterns: `grep "level.*error" /var/log/api/*.log`
2. Group errors by type and endpoint
3. Check for recent deployments
4. Review system metrics (CPU, memory, disk)
5. Check external dependencies (database, APIs)

**Resolution:**

1. If deployment related, consider rollback
2. If external dependency, implement circuit breaker or retry logic
3. If resource issue, scale up
4. If code bug, hotfix and deploy

**Prevention:**

- Implement comprehensive error handling
- Add retry logic for transient failures
- Set up canary deployments
- Increase test coverage

### Database Performance Issues

**Symptoms:**

- Slow query warnings in logs
- High database query duration metrics
- Application timeouts

**Investigation Steps:**

1. Check slow query logs: `grep "slow.*true" /var/log/api/*.log`
2. Review database performance: `EXPLAIN ANALYZE <query>`
3. Check database connections: `SELECT count(*) FROM pg_stat_activity;`
4. Review database metrics (CPU, memory, I/O)

**Resolution:**

1. Add missing indexes: `CREATE INDEX idx_name ON table(column);`
2. Optimize queries (use `SELECT` specific columns, add `LIMIT`)
3. Clear old data or archive
4. Scale database vertically or horizontally
5. Implement query caching

**Prevention:**

- Regular index maintenance
- Query performance testing
- Database monitoring and alerting
- Regular data cleanup

### Memory Leak

**Symptoms:**

- Gradually increasing memory usage
- OOM kills
- Slow performance over time

**Investigation Steps:**

1. Take heap snapshot: `kill -USR2 <pid>` (with Node.js flags)
2. Analyze heap dump with Chrome DevTools
3. Review recent code changes
4. Check for event listener leaks
5. Monitor for retained objects

**Resolution:**

1. Identify leaking code path
2. Fix and deploy
3. Restart service to clear memory
4. Monitor for recurrence

**Prevention:**

- Use WeakMap/WeakSet for caching
- Remove event listeners when done
- Implement proper cleanup in lifecycle hooks
- Regular heap snapshot analysis

## Troubleshooting

### Common Issues

#### Logs Not Appearing

**Cause:** Wrong log level or misconfigured logger

**Solution:**

```bash
# Set debug log level
export LOG_LEVEL=debug

# Restart service
systemctl restart api
```

#### Metrics Not Collected

**Cause:** Metrics not initialized or Prometheus not scraping

**Solution:**

1. Verify `/metrics` endpoint is accessible
2. Check Prometheus configuration and targets
3. Ensure `initializeMetrics()` is called at startup

#### Health Check Failing

**Cause:** Database connection or dependency issue

**Solution:**

1. Check `/health/ready` response for failing checks
2. Verify database connection: `psql -h <host> -U <user> -d <db>`
3. Check environment variables
4. Review application logs

#### High Response Times

**Cause:** Slow queries, high load, or resource constraints

**Solution:**

1. Enable query logging: `ENABLE_QUERY_LOGGING=true`
2. Identify slow queries in logs
3. Add indexes or optimize queries
4. Check system resources and scale if needed

### Debug Checklist

- [ ] Check application logs
- [ ] Review recent deployments
- [ ] Verify environment variables
- [ ] Check database connectivity
- [ ] Review system resources (CPU, memory, disk)
- [ ] Check external service dependencies
- [ ] Review metrics and dashboards
- [ ] Verify configuration files
- [ ] Check network connectivity
- [ ] Review error tracking (Sentry, etc.)

## References

- [Observability Package README](../packages/observability/README.md)
- [Prometheus Query Examples](https://prometheus.io/docs/prometheus/latest/querying/examples/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- [Loki Query Language](https://grafana.com/docs/loki/latest/logql/)
- [Node.js Best Practices - Monitoring](https://github.com/goldbergyoni/nodebestpractices#6-going-to-production-practices)
