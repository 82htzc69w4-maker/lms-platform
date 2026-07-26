import { renderLayout } from './layout';

const bodyHtml = `
  <div class="tabbar">
    <button class="tab-btn active" data-tab="my-courses">My Courses</button>
    <button class="tab-btn" data-tab="catalogue">Course Catalogue</button>
    <button class="tab-btn" data-tab="certificates">My Certificates</button>
    <button class="tab-btn" data-tab="coaching">Coaching</button>
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

  <div class="tab-panel" data-tab-panel="coaching">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Coaching</div>
        <div class="panel-sub">A record of every coaching session held with you</div>
      </div>
      <div id="coaching-sessions-wrap">
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

  // Allow deep-linking to a specific tab via URL hash, e.g. /learner#catalogue
  const hashTab = window.location.hash.replace('#', '');
  if (hashTab) {
    const targetBtn = document.querySelector('.tab-btn[data-tab="' + hashTab + '"]');
    if (targetBtn) targetBtn.click();
  }

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

        const cards = list.map(course => {
          const isCompleted = course.enrollmentStatus === 'completed';
          const statusHtml = isCompleted
            ? \`<div class="stat-label" style="text-transform:none; letter-spacing:0; color:var(--competent); margin-bottom:6px;">Completed \${course.completedAt ? new Date(course.completedAt).toLocaleDateString() : ''}</div>\`
            : \`<button class="btn mark-complete-btn" data-course-id="\${course.id}" style="width:100%; margin-top:8px;">Mark as Complete</button>\`;
          return \`
          <div class="course-card">
            \${course.imageDataUrl
              ? \`<img class="course-card-image" src="\${course.imageDataUrl}" alt="" />\`
              : '<div class="course-card-image-placeholder">No Image</div>'}
            <div class="course-card-body">
              <div class="course-card-title">\${course.title}</div>
              <div class="course-card-category">\${course.category || 'Uncategorized'}</div>
              <div class="course-card-description">\${course.description}</div>
              \${statusHtml}
            </div>
          </div>
        \`;
        }).join('');

        wrap.innerHTML = \`<div class="course-card-grid">\${cards}</div>\`;

        document.querySelectorAll('.mark-complete-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const courseId = btn.dataset.courseId;
            btn.textContent = 'Marking Complete…';
            btn.disabled = true;
            fetch('/api/courses/' + courseId + '/complete', { method: 'POST' })
              .then(r => r.json())
              .then(() => loadMyCourses())
              .catch(() => {
                btn.textContent = 'Mark as Complete';
                btn.disabled = false;
              });
          });
        });
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

        const cards = list.map(course => \`
          <div class="course-card">
            \${course.imageDataUrl
              ? \`<img class="course-card-image" src="\${course.imageDataUrl}" alt="" />\`
              : '<div class="course-card-image-placeholder">No Image</div>'}
            <div class="course-card-body">
              <div class="course-card-title">\${course.title}</div>
              <div class="course-card-category">\${course.category || 'Uncategorized'}</div>
              <div class="course-card-description">\${course.description}</div>
              <button class="btn enroll-btn" data-course-id="\${course.id}">Enroll</button>
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
  function escapeHtmlLearner(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function renderIssuedCertificateCard(cert) {
    const title = cert.certificateType === 'competency' ? 'Certificate of Competency' : 'Certificate of Completion';
    const bodyText = cert.certificateType === 'competency' ? 'has been assessed as competent in' : 'has successfully completed';
    const borderColor = cert.borderColor || '#F2B705';

    const logoHtml = cert.includeLogo && cert.logoDataUrl
      ? '<img src="' + cert.logoDataUrl + '" style="max-height:60px; margin-bottom:16px; position:relative; z-index:1;" />'
      : '';
    const studentNameHtml = cert.includeStudentName
      ? '<div style="font-family:\\'Playfair Display\\',serif; font-size:26px; margin:12px 0; border-bottom:1px solid #D9D2C3; display:inline-block; padding-bottom:6px; position:relative; z-index:1;">' + escapeHtmlLearner(cert.studentName) + '</div>'
      : '';
    const courseNameHtml = cert.includeCourseName
      ? '<div style="font-family:\\'Big Shoulders Display\\',sans-serif; font-size:22px; text-transform:uppercase; color:#B8860B; margin:8px 0; position:relative; z-index:1;">' + escapeHtmlLearner(cert.courseTitle) + '</div>'
      : '';
    const courseNumberHtml = cert.includeCourseNumber
      ? '<div style="font-family:\\'IBM Plex Mono\\',monospace; font-size:12px; color:#6B6459; position:relative; z-index:1;">Course No: ' + escapeHtmlLearner(cert.courseNumber) + '</div>'
      : '';
    const courseDateHtml = cert.includeCourseDate
      ? '<div style="font-family:\\'IBM Plex Mono\\',monospace; font-size:12px; color:#6B6459; margin-top:8px; position:relative; z-index:1;">Completed: ' + new Date(cert.issuedDate).toLocaleDateString() + '</div>'
      : '';
    const expiryHtml = cert.includeExpiryDate && cert.expiryDate
      ? '<div style="font-family:\\'IBM Plex Mono\\',monospace; font-size:12px; color:#6B6459; position:relative; z-index:1;">Valid Until: ' + new Date(cert.expiryDate).toLocaleDateString() + '</div>'
      : '';
    const signatoryHtml = cert.includeSignatory ? \`
      <div style="margin-top:32px; display:flex; flex-direction:column; align-items:center; position:relative; z-index:1;">
        \${cert.signatureDataUrl ? '<img src="' + cert.signatureDataUrl + '" style="height:50px; margin-bottom:4px;" />' : '<div style="height:50px;"></div>'}
        <div style="width:180px; border-top:1px solid #D9D2C3; padding-top:4px; font-family:'Inter',sans-serif; font-size:13px; color:#14171A;">\${escapeHtmlLearner(cert.signatoryName) || ''}</div>
        <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:#6B6459;">\${escapeHtmlLearner(cert.signatoryTitle) || ''}</div>
      </div>
    \` : '';
    const backgroundLayerHtml = cert.backgroundImageDataUrl
      ? '<img src="' + cert.backgroundImageDataUrl + '" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; filter: brightness(' + (cert.backgroundBrightness || 100) + '%); opacity:' + ((cert.backgroundOpacity != null ? cert.backgroundOpacity : 100) / 100) + '; z-index:0;" />'
      : '';

    return \`
      <div style="position:relative; overflow:hidden; background:#fff; color:#14171A; border:8px solid \${borderColor}; border-radius:4px; padding:40px; text-align:center; font-family:'Inter',sans-serif; margin-bottom:20px;">
        \${backgroundLayerHtml}
        <div style="position:relative; z-index:1;">
          \${logoHtml}
          <div style="font-family:'Big Shoulders Display',sans-serif; font-size:28px; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:16px;">\${title}</div>
          <div style="font-size:13px; color:#6B6459;">This certifies that</div>
          \${studentNameHtml}
          <div style="font-size:13px; color:#6B6459; margin-top:8px;">\${bodyText}</div>
          \${courseNameHtml}
          \${courseNumberHtml}
          \${courseDateHtml}
          \${expiryHtml}
          \${signatoryHtml}
        </div>
      </div>
    \`;
  }

  function loadCertificates() {
    fetch('/api/issued-certificates/mine')
      .then(r => r.json())
      .then(data => {
        const list = data.certificates || [];
        const wrap = document.getElementById('certificates-wrap');

        if (list.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No certificates issued yet. Complete a course to earn one.</div>';
          return;
        }

        wrap.innerHTML = list.map(renderIssuedCertificateCard).join('');
      })
      .catch(() => {
        document.getElementById('certificates-wrap').innerHTML =
          '<div class="empty-state">Could not reach /api/issued-certificates/mine.</div>';
      });
  }

  function loadCoachingSessions() {
    fetch('/api/coaching/sessions/mine')
      .then(r => r.json())
      .then(data => {
        const list = data.sessions || [];
        const wrap = document.getElementById('coaching-sessions-wrap');

        if (list.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No coaching sessions on record.</div>';
          return;
        }

        wrap.innerHTML = list.map(s => \`
          <div class="content-block-row" style="align-items:flex-start; cursor:default; margin-bottom:8px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:4px;">\${s.courseTitle}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); margin-bottom:8px;">Coach: \${s.coachName} — \${new Date(s.createdAt).toLocaleString()}</div>
              <div style="font-family:'Inter',sans-serif; font-size:13px; color:var(--text-primary);">\${s.notes}</div>
            </div>
          </div>
        \`).join('');
      })
      .catch(() => {
        document.getElementById('coaching-sessions-wrap').innerHTML =
          '<div class="empty-state">Could not reach /api/coaching/sessions/mine.</div>';
      });
  }

  loadMyCourses();
  loadCatalogue();
  loadCertificates();
  loadCoachingSessions();
`;

export const learnerHtml = renderLayout({
  title: 'Learner Section',
  activePath: '/learner',
  eyebrowSuffix: 'Learner Section',
  heading: 'Learner Section',
  bodyHtml,
  scripts,
});
