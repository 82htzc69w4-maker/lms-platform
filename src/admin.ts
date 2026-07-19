import { renderLayout } from './layout';

const bodyHtml = `
  <div class="tabbar">
    <button class="tab-btn active" data-tab="branding">Branding</button>
    <button class="tab-btn" data-tab="register">Register User</button>
    <button class="tab-btn" data-tab="users">Registered Users</button>
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
            </select>
          </div>
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
          <input type="password" id="user-password" placeholder="Password" />
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
            <input type="text" id="learner-currentOccupation" placeholder="Current Occupation" />
            <input type="text" id="learner-futureOccupations" placeholder="Future Occupation(s)" />
          </div>

          <div class="stat-label" style="margin-bottom: 8px; margin-top: 16px;">Assignment</div>
          <div class="form-row">
            <input type="text" id="learner-languagePreference" placeholder="Language Preference" />
            <input type="text" id="learner-department" placeholder="Department" />
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
          <input type="password" id="edit-password" placeholder="New password (leave blank to keep current)" />
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
            <input type="text" id="edit-currentOccupation" placeholder="Current Occupation" />
            <input type="text" id="edit-futureOccupations" placeholder="Future Occupation(s)" />
          </div>

          <div class="stat-label" style="margin-bottom: 8px; margin-top: 16px;">Assignment</div>
          <div class="form-row">
            <input type="text" id="edit-languagePreference" placeholder="Language Preference" />
            <input type="text" id="edit-department" placeholder="Department" />
          </div>
        </div>

        <button class="btn" id="save-edit-btn" style="margin-top: 8px;">Save Changes</button>
        <button class="btn" id="cancel-edit-btn" style="margin-top: 8px; margin-left: 8px; background: var(--panel-alt); color: var(--text-primary);">Cancel</button>
        <div id="edit-message" style="margin-top: 12px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>

      </div>
    </div>
  </div>
`;

const scripts = `
  // ---------- Tab switching ----------
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.tabPanel === tab));
    });
  });

  // ---------- Branding ----------
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
          document.getElementById('edit-currentOccupation').value = profile.currentOccupation || '';
          document.getElementById('edit-futureOccupations').value = profile.futureOccupations || '';
          document.getElementById('edit-languagePreference').value = profile.languagePreference || '';
          document.getElementById('edit-department').value = profile.department || '';
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
