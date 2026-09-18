# GitHub Setup Guide for NexaCRM

## Date: August 4, 2026

## ✅ Pre-Setup Checklist

Your project is ready for GitHub:
- ✅ `.gitignore` file exists (comprehensive)
- ✅ `README.md` exists (detailed documentation)
- ✅ Code is organized in monorepo structure
- ✅ Environment variables properly configured

---

## Step 1: Install Git (If Not Already Installed)

### Download Git for Windows:
1. Go to: https://git-scm.com/download/win
2. Download and install
3. During installation, select:
   - ✅ "Git from the command line and also from 3rd-party software"
   - ✅ "Use Windows' default console window"
4. After installation, **restart your terminal/VS Code**

### Verify Installation:
```powershell
git --version
```
Should show: `git version 2.x.x`

---

## Step 2: Configure Git (First Time Setup)

```powershell
# Set your name and email (will appear in commits)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify configuration
git config --list
```

---

## Step 3: Initialize Git Repository

```powershell
# Navigate to project directory
cd "C:\Users\LAP ZONE\CRM project"

# Initialize Git repository
git init

# Check status
git status
```

---

## Step 4: Review Files Before Committing

**IMPORTANT: Check for sensitive data!**

Before staging files, ensure these are in `.gitignore`:
- ✅ `.env` files (API keys, secrets)
- ✅ `node_modules/`
- ✅ `*.pem` files (SSL certificates)
- ✅ Database files
- ✅ Log files

**Already handled:** Your `.gitignore` is properly configured!

---

## Step 5: Stage and Commit Files

```powershell
# Stage all files
git add .

# Check what will be committed
git status

# Create initial commit
git commit -m "Initial commit: NexaCRM project with mobile responsiveness and PWA"
```

---

## Step 6: Create GitHub Repository

### Option A: Via GitHub Website (Easier)

1. Go to: https://github.com
2. Sign in to your account
3. Click the **"+"** icon (top-right) → **"New repository"**
4. Fill in:
   - **Repository name**: `nexacrm` (or your preferred name)
   - **Description**: `AI-Powered WhatsApp CRM SaaS Platform`
   - **Visibility**: 
     - ✅ **Private** (Recommended - contains business logic)
     - ⬜ Public (if open source)
   - **⚠️ DO NOT initialize with:**
     - ❌ README (you already have one)
     - ❌ .gitignore (you already have one)
     - ❌ License
5. Click **"Create repository"**

### Option B: Via GitHub CLI (Advanced)

```powershell
# Install GitHub CLI first: https://cli.github.com/
gh repo create nexacrm --private --source=. --remote=origin --push
```

---

## Step 7: Connect Local Repo to GitHub

After creating the GitHub repository, you'll see a page with commands. Use these:

```powershell
# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/nexacrm.git

# Verify remote was added
git remote -v

# Rename branch to main (if not already)
git branch -M main

# Push to GitHub
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

---

## Step 8: Verify Upload

1. Go to: `https://github.com/YOUR_USERNAME/nexacrm`
2. You should see all your files
3. Check that:
   - ✅ `.env` files are **NOT** visible (gitignored)
   - ✅ `node_modules/` is **NOT** visible (gitignored)
   - ✅ README displays properly
   - ✅ Code files are all present

---

## Step 9: Future Updates (Daily Workflow)

### When you make changes:

```powershell
# Check what changed
git status

# Stage specific files
git add apps/web/src/components/demo/product-experience.tsx
git add docs/WATCH_DEMO_MOBILE_FIXES.md

# Or stage all changes
git add .

# Commit with descriptive message
git commit -m "Fix: Mobile responsiveness for Watch Demo modal"

# Push to GitHub
git push
```

---

## Common Commands Reference

| Command | Purpose |
|---------|---------|
| `git status` | See what changed |
| `git add .` | Stage all changes |
| `git add <file>` | Stage specific file |
| `git commit -m "message"` | Create commit |
| `git push` | Upload to GitHub |
| `git pull` | Download from GitHub |
| `git log` | See commit history |
| `git branch` | List branches |
| `git checkout -b feature-name` | Create new branch |

---

## Troubleshooting

### Error: "git is not recognized"
**Solution:** Install Git (Step 1) and restart terminal

### Error: "remote origin already exists"
**Solution:**
```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/nexacrm.git
```

### Error: "Permission denied"
**Solution:** Use GitHub Personal Access Token:
1. Go to: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Use token as password when pushing

### Error: "Large files rejected"
**Solution:** GitHub has 100MB file limit. Check for:
- Large node_modules (should be gitignored)
- Large database files (should be gitignored)
- Media files (consider Git LFS or external storage)

---

## Security Reminders

### ⚠️ NEVER commit:
- `.env` files
- API keys
- Passwords
- Private keys (`.pem` files)
- Database credentials
- OAuth secrets

### ✅ Always commit:
- `.env.example` files (without actual values)
- Source code
- Documentation
- Configuration files (without secrets)

---

## What's Next?

After GitHub setup:
1. ✅ Code is backed up
2. ✅ Ready for collaboration
3. ✅ Can deploy to Railway/Render/Vercel
4. ✅ Version history tracked

### Ready for Railway Deployment?
Once pushed to GitHub, Railway can:
- Connect to your GitHub repo
- Auto-deploy on every push
- Deploy frontend, backend, and database

---

## Quick Start Summary

```powershell
# 1. Install Git (if needed) → restart terminal

# 2. Configure Git
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# 3. Initialize and commit
cd "C:\Users\LAP ZONE\CRM project"
git init
git add .
git commit -m "Initial commit: NexaCRM project"

# 4. Create repo on GitHub.com (private recommended)

# 5. Connect and push
git remote add origin https://github.com/YOUR_USERNAME/nexacrm.git
git branch -M main
git push -u origin main
```

**Done! Your project is now on GitHub.** 🎉
