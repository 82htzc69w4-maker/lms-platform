import { renderLayout } from './layout';

const bodyHtml = `
  <div class="tabbar">
    <button class="tab-btn active" data-tab="my-courses">My Courses</button>
    <button class="tab-btn" data-tab="catalogue">Course Catalogue</button>
    <button class="tab-btn" data-tab="certificates">My Certificates</button>
  </div>

  <div class="tab-panel active" data-tab-panel="my-courses">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">My Courses</div>
        <div class="panel-sub">Courses you're currently registered to — pulled from /api/courses/mine</div>
      </div>
      <div id="my-courses-wrap">
        <div class="empty-state">Loading&hellip;</div>
      </div>
    </div>
  </div>

  <div class="tab-panel" data-tab-panel="catalogue">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Course Catalogue</div>
        <div class="panel-sub">Every course registered on the platform — pulled from /api/courses</div>
      </div>
      <div id="catalogue-wrap">
        <div class="empty-state">Loading&hellip;</div>
      </div>
    </div>
  </div>

  <div class="tab-panel" data-tab-panel="certificates">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">My Certificates</div>
        <div class="panel-sub">Certificates issued to you — pulled from /api/certificates/mine</div>
      </div>
      <div id="certificates-wrap">
        <div class="empty-state">Loading&hellip;</div>
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

  // ---------- My Courses ----------
  function loadMyCourses() {
    fetch('/api/courses/mine')
      .then(r => r.json())
      .then(data => {
        const list = data.courses || [];
        const wrap = document.getElementById('my-courses-wrap');

        if (list.length === 0) {
          wrap.innerHTML = '<div class="empty-state">You are not registered for any courses yet. Browse the Course Catalogue tab to enroll.</div>';
          return;
        }

        const rows = list.map(course => \`
          <tr>
            <td>\${course.title}</td>
            <td>\${course.category || '—'}</td>
            <td>\${course.description}</td>
          </tr>
        \`).join('');

        wrap.innerHTML = \`
          <table>
            <thead>
              <tr><th>Course</th><th>Category</th><th>Description</th></tr>
            </thead>
            <tbody>\${rows}</tbody>
          </table>
        \`;
      })
      .catch(() => {
        document.getElementById('my-courses-wrap').innerHTML =
          '<div class="empty-state">Could not reach /api/courses/mine.</div>';
      });
  }

  // ---------- Course Catalogue ----------
  function loadCatalogue() {
    fetch('/api/courses')
      .then(r => r.json())
      .then(data => {
        const list = (data.courses || []).filter(course => course.status === 'published');
        const wrap = document.getElementById('catalogue-wrap');

        if (list.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No courses have been added to the platform yet.</div>';
          return;
        }

        const rows = list.map(course => \`
          <tr>
            <td>\${course.title}</td>
            <td>\${course.category || '—'}</td>
            <td>\${course.description}</td>
            <td><button class="btn enroll-btn" data-course-id="\${course.id}">Enroll</button></td>
          </tr>
        \`).join('');

        wrap.innerHTML = \`
          <table>
            <thead>
              <tr><th>Course</th><th>Category</th><th>Description</th><th></th></tr>
            </thead>
            <tbody>\${rows}</tbody>
          </table>
        \`;

        document.querySelectorAll('.enroll-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const courseId = btn.dataset.courseId;
            btn.textContent = 'Enrolling…';
            btn.disabled = true;
            fetch('/api/courses/' + courseId + '/enroll', { method: 'POST' })
              .then(r => r.json())
              .then(() => {
                btn.textContent = 'Enrolled';
                loadMyCourses();
              })
              .catch(() => {
                btn.textContent = 'Enroll';
                btn.disabled = false;
              });
          });
        });
      })
      .catch(() => {
        document.getElementById('catalogue-wrap').innerHTML =
          '<div class="empty-state">Could not reach /api/courses.</div>';
      });
  }

  // ---------- My Certificates ----------
  function loadCertificates() {
    fetch('/api/certificates/mine')
      .then(r => r.json())
      .then(data => {
        const list = data.certificates || [];
        const wrap = document.getElementById('certificates-wrap');

        if (list.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No certificates issued yet.</div>';
          return;
        }

        const rows = list.map(cert => \`
          <tr>
            <td>\${cert.title}</td>
            <td>\${new Date(cert.issuedDate).toLocaleDateString()}</td>
          </tr>
        \`).join('');

        wrap.innerHTML = \`
          <table>
            <thead>
              <tr><th>Certificate</th><th>Issued</th></tr>
            </thead>
            <tbody>\${rows}</tbody>
          </table>
        \`;
      })
      .catch(() => {
        document.getElementById('certificates-wrap').innerHTML =
          '<div class="empty-state">Could not reach /api/certificates/mine.</div>';
      });
  }

  loadMyCourses();
  loadCatalogue();
  loadCertificates();
`;

export const learnerHtml = renderLayout({
  title: 'Learner Section',
  activePath: '/learner',
  eyebrowSuffix: 'Learner Section',
  heading: 'Learner Section',
  bodyHtml,
  scripts,
});
