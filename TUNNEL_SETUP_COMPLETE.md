# 🎉 Tunnel URLs Updated Successfully!

## ✅ What I Updated:

### 1. Backend Configuration (`apps/api/.env`)
```env
APP_URL=https://confidential-img-coding-shown.trycloudflare.com
FRONTEND_URL=https://christ-omaha-agenda-thing.trycloudflare.com
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://christ-omaha-agenda-thing.trycloudflare.com,https://confidential-img-coding-shown.trycloudflare.com
```

### 2. Frontend Configuration (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL=https://confidential-img-coding-shown.trycloudflare.com
```

---

## 🚀 Next Steps - Do These Now:

### Step 1: Restart Backend API
```powershell
cd "c:\Users\LAP ZONE\CRM project\apps\api"
# Press Ctrl+C to stop current server
npm run start:dev
```

**Wait for:** `NexaCRM API listening on port 3001`

### Step 2: Restart Frontend Web
```powershell
cd "c:\Users\LAP ZONE\CRM project\apps\web"
# Press Ctrl+C to stop current server
npm run dev
```

**Wait for:** `Ready on http://localhost:3000`

### Step 3: Update Meta WhatsApp Webhook
**This is critical!** Meta needs to know your new webhook URL.

1. **Go to:** [Meta App Dashboard](https://developers.facebook.com/apps/)
2. **Click:** Your app → WhatsApp → Configuration
3. **Edit Webhook:**
   - **Callback URL:** 
     ```
     https://confidential-img-coding-shown.trycloudflare.com/api/v1/webhooks/whatsapp
     ```
   - **Verify Token:** (use the same token you have in WhatsApp settings)
4. **Click:** "Verify and Save"
5. **Should show:** ✅ Green checkmark

### Step 4: Subscribe to Webhook Fields
Make sure these are checked:
- ✅ **messages** (required!)
- ✅ **message_status** (optional but recommended)

---

## 🧪 Test Your Setup:

### Test 1: Health Check
Open in browser:
```
https://confidential-img-coding-shown.trycloudflare.com/health
```
**Expected:** `{"status":"ok","timestamp":"...","version":"1.0.0"}`

### Test 2: Webhook Verification
Open in browser (replace YOUR_VERIFY_TOKEN):
```
https://confidential-img-coding-shown.trycloudflare.com/api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123
```
**Expected:** `test123`

### Test 3: Access Frontend
Open in browser:
```
https://christ-omaha-agenda-thing.trycloudflare.com
```
**Expected:** Your CRM login page

### Test 4: Receive WhatsApp Message
1. **From your phone:** Send a WhatsApp message TO your business number
2. **Watch API terminal:** Should see:
   ```
   📥 Webhook POST received from xxx.xxx.xxx.xxx
   🔐 Verifying HMAC signature...
   ✅ Signature verified, processing webhook...
   📞 Phone Number ID: 1162237840315924
   ✅ Found workspace: your-workspace-id
   📨 Processing 1 inbound message(s)...
   ✅ ✅ ✅ Successfully processed inbound message
   ```
3. **Check CRM Inbox:** Message should appear

### Test 5: Send WhatsApp Message
1. **After receiving a message** (Test 4)
2. **Open the conversation** in CRM
3. **Type and send** a reply
4. **Watch API terminal:** Should see:
   ```
   📤 [Send Message] Starting send process...
   📞 To: +923239756244
   📱 Phone Number ID: 1162237840315924
   📨 Sending TEXT message via Meta API...
   ✅ Message sent successfully!
   ```

---

## 📋 Quick Reference:

| Service | URL |
|---------|-----|
| **API (Backend)** | https://confidential-img-coding-shown.trycloudflare.com |
| **Web (Frontend)** | https://christ-omaha-agenda-thing.trycloudflare.com |
| **Webhook URL for Meta** | https://confidential-img-coding-shown.trycloudflare.com/api/v1/webhooks/whatsapp |
| **Health Check** | https://confidential-img-coding-shown.trycloudflare.com/health |
| **API Docs (Swagger)** | https://confidential-img-coding-shown.trycloudflare.com/docs |

---

## ⚠️ Important Notes:

### Keep Tunnels Running
Both tunnel terminals must stay open:
- **Terminal 1:** `cloudflared tunnel --url http://localhost:3001` (API)
- **Terminal 2:** `cloudflared tunnel --url http://localhost:3000` (Web)

If you close them, the URLs die and nothing works!

### URLs Will Change
Every time you restart Cloudflare tunnels, URLs change. You'll need to:
1. Update `.env` files again
2. Update Meta webhook again
3. Restart servers

**Pro Tip:** Use ngrok instead for stable URLs that don't change!

### 24-Hour Window for Sending
Remember: You can only SEND messages if:
- Customer messaged you first within 24 hours, OR
- You use an approved template message

So always **test receiving first** before testing sending!

---

## 🐛 Troubleshooting:

### "CORS Error" in browser console
- Restart API server (you probably forgot Step 1)
- Check `.env` has both tunnel URLs

### "Network Error" when trying to login
- Frontend can't reach API
- Check `apps/web/.env.local` has correct API URL
- Restart web server (Step 2)

### Webhook not receiving messages
- Meta webhook not updated (Step 3)
- Webhook secret mismatch
- Tunnel not running
- Check API logs for errors

### 503 error when sending
- Try receiving a message first
- Customer must message you within 24 hours
- Or use template message
- Check API logs for exact Meta error

---

## ✅ Checklist:

- [ ] Both tunnels running (don't close terminals!)
- [ ] API server restarted (Step 1)
- [ ] Web server restarted (Step 2)
- [ ] Meta webhook updated with new URL (Step 3)
- [ ] Webhook fields subscribed (Step 4)
- [ ] Health check passes (Test 1)
- [ ] Webhook verification passes (Test 2)
- [ ] Frontend loads (Test 3)
- [ ] Can receive messages (Test 4)
- [ ] Can send messages (Test 5)

---

## 🎯 Current Status:

✅ **Tunnel URLs:** Configured  
✅ **Backend .env:** Updated  
✅ **Frontend .env:** Updated  
⏳ **API Server:** Need to restart  
⏳ **Web Server:** Need to restart  
⏳ **Meta Webhook:** Need to update  
⏳ **Testing:** Ready to test after restarts  

---

**You're all set! Follow the steps above and everything should work!** 🚀
