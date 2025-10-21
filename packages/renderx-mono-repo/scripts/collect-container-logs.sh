#!/bin/bash
# Collect and analyze conductor logs from Docker container
# Usage: ./scripts/collect-container-logs.sh [container-name] [output-dir]

set -e

# Configuration
CONTAINER_NAME=${1:-renderx-mono-repo}
OUTPUT_DIR=${2:-.logs}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${OUTPUT_DIR}/conductor-container-${TIMESTAMP}.json"
ANALYSIS_FILE="${OUTPUT_DIR}/conductor-analysis-${TIMESTAMP}.md"

echo "=========================================="
echo "RenderX Conductor Log Collection"
echo "=========================================="
echo "Container: ${CONTAINER_NAME}"
echo "Output directory: ${OUTPUT_DIR}"
echo ""

# Create output directory
mkdir -p "${OUTPUT_DIR}"

# Check if container exists
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "ERROR: Container '${CONTAINER_NAME}' not found"
  echo "Available containers:"
  docker ps -a --format "table {{.Names}}\t{{.Status}}"
  exit 1
fi

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "WARNING: Container '${CONTAINER_NAME}' is not running"
  echo "Collecting logs from stopped container..."
fi

# Collect raw logs
echo "Step 1: Collecting raw container logs..."
docker logs "${CONTAINER_NAME}" > "${OUTPUT_DIR}/conductor-raw-${TIMESTAMP}.log" 2>&1
echo "✓ Raw logs saved to: ${OUTPUT_DIR}/conductor-raw-${TIMESTAMP}.log"

# Extract and parse logs into JSON
echo ""
echo "Step 2: Parsing logs into JSON format..."

# Create JSON structure
cat > "${LOG_FILE}" << 'EOF'
{
  "metadata": {
    "timestamp": "TIMESTAMP_PLACEHOLDER",
    "container": "CONTAINER_PLACEHOLDER",
    "collection_time": "COLLECTION_TIME_PLACEHOLDER"
  },
  "plugin_registration": [],
  "sequence_mounting": [],
  "errors": [],
  "warnings": [],
  "performance_metrics": {},
  "raw_logs": "RAW_LOGS_PLACEHOLDER"
}
EOF

# Extract plugin registrations
PLUGIN_COUNT=$(docker logs "${CONTAINER_NAME}" 2>&1 | grep -c "🔌 Registered plugin" || echo "0")
SEQUENCE_COUNT=$(docker logs "${CONTAINER_NAME}" 2>&1 | grep -c "✅ Mounted sequence" || echo "0")
ERROR_COUNT=$(docker logs "${CONTAINER_NAME}" 2>&1 | grep -c "ERROR\|error" || echo "0")
WARNING_COUNT=$(docker logs "${CONTAINER_NAME}" 2>&1 | grep -c "WARNING\|warn" || echo "0")

echo "✓ Logs parsed"
echo "  - Plugins registered: ${PLUGIN_COUNT}"
echo "  - Sequences mounted: ${SEQUENCE_COUNT}"
echo "  - Errors: ${ERROR_COUNT}"
echo "  - Warnings: ${WARNING_COUNT}"

# Create analysis report
echo ""
echo "Step 3: Creating analysis report..."

cat > "${ANALYSIS_FILE}" << EOF
# Conductor Log Analysis Report

**Generated**: $(date)
**Container**: ${CONTAINER_NAME}
**Log File**: conductor-container-${TIMESTAMP}.json

## Summary

- **Plugins Registered**: ${PLUGIN_COUNT}
- **Sequences Mounted**: ${SEQUENCE_COUNT}
- **Errors**: ${ERROR_COUNT}
- **Warnings**: ${WARNING_COUNT}

## Plugin Registration Events

\`\`\`
$(docker logs "${CONTAINER_NAME}" 2>&1 | grep "🔌 Registered plugin" || echo "No plugin registration events found")
\`\`\`

## Sequence Mounting Events

\`\`\`
$(docker logs "${CONTAINER_NAME}" 2>&1 | grep "✅ Mounted sequence" || echo "No sequence mounting events found")
\`\`\`

## Errors

\`\`\`
$(docker logs "${CONTAINER_NAME}" 2>&1 | grep -i "ERROR\|error" || echo "No errors found")
\`\`\`

## Warnings

\`\`\`
$(docker logs "${CONTAINER_NAME}" 2>&1 | grep -i "WARNING\|warn" || echo "No warnings found")
\`\`\`

## Container Status

\`\`\`
$(docker inspect "${CONTAINER_NAME}" | grep -E '"State"|"Status"|"Health"' || echo "Container status unavailable")
\`\`\`

## Performance Metrics

- **Container ID**: $(docker inspect -f '{{.Id}}' "${CONTAINER_NAME}" | cut -c1-12)
- **Image**: $(docker inspect -f '{{.Config.Image}}' "${CONTAINER_NAME}")
- **Created**: $(docker inspect -f '{{.Created}}' "${CONTAINER_NAME}")
- **Started**: $(docker inspect -f '{{.State.StartedAt}}' "${CONTAINER_NAME}")

## Recommendations

1. Review any errors or warnings above
2. Verify all expected plugins are registered
3. Check that all sequences are properly mounted
4. Monitor container health status

## Next Steps

- Review full logs: \`cat ${OUTPUT_DIR}/conductor-raw-${TIMESTAMP}.log\`
- View container logs: \`docker logs ${CONTAINER_NAME}\`
- Inspect container: \`docker inspect ${CONTAINER_NAME}\`
EOF

echo "✓ Analysis report saved to: ${ANALYSIS_FILE}"

# Copy logs from container volume if available
echo ""
echo "Step 4: Extracting logs from container volume..."
if docker exec "${CONTAINER_NAME}" test -d /app/logs 2>/dev/null; then
  docker cp "${CONTAINER_NAME}:/app/logs" "${OUTPUT_DIR}/container-logs-${TIMESTAMP}" 2>/dev/null || true
  echo "✓ Container logs extracted to: ${OUTPUT_DIR}/container-logs-${TIMESTAMP}"
else
  echo "⚠ No logs directory found in container"
fi

# Display summary
echo ""
echo "=========================================="
echo "Log Collection Completed!"
echo "=========================================="
echo ""
echo "Files created:"
echo "  - ${LOG_FILE}"
echo "  - ${ANALYSIS_FILE}"
echo "  - ${OUTPUT_DIR}/conductor-raw-${TIMESTAMP}.log"
echo ""
echo "To view the analysis:"
echo "  cat ${ANALYSIS_FILE}"
echo ""
echo "To view raw logs:"
echo "  cat ${OUTPUT_DIR}/conductor-raw-${TIMESTAMP}.log"

