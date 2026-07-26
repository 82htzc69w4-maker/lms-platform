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
            : \`<div class="progress-wrap-\${course.id}" style="margin-top:8px;"><div class="stat-label" style="text-transform:none; letter-spacing:0;">Loading progress&hellip;</div></div>\`;
          return \`
          <a href="/course-preview/\${course.id}" class="course-card" style="text-decoration:none; color:inherit; cursor:pointer;">
            \${course.imageDataUrl
              ? \`<img class="course-card-image" src="\${course.imageDataUrl}" alt="" />\`
              : course.bannerDataUrl
              ? \`<img class="course-card-image" src="\${course.bannerDataUrl}" style="object-fit: contain; background: var(--panel-alt);" alt="" />\`
              : '<div class="course-card-image-placeholder">No Image</div>'}
            <div class="course-card-body">
              <div class="course-card-title">\${course.title}</div>
              <div class="course-card-category">\${course.category || 'Uncategorized'}</div>
              <div class="course-card-description">\${course.description}</div>
              \${statusHtml}
            </div>
          </a>
        \`;
        }).join('');

        wrap.innerHTML = \`<div class="course-card-grid">\${cards}</div>\`;

        list.filter(c => c.enrollmentStatus !== 'completed').forEach(course => {
          fetch('/api/courses/' + course.id + '/my-progress')
            .then(r => r.json())
            .then(progress => {
              if (progress.justCompleted) {
                loadMyCourses();
                return;
              }
              const el = document.querySelector('.progress-wrap-' + course.id);
              if (!el) return;

              if (progress.totalTrackable === 0) {
                el.innerHTML = '<div class="stat-label" style="text-transform:none; letter-spacing:0;">No trackable activities in this course yet</div>';
                return;
              }

              el.innerHTML = \`
                <div style="display:flex; justify-content:space-between; font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); margin-bottom:4px;">
                  <span>Progress</span>
                  <span>\${progress.percent}%</span>
                </div>
                <div style="width:100%; height:8px; background:var(--panel-alt); border-radius:4px; overflow:hidden;">
                  <div style="width:\${progress.percent}%; height:100%; background:var(--hazard);"></div>
                </div>
              \`;
            })
            .catch(() => {
              const el = document.querySelector('.progress-wrap-' + course.id);
              if (el) el.innerHTML = '<div class="stat-label" style="text-transform:none; letter-spacing:0;">Could not load progress</div>';
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
    Promise.all([
      fetch('/api/courses').then(r => r.json()),
      fetch('/api/course-applications/mine').then(r => r.json()).catch(() => ({ applications: [] })),
      fetch('/api/courses/mine').then(r => r.json()).catch(() => ({ courses: [] })),
    ]).then(([coursesData, applicationsData, myCoursesData]) => {
      const list = (coursesData.courses || []).filter(course => course.status === 'published');
      const applications = applicationsData.applications || [];
      const enrolledCourseIds = new Set((myCoursesData.courses || []).map(c => c.id));
      const wrap = document.getElementById('catalogue-wrap');

      if (list.length === 0) {
        wrap.innerHTML = '<div class="empty-state">No courses have been added to the platform yet.</div>';
        return;
      }

      function latestApplicationFor(courseId) {
        const matches = applications.filter(a => a.courseId === courseId);
        if (matches.length === 0) return null;
        matches.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        return matches[0];
      }

      const cards = list.map(course => {
        const isEnrolled = enrolledCourseIds.has(course.id);
        const application = latestApplicationFor(course.id);
        let actionHtml;

        if (isEnrolled) {
          actionHtml = '<div class="btn" style="width:100%; background:var(--competent); color:#000; text-align:center; cursor:default;">Enrolled</div>';
        } else if (application && application.status === 'pending') {
          actionHtml = '<div class="stat-label" style="text-transform:none; letter-spacing:0; text-align:center; color:var(--refresher);">Application Pending Review</div>';
        } else {
          const rejectedNoteHtml = application && application.status === 'rejected'
            ? '<div class="stat-label" style="text-transform:none; letter-spacing:0; text-align:center; color:var(--risk); margin-bottom:6px;">Previous application was not approved</div>'
            : '';
          actionHtml = \`
            \${rejectedNoteHtml}
            <button class="btn apply-btn" data-course-id="\${course.id}" style="width:100%;">Apply</button>
            <div class="apply-form-\${course.id}" style="display:none; margin-top:8px;">
              <textarea id="motivation-\${course.id}" rows="3" placeholder="Why do you want to do this course?" style="width:100%; background: var(--panel-alt); border: 1px solid var(--grid-line); color: var(--text-primary); font-family: 'Inter', sans-serif; font-size: 13px; padding: 8px 10px; border-radius: 2px; margin-bottom:6px;"></textarea>
              <button class="btn submit-application-btn" data-course-id="\${course.id}" style="width:100%;">Submit Application</button>
              <div class="apply-message-\${course.id}" style="margin-top:6px; font-family:'IBM Plex Mono',monospace; font-size:12px;"></div>
            </div>
          \`;
        }

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
              \${actionHtml}
            </div>
          </div>
        \`;
      }).join('');

      wrap.innerHTML = \`<div class="course-card-grid">\${cards}</div>\`;

      document.querySelectorAll('.apply-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const courseId = btn.dataset.courseId;
          const formEl = document.querySelector('.apply-form-' + courseId);
          formEl.style.display = formEl.style.display === 'none' ? 'block' : 'none';
        });
      });

      document.querySelectorAll('.submit-application-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const courseId = btn.dataset.courseId;
          const motivation = document.getElementById('motivation-' + courseId).value.trim();
          const msgEl = document.querySelector('.apply-message-' + courseId);

          if (!motivation) {
            msgEl.textContent = 'Please tell us why you want to do this course.';
            msgEl.style.color = 'var(--risk)';
            return;
          }

          btn.textContent = 'Submitting…';
          btn.disabled = true;

          fetch('/api/course-applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId, motivation })
          })
            .then(async (r) => {
              const data = await r.json();
              if (!r.ok) throw new Error(data.error || 'Failed to submit application');
              return data;
            })
            .then(() => {
              loadCatalogue();
            })
            .catch((err) => {
              msgEl.textContent = err.message;
              msgEl.style.color = 'var(--risk)';
              btn.textContent = 'Submit Application';
              btn.disabled = false;
            });
        });
      });
    }).catch(() => {
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

  function isCertExpired(expiryDate) {
    return !!expiryDate && new Date(expiryDate).getTime() < Date.now();
  }

  function buildCertificateFaceHtml(cert) {
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
      <div style="position:relative; overflow:hidden; background:#fff; color:#14171A; border:8px solid \${borderColor}; border-radius:4px; padding:40px; text-align:center; font-family:'Inter',sans-serif;">
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

  function openCertificatePrintWindow(faceHtml) {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(\`
      <html>
      <head>
        <title>Certificate</title>
        <link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body { margin:0; padding:40px; background:#fff; }
          @media print { body { padding:0; } }
        </style>
      </head>
      <body>\${faceHtml}</body>
      </html>
    \`);
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
    };
  }

  let issuedCertificatesById = {};

  function renderIssuedCertificateCard(cert) {
    issuedCertificatesById[cert.id] = cert;
    const expired = isCertExpired(cert.expiryDate);
    const faceHtml = buildCertificateFaceHtml(cert);
    const metaText = 'Issued: ' + new Date(cert.issuedDate).toLocaleDateString() +
      (cert.expiryDate ? ' — Expires: ' + new Date(cert.expiryDate).toLocaleDateString() : ' — No expiry');

    return \`
      <div style="margin-bottom:24px; \${expired ? 'border:2px solid var(--risk); border-radius:6px; padding:12px; background:rgba(193,68,58,0.06);' : ''}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
          <div style="font-family:'IBM Plex Mono',monospace; font-size:12px; color:\${expired ? 'var(--risk)' : 'var(--text-muted)'};">
            \${expired ? '<strong>EXPIRED</strong> — ' : ''}\${metaText}
          </div>
          <button type="button" class="btn print-cert-btn" data-cert-id="\${cert.id}">Print / Download</button>
        </div>
        \${faceHtml}
      </div>
    \`;
  }

  function renderExternalCertificateRow(sub) {
    const expired = isCertExpired(sub.expiryDate);
    const metaText = 'Issued: ' + new Date(sub.issuedDate).toLocaleDateString() +
      (sub.expiryDate ? ' — Expires: ' + new Date(sub.expiryDate).toLocaleDateString() : ' — No expiry');

    return \`
      <div class="content-block-row" style="align-items:center; cursor:default; \${expired ? 'border-color: var(--risk); background: rgba(193,68,58,0.06);' : ''}">
        <div style="flex:1;">
          <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:4px;">\${escapeHtmlLearner(sub.certificateName)}</div>
          <div style="font-family:'IBM Plex Mono',monospace; font-size:12px; color:\${expired ? 'var(--risk)' : 'var(--text-muted)'};">
            \${expired ? '<strong>EXPIRED</strong> — ' : ''}\${metaText}
          </div>
        </div>
        <a href="\${sub.fileDataUrl}" download="\${escapeHtmlLearner(sub.fileName)}" class="btn" style="text-decoration:none;">Open / Download</a>
      </div>
    \`;
  }

  function loadCertificates() {
    Promise.all([
      fetch('/api/issued-certificates/mine').then(r => r.json()).catch(() => ({ certificates: [] })),
      fetch('/api/certificate-uploads/mine').then(r => r.json()).catch(() => ({ submissions: [] })),
    ]).then(([issuedData, uploadData]) => {
      const issued = issuedData.certificates || [];
      const uploaded = uploadData.submissions || [];
      const wrap = document.getElementById('certificates-wrap');

      if (issued.length === 0 && uploaded.length === 0) {
        wrap.innerHTML = '<div class="empty-state">No certificates yet. Complete a course or upload an external certificate to see it here.</div>';
        return;
      }

      let html = '';

      html += '<div class="stat-label" style="margin-bottom: 12px;">Course Certificates</div>';
      html += issued.length > 0
        ? issued.map(renderIssuedCertificateCard).join('')
        : '<div class="empty-state" style="margin-bottom: 24px;">No course certificates yet.</div>';

      html += '<div class="stat-label" style="margin-bottom: 12px; margin-top: 12px;">External Certificates</div>';
      html += uploaded.length > 0
        ? uploaded.map(renderExternalCertificateRow).join('')
        : '<div class="empty-state">No external certificates uploaded yet.</div>';

      wrap.innerHTML = html;

      wrap.querySelectorAll('.print-cert-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const cert = issuedCertificatesById[btn.dataset.certId];
          if (cert) openCertificatePrintWindow(buildCertificateFaceHtml(cert));
        });
      });
    }).catch(() => {
      document.getElementById('certificates-wrap').innerHTML =
        '<div class="empty-state">Could not load certificates.</div>';
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
