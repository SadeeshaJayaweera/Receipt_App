# Release Notes - Juice Receipt App v2.0.0 (Production Release)

## Release Overview
**Juice Receipt App v2.0.0** is a transformative, production-grade release that evolves the platform from an initial proof-of-concept into a commercial SaaS receipt and sales management system. Built for beverage retail, juice bars, and cafes, v2.0.0 introduces a modern Material UI design system, authoritative financial computations, multi-tenant isolation, atomic receipt sequence generation, 80mm ESC/POS continuous thermal roll printing, and complete CI/CD automation.

---

## What's New in v2.0.0

### 1. Modern Material UI Design System
- **MUI Component Ecosystem**: Built on `@mui/material` and `@emotion/react`, delivering responsive SaaS-style layouts.
- **Design Tokens**: Standardized token palette (`tokens.js`) for primary citrus greens, surface neutrals, spacing, and typography.
- **Dark & Light Mode**: Seamless theme toggling with automatic localStorage persistence.
- **AppLayout**: Persistent desktop drawer, mobile collapsible drawer, top application bar with breadcrumbs and store avatar.
- **Keyboard Shortcuts**: Power-user POS shortcuts (`F1` Help, `F2` New Receipt, `F3` History, `Alt+N`, `Esc`).

### 2. Point of Sale (POS) & Receipt Management
- **Split-Pane POS Terminal**: Menu category tabs, fast-touch flavour tiles, live order ticket, and instant search.
- **Authoritative Decimal Calculation Engine (`calcEngine.js`)**: Integer minor-unit calculations preventing floating-point rounding errors across line subtotals, item discounts, order percentage/fixed discounts, taxes, and cash change.
- **Atomic Receipt Sequence Generator (`ReceiptCounter`)**: Collision-free sequential numbering (`<PREFIX>-YYYYMM-XXXX`) with custom store prefixes.
- **Receipt Lifecycle State Machine**: Enforces `draft` -> `issued` -> `voided` transitions with financial immutability on issued sales and mandatory void audit justification.

### 3. Printing & Document Generation
- **80mm ESC/POS Continuous Thermal Printing**: Hidden iframe printing with 72mm printable thermal width, zero margin `@page { size: 80mm auto; }`, and auto-cutter trigger.
- **Dual-Format Receipt Preview**: Instant toggle between 80mm continuous thermal roll view and standard A4 invoice document view.
- **Server-Side & Client-Side PDF Export**: High-resolution vector PDF export via PDFKit and jsPDF.

### 4. Security & Architecture
- **Bcrypt Salt Rounds 12**: Industry-standard cryptographic password hashing.
- **JWT Token Revocation**: UUID `jti` embedded in tokens with active blacklist revocation on logout.
- **Rate Limiting & Abuse Prevention**: Protection against brute-force login and API flooding.
- **Multi-Tenant Data Isolation**: Every query and compound index strictly scoped to authenticated `userId`.
- **Structured JSON Logging & Observability**: Correlation tracking with `X-Request-Id`, sensitive field redaction, and `/api/health` liveness/readiness probes.

### 5. DevOps & Containerization
- **Multi-Stage Dockerfiles**: Optimized Alpine images running unprivileged non-root users (`USER node`).
- **Nginx Reverse Proxy**: Production web server with client-side SPA routing fallback and Gzip compression.
- **Docker Compose**: Unified orchestration linking MongoDB 7, backend API, and frontend web server with healthcheck dependencies.
- **GitHub Actions CI/CD Pipeline**: Automated test execution (241 tests), production bundle compilation, Docker image builds, and secret compliance checks.

---

## Upgrade & Migration Notes
- Database migrations are automatically handled by Mongoose schema initialization and compound index building.
- Set all mandatory environment variables (`MONGO_URI`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `NODE_ENV=production`) before starting the service.
- See `docs/operations/DEPLOYMENT_RUNBOOK.md` for deployment instructions.
