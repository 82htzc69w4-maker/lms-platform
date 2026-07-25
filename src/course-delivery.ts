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
        <div class="panel-title">Pending Coaching Notifications</div>
        <div class="panel-sub">Learners who have failed a test the maximum allowed number of times</div>
      </div>
      <div id="coaching-notifications-wrap">
        <div class="empty-state">Loading&hellip;</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Learner Roster</div>
        <div class="panel-sub">All registered learners</div>
      </div>
      <div id="coaching-wrap">
        <div class="empty-state">Loading&hellip;</div>
      </div>
    </div>
  </div>
`;

const scripts = `
  // ---------- Role gate: Instructor and Administrator only ----------
  let currentSession = null;
  fetch('/api/auth/me')
    .then(r => {
      if (!r.ok) throw new Error('not logged in');
      return r.json();
    })
    .then(data => {
      const role = data.user.role;
      if (role !== 'instructor' && role !== 'administrator') {
        window.location.href = '/';
        return;
      }
      currentSession = data.user;
      loadCatalogue();
      loadDevelopment();
      loadCoaching();
      loadCoachingNotifications();
    })
    .catch(() => {
      window.location.href = '/login';
    });

  function canEditCourse(course) {
    if (!currentSession) return false;
    if (currentSession.role !== 'instructor') return true;
    return !course.instructorUsername || course.instructorUsername === currentSession.username;
  }

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

  // Allow deep-linking to a specific tab via URL hash, e.g. /course-delivery#development
  const hashTab = window.location.hash.replace('#', '');
  if (hashTab) {
    const targetBtn = document.querySelector('.tab-btn[data-tab="' + hashTab + '"]');
    if (targetBtn) targetBtn.click();
  }

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
              \${canEditCourse(course)
                ? \`<a class="btn" href="/course-development/\${course.id}" style="display:inline-block; text-decoration:none; text-align:center; margin-bottom:6px;">Edit</a>\`
                : '<div class="stat-label" style="text-transform:none; letter-spacing:0; margin-bottom:6px;">Owned by another instructor</div>'}
              <button class="btn enroll-btn" data-course-id="\${course.id}" style="width:100%;">Enroll</button>
            </div>
          </div>
        \`).join('');

        wrap.innerHTML = \`<div class="course-card-grid">\${cards}</div>\`;

        document.querySelectorAll('.enroll-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const courseId = btn.dataset.courseId;
            btn.textContent = 'Enrolling…';
            btn.disabled = true;
            fetch('/api/courses/' + courseId + '/enroll', { method: 'POST' })
              .then(r => r.json())
              .then(() => { btn.textContent = 'Enrolled'; })
              .catch(() => {
                btn.textContent = 'Enroll';
                btn.disabled = false;
              });
          });
        });
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
            <td>\${course.instructor || '—'}</td>
            <td>\${course.developmentStartDate ? new Date(course.developmentStartDate).toLocaleDateString() : '—'}</td>
            <td>\${course.description}</td>
            <td>
              \${canEditCourse(course)
                ? \`<a class="btn" href="/course-development/\${course.id}" style="display:inline-block; text-decoration:none; margin-right: 6px;">Edit</a>
                   <button class="btn publish-btn" data-course-id="\${course.id}">Publish</button>\`
                : '<span class="stat-label" style="text-transform:none; letter-spacing:0;">Owned by another instructor</span>'}
            </td>
          </tr>
        \`).join('');

        wrap.innerHTML = \`
          <table>
            <thead><tr><th>Course</th><th>Category</th><th>Instructor</th><th>Start Date</th><th>Description</th><th></th></tr></thead>
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

  // ---------- Pending Coaching Notifications ----------
  function loadCoachingNotifications() {
    fetch('/api/coaching/notifications')
      .then(r => r.json())
      .then(data => {
        const notifications = (data.notifications || []).filter(n => !n.resolved);
        const wrap = document.getElementById('coaching-notifications-wrap');

        if (notifications.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No learners currently need coaching.</div>';
          return;
        }

        wrap.innerHTML = notifications.map(n => {
          const attemptRows = n.attempts.map(a => \`
            <tr>
              <td>\${a.attemptNumber}</td>
              <td>\${a.score} / \${a.maxScore}\${a.percentage != null ? ' (' + a.percentage + '%)' : ''}</td>
              <td>\${a.failedQuestionTexts.length > 0 ? a.failedQuestionTexts.map(t => escapeHtml(t)).join('; ') : '—'}</td>
              <td>\${new Date(a.submittedAt).toLocaleString()}</td>
            </tr>
          \`).join('');

          return \`
            <div class="panel" style="border-color: var(--risk);">
              <div class="panel-header">
                <div class="panel-title">\${escapeHtml(n.learnerName)}</div>
                <div class="panel-sub">\${escapeHtml(n.courseTitle)} — failed \${n.attempts.length} time\${n.attempts.length === 1 ? '' : 's'} — flagged \${new Date(n.createdAt).toLocaleString()}</div>
              </div>
              <div class="panel-body">
                <table style="margin-bottom: 16px;">
                  <thead><tr><th>Attempt</th><th>Score</th><th>Sections Failed</th><th>Date</th></tr></thead>
                  <tbody>\${attemptRows}</tbody>
                </table>
                <div class="stat-label" style="margin-bottom: 6px;">Coaching Notes</div>
                <textarea id="coaching-notes-\${n.id}" rows="3" placeholder="What did you do to help this learner?" style="width:100%; background: var(--panel-alt); border: 1px solid var(--grid-line); color: var(--text-primary); font-family: 'Inter', sans-serif; font-size: 13px; padding: 10px 12px; border-radius: 2px; margin-bottom: 10px;"></textarea>
                <button class="btn resolve-coaching-btn" data-notification-id="\${n.id}">Complete Coaching &amp; Reset Course</button>
                <div class="coaching-resolve-message-\${n.id}" style="margin-top: 10px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>
              </div>
            </div>
          \`;
        }).join('');

        function escapeHtml(str) {
          const div = document.createElement('div');
          div.textContent = str || '';
          return div.innerHTML;
        }

        wrap.querySelectorAll('.resolve-coaching-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const notificationId = btn.dataset.notificationId;
            const notesEl = document.getElementById('coaching-notes-' + notificationId);
            const msgEl = document.querySelector('.coaching-resolve-message-' + notificationId);

            if (!notesEl.value.trim()) {
              msgEl.textContent = 'Please describe what coaching was provided.';
              msgEl.style.color = 'var(--risk)';
              return;
            }

            fetch('/api/coaching/notifications/' + notificationId + '/resolve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ notes: notesEl.value.trim() })
            })
              .then(async (r) => {
                const data = await r.json();
                if (!r.ok) throw new Error(data.error || 'Failed to resolve');
                return data;
              })
              .then(() => {
                loadCoachingNotifications();
              })
              .catch((err) => {
                msgEl.textContent = err.message;
                msgEl.style.color = 'var(--risk)';
              });
          });
        });
      })
      .catch(() => {
        document.getElementById('coaching-notifications-wrap').innerHTML = '<div class="empty-state">Could not reach /api/coaching/notifications.</div>';
      });
  }

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
`;

export const courseDeliveryHtml = renderLayout({
  title: 'Course Delivery',
  activePath: '/course-delivery',
  eyebrowSuffix: 'Course Delivery Section',
  heading: 'Course Delivery',
  bodyHtml,
  scripts,
});
