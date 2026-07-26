import { renderLayout } from './layout';

const bodyHtml = `
  <div class="panel">
    <div class="panel-header">
      <div class="panel-title">Expired Certifications</div>
      <div class="panel-sub">Every certification that has passed its expiry date</div>
    </div>
    <div class="panel-body">

      <div class="stat-label" style="margin-bottom: 12px;">Course Certificates</div>
      <div id="expired-course-certs-wrap" style="margin-bottom: 24px;">
        <div class="empty-state">Loading&hellip;</div>
      </div>

      <div class="stat-label" style="margin-bottom: 12px;">External Certificates</div>
      <div id="expired-external-certs-wrap" style="margin-bottom: 24px;">
        <div class="empty-state">Loading&hellip;</div>
      </div>

      <div class="stat-label" style="margin-bottom: 12px;">Competency Certifications</div>
      <div id="expired-competency-certs-wrap">
        <div class="empty-state">Loading&hellip;</div>
      </div>

    </div>
  </div>
`;

const scripts = `
  // ---------- Role gate: Instructor, Admin, and Administrator only ----------
  fetch('/api/auth/me')
    .then(r => {
      if (!r.ok) throw new Error('not logged in');
      return r.json();
    })
    .then(data => {
      const role = data.user.role;
      if (role !== 'instructor' && role !== 'admin' && role !== 'administrator') {
        window.location.href = '/';
      }
    })
    .catch(() => {
      window.location.href = '/login';
    });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function loadExpiredCourseCertificates() {
    fetch('/api/issued-certificates/expired')
      .then(r => r.json())
      .then(data => {
        const list = data.certificates || [];
        const wrap = document.getElementById('expired-course-certs-wrap');

        if (list.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No expired course certificates.</div>';
          return;
        }

        wrap.innerHTML = list.map(cert => \`
          <div class="content-block-row" style="align-items:center; cursor:default; margin-bottom:8px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:4px;">\${escapeHtml(cert.learnerDisplayName)} — \${escapeHtml(cert.courseTitle)}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--risk);">Expired \${new Date(cert.expiryDate).toLocaleDateString()}</div>
            </div>
            <button class="btn reset-course-btn" data-course-id="\${cert.courseId}" data-username="\${cert.username}" style="background:var(--risk); color:#000;">Reset Course</button>
          </div>
        \`).join('');

        wrap.querySelectorAll('.reset-course-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            if (!confirm('This will reset the course for this learner back to 0% and they will need to complete it again. Continue?')) return;

            btn.textContent = 'Resetting…';
            btn.disabled = true;

            fetch('/api/courses/' + btn.dataset.courseId + '/reset-for-learner', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: btn.dataset.username })
            })
              .then(async (r) => {
                const data = await r.json();
                if (!r.ok) throw new Error(data.error || 'Failed to reset course');
                return data;
              })
              .then(() => loadExpiredCourseCertificates())
              .catch((err) => {
                alert(err.message);
                btn.textContent = 'Reset Course';
                btn.disabled = false;
              });
          });
        });
      })
      .catch(() => {
        document.getElementById('expired-course-certs-wrap').innerHTML =
          '<div class="empty-state">Could not reach /api/issued-certificates/expired.</div>';
      });
  }

  function loadExpiredExternalCertificates() {
    fetch('/api/certificate-uploads/expired')
      .then(r => r.json())
      .then(data => {
        const list = data.expired || [];
        const wrap = document.getElementById('expired-external-certs-wrap');

        if (list.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No expired external certificates.</div>';
          return;
        }

        wrap.innerHTML = list.map(item => \`
          <div class="content-block-row" style="align-items:center; cursor:default; margin-bottom:8px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:4px;">\${escapeHtml(item.username)} — \${escapeHtml(item.certificateName)}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--risk);">Expired \${new Date(item.expiryDate).toLocaleDateString()}</div>
            </div>
          </div>
        \`).join('');
      })
      .catch(() => {
        document.getElementById('expired-external-certs-wrap').innerHTML =
          '<div class="empty-state">Could not reach /api/certificate-uploads/expired.</div>';
      });
  }

  function loadExpiredCompetencyCertifications() {
    fetch('/api/competency/gaps')
      .then(r => r.json())
      .then(data => {
        const list = (data.gaps || []).filter(g => g.status === 'expired');
        const wrap = document.getElementById('expired-competency-certs-wrap');

        if (list.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No expired competency certifications.</div>';
          return;
        }

        wrap.innerHTML = list.map(g => \`
          <div class="content-block-row" style="align-items:center; cursor:default; margin-bottom:8px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:4px;">\${escapeHtml(g.employeeId)} — \${escapeHtml(g.competencyId)}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--risk);">\${escapeHtml(g.department || 'Unassigned')}</div>
            </div>
          </div>
        \`).join('');
      })
      .catch(() => {
        document.getElementById('expired-competency-certs-wrap').innerHTML =
          '<div class="empty-state">Could not reach /api/competency/gaps.</div>';
      });
  }

  loadExpiredCourseCertificates();
  loadExpiredExternalCertificates();
  loadExpiredCompetencyCertifications();
`;

export const expiredCertificationsHtml = renderLayout({
  title: 'Expired Certifications',
  activePath: '/',
  eyebrowSuffix: 'Expired Certifications',
  heading: 'Expired Certifications',
  bodyHtml,
  scripts,
});
