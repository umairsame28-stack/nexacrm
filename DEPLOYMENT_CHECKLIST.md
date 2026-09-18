# Deployment Checklist - NexaCRM

## Pre-Deployment Security Check

### ⚠️ CRITICAL - Review Before Pushing to GitHub

- [ ] `.env` files are in `.gitignore` (✅ Already done)
- [ ] No API keys in code files
- [ ] No passwords in code files
- [ ] No database credentials in code files
- [ ] No AWS/S3 credentials hardcoded
- [ ] No WhatsApp tokens hardcoded
- [ ] No email passwords in code
- [ ] SSL certificates not committed (*.pem in .gitignore)

### Files to Double-Check

Run this to search for potential secrets:
```powershell
# Search for common secret patterns
Select-String -Path . -Pattern "password\s*=\s*['\"]" -Recurse -Exclude @("*.md", "node_modules/*", ".git/*")
Select-String -Path . -Pattern "api[_-]?key\s*[=:]\s*['\"]" -Recurse -Exclude @("*.md", "node_modules/*", ".git/*")
Select-String -Path . -Pattern "secret\s*[=:]\s*['\"]" -Recurse -Exclude @("*.md", "node_modules/*", ".git/*")
```

---

## GitHub Setup Checklist

- [ ] Git installed on your computer
- [ ] Git configured (name and email)
- [ ] GitHub account created
- [ ] Repository created on GitHub (private recommended)
- [ ] Local git repository initialized
- [ ] Files staged (`git add .`)
- [ ] Initial commit created
- [ ] Remote origin added
- [ ] Code pushed to GitHub
- [ ] Verified on GitHub (no .env files visible)

---

## Railway Deployment Checklist

### Before Deploying

- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] Decided on deployment strategy:
  - [ ] Option A: All-in-one Railway (Frontend + Backend + DB)
  - [ ] Option B: Split (Vercel Frontend + Railway Backend + DB)

### Environment Variables to Set in Railway

#### For Backend (API):
- [ ] `DATABASE_URL` (Railway provides automatically)
- [ ] `REDIS_HOST` and `REDIS_PORT`
- [ ] `JWT_ACCESS_SECRET`
- [ ] `APP_ENCRYPTION_KEY` (32-char hex: `openssl rand -hex 16`)
- [ ] `AWS_S3_BUCKET`
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_REGION`
- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGINS` (your frontend URL)
- [ ] Email settings (if using email)
- [ ] WhatsApp settings (if using WhatsApp)

#### For Frontend (Web):
- [ ] `NEXT_PUBLIC_API_URL` (Railway backend URL)
- [ ] `NEXT_PUBLIC_WS_URL` (same as API URL)

### Railway Setup Steps

1. [ ] Create new Railway project
2. [ ] Add PostgreSQL database service
3. [ ] Deploy backend service from GitHub
   - [ ] Set root directory to `apps/api` (if monorepo)
   - [ ] Set build command: `npm install && npx prisma generate && npm run build`
   - [ ] Set start command: `npm run start:prod`
4. [ ] Deploy frontend service from GitHub
   - [ ] Set root directory to `apps/web`
   - [ ] Set build command: `npm install && npm run build`
   - [ ] Set start command: `npm start`
5. [ ] Connect database to backend
6. [ ] Run migrations: `npx prisma migrate deploy`
7. [ ] Test deployment
8. [ ] Set up custom domain (optional)

---

## Render.com Deployment Checklist (Alternative)

### Services to Create

1. [ ] PostgreSQL Database
   - [ ] Free tier (90 days)
   - [ ] Note connection details

2. [ ] Backend Web Service
   - [ ] Connect to GitHub repo
   - [ ] Root directory: `apps/api`
   - [ ] Build command: `npm install && npx prisma generate && npm run build`
   - [ ] Start command: `npm run start:prod`
   - [ ] Add environment variables
   - [ ] Connect to database

3. [ ] Frontend Web Service
   - [ ] Connect to GitHub repo
   - [ ] Root directory: `apps/web`
   - [ ] Build command: `npm install && npm run build`
   - [ ] Start command: `npm start`
   - [ ] Add environment variables

### Post-Deployment

- [ ] Run database migrations
- [ ] Test all features
- [ ] Monitor for errors
- [ ] Set up error tracking (optional)

---

## Vercel Deployment (Frontend Only)

If splitting frontend to Vercel:

1. [ ] Go to vercel.com
2. [ ] Import GitHub repository
3. [ ] Framework: Next.js (auto-detected)
4. [ ] Root directory: `apps/web`
5. [ ] Environment variables:
   - [ ] `NEXT_PUBLIC_API_URL`
   - [ ] `NEXT_PUBLIC_WS_URL`
6. [ ] Deploy
7. [ ] Get deployment URL
8. [ ] Update backend CORS_ORIGINS

---

## Post-Deployment Testing

### Backend Health Checks
- [ ] `GET /health` returns 200
- [ ] `GET /api/v1/health` returns 200
- [ ] Database connection working
- [ ] Redis connection working

### Frontend Checks
- [ ] Homepage loads
- [ ] Login page accessible
- [ ] Can register new account
- [ ] Can log in
- [ ] Dashboard loads
- [ ] API calls working

### Feature Testing
- [ ] Authentication works
- [ ] Create contact
- [ ] Create lead
- [ ] Create deal
- [ ] WhatsApp integration (if configured)
- [ ] AI features (if configured)
- [ ] File uploads
- [ ] Real-time updates (WebSocket)

### Mobile Testing
- [ ] Test on actual mobile device
- [ ] Responsive layout working
- [ ] Watch Demo modal displays correctly
- [ ] Buttons are touch-friendly
- [ ] No horizontal scrolling

---

## Monitoring & Maintenance

- [ ] Set up error logging
- [ ] Monitor database usage
- [ ] Monitor API response times
- [ ] Check logs regularly
- [ ] Set up alerts for downtime
- [ ] Plan for database backups
- [ ] Document deployment process
- [ ] Create rollback plan

---

## Cost Monitoring

### Railway
- [ ] Check usage dashboard
- [ ] Monitor monthly credits ($5 free tier)
- [ ] Set up billing alerts
- [ ] Plan for when credits run out

### Render
- [ ] Note database expiry date (90 days free)
- [ ] Monitor service sleep time
- [ ] Plan for upgrade if needed

### Vercel (Frontend)
- [ ] Should stay free for personal projects
- [ ] Monitor bandwidth usage
- [ ] Check build minutes

---

## Rollback Plan

If deployment fails:

1. [ ] Check logs for errors
2. [ ] Verify environment variables
3. [ ] Check database migrations
4. [ ] Revert to previous commit if needed:
   ```powershell
   git revert HEAD
   git push
   ```
5. [ ] Railway/Render will auto-deploy reverted version

---

## Success Criteria

Deployment is successful when:
- ✅ App accessible via public URL
- ✅ Can register and login
- ✅ All pages load without errors
- ✅ Database operations working
- ✅ Mobile responsive
- ✅ No console errors
- ✅ WebSocket connections stable
- ✅ File uploads working

---

## Support Resources

- **Railway Docs**: https://docs.railway.app/
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **NestJS Deployment**: https://docs.nestjs.com/faq/deployment
- **Prisma Production**: https://www.prisma.io/docs/guides/deployment

---

## Notes

- Keep this checklist updated as you deploy
- Document any issues and solutions
- Save important URLs and credentials securely
- Create backups before major changes

**Last Updated**: August 4, 2026
