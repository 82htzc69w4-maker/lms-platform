import { renderLayout } from './layout';

const bodyHtml = `
  <div class="tabbar">
    <button class="tab-btn active" data-tab="catalogue">Course Catalogue</button>
    <button class="tab-btn" data-tab="development">Courses in Development</button>
    <button class="tab-btn" data-tab="applications">Applications for Enrollment</button>
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

  <div class="tab-panel" data-tab-panel="applications">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Applications for Enrollment</div>
        <div class="panel-sub">Learners who have applied to enroll — review their motivation and approve or reject</div>
      </div>
      <div id="applications-wrap">
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
  // ---------- Role gate: Instructor, Admin, and Administrator only ----------
  let currentSession = null;
  fetch('/api/auth/me')
    .then(r => {
      if (!r.ok) throw new Error('not logged in');
      return r.json();
    })
    .then(data => {
      const role = data.user.role;
      if (role !== 'instructor' && role !== 'admin' && role !== 'administrator') {
        window.location.href = '/';
        return;
      }
      currentSession = data.user;
      loadLearnerList().then(() => loadCatalogue());
      loadDevelopment();
      loadCoaching();
      loadCoachingNotifications();
      loadCourseApplications();
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
  let learnerList = [];

  function loadLearnerList() {
    return fetch('/api/users')
      .then(r => r.json())
      .then(data => {
        learnerList = (data.users || []).filter(u => u.role === 'learner');
      })
      .catch(() => { learnerList = []; });
  }

  let catalogueCourseList = [];

  function renderCatalogueCards() {
    const wrap = document.getElementById('catalogue-wrap');

    if (catalogueCourseList.length === 0) {
      wrap.innerHTML = '<div class="empty-state">No published courses yet. Publish one from the Courses in Development tab.</div>';
      return;
    }

    const canEnrollStudents = currentSession &&
      (currentSession.role === 'instructor' || currentSession.role === 'admin' || currentSession.role === 'administrator');

    const cards = catalogueCourseList.map(course => {
      const enrolledUsernames = new Set(course.enrolledUsernames || []);
      const availableLearners = learnerList.filter(u => !enrolledUsernames.has(u.username));
      const learnerOptionsHtml = availableLearners.map(u =>
        '<option value="' + u.username + '">' + (u.name || u.username) + '</option>'
      ).join('');

      return \`
      <div class="course-card">
        \${course.imageDataUrl
          ? \`<img class="course-card-image" src="\${course.imageDataUrl}" alt="" />\`
          : course.bannerDataUrl
          ? \`<img class="course-card-image" src="\${course.bannerDataUrl}" style="object-fit: contain; background: var(--panel-alt);" alt="" />\`
          : '<div class="course-card-image-placeholder">No Image</div>'}
        <div class="course-card-body">
          <div class="course-card-title">\${course.title}</div>
          <div class="course-card-category">\${course.category || 'Uncategorized'}</div>
          <div class="course-card-description">\${course.description}</div>
          <div class="stat-label" style="text-transform:none; letter-spacing:0; margin-bottom:8px;">\${course.enrolledCount || 0} learner\${course.enrolledCount === 1 ? '' : 's'} enrolled</div>
          \${canEditCourse(course)
            ? \`<a class="btn" href="/course-development/\${course.id}" style="display:inline-block; text-decoration:none; text-align:center; margin-bottom:6px;">Edit</a>\`
            : '<div class="stat-label" style="text-transform:none; letter-spacing:0; margin-bottom:6px;">Owned by another instructor</div>'}
          <a class="btn" href="/enrolled-learners/\${course.id}" style="display:inline-block; text-decoration:none; text-align:center; margin-bottom:6px; background:var(--panel-alt); color:var(--text-primary); border:1px solid var(--grid-line);">Enrolled Learners</a>
          <button class="btn enroll-btn" data-course-id="\${course.id}" style="width:100%;">Enroll Myself</button>
          \${canEnrollStudents ? \`
            <div style="margin-top:8px; padding-top:8px; border-top:1px solid var(--grid-line);">
              <div class="stat-label" style="margin-bottom:6px;">Enroll a Student</div>
              <select class="enroll-student-select" data-course-id="\${course.id}" style="width:100%; margin-bottom:6px;">
                <option value="">Select a learner&hellip;</option>
                \${learnerOptionsHtml}
              </select>
              <button class="btn enroll-student-btn" data-course-id="\${course.id}" style="width:100%; background:var(--panel-alt); color:var(--text-primary); border:1px solid var(--grid-line);">Enroll Student</button>
              <div class="enroll-student-message-\${course.id}" style="margin-top:6px; font-family:'IBM Plex Mono',monospace; font-size:12px;"></div>
            </div>
          \` : ''}
        </div>
      </div>
    \`;
    }).join('');

    wrap.innerHTML = \`<div class="course-card-grid">\${cards}</div>\`;

    document.querySelectorAll('.enroll-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const courseId = btn.dataset.courseId;
        btn.textContent = 'Enrolling…';
        btn.disabled = true;
        fetch('/api/courses/' + courseId + '/enroll', { method: 'POST' })
          .then(async (r) => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Failed to enroll');
            return data;
          })
          .then(() => { btn.textContent = 'Enrolled'; })
          .catch((err) => {
            btn.textContent = 'Enroll Myself';
            btn.disabled = false;
            btn.title = err.message;
            alert(err.message);
          });
      });
    });

    document.querySelectorAll('.enroll-student-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const courseId = btn.dataset.courseId;
        const select = document.querySelector('.enroll-student-select[data-course-id="' + courseId + '"]');
        const msgEl = document.querySelector('.enroll-student-message-' + courseId);
        const username = select.value;

        if (!username) {
          msgEl.textContent = 'Please select a learner first.';
          msgEl.style.color = 'var(--risk)';
          return;
        }

        btn.textContent = 'Enrolling…';
        btn.disabled = true;

        fetch('/api/courses/' + courseId + '/enroll-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        })
          .then(async (r) => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Failed to enroll student');
            return data;
          })
          .then(() => {
            // Update the in-memory course data immediately rather than
            // re-fetching from the server — KV writes can take a moment to
            // propagate, so an immediate re-fetch can briefly show stale
            // data even though the enrollment genuinely succeeded.
            const course = catalogueCourseList.find(c => c.id === courseId);
            if (course) {
              course.enrolledCount = (course.enrolledCount || 0) + 1;
              course.enrolledUsernames = [...(course.enrolledUsernames || []), username];
            }
            renderCatalogueCards();
          })
          .catch((err) => {
            msgEl.textContent = err.message;
            msgEl.style.color = 'var(--risk)';
            btn.textContent = 'Enroll Student';
            btn.disabled = false;
          });
      });
    });
  }

  function loadCatalogue() {
    fetch('/api/courses')
      .then(r => r.json())
      .then(data => {
        catalogueCourseList = (data.courses || []).filter(c => c.status === 'published');
        renderCatalogueCards();
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
  // ---------- Applications for Enrollment ----------
  function loadCourseApplications() {
    fetch('/api/course-applications')
      .then(r => r.json())
      .then(data => {
        const applications = (data.applications || []).filter(a => a.status === 'pending');
        const wrap = document.getElementById('applications-wrap');

        if (applications.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No pending applications.</div>';
          return;
        }

        function escapeHtmlApp(str) {
          const div = document.createElement('div');
          div.textContent = str || '';
          return div.innerHTML;
        }

        wrap.innerHTML = applications.map(a => \`
          <div class="content-block-row" style="align-items:flex-start; cursor:default; margin-bottom:10px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:4px;">\${escapeHtmlApp(a.learnerName)} — \${escapeHtmlApp(a.courseTitle)}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); margin-bottom:8px;">Applied: \${new Date(a.submittedAt).toLocaleDateString()} at \${new Date(a.submittedAt).toLocaleTimeString()}</div>
              <div style="font-family:'Inter',sans-serif; font-size:13px; color:var(--text-primary);">\${escapeHtmlApp(a.motivation)}</div>
            </div>
            <div class="content-block-actions">
              <button data-action="approve-application" data-application-id="\${a.id}">Approve</button>
              <button data-action="reject-application" data-application-id="\${a.id}" class="delete">Reject</button>
            </div>
          </div>
        \`).join('');

        wrap.querySelectorAll('[data-action="approve-application"]').forEach(btn => {
          btn.addEventListener('click', () => {
            fetch('/api/course-applications/' + btn.dataset.applicationId + '/approve', { method: 'POST' })
              .then(r => r.json())
              .then(() => loadCourseApplications());
          });
        });

        wrap.querySelectorAll('[data-action="reject-application"]').forEach(btn => {
          btn.addEventListener('click', () => {
            fetch('/api/course-applications/' + btn.dataset.applicationId + '/reject', { method: 'POST' })
              .then(r => r.json())
              .then(() => loadCourseApplications());
          });
        });
      })
      .catch(() => {
        document.getElementById('applications-wrap').innerHTML = '<div class="empty-state">Could not reach /api/course-applications.</div>';
      });
  }

  function loadCoachingNotifications() {
    fetch('/api/coaching/notifications')
      .then(r => r.json())
      .then(data => {
        const notifications = (data.notifications || []).filter(n => !n.resolved && n.escalationTier !== 'hr');
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

                <div style="padding: 12px; background: var(--panel-alt); border-radius: 2px; margin-bottom: 16px;">
                  <div class="stat-label" style="margin-bottom: 6px;">Book a Coaching Session</div>
                  \${n.scheduledDate ? \`<div style="font-family:'Inter',sans-serif; font-size:13px; color:\${n.scheduleStatus === 'accepted' ? 'var(--competent)' : 'var(--refresher)'}; margin-bottom:8px;">
                    \${n.scheduleStatus === 'accepted' ? 'Confirmed' : (n.proposedBy === 'learner' ? 'Learner proposed' : 'Awaiting learner response')}: \${new Date(n.scheduledDate + 'T' + n.scheduledTime).toLocaleString()}
                    \${n.proposedBy === 'facilitator' && n.scheduledByName ? ' — booked by ' + escapeHtml(n.scheduledByName) : ''}
                  </div>\` : ''}
                  \${n.scheduledDate && n.proposedBy === 'learner' && n.scheduleStatus !== 'accepted' ? \`<button class="btn accept-learner-time-btn" data-notification-id="\${n.id}" style="margin-bottom:8px;">Accept Proposed Time</button>\` : ''}
                  <div class="form-row" style="margin-bottom: 8px;">
                    <input type="date" id="book-date-\${n.id}" style="flex:1;" />
                    <input type="time" id="book-time-\${n.id}" style="flex:1;" />
                  </div>
                  <button class="btn book-coaching-btn" data-notification-id="\${n.id}" style="background:var(--panel); color:var(--text-primary); border:1px solid var(--grid-line);">\${n.scheduledDate ? 'Propose Different Time' : 'Book Session'}</button>
                  <div class="book-coaching-message-\${n.id}" style="margin-top: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 12px;"></div>
                </div>

                <div class="stat-label" style="margin-bottom: 6px;">Scheduling History</div>
                <div class="schedule-history-\${n.id}" style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); margin-bottom: 16px;">Loading&hellip;</div>

                <div class="stat-label" style="margin-bottom: 6px;">Coaching Session Date &amp; Time</div>
                <div class="form-row" style="margin-bottom: 10px;">
                  <input type="date" id="coaching-date-\${n.id}" style="flex:1;" />
                  <input type="time" id="coaching-time-\${n.id}" style="flex:1;" />
                </div>
                <div class="stat-label" style="margin-bottom: 6px;">Coaching Notes</div>
                <textarea id="coaching-notes-\${n.id}" rows="3" placeholder="What did you do to help this learner?" style="width:100%; background: var(--panel-alt); border: 1px solid var(--grid-line); color: var(--text-primary); font-family: 'Inter', sans-serif; font-size: 13px; padding: 10px 12px; border-radius: 2px; margin-bottom: 10px;"></textarea>
                <button class="btn resolve-coaching-btn" data-notification-id="\${n.id}" disabled style="opacity:0.5; cursor:not-allowed;">Complete Coaching &amp; Reactivate Course</button>
                <div class="coaching-resolve-message-\${n.id}" style="margin-top: 10px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>
              </div>
            </div>
          \`;
        }).join('');

        notifications.forEach(n => {
          fetch('/api/coaching/notifications/' + n.id + '/schedule-history')
            .then(r => r.json())
            .then(data => {
              const events = data.events || [];
              const histEl = document.querySelector('.schedule-history-' + n.id);
              if (!histEl) return;
              if (events.length === 0) {
                histEl.textContent = 'No scheduling activity yet.';
                return;
              }
              histEl.innerHTML = events.map(e => {
                const who = e.actorRole === 'learner' ? escapeHtml(e.actorName) + ' (learner)' : escapeHtml(e.actorName) + ' (facilitator)';
                const verb = e.action === 'accepted' ? 'accepted' : 'proposed';
                return '<div style="margin-bottom:4px;">' + who + ' ' + verb + ' ' + new Date(e.scheduledDate + 'T' + e.scheduledTime).toLocaleString() + ' — <span style="opacity:0.7;">' + new Date(e.createdAt).toLocaleString() + '</span></div>';
              }).join('');
            })
            .catch(() => {
              const histEl = document.querySelector('.schedule-history-' + n.id);
              if (histEl) histEl.textContent = 'Could not load history.';
            });
        });

        function escapeHtml(str) {
          const div = document.createElement('div');
          div.textContent = str || '';
          return div.innerHTML;
        }

        function refreshResolveButtonState(notificationId) {
          const dateEl = document.getElementById('coaching-date-' + notificationId);
          const timeEl = document.getElementById('coaching-time-' + notificationId);
          const notesEl = document.getElementById('coaching-notes-' + notificationId);
          const btn = document.querySelector('.resolve-coaching-btn[data-notification-id="' + notificationId + '"]');
          const ready = dateEl.value && timeEl.value && notesEl.value.trim();
          btn.disabled = !ready;
          btn.style.opacity = ready ? '1' : '0.5';
          btn.style.cursor = ready ? 'pointer' : 'not-allowed';
        }

        notifications.forEach(n => {
          ['coaching-date-' + n.id, 'coaching-time-' + n.id, 'coaching-notes-' + n.id].forEach(id => {
            document.getElementById(id).addEventListener('input', () => refreshResolveButtonState(n.id));
          });
        });

        wrap.querySelectorAll('.accept-learner-time-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            btn.textContent = 'Accepting…';
            btn.disabled = true;
            fetch('/api/coaching/notifications/' + btn.dataset.notificationId + '/accept-schedule', { method: 'POST' })
              .then(async (r) => {
                const data = await r.json();
                if (!r.ok) throw new Error(data.error || 'Failed to accept');
                return data;
              })
              .then(() => loadCoachingNotifications())
              .catch((err) => {
                alert(err.message);
                btn.textContent = 'Accept Proposed Time';
                btn.disabled = false;
              });
          });
        });

        wrap.querySelectorAll('.book-coaching-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const notificationId = btn.dataset.notificationId;
            const dateEl = document.getElementById('book-date-' + notificationId);
            const timeEl = document.getElementById('book-time-' + notificationId);
            const msgEl = document.querySelector('.book-coaching-message-' + notificationId);

            if (!dateEl.value || !timeEl.value) {
              msgEl.textContent = 'Please choose a date and time.';
              msgEl.style.color = 'var(--risk)';
              return;
            }

            btn.textContent = 'Booking…';
            btn.disabled = true;

            fetch('/api/coaching/notifications/' + notificationId + '/schedule', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ scheduledDate: dateEl.value, scheduledTime: timeEl.value })
            })
              .then(async (r) => {
                const data = await r.json();
                if (!r.ok) throw new Error(data.error || 'Failed to book session');
                return data;
              })
              .then(() => loadCoachingNotifications())
              .catch((err) => {
                msgEl.textContent = err.message;
                msgEl.style.color = 'var(--risk)';
                btn.textContent = 'Book Session';
                btn.disabled = false;
              });
          });
        });

        wrap.querySelectorAll('.resolve-coaching-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const notificationId = btn.dataset.notificationId;
            const dateEl = document.getElementById('coaching-date-' + notificationId);
            const timeEl = document.getElementById('coaching-time-' + notificationId);
            const notesEl = document.getElementById('coaching-notes-' + notificationId);
            const msgEl = document.querySelector('.coaching-resolve-message-' + notificationId);

            fetch('/api/coaching/notifications/' + notificationId + '/resolve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                notes: notesEl.value.trim(),
                sessionDate: dateEl.value,
                sessionTime: timeEl.value
              })
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
