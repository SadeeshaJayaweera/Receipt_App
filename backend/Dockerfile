# Multi-stage production Dockerfile for Juice Receipt App Backend
FROM node:20-alpine AS dependencies

WORKDIR /usr/src/app

# Install build dependencies if needed
RUN apk add --no-cache libc6-compat

# Copy package descriptors
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# -------------------------------------------------------------
# Production Runner Stage
# -------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5001

# Copy dependencies from dependencies stage
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY server.js ./
COPY src/ ./src/

# Security: Run as non-root node user provided by alpine node image
USER node

# Expose backend API port
EXPOSE 5001

# Health check using live probe endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/api/health/live || exit 1

# Start production server
CMD ["node", "server.js"]
