# Observability Setup Guide

Quick start guide for setting up observability features in development and production.

## Development Setup

### 1. Environment Variables

Create or update your `.env` files:

**API Server (`apps/api/.env`):**

```bash
# Logging
LOG_LEVEL=debug
NODE_ENV=development

# Database Query Logging
ENABLE_QUERY_LOGGING=true
SLOW_QUERY_THRESHOLD=1000

# Server
PORT=4000
```

**Web App (`apps/web/.env.local`):**

```bash
# Logging
LOG_LEVEL=info
NODE_ENV=development

# Database (for Prisma)
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
```

**Database Package (`packages/db/.env`):**

```bash
# Database Query Logging
ENABLE_QUERY_LOGGING=true
SLOW_QUERY_THRESHOLD=1000
LOG_LEVEL=debug

# Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
```

### 2. Install Dependencies

```bash
# Install all dependencies (from monorepo root)
pnpm install
```

### 3. Start Development Servers

```bash
# Start all services
pnpm dev

# Or start individually
pnpm --filter @workspace/api dev
pnpm --filter @workspace/web dev
```

### 4. Access Observability Endpoints

**API Server:**

- Health Check: http://localhost:4000/health
- Liveness Probe: http://localhost:4000/health/live
- Readiness Probe: http://localhost:4000/health/ready
- Metrics: http://localhost:4000/metrics

**Web App:**

- Web Vitals are automatically tracked and sent to `/api/analytics/web-vitals`

### 5. View Logs

Logs will appear in your terminal with pretty formatting in development mode.

**Example output:**

```
[10:30:45 AM] INFO: Server started
  port: 4000
  service: "api"

[10:30:50 AM] INFO: GET /api/users 200 - 150ms
  type: "http"
  method: "GET"
  url: "/api/users"
  statusCode: 200
  responseTime: 150
  requestId: "abc-123-def-456"
```

## Production Setup

### 1. Environment Variables

**API Server (`apps/api/.env.production`):**

```bash
# Logging
LOG_LEVEL=info
NODE_ENV=production

# Database Query Logging (disable for performance)
ENABLE_QUERY_LOGGING=false
SLOW_QUERY_THRESHOLD=2000

# Server
PORT=4000
```

**Web App (`apps/web/.env.production`):**

```bash
# Logging
LOG_LEVEL=warn
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@prod-db:5432/mydb
```

### 2. Prometheus Setup

**prometheus.yml:**

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "api"
    static_configs:
      - targets: ["api:4000"]
    metrics_path: "/metrics"

  - job_name: "postgres"
    static_configs:
      - targets: ["postgres-exporter:9187"]
```

### 3. Grafana Setup

**Add Prometheus Data Source:**

1. Go to Configuration > Data Sources
2. Add Prometheus
3. URL: http://prometheus:9090
4. Save & Test

**Import Dashboards:**

Use these dashboard IDs from grafana.com:

- Node.js Application Dashboard: 11159
- PostgreSQL Database: 9628
- Express.js Monitoring: 13377 (or create custom)

### 4. Loki Setup (Log Aggregation)

**loki-config.yaml:**

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2020-05-15
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /tmp/loki/index
  filesystem:
    directory: /tmp/loki/chunks
```

**promtail-config.yaml:**

```yaml
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
          service: api
          __path__: /var/log/api/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            msg: msg
            time: time
      - labels:
          level:
      - timestamp:
          source: time
          format: RFC3339
```

### 5. Docker Compose Setup

**docker-compose.monitoring.yml:**

```yaml
version: "3.8"

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yaml:/etc/loki/loki-config.yaml
      - loki-data:/tmp/loki
    command: -config.file=/etc/loki/loki-config.yaml

  promtail:
    image: grafana/promtail:latest
    volumes:
      - ./promtail-config.yaml:/etc/promtail/promtail-config.yaml
      - /var/log:/var/log
    command: -config.file=/etc/promtail/promtail-config.yaml

volumes:
  prometheus-data:
  grafana-data:
  loki-data:
```

**Start monitoring stack:**

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

### 6. Kubernetes Setup

**Health Check Probes:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  template:
    spec:
      containers:
        - name: api
          image: api:latest
          ports:
            - containerPort: 4000
          livenessProbe:
            httpGet:
              path: /health/live
              port: 4000
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 4000
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 2
```

**Prometheus ServiceMonitor:**

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: api
  labels:
    app: api
spec:
  selector:
    matchLabels:
      app: api
  endpoints:
    - port: http
      path: /metrics
      interval: 15s
```

### 7. Alerting Setup

**alertmanager.yml:**

```yaml
global:
  resolve_timeout: 5m
  slack_api_url: "<your-slack-webhook-url>"

route:
  group_by: ["alertname", "severity"]
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: "default"
  routes:
    - match:
        severity: critical
      receiver: "critical-alerts"
    - match:
        severity: warning
      receiver: "warning-alerts"

receivers:
  - name: "default"
    email_configs:
      - to: "ops@example.com"
        from: "alertmanager@example.com"
        smarthost: "smtp.example.com:587"
        auth_username: "alertmanager@example.com"
        auth_password: "<password>"

  - name: "critical-alerts"
    slack_configs:
      - channel: "#critical-alerts"
        title: "Critical Alert"
        text: "{{ range .Alerts }}{{ .Annotations.description }}{{ end }}"

  - name: "warning-alerts"
    slack_configs:
      - channel: "#alerts"
        title: "Warning Alert"
        text: "{{ range .Alerts }}{{ .Annotations.description }}{{ end }}"
```

**alert-rules.yml:**

```yaml
groups:
  - name: api_alerts
    interval: 30s
    rules:
      - alert: ServiceDown
        expr: up{job="api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "API service is down"
          description: "The API service has been down for more than 1 minute"

      - alert: HighErrorRate
        expr: rate(http_request_errors_total[5m]) > 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/second"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "P95 response time is high"
          description: "95th percentile response time is {{ $value }}s"

      - alert: HighMemoryUsage
        expr: (nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes) > 0.85
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Memory usage is high"
          description: "Heap usage is at {{ humanizePercentage $value }}"
```

## Testing Observability

### 1. Test Health Checks

```bash
# Liveness
curl http://localhost:4000/health/live

# Readiness
curl http://localhost:4000/health/ready

# Legacy health check
curl http://localhost:4000/health
```

### 2. Test Metrics

```bash
# View all metrics
curl http://localhost:4000/metrics

# Filter specific metric
curl http://localhost:4000/metrics | grep http_request_duration
```

### 3. Test Logging

```bash
# Generate some requests
curl http://localhost:4000/api/users
curl http://localhost:4000/api/files

# View logs
tail -f /var/log/api/combined.log
```

### 4. Test Web Vitals

1. Open browser dev tools
2. Navigate to your web app
3. Check Network tab for POST to `/api/analytics/web-vitals`
4. View API logs for web vitals data

### 5. Simulate Issues

**High Error Rate:**

```bash
# Generate errors
for i in {1..100}; do
  curl http://localhost:4000/api/nonexistent
done
```

**Slow Queries:**

```sql
-- In PostgreSQL
SELECT pg_sleep(2);
```

**High Load:**

```bash
# Use Apache Bench
ab -n 10000 -c 100 http://localhost:4000/api/users
```

## Monitoring Best Practices

1. **Start Simple** - Enable basic metrics and health checks first
2. **Add Gradually** - Implement more advanced monitoring as needed
3. **Set Thresholds** - Base alerts on historical data and SLAs
4. **Test Alerts** - Verify alerts trigger and route correctly
5. **Document** - Keep runbooks updated with resolution steps
6. **Review Regularly** - Tune alert thresholds based on false positives
7. **Secure Endpoints** - Protect `/metrics` endpoint in production

## Next Steps

1. Review the [Observability Guide](./OBSERVABILITY.md) for detailed alerting strategies
2. Check the [Observability Package README](../packages/observability/README.md) for API reference
3. Set up external monitoring services (Prometheus, Grafana, etc.)
4. Create custom dashboards for your specific needs
5. Implement error tracking with Sentry or similar service
6. Set up log aggregation for centralized logging

## Troubleshooting

See the [Troubleshooting section](./OBSERVABILITY.md#troubleshooting) in the Observability Guide.

## Support

For questions or issues with observability setup, please:

1. Check the documentation first
2. Review logs for error messages
3. Test endpoints manually
4. Open an issue with detailed information
