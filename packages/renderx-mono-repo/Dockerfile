# Multi-stage Dockerfile for RenderX Mono-Repo
# Stage 1: Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10.18.3

# Set working directory
WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy all packages
COPY packages ./packages

# Copy scripts and configuration
COPY scripts ./scripts
COPY tsconfig.json turbo.json eslint.config.js ./
COPY cypress.config.ts vitest.config.ts ./
COPY src ./src
COPY cypress ./cypress
COPY docs ./docs
COPY public ./public

# Install dependencies
RUN pnpm install --frozen-lockfile

# Run linting and type checking
RUN pnpm run lint
RUN pnpm run typecheck

# Run tests
RUN pnpm run test

# Build the project
RUN pnpm run build

# Stage 2: Runtime stage
FROM node:20-alpine

# Install pnpm in runtime image
RUN npm install -g pnpm@10.18.3

# Set working directory
WORKDIR /app

# Create logs directory
RUN mkdir -p /app/logs

# Copy package files from builder
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./

# Copy built packages from builder
COPY --from=builder /app/packages ./packages

# Copy scripts and configuration
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/tsconfig.json /app/turbo.json /app/eslint.config.js ./
COPY --from=builder /app/cypress.config.ts /app/vitest.config.ts ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/cypress ./cypress
COPY --from=builder /app/docs ./docs
COPY --from=builder /app/public ./public

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Expose ports
# 5173: Development server
# 4173: Preview server
# 3000: Conductor service (if applicable)
EXPOSE 5173 4173 3000

# Health check for conductor service
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV LOG_DIR=/app/logs

# Default command: start development server
CMD ["pnpm", "run", "dev"]

