# Development Roadmap & Milestones
## NexaCRM — AI-Powered WhatsApp CRM SaaS

**Version:** 1.0 | **Date:** August 4, 2026

---

## Overview

The project is divided into **4 phases** spanning approximately **24 weeks** from kickoff to production launch. Each phase ends with a deployable, testable milestone. Phases are designed so Phase 1 produces a usable MVP that generates early feedback before heavier features are built.

```
Phase 1 — Foundation & Core CRM          Weeks 01–08   (MVP)
Phase 2 — WhatsApp Inbox & AI             Weeks 09–16   (Core Product)
Phase 3 — Advanced Features & Polish      Weeks 17–20   (Feature Complete)
Phase 4 — Production Hardening & Launch   Weeks 21–24   (Launch-Ready)
```

---

## Phase 1 — Foundation & Core CRM (Weeks 1–8)

**Goal:** A fully working multi-tenant CRM with authentication, contacts, leads, and deals. No WhatsApp or AI yet. Can be demoed to early users and stakeholders.

---

### Milestone 1.1 — Project Bootstrap (Week 1)

**Deliverables:**
- Monorepo initialized with Turborepo
- `packages/config`: shared ESLint, Prettier, TypeScript base config
- `packages/shared-types`: empty package structure
- `apps/api`: NestJS project scaffold with health endpoint
- `apps/web`: Next.js 15 App Router scaffold with Tailwind + shadcn/ui
- Docker Compose: PostgreSQL 15 + Redis 7 + api + web containers
- Nginx reverse proxy routing `/api` → api, `/*` → web
- GitHub Actions CI: lint + type-check on pull request
- `.env.example` with all required variables documented
- Prisma initialized with database connection verified
- `GET /health` returns `{ status: "ok", db: "connected", redis: "connected" }`

**Acceptance Criteria:**
- [ ] `docker compose up` starts all services without errors
- [ ] `GET https://localhost/health` returns 200
- [ ] CI pipeline passes on a clean branch
- [ ] Both `apps/api` and `apps/web` compile with zero TypeScript errors

---

### Milestone 1.2 — Authentication System (Week 2)

**Deliverables:**
- Full Prisma schema (all tables from `04-DATABASE-SCHEMA.md`) migrated
- `POST /auth/register` — creates user + workspace
- `POST /auth/login` — returns JWT access token + httpOnly refresh cookie
- `POST /auth/refresh` — rotates refresh token
- `POST /auth/logout` — revokes refresh token
- `POST /auth/forgot-password` — sends reset email
- `POST /auth/reset-password` — validates token, updates password hash
- `GET /auth/me` — returns current user + workspaces
- `POST /auth/2fa/enable`, `/confirm`, `DELETE /auth/2fa/disable`
- JwtAuthGuard, WorkspaceGuard, RolesGuard wired globally
- Global exception filter, validation pipe, request logging interceptor
- bcrypt password hashing (cost 12)
- JWT RS256 with generated key pair
- Rate limiting: 5 req/15 min on auth endpoints
- Frontend: Login page, Register page, Forgot Password, Reset Password
- Frontend: Auth store (Zustand), API client with auto-refresh interceptor
- Frontend: Protected route middleware (redirect to /login if unauthenticated)

**Acceptance Criteria:**
- [ ] Register creates user + workspace in DB, returns tokens
- [ ] Login with wrong password returns 401, increments rate limit counter
- [ ] 6th login attempt within 15 min returns 429
- [ ] Access token expires after 15 min; refresh issues new pair
- [ ] Logout invalidates refresh token; subsequent refresh returns 401
- [ ] Password reset token expires after 1 hour
- [ ] 2FA: enable returns QR, confirm with correct TOTP code succeeds
- [ ] Frontend redirects unauthenticated users to /login
- [ ] All auth event types written to audit_log table

---

### Milestone 1.3 — Workspace & Team Management (Week 3)

**Deliverables:**
- `GET/PATCH /workspaces/:id` — workspace profile management
- `POST /workspaces/:id/logo` — logo upload via S3 pre-sign
- `GET/POST/PATCH/DELETE /workspaces/:id/members` — member management
- `POST /workspaces/:id/invitations` — email invitation flow
- `POST/GET /workspaces/:id/departments` and `/teams`
- `POST /workspaces/:id/teams/:id/members` — team membership
- `GET/POST/PATCH/DELETE /tags` and `/labels`
- `GET/POST/PATCH/DELETE /custom-fields`
- S3 storage module: presign upload + serve pre-signed GET URL
- Frontend: Settings > Company Profile page
- Frontend: Settings > Team Members page (invite, role change, deactivate)
- Frontend: Settings > Departments & Teams page

**Acceptance Criteria:**
- [ ] Workspace logo uploads to S3; logo URL stored and returned in GET
- [ ] Invitation email sent with 48-hour expiry token
- [ ] Accepting invitation creates WorkspaceMember with correct role
- [ ] Non-ADMINISTRATOR cannot access team management endpoints (403)
- [ ] Custom field CRUD works for contact/lead/deal entity types

---

### Milestone 1.4 — Contacts Module (Week 4)

**Deliverables:**
- Full contacts CRUD with soft delete + restore
- Contact search (full-text on name/phone/email/company)
- Advanced filter builder (field + operator + value with AND/OR)
- Tag assignment
- Contact notes (CRUD)
- Contact timeline (read; auto-populated by later modules)
- Custom field value CRUD on contact
- CSV import (async Bull job, up to 10,000 rows, E.164 phone validation)
- CSV export with filter
- Duplicate detection by phone + email
- Merge contacts (primary absorbs secondary)
- Frontend: Contacts list page with DataTable
- Frontend: Contact detail page with timeline + notes tabs
- Frontend: Create/Edit contact drawer
- Frontend: Import wizard (upload → preview → confirm → progress)
- Frontend: Duplicate merge modal

**Acceptance Criteria:**
- [ ] Phone stored in E.164; invalid phone rejected with 400
- [ ] Import of 10,000 row CSV completes within 60 seconds
- [ ] Import skips duplicates (same workspace + phone), reports skip count
- [ ] Deleted contacts excluded from list; restore returns them
- [ ] Merge: secondary contact's notes + tags transferred to primary
- [ ] Duplicate detection returns pairs with confidence ≥ 0.8

---

### Milestone 1.5 — Leads & Pipelines (Week 5)

**Deliverables:**
- Pipeline CRUD + stage CRUD + stage reorder
- Lead CRUD with assignment + source tracking
- Lead Kanban API (`GET /leads/kanban`)
- Lead stage move (recorded in LeadHistory)
- Lead scoring (manual entry; auto-scoring rules engine configurable)
- Follow-up reminder creation (stored in DB; notification sent by job)
- Lead convert to deal
- Frontend: Leads page (Kanban default, list toggle)
- Frontend: Lead detail side sheet
- Frontend: Pipeline & stage settings page

**Acceptance Criteria:**
- [ ] Pipeline stages can be reordered; leads reflect new order on Kanban
- [ ] Moving lead to a stage creates a LeadHistory record
- [ ] Assigning lead creates a ContactTimelineEvent
- [ ] Convert lead creates Deal + DealContact + sets lead status CONVERTED
- [ ] SALES_AGENT can only see leads assigned to them (scoped query)
- [ ] Lead score badge colors correct: ≥80 red hot, 50-79 amber warm, <50 grey

---

### Milestone 1.6 — Deals Module (Week 6)

**Deliverables:**
- Deal pipeline CRUD + deal stage CRUD
- Deal CRUD with contact linking, assignment
- Deal Kanban API (`GET /deals/kanban`)
- Deal won/lost/abandoned endpoints
- Deal revenue forecast (`GET /deals/forecast`)
- Deal notes CRUD
- Deal history log
- Frontend: Deals Kanban page
- Frontend: Deal detail page with history + notes
- Frontend: Forecast view with stacked bar chart

**Acceptance Criteria:**
- [ ] Marking deal won sets `status=WON, closedAt=now()`
- [ ] Forecast weighted value = sum(deal.value × stage.probability / 100)
- [ ] Deal history records every field change (old + new value)
- [ ] Multiple contacts can be linked to a single deal
- [ ] VIEWER role can read deals but cannot create/update/delete (403)

---

### Milestone 1.7 — Dashboard & Notifications (Week 7)

**Deliverables:**
- `GET /dashboard` — aggregated KPI endpoint (cached 60s in Redis)
- WebSocket gateway: connect, workspace rooms, user rooms
- Notifications module: create, list, mark-read, preferences
- Email notification service (SMTP)
- Bull queue: `notifications` processor
- Settings > SMTP configuration + test
- Frontend: Dashboard page (all KPI cards, charts, activity feed)
- Frontend: Notification bell + drawer (real-time updates via WebSocket)
- Frontend: Notification preferences page

**Acceptance Criteria:**
- [ ] Dashboard KPI data matches independent SQL queries
- [ ] KPI cached in Redis; second call returns cached data (< 5ms)
- [ ] WebSocket connection authenticated; unauthenticated connection rejected
- [ ] New notification emitted over WebSocket within 500ms of creation
- [ ] Email notification sent via configured SMTP within 30 seconds
- [ ] Marking all read sets `isRead=true` on all user notifications

---

### Milestone 1.8 — Phase 1 QA & Deployment (Week 8)

**Deliverables:**
- All Phase 1 unit tests written and passing (≥80% coverage)
- All Phase 1 integration tests passing
- Staging environment deployed on Docker Compose
- GitHub Actions pipeline: test → build → push image → deploy staging
- Basic Nginx security headers: CSP, HSTS, X-Frame-Options
- `prisma migrate deploy` runs cleanly in staging
- End-to-end smoke test: register → login → create contact → create lead → create deal
- Performance baseline: all Phase 1 API endpoints < 200ms P95 under 50 concurrent users

**Acceptance Criteria:**
- [ ] Zero open P0/P1 bugs from QA review
- [ ] Staging deployment succeeds via CI/CD with zero manual steps
- [ ] Smoke test passes on staging
- [ ] Security headers verified with securityheaders.com (grade A)

---

## Phase 2 — WhatsApp Inbox & AI (Weeks 9–16)

**Goal:** The core differentiator. A fully functional WhatsApp inbox with real-time messaging, and AI-powered features across the CRM.

---

### Milestone 2.1 — WhatsApp Infrastructure (Week 9)

**Deliverables:**
- WorkspaceSettings CRUD (WhatsApp fields)
- `GET /settings/whatsapp` + `PATCH` + `POST /test`
- Meta webhook verification endpoint (`GET /webhooks/whatsapp`)
- Webhook receiver (`POST /webhooks/whatsapp`) with HMAC-SHA256 validation
- Idempotency: reject duplicate `whatsappMsgId` (Redis bloom filter or DB unique)
- Inbound message processor: text, image, audio, video, document
- Media download + S3 storage pipeline
- Conversation upsert on first message from a phone number
- Meta Graph API adapter: send text, send media, send template
- Bull queue: `message-scheduler` processor

**Acceptance Criteria:**
- [ ] Webhook GET verification returns hub.challenge correctly
- [ ] Duplicate webhook delivery (same whatsappMsgId) processed only once
- [ ] HMAC signature mismatch returns 403
- [ ] Inbound image message: media downloaded, stored in S3, mediaUrl saved
- [ ] Message send returns whatsappMsgId from Meta API
- [ ] Unsupported message type logged as SYSTEM message, not crashed

---

### Milestone 2.2 — Real-Time Inbox UI (Week 10)

**Deliverables:**
- Conversations API: list, get, CRUD labels, assign, archive, pin
- Messages API: list, send (text/media/template), schedule, cancel schedule
- Internal notes API
- Quick replies CRUD
- Message status webhook processing: sent → delivered → read
- WebSocket events: `message:new`, `message:status`, `typing:start/stop`, `conversation:updated`
- Frontend: Two-panel inbox layout
- Frontend: Conversation list with real-time updates
- Frontend: Chat window with MessageList (virtualized scroll)
- Frontend: Message bubbles (inbound/outbound, media, internal notes)
- Frontend: Message composer (text, emoji picker, file attach)
- Frontend: Typing indicator (sent to server, broadcast to other agents)
- Frontend: Read receipts (✓ sent, ✓✓ delivered, ✓✓ blue read)
- Frontend: Assign conversation, status change
- Frontend: Contact sidebar panel (toggle)

**Acceptance Criteria:**
- [ ] New inbound message appears in UI within 500ms (WebSocket)
- [ ] Sending a message shows optimistic UI, updates status on webhook
- [ ] Typing indicator clears automatically after 3s with no keystroke
- [ ] Conversation list sorted by lastMessageAt descending
- [ ] Unread count badge updates in real time
- [ ] Image message opens full-screen lightbox on click
- [ ] PDF message shows preview icon with file name and size
- [ ] Mobile layout: conversation list and chat window stack correctly

---

### Milestone 2.3 — Templates, Broadcasts & Quick Replies (Week 11)

**Deliverables:**
- Message templates CRUD + sync from Meta API
- Template picker modal in composer
- Broadcast CRUD + send + schedule
- Broadcast processor (Bull queue, fan-out with rate limiting)
- Broadcast recipient tracking (status per contact)
- Quick replies CRUD + `/shortcut` trigger in composer
- Message scheduling UI
- Frontend: Template picker modal
- Frontend: Quick replies panel (slide-up from composer)
- Frontend: Schedule message modal with date/time picker
- Frontend: Broadcasts list + create page

**Acceptance Criteria:**
- [ ] Only APPROVED templates can be selected for sending
- [ ] Template variable substitution works correctly (`{{1}}` → actual value)
- [ ] Broadcast with 1,000 recipients dispatches all messages within 5 min
- [ ] Failed broadcast messages retried up to 3 times
- [ ] Quick reply `/pricing` shortcut inserts matching snippet into composer
- [ ] Scheduled message dispatched within 60 seconds of scheduledAt

---

### Milestone 2.4 — AI Core (Week 12)

**Deliverables:**
- WorkspaceSettings AI fields + settings page
- `AIProviderFactory` with OpenAI adapter (primary), Anthropic + Gemini stubs
- All prompt templates: suggest-reply, summarize, rewrite, translate, grammar, followup, qualify, sentiment, suggest-tags, insights
- All AI endpoints from spec (section 9 of API spec)
- AI usage logging (AiUsageLog table)
- Bull queue: `ai-analysis` processor for async tasks
- Circuit breaker on AI provider calls
- Frontend: AI suggest-reply panel (above composer, with Use buttons)
- Frontend: AI conversation summary (button in chat header)
- Frontend: AI rewrite button (inline in composer)
- Frontend: AI badge on all AI-generated content
- Frontend: AI settings page (provider, API key, model)

**Acceptance Criteria:**
- [ ] Suggest-reply returns 3 options within 3 seconds
- [ ] Conversation summary returns 3–5 bullets within 5 seconds
- [ ] If AI provider unavailable: graceful degradation, user sees notice
- [ ] AI usage token counts written to ai_usage_logs table on every call
- [ ] Non-configured workspace returns 422 "AI provider not configured"
- [ ] OpenAI API key stored encrypted; never returned in plaintext API response

---

### Milestone 2.5 — AI Advanced Features (Week 13)

**Deliverables:**
- Lead qualification endpoint (`POST /ai/qualify-lead`)
- Sentiment analysis endpoint
- Suggest tags endpoint
- AI search endpoint (semantic search using embeddings)
- Dashboard AI insights endpoint
- Frontend: Lead Kanban — AI qualify button on card
- Frontend: Sentiment badge in conversation list + chat header
- Frontend: AI insights banner on dashboard
- Frontend: AI search in top nav (⌘K enhanced with semantic results)

**Acceptance Criteria:**
- [ ] Lead qualification writes updated score to Lead table
- [ ] Sentiment score displayed as colored badge (🟢🟡🔴)
- [ ] AI search returns relevant results across contacts/conversations/deals
- [ ] Dashboard insights generated fresh if data changed since last cache
- [ ] AI tag suggestions shown as chips the agent can accept/dismiss

---

### Milestone 2.6 — Tasks & Calendar (Week 14)

**Deliverables:**
- Tasks full CRUD with contact/lead/deal linking
- Task completion endpoint
- Task due reminder (Bull queue, fires at `remindAt`)
- Calendar events CRUD with attendees
- Calendar event reminders
- Reports module skeleton + sales report endpoint
- Frontend: Tasks page (Kanban + List views)
- Frontend: Calendar page (month/week/day views using react-big-calendar or custom)
- Frontend: Task form drawer
- Frontend: Calendar event create/edit/popover

**Acceptance Criteria:**
- [ ] Task reminder notification sent via email + in-app at `remindAt`
- [ ] Overdue tasks highlighted in red
- [ ] Calendar event linked to deal appears in deal timeline
- [ ] Drag-and-drop event rescheduling updates DB via PATCH

---

### Milestone 2.7 — Full Reports Module (Week 15)

**Deliverables:**
- All report endpoints: sales, revenue, agent performance, customer growth, pipeline, WhatsApp analytics, response time
- Report export: PDF generation (Puppeteer/html-pdf) + CSV
- Bull queue: `report-generation` processor
- Frontend: Reports page with all 5 tabs
- Frontend: Date range picker for all reports
- Frontend: Export buttons (PDF + CSV)
- Frontend: All chart types (bar, line, funnel, table)

**Acceptance Criteria:**
- [ ] All reports return accurate data verified against manual SQL
- [ ] Report with 1-year date range returns within 5 seconds
- [ ] PDF export contains same data as screen view
- [ ] Agent performance response time matches message timestamp data
- [ ] WhatsApp analytics count includes all sent/received messages in range

---

### Milestone 2.8 — Phase 2 QA & Integration Testing (Week 16)

**Deliverables:**
- All Phase 2 unit + integration tests written and passing
- End-to-end test: receive WhatsApp message → AI suggest reply → send reply → status tracked
- End-to-end test: broadcast to 100 contacts → all delivered → analytics updated
- Load test: 100 concurrent WebSocket connections; all receive message within 1s
- Security test: webhook signature bypass attempt rejected
- Staging deployment updated, stakeholder demo

**Acceptance Criteria:**
- [ ] Zero open P0/P1 bugs
- [ ] All E2E tests pass on staging
- [ ] Load test: no dropped WebSocket events at 100 connections
- [ ] Webhook replay attack (duplicate message ID) rejected
- [ ] AI features work end-to-end on staging with real Meta + OpenAI keys

---

## Phase 3 — Advanced Features & Polish (Weeks 17–20)

**Goal:** Complete the feature set, performance optimizations, and UI polish to production quality.

---

### Milestone 3.1 — Security Hardening & Audit (Week 17)

**Deliverables:**
- API key management (generate, rotate, revoke)
- API key authentication path for external integrations
- IP whitelist enforcement on workspace level
- Enforce-2FA workspace setting (blocks login if not enrolled)
- Session management: list active sessions, revoke specific session
- Audit log viewer (filterable, paginated)
- Data export (full workspace zip download)
- GDPR right-to-erasure: `DELETE /contacts/:id` hard delete + cascade
- Security headers audit and tightening
- Penetration test checklist (OWASP Top 10 walkthrough)

**Acceptance Criteria:**
- [ ] API key authentication works for all non-auth endpoints
- [ ] IP not in whitelist: 403 on all requests
- [ ] Enforce-2FA: login without 2FA enrolled returns 403 with setup instructions
- [ ] Audit log captures all CREATE/UPDATE/DELETE operations with old+new data
- [ ] GDPR delete removes all personally identifiable data within 30 seconds

---

### Milestone 3.2 — Performance Optimization (Week 18)

**Deliverables:**
- Redis caching for all hot-path endpoints (workspace settings, user permissions, dashboard KPIs)
- Database query audit: all N+1 queries eliminated
- PostgreSQL indexes verified with `EXPLAIN ANALYZE` on all major queries
- PgBouncer connection pooling configured in Docker Compose
- Frontend: React Query stale-time tuning per query type
- Frontend: Virtualized lists for messages (react-virtual) and long contact lists
- Frontend: Code splitting at route level (dynamic imports)
- Frontend: Image optimization via Next.js Image component
- Lighthouse audit: Performance ≥ 85 on dashboard page

**Acceptance Criteria:**
- [ ] Dashboard KPI endpoint: P95 < 50ms (from cache), P95 < 200ms (from DB)
- [ ] Message list scrolling: 10,000 messages renders without jank (60fps)
- [ ] Contact list of 5,000 contacts paginates without full reload
- [ ] Lighthouse performance score ≥ 85 on desktop
- [ ] Zero N+1 queries in any API endpoint (verified via Prisma query logging)

---

### Milestone 3.3 — UI Polish & Accessibility (Week 19)

**Deliverables:**
- Dark mode implemented and tested on all pages
- Mobile layout tested and fixed on all pages (375px – 768px)
- Loading skeletons on all async data fetches
- Empty states on all list views
- Toast notifications for all user actions
- Keyboard navigation throughout (tab order, focus traps in modals)
- ARIA labels on all interactive elements
- Color contrast: all text meets WCAG 2.1 AA (4.5:1 minimum)
- Error boundaries on all major page sections
- Custom 404 and 500 error pages
- Smooth animations: Kanban drag, modal open/close, sidebar collapse, message send

**Acceptance Criteria:**
- [ ] No unstyled flash on dark mode toggle
- [ ] All pages usable on iPhone SE (375px)
- [ ] Tab navigation reaches every interactive element
- [ ] axe-core accessibility scan: zero critical violations
- [ ] Error boundary shows fallback UI (not blank screen) on component crash

---

### Milestone 3.4 — Observability & Operational Readiness (Week 20)

**Deliverables:**
- Structured JSON logging (Winston) on all API requests and background jobs
- Correlation IDs on all requests (propagated to logs)
- `GET /metrics` Prometheus endpoint (request counts, latency histograms, queue depths)
- `GET /health` enhanced: DB connection, Redis ping, queue worker status
- Sentry error tracking integration (frontend + backend)
- Graceful shutdown: drain connections on SIGTERM
- Docker health checks on all containers
- Backup script: `pg_dump` to S3, tested restore procedure
- Runbook documentation: deploy, rollback, DB restore, Redis flush

**Acceptance Criteria:**
- [ ] Every API request produces a structured log line with correlationId
- [ ] Sentry captures unhandled exceptions in both frontend and backend
- [ ] `GET /health` reflects real dependency status (not hardcoded)
- [ ] Graceful shutdown completes within 30 seconds (no request dropped)
- [ ] Backup restore verified: fresh DB from backup identical to source

---

## Phase 4 — Production Hardening & Launch (Weeks 21–24)

**Goal:** Final pre-launch testing, documentation, and a successful production deployment.

---

### Milestone 4.1 — Full Test Suite (Week 21)

**Deliverables:**
- Unit test coverage ≥ 80% across all backend modules
- Integration test suite covering all 20 API endpoint groups
- End-to-end test suite (Playwright): 20 critical user flows
- Load test (k6): 500 concurrent users, 10 min sustained, SLA validation
- Security test: OWASP ZAP automated scan on staging

**Acceptance Criteria:**
- [ ] `npm run test:cov` shows ≥ 80% statement coverage
- [ ] All integration tests pass on a clean test database
- [ ] All 20 Playwright E2E flows pass on staging
- [ ] Load test: P95 API response < 200ms, zero 5xx errors at 500 concurrent
- [ ] ZAP scan: zero high-severity findings

---

### Milestone 4.2 — Documentation (Week 22)

**Deliverables:**
- Swagger/OpenAPI spec auto-generated from NestJS decorators, hosted at `/api/docs`
- API documentation for all public endpoints
- Admin setup guide (Docker Compose deployment)
- User onboarding guide (connecting WhatsApp, adding team, first contact)
- Developer contributing guide (monorepo setup, branch naming, PR process)
- Architecture Decision Records (ADRs) for key decisions (multi-tenancy approach, JWT RS256, Bull queues, etc.)
- Environment variable reference (all variables, types, defaults, required/optional)
- Changelog (automated via conventional commits)

**Acceptance Criteria:**
- [ ] Swagger UI accessible at `/api/docs` with all endpoints documented
- [ ] All required env variables documented with description and example
- [ ] Admin can deploy from scratch using only the README
- [ ] No broken links in any documentation file

---

### Milestone 4.3 — Staging → Production (Week 23)

**Deliverables:**
- Production environment provisioned (VPS/EC2, DNS, SSL certificates via Let's Encrypt)
- Production Docker Compose with secrets management
- CI/CD: `deploy-production.yml` with manual approval gate
- Production database migration run and verified
- Production smoke test: all critical paths manually verified
- Real WhatsApp account connected and tested in production
- Real AI provider API key configured and tested
- Performance monitoring dashboards set up
- Alerting configured: P95 > 500ms, error rate > 1%, disk > 80%

**Acceptance Criteria:**
- [ ] Production deployment succeeds via CI/CD pipeline
- [ ] `GET https://nexacrm.io/health` returns 200 with all services healthy
- [ ] WhatsApp send/receive works end-to-end in production
- [ ] AI suggest-reply works in production
- [ ] SSL certificate grade A on SSL Labs test
- [ ] All environment secrets confirmed not in VCS

---

### Milestone 4.4 — Launch (Week 24)

**Deliverables:**
- Final regression test on production (all critical flows)
- On-call runbook reviewed by whole team
- Rollback plan documented and rehearsed
- v1.0.0 git tag and GitHub Release
- Team onboarding: first real workspace created and configured

**Acceptance Criteria:**
- [ ] Zero P0/P1 open bugs
- [ ] All smoke tests pass on production
- [ ] Rollback procedure rehearsed: able to revert to previous version in < 10 min
- [ ] v1.0.0 tag pushed and GitHub Release published with changelog
- [ ] 🚀 **LAUNCHED**

---

## Sprint Template (2-week sprints)

Each sprint follows this structure:

| Day | Activity |
|-----|----------|
| Sprint Day 1 (Monday) | Sprint planning, task breakdown, estimate |
| Sprint Days 2–9 | Development + daily standups (async, written) |
| Sprint Day 10 (Friday) | Code freeze, testing, bug fixes |
| Sprint Day 11 (Monday) | Demo + review |
| Sprint Day 12 (Tuesday) | Retrospective + next sprint planning |

**Definition of Done (per task):**
- [ ] Feature works as described in acceptance criteria
- [ ] Unit tests written and passing
- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] ESLint passes with zero errors
- [ ] Code reviewed by at least one other engineer
- [ ] Relevant documentation updated
- [ ] Deployed to staging and smoke-tested

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Meta WhatsApp API rate limits block broadcast | Medium | High | Implement token bucket rate limiter; queue with delays |
| AI provider API key cost overrun | Medium | Medium | Per-workspace usage caps; token count logging and alerts |
| PostgreSQL performance degradation at scale | Low | High | Connection pooling, read replica in Phase 3, query monitoring |
| Meta webhook delivery gaps | Medium | Medium | Idempotent processing; webhook retry logic; message polling fallback |
| Third-party library security vulnerability | Medium | Medium | Dependabot alerts enabled; weekly dependency audit |
| Team velocity below estimate | Medium | Medium | Phase 3 features (Google Calendar SSO, etc.) are scope-reducible |
| Customer data breach | Low | Critical | AES-256 encryption, audit logs, penetration testing, HTTPS-only |

---

## Technology Version Pinning

| Package | Version | Reason |
|---------|---------|--------|
| Node.js | 20 LTS | Long-term support, stable |
| Next.js | 15.x | Latest stable App Router |
| NestJS | 11.x | Latest stable |
| Prisma | 6.x | Latest stable |
| TypeScript | 5.5.x | Latest stable |
| PostgreSQL | 15.x | Latest stable with LTS |
| Redis | 7.x | Latest stable |
| Socket.IO | 4.x | Stable WebSocket layer |
| TailwindCSS | 3.4.x | Stable utility-first CSS |
| React Query | 5.x (TanStack) | Latest stable |
| Zustand | 5.x | Latest stable |
