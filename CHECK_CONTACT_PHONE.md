# Diagnosed Issues & Fixes

## 🔴 Issues Found:

### 1. **CORS Configuration - OLD TUNNEL URL** ⚠️ (FIXED)
**Problem:**
Your `.env` file had an old Cloudflare tunnel URL:
```
CORS_ORIGINS=...,https://roger-matched-tri-sleep.trycloudflare.com
```

But your current tunnel is:
```
https://pope-beast-discussed-finances.trycloudflare.com
```

This causes CORS errors when the frontend tries to call the API through the tunnel.

**✅ FIXED:** I updated your `.env` file with the new tunnel URL.

### 2. **Tunnel Port Configuration** ⚠️
**Problem:**
Your API runs on port **3001**, not 3000.

Make sure your Cloudflare tunnel is pointing to the correct port:
```powershell
# CORRECT:
cloudflared tunnel --url http://localhost:3001

# WRONG:
cloudflared tunnel --url http://localhost:3000
```

Port 3000 is for the **web frontend**, port 3001 is for the **API**.

### 3. **Phone Number Format for Pakistan** 📱
**Potential Issue:**
Your contact has a Pakistan number: `+923239756244`

The phone normalizer defaults to 'US'. While it should handle international numbers, verify the phone is stored correctly in database as:
```
+923239756244
```

Not as:
- `923239756244` (missing +)
- `0923239756244` (with leading 0)
- Any other format

### 4. **503 Error - Most Likely Cause** 🔥
Based on Meta's policies, the 503 error when sending is most likely:

**Meta's 24-Hour Messaging Window Policy:**
- You can't send the FIRST message to a customer
- Customer must message YOU first
- Then you have 24 hours to respond freely
- OR you must use an approved template message

## ✅ ACTION ITEMS:

### Step 1: Restart Tunnel with Correct Port
```powershell
# Stop your current tunnel (Ctrl+C)

# Start tunnel pointing to API port 3001:
cloudflared tunnel --url http://localhost:3001
```

The tunnel URL will change again. Copy the new URL.

### Step 2: Update Webhook in Meta
When tunnel URL changes, update in Meta:

1. Go to Meta App Dashboard → WhatsApp → Configuration
2. Update Callback URL to:
   ```
   https://NEW-TUNNEL-URL.trycloudflare.com/api/v1/webhooks/whatsapp
   ```
3. Click "Verify and Save"

### Step 3: Update CORS in .env (if tunnel URL changed)
If your tunnel URL changed, update `.env` again:
```
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://NEW-TUNNEL-URL.trycloudflare.com
```

### Step 4: Restart API Server
```powershell
cd "c:\Users\LAP ZONE\CRM project\apps\api"
# Ctrl+C to stop
npm run start:dev
```

### Step 5: Test Message Flow

**For RECEIVING messages:**
1. Send WhatsApp message FROM your phone TO your business number
2. Check API logs for webhook POST
3. Should appear in inbox

**For SENDING messages:**
1. After receiving a message (Step 5 above)
2. Reply within 24 hours
3. Should work now

## 🎯 Why You're Getting 503 Error:

The Meta API returns 503 when:

1. **Invalid Access Token** (most common)
   - Token expired
   - Wrong token
   - Missing permissions

2. **24-Hour Window Violated**
   - Trying to send FIRST message to customer
   - Customer hasn't messaged you within 24 hours

3. **Rate Limits**
   - Too many messages sent
   - Account limits exceeded

4. **Account Issues**
   - Business account not verified
   - Phone number not approved

## 📝 Next Steps After Fixes:

1. ✅ **Restart tunnel** pointing to port 3001
2. ✅ **Copy new tunnel URL**
3. ✅ **Update Meta webhook** with new URL
4. ✅ **Update .env CORS** if URL changed
5. ✅ **Restart API server**
6. ✅ **Test receiving first:** Have someone message your WhatsApp Business number
7. ✅ **Watch API logs** to see webhook arrive
8. ✅ **Check inbox** - conversation should appear
9. ✅ **Reply within 24 hours** - should work

## 🔍 Verification Commands:

**Check tunnel is running:**
```powershell
# Open in browser:
https://YOUR-TUNNEL-URL.trycloudflare.com/health
# Should return: {"status":"ok","timestamp":"...","version":"1.0.0"}
```

**Check webhook endpoint:**
```powershell
# Open in browser:
https://YOUR-TUNNEL-URL.trycloudflare.com/api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123
# Should return: test123
```

**Check API logs when sending:**
After restarting API, you'll see detailed logs like:
```
📤 [Send Message] Starting send process...
📞 To: +923239756244
📱 Phone Number ID: 1162237840315924
🔐 Access Token: EAAJ...
📨 Sending TEXT message via Meta API...
```

Then either:
- ✅ Success logs, OR
- ❌ **Exact error from Meta** (e.g., "Error 131047: Cannot send message outside 24-hour window")

## 🎁 Pro Tip: Use ngrok Instead of Cloudflare Tunnel

Cloudflare tunnels change URLs frequently. ngrok gives you a stable URL:

```powershell
# Install ngrok: https://ngrok.com/download

# Run:
ngrok http 3001

# Copy the https:// URL (stays same for session)
```

Then you don't have to keep updating Meta webhook!

---

## Summary

**Fixed:**
- ✅ Updated CORS to use new tunnel URL

**You need to:**
- ⚠️ Restart tunnel pointing to port **3001** (not 3000)
- ⚠️ Update Meta webhook with new tunnel URL
- ⚠️ Restart API server
- ⚠️ Test receiving messages first (have someone message you)
- ⚠️ Then reply within 24 hours

The detailed logs I added will show you exactly what Meta's error is!
