import { renderLayout } from './layout';

const bodyHtml = `
  <div class="tabbar">
    <button class="tab-btn active" data-tab="notifications">Notifications</button>
    <button class="tab-btn" data-tab="my-courses">My Courses</button>
    <button class="tab-btn" data-tab="catalogue">Course Catalogue</button>
    <button class="tab-btn" data-tab="certificates">My Certificates</button>
    <button class="tab-btn" data-tab="coaching">Coaching</button>
    <button class="tab-btn" data-tab="skills-matrix">Skills Matrix</button>
    <button class="tab-btn" data-tab="learning-pathway">Learning Pathway</button>
    <button class="tab-btn" data-tab="passport">Competency Passport</button>
  </div>

  <div style="display:flex; flex-direction:column; align-items:center; padding: 20px 0; border-bottom: 1px dashed var(--grid-line); margin-bottom: 20px;">
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="52" fill="none" stroke="var(--grid-line)" stroke-width="10" />
      <circle id="progress-gauge-circle" cx="60" cy="60" r="52" fill="none" stroke="var(--hazard)" stroke-width="10"
        stroke-dasharray="326.7" stroke-dashoffset="326.7" stroke-linecap="round" transform="rotate(-90 60 60)" style="transition: stroke-dashoffset 0.6s ease, stroke 0.3s ease;" />
      <text id="progress-gauge-text" x="60" y="68" text-anchor="middle" font-family="'Big Shoulders Display', sans-serif" font-size="28" fill="var(--text-primary)">0%</text>
    </svg>
    <div class="stat-label" style="margin-top: 8px;">Overall Progress</div>
  </div>

  <div class="tab-panel active" data-tab-panel="notifications">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Notifications</div>
        <div class="panel-sub">Course registrations, certificate uploads, and course resets</div>
      </div>
      <div id="notifications-wrap">
        <div class="empty-state">Loading&hellip;</div>
      </div>
    </div>
  </div>

  <div class="tab-panel" data-tab-panel="my-courses">
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

  <div class="tab-panel" data-tab-panel="skills-matrix">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Skills Matrix</div>
        <div class="panel-sub">A live view of your course activity, grouped by category</div>
      </div>
      <div id="skills-matrix-wrap">
        <div class="empty-state">Loading&hellip;</div>
      </div>
    </div>
  </div>

  <div class="tab-panel" data-tab-panel="learning-pathway">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Learning Pathway</div>
        <div class="panel-sub">Recommended next courses, based on what you've completed and your profile</div>
      </div>
      <div id="learning-pathway-wrap">
        <div class="empty-state">Loading&hellip;</div>
      </div>
    </div>
  </div>

  <div class="tab-panel" data-tab-panel="passport">
    <div class="panel" style="margin-bottom: 20px;">
      <div class="panel-header">
        <div class="panel-title">Qualifications &amp; Certifications</div>
      </div>
      <div class="panel-body">
        <div id="passport-certs-wrap"><div class="empty-state">Loading&hellip;</div></div>
      </div>
    </div>

    <div class="panel" style="margin-bottom: 20px;">
      <div class="panel-header">
        <div class="panel-title">Skills</div>
      </div>
      <div class="panel-body">
        <div id="passport-skills-wrap"><div class="empty-state">Loading&hellip;</div></div>
      </div>
    </div>

    <div class="panel" style="margin-bottom: 20px;">
      <div class="panel-header">
        <div class="panel-title">Experience — Workplace Observations</div>
      </div>
      <div class="panel-body">
        <div id="passport-observations-wrap"><div class="empty-state">Loading&hellip;</div></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Evidence</div>
        <div class="panel-sub">Upload videos, photos, or documents proving your skills — a supervisor will review and sign off</div>
      </div>
      <div class="panel-body">
        <div id="passport-evidence-wrap" style="margin-bottom: 20px;"><div class="empty-state">Loading&hellip;</div></div>

        <div class="stat-label" style="margin-bottom: 8px;">Upload New Evidence</div>
        <div class="form-row">
          <input type="text" id="evidence-title" placeholder="Title (e.g. Forklift operation demonstration)" style="flex:2;" />
          <select id="evidence-type" style="flex:1;">
            <option value="video">Video</option>
            <option value="photo">Photo</option>
            <option value="document">Document</option>
          </select>
        </div>
        <div class="form-row" style="margin-top: 8px;">
          <input type="text" id="evidence-skill" placeholder="Related skill / category (optional)" style="flex:1;" />
        </div>
        <div class="form-row" style="margin-top: 8px;">
          <textarea id="evidence-description" rows="2" placeholder="Description (optional)" style="width:100%; background: var(--panel-alt); border: 1px solid var(--grid-line); color: var(--text-primary); font-family: 'Inter', sans-serif; font-size: 13px; padding: 10px 12px; border-radius: 2px;"></textarea>
        </div>
        <div class="form-row" style="margin-top: 8px;">
          <input type="file" id="evidence-file" accept="video/*,image/*,.pdf,.doc,.docx" />
        </div>
        <button class="btn" id="upload-evidence-btn" style="margin-top: 10px;">Upload Evidence</button>
        <div id="evidence-message" style="margin-top: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>
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
          <a href="/course-view/\${course.id}" class="course-card" style="text-decoration:none; color:inherit; cursor:pointer;">
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

              if (progress.totalItems === 0) {
                el.innerHTML = '<div class="stat-label" style="text-transform:none; letter-spacing:0;">No progress recorded yet</div>';
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
    const orientation = cert.orientation || 'landscape';
    const sizeStyle = orientation === 'portrait' ? 'width:500px; aspect-ratio:0.707; max-width:100%;' : 'width:700px; aspect-ratio:1.414; max-width:100%;';

    const logoHtml = cert.includeLogo && cert.logoDataUrl
      ? '<img src="' + cert.logoDataUrl + '" style="max-height:60px; margin-bottom:16px; position:relative; z-index:1;" />'
      : '';
    const studentNameHtml = cert.includeStudentName
      ? '<div style="font-family:\\'Playfair Display\\',serif; font-size:26px; margin:12px 0; border-bottom:1px solid #D9D2C3; display:inline-block; padding-bottom:6px; position:relative; z-index:1;">' + escapeHtmlLearner(cert.studentName) + '</div>'
      : '';
    const idNumberHtml = cert.includeIdNumber && cert.studentIdNumber
      ? '<div style="font-family:\\'IBM Plex Mono\\',monospace; font-size:12px; color:#6B6459; position:relative; z-index:1;">ID: ' + escapeHtmlLearner(cert.studentIdNumber) + '</div>'
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
      ? '<img src="' + cert.backgroundImageDataUrl + '" style="position:absolute; inset:0; width:100%; height:100%; object-fit:contain; filter: brightness(' + (cert.backgroundBrightness || 100) + '%); opacity:' + ((cert.backgroundOpacity != null ? cert.backgroundOpacity : 100) / 100) + '; z-index:0;" />'
      : '';

    return \`
      <div style="position:relative; overflow:hidden; background:#fff; color:#14171A; border:8px solid \${borderColor}; border-radius:4px; padding:40px; text-align:center; font-family:'Inter',sans-serif; \${sizeStyle} margin:0 auto; box-sizing:border-box; display:flex; flex-direction:column; justify-content:center;">
        \${backgroundLayerHtml}
        <div style="position:relative; z-index:1;">
          \${logoHtml}
          <div style="font-family:'Big Shoulders Display',sans-serif; font-size:28px; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:16px;">\${title}</div>
          <div style="font-size:13px; color:#6B6459;">This certifies that</div>
          \${studentNameHtml}
          \${idNumberHtml}
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

  function openCertificatePrintWindow(faceHtml, orientation) {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(\`
      <html>
      <head>
        <title>Certificate</title>
        <link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
        <style>
          @page { size: \${orientation === 'portrait' ? 'portrait' : 'landscape'}; margin: 0.5cm; }
          body { margin:0; padding:40px; background:#fff; display:flex; justify-content:center; }
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

  function openCertificatePreviewWindow(faceHtml) {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(\`
      <html>
      <head>
        <title>Certificate Preview</title>
        <link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body { margin:0; padding:40px; background:#f1ede4; display:flex; justify-content:center; }
        </style>
      </head>
      <body>\${faceHtml}</body>
      </html>
    \`);
    win.document.close();
  }

  let issuedCertificatesById = {};

  function renderIssuedCertificateCard(cert) {
    issuedCertificatesById[cert.id] = cert;
    const expired = isCertExpired(cert.expiryDate);
    const metaText = 'Issued: ' + new Date(cert.issuedDate).toLocaleDateString() +
      (cert.expiryDate ? ' — Expires: ' + new Date(cert.expiryDate).toLocaleDateString() : ' — No expiry');

    return \`
      <div class="content-block-row" style="align-items:center; cursor:default; margin-bottom:8px; \${expired ? 'border-color: var(--risk); background: rgba(193,68,58,0.06);' : ''}">
        <div style="flex:1;">
          <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:4px;">\${escapeHtmlLearner(cert.courseTitle)}</div>
          <div style="font-family:'IBM Plex Mono',monospace; font-size:12px; color:\${expired ? 'var(--risk)' : 'var(--text-muted)'};">
            \${expired ? '<strong>EXPIRED</strong> — ' : ''}\${metaText}
          </div>
        </div>
        <button type="button" class="btn preview-cert-btn" data-cert-id="\${cert.id}" style="background:var(--panel-alt); color:var(--text-primary); border:1px solid var(--grid-line); margin-right:8px;">Preview</button>
        <button type="button" class="btn print-cert-btn" data-cert-id="\${cert.id}">Print / Download</button>
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

      wrap.querySelectorAll('.preview-cert-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const cert = issuedCertificatesById[btn.dataset.certId];
          if (cert) openCertificatePreviewWindow(buildCertificateFaceHtml(cert));
        });
      });

      wrap.querySelectorAll('.print-cert-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const cert = issuedCertificatesById[btn.dataset.certId];
          if (cert) openCertificatePrintWindow(buildCertificateFaceHtml(cert), cert.orientation);
        });
      });
    }).catch(() => {
      document.getElementById('certificates-wrap').innerHTML =
        '<div class="empty-state">Could not load certificates.</div>';
    });
  }

  function loadCoachingSessions() {
    Promise.all([
      fetch('/api/coaching/notifications/mine').then(r => r.json()).catch(() => ({ notifications: [] })),
      fetch('/api/coaching/sessions/mine').then(r => r.json()).catch(() => ({ sessions: [] })),
    ]).then(([notifData, sessionsData]) => {
      const pending = (notifData.notifications || []).filter(n => !n.resolved);
      const sessions = sessionsData.sessions || [];
      const wrap = document.getElementById('coaching-sessions-wrap');

      let html = '';

      if (pending.length > 0) {
        html += pending.map(n => {
          let scheduleHtml;
          if (!n.scheduledDate) {
            scheduleHtml = '<div style="font-family:\\'Inter\\',sans-serif; font-size:13px; color:var(--text-muted); margin-top:6px;">No session booked yet.</div>';
          } else if (n.scheduleStatus === 'accepted') {
            scheduleHtml = '<div style="font-family:\\'Inter\\',sans-serif; font-size:13px; color:var(--competent); margin-top:6px;">Session confirmed: ' + new Date(n.scheduledDate + 'T' + n.scheduledTime).toLocaleString() + '</div>';
          } else if (n.proposedBy === 'learner') {
            scheduleHtml = '<div style="font-family:\\'Inter\\',sans-serif; font-size:13px; color:var(--refresher); margin-top:6px;">You proposed: ' + new Date(n.scheduledDate + 'T' + n.scheduledTime).toLocaleString() + ' — waiting on the facilitator</div>';
          } else {
            scheduleHtml = \`
              <div style="margin-top:10px; padding:10px; background:rgba(242,183,5,0.1); border-radius:2px;">
                <div style="font-family:'Inter',sans-serif; font-size:13px; color:var(--text-primary); margin-bottom:8px;">Facilitator proposed: \${new Date(n.scheduledDate + 'T' + n.scheduledTime).toLocaleString()}</div>
                <button type="button" class="btn accept-session-btn" data-notification-id="\${n.id}" style="margin-right:8px;">Accept</button>
                <button type="button" class="btn propose-time-btn" data-notification-id="\${n.id}" style="background:var(--panel-alt); color:var(--text-primary); border:1px solid var(--grid-line);">Propose Different Time</button>
                <div class="propose-form-\${n.id}" style="display:none; margin-top:10px;">
                  <div class="form-row" style="margin-bottom:8px;">
                    <input type="date" id="propose-date-\${n.id}" style="flex:1;" />
                    <input type="time" id="propose-time-\${n.id}" style="flex:1;" />
                  </div>
                  <button type="button" class="btn submit-propose-btn" data-notification-id="\${n.id}">Submit Proposal</button>
                  <div class="propose-message-\${n.id}" style="margin-top:6px; font-family:'IBM Plex Mono',monospace; font-size:12px;"></div>
                </div>
              </div>
            \`;
          }
          return \`
          <div style="margin-bottom:12px; padding:14px; background:rgba(193,68,58,0.1); border-left:3px solid var(--risk); border-radius:2px;">
            <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:4px;"><strong>\${n.courseTitle}</strong> is blocked</div>
            <div style="font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--text-muted);">Awaiting a coaching session — flagged \${new Date(n.createdAt).toLocaleDateString()}.</div>
            \${scheduleHtml}
            <div class="stat-label" style="margin-top:12px; margin-bottom:6px;">Scheduling History</div>
            <div class="schedule-history-\${n.id}" style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted);">Loading&hellip;</div>
          </div>
        \`;
        }).join('');
      }

      if (sessions.length === 0 && pending.length === 0) {
        html += '<div class="empty-state">No coaching sessions on record.</div>';
      } else {
        html += sessions.map(s => \`
          <div class="content-block-row" style="align-items:flex-start; cursor:default; margin-bottom:8px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:4px;">\${s.courseTitle}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); margin-bottom:8px;">Coach: \${s.coachName} — \${s.sessionDate ? new Date(s.sessionDate + 'T' + (s.sessionTime || '00:00')).toLocaleString() : new Date(s.createdAt).toLocaleString()}</div>
              <div style="font-family:'Inter',sans-serif; font-size:13px; color:var(--text-primary);">\${s.notes}</div>
            </div>
          </div>
        \`).join('');
      }

      wrap.innerHTML = html;

      pending.forEach(n => {
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
              const who = e.actorRole === 'facilitator' ? escapeHtmlLearner(e.actorName) + ' (facilitator)' : 'You';
              const verb = e.action === 'accepted' ? 'accepted' : 'proposed';
              return '<div style="margin-bottom:4px;">' + who + ' ' + verb + ' ' + new Date(e.scheduledDate + 'T' + e.scheduledTime).toLocaleString() + ' — <span style="opacity:0.7;">' + new Date(e.createdAt).toLocaleString() + '</span></div>';
            }).join('');
          })
          .catch(() => {
            const histEl = document.querySelector('.schedule-history-' + n.id);
            if (histEl) histEl.textContent = 'Could not load history.';
          });
      });

      wrap.querySelectorAll('.accept-session-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          btn.textContent = 'Accepting…';
          btn.disabled = true;
          fetch('/api/coaching/notifications/' + btn.dataset.notificationId + '/learner-respond', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'accept' })
          })
            .then(r => r.json())
            .then(() => loadCoachingSessions())
            .catch(() => {
              btn.textContent = 'Accept';
              btn.disabled = false;
            });
        });
      });

      wrap.querySelectorAll('.propose-time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const formEl = document.querySelector('.propose-form-' + btn.dataset.notificationId);
          formEl.style.display = formEl.style.display === 'none' ? 'block' : 'none';
        });
      });

      wrap.querySelectorAll('.submit-propose-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const notificationId = btn.dataset.notificationId;
          const dateEl = document.getElementById('propose-date-' + notificationId);
          const timeEl = document.getElementById('propose-time-' + notificationId);
          const msgEl = document.querySelector('.propose-message-' + notificationId);

          if (!dateEl.value || !timeEl.value) {
            msgEl.textContent = 'Please choose a date and time.';
            msgEl.style.color = 'var(--risk)';
            return;
          }

          fetch('/api/coaching/notifications/' + notificationId + '/learner-respond', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'propose', scheduledDate: dateEl.value, scheduledTime: timeEl.value })
          })
            .then(async (r) => {
              const data = await r.json();
              if (!r.ok) throw new Error(data.error || 'Failed to submit proposal');
              return data;
            })
            .then(() => loadCoachingSessions())
            .catch((err) => {
              msgEl.textContent = err.message;
              msgEl.style.color = 'var(--risk)';
            });
        });
      });
    }).catch(() => {
      document.getElementById('coaching-sessions-wrap').innerHTML =
        '<div class="empty-state">Could not load coaching information.</div>';
    });
  }

  function loadNotifications() {
    fetch('/api/notifications/mine')
      .then(r => r.json())
      .then(data => {
        const list = data.notifications || [];
        const wrap = document.getElementById('notifications-wrap');

        if (list.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No notifications yet.</div>';
          return;
        }

        wrap.innerHTML = list.map(n => \`
          <div class="content-block-row" style="align-items:flex-start; cursor:default; margin-bottom:8px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:4px;">\${escapeHtmlLearner(n.message)}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted);">\${new Date(n.createdAt).toLocaleString()}</div>
            </div>
          </div>
        \`).join('');
      })
      .catch(() => {
        document.getElementById('notifications-wrap').innerHTML =
          '<div class="empty-state">Could not reach /api/notifications/mine.</div>';
      });
  }

  function loadOverallProgress() {
    const circumference = 2 * Math.PI * 52;
    fetch('/api/courses/my-overall-progress')
      .then(r => r.json())
      .then(data => {
        const percent = data.overallPercent || 0;
        const offset = circumference * (1 - percent / 100);
        const circleEl = document.getElementById('progress-gauge-circle');
        circleEl.style.strokeDashoffset = offset;

        let color;
        if (percent < 50) {
          color = 'var(--risk)';
        } else if (percent < 85) {
          color = 'var(--refresher)';
        } else {
          color = 'var(--competent)';
        }
        circleEl.style.stroke = color;

        document.getElementById('progress-gauge-text').textContent = percent + '%';
      })
      .catch(() => {
        document.getElementById('progress-gauge-text').textContent = '—';
      });
  }

  function escapeHtmlMatrix(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function loadSkillsMatrix() {
    fetch('/api/courses/my-skills-matrix')
      .then(r => r.json())
      .then(data => {
        const byCategory = data.byCategory || {};
        const categories = Object.keys(byCategory).sort();
        const wrap = document.getElementById('skills-matrix-wrap');

        if (categories.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No course activity yet — enroll in a course to start building your skills matrix.</div>';
          return;
        }

        wrap.innerHTML = categories.map(category => {
          const rows = byCategory[category].map(row => {
            let statusHtml;
            if (row.status === 'completed') {
              statusHtml = row.expired
                ? '<span style="color:var(--risk); font-weight:600;">Expired</span>'
                : '<span style="color:var(--competent); font-weight:600;">Competent</span>';
            } else if (row.status === 'blocked') {
              statusHtml = '<span style="color:var(--risk); font-weight:600;">Blocked</span>';
            } else {
              statusHtml = '<span style="color:var(--refresher); font-weight:600;">In Progress (' + row.percent + '%)</span>';
            }

            const dateLine = row.status === 'completed' && row.completedAt
              ? 'Completed: ' + new Date(row.completedAt).toLocaleDateString() + (row.expiryDate ? ' — Expires: ' + new Date(row.expiryDate).toLocaleDateString() : '')
              : '';

            return \`
              <div class="content-block-row" style="align-items:center; cursor:default; margin-bottom:6px; \${row.expired ? 'border-color: var(--risk); background: rgba(193,68,58,0.06);' : ''}">
                <div style="flex:1;">
                  <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:2px;">\${escapeHtmlMatrix(row.courseTitle)}</div>
                  \${dateLine ? '<div style="font-family:\\'IBM Plex Mono\\',monospace; font-size:11px; color:var(--text-muted);">' + dateLine + '</div>' : ''}
                </div>
                <div style="font-family:'IBM Plex Mono',monospace; font-size:13px;">\${statusHtml}</div>
              </div>
            \`;
          }).join('');

          return \`
            <div class="stat-label" style="margin-bottom: 10px; margin-top: 16px;">\${escapeHtmlMatrix(category)}</div>
            \${rows}
          \`;
        }).join('');
      })
      .catch(() => {
        document.getElementById('skills-matrix-wrap').innerHTML =
          '<div class="empty-state">Could not load your skills matrix.</div>';
      });
  }

  function escapeHtmlPathway(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function loadLearningPathway() {
    fetch('/api/courses/my-learning-pathway')
      .then(r => r.json())
      .then(data => {
        const pathway = data.pathway || [];
        const wrap = document.getElementById('learning-pathway-wrap');

        if (pathway.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No further courses to recommend right now — check back as new courses are published.</div>';
          return;
        }

        const cards = pathway.map(item => {
          const imageHtml = item.imageDataUrl
            ? '<img class="course-card-image" src="' + item.imageDataUrl + '" alt="" />'
            : item.bannerDataUrl
            ? '<img class="course-card-image" src="' + item.bannerDataUrl + '" style="object-fit: contain; background: var(--panel-alt);" alt="" />'
            : '<div class="course-card-image-placeholder">No Image</div>';

          const reasonsHtml = item.reasons.map(r =>
            '<span style="display:inline-block; background:var(--panel-alt); border:1px solid var(--grid-line); border-radius:2px; padding:3px 8px; font-family:\\'IBM Plex Mono\\',monospace; font-size:11px; color:var(--text-muted); margin-right:6px; margin-bottom:6px;">' + escapeHtmlPathway(r) + '</span>'
          ).join('');

          return \`
          <div class="course-card">
            \${imageHtml}
            <div class="course-card-body">
              <div class="course-card-title">\${escapeHtmlPathway(item.courseTitle)}</div>
              <div class="course-card-category">\${escapeHtmlPathway(item.category)}</div>
              <div style="margin: 8px 0;">\${reasonsHtml}</div>
              <button type="button" class="btn view-in-catalogue-btn" style="width:100%;">View in Course Catalogue</button>
            </div>
          </div>
        \`;
        }).join('');

        wrap.innerHTML = '<div class="course-card-grid">' + cards + '</div>';

        wrap.querySelectorAll('.view-in-catalogue-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            document.querySelector('.tab-btn[data-tab="catalogue"]').click();
          });
        });
      })
      .catch(() => {
        document.getElementById('learning-pathway-wrap').innerHTML =
          '<div class="empty-state">Could not load your learning pathway.</div>';
      });
  }

  loadOverallProgress();
  loadNotifications();
  loadMyCourses();
  loadCatalogue();
  loadCertificates();
  loadCoachingSessions();
  loadSkillsMatrix();
  // ---------- Competency Passport ----------
  function loadPassportCerts() {
    Promise.all([
      fetch('/api/issued-certificates/mine').then(r => r.json()).catch(() => ({ certificates: [] })),
      fetch('/api/certificate-uploads/mine').then(r => r.json()).catch(() => ({ submissions: [] })),
    ]).then(([issuedData, uploadData]) => {
      const issued = issuedData.certificates || [];
      const uploaded = uploadData.submissions || [];
      const wrap = document.getElementById('passport-certs-wrap');

      if (issued.length === 0 && uploaded.length === 0) {
        wrap.innerHTML = '<div class="empty-state">No qualifications or certifications on record yet.</div>';
        return;
      }

      let html = '';
      issued.forEach(cert => {
        const expired = isCertExpired(cert.expiryDate);
        html += \`
          <div class="content-block-row" style="align-items:center; cursor:default; margin-bottom:6px; \${expired ? 'border-color: var(--risk);' : ''}">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary);">\${escapeHtmlLearner(cert.courseTitle)}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:\${expired ? 'var(--risk)' : 'var(--text-muted)'};">\${expired ? 'EXPIRED — ' : ''}Issued \${new Date(cert.issuedDate).toLocaleDateString()}</div>
            </div>
          </div>
        \`;
      });
      uploaded.forEach(sub => {
        const expired = isCertExpired(sub.expiryDate);
        html += \`
          <div class="content-block-row" style="align-items:center; cursor:default; margin-bottom:6px; \${expired ? 'border-color: var(--risk);' : ''}">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary);">\${escapeHtmlLearner(sub.certificateName)}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:\${expired ? 'var(--risk)' : 'var(--text-muted)'};">\${expired ? 'EXPIRED — ' : ''}Issued \${new Date(sub.issuedDate).toLocaleDateString()}</div>
            </div>
          </div>
        \`;
      });
      wrap.innerHTML = html;
    }).catch(() => {
      document.getElementById('passport-certs-wrap').innerHTML = '<div class="empty-state">Could not load certifications.</div>';
    });
  }

  function loadPassportSkills() {
    fetch('/api/courses/my-skills-matrix')
      .then(r => r.json())
      .then(data => {
        const byCategory = data.byCategory || {};
        const categories = Object.keys(byCategory).sort();
        const wrap = document.getElementById('passport-skills-wrap');

        if (categories.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No skills on record yet.</div>';
          return;
        }

        wrap.innerHTML = categories.map(category => {
          const rows = byCategory[category].map(row => {
            const color = row.status === 'completed' && !row.expired ? 'var(--competent)' : row.status === 'blocked' || row.expired ? 'var(--risk)' : 'var(--refresher)';
            const label = row.status === 'completed' ? (row.expired ? 'Expired' : 'Competent') : row.status === 'blocked' ? 'Blocked' : 'In Progress';
            return \`
              <div class="content-block-row" style="align-items:center; cursor:default; margin-bottom:6px;">
                <div style="flex:1; font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary);">\${escapeHtmlLearner(row.courseTitle)}</div>
                <div style="font-family:'IBM Plex Mono',monospace; font-size:13px; color:\${color}; font-weight:600;">\${label}</div>
              </div>
            \`;
          }).join('');
          return '<div class="stat-label" style="margin-bottom: 8px; margin-top: 12px;">' + escapeHtmlLearner(category) + '</div>' + rows;
        }).join('');
      })
      .catch(() => {
        document.getElementById('passport-skills-wrap').innerHTML = '<div class="empty-state">Could not load skills.</div>';
      });
  }

  function loadPassportObservations() {
    fetch('/api/workplace-observations/mine')
      .then(r => r.json())
      .then(data => {
        const observations = data.observations || [];
        const wrap = document.getElementById('passport-observations-wrap');

        if (observations.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No workplace observations on record yet.</div>';
          return;
        }

        const outcomeColors = { competent: 'var(--competent)', not_yet_competent: 'var(--risk)', needs_improvement: 'var(--refresher)' };
        const outcomeLabels = { competent: 'Competent', not_yet_competent: 'Not Yet Competent', needs_improvement: 'Needs Improvement' };

        wrap.innerHTML = observations.map(o => \`
          <div class="content-block-row" style="align-items:flex-start; cursor:default; margin-bottom:8px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:2px;">\${escapeHtmlLearner(o.taskObserved)}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); margin-bottom:4px;">\${new Date(o.observationDate).toLocaleDateString()} — observed by \${escapeHtmlLearner(o.observedByName)}</div>
              <div style="font-family:'Inter',sans-serif; font-size:13px; color:var(--text-primary);">\${escapeHtmlLearner(o.notes)}</div>
            </div>
            <div style="font-family:'IBM Plex Mono',monospace; font-size:12px; color:\${outcomeColors[o.outcome] || 'var(--text-muted)'}; font-weight:600;">\${outcomeLabels[o.outcome] || o.outcome}</div>
          </div>
        \`).join('');
      })
      .catch(() => {
        document.getElementById('passport-observations-wrap').innerHTML = '<div class="empty-state">Could not load observations.</div>';
      });
  }

  function loadPassportEvidence() {
    fetch('/api/portfolio-evidence/mine')
      .then(r => r.json())
      .then(data => {
        const items = data.evidence || [];
        const wrap = document.getElementById('passport-evidence-wrap');

        if (items.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No evidence uploaded yet.</div>';
          return;
        }

        const statusColors = { pending: 'var(--refresher)', signed_off: 'var(--competent)', rejected: 'var(--risk)' };
        const statusLabels = { pending: 'Pending Review', signed_off: 'Signed Off', rejected: 'Not Signed Off' };

        wrap.innerHTML = items.map(e => \`
          <div class="content-block-row" style="align-items:flex-start; cursor:default; margin-bottom:8px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:2px;">\${escapeHtmlLearner(e.title)} <span style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); text-transform:uppercase;">(\${e.evidenceType})</span></div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); margin-bottom:4px;">Uploaded \${new Date(e.uploadedAt).toLocaleDateString()}\${e.relatedSkill ? ' — ' + escapeHtmlLearner(e.relatedSkill) : ''}</div>
              \${e.signOffNotes ? '<div style="font-family:\\'Inter\\',sans-serif; font-size:13px; color:var(--text-primary);">' + escapeHtmlLearner(e.signOffNotes) + '</div>' : ''}
            </div>
            <div style="text-align:right;">
              <a href="\${e.fileDataUrl}" download="\${escapeHtmlLearner(e.fileName)}" class="btn" style="text-decoration:none; display:inline-block; margin-bottom:4px;">Open</a>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:\${statusColors[e.status]}; font-weight:600;">\${statusLabels[e.status]}</div>
            </div>
          </div>
        \`).join('');
      })
      .catch(() => {
        document.getElementById('passport-evidence-wrap').innerHTML = '<div class="empty-state">Could not load evidence.</div>';
      });
  }

  document.getElementById('upload-evidence-btn').addEventListener('click', () => {
    const msgEl = document.getElementById('evidence-message');
    const titleVal = document.getElementById('evidence-title').value.trim();
    const fileInput = document.getElementById('evidence-file');
    const file = fileInput.files[0];

    if (!titleVal || !file) {
      msgEl.textContent = 'Please provide a title and choose a file.';
      msgEl.style.color = 'var(--risk)';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      msgEl.textContent = 'File is too large — please use one under 8MB.';
      msgEl.style.color = 'var(--risk)';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      fetch('/api/portfolio-evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleVal,
          description: document.getElementById('evidence-description').value.trim(),
          evidenceType: document.getElementById('evidence-type').value,
          relatedSkill: document.getElementById('evidence-skill').value.trim(),
          fileDataUrl: reader.result,
          fileName: file.name,
          fileMimeType: file.type
        })
      })
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || 'Failed to upload evidence');
          return data;
        })
        .then(() => {
          document.getElementById('evidence-title').value = '';
          document.getElementById('evidence-description').value = '';
          document.getElementById('evidence-skill').value = '';
          fileInput.value = '';
          msgEl.textContent = 'Uploaded — awaiting supervisor review.';
          msgEl.style.color = 'var(--competent)';
          loadPassportEvidence();
        })
        .catch((err) => {
          msgEl.textContent = err.message;
          msgEl.style.color = 'var(--risk)';
        });
    };
    reader.readAsDataURL(file);
  });

  loadLearningPathway();
  loadPassportCerts();
  loadPassportSkills();
  loadPassportObservations();
  loadPassportEvidence();
`;

export const learnerHtml = renderLayout({
  title: 'Learner Section',
  activePath: '/learner',
  eyebrowSuffix: 'Learner Section',
  heading: 'Learner Section',
  bodyHtml,
  scripts,
});
