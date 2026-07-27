import { renderLayout } from './layout';

const bodyHtml = `
  <a href="/course-delivery#catalogue" style="display: inline-block; margin-bottom: 16px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">&larr; Back to Course Catalogue</a>

  <div class="panel">
    <div class="panel-header">
      <div class="panel-title" id="enrolled-learners-title">Enrolled Learners</div>
      <div class="panel-sub">Name, registration date, progress, and completion status for every learner on this course</div>
    </div>
    <div class="panel-body">
      <div id="enrolled-learners-wrap">
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

  const COURSE_ID = window.location.pathname.split('/').pop();

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function loadEnrolledLearners() {
    Promise.all([
      fetch('/api/courses/' + COURSE_ID).then(r => r.json()),
      fetch('/api/courses/' + COURSE_ID + '/enrolled-learners').then(r => r.json()),
    ]).then(([courseData, learnersData]) => {
      const course = courseData.course;
      if (course) {
        document.getElementById('enrolled-learners-title').textContent = 'Enrolled Learners — ' + course.title;
      }

      const list = learnersData.learners || [];
      const wrap = document.getElementById('enrolled-learners-wrap');

      if (list.length === 0) {
        wrap.innerHTML = '<div class="empty-state">No learners enrolled in this course yet.</div>';
        return;
      }

      wrap.innerHTML = list.map(learner => {
        const completedHtml = learner.status === 'completed'
          ? '<span style="color:var(--competent);">' + new Date(learner.completedAt).toLocaleDateString() + '</span>'
          : '<span style="color:var(--text-muted);">Not yet completed</span>';

        const progressHtml = \`
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:100px; height:8px; background:var(--panel-alt); border-radius:4px; overflow:hidden;">
              <div style="width:\${learner.percent}%; height:100%; background:var(--hazard);"></div>
            </div>
            <span style="font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--text-muted);">\${learner.percent}%</span>
          </div>
        \`;

        return \`
          <div class="content-block-row" style="align-items:center; cursor:default; margin-bottom:8px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:6px;">\${escapeHtml(learner.firstName)} \${escapeHtml(learner.surname)}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); margin-bottom:6px;">Enrolled: \${new Date(learner.registeredAt).toLocaleDateString()} — Completed: \${completedHtml}</div>
              \${progressHtml}
            </div>
            <button type="button" class="btn reset-learner-btn" data-username="\${learner.username}" style="background:var(--risk); color:#000;">Reset Course</button>
          </div>
        \`;
      }).join('');

      wrap.querySelectorAll('.reset-learner-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!confirm('This will reset this learner\\'s progress on this course back to 0% — they will need to complete it again. Continue?')) return;

          btn.textContent = 'Resetting…';
          btn.disabled = true;

          fetch('/api/courses/' + COURSE_ID + '/reset-for-learner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: btn.dataset.username })
          })
            .then(async (r) => {
              const data = await r.json();
              if (!r.ok) throw new Error(data.error || 'Failed to reset course');
              return data;
            })
            .then(() => loadEnrolledLearners())
            .catch((err) => {
              alert(err.message);
              btn.textContent = 'Reset Course';
              btn.disabled = false;
            });
        });
      });
    }).catch(() => {
      document.getElementById('enrolled-learners-wrap').innerHTML =
        '<div class="empty-state">Could not load enrolled learners.</div>';
    });
  }

  loadEnrolledLearners();
`;

export const enrolledLearnersHtml = renderLayout({
  title: 'Enrolled Learners',
  activePath: '/course-delivery',
  eyebrowSuffix: 'Enrolled Learners',
  heading: 'Enrolled Learners',
  bodyHtml,
  scripts,
});
