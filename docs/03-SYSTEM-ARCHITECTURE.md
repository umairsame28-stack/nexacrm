# System Architecture
## NexaCRM — AI-Powered WhatsApp CRM SaaS

**Version:** 1.0 | **Date:** August 4, 2026

---

## 1. Architectural Style

NexaCRM follows a **Layered Monolith with Service Boundaries** architecture for Phase 1. The codebase is structured so individual bounded contexts (WhatsApp, AI, Contacts, Deals, etc.) can be extracted into independent microservices in Phase 3 without a full rewrite.

Core architectural principles:

- **Clean Architecture** per bounded context: Domain → Application → Infrastructure → Presentation
- **Multi-Tenant by Design**: every data access is scoped to `workspaceId` at the repository layer
- **Event-Driven Internally**: NestJS EventEmitter for in-process domain events; Redis pub/sub for cross-instance fan-out
- **Stateless Backend**: all state in PostgreSQL, Redis, or S3 — no local disk state
- **API-First**: the backend exposes a typed REST API consumed by the Next.js frontend and any third-party integrations

---

## 2. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
│                                                                               │
│   ┌──────────────────────┐      ┌─────────────────────┐                     │
│   │   Next.js Web App    │      │  External API Users  │                     │
│   │  (Browser / PWA)     │      │  (Webhooks / SDK)    │                     │
│   └──────────┬───────────┘      └──────────┬──────────┘                     │
└──────────────┼────────────────────────────┼─────────────────────────────────┘
               │ HTTPS                       │ HTTPS
               ▼                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NGINX REVERSE PROXY                                │
│                  (SSL termination, load balancing, rate limit)               │
│                         Upstream: api:3001  web:3000                        │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │ /api/*           │ /ws/*             │ /*
          ▼                  ▼                   ▼
┌──────────────────┐  ┌─────────────────┐ ┌────────────────────┐
│  NestJS REST API │  │  Socket.IO      │ │  Next.js Frontend  │
│   (Port 3001)    │  │  Gateway        │ │   (Port 3000)      │
│                  │  │  (Port 3001)    │ │                    │
│  ┌────────────┐  │  └────────┬────────┘ └────────────────────┘
│  │  Auth      │  │           │
│  │  Contacts  │  │           │ Redis pub/sub
│  │  Leads     │  │           ▼
│  │  Deals     │  │  ┌────────────────┐
│  │  WhatsApp  │  │  │  Redis 7       │◄──── Session store
│  │  AI        │  │  │  (Cache+Queue) │◄──── Cache (hot data)
│  │  Tasks     │  │  │                │◄──── Bull job queues
│  │  Calendar  │  │  └────────────────┘
│  │  Reports   │  │
│  │  Teams     │  │
│  │  Settings  │  │
│  └────────────┘  │
└────────┬─────────┘
         │
         │ Prisma ORM
         ▼
┌──────────────────────┐
│   PostgreSQL 15      │
│   (Primary DB)       │
└──────────────────────┘
         │
         │ S3 SDK
         ▼
┌──────────────────────┐
│   AWS S3 / MinIO     │
│   (Media Storage)    │
└──────────────────────┘

External Services:
┌─────────────────────┐  ┌────────────────────┐  ┌──────────────────┐
│ Meta WhatsApp Cloud │  │  AI Providers       │  │  SMTP / Email    │
│ API (Graph API)     │  │  OpenAI / Gemini /  │  │  (Resend/SES)    │
│                     │  │  Anthropic          │  │                  │
└─────────────────────┘  └────────────────────┘  └──────────────────┘
```

---

## 3. Backend Architecture (NestJS)

### 3.1 Clean Architecture Layers

```
src/
├── domain/              ← Enterprise Business Rules
│   ├── entities/        ← Pure domain models (no DB dependency)
│   ├── value-objects/   ← PhoneNumber, Email, Money, etc.
│   ├── events/          ← Domain events (MessageReceived, DealCreated)
│   └── exceptions/      ← Domain-specific exceptions
│
├── application/         ← Application Business Rules
│   ├── use-cases/       ← One class per use case (SendMessage, CreateDeal)
│   ├── interfaces/      ← Repository and service interfaces (ports)
│   └── dtos/            ← Input/output data transfer objects
│
├── infrastructure/      ← Frameworks & Drivers
│   ├── database/        ← Prisma repositories (implements domain interfaces)
│   ├── messaging/       ← WhatsApp API adapter
│   ├── ai/              ← AI provider adapters
│   ├── storage/         ← S3 storage adapter
│   ├── email/           ← SMTP email adapter
│   ├── cache/           ← Redis adapter
│   └── queue/           ← Bull queue definitions
│
└── presentation/        ← Interface Adapters
    ├── http/            ← NestJS controllers, guards, interceptors
    ├── websocket/       ← Socket.IO gateways
    └── webhooks/        ← Inbound webhook controllers
```

### 3.2 NestJS Module Dependency Graph

```
AppModule
├── AuthModule           ← JWT, Guards, 2FA
├── WorkspaceModule      ← Tenant management
├── ContactsModule       ← Contacts + custom fields
├── LeadsModule          ← Pipelines + lead scoring
├── DealsModule          ← Deal pipelines + forecasting
├── WhatsAppModule       ← WAC API integration + inbox
├── AiModule             ← AI provider facade
├── TasksModule          ← Tasks + reminders
├── CalendarModule       ← Events + scheduling
├── ReportsModule        ← Analytics queries
├── TeamsModule          ← Departments + teams + permissions
├── NotificationsModule  ← In-app + email + push
├── SettingsModule       ← Workspace config
├── QueueModule          ← Bull queues
├── CacheModule          ← Redis cache
├── StorageModule        ← S3 adapter
└── WebsocketModule      ← Socket.IO gateway
```

### 3.3 Request Lifecycle

```
HTTP Request
     │
     ▼
Nginx (rate limit, SSL)
     │
     ▼
NestJS Application
     │
     ├── GlobalExceptionFilter    ← Catches all unhandled errors
     ├── RequestLoggingInterceptor ← Correlation ID, timing
     ├── JwtAuthGuard             ← Validates access token
     ├── WorkspaceGuard           ← Resolves + attaches workspace context
     ├── RolesGuard               ← Checks RBAC permissions
     ├── ValidationPipe           ← class-validator + class-transformer
     │
     ▼
  Controller → Use Case → Repository → Prisma → PostgreSQL
                    │
                    ├── Domain Events (EventEmitter)
                    ├── Cache operations (Redis)
                    └── Queue jobs (Bull)
```

---

## 4. Frontend Architecture (Next.js)

### 4.1 Rendering Strategy

| Route Type | Strategy | Reason |
|------------|----------|--------|
| `/login`, `/register` | Static (SSG) | No auth needed, cacheable |
| `/dashboard/*` | Client-side (CSR) | Real-time data, auth-gated |
| `/inbox/*` | Client-side (CSR) | WebSocket-heavy, real-time |
| `/contacts/*` | Client-side (CSR) | Dynamic, paginated |
| `/reports/*` | Server-side (SSR) | SEO-safe, data pre-fetch |
| Public marketing pages | Static (SSG) | Fast CDN delivery |

### 4.2 State Management Architecture

```
Global State (Zustand)
├── authStore        ← Current user, workspace, tokens
├── uiStore          ← Sidebar state, theme, modals
├── notificationStore← Unread count, real-time list
└── whatsappStore    ← Active conversation, typing state

Server State (React Query / TanStack Query)
├── Contacts queries/mutations
├── Leads queries/mutations
├── Deals queries/mutations
├── Tasks queries/mutations
├── Reports queries
└── Settings queries/mutations

Real-Time (Socket.IO client)
├── message:new      → update whatsappStore + React Query cache
├── notification:new → update notificationStore
├── typing:start/stop→ update whatsappStore
└── deal:updated     → invalidate deals query
```

### 4.3 Component Architecture

```
components/
├── ui/              ← shadcn/ui base components (Button, Input, Card…)
├── layout/          ← Sidebar, TopNav, PageWrapper, AuthLayout
├── shared/          ← Reusable: DataTable, KanbanBoard, FileUpload, 
│                       EmojiPicker, DatePicker, SearchInput
└── features/        ← Feature-specific compound components
    ├── contacts/
    ├── leads/
    ├── deals/
    ├── inbox/
    ├── ai/
    └── reports/
```

---

## 5. Database Architecture

### 5.1 Multi-Tenancy Model

**Approach: Shared Database, Shared Schema with Row-Level Tenant ID**

Every table that contains tenant-specific data includes a `workspace_id` column with:
- A foreign key constraint to the `workspaces` table
- A composite index on `(workspace_id, <primary lookup field>)`
- Enforced at the Prisma repository layer — all queries receive `workspaceId` from the authenticated request context

This approach was chosen over separate schemas because:
- Simpler operational management (single migration path)
- Sufficient isolation with application-layer enforcement
- More cost-effective at SMB scale
- Can migrate to separate schemas per tenant in Phase 3 if needed

### 5.2 Connection Strategy

```
PostgreSQL 15 (Primary)
     │
     ├── PgBouncer (connection pool, transaction mode)
     │      └── Prisma Client (max 10 connections per instance)
     │
     └── Read Replica (Phase 2)
            └── Reports queries, analytics
```

---

## 6. Caching Architecture

### 6.1 Redis Cache Layers

| Cache Key Pattern | TTL | Data |
|-------------------|-----|------|
| `workspace:{id}:settings` | 5 min | Workspace config |
| `user:{id}:permissions` | 5 min | RBAC permission set |
| `contact:{id}` | 2 min | Contact detail |
| `dashboard:{workspaceId}:metrics` | 60 sec | Dashboard KPIs |
| `report:{workspaceId}:{type}:{hash}` | 5 min | Report results |
| `ai:response:{hash}` | 10 min | Identical AI requests |

### 6.2 Cache Invalidation

- **Write-through**: cache updated synchronously on mutations for user-facing data
- **Event-driven**: domain events trigger targeted cache invalidation
- **TTL-based expiry**: for dashboard and report data where staleness is acceptable

---

## 7. Real-Time Architecture

### 7.1 WebSocket Gateway (Socket.IO)

```
Client connects → Socket.IO Gateway
                       │
                       ├── Authenticate via JWT (handshake query/cookie)
                       ├── Join room: workspace:{workspaceId}
                       └── Join room: user:{userId}

Server emits → workspace room → all agents in tenant see:
    • New inbound WhatsApp message
    • Conversation assignment change
    • Deal stage update

Server emits → user room → targeted agent sees:
    • New task assigned
    • Personal notification
    • Mention in note
```

### 7.2 Multi-Instance Real-Time

```
Instance A (NestJS)         Instance B (NestJS)
     │                            │
     └──── Redis Pub/Sub ─────────┘
               │
         Publish event to channel
         All instances subscribe → emit to their connected clients
```

---

## 8. WhatsApp Integration Architecture

### 8.1 Inbound Message Flow

```
Meta WhatsApp Cloud API
        │
        │ POST /webhooks/whatsapp (HTTPS)
        ▼
NestJS WebhookController
        │
        ├── Verify X-Hub-Signature-256
        ├── Parse message type (text/image/audio/document/template)
        ├── Idempotency check (message ID in Redis / DB)
        │
        ▼
WhatsApp Use Case (ProcessInboundMessage)
        │
        ├── Upsert contact (match by phone number)
        ├── Upsert conversation
        ├── Persist message to DB
        ├── Download & store media to S3 (if media message)
        ├── Emit domain event: MessageReceived
        │
        ▼
EventHandler → Redis pub/sub → Socket.IO Gateway
                                      │
                                      ▼
                              Frontend WebSocket client
                              (message appears in real time)
```

### 8.2 Outbound Message Flow

```
Agent types message in UI
        │
        ▼
POST /api/messages (REST)
        │
        ▼
SendMessage Use Case
        │
        ├── Validate message against Meta API constraints
        ├── Call Meta Graph API: POST /messages
        ├── Receive message ID from Meta
        ├── Persist message to DB (status: sent)
        ├── Emit MessageSent domain event
        │
        ▼
Meta delivers to customer → status webhook → update message status in DB
                                           → emit status update via WebSocket
```

### 8.3 Message Scheduling

```
Agent schedules message
        │
        ▼
POST /api/messages/schedule
        │
        ▼
Bull Queue: scheduled-messages
(delayed job, fires at scheduled_at)
        │
        ▼
Queue Processor → SendMessage Use Case → Meta API
```

---

## 9. AI Architecture

### 9.1 Provider Adapter Pattern

```typescript
// Port (interface)
interface IAIProvider {
  complete(prompt: AIPrompt): Promise<AIResponse>;
  embed(text: string): Promise<number[]>;
}

// Adapters (infrastructure)
class OpenAIAdapter implements IAIProvider { ... }
class AnthropicAdapter implements IAIProvider { ... }
class GeminiAdapter implements IAIProvider { ... }

// Factory (resolves at runtime based on workspace settings)
class AIProviderFactory {
  create(provider: string, apiKey: string): IAIProvider
}
```

### 9.2 AI Feature Request Flow

```
Frontend: "Suggest Reply" button clicked
        │
        ▼
POST /api/ai/suggest-reply  { conversationId }
        │
        ▼
AiModule Use Case
        │
        ├── Load last N messages from conversation (context window)
        ├── Resolve AI provider from workspace settings
        ├── Build structured prompt from template
        ├── Call AI provider adapter
        ├── Parse and validate response
        ├── Log AI usage (tokens, provider, feature)
        ├── Return suggestions to frontend
        │
        ▼
Frontend renders suggestions with AI badge
```

---

## 10. Background Job Architecture

### 10.1 Bull Queues

| Queue Name | Processor | Purpose |
|------------|-----------|---------|
| `message-scheduler` | MessageSchedulerProcessor | Dispatch scheduled WhatsApp messages |
| `broadcast` | BroadcastProcessor | Fan-out broadcast to contact list |
| `csv-import` | CsvImportProcessor | Process bulk contact imports |
| `notifications` | NotificationProcessor | Send email and push notifications |
| `ai-analysis` | AiAnalysisProcessor | Async AI tasks (sentiment, qualification) |
| `report-generation` | ReportProcessor | Heavy report queries |

### 10.2 Queue Architecture

```
API Request → Add job to Bull Queue (Redis)
                        │
              ┌─────────┼──────────┐
              ▼         ▼          ▼
         Worker 1   Worker 2   Worker 3   (same or separate process)
              │
              ├── Retry on failure (3 attempts, exponential backoff)
              ├── Dead-letter queue for permanently failed jobs
              └── Job events emitted to monitoring
```

---

## 11. Storage Architecture

### 11.1 File Upload Flow

```
Frontend: user selects file
        │
        ▼
POST /api/storage/presign  { fileName, mimeType, size }
        │
        ▼
StorageModule → S3: generate pre-signed PUT URL (5 min expiry)
        │
        ▼
Return { uploadUrl, fileKey } to frontend
        │
        ▼
Frontend: PUT directly to S3 (upload bypasses backend)
        │
        ▼
Frontend confirms upload → POST /api/messages { fileKey }
        │
        ▼
Backend persists message with fileKey
```

### 11.2 File Access

- Media files are **never publicly accessible**
- Frontend requests GET /api/storage/url/{fileKey} → backend generates pre-signed GET URL (1 hour TTL) → redirects to S3

---

## 12. Security Architecture

### 12.1 Authentication Flow

```
1. POST /auth/login { email, password }
   → bcrypt.compare
   → generate access_token (JWT RS256, 15 min)
   → generate refresh_token (opaque, stored in DB, httpOnly cookie)
   → return access_token in response body

2. API requests → Bearer access_token in Authorization header
   → JwtAuthGuard validates signature + expiry
   → attach user + workspace to request context

3. access_token expires → frontend sends POST /auth/refresh
   → cookie contains refresh_token
   → validate against DB (not expired, not revoked)
   → rotate: issue new pair, invalidate old refresh_token
   → return new access_token

4. Logout → POST /auth/logout
   → revoke current refresh_token in DB
   → clear cookie
```

### 12.2 RBAC Matrix

| Permission | Admin | Manager | Sales Agent | Support Agent | Viewer |
|------------|-------|---------|-------------|---------------|--------|
| contacts:read | ✅ | ✅ | ✅ (assigned) | ✅ | ✅ |
| contacts:write | ✅ | ✅ | ✅ | ❌ | ❌ |
| leads:read | ✅ | ✅ | ✅ (assigned) | ❌ | ✅ |
| leads:write | ✅ | ✅ | ✅ (assigned) | ❌ | ❌ |
| deals:read | ✅ | ✅ | ✅ (assigned) | ❌ | ✅ |
| deals:write | ✅ | ✅ | ✅ (assigned) | ❌ | ❌ |
| inbox:read | ✅ | ✅ | ✅ | ✅ | ❌ |
| inbox:write | ✅ | ✅ | ✅ | ✅ | ❌ |
| reports:read | ✅ | ✅ | ❌ | ❌ | ✅ |
| settings:write | ✅ | ❌ | ❌ | ❌ | ❌ |
| team:manage | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 13. Deployment Architecture

### 13.1 Docker Compose (Production)

```yaml
services:
  nginx          # Reverse proxy, SSL, static assets
  web            # Next.js frontend (port 3000)
  api            # NestJS backend (port 3001)
  worker         # Bull queue workers (same image, different CMD)
  postgres       # PostgreSQL 15
  redis          # Redis 7
  minio          # S3-compatible local storage (dev/staging)

networks:
  internal       # api, postgres, redis, worker (no external exposure)
  public         # nginx (exposes 80, 443)
```

### 13.2 CI/CD Pipeline (GitHub Actions)

```
Push to main branch
        │
        ├── Lint (ESLint, Prettier check)
        ├── Type check (tsc --noEmit)
        ├── Unit tests (Jest)
        ├── Integration tests (supertest + test DB)
        │
        ▼
Build Docker images
        │
        ├── Tag: ghcr.io/org/nexacrm-api:{sha}
        └── Tag: ghcr.io/org/nexacrm-web:{sha}
        │
        ▼
Push images to registry
        │
        ▼
Deploy to staging
        ├── Run DB migrations (prisma migrate deploy)
        ├── Smoke tests
        │
        ▼
Manual approval gate
        │
        ▼
Deploy to production
        └── Rolling restart (zero-downtime)
```

### 13.3 Environment Configuration

| Variable Group | Source |
|----------------|--------|
| Database credentials | Docker secrets / Vault |
| JWT private/public keys | Docker secrets |
| Meta API credentials | Per-workspace (encrypted in DB) |
| AI API keys | Per-workspace (encrypted in DB) |
| SMTP credentials | Per-workspace (encrypted in DB) |
| S3 credentials | Environment variable |
| Redis URL | Environment variable |

---

## 14. Network & DNS Architecture

```
Internet → DNS (Cloudflare)
                │
                ▼
         nexacrm.io → Cloudflare CDN (static assets)
                │
                ▼
         Origin Server (VPS / EC2)
                │
                ▼
         Nginx (443/80)
                │
         ┌──────┴──────┐
         ▼             ▼
    Next.js Web     NestJS API
    (frontend)      (REST + WS)
```

---

## 15. Observability Stack (Phase 2)

```
Application logs → Winston JSON → stdout → Loki (log aggregation)
Metrics         → /metrics endpoint → Prometheus scrape → Grafana
Traces          → OpenTelemetry SDK → Jaeger / Tempo
Alerts          → Grafana Alerting → PagerDuty / Slack
Error tracking  → Sentry SDK (frontend + backend)
Uptime          → UptimeRobot / Betterstack
```
