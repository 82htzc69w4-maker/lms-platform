import { SHARED_STYLES, THEME_ONLY_SCRIPT, PASSWORD_TOGGLE_SCRIPT } from './layout';

export const loginHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Log In — Bohs LMS</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
${SHARED_STYLES}

  body {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .login-card {
    width: 100%;
    max-width: 380px;
    background: var(--panel);
    border: 1px solid var(--grid-line);
    border-radius: 3px;
    padding: 36px 32px;
    border-top: 3px solid transparent;
    border-image: repeating-linear-gradient(-45deg, var(--hazard) 0 10px, var(--bg) 10px 20px) 3;
  }

  .login-brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
    margin-bottom: 28px;
  }

  .login-brand img {
    height: 64px;
    width: auto;
    max-width: 100%;
    display: none;
  }

  .login-brand-name {
    font-family: 'Big Shoulders Display', sans-serif;
    font-weight: 800;
    font-size: 20px;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--hazard);
  }

  .login-subtitle {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-align: center;
    margin-bottom: 24px;
  }

  .login-form input {
    width: 100%;
    background: var(--panel-alt);
    border: 1px solid var(--grid-line);
    color: var(--text-primary);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    padding: 11px 12px;
    border-radius: 2px;
    margin-bottom: 12px;
  }

  .login-form input:focus {
    outline: none;
    border-color: var(--hazard);
  }

  .login-form .btn {
    width: 100%;
    padding: 12px;
    font-size: 13px;
  }

  .login-message {
    margin-top: 14px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    text-align: center;
    color: var(--risk);
    min-height: 16px;
  }

  .login-hint {
    margin-top: 20px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
    text-align: center;
    line-height: 1.5;
  }
</style>
</head>
<body>
  <div class="login-card">
    <div class="login-brand">
      <img id="login-logo" src="" alt="Logo" />
      <div class="login-brand-name" id="login-company-name">Bohs LMS</div>
    </div>
    <div class="login-subtitle">Competence Control — Sign In</div>

    <div class="login-form">
      <input type="text" id="login-username" placeholder="Username" autocomplete="username" />
      <div class="password-wrapper">
        <input type="password" id="login-password" placeholder="Password" autocomplete="current-password" />
        <button type="button" class="password-toggle" data-target="login-password" aria-label="Show password"></button>
      </div>
      <button class="btn" id="login-btn" style="margin-top: 12px;">Log In</button>
    </div>

    <div class="login-message" id="login-message"></div>

    <div style="text-align: center; margin-top: 12px;">
      <button type="button" id="forgot-password-link" style="background:none; border:none; color: var(--text-muted); font-family: 'IBM Plex Mono', monospace; font-size: 12px; text-decoration: underline; cursor: pointer; padding: 0;">Forgot Password?</button>
    </div>

    <div id="forgot-password-form" style="display: none; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--grid-line);">
      <div style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">Enter your username. An Administrator will set a new password for you and let you know separately — this system doesn't have email set up to send a reset link automatically.</div>
      <input type="text" id="forgot-password-username" placeholder="Username" style="margin-bottom: 10px;" />
      <button class="btn" id="forgot-password-submit-btn" style="width: 100%; background: var(--panel-alt); color: var(--text-primary); border: 1px solid var(--grid-line);">Submit Request</button>
      <div id="forgot-password-message" style="margin-top: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 12px;"></div>
    </div>

    <div class="login-hint">First time here? Enter any username and password to create the first admin account.</div>
  </div>

<script>
  ${THEME_ONLY_SCRIPT}
  ${PASSWORD_TOGGLE_SCRIPT}

  function attemptLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const msgEl = document.getElementById('login-message');

    if (!username || !password) {
      msgEl.textContent = 'Username and password are both required.';
      return;
    }

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Login failed');
        window.location.href = '/';
      })
      .catch((err) => {
        msgEl.textContent = err.message;
      });
  }

  document.getElementById('login-btn').addEventListener('click', attemptLogin);
  document.getElementById('login-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') attemptLogin();
  });

  document.getElementById('forgot-password-link').addEventListener('click', () => {
    const formEl = document.getElementById('forgot-password-form');
    formEl.style.display = formEl.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('forgot-password-submit-btn').addEventListener('click', () => {
    const username = document.getElementById('forgot-password-username').value.trim();
    const msgEl = document.getElementById('forgot-password-message');

    if (!username) {
      msgEl.textContent = 'Please enter your username.';
      msgEl.style.color = 'var(--risk)';
      return;
    }

    fetch('/api/password-reset-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    })
      .then(() => {
        msgEl.textContent = 'Request submitted. An Administrator will be in touch with a new password.';
        msgEl.style.color = 'var(--competent)';
        document.getElementById('forgot-password-username').value = '';
      })
      .catch(() => {
        msgEl.textContent = 'Could not submit the request — please try again.';
        msgEl.style.color = 'var(--risk)';
      });
  });
</script>
</body>
</html>`;
