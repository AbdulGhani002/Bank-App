# Quick Reference - 2FA & UX Enhancements

## Quick Start

### Test Email 2FA Locally
```bash
# 1. Set up email in .env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="Bank App <noreply@bankapp.com>"

# 2. Start server
npm start

# 3. Visit http://localhost:5500/signup
# 4. Fill form and submit (shows loader)
# 5. Check email for verification link
# 6. Click link to verify
# 7. Go to /login and enter email/password
# 8. Check email for 2FA code
# 9. Enter code on verification page
# 10. Success! You're logged in
```

## User Flows

### Signup Flow
```
GET /signup
    ↓
POST /signup (AJAX with loader)
    ↓
Email sent with verify link
    ↓
Toast: "Account created! Check email"
    ↓
Redirect to /login
```

### Login with Email 2FA
```
GET /login
    ↓
POST /login (AJAX with loader)
    ↓
Email 2FA code sent
    ↓
Redirect to /verify-email-2fa
    ↓
POST /api/verify-email-2fa (AJAX)
    ↓
JWT created, redirect to /home
```

### Account Verification Expiry
```
Signup at: 2:00 PM
    ↓
2 hours pass (4:00 PM)
    ↓
User tries login at 4:30 PM
    ↓
System detects expiry
    ↓
accountLocked = true
    ↓
Redirect to /account-locked
    ↓
Show: "Contact support to unlock"
```

## File Organization

```
Bank-App/
├── controllers/
│   └── auth.controller.js         [MODIFIED: +2FA, email code]
├── models/
│   └── user.model.js              [MODIFIED: +verification fields]
├── middlewares/
│   └── auth-middleware.js         [MODIFIED: +account lock check]
├── routes/
│   ├── auth.routes.js             [MODIFIED: +2FA endpoints]
│   └── base.routes.js             [MODIFIED: +support pages]
├── utils/
│   ├── email.js                   [MODIFIED: +2FA code functions]
│   └── verification.js            [NEW: account lock utilities]
├── public/
│   └── js/
│       └── toast.js               [NEW: toast notifications]
├── views/
│   ├── customer/auth/
│   │   ├── login.ejs              [MODIFIED: AJAX + toast]
│   │   ├── create-account.ejs     [MODIFIED: AJAX + loader]
│   │   └── verify-email-2fa.ejs   [NEW: 2FA code entry]
│   └── shared/
│       ├── account-locked.ejs     [NEW: lock notification]
│       ├── customer-support.ejs   [NEW: support info]
│       └── includes/
│           └── head.ejs           [MODIFIED: +toast.js script]
└── docs/
    ├── 2FA_UX_IMPLEMENTATION.md   [NEW: detailed guide]
    └── IMPLEMENTATION_SUMMARY.md  [NEW: complete summary]
```

## API Endpoints Summary

| Method | Endpoint | Purpose | Response |
|--------|----------|---------|----------|
| GET | `/signup` | Signup form | HTML form |
| POST | `/signup` | Create account | 302 redirect |
| GET | `/login` | Login form | HTML form |
| POST | `/login` | Authenticate | 302 to 2FA or error |
| GET | `/verify-email-2fa` | 2FA form | HTML form |
| POST | `/api/verify-email-2fa` | Verify code | JSON (success/error) |
| GET | `/verify-email` | Verify signup | 302 redirect |
| GET | `/logout` | Logout | 302 redirect |
| GET | `/account-locked` | Lock page | HTML page |
| GET | `/customer-support` | Support page | HTML page |

## Toast Examples

```javascript
// Success
showToast('Login successful!', 'success');

// Error
showToast('Invalid 2FA code', 'error');

// Info
showToast('Sending verification email...', 'info');

// Warning
showToast('2FA code expires in 1 minute', 'warning');

// Custom duration
showToast('Message', 'success', 2000); // 2 seconds
```

## Key Timings

| Event | Duration | Note |
|-------|----------|------|
| Email verification window | 2 hours | Auto-lock after |
| 2FA code validity | 5 minutes | Then invalid |
| Toast display | 4 seconds | Then auto-remove |
| TOTP code validity | 30 seconds | Standard |
| JWT expiry | 24 hours | Can be configured |
| Session 2FA | Until logout | For TOTP flow |

## Security Checklist

- [x] Email 2FA codes are temporary (5 min)
- [x] Codes cleared from DB after use
- [x] Account locking for expired verification
- [x] CSRF tokens on all forms
- [x] Server-side validation required
- [x] HTTPS recommended in production
- [x] No sensitive data in localStorage
- [x] No passwords logged
- [x] Rate limiting on auth attempts

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 2FA code not sent | Check `/health/email` endpoint |
| Code "invalid" | Ensure not expired (5 min window) |
| Account locked | Manual admin unlock needed |
| Toast not showing | Verify toast.js loaded (check console) |
| AJAX form not working | Check CSRF token in form |
| Email service fails | Fallback to TOTP if configured |

## Testing Commands

```bash
# Check email configuration
curl http://localhost:5500/health/email

# List all routes
curl http://localhost:5500/routes \
  -H "Authorization: Bearer TOKEN"

# Run automated tests
npm test

# Test specific suite
npm test -- --testNamePattern="auth"
```

## Database Queries

```javascript
// Find locked accounts
db.Users.find({ accountLocked: true })

// Find unverified accounts (old)
db.Users.find({ 
  isVerified: false, 
  tokenCreatedAt: { $lt: new Date(Date.now() - 2*60*60*1000) }
})

// Create indexes (for performance)
db.Users.createIndex({ tokenCreatedAt: 1 })
db.Users.createIndex({ accountLocked: 1 })
```

## Environment Setup

```bash
# Create .env file
cat > .env << EOF
PORT=5500
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
MONGODB_URL=mongodb://localhost:27017/bankapp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="Bank App <noreply@bankapp.com>"
ADMIN_EMAIL=admin@example.com
NODE_ENV=development
EOF
```

## Performance Notes

- 2FA code lookup: O(1) by email + tokenCreatedAt index
- Account lock check: O(1) by _id index
- Toast: Client-side only, no server impact
- AJAX forms: Reduced server load vs traditional forms

## Monitoring

### Health Endpoints
```bash
# General health
http://localhost:5500/health

# Email service health
http://localhost:5500/health/email
```

### Logs to Watch
```
"Failed to send 2FA code" - Email service issue
"2FA code expired" - User took >5 min to enter code
"Account locked" - Verification window expired
"CSRF token validation failed" - Security issue
```

## Next Steps

1. **Deploy**: Push to production with email service configured
2. **Monitor**: Check health endpoints and logs
3. **Test**: Have users test 2FA flow
4. **Enhance**: Add backup codes or device memory (future)
5. **Document**: Update deployment docs with new features

---

**Last Updated:** December 15, 2025
**Status:** Production Ready ✅
