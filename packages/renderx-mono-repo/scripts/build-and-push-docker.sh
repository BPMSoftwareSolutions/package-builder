#!/bin/bash
# Build and push Docker image to GitHub Container Registry (GHCR)
# Usage: ./scripts/build-and-push-docker.sh [version] [registry]

set -e

# Configuration
VERSION=${1:-1.0.0}
REGISTRY=${2:-ghcr.io}
OWNER=BPMSoftwareSolutions
IMAGE_NAME=renderx-mono-repo
FULL_IMAGE_NAME="${REGISTRY}/${OWNER}/${IMAGE_NAME}"

echo "=========================================="
echo "RenderX Mono-Repo Docker Build & Push"
echo "=========================================="
echo "Image: ${FULL_IMAGE_NAME}"
echo "Version: ${VERSION}"
echo "Registry: ${REGISTRY}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "ERROR: Docker daemon is not running"
  echo "Please start Docker Desktop and try again"
  exit 1
fi

# Build the image
echo "Step 1: Building Docker image..."
docker build \
  -t "${FULL_IMAGE_NAME}:latest" \
  -t "${FULL_IMAGE_NAME}:${VERSION}" \
  -t "${IMAGE_NAME}:latest" \
  -t "${IMAGE_NAME}:${VERSION}" \
  .

if [ $? -eq 0 ]; then
  echo "✓ Docker image built successfully"
else
  echo "✗ Docker build failed"
  exit 1
fi

# Display image info
echo ""
echo "Step 2: Image information:"
docker images | grep "${IMAGE_NAME}" | head -2

# Check if user wants to push to registry
echo ""
read -p "Push to ${REGISTRY}? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  # Login to GHCR if needed
  if [ "${REGISTRY}" = "ghcr.io" ]; then
    echo ""
    echo "Step 3: Authenticating with GitHub Container Registry..."
    echo "Note: You need a GitHub Personal Access Token (PAT) with 'write:packages' scope"
    echo "Visit: https://github.com/settings/tokens/new"
    echo ""
    
    read -p "GitHub username: " GITHUB_USER
    read -sp "GitHub PAT: " GITHUB_PAT
    echo ""
    
    echo "${GITHUB_PAT}" | docker login ghcr.io -u "${GITHUB_USER}" --password-stdin
    
    if [ $? -ne 0 ]; then
      echo "✗ Authentication failed"
      exit 1
    fi
    echo "✓ Authenticated with GHCR"
  fi
  
  # Push the image
  echo ""
  echo "Step 4: Pushing image to registry..."
  docker push "${FULL_IMAGE_NAME}:${VERSION}"
  docker push "${FULL_IMAGE_NAME}:latest"
  
  if [ $? -eq 0 ]; then
    echo "✓ Image pushed successfully"
    echo ""
    echo "Image available at:"
    echo "  ${FULL_IMAGE_NAME}:${VERSION}"
    echo "  ${FULL_IMAGE_NAME}:latest"
  else
    echo "✗ Push failed"
    exit 1
  fi
else
  echo "Skipping push to registry"
  echo ""
  echo "To push later, run:"
  echo "  docker push ${FULL_IMAGE_NAME}:${VERSION}"
  echo "  docker push ${FULL_IMAGE_NAME}:latest"
fi

echo ""
echo "=========================================="
echo "Build and push completed!"
echo "=========================================="

