// Minimal SPA for Login / Signup / 2FA flows
(function () {
  const container = document.getElementById('auth-container');
  const navLogin = document.getElementById('nav-login');
  const navSignup = document.getElementById('nav-signup');
  const csrf = document.querySelector('meta[name="csrf-token"]')?.content;

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  function renderLogin() {
    navLogin.classList.add('active'); navSignup.classList.remove('active');
    container.innerHTML = `
      <form id="login-form" class="auth-form">
        <label>Email</label>
        <input type="email" name="email" required />
        <label>Password</label>
        <input type="password" name="password" minlength="8" required />
        <button type="submit">Login</button>
      </form>
    `;
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'X-CSRF-Token': csrf },
          body: new URLSearchParams(formData),
        });
        const json = await res.json().catch(()=>({}));
        if (res.ok && json.success) {
          if (json.twoFactor === 'email') {
            renderVerifyEmail();
            showToast('2FA code sent to your email', 'info');
          } else if (json.twoFactor === 'totp') {
            renderVerifyTotp();
            showToast('Enter your authenticator token', 'info');
          } else {
            window.location.href = json.next || '/home';
          }
        } else {
          showToast(json.error || 'Login failed', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Network error during login', 'error');
      }
    });
  }

  function renderSignup() {
    navSignup.classList.add('active'); navLogin.classList.remove('active');
    container.innerHTML = `
      <form id="signup-form" class="auth-form">
        <label>Full name</label><input name="fullname" required />
        <label>Email</label><input type="email" name="email" required />
        <label>Password</label><input type="password" name="password" minlength="8" required />
        <label>Confirm password</label><input type="password" name="confirmPassword" minlength="8" required />
        <button type="submit">Create account</button>
      </form>
    `;
    const form = document.getElementById('signup-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fm = new FormData(form);
      if (fm.get('password') !== fm.get('confirmPassword')) {
        showToast('Passwords do not match', 'error');
        return;
      }
      try {
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'X-CSRF-Token': csrf },
          body: new URLSearchParams(fm),
        });
        const json = await res.json().catch(()=>({}));
        if (res.ok && json.success) {
          showToast(json.message || 'Registered. Check email to verify.', 'success');
          setTimeout(() => renderLogin(), 1500);
        } else {
          showToast(json.error || 'Registration failed', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Network error during signup', 'error');
      }
    });
  }

  function renderVerifyEmail() {
    container.innerHTML = `
      <form id="verify-email-form" class="auth-form">
        <label>Enter 2FA code from email</label>
        <input name="code" required />
        <button type="submit">Verify</button>
      </form>
    `;
    document.getElementById('verify-email-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fm = new FormData(e.target);
      try {
        const res = await fetch('/api/verify-email-2fa', {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'X-CSRF-Token': csrf },
          body: new URLSearchParams(fm),
        });
        const json = await res.json().catch(()=>({}));
        if (res.ok && json.success) {
          showToast('Verified — redirecting...', 'success');
          window.location.href = json.redirectUrl || '/home';
        } else {
          showToast(json.error || 'Verification failed', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Network error during verification', 'error');
      }
    });
  }

  function renderVerifyTotp() {
    container.innerHTML = `
      <form id="verify-totp-form" class="auth-form">
        <label>Authenticator token</label>
        <input name="token" required />
        <button type="submit">Verify</button>
      </form>
    `;
    document.getElementById('verify-totp-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fm = new FormData(e.target);
      try {
        const res = await fetch('/api/verify-2fa', {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'X-CSRF-Token': csrf },
          body: new URLSearchParams(fm),
        });
        const json = await res.json().catch(()=>({}));
        if (res.ok && json.success) {
          showToast('Verified — redirecting...', 'success');
          window.location.href = json.redirectUrl || '/home';
        } else {
          showToast(json.error || 'Verification failed', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Network error during verification', 'error');
      }
    });
  }

  navLogin.addEventListener('click', renderLogin);
  navSignup.addEventListener('click', renderSignup);

  // initial
  renderLogin();
})();
