import { renderLayout } from './layout';

const bodyHtml = `
  <div class="panel" style="margin-bottom: 20px;">
    <div class="panel-header">
      <div class="panel-title">Learning and Development</div>
    </div>
    <div class="panel-body">
      <div class="stats">
        <a href="/expired-certifications" class="stat-tile stat-tile-clickable" id="stat-tile-expired-certifications" style="display: none;">
          <div class="stat-label">Expired Certifications</div>
          <div class="stat-value risk" id="stat-expired-certifications">0</div>
        </a>
        <div class="stat-tile">
          <div class="stat-label">Registered Learners</div>
          <div class="stat-value total" id="stat-learners">0</div>
        </div>
        <div class="stat-tile">
          <div class="stat-label">Registered Admins</div>
          <div class="stat-value total" id="stat-admins">0</div>
        </div>
        <a href="/learner#catalogue" class="stat-tile stat-tile-clickable">
          <div class="stat-label">Courses Available</div>
          <div class="stat-value total" id="stat-courses-available">0</div>
        </a>
        <a href="/course-delivery#development" class="stat-tile stat-tile-clickable" id="stat-tile-development" style="display: none;">
          <div class="stat-label">Courses in Development</div>
          <div class="stat-value total" id="stat-courses-development">0</div>
        </a>
        <a href="/course-delivery#coaching" class="stat-tile stat-tile-clickable" id="stat-tile-coaching" style="display: none;">
          <div class="stat-label">Users to be Coached</div>
          <div class="stat-value risk" id="stat-users-coached">0</div>
        </a>
      </div>
    </div>
  </div>

  <div class="panel" id="hr-panel" style="margin-bottom: 20px; display: none;">
    <div class="panel-header">
      <div class="panel-title">Human Resources</div>
      <div class="panel-sub">Escalated coaching, and courses that have missed their completion deadline</div>
    </div>
    <div class="panel-body">
      <a href="/employee-performance" class="btn" style="display:inline-block; text-decoration:none; margin-bottom: 20px;">Employee Performance Records</a>
      <div class="stat-label" style="margin-bottom: 12px; color: var(--risk);">Overdue Courses</div>
      <div id="overdue-courses-wrap" style="margin-bottom: 24px;">
        <div class="empty-state">Loading&hellip;</div>
      </div>
      <div class="stat-label" style="margin-bottom: 12px;">Escalated Coaching</div>
      <div id="hr-coaching-wrap">
        <div class="empty-state">Loading&hellip;</div>
      </div>
    </div>
  </div>

  <div class="panel" id="management-reporting-panel" style="display: none;">
    <div class="panel-header">
      <div class="panel-title">Management Reporting</div>
      <div class="panel-sub">Coaching sessions logged, by course and by department</div>
    </div>
    <div class="panel-body">
      <div class="stat-label" style="margin-bottom: 12px;">By Course</div>
      <div id="coaching-by-course-wrap" style="margin-bottom: 24px;">
        <div class="empty-state">Loading&hellip;</div>
      </div>
      <div class="stat-label" style="margin-bottom: 12px;">By Department</div>
      <div id="coaching-by-department-wrap">
        <div class="empty-state">Loading&hellip;</div>
      </div>
    </div>
  </div>
`;

const scripts = `
  function countUp(el, target, duration = 600) {
    const start = performance.now();
    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(progress * target);
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ---------- Registered user counts ----------
  fetch('/api/users')
    .then(r => r.json())
    .then(data => {
      const list = data.users || [];
      const learnerCount = list.filter(u => u.role === 'learner').length;
      const adminCount = list.filter(u => u.role === 'admin').length;
      countUp(document.getElementById('stat-learners'), learnerCount);
      countUp(document.getElementById('stat-admins'), adminCount);
    })
    .catch(() => {
      document.getElementById('stat-learners').textContent = '—';
      document.getElementById('stat-admins').textContent = '—';
    });

  // ---------- Course counts ----------
  fetch('/api/courses')
    .then(r => r.json())
    .then(data => {
      const list = data.courses || [];
      const availableCount = list.filter(c => c.status === 'published').length;
      const developmentCount = list.filter(c => c.status !== 'published').length;
      countUp(document.getElementById('stat-courses-available'), availableCount);
      countUp(document.getElementById('stat-courses-development'), developmentCount);
    })
    .catch(() => {
      document.getElementById('stat-courses-available').textContent = '—';
      document.getElementById('stat-courses-development').textContent = '—';
    });

  // "Courses in Development", "Users to be Coached", and Management Reporting
  // are only shown to Admin, Administrator, and Instructor
  fetch('/api/auth/me')
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      const role = data && data.user ? data.user.role : null;
      if (role === 'admin' || role === 'administrator' || role === 'instructor') {
        document.getElementById('stat-tile-development').style.display = 'block';
        document.getElementById('stat-tile-coaching').style.display = 'block';
        document.getElementById('management-reporting-panel').style.display = 'block';
        loadCoachingReport();
      }
      // HR escalations are visible to all coaching-capable staff roles.
      if (role === 'admin' || role === 'administrator' || role === 'instructor') {
        document.getElementById('hr-panel').style.display = 'block';
        loadHrCoaching();

        // There's no real background/cron job checking completion
        // deadlines — this opportunistically checks whenever a staff
        // member loads the Dashboard, then loads whatever's on record.
        fetch('/api/courses/check-overdue', { method: 'POST' })
          .catch(() => { /* best-effort; still load whatever's already flagged */ })
          .then(() => loadOverdueCourses());
      }
    })
    .catch(() => { /* leave hidden if we can't confirm role */ });

  function loadOverdueCourses() {
    fetch('/api/courses/overdue-alerts')
      .then(r => r.json())
      .then(data => {
        const alerts = data.alerts || [];
        const wrap = document.getElementById('overdue-courses-wrap');

        if (alerts.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No overdue courses.</div>';
          return;
        }

        wrap.innerHTML = alerts.map(a => \`
          <div class="content-block-row" style="align-items:center; cursor:default; margin-bottom:8px; border-color: var(--risk); background: rgba(193,68,58,0.08);">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:4px;">\${escapeHtmlDash(a.learnerName)} — \${escapeHtmlDash(a.courseTitle)}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--risk);">Due \${new Date(a.dueDate).toLocaleDateString()} — flagged \${new Date(a.flaggedAt).toLocaleDateString()}</div>
            </div>
          </div>
        \`).join('');
      })
      .catch(() => {
        document.getElementById('overdue-courses-wrap').innerHTML = '<div class="empty-state">Could not load overdue courses.</div>';
      });
  }

  function escapeHtmlDash(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function loadHrCoaching() {
    fetch('/api/coaching/notifications')
      .then(r => r.json())
      .then(data => {
        const notifications = (data.notifications || []).filter(n => !n.resolved && n.escalationTier === 'hr');
        const wrap = document.getElementById('hr-coaching-wrap');

        if (notifications.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No learners currently escalated to HR.</div>';
          return;
        }

        wrap.innerHTML = notifications.map(n => {
          const attemptRows = n.attempts.map(a => \`
            <tr>
              <td>\${a.attemptNumber}</td>
              <td>\${a.score} / \${a.maxScore}\${a.percentage != null ? ' (' + a.percentage + '%)' : ''}</td>
              <td>\${new Date(a.submittedAt).toLocaleString()}</td>
            </tr>
          \`).join('');

          return \`
            <div class="panel" style="border-color: #6B4FA0; margin-bottom: 16px;">
              <div class="panel-header">
                <div class="panel-title">\${escapeHtmlDash(n.learnerName)}</div>
                <div class="panel-sub">\${escapeHtmlDash(n.courseTitle)} — failed again after facilitator coaching, flagged \${new Date(n.createdAt).toLocaleString()}</div>
              </div>
              <div class="panel-body">
                <table style="margin-bottom: 16px;">
                  <thead><tr><th>Attempt</th><th>Score</th><th>Date</th></tr></thead>
                  <tbody>\${attemptRows}</tbody>
                </table>
                <div class="stat-label" style="margin-bottom: 6px;">HR Coaching Session Date &amp; Time</div>
                <div class="form-row" style="margin-bottom: 10px;">
                  <input type="date" id="hr-date-\${n.id}" style="flex:1;" />
                  <input type="time" id="hr-time-\${n.id}" style="flex:1;" />
                </div>
                <div class="stat-label" style="margin-bottom: 6px;">HR Coaching Notes</div>
                <textarea id="hr-notes-\${n.id}" rows="3" placeholder="What was covered in the HR coaching session?" style="width:100%; background: var(--panel-alt); border: 1px solid var(--grid-line); color: var(--text-primary); font-family: 'Inter', sans-serif; font-size: 13px; padding: 10px 12px; border-radius: 2px; margin-bottom: 10px;"></textarea>
                <button class="btn hr-resolve-btn" data-notification-id="\${n.id}" disabled style="opacity:0.5; cursor:not-allowed; background:#6B4FA0; color:#fff;">Complete HR Coaching &amp; Reactivate Course</button>
                <div class="hr-resolve-message-\${n.id}" style="margin-top: 10px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>
              </div>
            </div>
          \`;
        }).join('');

        function refreshHrButtonState(notificationId) {
          const dateEl = document.getElementById('hr-date-' + notificationId);
          const timeEl = document.getElementById('hr-time-' + notificationId);
          const notesEl = document.getElementById('hr-notes-' + notificationId);
          const btn = document.querySelector('.hr-resolve-btn[data-notification-id="' + notificationId + '"]');
          const ready = dateEl.value && timeEl.value && notesEl.value.trim();
          btn.disabled = !ready;
          btn.style.opacity = ready ? '1' : '0.5';
          btn.style.cursor = ready ? 'pointer' : 'not-allowed';
        }

        notifications.forEach(n => {
          ['hr-date-' + n.id, 'hr-time-' + n.id, 'hr-notes-' + n.id].forEach(id => {
            document.getElementById(id).addEventListener('input', () => refreshHrButtonState(n.id));
          });
        });

        document.querySelectorAll('.hr-resolve-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const notificationId = btn.dataset.notificationId;
            const dateEl = document.getElementById('hr-date-' + notificationId);
            const timeEl = document.getElementById('hr-time-' + notificationId);
            const notesEl = document.getElementById('hr-notes-' + notificationId);
            const msgEl = document.querySelector('.hr-resolve-message-' + notificationId);

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
              .then(() => loadHrCoaching())
              .catch((err) => {
                msgEl.textContent = err.message;
                msgEl.style.color = 'var(--risk)';
              });
          });
        });
      })
      .catch(() => {
        document.getElementById('hr-coaching-wrap').innerHTML = '<div class="empty-state">Could not load HR coaching escalations.</div>';
      });
  }

  function loadCoachingReport() {
    fetch('/api/coaching/sessions')
      .then(r => r.json())
      .then(data => {
        const sessions = data.sessions || [];
        const courseWrap = document.getElementById('coaching-by-course-wrap');
        const deptWrap = document.getElementById('coaching-by-department-wrap');

        if (sessions.length === 0) {
          courseWrap.innerHTML = '<div class="empty-state">No coaching sessions logged yet.</div>';
          deptWrap.innerHTML = '<div class="empty-state">No coaching sessions logged yet.</div>';
          return;
        }

        const byCourse = {};
        const byDept = {};
        sessions.forEach(s => {
          const tier = s.escalationTier === 'hr' ? 'hr' : 'facilitator';
          if (!byCourse[s.courseTitle]) byCourse[s.courseTitle] = { facilitator: 0, hr: 0 };
          byCourse[s.courseTitle][tier] += 1;

          const dept = s.department || 'Unassigned';
          if (!byDept[dept]) byDept[dept] = { facilitator: 0, hr: 0 };
          byDept[dept][tier] += 1;
        });

        function renderCounts(counts) {
          return Object.keys(counts)
            .sort((a, b) => (counts[b].facilitator + counts[b].hr) - (counts[a].facilitator + counts[a].hr))
            .map(key => {
              const c = counts[key];
              const facilitatorHtml = c.facilitator > 0
                ? '<span style="color:var(--hazard); font-weight:600;">' + c.facilitator + ' facilitator</span>'
                : '';
              const hrHtml = c.hr > 0
                ? '<span style="color:#6B4FA0; font-weight:600;">' + c.hr + ' HR</span>'
                : '';
              const separator = facilitatorHtml && hrHtml ? ' &nbsp;&middot;&nbsp; ' : '';
              return \`
                <div class="content-block-row" style="align-items:center; cursor:default; margin-bottom:6px;">
                  <div style="flex:1; font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary);">\${key}</div>
                  <div style="font-family:'IBM Plex Mono',monospace; font-size:13px;">\${facilitatorHtml}\${separator}\${hrHtml}</div>
                </div>
              \`;
            }).join('');
        }

        courseWrap.innerHTML = renderCounts(byCourse);
        deptWrap.innerHTML = renderCounts(byDept);
      })
      .catch(() => {
        document.getElementById('coaching-by-course-wrap').innerHTML = '<div class="empty-state">Could not load coaching report.</div>';
        document.getElementById('coaching-by-department-wrap').innerHTML = '';
      });
  }

  // ---------- Users to be Coached (distinct learners with pending coaching) ----------
  fetch('/api/coaching/notifications')
    .then(r => r.json())
    .then(data => {
      const pending = (data.notifications || []).filter(n => !n.resolved);
      const distinctUsers = new Set(pending.map(n => n.username));
      countUp(document.getElementById('stat-users-coached'), distinctUsers.size);
    })
    .catch(() => {
      document.getElementById('stat-users-coached').textContent = '—';
    });

  // "Expired Certifications" tile is only shown to Admin, Administrator, and Instructor
  fetch('/api/auth/me')
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      const role = data && data.user ? data.user.role : null;
      if (role === 'admin' || role === 'administrator' || role === 'instructor') {
        document.getElementById('stat-tile-expired-certifications').style.display = 'block';
      }
    })
    .catch(() => { /* leave hidden if we can't confirm role */ });

  // ---------- Expired Certifications count ----------
  Promise.all([
    fetch('/api/competency/gaps').then(r => r.json()),
    fetch('/api/certificate-uploads/expired').then(r => r.json()).catch(() => ({ expired: [] })),
    fetch('/api/issued-certificates/expired').then(r => r.json()).catch(() => ({ certificates: [] })),
  ])
    .then(([gapData, certUploadData, issuedCertData]) => {
      const gaps = gapData.gaps || [];
      const expiredCertUploads = certUploadData.expired || [];
      const expiredIssuedCerts = issuedCertData.certificates || [];

      const expiredCertCount = gaps.filter(g => g.status === 'expired').length + expiredCertUploads.length + expiredIssuedCerts.length;

      countUp(document.getElementById('stat-expired-certifications'), expiredCertCount);
    })
    .catch(() => {
      document.getElementById('stat-expired-certifications').textContent = '—';
    });
`;

export const dashboardHtml = renderLayout({
  title: 'Dashboard',
  activePath: '/',
  eyebrowSuffix: 'Workforce Readiness',
  heading: 'Dashboard',
  bodyHtml,
  scripts,
});
