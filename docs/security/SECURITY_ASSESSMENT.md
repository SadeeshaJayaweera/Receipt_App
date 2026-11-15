# Security Assessment & Production Hardening Report

## Executive Summary
This document provides a comprehensive security assessment and production hardening evaluation of the **Juice Receipt Management Platform**. The platform processes customer sales, generates financial receipts, handles business settings, and manages menu catalogues. 

Following a defense-in-depth architectural model, the application incorporates strict perimeter controls, tenant isolation boundaries, cryptographic hardening, input sanitization, authoritative financial validation, and structured audit telemetry.

---

## OWASP Top 10 Security Architecture Matrix

| OWASP Category | Threat Surface | Implemented Defense Mechanism | Verification & Status |
| :--- | :--- | :--- | :--- |
| **A01: Broken Access Control** | Cross-tenant data leakage, unauthorized receipt mutation | Multi-tenant query isolation (`userId: req.userId`), strict Zod `.strict()` schema parsers, financial immutability on issued receipts (`status: 'issued'`). | Passed (`tests/authorization.test.js`, `tests/receiptService.test.js`) |
| **A02: Cryptographic Failures** | Compromised credentials or eavesdropping | Passwords hashed using bcrypt with work factor 12 (salt rounds = 12). Mandatory minimum 32-character JWT secrets. HTTPS enforcement in production. | Passed (`tests/authHardening.test.js`, `src/config/env.js`) |
| **A03: Injection** | NoSQL query injection, operator tampering | Express request sanitizer strips `$` and prototype keys (`__proto__`, `constructor`). All IDs parsed via `mongoose.Types.ObjectId.isValid()`. Strict Zod validation on all endpoints. | Passed (`tests/securityMiddleware.test.js`, `tests/validation.test.js`) |
| **A04: Insecure Design** | Floating point financial drift, sequence collision | Authoritative minor-unit integer calculation engine (`calcEngine.js`). Atomic `$inc` sequential counters (`ReceiptCounter`). Strict status transitions (`draft` -> `issued` -> `voided`). | Passed (`tests/calcEngine.test.js`, `tests/receiptCounter.test.js`) |
| **A05: Security Misconfiguration** | Information disclosure, permissive headers | Helmet middleware with strict CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`. CORS origin allowlisting. Fail-fast Zod environment validation at startup. | Passed (`src/middleware/security.js`, `tests/env.test.js`) |
| **A06: Vulnerable Components** | Outdated or vulnerable third-party dependencies | Clean dependency tree (`npm audit` scanning in CI). Minimal Alpine base images (`node:20-alpine`, `nginx:1.27-alpine`). Non-root container users (`USER node`). | Passed (`backend/Dockerfile`, `.github/workflows/ci.yml`) |
| **A07: Identification & Auth Failures** | Brute force, credential stuffing, stale tokens | Express rate limiting on auth endpoints (10 requests / 15 mins). UUID `jti` embedded in every JWT. Active token revocation blacklist with TTL auto-cleanup on logout. | Passed (`tests/authHardening.test.js`, `src/middleware/rateLimiter.js`) |
| **A08: Software & Data Integrity** | Client-tampered financial totals, untracked changes | Backend recalculates all subtotals, taxes, discounts, and change amounts authoritatively. Mandatory void reasons with full `statusHistory` audit logs. | Passed (`tests/receiptService.test.js`, `tests/e2eScenario.test.js`) |
| **A09: Security Logging & Monitoring** | Silent failures, credential leakage in logs | Structured JSON logger with standard log levels (`INFO`, `WARN`, `ERROR`). Correlation tracking via `X-Request-Id`. Deep recursive credential and token redaction (`password`, `token`, `authorization`). Health & readiness probes (`/api/health/live`, `/api/health/ready`). | Passed (`tests/logger.test.js`, `tests/healthObservability.test.js`) |
| **A10: Server-Side Request Forgery (SSRF)** | Malicious outbound fetch or SSRF | The application makes zero untrusted server-to-server outbound HTTP requests. Logo and business assets are stored as verified local identifiers/paths. | Verified architecture review |

---

## Detailed Hardening Specifications

### 1. Cryptographic Controls & Password Hashing
- **Work Factor**: Bcrypt work factor is explicitly locked to **12 rounds**, offering strong resistance against offline brute-force and GPU dictionary attacks while maintaining acceptable server response latency (~250ms).
- **JWT Architecture**:
  - Algorithm: `HS256` HMAC-SHA256.
  - Secret Entropy: Enforced minimum length of 32 characters validated on boot by Zod (`z.string().min(32)`).
  - Claims: Every token includes `userId`, issued-at (`iat`), expiration (`exp`), and unique UUID v4 token identifier (`jti`).
  - Revocation: `POST /api/auth/logout` records the token's `jti` in `tokenBlacklistService` with expiration matching the token's remaining TTL.

### 2. Rate Limiting & Abuse Prevention
- **Auth Perimeter**: Rate-limited to 10 requests per 15-minute window per IP (`windowMs: 15 * 60 * 1000, max: 10`), mitigating credential brute-forcing.
- **General API Perimeter**: Rate-limited to 100 requests per 15-minute window per IP.
- **Payload Size Restriction**: Express body parser strictly enforces `limit: '1mb'` to prevent memory exhaustion and DoS via oversized payloads.

### 3. Multi-Tenant Data Isolation
- Every database query across `Receipt`, `Flavour`, and `ReceiptCounter` models explicitly scopes conditions with `{ userId: req.userId }`.
- Route parameters (such as receipt IDs and flavour IDs) are strictly matched against both the resource `_id` AND the authenticated `userId`.
- Compound indexes enforce uniqueness within tenant partitions (e.g. `{ userId: 1, name: 1 }` for flavours, `{ userId: 1, prefix: 1, period: 1 }` for receipt counters).

### 4. Financial Calculations & Immutability
- Client financial computations are treated solely as UI previews; the backend calculation engine (`calcEngine.js`) recalculates all prices, line subtotals, percentage/fixed discounts, taxes, grand totals, and change amounts from scratch.
- Once a receipt transitions to `status: 'issued'`, all mutating updates (changing items, amounts, or customer data) are rejected with HTTP 400.
- Voiding a receipt requires a non-empty cancellation justification string (`voidReason`), which is permanently recorded alongside the actor's user ID and timestamp in `statusHistory`.

### 5. Sensitive Data Redaction & Telemetry
- Structured logger (`backend/src/utils/logger.js`) executes deep recursive redaction on all incoming logs, preventing accidental leakage of sensitive fields:
  - `password`, `confirmPassword`, `newPassword`, `oldPassword`
  - `token`, `jwt`, `authorization`, `refreshToken`
  - `creditCard`, `cvv`, `cardNumber`
- Correlation ID `X-Request-Id` is generated via `crypto.randomUUID()` on every incoming request and propagated to response headers and log metadata.

---

## Secret Hygiene & Environment Management
1. **Zero Secret Check-in**:
   - Live `.env` files are excluded across `.gitignore` and `.dockerignore`.
   - CI pipeline includes an automated secret leak detection step verifying no live `.env` files exist in the repository tree.
   - Example configuration (`.env.example`) contains only placeholder variables with clear descriptions.
2. **Container Security**:
   - Production Docker images run under unprivileged user `USER node` (UID 1000).
   - Docker secrets and environment variables are injected at container runtime, never baked into image layers.

---

## Conclusion & Readiness Sign-off
The application satisfies high-security small-business SaaS standards. All identified vulnerabilities have been remediated with automated unit, integration, and E2E regression test suites.
