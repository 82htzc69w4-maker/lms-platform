import { renderLayout } from './layout';

const bodyHtml = `
  <div class="stats">
    <div class="stat-tile">
      <div class="stat-label">Not Competent</div>
      <div class="stat-value risk" id="stat-not-competent">0</div>
    </div>
    <div class="stat-tile">
      <div class="stat-label">Expired Courses</div>
      <div class="stat-value risk" id="stat-expired-courses">0</div>
    </div>
    <div class="stat-tile">
      <div class="stat-label">Expired Certifications</div>
      <div class="stat-value risk" id="stat-expired-certifications">0</div>
    </div>
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
  </div>

  <div class="panel">
    <div class="panel-header">
      <div class="panel-title">Workforce Readiness Heat Map</div>
      <div class="panel-sub">Live from /api/competency/risk-by-department — add employees with a department to populate</div>
    </div>
    <div class="heatmap" id="heatmap">
      <div class="empty-state" style="grid-column: 1 / -1;">Loading&hellip;</div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-header">
      <div class="panel-title">Live Gap Log</div>
      <div class="panel-sub">Pulled directly from /api/competency/gaps</div>
    </div>
    <div id="gap-log-wrap">
      <div class="empty-state">Loading gap log&hellip;</div>
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

  const LEVEL_TO_DOT = { high: 'red', medium: 'amber', low: 'green' };
  const LEVEL_TO_LABEL = { high: 'High Risk', medium: 'Medium Risk', low: 'Low Risk' };

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

  // "Courses in Development" tile is only shown to Admin, Administrator, and Instructor
  fetch('/api/auth/me')
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      const role = data && data.user ? data.user.role : null;
      if (role === 'admin' || role === 'administrator' || role === 'instructor') {
        document.getElementById('stat-tile-development').style.display = 'block';
      }
    })
    .catch(() => { /* leave hidden if we can't confirm role */ });

  // ---------- Expired courses (completed enrollments past their validity period) ----------
  fetch('/api/courses/expired')
    .then(r => r.json())
    .then(data => {
      countUp(document.getElementById('stat-expired-courses'), (data.expired || []).length);
    })
    .catch(() => {
      document.getElementById('stat-expired-courses').textContent = '—';
    });

  // ---------- Heat map: real department risk ----------
  fetch('/api/competency/risk-by-department')
    .then(r => r.json())
    .then(data => {
      const departments = data.departments || [];
      const heatmapEl = document.getElementById('heatmap');

      if (departments.length === 0) {
        heatmapEl.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;">No departments yet. Add employees on the Employees page to populate this map.</div>';
        return;
      }

      heatmapEl.innerHTML = departments.map(dept => \`
        <div class="heat-cell">
          <div class="heat-dept">\${dept.department} (\${dept.employeeCount})</div>
          <div class="heat-status status-\${LEVEL_TO_DOT[dept.level]}">
            <span class="dot \${LEVEL_TO_DOT[dept.level]}"></span>
            \${LEVEL_TO_LABEL[dept.level]}
          </div>
        </div>
      \`).join('');
    })
    .catch(() => {
      document.getElementById('heatmap').innerHTML =
        '<div class="empty-state" style="grid-column: 1 / -1;">Could not reach /api/competency/risk-by-department.</div>';
    });

  // ---------- Live gap log ----------
  fetch('/api/competency/gaps')
    .then(r => r.json())
    .then(data => {
      const gaps = data.gaps || [];
      const wrap = document.getElementById('gap-log-wrap');

      const notCompetentCount = gaps.filter(g => g.status === 'not_competent').length;
      const expiredCertCount = gaps.filter(g => g.status === 'expired').length;

      countUp(document.getElementById('stat-not-competent'), notCompetentCount);
      countUp(document.getElementById('stat-expired-certifications'), expiredCertCount);

      if (gaps.length === 0) {
        wrap.innerHTML = '<div class="empty-state">No open gaps recorded. Once employees are linked to competency evidence, anything short of \\'competent\\' will show here.</div>';
        return;
      }

      const rows = gaps.map(g => \`
        <tr>
          <td>\${g.employeeId}</td>
          <td>\${g.department ?? 'Unassigned'}</td>
          <td>\${g.competencyId}</td>
          <td><span class="pill \${g.status}">\${g.status.replace('_', ' ')}</span></td>
        </tr>
      \`).join('');

      wrap.innerHTML = \`
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Competency</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>\${rows}</tbody>
        </table>
      \`;
    })
    .catch(() => {
      document.getElementById('gap-log-wrap').innerHTML =
        '<div class="empty-state">Could not reach /api/competency/gaps. Confirm the Worker is deployed and KV is bound.</div>';
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
