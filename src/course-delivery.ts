import { renderLayout } from './layout';

const bodyHtml = `
  <div class="tabbar">
    <button class="tab-btn active" data-tab="catalogue">Course Catalogue</button>
    <button class="tab-btn" data-tab="development">Courses in Development</button>
    <button class="tab-btn" data-tab="coaching">Learner Coaching</button>
  </div>

  <div class="tab-panel active" data-tab-panel="catalogue">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Course Catalogue</div>
        <div class="panel-sub">Published courses learners can see and enroll in</div>
      </div>
      <div id="catalogue-wrap">
        <div class="empty-state">Loading&hellip;</div>
      </div>
    </div>
  </div>

  <div class="tab-panel" data-tab-panel="development">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Add Course</div>
        <div class="panel-sub">New courses start as drafts — publish when ready for learners</div>
      </div>
      <div class="panel-body">
        <div class="form-row">
          <input type="text" id="new-course-id" placeholder="Course ID (e.g. course-002)" />
          <input type="text" id="new-course-title" placeholder="Title" />
          <select id="new-course-category"><option value="">Category</option></select>
        </div>
        <div class="form-row">
          <input type="text" id="new-course-description" placeholder="Description" />
        </div>
        <button class="btn" id="add-course-btn">Add as Draft</button>
        <div id="add-course-message" style="margin-top: 12px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Courses in Development</div>
        <div class="panel-sub">Draft courses not yet visible to learners</div>
      </div>
      <div id="development-wrap">
        <div class="empty-state">Loading&hellip;</div>
      </div>
    </div>
  </div>

  <div class="tab-panel" data-tab-panel="coaching">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Learner Coaching</div>
        <div class="panel-sub">Registered learners — coaching notes and interactions coming soon</div>
      </div>
      <div id="coaching-wrap">
        <div class="empty-state">Loading&hellip;</div>
      </div>
    </div>
  </div>
`;

const scripts = `
  // ---------- Role gate: Instructor and Administrator only ----------
  fetch('/api/auth/me')
    .then(r => {
      if (!r.ok) throw new Error('not logged in');
      return r.json();
    })
    .then(data => {
      const role = data.user.role;
      if (role !== 'instructor' && role !== 'administrator') {
        window.location.href = '/';
      }
    })
    .catch(() => {
      window.location.href = '/login';
    });

  // ---------- Populate Category dropdown from lookup list ----------
  function loadCategoryOptions() {
    fetch('/api/lookups/courseCategories')
      .then(r => r.json())
      .then(data => {
        const select = document.getElementById('new-course-category');
        const placeholder = select.options[0];
        select.innerHTML = '';
        select.appendChild(placeholder);
        (data.values || []).forEach(v => {
          const opt = document.createElement('option');
          opt.value = v;
          opt.textContent = v;
          select.appendChild(opt);
        });
      })
      .catch(() => { /* dropdown just stays empty if this fails */ });
  }
  loadCategoryOptions();

  // ---------- Tab switching ----------
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.tabPanel === tab));
    });
  });

  // ---------- Course Catalogue (published only) ----------
  function loadCatalogue() {
    fetch('/api/courses')
      .then(r => r.json())
      .then(data => {
        const list = (data.courses || []).filter(c => c.status === 'published');
        const wrap = document.getElementById('catalogue-wrap');

        if (list.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No published courses yet. Publish one from the Courses in Development tab.</div>';
          return;
        }

        const cards = list.map(course => \`
          <div class="course-card">
            \${course.imageDataUrl
              ? \`<img class="course-card-image" src="\${course.imageDataUrl}" alt="" />\`
              : '<div class="course-card-image-placeholder">No Image</div>'}
            <div class="course-card-body">
              <div class="course-card-title">\${course.title}</div>
              <div class="course-card-category">\${course.category || 'Uncategorized'}</div>
              <div class="course-card-description">\${course.description}</div>
              <a class="btn" href="/course-development/\${course.id}" style="display:inline-block; text-decoration:none; text-align:center;">Edit</a>
            </div>
          </div>
        \`).join('');

        wrap.innerHTML = \`<div class="course-card-grid">\${cards}</div>\`;
      })
      .catch(() => {
        document.getElementById('catalogue-wrap').innerHTML = '<div class="empty-state">Could not reach /api/courses.</div>';
      });
  }

  // ---------- Courses in Development (drafts) ----------
  function loadDevelopment() {
    fetch('/api/courses')
      .then(r => r.json())
      .then(data => {
        const list = (data.courses || []).filter(c => c.status !== 'published');
        const wrap = document.getElementById('development-wrap');

        if (list.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No draft courses right now. Add one above.</div>';
          return;
        }

        const rows = list.map(course => \`
          <tr>
            <td>\${course.title}</td>
            <td>\${course.category || '—'}</td>
            <td>\${course.description}</td>
            <td>
              <a class="btn" href="/course-development/\${course.id}" style="display:inline-block; text-decoration:none; margin-right: 6px;">Edit</a>
              <button class="btn publish-btn" data-course-id="\${course.id}">Publish</button>
            </td>
          </tr>
        \`).join('');

        wrap.innerHTML = \`
          <table>
            <thead><tr><th>Course</th><th>Category</th><th>Description</th><th></th></tr></thead>
            <tbody>\${rows}</tbody>
          </table>
        \`;

        document.querySelectorAll('.publish-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const courseId = btn.dataset.courseId;
            btn.textContent = 'Publishing…';
            btn.disabled = true;
            fetch('/api/courses/' + courseId + '/publish', { method: 'POST' })
              .then(r => r.json())
              .then(() => {
                loadDevelopment();
                loadCatalogue();
              })
              .catch(() => {
                btn.textContent = 'Publish';
                btn.disabled = false;
              });
          });
        });
      })
      .catch(() => {
        document.getElementById('development-wrap').innerHTML = '<div class="empty-state">Could not reach /api/courses.</div>';
      });
  }

  document.getElementById('add-course-btn').addEventListener('click', () => {
    const id = document.getElementById('new-course-id').value.trim();
    const title = document.getElementById('new-course-title').value.trim();
    const category = document.getElementById('new-course-category').value.trim();
    const description = document.getElementById('new-course-description').value.trim();
    const msgEl = document.getElementById('add-course-message');

    if (!id || !title || !description) {
      msgEl.textContent = 'Course ID, title, and description are required.';
      msgEl.style.color = 'var(--risk)';
      return;
    }

    fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title, category, description, status: 'draft' })
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Failed to add course');
        return data;
      })
      .then(() => {
        msgEl.textContent = 'Course added as draft.';
        msgEl.style.color = 'var(--competent)';
        document.getElementById('new-course-id').value = '';
        document.getElementById('new-course-title').value = '';
        document.getElementById('new-course-category').value = '';
        document.getElementById('new-course-description').value = '';
        loadDevelopment();
      })
      .catch((err) => {
        msgEl.textContent = err.message;
        msgEl.style.color = 'var(--risk)';
      });
  });

  // ---------- Learner Coaching (roster) ----------
  function loadCoaching() {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => {
        const learners = (data.users || []).filter(u => u.role === 'learner');
        const wrap = document.getElementById('coaching-wrap');

        if (learners.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No learners registered yet.</div>';
          return;
        }

        const rows = learners.map(l => \`
          <tr>
            <td>\${l.name}</td>
            <td>\${l.username}</td>
            <td>\${l.department || '—'}</td>
          </tr>
        \`).join('');

        wrap.innerHTML = \`
          <table>
            <thead><tr><th>Name</th><th>Username</th><th>Department</th></tr></thead>
            <tbody>\${rows}</tbody>
          </table>
        \`;
      })
      .catch(() => {
        document.getElementById('coaching-wrap').innerHTML = '<div class="empty-state">Could not reach /api/users.</div>';
      });
  }

  loadCatalogue();
  loadDevelopment();
  loadCoaching();
`;

export const courseDeliveryHtml = renderLayout({
  title: 'Course Delivery',
  activePath: '/course-delivery',
  eyebrowSuffix: 'Course Delivery Section',
  heading: 'Course Delivery',
  bodyHtml,
  scripts,
});
