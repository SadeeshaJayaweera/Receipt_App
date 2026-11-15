const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('Containerization & Docker Orchestration Configuration Tests', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const backendDir = path.resolve(__dirname, '../');
  const frontendDir = path.resolve(__dirname, '../../frontend');

  test('validates backend Dockerfile exists with multi-stage build, non-root user, and health check', () => {
    const dockerfilePath = path.join(backendDir, 'Dockerfile');
    assert.ok(fs.existsSync(dockerfilePath), 'backend/Dockerfile must exist');

    const content = fs.readFileSync(dockerfilePath, 'utf8');

    // Multi-stage check
    assert.ok(content.includes('FROM node:20-alpine AS dependencies'), 'Must use multi-stage dependency stage');
    assert.ok(content.includes('FROM node:20-alpine AS runner'), 'Must use multi-stage production runner stage');

    // Security: non-root user
    assert.ok(content.includes('USER node'), 'Must specify unprivileged non-root USER node');

    // Production environment
    assert.ok(content.includes('ENV NODE_ENV=production'), 'Must set NODE_ENV=production');
    assert.ok(content.includes('EXPOSE 5001'), 'Must expose backend port 5001');

    // Health check
    assert.ok(content.includes('HEALTHCHECK'), 'Must include HEALTHCHECK instruction');
    assert.ok(content.includes('/api/health/live'), 'HEALTHCHECK must probe live endpoint');

    // Startup command
    assert.ok(content.includes('CMD ["node", "server.js"]'), 'Must start via node server.js');
  });

  test('validates frontend Dockerfile and nginx configuration for SPA routing and reverse proxy', () => {
    const dockerfilePath = path.join(frontendDir, 'Dockerfile');
    const nginxConfPath = path.join(frontendDir, 'nginx.conf');

    assert.ok(fs.existsSync(dockerfilePath), 'frontend/Dockerfile must exist');
    assert.ok(fs.existsSync(nginxConfPath), 'frontend/nginx.conf must exist');

    const dockerContent = fs.readFileSync(dockerfilePath, 'utf8');
    const nginxContent = fs.readFileSync(nginxConfPath, 'utf8');

    // Multi-stage builder to nginx
    assert.ok(dockerContent.includes('FROM node:20-alpine AS builder'), 'Frontend must build using Node alpine');
    assert.ok(dockerContent.includes('FROM nginx:1.27-alpine AS runner'), 'Frontend must serve using Nginx alpine');
    assert.ok(dockerContent.includes('HEALTHCHECK'), 'Frontend must include HEALTHCHECK');

    // Nginx SPA fallback and proxy
    assert.ok(nginxContent.includes('try_files $uri $uri/ /index.html;'), 'Nginx must support SPA client-side routing fallback');
    assert.ok(nginxContent.includes('location /api/'), 'Nginx must reverse proxy /api/ to backend service');
    assert.ok(nginxContent.includes('proxy_pass http://backend:5001/api/;'), 'Proxy must point to backend:5001');
    assert.ok(nginxContent.includes('gzip on;'), 'Nginx must enable gzip compression for assets');
    assert.ok(nginxContent.includes('X-Frame-Options'), 'Nginx must include security headers');
  });

  test('validates docker-compose.yml defines multi-container stack with dependencies, health checks, and volumes', () => {
    const composePath = path.join(rootDir, 'docker-compose.yml');
    assert.ok(fs.existsSync(composePath), 'Root docker-compose.yml must exist');

    const content = fs.readFileSync(composePath, 'utf8');

    // Required services
    assert.ok(content.includes('mongodb:'), 'Compose must define mongodb service');
    assert.ok(content.includes('backend:'), 'Compose must define backend service');
    assert.ok(content.includes('frontend:'), 'Compose must define frontend service');

    // Service dependencies and orchestration
    assert.ok(content.includes('condition: service_healthy'), 'Services must wait for upstream health checks');
    assert.ok(content.includes('mongo_data:/data/db'), 'MongoDB must use persistent named volume');
    assert.ok(content.includes('receipt-net'), 'Services must communicate on dedicated bridge network');

    // Ports
    assert.ok(content.includes('"5001:5001"'), 'Backend port 5001 must be mapped');
    assert.ok(content.includes('"3000:80"'), 'Frontend port 3000 must be mapped to Nginx port 80');
  });

  test('validates dockerignore files are present across root, backend, and frontend', () => {
    assert.ok(fs.existsSync(path.join(rootDir, '.dockerignore')), 'Root .dockerignore must exist');
    assert.ok(fs.existsSync(path.join(backendDir, '.dockerignore')), 'Backend .dockerignore must exist');
    assert.ok(fs.existsSync(path.join(frontendDir, '.dockerignore')), 'Frontend .dockerignore must exist');

    const backendDockerignore = fs.readFileSync(path.join(backendDir, '.dockerignore'), 'utf8');
    assert.ok(backendDockerignore.includes('node_modules'), 'Backend .dockerignore must exclude node_modules');
    assert.ok(backendDockerignore.includes('.env'), 'Backend .dockerignore must exclude .env');
  });
});
