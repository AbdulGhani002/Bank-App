# Bank-App

## Overview

Bank-App is a secure, full‑stack Node.js/Express banking demo with EJS views and MongoDB. It supports JWT‑based authentication, verified sign‑ups, protected account operations, and rich transaction history with statements/PDF export. It also includes strong security headers, CSRF protection, rate limiting, PWA support, diagnostics, and automated tests with CI.

## Features

### Authentication & Authorization
- JWT authentication with secure, httpOnly cookies
- Email verification on signup (login requires verified accounts)
- **Two-Factor Authentication (2FA):**
  - Email-based 2FA: 6-digit code sent to email, expires in 5 minutes
  - TOTP-based 2FA: Optional QR code setup for authenticator apps
  - Session used only for 2FA flow; app is otherwise stateless via JWT
- **Account Verification Window:**
  - 2-hour verification window after signup
  - Unverified accounts lock automatically after 2 hours
  - Locked accounts require customer support contact to unlock

### Account & Transactions
- One account per user (enforced with unique constraint)
- Deposit funds, make payments to other account numbers
- Robust validation (account number format, self‑payment prevention, insufficient funds)
- Transaction storage with sender/receiver account numbers
- Transactions list enriched with counterparty name and email
- Transaction details page with sender/receiver identities

### Statements & PDF
- Financial statement page aggregated by account number
- Nicely styled PDF export with header, summary, and paginated rows

### Security
- Helmet with hardened CSP:
	- `upgradeInsecureRequests` and `blockAllMixedContent` (prevents mixed content)
	- `frameAncestors 'none'` (prevents clickjacking)
	- HSTS, frameguard deny, and `no-referrer` policy
- CSRF protection via cookies (bypassed only in tests)
- Express rate limiting with proxy awareness
- Trusts only first proxy hop (`app.set('trust proxy', 1)`)

### User Experience (UX)
- **Toast Notifications:** Real-time error/success messages in toast format for login and signup
- **Loading Spinners:** Visual feedback during signup and login processes
- **AJAX-based Forms:** No full page reloads for auth flows; smooth, single-page-like experience
- **Customer Support Page:** Easy access to support contact information

### Email
- Nodemailer utility with single `sendEmail(to, subject, text)` export
- Transport `verify()` helper for diagnostics
- Signup verification email with token link
- Email-based 2FA code generation and delivery
- Password reset and support emails

### Diagnostics & Admin
- `/health` and `/health/email` endpoints
- Admin‑only route listing at `/routes`
- Admin email test and linkage diagnostics (see controllers/routes)
- Account status checker for verification expiry

### PWA
- `manifest.json` and `service-worker.js` for basic offline caching of static assets

### Testing & CI
- Jest + Supertest automated tests for routes and features
- CSRF bypass in test env to enable POST route testing
- GitHub Actions workflow to run tests on push/PR to `master`

## Installation

Clone the repository:

```bash
git clone https://github.com/AbdulGhani002/Bank-App.git
```

Navigate to the project directory and install dependencies:

```bash
cd Bank-App
npm ci
```

Create a `.env` file with the required settings (examples):

```bash
PORT=5500
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
MONGODB_URL=mongodb://localhost:27017/bankapp

EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=apikey_or_username
EMAIL_PASS=secret
EMAIL_FROM="Bank App <no-reply@example.com>"
ADMIN_EMAIL=admin@example.com
```

## Usage

Start the application:

```bash
npm start
```

By default the app listens on port 5500; visit:

```
http://localhost:5500/
```

## Development

Run the test suite:

```bash
npm test
```

Run specific test folders:

```bash
npm run test:unit
npm run test:e2e
```

## Contributing

Contributions are welcome! Please open an issue or PR.

## License

This project is licensed under the Apache-2.0 License — see the [LICENSE](LICENSE) file for details.

## Contact

For any inquiries, please contact [itsaghani@gmail.com](mailto:itsaghani@gmail.com).
