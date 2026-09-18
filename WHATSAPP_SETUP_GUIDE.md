# WhatsApp Business API Integration Guide

## 🔧 Complete Setup Instructions

### Step 1: Create Meta Business Account

1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Create a Business Account if you don't have one
3. Verify your business

### Step 2: Create WhatsApp Business App

1. Go to [Meta Developers](https://developers.facebook.com/)
2. Click **"Create App"**
3. Select **"Business"** as the app type
4. Fill in app details and create
5. Add **"WhatsApp"** product to your app

### Step 3: Get Your Credentials

#### Phone Number ID

1. In your WhatsApp app dashboard, go to **"API Setup"**
2. Under **"From"**, you'll see your test number
3. Click on it to reveal the **Phone Number ID** (a long numeric string like `1162237840315924`)
4. ✅ Copy this - it's your **Phone Number ID**

#### Access Token (CRITICAL - Must Be Permanent)

**⚠️ WARNING: The token shown in the Quick Start is TEMPORARY and expires in 24 hours!**

To get a **permanent** token:

1. Go to **Meta Business Suite** → **Settings** → **System Users**
2. Click **"Add"** to create a new System User
3. Give it a name (e.g., "WhatsApp API")
4. Click on the System User you just created
5. Click **"Generate New Token"**
6. Select your WhatsApp app
7. ✅ **CRITICAL**: Select these permissions:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
8. Select **"Never Expire"** for token expiration
9. Click **"Generate Token"**
10. ✅ Copy this token - it's your **permanent Access Token**
11. **Save it somewhere safe** - you can't view it again!

**Token Format Check:**
- ✅ Correct: `EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (very long, starts with EAA)
- ❌ Wrong: Short token from Quick Start tab (expires in 24h)

### Step 4: Configure Webhook (Optional but Recommended)

1. In your WhatsApp app dashboard, go to **"Configuration"**
2. Click **"Edit"** next to Webhook
3. Enter the **Callback URL** from the CRM
4. Enter a **Verify Token** (any string you choose, e.g., `mySecretToken123`)
5. Click **"Verify and Save"**
6. Subscribe to **"messages"** webhook field

### Step 5: Add Credentials to CRM

1. In your CRM, go to **Settings → WhatsApp**
2. Enter:
   - **Phone Number ID**: The numeric ID from Step 3
   - **Access Token**: The **permanent** token from System User (Step 3)
   - **Webhook Secret**: (optional) Any strong secret for webhook validation
   - **Verify Token**: The token you set in Step 4
3. Click **"Test Connection"**
   - ✅ Should show: `Connected · +1234567890 · Your Business Name`
   - ❌ If failed: See troubleshooting below

## 🐛 Troubleshooting

### Error 190: "Invalid OAuth access token"

**Cause**: Token is temporary (expired) or revoked

**Fix**:
1. Generate a **new permanent token** from System User (see Step 3 above)
2. Make sure to select "Never Expire"
3. Use the NEW token in the CRM

### Error 100: "Invalid parameter"

**Cause**: Phone Number ID is wrong

**Fix**:
1. Go back to WhatsApp dashboard
2. Copy the **Phone Number ID** (not the phone number itself)
3. Ensure it's a long numeric string (15+ digits)

### Error 200: "Permissions error"

**Cause**: System User doesn't have required permissions

**Fix**:
1. Edit your System User
2. Ensure it has **Admin** access to the WhatsApp app
3. Regenerate the token with both permissions:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`

### Connection Timeout

**Cause**: Network issue or firewall blocking Meta API

**Fix**:
1. Check your internet connection
2. Ensure your server can reach `https://graph.facebook.com`
3. Test manually: `curl https://graph.facebook.com/v20.0/me`

### "Credentials not configured"

**Cause**: Form values weren't saved before testing

**Fix**:
1. Enter credentials
2. Click **"Save"** first
3. Then click **"Test Connection"**

## 📝 Quick Checklist

Before testing connection, verify:

- [ ] Token starts with `EAA` and is very long (200+ characters)
- [ ] Token was generated from **System User** (not Quick Start)
- [ ] Token has **"Never Expire"** selected
- [ ] Phone Number ID is numeric (15+ digits)
- [ ] Phone Number ID is from the **"From"** field in API Setup
- [ ] System User has both `whatsapp_business_management` and `whatsapp_business_messaging` permissions

## 🔐 Security Best Practices

1. **Never share your Access Token** - it's like a password
2. **Use Webhook Secret** - validates webhook authenticity
3. **Rotate tokens periodically** - even permanent tokens should be rotated
4. **Use different System Users** - for dev/staging/production
5. **Monitor API usage** - check Meta dashboard for unusual activity

## 📞 Support

If you're still having issues:
1. Check the [Meta WhatsApp Business API docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
2. Review the error in the CRM - it shows the exact Meta API error message
3. Check Meta App dashboard for rate limits or restrictions

## 🎯 Expected Result

When everything is configured correctly:

```
✅ Connection successful
📱 Phone Number: +1 (234) 567-8900
🏢 Display Name: Your Business Name
⭐ Quality Rating: GREEN
```
