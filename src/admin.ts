import { renderLayout } from './layout';

const bodyHtml = `
  <div class="panel">
    <div class="panel-header">
      <div class="panel-title">Company Branding</div>
      <div class="panel-sub">Changes here apply across every screen immediately</div>
    </div>
    <div class="panel-body">

      <div style="margin-bottom: 20px;">
        <div class="stat-label" style="margin-bottom: 8px;">Logo</div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <img id="logo-preview" src="" alt="Logo preview"
               style="height: 56px; max-width: 220px; display: none; background: var(--panel-alt); border: 1px solid var(--grid-line); border-radius: 3px; padding: 6px;" />
          <div id="logo-empty" class="stat-label" style="text-transform: none; letter-spacing: 0;">No logo uploaded yet</div>
        </div>
        <div class="form-row" style="margin-top: 12px;">
          <input type="file" id="logo-input" accept="image/*" />
        </div>
      </div>

      <div class="form-row">
        <input type="text" id="company-name" placeholder="Company name (e.g. Bohs Consultants)" />
        <input type="text" id="system-name" placeholder="System name (e.g. Bohs LMS)" />
      </div>

      <div style="margin-bottom: 20px;">
        <div class="stat-label" style="margin-bottom: 8px;">Theme</div>
        <div class="form-row">
          <select id="theme-select">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">Match System Settings</option>
          </select>
        </div>
      </div>

      <button class="btn" id="save-branding-btn">Save Changes</button>
      <div id="save-message" style="margin-top: 12px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>

    </div>
  </div>
`;

const scripts = `
  let pendingLogoDataUrl = null;

  function loadSettings() {
    fetch('/api/settings')
      .then(r => r.json())
      .then(settings => {
        document.getElementById('company-name').value = settings.companyName || '';
        document.getElementById('system-name').value = settings.systemName || '';
        document.getElementById('theme-select').value = settings.theme || 'dark';
        if (settings.logoDataUrl) {
          document.getElementById('logo-preview').src = settings.logoDataUrl;
          document.getElementById('logo-preview').style.display = 'inline-block';
          document.getElementById('logo-empty').style.display = 'none';
          pendingLogoDataUrl = settings.logoDataUrl;
        }
      })
      .catch(() => {
        document.getElementById('save-message').textContent = 'Could not load current settings.';
      });
  }

  document.getElementById('logo-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      document.getElementById('save-message').textContent = 'Logo file is too large — please use an image under 2MB.';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      pendingLogoDataUrl = reader.result;
      document.getElementById('logo-preview').src = pendingLogoDataUrl;
      document.getElementById('logo-preview').style.display = 'inline-block';
      document.getElementById('logo-empty').style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('save-branding-btn').addEventListener('click', () => {
    const companyName = document.getElementById('company-name').value.trim();
    const systemName = document.getElementById('system-name').value.trim();
    const theme = document.getElementById('theme-select').value;
    const msgEl = document.getElementById('save-message');

    if (!companyName || !systemName) {
      msgEl.textContent = 'Company name and system name are both required.';
      return;
    }

    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName,
        systemName,
        logoDataUrl: pendingLogoDataUrl,
        theme
      })
    })
      .then(r => r.json())
      .then(() => {
        msgEl.textContent = 'Saved. Reload any open page to see the update everywhere.';
        msgEl.style.color = 'var(--competent)';
      })
      .catch(() => {
        msgEl.textContent = 'Failed to save settings.';
        msgEl.style.color = 'var(--risk)';
      });
  });

  loadSettings();
`;

export const adminHtml = renderLayout({
  title: 'Admin',
  activePath: '/admin',
  eyebrowSuffix: 'Administration',
  heading: 'Admin',
  bodyHtml,
  scripts,
});
