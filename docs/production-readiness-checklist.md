# Production Readiness Checklist
# Generated: Sprint 5 — Stabilisation Technique 90 jours

## Infrastructure

### FastAPI Backend
- [x] Health endpoint (/health) — DB + Redis checks
- [x] Readiness probe (/ready) — K8s/Railway compatible
- [x] Structured logging (structlog)
- [x] CORS headers configured
- [x] Rate limiting (Redis-backed sliding window)
- [x] Request ID correlation (x-request-id)

### Celery Workers
- [x] JSON-only serialization
- [x] Late acknowledgment (task_acks_late=true)
- [x] Worker memory limit (512MB max)
- [x] Task recycling (200 tasks/child)
- [x] Exponential backoff with jitter
- [x] Error classification (transient/permanent/rate_limited)
- [x] Graceful shutdown (SIGTERM handling)

### Redis
- [x] Connection pooling (max 20)
- [x] Health checks (30s interval)
- [x] Distributed locking
- [x] Retry on timeout

## Security

### Authentication
- [x] JWT local verification with JWKS cache (5min TTL)
- [x] Token revocation mechanism
- [x] RBAC hierarchy (super_admin > admin > user > viewer)
- [x] Rate-limited auth (IP-based, 10 attempts/min)

### Database
- [x] RLS enabled on all user tables
- [x] SECURITY INVOKER on views (legacy compat layer)
- [x] search_path = public on all SQL functions
- [x] user_id tenant isolation enforced

### Edge Functions
- [x] secure-auth.ts for JWT verification
- [x] db-helpers.ts for tenant isolation
- [x] Input sanitization (XSS/script stripping)

## Data Pipeline

### Import (NormalizationEngine v2)
- [x] Batch error recovery (skip invalid, collect errors)
- [x] Content hashing for idempotency
- [x] Duplicate detection within batches
- [x] Field length limits enforced
- [x] URL validation (http/https only)
- [x] Configurable completeness weights

### SEO (SeoScoringEngine v1)
- [x] 5 weighted categories (title/desc/meta/images/structure)
- [x] Deterministic scoring 0-100, grades A-F
- [x] Issues sorted by impact (critical → low)
- [x] Batch scoring with aggregated stats

## Quota & Billing

### Backend (require_quota)
- [x] Atomic check-and-increment
- [x] 10 action mappings (import, AI, SEO, orders)
- [x] Plan hierarchy with upgrade suggestions
- [x] Consumption logging to consumption_logs
- [x] 402 response with structured error detail

### Frontend (useTrackedAction)
- [x] Pre-flight quota check via enforce-plan-gate
- [x] Visual warning at 80% usage
- [x] Block with upgrade CTA at 100%
- [x] Fire-and-forget consumption logging

### Dashboard (QuotaUsageWidget)
- [x] Real-time usage bars per quota key
- [x] Status badges (OK/Attention/Critique/Dépassée)
- [x] Plan indicator
- [x] Upgrade CTA on issues

## Monitoring & Observability

### Logging
- [x] structlog with contextvars (request_id, user_id, task_id)
- [x] Security event logging (denied access, rate limits)
- [x] Celery task lifecycle logging

### Metrics
- [x] System monitoring with real metrics (system-monitoring Edge Function)
- [x] Analytics persistence (analytics_insights snapshots)
- [x] Alert routing (Slack webhook + active_alerts table)

## CI/CD

### Tests
- [x] Vitest for frontend (70% coverage threshold)
- [x] Pytest for backend (auth, quota, celery, redis)
- [x] Playwright E2E smoke tests (3 specs, 10 scenarios)
- [x] Load testing k6 (scripts/load-test.js — 5 scenarios, 6 stages)

### Pipeline
- [x] GitHub Actions CI/CD (ci.yml + deploy.yml + security-scan.yml)
- [x] Security scan pipeline (CodeQL, secret detection, RLS audit)
- [ ] Blue-green deployment — Sprint 7+

## Remaining for Sprint 6+
- [x] Real-time system monitoring (replaces Prometheus)
- [x] Slack alert routing
- [x] Load testing k6 suite
- [x] GitHub Actions CI/CD + Security pipeline
- [x] P&L dashboard connected to real data
- [ ] Blue-green deployment
- [ ] Database backup verification
- [ ] API versioning strategy
