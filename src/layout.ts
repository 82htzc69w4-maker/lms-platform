// Shared HTML layout + navigation for every frontend page in the LMS.
// Keeps design tokens (colors, type, hazard-stripe motif) in one place so
// new module pages can reuse the same shell.

const NAV_ITEMS: Array<{ label: string; path: string }> = [
  { label: 'Dashboard', path: '/' },
  { label: 'Coach', path: '/modules/coach' },
  { label: 'Admin', path: '/admin' },
];

export const SHARED_STYLES = `
  :root {
    --bg: #14171A;
    --panel: #1B1F23;
    --panel-alt: #21262B;
    --grid-line: #2E3438;
    --text-primary: #ECE8DF;
    --text-muted: #8B9199;
    --hazard: #F2B705;
    --risk: #C1443A;
    --refresher: #D98E2A;
    --competent: #3E9B54;
  }

  body[data-theme="light"] {
    --bg: #F1EDE4;
    --panel: #FFFFFF;
    --panel-alt: #EAE5D9;
    --grid-line: #D9D2C3;
    --text-primary: #14171A;
    --text-muted: #6B6459;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--bg);
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
  }

  a { color: inherit; text-decoration: none; }

  .app-layout {
    display: flex;
    min-height: 100vh;
  }

  /* ---------- Sidebar ---------- */
  .sidebar {
    width: 220px;
    flex-shrink: 0;
    background: var(--panel);
    border-right: 1px solid var(--grid-line);
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
  }

  .nav-brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-family: 'Big Shoulders Display', sans-serif;
    font-weight: 800;
    font-size: 18px;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--hazard);
    text-align: center;
    padding: 20px 8px 24px;
    border-bottom: 1px solid var(--grid-line);
    line-height: 1.15;
  }

  .nav-brand img {
    height: 76px;
    width: auto;
    max-width: 100%;
    display: none;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 4px;
    padding: 16px 8px;
    border-bottom: 1px solid var(--grid-line);
    font-family: 'IBM Plex Mono', monospace;
  }

  .user-info-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .user-info-role {
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .user-info-logout {
    margin-top: 6px;
    font-size: 11px;
    color: var(--hazard);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    cursor: pointer;
  }

  .user-info-logout:hover { text-decoration: underline; }

  .nav-link {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-muted);
    padding: 9px 12px;
    border-radius: 2px;
    transition: color 0.15s ease, background 0.15s ease;
  }

  .nav-link:hover { color: var(--text-primary); background: var(--panel-alt); }

  .nav-link.active {
    color: var(--bg);
    background: var(--hazard);
  }

  /* ---------- Main content ---------- */
  .main-content {
    flex: 1;
    min-width: 0;
    padding: 28px 32px 64px;
  }

  /* ---------- Header ---------- */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-bottom: 20px;
    margin-bottom: 32px;
    border-bottom: 1px solid var(--grid-line);
    flex-wrap: wrap;
    gap: 16px;
  }

  .eyebrow {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.14em;
    color: var(--hazard);
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  h1 {
    font-family: 'Big Shoulders Display', sans-serif;
    font-weight: 800;
    font-size: 40px;
    letter-spacing: 0.01em;
    margin: 0;
    text-transform: uppercase;
    line-height: 1;
  }

  .clock-block { text-align: right; font-family: 'IBM Plex Mono', monospace; }
  .clock { font-size: 22px; font-weight: 600; color: var(--text-primary); }
  .clock-label { font-size: 11px; color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 2px; }

  /* ---------- Stat tiles ---------- */
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
  .stat-tile { background: var(--panel); border: 1px solid var(--grid-line); padding: 18px 20px; border-radius: 3px; }
  .stat-label { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px; }
  .stat-value { font-family: 'IBM Plex Mono', monospace; font-size: 38px; font-weight: 600; line-height: 1; }
  .stat-value.risk { color: var(--risk); }
  .stat-value.refresher { color: var(--refresher); }
  .stat-value.total { color: var(--hazard); }

  /* ---------- Panels ---------- */
  .panel { background: var(--panel); border: 1px solid var(--grid-line); border-radius: 3px; margin-bottom: 28px; overflow: hidden; }
  .panel-header {
    position: relative;
    padding: 16px 20px;
    background: var(--panel-alt);
    border-bottom: 3px solid transparent;
    border-image: repeating-linear-gradient(-45deg, var(--hazard) 0 10px, #14171A 10px 20px) 3;
  }
  .panel-title { font-family: 'Big Shoulders Display', sans-serif; font-weight: 700; font-size: 20px; text-transform: uppercase; letter-spacing: 0.02em; }
  .panel-sub { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--text-muted); margin-top: 4px; }
  .panel-body { padding: 20px; }

  /* ---------- Heat map ---------- */
  .heatmap { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1px; background: var(--grid-line); }
  .heat-cell { background: var(--panel); padding: 18px 16px; display: flex; flex-direction: column; gap: 8px; }
  .heat-dept { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
  .heat-status { display: flex; align-items: center; gap: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 13px; font-weight: 600; text-transform: uppercase; }

  .dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
  .dot.green { background: var(--competent); box-shadow: 0 0 6px var(--competent); }
  .dot.amber { background: var(--refresher); box-shadow: 0 0 6px var(--refresher); }
  .dot.red { background: var(--risk); box-shadow: 0 0 6px var(--risk); }
  .dot.gray { background: var(--text-muted); }

  .status-green { color: var(--competent); }
  .status-amber { color: var(--refresher); }
  .status-red { color: var(--risk); }
  .status-gray { color: var(--text-muted); }

  /* ---------- Tables ---------- */
  table { width: 100%; border-collapse: collapse; font-family: 'IBM Plex Mono', monospace; font-size: 13px; }
  thead th { text-align: left; padding: 12px 20px; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--grid-line); }
  tbody td { padding: 12px 20px; border-bottom: 1px solid var(--grid-line); }
  tbody tr:last-child td { border-bottom: none; }

  .pill { display: inline-block; padding: 3px 10px; border-radius: 2px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
  .pill.not_competent { background: rgba(193, 68, 58, 0.16); color: var(--risk); }
  .pill.needs_refresher { background: rgba(217, 142, 42, 0.16); color: var(--refresher); }
  .pill.expired { background: rgba(193, 68, 58, 0.16); color: var(--risk); }
  .pill.competent { background: rgba(62, 155, 84, 0.16); color: var(--competent); }

  .empty-state { padding: 40px 20px; text-align: center; color: var(--text-muted); font-family: 'IBM Plex Mono', monospace; font-size: 13px; }

  /* ---------- Tabs ---------- */
  .tabbar {
    display: flex;
    gap: 4px;
    margin-bottom: 24px;
    border-bottom: 1px solid var(--grid-line);
    flex-wrap: wrap;
  }

  .tab-btn {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
    background: none;
    border: none;
    padding: 10px 16px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }

  .tab-btn:hover { color: var(--text-primary); }

  .tab-btn.active {
    color: var(--hazard);
    border-bottom-color: var(--hazard);
  }

  .tab-panel { display: none; }
  .tab-panel.active { display: block; }

  /* ---------- Forms ---------- */
  .form-row { display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
  .form-row input, .form-row select {
    background: var(--panel-alt);
    border: 1px solid var(--grid-line);
    color: var(--text-primary);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    padding: 10px 12px;
    border-radius: 2px;
    flex: 1;
    min-width: 140px;
  }
  .form-row input:focus, .form-row select:focus {
    outline: none;
    border-color: var(--hazard);
  }
  .btn {
    background: var(--hazard);
    color: var(--bg);
    border: none;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 10px 18px;
    border-radius: 2px;
    cursor: pointer;
  }
  .btn:hover { filter: brightness(1.08); }

  footer {
    text-align: center;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 40px;
    letter-spacing: 0.04em;
  }

  @media (max-width: 640px) {
    .stats { grid-template-columns: 1fr; }
    h1 { font-size: 30px; }
  }

  @media (max-width: 860px) {
    .app-layout { flex-direction: column; }
    .sidebar {
      position: static;
      width: 100%;
      height: auto;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      border-right: none;
      border-bottom: 1px solid var(--grid-line);
    }
    .sidebar-nav { flex-direction: row; flex-wrap: wrap; }
    .main-content { padding: 20px 20px 48px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .stat-value { transition: none !important; }
  }
`;

const CLOCK_SCRIPT = `
  function tickClock() {
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('clock-date');
    if (!clockEl || !dateEl) return;
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-ZA', { hour12: false });
    dateEl.textContent = now.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  tickClock();
  setInterval(tickClock, 1000);
`;

export const THEME_ONLY_SCRIPT = `
  fetch('/api/settings')
    .then(r => r.json())
    .then(settings => {
      let effectiveTheme = settings.theme || 'dark';
      if (effectiveTheme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      }
      if (effectiveTheme === 'light') {
        document.body.setAttribute('data-theme', 'light');
      } else {
        document.body.removeAttribute('data-theme');
      }

      const logoEl = document.getElementById('login-logo');
      if (logoEl && settings.logoDataUrl) {
        logoEl.src = settings.logoDataUrl;
        logoEl.style.display = 'inline-block';
      }
      const nameEl = document.getElementById('login-company-name');
      if (nameEl) nameEl.textContent = settings.systemName;
    })
    .catch(() => { /* keep static defaults if settings can't be reached */ });
`;

const BRANDING_SCRIPT = `
  fetch('/api/settings')
    .then(r => r.json())
    .then(settings => {
      document.querySelectorAll('#brand-name-text, #eyebrow-brand').forEach(el => {
        el.textContent = settings.systemName;
      });
      const footerEl = document.getElementById('footer-company');
      if (footerEl) footerEl.textContent = settings.companyName;

      const logoEl = document.getElementById('brand-logo');
      if (logoEl && settings.logoDataUrl) {
        logoEl.src = settings.logoDataUrl;
        logoEl.style.display = 'inline-block';
      }

      document.title = document.title.replace('Bohs LMS', settings.systemName);

      // Apply theme: 'dark' (default, no attribute needed), 'light', or 'system'
      // (follow the OS preference at load time).
      let effectiveTheme = settings.theme || 'dark';
      if (effectiveTheme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      }
      if (effectiveTheme === 'light') {
        document.body.setAttribute('data-theme', 'light');
      } else {
        document.body.removeAttribute('data-theme');
      }
    })
    .catch(() => { /* keep static defaults if settings can't be reached */ });
`;

const AUTH_SCRIPT = `
  fetch('/api/auth/me')
    .then(r => {
      if (!r.ok) throw new Error('not logged in');
      return r.json();
    })
    .then(data => {
      const user = data.user;
      document.getElementById('user-info').style.display = 'flex';
      document.getElementById('user-info-name').textContent = user.name;
      document.getElementById('user-info-role').textContent = user.role;
      document.getElementById('user-info-logout').addEventListener('click', () => {
        fetch('/api/auth/logout', { method: 'POST' }).then(() => {
          window.location.href = '/login';
        });
      });
    })
    .catch(() => {
      window.location.href = '/login';
    });
`;

function renderNav(activePath: string): string {
  const links = NAV_ITEMS.map((item) => {
    const isActive = item.path === activePath;
    return `<a class="nav-link${isActive ? ' active' : ''}" href="${item.path}">${item.label}</a>`;
  }).join('');

  return `
    <aside class="sidebar">
      <div class="nav-brand">
        <img id="brand-logo" src="" alt="Logo" />
        <span id="brand-name-text">Bohs LMS</span>
      </div>
      <div class="user-info" id="user-info" style="display: none;">
        <div class="user-info-name" id="user-info-name"></div>
        <div class="user-info-role" id="user-info-role"></div>
        <div class="user-info-logout" id="user-info-logout">Log out</div>
      </div>
      <nav class="sidebar-nav">
        ${links}
      </nav>
    </aside>
  `;
}

export function renderLayout(opts: {
  title: string;
  activePath: string;
  eyebrowSuffix: string;
  heading: string;
  bodyHtml: string;
  scripts?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${opts.title} — Bohs LMS</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>${SHARED_STYLES}</style>
</head>
<body>
  <div class="app-layout">
    ${renderNav(opts.activePath)}

    <main class="main-content">
      <div class="header">
        <div>
          <div class="eyebrow"><span id="eyebrow-brand">Bohs LMS</span> — ${opts.eyebrowSuffix}</div>
          <h1>${opts.heading}</h1>
        </div>
        <div class="clock-block">
          <div class="clock" id="clock">--:--:--</div>
          <div class="clock-label" id="clock-date">Loading</div>
        </div>
      </div>

      ${opts.bodyHtml}

      <footer><span id="footer-company">Bohs Consultants</span> &mdash; Competence Control build</footer>
    </main>
  </div>

<script>
  ${CLOCK_SCRIPT}
  ${BRANDING_SCRIPT}
  ${AUTH_SCRIPT}
  ${opts.scripts ?? ''}
</script>
</body>
</html>`;
}
