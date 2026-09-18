# Gmail SMTP Setup for Password Reset Emails

## 📧 Option 1: Use Gmail (Recommended for Testing)

### Step 1: Enable 2-Factor Authentication on Your Gmail
1. Go to: https://myaccount.google.com/security
2. Under "Signing in to Google", click **2-Step Verification**
3. Follow the steps to enable it (if not already enabled)

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other (Custom name)** → Type: "NexaCRM"
4. Click **Generate**
5. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)
6. **Important**: Remove the spaces when pasting

### Step 3: Update .env File
Open `apps/api/.env` and update:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=abcdefghijklmnop  # ← Your 16-char app password (no spaces)
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=NexaCRM
```

### Step 4: Restart Backend
```powershell
# Stop the backend (Ctrl+C in terminal or stop the process)
# Then restart:
npm run start:dev --workspace=apps/api
```

---

## 📧 Option 2: Use Mailtrap (Testing Only - Emails Don't Actually Send)

Good for testing email templates without sending real emails.

### Step 1: Sign Up for Mailtrap
1. Go to: https://mailtrap.io/
2. Sign up for free account
3. Go to: Inboxes → My Inbox
4. Click "Show Credentials"

### Step 2: Copy SMTP Credentials
You'll see:
```
Host: smtp.mailtrap.io
Port: 587
Username: [your-username]
Password: [your-password]
```

### Step 3: Update .env File
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
SMTP_FROM_EMAIL=noreply@nexacrm.io
SMTP_FROM_NAME=NexaCRM
```

### Step 4: Restart Backend
```powershell
npm run start:dev --workspace=apps/api
```

### Step 5: Check Mailtrap Inbox
When you test password reset, check the Mailtrap inbox - the email will appear there instead of your real inbox.

---

## 📧 Option 3: Use Outlook/Hotmail

### SMTP Settings:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-outlook-password
SMTP_FROM_EMAIL=your-email@outlook.com
SMTP_FROM_NAME=NexaCRM
```

**Note**: May require app-specific password if 2FA is enabled.

---

## 🧪 Testing Password Reset

### Step 1: Start Both Servers
```powershell
# Terminal 1: Frontend
npm run dev --workspace=apps/web

# Terminal 2: Backend
npm run start:dev --workspace=apps/api
```

### Step 2: Test Forgot Password Flow
1. Open: http://localhost:3000/login
2. Click: "Forgot Password?"
3. Enter your email address
4. Click: "Send Reset Link"
5. Check your email (or Mailtrap inbox)

### Step 3: Expected Email
You should receive an email with:
- Subject: "Reset Your Password - NexaCRM"
- Reset link: `http://localhost:3000/reset-password?token=...`
- Link expires in 1 hour

### Step 4: Click Reset Link
1. Click the link in the email
2. Enter new password (twice)
3. Click "Reset Password"
4. Login with new password

---

## 🔍 Troubleshooting

### Problem: "Invalid credentials" error in backend logs

**Solution**:
- Check Gmail app password is correct (16 chars, no spaces)
- Make sure 2FA is enabled on Google account
- Try regenerating app password

### Problem: "Connection timeout" or "ECONNREFUSED"

**Solution**:
- Check firewall isn't blocking port 587
- Try port 465 with SSL instead:
  ```env
  SMTP_PORT=465
  # Add to code: secure: true
  ```

### Problem: Email not received (Gmail)

**Check**:
1. Spam/Junk folder
2. Gmail "Social" or "Promotions" tabs
3. Backend logs for errors:
   ```powershell
   # Check backend terminal for email sending errors
   ```

### Problem: Backend logs show "SMTP not configured"

**Solution**:
- Make sure `.env` file has SMTP settings filled
- Restart backend after updating `.env`
- Check for typos in variable names

---

## 📋 Quick Commands

### Check Backend Logs for Email Errors
Look at the backend terminal for messages like:
```
[EmailService] Sending password reset email to: user@example.com
[EmailService] Email sent successfully
```

Or errors like:
```
[EmailService] Failed to send email: Invalid credentials
```

### Restart Backend
```powershell
# Stop current backend (Ctrl+C)
npm run start:dev --workspace=apps/api
```

### Test SMTP Connection
You can test SMTP settings in the NexaCRM settings page:
1. Login to NexaCRM
2. Go to: Settings → SMTP Settings
3. Fill in credentials
4. Click "Test Connection"

---

## 🚀 Recommended Setup

For **local development**:
1. Use **Mailtrap** - free, no real emails sent, easy setup
2. All password reset emails appear in Mailtrap inbox
3. No risk of accidentally spamming real users

For **testing with real emails**:
1. Use **Gmail** with app password
2. Use your own email for testing
3. Actually receive reset emails

For **production**:
1. Use proper email service (SendGrid, AWS SES, Mailgun)
2. Configure custom domain
3. Set up SPF/DKIM records

---

## ✅ After Configuration

Once SMTP is configured and backend restarted:

1. **Test immediately**:
   ```
   1. Go to login page
   2. Click "Forgot Password?"
   3. Enter your email
   4. Submit
   5. Check email (or Mailtrap)
   ```

2. **Expected behavior**:
   - Backend logs show: "Email sent successfully"
   - Email arrives within 1-2 minutes
   - Reset link works and redirects to reset form

3. **If it works**:
   - Password reset is fully functional ✅
   - Users can recover their accounts
   - Email system is working

---

## 🎯 Current Status

**SMTP Configured**: ❌ No (needs your credentials)  
**Backend Running**: ✅ Yes  
**Frontend Running**: ✅ Yes  

**Next Steps**:
1. Choose Gmail or Mailtrap
2. Get credentials
3. Update `apps/api/.env`
4. Restart backend
5. Test forgot password flow

---

**Need Help?** 
- Gmail app password guide: https://support.google.com/accounts/answer/185833
- Mailtrap free account: https://mailtrap.io/register/signup
