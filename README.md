# NexaCRM — AI-Powered WhatsApp CRM SaaS

A production-ready, multi-tenant CRM platform with WhatsApp Cloud API integration, AI assistant, real-time messaging, sales pipelines, and business analytics.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query |
| Backend | NestJS 11, TypeScript, Prisma 6, Socket.IO |
| Database | PostgreSQL 15, Redis 7 |
| Messaging | Meta WhatsApp Cloud API |
| AI | OpenAI / Anthropic / Google Gemini (modular adapter) |
| Storage | AWS S3 / MinIO |
| Infra | Docker, Docker Compose, Nginx, GitHub Actions |

---

## Quick Start (Development)

### Prerequisites

- Node.js 20 LTS
- Docker Desktop
- npm 10+

### 1. Clone and install

```bash
git clone https://github.com/your-org/nexacrm.git
cd nexacrm
npm install
```

### 2. Start infrastructure (PostgreSQL + Redis + MinIO)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up postgres redis minio -d
```

### 3. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edit `apps/api/.env` — at minimum set:
- `DATABASE_URL` (already points to Docker postgres)
- `APP_ENCRYPTION_KEY` — 32-char hex string: `openssl rand -hex 16`
- `JWT_ACCESS_SECRET` — any long random string for development

### 4. Run database migrations and seed

```bash
cd apps/api
npx prisma migrate dev
npx ts-node ../../infra/scripts/seed-dev.ts
cd ../..
```

### 5. Start the development servers

```bash
# Terminal 1 — API (port 3001)
cd apps/api && npm run start:dev

# Terminal 2 — Web (port 3000)
cd apps/web && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo credentials:**
- Email: `admin@nexacrm.io`
- Password: `Demo1234!`

---

## Production Deployment

### Docker Compose (single server)

```bash
# 1. Create environment file
cp apps/api/.env.example apps/api/.env
# Edit with production values

# 2. Generate RSA key pair for JWT
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
# Add to .env as JWT_PRIVATE_KEY and JWT_PUBLIC_KEY (escape newlines as \n)

# 3. SSL certificates (Let's Encrypt)
certbot certonly --standalone -d nexacrm.io -d www.nexacrm.io
cp /etc/letsencrypt/live/nexacrm.io/fullchain.pem ./nginx_certs/
cp /etc/letsencrypt/live/nexacrm.io/privkey.pem ./nginx_certs/

# 4. Start all services
docker compose up -d

# 5. Run migrations
docker compose exec api npx prisma migrate deploy

# 6. Verify
curl https://nexacrm.io/health
```

### Environment Variables Reference

#### API (`apps/api/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_HOST` | ✅ | Redis host |
| `REDIS_PORT` | ✅ | Redis port (default: 6379) |
| `JWT_ACCESS_SECRET` | ✅ | HS256 secret (dev) or use RS256 keys |
| `APP_ENCRYPTION_KEY` | ✅ | 32-char hex — encrypts sensitive DB fields |
| `AWS_S3_BUCKET` | ✅ | S3 bucket for media uploads |
| `AWS_ACCESS_KEY_ID` | ✅ | AWS or MinIO access key |
| `AWS_SECRET_ACCESS_KEY` | ✅ | AWS or MinIO secret key |
| `AWS_REGION` | ✅ | S3 region (e.g., `us-east-1`) |
| `AWS_S3_ENDPOINT` | ⬜ | Override for MinIO (`http://minio:9000`) |
| `NODE_ENV` | ✅ | `production` or `development` |
| `PORT` | ⬜ | API port (default: 3001) |
| `CORS_ORIGINS` | ✅ | Comma-separated allowed origins |
| `THROTTLE_TTL` | ⬜ | Rate limit window ms (default: 60000) |
| `THROTTLE_LIMIT` | ⬜ | Requests per window (default: 100) |

#### Web (`apps/web/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | NestJS API base URL |
| `NEXT_PUBLIC_WS_URL` | ✅ | WebSocket URL (same as API URL) |

---

## WhatsApp Setup

1. Create a [Meta Developer App](https://developers.facebook.com/)
2. Add the **WhatsApp Business** product
3. Copy **Phone Number ID** and **Permanent Access Token**
4. In NexaCRM → Settings → WhatsApp, paste credentials
5. Set **Webhook URL** to `https://your-domain.com/api/v1/webhooks/whatsapp`
6. Set **Verify Token** to match `wabVerifyToken` in Settings
7. Subscribe to **messages** webhook field
8. Click "Test Connection" to verify

---

## AI Setup

1. Go to Settings → AI Provider
2. Select your provider (OpenAI, Anthropic, or Gemini)
3. Paste your API key
4. Select the model
5. Click "Test Connection"

AI features: reply suggestions, conversation summaries, lead qualification, sentiment analysis, smart tags, follow-up generation, semantic search, and business insights.

---

## Project Structure

```
nexacrm/
├── apps/
│   ├── api/          NestJS backend (REST + WebSocket)
│   │   ├── src/
│   │   │   ├── modules/   Feature modules (auth, contacts, leads, deals, whatsapp, ai, ...)
│   │   │   ├── common/    Guards, interceptors, decorators, utils
│   │   │   ├── prisma/    Database client
│   │   │   ├── queue/     Bull queue processors
│   │   │   └── websocket/ Socket.IO gateway
│   │   └── prisma/    Schema + migrations
│   └── web/          Next.js 15 App Router frontend
│       └── src/
│           ├── app/       Pages (auth + dashboard routes)
│           ├── components/ UI + feature components
│           ├── hooks/     Custom React hooks
│           ├── queries/   TanStack Query hooks
│           ├── stores/    Zustand state
│           └── lib/       Utilities
├── packages/
│   ├── shared-types/  TypeScript enums shared by api + web
│   └── config/        Shared ESLint, Prettier, tsconfig
├── infra/
│   ├── docker/       Dockerfiles (api, web, worker)
│   ├── nginx/        Reverse proxy config
│   └── scripts/      Seed + migration scripts
└── .github/workflows/ CI/CD pipelines
```

---

## Available Scripts

```bash
# Install all workspaces
npm install

# Development (requires Docker infrastructure running)
cd apps/api && npm run start:dev      # API on :3001
cd apps/web && npm run dev            # Web on :3000

# Build
npm run build                          # Build all packages

# Tests
cd apps/api && npm test               # Unit + integration tests
cd apps/api && npm run test:cov       # With coverage

# Database
cd apps/api && npx prisma studio      # Visual DB editor
cd apps/api && npx prisma migrate dev # Create migration
cd apps/api && npx prisma migrate deploy # Apply to production

# Linting
npm run lint                          # Lint all
npm run format                        # Format all files
```

---

## Security

- Passwords hashed with **bcrypt** (cost factor 12)
- JWTs signed with **RS256** asymmetric keys (configurable)
- Refresh tokens: **httpOnly, Secure, SameSite=Strict** cookies
- All sensitive fields (API keys, tokens) encrypted with **AES-256-GCM** before DB storage
- **HMAC-SHA256** webhook signature verification (Meta)
- **RBAC** enforced on every API endpoint
- **Multi-tenant isolation**: every DB query scoped by `workspaceId`
- **Rate limiting** on all endpoints; strict limits on auth endpoints
- **CSRF** protection via SameSite cookies + CORS restrictions
- **CSP**, **HSTS**, **X-Frame-Options** headers via Nginx

---

## License

MIT — see [LICENSE](LICENSE)
