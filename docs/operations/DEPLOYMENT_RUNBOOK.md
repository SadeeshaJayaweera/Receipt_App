# Production Deployment Runbook

## Overview
This runbook provides step-by-step operational instructions for deploying the **Juice Receipt Management Platform** to production environments. It covers containerized multi-node orchestration, cloud platform deployments (e.g. Vercel, Render, Railway, AWS ECS), environment variable configurations, zero-downtime rolling updates, and post-deployment validation.

---

## 1. System Architecture & Prerequisites

### Minimum Server Requirements
- **Compute**: 2 vCPU, 2 GB RAM (or containerized equivalent).
- **Runtime**: Node.js v20.x LTS or Docker Engine 24+.
- **Database**: MongoDB v7.0+ (MongoDB Atlas M10+ replica set recommended for high availability).
- **Network**: Port 80/443 (Reverse Proxy / Nginx), Port 5001 (Backend API), Port 27017 (MongoDB).
- **Domain & SSL**: Fully qualified domain name (FQDN) with automated TLS/SSL certificate (Let's Encrypt / Certbot / Cloudflare).

---

## 2. Environment Variables Specification

The backend enforces fail-fast startup validation using Zod. Missing required variables will safely abort startup.

| Variable Name | Required | Default | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `development` | Deployment environment mode | `production` |
| `PORT` | No | `5001` | HTTP listening port for Express API | `5001` |
| `MONGO_URI` | Yes | - | MongoDB connection string (Replica Set) | `mongodb+srv://app_user:pwd@cluster0.mongodb.net/juice_pos?retryWrites=true&w=majority` |
| `JWT_SECRET` | Yes | - | Secret for HS256 JWT signing (minimum 32 chars) | `p9$Xz#2Lm9!qW@8rK4#vB1*eY7^tN6+u` |
| `ALLOWED_ORIGINS` | Yes | - | Comma-separated CORS origin allowlist | `https://pos.citrusjuice.com,https://admin.citrusjuice.com` |
| `LOG_LEVEL` | No | `INFO` | Winston/Console logging verbosity | `INFO` or `WARN` |

---

## 3. Production Deployment Methods

### Option A: Standard Docker Compose Deployment (Recommended)

1. **Clone repository onto the target host**:
   ```bash
   git clone https://github.com/SadeeshaJayaweera/Receipt_App.git /opt/receipt_app
   cd /opt/receipt_app
   git checkout master
   ```

2. **Configure production environment file (`.env`)**:
   ```bash
   cat <<EOF > .env
   NODE_ENV=production
   PORT=5001
   MONGO_URI=mongodb://mongodb:27017/juice_pos
   JWT_SECRET=$(openssl rand -base64 36)
   ALLOWED_ORIGINS=https://pos.yourbusiness.com
   EOF
   chmod 600 .env
   ```

3. **Launch the containerized stack**:
   ```bash
   docker compose up -d --build
   ```

4. **Verify container health status**:
   ```bash
   docker compose ps
   # Ensure mongodb, backend, and frontend containers report (healthy)
   ```

---

### Option B: Cloud Hybrid Deployment (Vercel Frontend + Render/Railway Backend + Atlas)

1. **Database Setup (MongoDB Atlas)**:
   - Provision an M10 Replica Set on MongoDB Atlas in your primary business region.
   - Configure Database User with `readWrite` permissions on `juice_pos`.
   - Whitelist backend production server IP addresses.

2. **Backend Deployment (Render / Railway / AWS App Runner)**:
   - Connect repository `backend` subfolder.
   - Build Command: `npm ci --omit=dev`
   - Start Command: `node server.js`
   - Inject environment secrets (`MONGO_URI`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `NODE_ENV=production`).

3. **Frontend Deployment (Vercel)**:
   - Connect repository `frontend` subfolder.
   - Framework Preset: Create React App.
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Environment Variable: `REACT_APP_API_URL=https://api.yourbusiness.com/api`

---

## 4. Zero-Downtime Rolling Update Procedure

To update the running production service without user interruption:

1. **Pull latest validated release branch**:
   ```bash
   git fetch origin master
   git checkout master
   git pull origin master
   ```

2. **Build and test updated containers**:
   ```bash
   docker compose build backend frontend
   ```

3. **Rolling restart with zero dropped connections**:
   ```bash
   docker compose up -d --no-deps --build backend
   docker compose up -d --no-deps --build frontend
   ```

4. **Verify container health probes**:
   ```bash
   curl -f http://localhost:5001/api/health/ready || echo "Deployment readiness failed!"
   ```

---

## 5. Post-Deployment Verification (Smoke Test Checklist)

Run this checklist immediately after completing any deployment:

- [ ] Liveness Probe: `curl -I https://api.yourbusiness.com/api/health/live` returns HTTP 200.
- [ ] Readiness Probe: `curl -I https://api.yourbusiness.com/api/health/ready` returns HTTP 200 and MongoDB ping latency < 50ms.
- [ ] User Login: Submit valid credentials and verify JWT issuance.
- [ ] Catalogue Query: `GET /api/flavours` returns populated menu items with stock status.
- [ ] Receipt Creation: Create a test receipt, verify sequential counter (`RCP-YYYYMM-XXXX`) increments accurately.
- [ ] PDF & Thermal Print: Trigger preview modal and test 80mm continuous format render.
