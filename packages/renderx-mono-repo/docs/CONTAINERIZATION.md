# Containerization Guide

Status: Active (Phase 7)

This document describes how to build, run, and manage Docker containers for the RenderX Mono-Repo.

## Overview

The RenderX Mono-Repo includes a multi-stage Dockerfile that creates production-ready Docker images with all dependencies, tests, and build artifacts included.

### Key Features

- **Multi-stage build**: Optimized for production with minimal image size
- **Health checks**: Built-in health monitoring for conductor service
- **Volume support**: Persistent logs and development file mounting
- **Port exposure**: Dev server (5173), preview server (4173), conductor (3000)
- **Environment configuration**: Flexible environment variable support

## Docker Build

### Prerequisites

- Docker 20.10+ installed and running
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- At least 4GB available disk space for image build

### Building the Image

#### Using the build script (Recommended)

**Linux/Mac:**
```bash
cd packages/renderx-mono-repo
chmod +x scripts/build-and-push-docker.sh
./scripts/build-and-push-docker.sh 1.0.0
```

**Windows (PowerShell):**
```powershell
cd packages/renderx-mono-repo
.\scripts\build-and-push-docker.ps1 -Version 1.0.0
```

#### Manual build

```bash
cd packages/renderx-mono-repo
docker build -t renderx-mono-repo:latest -t renderx-mono-repo:1.0.0 .
```

### Build Output

The build process:
1. Installs dependencies with pnpm
2. Runs linting and type checking
3. Runs unit tests
4. Builds all packages
5. Creates optimized runtime image

**Expected build time**: 5-10 minutes (depending on system)

## Running Containers

### Quick Start

```bash
docker run -d \
  --name renderx-mono-repo \
  -p 5173:5173 \
  -p 4173:4173 \
  -p 3000:3000 \
  -v logs:/app/logs \
  renderx-mono-repo:latest
```

### Using the verification script

**Linux/Mac:**
```bash
./scripts/run-and-verify-container.sh renderx-mono-repo:latest renderx-mono-repo
```

**Windows (PowerShell):**
```powershell
.\scripts\run-and-verify-container.ps1 -ImageName renderx-mono-repo:latest -ContainerName renderx-mono-repo
```

### Port Mappings

| Port | Service | Purpose |
|------|---------|---------|
| 5173 | Dev Server | Development with hot reload |
| 4173 | Preview Server | Production preview |
| 3000 | Conductor | Plugin orchestration service |

### Volume Mounts

```bash
docker run -d \
  -v /path/to/logs:/app/logs \
  -v /path/to/packages:/app/packages \
  renderx-mono-repo:latest
```

**Common volumes:**
- `/app/logs` - Application and conductor logs
- `/app/packages` - Plugin packages (for development)
- `/app/src` - Test harness and utilities

### Environment Variables

```bash
docker run -d \
  -e NODE_ENV=production \
  -e LOG_DIR=/app/logs \
  -e DEBUG=renderx:* \
  renderx-mono-repo:latest
```

**Available variables:**
- `NODE_ENV` - Set to `production` or `development`
- `LOG_DIR` - Directory for application logs (default: `/app/logs`)
- `DEBUG` - Debug namespace filter (e.g., `renderx:*`)

## Docker Compose

For local development with multiple services, use docker-compose:

```bash
cd packages/renderx-mono-repo
docker-compose up -d
```

See [DOCKER_COMPOSE.md](./DOCKER_COMPOSE.md) for detailed configuration.

## Container Management

### View logs

```bash
docker logs renderx-mono-repo
docker logs -f renderx-mono-repo  # Follow logs
```

### Check health

```bash
docker inspect --format='{{.State.Health.Status}}' renderx-mono-repo
```

### Stop container

```bash
docker stop renderx-mono-repo
```

### Remove container

```bash
docker rm renderx-mono-repo
```

### List images

```bash
docker images | grep renderx
```

## Pushing to Registry

### GitHub Container Registry (GHCR)

```bash
# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag image
docker tag renderx-mono-repo:latest ghcr.io/BPMSoftwareSolutions/renderx-mono-repo:latest

# Push
docker push ghcr.io/BPMSoftwareSolutions/renderx-mono-repo:latest
```

### Using the push script

**Linux/Mac:**
```bash
./scripts/build-and-push-docker.sh 1.0.0 ghcr.io
```

**Windows (PowerShell):**
```powershell
.\scripts\build-and-push-docker.ps1 -Version 1.0.0 -Registry ghcr.io
```

## Troubleshooting

### Container fails to start

**Check logs:**
```bash
docker logs renderx-mono-repo
```

**Common issues:**
- Port already in use: Change port mapping `-p 5174:5173`
- Insufficient disk space: Free up space and rebuild
- Permission denied: Run with `sudo` or add user to docker group

### Health check failing

```bash
# Check health status
docker inspect renderx-mono-repo | grep -A 5 Health

# Manually test conductor
curl http://localhost:3000/health
```

### Logs not persisting

Ensure volume is properly mounted:
```bash
docker inspect renderx-mono-repo | grep -A 10 Mounts
```

## Performance Optimization

### Image size

Current image size: ~500MB (optimized multi-stage build)

To reduce further:
- Use Alpine base image (trade-off: compatibility)
- Remove dev dependencies in runtime stage
- Use `.dockerignore` to exclude unnecessary files

### Build caching

Docker automatically caches layers. To force rebuild:
```bash
docker build --no-cache -t renderx-mono-repo:latest .
```

### Runtime performance

- Use `NODE_ENV=production` for optimized performance
- Mount logs to host filesystem for better I/O
- Use volume mounts for development to avoid rebuilding

## Security Considerations

- Run container as non-root user (future enhancement)
- Use read-only root filesystem where possible
- Scan images for vulnerabilities: `docker scan renderx-mono-repo:latest`
- Keep base image updated: `docker pull node:20-alpine`

## CI/CD Integration

The GitHub Actions workflow automatically:
1. Builds Docker image on push to main
2. Pushes to GHCR with version tags
3. Caches layers for faster builds
4. Runs security scanning

See `.github/workflows/ci.yml` for details.

