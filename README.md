# 🍹 Juice Receipt App (v2.0.0 Production Release)

> An enterprise-grade SaaS receipt management, sales analytics, and POS platform tailored for juice shops, beverage retailers, and cafes.

[![CI Status](https://github.com/SadeeshaJayaweera/Receipt_App/actions/workflows/ci.yml/badge.svg)](https://github.com/SadeeshaJayaweera/Receipt_App/actions/workflows/ci.yml)
[![Node Version](https://img.shields.io/badge/node-%3E=20-brightgreen.svg)](https://nodejs.org)
[![React Version](https://img.shields.io/badge/react-19-blue.svg)](https://react.dev)
[![MUI Version](https://img.shields.io/badge/MUI-v7-007FFF.svg)](https://mui.com)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 🌟 Key Highlights & Capabilities

- 🎨 **Modern Material UI (MUI) Design**: SaaS management interface with custom design tokens, dark/light mode toggle with persistence, and keyboard shortcuts (`F1`-`F9`, `Alt+N/H/D`).
- ⚡ **Touch-Optimized POS Terminal**: Category tabs, quick-touch juice tiles, live order ticket, customer info, and instant cash change calculation.
- 🧮 **Authoritative Decimal Financial Engine**: Minor-unit integer calculation engine (`calcEngine.js`) preventing floating-point rounding errors across line items, percentage/fixed discounts, configurable taxes, and tender change.
- 🔢 **Atomic Receipt Numbering**: Collision-free sequential numbering (`<PREFIX>-YYYYMM-XXXX`) powered by atomic MongoDB `$inc` operations and custom tenant prefixes.
- 🖨️ **Dual-Format Receipt & Printing**: Continuous 80mm ESC/POS thermal printing via silent hidden iframe printing (`@page { size: 80mm auto; }`) and vector PDF export via PDFKit and jsPDF.
- 🔒 **Enterprise-Grade Security**: Bcrypt 12 salt rounds, JWT UUID `jti` tokens with active revocation blacklist on logout, Helmet headers, CORS origin allowlists, IP-based rate limiting, and recursive NoSQL query sanitization.
- 📊 **Real-Time Sales Analytics**: Aggregated KPIs (revenue, today/week/month totals, average order value), Recharts revenue trends, payment breakdowns, and top flavours leaderboard.
- 🐳 **Turnkey Docker Orchestration**: Multi-stage Dockerfiles with unprivileged non-root users (`USER node`) and `docker-compose.yml` linking MongoDB 7, backend API, and Nginx reverse proxy with health check probes.
- 🧪 **100% Automated Test Coverage**: 241 tests (146 backend tests + 95 frontend tests) spanning unit, integration, and full E2E user journeys.

---

## 🏗️ Architecture & Technology Stack

```
                          ┌─────────────────────────────────────┐
                          │         Web Browser / POS           │
                          │     React 19 + Material UI (MUI)    │
                          │   Zustand Stores + Theme Tokens     │
                          └──────────────────┬──────────────────┘
                                             │ HTTP/REST (X-Request-Id)
                                             ▼
                          ┌─────────────────────────────────────┐
                          │            Reverse Proxy            │
                          │          Nginx 1.27 Alpine          │
                          │   SPA Routing Fallback + Gzip       │
                          └──────────────────┬──────────────────┘
                                             │ Internal Network (receipt-net)
                                             ▼
                          ┌─────────────────────────────────────┐
                          │         Express.js API Node 20      │
                          │  Controllers - Services - Models    │
                          │  Authoritative calcEngine (cents)   │
                          │  Helmet + RateLimit + Sanitizer     │
                          └──────────────────┬──────────────────┘
                                             │ Mongoose Driver (Replica Set)
                                             ▼
                          ┌─────────────────────────────────────┐
                          │           MongoDB Database          │
                          │  Compound Indexes + Atomic Counters │
                          └─────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v20.x LTS & npm v10+
- MongoDB v7.0+ (or Docker Engine)

### Option 1: Run with Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/SadeeshaJayaweera/Receipt_App.git
cd Receipt_App

# Start the entire stack (MongoDB, Backend, Frontend)
docker compose up -d --build

# Verify container health status
docker compose ps
```
- Frontend application: **http://localhost:3000**
- Backend API & Health: **http://localhost:5001/api/health**

---

### Option 2: Run Locally for Development

1. **Backend Setup**:
   ```bash
   cd backend
   cp .env.example .env # Configure MONGO_URI and JWT_SECRET
   npm install
   npm run dev
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

---

## 🧪 Automated Testing

The project maintains comprehensive test coverage across both backend and frontend:

```bash
# Run backend test suite (146 tests)
cd backend && npm test

# Run frontend Vitest suite (95 tests)
cd frontend && npm test
```

---

## 📚 Documentation & Operational Runbooks

| Document | Description |
| :--- | :--- |
| **[INITIAL_AUDIT.md](file:///Users/macboookpro/Receipt_App/docs/engineering/INITIAL_AUDIT.md)** | Initial engineering audit and technical debt inventory. |
| **[FINAL_AUDIT_REPORT.md](file:///Users/macboookpro/Receipt_App/docs/engineering/FINAL_AUDIT_REPORT.md)** | Production readiness audit report and 40-PR ledger. |
| **[DEPLOYMENT_RUNBOOK.md](file:///Users/macboookpro/Receipt_App/docs/operations/DEPLOYMENT_RUNBOOK.md)** | Production deployment runbook, environment setup & zero-downtime updates. |
| **[INCIDENT_RUNBOOK.md](file:///Users/macboookpro/Receipt_App/docs/operations/INCIDENT_RUNBOOK.md)** | Severity matrix, emergency triage, and disaster recovery backup/restore. |
| **[PRINTER_SETUP_GUIDE.md](file:///Users/macboookpro/Receipt_App/docs/operations/PRINTER_SETUP_GUIDE.md)** | 80mm ESC/POS thermal printer hardware, driver, and browser setup. |
| **[SECURITY_ASSESSMENT.md](file:///Users/macboookpro/Receipt_App/docs/security/SECURITY_ASSESSMENT.md)** | Security audit, OWASP Top 10 matrix, and hardening report. |
| **[TESTING_GUIDE.md](file:///Users/macboookpro/Receipt_App/docs/testing/TESTING_GUIDE.md)** | Complete testing guide for native test runner and Vitest. |
| **[RELEASE_NOTES.md](file:///Users/macboookpro/Receipt_App/RELEASE_NOTES.md)** | Release notes for v2.0.0 production release. |

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
