# 2FA & UX Enhancement Implementation Guide

## Overview
This document describes the features added in the latest update: email-based 2FA, account verification with 2-hour expiry window, toast notifications, and AJAX-based auth flows.

## New Features

### 1. Email-Based 2FA
**Files Modified:**
- `controllers/auth.controller.js` - Added `getVerifyEmail2FA()` and `verifyEmail2FA()`
- `routes/auth.routes.js` - Added `/verify-email-2fa` and `/api/verify-email-2fa` routes
- `utils/email.js` - Added `generate2FACode()` and `send2FACode()`

**Flow:**
1. User logs in with email/password
2. 6-digit code is generated and sent via email (5-minute expiry)
3. User is redirected to `/verify-email-2fa` page
4. User enters code via AJAX form
5. On successful verification, JWT is created and user is logged in

**Environment Requirements:**
- EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM must be set

### 2. Account Verification Window (2 Hours)
**Files Modified:**
- `models/user.model.js` - Added `tokenCreatedAt` and `accountLocked` fields
- `utils/verification.js` - New utility for managing verification expiry
- `controllers/auth.controller.js` - Uses `getUserAccountStatus()` in login flow
- `middlewares/auth-middleware.js` - Checks account locked status in `requireAuth()`

**Flow:**
1. On signup, `tokenCreatedAt` is set to current date/time
2. When user logs in, system checks if 2 hours have passed since signup
3. If expired and unverified, account is automatically locked
4. Locked accounts cannot log in; user sees "Account Locked" page
5. User must contact customer support to unlock

**User Fields Added:**
```javascript
{
  tokenCreatedAt: Date,
  accountLocked: Boolean,
  twoFACode: String,          // Temporary 6-digit code
  twoFACodeExpiry: Date,      // When 2FA code expires
}
```

### 3. Toast Notifications
**Files Created/Modified:**
- `public/js/toast.js` - Toast utility function
- `views/customer/auth/login.ejs` - AJAX login with toast
- `views/customer/auth/create-account.ejs` - AJAX signup with toast

**Usage:**
```javascript
showToast('Success message', 'success');    // Green
showToast('Error message', 'error');        // Red
showToast('Info message', 'info');          // Blue
showToast('Warning message', 'warning');    // Orange
```

**Types:** `success`, `error`, `info`, `warning`
**Default Duration:** 4000ms (4 seconds)

### 4. AJAX Auth Forms
**Files Modified:**
- `views/customer/auth/login.ejs` - AJAX form with loading spinner
- `views/customer/auth/create-account.ejs` - AJAX form with loading spinner

**Benefits:**
- No full page reload on submit
- Real-time error/success feedback
- Loading spinner during submission
- Better UX with smooth transitions

### 5. New Pages
**Files Created:**
- `views/customer/auth/verify-email-2fa.ejs` - 2FA code entry form
- `views/shared/account-locked.ejs` - Account locked notification
- `views/shared/customer-support.ejs` - Customer support contact page

**Routes Added:**
- GET `/customer-support` - Customer support page
- GET `/account-locked` - Account locked page
- GET `/verify-email-2fa` - 2FA code entry
- POST `/api/verify-email-2fa` - Verify 2FA code (API endpoint)

## Security Considerations

### 2FA Code Security
- Codes are 6-digit numbers (0-999999)
- Codes expire after 5 minutes
- Codes are stored in database temporarily, cleared after verification
- No logging of codes; only verification success/failure is logged

### Account Locking Security
- Automatic locking after 2-hour verification window
- Cannot be reversed via API; requires manual admin intervention
- Prevents brute-force account verification attempts

### AJAX Form Security
- CSRF tokens are included in all POST requests
- Form data is validated client-side and server-side
- Password is sent over HTTPS only (in production)
- No sensitive data logged in browser console

## Testing

### Manual Testing
```bash
# Start app
npm start

# Test signup flow
# 1. Go to /signup
# 2. Fill form and submit (should show loader)
# 3. Check email for verification link
# 4. Click link to verify email
# 5. Go to /login and test 2FA code entry

# Test account locking (simulate)
# 1. In MongoDB, update user: { tokenCreatedAt: <2+ hours ago> }
# 2. Try to access /home as authenticated user
# 3. Should be redirected to /account-locked
```

### Automated Testing
```bash
npm test

# Add tests for:
# - 2FA code generation
# - Account verification expiry
# - AJAX form submission
# - Toast notification display
```

## Database Schema Changes

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  password: String,        // Bcrypt hashed
  name: String,
  address: {
    street: String,
    city: String,
    postalCode: String,
  },
  isVerified: Boolean,
  verificationToken: String,  // SHA-256 hashed
  tokenCreatedAt: Date,        // NEW: When account was created
  accountLocked: Boolean,      // NEW: Is account locked?
  twoFACode: String,           // NEW: Temporary 6-digit code
  twoFACodeExpiry: Date,       // NEW: When code expires
  twoFactorEnabled: Boolean,   // Existing: TOTP enabled?
  twoFactorSecret: String,     // Existing: TOTP secret
}
```

## API Reference

### POST /login
```
Body: { email, password, _csrf }
Response:
  - 302 Redirect to /verify-email-2fa (if 2FA enabled)
  - 302 Redirect to /home (if login successful)
  - 401 Error (invalid credentials or account locked)
```

### POST /api/verify-email-2fa
```
Body: { code, _csrf }
Response:
  - 200 { success: true, redirectUrl: "/home" }
  - 400 { error: "2FA code expired" }
  - 401 { error: "Invalid 2FA code" }
  - 500 { error: "Server error" }
```

### GET /account-locked
```
Query: ?message=...
Response: HTML page showing account locked message
```

### GET /customer-support
```
Response: HTML page with support contact information
```

## Configuration

### Environment Variables
```bash
# Email (required for 2FA)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="Bank App <noreply@bankapp.com>"

# Auth
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret
ADMIN_EMAIL=admin@bankapp.com

# Database
MONGODB_URL=mongodb://...

# Server
PORT=5500
NODE_ENV=production
```

## Frontend Assets

### JavaScript
- `public/js/toast.js` - Toast notification utility

### Styles (Inline in EJS)
- Login form spinner animation
- Signup form spinner animation
- Toast notification styling

## Future Enhancements

1. **Rate Limiting on 2FA Attempts**
   - Limit incorrect 2FA code attempts
   - Lock account after N failed attempts

2. **Remember Device**
   - Store device fingerprint
   - Skip 2FA on remembered devices

3. **Backup Codes**
   - Generate backup codes during 2FA setup
   - Allow recovery if email is unavailable

4. **Admin Dashboard**
   - Unlock accounts
   - Resend verification emails
   - View user 2FA status

5. **Password Reset**
   - Add password reset flow
   - Send reset link via email

6. **Email Verification Resend**
   - Button to resend verification email
   - Rate limit resend attempts

## Troubleshooting

### 2FA Code Not Sent
- Check EMAIL_* environment variables
- Verify email credentials are correct
- Check `/health/email` endpoint for email transport status
- Check server logs for email errors

### Account Locked Prematurely
- Check `tokenCreatedAt` in MongoDB
- Manually clear `accountLocked: false` if needed
- Ensure server time is synchronized

### AJAX Forms Not Working
- Check browser console for JavaScript errors
- Verify CSRF token is present in form
- Check Content-Type headers in requests

### 2FA Code Format Invalid
- Code must be exactly 6 digits
- Should only contain numbers 0-9
- Form validation enforces this

## References

- [Email.js Documentation](https://nodemailer.com/)
- [TOTP Implementation](https://en.wikipedia.org/wiki/Time-based_one-time_password)
- [OWASP 2FA Guide](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
