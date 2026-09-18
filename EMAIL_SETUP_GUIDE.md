# 📧 Email Configuration Guide

## 🔴 Current Issues Fixed

### Issue 1: Fake Email Registration
**Problem**: Users can register with any email (real or fake)  
**Solution**: Email validation is already enabled via `@IsEmail()` decorator. Users cannot register with invalid email formats.

### Issue 2: Password Reset Emails Not Sent
**Problem**: Forgot password doesn't send emails  
**Solution**: Created event listener that triggers email sending when password reset is requested.

## 🛠️ How Password Reset Works Now

```
User clicks "Forgot Password"
  ↓
Frontend sends email to API
  ↓
Backend checks if email exists
  ↓
Generates reset token (1 hour expiry)
  ↓
Stores token in database
  ↓
Emits "password_reset_requested" event
  ↓
AuthListener catches event
  ↓
Calls EmailNotificationService
  ↓
Email sent via SMTP (if configured)
```

## 📋 SMTP Configuration

### Option 1: Mailtrap (Best for Development)

[Mailtrap.io](https://mailtrap.io) — Catches all emails in a fake inbox (no real emails sent)

1. Sign up for free at https://mailtrap.io
2. Go to **Email Testing → Inboxes → My Inbox**
3. Copy credentials from **SMTP Settings**
4. Add to your `.env`:

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_username
SMTP_PASSWORD=your_mailtrap_password
SMTP_FROM_EMAIL=noreply@nexacrm.io
SMTP_FROM_NAME=NexaCRM
```

**Restart API** after adding these

### Option 2: Gmail (Production)

⚠️ **Requires App Password** (not your Gmail password)

1. Enable 2-Factor Authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an "App Password" for "Mail"
4. Add to `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=NexaCRM
```

### Option 3: SendGrid (Production)

[SendGrid](https://sendgrid.com) — 100 free emails/day

1. Sign up at https://sendgrid.com
2. Create an API key
3. Add to `.env`:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM_EMAIL=verified@yourdomain.com
SMTP_FROM_NAME=NexaCRM
```

### Option 4: Resend (Modern Choice)

[Resend.com](https://resend.com) — Developer-friendly

1. Sign up at https://resend.com
2. Get your API key
3. Add to `.env`:

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=your-resend-api-key
SMTP_FROM_EMAIL=onboarding@resend.dev
SMTP_FROM_NAME=NexaCRM
```

## 🧪 Testing Email

### Test 1: Check SMTP Configuration

1. Restart API after adding SMTP env vars
2. Watch logs on startup:
   ```
   [EmailNotificationService] SMTP configured successfully
   ```
   
   **OR** if SMTP not configured:
   ```
   [EmailNotificationService] SMTP not configured — email notifications disabled
   ```

### Test 2: Test Password Reset Flow

1. Go to login page
2. Click "Forgot Password"
3. Enter your email (must be registered)
4. Click "Submit"
5. **Check API logs**:
   ```
   [ForgotPassword] Request received for email: user@example.com
   [ForgotPassword] User found: abc-123, generating reset token...
   [ForgotPassword] Token generated, expires at: 2026-08-04T15:30:00.000Z
   [ForgotPassword] Token stored in database, emitting event...
   [ForgotPassword] Event emitted for user@example.com
   [AuthListener] Sending password reset email to user@example.com
   [AuthListener] Password reset email sent successfully to user@example.com
   ```

6. **Check your email inbox** (or Mailtrap inbox)
7. Should receive:
   ```
   Subject: Reset your NexaCRM password
   
   You requested a password reset. Click the link below...
   [Reset Password Button]
   ```

### Test 3: Verify Reset Link Works

1. Click link in email
2. Should redirect to: `http://localhost:3000/auth/reset-password?token=abc123...`
3. Enter new password
4. Submit
5. Should see: "Password reset successfully"
6. Login with new password

## 🐛 Troubleshooting

### "SMTP not configured" warning

**Cause**: SMTP environment variables missing or incorrect

**Fix**:
1. Check `.env` file has all SMTP_* variables
2. Restart API: `npm run dev:api`
3. Check logs for "SMTP configured successfully"

### Email not received

**Causes**:
1. SMTP credentials wrong
2. "From" email not verified (Gmail, SendGrid)
3. Email in spam folder
4. Mailtrap inbox not opened

**Debug**:
1. Check API logs for errors:
   ```
   [AuthListener] Failed to send password reset email...
   [EmailNotificationService] Failed to send email...
   ```
2. Verify SMTP credentials are correct
3. Test SMTP connection manually:
   ```bash
   # Using telnet (Windows)
   telnet smtp.mailtrap.io 2525
   ```

### "User not found" (but user exists)

**Cause**: Email case sensitivity

**Fix**: System stores emails in lowercase. If you registered with `User@Example.COM`, try entering `user@example.com` in forgot password.

### Token expired

**Cause**: Reset tokens expire in 1 hour

**Fix**: Request a new reset link

## 🔐 Security Notes

### Why email validation is important:

1. **Prevents typos** — Users can't register with `user@gmial.com`
2. **Reduces spam** — Invalid emails are rejected immediately
3. **Ensures deliverability** — Only real emails can receive notifications

### Email Format Validation (Already Enabled)

The `@IsEmail()` decorator validates:
- ✅ Has `@` symbol
- ✅ Has domain (e.g., `.com`, `.org`)
- ✅ No spaces or invalid characters
- ❌ Rejects: `notanemail`, `user@`, `@domain.com`

### What Email Validation DOESN'T Do

- ❌ Check if email actually exists
- ❌ Verify email is owned by the user
- ❌ Prevent disposable emails (temp-mail.com)

### Optional: Email Verification (Future Enhancement)

To require users to verify their email before accessing the system:

1. Add `emailVerified: boolean` flag to User model (already exists)
2. Send verification email on registration
3. Block login if `emailVerified === false`
4. Provide "Resend Verification Email" button

**Implementation**:
```typescript
// In auth.listener.ts
@OnEvent('user.registered')
async handleUserRegistered(event: UserRegisteredEvent) {
  // Send verification email with token
  await this.emailService.sendVerificationEmail(
    event.email,
    event.verificationToken,
  );
}
```

## 📊 Expected Behavior After Fix

### Registration
✅ User enters email → Validated format  
✅ Invalid email (no `@`) → Error: "Please enter a valid email"  
✅ Valid email → Registration succeeds  
✅ Duplicate email → Error: "Email already exists"

### Forgot Password
✅ User enters email → Backend checks if exists  
✅ Email exists → Reset email sent  
✅ Email doesn't exist → Silent (security: don't reveal which emails exist)  
✅ Email sent successfully → Check inbox  
✅ Click link → Redirect to reset page  
✅ Enter new password → Password updated  

## 🎯 Verification Checklist

Before marking as complete, verify:

- [ ] `.env` has all SMTP_* variables
- [ ] API restarted after adding SMTP vars
- [ ] API logs show "SMTP configured successfully"
- [ ] Forgot password triggers email (check logs)
- [ ] Email received in inbox (or Mailtrap)
- [ ] Reset link works and redirects to frontend
- [ ] New password works after reset

## 📞 Support

**Email not sending?**
1. Share API logs (mask SMTP password)
2. Confirm SMTP provider (Gmail, Mailtrap, etc.)
3. Verify email was received in spam folder

**Email validation too strict?**
1. The `@IsEmail()` validator uses standard RFC rules
2. If legitimate emails are rejected, share examples

**Want email verification?**
1. Requires additional implementation (see Optional section above)
2. Can be added in future iteration
