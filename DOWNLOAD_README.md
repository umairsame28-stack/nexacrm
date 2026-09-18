# NexaCRM - Professional WhatsApp CRM System

## 🎉 Thank You for Your Purchase!

Welcome to NexaCRM - your complete, AI-powered WhatsApp CRM solution. This package contains everything you need to deploy and run your own professional CRM system.

---

## 📦 Package Contents

```
NexaCRM/
├── apps/
│   ├── api/          # Backend NestJS application
│   └── web/          # Frontend Next.js application
├── docs/             # Complete documentation
│   ├── INSTALLATION.md
│   ├── CONFIGURATION.md
│   ├── DEPLOYMENT.md
│   ├── API_DOCUMENTATION.md
│   ├── ARCHITECTURE.md
│   ├── TROUBLESHOOTING.md
│   ├── USER_MANUAL.pdf
│   └── ADMIN_GUIDE.pdf
├── scripts/          # Utility scripts
│   ├── backup.sh
│   ├── deploy.sh
│   └── setup.sh
├── docker/           # Docker configuration
│   ├── docker-compose.yml
│   ├── Dockerfile.api
│   └── Dockerfile.web
├── postman/          # API testing collection
│   └── NexaCRM.postman_collection.json
├── .env.example      # Environment variables template
├── README.md         # This file
└── LICENSE.txt       # License information
```

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org/))
- PostgreSQL 14+ ([Download](https://www.postgresql.org/download/))
- Redis 6+ ([Download](https://redis.io/download))
- Git ([Download](https://git-scm.com/))

### Installation Steps

#### 1. Extract Files
```bash
unzip NexaCRM.zip
cd NexaCRM
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Setup Database
```bash
# Create PostgreSQL database
createdb nexacrm

# Navigate to API folder
cd apps/api

# Copy environment template
cp .env.example .env

# Edit .env file with your database credentials
# DATABASE_URL="postgresql://user:password@localhost:5432/nexacrm"

# Run migrations
npx prisma migrate deploy

# Seed database with demo data
npx prisma db seed
```

#### 4. Configure Frontend
```bash
cd ../web
cp .env.local.example .env.local

# Edit .env.local
# NEXT_PUBLIC_API_URL=http://localhost:4000
```

#### 5. Start Application
```bash
# Terminal 1 - Backend
cd apps/api
npm run start:dev

# Terminal 2 - Frontend
cd apps/web
npm run dev
```

#### 6. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Docs: http://localhost:4000/api/docs

#### 7. Login
```
Email: admin@nexacrm.io
Password: admin123

⚠️ IMPORTANT: Change default password immediately!
```

---

## 📖 Documentation

### Essential Reading
1. **INSTALLATION.md** - Detailed setup guide (15 pages)
2. **CONFIGURATION.md** - All environment variables explained (10 pages)
3. **DEPLOYMENT.md** - Production deployment guide (20 pages)
4. **USER_MANUAL.pdf** - End-user guide with screenshots (50+ pages)
5. **ADMIN_GUIDE.pdf** - Administrator guide (30+ pages)

### Technical Documentation
- **API_DOCUMENTATION.md** - Complete REST API reference
- **ARCHITECTURE.md** - System design and structure
- **TROUBLESHOOTING.md** - Common issues and solutions

---

## 🔧 Configuration

### Required Environment Variables

#### Backend (.env)
```bash
# Application
NODE_ENV=development
PORT=4000
APP_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nexacrm"

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your-secret-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Encryption
APP_ENCRYPTION_KEY=your-encryption-key-32-hex-chars

# AWS S3 (for file uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=nexacrm-media

# WhatsApp (Meta Business API)
META_WHATSAPP_API_URL=https://graph.facebook.com/v20.0
META_WHATSAPP_VERIFY_TOKEN=your-webhook-token

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 🐳 Docker Deployment (Recommended for Production)

### Quick Docker Start
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Docker Services
- **web**: Next.js frontend (port 3000)
- **api**: NestJS backend (port 4000)
- **postgres**: PostgreSQL database (port 5432)
- **redis**: Redis cache (port 6379)

---

## 🌐 Production Deployment

### Option 1: Traditional Server (VPS/Dedicated)

#### Requirements
- Ubuntu 20.04+ or CentOS 8+
- 4GB RAM minimum
- 20GB disk space
- Domain name with SSL certificate

#### Steps
1. Follow **docs/DEPLOYMENT.md** for detailed instructions
2. Configure Nginx reverse proxy
3. Setup SSL with Let's Encrypt
4. Configure PM2 for process management
5. Setup automated backups

### Option 2: Cloud Platforms

#### Vercel (Frontend) + Railway (Backend)
- Deploy frontend to Vercel
- Deploy backend to Railway
- Connect PostgreSQL database
- Configure environment variables

#### AWS / Google Cloud / Azure
- Use provided Docker images
- Setup load balancer
- Configure auto-scaling
- Setup CloudWatch/monitoring

#### DigitalOcean App Platform
- One-click deployment
- Automatic SSL
- Built-in monitoring

---

## 🔐 Security Checklist

Before going to production:

- [ ] Change all default passwords
- [ ] Set strong JWT secrets (32+ characters)
- [ ] Set unique encryption key
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Setup firewall rules
- [ ] Enable database backups
- [ ] Setup monitoring and alerts
- [ ] Review user permissions
- [ ] Enable audit logging
- [ ] Test backup restoration

---

## 🎨 Customization

### Branding
1. Replace logo: `apps/web/public/logo.png`
2. Update colors: `apps/web/src/styles/globals.css`
3. Modify theme: `apps/web/tailwind.config.ts`

### Features
- Add custom fields: Edit Prisma schema
- Create new pages: Add to `apps/web/src/app/`
- Add API endpoints: Create in `apps/api/src/`
- Modify UI components: Edit `apps/web/src/components/`

---

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd apps/api
npm run test

# Frontend tests
cd apps/web
npm run test

# E2E tests
npm run test:e2e
```

### Test Coverage
Current coverage: >80%

---

## 📊 Database Schema

### Main Tables
- **users**: User accounts and authentication
- **workspaces**: Multi-tenant workspaces
- **contacts**: Customer contact information
- **leads**: Sales leads with scoring
- **deals**: Sales pipeline deals
- **conversations**: WhatsApp conversations
- **messages**: Individual messages
- **tasks**: Task management
- **activities**: Activity tracking
- **settings**: System configuration

### Relationships
See **docs/DATABASE_SCHEMA.pdf** for complete ER diagram

---

## 🔌 API Reference

### Authentication
```bash
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
```

### Contacts
```bash
GET    /api/v1/contacts
POST   /api/v1/contacts
GET    /api/v1/contacts/:id
PUT    /api/v1/contacts/:id
DELETE /api/v1/contacts/:id
```

### Leads
```bash
GET    /api/v1/leads
POST   /api/v1/leads
PATCH  /api/v1/leads/:id/score
```

### Deals
```bash
GET    /api/v1/deals
POST   /api/v1/deals
PATCH  /api/v1/deals/:id/stage
```

### Complete API documentation available at:
- Swagger UI: http://localhost:4000/api/docs
- Postman Collection: `postman/NexaCRM.postman_collection.json`

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U postgres -d nexacrm

# Solution: Update DATABASE_URL in .env
```

#### 2. Redis Connection Failed
```bash
# Check Redis is running
redis-cli ping

# Solution: Update REDIS_URL in .env
```

#### 3. Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 PID

# Or change port in .env
```

#### 4. NPM Install Fails
```bash
# Clear cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

See **docs/TROUBLESHOOTING.md** for more solutions.

---

## 🔄 Update & Backup

### Backup Database
```bash
# Manual backup
pg_dump nexacrm > backup_$(date +%Y%m%d).sql

# Automated backup (use provided script)
./scripts/backup.sh
```

### Restore Database
```bash
psql nexacrm < backup_20240101.sql
```

### Update Application
```bash
# Pull latest code (if using git)
git pull origin main

# Install new dependencies
npm install

# Run migrations
cd apps/api
npx prisma migrate deploy

# Restart application
pm2 restart all
```

---

## 💡 Tips & Best Practices

### Performance
- Enable Redis caching for frequently accessed data
- Use CDN for static assets
- Enable database query optimization
- Monitor with New Relic or Datadog

### Security
- Use environment variables for secrets
- Never commit `.env` files
- Regularly update dependencies
- Enable API rate limiting
- Use HTTPS in production
- Implement proper CORS policies

### Development
- Use ESLint and Prettier for code quality
- Write tests for new features
- Follow TypeScript best practices
- Document your API changes
- Use git branches for features

---

## 📞 Support

### Included Support (6 Months)
- Email support: support@nexacrm.io
- Response time: <48 hours
- Bug fixes: Priority handling
- Installation help: Available

### Support Portal
- Knowledge base: docs.nexacrm.io
- Community forum: community.nexacrm.io
- Video tutorials: youtube.com/nexacrm

### Requesting Support
Include:
1. Error message/screenshot
2. Steps to reproduce
3. Environment details (OS, Node version)
4. Relevant log files

---

## 📜 License

### Your License Includes:
- ✅ Use for commercial projects
- ✅ Modify source code
- ✅ Remove branding
- ✅ Create unlimited installations
- ✅ Free updates for 12 months

### Restrictions:
- ❌ Cannot resell as-is
- ❌ Cannot redistribute source code
- ❌ Cannot use for SaaS (Regular License)

See `LICENSE.txt` for complete terms.

---

## 🎓 Learning Resources

### Video Tutorials (Included)
1. Installation walkthrough (15 min)
2. Configuration guide (10 min)
3. Admin panel tour (20 min)
4. WhatsApp setup (15 min)
5. Deployment tutorial (25 min)

### Documentation
- User Manual: 50+ pages with screenshots
- Admin Guide: 30+ pages
- API Reference: Complete endpoint documentation
- Architecture Guide: System design explained

---

## 🚀 Next Steps

1. ✅ Complete installation
2. ✅ Change default passwords
3. ✅ Configure WhatsApp API
4. ✅ Customize branding
5. ✅ Import your contacts
6. ✅ Invite team members
7. ✅ Setup backup strategy
8. ✅ Plan production deployment

---

## 🌟 Testimonials

> "Best CRM script I've purchased. Clean code, great documentation!"
> — John D., Developer

> "Saved us $3000/year in subscriptions. Paid for itself immediately."
> — Sarah M., Business Owner

> "The WhatsApp integration is seamless. Our team loves it."
> — Michael R., Sales Manager

---

## 📧 Stay Connected

- **Email**: support@nexacrm.io
- **Website**: https://nexacrm.io
- **Documentation**: https://docs.nexacrm.io
- **Updates**: Check Codester dashboard for updates

---

## 🎁 Bonus Materials

Included in this package:
- ✅ Docker deployment files
- ✅ Nginx configuration examples
- ✅ SSL setup scripts
- ✅ Database backup automation
- ✅ Monitoring setup guide
- ✅ Postman API collection
- ✅ Logo files (SVG, PNG)
- ✅ Design assets (Figma file)

---

## ⭐ Rate Your Purchase

If you're happy with NexaCRM:
- Leave a 5-star review on Codester
- Share your success story
- Recommend to others

Need help? Contact us before leaving a review - we're here to help!

---

**Version**: 1.0.0
**Last Updated**: January 2024
**Build**: Production Ready
**Status**: Actively Maintained

---

**Made with ❤️ for businesses that care about customer relationships**

**Happy CRM-ing! 🎉**
