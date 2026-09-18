# 🆕 New Tunnel URLs - Updated!

## ✅ Files Updated:

### 1. Backend (`apps/api/.env`)
```env
APP_URL=https://doug-reasonably-poison-preceding.trycloudflare.com
FRONTEND_URL=https://constitutes-gif-beginning-camel.trycloudflare.com
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://constitutes-gif-beginning-camel.trycloudflare.com,https://doug-reasonably-poison-preceding.trycloudflare.com
```

### 2. Frontend (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL=https://doug-reasonably-poison-preceding.trycloudflare.com
```

---

## 🚀 Next Steps:

### 1. Start Backend API
```powershell
cd "c:\Users\LAP ZONE\CRM project\apps\api"
npm run start:dev
```
**Wait for:** `NexaCRM API listening on port 3001`

### 2. Start Frontend Web
```powershell
cd "c:\Users\LAP ZONE\CRM project\apps\web"
npm run dev
```
**Wait for:** `Ready on http://localhost:3000`

### 3. Update Meta Webhook URL
**Go to:** [Meta App Dashboard](https://developers.facebook.com/apps/)

**Set Callback URL to:**
```
https://doug-reasonably-poison-preceding.trycloudflare.com/api/v1/webhooks/whatsapp
```

**Subscribe to:**
- ✅ messages
- ✅ message_status

**Click "Verify and Save"** - should show ✅

---

## 🧪 Quick Tests:

### Test 1: Health Check
```
https://doug-reasonably-poison-preceding.trycloudflare.com/health
```
**Expected:** `{"status":"ok","timestamp":"...","version":"1.0.0"}`

### Test 2: Webhook Verification
```
https://doug-reasonably-poison-preceding.trycloudflare.com/api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123
```
*(Replace YOUR_VERIFY_TOKEN)*
**Expected:** `test123`

### Test 3: Access Frontend
```
https://constitutes-gif-beginning-camel.trycloudflare.com
```
**Expected:** CRM login page

---

## 📝 Important URLs:

| Service | URL |
|---------|-----|
| **API Backend** | https://doug-reasonably-poison-preceding.trycloudflare.com |
| **Web Frontend** | https://constitutes-gif-beginning-camel.trycloudflare.com |
| **Webhook for Meta** | https://doug-reasonably-poison-preceding.trycloudflare.com/api/v1/webhooks/whatsapp |
| **Health Check** | https://doug-reasonably-poison-preceding.trycloudflare.com/health |
| **API Docs** | https://doug-reasonably-poison-preceding.trycloudflare.com/docs |

---

## ✅ Checklist:

- [ ] API server started (port 3001)
- [ ] Web server started (port 3000)
- [ ] Both tunnels running (don't close terminals!)
- [ ] Meta webhook URL updated
- [ ] Health check passes
- [ ] Webhook verification passes
- [ ] Can access frontend
- [ ] Ready to test!

---

**All files updated! Now start both servers and update Meta webhook!** 🎉
