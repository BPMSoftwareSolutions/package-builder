# Docker Compose Guide

Status: Active (Phase 7)

This document describes how to use Docker Compose for local development and testing of the RenderX Mono-Repo.

## Overview

Docker Compose allows you to run the entire RenderX stack locally with a single command, including:
- Main application (dev and preview servers)
- Conductor service
- Log aggregation
- Persistent volumes for development

## Quick Start

### Prerequisites

- Docker Desktop installed (includes Docker Compose)
- At least 4GB available RAM
- At least 2GB available disk space

### Starting Services

```bash
cd packages/renderx-mono-repo
docker-compose up -d
```

### Stopping Services

```bash
docker-compose down
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f conductor
```

## Service Configuration

### Main Application Service

The `app` service runs the RenderX application with:
- Development server on port 5173
- Preview server on port 4173
- Conductor service on port 3000

**Configuration:**
```yaml
app:
  build:
    context: .
    dockerfile: Dockerfile
  ports:
    - "5173:5173"  # Dev server
    - "4173:4173"  # Preview server
    - "3000:3000"  # Conductor
  volumes:
    - ./logs:/app/logs
    - ./packages:/app/packages
    - ./src:/app/src
```

### Conductor Service

The `conductor` service runs the plugin orchestration engine:
- Manages plugin lifecycle
- Handles sequence mounting
- Provides plugin registry

**Configuration:**
```yaml
conductor:
  image: node:20-alpine
  working_dir: /app
  volumes:
    - ./packages/conductor:/app
    - ./logs:/app/logs
  environment:
    - NODE_ENV=development
    - LOG_DIR=/app/logs
```

### Log Aggregation Service

The `logs` service provides centralized log viewing:
- Tails all application logs
- Accessible via `docker-compose logs`

## Development Workflow

### Local Development with Hot Reload

```bash
# Start services
docker-compose up -d

# Watch logs
docker-compose logs -f app

# Edit files locally - changes are reflected in container
# (due to volume mounts)

# Rebuild if needed
docker-compose up -d --build
```

### Accessing Services

| Service | URL | Purpose |
|---------|-----|---------|
| Dev Server | http://localhost:5173 | Development with hot reload |
| Preview | http://localhost:4173 | Production preview |
| Conductor | http://localhost:3000 | Plugin orchestration API |

### Debugging

**View container logs:**
```bash
docker-compose logs app
```

**Execute commands in container:**
```bash
docker-compose exec app pnpm run lint
docker-compose exec app pnpm run test
```

**Access container shell:**
```bash
docker-compose exec app sh
```

## Environment Configuration

### Setting Environment Variables

**In docker-compose.yml:**
```yaml
services:
  app:
    environment:
      - NODE_ENV=development
      - LOG_DIR=/app/logs
      - DEBUG=renderx:*
```

**Via .env file:**
```bash
# Create .env file
NODE_ENV=development
LOG_DIR=/app/logs
DEBUG=renderx:*

# docker-compose automatically loads .env
docker-compose up -d
```

### Common Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| NODE_ENV | production | Set to development for hot reload |
| LOG_DIR | /app/logs | Directory for application logs |
| DEBUG | (empty) | Debug namespace filter |
| PORT | 5173 | Dev server port |

## Volume Management

### Persistent Volumes

```yaml
volumes:
  logs:
    driver: local
```

**View volumes:**
```bash
docker volume ls | grep renderx
```

**Inspect volume:**
```bash
docker volume inspect renderx-mono-repo_logs
```

**Clean up volumes:**
```bash
docker-compose down -v  # Remove volumes
```

### Bind Mounts

Mount local directories into containers:

```yaml
volumes:
  - ./logs:/app/logs           # Logs directory
  - ./packages:/app/packages   # Packages (for development)
  - ./src:/app/src             # Source files
```

**Benefits:**
- Edit files locally, changes reflected in container
- Access logs from host filesystem
- No need to rebuild for code changes

## Networking

### Service Communication

Services communicate via service names:
- `app` service can reach `conductor` at `http://conductor:3000`
- `conductor` can reach `app` at `http://app:5173`

### External Access

Services are accessible from host:
- Dev server: `http://localhost:5173`
- Conductor: `http://localhost:3000`

### Custom Network

```yaml
networks:
  renderx-network:
    driver: bridge
```

## Health Checks

### App Service Health

```bash
docker-compose exec app curl http://localhost:3000/health
```

### Conductor Service Health

```bash
docker-compose exec conductor npm run health-check
```

### View Health Status

```bash
docker-compose ps
```

## Common Tasks

### Rebuild Images

```bash
docker-compose up -d --build
```

### Run Tests

```bash
docker-compose exec app pnpm run test
```

### Run Linting

```bash
docker-compose exec app pnpm run lint
```

### Collect Logs

```bash
docker-compose exec app ./scripts/collect-container-logs.sh
```

### Clean Everything

```bash
docker-compose down -v  # Remove containers and volumes
docker system prune -a  # Remove unused images
```

## Troubleshooting

### Services won't start

**Check Docker daemon:**
```bash
docker ps
```

**View service logs:**
```bash
docker-compose logs app
docker-compose logs conductor
```

**Rebuild images:**
```bash
docker-compose down
docker-compose up -d --build
```

### Port conflicts

**Change port mappings in docker-compose.yml:**
```yaml
ports:
  - "5174:5173"  # Use 5174 instead of 5173
```

**Or kill process using port:**
```bash
# Linux/Mac
lsof -i :5173
kill -9 <PID>

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Volume permission issues

**Fix permissions:**
```bash
docker-compose exec app chown -R node:node /app/logs
```

### Out of disk space

**Clean up Docker:**
```bash
docker system prune -a
docker volume prune
```

## Performance Optimization

### Reduce Memory Usage

```yaml
services:
  app:
    mem_limit: 2g
    memswap_limit: 2g
```

### Limit CPU Usage

```yaml
services:
  app:
    cpus: '2'
    cpu_shares: 1024
```

### Optimize Build Cache

```bash
# Use BuildKit for faster builds
DOCKER_BUILDKIT=1 docker-compose up -d --build
```

## Production Considerations

### Security

- Don't expose ports unnecessarily
- Use secrets for sensitive data
- Run containers as non-root user
- Use read-only root filesystem

### Monitoring

- Enable health checks
- Set up log aggregation
- Monitor resource usage
- Set up alerts for failures

### Scaling

For production, consider:
- Kubernetes instead of Docker Compose
- Load balancing across multiple instances
- Persistent storage for logs
- Centralized logging (ELK, Splunk, etc.)

## Advanced Configuration

### Multi-environment Setup

```bash
# Development
docker-compose -f docker-compose.yml up -d

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Service Dependencies

```yaml
services:
  app:
    depends_on:
      conductor:
        condition: service_healthy
```

### Custom Entrypoint

```yaml
services:
  app:
    entrypoint: /app/scripts/custom-startup.sh
```

## Related Documentation

- [CONTAINERIZATION.md](./CONTAINERIZATION.md) - Docker container management
- [CONDUCTOR_LOGGING.md](./CONDUCTOR_LOGGING.md) - Logging and analysis
- [CI_CD_PIPELINE.md](./CI_CD_PIPELINE.md) - Automated deployment

