# Conductor Logging Guide

Status: Active (Phase 7)

This document describes the conductor logging infrastructure, log formats, and analysis procedures for the RenderX Mono-Repo.

## Overview

The conductor service logs all plugin lifecycle events, sequence mounting, and performance metrics. These logs are essential for debugging plugin loading issues and monitoring system health.

## Log Format

### Console Output

Conductor logs are written to stdout/stderr with emoji prefixes for easy identification:

```
🔌 Registered plugin runtime: my-plugin
📚 Loading catalog directory /plugins/my-plugin/catalog for plugin my-plugin
✅ Mounted sequence from catalog: /plugins/my-plugin/catalog/sequences/main.json plugin: my-plugin
⚠️  Warning: Plugin took 2500ms to load
❌ Error: Failed to load plugin: my-plugin
```

### Log Levels

| Prefix | Level | Meaning |
|--------|-------|---------|
| 🔌 | INFO | Plugin registration event |
| 📚 | INFO | Catalog loading event |
| ✅ | SUCCESS | Sequence mounting success |
| ⚠️ | WARNING | Non-critical issue |
| ❌ | ERROR | Critical failure |
| ⏱️ | METRIC | Performance metric |

## Log Collection

### From Running Container

```bash
# View live logs
docker logs -f renderx-mono-repo

# Get last 100 lines
docker logs --tail 100 renderx-mono-repo

# Get logs since specific time
docker logs --since 2025-10-21T10:00:00 renderx-mono-repo
```

### Using Log Collection Script

**Linux/Mac:**
```bash
./scripts/collect-container-logs.sh renderx-mono-repo .logs
```

**Windows (PowerShell):**
```powershell
.\scripts\collect-container-logs.ps1 -ContainerName renderx-mono-repo -OutputDir .logs
```

This creates:
- `conductor-container-TIMESTAMP.json` - Structured log data
- `conductor-analysis-TIMESTAMP.md` - Analysis report
- `conductor-raw-TIMESTAMP.log` - Raw log output

## Log Analysis

### Plugin Registration Analysis

Count registered plugins:
```bash
docker logs renderx-mono-repo | grep "🔌 Registered plugin" | wc -l
```

List all registered plugins:
```bash
docker logs renderx-mono-repo | grep "🔌 Registered plugin" | sed 's/.*: //'
```

### Sequence Mounting Analysis

Count mounted sequences:
```bash
docker logs renderx-mono-repo | grep "✅ Mounted sequence" | wc -l
```

Find failed sequences:
```bash
docker logs renderx-mono-repo | grep "❌" | grep -i sequence
```

### Performance Metrics

Extract timing information:
```bash
docker logs renderx-mono-repo | grep "⏱️"
```

Identify slow plugins (>2000ms):
```bash
docker logs renderx-mono-repo | grep -E "took [2-9][0-9]{3}ms|took [0-9]{5,}ms"
```

### Error Analysis

Find all errors:
```bash
docker logs renderx-mono-repo | grep "❌"
```

Find specific error types:
```bash
docker logs renderx-mono-repo | grep -i "error\|failed\|exception"
```

## Log Storage

### Container Logs

Logs are stored in the container at `/app/logs`:

```bash
# Copy logs from container
docker cp renderx-mono-repo:/app/logs ./container-logs

# View logs in container
docker exec renderx-mono-repo ls -la /app/logs
```

### Host Logs

When using volume mounts:
```bash
docker run -v ./logs:/app/logs renderx-mono-repo:latest
```

Logs are accessible at `./logs/` on the host.

### Log Rotation

Configure log rotation in docker-compose.yml:
```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Performance Metrics

### Startup Time

Extract startup duration:
```bash
docker logs renderx-mono-repo | grep "Startup completed in"
```

### Plugin Load Times

Extract per-plugin load times:
```bash
docker logs renderx-mono-repo | grep "⏱️" | grep "plugin"
```

### Sequence Mount Times

Extract sequence mounting times:
```bash
docker logs renderx-mono-repo | grep "⏱️" | grep "sequence"
```

## Troubleshooting

### No logs appearing

**Check if container is running:**
```bash
docker ps | grep renderx-mono-repo
```

**Check container status:**
```bash
docker inspect renderx-mono-repo | grep -A 5 State
```

**View startup errors:**
```bash
docker logs renderx-mono-repo
```

### Logs are truncated

**Increase log retention:**
```bash
docker run --log-opt max-size=100m renderx-mono-repo:latest
```

**Export full logs:**
```bash
docker logs renderx-mono-repo > full-logs.txt
```

### Plugin not appearing in logs

**Verify plugin is registered:**
```bash
docker logs renderx-mono-repo | grep "plugin-name"
```

**Check plugin manifest:**
```bash
docker exec renderx-mono-repo cat /app/public/plugins/plugin-manifest.json
```

**Verify plugin path:**
```bash
docker exec renderx-mono-repo ls -la /app/packages/plugins/
```

## Log Analysis Examples

### Example 1: Verify all plugins loaded

```bash
#!/bin/bash
EXPECTED_PLUGINS=("plugin-a" "plugin-b" "plugin-c")
LOGS=$(docker logs renderx-mono-repo)

for plugin in "${EXPECTED_PLUGINS[@]}"; do
  if echo "$LOGS" | grep -q "🔌 Registered plugin runtime: $plugin"; then
    echo "✓ $plugin loaded"
  else
    echo "✗ $plugin NOT loaded"
  fi
done
```

### Example 2: Generate performance report

```bash
#!/bin/bash
echo "=== Conductor Performance Report ==="
echo ""
echo "Total plugins registered:"
docker logs renderx-mono-repo | grep "🔌 Registered plugin" | wc -l
echo ""
echo "Total sequences mounted:"
docker logs renderx-mono-repo | grep "✅ Mounted sequence" | wc -l
echo ""
echo "Total errors:"
docker logs renderx-mono-repo | grep "❌" | wc -l
echo ""
echo "Slowest operations:"
docker logs renderx-mono-repo | grep "⏱️" | sort -t' ' -k2 -rn | head -5
```

### Example 3: Export logs for analysis

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="./logs/analysis-${TIMESTAMP}"

mkdir -p "$OUTPUT_DIR"

# Export raw logs
docker logs renderx-mono-repo > "$OUTPUT_DIR/raw.log"

# Export plugin registrations
docker logs renderx-mono-repo | grep "🔌" > "$OUTPUT_DIR/plugins.log"

# Export sequences
docker logs renderx-mono-repo | grep "✅" > "$OUTPUT_DIR/sequences.log"

# Export errors
docker logs renderx-mono-repo | grep "❌" > "$OUTPUT_DIR/errors.log"

# Export metrics
docker logs renderx-mono-repo | grep "⏱️" > "$OUTPUT_DIR/metrics.log"

echo "Logs exported to: $OUTPUT_DIR"
```

## Integration with Monitoring

### Prometheus Metrics

Export conductor metrics to Prometheus:
```bash
docker exec renderx-mono-repo curl http://localhost:3000/metrics
```

### ELK Stack Integration

Send logs to Elasticsearch:
```yaml
services:
  app:
    logging:
      driver: "splunk"
      options:
        splunk-token: "${SPLUNK_TOKEN}"
        splunk-url: "https://your-splunk-instance.com"
```

### CloudWatch Logs

Send logs to AWS CloudWatch:
```yaml
services:
  app:
    logging:
      driver: "awslogs"
      options:
        awslogs-group: "/renderx/conductor"
        awslogs-region: "us-east-1"
```

## Best Practices

1. **Regular log collection**: Collect logs daily for analysis
2. **Archive old logs**: Move logs older than 30 days to archive storage
3. **Monitor for errors**: Set up alerts for ERROR level logs
4. **Track performance**: Monitor plugin load times for regressions
5. **Document issues**: Link log analysis to GitHub issues
6. **Automate analysis**: Use scripts to generate daily reports

## Related Documentation

- [CONTAINERIZATION.md](./CONTAINERIZATION.md) - Docker container management
- [DOCKER_COMPOSE.md](./DOCKER_COMPOSE.md) - Multi-service setup
- [CI_CD_PIPELINE.md](./CI_CD_PIPELINE.md) - Automated logging in CI/CD

