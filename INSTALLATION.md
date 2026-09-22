# NexaCRM - Installation Guide

Thank you for purchasing NexaCRM! This guide will help you set up and deploy your CRM system.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Local Development)](#quick-start-local-development)
3. [Production Deployment](#production-deployment)
4. [Configuration](#configuration)
5. [Troubleshooting](#troubleshooting)
6. [Support](#support)

---

## Prerequisites

Before installing, ensure you have:

- **Node.js 20 LTS** or higher
- **npm 10+** or yarn
- **Docker Desktop** (for local development)
- **PostgreSQL 15** (or use Docker)
- **Git** (optional, for version control)

---

## Quick Start (Local Development)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Start Infrastructure

Start PostgreSQL, Redis, and MinIO using Docker:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up postgres redis minio -d
```

### Step 3: Configure Environment Variables

Copy example environment files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edit `apps/api/.env` and set:

```env
DATABASE_URL=postgresql://nexacrm:nexacrm@localhost:5432/nexacrm
APP_ENCRYPTION_KEY=your-32-character-hex-string
JWT_ACCESS_SECRET=your-jwt-secret
```

Generate encryption key:
```bash
openssl rand -hex 16
```

### Step 4: Run Database Migrations

```bash
cd apps/api
npx prisma migrate dev
cd ../..
```

### Step 5: Start Development Servers

```bash
# Terminal 1 - Backend (port 3001)
cd apps/api
npm run start:dev

# Terminal 2 - Frontend (port 3000)
cd apps/web
npm run dev
```

### Step 6: Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/docs

---

## Production Deployment

### Option 1: Railway (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO
   git push -u origin main
   ```

2. **Deploy to Railway**:
   - Go to https://railway.app
   - Create new project
   - Import from GitHub
   - Add PostgreSQL database
   - Configure environment variables (see below)

3. **Environment Variables for Railway**:

   **Backend (apps/api)**:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   NODE_ENV=production
   PORT=3001
   JWT_ACCESS_SECRET=your-secret
   APP_ENCRYPTION_KEY=your-32-char-hex
   CORS_ORIGINS=https://your-frontend-url.railway.app
   APP_URL=https://your-backend-url.railway.app
   ```

   **Frontend (apps/web)**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   NEXT_PUBLIC_WS_URL=https://your-backend-url.railway.app
   ```

4. **Run Migrations**:
   - In Railway console: `npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma`

### Option 2: Docker Compose (VPS/Cloud)

1. **Configure environment variables**
2. **Build and start**:
   ```bash
   docker compose up -d
   ```
3. **Run migrations**:
   ```bash
   docker compose exec api npx prisma migrate deploy
   ```

### Option 3: Vercel (Frontend) + Railway (Backend)

1. **Deploy frontend to Vercel**:
   - Import GitHub repo
   - Root directory: `apps/web`
   - Framework: Next.js
   - Add environment variables

2. **Deploy backend to Railway** (see Option 1)

---

## Configuration

### WhatsApp Setup

1. Go to **Settings → WhatsApp**
2. Add your Meta Business Account credentials:
   - Phone Number ID
   - Access Token
   - Webhook Verify Token
3. Configure webhook URL in Meta Developer Console
4. Test connection

See `WHATSAPP_SETUP_GUIDE.md` for detailed instructions.

### Email Setup (SMTP)

1. Go to **Settings → Email**
2. Configure SMTP settings:
   - Host: smtp.gmail.com
   - Port: 587
   - Username: your-email@gmail.com
   - Password: app-specific password

See `EMAIL_SETUP_GUIDE.md` and `GMAIL_SMTP_SETUP.md` for details.

### AI Integration

1. Go to **Settings → AI Provider**
2. Choose provider (OpenAI, Anthropic, or Google Gemini)
3. Add API key
4. Select model
5. Test connection

See `GEMINI_INTEGRATION_GUIDE.md` for Google AI setup.

---

## Troubleshooting

### Build Errors

**Error**: Prisma Client not generated
```bash
npx prisma generate --schema=./apps/api/prisma/schema.prisma
```

**Error**: Port already in use
```bash
# Kill process on port 3000
npx kill-port 3000
# Kill process on port 3001
npx kill-port 3001
```

### Database Issues

**Error**: Cannot connect to database
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Verify credentials

**Solution**:
```bash
# Restart Docker containers
docker compose restart postgres
```

### CORS Errors

If frontend can't connect to backend:
1. Check `CORS_ORIGINS` in backend .env
2. Add your frontend URL
3. Restart backend

---

## Important Security Notes

### Production Checklist

Before going live:

- [ ] Change `JWT_ACCESS_SECRET` to strong random string
- [ ] Generate secure `APP_ENCRYPTION_KEY` (32 chars)
- [ ] Use strong database password
- [ ] Set `CORS_ORIGINS` to your actual domain (not `*`)
- [ ] Enable HTTPS (automatically handled by Railway/Vercel)
- [ ] Review and remove test data
- [ ] Set up database backups
- [ ] Configure error monitoring

### Generate Secure Keys

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Encryption Key
openssl rand -hex 16
```

---

## File Structure

```
nexacrm/
├── apps/
│   ├── api/          # NestJS Backend
│   └── web/          # Next.js Frontend
├── packages/
│   ├── shared-types/ # Shared TypeScript types
│   └── config/       # Shared configs
├── docs/             # Technical documentation
└── infra/            # Docker, Nginx configs
```

---

## Support

### Documentation

- `README.md` - Overview and features
- `DEPLOYMENT_CHECKLIST.md` - Deployment guide
- `WHATSAPP_SETUP_GUIDE.md` - WhatsApp integration
- `EMAIL_SETUP_GUIDE.md` - Email configuration
- `docs/` - Technical specifications

### Getting Help

For support:
1. Check documentation first
2. Review troubleshooting section
3. Contact support with:
   - Error messages
   - Steps to reproduce
   - Environment details
   - Screenshots if applicable

### Useful Commands

```bash
# Install dependencies
npm install

# Development
npm run dev                    # Start all services
cd apps/api && npm run start:dev    # Backend only
cd apps/web && npm run dev          # Frontend only

# Production build
npm run build

# Database
npx prisma studio             # Visual DB editor
npx prisma migrate dev        # Create migration
npx prisma migrate deploy     # Apply to production

# Linting & Testing
npm run lint                  # Lint all
npm run test                  # Run tests
```

---

## Next Steps

1. ✅ Complete installation
2. ✅ Configure environment variables
3. ✅ Set up WhatsApp integration
4. ✅ Configure email
5. ✅ Test all features
6. ✅ Deploy to production
7. ✅ Set up custom domain (optional)

---

**Congratulations! Your NexaCRM is ready to use!** 🎉

For more information, see the documentation in the `docs/` folder.
