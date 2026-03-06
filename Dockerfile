# Multi-stage build for CloutScape
FROM node:22-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
FROM base AS dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Build application
FROM dependencies AS build
COPY . .
RUN pnpm build

# Production image
FROM node:22-alpine AS production

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/shared ./shared

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start application
CMD ["pnpm", "start"]
