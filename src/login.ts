import { SHARED_STYLES, THEME_ONLY_SCRIPT } from './layout';

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
      <input type="password" id="login-password" placeholder="Password" autocomplete="current-password" />
      <button class="btn" id="login-btn">Log In</button>
    </div>

    <div class="login-message" id="login-message"></div>

    <div class="login-hint">First time here? Enter any username and password to create the first admin account.</div>
  </div>

<script>
  ${THEME_ONLY_SCRIPT}

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
</script>
</body>
</html>`;
