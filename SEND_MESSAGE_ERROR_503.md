# Send Message Error 503 - Troubleshooting Guide

## Error You're Seeing
```
AxiosError: Request failed with status code 503
```

## What This Means
A **503 Service Unavailable** error from Meta's WhatsApp API typically means one of these issues:

### 1. **Invalid or Expired Access Token** (Most Common)
Your Access Token may be:
- Expired (Quick Start tokens expire in 24 hours)
- Invalid
- Doesn't have proper permissions

**Solution:**
- Generate a **permanent** System User Access Token (not Quick Start)
- Go to Settings → WhatsApp → Update Access Token → Save

### 2. **24-Hour Window Violation** (Meta Policy)
Meta doesn't allow you to send messages to a customer unless:
- Customer messaged you first within the last 24 hours, OR
- You're sending an approved template message

**Solution:**
- Have the customer send a message to your WhatsApp Business number first
- Then you have 24 hours to reply freely
- OR use a template message (requires Meta approval)

### 3. **Invalid Phone Number**
The contact's phone number may be:
- Incorrectly formatted
- Not a WhatsApp number
- Blocked

**Solution:**
- Verify the phone number: +923239756244
- Make sure it's registered on WhatsApp
- Try sending from WhatsApp app first to verify

### 4. **Phone Number ID Mismatch**
The Phone Number ID in your settings doesn't match your actual WhatsApp Business number.

**Solution:**
- Go to Meta App Dashboard → WhatsApp → API Setup
- Copy the correct Phone Number ID
- Update in CRM Settings → WhatsApp → Save

### 5. **WhatsApp Business Account Issue**
Your WhatsApp Business Account might be:
- Not verified
- Suspended
- Has sending limits

**Solution:**
- Check Meta Business Manager for account status
- Verify your business
- Check message limits

## Debug Steps

### Step 1: Check API Logs
I've added detailed logging. After restarting API, try sending again and check terminal:

You should see:
```
📤 [Send Message] Starting send process...
📞 To: +923239756244
📱 Phone Number ID: 1162237840315924
🔐 Access Token: EAAJ...
💾 Message saved to DB with ID: xxx
📨 Sending TEXT message via Meta API...
🌐 Making request to Meta API...
```

Then either:
- ✅ Success logs, or
- ❌ Detailed error from Meta

### Step 2: Test Access Token
Let's verify your token works:

1. Go to Settings → WhatsApp
2. Click "Test Connection"
3. If it shows green checkmark → Token works for READ
4. If it fails → Token is invalid

**Note:** Token might work for reading but not sending (different permissions)

### Step 3: Test with WhatsApp App
1. Open WhatsApp on your phone
2. Send a message TO your WhatsApp Business number
3. Wait for it to appear in CRM inbox (if webhook working)
4. Then try replying from CRM within 24 hours

### Step 4: Check Meta Error Details
After restart, try sending again. The error message will now be more detailed:

**Example errors you might see:**
- "Invalid access token" → Generate new token
- "Cannot send message... within 24 hours" → Need customer to message first OR use template
- "Invalid phone number" → Check phone format
- "Rate limit exceeded" → You've hit Meta's sending limits

### Step 5: Generate New System User Token

If token is the issue:

1. Go to Meta Business Settings
2. Users → System Users
3. Create/Select a System User
4. Generate New Token
5. Select your WhatsApp app
6. Permissions needed:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
7. Select "Never expire" or set expiration
8. Copy the token
9. Paste in CRM Settings → WhatsApp → Save

## Common Meta Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 131047 | Message window expired | Customer must message first within 24h |
| 190 | Invalid token | Generate new token |
| 100 | Invalid phone number | Check phone format |
| 131031 | Phone not on WhatsApp | Verify number is WhatsApp enabled |
| 80007 | Rate limit exceeded | Wait or increase limits |
| 368 | Blocked number | Contact Meta support |

## Quick Fix Checklist

- [ ] Restart API server with new logging
- [ ] Try sending message again
- [ ] Check API terminal for detailed error
- [ ] Verify Access Token in Settings
- [ ] Click "Test Connection" - does it work?
- [ ] Have customer send message first
- [ ] Try replying within 24 hours
- [ ] Check phone number format: +923239756244
- [ ] Verify Phone Number ID: 1162237840315924
- [ ] Generate new System User token if needed

## What I've Added

Enhanced error logging in:
1. `messages.service.ts` - Shows send flow step-by-step
2. `meta-whatsapp.adapter.ts` - Shows exact Meta API error

Now when you try to send, you'll see exactly what Meta returns as the error.

## Next Steps

1. **Restart API server**
   ```powershell
   cd "c:\Users\LAP ZONE\CRM project\apps\api"
   # Ctrl+C to stop
   npm run start:dev
   ```

2. **Try sending message again**

3. **Check API logs** - you'll now see the exact error from Meta

4. **Share the logs with me** - I can tell you exactly what's wrong

The 503 error is just a generic "something failed" - the enhanced logging will show the real issue!
