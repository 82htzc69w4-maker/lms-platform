import { renderLayout } from './layout';

const bodyHtml = `
  <div class="tabbar">
    <button class="tab-btn active" data-tab="branding">Branding</button>
    <button class="tab-btn" data-tab="register">Register User</button>
    <button class="tab-btn" data-tab="users">Registered Users</button>
    <button class="tab-btn" data-tab="administrative">Administrative</button>
  </div>

  <div class="tab-panel active" data-tab-panel="branding">
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
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div id="custom-colors-section" style="display: none; margin-bottom: 20px;">
          <div class="stat-label" style="margin-bottom: 8px;">Custom Colors</div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; padding: 16px; background: var(--panel-alt); border: 1px solid var(--grid-line); border-radius: 3px;">
            <label style="display:flex; flex-direction:column; gap:6px; font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); text-transform:uppercase;">Background
              <input type="color" id="color-bg" value="#14171A" style="width:100%; height:36px; border:1px solid var(--grid-line); border-radius:2px; cursor:pointer;" />
            </label>
            <label style="display:flex; flex-direction:column; gap:6px; font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); text-transform:uppercase;">Panel
              <input type="color" id="color-panel" value="#1B1F23" style="width:100%; height:36px; border:1px solid var(--grid-line); border-radius:2px; cursor:pointer;" />
            </label>
            <label style="display:flex; flex-direction:column; gap:6px; font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); text-transform:uppercase;">Panel Alt
              <input type="color" id="color-panelAlt" value="#21262B" style="width:100%; height:36px; border:1px solid var(--grid-line); border-radius:2px; cursor:pointer;" />
            </label>
            <label style="display:flex; flex-direction:column; gap:6px; font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); text-transform:uppercase;">Grid Line
              <input type="color" id="color-gridLine" value="#2E3438" style="width:100%; height:36px; border:1px solid var(--grid-line); border-radius:2px; cursor:pointer;" />
            </label>
            <label style="display:flex; flex-direction:column; gap:6px; font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); text-transform:uppercase;">Text Primary
              <input type="color" id="color-textPrimary" value="#ECE8DF" style="width:100%; height:36px; border:1px solid var(--grid-line); border-radius:2px; cursor:pointer;" />
            </label>
            <label style="display:flex; flex-direction:column; gap:6px; font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); text-transform:uppercase;">Text Muted
              <input type="color" id="color-textMuted" value="#8B9199" style="width:100%; height:36px; border:1px solid var(--grid-line); border-radius:2px; cursor:pointer;" />
            </label>
            <label style="display:flex; flex-direction:column; gap:6px; font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); text-transform:uppercase;">Accent
              <input type="color" id="color-hazard" value="#F2B705" style="width:100%; height:36px; border:1px solid var(--grid-line); border-radius:2px; cursor:pointer;" />
            </label>
            <label style="display:flex; flex-direction:column; gap:6px; font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); text-transform:uppercase;">Risk / Danger
              <input type="color" id="color-risk" value="#C1443A" style="width:100%; height:36px; border:1px solid var(--grid-line); border-radius:2px; cursor:pointer;" />
            </label>
            <label style="display:flex; flex-direction:column; gap:6px; font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); text-transform:uppercase;">Refresher / Warning
              <input type="color" id="color-refresher" value="#D98E2A" style="width:100%; height:36px; border:1px solid var(--grid-line); border-radius:2px; cursor:pointer;" />
            </label>
            <label style="display:flex; flex-direction:column; gap:6px; font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); text-transform:uppercase;">Competent / Success
              <input type="color" id="color-competent" value="#3E9B54" style="width:100%; height:36px; border:1px solid var(--grid-line); border-radius:2px; cursor:pointer;" />
            </label>
          </div>
          <div class="panel-sub" style="margin-top: 10px;">Changes apply live to this page as you pick colors, so you can preview before saving.</div>
        </div>

        <button class="btn" id="save-branding-btn">Save Changes</button>
        <div id="save-message" style="margin-top: 12px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>

      </div>
    </div>
  </div>

  <div class="tab-panel" data-tab-panel="register">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Register User</div>
        <div class="panel-sub">Learner registrations collect identity and assignment details; other roles just need name, surname, and login</div>
      </div>
      <div class="panel-body">

        <div class="form-row">
          <select id="user-role">
            <option value="learner">Learner</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
            <option value="administrator">Administrator</option>
          </select>
          <input type="text" id="user-username" placeholder="Username" />
          <div class="password-wrapper">
            <input type="password" id="user-password" placeholder="Password" />
            <button type="button" class="password-toggle" data-target="user-password" aria-label="Show password"></button>
          </div>
        </div>

        <div id="non-learner-fields" class="form-row">
          <input type="text" id="user-firstName" placeholder="Name" />
          <input type="text" id="user-surname" placeholder="Surname" />
        </div>

        <div id="learner-fields" style="display: none;">
          <div class="stat-label" style="margin-bottom: 8px; margin-top: 8px;">Identity</div>
          <div class="form-row">
            <input type="text" id="learner-firstName" placeholder="Name" />
            <input type="text" id="learner-surname" placeholder="Surname" />
          </div>
          <div class="form-row">
            <input type="email" id="learner-email" placeholder="Email" />
            <input type="text" id="learner-mobile" placeholder="Mobile" />
          </div>
          <div class="form-row">
            <input type="text" id="learner-idNumber" placeholder="ID Number" />
          </div>
          <div class="form-row">
            <select id="learner-currentOccupation"><option value="">Current Occupation</option></select>
            <select id="learner-futureOccupations"><option value="">Future Occupation</option></select>
          </div>

          <div class="stat-label" style="margin-bottom: 8px; margin-top: 16px;">Assignment</div>
          <div class="form-row">
            <select id="learner-languagePreference"><option value="">Language Preference</option></select>
            <select id="learner-department"><option value="">Department</option></select>
          </div>
        </div>

        <button class="btn" id="register-user-btn" style="margin-top: 8px;">Register User</button>
        <div id="register-message" style="margin-top: 12px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>

      </div>
    </div>
  </div>

  <div class="tab-panel" data-tab-panel="users">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Registered Users</div>
        <div class="panel-sub">Pulled from /api/users</div>
      </div>
      <div id="user-list-wrap">
        <div class="empty-state">Loading users&hellip;</div>
      </div>
    </div>

    <div class="panel" id="edit-user-panel" style="display: none;">
      <div class="panel-header">
        <div class="panel-title">Edit User</div>
        <div class="panel-sub" id="edit-user-subtitle"></div>
      </div>
      <div class="panel-body">

        <div class="form-row">
          <input type="text" id="edit-firstName" placeholder="Name" />
          <input type="text" id="edit-surname" placeholder="Surname" />
        </div>
        <div class="form-row">
          <div class="password-wrapper">
            <input type="password" id="edit-password" placeholder="New password (leave blank to keep current)" />
            <button type="button" class="password-toggle" data-target="edit-password" aria-label="Show password"></button>
          </div>
        </div>

        <div id="edit-learner-fields" style="display: none;">
          <div class="stat-label" style="margin-bottom: 8px; margin-top: 8px;">Identity</div>
          <div class="form-row">
            <input type="email" id="edit-email" placeholder="Email" />
            <input type="text" id="edit-mobile" placeholder="Mobile" />
          </div>
          <div class="form-row">
            <input type="text" id="edit-idNumber" placeholder="ID Number" />
          </div>
          <div class="form-row">
            <select id="edit-currentOccupation"><option value="">Current Occupation</option></select>
            <select id="edit-futureOccupations"><option value="">Future Occupation</option></select>
          </div>

          <div class="stat-label" style="margin-bottom: 8px; margin-top: 16px;">Assignment</div>
          <div class="form-row">
            <select id="edit-languagePreference"><option value="">Language Preference</option></select>
            <select id="edit-department"><option value="">Department</option></select>
          </div>
        </div>

        <button class="btn" id="save-edit-btn" style="margin-top: 8px;">Save Changes</button>
        <button class="btn" id="cancel-edit-btn" style="margin-top: 8px; margin-left: 8px; background: var(--panel-alt); color: #000;">Cancel</button>
        <div id="edit-message" style="margin-top: 12px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>

      </div>
    </div>
  </div>

  <div class="tab-panel" data-tab-panel="administrative">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Departments</div>
        <div class="panel-sub">Used in Register User (Learner Assignment) and the Workforce Readiness heat map</div>
      </div>
      <div class="panel-body">
        <div class="form-row">
          <input type="text" id="lookup-input-departments" placeholder="Add a department" />
          <button class="btn" data-lookup-add="departments">Add</button>
        </div>
        <div id="lookup-list-departments"></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Course Categories</div>
        <div class="panel-sub">Used in Add Course (Course Delivery Section)</div>
      </div>
      <div class="panel-body">
        <div class="form-row">
          <input type="text" id="lookup-input-courseCategories" placeholder="Add a course category" />
          <button class="btn" data-lookup-add="courseCategories">Add</button>
        </div>
        <div id="lookup-list-courseCategories"></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Job Titles</div>
        <div class="panel-sub">Reserved for career pathing and role requirements (not yet wired to a screen)</div>
      </div>
      <div class="panel-body">
        <div class="form-row">
          <input type="text" id="lookup-input-jobTitles" placeholder="Add a job title" />
          <button class="btn" data-lookup-add="jobTitles">Add</button>
        </div>
        <div id="lookup-list-jobTitles"></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Languages</div>
        <div class="panel-sub">Used in Register User (Learner Assignment — Language Preference)</div>
      </div>
      <div class="panel-body">
        <div class="form-row">
          <input type="text" id="lookup-input-languages" placeholder="Add a language" />
          <button class="btn" data-lookup-add="languages">Add</button>
        </div>
        <div id="lookup-list-languages"></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Occupations</div>
        <div class="panel-sub">Used in Register User (Learner Identity — Current and Future Occupation)</div>
      </div>
      <div class="panel-body">
        <div class="form-row">
          <input type="text" id="lookup-input-occupations" placeholder="Add an occupation" />
          <button class="btn" data-lookup-add="occupations">Add</button>
        </div>
        <div id="lookup-list-occupations"></div>
      </div>
    </div>
  </div>
`;

const scripts = `
  // ---------- Role gate: Admin and Administrator only ----------
  fetch('/api/auth/me')
    .then(r => {
      if (!r.ok) throw new Error('not logged in');
      return r.json();
    })
    .then(data => {
      const role = data.user.role;
      if (role !== 'admin' && role !== 'administrator') {
        window.location.href = '/';
      }
    })
    .catch(() => {
      window.location.href = '/login';
    });

  // ---------- Tab switching ----------
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.tabPanel === tab));
    });
  });

  // ---------- Lookup lists (Administrative tab) ----------
  const LOOKUP_NAMES = ['departments', 'courseCategories', 'jobTitles', 'languages', 'occupations'];
  let cachedLookupOptions = { departments: [], languages: [], occupations: [] };

  function loadLookupList(listName) {
    fetch('/api/lookups/' + listName)
      .then(r => r.json())
      .then(data => {
        const values = data.values || [];
        const wrap = document.getElementById('lookup-list-' + listName);

        if (values.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No entries yet.</div>';
          return;
        }

        wrap.innerHTML = '<div class="lookup-items">' + values.map(v => \`
          <div class="lookup-item">
            <span>\${v}</span>
            <button data-lookup-delete="\${listName}" data-lookup-value="\${v}">&times;</button>
          </div>
        \`).join('') + '</div>';

        wrap.querySelectorAll('[data-lookup-delete]').forEach(btn => {
          btn.addEventListener('click', () => {
            fetch('/api/lookups/' + listName + '/' + encodeURIComponent(btn.dataset.lookupValue), { method: 'DELETE' })
              .then(() => {
                loadLookupList(listName);
                loadLookupOptionsForSelects();
              });
          });
        });
      })
      .catch(() => {
        document.getElementById('lookup-list-' + listName).innerHTML = '<div class="empty-state">Could not load list.</div>';
      });
  }

  document.querySelectorAll('[data-lookup-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const listName = btn.dataset.lookupAdd;
      const input = document.getElementById('lookup-input-' + listName);
      const value = input.value.trim();
      if (!value) return;

      fetch('/api/lookups/' + listName, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      })
        .then(() => {
          input.value = '';
          loadLookupList(listName);
          loadLookupOptionsForSelects();
        });
    });
  });

  LOOKUP_NAMES.forEach(loadLookupList);

  // ---------- Populate dropdowns fed by lookup lists ----------
  function fillSelect(select, values, forceValue) {
    const placeholder = select.options[0];
    select.innerHTML = '';
    select.appendChild(placeholder);

    const allValues = values.slice();
    if (forceValue && !allValues.includes(forceValue)) allValues.unshift(forceValue);

    allValues.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });

    if (forceValue) select.value = forceValue;
  }

  function populateLearnerSelects(opts, forced) {
    forced = forced || {};
    fillSelect(document.getElementById('learner-department'), opts.departments, forced.department);
    fillSelect(document.getElementById('learner-languagePreference'), opts.languages, forced.languagePreference);
    fillSelect(document.getElementById('learner-currentOccupation'), opts.occupations, forced.currentOccupation);
    fillSelect(document.getElementById('learner-futureOccupations'), opts.occupations, forced.futureOccupations);
  }

  function populateEditSelects(opts, forced) {
    forced = forced || {};
    fillSelect(document.getElementById('edit-department'), opts.departments, forced.department);
    fillSelect(document.getElementById('edit-languagePreference'), opts.languages, forced.languagePreference);
    fillSelect(document.getElementById('edit-currentOccupation'), opts.occupations, forced.currentOccupation);
    fillSelect(document.getElementById('edit-futureOccupations'), opts.occupations, forced.futureOccupations);
  }

  function loadLookupOptionsForSelects() {
    return Promise.all([
      fetch('/api/lookups/departments').then(r => r.json()),
      fetch('/api/lookups/languages').then(r => r.json()),
      fetch('/api/lookups/occupations').then(r => r.json()),
    ]).then(([d, l, o]) => {
      cachedLookupOptions = { departments: d.values || [], languages: l.values || [], occupations: o.values || [] };
      populateLearnerSelects(cachedLookupOptions);
      return cachedLookupOptions;
    });
  }

  loadLookupOptionsForSelects();

  // ---------- Branding ----------
  let pendingLogoDataUrl = null;

  const COLOR_INPUT_IDS = {
    bg: 'color-bg',
    panel: 'color-panel',
    panelAlt: 'color-panelAlt',
    gridLine: 'color-gridLine',
    textPrimary: 'color-textPrimary',
    textMuted: 'color-textMuted',
    hazard: 'color-hazard',
    risk: 'color-risk',
    refresher: 'color-refresher',
    competent: 'color-competent',
  };

  function toggleCustomColorsSection() {
    const isCustom = document.getElementById('theme-select').value === 'custom';
    document.getElementById('custom-colors-section').style.display = isCustom ? 'block' : 'none';
  }

  function applyLiveColorPreview() {
    if (document.getElementById('theme-select').value !== 'custom') return;
    const root = document.documentElement;
    root.style.setProperty('--bg', document.getElementById('color-bg').value);
    root.style.setProperty('--panel', document.getElementById('color-panel').value);
    root.style.setProperty('--panel-alt', document.getElementById('color-panelAlt').value);
    root.style.setProperty('--grid-line', document.getElementById('color-gridLine').value);
    root.style.setProperty('--text-primary', document.getElementById('color-textPrimary').value);
    root.style.setProperty('--text-muted', document.getElementById('color-textMuted').value);
    root.style.setProperty('--hazard', document.getElementById('color-hazard').value);
    root.style.setProperty('--hazard-badge-text', document.getElementById('color-hazard').value);
    root.style.setProperty('--risk', document.getElementById('color-risk').value);
    root.style.setProperty('--refresher', document.getElementById('color-refresher').value);
    root.style.setProperty('--competent', document.getElementById('color-competent').value);
  }

  document.getElementById('theme-select').addEventListener('change', () => {
    toggleCustomColorsSection();
    applyLiveColorPreview();
  });

  Object.values(COLOR_INPUT_IDS).forEach(id => {
    document.getElementById(id).addEventListener('input', applyLiveColorPreview);
  });

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
        if (settings.customColors) {
          Object.keys(COLOR_INPUT_IDS).forEach(key => {
            if (settings.customColors[key]) {
              document.getElementById(COLOR_INPUT_IDS[key]).value = settings.customColors[key];
            }
          });
        }
        toggleCustomColorsSection();
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

    const customColors = {};
    Object.keys(COLOR_INPUT_IDS).forEach(key => {
      customColors[key] = document.getElementById(COLOR_INPUT_IDS[key]).value;
    });

    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName,
        systemName,
        logoDataUrl: pendingLogoDataUrl,
        theme,
        customColors
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

  // ---------- Register User ----------
  const ROLE_LABELS = { learner: 'Learner', instructor: 'Instructor', admin: 'Admin', administrator: 'Administrator' };

  function toggleRoleFields() {
    const role = document.getElementById('user-role').value;
    const isLearner = role === 'learner';
    document.getElementById('learner-fields').style.display = isLearner ? 'block' : 'none';
    document.getElementById('non-learner-fields').style.display = isLearner ? 'none' : 'flex';
  }
  document.getElementById('user-role').addEventListener('change', toggleRoleFields);
  toggleRoleFields();

  function loadUsers() {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => {
        const list = data.users || [];
        const wrap = document.getElementById('user-list-wrap');

        if (list.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No users registered yet.</div>';
          return;
        }

        const rows = list.map(u => \`
          <tr>
            <td>\${u.username}</td>
            <td>\${u.name}</td>
            <td>\${ROLE_LABELS[u.role] || u.role}</td>
            <td>\${u.department || '—'}</td>
            <td><button class="btn edit-user-btn" data-username="\${u.username}">Edit</button></td>
          </tr>
        \`).join('');

        wrap.innerHTML = \`
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th></th>
              </tr>
            </thead>
            <tbody>\${rows}</tbody>
          </table>
        \`;

        document.querySelectorAll('.edit-user-btn').forEach(btn => {
          btn.addEventListener('click', () => openEditPanel(btn.dataset.username));
        });
      })
      .catch(() => {
        document.getElementById('user-list-wrap').innerHTML =
          '<div class="empty-state">Could not reach /api/users.</div>';
      });
  }

  document.getElementById('register-user-btn').addEventListener('click', () => {
    const role = document.getElementById('user-role').value;
    const username = document.getElementById('user-username').value.trim();
    const password = document.getElementById('user-password').value;
    const msgEl = document.getElementById('register-message');

    if (!username || !password) {
      msgEl.textContent = 'Username and password are required.';
      msgEl.style.color = 'var(--risk)';
      return;
    }

    const payload = { username, password, role };

    if (role === 'learner') {
      payload.firstName = document.getElementById('learner-firstName').value.trim();
      payload.surname = document.getElementById('learner-surname').value.trim();
      payload.email = document.getElementById('learner-email').value.trim();
      payload.mobile = document.getElementById('learner-mobile').value.trim();
      payload.idNumber = document.getElementById('learner-idNumber').value.trim();
      payload.currentOccupation = document.getElementById('learner-currentOccupation').value.trim();
      payload.futureOccupations = document.getElementById('learner-futureOccupations').value.trim();
      payload.languagePreference = document.getElementById('learner-languagePreference').value.trim();
      payload.department = document.getElementById('learner-department').value.trim();
    } else {
      payload.firstName = document.getElementById('user-firstName').value.trim();
      payload.surname = document.getElementById('user-surname').value.trim();
    }

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Failed to register user');
        return data;
      })
      .then(() => {
        msgEl.textContent = 'User registered successfully.';
        msgEl.style.color = 'var(--competent)';
        document.getElementById('user-username').value = '';
        document.getElementById('user-password').value = '';
        document.getElementById('user-firstName').value = '';
        document.getElementById('user-surname').value = '';
        ['firstName','surname','email','mobile','idNumber','currentOccupation','futureOccupations','languagePreference','department']
          .forEach(f => { document.getElementById('learner-' + f).value = ''; });
        loadUsers();
      })
      .catch((err) => {
        msgEl.textContent = err.message;
        msgEl.style.color = 'var(--risk)';
      });
  });

  loadUsers();

  // ---------- Edit User ----------
  let editingUsername = null;

  function openEditPanel(username) {
    fetch('/api/users/' + username)
      .then(r => r.json())
      .then(data => {
        editingUsername = username;
        const user = data.user;
        const profile = data.learnerProfile;

        document.getElementById('edit-user-subtitle').textContent = 'Editing ' + username + ' (' + (ROLE_LABELS[user.role] || user.role) + ')';
        document.getElementById('edit-firstName').value = user.firstName || '';
        document.getElementById('edit-surname').value = user.surname || '';
        document.getElementById('edit-password').value = '';

        const isLearner = user.role === 'learner';
        document.getElementById('edit-learner-fields').style.display = isLearner ? 'block' : 'none';

        if (isLearner && profile) {
          document.getElementById('edit-email').value = profile.email || '';
          document.getElementById('edit-mobile').value = profile.mobile || '';
          document.getElementById('edit-idNumber').value = profile.idNumber || '';
          populateEditSelects(cachedLookupOptions, {
            department: profile.department,
            languagePreference: profile.languagePreference,
            currentOccupation: profile.currentOccupation,
            futureOccupations: profile.futureOccupations,
          });
        }

        document.getElementById('edit-message').textContent = '';
        document.getElementById('edit-user-panel').style.display = 'block';
        document.getElementById('edit-user-panel').scrollIntoView({ behavior: 'smooth' });
      })
      .catch(() => {
        alert('Could not load user details.');
      });
  }

  document.getElementById('cancel-edit-btn').addEventListener('click', () => {
    document.getElementById('edit-user-panel').style.display = 'none';
    editingUsername = null;
  });

  document.getElementById('save-edit-btn').addEventListener('click', () => {
    if (!editingUsername) return;
    const msgEl = document.getElementById('edit-message');

    const payload = {
      firstName: document.getElementById('edit-firstName').value.trim(),
      surname: document.getElementById('edit-surname').value.trim(),
    };

    const password = document.getElementById('edit-password').value;
    if (password) payload.password = password;

    if (document.getElementById('edit-learner-fields').style.display !== 'none') {
      payload.email = document.getElementById('edit-email').value.trim();
      payload.mobile = document.getElementById('edit-mobile').value.trim();
      payload.idNumber = document.getElementById('edit-idNumber').value.trim();
      payload.currentOccupation = document.getElementById('edit-currentOccupation').value.trim();
      payload.futureOccupations = document.getElementById('edit-futureOccupations').value.trim();
      payload.languagePreference = document.getElementById('edit-languagePreference').value.trim();
      payload.department = document.getElementById('edit-department').value.trim();
    }

    fetch('/api/users/' + editingUsername, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Failed to save changes');
        return data;
      })
      .then(() => {
        msgEl.textContent = 'Saved.';
        msgEl.style.color = 'var(--competent)';
        loadUsers();
        setTimeout(() => {
          document.getElementById('edit-user-panel').style.display = 'none';
          editingUsername = null;
        }, 800);
      })
      .catch((err) => {
        msgEl.textContent = err.message;
        msgEl.style.color = 'var(--risk)';
      });
  });
`;

export const adminHtml = renderLayout({
  title: 'Admin',
  activePath: '/admin',
  eyebrowSuffix: 'Administration',
  heading: 'Admin',
  bodyHtml,
  scripts,
});
