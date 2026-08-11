import { renderLayout } from './layout';

const bodyHtml = `
  <div class="panel" style="margin-bottom: 20px;">
    <div class="panel-header">
      <div class="panel-title">Employee Performance</div>
      <div class="panel-sub">Training history, assessments, incident reports, and productivity metrics in one place</div>
    </div>
    <div class="panel-body">
      <select id="employee-select" style="width:100%; max-width:400px;">
        <option value="">Select a learner&hellip;</option>
      </select>
    </div>
  </div>

  <div id="performance-content" style="display:none;">

    <div class="panel" style="margin-bottom: 20px;">
      <div class="panel-header">
        <div class="panel-title">Training History</div>
      </div>
      <div class="panel-body">
        <div id="training-history-wrap"><div class="empty-state">Loading&hellip;</div></div>
      </div>
    </div>

    <div class="panel" style="margin-bottom: 20px;">
      <div class="panel-header">
        <div class="panel-title">Assessment History</div>
      </div>
      <div class="panel-body">
        <div id="assessment-history-wrap"><div class="empty-state">Loading&hellip;</div></div>
      </div>
    </div>

    <div class="panel" style="margin-bottom: 20px;">
      <div class="panel-header">
        <div class="panel-title">Incident Reports</div>
      </div>
      <div class="panel-body">
        <div id="incident-reports-wrap" style="margin-bottom: 16px;"><div class="empty-state">Loading&hellip;</div></div>

        <div class="stat-label" style="margin-bottom: 8px;">Log a New Incident</div>
        <div class="form-row">
          <input type="date" id="incident-date" style="flex:1;" />
          <select id="incident-type" style="flex:1;">
            <option value="injury">Injury</option>
            <option value="near_miss">Near Miss</option>
            <option value="property_damage">Property Damage</option>
            <option value="safety_violation">Safety Violation</option>
            <option value="other">Other</option>
          </select>
          <select id="incident-severity" style="flex:1;">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div class="form-row" style="margin-top: 8px;">
          <textarea id="incident-description" rows="3" placeholder="What happened?" style="width:100%; background: var(--panel-alt); border: 1px solid var(--grid-line); color: var(--text-primary); font-family: 'Inter', sans-serif; font-size: 13px; padding: 10px 12px; border-radius: 2px;"></textarea>
        </div>
        <button class="btn" id="log-incident-btn" style="margin-top: 10px;">Log Incident</button>
        <div id="incident-message" style="margin-top: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Productivity Metrics</div>
      </div>
      <div class="panel-body">
        <div id="productivity-metrics-wrap" style="margin-bottom: 16px;"><div class="empty-state">Loading&hellip;</div></div>

        <div class="stat-label" style="margin-bottom: 8px;">Log a New Metric</div>
        <div class="form-row">
          <input type="text" id="metric-name" placeholder="Metric name (e.g. Units Produced)" style="flex:2;" />
          <input type="number" id="metric-value" placeholder="Value" style="flex:1;" />
          <input type="text" id="metric-unit" placeholder="Unit (optional)" style="flex:1;" />
        </div>
        <div class="form-row" style="margin-top: 8px;">
          <input type="date" id="metric-date" style="flex:1;" />
          <input type="text" id="metric-notes" placeholder="Notes (optional)" style="flex:2;" />
        </div>
        <button class="btn" id="log-metric-btn" style="margin-top: 10px;">Log Metric</button>
        <div id="metric-message" style="margin-top: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>
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

  let selectedUsername = '';

  fetch('/api/users')
    .then(r => r.json())
    .then(data => {
      const learners = (data.users || []).filter(u => u.role === 'learner');
      const select = document.getElementById('employee-select');
      learners.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.username;
        opt.textContent = u.name || u.username;
        select.appendChild(opt);
      });
    });

  document.getElementById('employee-select').addEventListener('change', (e) => {
    selectedUsername = e.target.value;
    if (!selectedUsername) {
      document.getElementById('performance-content').style.display = 'none';
      return;
    }
    document.getElementById('performance-content').style.display = 'block';
    loadTrainingHistory();
    loadAssessmentHistory();
    loadIncidentReports();
    loadProductivityMetrics();
  });

  function loadTrainingHistory() {
    fetch('/api/courses/employee-training-history/' + encodeURIComponent(selectedUsername))
      .then(r => r.json())
      .then(data => {
        const history = data.history || [];
        const wrap = document.getElementById('training-history-wrap');
        if (history.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No course enrollments on record.</div>';
          return;
        }
        wrap.innerHTML = history.map(h => \`
          <div class="content-block-row" style="align-items:center; cursor:default; margin-bottom:6px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary);">\${escapeHtml(h.courseTitle)}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted);">Enrolled: \${new Date(h.registeredAt).toLocaleDateString()}\${h.completedAt ? ' — Completed: ' + new Date(h.completedAt).toLocaleDateString() : ''}</div>
            </div>
            <div style="font-family:'IBM Plex Mono',monospace; font-size:13px; color:\${h.status === 'completed' ? 'var(--competent)' : 'var(--refresher)'};">\${h.status === 'completed' ? 'Completed' : 'In Progress'}</div>
          </div>
        \`).join('');
      })
      .catch(() => {
        document.getElementById('training-history-wrap').innerHTML = '<div class="empty-state">Could not load training history.</div>';
      });
  }

  function loadAssessmentHistory() {
    fetch('/api/tests/assessment-history/' + encodeURIComponent(selectedUsername))
      .then(r => r.json())
      .then(data => {
        const attempts = data.attempts || [];
        const wrap = document.getElementById('assessment-history-wrap');
        if (attempts.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No assessment attempts on record.</div>';
          return;
        }
        wrap.innerHTML = attempts.map(a => \`
          <div class="content-block-row" style="align-items:center; cursor:default; margin-bottom:6px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary);">Attempt \${a.attemptNumber} — \${a.score}/\${a.maxScore}\${a.passingRatePercent != null ? ' (passing rate ' + a.passingRatePercent + '%)' : ''}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted);">\${new Date(a.submittedAt).toLocaleString()}</div>
            </div>
            <div style="font-family:'IBM Plex Mono',monospace; font-size:13px; color:\${a.passed === true ? 'var(--competent)' : a.passed === false ? 'var(--risk)' : 'var(--text-muted)'};">\${a.passed === true ? 'PASS' : a.passed === false ? 'FAIL' : 'PENDING'}</div>
          </div>
        \`).join('');
      })
      .catch(() => {
        document.getElementById('assessment-history-wrap').innerHTML = '<div class="empty-state">Could not load assessment history.</div>';
      });
  }

  function loadIncidentReports() {
    fetch('/api/incidents/' + encodeURIComponent(selectedUsername))
      .then(r => r.json())
      .then(data => {
        const reports = data.reports || [];
        const wrap = document.getElementById('incident-reports-wrap');
        if (reports.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No incidents on record.</div>';
          return;
        }
        wrap.innerHTML = reports.map(r => \`
          <div class="content-block-row" style="align-items:flex-start; cursor:default; margin-bottom:6px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:2px;">\${escapeHtml(r.incidentType.replace('_',' '))} — \${escapeHtml(r.severity)}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); margin-bottom:4px;">\${new Date(r.incidentDate).toLocaleDateString()} — reported by \${escapeHtml(r.reportedByName)}</div>
              <div style="font-family:'Inter',sans-serif; font-size:13px; color:var(--text-primary);">\${escapeHtml(r.description)}</div>
            </div>
          </div>
        \`).join('');
      })
      .catch(() => {
        document.getElementById('incident-reports-wrap').innerHTML = '<div class="empty-state">Could not load incident reports.</div>';
      });
  }

  function loadProductivityMetrics() {
    fetch('/api/productivity-metrics/' + encodeURIComponent(selectedUsername))
      .then(r => r.json())
      .then(data => {
        const metrics = data.metrics || [];
        const wrap = document.getElementById('productivity-metrics-wrap');
        if (metrics.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No productivity metrics on record.</div>';
          return;
        }
        wrap.innerHTML = metrics.map(m => \`
          <div class="content-block-row" style="align-items:center; cursor:default; margin-bottom:6px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary);">\${escapeHtml(m.metricName)}: \${m.value}\${m.unit ? ' ' + escapeHtml(m.unit) : ''}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted);">\${new Date(m.recordedDate).toLocaleDateString()}\${m.notes ? ' — ' + escapeHtml(m.notes) : ''}</div>
            </div>
          </div>
        \`).join('');
      })
      .catch(() => {
        document.getElementById('productivity-metrics-wrap').innerHTML = '<div class="empty-state">Could not load productivity metrics.</div>';
      });
  }

  document.getElementById('log-incident-btn').addEventListener('click', () => {
    const msgEl = document.getElementById('incident-message');
    const dateVal = document.getElementById('incident-date').value;
    const descVal = document.getElementById('incident-description').value.trim();

    if (!dateVal || !descVal) {
      msgEl.textContent = 'Please provide a date and description.';
      msgEl.style.color = 'var(--risk)';
      return;
    }

    fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: selectedUsername,
        incidentDate: dateVal,
        incidentType: document.getElementById('incident-type').value,
        severity: document.getElementById('incident-severity').value,
        description: descVal
      })
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Failed to log incident');
        return data;
      })
      .then(() => {
        document.getElementById('incident-description').value = '';
        document.getElementById('incident-date').value = '';
        loadIncidentReports();
      })
      .catch((err) => {
        msgEl.textContent = err.message;
        msgEl.style.color = 'var(--risk)';
      });
  });

  document.getElementById('log-metric-btn').addEventListener('click', () => {
    const msgEl = document.getElementById('metric-message');
    const nameVal = document.getElementById('metric-name').value.trim();
    const valueVal = document.getElementById('metric-value').value;
    const dateVal = document.getElementById('metric-date').value;

    if (!nameVal || !valueVal || !dateVal) {
      msgEl.textContent = 'Please provide a metric name, value, and date.';
      msgEl.style.color = 'var(--risk)';
      return;
    }

    fetch('/api/productivity-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: selectedUsername,
        metricName: nameVal,
        value: parseFloat(valueVal),
        unit: document.getElementById('metric-unit').value.trim(),
        recordedDate: dateVal,
        notes: document.getElementById('metric-notes').value.trim()
      })
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Failed to log metric');
        return data;
      })
      .then(() => {
        document.getElementById('metric-name').value = '';
        document.getElementById('metric-value').value = '';
        document.getElementById('metric-unit').value = '';
        document.getElementById('metric-date').value = '';
        document.getElementById('metric-notes').value = '';
        loadProductivityMetrics();
      })
      .catch((err) => {
        msgEl.textContent = err.message;
        msgEl.style.color = 'var(--risk)';
      });
  });
`;

export const employeePerformanceHtml = renderLayout({
  title: 'Employee Performance',
  activePath: '/',
  eyebrowSuffix: 'Employee Performance',
  heading: 'Employee Performance',
  bodyHtml,
  scripts,
});
