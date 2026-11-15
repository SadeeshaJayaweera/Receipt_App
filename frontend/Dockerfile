# Multi-stage production Dockerfile for Juice Receipt App Frontend
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package manifests
COPY package*.json ./

# Install all dependencies for build
RUN npm ci

# Copy frontend source code
COPY . ./

# Build production bundle
ENV NODE_ENV=production
RUN npm run build

# -------------------------------------------------------------
# Production Web Server Stage (Nginx Alpine)
# -------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built static files from builder stage
COPY --from=builder /usr/src/app/build /usr/share/nginx/html

# Copy custom nginx configuration with SPA fallback & API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port 80
EXPOSE 80

# Health check using nginx /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
