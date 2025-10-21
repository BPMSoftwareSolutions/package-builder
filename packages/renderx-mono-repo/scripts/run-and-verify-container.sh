#!/bin/bash
# Run Docker container and verify all services are working
# Usage: ./scripts/run-and-verify-container.sh [image-name] [container-name]

set -e

# Configuration
IMAGE_NAME=${1:-renderx-mono-repo:latest}
CONTAINER_NAME=${2:-renderx-mono-repo}
LOG_DIR="./logs"

echo "=========================================="
echo "RenderX Mono-Repo Container Verification"
echo "=========================================="
echo "Image: ${IMAGE_NAME}"
echo "Container: ${CONTAINER_NAME}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "ERROR: Docker daemon is not running"
  exit 1
fi

# Stop existing container if running
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Stopping existing container..."
  docker stop "${CONTAINER_NAME}" 2>/dev/null || true
  docker rm "${CONTAINER_NAME}" 2>/dev/null || true
fi

# Create logs directory
mkdir -p "${LOG_DIR}"

# Run the container
echo "Step 1: Starting container..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p 5173:5173 \
  -p 4173:4173 \
  -p 3000:3000 \
  -v "${PWD}/${LOG_DIR}:/app/logs" \
  -e NODE_ENV=development \
  -e LOG_DIR=/app/logs \
  "${IMAGE_NAME}"

if [ $? -eq 0 ]; then
  echo "✓ Container started successfully"
  CONTAINER_ID=$(docker ps -q -f name="${CONTAINER_NAME}")
  echo "  Container ID: ${CONTAINER_ID}"
else
  echo "✗ Failed to start container"
  exit 1
fi

# Wait for container to be ready
echo ""
echo "Step 2: Waiting for services to start..."
sleep 10

# Check container status
echo ""
echo "Step 3: Checking container status..."
docker ps -f name="${CONTAINER_NAME}"

# Check logs
echo ""
echo "Step 4: Container startup logs:"
docker logs "${CONTAINER_NAME}" | tail -50

# Verify health check
echo ""
echo "Step 5: Verifying health check..."
HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' "${CONTAINER_NAME}" 2>/dev/null || echo "none")
echo "  Health status: ${HEALTH_STATUS}"

# Check if ports are accessible
echo ""
echo "Step 6: Checking port accessibility..."

# Check dev server (5173)
if curl -s http://localhost:5173 > /dev/null 2>&1; then
  echo "  ✓ Dev server (5173) is accessible"
else
  echo "  ✗ Dev server (5173) is not accessible"
fi

# Check preview server (4173)
if curl -s http://localhost:4173 > /dev/null 2>&1; then
  echo "  ✓ Preview server (4173) is accessible"
else
  echo "  ✗ Preview server (4173) is not accessible"
fi

# Check conductor service (3000)
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
  echo "  ✓ Conductor service (3000) is accessible"
else
  echo "  ✗ Conductor service (3000) is not accessible"
fi

# Check for plugin loading in logs
echo ""
echo "Step 7: Checking for plugin loading evidence..."
if docker logs "${CONTAINER_NAME}" | grep -q "🔌 Registered plugin"; then
  echo "  ✓ Plugins are being registered"
else
  echo "  ⚠ No plugin registration evidence found yet"
fi

if docker logs "${CONTAINER_NAME}" | grep -q "✅ Mounted sequence"; then
  echo "  ✓ Sequences are being mounted"
else
  echo "  ⚠ No sequence mounting evidence found yet"
fi

# Display container info
echo ""
echo "Step 8: Container information:"
docker inspect "${CONTAINER_NAME}" | grep -E '"Id"|"Image"|"State"' | head -10

echo ""
echo "=========================================="
echo "Container verification completed!"
echo "=========================================="
echo ""
echo "Container is running at:"
echo "  Dev server: http://localhost:5173"
echo "  Preview server: http://localhost:4173"
echo "  Conductor: http://localhost:3000"
echo ""
echo "To view logs:"
echo "  docker logs -f ${CONTAINER_NAME}"
echo ""
echo "To stop container:"
echo "  docker stop ${CONTAINER_NAME}"
echo ""
echo "To remove container:"
echo "  docker rm ${CONTAINER_NAME}"

