# WhatsApp Integration Debug Guide

## Current Status
- ✅ Test Connection: Working (shows green checkmark)
- ✅ Credentials Saved: Confirmed  
- ❌ Inbox Empty: Messages not appearing
- ❌ Send Messages: Not working

## What I've Added

### 1. Enhanced Logging
I've added detailed logging to track the entire webhook flow:

**Webhook Controller** (`apps/api/src/modules/whatsapp/webhook.controller.ts`):
- 📥 Logs when webhook POST arrives
- 🔐 Logs signature verification process
- ✅ Shows which workspace matched the signature

**Webhook Processor** (`apps/api/src/modules/whatsapp/services/webhook-processor.service.ts`):
- 📞 Logs the phone_number_id from Meta
- ✅ Confirms workspace found for that phone_number_id
- 👤 Logs contact creation/update
- 💬 Logs conversation creation/update
- 💾 Logs message save to database
- 🔌 Logs WebSocket emission

## Next Steps to Debug

### Step 1: Restart the API Server
The enhanced logging won't work until you restart the API:

```bash
# Stop the current API (Ctrl+C if running in terminal)
# Then start it again:
cd apps/api
npm run start:dev
```

### Step 2: Send a Test Message
1. Open WhatsApp on your phone
2. Send a message to your WhatsApp Business number
3. Watch the API terminal logs carefully

### Step 3: Check the Logs
You should see output like this:

```
📥 Webhook POST received from xxx.xxx.xxx.xxx
🔐 Verifying HMAC signature...
🔍 Found 1 workspace(s) with webhook secret configured
✅ Signature matched for workspace abc-123-def
✅ Signature verified, processing webhook...
🔄 Starting webhook processing...
📞 Phone Number ID: 1162237840315924
✅ Found workspace: abc-123-def
📨 Processing 1 inbound message(s)...
📩 Processing message wamid.xxx from +1234567890
👤 Creating/updating contact for phone: +1234567890
✅ Contact ID: contact-uuid
💬 Creating/updating conversation...
✅ Conversation ID: convo-uuid
💾 Saving message to database (type: TEXT)...
✅ Message saved with ID: msg-uuid
🔄 Updating conversation metadata...
🔌 Emitting WebSocket event to workspace abc-123-def...
✅ ✅ ✅ Successfully processed inbound message from +1234567890 → conversation convo-uuid
```

### Step 4: Identify the Problem

#### Problem A: No webhook POST received
**Symptoms:** No "📥 Webhook POST received" log

**Possible Causes:**
1. Tunnel not running or expired
2. Webhook URL in Meta not configured correctly
3. Meta can't reach your tunnel URL

**Solutions:**
- Verify tunnel is running: `ngrok http 3000` (or your tunnel service)
- Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
- Go to Meta App Dashboard → WhatsApp → Configuration
- Set webhook URL to: `https://abc123.ngrok.io/api/v1/webhooks/whatsapp`
- Click "Verify and Save"

#### Problem B: Signature verification failed
**Symptoms:** See "❌ Signature did not match any workspace" or "❌ Invalid webhook signature"

**Possible Causes:**
1. Webhook Secret not saved in database
2. Wrong webhook secret

**Solutions:**
- In CRM Settings → WhatsApp
- Make sure you entered the **exact** Webhook Secret from Meta
- Click **Save** (not just Test Connection)
- Verify webhook secret matches Meta exactly

#### Problem C: No workspace found for phone_number_id
**Symptoms:** See "❌ No workspace found for phone number ID: 1162237840315924"

**Possible Causes:**
1. Phone Number ID in database doesn't match the one receiving messages
2. Credentials saved for wrong Phone Number ID

**Solutions:**
- Verify the Phone Number ID in your Meta dashboard
- Should be: `1162237840315924`
- Go to CRM Settings → WhatsApp
- Make sure Phone Number ID matches **exactly**
- Click **Save**

#### Problem D: Messages saved but not showing in inbox
**Symptoms:** All logs show ✅ success but inbox still empty

**Possible Causes:**
1. Frontend not fetching conversations
2. WebSocket not connected
3. Wrong workspace context

**Solutions:**
- Check browser console for errors
- Verify you're logged into the correct workspace
- Hard refresh the inbox page (Ctrl+Shift+R)

### Step 5: Check Database Manually

You can verify the data is actually being saved:

```javascript
// In apps/api directory, run: node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Check conversations
prisma.conversation.findMany().then(console.log);

// Check messages  
prisma.message.findMany({ take: 5, orderBy: { createdAt: 'desc' } }).then(console.log);

// Check WhatsApp settings
prisma.workspaceSettings.findFirst().then(settings => {
  console.log('Phone Number ID:', settings?.wabPhoneNumberId);
  console.log('Has Access Token:', !!settings?.wabAccessToken);
  console.log('Has Webhook Secret:', !!settings?.wabWebhookSecret);
  console.log('Verify Token:', settings?.wabVerifyToken);
});
```

## Send Messages Not Working

### Check 1: Verify Credentials Are Saved
The send functionality requires:
- ✅ `wabPhoneNumberId` - Phone Number ID
- ✅ `wabAccessToken` - Access Token (encrypted)

Both must be saved in the database.

### Check 2: Try Sending from CRM
1. Open a conversation (or if inbox is empty, see Problem C above)
2. Type a message
3. Click Send
4. Check the browser console and API logs for errors

### Common Send Errors

**Error: "WhatsApp is not configured for this workspace"**
- Solution: Go to Settings → WhatsApp → Enter credentials → Click **Save**

**Error: "Conversation not found"**
- Solution: The conversation doesn't exist or you don't have access

**Error: Meta API errors (OAuth, invalid token, etc.)**
- Solution: Your Access Token may have expired or is invalid
- Generate a new System User token (permanent, not Quick Start token)
- Save it in Settings

## Quick Checklist

- [ ] API server restarted after code changes
- [ ] Tunnel is running and accessible
- [ ] Webhook URL configured in Meta dashboard
- [ ] Webhook URL format: `https://your-tunnel.ngrok.io/api/v1/webhooks/whatsapp`
- [ ] Webhook verified successfully in Meta (green checkmark)
- [ ] Phone Number ID matches exactly: `1162237840315924`
- [ ] Access Token saved (not empty)
- [ ] Webhook Secret saved (not empty)
- [ ] Verify Token saved (any random string)
- [ ] Subscribed to `messages` webhook field in Meta
- [ ] Test message sent from WhatsApp
- [ ] Watching API logs for webhook POST

## Need More Help?

Run the diagnostic script:
```bash
cd "c:\Users\LAP ZONE\CRM project"
node check-whatsapp-config.js
```

This will show:
- Whether credentials are saved
- Which workspace has credentials
- Number of conversations and messages in database
- Recent conversations (if any)
