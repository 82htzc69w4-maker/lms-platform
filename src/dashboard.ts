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

  <div class="panel" style="margin-bottom: 20px;">
    <div class="panel-header">
      <div class="panel-title">Human Resources</div>
      <div class="panel-sub">Coming soon</div>
    </div>
    <div class="panel-body">
      <div class="empty-state">HR tools will appear here in a future update.</div>
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
    })
    .catch(() => { /* leave hidden if we can't confirm role */ });

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
          byCourse[s.courseTitle] = (byCourse[s.courseTitle] || 0) + 1;
          const dept = s.department || 'Unassigned';
          byDept[dept] = (byDept[dept] || 0) + 1;
        });

        function renderCounts(counts) {
          return Object.keys(counts).sort((a, b) => counts[b] - counts[a]).map(key => \`
            <div class="content-block-row" style="align-items:center; cursor:default; margin-bottom:6px;">
              <div style="flex:1; font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary);">\${key}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:13px; color:var(--hazard); font-weight:600;">\${counts[key]} session\${counts[key] === 1 ? '' : 's'}</div>
            </div>
          \`).join('');
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
